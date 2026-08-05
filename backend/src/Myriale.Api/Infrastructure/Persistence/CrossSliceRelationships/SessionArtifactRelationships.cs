using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Infrastructure.Persistence.CrossSliceRelationships;

internal sealed class SessionArtifactRelationships : IEntityTypeConfiguration<SessionArtifact>
{
    public void Configure(EntityTypeBuilder<SessionArtifact> builder)
    {
        builder.HasOne(artifact => artifact.Execution).WithMany(execution => execution.Artifacts)
            .HasForeignKey(artifact => artifact.ExecutionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(artifact => artifact.Attempt).WithMany()
            .HasForeignKey(artifact => artifact.AttemptId).OnDelete(DeleteBehavior.Restrict);
    }
}
