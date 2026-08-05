using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.AiProviders.Application;
using Myriale.Api.Infrastructure.Persistence;
using Myriale.Api.Features.AiProviders.Infrastructure;

namespace Myriale.Api.Tests;

public sealed class AiProviderSettingsDomainSliceTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.Parse("2026-08-04T00:00:00Z");

    [Fact]
    public void Aggregate_EncapsulatesActivationAndIncrementsRevision()
    {
        var settings = AiProviderRuntimeSettings.Create(new AiProviderProfileId("OPENAI"), Now);

        Assert.Equal(new AiProviderProfileId("openai"), settings.ActiveProvider);
        Assert.Equal(1, settings.Revision);
        Assert.False(settings.Activate(new AiProviderProfileId("openai"), Now.AddMinutes(1)));
        Assert.Equal(1, settings.Revision);
        Assert.True(settings.Activate(new AiProviderProfileId("RunPod"), Now.AddMinutes(2)));
        Assert.Equal(new AiProviderProfileId("runpod"), settings.ActiveProvider);
        Assert.Equal(2, settings.Revision);
        Assert.Equal(Now.AddMinutes(2), settings.UpdatedAt);
    }

    [Fact]
    public void AggregateMutationIsEncapsulatedAndRevisionIsConcurrencyToken()
    {
        foreach (var property in new[]
                 {
                     nameof(AiProviderRuntimeSettings.Id), nameof(AiProviderRuntimeSettings.ActiveProvider),
                     nameof(AiProviderRuntimeSettings.Revision), nameof(AiProviderRuntimeSettings.UpdatedAt),
                 })
            Assert.False(typeof(AiProviderRuntimeSettings).GetProperty(property)!.SetMethod!.IsPublic, property);

        using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite("Data Source=:memory:").Options);
        Assert.True(db.Model.FindEntityType(typeof(AiProviderRuntimeSettings))!
            .FindProperty(nameof(AiProviderRuntimeSettings.Revision))!.IsConcurrencyToken);
    }

    [Fact]
    public void ActivateHandler_DoesNotDependOnApplicationDbContext()
    {
        var handler = typeof(AiAdminEndpoints).GetMethod("ActivateAsync", BindingFlags.Static | BindingFlags.NonPublic);
        Assert.NotNull(handler);
        Assert.DoesNotContain(handler!.GetParameters(), parameter => parameter.ParameterType == typeof(ApplicationDbContext));
    }

    [Fact]
    public async Task ActiveProviderQuery_UsesSelectionThenCatalogFallbackWithoutWriting()
    {
        var catalog = new FakeCatalog(Profiles(), "narrative-default");
        var selected = await new ActiveAiProviderQueryService(new FakeReader(new ActiveAiProviderSelection(new AiProviderProfileId("configured"), 1)), catalog).GetActiveProviderAsync(default);
        var fallback = await new ActiveAiProviderQueryService(new FakeReader(new ActiveAiProviderSelection(new AiProviderProfileId("missing"), 3)), catalog).GetActiveProviderAsync(default);
        Assert.Equal(new AiProviderProfileId("configured"), selected);
        Assert.Equal(new AiProviderProfileId("narrative-default"), fallback);
    }

    [Theory]
    [InlineData(false, false, ActivateAiProviderOutcome.UnknownProvider)]
    [InlineData(true, false, ActivateAiProviderOutcome.CredentialMissing)]
    public async Task ActivateCommand_ReportsProfileAndCredentialFailures(
        bool profileExists,
        bool credentialExists,
        ActivateAiProviderOutcome expected)
    {
        var catalog = new FakeCatalog(profileExists ? Profiles() : new Dictionary<AiProviderProfileId, AiProfileDescriptor>(), "narrative-default");
        var useCase = new ActivateAiProviderUseCase(
            new FakeRepository(), catalog, new FakeCredentialResolver(credentialExists ? "secret" : null), new FixedTimeProvider(Now));

        var result = await useCase.ExecuteAsync(new ActivateAiProviderCommand(new AiProviderProfileId("configured")), default);

        Assert.Equal(expected, result.Outcome);
    }

    [Fact]
    public async Task ActivateCommand_CreatesSingletonAndReportsRepositoryConflict()
    {
        var repository = new FakeRepository { SaveOutcome = ActiveAiProviderSettingsSaveOutcome.Conflict };
        var useCase = new ActivateAiProviderUseCase(
            repository, new FakeCatalog(Profiles(), "narrative-default"), new FakeCredentialResolver("secret"), new FixedTimeProvider(Now));

        var result = await useCase.ExecuteAsync(new ActivateAiProviderCommand(new AiProviderProfileId("configured")), default);

        Assert.Equal(ActivateAiProviderOutcome.Conflict, result.Outcome);
        Assert.NotNull(repository.Settings);
        Assert.Equal(1, repository.Settings!.Revision);
    }

    [Fact]
    public async Task ActivateCommand_ActivatesProfileAndRejectsStaleExpectedRevision()
    {
        var repository = new FakeRepository { Settings = AiProviderRuntimeSettings.Create(new AiProviderProfileId("narrative-default"), Now) };
        var useCase = new ActivateAiProviderUseCase(
            repository, new FakeCatalog(Profiles(), "narrative-default"), new FakeCredentialResolver("secret"), new FixedTimeProvider(Now.AddMinutes(1)));

        var success = await useCase.ExecuteAsync(new ActivateAiProviderCommand(new AiProviderProfileId("configured"), 1), default);
        var stale = await useCase.ExecuteAsync(new ActivateAiProviderCommand(new AiProviderProfileId("narrative-default"), 1), default);

        Assert.Equal(ActivateAiProviderOutcome.Success, success.Outcome);
        Assert.Equal(2, success.Revision);
        Assert.Equal(ActivateAiProviderOutcome.Conflict, stale.Outcome);
        Assert.Equal(new AiProviderProfileId("configured"), repository.Settings!.ActiveProvider);
    }

    [Fact]
    public async Task EfRepository_MapsStaleUpdateToConflict()
    {
        var path = Path.Combine(Path.GetTempPath(), $"myriale-provider-settings-{Guid.NewGuid():N}.db");
        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite($"Data Source={path}").Options;
        try
        {
            await using (var setup = new ApplicationDbContext(options))
            {
                await setup.Database.EnsureCreatedAsync();
                setup.AiProviderRuntimeSettings.Add(AiProviderRuntimeSettings.Create(new AiProviderProfileId("configured"), Now));
                await setup.SaveChangesAsync();
            }

            await using var firstDb = new ApplicationDbContext(options);
            await using var secondDb = new ApplicationDbContext(options);
            var first = new EfActiveAiProviderSettingsRepository(firstDb);
            var second = new EfActiveAiProviderSettingsRepository(secondDb);
            (await first.LoadAsync(default))!.Activate(new AiProviderProfileId("narrative-default"), Now.AddMinutes(1));
            (await second.LoadAsync(default))!.Activate(new AiProviderProfileId("other"), Now.AddMinutes(1));

            Assert.Equal(ActiveAiProviderSettingsSaveOutcome.Saved, await first.SaveAsync(default));
            Assert.Equal(ActiveAiProviderSettingsSaveOutcome.Conflict, await second.SaveAsync(default));
        }
        finally
        {
            if (File.Exists(path)) File.Delete(path);
        }
    }

    [Fact]
    public async Task EfRepository_MapsSimultaneousSingletonCreateRaceToConflict()
    {
        var path = Path.Combine(Path.GetTempPath(), $"myriale-provider-settings-create-{Guid.NewGuid():N}.db");
        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite($"Data Source={path}").Options;
        try
        {
            await using (var setup = new ApplicationDbContext(options)) await setup.Database.EnsureCreatedAsync();
            await using var firstDb = new ApplicationDbContext(options);
            await using var secondDb = new ApplicationDbContext(options);
            var first = new EfActiveAiProviderSettingsRepository(firstDb);
            var second = new EfActiveAiProviderSettingsRepository(secondDb);
            first.Add(AiProviderRuntimeSettings.Create(new AiProviderProfileId("configured"), Now));
            second.Add(AiProviderRuntimeSettings.Create(new AiProviderProfileId("narrative-default"), Now));

            Assert.Equal(ActiveAiProviderSettingsSaveOutcome.Saved, await first.SaveAsync(default));
            Assert.Equal(ActiveAiProviderSettingsSaveOutcome.Conflict, await second.SaveAsync(default));
        }
        finally
        {
            if (File.Exists(path)) File.Delete(path);
        }
    }

    private static Dictionary<AiProviderProfileId, AiProfileDescriptor> Profiles() => new()
    {
        [new AiProviderProfileId("configured")] = new(new AiProviderProfileId("configured"), "Configured", "https://configured.test/v1", "model", new AiCredentialId("configured"), true, AiProfileDefinitionSource.Deployment, 0),
        [new AiProviderProfileId("narrative-default")] = new(new AiProviderProfileId("narrative-default"), "Default", "https://default.test/v1", "model", new AiCredentialId("default"), true, AiProfileDefinitionSource.Deployment, 0),
    };

    private sealed class FakeRepository : IActiveAiProviderSettingsRepository
    {
        public AiProviderRuntimeSettings? Settings { get; set; }
        public ActiveAiProviderSettingsSaveOutcome SaveOutcome { get; init; } = ActiveAiProviderSettingsSaveOutcome.Saved;
        public Task<AiProviderRuntimeSettings?> LoadAsync(CancellationToken cancellationToken) => Task.FromResult(Settings);
        public void Add(AiProviderRuntimeSettings settings) => Settings = settings;
        public Task<ActiveAiProviderSettingsSaveOutcome> SaveAsync(CancellationToken cancellationToken) => Task.FromResult(SaveOutcome);
    }

    private sealed class FakeReader(ActiveAiProviderSelection? selection) : IActiveAiProviderSettingsReader
    {
        public Task<ActiveAiProviderSelection?> GetAsync(CancellationToken cancellationToken) => Task.FromResult(selection);
    }

    private sealed class FakeCredentialResolver(string? credential) : IAiRuntimeCredentialResolver
    {
        public Task<ResolvedAiCredential?> ResolveAsync(AiCredentialId credentialId, CancellationToken cancellationToken) => Task.FromResult(credential is null ? null : new ResolvedAiCredential(credential, AiCredentialSource.Database, 1, "masked"));
    }

    private sealed class FakeCatalog(IReadOnlyDictionary<AiProviderProfileId, AiProfileDescriptor> profiles, string narrativeDefaultValue) : IAiProfileCatalog
    {
        private AiProviderProfileId NarrativeDefault { get; } = new(narrativeDefaultValue);

        public Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken cancellationToken) =>
            Task.FromResult(new AiProfileCatalogSnapshot(profiles, NarrativeDefault, NarrativeDefault));
        public Task<AiProfileDescriptor> ResolveAsync(AiProviderProfileId profileId, CancellationToken cancellationToken) =>
            profiles.TryGetValue(profileId, out var profile)
                ? Task.FromResult(profile)
                : Task.FromException<AiProfileDescriptor>(new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "missing", false));
        public async Task<AiProviderProfileId> ResolveActionDecisionProfileIdAsync(AiProviderProfileId? requested, CancellationToken cancellationToken) =>
            (await ResolveAsync(requested ?? NarrativeDefault, cancellationToken)).Id;
        public async Task<AiProviderProfileId> ResolveNarrativeProfileIdAsync(AiProviderProfileId? requested, CancellationToken cancellationToken) =>
            (await ResolveAsync(requested ?? NarrativeDefault, cancellationToken)).Id;
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
