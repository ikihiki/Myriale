
namespace Myriale.Api.Features.AiProviders.Contracts;

public sealed record AiProfileResponse(AiProviderProfileId Id, string DisplayName);
public sealed record AiProfilesResponse(IReadOnlyList<AiProfileResponse> Profiles, AiProviderProfileId DefaultActionDecisionProfileId, AiProviderProfileId DefaultNarrativeProfileId);
public sealed record AiAdminProfileResponse(AiProviderProfileId Id, string DisplayName, string Adapter, string BaseUrl, string Model, string SystemPrompt, AiCredentialId CredentialId, bool Enabled, string Source, long Revision, bool Active, string CredentialSource, bool CredentialConfigured, long CredentialRevision, string ValidationStatus, DateTimeOffset? LastValidatedAt);
public sealed record AiAdminCredentialResponse(AiCredentialId Id, string DisplayName, string MaskedSecret, string Source, long Revision, DateTimeOffset UpdatedAt, int ReferencedProfileCount);
public sealed record CreateAiProviderProfileRequest(AiProviderProfileId Id, string DisplayName, string BaseUrl, string Model, string SystemPrompt, AiCredentialId CredentialId, bool Enabled = true);
public sealed record UpdateAiProviderProfileRequest(string DisplayName, string BaseUrl, string Model, string SystemPrompt, AiCredentialId CredentialId, long ExpectedRevision);
public sealed record ExpectedRevisionRequest(long ExpectedRevision);
public sealed record SetAiCredentialRequest(AiCredentialId Id, string DisplayName, string Secret);
public sealed record ReplaceAiCredentialRequest(string DisplayName, string Secret, long ExpectedRevision);
public sealed record ActivateAiProviderRequest(AiProviderProfileId Provider, long? ExpectedRevision = null);
public sealed record AiProfileTestRequest(long ExpectedProfileRevision, long ExpectedCredentialRevision);
public sealed record AiPromptTestRequest(string Prompt, long ExpectedProfileRevision, long ExpectedCredentialRevision);
public sealed record AiConnectionTestResponse(AiProviderProfileId ProfileId, long ProfileRevision, AiCredentialId CredentialId, long CredentialRevision, string Status, DateTimeOffset TestedAt);
public sealed record AiPromptTestResponse(AiProviderProfileId Provider, string Model, string Response, int? InputTokens, int? OutputTokens, long LatencyMilliseconds, string? FinishReason);
public sealed record AiConversationMessageRequest(string Role, string Content);
public sealed record AiConversationGenerationOverridesRequest(double? Temperature = null, double? TopP = null, int? MaximumOutputTokens = null, long? Seed = null, int? RetryAttempts = null);
public sealed record AiConversationTestRequest(IReadOnlyList<AiConversationMessageRequest?> Messages, AiConversationGenerationOverridesRequest? GenerationOverrides, long ExpectedProfileRevision, long ExpectedCredentialRevision, string? ClientRequestId = null);
public sealed record AiConversationMessageResponse(string Role, string Content);
public sealed record AiConversationTestResponse(AiConversationMessageResponse Message, AiProviderProfileId Provider, string Model, string? ResponseId, int? InputTokens, int? OutputTokens, long LatencyMilliseconds, int AttemptCount, string? FinishReason, string? RequestId);
public sealed record AiConversationTestErrorResponse(string Code, string Message, bool Retryable, string? RequestId = null);
public sealed record AiAdminErrorResponse(string Message, IReadOnlyDictionary<string, string[]> Errors);

