using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Infrastructure.Persistence.CrossSliceRelationships;

internal sealed class SessionRelationships : IEntityTypeConfiguration<Session>
{
    public void Configure(EntityTypeBuilder<Session> builder)
    {
        builder.HasOne(session => session.Scenario).WithMany()
            .HasForeignKey(session => session.ScenarioId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(session => session.ScenarioDefinitionVersion).WithMany()
            .HasForeignKey(session => session.ScenarioDefinitionVersionId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(session => session.CurrentLocation).WithMany()
            .HasForeignKey(session => session.CurrentLocationId).OnDelete(DeleteBehavior.Restrict);
    }
}
