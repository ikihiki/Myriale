using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Infrastructure.Composition.SessionExecutions;

public enum SessionExecutionUseCaseOutcome { Success, NotFound, InvalidState, Conflict }
public sealed record SessionExecutionUseCaseResult(SessionExecutionUseCaseOutcome Outcome, SessionExecutionResponse? Execution = null);

public sealed class GetSessionExecutionQuery(ISessionExecutionRepository repository, IHostEnvironment environment)
{
    public async Task<SessionExecutionUseCaseResult> ExecuteAsync(SessionExecutionId executionId, AccountId ownerId, CancellationToken cancellationToken)
    {
        var execution = await repository.GetOwnedAsync(executionId, ownerId, tracking: false, cancellationToken);
        return execution is null
            ? new(SessionExecutionUseCaseOutcome.NotFound)
            : new(SessionExecutionUseCaseOutcome.Success, SessionExecutionProjection.ToResponse(execution, environment.IsDevelopment()));
    }
}

public sealed class RetrySessionExecutionCommand(ISessionExecutionRepository repository, IHostEnvironment environment, TimeProvider timeProvider)
{
    public async Task<SessionExecutionUseCaseResult> ExecuteAsync(SessionExecutionId executionId, AccountId ownerId, CancellationToken cancellationToken)
    {
        var execution = await repository.GetOwnedAsync(executionId, ownerId, tracking: true, cancellationToken);
        if (execution is null) return new(SessionExecutionUseCaseOutcome.NotFound);
        try { execution.Retry(timeProvider.GetUtcNow()); }
        catch (InvalidOperationException) { return new(SessionExecutionUseCaseOutcome.InvalidState); }
        try { await repository.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { return new(SessionExecutionUseCaseOutcome.Conflict); }
        SessionExecutionTelemetry.Enqueued.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
        return new(SessionExecutionUseCaseOutcome.Success, SessionExecutionProjection.ToResponse(execution, environment.IsDevelopment()));
    }
}

public sealed class CancelSessionExecutionCommand(ISessionExecutionRepository repository, IHostEnvironment environment, TimeProvider timeProvider)
{
    public async Task<SessionExecutionUseCaseResult> ExecuteAsync(SessionExecutionId executionId, AccountId ownerId, CancellationToken cancellationToken)
    {
        SessionExecution? execution = null;
        var result = await repository.MutateOwnedWithLockAsync(executionId, ownerId, item =>
        {
            execution = item;
            item.RequestCancellation(timeProvider.GetUtcNow());
        }, cancellationToken);
        return result switch
        {
            SessionExecutionMutationResult.NotFound => new(SessionExecutionUseCaseOutcome.NotFound),
            SessionExecutionMutationResult.Conflict => new(SessionExecutionUseCaseOutcome.Conflict),
            _ => new(SessionExecutionUseCaseOutcome.Success, SessionExecutionProjection.ToResponse(execution!, environment.IsDevelopment())),
        };
    }
}

public sealed class DismissSessionExecutionCommand(ISessionExecutionRepository repository, IHostEnvironment environment, TimeProvider timeProvider)
{
    public async Task<SessionExecutionUseCaseResult> ExecuteAsync(SessionExecutionId executionId, AccountId ownerId, CancellationToken cancellationToken)
    {
        var execution = await repository.GetOwnedAsync(executionId, ownerId, tracking: true, cancellationToken);
        if (execution is null) return new(SessionExecutionUseCaseOutcome.NotFound);
        execution.Dismiss(timeProvider.GetUtcNow());
        try { await repository.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { return new(SessionExecutionUseCaseOutcome.Conflict); }
        return new(SessionExecutionUseCaseOutcome.Success, SessionExecutionProjection.ToResponse(execution, environment.IsDevelopment()));
    }
}
