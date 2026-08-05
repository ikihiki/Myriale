using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Features.Sessions.Infrastructure.Persistence;

internal sealed class SessionConfiguration : IEntityTypeConfiguration<Session>
{
    public void Configure(EntityTypeBuilder<Session> builder)
    {
        builder.Property(session => session.Status)
            .HasConversion(value => value.ToWireValue(), value => SessionEnumValues.ParseStatus(value));
        builder.Property(session => session.Revision).IsConcurrencyToken();
        builder.HasOne(session => session.HeadTurn).WithMany()
            .HasForeignKey(session => session.HeadTurnId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(session => new { session.OwnerId, session.CreationRequestId })
            .IsUnique().HasFilter("\"CreationRequestId\" IS NOT NULL");
        builder.HasIndex(session => new { session.OwnerId, session.UpdatedAt });
    }
}

internal sealed class SessionTurnConfiguration : IEntityTypeConfiguration<SessionTurn>
{
    public void Configure(EntityTypeBuilder<SessionTurn> builder)
    {
        builder.Property(turn => turn.Kind)
            .HasConversion(value => value.ToWireValue(), value => SessionEnumValues.ParseTurnKind(value));
        builder.Property(turn => turn.DialogueTurnType)
            .HasConversion(
                value => value == null ? null : value.Value.ToWireValue(),
                value => value == null ? null : SessionEnumValues.ParseTurnType(value));
        builder.HasIndex(turn => new { turn.SessionId, turn.Position }).IsUnique();
        builder.HasIndex(turn => new { turn.SessionId, turn.PreviousTurnId })
            .IsUnique().HasFilter("\"PreviousTurnId\" IS NOT NULL");
        builder.HasIndex(turn => turn.SessionId).IsUnique().HasFilter("\"PreviousTurnId\" IS NULL");
        builder.HasOne(turn => turn.PreviousTurn).WithOne(turn => turn.NextTurn)
            .HasForeignKey<SessionTurn>(turn => turn.PreviousTurnId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(turn => turn.PlayerInputId).IsUnique();
        builder.HasOne(turn => turn.PlayerInput).WithOne(input => input.NarrativeTurn)
            .HasForeignKey<SessionTurn>(turn => turn.PlayerInputId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(turn => turn.SourceModuleTurnId).IsUnique();
        builder.HasOne(turn => turn.SourceModuleTurn).WithOne(turn => turn.NarrativeTurn)
            .HasForeignKey<SessionTurn>(turn => turn.SourceModuleTurnId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(turn => turn.Session).WithMany(session => session.Turns)
            .HasForeignKey(turn => turn.SessionId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class SessionPlayerInputConfiguration : IEntityTypeConfiguration<SessionPlayerInput>
{
    public void Configure(EntityTypeBuilder<SessionPlayerInput> builder)
    {
        builder.Property(input => input.InteractionType)
            .HasConversion(value => value.ToWireValue(), value => SessionEnumValues.ParseInteractionType(value));
        builder.HasIndex(input => new { input.SessionId, input.RequestId }).IsUnique();
        builder.HasOne(input => input.Session).WithMany(session => session.PlayerInputs)
            .HasForeignKey(input => input.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(input => input.AcceptedAfterTurn).WithMany()
            .HasForeignKey(input => input.AcceptedAfterTurnId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class SessionStateConfiguration : IEntityTypeConfiguration<SessionState>
{
    public void Configure(EntityTypeBuilder<SessionState> builder)
    {
        builder.Property(state => state.Revision).IsConcurrencyToken();
        builder.HasOne(state => state.Session).WithOne(session => session.State)
            .HasForeignKey<SessionState>(state => state.SessionId).OnDelete(DeleteBehavior.Cascade);
    }
}
