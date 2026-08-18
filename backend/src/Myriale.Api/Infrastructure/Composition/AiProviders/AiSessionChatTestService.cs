using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Infrastructure.Composition.AiProviders;

public enum AiSessionChatTestOutcome { Success, NotFound, ValidationFailed, Conflict, CredentialMissing, ProviderFailure }
public sealed record AiSessionChatTestResult(
    AiSessionChatTestOutcome Outcome,
    AiSessionChatTestResponse? Value = null,
    string? ErrorCode = null,
    bool Retryable = false,
    string? RequestId = null);

public sealed class AiSessionChatTestService(
    ApplicationDbContext db,
    IAiProfileCatalog catalog,
    IAiRuntimeCredentialResolver credentials,
    IAiPlaygroundChatTransport transport,
    IScenarioWorldSnapshotQuery worldQuery,
    ScenarioActionEnumerator actionEnumerator,
    ScenarioActionDecisionModelMapper decisionMapper,
    IScenarioRuleResolutionService resolutionService)
{
    private const int HistoryTurnLimit = 20;
    private const int MaxToolRoundsLimit = 5;
    private const int MaxToolCalls = 8;
    private const int MaxToolCallsPerRound = 4;
    private const int MaxPayloadCharacters = 120_000;
    private static readonly JsonSerializerOptions StrictJson = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = false,
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };

    public async Task<AiSessionChatTestResult> ExecuteAsync(
        AccountId ownerId,
        AiProviderProfileId profileId,
        AiSessionChatTestRequest request,
        CancellationToken cancellationToken)
    {
        var validation = Validate(request);
        if (validation is not null) return Invalid(validation);
        var ownsSession = await db.Sessions.AsNoTracking()
            .AnyAsync(item => item.Id == request.SessionId && item.OwnerId == ownerId, cancellationToken);
        if (!ownsSession) return new(AiSessionChatTestOutcome.NotFound, ErrorCode: "session_not_found");

        AiProfileDescriptor profile;
        try { profile = await catalog.ResolveAsync(profileId, cancellationToken); }
        catch (AiProviderException) { return new(AiSessionChatTestOutcome.NotFound, ErrorCode: "profile_not_found"); }
        if (!profile.Enabled || !profile.Selectable) return new(AiSessionChatTestOutcome.NotFound, ErrorCode: "profile_not_found");
        var credential = await credentials.ResolveAsync(profile.CredentialId, cancellationToken);
        if (credential is null) return new(AiSessionChatTestOutcome.CredentialMissing, ErrorCode: "credential_missing");
        if (profile.Revision != request.ExpectedProfileRevision || credential.Revision != request.ExpectedCredentialRevision)
            return Conflict();

        ScenarioRuleWorldSnapshot world;
        try { world = await worldQuery.LoadAsync(request.SessionId, cancellationToken); }
        catch (InvalidOperationException) { return new(AiSessionChatTestOutcome.NotFound, ErrorCode: "session_not_found"); }
        if (world.OwnerId != ownerId) return new(AiSessionChatTestOutcome.NotFound, ErrorCode: "session_not_found");
        var snapshot = actionEnumerator.Enumerate(world, $"PLAYGROUND-{Guid.NewGuid():N}".ToUpperInvariant());
        var selections = SelectionMap(snapshot);
        var systemMarkdown = BuildSystemMarkdown(world, snapshot, profile.SystemPrompt, selections);
        var messages = await LoadHistoryAsync(request.SessionId, systemMarkdown, request.CurrentUserMessage, cancellationToken);
        if (messages.Sum(message => message.Content?.Length ?? 0) > MaxPayloadCharacters)
            return Invalid("payload_too_large");
        var overrides = request.GenerationOverrides is null ? null : new AiGenerationOverrides(
            Temperature: request.GenerationOverrides.Temperature,
            TopP: request.GenerationOverrides.TopP,
            Seed: request.GenerationOverrides.Seed,
            MaxOutputTokens: request.GenerationOverrides.MaximumOutputTokens,
            RetryAttempts: request.GenerationOverrides.RetryAttempts);
        var tool = BuildTool(selections.Keys);
        var previews = new List<AiSessionToolPreviewResponse>();
        var metadata = new List<AiGenerationMetadata>();
        var toolCallCount = 0;

        try
        {
            while (true)
            {
                if (!await FenceMatchesAsync(profile, credential, cancellationToken)) return Conflict();
                var response = await transport.SendAsync(profile, credential.Secret, new(messages, tool, overrides), cancellationToken);
                metadata.Add(response.Metadata);
                if (!await FenceMatchesAsync(profile, credential, cancellationToken)) return Conflict();

                var calls = response.Message.ToolCalls ?? [];
                if (calls.Count == 0)
                {
                    if (string.IsNullOrWhiteSpace(response.Message.Content))
                        return Invalid("empty_assistant_response");
                    var final = ToResponse(response.Message);
                    return new(AiSessionChatTestOutcome.Success,
                        new(final, Aggregate(metadata, profile, toolCallCount), systemMarkdown,
                            messages.Select(ToResponse).ToArray(), previews));
                }
                if (response.Metadata.FinishReason is not (null or "tool_calls"))
                    return Invalid("invalid_tool_finish_reason");
                if (metadata.Count > request.MaxToolRounds)
                    return Invalid("max_tool_rounds_exceeded");
                if (calls.Count > MaxToolCallsPerRound || toolCallCount + calls.Count > MaxToolCalls)
                    return Invalid("tool_call_limit_exceeded");
                if (calls.Select(call => call.Id).Distinct(StringComparer.Ordinal).Count() != calls.Count)
                    return Invalid("duplicate_tool_call_id");

                messages.Add(response.Message);
                foreach (var call in calls)
                {
                    toolCallCount++;
                    var preview = Preview(call, world, snapshot, selections);
                    previews.Add(preview.Audit);
                    messages.Add(new("tool", preview.ToolContent, call.Id));
                }
                if (messages.Sum(message => (message.Content?.Length ?? 0) + (message.ToolCalls?.Sum(call => call.ArgumentsJson.Length) ?? 0)) > MaxPayloadCharacters)
                    return Invalid("payload_too_large");
            }
        }
        catch (AiProviderException exception)
        {
            return new(AiSessionChatTestOutcome.ProviderFailure, ErrorCode: exception.Code,
                Retryable: exception.Retryable, RequestId: exception.Metadata?.ResponseId);
        }
    }

    private (AiSessionToolPreviewResponse Audit, string ToolContent) Preview(
        AiPlaygroundToolCall call,
        ScenarioRuleWorldSnapshot world,
        RuleActionSnapshot snapshot,
        IReadOnlyDictionary<string, RulePublicAction> selections)
    {
        if (!string.Equals(call.Name, "preview_rule_action", StringComparison.Ordinal))
            return Failed(call, "unknown_tool", "", EmptyObject());
        if (call.ArgumentsJson.Length > 16_000) return Failed(call, "tool_arguments_too_large", "", EmptyObject());
        PreviewRuleActionArguments? input;
        try { input = JsonSerializer.Deserialize<PreviewRuleActionArguments>(call.ArgumentsJson, StrictJson); }
        catch (JsonException) { return Failed(call, "invalid_tool_arguments", "", EmptyObject()); }
        if (input is null || string.IsNullOrWhiteSpace(input.SelectionCode) || input.Arguments.ValueKind != JsonValueKind.Object)
            return Failed(call, "invalid_tool_arguments", input?.SelectionCode ?? "", input?.Arguments ?? EmptyObject());
        if (!selections.TryGetValue(input.SelectionCode, out var action) || !action.Enabled)
            return Failed(call, "action_not_available", input.SelectionCode, input.Arguments);
        try
        {
            ScenarioActionArgumentValidator.Validate(action.ArgumentSchema, input.Arguments);
            var decision = decisionMapper.MapResult(snapshot,
                new(ScenarioTurnSchemas.ModelActionDecisionResult, input.SelectionCode, input.Arguments));
            var resolution = resolutionService.Resolve(world, decision, $"PLAYGROUND-{Guid.NewGuid():N}".ToUpperInvariant());
            var postState = resolutionService.ProjectPostState(world, resolution.Plan);
            var objectCode = action.ObjectId == new ScenarioObjectId("system")
                ? "system" : snapshot.Objects.Single(item => item.Id == action.ObjectId).Code;
            var audit = new AiSessionToolPreviewResponse(call.Id, input.SelectionCode, input.Arguments.Clone(), "valid", null,
                objectCode, action.Code, resolution.Plan.AppliedEffects, resolution.Plan.Facts, resolution.Plan.Events,
                resolution.Plan.NarrativeHints, resolution.Plan.ForbiddenNarrativeFacts, resolution.Plan.CompletionIntent,
                resolution.Plan.ExtensionRequest is not null, postState);
            return (audit, JsonSerializer.Serialize(new
            {
                status = "valid",
                authoritative = true,
                selectionCode = input.SelectionCode,
                objectCode,
                actionCode = action.Code,
                appliedEffects = resolution.Plan.AppliedEffects,
                facts = resolution.Plan.Facts,
                events = resolution.Plan.Events,
                narrativeHints = resolution.Plan.NarrativeHints,
                forbiddenNarrativeFacts = resolution.Plan.ForbiddenNarrativeFacts,
                completionIntent = resolution.Plan.CompletionIntent,
                extensionRequested = resolution.Plan.ExtensionRequest is not null,
                postState,
            }, StrictJson));
        }
        catch (ScenarioTurnValidationException exception)
        {
            return Failed(call, exception.Code, input.SelectionCode, input.Arguments);
        }
    }

    private static (AiSessionToolPreviewResponse Audit, string ToolContent) Failed(
        AiPlaygroundToolCall call, string code, string selectionCode, JsonElement arguments)
    {
        var audit = new AiSessionToolPreviewResponse(call.Id, selectionCode, arguments.Clone(), "invalid", code,
            null, null, null, null, null, null, null, null, null, null);
        return (audit, JsonSerializer.Serialize(new { status = "invalid", authoritative = true, errorCode = code }));
    }

    private async Task<List<AiPlaygroundChatMessage>> LoadHistoryAsync(
        SessionId sessionId, string systemMarkdown, string? currentUserMessage, CancellationToken cancellationToken)
    {
        var turns = await db.SessionTurns.AsNoTracking().Include(item => item.PlayerInput)
            .Where(item => item.SessionId == sessionId && item.Kind == SessionTurnKind.Narrative)
            .OrderByDescending(item => item.Position).Take(HistoryTurnLimit).ToListAsync(cancellationToken);
        turns.Reverse();
        var messages = new List<AiPlaygroundChatMessage> { new("system", systemMarkdown) };
        foreach (var turn in turns)
        {
            if (turn.PlayerInput is { Text.Length: > 0 } input) messages.Add(new("user", input.Text));
            if (!string.IsNullOrWhiteSpace(turn.NarrativeBody)) messages.Add(new("assistant", turn.NarrativeBody));
        }
        if (!string.IsNullOrWhiteSpace(currentUserMessage)) messages.Add(new("user", currentUserMessage.Trim()));
        return messages;
    }

    private async Task<bool> FenceMatchesAsync(AiProfileDescriptor profile, ResolvedAiCredential credential, CancellationToken cancellationToken)
    {
        try
        {
            var currentProfile = await catalog.ResolveAsync(profile.Id, cancellationToken);
            var currentCredential = await credentials.ResolveAsync(profile.CredentialId, cancellationToken);
            return currentProfile.Revision == profile.Revision && currentCredential?.Revision == credential.Revision;
        }
        catch (AiProviderException) { return false; }
    }

    private static IReadOnlyDictionary<string, RulePublicAction> SelectionMap(RuleActionSnapshot snapshot)
    {
        var objects = snapshot.Objects.ToDictionary(item => item.Id);
        return snapshot.Actions.Where(item => item.Enabled).ToDictionary(action =>
            action.ObjectId == new ScenarioObjectId("system")
                ? $"system:{action.Code}"
                : $"object:{objects[action.ObjectId].Code}/{action.Code}", action => action, StringComparer.Ordinal);
    }

    private static string BuildSystemMarkdown(
        ScenarioRuleWorldSnapshot world,
        RuleActionSnapshot snapshot,
        string profileInstructions,
        IReadOnlyDictionary<string, RulePublicAction> selections)
    {
        var builder = new StringBuilder();
        builder.AppendLine("# Narrative instructions");
        builder.AppendLine("Continue the scenario as an interactive narrative. Treat all scenario data below as authoritative server context.");
        builder.AppendLine("Before describing any state-changing result, call `preview_rule_action`. The tool output is authoritative; never claim a change rejected by the tool.");
        builder.AppendLine("Do not invent actions, private state, committed effects, or extension results. Ask for clarification or use a non-changing system action when appropriate.");
        if (!string.IsNullOrWhiteSpace(profileInstructions)) builder.AppendLine().AppendLine("## Profile instructions").AppendLine(profileInstructions.Trim());
        builder.AppendLine().AppendLine("# Scenario");
        builder.AppendLine($"- Title: {world.Narrative.Title}");
        builder.AppendLine($"- Summary: {world.Narrative.Summary}");
        builder.AppendLine($"- Genre: {world.Narrative.Genre}");
        builder.AppendLine($"- Tone: {world.Narrative.Tone}");
        builder.AppendLine($"- Lore: {world.Narrative.Lore}");
        builder.AppendLine($"- AI freedom: {world.Narrative.AiFreedom}");
        builder.AppendLine().AppendLine("# Hero and current location");
        builder.AppendLine($"- Hero: {world.Narrative.SelectedHero}");
        builder.AppendLine($"- Location: {snapshot.CurrentLocation.Name} (`{snapshot.CurrentLocation.Code}`)");
        builder.AppendLine($"- Description: {snapshot.CurrentLocation.Description}");
        builder.AppendLine().AppendLine("# Public session state");
        builder.AppendLine($"- Status: {world.SessionStatus.ToWireValue()}");
        builder.AppendLine("- Flags:");
        foreach (var flag in world.SessionFlags.OrderBy(item => item.Key, StringComparer.Ordinal))
            builder.AppendLine($"  - `{flag.Key}`: {flag.Value.ToString().ToLowerInvariant()}");
        if (world.SessionFlags.Count == 0) builder.AppendLine("  - none");
        builder.AppendLine().AppendLine("# Visible objects");
        foreach (var item in snapshot.Objects.OrderBy(item => item.Code, StringComparer.Ordinal))
        {
            var source = world.Objects.Single(objectItem => objectItem.Id == item.Id);
            builder.AppendLine($"## {item.Name} (`{item.Code}`)");
            if (!string.IsNullOrWhiteSpace(source.ProfileMarkdown)) builder.AppendLine(source.ProfileMarkdown.Trim());
            builder.AppendLine("```json").AppendLine(item.State.GetRawText()).AppendLine("```");
        }
        if (snapshot.Objects.Count == 0) builder.AppendLine("- none");
        builder.AppendLine().AppendLine("# Available actions");
        foreach (var selection in selections.OrderBy(item => item.Key, StringComparer.Ordinal))
        {
            var action = selection.Value;
            builder.AppendLine($"## `{selection.Key}` — {action.Label}");
            builder.AppendLine(action.Description);
            builder.AppendLine("Argument schema:").AppendLine("```json").AppendLine(action.ArgumentSchema.GetRawText()).AppendLine("```");
        }
        return builder.ToString().TrimEnd();
    }

    private static JsonElement BuildTool(IEnumerable<string> selectionCodes)
    {
        var codes = new JsonArray(selectionCodes.OrderBy(code => code, StringComparer.Ordinal)
            .Select(code => (JsonNode?)JsonValue.Create(code)).ToArray());
        var tool = new JsonObject
        {
            ["type"] = "function",
            ["function"] = new JsonObject
            {
                ["name"] = "preview_rule_action",
                ["description"] = "Preview one enabled scenario rule action without mutating persisted state.",
                ["strict"] = true,
                ["parameters"] = new JsonObject
                {
                    ["type"] = "object",
                    ["additionalProperties"] = false,
                    ["properties"] = new JsonObject
                    {
                        ["selectionCode"] = new JsonObject { ["type"] = "string", ["enum"] = codes },
                        ["arguments"] = new JsonObject { ["type"] = "object" },
                    },
                    ["required"] = new JsonArray("selectionCode", "arguments"),
                },
            },
        };
        return JsonSerializer.SerializeToElement(tool);
    }

    private static AiSessionChatMetadataResponse Aggregate(
        IReadOnlyList<AiGenerationMetadata> metadata, AiProfileDescriptor profile, int toolCallCount)
    {
        var last = metadata[^1];
        return new(profile.Id, profile.Model, last.ResponseId,
            SumNullable(metadata.Select(item => item.InputTokens)), SumNullable(metadata.Select(item => item.OutputTokens)),
            metadata.Sum(item => item.LatencyMilliseconds), metadata.Sum(item => item.AttemptCount), last.FinishReason,
            metadata.Count, toolCallCount);
    }

    private static int? SumNullable(IEnumerable<int?> values)
    {
        var items = values.ToArray();
        return items.All(item => item is null) ? null : items.Sum(item => item ?? 0);
    }

    private static AiSessionChatMessageResponse ToResponse(AiPlaygroundChatMessage message) =>
        new(message.Role, message.Content, message.ToolCallId,
            message.ToolCalls?.Select(call => new AiSessionChatToolCallResponse(call.Id, call.Name, call.ArgumentsJson)).ToArray());

    private static string? Validate(AiSessionChatTestRequest request)
    {
        if (request.MaxToolRounds is < 0 or > MaxToolRoundsLimit) return "max_tool_rounds_invalid";
        if (request.CurrentUserMessage is { Length: > 4000 }) return "current_user_message_too_large";
        var options = request.GenerationOverrides;
        if (options?.Temperature is < 0 or > 2) return "temperature_invalid";
        if (options?.TopP is <= 0 or > 1) return "top_p_invalid";
        if (options?.MaximumOutputTokens is <= 0 or > 32768) return "maximum_output_tokens_invalid";
        if (options?.RetryAttempts is < 0 or > 5) return "retry_attempts_invalid";
        return null;
    }

    private static AiSessionChatTestResult Invalid(string code) => new(AiSessionChatTestOutcome.ValidationFailed, ErrorCode: code);
    private static AiSessionChatTestResult Conflict() => new(AiSessionChatTestOutcome.Conflict, ErrorCode: "profile_or_credential_revision_changed");
    private static JsonElement EmptyObject() => JsonSerializer.SerializeToElement(new { });

    private sealed record PreviewRuleActionArguments(string SelectionCode, JsonElement Arguments);
}
