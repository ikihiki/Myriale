using Myriale.Api.Architecture;
namespace Myriale.Api.Features.ModulePackages.Application.Ports;

[CrossSliceContract]
public sealed record ModulePackageIdentity(string ModuleId, string Version, string Digest)
{
    public ModulePackageIdentity Normalize() => this with { Digest = Digest.Trim().ToLowerInvariant() };
}
