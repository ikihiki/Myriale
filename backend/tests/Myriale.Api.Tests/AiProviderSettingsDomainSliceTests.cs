using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Myriale.Api.Application.AiProviders;
using Myriale.Api.Data;
using Myriale.Api.Endpoints;
using Myriale.Api.Infrastructure.AiProviders;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class AiProviderSettingsDomainSliceTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.Parse("2026-08-04T00:00:00Z");

    [Fact]
    public void Aggregate_EncapsulatesActivationAndIncrementsRevision()
    {
        var settings = AiProviderRuntimeSettings.Create("OPENAI", Now);

        Assert.Equal("openai", settings.ActiveProvider);
        Assert.Equal(1, settings.Revision);
        Assert.False(settings.Activate("openai", Now.AddMinutes(1)));
        Assert.Equal(1, settings.Revision);
        Assert.True(settings.Activate("RunPod", Now.AddMinutes(2)));
        Assert.Equal("runpod", settings.ActiveProvider);
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
    public async Task ActiveProviderQuery_UsesConfigurationThenCatalogFallbackWithoutWriting()
    {
        var profiles = Profiles();
        var catalog = new FakeCatalog(profiles, "narrative-default");
        var configured = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["AiProvider:Provider"] = "configured",
        }).Build();

        var fromConfiguration = await new ActiveAiProviderQueryService(
            new FakeReader(null), catalog, configured).GetActiveProviderAsync(default);
        var fromCatalog = await new ActiveAiProviderQueryService(
            new FakeReader(new ActiveAiProviderSelection("missing", 3)), catalog,
            new ConfigurationBuilder().Build()).GetActiveProviderAsync(default);

        Assert.Equal("configured", fromConfiguration);
        Assert.Equal("narrative-default", fromCatalog);
    }

    [Theory]
    [InlineData(false, false, ActivateAiProviderOutcome.UnknownProvider)]
    [InlineData(true, false, ActivateAiProviderOutcome.CredentialMissing)]
    public async Task ActivateCommand_ReportsProfileAndCredentialFailures(
        bool profileExists,
        bool credentialExists,
        ActivateAiProviderOutcome expected)
    {
        var catalog = new FakeCatalog(profileExists ? Profiles() : new Dictionary<string, AiProfileDescriptor>(), "narrative-default");
        var useCase = new ActivateAiProviderUseCase(
            new FakeRepository(), catalog, new FakeCredentialStore(credentialExists ? "secret" : null), new FixedTimeProvider(Now));

        var result = await useCase.ExecuteAsync(new ActivateAiProviderCommand("configured"), default);

        Assert.Equal(expected, result.Outcome);
    }

    [Fact]
    public async Task ActivateCommand_CreatesSingletonAndReportsRepositoryConflict()
    {
        var repository = new FakeRepository { SaveOutcome = ActiveAiProviderSettingsSaveOutcome.Conflict };
        var useCase = new ActivateAiProviderUseCase(
            repository, new FakeCatalog(Profiles(), "narrative-default"), new FakeCredentialStore("secret"), new FixedTimeProvider(Now));

        var result = await useCase.ExecuteAsync(new ActivateAiProviderCommand("configured"), default);

        Assert.Equal(ActivateAiProviderOutcome.Conflict, result.Outcome);
        Assert.NotNull(repository.Settings);
        Assert.Equal(1, repository.Settings!.Revision);
    }

    [Fact]
    public async Task ActivateCommand_ActivatesProfileAndRejectsStaleExpectedRevision()
    {
        var repository = new FakeRepository { Settings = AiProviderRuntimeSettings.Create("narrative-default", Now) };
        var useCase = new ActivateAiProviderUseCase(
            repository, new FakeCatalog(Profiles(), "narrative-default"), new FakeCredentialStore("secret"), new FixedTimeProvider(Now.AddMinutes(1)));

        var success = await useCase.ExecuteAsync(new ActivateAiProviderCommand("configured", 1), default);
        var stale = await useCase.ExecuteAsync(new ActivateAiProviderCommand("narrative-default", 1), default);

        Assert.Equal(ActivateAiProviderOutcome.Success, success.Outcome);
        Assert.Equal(2, success.Revision);
        Assert.Equal(ActivateAiProviderOutcome.Conflict, stale.Outcome);
        Assert.Equal("configured", repository.Settings!.ActiveProvider);
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
                setup.AiProviderRuntimeSettings.Add(AiProviderRuntimeSettings.Create("configured", Now));
                await setup.SaveChangesAsync();
            }

            await using var firstDb = new ApplicationDbContext(options);
            await using var secondDb = new ApplicationDbContext(options);
            var first = new EfActiveAiProviderSettingsRepository(firstDb);
            var second = new EfActiveAiProviderSettingsRepository(secondDb);
            (await first.LoadAsync(default))!.Activate("narrative-default", Now.AddMinutes(1));
            (await second.LoadAsync(default))!.Activate("other", Now.AddMinutes(1));

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
            first.Add(AiProviderRuntimeSettings.Create("configured", Now));
            second.Add(AiProviderRuntimeSettings.Create("narrative-default", Now));

            Assert.Equal(ActiveAiProviderSettingsSaveOutcome.Saved, await first.SaveAsync(default));
            Assert.Equal(ActiveAiProviderSettingsSaveOutcome.Conflict, await second.SaveAsync(default));
        }
        finally
        {
            if (File.Exists(path)) File.Delete(path);
        }
    }

    private static Dictionary<string, AiProfileDescriptor> Profiles() => new(StringComparer.OrdinalIgnoreCase)
    {
        ["configured"] = new("configured", "Configured", "openai-compatible", "https://configured.test/v1", "model", "configured", true),
        ["narrative-default"] = new("narrative-default", "Default", "openai-compatible", "https://default.test/v1", "model", "default", true),
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

    private sealed class FakeCredentialStore(string? credential) : IAiCredentialStore
    {
        public Task SaveAsync(string provider, string displayName, string secret, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task<string?> GetAsync(string provider, CancellationToken cancellationToken) => Task.FromResult(credential);
        public Task DeleteAsync(string provider, CancellationToken cancellationToken) => Task.CompletedTask;
        public string Mask(string secret) => "masked";
    }

    private sealed class FakeCatalog(IReadOnlyDictionary<string, AiProfileDescriptor> profiles, string narrativeDefault) : IAiProfileCatalog
    {
        public Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken cancellationToken) =>
            Task.FromResult(new AiProfileCatalogSnapshot(profiles, narrativeDefault, narrativeDefault));
        public Task<AiProfileDescriptor> ResolveAsync(string profileId, CancellationToken cancellationToken) =>
            profiles.TryGetValue(profileId, out var profile)
                ? Task.FromResult(profile)
                : Task.FromException<AiProfileDescriptor>(new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "missing", false));
        public async Task<string> ResolveActionDecisionProfileIdAsync(string? requested, CancellationToken cancellationToken) =>
            (await ResolveAsync(requested ?? narrativeDefault, cancellationToken)).Id;
        public async Task<string> ResolveNarrativeProfileIdAsync(string? requested, CancellationToken cancellationToken) =>
            (await ResolveAsync(requested ?? narrativeDefault, cancellationToken)).Id;
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
