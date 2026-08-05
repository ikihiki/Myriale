using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Features.SessionArtifacts.Infrastructure.Persistence;

internal sealed class SessionArtifactConfiguration : IEntityTypeConfiguration<SessionArtifact>
{
    public void Configure(EntityTypeBuilder<SessionArtifact> builder)
    {
        builder.Property(artifact => artifact.Kind)
            .HasConversion(value => value.ToWireValue(), value => SessionArtifactEnumValues.ParseKind(value));
        builder.Property(artifact => artifact.Status)
            .HasConversion(value => value.ToWireValue(), value => SessionArtifactEnumValues.ParseStatus(value));
        builder.Property(artifact => artifact.Schema)
            .HasConversion(value => value.ToWireValue(), value => SessionArtifactEnumValues.ParseSchema(value));
        builder.HasIndex(artifact => new { artifact.ExecutionId, artifact.Kind }).IsUnique();
        builder.ToTable(table =>
        {
            table.HasCheckConstraint("CK_SessionArtifacts_Backing", "(\"PayloadJson\" IS NOT NULL AND \"StorageKey\" IS NULL) OR (\"PayloadJson\" IS NULL AND \"StorageKey\" IS NOT NULL)");
            table.HasCheckConstraint("CK_SessionArtifacts_Committed", "\"Status\" <> 'committed' OR (\"ValidatedAt\" IS NOT NULL AND \"CommittedAt\" IS NOT NULL)");
            table.HasCheckConstraint("CK_SessionArtifacts_KindSchema", "(\"Kind\" = 'rule-action-step' AND \"Schema\" = 'rule-action-step.v1') OR (\"Kind\" = 'post-state-narrative' AND \"Schema\" = 'post-state-narrative.v1') OR (\"Kind\" = 'narrative-text' AND \"Schema\" = 'narrative-text.v1') OR (\"Kind\" = 'note-patch' AND \"Schema\" = 'note-patch.v1') OR (\"Kind\" = 'image' AND \"Schema\" = 'image.v1')");
        });
    }
}

internal sealed class SessionImageConfiguration : IEntityTypeConfiguration<SessionImage>
{
    public void Configure(EntityTypeBuilder<SessionImage> builder)
    {
        builder.HasIndex(image => image.ArtifactId).IsUnique();
        builder.HasOne(image => image.Artifact).WithOne()
            .HasForeignKey<SessionImage>(image => image.ArtifactId).OnDelete(DeleteBehavior.Cascade);
    }
}
