using System.Text.Json;
using Microsoft.Extensions.AI;

namespace Myriale.Api.Features.AiProviders.Application;

public enum AiAdministrationOutcome { Success, NotFound, Conflict, ValidationFailed, ActiveProfile, CredentialReferenced, CredentialMissing, ProviderFailure }
public sealed record AiAdministrationResult<T>(AiAdministrationOutcome Outcome, T? Value = default, string? Error = null, bool Retryable = false, string? RequestId = null);

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

public sealed record CreateAiProviderProfileCommand(AiProviderProfileId Id, string DisplayName, string BaseUrl, string Model, string SystemPrompt, AiCredentialId CredentialId, bool Enabled);
public sealed record UpdateAiProviderProfileCommand(AiProviderProfileId Id, string DisplayName, string BaseUrl, string Model, string SystemPrompt, AiCredentialId CredentialId, long ExpectedRevision);
public sealed record ChangeAiProviderProfileStateCommand(AiProviderProfileId Id, long ExpectedRevision);
public sealed record DeleteAiProviderProfileCommand(AiProviderProfileId Id, long ExpectedRevision);
public sealed record SetAiCredentialCommand(AiCredentialId Id, string DisplayName, string Secret);
public sealed record ReplaceAiCredentialCommand(AiCredentialId Id, string DisplayName, string Secret, long ExpectedRevision);
public sealed record DeleteAiCredentialCommand(AiCredentialId Id, long ExpectedRevision);
public sealed record AiConversationInputMessage(string Role, string Content);
public sealed record ConversationTestAiProviderProfileCommand(AiProviderProfileId Id, IReadOnlyList<AiConversationInputMessage?> Messages, AiGenerationOverrides? GenerationOverrides, long ExpectedProfileRevision, long ExpectedCredentialRevision, string? ClientRequestId = null);
public sealed record TestAiProviderProfileCommand(AiProviderProfileId Id, long ExpectedProfileRevision, long ExpectedCredentialRevision);
public sealed record PromptTestAiProviderProfileCommand(AiProviderProfileId Id, string Prompt, long ExpectedProfileRevision, long ExpectedCredentialRevision);

public sealed class AiProviderProfileUseCases(IAiProviderProfileRepository repository, IActiveAiProviderSettingsReader active, TimeProvider time)
{
    public async Task<AiAdministrationResult<AiProviderProfile>> CreateAsync(CreateAiProviderProfileCommand command, CancellationToken ct)
    {
        try
        {
            var profile = AiProviderProfile.Create(command.Id, command.DisplayName, command.BaseUrl, command.Model, command.CredentialId, command.Enabled, time.GetUtcNow(), command.SystemPrompt);
            if (await repository.LoadAsync(profile.Id, ct) is not null) return Conflict<AiProviderProfile>();
            repository.Add(profile); return await repository.SaveAsync(ct) ? new(AiAdministrationOutcome.Success, profile) : Conflict<AiProviderProfile>();
        }
        catch (ArgumentException exception) { return new(AiAdministrationOutcome.ValidationFailed, Error: exception.Message); }
    }
    public async Task<AiAdministrationResult<AiProviderProfile>> UpdateAsync(UpdateAiProviderProfileCommand command, CancellationToken ct)
    {
        try
        {
            var profile = await repository.LoadAsync(command.Id, ct); if (profile is null) return NotFound<AiProviderProfile>();
            profile.Update(command.DisplayName, command.BaseUrl, command.Model, command.CredentialId, command.ExpectedRevision, time.GetUtcNow(), command.SystemPrompt);
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
            var profile = await repository.LoadAsync(command.Id, ct); if (profile is null) return NotFound<AiProviderProfile>();
            if (!enabled && (await active.GetAsync(ct))?.Provider == profile.Id) return new(AiAdministrationOutcome.ActiveProfile, Error: "The active profile cannot be disabled.");
            if (enabled) profile.Enable(command.ExpectedRevision, time.GetUtcNow()); else profile.Disable(command.ExpectedRevision, time.GetUtcNow());
            return await repository.SaveAsync(ct) ? new(AiAdministrationOutcome.Success, profile) : Conflict<AiProviderProfile>();
        }
        catch (AiRevisionConflictException) { return Conflict<AiProviderProfile>(); }
    }
    public async Task<AiAdministrationResult<bool>> DeleteAsync(DeleteAiProviderProfileCommand command, CancellationToken ct)
    {
        try
        {
            var profile = await repository.LoadAsync(command.Id, ct); if (profile is null) return NotFound<bool>();
            profile.RequireRevision(command.ExpectedRevision);
            if ((await active.GetAsync(ct))?.Provider == profile.Id) return new(AiAdministrationOutcome.ActiveProfile, Error: "The active profile cannot be deleted.");
            repository.Remove(profile); return await repository.SaveAsync(ct) ? new(AiAdministrationOutcome.Success, true) : Conflict<bool>();
        }
        catch (AiRevisionConflictException) { return Conflict<bool>(); }
    }
    private static AiAdministrationResult<T> Conflict<T>() => new(AiAdministrationOutcome.Conflict, Error: "The resource was changed by another request.");
    private static AiAdministrationResult<T> NotFound<T>() => new(AiAdministrationOutcome.NotFound, Error: "The resource was not found.");
}

public sealed class AiCredentialUseCases(IAiCredentialRepository repository, IAiProviderProfileRepository profiles, IAiDeploymentCatalogSource deploymentCatalog, IAiSecretProtector protector, TimeProvider time)
{
    public async Task<AiAdministrationResult<AiCredential>> SetAsync(SetAiCredentialCommand command, CancellationToken ct)
    {
        try
        {
            var id = command.Id; if (await repository.LoadAsync(id, ct) is not null) return Conflict<AiCredential>();
            var secret = RequiredSecret(command.Secret); var credential = AiCredential.Create(id, command.DisplayName, protector.Protect(secret), AiRuntimeCredentialResolver.Hint(secret), time.GetUtcNow());
            repository.Add(credential); return await repository.SaveAsync(ct) ? new(AiAdministrationOutcome.Success, credential) : Conflict<AiCredential>();
        }
        catch (ArgumentException exception) { return new(AiAdministrationOutcome.ValidationFailed, Error: exception.Message); }
    }
    public async Task<AiAdministrationResult<AiCredential>> ReplaceAsync(ReplaceAiCredentialCommand command, CancellationToken ct)
    {
        try
        {
            var credential = await repository.LoadAsync(command.Id, ct); if (credential is null) return NotFound<AiCredential>();
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
            var credential = await repository.LoadAsync(command.Id, ct); if (credential is null) return NotFound<bool>();
            credential.RequireRevision(command.ExpectedRevision);
            if (await profiles.IsCredentialReferencedAsync(credential.Id, ct)
                || deploymentCatalog.GetSnapshot().Profiles.Values.Any(profile => profile.CredentialId == credential.Id))
                return new(AiAdministrationOutcome.CredentialReferenced, Error: "The credential is referenced by a profile.");
            repository.Remove(credential); return await repository.SaveAsync(ct) ? new(AiAdministrationOutcome.Success, true) : Conflict<bool>();
        }
        catch (AiRevisionConflictException) { return Conflict<bool>(); }
    }
    private static string RequiredSecret(string value) => !string.IsNullOrWhiteSpace(value) ? value.Trim() : throw new ArgumentException("Secret is required.");
    private static AiAdministrationResult<T> Conflict<T>() => new(AiAdministrationOutcome.Conflict, Error: "The resource was changed by another request.");
    private static AiAdministrationResult<T> NotFound<T>() => new(AiAdministrationOutcome.NotFound, Error: "The resource was not found.");
}

public sealed record AiConnectionTestResult(AiProviderProfileId ProfileId, long ProfileRevision, AiCredentialId CredentialId, long CredentialRevision, AiCredentialValidationStatus Status, DateTimeOffset TestedAt);
public sealed record AiPromptProbeResult(AiProviderProfileId Provider, string Model, string Response, int? InputTokens, int? OutputTokens, long LatencyMilliseconds, string? FinishReason);
public sealed record AiConversationProbeResult(string Response, AiGenerationMetadata Metadata, string? RequestId);

public sealed class AiProviderTestUseCases(IAiProfileCatalog catalog, IAiRuntimeCredentialResolver credentials, IAiCredentialRepository credentialRepository, IAiTextService provider, IAiConversationService conversation, TimeProvider time)
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
        credentialRepository.AddValidation(AiProviderProfileValidation.Record(profile.Id, profile.Revision, profile.CredentialId, credential.Revision, status, error, testedAt));
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
    public async Task<AiAdministrationResult<AiConversationProbeResult>> ConversationAsync(ConversationTestAiProviderProfileCommand command, CancellationToken ct)
    {
        var validationError = ValidateConversation(command);
        if (validationError is not null) return new(AiAdministrationOutcome.ValidationFailed, Error: validationError);

        AiProfileDescriptor profile;
        try { profile = await catalog.ResolveAsync(command.Id, ct); }
        catch (AiProviderException) { return new(AiAdministrationOutcome.NotFound, Error: "AI profile was not found or is unavailable."); }
        if (!profile.Enabled || !profile.Selectable) return new(AiAdministrationOutcome.NotFound, Error: "AI profile was not found or is unavailable.");

        var credential = await credentials.ResolveAsync(profile.CredentialId, ct);
        if (credential is null) return new(AiAdministrationOutcome.CredentialMissing, Error: "Credential is not configured.");
        if (profile.Revision != command.ExpectedProfileRevision || credential.Revision != command.ExpectedCredentialRevision)
            return Conflict<AiConversationProbeResult>();

        var messages = command.Messages.Select(message => new ChatMessage(message!.Role switch
        {
            "system" => ChatRole.System,
            "user" => ChatRole.User,
            "assistant" => ChatRole.Assistant,
            _ => throw new InvalidOperationException("Conversation role validation was bypassed."),
        }, message.Content)).ToArray();

        try
        {
            var generated = await conversation.GenerateForProviderAsync(profile.Id, credential.Secret, new(messages, command.GenerationOverrides), ct);
            var currentProfile = await catalog.ResolveAsync(profile.Id, ct);
            var currentCredential = await credentials.ResolveAsync(profile.CredentialId, ct);
            if (currentProfile.Revision != profile.Revision || currentCredential?.Revision != credential.Revision)
                return Conflict<AiConversationProbeResult>();
            return new(AiAdministrationOutcome.Success, new(generated.Text, generated.Metadata, command.ClientRequestId));
        }
        catch (AiProviderException ex)
        {
            return new(AiAdministrationOutcome.ProviderFailure, Error: ex.Code, Retryable: ex.Retryable, RequestId: ex.Metadata?.ResponseId);
        }
    }

    private static string? ValidateConversation(ConversationTestAiProviderProfileCommand command)
    {
        const int maxMessages = 100, maxMessageLength = 10_000, maxTotalLength = 50_000, maxOutputTokens = 32_768, maxRetryAttempts = 5;
        if (command.Messages is null || command.Messages.Count == 0) return "At least one conversation message is required.";
        if (command.Messages.Count > maxMessages) return $"Conversation history cannot exceed {maxMessages} messages.";
        var total = 0;
        foreach (var message in command.Messages)
        {
            if (message is null || message.Role is not ("system" or "user" or "assistant")) return "Message role must be system, user, or assistant.";
            if (string.IsNullOrWhiteSpace(message.Content)) return "Message content is required.";
            if (message.Content.Length > maxMessageLength) return $"Message content cannot exceed {maxMessageLength} characters.";
            total += message.Content.Length;
            if (total > maxTotalLength) return $"Conversation content cannot exceed {maxTotalLength} characters.";
        }
        if (command.ClientRequestId is { Length: > 128 }) return "Client request ID cannot exceed 128 characters.";
        var options = command.GenerationOverrides;
        if (options?.Temperature is < 0 or > 2) return "Temperature must be between 0 and 2.";
        if (options?.TopP is <= 0 or > 1) return "Top P must be greater than 0 and at most 1.";
        if (options?.MaxOutputTokens is <= 0 or > maxOutputTokens) return $"Maximum output tokens must be between 1 and {maxOutputTokens}.";
        if (options?.RetryAttempts is < 0 or > maxRetryAttempts) return $"Retry attempts must be between 0 and {maxRetryAttempts}.";
        return null;
    }

    private static AiCredentialValidationStatus ToStatus(string code) => code switch { AiProviderErrorCodes.InvalidCredential => AiCredentialValidationStatus.InvalidCredential, AiProviderErrorCodes.ModelNotFound => AiCredentialValidationStatus.ModelNotFound, AiProviderErrorCodes.RateLimited => AiCredentialValidationStatus.RateLimited, AiProviderErrorCodes.SchemaFailure => AiCredentialValidationStatus.SchemaFailure, _ => AiCredentialValidationStatus.ProviderUnavailable };
    private static AiAdministrationResult<T> Conflict<T>() => new(AiAdministrationOutcome.Conflict, Error: "Profile or credential revision changed.");
}
