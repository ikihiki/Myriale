using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class DevelopmentErrorDetailsTests
{
    [Fact]
    public void DevelopmentIncludesExceptionChain()
    {
        var exception = new AiProviderException(
            AiProviderErrorCodes.SchemaFailure,
            "invalid structured output",
            false,
            inner: new System.Text.Json.JsonException("missing heading"));

        var details = DevelopmentErrorDetails.From(new TestEnvironment(Environments.Development), exception);

        Assert.Contains("AiProviderException: invalid structured output", details, StringComparison.Ordinal);
        Assert.Contains("JsonException: missing heading", details, StringComparison.Ordinal);
    }

    [Fact]
    public void ProductionDoesNotIncludeDetails()
    {
        var details = DevelopmentErrorDetails.From(
            new TestEnvironment(Environments.Production),
            new InvalidOperationException("sensitive diagnostics"));

        Assert.Null(details);
    }

    private sealed class TestEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "Myriale.Api.Tests";
        public string ContentRootPath { get; set; } = Path.GetTempPath();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
