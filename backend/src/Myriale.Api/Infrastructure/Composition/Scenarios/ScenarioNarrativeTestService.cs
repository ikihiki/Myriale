using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Infrastructure.Composition.Scenarios;

public sealed class ScenarioNarrativeTestService(
    ApplicationDbContext db,
    IAiProfileCatalog profiles,
    IScenarioTurnAiService ai)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task<ImportScenarioNarrativeTestResponse?> ImportAsync(
        AccountId userId, bool isAdministrator, ScenarioId scenarioId, SessionId sessionId, SessionTurnId turnId,
        CancellationToken cancellationToken)
    {
        if (!await CanEditAsync(userId, isAdministrator, scenarioId, cancellationToken)) return null;
        var turn = await db.SessionTurns.AsNoTracking()
            .Where(item => item.Id == turnId && item.SessionId == sessionId && item.Session.ScenarioId == scenarioId && item.PlayerInputId != null)
            .Select(item => new { item.PlayerInputId })
            .SingleOrDefaultAsync(cancellationToken);
        if (turn is null) return null;
        var execution = await db.SessionExecutions.AsNoTracking()
            .SingleOrDefaultAsync(item => item.SessionId == sessionId
                && item.Kind == SessionExecutionKind.ScenarioTurn
                && item.TriggerType == SessionExecutionTriggerType.PlayerInput
                && item.TriggerId == new SessionExecutionTriggerId(turn.PlayerInputId!.Value.AsPrimitive()), cancellationToken);
        if (execution is null) return null;
        var sentPrompt = await db.SessionAiInteractions.AsNoTracking()
            .Where(item => item.ExecutionId == execution.Id && item.Stage == SessionAiInteractionStage.Narrative
                && item.Status == SessionAiInteractionStatus.Succeeded && item.SentPrompt != null)
            .OrderByDescending(item => item.CompletedAt)
            .Select(item => item.SentPrompt)
            .FirstOrDefaultAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(sentPrompt)) return null;
        var request = JsonSerializer.Deserialize<PostStateNarrativeRequest>(sentPrompt, Json);
        if (request is null) return null;
        return new(sessionId, turnId, ToTestCase(request));
    }

    public async Task<CompareScenarioDraftNarrativeResponse?> CompareAsync(
        AccountId userId, bool isAdministrator, ScenarioId scenarioId, CompareScenarioDraftNarrativeRequest input,
        CancellationToken cancellationToken)
    {
        if (!await CanEditAsync(userId, isAdministrator, scenarioId, cancellationToken)) return null;
        var errors = ScenarioRequestValidator.Validate(input.Draft);
        if (errors.Count > 0) throw new ScenarioNarrativeTestValidationException(errors);
        var published = await db.ScenarioDefinitionVersions.AsNoTracking()
            .Where(item => item.ScenarioId == scenarioId && item.Status == DefinitionStatus.Published)
            .OrderByDescending(item => item.Version)
            .FirstOrDefaultAsync(cancellationToken);
        if (published is null) throw new ScenarioTurnValidationException("published_definition_required");
        ValidateTestCase(input.TestCase);
        var profileId = await profiles.ResolveNarrativeProfileIdAsync(null, cancellationToken);
        var publishedRequest = CreateRequest(FromPublished(published, input.TestCase.Entities), input.TestCase);
        var draftRequest = CreateRequest(FromDraft(input.Draft, input.TestCase.Entities), input.TestCase);
        var publishedResult = await ai.GeneratePostStateNarrativeForProfileAsync(profileId, publishedRequest, cancellationToken);
        ScenarioNarrativeGenerationService.Validate(publishedResult.Value, publishedRequest.ForbiddenNarrativeFacts, publishedRequest.RecentTurns);
        var draftResult = await ai.GeneratePostStateNarrativeForProfileAsync(profileId, draftRequest, cancellationToken);
        ScenarioNarrativeGenerationService.Validate(draftResult.Value, draftRequest.ForbiddenNarrativeFacts, draftRequest.RecentTurns);
        return new(published.Id, profileId, ToResult(publishedResult), ToResult(draftResult));
    }

    private Task<bool> CanEditAsync(AccountId userId, bool isAdministrator, ScenarioId scenarioId, CancellationToken cancellationToken) =>
        db.Scenarios.AsNoTracking().AnyAsync(item => item.Id == scenarioId && (isAdministrator || item.AuthorId == userId), cancellationToken);

    private static ScenarioNarrativeTestCase ToTestCase(PostStateNarrativeRequest request) => new(
        request.RecentTurns, request.PlayerInput, request.SelectedObject, request.SelectedAction, request.PostState,
        request.Facts, request.Events, request.NarrativeHints, request.ForbiddenNarrativeFacts, request.Scenario.Entities);

    private static PostStateNarrativeRequest CreateRequest(NarrativeScenarioInput scenario, ScenarioNarrativeTestCase test) => new(
        ScenarioTurnSchemas.PostStateNarrative, scenario, test.RecentTurns, test.PlayerInput.Trim(), test.SelectedObject,
        test.SelectedAction, test.PostState, test.Facts, test.Events, test.NarrativeHints, test.ForbiddenNarrativeFacts);

    private static NarrativeScenarioInput FromDraft(CreateScenarioRequest draft, IReadOnlyList<NarrativeEntityInput> entities) => new(
        draft.Title.Trim(), Clean(draft.Summary), Clean(draft.Genre), Clean(draft.Tone), Clean(draft.Lore), Clean(draft.AiFreedom),
        Clean(draft.Hero), entities, Clean(draft.Opening));

    private static NarrativeScenarioInput FromPublished(ScenarioDefinitionVersion definition, IReadOnlyList<NarrativeEntityInput> entities) => new(
        definition.ScenarioTitle.Value, definition.ScenarioSummary, definition.ScenarioGenre, definition.ScenarioTone,
        definition.ScenarioLore, definition.ScenarioAiFreedom, definition.ScenarioHero, entities, definition.ScenarioOpening);

    private static ScenarioNarrativeTestResult ToResult(NarrativeGeneration<PostStateNarrativeResult> generated) => new(
        generated.Value.Heading, generated.Value.Body, generated.Metadata.Model, generated.Metadata.LatencyMilliseconds);

    private static void ValidateTestCase(ScenarioNarrativeTestCase test)
    {
        if (string.IsNullOrWhiteSpace(test.PlayerInput)) throw new ScenarioTurnValidationException("test_player_input_required");
        if (test.RecentTurns.Count > 20) throw new ScenarioTurnValidationException("too_many_test_turns");
        if (test.PostState.Objects.Count > 200) throw new ScenarioTurnValidationException("too_many_test_objects");
    }

    private static string Clean(string? value) => value?.Trim() ?? string.Empty;
}

public sealed class ScenarioNarrativeTestValidationException(IReadOnlyDictionary<string, string[]> errors) : Exception
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;
}
