using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Infrastructure.Persistence.CrossSliceRelationships;

internal sealed class SessionProgressionModuleSnapshotRelationships : IEntityTypeConfiguration<SessionProgressionModuleSnapshot>
{
    public void Configure(EntityTypeBuilder<SessionProgressionModuleSnapshot> builder)
    {
        builder.HasOne<Session>().WithMany()
            .HasForeignKey(snapshot => snapshot.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<ScenarioProgressionTransition>().WithMany()
            .HasForeignKey(snapshot => snapshot.TransitionId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class SessionProgressStateRelationships : IEntityTypeConfiguration<SessionProgressState>
{
    public void Configure(EntityTypeBuilder<SessionProgressState> builder)
    {
        builder.HasOne<Session>().WithOne()
            .HasForeignKey<SessionProgressState>(progress => progress.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<ScenarioProgressionNode>().WithMany()
            .HasForeignKey(progress => progress.CurrentNodeId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class SessionNarrativeSignalRelationships : IEntityTypeConfiguration<SessionNarrativeSignal>
{
    public void Configure(EntityTypeBuilder<SessionNarrativeSignal> builder)
    {
        builder.HasOne<Session>().WithMany()
            .HasForeignKey(signal => signal.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<SessionTurn>().WithMany()
            .HasForeignKey(signal => signal.NarrativeTurnId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class SessionProgressionTransitionReceiptRelationships : IEntityTypeConfiguration<SessionProgressionTransitionReceipt>
{
    public void Configure(EntityTypeBuilder<SessionProgressionTransitionReceipt> builder)
    {
        builder.HasOne<SessionTurn>().WithOne()
            .HasForeignKey<SessionProgressionTransitionReceipt>(receipt => receipt.ModuleTurnId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Session>().WithMany()
            .HasForeignKey(receipt => receipt.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<ScenarioProgressionTransition>().WithMany()
            .HasForeignKey(receipt => receipt.TransitionId).OnDelete(DeleteBehavior.Restrict);
    }
}
