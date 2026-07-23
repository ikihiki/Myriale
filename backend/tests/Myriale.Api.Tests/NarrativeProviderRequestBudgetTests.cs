using System.Text.Json;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Myriale.Api.Contracts;
using Myriale.Api.Services;
using Myriale.ModuleSdk;

namespace Myriale.Api.Tests;

public sealed class NarrativeProviderRequestBudgetTests
{
    [Fact]
    public async Task LargeDialogueIsDeterministicallyReducedBeforeTheProviderWhileAuthoritativeContextRemains()
    {
        const int budget = 5_000;
        var options = Options.Create(new NarrativeContextOptions { FinalProviderRequestTokenBudget = budget });
        var budgeter = new NarrativeProviderRequestBudgeter(options);
        var provider = new CapturingProvider();
        var generator = new ProviderNarrativeGenerator(provider, budgeter, new NarrativeBodyQualityGuard(), NullLogger<ProviderNarrativeGenerator>.Instance);
        var request = CreateStressRequest();

        await generator.GenerateDialogueAsync(request, CancellationToken.None);
        Assert.Equal(2, provider.Requests.Count);
        var firstProviderRequest = provider.Requests[0];
        var firstSerialized = budgeter.Serialize(firstProviderRequest);
        Assert.True(budgeter.EstimateTokens(firstProviderRequest) <= budget);

        var fitted = JsonSerializer.Deserialize<ProviderDialoguePayload>(
            firstProviderRequest.Messages[1].Text!,
            new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.NotNull(fitted);
        Assert.Equal(request.SchemaVersion, fitted.SchemaVersion);
        Assert.Equal(request.ContextSchemaVersion, fitted.ContextSchemaVersion);
        Assert.Equal(request.Scenario, fitted.Scenario);
        Assert.Equal(request.PlayerInput, fitted.PlayerInput);
        Assert.Equal(request.SessionState.Revision, fitted.SessionState.Revision);
        Assert.Equal(request.SessionState.Flags.OrderBy(item => item.Key), fitted.SessionState.Flags.OrderBy(item => item.Key));
        Assert.Equal(request.CurrentProgressionNode, fitted.CurrentProgressionNode);
        Assert.Equal(Assert.Single(request.AllowedSignals), Assert.Single(fitted.AllowedSignals));
        Assert.Equal(request.RecentTurns[^1], Assert.Single(fitted.RecentTurns));
        Assert.Equal(request.Memory.Lorebook[0], Assert.Single(fitted.Memory.Lorebook));
        Assert.True(fitted.PriorModuleOutcomes.Count < request.PriorModuleOutcomes.Count);
        Assert.Equal(request.PriorModuleOutcomes[^1].Code, fitted.PriorModuleOutcomes[^1].Code);
        Assert.Null(fitted.Memory.Summary);

        provider.Requests.Clear();
        await generator.GenerateDialogueAsync(request, CancellationToken.None);
        Assert.Equal(2, provider.Requests.Count);
        Assert.Equal(firstSerialized, budgeter.Serialize(provider.Requests[0]));
    }

    [Fact]
    public void RequiredAuthoritativeContextFailsClosedInsteadOfExceedingBudget()
    {
        var budgeter = new NarrativeProviderRequestBudgeter(Options.Create(new NarrativeContextOptions
        {
            FinalProviderRequestTokenBudget = 100,
        }));
        var request = CreateStressRequest() with
        {
            RecentTurns = [],
            Memory = new NarrativeSessionMemoryInput(null, []),
            PriorModuleOutcomes = [],
        };

        var exception = Assert.Throws<NarrativeGenerationException>(() => budgeter.Fit(request, CreateProviderRequest));
        Assert.Contains("authoritative narrative context", exception.Message, StringComparison.Ordinal);
    }

    private static NarrativeDialogueRequest CreateStressRequest()
    {
        var turns = Enumerable.Range(0, 125)
            .Select(index => new NarrativeDialogueTurnInput(
                $"player-{index:D3}-" + new string('p', 80),
                $"narrative-{index:D3}-" + new string('n', 160)))
            .ToArray();
        var lore = Enumerable.Range(0, 40)
            .Select(index => new NarrativeLorebookEntryInput(
                $"lore-{index:D3}",
                $"[CANON] lore-{index:D3}: " + new string('l', 220),
                "canon",
                "rule"))
            .ToArray();
        var outcomes = Enumerable.Range(0, 80)
            .Select(index => new NarrativePriorModuleOutcomeInput(
                $"outcome-{index:D3}",
                [new ModuleFact("result", $"public-{index:D3}-" + new string('f', 160))],
                [new ModuleEvent($"event-{index:D3}", JsonDocument.Parse("{}").RootElement.Clone())],
                [$"hint-{index:D3}-" + new string('h', 120)],
                [$"forbidden-{index:D3}-" + new string('x', 120)]))
            .ToArray();
        var diagnostics = new NarrativeContextDiagnostics(NarrativeContextSchema.Version, [], 0, "initial");
        var prompt = new NarrativePromptInstructions(
            NarrativePromptBuilder.Version,
            "hero perspective",
            "measured",
            "canon only",
            ["Keep player agency.", "Preserve authoritative state."]);

        return new NarrativeDialogueRequest(
            NarrativeDialogueSchema.Version,
            NarrativeContextSchema.Version,
            diagnostics,
            new NarrativeScenarioInput(
                "Authoritative scenario",
                "Scenario summary",
                "fantasy",
                "measured",
                "The sealed archive is beneath the eastern tower.",
                "low",
                "Aster",
                "Aster waits outside the archive."),
            turns,
            new NarrativeSessionMemoryInput("Authoritative long-session summary " + new string('s', 500), lore),
            outcomes,
            NarrativeInteractionTypes.Dialogue,
            prompt,
            "Inspect the eastern seal without opening it.",
            new NarrativeSessionStateInput(42, new Dictionary<string, bool>
            {
                ["archive-sealed"] = true,
                ["guardian-alert"] = false,
            }),
            "archive-entrance",
            [new NarrativeAllowedSignal("seal-opened", "Only when player input explicitly opens the seal; inspection alone is not enough.")],
            true);
    }

    private static AiTextRequest CreateProviderRequest(NarrativeDialogueRequest request)
    {
        using var schema = JsonDocument.Parse("{\"type\":\"object\"}");
        return new AiTextRequest(
            [
                new ChatMessage(ChatRole.System, JsonSerializer.Serialize(request.Prompt)),
                new ChatMessage(ChatRole.User, JsonSerializer.Serialize(ToProviderPayload(request))),
            ],
            ChatResponseFormat.ForJsonSchema(schema.RootElement.Clone(), "narrative_dialogue"));
    }

    private static ProviderDialoguePayload ToProviderPayload(NarrativeDialogueRequest request) => new(
        request.SchemaVersion,
        request.ContextSchemaVersion,
        request.Scenario,
        request.RecentTurns,
        request.Memory,
        request.PriorModuleOutcomes,
        request.InteractionType,
        request.PlayerInput,
        request.SessionState,
        request.CurrentProgressionNode,
        request.AllowedSignals,
        request.IncludeInterpretation);

    private sealed record ProviderDialoguePayload(
        string SchemaVersion,
        string ContextSchemaVersion,
        NarrativeScenarioInput Scenario,
        IReadOnlyList<NarrativeDialogueTurnInput> RecentTurns,
        NarrativeSessionMemoryInput Memory,
        IReadOnlyList<NarrativePriorModuleOutcomeInput> PriorModuleOutcomes,
        string InteractionType,
        string PlayerInput,
        NarrativeSessionStateInput SessionState,
        string? CurrentProgressionNode,
        IReadOnlyList<NarrativeAllowedSignal> AllowedSignals,
        bool IncludeInterpretation);

    private sealed class CapturingProvider : IAiTextProvider
    {
        public List<AiTextRequest> Requests { get; } = [];

        public Task<AiTextResponse> GenerateAsync(AiTextRequest request, CancellationToken cancellationToken)
        {
            Requests.Add(request);
            return Task.FromResult(new AiTextResponse(
                "{\"body\":\"The seal remains closed.\"}",
                new AiGenerationMetadata("test", "test", "response", null, null, 1, 1, "stop")));
        }

        public Task TestConnectionAsync(string provider, string credential, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
