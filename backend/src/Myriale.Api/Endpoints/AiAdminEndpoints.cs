using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
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
        group.MapPut("/active-provider", ActivateAsync);
        group.MapPost("/active-provider/prompt-test", PromptTestAsync);
        group.MapPut("/{provider}", UpsertAsync);
        group.MapDelete("/{provider}", DeleteAsync);
        group.MapPost("/{provider}/test", TestAsync);
        return group;
    }

    private static readonly string[] SupportedProviders = ["openai", "runpod"];

    private static async Task<IResult> ListAsync(IAiCredentialStore store, IAiProviderSelectionStore selection, ApplicationDbContext db, IConfiguration configuration, CancellationToken cancellationToken)
    {
        var activeProvider = await selection.GetActiveProviderAsync(cancellationToken);
        var rows = await db.AiProviderKeys.AsNoTracking().ToDictionaryAsync(key => key.Provider, StringComparer.OrdinalIgnoreCase, cancellationToken);
        var providers = SupportedProviders.Concat(rows.Keys).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(provider => provider);
        var responses = new List<AiProviderKeyResponse>();
        foreach (var provider in providers)
        {
            rows.TryGetValue(provider, out var row);
            responses.Add(await ToResponseAsync(provider, row, activeProvider, store, configuration, cancellationToken));
        }
        return Results.Ok(responses);
    }

    private static async Task<IResult> ActivateAsync(ActivateAiProviderRequest request, IAiCredentialStore store, IAiProviderSelectionStore selection, ApplicationDbContext db, IConfiguration configuration, CancellationToken cancellationToken)
    {
        var provider = Normalize(request.Provider);
        if (provider is not ("openai" or "runpod"))
            return Results.BadRequest(new AiAdminErrorResponse("使用するAI Providerを確認してください。", new Dictionary<string, string[]> { ["provider"] = ["openai または runpod を指定してください。"] }));
        if (string.IsNullOrWhiteSpace(await store.GetAsync(provider, cancellationToken)))
            return Results.Conflict(new AiAdminErrorResponse("先にAIキーを登録してください。", new Dictionary<string, string[]> { ["provider"] = ["未設定のProviderは使用できません。"] }));

        await selection.SetActiveProviderAsync(provider, cancellationToken);
        var row = await db.AiProviderKeys.AsNoTracking().SingleOrDefaultAsync(x => x.Provider == provider, cancellationToken);
        return Results.Ok(await ToResponseAsync(provider, row, provider, store, configuration, cancellationToken));
    }

    private static async Task<IResult> UpsertAsync(string provider, UpsertAiProviderKeyRequest request, IAiCredentialStore store, IAiProviderSelectionStore selection, ApplicationDbContext db, IConfiguration configuration, CancellationToken cancellationToken)
    {
        provider = Normalize(provider);
        var errors = Validate(provider, request);
        if (errors.Count > 0) return Results.BadRequest(new AiAdminErrorResponse("AIキー設定を確認してください。", errors));
        await store.SaveAsync(provider, request.DisplayName.Trim(), request.Secret.Trim(), cancellationToken);
        var row = await db.AiProviderKeys.AsNoTracking().SingleAsync(x => x.Provider == provider, cancellationToken);
        var activeProvider = await selection.GetActiveProviderAsync(cancellationToken);
        return Results.Ok(await ToResponseAsync(provider, row, activeProvider, store, configuration, cancellationToken));
    }

    private static async Task<IResult> DeleteAsync(string provider, IAiCredentialStore store, CancellationToken cancellationToken)
    {
        await store.DeleteAsync(Normalize(provider), cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> TestAsync(string provider, IAiCredentialStore store, IAiProviderSelectionStore selection, IAiTextProvider textProvider, ApplicationDbContext db, IConfiguration configuration, IHostEnvironment environment, CancellationToken cancellationToken)
    {
        provider = Normalize(provider);
        if (provider is not ("openai" or "runpod")) return Results.NotFound();
        var secret = await store.GetAsync(provider, cancellationToken);
        if (string.IsNullOrWhiteSpace(secret)) return Results.Problem(statusCode: 503, title: AiProviderErrorCodes.InvalidCredential);
        var row = await db.AiProviderKeys.SingleOrDefaultAsync(x => x.Provider == provider, cancellationToken);
        if (row is null)
        {
            row = new AiProviderKey { Provider = provider, DisplayName = DefaultDisplayName(provider) };
            db.AiProviderKeys.Add(row);
        }
        try
        {
            await textProvider.TestConnectionAsync(provider, secret, cancellationToken);
            row.Status = "valid";
            row.LastValidatedAt = row.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            var activeProvider = await selection.GetActiveProviderAsync(cancellationToken);
            return Results.Ok(await ToResponseAsync(provider, row, activeProvider, store, configuration, cancellationToken));
        }
        catch (AiProviderException exception)
        {
            row.Status = exception.Code.Replace('_', '-');
            row.LastValidatedAt = row.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(CancellationToken.None);
            var status = exception.Code == AiProviderErrorCodes.RateLimited ? 429
                : exception.Code is AiProviderErrorCodes.InvalidCredential or AiProviderErrorCodes.ModelNotFound ? 400 : 503;
            return Results.Problem(
                statusCode: status,
                title: exception.Code,
                detail: DevelopmentErrorDetails.Message(environment, "AI Providerとの疎通確認に失敗しました。", exception));
        }
    }

    private static async Task<IResult> PromptTestAsync(
        AiPromptTestRequest request,
        IAiTextProvider textProvider,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        var prompt = request.Prompt?.Trim();
        if (string.IsNullOrWhiteSpace(prompt) || prompt.Length > 10_000)
            return Results.BadRequest(new AiAdminErrorResponse(
                "テスト用プロンプトを確認してください。",
                new Dictionary<string, string[]> { ["prompt"] = ["プロンプトを1文字以上10,000文字以内で入力してください。"] }));

        using var schema = JsonDocument.Parse("{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"response\":{\"type\":\"string\"}},\"required\":[\"response\"]}");
        try
        {
            var generated = await textProvider.GenerateAsync(new AiTextRequest(
                [
                    new ChatMessage(ChatRole.System, "Return JSON that matches the response schema. Put your answer to the administrator's test prompt in the response field."),
                    new ChatMessage(ChatRole.User, prompt),
                ],
                ChatResponseFormat.ForJsonSchema(schema.RootElement, "myriale_admin_prompt_test")), cancellationToken);
            using var document = JsonDocument.Parse(generated.Text);
            var response = document.RootElement.GetProperty("response").GetString();
            if (string.IsNullOrWhiteSpace(response)) throw new JsonException("The response field was empty.");
            return Results.Ok(new AiPromptTestResponse(
                generated.Metadata.Provider,
                generated.Metadata.Model,
                response,
                generated.Metadata.InputTokens,
                generated.Metadata.OutputTokens,
                generated.Metadata.LatencyMilliseconds,
                generated.Metadata.FinishReason));
        }
        catch (AiProviderException exception)
        {
            var status = exception.Code == AiProviderErrorCodes.RateLimited ? 429
                : exception.Code is AiProviderErrorCodes.InvalidCredential or AiProviderErrorCodes.ModelNotFound ? 400 : 503;
            return Results.Problem(
                statusCode: status,
                title: exception.Code,
                detail: DevelopmentErrorDetails.Message(environment, "AI Providerへのテストプロンプト送信に失敗しました。", exception));
        }
        catch (JsonException exception)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status502BadGateway,
                title: AiProviderErrorCodes.SchemaFailure,
                detail: DevelopmentErrorDetails.Message(environment, "AI Providerの応答形式を確認できませんでした。", exception));
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

    private static async Task<AiProviderKeyResponse> ToResponseAsync(string provider, AiProviderKey? key, string activeProvider, IAiCredentialStore store, IConfiguration configuration, CancellationToken cancellationToken)
    {
        var environmentSecret = configuration[$"AiProvider:Providers:{provider}:ApiKey"];
        if (string.IsNullOrWhiteSpace(environmentSecret)
            && string.Equals(configuration["AiProvider:Provider"], provider, StringComparison.OrdinalIgnoreCase))
            environmentSecret = configuration["AiProvider:ApiKey"];
        var credentialSource = !string.IsNullOrWhiteSpace(environmentSecret) ? "environment"
            : !string.IsNullOrWhiteSpace(key?.Secret) ? "database" : "none";
        var secret = credentialSource == "none" ? null : await store.GetAsync(provider, cancellationToken);
        return new AiProviderKeyResponse(
            provider,
            string.IsNullOrWhiteSpace(key?.DisplayName) ? DefaultDisplayName(provider) : key.DisplayName,
            !string.IsNullOrWhiteSpace(secret),
            string.IsNullOrWhiteSpace(secret) ? "未設定" : store.Mask(secret),
            credentialSource,
            string.Equals(activeProvider, provider, StringComparison.OrdinalIgnoreCase),
            key?.Status ?? "untested",
            key?.UpdatedAt ?? default,
            key?.LastValidatedAt);
    }

    private static string DefaultDisplayName(string provider) => provider == "runpod" ? "Runpod Serverless" : "OpenAI";
    private static string Normalize(string provider) => provider.Trim().ToLowerInvariant();
}
