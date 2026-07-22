using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionArtifact
{
    [Key, MaxLength(40)] public string Id { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string ExecutionId { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string AttemptId { get; set; } = string.Empty;
    [Required, MaxLength(32)] public string Kind { get; set; } = string.Empty;
    [Required, MaxLength(32)] public string Status { get; set; } = "draft";
    [Required, MaxLength(160)] public string ContentType { get; set; } = "application/json";
    [MaxLength(500)] public string? StorageKey { get; set; }
    [MaxLength(64)] public string? Checksum { get; set; }
    public string? ContentJson { get; set; }
    public string? MetadataJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ValidatedAt { get; set; }
    public DateTimeOffset? CommittedAt { get; set; }

    public SessionExecution Execution { get; set; } = null!;
    public SessionExecutionAttempt Attempt { get; set; } = null!;
}
