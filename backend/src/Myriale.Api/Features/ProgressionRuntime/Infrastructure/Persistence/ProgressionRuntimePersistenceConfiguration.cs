using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Features.ProgressionRuntime.Infrastructure.Persistence;

internal sealed class SessionProgressionModuleSnapshotConfiguration : IEntityTypeConfiguration<SessionProgressionModuleSnapshot>
{
    public void Configure(EntityTypeBuilder<SessionProgressionModuleSnapshot> builder) =>
        builder.HasIndex(snapshot => new { snapshot.SessionId, snapshot.TransitionId }).IsUnique();
}

internal sealed class SessionProgressStateConfiguration : IEntityTypeConfiguration<SessionProgressState>
{
    public void Configure(EntityTypeBuilder<SessionProgressState> builder) =>
        builder.Property(progress => progress.Revision).IsConcurrencyToken();
}

internal sealed class SessionNarrativeSignalConfiguration : IEntityTypeConfiguration<SessionNarrativeSignal>
{
    public void Configure(EntityTypeBuilder<SessionNarrativeSignal> builder) =>
        builder.HasIndex(signal => new { signal.NarrativeTurnId, signal.Code }).IsUnique();
}

internal sealed class SessionProgressionTransitionReceiptConfiguration : IEntityTypeConfiguration<SessionProgressionTransitionReceipt>
{
    public void Configure(EntityTypeBuilder<SessionProgressionTransitionReceipt> builder)
    {
        builder.Property(receipt => receipt.Status)
            .HasConversion(status => status.ToWireValue(), value => ProgressionReceiptStatusValues.Parse(value));
        builder.Property(receipt => receipt.Revision).IsConcurrencyToken();
        builder.HasIndex(receipt => receipt.ModuleTurnId).IsUnique();
        builder.HasIndex(receipt => receipt.SourceSignalId).IsUnique();
        builder.HasOne(receipt => receipt.SourceSignal).WithOne(signal => signal.TransitionReceipt)
            .HasForeignKey<SessionProgressionTransitionReceipt>(receipt => receipt.SourceSignalId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
