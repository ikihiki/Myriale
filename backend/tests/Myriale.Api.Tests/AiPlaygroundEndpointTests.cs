using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace Myriale.Api.Tests;

public sealed class AiPlaygroundEndpointTests : IDisposable
{
    private const string Endpoint = "/api/admin/ai-playground";
    private readonly string dbPath = Path.Combine(Path.GetTempPath(), $"myriale-ai-playground-tests-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> factory;

    public AiPlaygroundEndpointTests()
    {
        factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={dbPath}"));
    }

    [Fact]
    public async Task EndpointRequiresAuthenticationAndAiAdministration()
    {
        using var anonymous = CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync(Endpoint)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PutAsJsonAsync(Endpoint, new { document = ValidDocument(), expectedRevision = (long?)null })).StatusCode);

        using var ordinary = await CreateSignedInClientAsync(grantAdmin: false);
        Assert.Equal(HttpStatusCode.Forbidden, (await ordinary.GetAsync(Endpoint)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await ordinary.PutAsJsonAsync(Endpoint, new { document = ValidDocument(), expectedRevision = (long?)null })).StatusCode);
    }

    [Fact]
    public async Task InitialGetReturnsNotFound()
    {
        using var client = await CreateSignedInClientAsync(grantAdmin: true);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"{Endpoint}/")).StatusCode);
    }

    [Fact]
    public async Task CreateLoadAndUpdatePersistAcrossNewClientSession()
    {
        var account = await CreateAdminAccountAsync();
        using var creator = account.Client;
        using var created = await creator.PutAsJsonAsync(Endpoint, new { document = ValidDocument("Original"), expectedRevision = (long?)null });
        Assert.Equal(HttpStatusCode.OK, created.StatusCode);
        var createdBody = await created.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, createdBody.GetProperty("revision").GetInt64());
        Assert.Equal("Original", Conversation(createdBody).GetProperty("title").GetString());
        Assert.Equal("snapshot-provider", Response(createdBody).GetProperty("metadata").GetProperty("provider").GetString());
        Assert.Equal("request-1", Response(createdBody).GetProperty("metadata").GetProperty("requestId").GetString());
        Assert.NotEqual(default, createdBody.GetProperty("updatedAt").GetDateTimeOffset());

        using var newSession = CreateClient();
        await LoginAsync(newSession, account.Email, account.Password);
        using var loaded = await newSession.GetAsync(Endpoint);
        Assert.Equal(HttpStatusCode.OK, loaded.StatusCode);
        var loadedBody = await loaded.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, loadedBody.GetProperty("revision").GetInt64());
        Assert.Equal("Original", Conversation(loadedBody).GetProperty("title").GetString());

        using var updated = await newSession.PutAsJsonAsync(Endpoint, new { document = ValidDocument("Updated"), expectedRevision = 1L });
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        var updatedBody = await updated.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(2, updatedBody.GetProperty("revision").GetInt64());
        Assert.Equal("Updated", Conversation(updatedBody).GetProperty("title").GetString());
    }

    [Fact]
    public async Task StaleRevisionReturnsConflictWithoutReplacingDocument()
    {
        using var client = await CreateSignedInClientAsync(grantAdmin: true);
        Assert.Equal(HttpStatusCode.OK, (await client.PutAsJsonAsync(Endpoint, new { document = ValidDocument("First"), expectedRevision = (long?)null })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PutAsJsonAsync(Endpoint, new { document = ValidDocument("Second"), expectedRevision = 1L })).StatusCode);

        using var stale = await client.PutAsJsonAsync(Endpoint, new { document = ValidDocument("Stale"), expectedRevision = 1L });
        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
        using var loaded = await client.GetAsync(Endpoint);
        var loadedBody = await loaded.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(2, loadedBody.GetProperty("revision").GetInt64());
        Assert.Equal("Second", Conversation(loadedBody).GetProperty("title").GetString());
    }

    [Fact]
    public async Task MalformedAndOversizedDocumentsReturnBadRequest()
    {
        using var client = await CreateSignedInClientAsync(grantAdmin: true);
        var malformed = ValidDocument(role: "tool");
        using var malformedResponse = await client.PutAsJsonAsync(Endpoint, new { document = malformed, expectedRevision = (long?)null });
        Assert.Equal(HttpStatusCode.BadRequest, malformedResponse.StatusCode);

        var oversized = ValidDocument(content: new string('x', 100_001));
        using var oversizedResponse = await client.PutAsJsonAsync(Endpoint, new { document = oversized, expectedRevision = (long?)null });
        Assert.Equal(HttpStatusCode.BadRequest, oversizedResponse.StatusCode);
        Assert.Contains("oversized", await oversizedResponse.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task DocumentsAreIsolatedByOwner()
    {
        using var first = await CreateSignedInClientAsync(grantAdmin: true);
        using var second = await CreateSignedInClientAsync(grantAdmin: true);

        Assert.Equal(HttpStatusCode.OK, (await first.PutAsJsonAsync(Endpoint, new { document = ValidDocument("First owner"), expectedRevision = (long?)null })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await second.GetAsync(Endpoint)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await second.PutAsJsonAsync(Endpoint, new { document = ValidDocument("Second owner"), expectedRevision = (long?)null })).StatusCode);

        var firstDocument = await (await first.GetAsync(Endpoint)).Content.ReadFromJsonAsync<JsonElement>();
        var secondDocument = await (await second.GetAsync(Endpoint)).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("First owner", Conversation(firstDocument).GetProperty("title").GetString());
        Assert.Equal("Second owner", Conversation(secondDocument).GetProperty("title").GetString());
    }

    public void Dispose()
    {
        factory.Dispose();
        if (File.Exists(dbPath)) File.Delete(dbPath);
    }

    private HttpClient CreateClient() => factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

    private async Task<HttpClient> CreateSignedInClientAsync(bool grantAdmin)
    {
        var client = CreateClient();
        var email = $"playground-{Guid.NewGuid():N}@example.test";
        const string password = "letters1";
        using var register = await client.PostAsJsonAsync("/api/account/register", new { displayName = "Playground user", email, password });
        ApplyCookies(client, register);
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        if (grantAdmin)
        {
            await GrantAdminAsync(email);
            await LoginAsync(client, email, password);
        }
        return client;
    }

    private async Task<(HttpClient Client, string Email, string Password)> CreateAdminAccountAsync()
    {
        var client = CreateClient();
        var email = $"playground-{Guid.NewGuid():N}@example.test";
        const string password = "letters1";
        using var register = await client.PostAsJsonAsync("/api/account/register", new { displayName = "Playground admin", email, password });
        ApplyCookies(client, register);
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        await GrantAdminAsync(email);
        await LoginAsync(client, email, password);
        return (client, email, password);
    }

    private async Task GrantAdminAsync(string email)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await users.FindByEmailAsync(email) ?? throw new InvalidOperationException();
        await users.AddClaimAsync(user, new("myriale:ai-admin", "true"));
    }

    private static async Task LoginAsync(HttpClient client, string email, string password)
    {
        using var login = await client.PostAsJsonAsync("/api/account/login", new { email, password });
        ApplyCookies(client, login);
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    private static void ApplyCookies(HttpClient client, HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var values)) return;
        client.DefaultRequestHeaders.Remove("Cookie");
        foreach (var value in values)
        {
            var cookie = value.Split(';', 2)[0];
            if (!string.IsNullOrWhiteSpace(cookie)) client.DefaultRequestHeaders.Add("Cookie", cookie);
        }
    }

    private static object ValidDocument(string title = "Conversation 1", string role = "user", string content = "Hello") => new
    {
        selectedConversationId = "conversation-1",
        conversations = new[]
        {
            new
            {
                id = "conversation-1",
                title,
                messages = new[] { new { id = "message-1", role, content } },
                profileId = "profile-1",
                generation = new { temperature = "0.7", topP = "0.9", maximumOutputTokens = "512", seed = "", retryAttempts = "1" },
                responses = new[]
                {
                    new
                    {
                        id = "response-1",
                        number = 1,
                        profile = new { id = "snapshot-profile", displayName = "Snapshot profile", model = "snapshot-model" },
                        message = new { role = "assistant", content = "Stored answer" },
                        metadata = new
                        {
                            provider = "snapshot-provider",
                            model = "snapshot-model",
                            responseId = "provider-response-1",
                            inputTokens = 12,
                            outputTokens = 5,
                            latencyMilliseconds = 34,
                            attemptCount = 1,
                            finishReason = "stop",
                            requestId = "request-1",
                        },
                    },
                },
                selectedResponseId = "response-1",
            },
        },
    };

    private static JsonElement Conversation(JsonElement response) => response.GetProperty("document").GetProperty("conversations")[0];
    private static JsonElement Response(JsonElement response) => Conversation(response).GetProperty("responses")[0];
}
