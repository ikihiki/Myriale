using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Features.AiProviders.Application;

public sealed record ActivateAiProviderCommand(string Provider, long? ExpectedRevision = null);

public enum ActivateAiProviderOutcome
{
    Success,
    UnknownProvider,
    CredentialMissing,
    Conflict,
}

public sealed record ActivateAiProviderResult(
    ActivateAiProviderOutcome Outcome,
    AiProfileDescriptor? Profile = null,
    long? Revision = null,
    string? ErrorMessage = null);

public sealed class ActivateAiProviderUseCase(
    IActiveAiProviderSettingsRepository repository,
    IAiProfileCatalog catalog,
    IAiRuntimeCredentialResolver credentialResolver,
    TimeProvider timeProvider)
{
    public async Task<ActivateAiProviderResult> ExecuteAsync(
        ActivateAiProviderCommand command,
        CancellationToken cancellationToken)
    {
        AiProfileDescriptor profile;
        try
        {
            profile = await catalog.ResolveAsync(command.Provider, cancellationToken);
        }
        catch (AiProviderException exception)
        {
            return new(ActivateAiProviderOutcome.UnknownProvider, ErrorMessage: exception.Message);
        }

        var credential = await credentialResolver.ResolveAsync(profile.CredentialId, cancellationToken);
        if (credential is null)
            return new(ActivateAiProviderOutcome.CredentialMissing, profile, ErrorMessage: "Credential未設定のprofileは使用できません。");

        var settings = await repository.LoadAsync(cancellationToken);
        if (settings is null)
        {
            if (command.ExpectedRevision is not null and not 0)
                return Conflict(profile);
            settings = AiProviderRuntimeSettings.Create(profile.Id, timeProvider.GetUtcNow());
            repository.Add(settings);
        }
        else
        {
            if (command.ExpectedRevision is not null && command.ExpectedRevision != settings.Revision)
                return Conflict(profile);
            settings.Activate(profile.Id, timeProvider.GetUtcNow());
        }

        var save = await repository.SaveAsync(cancellationToken);
        return save == ActiveAiProviderSettingsSaveOutcome.Conflict
            ? Conflict(profile)
            : new(ActivateAiProviderOutcome.Success, profile, settings.Revision);
    }

    private static ActivateAiProviderResult Conflict(AiProfileDescriptor profile) =>
        new(ActivateAiProviderOutcome.Conflict, profile, ErrorMessage: "使用するAI profileが別の操作で更新されています。再読み込みしてください。");
}
