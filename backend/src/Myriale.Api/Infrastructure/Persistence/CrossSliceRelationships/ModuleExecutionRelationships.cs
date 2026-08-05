using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Infrastructure.Persistence.CrossSliceRelationships;

internal sealed class ModuleExecutionRelationships : IEntityTypeConfiguration<ModuleExecution>
{
    public void Configure(EntityTypeBuilder<ModuleExecution> builder) =>
        builder.HasOne(execution => execution.SessionTurn).WithOne(turn => turn.ModuleExecution)
            .HasForeignKey<ModuleExecution>(execution => execution.SessionTurnId).OnDelete(DeleteBehavior.Cascade);
}

internal sealed class ModuleOutcomeApplicationRelationships : IEntityTypeConfiguration<ModuleOutcomeApplication>
{
    public void Configure(EntityTypeBuilder<ModuleOutcomeApplication> builder) =>
        builder.HasOne(application => application.Session).WithMany(session => session.OutcomeApplications)
            .HasForeignKey(application => application.SessionId).OnDelete(DeleteBehavior.Cascade);
}
