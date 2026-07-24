namespace Myriale.Api.Data;

internal static class ScenarioDefinitionSeedFactory
{
    public static ScenarioDefinitionVersion CreatePublished(string scenarioId, DateTimeOffset timestamp)
    {
        var slug = scenarioId.Replace("SCN-", string.Empty, StringComparison.Ordinal);
        var version = new ScenarioDefinitionVersion
        {
            Id = $"SDV-{slug}-1", ScenarioId = scenarioId, Version = 1, Status = "published",
            SchemaVersion = 1, CreatedAt = timestamp, UpdatedAt = timestamp, PublishedAt = timestamp,
        };
        var location = new ScenarioLocation
        {
            Id = $"SLOC-{slug}-START", DefinitionVersionId = version.Id, Code = "start",
            Name = "開始地点", Description = "シナリオの開始地点。", AuthoringDataJson = "{}",
        };
        var type = new ScenarioObjectType
        {
            Id = $"SOT-{slug}-FEATURE", DefinitionVersionId = version.Id, Code = "feature",
            Name = "調査対象", Description = "調査できるシナリオオブジェクト。", SchemaVersion = 1,
            StateSchemaJson = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"examined\":{\"type\":\"boolean\"}},\"required\":[\"examined\"]}",
            DefaultStateJson = "{\"examined\":false}", PublicProjectionJson = "{\"include\":[\"examined\"]}",
        };
        var action = new ScenarioObjectTypeAction
        {
            Id = $"SOTA-{slug}-EXAMINE", ObjectTypeId = type.Id, Code = "examine", Label = "調べる",
            Description = "対象を詳しく調べる。", ArgumentSchemaJson = "{\"type\":\"object\",\"additionalProperties\":false}",
            AvailabilityConditionJson = "{}", Visibility = "ai-choice", ExecutionMode = "rule",
        };
        type.Actions.Add(action);
        var item = new ScenarioObject
        {
            Id = $"SOBJ-{slug}-FOCUS", DefinitionVersionId = version.Id, Code = "focus", Name = "注目すべき対象",
            ObjectTypeId = type.Id, LocationId = location.Id, InitialStateOverrideJson = "{}",
        };
        item.ActionRules.Add(new ScenarioObjectActionRule
        {
            Id = $"SOAR-{slug}-EXAMINE", ObjectId = item.Id, ObjectTypeActionId = action.Id,
            ConditionJson = "{}", Priority = 100, EffectsJson = "[{\"type\":\"set-state\",\"path\":\"state.examined\",\"value\":true}]",
        });
        version.Locations.Add(location); version.ObjectTypes.Add(type); version.Objects.Add(item);
        return version;
    }
}
