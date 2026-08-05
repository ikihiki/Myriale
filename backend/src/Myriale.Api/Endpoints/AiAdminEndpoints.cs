using Myriale.Api.Application.AiProviders;
using Myriale.Api.Contracts;

namespace Myriale.Api.Endpoints;

public static class AiAdminEndpoints
{
    public static RouteGroupBuilder MapAiAdminEndpoints(this IEndpointRouteBuilder routes)
    {
        var profiles = routes.MapGroup("/api/admin/ai-profiles").WithTags("Admin AI Profiles").RequireCors("MyrialeFrontend").RequireAuthorization("AiAdministration");
        profiles.MapGet("/", async (AiProviderAdministrationQueryService query, CancellationToken ct) => Results.Ok(await query.ListProfilesAsync(ct)));
        profiles.MapPost("/", CreateProfileAsync);
        profiles.MapPut("/{id}", UpdateProfileAsync);
        profiles.MapPost("/{id}/enable", EnableProfileAsync);
        profiles.MapPost("/{id}/disable", DisableProfileAsync);
        profiles.MapDelete("/{id}", DeleteProfileAsync);
        profiles.MapPut("/active", ActivateAsync);
        profiles.MapPost("/{id}/connection-tests", ConnectionTestAsync);
        profiles.MapPost("/{id}/prompt-tests", PromptTestAsync);

        var credentials = routes.MapGroup("/api/admin/ai-credentials").WithTags("Admin AI Credentials").RequireCors("MyrialeFrontend").RequireAuthorization("AiAdministration");
        credentials.MapGet("/", async (AiProviderAdministrationQueryService query, CancellationToken ct) => Results.Ok(await query.ListCredentialsAsync(ct)));
        credentials.MapPost("/", SetCredentialAsync);
        credentials.MapPut("/{id}", ReplaceCredentialAsync);
        credentials.MapDelete("/{id}", DeleteCredentialAsync);
        return profiles;
    }

    private static async Task<IResult> CreateProfileAsync(CreateAiProviderProfileRequest request, AiProviderProfileUseCases useCases, AiProviderAdministrationQueryService query, CancellationToken ct) =>
        await MapProfileAsync(await useCases.CreateAsync(new(request.Id, request.DisplayName, request.BaseUrl, request.Model, request.CredentialId, request.Enabled), ct), query, ct, created: true);
    private static async Task<IResult> UpdateProfileAsync(string id, UpdateAiProviderProfileRequest request, AiProviderProfileUseCases useCases, AiProviderAdministrationQueryService query, CancellationToken ct) =>
        await MapProfileAsync(await useCases.UpdateAsync(new(id, request.DisplayName, request.BaseUrl, request.Model, request.CredentialId, request.ExpectedRevision), ct), query, ct);
    private static async Task<IResult> EnableProfileAsync(string id, ExpectedRevisionRequest request, AiProviderProfileUseCases useCases, AiProviderAdministrationQueryService query, CancellationToken ct) =>
        await MapProfileAsync(await useCases.EnableAsync(new(id, request.ExpectedRevision), ct), query, ct);
    private static async Task<IResult> DisableProfileAsync(string id, ExpectedRevisionRequest request, AiProviderProfileUseCases useCases, AiProviderAdministrationQueryService query, CancellationToken ct) =>
        await MapProfileAsync(await useCases.DisableAsync(new(id, request.ExpectedRevision), ct), query, ct);
    private static async Task<IResult> DeleteProfileAsync(string id, long expectedRevision, AiProviderProfileUseCases useCases, CancellationToken ct) => Map(await useCases.DeleteAsync(new(id, expectedRevision), ct), noContent: true);

    private static async Task<IResult> SetCredentialAsync(SetAiCredentialRequest request, AiCredentialUseCases useCases, CancellationToken ct) => MapCredential(await useCases.SetAsync(new(request.Id, request.DisplayName, request.Secret), ct), created: true);
    private static async Task<IResult> ReplaceCredentialAsync(string id, ReplaceAiCredentialRequest request, AiCredentialUseCases useCases, CancellationToken ct) => MapCredential(await useCases.ReplaceAsync(new(id, request.DisplayName, request.Secret, request.ExpectedRevision), ct));
    private static async Task<IResult> DeleteCredentialAsync(string id, long expectedRevision, AiCredentialUseCases useCases, CancellationToken ct) => Map(await useCases.DeleteAsync(new(id, expectedRevision), ct), noContent: true);

    private static async Task<IResult> ActivateAsync(ActivateAiProviderRequest request, ActivateAiProviderUseCase useCase, AiProviderAdministrationQueryService query, CancellationToken ct)
    {
        var result = await useCase.ExecuteAsync(new(request.Provider, request.ExpectedRevision), ct);
        if (result.Outcome == ActivateAiProviderOutcome.UnknownProvider) return Results.NotFound(Error(result.ErrorMessage));
        if (result.Outcome == ActivateAiProviderOutcome.CredentialMissing) return Results.Conflict(Error(result.ErrorMessage));
        if (result.Outcome == ActivateAiProviderOutcome.Conflict) return Results.Conflict(Error(result.ErrorMessage));
        return Results.Ok((await query.ListProfilesAsync(ct)).Single(x => x.Id == result.Profile!.Id));
    }
    private static async Task<IResult> ConnectionTestAsync(string id, AiProfileTestRequest request, AiProviderTestUseCases useCases, CancellationToken ct)
    {
        var result = await useCases.TestConnectionAsync(new(id, request.ExpectedProfileRevision, request.ExpectedCredentialRevision), ct);
        var response = result.Value is null ? null : new AiConnectionTestResponse(
            result.Value.ProfileId, result.Value.ProfileRevision, result.Value.CredentialId, result.Value.CredentialRevision,
            Wire(result.Value.Status), result.Value.TestedAt);
        return result.Outcome switch
        {
            AiAdministrationOutcome.Success => Results.Ok(response),
            AiAdministrationOutcome.ProviderFailure => Results.Json(response, statusCode: StatusCodes.Status422UnprocessableEntity),
            _ => Map(result)
        };
    }
    private static async Task<IResult> PromptTestAsync(string id, AiPromptTestRequest request, AiProviderTestUseCases useCases, CancellationToken ct) =>
        Map(await useCases.PromptAsync(new(id, request.Prompt, request.ExpectedProfileRevision, request.ExpectedCredentialRevision), ct));

    private static async Task<IResult> MapProfileAsync(AiAdministrationResult<Myriale.Api.Data.AiProviderProfile> result, AiProviderAdministrationQueryService query, CancellationToken ct, bool created = false)
    {
        if (result.Outcome != AiAdministrationOutcome.Success) return Map(result);
        var response = (await query.ListProfilesAsync(ct)).Single(profile => profile.Id == result.Value!.Id.AsPrimitive());
        return created ? Results.Json(response, statusCode: StatusCodes.Status201Created) : Results.Ok(response);
    }

    private static IResult MapCredential(AiAdministrationResult<Myriale.Api.Data.AiCredential> result, bool created = false)
    {
        if (result.Outcome != AiAdministrationOutcome.Success) return Map(result);
        var credential = result.Value!;
        var response = new AiAdminCredentialResponse(credential.Id.AsPrimitive(), credential.DisplayName, $"••••••••{credential.SecretHint}", "database", credential.Revision, credential.UpdatedAt, 0);
        return created ? Results.Json(response, statusCode: StatusCodes.Status201Created) : Results.Ok(response);
    }

    private static IResult Map<T>(AiAdministrationResult<T> result, bool created = false, bool noContent = false) => result.Outcome switch
    {
        AiAdministrationOutcome.Success when noContent => Results.NoContent(),
        AiAdministrationOutcome.Success when created => Results.Json(result.Value, statusCode: StatusCodes.Status201Created),
        AiAdministrationOutcome.Success => Results.Ok(result.Value),
        AiAdministrationOutcome.NotFound => Results.NotFound(Error(result.Error)),
        AiAdministrationOutcome.ValidationFailed => Results.BadRequest(Error(result.Error)),
        AiAdministrationOutcome.Conflict or AiAdministrationOutcome.ActiveProfile or AiAdministrationOutcome.CredentialReferenced or AiAdministrationOutcome.CredentialMissing => Results.Conflict(Error(result.Error)),
        AiAdministrationOutcome.ProviderFailure => Results.Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: result.Error),
        _ => Results.Problem(statusCode: 500)
    };
    private static string Wire<T>(T value) where T : struct, Enum
    {
        var text = value.ToString();
        return char.ToLowerInvariant(text[0]) + text[1..];
    }
    private static AiAdminErrorResponse Error(string? message) => new(message ?? "AI administration request failed.", new Dictionary<string, string[]>());
}
