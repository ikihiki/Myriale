namespace Myriale.ModuleSdk;

[AttributeUsage(AttributeTargets.Assembly, AllowMultiple = false)]
public sealed class MyrialeModuleEntryPointAttribute(Type moduleType) : Attribute
{
    public Type ModuleType { get; } = moduleType;
}
