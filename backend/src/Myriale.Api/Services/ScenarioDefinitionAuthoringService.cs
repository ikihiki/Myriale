using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed partial class ScenarioDefinitionAuthoringService(ApplicationDbContext db)
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private static readonly HashSet<string> EffectTypes =
    [
        "set-state", "increment-state", "append-set", "remove-set", "move-object", "move-session",
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
            Status = "draft", SchemaVersion = 2, CreatedAt = now, UpdatedAt = now,
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

        if (request.SchemaVersion != 2) Add("schemaVersion", "Schema version must be 2.");
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
        var objectStatePropertiesByCode = objects
            .Where(item => !string.IsNullOrWhiteSpace(item.Code))
            .GroupBy(item => item.Code, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group =>
            {
                var properties = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
                var item = group.First();
                foreach (var typeCode in item.MixinTypeCodes ?? [])
                    if (typesByCode.TryGetValue(typeCode, out var pair))
                        foreach (var property in GetSchemaProperties(pair.item.StateSchema)) properties[property.Key] = property.Value;
                foreach (var property in GetSchemaProperties(item.StateSchema)) properties[property.Key] = property.Value;
                return (IReadOnlyDictionary<string, JsonElement>)properties;
            }, StringComparer.Ordinal);

        if (!string.IsNullOrWhiteSpace(request.StartLocationCode) && !locationCodes.Contains(request.StartLocationCode.Trim()))
            Add("startLocationCode", "Referenced start location does not exist.");

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
                ValidateCondition(action.AvailabilityCondition, $"objectTypes[{i}].actions[{j}].availabilityCondition",
                    GetSchemaProperties(type.StateSchema), null, allowArguments: false, Add);
                if (action.Visibility is not ("ai-choice" or "manual-ui" or "system-only")) Add($"objectTypes[{i}].actions[{j}].visibility", "Visibility is invalid.");
                if (action.ExecutionMode is not ("rule" or "extension-module")) Add($"objectTypes[{i}].actions[{j}].executionMode", "Execution mode is invalid.");
            }

            var actionCodes = typeActions.Select(action => action.Code).ToHashSet(StringComparer.Ordinal);
            var genericRules = type.ActionRules ?? [];
            ValidateCodes(genericRules.Select(rule => rule.Code), $"objectTypes[{i}].actionRules", Add);
            for (var j = 0; j < genericRules.Count; j++)
            {
                var rule = genericRules[j];
                var path = $"objectTypes[{i}].actionRules[{j}]";
                if (!actionCodes.Contains(rule.ActionCode)) Add($"{path}.actionCode", "Referenced type action does not exist.");
                var argumentSchema = typeActions.FirstOrDefault(action => action.Code == rule.ActionCode)?.ArgumentSchema;
                ValidateCondition(rule.Condition, $"{path}.condition", GetSchemaProperties(type.StateSchema),
                    argumentSchema is { } schema ? GetSchemaProperties(schema) : null, allowArguments: true, Add);
                ValidateEffects(rule.Effects, $"{path}.effects", locationCodes, objectCodes, GetSchemaProperties(type.StateSchema), objectStatePropertiesByCode, Add);
                ValidateModuleBinding(rule.ModuleBinding, $"{path}.moduleBinding", Add);
            }
        }

        for (var i = 0; i < objects.Count; i++)
        {
            var item = objects[i];
            if (string.IsNullOrWhiteSpace(item.Name)) Add($"objects[{i}].name", "Name is required.");
            if (!locationCodes.Contains(item.LocationCode)) Add($"objects[{i}].locationCode", "Referenced location does not exist.");
            if (item.MixinTypeCodes is null) Add($"objects[{i}].mixinTypeCodes", "Mixin type codes are required; use an empty array for Object-only configuration.");
            if (item.Actions is null) Add($"objects[{i}].actions", "Object-local actions are required; use an empty array when none are defined.");
            if (item.ActionRules is null) Add($"objects[{i}].actionRules", "Action rule mutations are required; use an empty array when none are defined.");
            var mixinCodes = (item.MixinTypeCodes ?? []).Select(code => code.Trim()).Where(code => code.Length > 0).ToList();
            var localActions = item.Actions ?? [];
            if (mixinCodes.Count != mixinCodes.Distinct(StringComparer.Ordinal).Count()) Add($"objects[{i}].mixinTypeCodes", "Duplicate mixins are not allowed.");
            foreach (var code in mixinCodes.Where(code => !typesByCode.ContainsKey(code))) Add($"objects[{i}].mixinTypeCodes", $"Referenced object type '{code}' does not exist.");
            var resolvedTypes = mixinCodes.Where(typesByCode.ContainsKey).Select(code => typesByCode[code].item).ToList();
            RequireObject(item.InitialStateOverride, $"objects[{i}].initialStateOverride", Add);
            var stateProperties = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
            foreach (var resolvedType in resolvedTypes)
                foreach (var property in GetSchemaProperties(resolvedType.StateSchema))
                    if (stateProperties.TryGetValue(property.Key, out var existing) && existing.GetRawText() != property.Value.GetRawText()) Add($"objects[{i}].mixinTypeCodes", $"State '{property.Key}' has incompatible contracts.");
                    else stateProperties[property.Key] = property.Value;
            foreach (var property in GetSchemaProperties(item.StateSchema))
                if (stateProperties.TryGetValue(property.Key, out var existing) && existing.GetRawText() != property.Value.GetRawText()) Add($"objects[{i}].stateSchema", $"State '{property.Key}' has an incompatible contract.");
                else stateProperties[property.Key] = property.Value;
            ValidateStateObject(item.InitialStateOverride, stateProperties, $"objects[{i}].initialStateOverride", false, Add);
            ValidateCodes(localActions.Select(action => action.Code), $"objects[{i}].actions", Add);
            for (var j = 0; j < localActions.Count; j++)
            {
                var action = localActions[j];
                var path = $"objects[{i}].actions[{j}]";
                if (string.IsNullOrWhiteSpace(action.Label)) Add($"{path}.label", "Label is required.");
                RequireObject(action.ArgumentSchema, $"{path}.argumentSchema", Add);
                ValidateCondition(action.AvailabilityCondition, $"{path}.availabilityCondition", stateProperties, null, allowArguments: false, Add);
                if (action.Visibility is not ("ai-choice" or "manual-ui" or "system-only")) Add($"{path}.visibility", "Visibility is invalid.");
                if (action.ExecutionMode is not ("rule" or "extension-module")) Add($"{path}.executionMode", "Execution mode is invalid.");
                if (action.ExecutionMode == "extension-module") Add($"objects[{i}].actions", $"Object-local extension action '{action.Code}' is not supported.");
            }
            var actionContracts = resolvedTypes.SelectMany(type => type.Actions ?? []).Concat(localActions).GroupBy(action => action.Code, StringComparer.Ordinal).ToList();
            foreach (var collision in actionContracts.Where(group => group.Select(ActionContract).Distinct(StringComparer.Ordinal).Count() > 1)) Add($"objects[{i}].mixinTypeCodes", $"Action '{collision.Key}' has incompatible contracts.");
            var actions = actionContracts.Select(group => group.Key).ToHashSet(StringComparer.Ordinal);
            var actionArgumentSchemas = actionContracts.ToDictionary(group => group.Key, group => group.First().ArgumentSchema, StringComparer.Ordinal);
            var genericTargets = resolvedTypes.SelectMany(type => (type.ActionRules ?? []).Select(rule => (Key: (type.Code, rule.Code), Rule: rule)))
                .GroupBy(pair => pair.Key).ToDictionary(group => group.Key, group => group.Select(pair => pair.Rule).ToList());
            var rules = item.ActionRules ?? [];
            var targeted = new HashSet<(string TypeCode, string RuleCode)>();
            var addCodes = new HashSet<string>(StringComparer.Ordinal);
            for (var j = 0; j < rules.Count; j++)
            {
                var rule = rules[j];
                var path = $"objects[{i}].actionRules[{j}]";
                if (rule.Operation is not ("add" or "override" or "delete" or "adjust")) { Add($"{path}.operation", "Operation must be add, override, delete, or adjust."); continue; }
                if (rule.Operation == "add")
                {
                    if (string.IsNullOrWhiteSpace(rule.Code) || !StableCodeRegex().IsMatch(rule.Code)) Add($"{path}.code", "Code must use lowercase letters, numbers, and hyphens.");
                    else if (!addCodes.Add(rule.Code)) Add($"{path}.code", "Add rule code must be unique within the object.");
                    if (rule.TargetTypeCode is not null || rule.TargetRuleCode is not null) Add(path, "Add rules cannot specify an inherited target.");
                    ValidateFullMutationRule(rule, path, actions, actionArgumentSchemas, locationCodes, objectCodes, stateProperties, objectStatePropertiesByCode, Add);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(rule.TargetTypeCode)) Add($"{path}.targetTypeCode", "Inherited target type code is required.");
                if (string.IsNullOrWhiteSpace(rule.TargetRuleCode)) Add($"{path}.targetRuleCode", "Inherited target rule code is required.");
                var key = (rule.TargetTypeCode ?? string.Empty, rule.TargetRuleCode ?? string.Empty);
                if (!targeted.Add(key)) Add(path, $"Conflicting mutation chain targets '{key.Item1}/{key.Item2}' more than once.");
                genericTargets.TryGetValue(key, out var targets);
                if (targets is null || targets.Count == 0) Add(path, $"Inherited target '{key.Item1}/{key.Item2}' does not exist on this object.");
                else if (targets.Count > 1) Add(path, $"Inherited target '{key.Item1}/{key.Item2}' is duplicated.");
                var target = targets?.Count == 1 ? targets[0] : null;

                if (rule.Code is not null) Add($"{path}.code", "Only add rules define a local code.");
                if (rule.Operation == "delete")
                {
                    if (rule.ActionCode is not null || rule.Condition is not null || rule.Priority is not null || rule.AuthoringNoteSpecified || rule.Effects is not null || rule.ModuleBindingSpecified)
                        Add(path, "Delete rules may only specify operation and inherited target.");
                }
                else if (rule.Operation == "override")
                {
                    ValidateFullMutationRule(rule, path, actions, actionArgumentSchemas, locationCodes, objectCodes, stateProperties, objectStatePropertiesByCode, Add);
                    if (target is not null && rule.ActionCode != target.ActionCode) Add($"{path}.actionCode", "Override action must match the inherited target action.");
                }
                else
                {
                    if (rule.ActionCode is not null) Add($"{path}.actionCode", "Adjust cannot change the inherited target action.");
                    if (rule.Condition is { } condition)
                    {
                        var targetArgumentSchema = target is not null && actionArgumentSchemas.TryGetValue(target.ActionCode, out var schema)
                            ? GetSchemaProperties(schema) : null;
                        ValidateCondition(condition, $"{path}.condition", stateProperties, targetArgumentSchema, allowArguments: true, Add);
                    }
                    if (rule.Effects is { } effects) ValidateEffects(effects, $"{path}.effects", locationCodes, objectCodes, stateProperties, objectStatePropertiesByCode, Add);
                    if (rule.ModuleBindingSpecified) ValidateModuleBinding(rule.ModuleBinding, $"{path}.moduleBinding", Add);
                    if (rule.Condition is null && rule.Priority is null && !rule.AuthoringNoteSpecified && rule.Effects is null && !rule.ModuleBindingSpecified)
                        Add(path, "Adjust must specify at least one patch field.");
                }
            }

            if (forPublish)
            {
                var effective = EffectiveRules(resolvedTypes, rules);
                foreach (var action in resolvedTypes.SelectMany(type => type.Actions ?? []).Concat(localActions).GroupBy(action => action.Code).Select(group => group.Last()))
                {
                    var matching = effective.Where(rule => rule.ActionCode == action.Code).ToList();
                    if (matching.Count == 0) Add($"objects[{i}].actionRules", $"Action '{action.Code}' has no deterministic result.");
                    foreach (var ambiguity in matching.GroupBy(rule => (rule.Priority, rule.SourceRank)).Where(group => group.Count() > 1))
                        Add($"objects[{i}].actionRules", $"Action '{action.Code}' has ambiguous priority {ambiguity.Key.Priority} at source rank {ambiguity.Key.SourceRank}.");
                    if (action.ExecutionMode == "extension-module" && matching.Any(rule => rule.ModuleBinding is null))
                        Add($"objects[{i}].actionRules", $"Action '{action.Code}' requires a module binding.");
                }
            }
        }

        if (forPublish)
        {
            if (locations.Count == 0) Add("locations", "At least one location is required.");
            if (objects.Count == 0) Add("objects", "At least one object is required.");
        }

        return errors.ToDictionary(pair => pair.Key, pair => pair.Value.Distinct().ToArray(), StringComparer.Ordinal);
    }

    public Dictionary<string, string[]> PreparePut(ScenarioDefinitionVersion? persistedDraft, ScenarioRuleDataRequest request)
    {
        if (persistedDraft is null) return [];
        var errors = new Dictionary<string, List<string>>(StringComparer.Ordinal);
        void Add(string path, string message)
        {
            if (!errors.TryGetValue(path, out var messages)) errors[path] = messages = [];
            messages.Add(message);
        }

        var persisted = ToRequest(persistedDraft);
        var incomingTypes = (request.ObjectTypes ?? []).Where(type => !string.IsNullOrWhiteSpace(type.Code))
            .GroupBy(type => type.Code, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        var persistedReferences = (persisted.Objects ?? []).SelectMany((item, index) => (item.ActionRules ?? [])
            .Where(rule => rule.Operation != "add")
            .Select(rule => (ObjectIndex: index, rule.TargetTypeCode, rule.TargetRuleCode))).ToList();

        foreach (var oldType in persisted.ObjectTypes ?? [])
        {
            incomingTypes.TryGetValue(oldType.Code, out var newType);
            var oldRules = (oldType.ActionRules ?? []).GroupBy(rule => rule.Code, StringComparer.Ordinal)
                .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
            var newRules = (newType?.ActionRules ?? []).Where(rule => !string.IsNullOrWhiteSpace(rule.Code))
                .GroupBy(rule => rule.Code, StringComparer.Ordinal)
                .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
            var removed = oldRules.Values.Where(rule => !newRules.ContainsKey(rule.Code)).ToList();
            var added = newRules.Values.Where(rule => !oldRules.ContainsKey(rule.Code)).ToList();
            foreach (var oldRule in removed)
            {
                var matches = added.Where(candidate => RuleFingerprint(candidate) == RuleFingerprint(oldRule)).ToList();
                if (matches.Count == 1)
                {
                    var replacement = matches[0];
                    foreach (var mutation in (request.Objects ?? []).SelectMany(item => item.ActionRules ?? [])
                        .Where(rule => rule.Operation != "add" && rule.TargetTypeCode == oldType.Code && rule.TargetRuleCode == oldRule.Code))
                        mutation.TargetRuleCode = replacement.Code;
                    added.Remove(replacement);
                    continue;
                }
                foreach (var reference in persistedReferences.Where(reference => reference.TargetTypeCode == oldType.Code && reference.TargetRuleCode == oldRule.Code))
                    Add($"objects[{reference.ObjectIndex}].actionRules", $"Type rule '{oldType.Code}/{oldRule.Code}' cannot be deleted while an object mutation references it.");
            }
        }
        return errors.ToDictionary(pair => pair.Key, pair => pair.Value.Distinct().ToArray(), StringComparer.Ordinal);
    }

    public async Task<ScenarioDefinitionVersion> SaveAsync(ScenarioDefinitionVersion version, ScenarioRuleDataRequest request, CancellationToken cancellationToken)
    {
        db.ScenarioObjects.RemoveRange(version.Objects);
        db.ScenarioObjectTypeActions.RemoveRange(version.ObjectTypes.SelectMany(item => item.Actions));
        db.ScenarioObjectTypes.RemoveRange(version.ObjectTypes);
        db.ScenarioLocations.RemoveRange(version.Locations);
        version.Locations.Clear(); version.ObjectTypes.Clear(); version.Objects.Clear();

        version.SchemaVersion = request.SchemaVersion;
        version.StartLocationCode = ResolveStartLocationCode(request.StartLocationCode, request.Locations ?? []);
        version.UpdatedAt = DateTimeOffset.UtcNow;
        var locations = (request.Locations ?? []).Select(item => new ScenarioLocation
        {
            Id = $"SLOC-{Guid.NewGuid():N}", DefinitionVersionId = version.Id, Code = item.Code.Trim(), Name = item.Name.Trim(),
            Description = item.Description?.Trim() ?? string.Empty, AuthoringDataJson = Json(item.AuthoringData, "{}"),
        }).ToDictionary(item => item.Code, StringComparer.Ordinal);
        foreach (var input in request.ObjectTypes ?? [])
        {
            var type = new ScenarioObjectType
            {
                Id = $"SOT-{Guid.NewGuid():N}", DefinitionVersionId = version.Id, Code = input.Code.Trim(), Name = input.Name.Trim(),
                Description = input.Description?.Trim() ?? string.Empty, SchemaVersion = input.SchemaVersion,
                StateSchemaJson = Json(input.StateSchema, "{}"), DefaultStateJson = Json(input.DefaultState, "{}"),
                PublicProjectionJson = Json(input.PublicProjection, "{}"), GenericActionRulesJson = JsonSerializer.Serialize(input.ActionRules ?? [], SerializerOptions),
            };
            foreach (var actionInput in input.Actions ?? [])
            {
                var action = new ScenarioObjectTypeAction
                {
                    Id = $"SOTA-{Guid.NewGuid():N}", ObjectTypeId = type.Id, Code = actionInput.Code.Trim(), Label = actionInput.Label.Trim(),
                    Description = actionInput.Description?.Trim() ?? string.Empty, ArgumentSchemaJson = Json(actionInput.ArgumentSchema, "{}"),
                    AvailabilityConditionJson = Json(actionInput.AvailabilityCondition, "{}"), Visibility = actionInput.Visibility,
                    ExecutionMode = actionInput.ExecutionMode,
                };
                type.Actions.Add(action);
            }
            version.ObjectTypes.Add(type);
        }
        foreach (var location in locations.Values) version.Locations.Add(location);
        foreach (var input in request.Objects ?? [])
        {
            var mixinCodes = input.MixinTypeCodes.Select(code => code.Trim()).Where(code => code.Length > 0).ToList();
            var item = new ScenarioObject
            {
                Id = $"SOBJ-{Guid.NewGuid():N}", DefinitionVersionId = version.Id, Code = input.Code.Trim(), Name = input.Name.Trim(),
                LocationId = locations[input.LocationCode].Id,
                InitialStateOverrideJson = Json(input.InitialStateOverride, "{}"), MixinTypeCodesJson = JsonSerializer.Serialize(mixinCodes),
                LocalStateSchemaJson = Json(input.StateSchema, "{}"), LocalDefaultStateJson = Json(input.DefaultState, "{}"),
                LocalPublicProjectionJson = Json(input.PublicProjection, "{}"), LocalActionsJson = JsonSerializer.Serialize(input.Actions ?? [], SerializerOptions),
                ActionRuleMutationsJson = JsonSerializer.Serialize(input.ActionRules ?? [], SerializerOptions), IsGlobal = input.IsGlobal,
            };
            version.Objects.Add(item);
        }
        await db.SaveChangesAsync(cancellationToken);
        return await Query().SingleAsync(item => item.Id == version.Id, cancellationToken);
    }

    public ScenarioRuleDataResponse ToResponse(ScenarioDefinitionVersion version)
    {
        var locationCodes = version.Locations.ToDictionary(item => item.Id, item => item.Code);
        return new(version.ScenarioId, version.Id, version.Version, version.Status, version.SchemaVersion, version.UpdatedAt, version.PublishedAt,
            version.Locations.OrderBy(item => item.Code).Select(item => new ScenarioLocationInput(item.Code, item.Name, item.Description, Parse(item.AuthoringDataJson))).ToList(),
            version.ObjectTypes.OrderBy(item => item.Code).Select(item => new ScenarioObjectTypeInput(item.Code, item.Name, item.Description, item.SchemaVersion,
                Parse(item.StateSchemaJson), Parse(item.DefaultStateJson), Parse(item.PublicProjectionJson),
                item.Actions.OrderBy(action => action.Code).Select(action => new ScenarioObjectTypeActionInput(action.Code, action.Label, action.Description,
                    Parse(action.ArgumentSchemaJson), Parse(action.AvailabilityConditionJson), action.Visibility, action.ExecutionMode)).ToList(),
                JsonSerializer.Deserialize<List<ScenarioGenericActionRuleInput>>(item.GenericActionRulesJson, SerializerOptions) ?? [])).ToList(),
            version.Objects.OrderBy(item => item.Code).Select(item =>
            {
                var mixins = JsonSerializer.Deserialize<List<string>>(item.MixinTypeCodesJson) ?? [];
                var rules = JsonSerializer.Deserialize<List<ScenarioObjectRuleMutationInput>>(item.ActionRuleMutationsJson, SerializerOptions) ?? [];
                return new ScenarioObjectInput(item.Code, item.Name, locationCodes[item.LocationId],
                    Parse(item.InitialStateOverrideJson), item.IsGlobal, rules, mixins, Parse(item.LocalStateSchemaJson), Parse(item.LocalDefaultStateJson),
                    Parse(item.LocalPublicProjectionJson), JsonSerializer.Deserialize<List<ScenarioObjectTypeActionInput>>(item.LocalActionsJson, SerializerOptions) ?? []);
            }).ToList(),
            version.StartLocationCode);
    }

    public ScenarioRuleDataRequest ToRequest(ScenarioDefinitionVersion version)
    {
        var response = ToResponse(version);
        return new(response.SchemaVersion, response.Locations, response.ObjectTypes, response.Objects, response.StartLocationCode);
    }

    private IQueryable<ScenarioDefinitionVersion> Query() => db.ScenarioDefinitionVersions
        .Include(version => version.Locations)
        .Include(version => version.ObjectTypes).ThenInclude(type => type.Actions)
        .Include(version => version.Objects);



    private sealed record EffectiveAuthoringRule(string ActionCode, int Priority, int SourceRank, ScenarioModuleBindingInput? ModuleBinding);

    private static IReadOnlyList<EffectiveAuthoringRule> EffectiveRules(
        IReadOnlyList<ScenarioObjectTypeInput> types, IReadOnlyList<ScenarioObjectRuleMutationInput> mutations)
    {
        var candidates = new Dictionary<(string TypeCode, string RuleCode), EffectiveAuthoringRule>();
        for (var rank = 0; rank < types.Count; rank++)
            foreach (var rule in types[rank].ActionRules ?? [])
                candidates.TryAdd((types[rank].Code, rule.Code), new(rule.ActionCode, rule.Priority, rank, rule.ModuleBinding));

        foreach (var mutation in mutations.Where(rule => rule.Operation != "add"))
        {
            var key = (mutation.TargetTypeCode ?? string.Empty, mutation.TargetRuleCode ?? string.Empty);
            if (!candidates.TryGetValue(key, out var generic)) continue;
            if (mutation.Operation == "delete") candidates.Remove(key);
            else if (mutation.Operation == "override" && mutation.ActionCode is not null && mutation.Priority is not null)
                candidates[key] = new(mutation.ActionCode, mutation.Priority.Value, generic.SourceRank, mutation.ModuleBinding);
            else if (mutation.Operation == "adjust")
                candidates[key] = generic with
                {
                    Priority = mutation.Priority ?? generic.Priority,
                    ModuleBinding = mutation.ModuleBindingSpecified ? mutation.ModuleBinding : generic.ModuleBinding,
                };
        }

        var result = candidates.Values.ToList();
        var localRank = types.Count;
        result.AddRange(mutations.Where(rule => rule.Operation == "add" && rule.ActionCode is not null && rule.Priority is not null)
            .Select(rule => new EffectiveAuthoringRule(rule.ActionCode!, rule.Priority!.Value, localRank, rule.ModuleBinding)));
        return result;
    }

    private static void ValidateFullMutationRule(
        ScenarioObjectRuleMutationInput rule, string path, ISet<string> actions,
        IReadOnlyDictionary<string, JsonElement> actionArgumentSchemas, ISet<string> locations, ISet<string> objects,
        IReadOnlyDictionary<string, JsonElement> stateProperties,
        IReadOnlyDictionary<string, IReadOnlyDictionary<string, JsonElement>> objectStatePropertiesByCode,
        Action<string, string> add)
    {
        if (string.IsNullOrWhiteSpace(rule.ActionCode)) add($"{path}.actionCode", "Action code is required for a full rule.");
        else if (!actions.Contains(rule.ActionCode)) add($"{path}.actionCode", "Referenced action does not exist.");
        if (rule.Condition is not { } condition) add($"{path}.condition", "Condition is required for a full rule.");
        else
        {
            var argumentProperties = rule.ActionCode is not null && actionArgumentSchemas.TryGetValue(rule.ActionCode, out var schema)
                ? GetSchemaProperties(schema) : null;
            ValidateCondition(condition, $"{path}.condition", stateProperties, argumentProperties, allowArguments: true, add);
        }
        if (rule.Priority is null) add($"{path}.priority", "Priority is required for a full rule.");
        if (rule.Effects is not { } effects) add($"{path}.effects", "Effects are required for a full rule.");
        else ValidateEffects(effects, $"{path}.effects", locations, objects, stateProperties, objectStatePropertiesByCode, add);
        if (rule.ModuleBindingSpecified) ValidateModuleBinding(rule.ModuleBinding, $"{path}.moduleBinding", add);
    }

    private static void ValidateModuleBinding(ScenarioModuleBindingInput? binding, string path, Action<string, string> add)
    {
        if (binding is null) return;
        if (string.IsNullOrWhiteSpace(binding.ModuleId)) add($"{path}.moduleId", "Module ID is required.");
        if (string.IsNullOrWhiteSpace(binding.Version)) add($"{path}.version", "Module version is required.");
        if (string.IsNullOrWhiteSpace(binding.Digest)) add($"{path}.digest", "Module digest is required.");
        RequireObject(binding.Configuration, $"{path}.configuration", add);
    }

    private static string RuleFingerprint(ScenarioGenericActionRuleInput rule) => JsonSerializer.Serialize(new
    {
        rule.ActionCode,
        Condition = Json(rule.Condition, "{}"),
        rule.Priority,
        rule.AuthoringNote,
        Effects = Json(rule.Effects, "[]"),
        ModuleBinding = rule.ModuleBinding is null ? null : new
        {
            rule.ModuleBinding.ModuleId,
            rule.ModuleBinding.Version,
            rule.ModuleBinding.Digest,
            Configuration = Json(rule.ModuleBinding.Configuration, "{}"),
        },
    });

    private static string ActionContract(ScenarioObjectTypeActionInput action) => JsonSerializer.Serialize(new
    {
        action.Code, action.Label, action.Description, ArgumentSchema = Json(action.ArgumentSchema, "{}"),
        AvailabilityCondition = Json(action.AvailabilityCondition, "{}"), action.Visibility, action.ExecutionMode,
    });


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

    private static void ValidateCondition(
        JsonElement value,
        string path,
        IReadOnlyDictionary<string, JsonElement> stateProperties,
        IReadOnlyDictionary<string, JsonElement>? argumentProperties,
        bool allowArguments,
        Action<string, string> add)
    {
        if (value.ValueKind != JsonValueKind.Object)
        {
            add(path, "A condition must be a JSON object.");
            return;
        }

        var properties = value.EnumerateObject().ToList();
        if (properties.Count == 0) return;

        var logicalProperties = properties.Where(property => property.Name is "and" or "or" or "not").ToList();
        if (logicalProperties.Count > 0)
        {
            if (logicalProperties.Count != 1 || properties.Count != 1)
            {
                add(path, "A logical condition must contain exactly one of and, or, or not.");
                return;
            }

            var logical = logicalProperties[0];
            if (logical.Name == "not")
            {
                if (logical.Value.ValueKind != JsonValueKind.Object) add($"{path}.not", "Not must contain a condition object.");
                else ValidateCondition(logical.Value, $"{path}.not", stateProperties, argumentProperties, allowArguments, add);
                return;
            }

            if (logical.Value.ValueKind != JsonValueKind.Array)
            {
                add($"{path}.{logical.Name}", $"{logical.Name} must contain an array of conditions.");
                return;
            }

            var index = 0;
            foreach (var child in logical.Value.EnumerateArray())
                ValidateCondition(child, $"{path}.{logical.Name}[{index++}]", stateProperties, argumentProperties, allowArguments, add);
            return;
        }

        if (!value.TryGetProperty("op", out var opElement) || opElement.ValueKind != JsonValueKind.String)
        {
            add($"{path}.op", "Condition operator is required.");
            return;
        }

        var op = opElement.GetString();
        if (op is not ("eq" or "ne" or "lt" or "lte" or "gt" or "gte" or "in" or "exists"))
            add($"{path}.op", "Condition operator is invalid.");

        if (!value.TryGetProperty("path", out var pathElement) || pathElement.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(pathElement.GetString()))
        {
            add($"{path}.path", "Condition path is required.");
            return;
        }

        var conditionPath = pathElement.GetString()!;
        var referencedSchema = ResolveConditionPathSchema(conditionPath, stateProperties, argumentProperties, allowArguments, out var pathError);
        if (pathError is not null) add($"{path}.path", pathError);

        if (op == "exists")
        {
            if (value.TryGetProperty("value", out _)) add($"{path}.value", "Exists conditions do not accept a value.");
        }
        else if (!value.TryGetProperty("value", out var expected))
        {
            add($"{path}.value", "Condition value is required.");
        }
        else if (op is "lt" or "lte" or "gt" or "gte")
        {
            if (expected.ValueKind != JsonValueKind.Number) add($"{path}.value", "Numeric conditions require a numeric value.");
            if (referencedSchema is { } schema && !IsNumericSchema(schema)) add($"{path}.path", "Numeric conditions require a numeric state or argument path.");
        }
        else if (op == "in" && expected.ValueKind != JsonValueKind.Array)
        {
            add($"{path}.value", "In conditions require an array value.");
        }

        var expectedPropertyCount = op == "exists" ? 2 : 3;
        if (properties.Count != expectedPropertyCount || properties.Select(property => property.Name).Distinct(StringComparer.Ordinal).Count() != properties.Count)
            add(path, op == "exists"
                ? "Exists conditions must contain exactly op and path."
                : "Comparison conditions must contain exactly op, path, and value.");

        foreach (var property in properties)
        {
            var allowed = property.Name is "op" or "path" || (property.Name == "value" && op != "exists");
            if (!allowed) add($"{path}.{property.Name}", "Condition property is not allowed.");
        }
    }

    private static JsonElement? ResolveConditionPathSchema(
        string path,
        IReadOnlyDictionary<string, JsonElement> stateProperties,
        IReadOnlyDictionary<string, JsonElement>? argumentProperties,
        bool allowArguments,
        out string? error)
    {
        error = null;
        if (path.StartsWith("session.flags.", StringComparison.Ordinal))
        {
            if (path.Length == "session.flags.".Length || path["session.flags.".Length..].Contains('.', StringComparison.Ordinal))
                error = "Session flag paths must reference exactly one flag name.";
            return null;
        }

        IReadOnlyDictionary<string, JsonElement>? properties;
        string prefix;
        string subject;
        if (path.StartsWith("state.", StringComparison.Ordinal))
        {
            properties = stateProperties;
            prefix = "state.";
            subject = "state property";
        }
        else if (path.StartsWith("arguments.", StringComparison.Ordinal))
        {
            if (!allowArguments)
            {
                error = "Availability condition paths may only start with state. or session.flags.";
                return null;
            }
            properties = argumentProperties;
            prefix = "arguments.";
            subject = "action argument";
        }
        else
        {
            error = allowArguments
                ? "Condition paths must start with state., arguments., or session.flags."
                : "Availability condition paths may only start with state. or session.flags.";
            return null;
        }

        var segments = path[prefix.Length..].Split('.', StringSplitOptions.None);
        if (segments.Any(string.IsNullOrWhiteSpace))
        {
            error = "Condition paths must reference a named property.";
            return null;
        }
        if (properties is null) return null;
        if (!properties.TryGetValue(segments[0], out var schema))
        {
            error = $"Referenced {subject} does not exist.";
            return null;
        }

        for (var index = 1; index < segments.Length; index++)
        {
            var nested = GetSchemaProperties(schema);
            if (nested.Count == 0)
            {
                error = $"Referenced {subject} does not exist.";
                return null;
            }
            if (!nested.TryGetValue(segments[index], out schema))
            {
                error = $"Referenced {subject} does not exist.";
                return null;
            }
        }
        return schema;
    }

    private static bool IsNumericSchema(JsonElement schema) =>
        schema.ValueKind == JsonValueKind.Object
        && schema.TryGetProperty("type", out var type)
        && type.ValueKind == JsonValueKind.String
        && type.GetString() is "integer" or "number";

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

    private static void ValidateEffects(
        JsonElement value,
        string path,
        ISet<string> locations,
        ISet<string> objects,
        IReadOnlyDictionary<string, JsonElement> sourceStateProperties,
        IReadOnlyDictionary<string, IReadOnlyDictionary<string, JsonElement>> objectStatePropertiesByCode,
        Action<string, string> add)
    {
        if (value.ValueKind != JsonValueKind.Array) { add(path, "Effects must be a JSON array."); return; }
        var index = 0;
        foreach (var effect in value.EnumerateArray())
        {
            var effectPath = $"{path}[{index++}]";
            if (effect.ValueKind != JsonValueKind.Object || !effect.TryGetProperty("type", out var typeProperty) || !EffectTypes.Contains(typeProperty.GetString() ?? string.Empty))
            { add(effectPath, "Effect type is invalid."); continue; }
            var type = typeProperty.GetString();
            if (type is "set-state" or "increment-state" or "append-set" or "remove-set")
            {
                var targetProperties = sourceStateProperties;
                if (effect.TryGetProperty("objectCode", out var targetObjectCode))
                {
                    if (targetObjectCode.ValueKind != JsonValueKind.String || !objects.Contains(targetObjectCode.GetString() ?? string.Empty))
                        add($"{effectPath}.objectCode", "Referenced object does not exist.");
                    else if (objectStatePropertiesByCode.TryGetValue(targetObjectCode.GetString()!, out var resolvedTargetProperties))
                        targetProperties = resolvedTargetProperties;
                }

                if (!effect.TryGetProperty("path", out var statePath) || statePath.ValueKind != JsonValueKind.String || !(statePath.GetString() ?? string.Empty).StartsWith("state.", StringComparison.Ordinal))
                    add($"{effectPath}.path", "State effect paths must start with state.");
                else
                {
                    var property = statePath.GetString()!["state.".Length..].Split('.', 2)[0];
                    if (!targetProperties.TryGetValue(property, out var propertySchema)) add($"{effectPath}.path", "State effect path is not declared by the target schema.");
                    else if (type == "set-state" && effect.TryGetProperty("value", out var stateValue))
                        ValidateStateValue(stateValue, propertySchema, $"{effectPath}.value", add);
                }
                if (!effect.TryGetProperty("value", out _)) add($"{effectPath}.value", "State effect value is required.");
            }
            if (type == "move-object")
            {
                if (effect.TryGetProperty("objectCode", out var objectCode) && (objectCode.ValueKind != JsonValueKind.String || !objects.Contains(objectCode.GetString() ?? string.Empty))) add($"{effectPath}.objectCode", "Referenced object does not exist.");
                if (!effect.TryGetProperty("locationCode", out var locationCode) || locationCode.ValueKind != JsonValueKind.String || !locations.Contains(locationCode.GetString() ?? string.Empty)) add($"{effectPath}.locationCode", "Referenced location does not exist.");
            }
            if (type == "move-session")
            {
                if (!effect.TryGetProperty("locationCode", out var locationCode) || locationCode.ValueKind != JsonValueKind.String || !locations.Contains(locationCode.GetString() ?? string.Empty)) add($"{effectPath}.locationCode", "Referenced location does not exist.");
            }
            if (type == "emit-event")
            {
                if (!effect.TryGetProperty("event", out var eventName) || eventName.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(eventName.GetString())) add($"{effectPath}.event", "Event name is required.");
                if (effect.TryGetProperty("locationCode", out var locationCode) && (locationCode.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(locationCode.GetString()) || !locations.Contains(locationCode.GetString()!))) add($"{effectPath}.locationCode", "Referenced location does not exist.");
            }
            if (type is "emit-fact" or "add-narrative-hint" or "forbid-narrative-fact")
            {
                if (!effect.TryGetProperty("text", out var text) || text.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(text.GetString())) add($"{effectPath}.text", "Text is required.");
            }
        }
    }

    private static void ValidateStateValue(JsonElement value, JsonElement propertySchema, string path, Action<string, string> add)
    {
        if (!propertySchema.TryGetProperty("type", out var type)) return;
        var valid = type.GetString() switch
        {
            "boolean" => value.ValueKind is JsonValueKind.True or JsonValueKind.False,
            "string" => value.ValueKind == JsonValueKind.String,
            "integer" => value.ValueKind == JsonValueKind.Number && value.TryGetInt64(out _),
            "number" => value.ValueKind == JsonValueKind.Number,
            "array" => value.ValueKind == JsonValueKind.Array,
            "object" => value.ValueKind == JsonValueKind.Object,
            "null" => value.ValueKind == JsonValueKind.Null,
            _ => false,
        };
        if (!valid) add(path, "State effect value does not match the target schema type.");
    }

    private static string? ResolveStartLocationCode(string? requestedCode, IReadOnlyList<ScenarioLocationInput> locations)
    {
        var requested = requestedCode?.Trim();
        if (!string.IsNullOrWhiteSpace(requested) && locations.Any(location => location.Code == requested)) return requested;
        if (locations.Any(location => location.Code == "start")) return "start";
        if (locations.Any(location => location.Code == "inside")) return "inside";
        return locations.Count == 1 ? locations[0].Code : null;
    }

    private static string Json(JsonElement value, string fallback) => value.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null ? fallback : value.GetRawText();
    private static JsonElement Parse(string json) => JsonDocument.Parse(json).RootElement.Clone();
    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.CultureInvariant)]
    private static partial Regex StableCodeRegex();
}
