using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.AiProviders.Application;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Features.AiProviders.Infrastructure;

public sealed class EfAiProviderProfileRepository(ApplicationDbContext db) : IAiProviderProfileRepository
{
    public async Task<IReadOnlyList<AiProviderProfile>> ListAsync(CancellationToken ct) => await db.AiProviderProfiles.AsNoTracking().OrderBy(x => x.Id).ToListAsync(ct);
    public Task<AiProviderProfile?> LoadAsync(AiProviderProfileId id, CancellationToken ct) => db.AiProviderProfiles.SingleOrDefaultAsync(x => x.Id == id, ct);
    public void Add(AiProviderProfile profile) => db.AiProviderProfiles.Add(profile);
    public void Remove(AiProviderProfile profile) => db.AiProviderProfiles.Remove(profile);
    public Task<bool> IsCredentialReferencedAsync(AiCredentialId id, CancellationToken ct) => db.AiProviderProfiles.AsNoTracking().AnyAsync(x => x.CredentialId == id, ct);
    public async Task<bool> SaveAsync(CancellationToken ct) { try { await db.SaveChangesAsync(ct); return true; } catch (DbUpdateConcurrencyException) { db.ChangeTracker.Clear(); return false; } catch (DbUpdateException ex) when (IsConstraint(ex)) { db.ChangeTracker.Clear(); return false; } }
    private static bool IsConstraint(DbUpdateException ex) => ex.InnerException?.Message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase) == true || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true;
}

public sealed class EfAiCredentialRepository(ApplicationDbContext db) : IAiCredentialRepository
{
    public async Task<IReadOnlyList<AiCredential>> ListAsync(CancellationToken ct) => await db.AiCredentials.AsNoTracking().OrderBy(x => x.Id).ToListAsync(ct);
    public Task<AiCredential?> LoadAsync(AiCredentialId id, CancellationToken ct) => db.AiCredentials.SingleOrDefaultAsync(x => x.Id == id, ct);
    public void Add(AiCredential credential) => db.AiCredentials.Add(credential);
    public void Remove(AiCredential credential) => db.AiCredentials.Remove(credential);
    public void AddValidation(AiProviderProfileValidation validation) => db.AiProviderProfileValidations.Add(validation);
    public async Task<AiProviderProfileValidation?> GetLatestValidationAsync(AiProviderProfileId profileId, CancellationToken ct) =>
        (await db.AiProviderProfileValidations.AsNoTracking().Where(x => x.ProfileId == profileId).ToListAsync(ct))
        .OrderByDescending(x => x.TestedAt).FirstOrDefault();
    public async Task<bool> SaveAsync(CancellationToken ct) { try { await db.SaveChangesAsync(ct); return true; } catch (DbUpdateConcurrencyException) { db.ChangeTracker.Clear(); return false; } catch (DbUpdateException ex) when (IsConstraint(ex)) { db.ChangeTracker.Clear(); return false; } }
    private static bool IsConstraint(DbUpdateException ex) => ex.InnerException?.Message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase) == true || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true;
}
