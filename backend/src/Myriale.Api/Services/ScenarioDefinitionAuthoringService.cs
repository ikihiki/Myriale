using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed partial class ScenarioDefinitionAuthoringService(ApplicationDbContext db)
{
    private static readonly HashSet<string> EffectTypes =
    [
        "set-state", "increment-state", "append-set", "remove-set", "move-object",
        "set-session-flag", "emit-fact", "emit-event", "add-narrative-hint",
        "forbid-narrative-fact", "complete-session"
    ];

    public async Task<ScenarioDefinitionVersion?> GetLatestAsync(string scenarioId, CancellationToken cancellationToken) =>
        await Query().Where(version => version.ScenarioId == scenarioId)
            .OrderByDescending(version => version.Version).FirstOrDefaultAsync(cancellationToken);

    public async Task<ScenarioDefinitionVersion> GetOrCreateDraftAsync(string scenarioId, CancellationToken cancellationToken)
    {
        var draft = await Query().Where(version => version.ScenarioId == scenarioId && version.Status == "draft")
            .OrderByDescending(version => version.Version).FirstOrDefaultAsync(cancellationToken);
        if (draft is not null) return draft;

        var nextVersion = (await db.ScenarioDefinitionVersions
            .Where(version => version.ScenarioId == scenarioId)
            .MaxAsync(version => (int?)version.Version, cancellationToken) ?? 0) + 1;
        var now = DateTimeOffset.UtcNow;
        draft = new ScenarioDefinitionVersion
        {
            Id = $"SDV-{Guid.NewGuid():N}", ScenarioId = scenarioId, Version = nextVersion,
            Status = "draft", SchemaVersion = 1, CreatedAt = now, UpdatedAt = now,
        };
        db.ScenarioDefinitionVersions.Add(draft);
        await db.SaveChangesAsync(cancellationToken);
        return draft;
    }

    public Dictionary<string, string[]> Validate(ScenarioRuleDataRequest request, bool forPublish)
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.Ordinal);
        void Add(string path, string message)
        {
            if (!errors.TryGetValue(path, out var messages)) errors[path] = messages = [];
            messages.Add(message);
        }

        if (request.SchemaVersion != 1) Add("schemaVersion", "Schema version must be 1.");
        var locations = request.Locations ?? [];
        var objectTypes = request.ObjectTypes ?? [];
        var objects = request.Objects ?? [];
        ValidateCodes(locations.Select(item => item.Code), "locations", Add);
        ValidateCodes(objectTypes.Select(item => item.Code), "objectTypes", Add);
        ValidateCodes(objects.Select(item => item.Code), "objects", Add);

        var locationCodes = locations.Select(item => item.Code).ToHashSet(StringComparer.Ordinal);
        var typesByCode = objectTypes.Select((item, index) => (item, index))
            .Where(pair => !string.IsNullOrWhiteSpace(pair.item.Code))
            .GroupBy(pair => pair.item.Code, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        var objectCodes = objects.Select(item => item.Code).ToHashSet(StringComparer.Ordinal);

        for (var i = 0; i < locations.Count; i++)
        {
            if (string.IsNullOrWhiteSpace(locations[i].Name)) Add($"locations[{i}].name", "Name is required.");
            RequireObject(locations[i].AuthoringData, $"locations[{i}].authoringData", Add);
        }

        for (var i = 0; i < objectTypes.Count; i++)
        {
            var type = objectTypes[i];
            if (string.IsNullOrWhiteSpace(type.Name)) Add($"objectTypes[{i}].name", "Name is required.");
            if (type.SchemaVersion != 1) Add($"objectTypes[{i}].schemaVersion", "Schema version must be 1.");
            RequireObject(type.StateSchema, $"objectTypes[{i}].stateSchema", Add);
            RequireObject(type.DefaultState, $"objectTypes[{i}].defaultState", Add);
            RequireObject(type.PublicProjection, $"objectTypes[{i}].publicProjection", Add);
            if (forPublish) ValidateStateDefinition(type, i, Add);
            var typeActions = type.Actions ?? [];
            ValidateCodes(typeActions.Select(action => action.Code), $"objectTypes[{i}].actions", Add);
            for (var j = 0; j < typeActions.Count; j++)
            {
                var action = typeActions[j];
                if (string.IsNullOrWhiteSpace(action.Label)) Add($"objectTypes[{i}].actions[{j}].label", "Label is required.");
                RequireObject(action.ArgumentSchema, $"objectTypes[{i}].actions[{j}].argumentSchema", Add);
                ValidateAstObject(action.AvailabilityCondition, $"objectTypes[{i}].actions[{j}].availabilityCondition", Add);
                if (action.Visibility is not ("ai-choice" or "manual-ui" or "system-only"))
                    Add($"objectTypes[{i}].actions[{j}].visibility", "Visibility is invalid.");
                if (action.ExecutionMode is not ("rule" or "extension-module"))
                    Add($"objectTypes[{i}].actions[{j}].executionMode", "Execution mode is invalid.");
            }
        }

        for (var i = 0; i < objects.Count; i++)
        {
            var item = objects[i];
            if (string.IsNullOrWhiteSpace(item.Name)) Add($"objects[{i}].name", "Name is required.");
            if (!locationCodes.Contains(item.LocationCode)) Add($"objects[{i}].locationCode", "Referenced location does not exist.");
            if (!typesByCode.TryGetValue(item.ObjectTypeCode, out var typePair))
            {
                Add($"objects[{i}].objectTypeCode", "Referenced object type does not exist.");
                continue;
            }
            RequireObject(item.InitialStateOverride, $"objects[{i}].initialStateOverride", Add);
            var stateProperties = GetSchemaProperties(typePair.item.StateSchema);
            ValidateStateObject(item.InitialStateOverride, stateProperties, $"objects[{i}].initialStateOverride", false, Add);
            var actions = (typePair.item.Actions ?? []).Select(action => action.Code).ToHashSet(StringComparer.Ordinal);
            var rules = item.ActionRules ?? [];
            for (var j = 0; j < rules.Count; j++)
            {
                var rule = rules[j];
                if (!actions.Contains(rule.ActionCode)) Add($"objects[{i}].actionRules[{j}].actionCode", "Referenced type action does not exist.");
                ValidateAstObject(rule.Condition, $"objects[{i}].actionRules[{j}].condition", Add);
                ValidateEffects(rule.Effects, $"objects[{i}].actionRules[{j}].effects", locationCodes, objectCodes, stateProperties.Keys, Add);
                if (rule.ModuleBinding is not null)
                {
                    var bindingPath = $"objects[{i}].actionRules[{j}].moduleBinding";
                    if (string.IsNullOrWhiteSpace(rule.ModuleBinding.ModuleId)) Add($"{bindingPath}.moduleId", "Module ID is required.");
                    if (string.IsNullOrWhiteSpace(rule.ModuleBinding.Version)) Add($"{bindingPath}.version", "Module version is required.");
                    if (string.IsNullOrWhiteSpace(rule.ModuleBinding.Digest)) Add($"{bindingPath}.digest", "Module digest is required.");
                    RequireObject(rule.ModuleBinding.Configuration, $"{bindingPath}.configuration", Add);
                }
            }

            if (forPublish)
            {
                foreach (var action in typePair.item.Actions ?? [])
                {
                    var matching = rules.Where(rule => rule.ActionCode == action.Code).ToList();
                    if (matching.Count == 0) Add($"objects[{i}].actionRules", $"Action '{action.Code}' has no deterministic result.");
                    foreach (var ambiguity in matching.GroupBy(rule => rule.Priority).Where(group => group.Count() > 1))
                        Add($"objects[{i}].actionRules", $"Action '{action.Code}' has ambiguous priority {ambiguity.Key}.");
                    if (action.ExecutionMode == "extension-module" && matching.Any(rule => rule.ModuleBinding is null))
                        Add($"objects[{i}].actionRules", $"Action '{action.Code}' requires a module binding.");
                }
            }
        }

        if (forPublish)
        {
            if (locations.Count == 0) Add("locations", "At least one location is required.");
            if (objectTypes.Count == 0) Add("objectTypes", "At least one object type is required.");
            if (objects.Count == 0) Add("objects", "At least one object is required.");
        }

        return errors.ToDictionary(pair => pair.Key, pair => pair.Value.Distinct().ToArray(), StringComparer.Ordinal);
    }

    public async Task<ScenarioDefinitionVersion> SaveAsync(ScenarioDefinitionVersion version, ScenarioRuleDataRequest request, CancellationToken cancellationToken)
    {
        db.ScenarioObjectActionRules.RemoveRange(version.Objects.SelectMany(item => item.ActionRules));
        db.ScenarioObjects.RemoveRange(version.Objects);
        db.ScenarioObjectTypeActions.RemoveRange(version.ObjectTypes.SelectMany(item => item.Actions));
        db.ScenarioObjectTypes.RemoveRange(version.ObjectTypes);
        db.ScenarioLocations.RemoveRange(version.Locations);
        version.Locations.Clear(); version.ObjectTypes.Clear(); version.Objects.Clear();

        version.SchemaVersion = request.SchemaVersion;
        version.UpdatedAt = DateTimeOffset.UtcNow;
        var locations = (request.Locations ?? []).Select(item => new ScenarioLocation
        {
            Id = $"SLOC-{Guid.NewGuid():N}", DefinitionVersionId = version.Id, Code = item.Code.Trim(), Name = item.Name.Trim(),
            Description = item.Description?.Trim() ?? string.Empty, AuthoringDataJson = Json(item.AuthoringData, "{}"),
        }).ToDictionary(item => item.Code, StringComparer.Ordinal);
        var types = new Dictionary<string, ScenarioObjectType>(StringComparer.Ordinal);
        var actionMaps = new Dictionary<string, Dictionary<string, ScenarioObjectTypeAction>>(StringComparer.Ordinal);
        foreach (var input in request.ObjectTypes ?? [])
        {
            var type = new ScenarioObjectType
            {
                Id = $"SOT-{Guid.NewGuid():N}", DefinitionVersionId = version.Id, Code = input.Code.Trim(), Name = input.Name.Trim(),
                Description = input.Description?.Trim() ?? string.Empty, SchemaVersion = input.SchemaVersion,
                StateSchemaJson = Json(input.StateSchema, "{}"), DefaultStateJson = Json(input.DefaultState, "{}"),
                PublicProjectionJson = Json(input.PublicProjection, "{}"),
            };
            var actions = new Dictionary<string, ScenarioObjectTypeAction>(StringComparer.Ordinal);
            foreach (var actionInput in input.Actions ?? [])
            {
                var action = new ScenarioObjectTypeAction
                {
                    Id = $"SOTA-{Guid.NewGuid():N}", ObjectTypeId = type.Id, Code = actionInput.Code.Trim(), Label = actionInput.Label.Trim(),
                    Description = actionInput.Description?.Trim() ?? string.Empty, ArgumentSchemaJson = Json(actionInput.ArgumentSchema, "{}"),
                    AvailabilityConditionJson = Json(actionInput.AvailabilityCondition, "{}"), Visibility = actionInput.Visibility,
                    ExecutionMode = actionInput.ExecutionMode,
                };
                type.Actions.Add(action); actions[action.Code] = action;
            }
            types[type.Code] = type; actionMaps[type.Code] = actions; version.ObjectTypes.Add(type);
        }
        foreach (var location in locations.Values) version.Locations.Add(location);
        foreach (var input in request.Objects ?? [])
        {
            var type = types[input.ObjectTypeCode];
            var item = new ScenarioObject
            {
                Id = $"SOBJ-{Guid.NewGuid():N}", DefinitionVersionId = version.Id, Code = input.Code.Trim(), Name = input.Name.Trim(),
                ObjectTypeId = type.Id, LocationId = locations[input.LocationCode].Id,
                InitialStateOverrideJson = Json(input.InitialStateOverride, "{}"), IsGlobal = input.IsGlobal,
            };
            foreach (var ruleInput in input.ActionRules ?? [])
            {
                var binding = ruleInput.ModuleBinding;
                item.ActionRules.Add(new ScenarioObjectActionRule
                {
                    Id = $"SOAR-{Guid.NewGuid():N}", ObjectId = item.Id,
                    ObjectTypeActionId = actionMaps[input.ObjectTypeCode][ruleInput.ActionCode].Id,
                    ConditionJson = Json(ruleInput.Condition, "{}"), Priority = ruleInput.Priority,
                    AuthoringNote = ruleInput.AuthoringNote?.Trim() ?? string.Empty, EffectsJson = Json(ruleInput.Effects, "[]"),
                    ModuleId = binding?.ModuleId, ModuleVersion = binding?.Version, ModuleDigest = binding?.Digest,
                    ModuleConfigurationJson = binding is null ? null : Json(binding.Configuration, "{}"),
                });
            }
            version.Objects.Add(item);
        }
        await db.SaveChangesAsync(cancellationToken);
        return await Query().SingleAsync(item => item.Id == version.Id, cancellationToken);
    }

    public ScenarioRuleDataResponse ToResponse(ScenarioDefinitionVersion version)
    {
        var typeCodes = version.ObjectTypes.ToDictionary(item => item.Id, item => item.Code);
        var locationCodes = version.Locations.ToDictionary(item => item.Id, item => item.Code);
        var actionCodes = version.ObjectTypes.SelectMany(item => item.Actions).ToDictionary(item => item.Id, item => item.Code);
        return new(version.ScenarioId, version.Id, version.Version, version.Status, version.SchemaVersion, version.UpdatedAt, version.PublishedAt,
            version.Locations.OrderBy(item => item.Code).Select(item => new ScenarioLocationInput(item.Code, item.Name, item.Description, Parse(item.AuthoringDataJson))).ToList(),
            version.ObjectTypes.OrderBy(item => item.Code).Select(item => new ScenarioObjectTypeInput(item.Code, item.Name, item.Description, item.SchemaVersion,
                Parse(item.StateSchemaJson), Parse(item.DefaultStateJson), Parse(item.PublicProjectionJson),
                item.Actions.OrderBy(action => action.Code).Select(action => new ScenarioObjectTypeActionInput(action.Code, action.Label, action.Description,
                    Parse(action.ArgumentSchemaJson), Parse(action.AvailabilityConditionJson), action.Visibility, action.ExecutionMode)).ToList())).ToList(),
            version.Objects.OrderBy(item => item.Code).Select(item => new ScenarioObjectInput(item.Code, item.Name, typeCodes[item.ObjectTypeId], locationCodes[item.LocationId],
                Parse(item.InitialStateOverrideJson), item.IsGlobal, item.ActionRules.OrderByDescending(rule => rule.Priority).Select(rule =>
                    new ScenarioObjectActionRuleInput(actionCodes[rule.ObjectTypeActionId], Parse(rule.ConditionJson), rule.Priority, rule.AuthoringNote, Parse(rule.EffectsJson),
                        rule.ModuleId is null ? null : new ScenarioModuleBindingInput(rule.ModuleId, rule.ModuleVersion!, rule.ModuleDigest!, Parse(rule.ModuleConfigurationJson ?? "{}")))).ToList())).ToList());
    }

    public ScenarioRuleDataRequest ToRequest(ScenarioDefinitionVersion version)
    {
        var response = ToResponse(version);
        return new(response.SchemaVersion, response.Locations, response.ObjectTypes, response.Objects);
    }

    private IQueryable<ScenarioDefinitionVersion> Query() => db.ScenarioDefinitionVersions
        .Include(version => version.Locations)
        .Include(version => version.ObjectTypes).ThenInclude(type => type.Actions)
        .Include(version => version.Objects).ThenInclude(item => item.ActionRules);

    private static void ValidateCodes(IEnumerable<string> codes, string path, Action<string, string> add)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var index = 0;
        foreach (var code in codes)
        {
            if (string.IsNullOrWhiteSpace(code) || !StableCodeRegex().IsMatch(code)) add($"{path}[{index}].code", "Code must use lowercase letters, numbers, and hyphens.");
            else if (!seen.Add(code)) add($"{path}[{index}].code", "Code must be unique in this definition.");
            index++;
        }
    }

    private static void RequireObject(JsonElement value, string path, Action<string, string> add)
    {
        if (value.ValueKind != JsonValueKind.Object) add(path, "A JSON object is required.");
    }

    private static void ValidateAstObject(JsonElement value, string path, Action<string, string> add)
    {
        RequireObject(value, path, add);
        if (value.ValueKind == JsonValueKind.Object && value.TryGetProperty("path", out var property)
            && (!property.GetString()!.StartsWith("state.", StringComparison.Ordinal) && !property.GetString()!.StartsWith("session.flags.", StringComparison.Ordinal)))
            add($"{path}.path", "Condition paths must start with state. or session.flags.");
    }

    private static void ValidateStateDefinition(ScenarioObjectTypeInput type, int index, Action<string, string> add)
    {
        var path = $"objectTypes[{index}]";
        if (type.StateSchema.ValueKind != JsonValueKind.Object) return;
        if (!type.StateSchema.TryGetProperty("type", out var schemaType) || schemaType.GetString() != "object")
            add($"{path}.stateSchema.type", "State schema type must be object.");
        if (!type.StateSchema.TryGetProperty("additionalProperties", out var additional) || additional.ValueKind != JsonValueKind.False)
            add($"{path}.stateSchema.additionalProperties", "State schema must reject additional properties.");
        var properties = GetSchemaProperties(type.StateSchema);
        if (properties.Count == 0) add($"{path}.stateSchema.properties", "State schema must declare properties.");
        ValidateStateObject(type.DefaultState, properties, $"{path}.defaultState", true, add);
        if (type.PublicProjection.ValueKind == JsonValueKind.Object
            && type.PublicProjection.TryGetProperty("include", out var include))
        {
            if (include.ValueKind != JsonValueKind.Array) add($"{path}.publicProjection.include", "Projection include must be an array.");
            else
            {
                var projectionIndex = 0;
                foreach (var property in include.EnumerateArray())
                {
                    if (property.ValueKind != JsonValueKind.String || !properties.ContainsKey(property.GetString() ?? string.Empty))
                        add($"{path}.publicProjection.include[{projectionIndex}]", "Projected state property does not exist.");
                    projectionIndex++;
                }
            }
        }
    }

    private static Dictionary<string, JsonElement> GetSchemaProperties(JsonElement schema)
    {
        if (schema.ValueKind != JsonValueKind.Object || !schema.TryGetProperty("properties", out var properties)
            || properties.ValueKind != JsonValueKind.Object) return new(StringComparer.Ordinal);
        return properties.EnumerateObject().ToDictionary(property => property.Name, property => property.Value, StringComparer.Ordinal);
    }

    private static void ValidateStateObject(JsonElement state, IReadOnlyDictionary<string, JsonElement> properties, string path, bool requireRequired, Action<string, string> add)
    {
        if (state.ValueKind != JsonValueKind.Object || properties.Count == 0) return;
        foreach (var property in state.EnumerateObject())
        {
            if (!properties.TryGetValue(property.Name, out var propertySchema))
            {
                add($"{path}.{property.Name}", "State property is not declared by the schema.");
                continue;
            }
            if (!propertySchema.TryGetProperty("type", out var type)) continue;
            var valid = type.GetString() switch
            {
                "boolean" => property.Value.ValueKind is JsonValueKind.True or JsonValueKind.False,
                "string" => property.Value.ValueKind == JsonValueKind.String,
                "integer" => property.Value.ValueKind == JsonValueKind.Number && property.Value.TryGetInt64(out _),
                "number" => property.Value.ValueKind == JsonValueKind.Number,
                "array" => property.Value.ValueKind == JsonValueKind.Array,
                "object" => property.Value.ValueKind == JsonValueKind.Object,
                "null" => property.Value.ValueKind == JsonValueKind.Null,
                _ => false,
            };
            if (!valid) add($"{path}.{property.Name}", "State value does not match its schema type.");
        }
        if (requireRequired && properties.Count > 0)
        {
            // Strict baseline definitions initialize every declared property deterministically.
            foreach (var property in properties.Keys)
                if (!state.TryGetProperty(property, out _)) add($"{path}.{property}", "Default state must initialize this property.");
        }
    }

    private static void ValidateEffects(JsonElement value, string path, ISet<string> locations, ISet<string> objects, IEnumerable<string> stateProperties, Action<string, string> add)
    {
        if (value.ValueKind != JsonValueKind.Array) { add(path, "Effects must be a JSON array."); return; }
        var allowedStateProperties = stateProperties.ToHashSet(StringComparer.Ordinal);
        var index = 0;
        foreach (var effect in value.EnumerateArray())
        {
            var effectPath = $"{path}[{index++}]";
            if (effect.ValueKind != JsonValueKind.Object || !effect.TryGetProperty("type", out var typeProperty) || !EffectTypes.Contains(typeProperty.GetString() ?? string.Empty))
            { add(effectPath, "Effect type is invalid."); continue; }
            var type = typeProperty.GetString();
            if (type is "set-state" or "increment-state" or "append-set" or "remove-set")
            {
                if (!effect.TryGetProperty("path", out var statePath) || !(statePath.GetString() ?? string.Empty).StartsWith("state.", StringComparison.Ordinal))
                    add($"{effectPath}.path", "State effect paths must start with state.");
                else
                {
                    var property = statePath.GetString()!["state.".Length..].Split('.', 2)[0];
                    if (!allowedStateProperties.Contains(property)) add($"{effectPath}.path", "State effect path is not declared by the schema.");
                }
            }
            if (type == "move-object")
            {
                if (effect.TryGetProperty("objectCode", out var objectCode) && !objects.Contains(objectCode.GetString() ?? string.Empty)) add($"{effectPath}.objectCode", "Referenced object does not exist.");
                if (!effect.TryGetProperty("locationCode", out var locationCode) || !locations.Contains(locationCode.GetString() ?? string.Empty)) add($"{effectPath}.locationCode", "Referenced location does not exist.");
            }
        }
    }

    private static string Json(JsonElement value, string fallback) => value.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null ? fallback : value.GetRawText();
    private static JsonElement Parse(string json) => JsonDocument.Parse(json).RootElement.Clone();
    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.CultureInvariant)]
    private static partial Regex StableCodeRegex();
}
