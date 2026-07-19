using System.Reflection;
using System.Runtime.Loader;
using Myriale.ModuleSdk;

namespace Myriale.Api.Modules;

internal sealed class ModuleAssemblyLoadContext() : AssemblyLoadContext(isCollectible: true)
{
    protected override Assembly? Load(AssemblyName assemblyName)
    {
        if (AssemblyName.ReferenceMatchesDefinition(assemblyName, typeof(IMyrialeModule).Assembly.GetName()))
        {
            return typeof(IMyrialeModule).Assembly;
        }

        return null;
    }
}
