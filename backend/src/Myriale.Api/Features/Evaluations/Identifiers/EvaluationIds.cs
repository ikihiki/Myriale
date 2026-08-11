using Myriale.Api.Architecture;
using UnitGenerator;

namespace Myriale.Api.Features.Evaluations.Identifiers;

[CrossSliceContract, UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)] public readonly partial struct EvaluationSessionId;
[CrossSliceContract, UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)] public readonly partial struct EvaluationSituationId;
[CrossSliceContract, UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)] public readonly partial struct EvaluationCandidateId;
[CrossSliceContract, UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)] public readonly partial struct EvaluationAttemptId;
[CrossSliceContract, UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)] public readonly partial struct EvaluationModelInvocationId;
[CrossSliceContract, UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)] public readonly partial struct EvaluationMachineJudgmentId;
[CrossSliceContract, UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)] public readonly partial struct EvaluationReviewBatchId;
[CrossSliceContract, UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)] public readonly partial struct EvaluationReviewAssignmentId;
[CrossSliceContract, UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)] public readonly partial struct EvaluationReviewItemId;
[CrossSliceContract, UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)] public readonly partial struct EvaluationHumanJudgmentId;
[CrossSliceContract, UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)] public readonly partial struct EvaluationAggregateId;
