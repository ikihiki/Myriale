using Myriale.Api.Data;

namespace Myriale.Api.Contracts;

public sealed record AiProfileResponse(string Id, string DisplayName);
public sealed record AiProfilesResponse(IReadOnlyList<AiProfileResponse> Profiles, string DefaultActionDecisionProfileId, string DefaultNarrativeProfileId);
public sealed record AiAdminProfileResponse(string Id, string DisplayName, string Adapter, string BaseUrl, string Model, string CredentialId, bool Enabled, string Source, long Revision, bool Active, string CredentialSource, bool CredentialConfigured, long CredentialRevision, string ValidationStatus, DateTimeOffset? LastValidatedAt);
public sealed record AiAdminCredentialResponse(string Id, string DisplayName, string MaskedSecret, string Source, long Revision, DateTimeOffset UpdatedAt, int ReferencedProfileCount);
public sealed record CreateAiProviderProfileRequest(string Id, string DisplayName, string BaseUrl, string Model, string CredentialId, bool Enabled = true);
public sealed record UpdateAiProviderProfileRequest(string DisplayName, string BaseUrl, string Model, string CredentialId, long ExpectedRevision);
public sealed record ExpectedRevisionRequest(long ExpectedRevision);
public sealed record SetAiCredentialRequest(string Id, string DisplayName, string Secret);
public sealed record ReplaceAiCredentialRequest(string DisplayName, string Secret, long ExpectedRevision);
public sealed record ActivateAiProviderRequest(string Provider, long? ExpectedRevision = null);
public sealed record AiProfileTestRequest(long ExpectedProfileRevision, long ExpectedCredentialRevision);
public sealed record AiPromptTestRequest(string Prompt, long ExpectedProfileRevision, long ExpectedCredentialRevision);
public sealed record AiConnectionTestResponse(string ProfileId, long ProfileRevision, string CredentialId, long CredentialRevision, string Status, DateTimeOffset TestedAt);
public sealed record AiPromptTestResponse(string Provider, string Model, string Response, int? InputTokens, int? OutputTokens, long LatencyMilliseconds, string? FinishReason);
public sealed record AiAdminErrorResponse(string Message, IReadOnlyDictionary<string, string[]> Errors);

public sealed record ScenarioAiAssistRequest(string Kind, string Target, string Title, string Summary, string Genre, string Tone, string Lore, string AiFreedom, string Hero, IReadOnlyList<NarrativeEntityInput> Entities, string Opening, string IllustrationStyle, string IllustrationMood, string IllustrationNegative, string SampleScene);
public sealed record ScenarioAiSuggestion(string Id, string Body, string Rationale);
public sealed record ScenarioAiAssistResponse(string Message, IReadOnlyList<ScenarioAiSuggestion> Suggestions, string? Prompt, string? NegativePrompt, string? PreviewText);
