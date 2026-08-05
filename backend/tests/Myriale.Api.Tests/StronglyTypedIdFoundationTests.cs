using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Myriale.Api.Infrastructure.Persistence;
using Myriale.Api.Features.AiProviders.Identifiers;
using Myriale.Api.Features.Wave0.Identifiers;

namespace Myriale.Api.Tests;

public sealed class StronglyTypedIdFoundationTests
{
    [Fact]
    public void AiProviderIdsPreserveNormalizationValidationAndExplicitBoundaries()
    {
        var profileId = new AiProviderProfileId(" Acme.Main ");
        var credentialId = new AiCredentialId(" SHARED_1 ");

        Assert.Equal("acme.main", profileId.AsPrimitive());
        Assert.Equal("shared_1", credentialId.AsPrimitive());
        Assert.Equal(profileId, AiProviderProfileId.Parse("ACME.MAIN"));
        Assert.True(AiCredentialId.TryParse(" shared_1 ", out var parsed));
        Assert.Equal(credentialId, parsed);
        Assert.Throws<ArgumentException>(() => new AiProviderProfileId("not valid!"));
        Assert.Throws<ArgumentException>(() => new AiCredentialId(string.Empty));

        Assert.Equal("acme.main", (string)profileId);
        Assert.Equal(profileId, (AiProviderProfileId)"ACME.MAIN");
        Assert.DoesNotContain(typeof(AiProviderProfileId).GetMethods(), method => method.Name == "op_Implicit");
        Assert.DoesNotContain(typeof(AiCredentialId).GetMethods(), method => method.Name == "op_Implicit");
    }

    [Fact]
    public void RepresentativeStringLongAndGuidIdsUsePrimitiveJsonShapesWithoutArithmetic()
    {
        var stringId = new RepresentativeStringId("alpha");
        var longId = new RepresentativeLongId(42);
        var guid = Guid.Parse("6ff31df7-7d9e-4824-a2b4-b90a1059989e");
        var guidId = new RepresentativeGuidId(guid);

        Assert.Equal("\"alpha\"", JsonSerializer.Serialize(stringId));
        Assert.Equal("42", JsonSerializer.Serialize(longId));
        Assert.Equal($"\"{guid}\"", JsonSerializer.Serialize(guidId));
        Assert.Equal(stringId, JsonSerializer.Deserialize<RepresentativeStringId>("\"alpha\""));
        Assert.Equal(longId, RepresentativeLongId.Parse("42"));
        Assert.Equal(guidId, RepresentativeGuidId.Parse(guid.ToString()));

        foreach (var type in new[] { typeof(RepresentativeStringId), typeof(RepresentativeLongId), typeof(RepresentativeGuidId) })
        {
            Assert.DoesNotContain(type.GetMethods(), method => method.Name == "op_Implicit");
            Assert.DoesNotContain(type.GetMethods(), method => method.Name is "op_Addition" or "op_Subtraction" or "op_Multiply" or "op_Division");
        }
    }

    [Fact]
    public void MigratedIdentifiersKeepPrimitiveJsonAndExcludeUnsafeOperators()
    {
        var sessionId = new SessionId("SES-42");
        var requestId = new ModuleExecutionRequestId(42);
        var validationValue = Guid.Parse("741cc186-3df6-4ee3-b60e-ea6ec54e2731");
        var validationId = new AiProviderProfileValidationId(validationValue);

        Assert.Equal("\"SES-42\"", JsonSerializer.Serialize(sessionId));
        Assert.Equal("42", JsonSerializer.Serialize(requestId));
        Assert.Equal($"\"{validationValue}\"", JsonSerializer.Serialize(validationId));
        Assert.Equal(sessionId, JsonSerializer.Deserialize<SessionId>("\"SES-42\""));
        Assert.Equal(requestId, ModuleExecutionRequestId.Parse("42"));
        Assert.Equal(validationId, AiProviderProfileValidationId.Parse(validationValue.ToString()));

        var identifierTypes = typeof(Program).Assembly.GetTypes()
            .Where(type => type.IsValueType && type.Namespace?.EndsWith(".Identifiers", StringComparison.Ordinal) == true)
            .ToArray();
        Assert.NotEmpty(identifierTypes);
        Assert.All(identifierTypes, type =>
        {
            var operators = type.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static)
                .Select(method => method.Name)
                .ToArray();
            Assert.DoesNotContain("op_Implicit", operators);
            Assert.DoesNotContain(operators, name => name is "op_Addition" or "op_Subtraction" or "op_Multiply" or "op_Division"
                or "op_LessThan" or "op_LessThanOrEqual" or "op_GreaterThan" or "op_GreaterThanOrEqual");
        });
    }

    [Fact]
    public async Task RepresentativeIdBindsFromRouteAndHasPrimitiveOpenApiSchema()
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddOpenApi();
        await using var app = builder.Build();
        app.MapOpenApi();
        app.MapGet("/ids/{id}", (RepresentativeStringId id) => Results.Ok(new { id }));
        await app.StartAsync();

        using var client = app.GetTestClient();
        using var response = await client.GetAsync("/ids/alpha");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("alpha", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString());

        using var openApiResponse = await client.GetAsync("/openapi/v1.json");
        openApiResponse.EnsureSuccessStatusCode();
        var openApi = await openApiResponse.Content.ReadFromJsonAsync<JsonElement>();
        var parameterSchema = openApi.GetProperty("paths").GetProperty("/ids/{id}").GetProperty("get")
            .GetProperty("parameters")[0].GetProperty("schema");
        Assert.Equal("string", parameterSchema.GetProperty("type").GetString());
    }

    [Fact]
    public async Task AiProviderIdsUseCentralEfConvertersAndRoundTripWithoutSchemaChanges()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite(connection).Options;
        await using var db = new ApplicationDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var profileProperty = db.Model.FindEntityType(typeof(AiProviderProfile))!.FindProperty(nameof(AiProviderProfile.Id))!;
        var credentialProperty = db.Model.FindEntityType(typeof(AiCredential))!.FindProperty(nameof(AiCredential.Id))!;
        Assert.Equal(typeof(string), profileProperty.GetTypeMapping().Converter!.ProviderClrType);
        Assert.Equal(typeof(string), credentialProperty.GetTypeMapping().Converter!.ProviderClrType);

        var now = new DateTimeOffset(2026, 8, 5, 0, 0, 0, TimeSpan.Zero);
        db.AiCredentials.Add(AiCredential.Create(new AiCredentialId(" SHARED "), "Shared", "protected", "1234", now));
        db.AiProviderProfiles.Add(AiProviderProfile.Create(new AiProviderProfileId(" ACME "), "Acme", "https://acme.test", "model", new AiCredentialId(" SHARED "), true, now));
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var profile = await db.AiProviderProfiles.SingleAsync(item => item.Id == new AiProviderProfileId("acme"));
        Assert.Equal("acme", profile.Id.AsPrimitive());
        Assert.Equal("shared", profile.CredentialId.AsPrimitive());
    }
}
