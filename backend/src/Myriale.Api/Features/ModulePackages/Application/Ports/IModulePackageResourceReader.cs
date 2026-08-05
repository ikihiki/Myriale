using Myriale.Api.Architecture;

namespace Myriale.Api.Features.ModulePackages.Application.Ports;

[CrossSliceContract]
public interface IModulePackageResourceReader
{
    Task<byte[]> ReadResourceAsync(ModulePackageSnapshot package, string relativePath, CancellationToken cancellationToken);
}
