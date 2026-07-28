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
            .WithTags("Admin AI Profiles")
            .RequireCors("MyrialeFrontend")
            .RequireAuthorization("AiAdministration");
        group.MapGet("/", ListAsync);
        group.MapPut("/active-provider", ActivateAsync);
        group.MapPost("/{provider}/prompt-test", PromptTestAsync);
        group.MapPut("/{provider}", UpsertAsync);
        group.MapDelete("/{provider}", DeleteAsync);
        group.MapPost("/{provider}/test", TestAsync);
        return group;
    }

    private static async Task<IResult> ListAsync(
        IAiCredentialStore store,
        IAiProviderSelectionStore selection,
        IAiProfileCatalog catalog,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var activeProvider = await selection.GetActiveProviderAsync(cancellationToken);
        var snapshot = await catalog.GetAsync(cancellationToken);
        var definitions = await db.AiProviderProfileDefinitions.AsNoTracking()
            .ToDictionaryAsync(item => item.Id, StringComparer.OrdinalIgnoreCase, cancellationToken);
        var keys = await db.AiProviderKeys.AsNoTracking()
            .ToDictionaryAsync(item => item.Provider, StringComparer.OrdinalIgnoreCase, cancellationToken);
        var responses = new List<AiProviderKeyResponse>();
        foreach (var profile in snapshot.Profiles.Values)
        {
            definitions.TryGetValue(profile.Id, out var definition);
            keys.TryGetValue(profile.CredentialId, out var key);
            responses.Add(await ToResponseAsync(profile, definition is null ? "configuration" : "database", key, activeProvider, store, cancellationToken));
        }
        foreach (var definition in definitions.Values.Where(item => !item.Enabled))
        {
            keys.TryGetValue(definition.CredentialId, out var key);
            responses.Add(await ToResponseAsync(ToDescriptor(definition), "database", key, activeProvider, store, cancellationToken));
        }
        return Results.Ok(responses.OrderBy(item => item.Provider, StringComparer.Ordinal));
    }

    private static async Task<IResult> ActivateAsync(
        ActivateAiProviderRequest request,
        IAiCredentialStore store,
        IAiProviderSelectionStore selection,
        IAiProfileCatalog catalog,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        AiProfileDescriptor profile;
        try { profile = await catalog.ResolveAsync(request.Provider, cancellationToken); }
        catch (AiProviderException exception) { return ValidationProblem("使用するAI profileを確認してください。", "provider", exception.Message); }
        if (string.IsNullOrWhiteSpace(profile.ApiKey) && string.IsNullOrWhiteSpace(await store.GetAsync(profile.CredentialId, cancellationToken)))
            return Results.Conflict(new AiAdminErrorResponse("先にcredentialを登録してください。", new Dictionary<string, string[]> { ["provider"] = ["Credential未設定のprofileは使用できません。"] }));
        await selection.SetActiveProviderAsync(profile.Id, cancellationToken);
        var key = await db.AiProviderKeys.AsNoTracking().SingleOrDefaultAsync(x => x.Provider == profile.CredentialId, cancellationToken);
        var isDb = await db.AiProviderProfileDefinitions.AnyAsync(item => item.Id == profile.Id, cancellationToken);
        return Results.Ok(await ToResponseAsync(profile, isDb ? "database" : "configuration", key, profile.Id, store, cancellationToken));
    }

    private static async Task<IResult> UpsertAsync(
        string provider,
        UpsertAiProviderKeyRequest request,
        IAiCredentialStore store,
        IAiProviderSelectionStore selection,
        IAiProfileCatalog catalog,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        provider = Normalize(provider);
        AiProfileDescriptor? existing = null;
        try { existing = await catalog.ResolveAsync(provider, cancellationToken); } catch (AiProviderException) { }
        var adapter = First(request.Adapter, existing?.Adapter, "openai-compatible")!;
        var baseUrl = First(request.BaseUrl, existing?.BaseUrl);
        var model = First(request.Model, existing?.Model);
        var credentialId = Normalize(First(request.CredentialId, existing?.CredentialId, provider)!);
        var errors = Validate(provider, request.DisplayName, adapter, baseUrl, model, credentialId);
        if (errors.Count > 0) return Results.BadRequest(new AiAdminErrorResponse("AI profile設定を確認してください。", errors));

        var row = await db.AiProviderProfileDefinitions.FindAsync([provider], cancellationToken);
        if (row is null)
        {
            row = new AiProviderProfileDefinition { Id = provider };
            db.AiProviderProfileDefinitions.Add(row);
        }
        row.DisplayName = request.DisplayName.Trim();
        row.Adapter = adapter.Trim().ToLowerInvariant();
        row.BaseUrl = baseUrl!.Trim().TrimEnd('/');
        row.Model = model!.Trim();
        row.CredentialId = credentialId;
        row.Enabled = request.Enabled;
        row.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(request.Secret))
            await store.SaveAsync(credentialId, request.DisplayName.Trim(), request.Secret.Trim(), cancellationToken);

        var profile = row.Enabled ? await catalog.ResolveAsync(row.Id, cancellationToken) : ToDescriptor(row);
        var key = await db.AiProviderKeys.AsNoTracking().SingleOrDefaultAsync(x => x.Provider == credentialId, cancellationToken);
        var activeProvider = await selection.GetActiveProviderAsync(cancellationToken);
        return Results.Ok(await ToResponseAsync(profile, "database", key, activeProvider, store, cancellationToken));
    }

    private static async Task<IResult> DeleteAsync(string provider, IAiCredentialStore store, ApplicationDbContext db, CancellationToken cancellationToken)
    {
        provider = Normalize(provider);
        var definition = await db.AiProviderProfileDefinitions.FindAsync([provider], cancellationToken);
        if (definition is not null)
        {
            db.AiProviderProfileDefinitions.Remove(definition);
            await db.SaveChangesAsync(cancellationToken);
            await store.DeleteAsync(definition.CredentialId, cancellationToken);
        }
        else
        {
            // Backward compatibility: deleting a legacy route removes its same-named DB credential override.
            await store.DeleteAsync(provider, cancellationToken);
        }
        return Results.NoContent();
    }

    private static async Task<IResult> TestAsync(string provider, IAiCredentialStore store, IAiProfileCatalog catalog, IAiProviderSelectionStore selection, IAiTextProvider textProvider, ApplicationDbContext db, IHostEnvironment environment, CancellationToken cancellationToken)
    {
        AiProfileDescriptor profile;
        try { profile = await catalog.ResolveAsync(provider, cancellationToken); }
        catch (AiProviderException) { return Results.NotFound(); }
        var secret = profile.ApiKey ?? await store.GetAsync(profile.CredentialId, cancellationToken);
        if (string.IsNullOrWhiteSpace(secret)) return Results.Problem(statusCode: 503, title: AiProviderErrorCodes.InvalidCredential);
        var row = await db.AiProviderKeys.SingleOrDefaultAsync(x => x.Provider == profile.CredentialId, cancellationToken);
        if (row is null)
        {
            row = new AiProviderKey { Provider = profile.CredentialId, DisplayName = profile.DisplayName };
            db.AiProviderKeys.Add(row);
        }
        try
        {
            await textProvider.TestConnectionAsync(profile.Id, secret, cancellationToken);
            row.Status = "valid";
            row.LastValidatedAt = row.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            var activeProvider = await selection.GetActiveProviderAsync(cancellationToken);
            var isDb = await db.AiProviderProfileDefinitions.AnyAsync(item => item.Id == profile.Id, cancellationToken);
            return Results.Ok(await ToResponseAsync(profile, isDb ? "database" : "configuration", row, activeProvider, store, cancellationToken));
        }
        catch (AiProviderException exception)
        {
            row.Status = exception.Code.Replace('_', '-');
            row.LastValidatedAt = row.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(CancellationToken.None);
            var status = exception.Code == AiProviderErrorCodes.RateLimited ? 429
                : exception.Code is AiProviderErrorCodes.InvalidCredential or AiProviderErrorCodes.ModelNotFound ? 400 : 503;
            return Results.Problem(statusCode: status, title: exception.Code,
                detail: DevelopmentErrorDetails.Message(environment, "AI Providerとの疎通確認に失敗しました。", exception));
        }
    }

    private static async Task<IResult> PromptTestAsync(string provider, AiPromptTestRequest request, IAiCredentialStore store, IAiProfileCatalog catalog, IAiTextProvider textProvider, IHostEnvironment environment, CancellationToken cancellationToken)
    {
        AiProfileDescriptor profile;
        try { profile = await catalog.ResolveAsync(provider, cancellationToken); }
        catch (AiProviderException) { return Results.NotFound(); }
        var credential = profile.ApiKey ?? await store.GetAsync(profile.CredentialId, cancellationToken);
        if (string.IsNullOrWhiteSpace(credential))
            return Results.Conflict(new AiAdminErrorResponse("先にcredentialを登録してください。", new Dictionary<string, string[]> { ["provider"] = ["Credential未設定のprofileはテストできません。"] }));
        var prompt = request.Prompt?.Trim();
        if (string.IsNullOrWhiteSpace(prompt) || prompt.Length > 10_000)
            return ValidationProblem("テスト用プロンプトを確認してください。", "prompt", "プロンプトを1文字以上10,000文字以内で入力してください。");

        using var schema = JsonDocument.Parse("{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"response\":{\"type\":\"string\"}},\"required\":[\"response\"]}");
        try
        {
            var generated = await textProvider.GenerateForProviderAsync(profile.Id, credential, new AiTextRequest(
                [new ChatMessage(ChatRole.System, "Return JSON that matches the response schema. Put your answer to the administrator's test prompt in the response field."), new ChatMessage(ChatRole.User, prompt)],
                ChatResponseFormat.ForJsonSchema(schema.RootElement, "myriale_admin_prompt_test")), cancellationToken);
            using var document = JsonDocument.Parse(generated.Text);
            var response = document.RootElement.GetProperty("response").GetString();
            if (string.IsNullOrWhiteSpace(response)) throw new JsonException("The response field was empty.");
            return Results.Ok(new AiPromptTestResponse(generated.Metadata.Provider, generated.Metadata.Model, response,
                generated.Metadata.InputTokens, generated.Metadata.OutputTokens, generated.Metadata.LatencyMilliseconds, generated.Metadata.FinishReason));
        }
        catch (AiProviderException exception)
        {
            var status = exception.Code == AiProviderErrorCodes.RateLimited ? 429
                : exception.Code is AiProviderErrorCodes.InvalidCredential or AiProviderErrorCodes.ModelNotFound ? 400 : 503;
            return Results.Problem(statusCode: status, title: exception.Code,
                detail: DevelopmentErrorDetails.Message(environment, "AI Providerへのテストプロンプト送信に失敗しました。", exception));
        }
        catch (JsonException exception)
        {
            return Results.Problem(statusCode: StatusCodes.Status502BadGateway, title: AiProviderErrorCodes.SchemaFailure,
                detail: DevelopmentErrorDetails.Message(environment, "AI Providerの応答形式を確認できませんでした。", exception));
        }
    }

    private static Dictionary<string, string[]> Validate(string id, string displayName, string adapter, string? baseUrl, string? model, string credentialId)
    {
        var errors = new Dictionary<string, string[]>();
        if (id.Length is 0 or > 80 || id.Any(character => !(char.IsLetterOrDigit(character) || character is '-' or '_' or '.'))) errors["provider"] = ["IDは英数字と . _ - で指定してください。"];
        if (string.IsNullOrWhiteSpace(displayName)) errors["displayName"] = ["表示名を入力してください。"];
        if (!string.Equals(adapter, "openai-compatible", StringComparison.OrdinalIgnoreCase)) errors["adapter"] = ["openai-compatible を指定してください。"];
        if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https")) errors["baseUrl"] = ["HTTP(S)の絶対URLを入力してください。"];
        if (string.IsNullOrWhiteSpace(model)) errors["model"] = ["Modelを入力してください。"];
        if (credentialId.Length is 0 or > 80) errors["credentialId"] = ["Credential IDを入力してください。"];
        return errors;
    }

    private static async Task<AiProviderKeyResponse> ToResponseAsync(AiProfileDescriptor profile, string definitionSource, AiProviderKey? key, string activeProvider, IAiCredentialStore store, CancellationToken cancellationToken)
    {
        var configuredSecret = profile.ApiKey;
        var databaseSecret = string.IsNullOrWhiteSpace(configuredSecret) ? await store.GetAsync(profile.CredentialId, cancellationToken) : null;
        var secret = configuredSecret ?? databaseSecret;
        var credentialSource = !string.IsNullOrWhiteSpace(configuredSecret) ? "environment" : !string.IsNullOrWhiteSpace(databaseSecret) ? "database" : "none";
        return new AiProviderKeyResponse(profile.Id, profile.DisplayName, profile.Adapter, profile.BaseUrl, profile.Model, profile.CredentialId,
            profile.Enabled, definitionSource, !string.IsNullOrWhiteSpace(secret), string.IsNullOrWhiteSpace(secret) ? "未設定" : store.Mask(secret), credentialSource,
            string.Equals(activeProvider, profile.Id, StringComparison.OrdinalIgnoreCase), key?.Status ?? "untested", key?.UpdatedAt ?? default, key?.LastValidatedAt);
    }

    private static AiProfileDescriptor ToDescriptor(AiProviderProfileDefinition definition) =>
        new(definition.Id, definition.DisplayName, definition.Adapter, definition.BaseUrl, definition.Model, definition.CredentialId, definition.Enabled);
    private static IResult ValidationProblem(string message, string field, string error) =>
        Results.BadRequest(new AiAdminErrorResponse(message, new Dictionary<string, string[]> { [field] = [error] }));
    private static string Normalize(string value) => value.Trim().ToLowerInvariant();
    private static string? First(params string?[] values) => values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim();
}
