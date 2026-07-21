using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Endpoints;

public static class AiAdminEndpoints
{
    public static RouteGroupBuilder MapAiAdminEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/admin/ai-keys")
            .WithTags("Admin AI Keys")
            .RequireCors("MyrialeFrontend")
            .RequireAuthorization("AiAdministration");
        group.MapGet("/", ListAsync);
        group.MapPut("/{provider}", UpsertAsync);
        group.MapDelete("/{provider}", DeleteAsync);
        group.MapPost("/{provider}/test", TestAsync);
        return group;
    }

    private static async Task<IResult> ListAsync(ApplicationDbContext db, CancellationToken cancellationToken)
    {
        var rows = await db.AiProviderKeys.AsNoTracking().OrderBy(key => key.Provider).ToListAsync(cancellationToken);
        return Results.Ok(rows.Select(ToResponse));
    }

    private static async Task<IResult> UpsertAsync(string provider, UpsertAiProviderKeyRequest request, IAiCredentialStore store, ApplicationDbContext db, CancellationToken cancellationToken)
    {
        provider = Normalize(provider);
        var errors = Validate(provider, request);
        if (errors.Count > 0) return Results.BadRequest(new AiAdminErrorResponse("AIキー設定を確認してください。", errors));
        await store.SaveAsync(provider, request.DisplayName.Trim(), request.Secret.Trim(), cancellationToken);
        return Results.Ok(ToResponse(await db.AiProviderKeys.AsNoTracking().SingleAsync(x => x.Provider == provider, cancellationToken)));
    }

    private static async Task<IResult> DeleteAsync(string provider, IAiCredentialStore store, CancellationToken cancellationToken)
    {
        await store.DeleteAsync(Normalize(provider), cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> TestAsync(string provider, IAiCredentialStore store, IAiTextProvider textProvider, ApplicationDbContext db, CancellationToken cancellationToken)
    {
        provider = Normalize(provider);
        var row = await db.AiProviderKeys.SingleOrDefaultAsync(x => x.Provider == provider, cancellationToken);
        if (row is null) return Results.NotFound();
        var secret = await store.GetAsync(provider, cancellationToken);
        if (string.IsNullOrWhiteSpace(secret)) return Results.Problem(statusCode: 503, title: AiProviderErrorCodes.InvalidCredential);
        try
        {
            await textProvider.TestConnectionAsync(provider, secret, cancellationToken);
            row.Status = "valid";
            row.LastValidatedAt = row.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToResponse(row));
        }
        catch (AiProviderException exception)
        {
            row.Status = exception.Code.Replace('_', '-');
            row.LastValidatedAt = row.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(CancellationToken.None);
            var status = exception.Code == AiProviderErrorCodes.RateLimited ? 429
                : exception.Code is AiProviderErrorCodes.InvalidCredential or AiProviderErrorCodes.ModelNotFound ? 400 : 503;
            return Results.Problem(statusCode: status, title: exception.Code, detail: "AI Providerとの疎通確認に失敗しました。");
        }
    }

    private static Dictionary<string, string[]> Validate(string provider, UpsertAiProviderKeyRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (provider is not ("openai" or "runpod")) errors["provider"] = ["openai または runpod を指定してください。"];
        if (string.IsNullOrWhiteSpace(request.DisplayName)) errors["displayName"] = ["表示名を入力してください。"];
        if (string.IsNullOrWhiteSpace(request.Secret)) errors["secret"] = ["APIキーを入力してください。"];
        return errors;
    }
    private static string Normalize(string provider) => provider.Trim().ToLowerInvariant();
    private static AiProviderKeyResponse ToResponse(AiProviderKey key) => new(key.Provider, key.DisplayName, !string.IsNullOrWhiteSpace(key.Secret), string.IsNullOrWhiteSpace(key.SecretHint) ? "未設定" : $"••••••••{key.SecretHint}", key.Status, key.UpdatedAt, key.LastValidatedAt);
}
