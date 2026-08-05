using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.SessionMemory.Application;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Tests;

public sealed class SessionMemoryArchitectureTests
{
    [Fact]
    public void SessionMemoryHandlersAndProposalReview_DoNotDependOnApplicationDbContext()
    {
        var memoryHandlers = typeof(SessionMemoryEndpoints).GetMethods(BindingFlags.Static | BindingFlags.NonPublic);
        Assert.NotEmpty(memoryHandlers);
        Assert.DoesNotContain(memoryHandlers.SelectMany(method => method.GetParameters()), parameter => parameter.ParameterType == typeof(ApplicationDbContext));

        var review = typeof(SessionMemoryEndpoints).GetMethod("ReviewAsync", BindingFlags.Static | BindingFlags.NonPublic);
        Assert.NotNull(review);
        Assert.DoesNotContain(review!.GetParameters(), parameter => parameter.ParameterType == typeof(ApplicationDbContext));
    }

    [Fact]
    public void AggregateMutationIsEncapsulatedAndRevisionsAreConcurrencyTokens()
    {
        foreach (var property in new[]
                 {
                     nameof(SessionNote.Kind), nameof(SessionNote.Title), nameof(SessionNote.Body), nameof(SessionNote.CanonStatus),
                     nameof(SessionNote.UpdateSource), nameof(SessionNote.Revision), nameof(SessionNote.UpdatedAt),
                 })
            Assert.False(typeof(SessionNote).GetProperty(property)!.SetMethod!.IsPublic, property);

        foreach (var property in new[]
                 {
                     nameof(SessionNoteProposal.NoteId), nameof(SessionNoteProposal.Status), nameof(SessionNoteProposal.Revision),
                     nameof(SessionNoteProposal.ReviewedAt),
                 })
            Assert.False(typeof(SessionNoteProposal).GetProperty(property)!.SetMethod!.IsPublic, property);

        using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite("Data Source=:memory:").Options);
        Assert.True(db.Model.FindEntityType(typeof(SessionNote))!.FindProperty(nameof(SessionNote.Revision))!.IsConcurrencyToken);
        Assert.True(db.Model.FindEntityType(typeof(SessionNoteProposal))!.FindProperty(nameof(SessionNoteProposal.Revision))!.IsConcurrencyToken);
    }

    [Theory]
    [InlineData(SessionNoteKind.Person, "person")]
    [InlineData(SessionNoteKind.Organization, "organization")]
    [InlineData(SessionNoteKind.Rule, "rule")]
    public void NoteKind_PreservesWireValues(SessionNoteKind value, string wire) => Assert.Equal(wire, value.ToWireValue());

    [Fact]
    public void ProposalReview_IsIdempotentAfterTerminalTransition()
    {
        var proposal = Proposal();
        var reviewedAt = DateTimeOffset.Parse("2026-08-03T00:00:00Z");

        Assert.True(proposal.Review(SessionNoteProposalStatus.Rejected, null, reviewedAt));
        var revision = proposal.Revision;
        Assert.False(proposal.Review(SessionNoteProposalStatus.Applied, "NOT-IGNORED", reviewedAt.AddMinutes(1)));

        Assert.Equal(SessionNoteProposalStatus.Rejected, proposal.Status);
        Assert.Null(proposal.NoteId);
        Assert.Equal(revision, proposal.Revision);
        Assert.Equal(reviewedAt, proposal.ReviewedAt);
    }

    [Fact]
    public void ProposalReview_RepeatingSnoozeIsIdempotent()
    {
        var proposal = Proposal();
        var reviewedAt = DateTimeOffset.Parse("2026-08-03T00:00:00Z");
        Assert.True(proposal.Review(SessionNoteProposalStatus.Snoozed, null, reviewedAt));
        var revision = proposal.Revision;

        Assert.False(proposal.Review(SessionNoteProposalStatus.Snoozed, null, reviewedAt.AddMinutes(1)));

        Assert.Equal(revision, proposal.Revision);
        Assert.Equal(reviewedAt, proposal.ReviewedAt);
    }

    [Fact]
    public async Task ProposalReview_MapsOptimisticConcurrencyFailureToConflict()
    {
        var repository = new FakeRepository { Proposal = Proposal(), ThrowConcurrencyOnSave = true };
        var useCase = new ReviewSessionNoteProposalUseCase(repository);

        var result = await useCase.ExecuteAsync(new ReviewSessionNoteProposalCommand(
            repository.Proposal.ArtifactId, "owner", SessionNoteProposalStatus.Rejected, new ReviewSessionNoteProposalRequest(0)), default);

        Assert.Equal(SessionMemoryCommandOutcome.Conflict, result.Outcome);
        Assert.Equal("proposal_review_conflict", result.ErrorCode);
    }

    [Fact]
    public void NoteBehavior_IncrementsRevisionAndCapturesHistory()
    {
        var createdAt = DateTimeOffset.Parse("2026-08-03T00:00:00Z");
        var note = SessionNote.Create("LOR-1", "SES-1", SessionNoteKind.Person, "Alice", "[]", "Before",
            SessionNoteCanonStatus.Unconfirmed, null, null, createdAt);

        note.Edit(SessionNoteKind.Person, "Alice", "[]", "After", SessionNoteCanonStatus.Canon, null, "TURN-1", createdAt.AddMinutes(1));
        var revision = note.CaptureRevision("NRV-2", note.UpdatedAt);

        Assert.Equal(2, note.Revision);
        Assert.Equal(SessionNoteUpdateSource.User, note.UpdateSource);
        Assert.Equal("After", revision.Body);
        Assert.Equal(2, revision.Revision);
    }

    private static SessionNoteProposal Proposal() => SessionNoteProposal.Create(
        "ART-1", "SES-1", "TURN-1", null, 0, "Title", "", "Body", "Reason", DateTimeOffset.Parse("2026-08-03T00:00:00Z"));

    private sealed class FakeRepository : ISessionMemoryRepository
    {
        public SessionNoteProposal? Proposal { get; init; }
        public bool ThrowConcurrencyOnSave { get; init; }
        public Task<bool> SessionExistsAsync(string sessionId, string ownerId, CancellationToken cancellationToken) => Task.FromResult(true);
        public Task<bool> TurnsBelongToSessionAsync(string sessionId, IReadOnlyCollection<string> turnIds, CancellationToken cancellationToken) => Task.FromResult(true);
        public Task<SessionNote?> GetNoteAsync(string sessionId, string noteId, string ownerId, CancellationToken cancellationToken) => Task.FromResult<SessionNote?>(null);
        public Task<SessionNote?> GetNoteAsync(string noteId, CancellationToken cancellationToken) => Task.FromResult<SessionNote?>(null);
        public Task<SessionNoteProposal?> GetProposalAsync(string artifactId, string ownerId, CancellationToken cancellationToken) => Task.FromResult(Proposal);
        public void AddNote(SessionNote note) { }
        public void AddRevision(SessionNoteRevision revision) { }
        public Task SaveChangesAsync(CancellationToken cancellationToken) => ThrowConcurrencyOnSave
            ? Task.FromException(new DbUpdateConcurrencyException())
            : Task.CompletedTask;
    }
}
