using Myriale.Api.Architecture;
using UnitGenerator;

namespace Myriale.Api.Features.SessionMemory.Identifiers;

[CrossSliceContract]
[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
public readonly partial struct SessionNoteId;

[CrossSliceContract]
[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
public readonly partial struct SessionNoteRevisionId;

[CrossSliceContract]
[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
public readonly partial struct SessionSummaryId;
