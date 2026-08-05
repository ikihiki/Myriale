using Myriale.Api.Architecture;
using UnitGenerator;

namespace Myriale.Api.Features.ProgressionRuntime.Identifiers;

[CrossSliceContract]
[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
public readonly partial struct SessionProgressionModuleSnapshotId;

[CrossSliceContract]
[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
public readonly partial struct SessionNarrativeSignalId;

[CrossSliceContract]
[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
public readonly partial struct SessionProgressionTransitionReceiptId;
