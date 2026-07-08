using Microsoft.AspNetCore.Identity;

namespace Myriale.Api.Data;

public sealed class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public DateTimeOffset? DeletedAt { get; set; }
}
