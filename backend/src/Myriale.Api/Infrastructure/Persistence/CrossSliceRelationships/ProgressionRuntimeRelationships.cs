using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Infrastructure.Persistence.CrossSliceRelationships;

internal sealed class SessionProgressionModuleSnapshotRelationships : IEntityTypeConfiguration<SessionProgressionModuleSnapshot>
{
    public void Configure(EntityTypeBuilder<SessionProgressionModuleSnapshot> builder)
    {
        builder.HasOne(snapshot => snapshot.Session).WithMany(session => session.ProgressionModuleSnapshots)
            .HasForeignKey(snapshot => snapshot.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(snapshot => snapshot.Transition).WithMany()
            .HasForeignKey(snapshot => snapshot.TransitionId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class SessionProgressStateRelationships : IEntityTypeConfiguration<SessionProgressState>
{
    public void Configure(EntityTypeBuilder<SessionProgressState> builder)
    {
        builder.HasOne(progress => progress.Session).WithOne(session => session.Progress)
            .HasForeignKey<SessionProgressState>(progress => progress.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(progress => progress.CurrentNode).WithMany()
            .HasForeignKey(progress => progress.CurrentNodeId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class SessionNarrativeSignalRelationships : IEntityTypeConfiguration<SessionNarrativeSignal>
{
    public void Configure(EntityTypeBuilder<SessionNarrativeSignal> builder)
    {
        builder.HasOne(signal => signal.Session).WithMany(session => session.NarrativeSignals)
            .HasForeignKey(signal => signal.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(signal => signal.NarrativeTurn).WithMany(turn => turn.NarrativeSignals)
            .HasForeignKey(signal => signal.NarrativeTurnId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class SessionProgressionTransitionReceiptRelationships : IEntityTypeConfiguration<SessionProgressionTransitionReceipt>
{
    public void Configure(EntityTypeBuilder<SessionProgressionTransitionReceipt> builder)
    {
        builder.HasOne(receipt => receipt.ModuleTurn).WithOne()
            .HasForeignKey<SessionProgressionTransitionReceipt>(receipt => receipt.ModuleTurnId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(receipt => receipt.Session).WithMany(session => session.ProgressionTransitionReceipts)
            .HasForeignKey(receipt => receipt.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(receipt => receipt.Transition).WithMany()
            .HasForeignKey(receipt => receipt.TransitionId).OnDelete(DeleteBehavior.Restrict);
    }
}
