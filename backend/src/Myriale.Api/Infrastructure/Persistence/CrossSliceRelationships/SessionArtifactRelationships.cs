using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Infrastructure.Persistence.CrossSliceRelationships;

internal sealed class SessionArtifactRelationships : IEntityTypeConfiguration<SessionArtifact>
{
    public void Configure(EntityTypeBuilder<SessionArtifact> builder)
    {
        builder.HasOne<SessionExecution>().WithMany()
            .HasForeignKey(artifact => artifact.ExecutionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<SessionExecutionAttempt>().WithMany()
            .HasForeignKey(artifact => artifact.AttemptId).OnDelete(DeleteBehavior.Restrict);
    }
}
