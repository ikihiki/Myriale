using System.Text.Json;
using Myriale.ModuleSdk;
using Myriale.StarEater.ConstellationDoorModule;

namespace Myriale.StarEater.ConstellationDoorModule.Tests;

public sealed class ConstellationDoorModuleTests
{
    private readonly ConstellationDoorModule _module = new();
    private static readonly JsonElement Configuration = JsonSerializer.SerializeToElement(new { purpose = "閉じた星座の扉を開く", diceCount = 1, diceSides = 20, modifier = 2, target = 13 });

    [Fact]
    public async Task ValidatesConfigurationBounds()
    {
        var valid = await _module.ValidateConfigAsync(new("valid", Configuration), default);
        var invalid = await _module.ValidateConfigAsync(new("invalid", JsonSerializer.SerializeToElement(new { purpose = "x", diceCount = 0, diceSides = 20, modifier = 0, target = 10 })), default);
        Assert.True(valid.IsValid);
        Assert.False(invalid.IsValid);
        Assert.Equal("diceCount", Assert.Single(invalid.Issues).Path);
    }

    [Theory]
    [InlineData(9u, false, "constellation-guardian-awakened")]
    [InlineData(19u, true, "constellation-door-opened")]
    public async Task HostRandomValueDeterminesAuthoritativeOutcome(uint randomValue, bool succeeded, string code)
    {
        var initialized = await _module.InitializeAsync(new("init", Configuration, Json("{}"), []), default);
        var action = JsonSerializer.SerializeToElement(new { id = "roll", dice = 20, succeeded = !succeeded });
        var result = await _module.DispatchAsync(new("dispatch", 0, Configuration, Json("{}"), initialized.State, action, [randomValue]), default);
        Assert.Equal(ModuleExecutionStatuses.Completed, result.Status);
        Assert.Equal(code, result.Outcome?.Code);
        Assert.Equal(succeeded, result.ViewState.GetProperty("result").GetProperty("succeeded").GetBoolean());
        Assert.Equal(code, result.Outcome?.Effects.Single().Payload.GetProperty("flagId").GetString());
    }

    [Fact]
    public async Task SameSnapshotsAndRandomValuesAreDeterministic()
    {
        var state = JsonSerializer.SerializeToElement(new { rolled = false });
        var request = new ModuleDispatchRequest("one", 4, Configuration, Json("{}"), state, JsonSerializer.SerializeToElement(new { id = "roll" }), [7]);
        var first = await _module.DispatchAsync(request, default);
        var second = await _module.DispatchAsync(request with { RequestId = "two" }, default);
        Assert.Equal(first.ViewState.GetRawText(), second.ViewState.GetRawText());
        Assert.Equal(JsonSerializer.Serialize(first.Outcome), JsonSerializer.Serialize(second.Outcome));
    }

    private static JsonElement Json(string json) => JsonDocument.Parse(json).RootElement.Clone();
}
