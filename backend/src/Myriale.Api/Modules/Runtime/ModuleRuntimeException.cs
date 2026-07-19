namespace Myriale.Api.Modules.Runtime;

public static class ModuleRuntimeErrorCodes
{
    public const string PackageNotFound = "package_not_found";
    public const string PackageDisabled = "package_disabled";
    public const string PackageUnavailable = "package_unavailable";
    public const string ContractViolation = "contract_violation";
    public const string InvocationFailed = "invocation_failed";
    public const string CapacityExceeded = "capacity_exceeded";
}

public sealed class ModuleRuntimeException(string code, string message, Exception? innerException = null)
    : Exception(message, innerException)
{
    public string Code { get; } = code;
}
