using System.Security.Claims;
using Microsoft.AspNetCore.Identity;

namespace Myriale.Api.Bootstrap.Seeding;

public static class AccountSeedData
{
    public const string DefaultDisplayName = "霧野しおり";
    public const string DefaultEmail = "reader@myriale.example";
    public const string DefaultPassword = "letters1";

    public static async Task<ApplicationUser?> SeedAsync(
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        if (!configuration.GetValue<bool>("SeedAccount:Enabled")) return null;

        var displayName = configuration["SeedAccount:DisplayName"]?.Trim();
        var email = configuration["SeedAccount:Email"]?.Trim();
        var password = configuration["SeedAccount:Password"];
        if (string.IsNullOrWhiteSpace(displayName)
            || string.IsNullOrWhiteSpace(email)
            || string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException("SeedAccount requires DisplayName, Email, and Password when enabled.");
        }

        cancellationToken.ThrowIfCancellationRequested();
        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
        {
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(existing);
            await EnsureSucceededAsync(userManager.ResetPasswordAsync(existing, resetToken, password), "update the seeded account password");
            await EnsureAdminClaimsAsync(userManager, existing);
            return existing;
        }

        var user = ApplicationUser.Create(
            displayName,
            email,
            emailConfirmed: true,
            bio: "星図を読む巡礼者。夜の図書館で物語を探しています。",
            canDebugDialogue: true);
        await EnsureSucceededAsync(userManager.CreateAsync(user, password), "create the seeded account");
        await EnsureAdminClaimsAsync(userManager, user);
        return user;
    }

    private static async Task EnsureSucceededAsync(Task<IdentityResult> operation, string action)
    {
        var result = await operation;
        if (result.Succeeded) return;

        var errors = string.Join(", ", result.Errors.Select(error => $"{error.Code}: {error.Description}"));
        throw new InvalidOperationException($"Failed to {action}: {errors}");
    }

    private static async Task EnsureAdminClaimsAsync(UserManager<ApplicationUser> userManager, ApplicationUser user)
    {
        var claims = await userManager.GetClaimsAsync(user);
        foreach (var type in new[] { "myriale:module-admin", "myriale:ai-admin", "myriale:admin" })
            if (!claims.Any(claim => claim.Type == type && claim.Value == "true"))
                await userManager.AddClaimAsync(user, new Claim(type, "true"));
    }
}
