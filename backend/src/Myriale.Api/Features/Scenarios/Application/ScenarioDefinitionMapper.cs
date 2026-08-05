using System.Text.Json;
using Myriale.Api.Features.Scenarios.Domain;

namespace Myriale.Api.Features.Scenarios.Application;

public sealed class ScenarioDefinitionMapper(ScenarioRuleJsonCodec codec)
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public ScenarioRuleDataResponse ToResponse(ScenarioDefinitionVersion version)
    {
        var locationCodes = version.Locations.ToDictionary(item => item.Id, item => item.Code);
        return new(version.ScenarioId, version.Id, version.Version, version.Status.ToWireValue(), version.SchemaVersion, version.UpdatedAt, version.PublishedAt,
            version.Locations.OrderBy(item => item.Code).Select(item => new ScenarioLocationInput(item.Code, item.Name, item.Description, codec.ParseElement(item.AuthoringDataJson))).ToList(),
            version.ObjectTypes.OrderBy(item => item.Code).Select(item => new ScenarioObjectTypeInput(item.Code, item.Name, item.Description, item.SchemaVersion,
                codec.DecodeSchema(item.StateSchemaJson).Value, codec.DecodeState(item.DefaultStateJson).Value, codec.DecodeProjection(item.PublicProjectionJson).Value,
                item.Actions.OrderBy(action => action.Code).Select(action => new ScenarioObjectTypeActionInput(action.Code, action.Label, action.Description,
                    codec.ParseElement(action.ArgumentSchemaJson), codec.DecodeCondition(action.AvailabilityConditionJson), action.Visibility.ToWireValue(), action.ExecutionMode.ToWireValue())).ToList(),
                JsonSerializer.Deserialize<List<ScenarioActionRule>>(item.GenericActionRulesJson, SerializerOptions) ?? [])).ToList(),
            version.Objects.OrderBy(item => item.Code).Select(item =>
            {
                var mixins = JsonSerializer.Deserialize<List<string>>(item.MixinTypeCodesJson) ?? [];
                var rules = JsonSerializer.Deserialize<List<ScenarioObjectRuleMutationInput>>(item.ActionRuleMutationsJson, SerializerOptions) ?? [];
                return new ScenarioObjectInput(item.Code, item.Name, item.ProfileMarkdown, locationCodes[item.LocationId],
                    codec.DecodeState(item.InitialStateOverrideJson).Value, item.IsGlobal, rules, mixins, codec.DecodeSchema(item.LocalStateSchemaJson).Value,
                    codec.DecodeState(item.LocalDefaultStateJson).Value, codec.DecodeProjection(item.LocalPublicProjectionJson).Value,
                    JsonSerializer.Deserialize<List<ScenarioObjectTypeActionInput>>(item.LocalActionsJson, SerializerOptions) ?? []);
            }).ToList(), version.StartLocationCode);
    }

    public ScenarioRuleDataRequest ToRequest(ScenarioDefinitionVersion version)
    {
        var response = ToResponse(version);
        return new(response.SchemaVersion, response.Locations, response.ObjectTypes, response.Objects, response.StartLocationCode);
    }
}
