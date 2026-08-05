using System.Net;
using System.Net.Http.Json;
using System.Reflection;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Endpoints;
using Myriale.Api.Features.Accounts.Infrastructure;

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
    public async Task Register_SignsIn_AndMeReturnsFormalActiveState()
    {
        var client = CreateClient();
        using var register = await RegisterAsync(client, "reader@example.test", "霧野しおり");

        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        ApplyCookies(client, register);
        var registered = await register.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("霧野しおり", registered.GetProperty("displayName").GetString());
        Assert.Equal("active", registered.GetProperty("state").GetString());

        using var me = await client.GetAsync("/api/account/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        var current = await me.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("reader@example.test", current.GetProperty("email").GetString());
        Assert.Equal("active", current.GetProperty("state").GetString());
        Assert.False(current.GetProperty("canDebugDialogue").GetBoolean());
    }

    [Fact]
    public async Task DevelopmentSeedAccount_CanLoginAndLoadProfile()
    {
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var seedUserId = await db.Users.Where(user => user.Email == AccountSeedData.DefaultEmail).Select(user => user.Id).SingleAsync();
            Assert.True(await db.UserClaims.AnyAsync(claim => claim.UserId == seedUserId && claim.ClaimType == "myriale:admin" && claim.ClaimValue == "true"));
            Assert.Equal(1, await db.Users.CountAsync());
        }

        var client = CreateClient();
        using var login = await client.PostAsJsonAsync("/api/account/login", new { email = AccountSeedData.DefaultEmail, password = AccountSeedData.DefaultPassword });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        ApplyCookies(client, login);

        using var me = await client.GetAsync("/api/account/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        var current = await me.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(AccountSeedData.DefaultDisplayName, current.GetProperty("displayName").GetString());
        Assert.Equal(AccountSeedData.DefaultEmail, current.GetProperty("email").GetString());
        Assert.True(current.GetProperty("emailConfirmed").GetBoolean());
        Assert.True(current.GetProperty("canDebugDialogue").GetBoolean());
    }

    [Fact]
    public async Task ProfileValidation_ReturnsFieldErrors()
    {
        var client = CreateClient();
        using var register = await RegisterAsync(client, "profile@example.test");
        ApplyCookies(client, register);

        using var response = await client.PutAsJsonAsync("/api/account/profile", new { displayName = " ", bio = new string('x', 401) });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(error.GetProperty("errors").TryGetProperty("displayName", out _));
        Assert.True(error.GetProperty("errors").TryGetProperty("bio", out _));
    }

    [Fact]
    public async Task DuplicateEmailRace_HasOneWinnerAndOneConflict()
    {
        var firstClient = CreateClient();
        var secondClient = CreateClient();
        var payload = new { displayName = "旅人", email = "race@example.test", password = "letters1" };

        var responses = await Task.WhenAll(
            firstClient.PostAsJsonAsync("/api/account/register", payload),
            secondClient.PostAsJsonAsync("/api/account/register", payload));
        try
        {
            Assert.Equal(new[] { HttpStatusCode.OK, HttpStatusCode.Conflict }, responses.Select(response => response.StatusCode).Order().ToArray());
        }
        finally
        {
            foreach (var response in responses) response.Dispose();
        }
    }

    [Fact]
    public async Task Login_RejectsWrongPassword_AndAcceptsCorrectPassword()
    {
        var client = CreateClient();
        await RegisterAsync(client, "login@example.test");
        await client.PostAsync("/api/account/logout", null);

        using var failed = await client.PostAsJsonAsync("/api/account/login", new { email = "login@example.test", password = "wrong-password" });
        Assert.Equal(HttpStatusCode.Unauthorized, failed.StatusCode);

        using var loggedIn = await client.PostAsJsonAsync("/api/account/login", new { email = "login@example.test", password = "letters1" });
        Assert.Equal(HttpStatusCode.OK, loggedIn.StatusCode);
    }

    [Fact]
    public async Task PasswordReset_UsesDedicatedDevelopmentTransport_AndPreventsEnumeration()
    {
        var client = CreateClient();
        await RegisterAsync(client, "reset@example.test");

        using var known = await client.PostAsJsonAsync("/api/account/password-reset/request", new { email = "reset@example.test" });
        using var unknown = await client.PostAsJsonAsync("/api/account/password-reset/request", new { email = "missing@example.test" });
        Assert.Equal(HttpStatusCode.OK, known.StatusCode);
        Assert.Equal(HttpStatusCode.OK, unknown.StatusCode);
        Assert.Equal(await known.Content.ReadAsStringAsync(), await unknown.Content.ReadAsStringAsync());

        var json = await known.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(json.TryGetProperty("resetToken", out _));
        var tokens = _factory.Services.GetRequiredService<IDevelopmentAccountPasswordResetTokenStore>();
        var token = tokens.Take("reset@example.test");
        Assert.False(string.IsNullOrWhiteSpace(token));
        Assert.Null(tokens.Take("missing@example.test"));

        using var confirm = await client.PostAsJsonAsync("/api/account/password-reset/confirm", new
        {
            email = "reset@example.test",
            token,
            newPassword = "changed1"
        });
        Assert.Equal(HttpStatusCode.OK, confirm.StatusCode);
    }

    [Fact]
    public async Task Withdraw_RejectsFutureProfileUpdatesAndLogin()
    {
        var client = CreateClient();
        using var register = await RegisterAsync(client, "withdraw@example.test", "退会する旅人");
        ApplyCookies(client, register);

        using var withdraw = await client.PostAsJsonAsync("/api/account/withdraw", new { confirmation = "withdraw@example.test" });
        Assert.Equal(HttpStatusCode.OK, withdraw.StatusCode);
        ApplyCookies(client, withdraw);

        using var update = await client.PutAsJsonAsync("/api/account/profile", new { displayName = "戻る旅人", bio = "" });
        Assert.Equal(HttpStatusCode.Unauthorized, update.StatusCode);
        using var login = await client.PostAsJsonAsync("/api/account/login", new { email = "withdraw@example.test", password = "letters1" });
        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);

        await using var scope = _factory.Services.CreateAsyncScope();
        var user = await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Users.SingleAsync(user => user.WithdrawnAt != null);
        Assert.Equal(AccountState.Withdrawn, user.State);
        Assert.True(user.IsWithdrawn());
    }

    [Fact]
    public async Task ProfileUpdateAndWithdrawal_UseIdentityConcurrencyStamp()
    {
        var client = CreateClient();
        await RegisterAsync(client, "concurrency@example.test");

        await using var firstScope = _factory.Services.CreateAsyncScope();
        await using var secondScope = _factory.Services.CreateAsyncScope();
        var firstUsers = firstScope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var secondUsers = secondScope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var profileWriter = await firstUsers.FindByEmailAsync("concurrency@example.test") ?? throw new InvalidOperationException();
        var withdrawalWriter = await secondUsers.FindByEmailAsync("concurrency@example.test") ?? throw new InvalidOperationException();

        profileWriter.UpdateProfile("更新した旅人", "競合テスト");
        Assert.True((await firstUsers.UpdateAsync(profileWriter)).Succeeded);
        withdrawalWriter.Withdraw(DateTimeOffset.UtcNow);
        var losingResult = await secondUsers.UpdateAsync(withdrawalWriter);

        Assert.False(losingResult.Succeeded);
        Assert.Contains(losingResult.Errors, error => error.Code == "ConcurrencyFailure");
    }

    [Fact]
    public async Task SecurityStampFailure_RollsBackWithdrawal()
    {
        using var failingFactory = _factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IAccountSecurityStampUpdater>();
            services.AddScoped<IAccountSecurityStampUpdater, FailingSecurityStampUpdater>();
        }));
        var client = failingFactory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var register = await RegisterAsync(client, "stamp-failure@example.test");
        ApplyCookies(client, register);

        using var withdraw = await client.PostAsJsonAsync("/api/account/withdraw", new { confirmation = "stamp-failure@example.test" });
        Assert.Equal(HttpStatusCode.BadRequest, withdraw.StatusCode);

        await using var scope = failingFactory.Services.CreateAsyncScope();
        var user = await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Users.SingleAsync(user => user.Email == "stamp-failure@example.test");
        Assert.False(user.IsWithdrawn());
        Assert.Equal(AccountState.Active, user.State);
    }

    public void Dispose()
    {
        _factory.Dispose();
        if (File.Exists(_dbPath)) File.Delete(_dbPath);
    }

    private HttpClient CreateClient() => _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

    private static Task<HttpResponseMessage> RegisterAsync(HttpClient client, string email, string displayName = "旅人") =>
        client.PostAsJsonAsync("/api/account/register", new { displayName, email, password = "letters1" });

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

    private sealed class FailingSecurityStampUpdater : IAccountSecurityStampUpdater
    {
        public Task<IdentityResult> UpdateAsync(ApplicationUser user) => Task.FromResult(IdentityResult.Failed(new IdentityError
        {
            Code = "SecurityStampFailure",
            Description = "Injected failure",
        }));
    }
}

public sealed class AccountDomainAndArchitectureTests
{
    [Fact]
    public void AccountProfileValidation_IsOwnedByAggregate()
    {
        var user = ApplicationUser.Create("旅人", "domain@example.test");
        var exception = Assert.Throws<AccountValidationException>(() => user.UpdateProfile("", new string('x', 401)));
        Assert.Contains("displayName", exception.Errors.Keys);
        Assert.Contains("bio", exception.Errors.Keys);
    }

    [Fact]
    public void AccountEndpointHandlers_DoNotReceiveIdentityOrDbInfrastructure()
    {
        var forbidden = new[] { typeof(ApplicationDbContext), typeof(UserManager<ApplicationUser>), typeof(SignInManager<ApplicationUser>) };
        var parameters = typeof(AccountEndpoints).GetMethods(BindingFlags.NonPublic | BindingFlags.Static).SelectMany(method => method.GetParameters());
        Assert.DoesNotContain(parameters, parameter => forbidden.Contains(parameter.ParameterType));
    }

    [Theory]
    [InlineData(nameof(ApplicationUser.DisplayName))]
    [InlineData(nameof(ApplicationUser.Bio))]
    [InlineData(nameof(ApplicationUser.CanDebugDialogue))]
    [InlineData(nameof(ApplicationUser.WithdrawnAt))]
    public void AccountDomainPropertiesHaveNoPublicSetter(string propertyName) =>
        Assert.False(typeof(ApplicationUser).GetProperty(propertyName)!.SetMethod?.IsPublic ?? false);

    [Fact]
    public void AccountWireContract_IsClosedAndResetResponseHasNoToken()
    {
        Assert.Equal(typeof(AccountState), typeof(AccountUserResponse).GetProperty(nameof(AccountUserResponse.State))!.PropertyType);
        Assert.Null(typeof(PasswordResetRequestedResponse).GetProperty("ResetToken"));
        Assert.Equal(new[] { AccountState.Active, AccountState.Withdrawn }, Enum.GetValues<AccountState>());
    }
}
