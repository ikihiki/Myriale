using Myriale.Api.Architecture;

namespace Myriale.Api.Features.ProgressionRuntime.Application.Services;

[CrossSliceContract]
public interface IProgressionReceiptService
{
    Task ExecuteForNarrativeTurnAsync(
        AccountId ownerId,
        SessionTurnId narrativeTurnId,
        CancellationToken cancellationToken);

    Task ExecuteAsync(
        AccountId ownerId,
        SessionProgressionTransitionReceiptId receiptId,
        CancellationToken cancellationToken);
}
