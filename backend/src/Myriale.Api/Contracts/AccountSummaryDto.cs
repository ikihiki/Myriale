namespace Myriale.Api.Contracts;

public sealed record AccountSummaryDto(
    string DisplayName,
    string Email,
    string Initials,
    string Role,
    int UnreadNotifications,
    string CurrentWorkspaceName);
