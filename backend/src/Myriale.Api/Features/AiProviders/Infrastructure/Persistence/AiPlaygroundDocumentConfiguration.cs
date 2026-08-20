using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Features.AiProviders.Infrastructure.Persistence;

internal sealed class AiPlaygroundDocumentConfiguration : IEntityTypeConfiguration<AiPlaygroundDocument>
{
    public void Configure(EntityTypeBuilder<AiPlaygroundDocument> builder)
    {
        builder.HasKey(document => document.OwnerAccountId);
        builder.Property(document => document.DocumentJson).IsRequired();
        builder.Property(document => document.Revision).IsConcurrencyToken();
    }
}
