using System.Text.Json;

public sealed class MockRuleActionSelectorTests
{
    [Theory]
    [InlineData("西の扉を開けて外に出る")]
    [InlineData("Open the west door and exit")]
    public void Select_ChoosesEnabledWestDoor_WhenEastIsListedFirst(string input)
    {
        var request = Request(input, westEnabled: true);

        var selected = MockRuleActionSelector.Select(request);

        Assert.Equal("OBJ-WEST", selected.ObjectId);
        Assert.Equal("open-and-exit", selected.Code);
    }

    [Fact]
    public void Select_DoesNotChooseDisabledWestDoor()
    {
        var selected = MockRuleActionSelector.Select(Request("西の扉を開ける", westEnabled: false));

        Assert.Equal("OBJ-EAST", selected.ObjectId);
    }

    private static MockRuleActionDecisionRequest Request(string input, bool westEnabled)
    {
        var empty = JsonSerializer.Deserialize<JsonElement>("{}");
        return new MockRuleActionDecisionRequest(
            "rule-action-decision.v1",
            input,
            new MockRuleActionSnapshot(
                "rule-action-snapshot.v1",
                "SNAPSHOT",
                new MockRulePublicLocation("LOC-INSIDE", "inside", "地下研究室", ""),
                [
                    new MockRulePublicObject("OBJ-EAST", "east-door", "東の扉", "LOC-INSIDE", false, 0, empty),
                    new MockRulePublicObject("OBJ-WEST", "west-door", "西の扉", "LOC-INSIDE", false, 0, empty),
                ],
                [
                    new MockRulePublicAction("OBJ-EAST", "ACT-EAST", "open", "扉を開ける", "", empty, true),
                    new MockRulePublicAction("OBJ-WEST", "ACT-WEST", "open-and-exit", "扉を開けて外へ出る", "", empty, westEnabled),
                ]));
    }
}
