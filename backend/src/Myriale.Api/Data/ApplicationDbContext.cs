using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Scenario> Scenarios => Set<Scenario>();
    public DbSet<AiProviderKey> AiProviderKeys => Set<AiProviderKey>();
}
