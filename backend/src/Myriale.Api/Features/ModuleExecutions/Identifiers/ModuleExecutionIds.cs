using Myriale.Api.Architecture;
using UnitGenerator;

namespace Myriale.Api.Features.ModuleExecutions.Identifiers;

[CrossSliceContract]
[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
public readonly partial struct ModuleExecutionId;

[CrossSliceContract]
[UnitOf<long>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
public readonly partial struct ModuleExecutionRequestId;

[CrossSliceContract]
[UnitOf<long>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
public readonly partial struct ModuleOutcomeApplicationId;
