using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public interface IPlaySessionListingService
{
    Task<IReadOnlyList<PlaySessionSummaryDto>> ListAsync(
        string ownerId,
        bool includeCompleted,
        CancellationToken cancellationToken);
}

public sealed class PlaySessionListingService(ApplicationDbContext db) : IPlaySessionListingService
{
    public async Task<IReadOnlyList<PlaySessionSummaryDto>> ListAsync(
        string ownerId,
        bool includeCompleted,
        CancellationToken cancellationToken)
    {
        var sessionSummaries = await db.Sessions.AsNoTracking()
            .Where(session => session.OwnerId == ownerId
                && (includeCompleted || session.Status != "completed"))
            .Select(session => new PlaySessionSummaryDto(
                session.Id,
                session.ScenarioId,
                session.Scenario.Title,
                session.SelectedHero,
                session.Status,
                session.HeadTurnId,
                session.HeadTurn == null ? null : session.HeadTurn.Position,
                session.Turns.Count,
                session.Summaries
                    .OrderByDescending(summary => summary.ToPosition)
                    .ThenByDescending(summary => summary.Version)
                    .ThenByDescending(summary => summary.Id)
                    .Select(summary => summary.Body)
                    .FirstOrDefault(),
                session.CreatedAt,
                session.UpdatedAt))
            .ToListAsync(cancellationToken);

        return sessionSummaries
            .OrderByDescending(session => session.UpdatedAt)
            .ThenBy(session => session.Id, StringComparer.Ordinal)
            .ToList();
    }
}
