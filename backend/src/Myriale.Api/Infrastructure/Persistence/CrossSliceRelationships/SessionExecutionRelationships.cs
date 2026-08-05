using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Infrastructure.Persistence.CrossSliceRelationships;

internal sealed class SessionExecutionRelationships : IEntityTypeConfiguration<SessionExecution>
{
    public void Configure(EntityTypeBuilder<SessionExecution> builder) =>
        builder.HasOne<Session>().WithMany()
            .HasForeignKey(execution => execution.SessionId).OnDelete(DeleteBehavior.Cascade);
}

internal sealed class SessionAiInteractionRelationships : IEntityTypeConfiguration<SessionAiInteraction>
{
    public void Configure(EntityTypeBuilder<SessionAiInteraction> builder) =>
        builder.HasOne<Session>().WithMany()
            .HasForeignKey(interaction => interaction.SessionId).OnDelete(DeleteBehavior.Cascade);
}
