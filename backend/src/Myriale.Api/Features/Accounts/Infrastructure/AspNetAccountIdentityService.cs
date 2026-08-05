using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.Accounts.Application;
using Myriale.Api.Data;

namespace Myriale.Api.Features.Accounts.Infrastructure;

public interface IAccountSecurityStampUpdater
{
    Task<IdentityResult> UpdateAsync(ApplicationUser user);
}

internal sealed class AspNetAccountSecurityStampUpdater(UserManager<ApplicationUser> users) : IAccountSecurityStampUpdater
{
    public Task<IdentityResult> UpdateAsync(ApplicationUser user) => users.UpdateSecurityStampAsync(user);
}

internal sealed class AspNetAccountIdentityService(
    UserManager<ApplicationUser> users,
    SignInManager<ApplicationUser> signIn,
    ApplicationDbContext db,
    IAccountSecurityStampUpdater securityStampUpdater) : IAccountIdentityService
{
    public async Task<AccountOperationResult<ApplicationUser>> RegisterAsync(ApplicationUser user, string password, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        try
        {
            var result = await users.CreateAsync(user, password);
            if (!result.Succeeded) return FromIdentity<ApplicationUser>(result);
            await signIn.SignInAsync(user, isPersistent: false);
            return AccountOperationResult<ApplicationUser>.Success(user);
        }
        catch (DbUpdateException exception) when (IsUniqueConstraint(exception))
        {
            db.ChangeTracker.Clear();
            return DuplicateEmail<ApplicationUser>();
        }
    }

    public async Task<AccountOperationResult<ApplicationUser>> LoginAsync(string email, string password, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByEmailAsync(email);
        if (user is null || user.IsWithdrawn()) return AccountOperationResult<ApplicationUser>.Failure(AccountOperationStatus.Unauthorized);
        var result = await signIn.PasswordSignInAsync(user, password, isPersistent: false, lockoutOnFailure: false);
        return result.Succeeded
            ? AccountOperationResult<ApplicationUser>.Success(user)
            : AccountOperationResult<ApplicationUser>.Failure(AccountOperationStatus.Unauthorized);
    }

    public async Task SignOutAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await signIn.SignOutAsync();
    }

    public async Task<ApplicationUser?> GetCurrentAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await users.GetUserAsync(principal);
    }

    public async Task<AccountOperationResult<ApplicationUser>> UpdateAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var result = await users.UpdateAsync(user);
        return result.Succeeded ? AccountOperationResult<ApplicationUser>.Success(user) : FromIdentity<ApplicationUser>(result);
    }

    public async Task<string?> GeneratePasswordResetTokenAsync(string email, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByEmailAsync(email);
        return user is null || user.IsWithdrawn() ? null : await users.GeneratePasswordResetTokenAsync(user);
    }

    public async Task<AccountOperationResult> ConfirmPasswordResetAsync(string email, string token, string newPassword, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByEmailAsync(email);
        if (user is null || user.IsWithdrawn()) return ResetRejected();
        var result = await users.ResetPasswordAsync(user, token, newPassword);
        return result.Succeeded ? AccountOperationResult.Success() : ResetRejected();
    }

    public async Task<AccountOperationResult> WithdrawAsync(
        ClaimsPrincipal principal,
        string confirmation,
        DateTimeOffset withdrawnAt,
        CancellationToken cancellationToken)
    {
        var user = await users.GetUserAsync(principal);
        if (user is null || user.IsWithdrawn()) return AccountOperationResult.Failure(AccountOperationStatus.Unauthorized);

        var expected = user.Email ?? user.UserName ?? user.Id;
        if (!string.Equals(confirmation.Trim(), expected, StringComparison.OrdinalIgnoreCase))
            return AccountOperationResult.Failure(AccountOperationStatus.ValidationFailed,
                new AccountOperationError("ConfirmationMismatch", "登録メールアドレスを入力してください。", "confirmation"));

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        user.Withdraw(withdrawnAt);
        var update = await users.UpdateAsync(user);
        if (!update.Succeeded)
        {
            await transaction.RollbackAsync(cancellationToken);
            return FromIdentity(update);
        }

        var stamp = await securityStampUpdater.UpdateAsync(user);
        if (!stamp.Succeeded)
        {
            await transaction.RollbackAsync(cancellationToken);
            return AccountOperationResult.Failure(AccountOperationStatus.Rejected,
                new AccountOperationError("SecurityStampFailure", "退会処理を完了できませんでした。"));
        }

        await transaction.CommitAsync(cancellationToken);
        await signIn.SignOutAsync();
        return AccountOperationResult.Success();
    }

    private static AccountOperationResult<T> FromIdentity<T>(IdentityResult result)
    {
        if (result.Errors.Any(error => error.Code is "DuplicateEmail" or "DuplicateUserName")) return DuplicateEmail<T>();
        var status = result.Errors.Any(error => error.Code == "ConcurrencyFailure")
            ? AccountOperationStatus.Conflict
            : AccountOperationStatus.ValidationFailed;
        return AccountOperationResult<T>.Failure(status, result.Errors.Select(ToError).ToArray());
    }

    private static AccountOperationResult FromIdentity(IdentityResult result)
    {
        var status = result.Errors.Any(error => error.Code == "ConcurrencyFailure")
            ? AccountOperationStatus.Conflict
            : AccountOperationStatus.Rejected;
        return AccountOperationResult.Failure(status, result.Errors.Select(ToError).ToArray());
    }

    private static AccountOperationError ToError(IdentityError error) =>
        new(error.Code, error.Description, error.Code.Contains("Password", StringComparison.OrdinalIgnoreCase) ? "password" : "global");

    private static AccountOperationResult<T> DuplicateEmail<T>() =>
        AccountOperationResult<T>.Failure(AccountOperationStatus.Conflict,
            new AccountOperationError("DuplicateEmail", "既に登録されています。", "email"));

    private static AccountOperationResult ResetRejected() =>
        AccountOperationResult.Failure(AccountOperationStatus.Rejected,
            new AccountOperationError("PasswordResetRejected", "パスワードを再設定できませんでした。"));

    private static bool IsUniqueConstraint(DbUpdateException exception) =>
        exception.InnerException?.Message.Contains("unique", StringComparison.OrdinalIgnoreCase) == true
        || exception.Message.Contains("unique", StringComparison.OrdinalIgnoreCase);
}

public interface IDevelopmentAccountPasswordResetTokenStore
{
    string? Take(string email);
}

internal sealed class DevelopmentAccountPasswordResetTokenTransport : IAccountPasswordResetTokenTransport, IDevelopmentAccountPasswordResetTokenStore
{
    private readonly ConcurrentDictionary<string, string> _tokens = new(StringComparer.OrdinalIgnoreCase);

    public Task DeliverAsync(string email, string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _tokens[email] = token;
        return Task.CompletedTask;
    }

    public string? Take(string email) => _tokens.TryRemove(email, out var token) ? token : null;
}

internal sealed class ProductionAccountPasswordResetTokenTransport : IAccountPasswordResetTokenTransport
{
    public Task DeliverAsync(string email, string token, CancellationToken cancellationToken)
    {
        // Production delivery is an explicit infrastructure boundary. The HTTP response never carries the token.
        return Task.CompletedTask;
    }
}
