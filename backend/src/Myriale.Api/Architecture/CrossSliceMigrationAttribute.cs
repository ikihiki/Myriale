namespace Myriale.Api.Architecture;

[AttributeUsage(AttributeTargets.Assembly, AllowMultiple = true)]
public sealed class CrossSliceMigrationAttribute(
    string sourceSlice,
    string targetSlice,
    string issue,
    string removeByWave) : Attribute
{
    public string SourceSlice { get; } = sourceSlice;
    public string TargetSlice { get; } = targetSlice;
    public string Issue { get; } = issue;
    public string RemoveByWave { get; } = removeByWave;
}
