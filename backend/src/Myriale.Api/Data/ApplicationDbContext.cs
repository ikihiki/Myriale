using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Scenario> Scenarios => Set<Scenario>();
    public DbSet<AiProviderKey> AiProviderKeys => Set<AiProviderKey>();
    public DbSet<ModulePackage> ModulePackages => Set<ModulePackage>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<ModulePackage>()
            .HasIndex(package => new { package.ModuleId, package.Version })
            .IsUnique();
    }
}
