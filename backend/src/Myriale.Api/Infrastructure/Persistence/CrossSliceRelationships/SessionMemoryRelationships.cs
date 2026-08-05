using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Infrastructure.Persistence.CrossSliceRelationships;

internal sealed class SessionNoteRelationships : IEntityTypeConfiguration<SessionNote>
{
    public void Configure(EntityTypeBuilder<SessionNote> builder) =>
        builder.HasOne(note => note.Session).WithMany(session => session.Notes)
            .HasForeignKey(note => note.SessionId).OnDelete(DeleteBehavior.Cascade);
}

internal sealed class SessionNoteProposalRelationships : IEntityTypeConfiguration<SessionNoteProposal>
{
    public void Configure(EntityTypeBuilder<SessionNoteProposal> builder) =>
        builder.HasOne<SessionArtifact>().WithOne()
            .HasForeignKey<SessionNoteProposal>(proposal => proposal.ArtifactId).OnDelete(DeleteBehavior.Cascade);
}

internal sealed class SessionSummaryRelationships : IEntityTypeConfiguration<SessionSummary>
{
    public void Configure(EntityTypeBuilder<SessionSummary> builder) =>
        builder.HasOne(summary => summary.Session).WithMany(session => session.Summaries)
            .HasForeignKey(summary => summary.SessionId).OnDelete(DeleteBehavior.Cascade);
}

internal sealed class SessionTurnLorebookReferenceRelationships : IEntityTypeConfiguration<SessionTurnLorebookReference>
{
    public void Configure(EntityTypeBuilder<SessionTurnLorebookReference> builder) =>
        builder.HasOne(reference => reference.Turn).WithMany(turn => turn.LorebookReferences)
            .HasForeignKey(reference => reference.TurnId).OnDelete(DeleteBehavior.Cascade);
}
