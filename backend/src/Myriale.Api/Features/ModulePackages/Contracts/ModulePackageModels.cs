using Myriale.Api.Architecture;
namespace Myriale.Api.Features.ModulePackages.Contracts;

[CrossSliceContract]
public enum ModulePackageStatus { Staged, Verified, Missing, Invalid }

[CrossSliceContract]
public enum ModulePackageFormat { Archive, Dll }

public sealed class ModulePackageValidationException : Exception
{
    public ModulePackageValidationException(string message) : base(message) { }
    public ModulePackageValidationException(string message, Exception inner) : base(message, inner) { }
}
