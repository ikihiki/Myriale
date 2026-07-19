using System.Security.Claims;
using System.IO.Compression;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Myriale.Api.Data;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Myriale.Api.Tests;

public sealed class ModuleAdminEndpointTests : IDisposable
{
    private const string AdminEmail = "module-admin@example.test";
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"myriale-module-tests-{Guid.NewGuid():N}");
    private readonly string _dbPath;
    private readonly string _storagePath;
    private WebApplicationFactory<Program> _factory;

    public ModuleAdminEndpointTests()
    {
        Directory.CreateDirectory(_root);
        _dbPath = Path.Combine(_root, "myriale.db");
        _storagePath = Path.Combine(_root, "modules");
        _factory = CreateFactory();
    }

    [Fact]
    public async Task ModuleEndpoints_RequireConfiguredAdministrator()
    {
        var anonymous = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var anonymousResponse = await anonymous.GetAsync("/api/admin/modules/");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymousResponse.StatusCode);

        var ordinary = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterAndAuthenticateAsync(ordinary, AdminEmail);
        using var ordinaryResponse = await ordinary.GetAsync("/api/admin/modules/");
        Assert.Equal(HttpStatusCode.Forbidden, ordinaryResponse.StatusCode);
    }

    [Fact]
    public async Task Install_EnableDisableAndList_ReturnCatalog()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterModuleAdminAsync(client);
        var package = CreatePackage();

        using var install = await InstallAsync(client, package);
        Assert.Equal(HttpStatusCode.Created, install.StatusCode);
        var installed = await install.Content.ReadFromJsonAsync<JsonElement>();
        var digest = installed.GetProperty("package").GetProperty("digest").GetString();
        Assert.NotNull(digest);
        Assert.Equal(64, digest.Length);
        Assert.True(installed.GetProperty("created").GetBoolean());
        Assert.False(installed.GetProperty("package").GetProperty("isEnabled").GetBoolean());

        using var reinstall = await InstallAsync(client, package);
        Assert.Equal(HttpStatusCode.OK, reinstall.StatusCode);

        using var enable = await client.PostAsync($"/api/admin/modules/{digest}/enable", null);
        Assert.Equal(HttpStatusCode.OK, enable.StatusCode);
        Assert.True((await enable.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("isEnabled").GetBoolean());

        using var list = await client.GetAsync("/api/admin/modules/");
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);
        var rows = await list.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Single(rows.EnumerateArray());
        Assert.True(rows[0].GetProperty("isEnabled").GetBoolean());

        using var disable = await client.PostAsync($"/api/admin/modules/{digest}/disable", null);
        Assert.Equal(HttpStatusCode.OK, disable.StatusCode);
        Assert.False((await disable.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("isEnabled").GetBoolean());
    }

    [Fact]
    public async Task Rescan_RepairsCorruptedExpandedResourceFromVerifiedArchive()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterModuleAdminAsync(client);
        using var install = await InstallAsync(client, CreatePackage());
        var installed = await install.Content.ReadFromJsonAsync<JsonElement>();
        var digest = installed.GetProperty("package").GetProperty("digest").GetString()!;
        var runtimePath = Path.Combine(_storagePath, "expanded", digest, "resources", "runtime.mjs");
        await File.WriteAllTextAsync(runtimePath, "corrupt");

        using var scan = await client.PostAsync("/api/admin/modules/rescan", null);

        Assert.Equal(HttpStatusCode.OK, scan.StatusCode);
        Assert.Contains("customElements.define", await File.ReadAllTextAsync(runtimePath));
    }

    [Fact]
    public async Task Rescan_RepairsMissingStoredPackageAndExpandedResources()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterModuleAdminAsync(client);
        var packageBytes = CreatePackage();
        using var install = await InstallAsync(client, packageBytes);
        var installed = await install.Content.ReadFromJsonAsync<JsonElement>();
        var digest = installed.GetProperty("package").GetProperty("digest").GetString()!;

        File.Delete(Path.Combine(_storagePath, "packages", $"{digest}.myriale-module"));
        Directory.Delete(Path.Combine(_storagePath, "expanded", digest), true);
        var inbox = Path.Combine(_storagePath, "inbox");
        Directory.CreateDirectory(inbox);
        await File.WriteAllBytesAsync(Path.Combine(inbox, "repair.myriale-module"), packageBytes);

        using var scan = await client.PostAsync("/api/admin/modules/rescan", null);
        Assert.Equal(HttpStatusCode.OK, scan.StatusCode);
        Assert.True(File.Exists(Path.Combine(_storagePath, "packages", $"{digest}.myriale-module")));
        Assert.True(File.Exists(Path.Combine(_storagePath, "expanded", digest, "resources", "runtime.mjs")));

        using var get = await client.GetAsync($"/api/admin/modules/{digest}");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        Assert.Equal("installed", (await get.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Install_AcceptsHeadlessDll()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterModuleAdminAsync(client);
        var dll = ReadHeadlessModule();

        using var install = await InstallAsync(client, dll);

        Assert.Equal(HttpStatusCode.Created, install.StatusCode);
        var installed = await install.Content.ReadFromJsonAsync<JsonElement>();
        var package = installed.GetProperty("package");
        Assert.Equal("com.myriale.headless-test-module", package.GetProperty("moduleId").GetString());
        var digest = package.GetProperty("digest").GetString()!;
        Assert.True(File.Exists(Path.Combine(_storagePath, "packages", $"{digest}.dll")));
        Assert.True(File.Exists(Path.Combine(_storagePath, "expanded", digest, "module.dll")));
    }

    [Fact]
    public async Task Rescan_RepairsCorruptedExpandedDll()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterModuleAdminAsync(client);
        using var install = await InstallAsync(client, ReadHeadlessModule());
        var installed = await install.Content.ReadFromJsonAsync<JsonElement>();
        var digest = installed.GetProperty("package").GetProperty("digest").GetString()!;
        var expandedDll = Path.Combine(_storagePath, "expanded", digest, "module.dll");
        await File.WriteAllTextAsync(expandedDll, "corrupt");

        using var scan = await client.PostAsync("/api/admin/modules/rescan", null);

        Assert.Equal(HttpStatusCode.OK, scan.StatusCode);
        Assert.Equal(ReadHeadlessModule(), await File.ReadAllBytesAsync(expandedDll));
    }

    [Fact]
    public async Task Install_RejectsBareDllThatDeclaresUiResources()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterModuleAdminAsync(client);
        var assemblyPath = Path.Combine(AppContext.BaseDirectory, "Myriale.TestModule.dll");

        using var install = await InstallAsync(client, await File.ReadAllBytesAsync(assemblyPath));

        Assert.Equal(HttpStatusCode.BadRequest, install.StatusCode);
    }

    [Fact]
    public async Task Rescan_InstallsPackagePlacedInInbox()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterModuleAdminAsync(client);
        var inbox = Path.Combine(_storagePath, "inbox");
        Directory.CreateDirectory(inbox);
        await File.WriteAllBytesAsync(Path.Combine(inbox, "test.myriale-module"), CreatePackage());

        using var response = await client.PostAsync("/api/admin/modules/rescan", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, result.GetProperty("installed").GetInt32());
        Assert.Empty(result.GetProperty("issues").EnumerateArray());
        Assert.Empty(Directory.EnumerateFiles(inbox));
    }

    [Fact]
    public async Task Rescan_InstallsDllPlacedInInbox()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterModuleAdminAsync(client);
        var inbox = Path.Combine(_storagePath, "inbox");
        Directory.CreateDirectory(inbox);
        await File.WriteAllBytesAsync(Path.Combine(inbox, "headless.dll"), ReadHeadlessModule());

        using var response = await client.PostAsync("/api/admin/modules/rescan", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, result.GetProperty("installed").GetInt32());
        Assert.Empty(result.GetProperty("issues").EnumerateArray());
        Assert.Empty(Directory.EnumerateFiles(inbox));
    }

    [Fact]
    public async Task Install_RejectsDifferentDigestForSameModuleVersion()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterModuleAdminAsync(client);
        using var first = await InstallAsync(client, CreatePackage(runtimeSuffix: "one"));
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        using var second = await InstallAsync(client, CreatePackage(runtimeSuffix: "two"));

        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    [Theory]
    [InlineData("resources/undeclared.txt")]
    [InlineData("../outside.txt")]
    public async Task Install_RejectsUndeclaredOrUnsafeEntries(string extraEntry)
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterModuleAdminAsync(client);

        using var response = await InstallAsync(client, CreatePackage(extraEntry));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var list = await client.GetAsync("/api/admin/modules/");
        Assert.Empty((await list.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray());
    }

    public void Dispose()
    {
        _factory.Dispose();
        if (Directory.Exists(_root)) Directory.Delete(_root, true);
    }

    private WebApplicationFactory<Program> CreateFactory() => new WebApplicationFactory<Program>()
        .WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={_dbPath}");
            builder.UseSetting("Modules:StoragePath", _storagePath);
        });

    private async Task RegisterModuleAdminAsync(HttpClient client)
    {
        await RegisterAndAuthenticateAsync(client, AdminEmail);
        using (var scope = _factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByEmailAsync(AdminEmail);
            Assert.NotNull(user);
            var result = await userManager.AddClaimAsync(user, new Claim("myriale:module-admin", "true"));
            Assert.True(result.Succeeded);
        }
        await client.PostAsync("/api/account/logout", null);
        await LoginAndAuthenticateAsync(client, AdminEmail);
    }

    private static async Task<HttpResponseMessage> InstallAsync(HttpClient client, byte[] package)
    {
        var content = new ByteArrayContent(package);
        content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        return await client.PostAsync("/api/admin/modules/install", content);
    }

    private static byte[] ReadHeadlessModule()
    {
        var assemblyPath = Path.Combine(AppContext.BaseDirectory, "Myriale.HeadlessTestModule.dll");
        Assert.True(File.Exists(assemblyPath), $"Headless test module assembly was not found: {assemblyPath}");
        return File.ReadAllBytes(assemblyPath);
    }

    private static byte[] CreatePackage(string? extraEntry = null, string runtimeSuffix = "")
    {
        var assemblyPath = Path.Combine(AppContext.BaseDirectory, "Myriale.TestModule.dll");
        Assert.True(File.Exists(assemblyPath), $"Test module assembly was not found: {assemblyPath}");
        using var buffer = new MemoryStream();
        using (var archive = new ZipArchive(buffer, ZipArchiveMode.Create, leaveOpen: true))
        {
            var module = archive.CreateEntry("module.dll");
            using (var output = module.Open())
            using (var input = File.OpenRead(assemblyPath))
            {
                input.CopyTo(output);
            }
            WriteEntry(archive, "resources/runtime.mjs", $"customElements.define('myriale-test-module', class extends HTMLElement {{}});{runtimeSuffix}");
            WriteEntry(archive, "resources/module.css", ":host { display: block; }");
            if (extraEntry is not null) WriteEntry(archive, extraEntry, "invalid");
        }
        return buffer.ToArray();
    }

    private static void WriteEntry(ZipArchive archive, string path, string value)
    {
        var entry = archive.CreateEntry(path);
        using var writer = new StreamWriter(entry.Open(), Encoding.UTF8);
        writer.Write(value);
    }

    private static async Task RegisterAndAuthenticateAsync(HttpClient client, string email)
    {
        using var response = await client.PostAsJsonAsync("/api/account/register", new
        {
            displayName = "Module admin",
            email,
            password = "letters1"
        });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        ApplyCookies(client, response);
    }

    private static async Task LoginAndAuthenticateAsync(HttpClient client, string email)
    {
        using var response = await client.PostAsJsonAsync("/api/account/login", new { email, password = "letters1" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        ApplyCookies(client, response);
    }

    private static void ApplyCookies(HttpClient client, HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var values)) return;
        foreach (var value in values)
        {
            var cookie = value.Split(';', 2)[0];
            client.DefaultRequestHeaders.Remove("Cookie");
            client.DefaultRequestHeaders.Add("Cookie", cookie);
        }
    }
}
