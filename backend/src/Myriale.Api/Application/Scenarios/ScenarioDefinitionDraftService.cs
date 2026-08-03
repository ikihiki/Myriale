using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;

namespace Myriale.Api.Application.Scenarios;

public sealed class ScenarioDefinitionDraftService(
    ApplicationDbContext db,
    IScenarioDefinitionRepository repository,
    ScenarioDefinitionMapper mapper,
    ScenarioDefinitionWriter writer)
{
    public async Task<ScenarioDefinitionVersion> GetOrCreateDraftAsync(string scenarioId, CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 3; attempt++)
        {
            var existing = await repository.GetDraftAsync(scenarioId, cancellationToken);
            if (existing is not null) return existing;
            var scenario = await db.Scenarios.SingleAsync(x => x.Id == scenarioId, cancellationToken);
            var now = DateTimeOffset.UtcNow;
            if (scenario.DefinitionVersionCounter == 0)
                scenario.DefinitionVersionCounter = await db.ScenarioDefinitionVersions.Where(x => x.ScenarioId == scenarioId)
                    .MaxAsync(x => (int?)x.Version, cancellationToken) ?? 0;
            var draft = ScenarioDefinitionVersion.CreateDraft($"SDV-{Guid.NewGuid():N}", scenarioId, scenario.AllocateDefinitionVersion(now), now);
            draft.SnapshotScenario(scenario);
            var published = await repository.GetLatestPublishedAsync(scenarioId, cancellationToken);
            if (published is not null)
            {
                writer.Replace(draft, mapper.ToRequest(published), now);
                CloneProgression(published, draft);
            }
            await repository.AddAsync(draft, cancellationToken);
            try { await db.SaveChangesAsync(cancellationToken); return draft; }
            catch (DbUpdateException) when (attempt < 2) { db.ChangeTracker.Clear(); }
        }
        return await repository.GetDraftAsync(scenarioId, cancellationToken)
            ?? throw new DbUpdateConcurrencyException("A concurrent draft could not be resolved.");
    }

    private static void CloneProgression(ScenarioDefinitionVersion source, ScenarioDefinitionVersion target)
    {
        var ids = source.ProgressionNodes.ToDictionary(x => x.Id, _ => $"SPN-{Guid.NewGuid():N}");
        foreach (var x in source.ProgressionNodes) target.ProgressionNodes.Add(new ScenarioProgressionNode
        { Id = ids[x.Id], DefinitionVersionId = target.Id, Code = x.Code, IsInitial = x.IsInitial, AllowedNarrativeSignalsJson = x.AllowedNarrativeSignalsJson });
        foreach (var x in source.ProgressionTransitions) target.ProgressionTransitions.Add(new ScenarioProgressionTransition
        {
            Id = $"SPT-{Guid.NewGuid():N}", DefinitionVersionId = target.Id, SourceNodeId = ids[x.SourceNodeId], SignalCode = x.SignalCode,
            TriggerDescription = x.TriggerDescription, TargetNodeId = ids[x.TargetNodeId], ModuleId = x.ModuleId, ModuleVersion = x.ModuleVersion,
            ModuleDigest = x.ModuleDigest, ModuleConfigurationJson = x.ModuleConfigurationJson, ModuleContextJson = x.ModuleContextJson,
            ModuleRandomValueCount = x.ModuleRandomValueCount,
        });
    }
}
