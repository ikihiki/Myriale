using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Features.ModulePackages.Infrastructure.Persistence;

internal sealed class ModulePackageConfiguration : IEntityTypeConfiguration<ModulePackage>
{
    public void Configure(EntityTypeBuilder<ModulePackage> builder)
    {
        builder.Property(package => package.Digest).HasConversion(value => value.AsPrimitive(), value => new ModulePackageDigest(value));
        builder.Property(package => package.ModuleId).HasConversion(value => value.AsPrimitive(), value => new ModulePackageModuleId(value));
        builder.Property(package => package.Version).HasConversion(value => value.AsPrimitive(), value => new ModulePackageVersion(value));
        builder.Property(package => package.ManifestJson).IsRequired();
        builder.Property(package => package.Format).HasConversion<string>();
        builder.Property(package => package.Status).HasConversion<string>();
        builder.Property(package => package.Revision).IsConcurrencyToken();
        builder.HasIndex(package => new { package.ModuleId, package.Version }).IsUnique();
    }
}
