using Myriale.Api.Architecture;

namespace Myriale.Api.Features.ModulePackages.Application.Services;

[CrossSliceContract]
public interface IModulePackageResourceService
{
    Task<byte[]> ReadResourceAsync(ModulePackageSnapshot package, string relativePath, CancellationToken cancellationToken);
}
