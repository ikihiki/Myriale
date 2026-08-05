namespace Myriale.Api.Architecture;

[AttributeUsage(
    AttributeTargets.Interface |
    AttributeTargets.Class |
    AttributeTargets.Struct |
    AttributeTargets.Enum |
    AttributeTargets.Delegate,
    Inherited = false)]
public sealed class CrossSliceContractAttribute : Attribute;
