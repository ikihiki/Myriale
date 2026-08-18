using System.Text.Json;

namespace Myriale.Api.Features.AiProviders.Contracts;

public sealed record AiSessionChatTestRequest(
    SessionId SessionId,
    string? CurrentUserMessage,
    AiConversationGenerationOverridesRequest? GenerationOverrides,
    long ExpectedProfileRevision,
    long ExpectedCredentialRevision,
    int MaxToolRounds = 2);

public sealed record AiSessionChatMessageResponse(
    string Role,
    string? Content,
    string? ToolCallId = null,
    IReadOnlyList<AiSessionChatToolCallResponse>? ToolCalls = null);

public sealed record AiSessionChatToolCallResponse(string Id, string Name, string ArgumentsJson);

public sealed record AiSessionChatMetadataResponse(
    AiProviderProfileId Provider,
    string Model,
    string? ResponseId,
    int? InputTokens,
    int? OutputTokens,
    long LatencyMilliseconds,
    int AttemptCount,
    string? FinishReason,
    int ProviderRounds,
    int ToolCallCount);

public sealed record AiSessionToolPreviewResponse(
    string ToolCallId,
    string SelectionCode,
    JsonElement Arguments,
    string Status,
    string? ErrorCode,
    string? ObjectCode,
    string? ActionCode,
    IReadOnlyList<RuleAppliedEffect>? AppliedEffects,
    IReadOnlyList<string>? Facts,
    IReadOnlyList<JsonElement>? Events,
    IReadOnlyList<string>? NarrativeHints,
    IReadOnlyList<string>? ForbiddenNarrativeFacts,
    bool? CompletionIntent,
    bool? ExtensionRequested,
    RulePostState? PostState);

public sealed record AiSessionChatTestResponse(
    AiSessionChatMessageResponse Message,
    AiSessionChatMetadataResponse Metadata,
    string SystemMarkdown,
    IReadOnlyList<AiSessionChatMessageResponse> SentMessages,
    IReadOnlyList<AiSessionToolPreviewResponse> ToolPreviews);
