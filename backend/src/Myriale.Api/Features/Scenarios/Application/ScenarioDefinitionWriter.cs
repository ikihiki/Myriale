using System.Text.Json;
using Myriale.Api.Infrastructure.Persistence;
using Myriale.Api.Features.Scenarios.Domain;

namespace Myriale.Api.Features.Scenarios.Application;

public sealed class ScenarioDefinitionWriter(ApplicationDbContext db, ScenarioRuleJsonCodec codec)
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public void Replace(ScenarioDefinitionVersion version, ScenarioRuleDataRequest request, DateTimeOffset now)
    {
        version.EnsureDraft();
        db.ScenarioObjects.RemoveRange(version.Objects);
        db.ScenarioObjectTypeActions.RemoveRange(version.ObjectTypes.SelectMany(x => x.Actions));
        db.ScenarioObjectTypes.RemoveRange(version.ObjectTypes);
        db.ScenarioLocations.RemoveRange(version.Locations);
        version.Locations.Clear(); version.ObjectTypes.Clear(); version.Objects.Clear();
        version.ReplaceAuthoringHeader(request.SchemaVersion, request.StartLocationCode.Trim(), now);
        var locations = (request.Locations ?? []).Select(x => new ScenarioLocation
        {
            Id = new ScenarioLocationId($"SLOC-{Guid.NewGuid():N}"), DefinitionVersionId = version.Id, Code = x.Code.Trim(), Name = x.Name.Trim(),
            Description = x.Description?.Trim() ?? string.Empty, AuthoringDataJson = Element(x.AuthoringData, "{}"),
        }).ToDictionary(x => x.Code, StringComparer.Ordinal);
        foreach (var input in request.ObjectTypes ?? [])
        {
            var type = new ScenarioObjectType
            {
                Id = new ScenarioObjectTypeId($"SOT-{Guid.NewGuid():N}"), DefinitionVersionId = version.Id, Code = input.Code.Trim(), Name = input.Name.Trim(),
                Description = input.Description?.Trim() ?? string.Empty, SchemaVersion = input.SchemaVersion,
                StateSchemaJson = codec.Encode(new StateSchema(input.StateSchema)), DefaultStateJson = codec.Encode(new StateValue(input.DefaultState)),
                PublicProjectionJson = codec.Encode(new PublicProjection(input.PublicProjection)),
                ProfileSchemaJson = Element(input.ProfileSchema, "{}"), ProfileDefaultsJson = Element(input.ProfileDefaults, "{}"),
                GenericActionRulesJson = JsonSerializer.Serialize(input.ActionRules ?? [], Options),
            };
            foreach (var actionInput in input.Actions ?? []) type.Actions.Add(new ScenarioObjectTypeAction
            {
                Id = new ScenarioObjectTypeActionId($"SOTA-{Guid.NewGuid():N}"), ObjectTypeId = type.Id, Code = actionInput.Code.Trim(), Label = actionInput.Label.Trim(),
                Description = actionInput.Description?.Trim() ?? string.Empty, ArgumentSchemaJson = Element(actionInput.ArgumentSchema, "{}"),
                AvailabilityConditionJson = codec.Encode(actionInput.AvailabilityCondition),
                Visibility = ScenarioEnumValues.ParseActionVisibility(actionInput.Visibility), ExecutionMode = ScenarioEnumValues.ParseActionExecutionMode(actionInput.ExecutionMode),
            });
            version.ObjectTypes.Add(type);
        }
        foreach (var location in locations.Values) version.Locations.Add(location);
        foreach (var input in request.Objects ?? []) version.Objects.Add(new ScenarioObject
        {
            Id = new ScenarioObjectId($"SOBJ-{Guid.NewGuid():N}"), DefinitionVersionId = version.Id, Code = input.Code.Trim(), Name = input.Name.Trim(),
            ProfileMarkdown = input.ProfileMarkdown?.Trim() ?? string.Empty, LocationId = locations[input.LocationCode].Id,
            InitialStateOverrideJson = codec.Encode(new StateValue(input.InitialStateOverride)),
            MixinTypeCodesJson = JsonSerializer.Serialize(input.MixinTypeCodes.Select(x => x.Trim()).Where(x => x.Length > 0)),
            LocalStateSchemaJson = codec.Encode(new StateSchema(input.StateSchema)), LocalDefaultStateJson = codec.Encode(new StateValue(input.DefaultState)),
            LocalPublicProjectionJson = codec.Encode(new PublicProjection(input.PublicProjection)),
            LocalProfileSchemaJson = Element(input.LocalProfileSchema, "{}"), LocalProfileDefaultsJson = Element(input.LocalProfileDefaults, "{}"),
            ProfileValuesJson = Element(input.ProfileValues, "{}"), LocalActionsJson = JsonSerializer.Serialize(input.Actions ?? [], Options),
            ActionRuleMutationsJson = JsonSerializer.Serialize(input.ActionRules ?? [], Options), IsGlobal = input.IsGlobal,
        });
    }

    private static string Element(JsonElement value, string fallback) => value.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null ? fallback : value.GetRawText();
}
