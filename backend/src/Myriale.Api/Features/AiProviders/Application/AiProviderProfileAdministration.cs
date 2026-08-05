using System.Text.Json;
using Microsoft.Extensions.AI;

namespace Myriale.Api.Features.AiProviders.Application;

public enum AiAdministrationOutcome { Success, NotFound, Conflict, ValidationFailed, ActiveProfile, CredentialReferenced, CredentialMissing, ProviderFailure }
public sealed record AiAdministrationResult<T>(AiAdministrationOutcome Outcome, T? Value = default, string? Error = null);

public interface IAiProviderProfileRepository
{
    Task<IReadOnlyList<AiProviderProfile>> ListAsync(CancellationToken cancellationToken);
    Task<AiProviderProfile?> LoadAsync(AiProviderProfileId id, CancellationToken cancellationToken);
    void Add(AiProviderProfile profile);
    void Remove(AiProviderProfile profile);
    Task<bool> IsCredentialReferencedAsync(AiCredentialId id, CancellationToken cancellationToken);
    Task<bool> SaveAsync(CancellationToken cancellationToken);
}
public interface IAiCredentialRepository
{
    Task<IReadOnlyList<AiCredential>> ListAsync(CancellationToken cancellationToken);
    Task<AiCredential?> LoadAsync(AiCredentialId id, CancellationToken cancellationToken);
    void Add(AiCredential credential);
    void Remove(AiCredential credential);
    void AddValidation(AiProviderProfileValidation validation);
    Task<AiProviderProfileValidation?> GetLatestValidationAsync(AiProviderProfileId profileId, CancellationToken cancellationToken);
    Task<bool> SaveAsync(CancellationToken cancellationToken);
}

public sealed record CreateAiProviderProfileCommand(string Id, string DisplayName, string BaseUrl, string Model, string CredentialId, bool Enabled);
public sealed record UpdateAiProviderProfileCommand(string Id, string DisplayName, string BaseUrl, string Model, string CredentialId, long ExpectedRevision);
public sealed record ChangeAiProviderProfileStateCommand(string Id, long ExpectedRevision);
public sealed record DeleteAiProviderProfileCommand(string Id, long ExpectedRevision);
public sealed record SetAiCredentialCommand(string Id, string DisplayName, string Secret);
public sealed record ReplaceAiCredentialCommand(string Id, string DisplayName, string Secret, long ExpectedRevision);
public sealed record DeleteAiCredentialCommand(string Id, long ExpectedRevision);
public sealed record TestAiProviderProfileCommand(string Id, long ExpectedProfileRevision, long ExpectedCredentialRevision);
public sealed record PromptTestAiProviderProfileCommand(string Id, string Prompt, long ExpectedProfileRevision, long ExpectedCredentialRevision);

public sealed class AiProviderProfileUseCases(IAiProviderProfileRepository repository, IActiveAiProviderSettingsReader active, TimeProvider time)
{
    public async Task<AiAdministrationResult<AiProviderProfile>> CreateAsync(CreateAiProviderProfileCommand command, CancellationToken ct)
    {
        try
        {
            var profile = AiProviderProfile.Create(command.Id, command.DisplayName, command.BaseUrl, command.Model, command.CredentialId, command.Enabled, time.GetUtcNow());
            if (await repository.LoadAsync(profile.Id, ct) is not null) return Conflict<AiProviderProfile>();
            repository.Add(profile); return await repository.SaveAsync(ct) ? new(AiAdministrationOutcome.Success, profile) : Conflict<AiProviderProfile>();
        }
        catch (ArgumentException exception) { return new(AiAdministrationOutcome.ValidationFailed, Error: exception.Message); }
    }
    public async Task<AiAdministrationResult<AiProviderProfile>> UpdateAsync(UpdateAiProviderProfileCommand command, CancellationToken ct)
    {
        try
        {
            var profile = await repository.LoadAsync(new(command.Id), ct); if (profile is null) return NotFound<AiProviderProfile>();
            profile.Update(command.DisplayName, command.BaseUrl, command.Model, command.CredentialId, command.ExpectedRevision, time.GetUtcNow());
            return await repository.SaveAsync(ct) ? new(AiAdministrationOutcome.Success, profile) : Conflict<AiProviderProfile>();
        }
        catch (AiRevisionConflictException) { return Conflict<AiProviderProfile>(); }
        catch (ArgumentException exception) { return new(AiAdministrationOutcome.ValidationFailed, Error: exception.Message); }
    }
    public Task<AiAdministrationResult<AiProviderProfile>> EnableAsync(ChangeAiProviderProfileStateCommand command, CancellationToken ct) => ChangeStateAsync(command, true, ct);
    public Task<AiAdministrationResult<AiProviderProfile>> DisableAsync(ChangeAiProviderProfileStateCommand command, CancellationToken ct) => ChangeStateAsync(command, false, ct);
    private async Task<AiAdministrationResult<AiProviderProfile>> ChangeStateAsync(ChangeAiProviderProfileStateCommand command, bool enabled, CancellationToken ct)
    {
        try
        {
            var profile = await repository.LoadAsync(new(command.Id), ct); if (profile is null) return NotFound<AiProviderProfile>();
            if (!enabled && string.Equals((await active.GetAsync(ct))?.Provider, profile.Id.AsPrimitive(), StringComparison.OrdinalIgnoreCase)) return new(AiAdministrationOutcome.ActiveProfile, Error: "The active profile cannot be disabled.");
            if (enabled) profile.Enable(command.ExpectedRevision, time.GetUtcNow()); else profile.Disable(command.ExpectedRevision, time.GetUtcNow());
            return await repository.SaveAsync(ct) ? new(AiAdministrationOutcome.Success, profile) : Conflict<AiProviderProfile>();
        }
        catch (AiRevisionConflictException) { return Conflict<AiProviderProfile>(); }
    }
    public async Task<AiAdministrationResult<bool>> DeleteAsync(DeleteAiProviderProfileCommand command, CancellationToken ct)
    {
        try
        {
            var profile = await repository.LoadAsync(new(command.Id), ct); if (profile is null) return NotFound<bool>();
            profile.RequireRevision(command.ExpectedRevision);
            if (string.Equals((await active.GetAsync(ct))?.Provider, profile.Id.AsPrimitive(), StringComparison.OrdinalIgnoreCase)) return new(AiAdministrationOutcome.ActiveProfile, Error: "The active profile cannot be deleted.");
            repository.Remove(profile); return await repository.SaveAsync(ct) ? new(AiAdministrationOutcome.Success, true) : Conflict<bool>();
        }
        catch (AiRevisionConflictException) { return Conflict<bool>(); }
    }
    private static AiAdministrationResult<T> Conflict<T>() => new(AiAdministrationOutcome.Conflict, Error: "The resource was changed by another request.");
    private static AiAdministrationResult<T> NotFound<T>() => new(AiAdministrationOutcome.NotFound, Error: "The resource was not found.");
}

public sealed class AiCredentialUseCases(IAiCredentialRepository repository, IAiProviderProfileRepository profiles, IAiDeploymentProfileSource deploymentProfiles, IAiSecretProtector protector, TimeProvider time)
{
    public async Task<AiAdministrationResult<AiCredential>> SetAsync(SetAiCredentialCommand command, CancellationToken ct)
    {
        try
        {
            var id = new AiCredentialId(command.Id); if (await repository.LoadAsync(id, ct) is not null) return Conflict<AiCredential>();
            var secret = RequiredSecret(command.Secret); var credential = AiCredential.Create(id.AsPrimitive(), command.DisplayName, protector.Protect(secret), AiRuntimeCredentialResolver.Hint(secret), time.GetUtcNow());
            repository.Add(credential); return await repository.SaveAsync(ct) ? new(AiAdministrationOutcome.Success, credential) : Conflict<AiCredential>();
        }
        catch (ArgumentException exception) { return new(AiAdministrationOutcome.ValidationFailed, Error: exception.Message); }
    }
    public async Task<AiAdministrationResult<AiCredential>> ReplaceAsync(ReplaceAiCredentialCommand command, CancellationToken ct)
    {
        try
        {
            var credential = await repository.LoadAsync(new(command.Id), ct); if (credential is null) return NotFound<AiCredential>();
            var secret = RequiredSecret(command.Secret); credential.Replace(command.DisplayName, protector.Protect(secret), AiRuntimeCredentialResolver.Hint(secret), command.ExpectedRevision, time.GetUtcNow());
            return await repository.SaveAsync(ct) ? new(AiAdministrationOutcome.Success, credential) : Conflict<AiCredential>();
        }
        catch (AiRevisionConflictException) { return Conflict<AiCredential>(); }
        catch (ArgumentException exception) { return new(AiAdministrationOutcome.ValidationFailed, Error: exception.Message); }
    }
    public async Task<AiAdministrationResult<bool>> DeleteAsync(DeleteAiCredentialCommand command, CancellationToken ct)
    {
        try
        {
            var credential = await repository.LoadAsync(new(command.Id), ct); if (credential is null) return NotFound<bool>();
            credential.RequireRevision(command.ExpectedRevision);
            if (await profiles.IsCredentialReferencedAsync(credential.Id, ct)
                || deploymentProfiles.GetProfiles().Values.Any(profile => string.Equals(profile.CredentialId, credential.Id.AsPrimitive(), StringComparison.OrdinalIgnoreCase)))
                return new(AiAdministrationOutcome.CredentialReferenced, Error: "The credential is referenced by a profile.");
            repository.Remove(credential); return await repository.SaveAsync(ct) ? new(AiAdministrationOutcome.Success, true) : Conflict<bool>();
        }
        catch (AiRevisionConflictException) { return Conflict<bool>(); }
    }
    private static string RequiredSecret(string value) => !string.IsNullOrWhiteSpace(value) ? value.Trim() : throw new ArgumentException("Secret is required.");
    private static AiAdministrationResult<T> Conflict<T>() => new(AiAdministrationOutcome.Conflict, Error: "The resource was changed by another request.");
    private static AiAdministrationResult<T> NotFound<T>() => new(AiAdministrationOutcome.NotFound, Error: "The resource was not found.");
}

public sealed record AiConnectionTestResult(string ProfileId, long ProfileRevision, string CredentialId, long CredentialRevision, AiCredentialValidationStatus Status, DateTimeOffset TestedAt);
public sealed record AiPromptProbeResult(string Provider, string Model, string Response, int? InputTokens, int? OutputTokens, long LatencyMilliseconds, string? FinishReason);

public sealed class AiProviderTestUseCases(IAiProfileCatalog catalog, IAiRuntimeCredentialResolver credentials, IAiCredentialRepository credentialRepository, IAiTextProvider provider, TimeProvider time)
{
    public async Task<AiAdministrationResult<AiConnectionTestResult>> TestConnectionAsync(TestAiProviderProfileCommand command, CancellationToken ct)
    {
        AiProfileDescriptor profile;
        try { profile = await catalog.ResolveAsync(command.Id, ct); } catch (AiProviderException ex) { return new(AiAdministrationOutcome.NotFound, Error: ex.Message); }
        var credential = await credentials.ResolveAsync(profile.CredentialId, ct);
        if (credential is null) return new(AiAdministrationOutcome.CredentialMissing, Error: "Credential is not configured.");
        if (profile.Revision != command.ExpectedProfileRevision || credential.Revision != command.ExpectedCredentialRevision) return Conflict<AiConnectionTestResult>();
        var testedAt = time.GetUtcNow(); var status = AiCredentialValidationStatus.Valid; string? error = null;
        try { await provider.TestConnectionAsync(profile.Id, credential.Secret, ct); }
        catch (AiProviderException ex) { status = ToStatus(ex.Code); error = ex.Code; }
        var currentProfile = await catalog.ResolveAsync(profile.Id, ct); var currentCredential = await credentials.ResolveAsync(profile.CredentialId, ct);
        if (currentProfile.Revision != profile.Revision || currentCredential?.Revision != credential.Revision) return Conflict<AiConnectionTestResult>();
        credentialRepository.AddValidation(AiProviderProfileValidation.Record(new(profile.Id), profile.Revision, new(profile.CredentialId), credential.Revision, status, error, testedAt));
        if (!await credentialRepository.SaveAsync(ct)) return Conflict<AiConnectionTestResult>();
        var result = new AiConnectionTestResult(profile.Id, profile.Revision, profile.CredentialId, credential.Revision, status, testedAt);
        return status == AiCredentialValidationStatus.Valid ? new(AiAdministrationOutcome.Success, result) : new(AiAdministrationOutcome.ProviderFailure, result, error);
    }
    public async Task<AiAdministrationResult<AiPromptProbeResult>> PromptAsync(PromptTestAiProviderProfileCommand command, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(command.Prompt) || command.Prompt.Trim().Length > 10_000) return new(AiAdministrationOutcome.ValidationFailed, Error: "Prompt must be 1-10,000 characters.");
        AiProfileDescriptor profile; try { profile = await catalog.ResolveAsync(command.Id, ct); } catch (AiProviderException ex) { return new(AiAdministrationOutcome.NotFound, Error: ex.Message); }
        var credential = await credentials.ResolveAsync(profile.CredentialId, ct); if (credential is null) return new(AiAdministrationOutcome.CredentialMissing, Error: "Credential is not configured.");
        if (profile.Revision != command.ExpectedProfileRevision || credential.Revision != command.ExpectedCredentialRevision) return Conflict<AiPromptProbeResult>();
        using var schema = JsonDocument.Parse("{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"response\":{\"type\":\"string\"}},\"required\":[\"response\"]}");
        try
        {
            var generated = await provider.GenerateForProviderAsync(profile.Id, credential.Secret, new AiTextRequest([new ChatMessage(ChatRole.System, "Return JSON matching the schema."), new ChatMessage(ChatRole.User, command.Prompt.Trim())], ChatResponseFormat.ForJsonSchema(schema.RootElement, "myriale_admin_prompt_test")), ct);
            using var document = JsonDocument.Parse(generated.Text); var response = document.RootElement.GetProperty("response").GetString(); if (string.IsNullOrWhiteSpace(response)) throw new JsonException();
            var currentProfile = await catalog.ResolveAsync(profile.Id, ct); var currentCredential = await credentials.ResolveAsync(profile.CredentialId, ct);
            if (currentProfile.Revision != profile.Revision || currentCredential?.Revision != credential.Revision) return Conflict<AiPromptProbeResult>();
            return new(AiAdministrationOutcome.Success, new(generated.Metadata.Provider, generated.Metadata.Model, response, generated.Metadata.InputTokens, generated.Metadata.OutputTokens, generated.Metadata.LatencyMilliseconds, generated.Metadata.FinishReason));
        }
        catch (AiProviderException ex) { return new(AiAdministrationOutcome.ProviderFailure, Error: ex.Code); }
        catch (JsonException) { return new(AiAdministrationOutcome.ProviderFailure, Error: AiProviderErrorCodes.SchemaFailure); }
    }
    private static AiCredentialValidationStatus ToStatus(string code) => code switch { AiProviderErrorCodes.InvalidCredential => AiCredentialValidationStatus.InvalidCredential, AiProviderErrorCodes.ModelNotFound => AiCredentialValidationStatus.ModelNotFound, AiProviderErrorCodes.RateLimited => AiCredentialValidationStatus.RateLimited, AiProviderErrorCodes.SchemaFailure => AiCredentialValidationStatus.SchemaFailure, _ => AiCredentialValidationStatus.ProviderUnavailable };
    private static AiAdministrationResult<T> Conflict<T>() => new(AiAdministrationOutcome.Conflict, Error: "Profile or credential revision changed.");
}
