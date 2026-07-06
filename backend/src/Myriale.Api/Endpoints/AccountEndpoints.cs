using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Endpoints;

public static class AccountEndpoints
{
    public static RouteGroupBuilder MapAccountEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/account")
            .WithTags("Account")
            .RequireCors("MyrialeFrontend");

        group.MapPost("/register", RegisterAsync)
            .WithName("RegisterAccount")
            .WithSummary("Registers a new user with ASP.NET Core Identity and signs them in.");

        group.MapPost("/login", LoginAsync)
            .WithName("LoginAccount")
            .WithSummary("Signs in a user using the Identity application cookie.");

        group.MapPost("/logout", LogoutAsync)
            .RequireAuthorization()
            .WithName("LogoutAccount")
            .WithSummary("Signs out the current Identity cookie session.");

        group.MapGet("/me", MeAsync)
            .RequireAuthorization()
            .WithName("GetCurrentAccount")
            .WithSummary("Returns the authenticated account profile.");

        group.MapPut("/profile", UpdateProfileAsync)
            .RequireAuthorization()
            .WithName("UpdateAccountProfile")
            .WithSummary("Updates the authenticated account profile.");

        group.MapPost("/password-reset/request", RequestPasswordResetAsync)
            .WithName("RequestPasswordReset")
            .WithSummary("Generates an Identity password reset token. Non-production responses include the token for local development and tests.");

        group.MapPost("/password-reset/confirm", ConfirmPasswordResetAsync)
            .WithName("ConfirmPasswordReset")
            .WithSummary("Resets a password using an Identity password reset token.");

        group.MapPost("/withdraw", WithdrawAsync)
            .RequireAuthorization()
            .WithName("WithdrawAccount")
            .WithSummary("Soft-deletes the authenticated account and signs it out.");

        return group;
    }

    private static async Task<Results<Ok<AccountUserResponse>, BadRequest<AccountErrorResponse>, Conflict<AccountErrorResponse>>> RegisterAsync(
        RegisterRequest request,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        var errors = ValidateRegister(request);
        if (errors.Count > 0) return BadRequest(errors);

        var email = request.Email.Trim();
        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
        {
            return TypedResults.Conflict(Error("このメールアドレスは既に登録されています。", "email", "既に登録されています。"));
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = request.DisplayName.Trim(),
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded) return TypedResults.BadRequest(ToError("登録内容を確認してください。", result));

        await signInManager.SignInAsync(user, isPersistent: false);
        return TypedResults.Ok(ToResponse(user));
    }

    private static async Task<Results<Ok<AccountUserResponse>, UnauthorizedHttpResult, BadRequest<AccountErrorResponse>>> LoginAsync(
        LoginRequest request,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return TypedResults.BadRequest(Error("メールアドレスとパスワードを入力してください。"));
        }

        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null || IsDeleted(user)) return TypedResults.Unauthorized();

        var result = await signInManager.PasswordSignInAsync(user, request.Password, isPersistent: false, lockoutOnFailure: false);
        if (!result.Succeeded) return TypedResults.Unauthorized();

        return TypedResults.Ok(ToResponse(user));
    }

    private static async Task<Ok> LogoutAsync(SignInManager<ApplicationUser> signInManager)
    {
        await signInManager.SignOutAsync();
        return TypedResults.Ok();
    }

    private static async Task<Results<Ok<AccountUserResponse>, UnauthorizedHttpResult, NotFound>> MeAsync(
        ClaimsPrincipal principal,
        UserManager<ApplicationUser> userManager)
    {
        var user = await userManager.GetUserAsync(principal);
        if (user is null) return TypedResults.Unauthorized();
        if (IsDeleted(user)) return TypedResults.NotFound();
        return TypedResults.Ok(ToResponse(user));
    }

    private static async Task<Results<Ok<AccountUserResponse>, BadRequest<AccountErrorResponse>, UnauthorizedHttpResult>> UpdateProfileAsync(
        UpdateProfileRequest request,
        ClaimsPrincipal principal,
        UserManager<ApplicationUser> userManager)
    {
        var user = await userManager.GetUserAsync(principal);
        if (user is null || IsDeleted(user)) return TypedResults.Unauthorized();

        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.DisplayName)) errors["displayName"] = ["表示名を入力してください。"];
        if (request.Bio.Length > 400) errors["bio"] = ["プロフィールは400文字以内で入力してください。"];
        if (errors.Count > 0) return TypedResults.BadRequest(new AccountErrorResponse("プロフィールを確認してください。", errors));

        user.DisplayName = request.DisplayName.Trim();
        user.Bio = request.Bio.Trim();
        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded) return TypedResults.BadRequest(ToError("プロフィールを更新できませんでした。", result));

        return TypedResults.Ok(ToResponse(user));
    }

    private static async Task<Ok<PasswordResetRequestedResponse>> RequestPasswordResetAsync(
        PasswordResetRequest request,
        UserManager<ApplicationUser> userManager,
        IHostEnvironment environment)
    {
        string? token = null;
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var user = await userManager.FindByEmailAsync(request.Email.Trim());
            if (user is not null && !IsDeleted(user))
            {
                token = await userManager.GeneratePasswordResetTokenAsync(user);
            }
        }

        var exposedToken = environment.IsProduction() ? null : token;
        return TypedResults.Ok(new PasswordResetRequestedResponse(
            "登録済みの場合、パスワード再設定の案内を送信しました。",
            exposedToken));
    }

    private static async Task<Results<Ok, BadRequest<AccountErrorResponse>>> ConfirmPasswordResetAsync(
        ConfirmPasswordResetRequest request,
        UserManager<ApplicationUser> userManager)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return TypedResults.BadRequest(Error("メールアドレス、トークン、新しいパスワードを入力してください。"));
        }

        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null || IsDeleted(user)) return TypedResults.BadRequest(Error("パスワードを再設定できませんでした。"));

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded) return TypedResults.BadRequest(ToError("パスワードを再設定できませんでした。", result));

        return TypedResults.Ok();
    }

    private static async Task<Results<Ok, BadRequest<AccountErrorResponse>, UnauthorizedHttpResult>> WithdrawAsync(
        WithdrawRequest request,
        ClaimsPrincipal principal,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        var user = await userManager.GetUserAsync(principal);
        if (user is null || IsDeleted(user)) return TypedResults.Unauthorized();

        var expected = user.Email ?? user.UserName ?? user.Id;
        if (!string.Equals(request.Confirmation.Trim(), expected, StringComparison.OrdinalIgnoreCase))
        {
            return TypedResults.BadRequest(Error("退会確認の入力が一致しません。", "confirmation", "登録メールアドレスを入力してください。"));
        }

        user.DeletedAt = DateTimeOffset.UtcNow;
        user.LockoutEnabled = true;
        user.LockoutEnd = DateTimeOffset.MaxValue;
        user.Email = $"deleted-{user.Id}@deleted.local";
        user.NormalizedEmail = user.Email.ToUpperInvariant();
        user.UserName = user.Email;
        user.NormalizedUserName = user.NormalizedEmail;
        user.DisplayName = "退会済みユーザー";
        user.Bio = string.Empty;

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded) return TypedResults.BadRequest(ToError("退会処理を完了できませんでした。", result));
        await userManager.UpdateSecurityStampAsync(user);
        await signInManager.SignOutAsync();
        return TypedResults.Ok();
    }

    private static bool IsDeleted(ApplicationUser user) => user.DeletedAt is not null;

    private static AccountUserResponse ToResponse(ApplicationUser user) => new(
        user.Id,
        user.DisplayName,
        user.Email ?? string.Empty,
        user.Bio,
        user.EmailConfirmed,
        IsDeleted(user) ? "deleted" : "active");

    private static Dictionary<string, string[]> ValidateRegister(RegisterRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.DisplayName)) errors["displayName"] = ["表示名を入力してください。"];
        if (string.IsNullOrWhiteSpace(request.Email)) errors["email"] = ["メールアドレスを入力してください。"];
        if (string.IsNullOrWhiteSpace(request.Password)) errors["password"] = ["パスワードを入力してください。"];
        return errors;
    }

    private static BadRequest<AccountErrorResponse> BadRequest(IReadOnlyDictionary<string, string[]> errors) =>
        TypedResults.BadRequest(new AccountErrorResponse("入力内容を確認してください。", errors));

    private static AccountErrorResponse Error(string message, string? field = null, string? fieldMessage = null) =>
        new(message, field is null ? new Dictionary<string, string[]>() : new Dictionary<string, string[]> { [field] = [fieldMessage ?? message] });

    private static AccountErrorResponse ToError(string message, IdentityResult result)
    {
        var errors = new Dictionary<string, List<string>>();
        foreach (var error in result.Errors)
        {
            var field = error.Code.Contains("Password", StringComparison.OrdinalIgnoreCase) ? "password" : "global";
            if (!errors.TryGetValue(field, out var list))
            {
                list = [];
                errors[field] = list;
            }
            list.Add(error.Description);
        }

        return new AccountErrorResponse(message, errors.ToDictionary(pair => pair.Key, pair => pair.Value.ToArray()));
    }
}
