using System.Security.Claims;
using Myriale.Api.Features.SessionExecutions.Application;

namespace Myriale.Api.Features.SessionExecutions.Http;

public static class SessionExecutionEndpoints
{
    public static IEndpointRouteBuilder MapSessionExecutionEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/session-executions").WithTags("Session Executions").RequireAuthorization().RequireCors("MyrialeFrontend");
        group.MapGet("/{executionId}", GetAsync);
        group.MapPost("/{executionId}/retry", RetryAsync);
        group.MapPost("/{executionId}/cancel", CancelAsync);
        group.MapPost("/{executionId}/dismiss", DismissAsync);
        return routes;
    }

    private static Task<IResult> GetAsync(SessionExecutionId executionId, ClaimsPrincipal principal, GetSessionExecutionQuery query, CancellationToken cancellationToken) =>
        ExecuteAsync(principal, owner => query.ExecuteAsync(executionId, owner, cancellationToken));

    private static Task<IResult> RetryAsync(SessionExecutionId executionId, ClaimsPrincipal principal, RetrySessionExecutionCommand command, CancellationToken cancellationToken) =>
        ExecuteAsync(principal, owner => command.ExecuteAsync(executionId, owner, cancellationToken));

    private static Task<IResult> CancelAsync(SessionExecutionId executionId, ClaimsPrincipal principal, CancelSessionExecutionCommand command, CancellationToken cancellationToken) =>
        ExecuteAsync(principal, owner => command.ExecuteAsync(executionId, owner, cancellationToken));

    private static Task<IResult> DismissAsync(SessionExecutionId executionId, ClaimsPrincipal principal, DismissSessionExecutionCommand command, CancellationToken cancellationToken) =>
        ExecuteAsync(principal, owner => command.ExecuteAsync(executionId, owner, cancellationToken));

    private static async Task<IResult> ExecuteAsync(ClaimsPrincipal principal, Func<AccountId, Task<SessionExecutionUseCaseResult>> execute)
    {
        var owner = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (owner is null) return Results.Unauthorized();
        var result = await execute(new AccountId(owner));
        return result.Outcome switch
        {
            SessionExecutionUseCaseOutcome.Success => Results.Ok(result.Execution),
            SessionExecutionUseCaseOutcome.NotFound => Results.NotFound(),
            SessionExecutionUseCaseOutcome.InvalidState => Results.Conflict(new SessionErrorResponse("execution_not_retryable", "この生成処理は再試行できません。")),
            SessionExecutionUseCaseOutcome.Conflict => Results.Conflict(new SessionErrorResponse("execution_revision_conflict", "生成処理が更新されています。再読み込みしてください。")),
            _ => throw new ArgumentOutOfRangeException(),
        };
    }
}
