using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Features.ScenarioTurns.Infrastructure.Persistence;

internal sealed class SessionObjectStateConfiguration : IEntityTypeConfiguration<SessionObjectState>
{
    public void Configure(EntityTypeBuilder<SessionObjectState> builder)
    {
        builder.Property(state => state.Revision).IsConcurrencyToken();
        builder.HasIndex(state => new { state.SessionId, state.ScenarioObjectId }).IsUnique();
    }
}

internal sealed class SessionRuleActionStepConfiguration : IEntityTypeConfiguration<SessionRuleActionStep>
{
    public void Configure(EntityTypeBuilder<SessionRuleActionStep> builder)
    {
        builder.Property(step => step.Stage)
            .HasConversion(value => value.ToWireValue(), value => ScenarioTurnStageValues.Parse(value));
        builder.HasIndex(step => step.ExecutionId).IsUnique();
        builder.HasIndex(step => step.PlayerInputId).IsUnique();
    }
}
