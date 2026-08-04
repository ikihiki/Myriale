using Microsoft.EntityFrameworkCore;
using Myriale.Api.Application.Sessions;
using Myriale.Api.Data;

namespace Myriale.Api.Infrastructure.Sessions;

public sealed class EfSessionInputAcceptanceRepository(ApplicationDbContext db) : ISessionInputAcceptanceRepository
{
    public Task<Session?> LoadOwnedAsync(string ownerId, string sessionId, CancellationToken cancellationToken) => db.Sessions
        .Include(item => item.HeadTurn)
        .SingleOrDefaultAsync(item => item.Id == sessionId && item.OwnerId == ownerId, cancellationToken);

    public async Task<(SessionPlayerInput Input, SessionExecution Execution)?> FindReplayAsync(string sessionId, string requestId, CancellationToken cancellationToken)
    {
        var input = await db.SessionPlayerInputs.AsNoTracking().SingleOrDefaultAsync(x => x.SessionId == sessionId && x.RequestId == requestId, cancellationToken);
        if (input is null) return null;
        var execution = await db.SessionExecutions.AsNoTracking().SingleAsync(x => x.SessionId == sessionId && x.IdempotencyKey == requestId, cancellationToken);
        return (input, execution);
    }

    public async Task<bool> HasBlockingModuleHeadAsync(string sessionId, string? headTurnId, CancellationToken cancellationToken)
    {
        if (headTurnId is null) return false;
        return await db.SessionTurns.AsNoTracking().AnyAsync(turn => turn.SessionId == sessionId && turn.Id == headTurnId
            && turn.Kind == SessionTurnKind.Module && turn.NarrativeTurn == null, cancellationToken);
    }

    public async Task<bool> IsModuleHandoffPendingAsync(string sessionId, string? headTurnId, CancellationToken cancellationToken)
    {
        if (headTurnId is null) return false;
        return await db.ModuleExecutions.AsNoTracking().AnyAsync(x => x.SessionTurnId == headTurnId && x.Status == ModuleExecutionStatus.Completed, cancellationToken);
    }

    public async Task<int> CountRecentInputsAsync(string sessionId, DateTimeOffset cutoff, CancellationToken cancellationToken)
    {
        if (db.Database.IsNpgsql()) return await db.SessionPlayerInputs.CountAsync(x => x.SessionId == sessionId && x.CreatedAt >= cutoff, cancellationToken);
        return (await db.SessionPlayerInputs.AsNoTracking().Where(x => x.SessionId == sessionId).Select(x => x.CreatedAt).ToListAsync(cancellationToken)).Count(x => x >= cutoff);
    }

    public async Task<SessionRepositoryCommitOutcome> CommitInputAsync(Session session, SessionExecution execution, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        db.SessionExecutions.Add(execution);
        try { await db.SaveChangesAsync(cancellationToken); await transaction.CommitAsync(cancellationToken); return SessionRepositoryCommitOutcome.Committed; }
        catch (DbUpdateConcurrencyException) { await transaction.RollbackAsync(CancellationToken.None); return SessionRepositoryCommitOutcome.ConcurrencyConflict; }
        catch (DbUpdateException) { await transaction.RollbackAsync(CancellationToken.None); return SessionRepositoryCommitOutcome.UniqueConflict; }
    }
    public void ClearTracking() => db.ChangeTracker.Clear();
}

public sealed class EfSessionCreationRepository(ApplicationDbContext db) : ISessionCreationRepository
{
    public Task<Session?> FindReplayAsync(string ownerId, string requestId, CancellationToken cancellationToken) => db.Sessions.AsNoTracking()
        .SingleOrDefaultAsync(x => x.OwnerId == ownerId && x.CreationRequestId == requestId, cancellationToken);

    public async Task<SessionCreationSourceResult> LoadSourceAsync(string ownerId, string scenarioId, CancellationToken cancellationToken)
    {
        var canDebug = await db.Users.AsNoTracking().Where(x => x.Id == ownerId).Select(x => x.CanDebugDialogue).SingleOrDefaultAsync(cancellationToken);
        if (!await db.Scenarios.AsNoTracking().AnyAsync(x => x.Id == scenarioId, cancellationToken))
            return new(SessionCreationSourceOutcome.ScenarioNotFound);
        var definition = await db.ScenarioDefinitionVersions.AsNoTracking()
            .Include(x => x.Locations).Include(x => x.ObjectTypes).ThenInclude(x => x.Actions).Include(x => x.Objects)
            .Where(x => x.ScenarioId == scenarioId && x.Status == DefinitionStatus.Published)
            .OrderByDescending(x => x.Version).FirstOrDefaultAsync(cancellationToken);
        if (definition is null) return new(SessionCreationSourceOutcome.PublishedDefinitionRequired);
        var location = definition.Locations.SingleOrDefault(x => x.Code == definition.StartLocationCode);
        if (location is null) return new(SessionCreationSourceOutcome.InitialLocationRequired);
        var node = await db.ScenarioProgressionNodes.AsNoTracking().SingleOrDefaultAsync(x => x.DefinitionVersionId == definition.Id && x.IsInitial, cancellationToken);
        var transitions = await db.ScenarioProgressionTransitions.AsNoTracking().Where(x => x.DefinitionVersionId == definition.Id && x.ModuleId != null).ToListAsync(cancellationToken);
        return new(SessionCreationSourceOutcome.Found, new(canDebug, definition, location, node, transitions));
    }

    public async Task<bool> AreModulePackagesAvailableAsync(IReadOnlyList<ScenarioProgressionTransition> transitions, CancellationToken cancellationToken)
    {
        foreach (var t in transitions)
            if (string.IsNullOrWhiteSpace(t.ModuleVersion) || t.ModuleDigest?.Length != 64 || !await db.ModulePackages.AsNoTracking().AnyAsync(p =>
                p.ModuleId == t.ModuleId && p.Version == t.ModuleVersion && p.Digest == t.ModuleDigest && p.Status == "installed" && p.IsEnabled, cancellationToken)) return false;
        return true;
    }

    public async Task<SessionRepositoryCommitOutcome> CommitCreationAsync(Session session, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var opening = session.DetachHeadForPersistence();
        db.Sessions.Add(session);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            session.RestoreHeadForPersistence(opening);
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return SessionRepositoryCommitOutcome.Committed;
        }
        catch (DbUpdateConcurrencyException) { await transaction.RollbackAsync(CancellationToken.None); return SessionRepositoryCommitOutcome.ConcurrencyConflict; }
        catch (DbUpdateException) { await transaction.RollbackAsync(CancellationToken.None); return SessionRepositoryCommitOutcome.UniqueConflict; }
    }
    public void ClearTracking() => db.ChangeTracker.Clear();
}
