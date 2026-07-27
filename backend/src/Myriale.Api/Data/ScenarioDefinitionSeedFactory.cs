namespace Myriale.Api.Data;

internal static class ScenarioDefinitionSeedFactory
{
    public const string AwakeningLaboratoryDefinitionId = "SDV-AWAKENING-LAB-2";

    public static ScenarioDefinitionVersion CreatePublished(string scenarioId, DateTimeOffset timestamp)
    {
        if (scenarioId == "SCN-AWAKENING-LAB") return CreateAwakeningLaboratory(scenarioId, timestamp);

        var slug = scenarioId.Replace("SCN-", string.Empty, StringComparison.Ordinal);
        var version = NewVersion(scenarioId, slug, timestamp, 1);
        var location = NewLocation(version, slug, "START", "start", "開始地点", "シナリオの開始地点。");
        var type = NewBooleanType(version, slug, "FEATURE", "feature", "調査対象", "調査できるシナリオオブジェクト。", "examined");
        var action = NewAction(type, slug, "EXAMINE", "examine", "調べる", "対象を詳しく調べる。");
        _ = NewObject(version, slug, "FOCUS", "focus", "注目すべき対象", type, location);
        AddRules(type, Rule("examine-default", action, "{}", "[{\"type\":\"set-state\",\"path\":\"state.examined\",\"value\":true}]"));
        return version;
    }

    private static ScenarioDefinitionVersion CreateAwakeningLaboratory(string scenarioId, DateTimeOffset timestamp)
    {
        const string slug = "AWAKENING-LAB";
        var version = NewVersion(scenarioId, slug, timestamp, 2);
        var start = NewLocation(version, slug, "START", "start", "覚醒室", "非常灯に照らされた開始地点。壁際の対話端末だけが起動している。");
        var corridor = NewLocation(version, slug, "CORRIDOR", "corridor", "接続廊下", "覚醒室と解析室をつなぐ細い廊下。中央に施設外へ通じる脱出扉がある。");
        var puzzleRoom = NewLocation(version, slug, "PUZZLE-ROOM", "puzzle-room", "解析室", "中央の光学解析装置に三色の入力盤が備わった謎解き部屋。");

        var terminal = NewBooleanType(version, slug, "TERMINAL", "conversation-terminal", "対話端末", "施設案内AIと会話し、脱出経路の手掛かりを得られる端末。", "activated");
        var talk = NewAction(terminal, slug, "TALK", "talk", "端末と話す", "案内AIに現在の状況と脱出方法を尋ねる。");
        AddRules(terminal,
            Rule("talk-first", talk, "{\"op\":\"eq\",\"path\":\"state.activated\",\"value\":false}", "[{\"type\":\"set-state\",\"path\":\"state.activated\",\"value\":true},{\"type\":\"emit-fact\",\"text\":\"対話端末が起動し、解析室の光学装置を復旧すれば廊下の脱出扉が開くと告げた。\"},{\"type\":\"add-narrative-hint\",\"text\":\"端末の合成音声で、光の三原色を重ねる順序が鍵だと示唆する。\"}]", 200),
            Rule("talk-repeat", talk, "{\"op\":\"eq\",\"path\":\"state.activated\",\"value\":true}", "[{\"type\":\"emit-fact\",\"text\":\"端末は『赤・緑・青をすべて重ねた光の色を入力してください』と繰り返した。\"},{\"type\":\"add-narrative-hint\",\"text\":\"答えは白。プレイヤーが考える余地を残して段階的に示す。\"}]", 100));

        var startToCorridor = NewPassageType(version, slug, "START-TO-CORRIDOR", "start-to-corridor", "廊下への通路", "corridor", "覚醒室を出て接続廊下へ移動した。", "冷たい空気の流れる接続廊下を描写する。");
        var corridorToStart = NewPassageType(version, slug, "CORRIDOR-TO-START", "corridor-to-start", "覚醒室への通路", "start", "接続廊下から覚醒室へ戻った。", "対話端末の光が残る覚醒室を描写する。");
        var corridorToPuzzle = NewPassageType(version, slug, "CORRIDOR-TO-PUZZLE", "corridor-to-puzzle", "解析室への通路", "puzzle-room", "接続廊下から解析室へ移動した。", "三色の入力盤がある光学解析装置を描写する。");
        var puzzleToCorridor = NewPassageType(version, slug, "PUZZLE-TO-CORRIDOR", "puzzle-to-corridor", "廊下への通路", "corridor", "解析室から接続廊下へ戻った。", "廊下中央の脱出扉の状態を描写する。");

        var exitDoor = NewBooleanType(version, slug, "ESCAPE-DOOR", "escape-door", "脱出扉", "接続廊下にある施設外への扉。解析装置の復旧と連動する。", "open");
        var inspectDoor = NewAction(exitDoor, slug, "INSPECT-ESCAPE-DOOR", "inspect", "脱出扉を調べる", "脱出扉が開いているか確認する。");
        AddRules(exitDoor,
            Rule("inspect-open", inspectDoor, "{\"op\":\"eq\",\"path\":\"state.open\",\"value\":true}", "[{\"type\":\"emit-fact\",\"text\":\"脱出扉は開いている。\"},{\"type\":\"add-narrative-hint\",\"text\":\"扉の向こうから外気が流れ込んでいる。\"}]", 200),
            Rule("inspect-closed", inspectDoor, "{\"op\":\"eq\",\"path\":\"state.open\",\"value\":false}", "[{\"type\":\"emit-fact\",\"text\":\"脱出扉はロックされ、閉じている。\"},{\"type\":\"add-narrative-hint\",\"text\":\"扉脇の表示は『光学解析装置との同期待ち』と点滅している。\"}]", 100));

        var puzzle = NewBooleanType(version, slug, "PUZZLE", "puzzle-device", "光学解析装置", "三色の光を重ねた結果を入力する謎解き装置。", "solved");
        var solve = NewAction(puzzle, slug, "SOLVE", "solve", "解析装置に答えを入力する", "光の三原色をすべて重ねた色を入力する。", "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"answer\":{\"type\":\"string\"}},\"required\":[\"answer\"]}");
        AddRules(puzzle,
            Rule("solve-correct", solve, "{\"and\":[{\"op\":\"eq\",\"path\":\"state.solved\",\"value\":false},{\"op\":\"eq\",\"path\":\"arguments.answer\",\"value\":\"白\"}]}", "[{\"type\":\"set-state\",\"path\":\"state.solved\",\"value\":true},{\"type\":\"set-state\",\"objectCode\":\"escape-door\",\"path\":\"state.open\",\"value\":true},{\"type\":\"emit-fact\",\"text\":\"光学解析装置が復旧し、接続廊下の脱出扉が開いた。\"},{\"type\":\"emit-event\",\"event\":\"escape-door-opened\",\"locationCode\":\"corridor\"},{\"type\":\"add-narrative-hint\",\"text\":\"遠くでロックが外れる重い音を響かせる。\"},{\"type\":\"forbid-narrative-fact\",\"text\":\"脱出扉は閉じたまま\"}]", 200),
            Rule("solve-incorrect", solve, "{\"and\":[{\"op\":\"eq\",\"path\":\"state.solved\",\"value\":false},{\"op\":\"ne\",\"path\":\"arguments.answer\",\"value\":\"白\"}]}", "[{\"type\":\"emit-fact\",\"text\":\"解析装置は入力を拒否した。脱出扉は閉じたままだ。\"},{\"type\":\"add-narrative-hint\",\"text\":\"赤・緑・青の光をすべて重ねた結果を考えるよう促す。\"}]", 100));

        _ = NewObject(version, slug, "TERMINAL", "conversation-terminal", "案内AI端末", terminal, start);
        _ = NewObject(version, slug, "START-PASSAGE", "start-passage", "接続廊下への扉", startToCorridor, start);
        _ = NewObject(version, slug, "CORRIDOR-START-PASSAGE", "corridor-start-passage", "覚醒室への扉", corridorToStart, corridor);
        _ = NewObject(version, slug, "CORRIDOR-PUZZLE-PASSAGE", "corridor-puzzle-passage", "解析室への扉", corridorToPuzzle, corridor);
        _ = NewObject(version, slug, "PUZZLE-PASSAGE", "puzzle-passage", "接続廊下への扉", puzzleToCorridor, puzzleRoom);
        _ = NewObject(version, slug, "ESCAPE-DOOR", "escape-door", "施設外への脱出扉", exitDoor, corridor);
        _ = NewObject(version, slug, "PUZZLE", "puzzle-device", "三色光学解析装置", puzzle, puzzleRoom);
        return version;
    }

    private static ScenarioObjectType NewPassageType(ScenarioDefinitionVersion version, string slug, string idSuffix, string code, string name, string destination, string fact, string hint)
    {
        var type = NewBooleanType(version, slug, idSuffix, code, name, "隣接する地点へ移動するための通路。", "used");
        var action = NewAction(type, slug, $"{idSuffix}-TRAVERSE", "traverse", "通路を進む", "隣接する地点へ移動する。");
        AddRules(type, Rule("traverse-default", action, "{}", $"[{{\"type\":\"set-state\",\"path\":\"state.used\",\"value\":true}},{{\"type\":\"move-session\",\"locationCode\":\"{destination}\"}},{{\"type\":\"emit-fact\",\"text\":\"{fact}\"}},{{\"type\":\"emit-event\",\"event\":\"session-moved\",\"locationCode\":\"{destination}\"}},{{\"type\":\"add-narrative-hint\",\"text\":\"{hint}\"}}]"));
        return type;
    }

    private static ScenarioDefinitionVersion NewVersion(string scenarioId, string slug, DateTimeOffset timestamp, int versionNumber) => new()
    {
        Id = $"SDV-{slug}-{versionNumber}", ScenarioId = scenarioId, Version = versionNumber, Status = "published",
        SchemaVersion = 2, CreatedAt = timestamp, UpdatedAt = timestamp, PublishedAt = timestamp,
    };

    private static ScenarioLocation NewLocation(ScenarioDefinitionVersion version, string slug, string idSuffix, string code, string name, string description)
    {
        var location = new ScenarioLocation { Id = $"SLOC-{slug}-{idSuffix}", DefinitionVersionId = version.Id, Code = code, Name = name, Description = description, AuthoringDataJson = "{}" };
        version.Locations.Add(location);
        return location;
    }

    private static ScenarioObjectType NewBooleanType(ScenarioDefinitionVersion version, string slug, string idSuffix, string code, string name, string description, string property)
    {
        var type = new ScenarioObjectType
        {
            Id = $"SOT-{slug}-{idSuffix}", DefinitionVersionId = version.Id, Code = code, Name = name, Description = description, SchemaVersion = 1,
            StateSchemaJson = $"{{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{{\"{property}\":{{\"type\":\"boolean\"}}}},\"required\":[\"{property}\"]}}",
            DefaultStateJson = $"{{\"{property}\":false}}", PublicProjectionJson = $"{{\"include\":[\"{property}\"]}}",
        };
        version.ObjectTypes.Add(type);
        return type;
    }

    private static ScenarioObjectTypeAction NewAction(ScenarioObjectType type, string slug, string idSuffix, string code, string label, string description, string? argumentSchema = null)
    {
        var action = new ScenarioObjectTypeAction
        {
            Id = $"SOTA-{slug}-{idSuffix}", ObjectTypeId = type.Id, Code = code, Label = label, Description = description,
            ArgumentSchemaJson = argumentSchema ?? "{\"type\":\"object\",\"additionalProperties\":false}", AvailabilityConditionJson = "{}", Visibility = "ai-choice", ExecutionMode = "rule",
        };
        type.Actions.Add(action);
        return action;
    }

    private static ScenarioObject NewObject(ScenarioDefinitionVersion version, string slug, string idSuffix, string code, string name, ScenarioObjectType type, ScenarioLocation location)
    {
        var item = new ScenarioObject { Id = $"SOBJ-{slug}-{idSuffix}", DefinitionVersionId = version.Id, Code = code, Name = name, LocationId = location.Id, InitialStateOverrideJson = "{}", MixinTypeCodesJson = $"[\"{type.Code}\"]" };
        version.Objects.Add(item);
        return item;
    }

    private static string Rule(string code, ScenarioObjectTypeAction action, string condition, string effects, int priority = 100) =>
        $"{{\"code\":\"{code}\",\"actionCode\":\"{action.Code}\",\"condition\":{condition},\"priority\":{priority},\"authoringNote\":\"\",\"effects\":{effects},\"moduleBinding\":null}}";

    private static void AddRules(ScenarioObjectType type, params string[] rules) =>
        type.GenericActionRulesJson = $"[{string.Join(',', rules)}]";
}
