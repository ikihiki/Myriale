using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Services;

namespace Myriale.Api.Data;

public static class SessionArtifactFixtureSeedData
{
    public const string SessionId = "SES-DEVELOPMENT-ARTIFACT-FIXTURE";
    public const string ImageId = "IMG-DEVELOPMENT-FIXTURE";
    public const string ImageArtifactId = "ART-DEVELOPMENT-IMAGE";
    public const string NoteArtifactId = "ART-DEVELOPMENT-NOTE";
    public const string StorageKey = "fixtures/session-artifacts/tiny.png";
    public static readonly byte[] TinyPng = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");

    public static async Task SeedAsync(
        ApplicationDbContext db,
        ISessionObjectStorage storage,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        if (!configuration.GetValue<bool>("SessionArtifactFixture:Enabled")) return;
        if (await db.Sessions.AnyAsync(item => item.Id == SessionId, cancellationToken)) return;
        var owner = await db.Users.SingleOrDefaultAsync(item => item.Email == AccountSeedData.DefaultEmail, cancellationToken);
        if (owner is null) return;
        if (!await db.Scenarios.AnyAsync(item => item.Id == "SCN-STAR-LIBRARY", cancellationToken)) return;

        var timestamp = new DateTimeOffset(2026, 7, 21, 9, 0, 0, TimeSpan.Zero);
        var checksum = Convert.ToHexStringLower(SHA256.HashData(TinyPng));
        var moderation = JsonSerializer.Serialize(new { decision = "approved", provider = "deterministic-fixture", categories = Array.Empty<string>() });
        await using (var image = new MemoryStream(TinyPng, writable: false))
            await storage.PutAsync(StorageKey, image, "image/png", cancellationToken);

        var session = new Session
        {
            Id = SessionId,
            OwnerId = owner.Id,
            ScenarioId = "SCN-STAR-LIBRARY",
            CreationRequestId = "development-artifact-fixture",
            SelectedHero = "ミラ / 星図を読む巡礼者",
            Status = "active",
            Revision = 1,
            CreatedAt = timestamp,
            UpdatedAt = timestamp,
            State = new SessionState { SessionId = SessionId, Revision = 1, FlagsJson = "{}", UpdatedAt = timestamp },
        };
        var noteExecution = Execution("EXE-DEVELOPMENT-NOTE", SessionExecutionKinds.NoteProposal, "fixture-note", timestamp);
        var imageExecution = Execution("EXE-DEVELOPMENT-IMAGE", SessionExecutionKinds.Image, "fixture-image", timestamp.AddSeconds(1));
        var noteAttempt = Attempt("ATT-DEVELOPMENT-NOTE", noteExecution.Id, timestamp);
        var imageAttempt = Attempt("ATT-DEVELOPMENT-IMAGE", imageExecution.Id, timestamp.AddSeconds(1));
        var noteArtifact = new SessionArtifact
        {
            Id = NoteArtifactId,
            SessionId = SessionId,
            ExecutionId = noteExecution.Id,
            AttemptId = noteAttempt.Id,
            Kind = "note-patch",
            Status = "committed",
            ContentType = "application/json",
            Checksum = new string('b', 64),
            ContentJson = "{\"title\":\"銀の鍵\",\"body\":\"水没した閲覧室で銀の鍵を見つけた。\"}",
            MetadataJson = "{\"fixture\":true}",
            CreatedAt = timestamp,
            ValidatedAt = timestamp,
            CommittedAt = timestamp,
        };
        var imageArtifact = new SessionArtifact
        {
            Id = ImageArtifactId,
            SessionId = SessionId,
            ExecutionId = imageExecution.Id,
            AttemptId = imageAttempt.Id,
            Kind = "image",
            Status = "committed",
            ContentType = "image/png",
            StorageKey = StorageKey,
            Checksum = checksum,
            MetadataJson = moderation,
            CreatedAt = timestamp.AddSeconds(1),
            ValidatedAt = timestamp.AddSeconds(1),
            CommittedAt = timestamp.AddSeconds(1),
        };

        db.Sessions.Add(session);
        db.SessionExecutions.AddRange(noteExecution, imageExecution);
        db.SessionExecutionAttempts.AddRange(noteAttempt, imageAttempt);
        db.SessionArtifacts.AddRange(noteArtifact, imageArtifact);
        db.SessionNoteProposals.Add(new SessionNoteProposal
        {
            ArtifactId = NoteArtifactId,
            SessionId = SessionId,
            SourceTurnId = "TURN-DEVELOPMENT-FIXTURE",
            ExpectedNoteRevision = 0,
            ProposedTitle = "銀の鍵",
            BeforeBody = "",
            ProposedBody = "水没した閲覧室で銀の鍵を見つけた。",
            Rationale = "開発・テスト用の決定的な変更案です。",
            Status = "pending",
            CreatedAt = timestamp,
        });
        db.SessionImages.Add(new SessionImage
        {
            Id = ImageId,
            SessionId = SessionId,
            SourceTurnId = "TURN-DEVELOPMENT-FIXTURE",
            ArtifactId = ImageArtifactId,
            StorageKey = StorageKey,
            ContentType = "image/png",
            SizeBytes = TinyPng.LongLength,
            Width = 1,
            Height = 1,
            Checksum = checksum,
            ModerationMetadataJson = moderation,
            CreatedAt = timestamp.AddSeconds(1),
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    private static SessionExecution Execution(string id, string kind, string key, DateTimeOffset timestamp) => new()
    {
        Id = id,
        SessionId = SessionId,
        Kind = kind,
        TriggerType = "manual",
        TriggerId = key,
        Status = SessionExecutionStatuses.Succeeded,
        Revision = 1,
        IdempotencyKey = key,
        PayloadHash = new string('a', 64),
        PublishPolicy = "optional",
        IsRetryable = false,
        AttemptCount = 1,
        MaxAttempts = 1,
        CreatedAt = timestamp,
        QueuedAt = timestamp,
        StartedAt = timestamp,
        CompletedAt = timestamp,
    };

    private static SessionExecutionAttempt Attempt(string id, string executionId, DateTimeOffset timestamp) => new()
    {
        Id = id,
        ExecutionId = executionId,
        AttemptNumber = 1,
        Status = "succeeded",
        WorkerId = "fixture",
        StartedAt = timestamp,
        CompletedAt = timestamp,
    };
}
