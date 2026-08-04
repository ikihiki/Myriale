using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Application.SessionArtifacts;
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
        ISessionArtifactWriter artifactWriter,
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

        var session = Session.Create(
            SessionId, owner.Id, "SCN-STAR-LIBRARY", null, null, "development-artifact-fixture", null,
            "ミラ / 星図を読む巡礼者", false,
            new SessionState { SessionId = SessionId, Revision = 1, FlagsJson = "{}", UpdatedAt = timestamp }, timestamp);
        session.AdvanceRuntime(timestamp);
        var noteExecution = Execution("EXE-DEVELOPMENT-NOTE", SessionExecutionKind.NoteProposal, "fixture-note", timestamp);
        var imageExecution = Execution("EXE-DEVELOPMENT-IMAGE", SessionExecutionKind.Image, "fixture-image", timestamp.AddSeconds(1));
        var noteAttempt = Attempt("ATT-DEVELOPMENT-NOTE", noteExecution.Id, timestamp);
        var imageAttempt = Attempt("ATT-DEVELOPMENT-IMAGE", imageExecution.Id, timestamp.AddSeconds(1));
        var noteArtifact = SessionArtifact.CreateCommittedJson(
            NoteArtifactId, SessionId, noteExecution.Id, noteAttempt.Id,
            new NotePatchArtifactPayload("銀の鍵", "水没した閲覧室で銀の鍵を見つけた。"),
            "{\"fixture\":true}", timestamp);
        var imageArtifact = SessionArtifact.CreateCommittedImage(
            ImageArtifactId, SessionId, imageExecution.Id, imageAttempt.Id, StorageKey,
            "image/png", checksum, moderation, timestamp.AddSeconds(1));

        db.Sessions.Add(session);
        db.SessionExecutions.AddRange(noteExecution, imageExecution);
        db.SessionExecutionAttempts.AddRange(noteAttempt, imageAttempt);
        artifactWriter.Add(noteArtifact);
        artifactWriter.Add(imageArtifact);
        db.SessionNoteProposals.Add(SessionNoteProposal.Create(
            NoteArtifactId,
            SessionId,
            "TURN-DEVELOPMENT-FIXTURE",
            null,
            0,
            "銀の鍵",
            "",
            "水没した閲覧室で銀の鍵を見つけた。",
            "開発・テスト用の決定的な変更案です。",
            timestamp));
        db.SessionImages.Add(SessionImage.Create(
            ImageId, imageArtifact, "TURN-DEVELOPMENT-FIXTURE", null,
            TinyPng.LongLength, 1, 1, null));
        await db.SaveChangesAsync(cancellationToken);
    }

    private static SessionExecution Execution(string id, SessionExecutionKind kind, string key, DateTimeOffset timestamp) => new()
    {
        Id = id,
        SessionId = SessionId,
        Kind = kind,
        TriggerType = SessionExecutionTriggerType.Manual,
        TriggerId = key,
        Status = SessionExecutionStatus.Succeeded,
        Revision = 1,
        IdempotencyKey = key,
        PayloadHash = new string('a', 64),
        PublishPolicy = SessionExecutionPublishPolicy.Optional,
        IsRetryable = false,
        AttemptCount = 1,
        MaxAttempts = 1,
        CreatedAt = timestamp,
        QueuedAt = timestamp,
        StartedAt = timestamp,
        CompletedAt = timestamp,
    };

    private static SessionExecutionAttempt Attempt(string id, string executionId, DateTimeOffset timestamp)
    {
        var attempt = SessionExecutionAttempt.Start(id, executionId, 1, "fixture", timestamp);
        attempt.Succeed(timestamp);
        return attempt;
    }
}
