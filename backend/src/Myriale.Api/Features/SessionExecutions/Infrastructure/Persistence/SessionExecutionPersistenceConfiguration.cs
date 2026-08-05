using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Features.SessionExecutions.Infrastructure.Persistence;

internal sealed class SessionExecutionConfiguration : IEntityTypeConfiguration<SessionExecution>
{
    public void Configure(EntityTypeBuilder<SessionExecution> builder)
    {
        builder.Property(execution => execution.Kind)
            .HasConversion(value => value.ToContractValue(), value => SessionExecutionStorageValues.Kind(value));
        builder.Property(execution => execution.Status)
            .HasConversion(value => value.ToContractValue(), value => SessionExecutionStorageValues.Status(value));
        builder.Property(execution => execution.TriggerType)
            .HasConversion(value => value.ToContractValue(), value => SessionExecutionStorageValues.TriggerType(value));
        builder.Property(execution => execution.PublishPolicy)
            .HasConversion(value => value.ToContractValue(), value => SessionExecutionStorageValues.PublishPolicy(value));
        builder.Property(execution => execution.Revision).IsConcurrencyToken();
        builder.HasIndex(execution => new { execution.SessionId, execution.IdempotencyKey }).IsUnique();
        builder.HasIndex(execution => new { execution.Status, execution.NextAttemptAt, execution.Priority, execution.QueuedAt });
    }
}

internal sealed class SessionExecutionAttemptConfiguration : IEntityTypeConfiguration<SessionExecutionAttempt>
{
    public void Configure(EntityTypeBuilder<SessionExecutionAttempt> builder)
    {
        builder.Property(attempt => attempt.Status)
            .HasConversion(value => value.ToContractValue(), value => SessionExecutionStorageValues.AttemptStatus(value));
        builder.HasIndex(attempt => new { attempt.ExecutionId, attempt.AttemptNumber }).IsUnique();
        builder.HasOne(attempt => attempt.Execution).WithMany(execution => execution.Attempts)
            .HasForeignKey(attempt => attempt.ExecutionId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class SessionAiInteractionConfiguration : IEntityTypeConfiguration<SessionAiInteraction>
{
    public void Configure(EntityTypeBuilder<SessionAiInteraction> builder)
    {
        builder.Property(interaction => interaction.Stage)
            .HasConversion(value => value.ToWireValue(), value => SessionAiInteractionValues.ParseStage(value));
        builder.Property(interaction => interaction.Status)
            .HasConversion(value => value.ToWireValue(), value => SessionAiInteractionValues.ParseStatus(value));
        builder.HasIndex(interaction => new { interaction.AttemptId, interaction.Stage }).IsUnique();
        builder.HasIndex(interaction => new { interaction.SessionId, interaction.StartedAt, interaction.Sequence });
        builder.HasOne(interaction => interaction.Execution).WithMany(execution => execution.AiInteractions)
            .HasForeignKey(interaction => interaction.ExecutionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(interaction => interaction.Attempt).WithMany(attempt => attempt.AiInteractions)
            .HasForeignKey(interaction => interaction.AttemptId).OnDelete(DeleteBehavior.Cascade);
    }
}
