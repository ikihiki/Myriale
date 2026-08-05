using Myriale.Api.Architecture;
using Myriale.Api.Features.AiProviders.Application.Ports;

namespace Myriale.Api.Features.NarrativeGeneration.Contracts;

[CrossSliceContract]
public sealed record NarrativeGeneration<T>(
    T Value,
    AiGenerationMetadata Metadata,
    string? SentPrompt = null,
    string? ReceivedResult = null);
