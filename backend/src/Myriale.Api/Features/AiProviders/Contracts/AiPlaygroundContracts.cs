using System.Text.Json;

namespace Myriale.Api.Features.AiProviders.Contracts;

public sealed record PutAiPlaygroundDocumentRequest(JsonElement Document, long? ExpectedRevision);
public sealed record AiPlaygroundDocumentResponse(JsonElement Document, long Revision, DateTimeOffset UpdatedAt);
