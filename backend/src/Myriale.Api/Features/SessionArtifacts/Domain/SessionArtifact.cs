using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Myriale.Api.Features.SessionArtifacts.Domain;

public enum SessionArtifactKind
{
    RuleActionStep,
    PostStateNarrative,
    NarrativeText,
    NotePatch,
    Image,
}

public enum SessionArtifactStatus
{
    Draft,
    Validated,
    Committed,
}

public enum SessionArtifactSchema
{
    RuleActionStepV1,
    PostStateNarrativeV1,
    NarrativeTextV1,
    NotePatchV1,
    ImageV1,
}

public abstract record SessionArtifactPayload
{
    private protected SessionArtifactPayload(SessionArtifactKind kind, SessionArtifactSchema schema)
    {
        Kind = kind;
        Schema = schema;
    }

    public SessionArtifactKind Kind { get; }
    public SessionArtifactSchema Schema { get; }
}

public sealed record RuleActionStepArtifactPayload(
    string ActionSnapshotJson,
    string? DecisionJson,
    string? SelectedRuleId,
    string? AppliedEffectsJson,
    string? PublicPostStateJson)
    : SessionArtifactPayload(SessionArtifactKind.RuleActionStep, SessionArtifactSchema.RuleActionStepV1);

public sealed record PostStateNarrativeArtifactPayload(string SchemaVersion, string Heading, string Body)
    : SessionArtifactPayload(SessionArtifactKind.PostStateNarrative, SessionArtifactSchema.PostStateNarrativeV1);

public sealed record NarrativeTextArtifactPayload(string Body)
    : SessionArtifactPayload(SessionArtifactKind.NarrativeText, SessionArtifactSchema.NarrativeTextV1);

public sealed record NotePatchArtifactPayload(string Title, string Body)
    : SessionArtifactPayload(SessionArtifactKind.NotePatch, SessionArtifactSchema.NotePatchV1);

public sealed class SessionArtifact
{
    internal SessionArtifact() { }

    [Key, MaxLength(40)] public SessionArtifactId Id { get; internal set; }
    [Required, MaxLength(40)] public SessionId SessionId { get; internal set; }
    [Required, MaxLength(40)] public SessionExecutionId ExecutionId { get; internal set; }
    [Required, MaxLength(40)] public SessionExecutionAttemptId AttemptId { get; internal set; }
    [Required, MaxLength(32)] public SessionArtifactKind Kind { get; internal set; }
    [Required, MaxLength(32)] public SessionArtifactStatus Status { get; internal set; }
    [Required, MaxLength(64)] public SessionArtifactSchema Schema { get; internal set; }
    [Required, MaxLength(160)] public string ContentType { get; internal set; } = string.Empty;
    [MaxLength(500)] public string? StorageKey { get; internal set; }
    [Required, MaxLength(64)] public string Checksum { get; internal set; } = string.Empty;
    public string? PayloadJson { get; internal set; }
    public string? MetadataJson { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset? ValidatedAt { get; internal set; }
    public DateTimeOffset? CommittedAt { get; internal set; }

    public static SessionArtifact CreateCommittedJson(
        SessionArtifactId id,
        SessionId sessionId,
        SessionExecutionId executionId,
        SessionExecutionAttemptId attemptId,
        SessionArtifactPayload payload,
        string? metadataJson,
        DateTimeOffset now,
        JsonSerializerOptions? serializerOptions = null)
    {
        var artifact = CreateDraftJson(id, sessionId, executionId, attemptId, payload, metadataJson, now, serializerOptions);
        artifact.Validate(now);
        artifact.Commit(now);
        return artifact;
    }

    public static SessionArtifact CreateDraftJson(
        SessionArtifactId id,
        SessionId sessionId,
        SessionExecutionId executionId,
        SessionExecutionAttemptId attemptId,
        SessionArtifactPayload payload,
        string? metadataJson,
        DateTimeOffset now,
        JsonSerializerOptions? serializerOptions = null)
    {
        ArgumentNullException.ThrowIfNull(payload);
        ValidatePayload(payload);
        EnsureJsonBacked(payload.Kind, payload.Schema);
        ValidateOptionalJson(metadataJson, nameof(metadataJson));
        var payloadJson = JsonSerializer.Serialize(payload, payload.GetType(), serializerOptions ?? JsonOptions);
        using var _ = JsonDocument.Parse(payloadJson);
        return new SessionArtifact
        {
            Id = id,
            SessionId = sessionId,
            ExecutionId = executionId,
            AttemptId = attemptId,
            Kind = payload.Kind,
            Status = SessionArtifactStatus.Draft,
            Schema = payload.Schema,
            ContentType = "application/json",
            PayloadJson = payloadJson,
            MetadataJson = metadataJson,
            Checksum = Hash(payloadJson),
            CreatedAt = now,
        };
    }

    public static SessionArtifact CreateCommittedImage(
        SessionArtifactId id,
        SessionId sessionId,
        SessionExecutionId executionId,
        SessionExecutionAttemptId attemptId,
        string storageKey,
        string contentType,
        string checksum,
        string moderationMetadataJson,
        DateTimeOffset now)
    {
        var artifact = CreateDraftImage(id, sessionId, executionId, attemptId, storageKey, contentType, checksum, moderationMetadataJson, now);
        artifact.Validate(now);
        artifact.Commit(now);
        return artifact;
    }

    public static SessionArtifact CreateDraftImage(
        SessionArtifactId id,
        SessionId sessionId,
        SessionExecutionId executionId,
        SessionExecutionAttemptId attemptId,
        string storageKey,
        string contentType,
        string checksum,
        string moderationMetadataJson,
        DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(storageKey);
        if (!string.Equals(contentType, "image/png", StringComparison.Ordinal)) throw new ArgumentException("Only PNG image artifacts are supported.", nameof(contentType));
        ValidateChecksum(checksum);
        ValidateOptionalJson(moderationMetadataJson, nameof(moderationMetadataJson));
        return new SessionArtifact
        {
            Id = id,
            SessionId = sessionId,
            ExecutionId = executionId,
            AttemptId = attemptId,
            Kind = SessionArtifactKind.Image,
            Status = SessionArtifactStatus.Draft,
            Schema = SessionArtifactSchema.ImageV1,
            ContentType = contentType,
            StorageKey = storageKey,
            Checksum = checksum,
            MetadataJson = moderationMetadataJson,
            CreatedAt = now,
        };
    }

    public void Validate(DateTimeOffset now)
    {
        if (Status != SessionArtifactStatus.Draft) throw new InvalidOperationException("Only a draft artifact can be validated.");
        var jsonBacked = PayloadJson is not null && StorageKey is null && Kind != SessionArtifactKind.Image;
        var storageBacked = PayloadJson is null && StorageKey is not null && Kind == SessionArtifactKind.Image;
        if (!jsonBacked && !storageBacked) throw new InvalidOperationException("Artifact backing does not match its kind.");
        ValidateChecksum(Checksum);
        Status = SessionArtifactStatus.Validated;
        ValidatedAt = now;
    }

    public void Commit(DateTimeOffset now)
    {
        if (Status == SessionArtifactStatus.Committed) throw new InvalidOperationException("A committed artifact cannot be committed again.");
        if (Status != SessionArtifactStatus.Validated) throw new InvalidOperationException("Only a validated artifact can be committed.");
        Status = SessionArtifactStatus.Committed;
        CommittedAt = now;
    }

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static void ValidatePayload(SessionArtifactPayload payload)
    {
        switch (payload)
        {
            case RuleActionStepArtifactPayload actionStep:
                ValidateRequiredJson(actionStep.ActionSnapshotJson, nameof(actionStep.ActionSnapshotJson));
                ValidateOptionalJson(actionStep.DecisionJson, nameof(actionStep.DecisionJson));
                ValidateOptionalJson(actionStep.AppliedEffectsJson, nameof(actionStep.AppliedEffectsJson));
                ValidateOptionalJson(actionStep.PublicPostStateJson, nameof(actionStep.PublicPostStateJson));
                break;
            case PostStateNarrativeArtifactPayload narrative:
                if (narrative.SchemaVersion != SessionArtifactSchema.PostStateNarrativeV1.ToWireValue())
                    throw new ArgumentException("Post-state narrative payload schema does not match its artifact schema.", nameof(payload));
                ArgumentException.ThrowIfNullOrWhiteSpace(narrative.Heading);
                ArgumentException.ThrowIfNullOrWhiteSpace(narrative.Body);
                break;
            case NarrativeTextArtifactPayload narrativeText:
                ArgumentException.ThrowIfNullOrWhiteSpace(narrativeText.Body);
                break;
            case NotePatchArtifactPayload notePatch:
                ArgumentException.ThrowIfNullOrWhiteSpace(notePatch.Title);
                ArgumentException.ThrowIfNullOrWhiteSpace(notePatch.Body);
                break;
            default:
                throw new ArgumentException("Unknown session artifact payload type.", nameof(payload));
        }
    }

    private static void ValidateRequiredJson(string json, string parameterName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(json, parameterName);
        ValidateOptionalJson(json, parameterName);
    }

    private static void EnsureJsonBacked(SessionArtifactKind kind, SessionArtifactSchema schema)
    {
        var valid = (kind, schema) switch
        {
            (SessionArtifactKind.RuleActionStep, SessionArtifactSchema.RuleActionStepV1) => true,
            (SessionArtifactKind.PostStateNarrative, SessionArtifactSchema.PostStateNarrativeV1) => true,
            (SessionArtifactKind.NarrativeText, SessionArtifactSchema.NarrativeTextV1) => true,
            (SessionArtifactKind.NotePatch, SessionArtifactSchema.NotePatchV1) => true,
            _ => false,
        };
        if (!valid) throw new ArgumentException("Artifact kind and schema do not match a JSON-backed payload.");
    }

    private static void ValidateOptionalJson(string? json, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(json)) return;
        try { using var _ = JsonDocument.Parse(json); }
        catch (JsonException exception) { throw new ArgumentException("Value must be valid JSON.", parameterName, exception); }
    }

    private static void ValidateChecksum(string checksum)
    {
        if (checksum.Length != 64 || checksum.Any(character => !Uri.IsHexDigit(character)))
            throw new ArgumentException("Checksum must be a SHA-256 hexadecimal value.", nameof(checksum));
    }

    private static string Hash(string payloadJson) => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(payloadJson)));
}

public static class SessionArtifactEnumValues
{
    public static string ToWireValue(this SessionArtifactKind value) => value switch
    {
        SessionArtifactKind.RuleActionStep => "rule-action-step",
        SessionArtifactKind.PostStateNarrative => "post-state-narrative",
        SessionArtifactKind.NarrativeText => "narrative-text",
        SessionArtifactKind.NotePatch => "note-patch",
        SessionArtifactKind.Image => "image",
        _ => throw new ArgumentOutOfRangeException(nameof(value)),
    };

    public static string ToWireValue(this SessionArtifactStatus value) => value switch
    {
        SessionArtifactStatus.Draft => "draft",
        SessionArtifactStatus.Validated => "validated",
        SessionArtifactStatus.Committed => "committed",
        _ => throw new ArgumentOutOfRangeException(nameof(value)),
    };

    public static string ToWireValue(this SessionArtifactSchema value) => value switch
    {
        SessionArtifactSchema.RuleActionStepV1 => "rule-action-step.v1",
        SessionArtifactSchema.PostStateNarrativeV1 => "post-state-narrative.v1",
        SessionArtifactSchema.NarrativeTextV1 => "narrative-text.v1",
        SessionArtifactSchema.NotePatchV1 => "note-patch.v1",
        SessionArtifactSchema.ImageV1 => "image.v1",
        _ => throw new ArgumentOutOfRangeException(nameof(value)),
    };

    public static SessionArtifactKind ParseKind(string value) => value switch
    {
        "rule-action-step" => SessionArtifactKind.RuleActionStep,
        "post-state-narrative" => SessionArtifactKind.PostStateNarrative,
        "narrative-text" => SessionArtifactKind.NarrativeText,
        "note-patch" => SessionArtifactKind.NotePatch,
        "image" => SessionArtifactKind.Image,
        _ => throw new InvalidOperationException($"Unknown session artifact kind '{value}'."),
    };

    public static SessionArtifactStatus ParseStatus(string value) => value switch
    {
        "draft" => SessionArtifactStatus.Draft,
        "validated" => SessionArtifactStatus.Validated,
        "committed" => SessionArtifactStatus.Committed,
        _ => throw new InvalidOperationException($"Unknown session artifact status '{value}'."),
    };

    public static SessionArtifactSchema ParseSchema(string value) => value switch
    {
        "rule-action-step.v1" => SessionArtifactSchema.RuleActionStepV1,
        "post-state-narrative.v1" => SessionArtifactSchema.PostStateNarrativeV1,
        "narrative-text.v1" => SessionArtifactSchema.NarrativeTextV1,
        "note-patch.v1" => SessionArtifactSchema.NotePatchV1,
        "image.v1" => SessionArtifactSchema.ImageV1,
        _ => throw new InvalidOperationException($"Unknown session artifact schema '{value}'."),
    };
}
