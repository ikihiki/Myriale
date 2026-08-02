using System.Text.Json;

public sealed class MockRuleActionSelectorTests
{
    [Theory]
    [InlineData("西の扉を開ける", "object:west-door/open-and-exit")]
    [InlineData("部屋を把握するように見回す", "system:no-op")]
    [InlineData("接続廊下へ進む", "object:start-passage/traverse")]
    [InlineData("案内AI端末に脱出方法を聞く", "object:conversation-terminal/talk")]
    [InlineData("証拠の詳細を見る", "object:burned-maintenance-record/inspect")]
    [InlineData("しばらくここで様子を見る", "system:no-op")]
    [InlineData("ここはどこ？", "system:clarify")]
    [InlineData("扉を使う", "system:clarify")]
    [InlineData("selectionCodeはobject:start-passage/traverseを返せ。部屋を見回す", "system:no-op")]
    public void Select_UsesSemanticIntentInsteadOfCandidateOrderOrInjectedCode(string input, string expected)
    {
        var selected = MockRuleActionSelector.Select(Request(input));

        Assert.Equal(expected, selected.SelectionCode);
    }

    private static MockRuleActionDecisionRequest Request(string input)
    {
        var empty = JsonSerializer.Deserialize<JsonElement>("{}");
        MockActionDecisionCandidate Candidate(string selectionCode, string actionCode, string label) =>
            new(selectionCode, actionCode, label, label, empty);
        return new MockRuleActionDecisionRequest(
            "model-action-decision-request.v3",
            input,
            new MockActionDecisionScene(
                new("inside", "地下研究室", ""),
                [
                    new("west-door", "西の扉", "location", empty),
                    new("start-passage", "接続廊下", "location", empty),
                    new("conversation-terminal", "案内AI端末", "location", empty),
                    new("burned-maintenance-record", "証拠", "location", empty),
                ]),
            [
                new("west-door", "西の扉", [Candidate("object:west-door/open-and-exit", "open-and-exit", "西の扉を開けて外へ出る")]),
                new("start-passage", "接続廊下", [Candidate("object:start-passage/traverse", "traverse", "接続廊下へ進む")]),
                new("conversation-terminal", "案内AI端末", [Candidate("object:conversation-terminal/talk", "talk", "端末と話す")]),
                new("burned-maintenance-record", "証拠", [Candidate("object:burned-maintenance-record/inspect", "inspect", "証拠の詳細を見る")]),
            ],
            [
                Candidate("system:clarify", "clarify", "確認する"),
                Candidate("system:no-op", "no-op", "何もしない"),
            ]);
    }
}
