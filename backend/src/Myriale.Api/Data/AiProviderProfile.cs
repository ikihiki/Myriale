using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public enum AiAdapter { OpenAiCompatible }
public enum AiProfileDefinitionSource { Deployment, Database }

public sealed class AiProviderProfile
{
    private AiProviderProfile() { }
    private AiProviderProfile(AiProviderProfileId id, string displayName, Uri baseUrl, string model, AiCredentialId credentialId, bool enabled, DateTimeOffset now)
    {
        Id = id; DisplayName = ValidateDisplayName(displayName); Adapter = AiAdapter.OpenAiCompatible;
        BaseUrl = NormalizeBaseUrl(baseUrl); Model = ValidateModel(model); CredentialId = credentialId;
        Enabled = enabled; Revision = 1; UpdatedAt = now;
    }

    [Key] public AiProviderProfileId Id { get; private set; }
    [MaxLength(120)] public string DisplayName { get; private set; } = string.Empty;
    public AiAdapter Adapter { get; private set; }
    [MaxLength(2048)] public string BaseUrl { get; private set; } = string.Empty;
    [MaxLength(240)] public string Model { get; private set; } = string.Empty;
    public AiCredentialId CredentialId { get; private set; }
    public bool Enabled { get; private set; }
    public long Revision { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public static AiProviderProfile Create(string id, string displayName, string baseUrl, string model, string credentialId, bool enabled, DateTimeOffset now) =>
        new(new AiProviderProfileId(id), displayName, ParseBaseUrl(baseUrl), model, new AiCredentialId(credentialId), enabled, now);

    public void Update(string displayName, string baseUrl, string model, string credentialId, long expectedRevision, DateTimeOffset now)
    {
        RequireRevision(expectedRevision); DisplayName = ValidateDisplayName(displayName); BaseUrl = NormalizeBaseUrl(ParseBaseUrl(baseUrl));
        Model = ValidateModel(model); CredentialId = new AiCredentialId(credentialId); Touch(now);
    }
    public void Enable(long expectedRevision, DateTimeOffset now) { RequireRevision(expectedRevision); if (!Enabled) { Enabled = true; Touch(now); } }
    public void Disable(long expectedRevision, DateTimeOffset now) { RequireRevision(expectedRevision); if (Enabled) { Enabled = false; Touch(now); } }
    public void RequireRevision(long expectedRevision) { if (expectedRevision != Revision) throw new AiRevisionConflictException(); }
    private void Touch(DateTimeOffset now) { Revision++; UpdatedAt = now; }
    private static string ValidateDisplayName(string value) => !string.IsNullOrWhiteSpace(value) && value.Trim().Length <= 120 ? value.Trim() : throw new ArgumentException("Display name is required and must be at most 120 characters.");
    private static string ValidateModel(string value) => !string.IsNullOrWhiteSpace(value) && value.Trim().Length <= 240 ? value.Trim() : throw new ArgumentException("Model is required and must be at most 240 characters.");
    private static Uri ParseBaseUrl(string value) => Uri.TryCreate(value?.Trim(), UriKind.Absolute, out var uri) && uri.Scheme is "http" or "https" ? uri : throw new ArgumentException("Base URL must be an absolute HTTP(S) URL.");
    private static string NormalizeBaseUrl(Uri uri) => uri.ToString().TrimEnd('/');
}

public sealed class AiRevisionConflictException : Exception;
