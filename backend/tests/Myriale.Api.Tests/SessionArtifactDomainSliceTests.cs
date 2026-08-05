using System.Collections.Concurrent;
using System.Reflection;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Myriale.Api.Features.SessionArtifacts.Application;
using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class SessionArtifactDomainSliceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 4, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void TypedJsonFactoriesEnforceKindSchemaBackingChecksumAndTimestamps()
    {
        SessionArtifactPayload[] payloads =
        [
            new RuleActionStepArtifactPayload("{}", "{}", "rule", "[]", "{}"),
            new PostStateNarrativeArtifactPayload("post-state-narrative.v1", "見出し", "本文"),
            new NarrativeTextArtifactPayload("本文"),
            new NotePatchArtifactPayload("題名", "本文"),
        ];

        foreach (var payload in payloads)
        {
            var artifact = SessionArtifact.CreateCommittedJson(
                $"ART-{payload.Kind}", "SES-1", "EXE-1", "ATT-1", payload, "{\"source\":\"test\"}", Now);

            Assert.Equal(payload.Kind, artifact.Kind);
            Assert.Equal(payload.Schema, artifact.Schema);
            Assert.Equal(SessionArtifactStatus.Committed, artifact.Status);
            Assert.NotNull(artifact.PayloadJson);
            Assert.Null(artifact.StorageKey);
            Assert.Equal(64, artifact.Checksum.Length);
            Assert.Equal(Now, artifact.ValidatedAt);
            Assert.Equal(Now, artifact.CommittedAt);
            Assert.Throws<InvalidOperationException>(() => artifact.Commit(Now.AddSeconds(1)));
        }
    }

    [Fact]
    public void DraftArtifactMustValidateBeforeCommit()
    {
        var draft = SessionArtifact.CreateDraftJson(
            "ART-DRAFT", "SES-1", "EXE-1", "ATT-1", new NarrativeTextArtifactPayload("本文"), null, Now);

        Assert.Equal(SessionArtifactStatus.Draft, draft.Status);
        Assert.Throws<InvalidOperationException>(() => draft.Commit(Now));
        draft.Validate(Now.AddSeconds(1));
        Assert.Equal(SessionArtifactStatus.Validated, draft.Status);
        Assert.Equal(Now.AddSeconds(1), draft.ValidatedAt);
        Assert.Throws<InvalidOperationException>(() => draft.Validate(Now.AddSeconds(2)));
        draft.Commit(Now.AddSeconds(2));
        Assert.Equal(SessionArtifactStatus.Committed, draft.Status);
        Assert.Equal(Now.AddSeconds(2), draft.CommittedAt);
    }

    [Fact]
    public void ImageFactoryAndImageFactEnforceStorageBackingAndMatchingMetadata()
    {
        var checksum = new string('a', 64);
        var artifact = SessionArtifact.CreateCommittedImage(
            "ART-IMG", "SES-1", "EXE-1", "ATT-1", "sessions/SES-1/images/ART-IMG.png",
            "image/png", checksum, "{\"decision\":\"approved\"}", Now);
        var image = SessionImage.Create("IMG-1", artifact, "TRN-1", "INP-1", 42, 2, 3, Now.AddDays(1));

        Assert.Equal(SessionArtifactKind.Image, artifact.Kind);
        Assert.Equal(SessionArtifactSchema.ImageV1, artifact.Schema);
        Assert.Null(artifact.PayloadJson);
        Assert.Equal(artifact.StorageKey, image.StorageKey);
        Assert.Equal(artifact.Checksum, image.Checksum);
        Assert.Equal(artifact.MetadataJson, image.ModerationMetadataJson);
        Assert.Throws<ArgumentException>(() => SessionArtifact.CreateCommittedJson(
            "ART-BAD", "SES-1", "EXE-1", "ATT-1",
            new PostStateNarrativeArtifactPayload("post-state-narrative.v2", "見出し", "本文"), null, Now));
    }

    [Fact]
    public void ArtifactAndImageIdentityLifecycleAndBackingSettersAreNotPublic()
    {
        var artifactProperties = new[] { "Id", "SessionId", "ExecutionId", "AttemptId", "Kind", "Status", "Schema", "ContentType", "StorageKey", "Checksum", "PayloadJson", "MetadataJson", "CreatedAt", "ValidatedAt", "CommittedAt" };
        var imageProperties = new[] { "Id", "SessionId", "SourceTurnId", "SourceInputId", "ArtifactId", "StorageKey", "ContentType", "SizeBytes", "Width", "Height", "Checksum", "ModerationMetadataJson", "CreatedAt", "RetainUntil" };

        Assert.All(artifactProperties, property => Assert.False(typeof(SessionArtifact).GetProperty(property)!.SetMethod!.IsPublic));
        Assert.All(imageProperties, property => Assert.False(typeof(SessionImage).GetProperty(property)!.SetMethod!.IsPublic));
        Assert.DoesNotContain(typeof(SessionArtifact).GetConstructors(), constructor => constructor.IsPublic);
        Assert.DoesNotContain(typeof(SessionImage).GetConstructors(), constructor => constructor.IsPublic);
        Assert.Null(typeof(SessionArtifact).GetProperty("ContentJson"));
    }

    [Fact]
    public void UnknownKindStatusAndSchemaAreRejected()
    {
        Assert.Throws<InvalidOperationException>(() => SessionArtifactEnumValues.ParseKind("arbitrary"));
        Assert.Throws<InvalidOperationException>(() => SessionArtifactEnumValues.ParseStatus("published"));
        Assert.Throws<InvalidOperationException>(() => SessionArtifactEnumValues.ParseSchema("image.v2"));
    }

    [Fact]
    public void ArtifactEndpointsDoNotDependOnApplicationDbContext()
    {
        var endpointMethods = typeof(SessionArtifactEndpoints).GetMethods(BindingFlags.Static | BindingFlags.NonPublic);
        Assert.NotEmpty(endpointMethods);
        Assert.All(endpointMethods, method => Assert.DoesNotContain(
            method.GetParameters(), parameter => parameter.ParameterType == typeof(ApplicationDbContext)));
    }

    [Fact]
    public async Task StorageWriteIsCompensatedWhenDatabasePersistenceFails()
    {
        var storage = new TrackingStorage();
        var useCase = new AttachSessionImageUseCase(
            new ThrowingRepository(), storage, new SessionImageValidator(Options.Create(new SessionImageOptions())),
            new FixedTimeProvider(Now));
        var checksum = Convert.ToHexStringLower(SHA256.HashData(SessionArtifactFixtureSeedData.TinyPng));

        await Assert.ThrowsAsync<InvalidOperationException>(() => useCase.ExecuteAsync(Command(checksum), default));

        Assert.Empty(storage.Keys);
        Assert.Equal(1, storage.DeleteCount);
    }

    [Fact]
    public async Task SimultaneousAttachHasOneCreatedAndOneConflictAndCompensatesLoser()
    {
        var storage = new TrackingStorage();
        var repository = new RacingRepository();
        var useCase = new AttachSessionImageUseCase(
            repository, storage, new SessionImageValidator(Options.Create(new SessionImageOptions())),
            new FixedTimeProvider(Now));
        var checksum = Convert.ToHexStringLower(SHA256.HashData(SessionArtifactFixtureSeedData.TinyPng));

        var results = await Task.WhenAll(
            useCase.ExecuteAsync(Command(checksum), default),
            useCase.ExecuteAsync(Command(checksum), default));

        Assert.Equal(1, results.Count(result => result.Outcome == AttachSessionImageOutcome.Created));
        Assert.Equal(1, results.Count(result => result.Outcome == AttachSessionImageOutcome.Conflict));
        Assert.Single(storage.Keys);
        Assert.Equal(1, storage.DeleteCount);
    }

    [Fact]
    public async Task MediaQueryReturnsNotFoundForOtherOwnerAndForReadDeleteRace()
    {
        var storage = new TrackingStorage();
        var repository = new MediaRepository();
        var query = new GetSessionImageMediaQuery(repository, storage);

        Assert.Null(await query.ExecuteAsync("OTHER", "IMG-1", default));
        Assert.Null(await query.ExecuteAsync("OWNER", "IMG-1", default));
    }

    private static AttachSessionImageCommand Command(string checksum) => new(
        "OWNER", "SES-1", "EXE-1", "ATT-1", FormFile(), checksum, "approved", null, null, null, null);

    private static FormFile FormFile()
    {
        var content = SessionArtifactFixtureSeedData.TinyPng;
        var file = new FormFile(new MemoryStream(content), 0, content.Length, "file", "tiny.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png",
        };
        return file;
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class TrackingStorage : ISessionObjectStorage
    {
        private readonly ConcurrentDictionary<string, byte[]> objects = new(StringComparer.Ordinal);
        public IReadOnlyCollection<string> Keys => objects.Keys.ToArray();
        public int DeleteCount;

        public async Task PutAsync(string key, Stream content, string contentType, CancellationToken cancellationToken)
        {
            using var memory = new MemoryStream();
            await content.CopyToAsync(memory, cancellationToken);
            objects[key] = memory.ToArray();
        }

        public Task<StoredSessionObject?> OpenReadAsync(string key, CancellationToken cancellationToken) =>
            Task.FromResult<StoredSessionObject?>(null);
        public Task<IReadOnlyList<SessionObjectInfo>> ListAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<SessionObjectInfo>>([]);
        public Task DeleteAsync(string key, CancellationToken cancellationToken)
        {
            objects.TryRemove(key, out _);
            Interlocked.Increment(ref DeleteCount);
            return Task.CompletedTask;
        }
    }

    private abstract class RepositoryBase : ISessionArtifactRepository
    {
        public virtual Task<SessionImageAttachmentTarget?> FindImageAttachmentTargetAsync(string ownerId, string sessionId, string executionId, string attemptId, CancellationToken cancellationToken) =>
            Task.FromResult<SessionImageAttachmentTarget?>(new(sessionId, executionId, attemptId, SessionExecutionKind.Image, true, false));
        public abstract Task<SessionImagePersistenceOutcome> TryAddImageAsync(SessionArtifact artifact, SessionImage image, CancellationToken cancellationToken);
        public virtual Task<SessionImageMediaDescriptor?> FindImageMediaAsync(string ownerId, string imageId, CancellationToken cancellationToken) =>
            Task.FromResult<SessionImageMediaDescriptor?>(null);
    }

    private sealed class ThrowingRepository : RepositoryBase
    {
        public override Task<SessionImagePersistenceOutcome> TryAddImageAsync(SessionArtifact artifact, SessionImage image, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("database failed");
    }

    private sealed class RacingRepository : RepositoryBase
    {
        private int writes;
        public override Task<SessionImagePersistenceOutcome> TryAddImageAsync(SessionArtifact artifact, SessionImage image, CancellationToken cancellationToken) =>
            Task.FromResult(Interlocked.Increment(ref writes) == 1 ? SessionImagePersistenceOutcome.Created : SessionImagePersistenceOutcome.Conflict);
    }

    private sealed class MediaRepository : RepositoryBase
    {
        public override Task<SessionImagePersistenceOutcome> TryAddImageAsync(SessionArtifact artifact, SessionImage image, CancellationToken cancellationToken) =>
            Task.FromResult(SessionImagePersistenceOutcome.Created);
        public override Task<SessionImageMediaDescriptor?> FindImageMediaAsync(string ownerId, string imageId, CancellationToken cancellationToken) =>
            Task.FromResult<SessionImageMediaDescriptor?>(ownerId == "OWNER" ? new("deleted.png", "image/png") : null);
    }
}
