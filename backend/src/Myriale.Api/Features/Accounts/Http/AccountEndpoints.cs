using System.Security.Claims;
using Myriale.Api.Features.Accounts.Application;

namespace Myriale.Api.Features.Accounts.Http;

public static class AccountEndpoints
{
    public static RouteGroupBuilder MapAccountEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/account")
            .WithTags("Account")
            .RequireCors("MyrialeFrontend");

        group.MapPost("/register", RegisterAsync).WithName("RegisterAccount").WithSummary("Registers and signs in an account through the Account application command.");
        group.MapPost("/login", LoginAsync).WithName("LoginAccount").WithSummary("Signs in using the Identity application cookie.");
        group.MapPost("/logout", LogoutAsync).RequireAuthorization().WithName("LogoutAccount");
        group.MapGet("/me", MeAsync).RequireAuthorization().WithName("GetCurrentAccount");
        group.MapPut("/profile", UpdateProfileAsync).RequireAuthorization().WithName("UpdateAccountProfile");
        group.MapPost("/password-reset/request", RequestPasswordResetAsync).WithName("RequestPasswordReset")
            .WithSummary("Requests password-reset delivery without exposing account existence or a reset token.");
        group.MapPost("/password-reset/confirm", ConfirmPasswordResetAsync).WithName("ConfirmPasswordReset");
        group.MapPost("/withdraw", WithdrawAsync).RequireAuthorization().WithName("WithdrawAccount");
        return group;
    }

    private static async Task<IResult> RegisterAsync(RegisterRequest request, RegisterAccountCommand command, CancellationToken cancellationToken)
    {
        var result = await command.ExecuteAsync(new(request.DisplayName, request.Email, request.Password), cancellationToken);
        return result.Status switch
        {
            AccountOperationStatus.Success => TypedResults.Ok(ToResponse(result.Value!)),
            AccountOperationStatus.Conflict => TypedResults.Conflict(ToError("このメールアドレスは既に登録されています。", result.Errors)),
            _ => TypedResults.BadRequest(ToError("登録内容を確認してください。", result.Errors)),
        };
    }

    private static async Task<IResult> LoginAsync(LoginRequest request, LoginAccountCommand command, CancellationToken cancellationToken)
    {
        var result = await command.ExecuteAsync(new(request.Email, request.Password), cancellationToken);
        return result.Status switch
        {
            AccountOperationStatus.Success => TypedResults.Ok(ToResponse(result.Value!)),
            AccountOperationStatus.ValidationFailed => TypedResults.BadRequest(ToError("メールアドレスとパスワードを入力してください。", result.Errors)),
            _ => TypedResults.Unauthorized(),
        };
    }

    private static async Task<IResult> LogoutAsync(LogoutAccountCommand command, CancellationToken cancellationToken)
    {
        await command.ExecuteAsync(cancellationToken);
        return TypedResults.Ok();
    }

    private static async Task<IResult> MeAsync(ClaimsPrincipal principal, GetCurrentAccountQuery query, CancellationToken cancellationToken)
    {
        var result = await query.ExecuteAsync(principal, cancellationToken);
        return result.Status switch
        {
            AccountOperationStatus.Success => TypedResults.Ok(ToResponse(result.Value!)),
            AccountOperationStatus.NotFound => TypedResults.NotFound(),
            _ => TypedResults.Unauthorized(),
        };
    }

    private static async Task<IResult> UpdateProfileAsync(UpdateProfileRequest request, ClaimsPrincipal principal, UpdateAccountProfileCommand command, CancellationToken cancellationToken)
    {
        var result = await command.ExecuteAsync(new(request.DisplayName, request.Bio), principal, cancellationToken);
        return result.Status switch
        {
            AccountOperationStatus.Success => TypedResults.Ok(ToResponse(result.Value!)),
            AccountOperationStatus.Unauthorized => TypedResults.Unauthorized(),
            AccountOperationStatus.Conflict => TypedResults.Conflict(ToError("プロフィールが同時に更新されました。", result.Errors)),
            _ => TypedResults.BadRequest(ToError("プロフィールを確認してください。", result.Errors)),
        };
    }

    private static async Task<IResult> RequestPasswordResetAsync(PasswordResetRequest request, RequestAccountPasswordResetCommand command, CancellationToken cancellationToken)
    {
        await command.ExecuteAsync(new(request.Email), cancellationToken);
        return TypedResults.Ok(new PasswordResetRequestedResponse("登録済みの場合、パスワード再設定の案内を送信しました。"));
    }

    private static async Task<IResult> ConfirmPasswordResetAsync(ConfirmPasswordResetRequest request, ConfirmAccountPasswordResetCommand command, CancellationToken cancellationToken)
    {
        var result = await command.ExecuteAsync(new(request.Email, request.Token, request.NewPassword), cancellationToken);
        return result.Status == AccountOperationStatus.Success
            ? TypedResults.Ok()
            : TypedResults.BadRequest(ToError("パスワードを再設定できませんでした。", result.Errors));
    }

    private static async Task<IResult> WithdrawAsync(WithdrawRequest request, ClaimsPrincipal principal, WithdrawAccountCommand command, CancellationToken cancellationToken)
    {
        var result = await command.ExecuteAsync(new(request.Confirmation), principal, cancellationToken);
        return result.Status switch
        {
            AccountOperationStatus.Success => TypedResults.Ok(),
            AccountOperationStatus.Unauthorized => TypedResults.Unauthorized(),
            AccountOperationStatus.Conflict => TypedResults.Conflict(ToError("アカウントが同時に更新されました。", result.Errors)),
            AccountOperationStatus.ValidationFailed => TypedResults.BadRequest(ToError("退会確認の入力が一致しません。", result.Errors)),
            _ => TypedResults.BadRequest(ToError("退会処理を完了できませんでした。", result.Errors)),
        };
    }

    private static AccountUserResponse ToResponse(AccountSnapshot account) => new(
        account.Id,
        account.DisplayName,
        account.Email,
        account.Bio,
        account.EmailConfirmed,
        account.State,
        account.CanDebugDialogue);

    private static AccountErrorResponse ToError(string message, IReadOnlyList<AccountOperationError>? errors) =>
        new(message, (errors ?? []).GroupBy(error => error.Field)
            .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray()));
}
