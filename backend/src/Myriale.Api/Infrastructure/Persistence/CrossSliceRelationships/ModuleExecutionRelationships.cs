using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Infrastructure.Persistence.CrossSliceRelationships;

internal sealed class ModuleExecutionRelationships : IEntityTypeConfiguration<ModuleExecution>
{
    public void Configure(EntityTypeBuilder<ModuleExecution> builder) =>
        builder.HasOne<SessionTurn>().WithOne()
            .HasForeignKey<ModuleExecution>(execution => execution.SessionTurnId).OnDelete(DeleteBehavior.Cascade);
}

internal sealed class ModuleOutcomeApplicationRelationships : IEntityTypeConfiguration<ModuleOutcomeApplication>
{
    public void Configure(EntityTypeBuilder<ModuleOutcomeApplication> builder) =>
        builder.HasOne<Session>().WithMany()
            .HasForeignKey(application => application.SessionId).OnDelete(DeleteBehavior.Cascade);
}
