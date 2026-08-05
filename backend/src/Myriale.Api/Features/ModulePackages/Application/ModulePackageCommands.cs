using Myriale.Api.Features.ModulePackages;

namespace Myriale.Api.Features.ModulePackages.Application;

public sealed record ModulePackageInstallResult(ModulePackageSnapshot Package, bool Created);
public sealed record ModulePackageScanIssue(string FileName, string Message);
public sealed record ModulePackageScanResult(int Installed, int Unchanged, int Missing, IReadOnlyList<ModulePackageScanIssue> Issues);

public sealed class InstallModulePackageCommand(
    IModulePackageRepository repository,
    IModulePackageArtifactStore artifacts,
    IModulePackageInspector inspector)
{
    public async Task<ModulePackageInstallResult> ExecuteAsync(Stream input, CancellationToken cancellationToken)
    {
        var staged = await artifacts.StageAsync(input, cancellationToken);
        try
        {
            await using var stagedInput = await artifacts.OpenStagedAsync(staged, cancellationToken);
            var inspection = await inspector.InspectAsync(staged.Digest, stagedInput, cancellationToken);
            var existing = await repository.GetTrackedAsync(staged.Digest, cancellationToken);
            var identity = await repository.FindIdentityAsync(inspection.ModuleId, inspection.Version, cancellationToken);
            if (identity is not null && identity.Digest != inspection.Digest)
                throw new ModulePackageValidationException("同じモジュールIDとバージョンの異なるパッケージは登録できません。");

            var created = existing is null;
            var package = existing ?? ModulePackage.Install(inspection, DateTimeOffset.UtcNow);
            if (created && await repository.AddAsync(package, cancellationToken) == ModulePackageAddOutcome.Conflict)
            {
                package = await repository.GetTrackedAsync(inspection.Digest, cancellationToken)
                    ?? throw new ModulePackageValidationException("同じモジュールIDとバージョンの異なるパッケージは登録できません。");
                created = false;
            }

            var current = package.ToSnapshot();
            if (current.Status == ModulePackageStatus.Verified)
            {
                var verified = await artifacts.VerifyAsync(current, cancellationToken);
                if (verified.IsValid) return new(current, false);
            }

            await artifacts.PromoteAsync(staged, inspection, cancellationToken);
            package.MarkVerified(DateTimeOffset.UtcNow);
            await repository.SaveAsync(cancellationToken);
            return new(package.ToSnapshot(), created);
        }
        finally
        {
            await artifacts.DeleteStagedAsync(staged, CancellationToken.None);
        }
    }
}

public sealed class EnableModulePackageCommand(IModulePackageRepository repository, IModulePackageArtifactStore artifacts)
{
    public async Task<ModulePackageSnapshot?> ExecuteAsync(ModulePackageDigest digest, long expectedRevision, CancellationToken cancellationToken)
    {
        var package = await repository.GetTrackedAsync(digest, cancellationToken);
        if (package is null) return null;
        var verification = await artifacts.VerifyAsync(package.ToSnapshot(), cancellationToken);
        if (!verification.IsValid) throw new ModulePackageUnavailableException(verification.Error ?? "Module package artifacts are unavailable.");
        package.Enable(expectedRevision);
        await repository.SaveAsync(cancellationToken);
        return package.ToSnapshot();
    }
}

public sealed class DisableModulePackageCommand(IModulePackageRepository repository)
{
    public async Task<ModulePackageSnapshot?> ExecuteAsync(ModulePackageDigest digest, long expectedRevision, CancellationToken cancellationToken)
    {
        var package = await repository.GetTrackedAsync(digest, cancellationToken);
        if (package is null) return null;
        package.Disable(expectedRevision);
        await repository.SaveAsync(cancellationToken);
        return package.ToSnapshot();
    }
}

public sealed class RescanModulePackagesCommand(
    IModulePackageRepository repository,
    IModulePackageArtifactStore artifacts,
    InstallModulePackageCommand install)
{
    public async Task<ModulePackageScanResult> ExecuteAsync(CancellationToken cancellationToken)
    {
        var installed = 0; var unchanged = 0; var missing = 0; var issues = new List<ModulePackageScanIssue>();
        await foreach (var inbox in artifacts.EnumerateInboxAsync(cancellationToken))
        {
            try
            {
                await using var stream = await artifacts.OpenInboxAsync(inbox, cancellationToken);
                var result = await install.ExecuteAsync(stream, cancellationToken);
                if (result.Created) installed++; else unchanged++;
                await artifacts.DeleteInboxAsync(inbox, cancellationToken);
            }
            catch (Exception exception) when (exception is IOException or InvalidDataException or ModulePackageValidationException or ModulePackageConcurrencyException)
            { issues.Add(new(inbox.Name, exception.Message)); }
        }

        var packages = await repository.ListTrackedAsync(cancellationToken);
        foreach (var package in packages)
        {
            try
            {
                var snapshot = package.ToSnapshot();
                var verification = await artifacts.VerifyAsync(snapshot, cancellationToken);
                if (!verification.IsValid && !verification.IsMissing)
                {
                    try { await artifacts.RepairAsync(snapshot, cancellationToken); verification = await artifacts.VerifyAsync(snapshot, cancellationToken); }
                    catch (Exception exception) when (exception is IOException or InvalidDataException or ModulePackageValidationException)
                    { verification = new(false, false, exception.Message); }
                }
                if (verification.IsValid)
                {
                    if (package.Status != ModulePackageStatus.Verified) { package.MarkVerified(DateTimeOffset.UtcNow); await repository.SaveAsync(cancellationToken); }
                    continue;
                }
                if (verification.IsMissing) package.MarkMissing(verification.Error ?? "モジュールファイルが見つかりません。", DateTimeOffset.UtcNow);
                else package.MarkInvalid(verification.Error ?? "モジュールの整合性を確認できません。", DateTimeOffset.UtcNow);
                await repository.SaveAsync(cancellationToken); missing++;
            }
            catch (ModulePackageConcurrencyException) { issues.Add(new(package.Digest.AsPrimitive(), "モジュールパッケージが同時に更新されました。再実行してください。")); }
        }
        return new(installed, unchanged, missing, issues);
    }
}
