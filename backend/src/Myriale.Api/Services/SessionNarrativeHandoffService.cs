using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.ModuleSdk;

namespace Myriale.Api.Services;

public sealed class SessionNarrativeHandoffService(
    ApplicationDbContext db,
    INarrativeGenerator generator)
{
    private readonly JsonSerializerOptions _json = ModuleJsonSerializerOptions.Create();

    public async Task<NarrativeHandoffServiceResult> CreateAsync(
        string ownerId,
        string sessionId,
        string moduleTurnId,
        CancellationToken cancellationToken)
    {
        var existing = await db.SessionTurns.AsNoTracking()
            .SingleOrDefaultAsync(turn => turn.SourceModuleTurnId == moduleTurnId
                && turn.SessionId == sessionId
                && turn.Session.OwnerId == ownerId,
                cancellationToken);
        if (existing is not null) return Success(existing, StatusCodes.Status200OK, true);

        var source = await db.SessionTurns
            .Include(turn => turn.Session).ThenInclude(session => session.Scenario)
            .Include(turn => turn.Session).ThenInclude(session => session.State)
            .Include(turn => turn.ModuleExecution).ThenInclude(execution => execution!.OutcomeApplication)
            .SingleOrDefaultAsync(turn => turn.Id == moduleTurnId
                && turn.SessionId == sessionId
                && turn.Session.OwnerId == ownerId
                && turn.Kind == "module",
                cancellationToken);
        if (source?.ModuleExecution is null)
            return new NarrativeHandoffServiceResult(StatusCodes.Status404NotFound);

        var execution = source.ModuleExecution;
        if (execution.Status != ModuleExecutionStatuses.Completed || execution.OutcomeJson is null)
            return Conflict("module_turn_not_completed", "完了していないModule TurnからNarrativeを生成できません。");
        if (source.Position != source.Session.NextTurnPosition)
            return Conflict("session_advanced", "このModule Turnの後にSessionが進行しています。");

        ModuleOutcome outcome;
        JsonElement viewState;
        IReadOnlyDictionary<string, bool> flags;
        try
        {
            outcome = JsonSerializer.Deserialize<ModuleOutcome>(execution.OutcomeJson, _json)
                ?? throw new JsonException("Outcome is empty.");
            viewState = Parse(execution.ViewStateJson);
            flags = JsonSerializer.Deserialize<IReadOnlyDictionary<string, bool>>(source.Session.State.FlagsJson, _json)
                ?? new Dictionary<string, bool>();
        }
        catch (JsonException)
        {
            return new NarrativeHandoffServiceResult(
                StatusCodes.Status422UnprocessableEntity,
                Error: new NarrativeHandoffErrorResponse("narrative_source_invalid", "Narrative生成元の公開データを読み込めません。"));
        }

        var stateRevision = source.Session.State.Revision;
        if (outcome.Effects.Count > 0)
        {
            var application = execution.OutcomeApplication;
            if (application is null || application.SessionId != sessionId || application.AppliedSessionRevision != stateRevision)
                return Conflict("effects_not_applied", "Outcome Effectの適用が完了していません。");
        }

        var request = new NarrativeHandoffRequest(
            new NarrativeScenarioInput(
                source.Session.Scenario.Title,
                source.Session.Scenario.Summary,
                source.Session.Scenario.Genre,
                source.Session.Scenario.Tone,
                source.Session.Scenario.Lore,
                source.Session.Scenario.AiFreedom,
                source.Session.Scenario.Hero,
                source.Session.Scenario.Opening),
            new NarrativeOutcomeInput(
                outcome.Category,
                outcome.Code,
                outcome.Title,
                outcome.Summary,
                outcome.PublicFacts,
                outcome.EmittedEvents,
                outcome.NarrativeHints,
                outcome.ForbiddenNarrativeFacts),
            viewState,
            new NarrativeSessionStateInput(stateRevision, flags));

        string body;
        try
        {
            body = await generator.GenerateAsync(request, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException)
        {
            return new NarrativeHandoffServiceResult(
                StatusCodes.Status502BadGateway,
                Error: new NarrativeHandoffErrorResponse("narrative_generation_failed", "Narrativeの生成に失敗しました。"));
        }
        catch (Exception exception) when (exception is NarrativeGenerationException or HttpRequestException or JsonException)
        {
            return new NarrativeHandoffServiceResult(
                StatusCodes.Status502BadGateway,
                Error: new NarrativeHandoffErrorResponse("narrative_generation_failed", "Narrativeの生成に失敗しました。"));
        }

        var current = await db.Sessions.AsNoTracking()
            .Where(session => session.Id == sessionId && session.OwnerId == ownerId)
            .Select(session => new { session.NextTurnPosition, StateRevision = session.State.Revision })
            .SingleAsync(cancellationToken);
        if (current.NextTurnPosition != source.Position || current.StateRevision != stateRevision)
        {
            var winner = await db.SessionTurns.AsNoTracking()
                .SingleOrDefaultAsync(turn => turn.SourceModuleTurnId == moduleTurnId
                    && turn.SessionId == sessionId
                    && turn.Session.OwnerId == ownerId,
                    cancellationToken);
            return winner is not null
                ? Success(winner, StatusCodes.Status200OK, true)
                : Conflict("session_advanced", "Narrative生成中にSessionが進行しました。");
        }

        var now = DateTimeOffset.UtcNow;
        source.Session.State.UpdatedAt = now;
        source.Session.NextTurnPosition++;
        source.Session.UpdatedAt = now;
        var narrative = new SessionTurn
        {
            Id = NewTurnId(),
            SessionId = sessionId,
            Position = source.Session.NextTurnPosition,
            Kind = "narrative",
            NarrativeBody = body,
            SourceModuleTurnId = source.Id,
            SourceSessionRevision = stateRevision,
            CreatedAt = now,
        };
        db.SessionTurns.Add(narrative);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return Success(narrative, StatusCodes.Status201Created, false);
        }
        catch (DbUpdateException)
        {
            db.ChangeTracker.Clear();
            var winner = await db.SessionTurns.AsNoTracking()
                .SingleOrDefaultAsync(turn => turn.SourceModuleTurnId == moduleTurnId
                    && turn.SessionId == sessionId
                    && turn.Session.OwnerId == ownerId,
                    cancellationToken);
            if (winner is not null) return Success(winner, StatusCodes.Status200OK, true);
            return Conflict("session_advanced", "Narrative生成中にSessionが進行しました。");
        }
    }

    private static NarrativeHandoffServiceResult Success(SessionTurn turn, int statusCode, bool replayed) =>
        new(statusCode, ToResponse(turn), Replayed: replayed);

    private static NarrativeHandoffServiceResult Conflict(string code, string message) =>
        new(StatusCodes.Status409Conflict, Error: new NarrativeHandoffErrorResponse(code, message));

    private static SessionTurnResponse ToResponse(SessionTurn turn) =>
        new(
            turn.Id,
            turn.Position,
            turn.Kind,
            null,
            new NarrativeTurnResponse(turn.SourceModuleTurnId!, turn.SourceSessionRevision!.Value, turn.NarrativeBody!),
            turn.CreatedAt);

    private static JsonElement Parse(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    private static string NewTurnId() => $"TRN-{Guid.NewGuid():N}".ToUpperInvariant();
}

public sealed record NarrativeHandoffServiceResult(
    int StatusCode,
    SessionTurnResponse? Response = null,
    NarrativeHandoffErrorResponse? Error = null,
    bool Replayed = false);
