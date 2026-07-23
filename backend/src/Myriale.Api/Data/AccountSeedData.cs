using System.Security.Claims;
using Microsoft.AspNetCore.Identity;

namespace Myriale.Api.Data;

public static class AccountSeedData
{
    public const string DefaultDisplayName = "霧野しおり";
    public const string DefaultEmail = "reader@myriale.example";
    public const string DefaultPassword = "a";

    public static async Task SeedAsync(
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        if (!configuration.GetValue<bool>("SeedAccount:Enabled")) return;

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
            existing.PasswordHash = userManager.PasswordHasher.HashPassword(existing, password);
            existing.SecurityStamp = Guid.NewGuid().ToString();
            await EnsureSucceededAsync(userManager.UpdateAsync(existing), "update the seeded account password");
            await EnsureAdminClaimsAsync(userManager, existing);
            return;
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            DisplayName = displayName,
            Bio = "星図を読む巡礼者。夜の図書館で物語を探しています。",
            CanDebugDialogue = true,
        };
        user.PasswordHash = userManager.PasswordHasher.HashPassword(user, password);
        await EnsureSucceededAsync(userManager.CreateAsync(user), "create the seeded account");
        await EnsureAdminClaimsAsync(userManager, user);
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
        foreach (var type in new[] { "myriale:module-admin", "myriale:ai-admin" })
            if (!claims.Any(claim => claim.Type == type && claim.Value == "true"))
                await userManager.AddClaimAsync(user, new Claim(type, "true"));
    }
}
