namespace Myriale.Api.Features.Evaluations.Application.Services;

public sealed record EvaluationScore(bool Passed, IReadOnlyList<string> Labels, string Rationale = "", decimal? Score = null, decimal? Confidence = null);
public interface IEvaluationMachineJudge
{
    string Key { get; }
    string Version { get; }
    EvaluationScore Judge(EvaluationStage stage, string requestJson, string outputJson, string expectationsJson);
}
