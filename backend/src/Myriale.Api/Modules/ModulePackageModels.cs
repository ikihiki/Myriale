using Myriale.Api.Data;

namespace Myriale.Api.Modules;

public sealed record ModulePackageInstallResult(ModulePackage Package, bool Created);

public sealed record ModulePackageScanIssue(string FileName, string Message);

public sealed record ModulePackageScanResult(
    int Installed,
    int Unchanged,
    int Missing,
    IReadOnlyList<ModulePackageScanIssue> Issues);

public sealed class ModulePackageValidationException(string message) : Exception(message);
