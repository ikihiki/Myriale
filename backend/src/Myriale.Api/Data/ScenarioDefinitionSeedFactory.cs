namespace Myriale.Api.Data;

internal static class ScenarioDefinitionSeedFactory
{
    public static ScenarioDefinitionVersion CreatePublished(string scenarioId, DateTimeOffset timestamp)
    {
        if (scenarioId == "SCN-AWAKENING-LAB") return CreateWestDoorDemo(scenarioId, timestamp);

        var slug = scenarioId.Replace("SCN-", string.Empty, StringComparison.Ordinal);
        var version = NewVersion(scenarioId, slug, timestamp);
        var location = NewLocation(version, slug, "START", "start", "開始地点", "シナリオの開始地点。");
        var type = NewBooleanType(version, slug, "FEATURE", "feature", "調査対象", "調査できるシナリオオブジェクト。", "examined");
        var action = NewAction(type, slug, "EXAMINE", "examine", "調べる", "対象を詳しく調べる。");
        var item = NewObject(version, slug, "FOCUS", "focus", "注目すべき対象", type, location);
        AddRule(type, "examine-default", action, "{}", "[{\"type\":\"set-state\",\"path\":\"state.examined\",\"value\":true}]");
        return version;
    }

    private static ScenarioDefinitionVersion CreateWestDoorDemo(string scenarioId, DateTimeOffset timestamp)
    {
        const string slug = "AWAKENING-LAB";
        var version = NewVersion(scenarioId, slug, timestamp);
        var inside = NewLocation(version, slug, "INSIDE", "inside", "地下研究室", "西と東に扉がある閉鎖された研究室。");
        var outside = NewLocation(version, slug, "OUTSIDE", "outside", "研究施設の外", "冷たい夜風と星空が広がる屋外。");

        var ordinaryDoor = NewBooleanType(version, slug, "DOOR", "door", "扉", "方角を持つ研究施設の扉。", "open");
        var open = NewAction(ordinaryDoor, slug, "OPEN", "open", "扉を開ける", "扉を開く。");
        var exitDoor = NewBooleanType(version, slug, "EXIT-DOOR", "exit-door", "出口の扉", "開くと施設の外へ移動できる扉。", "open");
        var openAndExit = NewAction(exitDoor, slug, "OPEN-AND-EXIT", "open-and-exit", "扉を開けて外へ出る", "扉を開き、施設の外へ移動する。");
        var landmark = NewBooleanType(version, slug, "LANDMARK", "landmark", "屋外の目印", "屋外でのみ見える目印。", "examined");
        var examine = NewAction(landmark, slug, "EXAMINE", "examine", "調べる", "目印を詳しく調べる。");

        var eastDoor = NewObject(version, slug, "EAST-DOOR", "east-door", "東の扉", ordinaryDoor, inside);
        AddRule(ordinaryDoor, "open-default", open, "{\"op\":\"eq\",\"path\":\"state.open\",\"value\":false}", "[{\"type\":\"set-state\",\"path\":\"state.open\",\"value\":true},{\"type\":\"emit-fact\",\"text\":\"扉が開いた。\"}]");

        _ = NewObject(version, slug, "SERVICE-DOOR", "service-door", "整備区画の扉", ordinaryDoor, inside);

        var westDoor = NewObject(version, slug, "WEST-DOOR", "west-door", "西の扉", exitDoor, inside);
        AddRule(exitDoor, "open-and-exit-default", openAndExit, "{\"op\":\"eq\",\"path\":\"state.open\",\"value\":false}", "[{\"type\":\"set-state\",\"path\":\"state.open\",\"value\":true},{\"type\":\"move-session\",\"locationCode\":\"outside\"},{\"type\":\"emit-fact\",\"text\":\"西の扉が開いた。\"},{\"type\":\"emit-fact\",\"text\":\"プレイヤーは研究施設の外へ出た。\"},{\"type\":\"emit-event\",\"event\":\"session-moved\",\"locationCode\":\"outside\"},{\"type\":\"add-narrative-hint\",\"text\":\"冷たい夜風と星空を描写する。\"},{\"type\":\"forbid-narrative-fact\",\"text\":\"まだ室内にいる\"},{\"type\":\"forbid-narrative-fact\",\"text\":\"扉は閉じたまま\"}]");

        var antenna = NewObject(version, slug, "OUTSIDE-ANTENNA", "outside-antenna", "風に鳴る観測アンテナ", landmark, outside);
        AddRule(landmark, "examine-default", examine, "{\"op\":\"eq\",\"path\":\"state.examined\",\"value\":false}", "[{\"type\":\"set-state\",\"path\":\"state.examined\",\"value\":true}]");
        return version;
    }

    private static ScenarioDefinitionVersion NewVersion(string scenarioId, string slug, DateTimeOffset timestamp) => new()
    {
        Id = $"SDV-{slug}-1", ScenarioId = scenarioId, Version = 1, Status = "published",
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

    private static ScenarioObjectTypeAction NewAction(ScenarioObjectType type, string slug, string idSuffix, string code, string label, string description)
    {
        var action = new ScenarioObjectTypeAction
        {
            Id = $"SOTA-{slug}-{idSuffix}", ObjectTypeId = type.Id, Code = code, Label = label, Description = description,
            ArgumentSchemaJson = "{\"type\":\"object\",\"additionalProperties\":false}", AvailabilityConditionJson = "{}", Visibility = "ai-choice", ExecutionMode = "rule",
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

    private static void AddRule(ScenarioObjectType type, string code, ScenarioObjectTypeAction action, string condition, string effects) =>
        type.GenericActionRulesJson = $"[{{\"code\":\"{code}\",\"actionCode\":\"{action.Code}\",\"condition\":{condition},\"priority\":100,\"authoringNote\":\"\",\"effects\":{effects},\"moduleBinding\":null}}]";
}
