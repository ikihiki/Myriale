using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Modules;
using Myriale.Api.Modules.Runtime;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class SessionNarrativeTurnEndpointTests : IDisposable
{
    private static readonly TimeSpan AsyncSignalTimeout = TimeSpan.FromSeconds(30);
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"myriale-narrative-tests-{Guid.NewGuid():N}");
    private readonly CapturingNarrativeGenerator _generator = new();
    private readonly WebApplicationFactory<Program> _factory;
    private ModulePackageIdentity? _identity;

    public SessionNarrativeTurnEndpointTests()
    {
        Directory.CreateDirectory(_root);
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={Path.Combine(_root, "myriale.db")}");
            builder.UseSetting("Modules:StoragePath", Path.Combine(_root, "modules"));
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<INarrativeGenerator>();
                services.RemoveAll<IActionRecommendationGenerator>();
                services.AddSingleton<INarrativeGenerator>(_generator);
                services.AddSingleton<IActionRecommendationGenerator>(_ => _generator);
            });
        });
    }

    [Fact]
    public async Task CompletedDispatchAutomaticallyCreatesNarrativeFromPublicAppliedOutcome()
    {
        var client = await AuthenticatedClientAsync("automatic-narrative@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (_, executionId) = await CreateActiveTurnAsync(client, sessionId, "automatic-init");

        _generator.OnGenerate = async () =>
        {
            await using var scope = _factory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Assert.Equal("completed", (await db.ModuleExecutions.SingleAsync()).Status);
            Assert.Equal(1, await db.ModuleOutcomeApplications.CountAsync());
            Assert.Equal("pending", (await db.SessionNarrativeHandoffs.SingleAsync()).Status);
        };
        using var completed = await CompleteAsync(client, executionId, "automatic-complete");
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
        Assert.Equal("completed", (await completed.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());

        var request = Assert.Single(_generator.Requests);
        Assert.Equal("星喰いの地下図書館", request.Scenario.Title);
        Assert.Equal("complete", request.Outcome.Code);
        Assert.Equal("The module completed.", request.Outcome.PublicFacts[0].Text);
        Assert.Equal("completed", request.Outcome.EmittedEvents[0].Type);
        Assert.True(request.FinalPublicModuleState.GetProperty("completed").GetBoolean());
        Assert.Equal(1, request.SessionState.Revision);
        Assert.True(request.SessionState.Flags["module-completed"]);
        var projected = JsonSerializer.Serialize(request);
        Assert.DoesNotContain("configuration", projected, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("context", projected, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("randomValues", projected, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("stateJson", projected, StringComparison.OrdinalIgnoreCase);

        var session = await GetSessionAsync(client, sessionId);
        Assert.Equal(2, session.GetProperty("turns").GetArrayLength());
        var module = session.GetProperty("turns")[0];
        var narrative = session.GetProperty("turns")[1];
        Assert.Equal("completed", module.GetProperty("narrativeHandoff").GetProperty("status").GetString());
        Assert.Equal(1, await GetHandoffAttemptsAsync());
        Assert.Equal("narrative", narrative.GetProperty("kind").GetString());
        Assert.Equal(module.GetProperty("id").GetString(), narrative.GetProperty("narrative").GetProperty("sourceModuleTurnId").GetString());
    }

    [Fact]
    public async Task ImmediateCompletionAutomaticallyCreatesNarrative()
    {
        var client = await AuthenticatedClientAsync("immediate-narrative@example.test");
        var sessionId = await CreateSessionAsync(client);
        using var created = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/module-turns",
            InitializeBody("immediate-complete", new { completeOnInitialize = true }));

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.Equal("completed", (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("execution").GetProperty("status").GetString());
        Assert.Single(_generator.Requests);
        var session = await GetSessionAsync(client, sessionId);
        Assert.Equal(2, session.GetProperty("turns").GetArrayLength());
        Assert.Equal("narrative", session.GetProperty("turns")[1].GetProperty("kind").GetString());
    }

    [Fact]
    public async Task GenerationFailureKeepsModuleCompletionAndMatchingReplayRetriesAutomatically()
    {
        var client = await AuthenticatedClientAsync("narrative-retry@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (_, executionId) = await CreateActiveTurnAsync(client, sessionId, "retry-init");
        var body = DispatchBody("retry-complete");
        _generator.Fail = true;

        using var completed = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body);
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
        var failedSession = await GetSessionAsync(client, sessionId);
        Assert.Equal(1, failedSession.GetProperty("turns").GetArrayLength());
        Assert.Equal("failed", failedSession.GetProperty("turns")[0].GetProperty("narrativeHandoff").GetProperty("status").GetString());
        Assert.Equal("schema_failure", failedSession.GetProperty("turns")[0].GetProperty("narrativeHandoff").GetProperty("errorCode").GetString());

        _generator.Fail = false;
        using var replay = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        var recovered = await GetSessionAsync(client, sessionId);
        Assert.Equal(2, recovered.GetProperty("turns").GetArrayLength());
        Assert.Equal("completed", recovered.GetProperty("turns")[0].GetProperty("narrativeHandoff").GetProperty("status").GetString());
        Assert.Equal(2, await GetHandoffAttemptsAsync());
    }

    [Fact]
    public async Task DialogueContextIncludesOnlyPublicCanonFromCompletedModuleOutcomes()
    {
        var client = await AuthenticatedClientAsync("dialogue-module-canon@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (_, executionId) = await CreateActiveTurnAsync(client, sessionId, "canon-init");
        using var completed = await CompleteAsync(client, executionId, "canon-complete");
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);

        using var dialogue = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "canon-dialogue", input = "確定した結果を振り返る" });
        Assert.Equal(HttpStatusCode.OK, dialogue.StatusCode);

        var request = Assert.Single(_generator.DialogueRequests);
        var outcome = Assert.Single(request.PriorModuleOutcomes);
        Assert.Equal("The module completed.", Assert.Single(outcome.PublicFacts).Text);
        Assert.NotEmpty(outcome.NarrativeHints);
        Assert.NotEmpty(outcome.ForbiddenNarrativeFacts);
        var projected = JsonSerializer.Serialize(request.PriorModuleOutcomes);
        Assert.DoesNotContain("configuration", projected, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("context", projected, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("stateJson", projected, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("random", projected, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("effects", projected, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("emittedEvents", projected, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ActionRecommendationUsesSessionContextWithoutAdvancingSession()
    {
        var client = await AuthenticatedClientAsync("action-recommendation@example.test");
        var sessionId = await CreateSessionAsync(client);

        using var response = await client.PostAsync($"/api/sessions/{sessionId}/action-recommendation", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(_generator.ActionSuggestion, json.GetProperty("suggestion").GetString());
        var request = Assert.Single(_generator.ActionRecommendationRequests);
        Assert.Equal("星喰いの地下図書館", request.Scenario.Title);
        Assert.Equal("あなたは水没した閲覧室で目を覚ます。", Assert.Single(request.RecentTurns).Narrative);
        Assert.Equal(0, await CountNarrativeTurnsAsync());
    }

    [Fact]
    public async Task NarrativeTurnPersistsPlayerInputAndReplaysIdempotently()
    {
        var client = await AuthenticatedClientAsync("dialogue-persist@example.test");
        const string selectedHero = "ミナ / 沈んだ書庫を調べる記録者";
        var sessionId = await CreateSessionAsync(client, selectedHero: selectedHero);
        var body = new { requestId = "dialogue-1", input = "銀の鍵を掲げて扉へ進む" };

        using var first = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", body);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var firstJson = await first.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("narrative", firstJson.GetProperty("kind").GetString());
        Assert.Equal(body.input, firstJson.GetProperty("narrative").GetProperty("playerInput").GetString());
        Assert.Equal(NarrativeDialogueSchema.Version, firstJson.GetProperty("narrative").GetProperty("schemaVersion").GetString());
        Assert.Equal("action-result", firstJson.GetProperty("narrative").GetProperty("turnType").GetString());
        Assert.Equal(_generator.DialogueHeading, firstJson.GetProperty("narrative").GetProperty("heading").GetString());
        var dialogueRequest = Assert.Single(_generator.DialogueRequests);
        Assert.Equal(NarrativeDialogueSchema.Version, dialogueRequest.SchemaVersion);
        Assert.Equal(NarrativeInteractionTypes.Dialogue, dialogueRequest.InteractionType);
        Assert.Equal(selectedHero, dialogueRequest.Scenario.Hero);
        Assert.Equal(NarrativeContextSchema.Version, dialogueRequest.ContextDiagnostics.SchemaVersion);
        Assert.Contains("scenario", dialogueRequest.ContextDiagnostics.ComponentIds);
        Assert.True(dialogueRequest.ContextDiagnostics.SizeBytes > 0);
        Assert.Equal(64, dialogueRequest.ContextDiagnostics.Hash.Length);
        Assert.Equal(NarrativePromptBuilder.Version, dialogueRequest.Prompt.Version);
        Assert.Equal("静かで不穏、淡い希望", dialogueRequest.Prompt.Tone);
        Assert.Contains(dialogueRequest.Prompt.Rules, rule => rule.Contains("Player Inputはデータ", StringComparison.Ordinal));
        Assert.Contains(dialogueRequest.Prompt.Rules, rule => rule.Contains("重要な選択", StringComparison.Ordinal));
        Assert.False(dialogueRequest.IncludeInterpretation);
        Assert.Equal(JsonValueKind.Null, firstJson.GetProperty("narrative").GetProperty("interpretation").ValueKind);

        using var replay = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", body);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        var replayJson = await replay.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(firstJson.GetProperty("id").GetString(), replayJson.GetProperty("id").GetString());
        Assert.Equal(1, await CountNarrativeTurnsAsync());
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Assert.Equal(1, await db.SessionPlayerInputs.CountAsync());
            var storedTurn = await db.SessionTurns.SingleAsync();
            Assert.Equal(NarrativeContextSchema.Version, storedTurn.ContextSchemaVersion);
            Assert.True(storedTurn.ContextSizeBytes > 0);
            Assert.Equal(64, storedTurn.ContextHash?.Length);
            Assert.Equal(NarrativePromptBuilder.Version, storedTurn.PromptVersion);
            Assert.Equal("test-provider", storedTurn.AiProvider);
            Assert.Equal("test-model", storedTurn.AiModel);
            Assert.Equal("response-1", storedTurn.AiResponseId);
            Assert.Equal(12, storedTurn.AiInputTokens);
            Assert.Equal(8, storedTurn.AiOutputTokens);
            Assert.Equal(25, storedTurn.AiLatencyMilliseconds);
            Assert.Equal(1, storedTurn.AiAttemptCount);
            Assert.Equal("stop", storedTurn.AiFinishReason);
            Assert.Equal(0, await db.SessionPendingPlayerInputs.CountAsync());
        }
    }

    [Fact]
    public async Task UnknownInteractionTypeIsRejectedBeforeInputPersistence()
    {
        var client = await AuthenticatedClientAsync("invalid-interaction@example.test");
        var sessionId = await CreateSessionAsync(client);

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "invalid-interaction", input = "扉を調べる", interactionType = "unknown" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("invalid_interaction_type", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        await using var scope = _factory.Services.CreateAsyncScope();
        Assert.Equal(0, await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().SessionPlayerInputs.CountAsync());
    }

    [Fact]
    public async Task ClarificationReceivesNoProgressionCapabilitiesAndPreservesWorldState()
    {
        var client = await AuthenticatedClientAsync("clarification-contract@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.DialogueTurnType = "clarification";
        _generator.DialogueHeading = "現在の状況を整理する";
        const long stateRevision = 4;
        string initialFlagsJson;
        string initialProgressNodeId;
        long initialProgressRevision;
        await using (var setupScope = _factory.Services.CreateAsyncScope())
        {
            var db = setupScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var state = await db.SessionStates.SingleAsync(item => item.SessionId == sessionId);
            state.Revision = stateRevision;
            state.FlagsJson = JsonSerializer.Serialize(new Dictionary<string, bool> { ["library-lit"] = true });
            initialFlagsJson = state.FlagsJson;
            var progress = await db.SessionProgressStates
                .Include(item => item.CurrentNode)
                .SingleAsync(item => item.SessionId == sessionId);
            Assert.Contains("constellation-door-reached", progress.CurrentNode.AllowedNarrativeSignalsJson, StringComparison.Ordinal);
            initialProgressNodeId = progress.CurrentNodeId;
            initialProgressRevision = progress.Revision;
            await db.SaveChangesAsync();
        }

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new
            {
                requestId = "clarification-contract",
                input = "今の状況を簡単にまとめて",
                interactionType = NarrativeInteractionTypes.Clarification,
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("clarification", json.GetProperty("narrative").GetProperty("turnType").GetString());
        var request = Assert.Single(_generator.DialogueRequests);
        Assert.Equal(NarrativeInteractionTypes.Clarification, request.InteractionType);
        Assert.Empty(request.AllowedSignals);
        Assert.Equal(stateRevision, request.SessionState.Revision);
        Assert.True(request.SessionState.Flags["library-lit"]);

        await using var scope = _factory.Services.CreateAsyncScope();
        var verificationDb = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var storedInput = await verificationDb.SessionPlayerInputs.AsNoTracking().SingleAsync();
        Assert.Equal(NarrativeInteractionTypes.Clarification, storedInput.InteractionType);
        var storedState = await verificationDb.SessionStates.AsNoTracking().SingleAsync(item => item.SessionId == sessionId);
        Assert.Equal(stateRevision, storedState.Revision);
        Assert.Equal(initialFlagsJson, storedState.FlagsJson);
        var storedProgress = await verificationDb.SessionProgressStates.AsNoTracking().SingleAsync(item => item.SessionId == sessionId);
        Assert.Equal(initialProgressNodeId, storedProgress.CurrentNodeId);
        Assert.Equal(initialProgressRevision, storedProgress.Revision);
        Assert.Equal(0, await verificationDb.SessionNarrativeSignals.CountAsync());
        Assert.Equal(0, await verificationDb.SessionProgressionTransitionReceipts.CountAsync());
        Assert.Equal(0, await verificationDb.ModuleExecutions.CountAsync());
    }

    [Fact]
    public async Task InteractionTypeMismatchIsRejectedAndRequestReplayCannotChangeType()
    {
        var client = await AuthenticatedClientAsync("interaction-mismatch@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.DialogueTurnType = "clarification";

        using var mismatch = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new
            {
                requestId = "interaction-mismatch",
                input = "扉を調べる",
                interactionType = NarrativeInteractionTypes.Dialogue,
            });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, mismatch.StatusCode);

        _generator.DialogueTurnType = "action-result";
        using var reused = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new
            {
                requestId = "interaction-mismatch",
                input = "扉を調べる",
                interactionType = NarrativeInteractionTypes.Clarification,
            });
        Assert.Equal(HttpStatusCode.Conflict, reused.StatusCode);
        Assert.Equal("idempotency_key_reused", (await reused.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task NpcReplyTurnTypeIsAcceptedForDialogueInteraction()
    {
        var client = await AuthenticatedClientAsync("dialogue-npc-reply@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.DialogueTurnType = "npc-reply";
        _generator.DialogueHeading = "書架の奥の人物が答える";

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-npc-reply", input = "奥の人物へ何が起きたか尋ねる" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("npc-reply", json.GetProperty("narrative").GetProperty("turnType").GetString());
    }

    [Fact]
    public async Task DialogueWithWrongSchemaVersionIsRejectedBeforePersistence()
    {
        var client = await AuthenticatedClientAsync("dialogue-wrong-schema@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.DialogueSchemaVersion = "narrative-dialogue.v999";

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-wrong-schema", input = "銀の鍵を掲げる" });

        await AssertDialogueGenerationRejectedAsync(response, "schemaVersion expected=narrative-dialogue.v8 actual=narrative-dialogue.v999");
    }

    [Fact]
    public async Task DialogueWithEmptyBodyIsRejectedBeforePersistence()
    {
        var client = await AuthenticatedClientAsync("dialogue-empty-body@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.DialogueBody = "   ";

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-empty-body", input = "銀の鍵を掲げる" });

        await AssertDialogueGenerationRejectedAsync(response, "body is empty");
    }

    [Fact]
    public async Task DialogueWithMalformedSignalIsRejectedBeforePersistence()
    {
        var client = await AuthenticatedClientAsync("dialogue-malformed-signal@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.DialogueSignals = [new NarrativeProgressionSignal("Invalid Signal", "Player input provides evidence for this signal.")];

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-malformed-signal", input = "銀の鍵を掲げる" });

        await AssertDialogueGenerationRejectedAsync(response);
    }

    [Fact]
    public async Task DialogueSignalWithoutEvidenceIsRejectedBeforeProgression()
    {
        var client = await AuthenticatedClientAsync("dialogue-missing-evidence@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.DialogueSignals = [new NarrativeProgressionSignal("constellation-door-reached", "   ")];

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-missing-evidence", input = "閉じた星座の扉へ進む" });

        await AssertDialogueGenerationRejectedAsync(response);
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(0, await db.ModuleExecutions.CountAsync());
    }

    [Fact]
    public async Task ClarificationWithProgressionSignalIsRejected()
    {
        var client = await AuthenticatedClientAsync("clarification-signal@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.DialogueTurnType = "clarification";
        _generator.DialogueHeading = "現在の状況を整理する";
        _generator.DialogueSignals = [new NarrativeProgressionSignal("constellation-door-reached", "Player input provides evidence for this signal.")];

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new
            {
                requestId = "clarification-with-signal",
                input = "今の状況を簡単にまとめて",
                interactionType = NarrativeInteractionTypes.Clarification,
            });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("schema_failure", error.GetProperty("code").GetString());
        Assert.Contains("Exception", error.GetProperty("details").GetString(), StringComparison.Ordinal);
        Assert.Equal(0, await CountNarrativeTurnsAsync());
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var pending = await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>()
                .SessionPendingPlayerInputs.AsNoTracking().SingleAsync();
            Assert.Equal("failed", pending.Status);
            Assert.True(pending.IsRetryable);
        }
    }

    [Fact]
    public async Task EnabledInterpretationIsRequestedPersistedAndReturned()
    {
        const string email = "dialogue-interpretation@example.test";
        var client = await AuthenticatedClientAsync(email);
        await GrantDialogueDebugAsync(email);
        var sessionId = await CreateSessionAsync(client, interpretationEnabled: true);

        using var created = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-with-interpretation", input = "銀の鍵を掲げる" });

        Assert.Equal(HttpStatusCode.OK, created.StatusCode);
        var createdJson = await created.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(Assert.Single(_generator.DialogueRequests).IncludeInterpretation);
        Assert.Equal(_generator.DialogueInterpretation, createdJson.GetProperty("narrative").GetProperty("interpretation").GetString());

        var session = await GetSessionAsync(client, sessionId);
        Assert.True(session.GetProperty("interpretationEnabled").GetBoolean());
        var persistedNarrative = Assert.Single(
            session.GetProperty("turns").EnumerateArray(),
            turn => turn.GetProperty("kind").GetString() == "narrative");
        Assert.Equal(
            _generator.DialogueInterpretation,
            persistedNarrative.GetProperty("narrative").GetProperty("interpretation").GetString());
    }

    [Fact]
    public async Task PlayerInputIsImmutableEventAndPendingIsDerivedFromSessionHead()
    {
        var client = await AuthenticatedClientAsync("dialogue-event@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.PauseDialogue = true;
        var request = client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-event", input = "扉の前で立ち止まる" });
        await _generator.DialogueEntered.Task.WaitAsync(AsyncSignalTimeout);

        var pendingSession = await GetSessionAsync(client, sessionId);
        var pendingInput = Assert.Single(pendingSession.GetProperty("pendingInputs").EnumerateArray());
        Assert.Equal("dialogue-event", pendingInput.GetProperty("requestId").GetString());
        Assert.Equal("扉の前で立ち止まる", pendingInput.GetProperty("input").GetString());
        Assert.Equal(NarrativeInteractionTypes.Dialogue, pendingInput.GetProperty("interactionType").GetString());
        Assert.Equal("pending", pendingInput.GetProperty("status").GetString());
        Assert.True(pendingInput.GetProperty("isRetryable").GetBoolean());

        string inputId;
        await using (var pendingScope = _factory.Services.CreateAsyncScope())
        {
            var db = pendingScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var input = await db.SessionPendingPlayerInputs.AsNoTracking().SingleAsync();
            var session = await db.Sessions.AsNoTracking().SingleAsync();
            inputId = input.Id;
            Assert.Null(input.AcceptedAfterTurnId);
            Assert.Null(session.HeadTurnId);
            Assert.Equal(0, await db.SessionPlayerInputs.CountAsync());
            Assert.False(await db.SessionTurns.AnyAsync(turn => turn.PlayerInputId == input.Id));
            Assert.Equal("pending", input.Status);
        }

        _generator.DialogueRelease.TrySetResult();
        using var completed = await request;
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
        var created = await completed.Content.ReadFromJsonAsync<JsonElement>();
        var turnId = created.GetProperty("id").GetString();
        Assert.Null(created.GetProperty("previousTurnId").GetString());
        Assert.Null(created.GetProperty("narrative").GetProperty("acceptedAfterTurnId").GetString());

        await using var completedScope = _factory.Services.CreateAsyncScope();
        var completedDb = completedScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var storedInput = await completedDb.SessionPlayerInputs.AsNoTracking().SingleAsync();
        var storedSession = await completedDb.Sessions.AsNoTracking().SingleAsync();
        Assert.Equal(inputId, storedInput.Id);
        Assert.Equal("扉の前で立ち止まる", storedInput.Text);
        Assert.Null(storedInput.AcceptedAfterTurnId);
        Assert.Equal(turnId, storedSession.HeadTurnId);
        Assert.Equal(0, (await completedDb.SessionStates.AsNoTracking().SingleAsync()).Revision);
        Assert.Equal(0, await completedDb.SessionPendingPlayerInputs.CountAsync());
    }

    [Fact]
    public async Task NarrativeTurnReplayDoesNotExposeAnotherOwnersSession()
    {
        var owner = await AuthenticatedClientAsync("dialogue-owner@example.test");
        var intruder = await AuthenticatedClientAsync("dialogue-intruder@example.test");
        var sessionId = await CreateSessionAsync(owner);
        var body = new { requestId = "dialogue-private", input = "扉を調べる" };
        using var created = await owner.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", body);
        Assert.Equal(HttpStatusCode.OK, created.StatusCode);

        using var replay = await intruder.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", body);
        Assert.Equal(HttpStatusCode.NotFound, replay.StatusCode);
    }

    [Fact]
    public async Task NarrativeThenModuleTurnsUseContiguousPositions()
    {
        var client = await AuthenticatedClientAsync("dialogue-position@example.test");
        var sessionId = await CreateSessionAsync(client);
        using var narrative = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-position", input = "閉じた星座の扉へ進む" });
        Assert.Equal(HttpStatusCode.OK, narrative.StatusCode);
        using var module = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/module-turns",
            InitializeBody("module-after-dialogue"));
        Assert.Equal(HttpStatusCode.Created, module.StatusCode);

        var session = await GetSessionAsync(client, sessionId);
        var orderedTurns = session.GetProperty("turns").EnumerateArray().ToArray();
        Assert.Null(orderedTurns[0].GetProperty("previousTurnId").GetString());
        Assert.Equal(orderedTurns[0].GetProperty("id").GetString(), orderedTurns[1].GetProperty("previousTurnId").GetString());
        Assert.Equal(orderedTurns[1].GetProperty("id").GetString(), session.GetProperty("headTurnId").GetString());
        Assert.Equal([1, 2], session.GetProperty("turns").EnumerateArray().Select(turn => turn.GetProperty("position").GetInt32()).ToArray());
    }

    [Fact]
    public async Task NarrativeTurnRejectsIdempotencyKeyReuseWithDifferentInput()
    {
        var client = await AuthenticatedClientAsync("dialogue-idempotency@example.test");
        var sessionId = await CreateSessionAsync(client);
        using var first = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", new { requestId = "dialogue-1", input = "扉に触れる" });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        using var reused = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", new { requestId = "dialogue-1", input = "階段へ戻る" });
        Assert.Equal(HttpStatusCode.Conflict, reused.StatusCode);
        var error = await reused.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("idempotency_key_reused", error.GetProperty("code").GetString());
    }

    [Fact]
    public async Task MissingSignalTriggerDescriptionRejectsGenerationBeforeProviderInvocation()
    {
        var client = await AuthenticatedClientAsync("dialogue-missing-trigger-description@example.test");
        var sessionId = await CreateSessionAsync(client);
        await using (var mutationScope = _factory.Services.CreateAsyncScope())
        {
            var transition = await mutationScope.ServiceProvider.GetRequiredService<ApplicationDbContext>()
                .ScenarioProgressionTransitions.SingleAsync(item => item.Id == "SPT-STAR-LIBRARY-DOOR-REACHED");
            transition.TriggerDescription = "   ";
            await mutationScope.ServiceProvider.GetRequiredService<ApplicationDbContext>().SaveChangesAsync();
        }

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-missing-trigger-description", input = "閉じた星座の扉へ進む" });

        await AssertDialogueGenerationRejectedAsync(response);
        Assert.Empty(_generator.DialogueRequests);
    }

    [Fact]
    public async Task AllowedNarrativeSignalIsPersistedAndAdvancesScenarioProgression()
    {
        var client = await AuthenticatedClientAsync("dialogue-signal@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.DialogueSignals = [new NarrativeProgressionSignal("constellation-door-reached", "Player input provides evidence for this signal.")];

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-signal", input = "閉じた星座の扉へ進む" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("constellation-door-reached", created.GetProperty("narrative").GetProperty("signals")[0].GetString());
        var allowedSignal = Assert.Single(Assert.Single(_generator.DialogueRequests).AllowedSignals);
        Assert.Equal("exploration", Assert.Single(_generator.DialogueRequests).CurrentProgressionNode);
        Assert.Equal("constellation-door-reached", allowedSignal.Code);
        Assert.Contains("実際に到達", allowedSignal.TriggerDescription, StringComparison.Ordinal);
        Assert.Contains("話す、尋ねる、遠くから見るだけでは発火しない", allowedSignal.TriggerDescription, StringComparison.Ordinal);

        var session = await GetSessionAsync(client, sessionId);
        Assert.Equal("constellation-door-check", session.GetProperty("progression").GetProperty("currentNode").GetString());
        Assert.Equal(1, session.GetProperty("progression").GetProperty("revision").GetInt64());
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var storedSignal = await db.SessionNarrativeSignals.SingleAsync();
        Assert.Equal("Player input provides evidence for this signal.", storedSignal.Evidence);
        Assert.Equal(1, await db.SessionProgressionTransitionReceipts.CountAsync());
    }

    [Fact]
    public async Task NarrativeSignalStartsConfiguredModuleTurnExactlyOnceFromSnapshot()
    {
        var identity = await GetIdentityAsync();
        await ConfigureDoorTransitionAsync(identity);
        var client = await AuthenticatedClientAsync("dialogue-module-transition@example.test");
        var sessionId = await CreateSessionAsync(client);
        await using (var mutationScope = _factory.Services.CreateAsyncScope())
        {
            var mutationDb = mutationScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var snapshot = await mutationDb.SessionProgressionModuleSnapshots.SingleAsync(item => item.SessionId == sessionId);
            Assert.Equal("{\"purpose\":\"constellation-door\"}", snapshot.ConfigurationJson);
            var transition = await mutationDb.ScenarioProgressionTransitions.SingleAsync(item => item.Id == snapshot.TransitionId);
            transition.ModuleConfigurationJson = "{\"purpose\":\"changed-after-session-start\"}";
            transition.ModuleContextJson = "{\"scene\":\"changed-after-session-start\"}";
            await mutationDb.SaveChangesAsync();
        }

        using var clientModule = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/module-turns",
            InitializeBody("client-bypass-attempt", new { purpose = "client-controlled" }));
        Assert.Equal(HttpStatusCode.Conflict, clientModule.StatusCode);
        var clientModuleError = await clientModule.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("scenario_module_turn_managed", clientModuleError.GetProperty("code").GetString());

        _generator.DialogueSignals = [new NarrativeProgressionSignal("constellation-door-reached", "Player input provides evidence for this signal.")];
        var body = new { requestId = "dialogue-module-transition", input = "閉じた星座の扉へ進む" };

        using var created = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", body);
        Assert.Equal(HttpStatusCode.OK, created.StatusCode);
        var firstSession = await GetSessionAsync(client, sessionId);
        var turns = firstSession.GetProperty("turns").EnumerateArray().ToArray();
        Assert.Equal([1, 2], turns.Select(turn => turn.GetProperty("position").GetInt32()).ToArray());
        Assert.Equal(["narrative", "module"], turns.Select(turn => turn.GetProperty("kind").GetString()!).ToArray());
        Assert.Equal("completed", firstSession.GetProperty("progression").GetProperty("transitionStatus").GetString());
        Assert.Equal(turns[1].GetProperty("id").GetString(), firstSession.GetProperty("progression").GetProperty("moduleTurnId").GetString());

        using var replay = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", body);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        var replayedSession = await GetSessionAsync(client, sessionId);
        Assert.Equal(2, replayedSession.GetProperty("turns").GetArrayLength());

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var receipt = await db.SessionProgressionTransitionReceipts.SingleAsync();
        Assert.Equal(identity.ModuleId, receipt.ModuleId);
        Assert.Equal(identity.Version, receipt.ModuleVersion);
        Assert.Equal(identity.Digest, receipt.ModuleDigest);
        Assert.Equal("{\"purpose\":\"constellation-door\"}", receipt.ModuleConfigurationJson);
        Assert.Equal("{\"purpose\":\"constellation-door\"}", (await db.ModuleExecutions.SingleAsync()).ConfigurationJson);
        Assert.Equal(1, await db.ModuleExecutions.CountAsync());
        Assert.Equal(1, await db.ModuleExecutionRequests.CountAsync(request => request.RequestId == $"scenario-transition:{receipt.Id}"));
    }

    [Fact]
    public async Task SessionStartRejectsConfiguredModuleThatIsNotEnabled()
    {
        var identity = await GetIdentityAsync();
        await ConfigureDoorTransitionAsync(identity);
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var packages = scope.ServiceProvider.GetRequiredService<IModulePackageService>();
            await packages.SetEnabledAsync(identity.Digest, false, default);
        }
        var client = await AuthenticatedClientAsync("dialogue-disabled-module@example.test");

        using var response = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId = "SCN-STAR-LIBRARY" });
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("scenario_module_unavailable", error.GetProperty("code").GetString());
        await using var verification = _factory.Services.CreateAsyncScope();
        Assert.Equal(0, await verification.ServiceProvider.GetRequiredService<ApplicationDbContext>().Sessions.CountAsync());
    }

    [Fact]
    public async Task UnknownNarrativeSignalIsRejectedWithoutPersistingTurnOrProgression()
    {
        var client = await AuthenticatedClientAsync("dialogue-invalid-signal@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.DialogueSignals = [new NarrativeProgressionSignal("untrusted-signal", "Player input provides evidence for this signal.")];

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-invalid-signal", input = "扉へ進む" });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var session = await GetSessionAsync(client, sessionId);
        Assert.Empty(session.GetProperty("turns").EnumerateArray());
        Assert.Equal("exploration", session.GetProperty("progression").GetProperty("currentNode").GetString());
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(0, await db.SessionNarrativeSignals.CountAsync());
        Assert.Equal(0, await db.SessionProgressionTransitionReceipts.CountAsync());
    }

    [Fact]
    public async Task ActiveTurnDoesNotGenerateAndPublicTriggerRouteDoesNotExist()
    {
        var client = await AuthenticatedClientAsync("no-trigger@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (turnId, _) = await CreateActiveTurnAsync(client, sessionId, "active-only");

        Assert.Empty(_generator.Requests);
        using var removedRoute = await client.PostAsync($"/api/sessions/{sessionId}/module-turns/{turnId}/narrative", null);
        Assert.Equal(HttpStatusCode.NotFound, removedRoute.StatusCode);
    }

    [Fact]
    public async Task SessionAdvanceDuringAutomaticGenerationMarksHandoffFailedWithoutRollingBackOutcome()
    {
        var client = await AuthenticatedClientAsync("automatic-stale@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (_, executionId) = await CreateActiveTurnAsync(client, sessionId, "stale-init");
        _generator.Pause = true;

        var completion = client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", DispatchBody("stale-complete"));
        await _generator.Entered.Task.WaitAsync(AsyncSignalTimeout);
        using var advanced = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody("later-turn"));
        Assert.Equal(HttpStatusCode.Created, advanced.StatusCode);
        _generator.Release.TrySetResult();

        using var completed = await completion;
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
        Assert.Equal("completed", (await completed.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
        var session = await GetSessionAsync(client, sessionId);
        Assert.Equal(2, session.GetProperty("turns").GetArrayLength());
        Assert.Equal("failed", session.GetProperty("turns")[0].GetProperty("narrativeHandoff").GetProperty("status").GetString());
        Assert.Equal("session_advanced", session.GetProperty("turns")[0].GetProperty("narrativeHandoff").GetProperty("errorCode").GetString());
        Assert.Equal(0, await CountNarrativeTurnsAsync());
        Assert.Equal(1, await CountOutcomeApplicationsAsync());
    }

    [Fact]
    public async Task ExpiredPendingLeaseIsRecoveredByCompletionReplay()
    {
        var client = await AuthenticatedClientAsync("lease-recovery@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (_, executionId) = await CreateActiveTurnAsync(client, sessionId, "lease-init");
        var body = DispatchBody("lease-complete");
        _generator.Fail = true;
        using var failed = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body);
        Assert.Equal(HttpStatusCode.OK, failed.StatusCode);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var handoff = await db.SessionNarrativeHandoffs.SingleAsync();
            handoff.Status = "pending";
            handoff.LeaseId = "NHL-EXPIRED";
            handoff.LeaseExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-1);
            handoff.LastErrorCode = null;
            handoff.LastErrorMessage = null;
            await db.SaveChangesAsync();
        }

        _generator.Fail = false;
        using var replay = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        Assert.Equal(1, await CountNarrativeTurnsAsync());
        var session = await GetSessionAsync(client, sessionId);
        Assert.Equal("completed", session.GetProperty("turns")[0].GetProperty("narrativeHandoff").GetProperty("status").GetString());
    }

    [Fact]
    public async Task ConcurrentCompletionReplayPersistsOneNarrativeTurn()
    {
        var client = await AuthenticatedClientAsync("automatic-concurrent@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (_, executionId) = await CreateActiveTurnAsync(client, sessionId, "concurrent-init");
        var body = DispatchBody("concurrent-complete");
        _generator.Fail = true;
        using var failed = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body);
        Assert.Equal(HttpStatusCode.OK, failed.StatusCode);
        _generator.Fail = false;

        var responses = await Task.WhenAll(
            client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body),
            client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body));
        foreach (var response in responses)
        {
            using (response) Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        Assert.Equal(1, await CountNarrativeTurnsAsync());
        var session = await GetSessionAsync(client, sessionId);
        Assert.Equal(2, session.GetProperty("turns").GetArrayLength());
    }

    private async Task AssertDialogueGenerationRejectedAsync(HttpResponseMessage response, string? expectedDetails = null)
    {
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("schema_failure", error.GetProperty("code").GetString());
        var details = error.GetProperty("details").GetString();
        Assert.Contains("Exception", details, StringComparison.Ordinal);
        if (expectedDetails is not null) Assert.Contains(expectedDetails, details, StringComparison.Ordinal);
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var pending = await db.SessionPendingPlayerInputs.AsNoTracking().SingleAsync();
        Assert.Equal("failed", pending.Status);
        Assert.True(pending.IsRetryable);
        Assert.Equal(0, await db.SessionPlayerInputs.CountAsync());
        Assert.Equal(0, await db.SessionTurns.CountAsync(turn => turn.Kind == "narrative"));
        Assert.Equal(0, await db.SessionNarrativeSignals.CountAsync());
        Assert.Equal(0, await db.SessionProgressionTransitionReceipts.CountAsync());
    }

    private async Task<(string TurnId, string ExecutionId)> CreateActiveTurnAsync(HttpClient client, string sessionId, string requestId)
    {
        using var response = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody(requestId));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return (json.GetProperty("id").GetString()!, json.GetProperty("execution").GetProperty("id").GetString()!);
    }

    private Task<HttpResponseMessage> CompleteAsync(HttpClient client, string executionId, string requestId) =>
        client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", DispatchBody(requestId));

    private static object DispatchBody(string requestId) => new
    {
        requestId,
        expectedRevision = 0,
        action = new { mode = "complete" },
        randomValueCount = 0,
    };

    private async Task<string> CreateSessionAsync(
        HttpClient client,
        bool interpretationEnabled = false,
        string? selectedHero = null)
    {
        using var response = await client.PostAsJsonAsync("/api/sessions/", new
        {
            scenarioId = "SCN-STAR-LIBRARY",
            interpretationEnabled,
            selectedHero,
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private static async Task<JsonElement> GetSessionAsync(HttpClient client, string sessionId)
    {
        using var response = await client.GetAsync($"/api/sessions/{sessionId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private object InitializeBody(string requestId, object? configuration = null)
    {
        var identity = GetIdentityAsync().GetAwaiter().GetResult();
        return new
        {
            requestId,
            moduleId = identity.ModuleId,
            version = identity.Version,
            digest = identity.Digest,
            configuration = configuration ?? new { },
            context = new { scene = "narrative-test" },
            randomValueCount = 0,
        };
    }

    private async Task ConfigureDoorTransitionAsync(ModulePackageIdentity identity)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var transition = await db.ScenarioProgressionTransitions.SingleAsync(item => item.Id == "SPT-STAR-LIBRARY-DOOR-REACHED");
        transition.ModuleId = identity.ModuleId;
        transition.ModuleVersion = identity.Version;
        transition.ModuleDigest = identity.Digest;
        transition.ModuleConfigurationJson = "{\"purpose\":\"constellation-door\"}";
        transition.ModuleContextJson = "{\"scene\":\"closed-constellation-door\"}";
        transition.ModuleRandomValueCount = 0;
        await db.SaveChangesAsync();
    }

    private async Task<ModulePackageIdentity> GetIdentityAsync()
    {
        if (_identity is not null) return _identity;
        await using var scope = _factory.Services.CreateAsyncScope();
        var service = scope.ServiceProvider.GetRequiredService<IModulePackageService>();
        await using var stream = File.OpenRead(Path.Combine(AppContext.BaseDirectory, "Myriale.HeadlessTestModule.dll"));
        var installed = await service.InstallAsync(stream, default);
        await service.SetEnabledAsync(installed.Package.Digest, true, default);
        _identity = new ModulePackageIdentity(installed.Package.ModuleId, installed.Package.Version, installed.Package.Digest);
        return _identity;
    }

    private async Task<int> GetHandoffAttemptsAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        return await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().SessionNarrativeHandoffs
            .Select(handoff => handoff.AttemptCount)
            .SingleAsync();
    }

    private async Task<int> CountNarrativeTurnsAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        return await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().SessionTurns.CountAsync(turn => turn.Kind == "narrative");
    }

    private async Task<int> CountOutcomeApplicationsAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        return await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().ModuleOutcomeApplications.CountAsync();
    }

    private async Task GrantDialogueDebugAsync(string email)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await db.Users.SingleAsync(item => item.Email == email);
        user.CanDebugDialogue = true;
        await db.SaveChangesAsync();
    }

    private async Task<HttpClient> AuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var response = await client.PostAsJsonAsync("/api/account/register", new { displayName = "Player", email, password = "letters1" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        if (response.Headers.TryGetValues("Set-Cookie", out var values))
            client.DefaultRequestHeaders.Add("Cookie", values.First().Split(';', 2)[0]);
        return client;
    }

    public void Dispose()
    {
        _factory.Dispose();
        try { if (Directory.Exists(_root)) Directory.Delete(_root, true); }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }

    private sealed class CapturingNarrativeGenerator : INarrativeGenerator, IActionRecommendationGenerator
    {
        public List<NarrativeHandoffRequest> Requests { get; } = [];
        public bool Fail { get; set; }
        public Func<Task>? OnGenerate { get; set; }
        public bool Pause { get; set; }
        public TaskCompletionSource Entered { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource Release { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public List<NarrativeActionRecommendationRequest> ActionRecommendationRequests { get; } = [];
        public string ActionSuggestion { get; set; } = "銀の鍵を扉にかざす";

        public Task<NarrativeActionRecommendationResult> RecommendActionAsync(
            NarrativeActionRecommendationRequest request,
            CancellationToken cancellationToken)
        {
            lock (ActionRecommendationRequests) ActionRecommendationRequests.Add(request);
            if (Fail) throw new NarrativeGenerationException("test failure");
            return Task.FromResult(new NarrativeActionRecommendationResult(ActionSuggestion));
        }

        public List<NarrativeDialogueRequest> DialogueRequests { get; } = [];
        public string DialogueSchemaVersion { get; set; } = NarrativeDialogueSchema.Version;
        public IReadOnlyList<NarrativeProgressionSignal> DialogueSignals { get; set; } = [];
        public string DialogueTurnType { get; set; } = "action-result";
        public string DialogueHeading { get; set; } = "銀の鍵を掲げる";
        public string DialogueBody { get; set; } = "入力を受け止め、物語は次の場面へ進んだ。";
        public string DialogueInterpretation { get; set; } = "Playerは銀の鍵を掲げる行動を選んだ。";
        public bool PauseDialogue { get; set; }
        public TaskCompletionSource DialogueEntered { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource DialogueRelease { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public async Task<NarrativeGeneration<NarrativeDialogueResult>> GenerateDialogueAsync(NarrativeDialogueRequest request, CancellationToken cancellationToken)
        {
            lock (DialogueRequests) DialogueRequests.Add(request);
            if (Fail) throw new NarrativeGenerationException("test failure");
            if (PauseDialogue)
            {
                DialogueEntered.TrySetResult();
                await DialogueRelease.Task.WaitAsync(cancellationToken);
            }
            return new(new NarrativeDialogueResult(
                DialogueSchemaVersion,
                DialogueTurnType,
                DialogueHeading,
                DialogueBody,
                DialogueSignals,
                DialogueInterpretation), Metadata());
        }

        public async Task<NarrativeGeneration<string>> GenerateAsync(NarrativeHandoffRequest request, CancellationToken cancellationToken)
        {
            if (OnGenerate is not null) await OnGenerate();
            lock (Requests) Requests.Add(request);
            if (Fail) throw new NarrativeGenerationException("test failure");
            if (Pause)
            {
                Entered.TrySetResult();
                await Release.Task.WaitAsync(cancellationToken);
            }
            return new("確定した結果を受け、物語は次の場面へ進んだ。", Metadata());
        }

        private static AiGenerationMetadata Metadata() => new("test-provider", "test-model", "response-1", 12, 8, 25, 1, "stop");
    }
}
