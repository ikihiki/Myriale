using Microsoft.EntityFrameworkCore;
using Myriale.Api.Application.ModulePackages;
using Myriale.Api.Data;

namespace Myriale.Api.Infrastructure.ModulePackages;

internal sealed class EfModulePackageRepository(ApplicationDbContext db) : IModulePackageRepository
{
    public async Task<IReadOnlyList<ModulePackage>> ListTrackedAsync(CancellationToken cancellationToken) =>
        await db.ModulePackages.OrderBy(x => x.ModuleId).ThenBy(x => x.Version).ToArrayAsync(cancellationToken);

    public Task<ModulePackage?> GetTrackedAsync(ModulePackageDigest digest, CancellationToken cancellationToken) =>
        db.ModulePackages.SingleOrDefaultAsync(x => x.Digest == digest, cancellationToken);

    public Task<ModulePackage?> FindIdentityAsync(ModulePackageModuleId moduleId, ModulePackageVersion version, CancellationToken cancellationToken) =>
        db.ModulePackages.SingleOrDefaultAsync(x => x.ModuleId == moduleId && x.Version == version, cancellationToken);

    public async Task<ModulePackageAddOutcome> AddAsync(ModulePackage package, CancellationToken cancellationToken)
    {
        db.ModulePackages.Add(package);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return ModulePackageAddOutcome.Added;
        }
        catch (DbUpdateException)
        {
            db.ChangeTracker.Clear();
            return ModulePackageAddOutcome.Conflict;
        }
    }

    public async Task SaveAsync(CancellationToken cancellationToken)
    {
        try { await db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException exception) { throw new ModulePackageConcurrencyException("The module package changed concurrently.", exception); }
    }
}

internal sealed class EfModulePackageCatalog(ApplicationDbContext db, IModulePackageArtifactStore artifacts) : IModulePackageCatalog
{
    public async Task<IReadOnlyList<ModulePackageSnapshot>> ListAsync(CancellationToken cancellationToken)
    {
        var rows = await db.ModulePackages.AsNoTracking().OrderBy(x => x.ModuleId).ThenBy(x => x.Version).ToArrayAsync(cancellationToken);
        return rows.Select(x => x.ToSnapshot()).ToArray();
    }

    public async Task<ModulePackageSnapshot?> GetAsync(ModulePackageDigest digest, CancellationToken cancellationToken)
    {
        var row = await db.ModulePackages.AsNoTracking().SingleOrDefaultAsync(x => x.Digest == digest, cancellationToken);
        return row?.ToSnapshot();
    }

    public async Task<ModulePackageResolution> ResolveAsync(ModulePackageModuleId moduleId, ModulePackageVersion version, ModulePackageDigest digest, CancellationToken cancellationToken)
    {
        var row = await db.ModulePackages.AsNoTracking().SingleOrDefaultAsync(x => x.Digest == digest, cancellationToken);
        if (row is null || row.ModuleId != moduleId || row.Version != version) return new(ModulePackageAvailability.NotFound);
        var snapshot = row.ToSnapshot();
        if (!snapshot.IsEnabled) return new(ModulePackageAvailability.Disabled, snapshot);
        if (snapshot.Status != ModulePackageStatus.Verified) return new(ModulePackageAvailability.Unavailable, snapshot);
        var verification = await artifacts.VerifyAsync(snapshot, cancellationToken);
        return verification.IsValid ? new(ModulePackageAvailability.Available, snapshot) : new(ModulePackageAvailability.Unavailable, snapshot);
    }
}

