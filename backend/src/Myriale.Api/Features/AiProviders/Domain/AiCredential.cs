using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.AiProviders.Domain;

public enum AiCredentialValidationStatus { Untested, Valid, InvalidCredential, ModelNotFound, RateLimited, ProviderUnavailable, SchemaFailure }
public enum AiCredentialSource { None, Deployment, Database }

public sealed class AiCredential
{
    private AiCredential() { }
    private AiCredential(AiCredentialId id, string displayName, string protectedSecret, string secretHint, DateTimeOffset now)
    { Id = id; DisplayName = ValidateDisplayName(displayName); ProtectedSecret = Required(protectedSecret); SecretHint = secretHint; Revision = 1; UpdatedAt = now; }
    [Key] public AiCredentialId Id { get; private set; }
    [MaxLength(120)] public string DisplayName { get; private set; } = string.Empty;
    public string ProtectedSecret { get; private set; } = string.Empty;
    [MaxLength(16)] public string SecretHint { get; private set; } = string.Empty;
    public long Revision { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public static AiCredential Create(AiCredentialId id, string displayName, string protectedSecret, string secretHint, DateTimeOffset now) => new(id, displayName, protectedSecret, secretHint, now);
    public void Replace(string displayName, string protectedSecret, string secretHint, long expectedRevision, DateTimeOffset now)
    { RequireRevision(expectedRevision); DisplayName = ValidateDisplayName(displayName); ProtectedSecret = Required(protectedSecret); SecretHint = secretHint; Revision++; UpdatedAt = now; }
    public void RequireRevision(long expectedRevision) { if (Revision != expectedRevision) throw new AiRevisionConflictException(); }
    private static string Required(string value) => !string.IsNullOrWhiteSpace(value) ? value : throw new ArgumentException("Secret is required.");
    private static string ValidateDisplayName(string value) => !string.IsNullOrWhiteSpace(value) && value.Trim().Length <= 120 ? value.Trim() : throw new ArgumentException("Display name is required and must be at most 120 characters.");
}

public sealed class AiProviderProfileValidation
{
    private AiProviderProfileValidation() { }
    private AiProviderProfileValidation(AiProviderProfileId profileId, long profileRevision, AiCredentialId credentialId, long credentialRevision, AiCredentialValidationStatus status, string? errorCode, DateTimeOffset testedAt)
    { Id = new AiProviderProfileValidationId(Guid.NewGuid()); ProfileId = profileId; ProfileRevision = profileRevision; CredentialId = credentialId; CredentialRevision = credentialRevision; Status = status; ErrorCode = errorCode; TestedAt = testedAt; }
    [Key] public AiProviderProfileValidationId Id { get; private set; }
    public AiProviderProfileId ProfileId { get; private set; }
    public long ProfileRevision { get; private set; }
    public AiCredentialId CredentialId { get; private set; }
    public long CredentialRevision { get; private set; }
    public AiCredentialValidationStatus Status { get; private set; }
    [MaxLength(80)] public string? ErrorCode { get; private set; }
    public DateTimeOffset TestedAt { get; private set; }
    public static AiProviderProfileValidation Record(AiProviderProfileId profileId, long profileRevision, AiCredentialId credentialId, long credentialRevision, AiCredentialValidationStatus status, string? errorCode, DateTimeOffset testedAt) => new(profileId, profileRevision, credentialId, credentialRevision, status, errorCode, testedAt);
}
