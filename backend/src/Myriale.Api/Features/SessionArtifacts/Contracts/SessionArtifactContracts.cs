using Myriale.Api.Architecture;
namespace Myriale.Api.Features.SessionArtifacts.Contracts;

[CrossSliceContract]
public sealed record SessionArtifactResponse(
    SessionArtifactId Id,
    SessionExecutionId ExecutionId,
    string Kind,
    string Status,
    string Schema,
    string ContentType,
    string? MediaUrl,
    string? MetadataJson,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CommittedAt);

[CrossSliceContract]
public sealed record SessionActivityResponse(string Type, string Id, long Order, string? CausalId = null);

[CrossSliceContract]
public sealed record SessionNoteProposalResponse(
    SessionArtifactId ArtifactId,
    SessionTurnId SourceTurnId,
    SessionNoteId? NoteId,
    long ExpectedNoteRevision,
    string ProposedTitle,
    string BeforeBody,
    string ProposedBody,
    string Rationale,
    string Status,
    DateTimeOffset CreatedAt);

[CrossSliceContract]
public sealed record ReviewSessionNoteProposalRequest(long ExpectedNoteRevision, string? Title = null, string? Body = null);

public sealed class AttachSessionImageRequest
{
    public required IFormFile File { get; init; }
    public required string SessionId { get; init; }
    public required string ExecutionId { get; init; }
    public required string AttemptId { get; init; }
    public required string Checksum { get; init; }
    public required string ModerationDecision { get; init; }
    public string? ModerationMetadataJson { get; init; }
    public string? SourceTurnId { get; init; }
    public string? SourceInputId { get; init; }
    public DateTimeOffset? RetainUntil { get; init; }
}

public sealed record SessionImageAttachmentResponse(
    SessionImageId ImageId,
    SessionArtifactId ArtifactId,
    string MediaUrl,
    string ContentType,
    long SizeBytes,
    int Width,
    int Height,
    string Checksum,
    string ModerationMetadataJson,
    DateTimeOffset CreatedAt,
    DateTimeOffset? RetainUntil);
