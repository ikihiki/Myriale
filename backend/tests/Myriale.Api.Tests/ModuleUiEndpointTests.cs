using System.IO.Compression;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Modules;
using Myriale.Api.Modules.Execution;

namespace Myriale.Api.Tests;

public sealed class ModuleUiEndpointTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"myriale-ui-tests-{Guid.NewGuid():N}");
    private readonly string _storagePath;
    private readonly WebApplicationFactory<Program> _factory;

    public ModuleUiEndpointTests()
    {
        Directory.CreateDirectory(_root);
        _storagePath = Path.Combine(_root, "modules");
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={Path.Combine(_root, "myriale.db")}");
            builder.UseSetting("Modules:StoragePath", _storagePath);
        });
    }

    [Fact]
    public async Task RuntimeUiEndpointsRequireAuthenticationAndOwner()
    {
        var (owner, executionId, _) = await CreateExecutionAsync("ui-owner@example.test");
        var anonymous = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var anonymousDescriptor = await anonymous.GetAsync($"/api/module-executions/{executionId}/ui/runtime/");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymousDescriptor.StatusCode);

        var other = await AuthenticateAsync("ui-other@example.test");
        using var otherDescriptor = await other.GetAsync($"/api/module-executions/{executionId}/ui/runtime/");
        using var otherResource = await other.GetAsync($"/api/module-executions/{executionId}/ui/runtime/resources/script");
        Assert.Equal(HttpStatusCode.NotFound, otherDescriptor.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherResource.StatusCode);
        owner.Dispose();
    }

    [Fact]
    public async Task DescriptorAndResourcesExposeOnlyVerifiedRuntimeAssets()
    {
        var (client, executionId, _) = await CreateExecutionAsync("ui-assets@example.test");
        using var descriptorResponse = await client.GetAsync($"/api/module-executions/{executionId}/ui/runtime/");
        Assert.Equal(HttpStatusCode.OK, descriptorResponse.StatusCode);
        var descriptor = await descriptorResponse.Content.ReadFromJsonAsync<ModuleRuntimeUiDescriptorResponse>();
        Assert.NotNull(descriptor);
        Assert.Equal("myriale.module-ui", descriptor.Protocol);
        Assert.Equal("myriale-test-module", descriptor.ElementName);
        Assert.Equal("script", descriptor.Script.Id);
        Assert.Single(descriptor.Styles);
        var json = await descriptorResponse.Content.ReadAsStringAsync();
        Assert.DoesNotContain("module.dll", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(_storagePath, json, StringComparison.OrdinalIgnoreCase);

        using var script = await client.GetAsync(descriptor.Script.Url);
        Assert.Equal(HttpStatusCode.OK, script.StatusCode);
        Assert.Equal("text/javascript", script.Content.Headers.ContentType?.MediaType);
        Assert.Contains("nosniff", script.Headers.GetValues("X-Content-Type-Options"));
        Assert.Contains("no-store", script.Headers.CacheControl?.ToString());
        Assert.Contains("customElements.define", await script.Content.ReadAsStringAsync());

        using var style = await client.GetAsync(descriptor.Styles[0].Url);
        Assert.Equal("text/css", style.Content.Headers.ContentType?.MediaType);
        Assert.Contains(":host", await style.Content.ReadAsStringAsync());

        using var undeclared = await client.GetAsync($"/api/module-executions/{executionId}/ui/runtime/resources/style-99");
        Assert.Equal(HttpStatusCode.NotFound, undeclared.StatusCode);
    }

    [Fact]
    public async Task DisabledAndCorruptPackagesNeverServeUiBytes()
    {
        var (client, executionId, digest) = await CreateExecutionAsync("ui-integrity@example.test");
        await using (var scope = _factory.Services.CreateAsyncScope())
            await scope.ServiceProvider.GetRequiredService<IModulePackageService>().SetEnabledAsync(digest, false, default);
        using var disabled = await client.GetAsync($"/api/module-executions/{executionId}/ui/runtime/");
        Assert.Equal(HttpStatusCode.Conflict, disabled.StatusCode);

        await using (var scope = _factory.Services.CreateAsyncScope())
            await scope.ServiceProvider.GetRequiredService<IModulePackageService>().SetEnabledAsync(digest, true, default);
        await File.WriteAllTextAsync(Path.Combine(_storagePath, "expanded", digest, "resources", "runtime.mjs"), "corrupt");
        using var corrupt = await client.GetAsync($"/api/module-executions/{executionId}/ui/runtime/resources/script");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, corrupt.StatusCode);
        Assert.DoesNotContain("corrupt", await corrupt.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task HeadlessExecutionReportsMissingRuntimeUi()
    {
        var client = await AuthenticateAsync("ui-headless@example.test");
        string ownerId;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            ownerId = (await db.Users.SingleAsync(user => user.Email == "ui-headless@example.test")).Id;
            var packages = scope.ServiceProvider.GetRequiredService<IModulePackageService>();
            await using var stream = File.OpenRead(Path.Combine(AppContext.BaseDirectory, "Myriale.HeadlessTestModule.dll"));
            var installed = await packages.InstallAsync(stream, default);
            await packages.SetEnabledAsync(installed.Package.Digest, true, default);
            var executions = scope.ServiceProvider.GetRequiredService<IModuleExecutionService>();
            var created = await executions.InitializeAsync(ownerId, new InitializeModuleExecutionRequest(
                "headless-ui", installed.Package.ModuleId, installed.Package.Version, installed.Package.Digest,
                JsonSerializer.SerializeToElement(new { }), Binding(), 0), default);
            Assert.NotNull(created.Response);
            using var response = await client.GetAsync($"/api/module-executions/{created.Response.Id}/ui/runtime/");
            Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
            Assert.Equal("runtime_ui_not_declared", (await response.Content.ReadFromJsonAsync<ModuleUiErrorResponse>())?.Code);
        }
    }

    private async Task<(HttpClient Client, string ExecutionId, string Digest)> CreateExecutionAsync(string email)
    {
        var client = await AuthenticateAsync(email);
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var ownerId = (await db.Users.SingleAsync(user => user.Email == email)).Id;
        var packages = scope.ServiceProvider.GetRequiredService<IModulePackageService>();
        await using var stream = new MemoryStream(CreatePackage());
        var installed = await packages.InstallAsync(stream, default);
        await packages.SetEnabledAsync(installed.Package.Digest, true, default);
        var executions = scope.ServiceProvider.GetRequiredService<IModuleExecutionService>();
        var created = await executions.InitializeAsync(ownerId, new InitializeModuleExecutionRequest(
            $"init-{Guid.NewGuid():N}", installed.Package.ModuleId, installed.Package.Version, installed.Package.Digest,
            JsonSerializer.SerializeToElement(new { }), Binding(), 0), default);
        Assert.NotNull(created.Response);
        return (client, created.Response.Id, installed.Package.Digest);
    }

    private static JsonElement Binding() => JsonSerializer.SerializeToElement(new
    {
        objectId = "test-object",
        objectTypeId = "test-object-type",
        actionId = "test-action",
        arguments = new { },
        objectState = new { },
    });

    private async Task<HttpClient> AuthenticateAsync(string email)
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var response = await client.PostAsJsonAsync("/api/account/register", new { displayName = "UI player", email, password = "letters1" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        if (response.Headers.TryGetValues("Set-Cookie", out var values)) client.DefaultRequestHeaders.Add("Cookie", values.First().Split(';', 2)[0]);
        return client;
    }

    private static byte[] CreatePackage()
    {
        using var output = new MemoryStream();
        using (var archive = new ZipArchive(output, ZipArchiveMode.Create, true))
        {
            var module = archive.CreateEntry("module.dll");
            using (var target = module.Open())
            using (var source = File.OpenRead(Path.Combine(AppContext.BaseDirectory, "Myriale.TestModule.dll"))) source.CopyTo(target);
            Write(archive, "resources/runtime.mjs", "customElements.define('myriale-test-module', class extends HTMLElement {});");
            Write(archive, "resources/module.css", ":host { display: block; }");
        }
        return output.ToArray();
    }

    private static void Write(ZipArchive archive, string path, string value)
    {
        using var writer = new StreamWriter(archive.CreateEntry(path).Open(), Encoding.UTF8);
        writer.Write(value);
    }

    public void Dispose()
    {
        _factory.Dispose();
        try { if (Directory.Exists(_root)) Directory.Delete(_root, true); } catch { }
    }
}
