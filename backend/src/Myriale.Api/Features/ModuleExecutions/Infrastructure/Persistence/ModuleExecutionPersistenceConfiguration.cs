using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace Myriale.Api.Features.ModuleExecutions.Infrastructure.Persistence;

internal sealed class ModuleExecutionConfiguration : IEntityTypeConfiguration<ModuleExecution>
{
    public void Configure(EntityTypeBuilder<ModuleExecution> builder)
    {
        builder.HasIndex(execution => execution.SessionTurnId).IsUnique();
        builder.Property(execution => execution.Status)
            .HasConversion(value => value.ToWireValue(), value => ModuleExecutionStatusValues.Parse(value));
        builder.Property(execution => execution.Revision).IsConcurrencyToken();
        builder.HasIndex(execution => new { execution.OwnerId, execution.UpdatedAt });
    }
}

internal sealed class ModuleExecutionRequestConfiguration : IEntityTypeConfiguration<ModuleExecutionRequest>
{
    public void Configure(EntityTypeBuilder<ModuleExecutionRequest> builder)
    {
        builder.Property(request => request.Id).ValueGeneratedOnAdd().HasAnnotation("Sqlite:Autoincrement", true).HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
        builder.Property(request => request.Operation).HasConversion<string>();
        builder.Property(request => request.Status).HasConversion<string>();
        builder.HasIndex(request => new { request.OwnerId, request.RequestId }).IsUnique();
        builder.HasIndex(request => request.ExecutionId);
        builder.HasOne(request => request.Execution).WithMany(execution => execution.Requests)
            .HasForeignKey(request => request.ExecutionId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ModuleOutcomeApplicationConfiguration : IEntityTypeConfiguration<ModuleOutcomeApplication>
{
    public void Configure(EntityTypeBuilder<ModuleOutcomeApplication> builder)
    {
        builder.Property(application => application.Id).ValueGeneratedOnAdd().HasAnnotation("Sqlite:Autoincrement", true).HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
        builder.HasIndex(application => application.ExecutionId).IsUnique();
        builder.HasIndex(application => application.ModuleExecutionRequestId).IsUnique();
        builder.HasOne(application => application.Execution).WithOne(execution => execution.OutcomeApplication)
            .HasForeignKey<ModuleOutcomeApplication>(application => application.ExecutionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(application => application.Request).WithOne(request => request.OutcomeApplication)
            .HasForeignKey<ModuleOutcomeApplication>(application => application.ModuleExecutionRequestId).OnDelete(DeleteBehavior.Cascade);
    }
}
