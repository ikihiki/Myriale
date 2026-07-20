using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Scenario> Scenarios => Set<Scenario>();
    public DbSet<AiProviderKey> AiProviderKeys => Set<AiProviderKey>();
    public DbSet<ModulePackage> ModulePackages => Set<ModulePackage>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<SessionTurn> SessionTurns => Set<SessionTurn>();
    public DbSet<ModuleExecution> ModuleExecutions => Set<ModuleExecution>();
    public DbSet<ModuleExecutionRequest> ModuleExecutionRequests => Set<ModuleExecutionRequest>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<ModulePackage>()
            .HasIndex(package => new { package.ModuleId, package.Version })
            .IsUnique();
        builder.Entity<Session>()
            .Property(session => session.NextTurnPosition)
            .IsConcurrencyToken();
        builder.Entity<Session>()
            .HasIndex(session => new { session.OwnerId, session.UpdatedAt });
        builder.Entity<Session>()
            .HasOne(session => session.Scenario)
            .WithMany()
            .HasForeignKey(session => session.ScenarioId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionTurn>()
            .HasIndex(turn => new { turn.SessionId, turn.Position })
            .IsUnique();
        builder.Entity<SessionTurn>()
            .HasOne(turn => turn.Session)
            .WithMany(session => session.Turns)
            .HasForeignKey(turn => turn.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ModuleExecution>()
            .HasIndex(execution => execution.SessionTurnId)
            .IsUnique();
        builder.Entity<ModuleExecution>()
            .HasOne(execution => execution.SessionTurn)
            .WithOne(turn => turn.ModuleExecution)
            .HasForeignKey<ModuleExecution>(execution => execution.SessionTurnId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ModuleExecution>()
            .Property(execution => execution.Revision)
            .IsConcurrencyToken();
        builder.Entity<ModuleExecution>()
            .HasIndex(execution => new { execution.OwnerId, execution.UpdatedAt });
        builder.Entity<ModuleExecutionRequest>()
            .HasIndex(request => new { request.OwnerId, request.RequestId })
            .IsUnique();
        builder.Entity<ModuleExecutionRequest>()
            .HasIndex(request => request.ExecutionId);
        builder.Entity<ModuleExecutionRequest>()
            .HasOne(request => request.Execution)
            .WithMany(execution => execution.Requests)
            .HasForeignKey(request => request.ExecutionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
