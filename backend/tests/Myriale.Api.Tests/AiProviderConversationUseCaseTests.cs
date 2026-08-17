using Microsoft.Extensions.AI;

namespace Myriale.Api.Tests;

public sealed class AiProviderConversationUseCaseTests
{
    [Fact]
    public async Task Conversation_ReturnsConflictWhenProfileRevisionChangesDuringProviderCall()
    {
        var profile = new AiProfileDescriptor(new("profile"), "Profile", "https://provider.test/v1", "model", new("credential"), true, AiProfileDefinitionSource.Database, 1);
        var catalog = new MutableCatalog(profile);
        var conversation = new CallbackConversationService(() => catalog.Profile = catalog.Profile with { Revision = 2 });
        var useCases = new AiProviderTestUseCases(catalog, new CredentialResolver(), new CredentialRepository(), new TextService(), conversation, TimeProvider.System);

        var result = await useCases.ConversationAsync(new(new("profile"), [new("user", "hello")], null, 1, 1), default);

        Assert.Equal(AiAdministrationOutcome.Conflict, result.Outcome);
        Assert.Null(result.Value);
    }

    private sealed class MutableCatalog(AiProfileDescriptor profile) : IAiProfileCatalog
    {
        public AiProfileDescriptor Profile { get; set; } = profile;
        public Task<AiProfileDescriptor> ResolveAsync(AiProviderProfileId profileId, CancellationToken ct) => Task.FromResult(Profile);
        public Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken ct) => Task.FromResult(new AiProfileCatalogSnapshot(new Dictionary<AiProviderProfileId, AiProfileDescriptor> { [Profile.Id] = Profile }, Profile.Id, Profile.Id));
        public Task<AiProviderProfileId> ResolveActionDecisionProfileIdAsync(AiProviderProfileId? requested, CancellationToken ct) => Task.FromResult(requested ?? Profile.Id);
        public Task<AiProviderProfileId> ResolveNarrativeProfileIdAsync(AiProviderProfileId? requested, CancellationToken ct) => Task.FromResult(requested ?? Profile.Id);
    }

    private sealed class CredentialResolver : IAiRuntimeCredentialResolver
    {
        public Task<ResolvedAiCredential?> ResolveAsync(AiCredentialId id, CancellationToken ct) => Task.FromResult<ResolvedAiCredential?>(new("secret", AiCredentialSource.Database, 1, "hint"));
    }

    private sealed class CallbackConversationService(Action callback) : IAiConversationService
    {
        public Task<AiConversationResponse> GenerateForProfileAsync(AiProviderProfileId profileId, AiConversationRequest request, CancellationToken ct) => GenerateForProviderAsync(profileId, "secret", request, ct);
        public Task<AiConversationResponse> GenerateForProviderAsync(AiProviderProfileId provider, string credential, AiConversationRequest request, CancellationToken ct)
        {
            callback();
            return Task.FromResult(new AiConversationResponse("response", new(provider, "model", "response-id", 1, 1, 1, 1, "stop")));
        }
    }

    private sealed class TextService : IAiTextService
    {
        public Task<AiTextResponse> GenerateAsync(AiTextRequest request, CancellationToken ct) => throw new NotSupportedException();
        public Task<AiTextResponse> GenerateForProviderAsync(AiProviderProfileId provider, string credential, AiTextRequest request, CancellationToken ct) => throw new NotSupportedException();
        public Task TestConnectionAsync(AiProviderProfileId provider, string credential, CancellationToken ct) => throw new NotSupportedException();
    }

    private sealed class CredentialRepository : IAiCredentialRepository
    {
        public Task<IReadOnlyList<AiCredential>> ListAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<AiCredential>>([]);
        public Task<AiCredential?> LoadAsync(AiCredentialId id, CancellationToken ct) => Task.FromResult<AiCredential?>(null);
        public void Add(AiCredential credential) => throw new NotSupportedException();
        public void Remove(AiCredential credential) => throw new NotSupportedException();
        public void AddValidation(AiProviderProfileValidation validation) => throw new NotSupportedException();
        public Task<AiProviderProfileValidation?> GetLatestValidationAsync(AiProviderProfileId profileId, CancellationToken ct) => Task.FromResult<AiProviderProfileValidation?>(null);
        public Task<bool> SaveAsync(CancellationToken ct) => Task.FromResult(true);
    }
}
