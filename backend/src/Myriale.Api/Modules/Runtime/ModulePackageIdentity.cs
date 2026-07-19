namespace Myriale.Api.Modules.Runtime;

public sealed record ModulePackageIdentity(string ModuleId, string Version, string Digest)
{
    public ModulePackageIdentity Normalize() => this with { Digest = Digest.Trim().ToLowerInvariant() };
}
