namespace Myriale.Api.Architecture;

[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public sealed class FeatureSliceAttribute(string name) : Attribute
{
    public string Name { get; } = name;
}
