using Myriale.Api.Architecture;
using UnitGenerator;

namespace Myriale.Api.Features.Accounts.Identifiers;

[CrossSliceContract]
[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
public readonly partial struct AccountId;
