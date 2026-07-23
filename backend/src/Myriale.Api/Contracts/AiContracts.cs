namespace Myriale.Api.Contracts;

public sealed record AiProviderKeyResponse(
    string Provider,
    string DisplayName,
    bool Configured,
    string MaskedKey,
    string CredentialSource,
    bool Active,
    string Status,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? LastValidatedAt);

public sealed record UpsertAiProviderKeyRequest(string DisplayName, string Secret);
public sealed record ActivateAiProviderRequest(string Provider);

public sealed record AiAdminErrorResponse(string Message, IReadOnlyDictionary<string, string[]> Errors);

public sealed record ScenarioAiAssistRequest(
    string Kind,
    string Target,
    string Title,
    string Summary,
    string Genre,
    string Tone,
    string Lore,
    string AiFreedom,
    string Hero,
    string Opening,
    string IllustrationStyle,
    string IllustrationMood,
    string IllustrationNegative,
    string SampleScene);

public sealed record ScenarioAiSuggestion(string Id, string Body, string Rationale);

public sealed record ScenarioAiAssistResponse(
    string Message,
    IReadOnlyList<ScenarioAiSuggestion> Suggestions,
    string? Prompt,
    string? NegativePrompt,
    string? PreviewText);
