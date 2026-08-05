using Myriale.Api.Features.NarrativeGeneration.Contracts;

namespace Myriale.Api.Features.Scenarios.Contracts;

public sealed record ScenarioAiAssistRequest(string Kind, string Target, string Title, string Summary, string Genre, string Tone, string Lore, string AiFreedom, string Hero, IReadOnlyList<NarrativeEntityInput> Entities, string Opening, string IllustrationStyle, string IllustrationMood, string IllustrationNegative, string SampleScene);
public sealed record ScenarioAiSuggestion(string Id, string Body, string Rationale);
public sealed record ScenarioAiAssistResponse(string Message, IReadOnlyList<ScenarioAiSuggestion> Suggestions, string? Prompt, string? NegativePrompt, string? PreviewText);
