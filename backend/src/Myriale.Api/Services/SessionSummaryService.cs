using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Data;
using Myriale.ModuleSdk;

namespace Myriale.Api.Services;

public sealed class SessionSummaryService(
    ApplicationDbContext db,
    IOptions<NarrativeContextOptions> options,
    ILogger<SessionSummaryService> logger)
{
    public async Task TryGenerateAsync(string sessionId, int throughPosition, CancellationToken cancellationToken)
    {
        if (throughPosition < options.Value.SummaryIntervalTurns || throughPosition % options.Value.SummaryIntervalTurns != 0) return;
        try
        {
            if (await db.SessionSummaries.AsNoTracking().AnyAsync(item => item.SessionId == sessionId && item.ToPosition == throughPosition, cancellationToken)) return;
            var turns = await db.SessionTurns.AsNoTracking()
                .Include(turn => turn.PlayerInput)
                .Where(turn => turn.SessionId == sessionId && turn.Position <= throughPosition)
                .OrderBy(turn => turn.Position)
                .ToListAsync(cancellationToken);
            if (turns.Count == 0) return;
            var previous = await db.SessionSummaries.AsNoTracking().Where(item => item.SessionId == sessionId)
                .OrderByDescending(item => item.Version).FirstOrDefaultAsync(cancellationToken);
            var fromPosition = previous?.ToPosition + 1 ?? turns[0].Position;
            var sourceTurns = turns.Where(turn => turn.Position >= fromPosition).ToArray();
            if (sourceTurns.Length == 0) return;
            var notes = await db.SessionNotes.AsNoTracking().Where(note => note.SessionId == sessionId && note.CanonStatus == "canon").ToListAsync(cancellationToken);
            var location = notes.Where(note => note.Kind == "location").OrderByDescending(note => note.UpdatedAt).FirstOrDefault()?.Title ?? previous?.CurrentLocation ?? string.Empty;
            var characters = notes.Where(note => note.Kind == "person").Select(note => note.Title).Distinct().ToArray();
            var inventory = notes.Where(note => note.Kind == "item").Select(note => note.Title).Distinct().ToArray();
            var moduleJson = await db.SessionTurns.AsNoTracking().Where(turn => turn.SessionId == sessionId && turn.Position <= throughPosition
                    && turn.ModuleExecution != null && turn.ModuleExecution.OutcomeJson != null)
                .Select(turn => turn.ModuleExecution!.OutcomeJson!).ToListAsync(cancellationToken);
            var moduleResults = moduleJson.Select(json =>
            {
                try { return JsonSerializer.Deserialize<ModuleOutcome>(json, ModuleJsonSerializerOptions.Create())?.Code; }
                catch (JsonException) { return null; }
            }).OfType<string>().Distinct().ToArray();
            var objectives = sourceTurns.Select(turn => turn.PlayerInput?.Text).OfType<string>().TakeLast(3).ToArray();
            var clues = notes.Where(note => note.Kind == "rule" || note.Body.Contains("手がかり", StringComparison.Ordinal)).Select(note => note.Title).Distinct().ToArray();
            var sourceText = string.Join("\n", sourceTurns.Select(turn => $"Turn {turn.Position}: {turn.NarrativeBody}").Where(text => text.Length > 0));
            var body = string.Join("\n", new[]
            {
                previous is null ? null : $"Previous summary: {previous.Body}",
                string.IsNullOrWhiteSpace(location) ? null : $"Current location: {location}",
                characters.Length == 0 ? null : $"Characters: {string.Join(", ", characters)}",
                inventory.Length == 0 ? null : $"Inventory: {string.Join(", ", inventory)}",
                moduleResults.Length == 0 ? null : $"Module results: {string.Join(", ", moduleResults)}",
                sourceText,
            }.Where(value => !string.IsNullOrWhiteSpace(value)));
            if (body.Length > 12000) body = body[^12000..];
            var summary = new SessionSummary
            {
                Id = $"SUM-{Guid.NewGuid():N}".ToUpperInvariant(), SessionId = sessionId,
                FromTurnId = sourceTurns[0].Id, ToTurnId = sourceTurns[^1].Id,
                FromPosition = fromPosition, ToPosition = throughPosition, Version = (previous?.Version ?? 0) + 1,
                Confidence = "confirmed", CurrentLocation = location, CharactersJson = JsonSerializer.Serialize(characters),
                ObjectivesJson = JsonSerializer.Serialize(objectives), CluesJson = JsonSerializer.Serialize(clues),
                InventoryJson = JsonSerializer.Serialize(inventory), ModuleResultsJson = JsonSerializer.Serialize(moduleResults),
                Body = body, GeneratedAt = DateTimeOffset.UtcNow,
            };
            db.SessionSummaries.Add(summary);
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            db.ChangeTracker.Clear();
            logger.LogWarning(exception, "Session summary generation failed without rolling back dialogue. SessionId={SessionId} ThroughPosition={ThroughPosition}", sessionId, throughPosition);
        }
    }
}
