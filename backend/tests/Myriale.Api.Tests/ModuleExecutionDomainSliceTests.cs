using System.Reflection;
using System.Text.Json;
using Myriale.Api.Features.Accounts.Identifiers;
using Myriale.Api.Features.ModuleExecutions.Identifiers;
using Myriale.Api.Features.ModuleExecutions.Application;
using Myriale.Api.Infrastructure.Persistence;
using Myriale.ModuleSdk;

namespace Myriale.Api.Tests;

public sealed class ModuleExecutionDomainSliceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 4, 12, 0, 0, TimeSpan.Zero);
    private static JsonElement Json(string value) { using var document = JsonDocument.Parse(value); return document.RootElement.Clone(); }

    [Theory]
    [InlineData(ModuleExecutionStatus.Initializing, "initializing")]
    [InlineData(ModuleExecutionStatus.Active, "active")]
    [InlineData(ModuleExecutionStatus.Completed, "completed")]
    [InlineData(ModuleExecutionStatus.Failed, "failed")]
    public void StatusHasExplicitDatabaseWireValue(ModuleExecutionStatus status, string wire)
    {
        Assert.Equal(wire, status.ToWireValue());
        Assert.Equal(status, ModuleExecutionStatusValues.Parse(wire));
    }

    [Fact]
    public void AggregateOwnsInitializationDispatchRevisionAndTerminalInvariant()
    {
        var execution = NewExecution();
        execution.CompleteInitialization(new(ModuleExecutionStatuses.Active, Json("{}"), Json("{}"), []), ModuleJsonSerializerOptions.Create(), Now);
        Assert.Equal(ModuleExecutionStatus.Active, execution.Status);
        Assert.Equal(0, execution.Revision);

        execution.AcceptDispatch(0);
        execution.CompleteDispatch(new(ModuleExecutionStatuses.Completed, 1, Json("{}"), Json("{}"), [], [], Outcome: Outcome()), ModuleJsonSerializerOptions.Create(), Now.AddSeconds(1));
        Assert.Equal(ModuleExecutionStatus.Completed, execution.Status);
        Assert.Equal(1, execution.Revision);
        Assert.Equal(Now.AddSeconds(1), execution.CompletedAt);
        Assert.Throws<InvalidOperationException>(() => execution.AcceptDispatch(1));
    }

    [Fact]
    public void AggregateRejectsStaleRevision()
    {
        var execution = NewExecution();
        execution.CompleteInitialization(new(ModuleExecutionStatuses.Active, Json("{}"), Json("{}"), []), ModuleJsonSerializerOptions.Create(), Now);
        var error = Assert.Throws<ModuleExecutionRevisionConflictException>(() => execution.AcceptDispatch(4));
        Assert.Equal(0, error.ActualRevision);
    }

    [Fact]
    public void ReceiptCanOnlyCloseOnceAndDetectsDifferentPayload()
    {
        var receipt = ModuleExecutionRequest.CreateDispatch(new AccountId("owner"), new ModuleExecutionId("MEX-1"), "REQ-1", "hash-a", 0, null, Json("{}"), [], ModuleJsonSerializerOptions.Create(), Now);
        Assert.True(receipt.Matches("hash-a"));
        Assert.False(receipt.Matches("hash-b"));
        receipt.Complete("{}", 200, Now);
        Assert.Equal(ModuleExecutionRequestStatus.Succeeded, receipt.Status);
        Assert.Throws<InvalidOperationException>(() => receipt.Reject("{}", 409, Now));
    }

    [Fact]
    public void TypedIdentifiersKeepPrimitiveJsonShapes()
    {
        Assert.Equal("\"MEX-1\"", JsonSerializer.Serialize(new ModuleExecutionId("MEX-1")));
        Assert.Equal("42", JsonSerializer.Serialize(new ModuleExecutionRequestId(42)));
        Assert.Equal("43", JsonSerializer.Serialize(new ModuleOutcomeApplicationId(43)));
    }

    [Fact]
    public void ArchitectureKeepsEndpointsOffDbContextAndLifecycleSettersNonPublic()
    {
        var endpointMethods = typeof(ModuleExecutionEndpoints).GetMethods(BindingFlags.Static | BindingFlags.NonPublic | BindingFlags.Public);
        Assert.DoesNotContain(endpointMethods.SelectMany(method => method.GetParameters()), parameter => parameter.ParameterType == typeof(ApplicationDbContext));
        foreach (var type in new[] { typeof(ModuleExecution), typeof(ModuleExecutionRequest), typeof(ModuleOutcomeApplication) })
            Assert.DoesNotContain(type.GetProperties(), property => property.SetMethod?.IsPublic == true);
        Assert.Null(typeof(ModuleExecution).Assembly.GetType("Myriale.Api.Features.ModuleExecutions.Infrastructure.IModuleExecutionService"));
        Assert.Null(typeof(ModuleExecution).Assembly.GetType("Myriale.Api.Features.ModuleExecutions.Infrastructure.ModuleExecutionService"));
        Assert.Null(typeof(ModuleExecution).Assembly.GetType("Myriale.Api.Features.ModuleExecutions.Infrastructure.ModuleExecutionServiceResult"));
    }

    private static ModuleExecution NewExecution() => new()
    {
        Id = new ModuleExecutionId("MEX-1"), OwnerId = new AccountId("owner"), ModuleId = new ModulePackageModuleId("com.example.module"),
        ModuleVersion = new ModulePackageVersion("1.0.0"), ModuleDigest = new ModulePackageDigest(new string('a', 64)),
        ContractVersion = "1", ConfigurationJson = "{}", ContextJson = "{}", CreatedAt = Now, UpdatedAt = Now,
    };

    private static ModuleOutcome Outcome() => new("result", "ok", "Done", "Done", [], [], [], []);
}
