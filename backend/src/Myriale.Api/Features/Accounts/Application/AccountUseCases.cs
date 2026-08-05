using System.Security.Claims;
using Myriale.Api.Data;

namespace Myriale.Api.Features.Accounts.Application;

public enum AccountOperationStatus
{
    Success,
    ValidationFailed,
    Unauthorized,
    NotFound,
    Conflict,
    Rejected,
}

public sealed record AccountOperationError(string Code, string Description, string Field = "global");

public sealed record AccountOperationResult<T>(
    AccountOperationStatus Status,
    T? Value = default,
    IReadOnlyList<AccountOperationError>? Errors = null)
{
    public static AccountOperationResult<T> Success(T value) => new(AccountOperationStatus.Success, value);
    public static AccountOperationResult<T> Failure(AccountOperationStatus status, params AccountOperationError[] errors) => new(status, default, errors);
}

public sealed record AccountOperationResult(
    AccountOperationStatus Status,
    IReadOnlyList<AccountOperationError>? Errors = null)
{
    public static AccountOperationResult Success() => new(AccountOperationStatus.Success);
    public static AccountOperationResult Failure(AccountOperationStatus status, params AccountOperationError[] errors) => new(status, errors);
}

public interface IAccountIdentityService
{
    Task<AccountOperationResult<ApplicationUser>> RegisterAsync(ApplicationUser user, string password, CancellationToken cancellationToken);
    Task<AccountOperationResult<ApplicationUser>> LoginAsync(string email, string password, CancellationToken cancellationToken);
    Task SignOutAsync(CancellationToken cancellationToken);
    Task<ApplicationUser?> GetCurrentAsync(ClaimsPrincipal principal, CancellationToken cancellationToken);
    Task<AccountOperationResult<ApplicationUser>> UpdateAsync(ApplicationUser user, CancellationToken cancellationToken);
    Task<string?> GeneratePasswordResetTokenAsync(string email, CancellationToken cancellationToken);
    Task<AccountOperationResult> ConfirmPasswordResetAsync(string email, string token, string newPassword, CancellationToken cancellationToken);
    Task<AccountOperationResult> WithdrawAsync(ClaimsPrincipal principal, string confirmation, DateTimeOffset withdrawnAt, CancellationToken cancellationToken);
}

public interface IAccountPasswordResetTokenTransport
{
    Task DeliverAsync(string email, string token, CancellationToken cancellationToken);
}

public sealed record AccountSnapshot(
    string Id,
    string DisplayName,
    string Email,
    string Bio,
    bool EmailConfirmed,
    AccountState State,
    bool CanDebugDialogue)
{
    public static AccountSnapshot From(ApplicationUser user) => new(
        user.Id,
        user.DisplayName,
        user.Email ?? string.Empty,
        user.Bio,
        user.EmailConfirmed,
        user.State,
        user.CanDebugDialogue);
}

public sealed record RegisterAccount(string DisplayName, string Email, string Password);
public sealed record LoginAccount(string Email, string Password);
public sealed record UpdateAccountProfile(string DisplayName, string Bio);
public sealed record RequestAccountPasswordReset(string Email);
public sealed record ConfirmAccountPasswordReset(string Email, string Token, string NewPassword);
public sealed record WithdrawAccount(string Confirmation);

public sealed class RegisterAccountCommand(IAccountIdentityService identity)
{
    public async Task<AccountOperationResult<AccountSnapshot>> ExecuteAsync(RegisterAccount command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Password))
            return AccountValidationResults.Validation<AccountSnapshot>("password", "パスワードを入力してください。");

        ApplicationUser user;
        try { user = ApplicationUser.Create(command.DisplayName, command.Email); }
        catch (AccountValidationException exception) { return AccountValidationResults.Validation<AccountSnapshot>(exception.Errors); }

        var result = await identity.RegisterAsync(user, command.Password, cancellationToken);
        return Map(result);
    }

    private static AccountOperationResult<AccountSnapshot> Map(AccountOperationResult<ApplicationUser> result) =>
        result.Status == AccountOperationStatus.Success && result.Value is not null
            ? AccountOperationResult<AccountSnapshot>.Success(AccountSnapshot.From(result.Value))
            : new(result.Status, default, result.Errors);
}

public sealed class LoginAccountCommand(IAccountIdentityService identity)
{
    public async Task<AccountOperationResult<AccountSnapshot>> ExecuteAsync(LoginAccount command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Email) || string.IsNullOrWhiteSpace(command.Password))
            return AccountOperationResult<AccountSnapshot>.Failure(AccountOperationStatus.ValidationFailed,
                new AccountOperationError("Required", "メールアドレスとパスワードを入力してください。"));

        var result = await identity.LoginAsync(command.Email.Trim(), command.Password, cancellationToken);
        return result.Status == AccountOperationStatus.Success && result.Value is not null
            ? AccountOperationResult<AccountSnapshot>.Success(AccountSnapshot.From(result.Value))
            : new(result.Status, default, result.Errors);
    }
}

public sealed class LogoutAccountCommand(IAccountIdentityService identity)
{
    public Task ExecuteAsync(CancellationToken cancellationToken) => identity.SignOutAsync(cancellationToken);
}

public sealed class GetCurrentAccountQuery(IAccountIdentityService identity)
{
    public async Task<AccountOperationResult<AccountSnapshot>> ExecuteAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var user = await identity.GetCurrentAsync(principal, cancellationToken);
        if (user is null) return AccountOperationResult<AccountSnapshot>.Failure(AccountOperationStatus.Unauthorized);
        if (user.IsWithdrawn()) return AccountOperationResult<AccountSnapshot>.Failure(AccountOperationStatus.NotFound);
        return AccountOperationResult<AccountSnapshot>.Success(AccountSnapshot.From(user));
    }
}

public sealed class UpdateAccountProfileCommand(IAccountIdentityService identity)
{
    public async Task<AccountOperationResult<AccountSnapshot>> ExecuteAsync(UpdateAccountProfile command, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var user = await identity.GetCurrentAsync(principal, cancellationToken);
        if (user is null || user.IsWithdrawn()) return AccountOperationResult<AccountSnapshot>.Failure(AccountOperationStatus.Unauthorized);

        try { user.UpdateProfile(command.DisplayName, command.Bio ?? string.Empty); }
        catch (AccountValidationException exception) { return AccountValidationResults.Validation<AccountSnapshot>(exception.Errors); }

        var result = await identity.UpdateAsync(user, cancellationToken);
        return result.Status == AccountOperationStatus.Success && result.Value is not null
            ? AccountOperationResult<AccountSnapshot>.Success(AccountSnapshot.From(result.Value))
            : new(result.Status, default, result.Errors);
    }
}

public sealed class RequestAccountPasswordResetCommand(IAccountIdentityService identity, IAccountPasswordResetTokenTransport transport)
{
    public async Task ExecuteAsync(RequestAccountPasswordReset command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Email)) return;
        var email = command.Email.Trim();
        var token = await identity.GeneratePasswordResetTokenAsync(email, cancellationToken);
        if (token is not null) await transport.DeliverAsync(email, token, cancellationToken);
    }
}

public sealed class ConfirmAccountPasswordResetCommand(IAccountIdentityService identity)
{
    public Task<AccountOperationResult> ExecuteAsync(ConfirmAccountPasswordReset command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Email) || string.IsNullOrWhiteSpace(command.Token) || string.IsNullOrWhiteSpace(command.NewPassword))
            return Task.FromResult(AccountOperationResult.Failure(AccountOperationStatus.ValidationFailed,
                new AccountOperationError("Required", "メールアドレス、トークン、新しいパスワードを入力してください。")));
        return identity.ConfirmPasswordResetAsync(command.Email.Trim(), command.Token, command.NewPassword, cancellationToken);
    }
}

public sealed class WithdrawAccountCommand(IAccountIdentityService identity, TimeProvider timeProvider)
{
    public Task<AccountOperationResult> ExecuteAsync(WithdrawAccount command, ClaimsPrincipal principal, CancellationToken cancellationToken) =>
        identity.WithdrawAsync(principal, command.Confirmation ?? string.Empty, timeProvider.GetUtcNow(), cancellationToken);
}

internal static class AccountValidationResults
{
    public static AccountOperationResult<T> Validation<T>(string field, string message) =>
        AccountOperationResult<T>.Failure(AccountOperationStatus.ValidationFailed, new AccountOperationError("Validation", message, field));

    public static AccountOperationResult<T> Validation<T>(IReadOnlyDictionary<string, string[]> errors) =>
        AccountOperationResult<T>.Failure(AccountOperationStatus.ValidationFailed,
            errors.SelectMany(pair => pair.Value.Select(message => new AccountOperationError("Validation", message, pair.Key))).ToArray());
}
