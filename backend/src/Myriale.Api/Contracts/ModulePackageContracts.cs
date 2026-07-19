namespace Myriale.Api.Contracts;

public sealed record ModulePackageResponse(
    string Digest,
    string ModuleId,
    string Version,
    string ContractVersion,
    string DisplayName,
    string Description,
    string Status,
    bool IsEnabled,
    DateTimeOffset InstalledAt,
    DateTimeOffset LastScannedAt,
    string? LastError);

public sealed record ModulePackageInstallResponse(ModulePackageResponse Package, bool Created);

public sealed record ModulePackageScanIssueResponse(string FileName, string Message);

public sealed record ModulePackageScanResponse(
    int Installed,
    int Unchanged,
    int Missing,
    IReadOnlyList<ModulePackageScanIssueResponse> Issues);

public sealed record ModulePackageErrorResponse(string Message);
