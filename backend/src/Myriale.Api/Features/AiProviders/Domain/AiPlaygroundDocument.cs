using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.AiProviders.Domain;

public sealed class AiPlaygroundDocument
{
    [Key]
    [MaxLength(450)]
    public string OwnerAccountId { get; private set; } = string.Empty;

    public string DocumentJson { get; private set; } = string.Empty;
    public long Revision { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private AiPlaygroundDocument() { }

    public static AiPlaygroundDocument Create(string ownerAccountId, string documentJson, DateTimeOffset now) => new()
    {
        OwnerAccountId = ownerAccountId,
        DocumentJson = documentJson,
        Revision = 1,
        CreatedAt = now,
        UpdatedAt = now,
    };

    public void Update(string documentJson, long expectedRevision, DateTimeOffset now)
    {
        if (Revision != expectedRevision)
        {
            throw new InvalidOperationException("The AI Playground document has been updated.");
        }

        DocumentJson = documentJson;
        Revision++;
        UpdatedAt = now;
    }
}
