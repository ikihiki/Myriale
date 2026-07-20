namespace Myriale.Api.Contracts;

public sealed record ModuleRuntimeUiDescriptorResponse(
    string Protocol,
    int ProtocolVersion,
    string ExecutionId,
    ModuleRuntimeUiPackageResponse Package,
    string ElementName,
    ModuleUiResourceResponse Script,
    IReadOnlyList<ModuleUiResourceResponse> Styles);

public sealed record ModuleRuntimeUiPackageResponse(string ModuleId, string Version, string Digest);

public sealed record ModuleUiResourceResponse(
    string Id,
    string Url,
    string ContentType,
    string Sha256,
    long ByteLength);

public sealed record ModuleUiErrorResponse(string Code, string Message);
