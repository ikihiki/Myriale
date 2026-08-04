using Myriale.Api.Application.AiProviders;

namespace Myriale.Api.Services;

public interface IAiProviderSelectionStore
{
    Task<string> GetActiveProviderAsync(CancellationToken cancellationToken);
    Task SetActiveProviderAsync(string provider, CancellationToken cancellationToken);
}

public sealed class DbAiProviderSelectionStore(
    ActiveAiProviderQueryService query,
    ActivateAiProviderUseCase activate) : IAiProviderSelectionStore
{
    public Task<string> GetActiveProviderAsync(CancellationToken cancellationToken) =>
        query.GetActiveProviderAsync(cancellationToken);

    public async Task SetActiveProviderAsync(string provider, CancellationToken cancellationToken)
    {
        var result = await activate.ExecuteAsync(new ActivateAiProviderCommand(provider), cancellationToken);
        if (result.Outcome == ActivateAiProviderOutcome.Success) return;

        var code = result.Outcome switch
        {
            ActivateAiProviderOutcome.CredentialMissing => AiProviderErrorCodes.InvalidCredential,
            ActivateAiProviderOutcome.Conflict => AiProviderErrorCodes.ProviderUnavailable,
            _ => AiProviderErrorCodes.ProviderUnavailable,
        };
        throw new AiProviderException(code, result.ErrorMessage ?? "AI profile could not be activated.", false);
    }
}
