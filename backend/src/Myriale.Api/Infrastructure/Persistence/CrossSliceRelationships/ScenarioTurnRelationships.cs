using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Infrastructure.Persistence.CrossSliceRelationships;

internal sealed class SessionObjectStateRelationships : IEntityTypeConfiguration<SessionObjectState>
{
    public void Configure(EntityTypeBuilder<SessionObjectState> builder)
    {
        builder.HasOne<Session>().WithMany()
            .HasForeignKey(state => state.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(state => state.ScenarioObject).WithMany()
            .HasForeignKey(state => state.ScenarioObjectId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(state => state.Location).WithMany()
            .HasForeignKey(state => state.LocationId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class SessionRuleActionStepRelationships : IEntityTypeConfiguration<SessionRuleActionStep>
{
    public void Configure(EntityTypeBuilder<SessionRuleActionStep> builder)
    {
        builder.HasOne<Session>().WithMany()
            .HasForeignKey(step => step.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(step => step.Execution).WithOne()
            .HasForeignKey<SessionRuleActionStep>(step => step.ExecutionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(step => step.PlayerInput).WithOne()
            .HasForeignKey<SessionRuleActionStep>(step => step.PlayerInputId).OnDelete(DeleteBehavior.Restrict);
    }
}
