using Myriale.Api.Contracts;

namespace Myriale.Api.Modules.UI;

public interface IModuleUiResourceService
{
    Task<ModuleUiDescriptorResult> GetRuntimeDescriptorAsync(string ownerId, string executionId, CancellationToken cancellationToken);
    Task<ModuleUiResourceResult> GetRuntimeResourceAsync(string ownerId, string executionId, string resourceId, CancellationToken cancellationToken);
}

public sealed record ModuleUiDescriptorResult(
    int StatusCode,
    ModuleRuntimeUiDescriptorResponse? Descriptor = null,
    ModuleUiErrorResponse? Error = null);

public sealed record ModuleUiResourceResult(
    int StatusCode,
    byte[]? Bytes = null,
    string? ContentType = null,
    string? Sha256 = null,
    ModuleUiErrorResponse? Error = null);
