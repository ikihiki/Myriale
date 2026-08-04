using Myriale.Api.Application.ProgressionRuntime;

namespace Myriale.Api.Services;

// Compatibility adapter retained for existing callers while progression orchestration lives in the application slice.
public sealed class SessionScenarioProgressionService(EnsureProgressionReceiptCommand command)
{
    public Task EnsureNarrativeTurnAsync(string ownerId, string narrativeTurnId, CancellationToken cancellationToken) =>
        command.ExecuteForNarrativeTurnAsync(ownerId, narrativeTurnId, cancellationToken);

    public Task EnsureAsync(string ownerId, string receiptId, CancellationToken cancellationToken) =>
        command.ExecuteAsync(ownerId, receiptId, cancellationToken);
}
