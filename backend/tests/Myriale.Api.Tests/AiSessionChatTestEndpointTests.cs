using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Tests;

public sealed class AiSessionChatTestEndpointTests : IDisposable
{
    private readonly string dbPath = Path.Combine(Path.GetTempPath(), $"myriale-session-chat-tests-{Guid.NewGuid():N}.db");
    private readonly ToolLoopTransport transport = new();
    private readonly WebApplicationFactory<Program> factory;

    public AiSessionChatTestEndpointTests()
    {
        factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={dbPath}");
            builder.UseSetting("Database:RecreateOnStartup", "true");
            builder.UseSetting("SeedAccount:Enabled", "true");
            builder.UseSetting("SeedAccount:DisplayName", AccountSeedData.DefaultDisplayName);
            builder.UseSetting("SeedAccount:Email", AccountSeedData.DefaultEmail);
            builder.UseSetting("SeedAccount:Password", AccountSeedData.DefaultPassword);
            builder.UseSetting("AiDeployment:Credentials:runpod:Secret", "test-secret");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IAiPlaygroundChatTransport>();
                services.AddSingleton<IAiPlaygroundChatTransport>(transport);
            });
        });
    }

    [Fact]
    public async Task EndpointRequiresAuthenticationAndAiAdministration()
    {
        using var anonymous = CreateClient();
        using var response = await anonymous.PostAsJsonAsync("/api/admin/ai-profiles/runpod-recommended/session-chat-tests", Request("missing"));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        using var ordinary = CreateClient();
        await RegisterAsync(ordinary, $"ordinary-{Guid.NewGuid():N}@example.test");
        using var forbidden = await ordinary.PostAsJsonAsync("/api/admin/ai-profiles/runpod-recommended/session-chat-tests", Request("missing"));
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
    }

    [Fact]
    public async Task ToolLoopUsesEditableMessagesAndDoesNotMutateSessionState()
    {
        using var client = CreateClient();
        await LoginAsync(client, AccountSeedData.DefaultEmail, AccountSeedData.DefaultPassword);
        var sessionId = await CreateSessionAsync(client, "editable-messages");
        var before = await ReadPersistedSessionSnapshotAsync(sessionId);
        var editableMessages = new object[]
        {
            new { role = "system", content = "Edited system instructions." },
            new { role = "user", content = "Earlier player request." },
            new { role = "assistant", content = "Edited prior narrative." },
            new { role = "user", content = "端末を起動する" },
        };

        using var response = await client.PostAsJsonAsync("/api/admin/ai-profiles/runpod-recommended/session-chat-tests",
            Request(sessionId, messages: editableMessages));
        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        Assert.Equal("Preview complete.", json.GetProperty("message").GetProperty("content").GetString());
        Assert.Contains("# Narrative instructions", json.GetProperty("systemMarkdown").GetString(), StringComparison.Ordinal);
        Assert.Contains("current authoritative Session context", json.GetProperty("systemMarkdown").GetString(), StringComparison.Ordinal);
        Assert.Contains("# Available actions", json.GetProperty("systemMarkdown").GetString(), StringComparison.Ordinal);
        var firstRequest = transport.Requests[0].Messages.Take(4).ToArray();
        Assert.Equal(new[] { "system", "user", "assistant", "user" }, firstRequest.Select(message => message.Role));
        Assert.Equal(new[] { "Edited system instructions.", "Earlier player request.", "Edited prior narrative.", "端末を起動する" },
            firstRequest.Select(message => message.Content));
        var sent = json.GetProperty("sentMessages").EnumerateArray().ToArray();
        Assert.Equal("tool", sent[^1].GetProperty("role").GetString());
        var preview = Assert.Single(json.GetProperty("toolPreviews").EnumerateArray().ToArray());
        Assert.Equal("valid", preview.GetProperty("status").GetString());
        Assert.Equal("no-op", preview.GetProperty("actionCode").GetString());
        Assert.Equal(2, json.GetProperty("metadata").GetProperty("providerRounds").GetInt32());
        Assert.Equal(15, json.GetProperty("metadata").GetProperty("inputTokens").GetInt32());
        Assert.Equal(before, await ReadPersistedSessionSnapshotAsync(sessionId));
    }

    [Fact]
    public async Task ImportUsesLatestTwentyNarrativeTurnsInOrderAndExcludesSelectedAssistant()
    {
        using var client = CreateClient();
        await LoginAsync(client, AccountSeedData.DefaultEmail, AccountSeedData.DefaultPassword);
        var sessionId = await CreateSessionAsync(client, "history-window");
        var selectedTurnId = await AddNarrativeHistoryAsync(sessionId, 21);

        using var response = await client.PostAsJsonAsync("/api/admin/ai-profiles/runpod-recommended/session-chat-imports",
            ImportRequest(sessionId, selectedTurnId));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(sessionId, json.GetProperty("sessionId").GetString());
        Assert.Equal(selectedTurnId, json.GetProperty("turnId").GetString());
        Assert.Equal(22, json.GetProperty("turnPosition").GetInt32());
        Assert.Contains("current authoritative Session context", json.GetProperty("systemMarkdown").GetString(), StringComparison.Ordinal);
        var messages = json.GetProperty("messages").EnumerateArray().ToArray();
        Assert.Equal(40, messages.Length);
        Assert.Equal("system", messages[0].GetProperty("role").GetString());
        Assert.Equal("input-2", messages[1].GetProperty("content").GetString());
        Assert.Equal("history-2", messages[2].GetProperty("content").GetString());
        Assert.Equal("input-21", messages[^1].GetProperty("content").GetString());
        Assert.DoesNotContain(messages, message => message.GetProperty("content").GetString() is "input-1" or "history-1" or "history-21");
    }

    [Fact]
    public async Task ImportRejectsMissingAndNonActionResultTurns()
    {
        using var client = CreateClient();
        await LoginAsync(client, AccountSeedData.DefaultEmail, AccountSeedData.DefaultPassword);
        var sessionId = await CreateSessionAsync(client, "invalid-import");
        SessionTurnId openingTurnId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            openingTurnId = (await db.Sessions.AsNoTracking().SingleAsync(item => item.Id == new SessionId(sessionId))).HeadTurnId
                ?? throw new InvalidOperationException("Created session must have an opening turn.");
        }

        using var missing = await client.PostAsJsonAsync("/api/admin/ai-profiles/runpod-recommended/session-chat-imports",
            ImportRequest(sessionId, "TRN-MISSING"));
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);

        using var invalid = await client.PostAsJsonAsync("/api/admin/ai-profiles/runpod-recommended/session-chat-imports",
            ImportRequest(sessionId, openingTurnId.AsPrimitive()));
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        Assert.Contains("session_turn_not_importable", await invalid.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task ExecutionValidatesEditableMessageShapeAndLimits()
    {
        using var client = CreateClient();
        await LoginAsync(client, AccountSeedData.DefaultEmail, AccountSeedData.DefaultPassword);
        var sessionId = await CreateSessionAsync(client, "message-validation");
        var cases = new (object Request, string Code)[]
        {
            (Request(sessionId, messages: []), "messages_required"),
            (Request(sessionId, messages: [new { role = "tool", content = "no" }]), "message_role_invalid"),
            (Request(sessionId, messages: [new { role = "user", content = "   " }]), "message_content_required"),
            (Request(sessionId, messages: [new { role = "user", content = new string('x', 10_001) }]), "message_content_too_large"),
            (Request(sessionId, messages: Enumerable.Range(0, 101).Select(index => (object)new { role = "user", content = $"m-{index}" }).ToArray()), "message_count_exceeded"),
            (Request(sessionId, messages: Enumerable.Range(0, 6).Select(_ => (object)new { role = "user", content = new string('x', 10_000) }).ToArray()), "messages_payload_too_large"),
        };

        foreach (var item in cases)
        {
            using var response = await client.PostAsJsonAsync("/api/admin/ai-profiles/runpod-recommended/session-chat-tests", item.Request);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains(item.Code, await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        }
        Assert.Empty(transport.Requests);
    }

    [Fact]
    public async Task InvalidToolArgumentsAreAuditedAndReturnedToModelForRecovery()
    {
        transport.Mode = ToolLoopMode.InvalidArguments;
        using var client = CreateClient();
        await LoginAsync(client, AccountSeedData.DefaultEmail, AccountSeedData.DefaultPassword);
        var sessionId = await CreateSessionAsync(client, "invalid-arguments");

        using var response = await client.PostAsJsonAsync("/api/admin/ai-profiles/runpod-recommended/session-chat-tests", Request(sessionId));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var preview = Assert.Single(json.GetProperty("toolPreviews").EnumerateArray().ToArray());
        Assert.Equal("invalid", preview.GetProperty("status").GetString());
        Assert.Equal("invalid_action_arguments", preview.GetProperty("errorCode").GetString());
        Assert.Contains(transport.Requests[1].Messages, message => message.Role == "tool" && message.Content!.Contains("invalid_action_arguments", StringComparison.Ordinal));
    }

    [Fact]
    public async Task MaxToolRoundsStopsRepeatedToolCalls()
    {
        transport.Mode = ToolLoopMode.AlwaysTool;
        using var client = CreateClient();
        await LoginAsync(client, AccountSeedData.DefaultEmail, AccountSeedData.DefaultPassword);
        var sessionId = await CreateSessionAsync(client, "max-rounds");

        using var response = await client.PostAsJsonAsync("/api/admin/ai-profiles/runpod-recommended/session-chat-tests",
            Request(sessionId, maxToolRounds: 1));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("max_tool_rounds_exceeded", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task StaleProfileRevisionConflictsBeforeProviderIo()
    {
        using var client = CreateClient();
        await LoginAsync(client, AccountSeedData.DefaultEmail, AccountSeedData.DefaultPassword);
        var sessionId = await CreateSessionAsync(client, "stale-profile");

        using var response = await client.PostAsJsonAsync("/api/admin/ai-profiles/runpod-recommended/session-chat-tests",
            Request(sessionId, expectedProfileRevision: 99));
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Empty(transport.Requests);
    }

    [Fact]
    public async Task ProviderFailureDoesNotExposeRawBodyOrCredential()
    {
        transport.Mode = ToolLoopMode.ProviderFailure;
        using var client = CreateClient();
        await LoginAsync(client, AccountSeedData.DefaultEmail, AccountSeedData.DefaultPassword);
        var sessionId = await CreateSessionAsync(client, "provider-failure");

        using var response = await client.PostAsJsonAsync("/api/admin/ai-profiles/runpod-recommended/session-chat-tests", Request(sessionId));
        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.DoesNotContain("raw-provider-body", body, StringComparison.Ordinal);
        Assert.DoesNotContain("super-secret", body, StringComparison.Ordinal);
        Assert.Contains("provider_unavailable", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task SessionOwnershipIsNotBypassedByAiAdministration()
    {
        using var owner = CreateClient();
        await LoginAsync(owner, AccountSeedData.DefaultEmail, AccountSeedData.DefaultPassword);
        using var created = await owner.PostAsJsonAsync("/api/sessions", new
        {
            scenarioId = "SCN-STAR-LIBRARY",
            requestId = $"owner-isolation-{Guid.NewGuid():N}",
        });
        var sessionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
        var selectedTurnId = await AddNarrativeHistoryAsync(sessionId, 1);

        using var other = CreateClient();
        var email = $"other-admin-{Guid.NewGuid():N}@example.test";
        await RegisterAsync(other, email);
        await GrantAiAdminAsync(email);
        await LoginAsync(other, email, "letters1");
        using var response = await other.PostAsJsonAsync("/api/admin/ai-profiles/runpod-recommended/session-chat-tests", Request(sessionId));
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        using var import = await other.PostAsJsonAsync("/api/admin/ai-profiles/runpod-recommended/session-chat-imports",
            ImportRequest(sessionId, selectedTurnId));
        Assert.Equal(HttpStatusCode.NotFound, import.StatusCode);
    }

    private async Task<string> ReadPersistedSessionSnapshotAsync(string sessionId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var id = new SessionId(sessionId);
        var session = await db.Sessions.AsNoTracking().SingleAsync(item => item.Id == id);
        var states = await db.SessionObjectStates.AsNoTracking().Where(item => item.SessionId == id)
            .OrderBy(item => item.ScenarioObjectId).Select(item => new { item.ScenarioObjectId, item.Revision, item.LocationId, item.StateJson }).ToListAsync();
        return JsonSerializer.Serialize(new { session.Revision, session.CurrentLocationId, session.Status, states });
    }

    private static object Request(string sessionId, int maxToolRounds = 2,
        long expectedProfileRevision = 0, long expectedCredentialRevision = 0, object[]? messages = null) => new
    {
        sessionId,
        messages = messages ?? [new { role = "user", content = "Continue." }],
        expectedProfileRevision,
        expectedCredentialRevision,
        maxToolRounds,
    };

    private static object ImportRequest(string sessionId, string turnId,
        long expectedProfileRevision = 0, long expectedCredentialRevision = 0) => new
    {
        sessionId,
        turnId,
        expectedProfileRevision,
        expectedCredentialRevision,
    };

    private async Task<string> AddNarrativeHistoryAsync(string sessionId, int count)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var session = await db.Sessions.SingleAsync(item => item.Id == new SessionId(sessionId));
        var previous = session.HeadTurnId;
        SessionTurnId? selected = null;
        for (var index = 1; index <= count; index++)
        {
            var inputId = new SessionPlayerInputId($"INP-PLAYGROUND-{index:D2}");
            var turnId = new SessionTurnId($"TRN-PLAYGROUND-{index:D2}");
            db.SessionPlayerInputs.Add(SessionPlayerInput.Accept(inputId, session.Id, $"input-{index}", $"input-{index}",
                SessionInputInteractionType.Dialogue, new string((char)('a' + index % 26), 64), previous,
                session.Revision, session.OwnerId, null, DateTimeOffset.UtcNow.AddMinutes(index)));
            db.SessionTurns.Add(SessionTurn.CreateScenarioNarrative(turnId, session.Id, index + 1, previous, inputId,
                "test.v1", null, null, null, $"history-{index}", null, session.Revision,
                SessionTurnAiMetadata.None, DateTimeOffset.UtcNow.AddMinutes(index).AddSeconds(1)));
            previous = turnId;
            selected = turnId;
        }
        await db.SaveChangesAsync();
        return selected?.AsPrimitive() ?? throw new InvalidOperationException("At least one history turn is required.");
    }

    private async Task<string> CreateSessionAsync(HttpClient client, string requestId)
    {
        using var response = await client.PostAsJsonAsync("/api/sessions", new
        {
            scenarioId = "SCN-STAR-LIBRARY",
            requestId = $"{requestId}-{Guid.NewGuid():N}",
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private HttpClient CreateClient() => factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

    private static async Task RegisterAsync(HttpClient client, string email)
    {
        using var response = await client.PostAsJsonAsync("/api/account/register", new { displayName = "Session chat", email, password = "letters1" });
        ApplyCookies(client, response);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private static async Task LoginAsync(HttpClient client, string email, string password)
    {
        using var response = await client.PostAsJsonAsync("/api/account/login", new { email, password });
        ApplyCookies(client, response);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task GrantAiAdminAsync(string email)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await users.FindByEmailAsync(email) ?? throw new InvalidOperationException();
        await users.AddClaimAsync(user, new("myriale:ai-admin", "true"));
    }

    private static void ApplyCookies(HttpClient client, HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var values)) return;
        client.DefaultRequestHeaders.Remove("Cookie");
        client.DefaultRequestHeaders.Add("Cookie", string.Join("; ", values.Select(value => value.Split(';', 2)[0])));
    }

    public void Dispose()
    {
        factory.Dispose();
        if (File.Exists(dbPath)) File.Delete(dbPath);
    }

    private enum ToolLoopMode { Valid, InvalidArguments, AlwaysTool, ProviderFailure, FinalOnly }

    private sealed class ToolLoopTransport : IAiPlaygroundChatTransport
    {
        private int calls;
        public ToolLoopMode Mode { get; set; }
        public List<AiPlaygroundChatRequest> Requests { get; } = [];

        public Task<AiPlaygroundChatResponse> SendAsync(AiProfileDescriptor profile, string credential, AiPlaygroundChatRequest request, CancellationToken cancellationToken)
        {
            Requests.Add(request);
            calls++;
            if (Mode == ToolLoopMode.ProviderFailure)
                throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "super-secret raw-provider-body", true,
                    providerResponseExcerpt: "raw-provider-body", receivedResult: "super-secret");
            if (Mode == ToolLoopMode.FinalOnly)
                return Task.FromResult(new AiPlaygroundChatResponse(new("assistant", "History received."),
                    new(profile.Id, profile.Model, $"response-{calls}", 5, 1, 3, 1, "stop", request.GenerationOverrides)));
            if (request.Messages.Last().Role == "tool" && Mode != ToolLoopMode.AlwaysTool)
                return Task.FromResult(new AiPlaygroundChatResponse(new("assistant", "Preview complete."),
                    new(profile.Id, profile.Model, $"response-{calls}", 8, 3, 7, 1, "stop", request.GenerationOverrides)));
            var arguments = Mode == ToolLoopMode.InvalidArguments
                ? "{\"selectionCode\":\"system:no-op\",\"arguments\":{\"extra\":true}}"
                : "{\"selectionCode\":\"system:no-op\",\"arguments\":{}}";
            return Task.FromResult(new AiPlaygroundChatResponse(
                new("assistant", null, ToolCalls: [new($"call-{calls}", "preview_rule_action", arguments)]),
                new(profile.Id, profile.Model, $"response-{calls}", 7, 2, 5, 1, "tool_calls", request.GenerationOverrides)));
        }
    }
}
