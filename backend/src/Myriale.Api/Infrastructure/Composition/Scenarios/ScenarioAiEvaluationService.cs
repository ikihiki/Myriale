using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Infrastructure.Composition.Scenarios;

public sealed class ScenarioAiEvaluationService(ApplicationDbContext db, IAiProfileCatalog profiles, IScenarioTurnAiService ai)
{
    private const int MaxAttemptsPerRun = 300;
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task<ScenarioAiEvaluationRunResponse?> CreateAsync(AccountId userId, bool isAdministrator, ScenarioId scenarioId,
        CreateScenarioAiEvaluationRunRequest input, CancellationToken cancellationToken)
    {
        if (!await CanAccessAsync(userId, isAdministrator, scenarioId, cancellationToken)) return null;
        Validate(input);
        var resolvedProfiles = new List<AiProfileDescriptor>(input.ProfileIds.Count);
        foreach (var profileId in input.ProfileIds.Distinct())
            resolvedProfiles.Add(await profiles.ResolveAsync(profileId, cancellationToken));

        var now = DateTimeOffset.UtcNow;
        var runId = new ScenarioAiEvaluationRunId($"AER-{Guid.NewGuid():N}");
        var configJson = JsonSerializer.Serialize(new
        {
            generationOverrides = input.GenerationOverrides,
            manifest = Element(Normalize(input.Config, "{}")),
        }, Json);
        var run = ScenarioAiEvaluationRun.Create(runId, scenarioId, userId,
            Clean(input.CorpusId, "api-frozen-cases"), Clean(input.CorpusVersion, "1"),
            JsonSerializer.Serialize(resolvedProfiles.Select(item => item.Id), Json), input.Repetitions, configJson, now);
        db.ScenarioAiEvaluationRuns.Add(run);

        var cases = new List<(ScenarioAiEvaluationCase Entity, ScenarioAiEvaluationCaseInput Input)>();
        foreach (var item in input.Cases)
        {
            var requestJson = Normalize(item.Request, "{}");
            var metadataJson = Normalize(item.Metadata, "{}");
            var entity = ScenarioAiEvaluationCase.Create(new($"AEC-{Guid.NewGuid():N}"), runId, item.CaseId.Trim(),
                ParseStage(item.Stage), Hash(requestJson), requestJson, metadataJson);
            run.Cases.Add(entity);
            cases.Add((entity, item));
        }
        await db.SaveChangesAsync(cancellationToken);

        var sequence = 0;
        foreach (var item in cases)
        foreach (var profile in resolvedProfiles)
        for (var repetition = 1; repetition <= input.Repetitions; repetition++)
        {
            sequence++;
            var attempt = ScenarioAiEvaluationAttempt.Create(new($"AEA-{Guid.NewGuid():N}"), item.Entity.Id, profile.Id,
                profile.Revision, profile.Model, repetition, $"B{sequence:0000}", item.Entity.RequestJson, configJson, DateTimeOffset.UtcNow);
            item.Entity.Attempts.Add(attempt);
            await ExecuteAttemptAsync(item.Entity, attempt, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        }

        run.Complete(DateTimeOffset.UtcNow);
        await db.SaveChangesAsync(cancellationToken);
        return Map(run);
    }

    public async Task<IReadOnlyList<ScenarioAiEvaluationRunSummaryResponse>?> ListAsync(AccountId userId, bool isAdministrator,
        ScenarioId scenarioId, CancellationToken cancellationToken)
    {
        if (!await CanAccessAsync(userId, isAdministrator, scenarioId, cancellationToken)) return null;
        var runs = await db.ScenarioAiEvaluationRuns.AsNoTracking().Where(item => item.ScenarioId == scenarioId)
            .Include(item => item.Cases).ThenInclude(item => item.Attempts).ToListAsync(cancellationToken);
        return runs.OrderByDescending(item => item.CreatedAt).Select(MapSummary).ToList();
    }

    public async Task<ScenarioAiEvaluationRunResponse?> GetAsync(AccountId userId, bool isAdministrator, ScenarioId scenarioId,
        ScenarioAiEvaluationRunId runId, CancellationToken cancellationToken)
    {
        if (!await CanAccessAsync(userId, isAdministrator, scenarioId, cancellationToken)) return null;
        var run = await db.ScenarioAiEvaluationRuns.AsNoTracking()
            .Include(item => item.Cases).ThenInclude(item => item.Attempts)
            .SingleOrDefaultAsync(item => item.Id == runId && item.ScenarioId == scenarioId, cancellationToken);
        return run is null ? null : Map(run);
    }

    public async Task<(string ContentType, string FileName, byte[] Content)?> ExportAsync(AccountId userId, bool isAdministrator,
        ScenarioId scenarioId, ScenarioAiEvaluationRunId runId, string format, CancellationToken cancellationToken)
    {
        var run = await GetAsync(userId, isAdministrator, scenarioId, runId, cancellationToken);
        if (run is null) return null;
        if (string.Equals(format, "json", StringComparison.OrdinalIgnoreCase))
            return ("application/json", $"{runId.AsPrimitive()}.json", JsonSerializer.SerializeToUtf8Bytes(run, Json));
        if (!string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
            throw new ScenarioAiEvaluationValidationException("unsupported_export_format");
        var csv = new StringBuilder("runId,caseId,stage,profileId,profileRevision,model,repetition,blindCode,status,passed,errorCode,labels,inputTokens,outputTokens,latencyMilliseconds\n");
        foreach (var testCase in run.Cases)
        foreach (var attempt in testCase.Attempts)
            csv.AppendLine(string.Join(',', new[]
            {
                Csv(run.Summary.Id.AsPrimitive()), Csv(testCase.CaseId), Csv(testCase.Stage), Csv(attempt.ProfileId.AsPrimitive()),
                attempt.ProfileRevision.ToString(CultureInfo.InvariantCulture), Csv(attempt.Model), attempt.Repetition.ToString(CultureInfo.InvariantCulture),
                Csv(attempt.BlindCode), Csv(attempt.Status), attempt.Passed ? "true" : "false", Csv(attempt.ErrorCode),
                Csv(string.Join('|', attempt.Labels)), attempt.InputTokens?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
                attempt.OutputTokens?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
                attempt.LatencyMilliseconds?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
            }));
        return ("text/csv; charset=utf-8", $"{runId.AsPrimitive()}.csv", Encoding.UTF8.GetBytes(csv.ToString()));
    }

    public async Task<ScenarioAiEvaluationCorpusManifestResponse?> GetCorpusManifestAsync(AccountId userId, bool isAdministrator,
        ScenarioId scenarioId, CancellationToken cancellationToken)
    {
        if (!await CanAccessAsync(userId, isAdministrator, scenarioId, cancellationToken)) return null;
        var assembly = typeof(ScenarioAiEvaluationService).Assembly;
        var resource = assembly.GetManifestResourceNames().Single(name => name.EndsWith("ai-evaluation-corpus.v1.json", StringComparison.Ordinal));
        using var stream = assembly.GetManifestResourceStream(resource) ?? throw new InvalidOperationException("Evaluation corpus manifest is missing.");
        return JsonSerializer.Deserialize<ScenarioAiEvaluationCorpusManifestResponse>(stream, Json)
            ?? throw new InvalidOperationException("Evaluation corpus manifest is invalid.");
    }

    private async Task ExecuteAttemptAsync(ScenarioAiEvaluationCase testCase, ScenarioAiEvaluationAttempt attempt, CancellationToken ct)
    {
        try
        {
            switch (testCase.Stage)
            {
                case ScenarioAiEvaluationStage.Action:
                {
                    var request = Deserialize<ModelActionDecisionRequest>(testCase.RequestJson);
                    var generation = await ai.DecideActionForProfileAsync(attempt.ProfileId, request, ct);
                    var score = ScoreAction(generation.Value, testCase.MetadataJson);
                    Complete(attempt, generation, score);
                    break;
                }
                case ScenarioAiEvaluationStage.Narrative:
                {
                    var request = Deserialize<PostStateNarrativeRequest>(testCase.RequestJson);
                    var generation = await ai.GeneratePostStateNarrativeForProfileAsync(attempt.ProfileId, request, ct);
                    var score = ScoreNarrative(generation.Value, request, testCase.MetadataJson);
                    Complete(attempt, generation, score);
                    break;
                }
                case ScenarioAiEvaluationStage.EntityState:
                {
                    var request = Deserialize<EntityStateTransitionRequest>(testCase.RequestJson);
                    var generation = await ai.GenerateEntityStateTransitionForProfileAsync(attempt.ProfileId, request, ct);
                    var score = ScoreState(generation.Value, request, testCase.MetadataJson);
                    Complete(attempt, generation, score);
                    break;
                }
            }
        }
        catch (Exception exception) when (exception is AiProviderException or ScenarioTurnValidationException or JsonException or NotSupportedException)
        {
            var code = exception switch
            {
                AiProviderException provider => provider.Code,
                ScenarioTurnValidationException validation => validation.Code,
                JsonException => "invalid_frozen_payload",
                _ => "stage_not_supported",
            };
            attempt.Fail(code, JsonSerializer.Serialize(new[] { code }, Json), "{}", DateTimeOffset.UtcNow);
        }
    }

    private static void Complete<T>(ScenarioAiEvaluationAttempt attempt, NarrativeGeneration<T> generation, Score score)
    {
        attempt.Succeed(score.Passed, JsonSerializer.Serialize(score.Labels, Json), JsonSerializer.Serialize(generation.Value, Json),
            JsonSerializer.Serialize(generation.Metadata, Json), generation.SentPrompt, generation.ReceivedResult,
            generation.Metadata.InputTokens, generation.Metadata.OutputTokens, generation.Metadata.LatencyMilliseconds, DateTimeOffset.UtcNow);
    }

    private static Score ScoreAction(ModelActionDecisionResult output, string metadataJson)
    {
        using var metadata = JsonDocument.Parse(metadataJson);
        var labels = new List<string>();
        var schema = output.SchemaVersion == ScenarioTurnSchemas.ModelActionDecisionResult;
        Add(labels, schema, "schema_valid", "schema_invalid");
        var expectedSelection = RequiredString(metadata.RootElement, "expectedSelectionCode");
        var selection = string.Equals(output.SelectionCode, expectedSelection, StringComparison.Ordinal);
        Add(labels, selection, "selection_exact", "selection_mismatch");
        var expectedArguments = metadata.RootElement.TryGetProperty("expectedArguments", out var arguments) ? arguments : EmptyObject();
        var args = JsonElement.DeepEquals(output.Arguments, expectedArguments);
        Add(labels, args, "arguments_exact", "arguments_mismatch");
        return new(schema && selection && args, labels);
    }

    private static Score ScoreNarrative(PostStateNarrativeResult output, PostStateNarrativeRequest request, string metadataJson)
    {
        var labels = new List<string>();
        var valid = true;
        try { ScenarioNarrativeGenerationService.Validate(output, request.ForbiddenNarrativeFacts, request.RecentTurns); labels.Add("runtime_validator_passed"); }
        catch (ScenarioTurnValidationException exception) { labels.Add($"runtime_validator:{exception.Code}"); valid = false; }
        using var metadata = JsonDocument.Parse(metadataJson);
        foreach (var term in Strings(metadata.RootElement, "requiredTerms"))
        {
            var present = output.Body.Contains(term, StringComparison.OrdinalIgnoreCase);
            Add(labels, present, $"required_term:{term}", $"missing_required_term:{term}"); valid &= present;
        }
        foreach (var property in new[] { "forbiddenTerms", "forbiddenInternalStateTerms", "forbiddenPlayerAgencyTerms" })
        foreach (var term in Strings(metadata.RootElement, property))
        {
            var absent = !output.Body.Contains(term, StringComparison.OrdinalIgnoreCase);
            Add(labels, absent, $"absent:{term}", $"forbidden_term:{term}"); valid &= absent;
        }
        return new(valid, labels);
    }

    private static Score ScoreState(EntityStateTransitionResult output, EntityStateTransitionRequest request, string metadataJson)
    {
        var labels = new List<string>();
        var valid = output.SchemaVersion == ScenarioTurnSchemas.EntityStateTransition;
        Add(labels, valid, "schema_version_valid", "schema_version_invalid");
        var entity = string.Equals(output.EntityCode, request.EntityCode, StringComparison.Ordinal);
        Add(labels, entity, "entity_exact", "entity_mismatch"); valid &= entity;
        var revision = output.ExpectedRevision == request.ExpectedRevision;
        Add(labels, revision, "revision_exact", "revision_mismatch"); valid &= revision;
        using var metadata = JsonDocument.Parse(metadataJson);
        var allowed = Strings(metadata.RootElement, "allowedNextStateFields").ToHashSet(StringComparer.Ordinal);
        if (allowed.Count > 0 && output.NextAiState.ValueKind == JsonValueKind.Object)
        {
            var fields = output.NextAiState.EnumerateObject().Select(item => item.Name).ToList();
            var allowedOnly = fields.All(allowed.Contains);
            Add(labels, allowedOnly, "allowed_fields_only", "unexpected_state_field"); valid &= allowedOnly;
        }
        if (metadata.RootElement.TryGetProperty("expectedNextState", out var expected) && expected.ValueKind == JsonValueKind.Object)
        foreach (var property in expected.EnumerateObject())
        {
            var matches = output.NextAiState.ValueKind == JsonValueKind.Object
                && output.NextAiState.TryGetProperty(property.Name, out var actual) && JsonElement.DeepEquals(actual, property.Value);
            Add(labels, matches, $"expected_field:{property.Name}", $"expected_field_mismatch:{property.Name}"); valid &= matches;
        }
        var schemaValid = ValidateJsonSchemaProperties(request.AiStateSchema, output.NextAiState);
        Add(labels, schemaValid, "state_schema_valid", "state_schema_invalid"); valid &= schemaValid;
        return new(valid, labels);
    }

    private static bool ValidateJsonSchemaProperties(JsonElement schema, JsonElement value)
    {
        if (value.ValueKind != JsonValueKind.Object || schema.ValueKind != JsonValueKind.Object) return false;
        if (!schema.TryGetProperty("properties", out var properties) || properties.ValueKind != JsonValueKind.Object) return true;
        foreach (var property in value.EnumerateObject())
        {
            if (!properties.TryGetProperty(property.Name, out var propertySchema)) return false;
            if (propertySchema.TryGetProperty("type", out var type) && type.ValueKind == JsonValueKind.String
                && !MatchesType(property.Value, type.GetString())) return false;
        }
        return true;
    }

    private static bool MatchesType(JsonElement value, string? type) => type switch
    {
        "string" => value.ValueKind == JsonValueKind.String,
        "boolean" => value.ValueKind is JsonValueKind.True or JsonValueKind.False,
        "integer" => value.ValueKind == JsonValueKind.Number && value.TryGetInt64(out _),
        "number" => value.ValueKind == JsonValueKind.Number,
        "object" => value.ValueKind == JsonValueKind.Object,
        "array" => value.ValueKind == JsonValueKind.Array,
        _ => true,
    };

    private Task<bool> CanAccessAsync(AccountId userId, bool isAdministrator, ScenarioId scenarioId, CancellationToken ct) =>
        db.Scenarios.AsNoTracking().AnyAsync(item => item.Id == scenarioId && (isAdministrator || item.AuthorId == userId), ct);

    private static void Validate(CreateScenarioAiEvaluationRunRequest input)
    {
        if (input.ProfileIds.Count == 0 || input.ProfileIds.Any(id => string.IsNullOrWhiteSpace(id.AsPrimitive())))
            throw new ScenarioAiEvaluationValidationException("profile_ids_required");
        if (input.ProfileIds.Distinct().Count() != input.ProfileIds.Count)
            throw new ScenarioAiEvaluationValidationException("duplicate_profile_ids");
        if (input.Repetitions is < 1 or > 10) throw new ScenarioAiEvaluationValidationException("invalid_repetitions");
        if (input.Cases.Count == 0) throw new ScenarioAiEvaluationValidationException("cases_required");
        if (input.Cases.Count * input.ProfileIds.Count * input.Repetitions > MaxAttemptsPerRun)
            throw new ScenarioAiEvaluationValidationException("evaluation_run_too_large");
        if (input.Cases.Any(item => string.IsNullOrWhiteSpace(item.CaseId)))
            throw new ScenarioAiEvaluationValidationException("case_id_required");
        if (input.Cases.Select(item => item.CaseId.Trim()).Distinct(StringComparer.Ordinal).Count() != input.Cases.Count)
            throw new ScenarioAiEvaluationValidationException("duplicate_case_ids");
        foreach (var item in input.Cases) _ = ParseStage(item.Stage);
    }

    private static ScenarioAiEvaluationStage ParseStage(string value) => value.Trim().ToLowerInvariant() switch
    {
        "action" => ScenarioAiEvaluationStage.Action,
        "narrative" => ScenarioAiEvaluationStage.Narrative,
        "entitystate" or "entity-state" or "state" => ScenarioAiEvaluationStage.EntityState,
        _ => throw new ScenarioAiEvaluationValidationException("invalid_evaluation_stage"),
    };

    private static ScenarioAiEvaluationRunResponse Map(ScenarioAiEvaluationRun run) => new(
        MapSummary(run), Element(run.ConfigJson), run.Cases.OrderBy(item => item.CaseKey, StringComparer.Ordinal).Select(item => new ScenarioAiEvaluationCaseResponse(
            item.Id, item.CaseKey, Stage(item.Stage), item.CanonicalPayloadHash, Element(item.RequestJson), Element(item.MetadataJson),
            item.Attempts.OrderBy(attempt => attempt.ProfileId.AsPrimitive(), StringComparer.Ordinal).ThenBy(attempt => attempt.Repetition)
                .Select(attempt => new ScenarioAiEvaluationAttemptResponse(attempt.Id, attempt.ProfileId, attempt.ProfileRevision, attempt.Model,
                    attempt.Repetition, attempt.BlindCode, attempt.Status.ToString().ToLowerInvariant(), attempt.Passed,
                    JsonSerializer.Deserialize<List<string>>(attempt.LabelsJson, Json) ?? [], Element(attempt.OutputJson), Element(attempt.MetadataJson),
                    attempt.ErrorCode, attempt.InputTokens, attempt.OutputTokens, attempt.LatencyMilliseconds, attempt.StartedAt, attempt.CompletedAt)).ToList())).ToList());

    private static ScenarioAiEvaluationRunSummaryResponse MapSummary(ScenarioAiEvaluationRun run)
    {
        var attempts = run.Cases.SelectMany(item => item.Attempts).ToList();
        return new(run.Id, run.ScenarioId, run.Status.ToString().ToLowerInvariant(), run.CorpusKey, run.CorpusVersion,
            JsonSerializer.Deserialize<List<AiProviderProfileId>>(run.ProfileIdsJson, Json) ?? [], run.Repetitions, run.Cases.Count,
            attempts.Count, attempts.Count(item => item.Passed), run.CreatedAt, run.CompletedAt);
    }

    private static string Stage(ScenarioAiEvaluationStage stage) => stage switch
    {
        ScenarioAiEvaluationStage.Action => "action",
        ScenarioAiEvaluationStage.Narrative => "narrative",
        _ => "entityState",
    };

    private static T Deserialize<T>(string json) => JsonSerializer.Deserialize<T>(json, Json) ?? throw new JsonException("Frozen payload was empty.");
    private static JsonElement Element(string json) => JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json).RootElement.Clone();
    private static JsonElement EmptyObject() => JsonDocument.Parse("{}").RootElement.Clone();
    private static string Normalize(JsonElement value, string fallback) => value.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null ? fallback : value.GetRawText();
    private static string Clean(string? value, string fallback) => string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
    private static string RequiredString(JsonElement metadata, string name) => metadata.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
        ? value.GetString() ?? string.Empty : throw new JsonException($"Metadata property '{name}' is required.");
    private static IEnumerable<string> Strings(JsonElement metadata, string name) => metadata.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.Array
        ? value.EnumerateArray().Where(item => item.ValueKind == JsonValueKind.String).Select(item => item.GetString()!).Where(item => !string.IsNullOrWhiteSpace(item)) : [];
    private static void Add(ICollection<string> labels, bool passed, string success, string failure) => labels.Add(passed ? success : failure);
    private static string Csv(string? value) => $"\"{(value ?? string.Empty).Replace("\"", "\"\"")}\"";
    private sealed record Score(bool Passed, IReadOnlyList<string> Labels);
}

public sealed class ScenarioAiEvaluationValidationException(string code) : Exception(code)
{
    public string Code { get; } = code;
}
