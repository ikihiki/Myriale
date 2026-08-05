namespace Myriale.Api.Features.SessionMemory.Contracts;

public sealed record SessionLorebookEntryResponse(
    SessionNoteId Id,
    string Kind,
    string DisplayName,
    IReadOnlyList<string> Aliases,
    string Content,
    string CanonStatus,
    SessionTurnId? FirstTurnId,
    SessionTurnId? UpdatedFromTurnId,
    string UpdateSource,
    long Revision,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<SessionTurnId> ReferencedByTurnIds);

public sealed record UpsertSessionLorebookEntryRequest(
    string Kind,
    string DisplayName,
    IReadOnlyList<string>? Aliases,
    string Content,
    string CanonStatus,
    SessionTurnId? FirstTurnId = null,
    SessionTurnId? UpdatedFromTurnId = null,
    long? ExpectedRevision = null);

public sealed record SessionSummaryResponse(
    SessionSummaryId Id,
    SessionTurnId FromTurnId,
    SessionTurnId ToTurnId,
    int FromPosition,
    int ToPosition,
    int Version,
    string Confidence,
    string CurrentLocation,
    IReadOnlyList<string> Characters,
    IReadOnlyList<string> Objectives,
    IReadOnlyList<string> Clues,
    IReadOnlyList<string> Inventory,
    IReadOnlyList<string> ModuleResults,
    string Body,
    DateTimeOffset GeneratedAt);

public sealed record SessionMemoryResponse(
    IReadOnlyList<SessionLorebookEntryResponse> Lorebook,
    IReadOnlyList<SessionSummaryResponse> Summaries);
