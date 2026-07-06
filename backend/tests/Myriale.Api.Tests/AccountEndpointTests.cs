using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Myriale.Api.Tests;

public sealed class AccountEndpointTests : IDisposable
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"myriale-account-tests-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> _factory;

    public AccountEndpointTests()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={_dbPath}"));
    }

    [Fact]
    public async Task Register_SignsIn_AndMeReturnsCurrentAccount()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        using var register = await client.PostAsJsonAsync("/api/account/register", new
        {
            displayName = "霧野しおり",
            email = "reader@example.test",
            password = "letters1"
        });

        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        ApplyCookies(client, register);
        var registered = await register.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("霧野しおり", registered.GetProperty("displayName").GetString());

        using var me = await client.GetAsync("/api/account/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        var current = await me.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("reader@example.test", current.GetProperty("email").GetString());
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsConflict()
    {
        var client = _factory.CreateClient();
        var payload = new { displayName = "旅人", email = "duplicate@example.test", password = "letters1" };

        using var first = await client.PostAsJsonAsync("/api/account/register", payload);
        using var second = await client.PostAsJsonAsync("/api/account/register", payload);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Login_RejectsWrongPassword_AndAcceptsCorrectPassword()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await client.PostAsJsonAsync("/api/account/register", new { displayName = "旅人", email = "login@example.test", password = "letters1" });
        await client.PostAsync("/api/account/logout", null);

        using var failed = await client.PostAsJsonAsync("/api/account/login", new { email = "login@example.test", password = "wrong-password" });
        Assert.Equal(HttpStatusCode.Unauthorized, failed.StatusCode);

        using var loggedIn = await client.PostAsJsonAsync("/api/account/login", new { email = "login@example.test", password = "letters1" });
        Assert.Equal(HttpStatusCode.OK, loggedIn.StatusCode);
    }

    [Fact]
    public async Task PasswordReset_UsesIdentityTokenProvider()
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/account/register", new { displayName = "旅人", email = "reset@example.test", password = "letters1" });

        using var request = await client.PostAsJsonAsync("/api/account/password-reset/request", new { email = "reset@example.test" });
        Assert.Equal(HttpStatusCode.OK, request.StatusCode);
        var json = await request.Content.ReadFromJsonAsync<JsonElement>();
        var token = json.GetProperty("resetToken").GetString();
        Assert.False(string.IsNullOrWhiteSpace(token));

        using var confirm = await client.PostAsJsonAsync("/api/account/password-reset/confirm", new
        {
            email = "reset@example.test",
            token,
            newPassword = "changed1"
        });
        Assert.Equal(HttpStatusCode.OK, confirm.StatusCode);
    }

    [Fact]
    public async Task Withdraw_SoftDeletesAndSignsOutAccount()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var register = await client.PostAsJsonAsync("/api/account/register", new { displayName = "退会する旅人", email = "withdraw@example.test", password = "letters1" });
        ApplyCookies(client, register);

        using var withdraw = await client.PostAsJsonAsync("/api/account/withdraw", new { confirmation = "withdraw@example.test" });
        Assert.Equal(HttpStatusCode.OK, withdraw.StatusCode);
        ApplyCookies(client, withdraw);

        using var me = await client.GetAsync("/api/account/me");
        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);

        using var login = await client.PostAsJsonAsync("/api/account/login", new { email = "withdraw@example.test", password = "letters1" });
        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
    }

    public void Dispose()
    {
        _factory.Dispose();
        if (File.Exists(_dbPath)) File.Delete(_dbPath);
    }

    private static void ApplyCookies(HttpClient client, HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var values)) return;
        foreach (var value in values)
        {
            var cookie = value.Split(';', 2)[0];
            if (!string.IsNullOrWhiteSpace(cookie)) client.DefaultRequestHeaders.Remove("Cookie");
            client.DefaultRequestHeaders.Add("Cookie", cookie);
        }
    }
}
