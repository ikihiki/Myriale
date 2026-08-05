using Myriale.Api.Architecture;
using Myriale.Api.Features.AiProviders.Application.Services;

namespace Myriale.Api.Features.NarrativeGeneration.Contracts;

[CrossSliceContract]
public sealed record NarrativeGeneration<T>(
    T Value,
    AiGenerationMetadata Metadata,
    string? SentPrompt = null,
    string? ReceivedResult = null);
