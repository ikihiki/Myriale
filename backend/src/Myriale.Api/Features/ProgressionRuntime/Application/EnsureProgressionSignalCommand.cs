using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;
using Myriale.ModuleSdk;

namespace Myriale.Api.Features.ProgressionRuntime.Application;

public sealed class EnsureProgressionSignalCommand(ApplicationDbContext db)
{
    private static readonly JsonSerializerOptions Json = ModuleJsonSerializerOptions.Create();

    public async Task<string?> PrepareAsync(
        Session session,
        SessionTurn narrativeTurn,
        string signalCode,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var progress = session.Progress;
        if (progress is null) return null;
        var allowed = JsonSerializer.Deserialize<string[]>(progress.CurrentNode.AllowedNarrativeSignalsJson, Json) ?? [];
        if (!allowed.Contains(signalCode, StringComparer.Ordinal)) return null;
        var existing = await db.SessionNarrativeSignals
            .SingleOrDefaultAsync(item => item.NarrativeTurnId == narrativeTurn.Id && item.Code == signalCode, cancellationToken);
        if (existing is not null) return existing.Id;
        var transition = await db.ScenarioProgressionTransitions.AsNoTracking()
            .SingleOrDefaultAsync(item => item.DefinitionVersionId == session.ScenarioDefinitionVersionId
                && item.SourceNodeId == progress.CurrentNodeId && item.SignalCode == signalCode, cancellationToken);
        if (transition is null) return null;
        var snapshot = await db.SessionProgressionModuleSnapshots.AsNoTracking()
            .SingleOrDefaultAsync(item => item.SessionId == session.Id && item.TransitionId == transition.Id, cancellationToken);
        var signal = new SessionNarrativeSignal
        {
            Id = $"NSG-{Guid.NewGuid():N}".ToUpperInvariant(),
            SessionId = session.Id,
            NarrativeTurnId = narrativeTurn.Id,
            Code = signalCode,
            Evidence = $"Module Outcome {signalCode} のNarrative handoffが完了した。",
            CreatedAt = now,
        };
        db.SessionNarrativeSignals.Add(signal);
        var moduleSnapshot = snapshot is null ? null : new ProgressionModuleSnapshot(
            snapshot.ModuleId, snapshot.ModuleVersion, snapshot.ModuleDigest,
            snapshot.ConfigurationJson, snapshot.ContextJson, snapshot.RandomValueCount);
        db.SessionProgressionTransitionReceipts.Add(SessionProgressionTransitionReceipt.Create(
            $"PTR-{Guid.NewGuid():N}".ToUpperInvariant(), session.Id, signal.Id, transition.Id,
            transition.SourceNodeId, transition.TargetNodeId, moduleSnapshot, now));
        progress.MoveTo(transition.TargetNodeId, progress.Revision, now);
        return signal.Id;
    }
}
