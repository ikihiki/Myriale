using UnitGenerator;

namespace Myriale.Api.Features.Wave0.Identifiers;

[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
internal readonly partial struct RepresentativeStringId;

[UnitOf<long>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
internal readonly partial struct RepresentativeLongId;

[UnitOf<Guid>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
internal readonly partial struct RepresentativeGuidId;
