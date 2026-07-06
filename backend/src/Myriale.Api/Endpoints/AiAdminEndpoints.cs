using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Endpoints;

public static class AiAdminEndpoints
{
    public static RouteGroupBuilder MapAiAdminEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/admin/ai-keys")
            .WithTags("Admin AI Keys")
            .RequireCors("MyrialeFrontend")
            .RequireAuthorization();

        group.MapGet("/", ListAsync).WithName("ListAiProviderKeys");
        group.MapPut("/{provider}", UpsertAsync).WithName("UpsertAiProviderKey");
        group.MapDelete("/{provider}", DeleteAsync).WithName("DeleteAiProviderKey");
        group.MapPost("/{provider}/test", TestAsync).WithName("TestAiProviderKey");

        return group;
    }

    private static async Task<Ok<IReadOnlyList<AiProviderKeyResponse>>> ListAsync(ApplicationDbContext db, CancellationToken cancellationToken)
    {
        var rows = await db.AiProviderKeys.OrderBy(key => key.Provider).ToListAsync(cancellationToken);
        return TypedResults.Ok<IReadOnlyList<AiProviderKeyResponse>>(rows.Select(ToResponse).ToArray());
    }

    private static async Task<Results<Ok<AiProviderKeyResponse>, BadRequest<AiAdminErrorResponse>>> UpsertAsync(
        string provider,
        UpsertAiProviderKeyRequest request,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        provider = NormalizeProvider(provider);
        var errors = Validate(provider, request);
        if (errors.Count > 0) return TypedResults.BadRequest(new AiAdminErrorResponse("AIキー設定を確認してください。", errors));

        var row = await db.AiProviderKeys.FindAsync([provider], cancellationToken);
        if (row is null)
        {
            row = new AiProviderKey { Provider = provider };
            db.AiProviderKeys.Add(row);
        }

        row.DisplayName = request.DisplayName.Trim();
        row.Secret = request.Secret.Trim();
        row.Status = "saved";
        row.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok(ToResponse(row));
    }

    private static async Task<NoContent> DeleteAsync(string provider, ApplicationDbContext db, CancellationToken cancellationToken)
    {
        provider = NormalizeProvider(provider);
        var row = await db.AiProviderKeys.FindAsync([provider], cancellationToken);
        if (row is not null)
        {
            db.AiProviderKeys.Remove(row);
            await db.SaveChangesAsync(cancellationToken);
        }

        return TypedResults.NoContent();
    }

    private static async Task<Results<Ok<AiProviderKeyResponse>, NotFound>> TestAsync(string provider, ApplicationDbContext db, CancellationToken cancellationToken)
    {
        provider = NormalizeProvider(provider);
        var row = await db.AiProviderKeys.FindAsync([provider], cancellationToken);
        if (row is null) return TypedResults.NotFound();

        row.Status = "mock-validated";
        row.LastValidatedAt = DateTimeOffset.UtcNow;
        row.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok(ToResponse(row));
    }

    private static Dictionary<string, string[]> Validate(string provider, UpsertAiProviderKeyRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(provider)) errors["provider"] = ["プロバイダーIDを指定してください。"];
        if (string.IsNullOrWhiteSpace(request.DisplayName)) errors["displayName"] = ["表示名を入力してください。"];
        if (string.IsNullOrWhiteSpace(request.Secret)) errors["secret"] = ["APIキーを入力してください。"];
        return errors;
    }

    private static string NormalizeProvider(string provider) => provider.Trim().ToLowerInvariant();

    private static AiProviderKeyResponse ToResponse(AiProviderKey key) => new(
        key.Provider,
        key.DisplayName,
        !string.IsNullOrWhiteSpace(key.Secret),
        Mask(key.Secret),
        key.Status,
        key.UpdatedAt,
        key.LastValidatedAt);

    private static string Mask(string secret)
    {
        if (string.IsNullOrWhiteSpace(secret)) return "未設定";
        var tail = secret.Length <= 4 ? secret : secret[^4..];
        return $"••••••••{tail}";
    }
}
