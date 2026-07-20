namespace Myriale.Api.Contracts;

public sealed record AccountUserResponse(
    string Id,
    string DisplayName,
    string Email,
    string Bio,
    bool EmailConfirmed,
    string State,
    bool CanDebugDialogue);

public sealed record AccountErrorResponse(string Message, IReadOnlyDictionary<string, string[]> Errors);

public sealed record RegisterRequest(string DisplayName, string Email, string Password);

public sealed record LoginRequest(string Email, string Password);

public sealed record UpdateProfileRequest(string DisplayName, string Bio);

public sealed record PasswordResetRequest(string Email);

public sealed record PasswordResetRequestedResponse(string Message, string? ResetToken);

public sealed record ConfirmPasswordResetRequest(string Email, string Token, string NewPassword);

public sealed record WithdrawRequest(string Confirmation);
