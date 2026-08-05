using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Features.SessionMemory.Application;

public enum SessionMemoryCommandOutcome { Success, NotFound, Invalid, Conflict }
public sealed record SessionMemoryCommandResult(
    SessionMemoryCommandOutcome Outcome,
    SessionLorebookEntryResponse? Note = null,
    SessionNoteProposalResponse? Proposal = null,
    string? ErrorCode = null,
    string? ErrorMessage = null);

public sealed record CreateSessionNoteCommand(SessionId SessionId, AccountId OwnerId, UpsertSessionLorebookEntryRequest Request);
public sealed record UpdateSessionNoteCommand(SessionId SessionId, SessionNoteId NoteId, AccountId OwnerId, UpsertSessionLorebookEntryRequest Request);
public sealed record ReviewSessionNoteProposalCommand(
    SessionArtifactId ArtifactId, AccountId OwnerId, SessionNoteProposalStatus Status, ReviewSessionNoteProposalRequest Request);

public sealed class CreateSessionNoteUseCase(ISessionMemoryRepository repository)
{
    public async Task<SessionMemoryCommandResult> ExecuteAsync(CreateSessionNoteCommand command, CancellationToken cancellationToken)
    {
        if (!await repository.SessionExistsAsync(command.SessionId, command.OwnerId, cancellationToken)) return new(SessionMemoryCommandOutcome.NotFound);
        var input = SessionNoteRequestValidator.Validate(command.Request);
        if (input.Error is not null) return input.Error;
        if (!await repository.TurnsBelongToSessionAsync(command.SessionId, input.TurnIds, cancellationToken)) return SessionNoteRequestValidator.InvalidTurn();
        var now = DateTimeOffset.UtcNow;
        var note = SessionNote.Create(NewNoteId("LOR"), command.SessionId, input.Kind, input.Title, input.AliasesJson, input.Body,
            input.CanonStatus, command.Request.FirstTurnId, command.Request.UpdatedFromTurnId, now);
        repository.AddNote(note);
        repository.AddRevision(note.CaptureRevision(NewRevisionId(), now));
        await repository.SaveChangesAsync(cancellationToken);
        return new(SessionMemoryCommandOutcome.Success, SessionMemoryMapper.ToResponse(note));
    }

    internal static SessionNoteId NewNoteId(string prefix) => new($"{prefix}-{Guid.NewGuid():N}".ToUpperInvariant());
    internal static SessionNoteRevisionId NewRevisionId() => new($"NRV-{Guid.NewGuid():N}".ToUpperInvariant());
}

public sealed class UpdateSessionNoteUseCase(ISessionMemoryRepository repository)
{
    public async Task<SessionMemoryCommandResult> ExecuteAsync(UpdateSessionNoteCommand command, CancellationToken cancellationToken)
    {
        var note = await repository.GetNoteAsync(command.SessionId, command.NoteId, command.OwnerId, cancellationToken);
        if (note is null) return new(SessionMemoryCommandOutcome.NotFound);
        var input = SessionNoteRequestValidator.Validate(command.Request);
        if (input.Error is not null) return input.Error;
        if (command.Request.ExpectedRevision is null || command.Request.ExpectedRevision != note.Revision) return RevisionConflict("Lorebook entryが更新されています。再読み込みしてください。");
        if (!await repository.TurnsBelongToSessionAsync(command.SessionId, input.TurnIds, cancellationToken)) return SessionNoteRequestValidator.InvalidTurn();
        var now = DateTimeOffset.UtcNow;
        note.Edit(input.Kind, input.Title, input.AliasesJson, input.Body, input.CanonStatus,
            command.Request.FirstTurnId, command.Request.UpdatedFromTurnId, now);
        repository.AddRevision(note.CaptureRevision(CreateSessionNoteUseCase.NewRevisionId(), now));
        try { await repository.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { return RevisionConflict("Lorebook entryが更新されています。再読み込みしてください。"); }
        return new(SessionMemoryCommandOutcome.Success, SessionMemoryMapper.ToResponse(note));
    }

    internal static SessionMemoryCommandResult RevisionConflict(string message) =>
        new(SessionMemoryCommandOutcome.Conflict, ErrorCode: "note_revision_conflict", ErrorMessage: message);
}

public sealed class ReviewSessionNoteProposalUseCase(ISessionMemoryRepository repository)
{
    public async Task<SessionMemoryCommandResult> ExecuteAsync(ReviewSessionNoteProposalCommand command, CancellationToken cancellationToken)
    {
        var proposal = await repository.GetProposalAsync(command.ArtifactId, command.OwnerId, cancellationToken);
        if (proposal is null) return new(SessionMemoryCommandOutcome.NotFound);
        if (proposal.Status is SessionNoteProposalStatus.Applied or SessionNoteProposalStatus.Rejected)
            return new(SessionMemoryCommandOutcome.Success, Proposal: SessionMemoryMapper.ToResponse(proposal));

        var now = DateTimeOffset.UtcNow;
        SessionNote? note = null;
        if (command.Status == SessionNoteProposalStatus.Applied)
        {
            var title = command.Request.Title?.Trim() ?? proposal.ProposedTitle;
            var body = command.Request.Body?.Trim() ?? proposal.ProposedBody;
            if (proposal.NoteId is null)
            {
                if (command.Request.ExpectedNoteRevision != 0) return UpdateSessionNoteUseCase.RevisionConflict("ノートが更新されています。");
                note = SessionNote.CreateFromProposal(CreateSessionNoteUseCase.NewNoteId("NOT"), proposal, title, body, now);
                repository.AddNote(note);
            }
            else
            {
                note = await repository.GetNoteAsync(proposal.NoteId.Value, cancellationToken);
                if (note is null) return new(SessionMemoryCommandOutcome.NotFound);
                if (note.Revision != command.Request.ExpectedNoteRevision || note.Revision != proposal.ExpectedNoteRevision)
                    return UpdateSessionNoteUseCase.RevisionConflict("ノートが更新されています。差分を再確認してください。");
                note.ApplyProposal(title, body, now);
            }
            repository.AddRevision(note.CaptureRevision(CreateSessionNoteUseCase.NewRevisionId(), now, proposal.ArtifactId));
        }

        proposal.Review(command.Status, note?.Id, now);
        try { await repository.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException)
        {
            return new(SessionMemoryCommandOutcome.Conflict, ErrorCode: "proposal_review_conflict", ErrorMessage: "変更案は別の操作でレビュー済みです。再読み込みしてください。");
        }
        return new(SessionMemoryCommandOutcome.Success, Proposal: SessionMemoryMapper.ToResponse(proposal));
    }
}

internal static class SessionNoteRequestValidator
{
    public static ValidatedSessionNoteRequest Validate(UpsertSessionLorebookEntryRequest request)
    {
        if (!SessionMemoryEnumValues.TryParseNoteKind(request.Kind, out var kind))
            return Error("invalid_lorebook_kind", "Lorebook種別はperson/location/item/organization/ruleから選択してください。");
        if (!SessionMemoryEnumValues.TryParseCanonStatus(request.CanonStatus, out var canonStatus))
            return Error("invalid_canon_status", "Canon statusはcanon/unconfirmed/rumorから選択してください。");
        var title = request.DisplayName?.Trim() ?? string.Empty;
        if (title.Length is 0 or > 160) return Error("invalid_lorebook_name", "表示名を160文字以内で指定してください。");
        var body = request.Content?.Trim() ?? string.Empty;
        if (body.Length is 0 or > 8000) return Error("invalid_lorebook_content", "内容を8000文字以内で指定してください。");
        var aliases = (request.Aliases ?? []).Select(alias => alias.Trim()).Where(alias => alias.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        if (aliases.Length > 20) return Error("invalid_lorebook_aliases", "別名は20件以内で指定してください。");
        var turnIds = new[] { request.FirstTurnId, request.UpdatedFromTurnId }.OfType<SessionTurnId>().Distinct().ToArray();
        return new(kind, canonStatus, title, body, JsonSerializer.Serialize(aliases), turnIds, null);
    }

    public static SessionMemoryCommandResult InvalidTurn() =>
        new(SessionMemoryCommandOutcome.Invalid, ErrorCode: "invalid_lorebook_turn", ErrorMessage: "初出Turnまたは更新元TurnがSessionに属していません。");

    private static ValidatedSessionNoteRequest Error(string code, string message) =>
        new(default, default, string.Empty, string.Empty, "[]", [], new(SessionMemoryCommandOutcome.Invalid, ErrorCode: code, ErrorMessage: message));
}

internal sealed record ValidatedSessionNoteRequest(
    SessionNoteKind Kind, SessionNoteCanonStatus CanonStatus, string Title, string Body, string AliasesJson,
    IReadOnlyCollection<SessionTurnId> TurnIds, SessionMemoryCommandResult? Error);
