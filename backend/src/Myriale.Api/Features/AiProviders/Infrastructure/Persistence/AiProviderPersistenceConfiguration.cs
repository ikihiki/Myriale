using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Features.AiProviders.Infrastructure.Persistence;

internal sealed class AiProviderProfileConfiguration : IEntityTypeConfiguration<AiProviderProfile>
{
    public void Configure(EntityTypeBuilder<AiProviderProfile> builder)
    {
        builder.Property(profile => profile.Adapter).HasConversion<string>();
        builder.Property(profile => profile.Revision).IsConcurrencyToken();
    }
}

internal sealed class AiCredentialConfiguration : IEntityTypeConfiguration<AiCredential>
{
    public void Configure(EntityTypeBuilder<AiCredential> builder) =>
        builder.Property(credential => credential.Revision).IsConcurrencyToken();
}

internal sealed class AiProviderProfileValidationConfiguration : IEntityTypeConfiguration<AiProviderProfileValidation>
{
    public void Configure(EntityTypeBuilder<AiProviderProfileValidation> builder)
    {
        builder.Property(validation => validation.Status).HasConversion<string>();
        builder.HasIndex(validation => new { validation.ProfileId, validation.TestedAt });
    }
}

internal sealed class AiProviderRuntimeSettingsConfiguration : IEntityTypeConfiguration<AiProviderRuntimeSettings>
{
    public void Configure(EntityTypeBuilder<AiProviderRuntimeSettings> builder) =>
        builder.Property(settings => settings.Revision).IsConcurrencyToken();
}
