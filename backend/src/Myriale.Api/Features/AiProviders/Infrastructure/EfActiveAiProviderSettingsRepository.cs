using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Myriale.Api.Features.AiProviders.Application;
using Myriale.Api.Data;

namespace Myriale.Api.Features.AiProviders.Infrastructure;

public sealed class EfActiveAiProviderSettingsRepository(ApplicationDbContext db)
    : IActiveAiProviderSettingsRepository, IActiveAiProviderSettingsReader
{
    public Task<AiProviderRuntimeSettings?> LoadAsync(CancellationToken cancellationToken) =>
        db.AiProviderRuntimeSettings.SingleOrDefaultAsync(
            settings => settings.Id == AiProviderRuntimeSettings.DefaultId,
            cancellationToken);

    public void Add(AiProviderRuntimeSettings settings) => db.AiProviderRuntimeSettings.Add(settings);

    public async Task<ActiveAiProviderSettingsSaveOutcome> SaveAsync(CancellationToken cancellationToken)
    {
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return ActiveAiProviderSettingsSaveOutcome.Saved;
        }
        catch (DbUpdateConcurrencyException)
        {
            return ActiveAiProviderSettingsSaveOutcome.Conflict;
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            // The singleton row can be created concurrently. Its primary-key uniqueness is the
            // database-authoritative fence, and the losing command is reported as a stable conflict.
            return ActiveAiProviderSettingsSaveOutcome.Conflict;
        }
    }

    private static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is SqliteException { SqliteErrorCode: 19 }
        || exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };

    public Task<ActiveAiProviderSelection?> GetAsync(CancellationToken cancellationToken) =>
        db.AiProviderRuntimeSettings.AsNoTracking()
            .Where(settings => settings.Id == AiProviderRuntimeSettings.DefaultId)
            .Select(settings => new ActiveAiProviderSelection(settings.ActiveProvider, settings.Revision))
            .SingleOrDefaultAsync(cancellationToken);
}
