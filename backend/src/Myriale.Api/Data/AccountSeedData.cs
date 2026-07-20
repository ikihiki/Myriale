using Microsoft.AspNetCore.Identity;

namespace Myriale.Api.Data;

public static class AccountSeedData
{
    public const string DefaultDisplayName = "霧野しおり";
    public const string DefaultEmail = "reader@myriale.example";
    public const string DefaultPassword = "mist-library-2026";

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
        if (await userManager.FindByEmailAsync(email) is not null) return;

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            DisplayName = displayName,
            Bio = "星図を読む巡礼者。夜の図書館で物語を探しています。",
        };
        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(error => $"{error.Code}: {error.Description}"));
            throw new InvalidOperationException($"Failed to create the seeded account: {errors}");
        }
    }
}
