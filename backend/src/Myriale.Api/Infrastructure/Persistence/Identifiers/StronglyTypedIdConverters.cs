using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Myriale.Api.Features.Wave0.Identifiers;

namespace Myriale.Api.Infrastructure.Persistence.Identifiers;

internal sealed class AiProviderProfileIdConverter()
    : ValueConverter<AiProviderProfileId, string>(id => id.AsPrimitive(), value => new AiProviderProfileId(value));

internal sealed class AiCredentialIdConverter()
    : ValueConverter<AiCredentialId, string>(id => id.AsPrimitive(), value => new AiCredentialId(value));

internal sealed class RepresentativeStringIdConverter()
    : ValueConverter<RepresentativeStringId, string>(id => id.AsPrimitive(), value => new RepresentativeStringId(value));

internal sealed class RepresentativeLongIdConverter()
    : ValueConverter<RepresentativeLongId, long>(id => id.AsPrimitive(), value => new RepresentativeLongId(value));

internal sealed class RepresentativeGuidIdConverter()
    : ValueConverter<RepresentativeGuidId, Guid>(id => id.AsPrimitive(), value => new RepresentativeGuidId(value));

internal static class StronglyTypedIdConventions
{
    public static void Configure(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<AiProviderProfileId>().HaveConversion<AiProviderProfileIdConverter>();
        configurationBuilder.Properties<AiCredentialId>().HaveConversion<AiCredentialIdConverter>();
        configurationBuilder.Properties<RepresentativeStringId>().HaveConversion<RepresentativeStringIdConverter>();
        configurationBuilder.Properties<RepresentativeLongId>().HaveConversion<RepresentativeLongIdConverter>();
        configurationBuilder.Properties<RepresentativeGuidId>().HaveConversion<RepresentativeGuidIdConverter>();
    }
}
