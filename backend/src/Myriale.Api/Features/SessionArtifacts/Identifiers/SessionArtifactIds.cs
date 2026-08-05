using Myriale.Api.Architecture;
using UnitGenerator;

namespace Myriale.Api.Features.SessionArtifacts.Identifiers;

[CrossSliceContract]
[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
public readonly partial struct SessionArtifactId;

[CrossSliceContract]
[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
public readonly partial struct SessionImageId;
