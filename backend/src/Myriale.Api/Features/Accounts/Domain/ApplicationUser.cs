using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;

namespace Myriale.Api.Features.Accounts.Domain;

[JsonConverter(typeof(AccountStateJsonConverter))]
public enum AccountState
{
    Active,
    Withdrawn,
}

public static class AccountStateValues
{
    public static string ToWireValue(this AccountState state) => state switch
    {
        AccountState.Active => "active",
        AccountState.Withdrawn => "withdrawn",
        _ => throw new ArgumentOutOfRangeException(nameof(state)),
    };
}

public sealed class AccountStateJsonConverter : JsonConverter<AccountState>
{
    public override AccountState Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        reader.GetString() switch
        {
            "active" => AccountState.Active,
            "withdrawn" => AccountState.Withdrawn,
            var value => throw new JsonException($"Unknown account state '{value}'."),
        };

    public override void Write(Utf8JsonWriter writer, AccountState value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToWireValue());
}

public sealed class AccountValidationException(IReadOnlyDictionary<string, string[]> errors)
    : Exception("Account data is invalid.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;
}

public sealed class ApplicationUser : IdentityUser
{
    private ApplicationUser() { }

    public string DisplayName { get; private set; } = string.Empty;
    public string Bio { get; private set; } = string.Empty;
    public bool CanDebugDialogue { get; private set; }
    public DateTimeOffset? WithdrawnAt { get; private set; }
    public AccountState State => IsWithdrawn() ? AccountState.Withdrawn : AccountState.Active;

    public static ApplicationUser Create(string displayName, string email, bool emailConfirmed = false, string bio = "", bool canDebugDialogue = false)
    {
        ValidateProfile(displayName, bio);
        if (string.IsNullOrWhiteSpace(email))
            throw new AccountValidationException(new Dictionary<string, string[]> { ["email"] = ["メールアドレスを入力してください。"] });

        var normalizedEmail = email.Trim();
        return new ApplicationUser
        {
            UserName = normalizedEmail,
            Email = normalizedEmail,
            EmailConfirmed = emailConfirmed,
            DisplayName = displayName.Trim(),
            Bio = bio.Trim(),
            CanDebugDialogue = canDebugDialogue,
        };
    }

    public void UpdateProfile(string displayName, string bio)
    {
        if (IsWithdrawn()) throw new InvalidOperationException("Withdrawn accounts cannot be updated.");
        ValidateProfile(displayName, bio);
        DisplayName = displayName.Trim();
        Bio = bio.Trim();
    }

    public void Withdraw(DateTimeOffset withdrawnAt)
    {
        if (IsWithdrawn()) throw new InvalidOperationException("The account is already withdrawn.");
        if (withdrawnAt == default) throw new ArgumentException("A withdrawal timestamp is required.", nameof(withdrawnAt));

        WithdrawnAt = withdrawnAt;
        LockoutEnabled = true;
        LockoutEnd = DateTimeOffset.MaxValue;
        Email = $"withdrawn-{Id}@withdrawn.invalid";
        UserName = Email;
        DisplayName = "退会済みユーザー";
        Bio = string.Empty;
        CanDebugDialogue = false;
    }

    public bool IsWithdrawn() => WithdrawnAt is not null;

    private static void ValidateProfile(string displayName, string bio)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(displayName)) errors["displayName"] = ["表示名を入力してください。"];
        else if (displayName.Trim().Length > 80) errors["displayName"] = ["表示名は80文字以内で入力してください。"];
        if ((bio ?? string.Empty).Trim().Length > 400) errors["bio"] = ["プロフィールは400文字以内で入力してください。"];
        if (errors.Count > 0) throw new AccountValidationException(errors);
    }
}
