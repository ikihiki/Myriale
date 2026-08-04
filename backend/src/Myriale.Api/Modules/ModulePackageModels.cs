namespace Myriale.Api.Modules;

public sealed class ModulePackageValidationException : Exception
{
    public ModulePackageValidationException(string message) : base(message) { }
    public ModulePackageValidationException(string message, Exception inner) : base(message, inner) { }
}
