using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Features.SessionMemory.Infrastructure.Persistence;

internal sealed class SessionNoteConfiguration : IEntityTypeConfiguration<SessionNote>
{
    public void Configure(EntityTypeBuilder<SessionNote> builder)
    {
        builder.Property(note => note.Kind)
            .HasConversion(value => value.ToWireValue(), value => SessionMemoryEnumValues.ParseNoteKind(value));
        builder.Property(note => note.CanonStatus)
            .HasConversion(value => value.ToWireValue(), value => SessionMemoryEnumValues.ParseCanonStatus(value));
        builder.Property(note => note.UpdateSource)
            .HasConversion(value => value.ToWireValue(), value => SessionMemoryEnumValues.ParseUpdateSource(value));
        builder.Property(note => note.Revision).IsConcurrencyToken();
    }
}

internal sealed class SessionNoteRevisionConfiguration : IEntityTypeConfiguration<SessionNoteRevision>
{
    public void Configure(EntityTypeBuilder<SessionNoteRevision> builder)
    {
        builder.HasIndex(revision => new { revision.NoteId, revision.Revision }).IsUnique();
        builder.HasOne(revision => revision.Note).WithMany(note => note.Revisions)
            .HasForeignKey(revision => revision.NoteId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class SessionNoteProposalConfiguration : IEntityTypeConfiguration<SessionNoteProposal>
{
    public void Configure(EntityTypeBuilder<SessionNoteProposal> builder)
    {
        builder.Property(proposal => proposal.Status)
            .HasConversion(value => value.ToWireValue(), value => SessionMemoryEnumValues.ParseProposalStatus(value));
        builder.Property(proposal => proposal.Revision).IsConcurrencyToken();
    }
}

internal sealed class SessionSummaryConfiguration : IEntityTypeConfiguration<SessionSummary>
{
    public void Configure(EntityTypeBuilder<SessionSummary> builder) =>
        builder.HasIndex(summary => new { summary.SessionId, summary.Version }).IsUnique();
}

internal sealed class SessionTurnLorebookReferenceConfiguration : IEntityTypeConfiguration<SessionTurnLorebookReference>
{
    public void Configure(EntityTypeBuilder<SessionTurnLorebookReference> builder)
    {
        builder.HasKey(reference => new { reference.TurnId, reference.NoteId });
        builder.HasOne(reference => reference.Note).WithMany(note => note.TurnReferences)
            .HasForeignKey(reference => reference.NoteId).OnDelete(DeleteBehavior.Cascade);
    }
}
