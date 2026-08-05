using System.Reflection;
using System.Security.Cryptography;
using Myriale.Api.Features.ModulePackages.Application;
using Myriale.Api.Infrastructure.Composition.Sessions;
using Myriale.Api.Features.ModulePackages;
using Myriale.Api.Features.ModuleExecutions.Infrastructure;
using Myriale.Api.Features.ModulePackages.Infrastructure;
using Myriale.Api.Features.ModuleUi.Infrastructure;
using Myriale.ModuleSdk;

namespace Myriale.Api.Tests;

public sealed class ModulePackageDomainSliceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 4, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void MissingAndInvalidPackagesAreDisabledAndCannotBeEnabled()
    {
        var package = ModulePackage.Install(Inspection(Digest('a')), Now);
        Assert.Equal(ModulePackageStatus.Staged, package.Status);
        Assert.False(package.IsEnabled);
        Assert.Throws<ModulePackageUnavailableException>(() => package.Enable(package.Revision));

        package.MarkVerified(Now.AddMinutes(1));
        package.Enable(package.Revision);
        Assert.True(package.IsAvailable);
        package.MarkMissing("missing", Now.AddMinutes(2));
        Assert.False(package.IsEnabled);
        Assert.False(package.IsAvailable);
        Assert.Throws<ModulePackageUnavailableException>(() => package.Enable(package.Revision));

        package.MarkVerified(Now.AddMinutes(3));
        package.Enable(package.Revision);
        package.MarkInvalid("hash mismatch", Now.AddMinutes(4));
        Assert.False(package.IsEnabled);
        Assert.Equal(ModulePackageStatus.Invalid, package.Status);
    }

    [Fact]
    public void EnableAndDisableRequireCurrentRevision()
    {
        var package = ModulePackage.Install(Inspection(Digest('a')), Now);
        package.MarkVerified(Now);
        var stale = package.Revision - 1;
        Assert.Throws<ModulePackageRevisionConflictException>(() => package.Enable(stale));
        package.Enable(package.Revision);
        Assert.Throws<ModulePackageRevisionConflictException>(() => package.Disable(stale));
    }

    [Fact]
    public async Task InstallIsIdempotentByDigestAndRejectsIdentityWithDifferentDigest()
    {
        var repository = new FakeRepository();
        var artifacts = new FakeArtifactStore();
        var command = new InstallModulePackageCommand(repository, artifacts, new FakeInspector());
        await using var firstInput = new MemoryStream([1, 2, 3]);
        var first = await command.ExecuteAsync(firstInput, default);
        Assert.True(first.Created);
        Assert.Equal(ModulePackageStatus.Verified, first.Package.Status);

        await using var replayInput = new MemoryStream([1, 2, 3]);
        var replay = await command.ExecuteAsync(replayInput, default);
        Assert.False(replay.Created);
        Assert.Equal(first.Package.Digest, replay.Package.Digest);

        await using var conflictInput = new MemoryStream([4, 5, 6]);
        await Assert.ThrowsAsync<ModulePackageValidationException>(() => command.ExecuteAsync(conflictInput, default));
    }

    [Fact]
    public async Task PromotionFailureLeavesDisabledStagedCatalogRowAndRetryRepairsIt()
    {
        var repository = new FakeRepository();
        var artifacts = new FakeArtifactStore { FailPromotion = true };
        var command = new InstallModulePackageCommand(repository, artifacts, new FakeInspector());
        await using var input = new MemoryStream([7, 8, 9]);
        await Assert.ThrowsAsync<IOException>(() => command.ExecuteAsync(input, default));
        var staged = Assert.Single(repository.Rows);
        Assert.Equal(ModulePackageStatus.Staged, staged.Status);
        Assert.False(staged.IsEnabled);

        artifacts.FailPromotion = false;
        await using var retry = new MemoryStream([7, 8, 9]);
        var repaired = await command.ExecuteAsync(retry, default);
        Assert.False(repaired.Created);
        Assert.Equal(ModulePackageStatus.Verified, repaired.Package.Status);
    }

    [Fact]
    public void ArchitectureUsesOneCatalogAndLegacyServicesAreAbsent()
    {
        var assembly = typeof(ModulePackage).Assembly;
        Assert.Null(assembly.GetType("Myriale.Api.Features.ModulePackages.IModulePackageService"));
        Assert.Null(assembly.GetType("Myriale.Api.Features.ModulePackages.ModulePackageService"));
        Assert.Null(assembly.GetType("Myriale.Api.Features.ModulePackages.Infrastructure.IModulePackageRuntimeCatalog"));
        Assert.Null(assembly.GetType("Myriale.Api.Features.ModulePackages.Infrastructure.ModulePackageRuntimeCatalog"));
        Assert.Contains(typeof(DotNetModuleRuntime).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public).Single().GetParameters(), x => x.ParameterType == typeof(IModulePackageCatalogService));
        Assert.Contains(typeof(ModuleUiResourceService).GetConstructors().Single().GetParameters(), x => x.ParameterType == typeof(IModulePackageCatalogService));
        Assert.Contains(typeof(ModuleExecutionWorkflow).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public).Single().GetParameters(), x => x.ParameterType == typeof(IModulePackageCatalogService));
        Assert.Contains(typeof(CreateSessionUseCase).GetConstructors().Single().GetParameters(), x => x.ParameterType == typeof(IModulePackageCatalogService));
        Assert.All(typeof(ModuleAdminEndpoints).GetMethods(BindingFlags.Static | BindingFlags.NonPublic), method =>
            Assert.DoesNotContain(method.GetParameters(), x => x.ParameterType == typeof(ModulePackage)));
        Assert.DoesNotContain(typeof(ModulePackage).GetProperties(), property => property.SetMethod?.IsPublic == true);
        Assert.Equal(typeof(ModuleExecutionPackageSnapshot), typeof(ModuleExecution).GetMethod(nameof(ModuleExecution.Create))!.GetParameters()[2].ParameterType);
    }

    private static ModulePackageInspection Inspection(ModulePackageDigest digest) => new(
        digest, new("com.myriale.test"), new("1.0.0"), Manifest(), ModulePackageFormat.Dll,
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "module.dll" });

    private static ModuleManifest Manifest() => new(
        "com.myriale.test", "1.0.0", "Test", "Test module", ModuleContractVersions.V1,
        new(1, 1, []), new(null, null, null), [], new(1024, 1024, 1024, 0));

    private static ModulePackageDigest Digest(char value) => new(new string(value, 64));

    private sealed class FakeInspector : IModulePackageInspector
    {
        public Task<ModulePackageInspection> InspectAsync(ModulePackageDigest digest, Stream input, CancellationToken ct) => Task.FromResult(Inspection(digest));
    }

    private sealed class FakeRepository : IModulePackageRepository
    {
        public List<ModulePackage> Rows { get; } = [];
        public Task<IReadOnlyList<ModulePackage>> ListTrackedAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<ModulePackage>>(Rows);
        public Task<ModulePackage?> GetTrackedAsync(ModulePackageDigest digest, CancellationToken ct) => Task.FromResult(Rows.SingleOrDefault(x => x.Digest == digest));
        public Task<ModulePackage?> FindIdentityAsync(ModulePackageModuleId moduleId, ModulePackageVersion version, CancellationToken ct) => Task.FromResult(Rows.SingleOrDefault(x => x.ModuleId == moduleId && x.Version == version));
        public Task<ModulePackageAddOutcome> AddAsync(ModulePackage package, CancellationToken ct) { Rows.Add(package); return Task.FromResult(ModulePackageAddOutcome.Added); }
        public Task SaveAsync(CancellationToken ct) => Task.CompletedTask;
    }

    private sealed class FakeArtifactStore : IModulePackageArtifactStore
    {
        private readonly Dictionary<string, byte[]> staged = [];
        private readonly HashSet<ModulePackageDigest> promoted = [];
        public bool FailPromotion { get; set; }
        public async Task<StagedModulePackage> StageAsync(Stream input, CancellationToken ct)
        {
            using var output = new MemoryStream(); await input.CopyToAsync(output, ct); var bytes = output.ToArray();
            var digest = new ModulePackageDigest(Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant());
            var token = Guid.NewGuid().ToString("N"); staged[token] = bytes; return new(token, digest);
        }
        public Task<Stream> OpenStagedAsync(StagedModulePackage value, CancellationToken ct) => Task.FromResult<Stream>(new MemoryStream(staged[value.Token], false));
        public Task PromoteAsync(StagedModulePackage value, ModulePackageInspection inspection, CancellationToken ct)
        { if (FailPromotion) throw new IOException("promotion failed"); promoted.Add(value.Digest); return Task.CompletedTask; }
        public Task<ModulePackageArtifactVerification> VerifyAsync(ModulePackageSnapshot package, CancellationToken ct) => Task.FromResult(promoted.Contains(package.Digest) ? new ModulePackageArtifactVerification(true, false) : new(false, true));
        public Task DeleteAsync(ModulePackageDigest digest, CancellationToken ct) { promoted.Remove(digest); return Task.CompletedTask; }
        public Task RepairAsync(ModulePackageSnapshot package, CancellationToken ct) { promoted.Add(package.Digest); return Task.CompletedTask; }
        public Task DeleteStagedAsync(StagedModulePackage value, CancellationToken ct) { staged.Remove(value.Token); return Task.CompletedTask; }
        public Task<byte[]> ReadAssemblyAsync(ModulePackageSnapshot package, CancellationToken ct) => throw new NotSupportedException();
        public Task<byte[]> ReadResourceAsync(ModulePackageSnapshot package, string relativePath, CancellationToken ct) => throw new NotSupportedException();
        public async IAsyncEnumerable<ModulePackageInboxArtifact> EnumerateInboxAsync([System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct) { await Task.CompletedTask; yield break; }
        public Task<Stream> OpenInboxAsync(ModulePackageInboxArtifact artifact, CancellationToken ct) => throw new NotSupportedException();
        public Task DeleteInboxAsync(ModulePackageInboxArtifact artifact, CancellationToken ct) => Task.CompletedTask;
    }
}
