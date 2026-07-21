using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Endpoints;

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

    private static async Task<IResult> GetAsync(string executionId, ClaimsPrincipal principal, ApplicationDbContext db, IHostEnvironment environment, CancellationToken cancellationToken)
    {
        var owner = principal.FindFirstValue(ClaimTypes.NameIdentifier); if (owner is null) return Results.Unauthorized();
        var execution = await db.SessionExecutions.AsNoTracking().Include(item => item.Attempts)
            .SingleOrDefaultAsync(item => item.Id == executionId && item.Session.OwnerId == owner, cancellationToken);
        return execution is null ? Results.NotFound() : Results.Ok(SessionExecutionProjection.ToResponse(execution, environment.IsDevelopment()));
    }

    private static async Task<IResult> RetryAsync(string executionId, ClaimsPrincipal principal, ApplicationDbContext db, IHostEnvironment environment, CancellationToken cancellationToken)
    {
        var owner = principal.FindFirstValue(ClaimTypes.NameIdentifier); if (owner is null) return Results.Unauthorized();
        var execution = await db.SessionExecutions.Include(item => item.Attempts).SingleOrDefaultAsync(item => item.Id == executionId && item.Session.OwnerId == owner, cancellationToken);
        if (execution is null) return Results.NotFound();
        if (execution.Status == SessionExecutionStatuses.Queued) return Results.Ok(SessionExecutionProjection.ToResponse(execution, environment.IsDevelopment()));
        if (!execution.IsRetryable || execution.Status is not (SessionExecutionStatuses.Failed or SessionExecutionStatuses.Cancelled))
            return Results.Conflict(new SessionErrorResponse("execution_not_retryable", "この生成処理は再試行できません。"));
        SessionExecutionStateMachine.Transition(execution, SessionExecutionStatuses.Queued);
        execution.QueuedAt = DateTimeOffset.UtcNow; execution.CompletedAt = null; execution.NextAttemptAt = null; execution.DismissedAt = null;
        await db.SaveChangesAsync(cancellationToken);
        SessionExecutionTelemetry.Enqueued.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
        return Results.Ok(SessionExecutionProjection.ToResponse(execution, environment.IsDevelopment()));
    }

    private static async Task<IResult> CancelAsync(string executionId, ClaimsPrincipal principal, ApplicationDbContext db, IHostEnvironment environment, CancellationToken cancellationToken)
    {
        var owner = principal.FindFirstValue(ClaimTypes.NameIdentifier); if (owner is null) return Results.Unauthorized();
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var execution = await LoadForUpdateAsync(executionId, db, cancellationToken);
        if (execution is null)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return Results.NotFound();
        }
        await db.Entry(execution).Reference(item => item.Session).LoadAsync(cancellationToken);
        await db.Entry(execution).Collection(item => item.Attempts).LoadAsync(cancellationToken);
        if (execution.Session.OwnerId != owner)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return Results.NotFound();
        }
        if (execution.Status is SessionExecutionStatuses.Cancelled or SessionExecutionStatuses.Succeeded or SessionExecutionStatuses.Failed or SessionExecutionStatuses.Superseded)
        {
            await transaction.CommitAsync(cancellationToken);
            return Results.Ok(SessionExecutionProjection.ToResponse(execution, environment.IsDevelopment()));
        }
        var now = DateTimeOffset.UtcNow;
        if (execution.Status == SessionExecutionStatuses.Queued || execution.Status == SessionExecutionStatuses.RetryWait)
        {
            SessionExecutionStateMachine.Transition(execution, SessionExecutionStatuses.CancelRequested);
            execution.CancelRequestedAt = now;
            SessionExecutionStateMachine.Transition(execution, SessionExecutionStatuses.Cancelled);
            execution.CompletedAt = now; execution.LeaseToken = null; execution.LeaseOwner = null; execution.LeaseExpiresAt = null;
        }
        else if (execution.Status == SessionExecutionStatuses.Running)
        {
            SessionExecutionStateMachine.Transition(execution, SessionExecutionStatuses.CancelRequested);
            execution.CancelRequestedAt = now;
        }
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Ok(SessionExecutionProjection.ToResponse(execution, environment.IsDevelopment()));
    }

    private static Task<SessionExecution?> LoadForUpdateAsync(
        string executionId,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        if (db.Database.IsNpgsql())
        {
            return db.SessionExecutions.FromSqlInterpolated($$"""
                SELECT *
                FROM "SessionExecutions"
                WHERE "Id" = {{executionId}}
                FOR UPDATE
                """).SingleOrDefaultAsync(cancellationToken);
        }

        return db.SessionExecutions.SingleOrDefaultAsync(item => item.Id == executionId, cancellationToken);
    }

    private static async Task<IResult> DismissAsync(string executionId, ClaimsPrincipal principal, ApplicationDbContext db, IHostEnvironment environment, CancellationToken cancellationToken)
    {
        var owner = principal.FindFirstValue(ClaimTypes.NameIdentifier); if (owner is null) return Results.Unauthorized();
        var execution = await db.SessionExecutions.Include(item => item.Attempts).SingleOrDefaultAsync(item => item.Id == executionId && item.Session.OwnerId == owner, cancellationToken);
        if (execution is null) return Results.NotFound();
        if (SessionExecutionStatuses.IsTerminal(execution.Status)) { execution.DismissedAt ??= DateTimeOffset.UtcNow; await db.SaveChangesAsync(cancellationToken); }
        return Results.Ok(SessionExecutionProjection.ToResponse(execution, environment.IsDevelopment()));
    }
}
