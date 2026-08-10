using System.Text.Json;

namespace Myriale.Api.Infrastructure.Composition.Evaluations;

public sealed class EvaluationMachineJudge : IEvaluationMachineJudge
{
    public string Key => "myriale-stage-rubric";
    public string Version => "1.0.0";
    public EvaluationScore Judge(EvaluationStage stage, string requestJson, string outputJson, string expectationsJson) => stage switch
    {
        EvaluationStage.Action => ScoreAction(outputJson, expectationsJson),
        EvaluationStage.Narrative => ScoreNarrative(requestJson, outputJson, expectationsJson),
        EvaluationStage.EntityState => ScoreState(requestJson, outputJson, expectationsJson),
        _ => throw new ArgumentOutOfRangeException(nameof(stage)),
    };

    private static EvaluationScore ScoreAction(string outputJson, string expectationsJson)
    {
        var output = Parse<ModelActionDecisionResult>(outputJson); using var metadata = JsonDocument.Parse(expectationsJson);
        var labels = new List<string>(); var pass = output.SchemaVersion == ScenarioTurnSchemas.ModelActionDecisionResult;
        Add(labels, pass, "schema_version_valid", "schema_version_invalid");
        var expectedSelection = String(metadata.RootElement, "expectedSelectionCode");
        if (expectedSelection is not null) { var ok = output.SelectionCode == expectedSelection; Add(labels, ok, "selection_exact", "selection_mismatch"); pass &= ok; }
        if (metadata.RootElement.TryGetProperty("expectedArguments", out var args)) { var ok = JsonElement.DeepEquals(output.Arguments, args); Add(labels, ok, "arguments_exact", "arguments_mismatch"); pass &= ok; }
        return new(pass, labels, pass ? "Action output matched the versioned rubric." : "Action output violated one or more rubric criteria.", pass ? 1 : 0, 1);
    }
    private static EvaluationScore ScoreNarrative(string requestJson, string outputJson, string expectationsJson)
    {
        var request = Parse<PostStateNarrativeRequest>(requestJson); var output = Parse<PostStateNarrativeResult>(outputJson); using var metadata = JsonDocument.Parse(expectationsJson);
        var labels = new List<string>(); var pass = output.SchemaVersion == ScenarioTurnSchemas.PostStateNarrative && output.Body.Length is >= 1 and <= 12000 && output.Heading.Length <= 240;
        Add(labels, pass, "runtime_validator_passed", "runtime_validator_failed");
        foreach (var forbidden in request.ForbiddenNarrativeFacts) { var ok = !output.Body.Contains(forbidden, StringComparison.OrdinalIgnoreCase); Add(labels, ok, $"absent:{forbidden}", $"forbidden_term:{forbidden}"); pass &= ok; }
        foreach (var term in Strings(metadata.RootElement, "requiredTerms")) { var ok = output.Body.Contains(term, StringComparison.OrdinalIgnoreCase); Add(labels, ok, $"required_term:{term}", $"missing_required_term:{term}"); pass &= ok; }
        foreach (var term in Strings(metadata.RootElement, "forbiddenTerms")) { var ok = !output.Body.Contains(term, StringComparison.OrdinalIgnoreCase); Add(labels, ok, $"absent:{term}", $"forbidden_term:{term}"); pass &= ok; }
        return new(pass, labels, pass ? "Narrative passed the versioned rubric." : "Narrative violated one or more rubric criteria.", pass ? 1 : 0, 1);
    }
    private static EvaluationScore ScoreState(string requestJson, string outputJson, string expectationsJson)
    {
        var request = Parse<EntityStateTransitionRequest>(requestJson); var output = Parse<EntityStateTransitionResult>(outputJson); using var metadata = JsonDocument.Parse(expectationsJson);
        var labels = new List<string>(); var pass = output.SchemaVersion == ScenarioTurnSchemas.EntityStateTransition;
        Add(labels, pass, "schema_version_valid", "schema_version_invalid");
        var entity = output.EntityCode == request.EntityCode; Add(labels, entity, "entity_exact", "entity_mismatch"); pass &= entity;
        var revision = output.ExpectedRevision == request.ExpectedRevision; Add(labels, revision, "revision_exact", "revision_mismatch"); pass &= revision;
        if (metadata.RootElement.TryGetProperty("expectedNextState", out var expected) && expected.ValueKind == JsonValueKind.Object)
            foreach (var p in expected.EnumerateObject()) { var ok = output.NextAiState.ValueKind == JsonValueKind.Object && output.NextAiState.TryGetProperty(p.Name, out var actual) && JsonElement.DeepEquals(actual, p.Value); Add(labels, ok, $"expected_field:{p.Name}", $"expected_field_mismatch:{p.Name}"); pass &= ok; }
        return new(pass, labels, pass ? "Entity state passed the versioned rubric." : "Entity state violated one or more rubric criteria.", pass ? 1 : 0, 1);
    }
    private static T Parse<T>(string json) => JsonSerializer.Deserialize<T>(json, JsonOptions) ?? throw new JsonException("Evaluation output was empty.");
    private static string? String(JsonElement e, string name) => e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;
    private static IEnumerable<string> Strings(JsonElement e, string name) => e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Array ? v.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.String).Select(x => x.GetString()!).Where(x => x.Length > 0) : [];
    private static void Add(ICollection<string> labels, bool pass, string yes, string no) => labels.Add(pass ? yes : no);
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
}
