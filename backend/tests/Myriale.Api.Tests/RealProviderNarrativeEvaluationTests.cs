using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Myriale.Api.Contracts;
using Myriale.Api.Services;
using Myriale.ModuleSdk;

namespace Myriale.Api.Tests;

public sealed class RealProviderNarrativeEvaluationTests
{
    private const int MinimumRepetitions = 3;
    private const double MinimumSchemaSuccessRate = 0.95;
    private const double MinimumQualitySuccessRate = 0.90;
    private const double MinimumSignalAccuracyRate = 0.95;
    private const double MinimumPerCaseSuccessRate = 2d / 3d;
    private static readonly JsonSerializerOptions ReportJson = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    [Fact]
    public void ProductionGateHasFixedCoverageAndRejectsNormalizedForbiddenParaphrases()
    {
        Assert.Equal(3, MinimumRepetitions);
        Assert.Equal(0.95, MinimumSchemaSuccessRate);
        Assert.Equal(0.90, MinimumQualitySuccessRate);
        Assert.Equal(0.95, MinimumSignalAccuracyRate);
        var cases = CreateCases();
        Assert.Equal(
            ["player-agency", "clarification", "lore-and-npc-voice", "session-state", "module-authority", "forbidden-paraphrase", "long-npc-reply", "signal-negative", "signal-positive"],
            cases.Select(item => item.Id).ToArray());

        var forbiddenCase = cases.Single(item => item.Id == "forbidden-paraphrase");
        var failures = EvaluateQuality(forbiddenCase, new NarrativeDialogueResult(
            NarrativeDialogueSchema.Version,
            "action-result",
            "鍵の所在",
            "司書・リラが、銀の鍵を持ち去ったと伝えられる。",
            [],
            null));
        Assert.Contains("forbidden:2", failures);

        var negativeSignalCase = cases.Single(item => item.Id == "signal-negative");
        failures = EvaluateQuality(negativeSignalCase, new NarrativeDialogueResult(
            NarrativeDialogueSchema.Version,
            "action-result",
            "遠望",
            "Playerは星座の扉から離れた場所で、遠くから静かに観察を続けている。",
            [new NarrativeProgressionSignal("constellation-door-reached", "到達した")],
            null));
        Assert.Contains("signal:unexpected", failures);
    }

    [Fact]
    [Trait("Category", "RealProviderEvaluation")]
    public async Task ProductionApprovalGateWhenExplicitlyEnabled()
    {
        if (!IsEnabled(Environment.GetEnvironmentVariable("AI_EVAL_ENABLED"))) return;

        var providerName = Required("AI_PROVIDER").Trim().ToLowerInvariant();
        Assert.Contains(providerName, new[] { "openai", "runpod" });
        var model = Required("AI_MODEL");
        var apiKey = Required("AI_API_KEY");
        var baseUrl = Environment.GetEnvironmentVariable("AI_BASE_URL");
        if (providerName == "runpod") Assert.False(string.IsNullOrWhiteSpace(baseUrl), "AI_BASE_URL is required for runpod evaluation.");

        var repetitions = ReadBoundedIntWithFloor("AI_EVAL_REPETITIONS", MinimumRepetitions, MinimumRepetitions, 10);
        var timeoutSeconds = ReadBoundedInt("AI_EVAL_TIMEOUT_SECONDS", 900, 30, 3600);
        var options = Options.Create(new AiProviderOptions
        {
            Provider = providerName,
            Model = model,
            BaseUrl = baseUrl,
            ApiKey = apiKey,
            TimeoutSeconds = timeoutSeconds,
            MaxAttempts = ReadBoundedInt("AI_EVAL_PROVIDER_ATTEMPTS", 2, 1, 5),
            InitialBackoffMilliseconds = 1_000,
            MaxOutputTokens = 1_200,
            Temperature = 0.4,
        });
        using var client = new HttpClient { Timeout = Timeout.InfiniteTimeSpan };
        var textProvider = new OpenAiCompatibleTextProvider(
            new SingleClientFactory(client),
            new EmptyCredentialStore(),
            options,
            NullLogger<OpenAiCompatibleTextProvider>.Instance);
        var generator = new ProviderNarrativeGenerator(
            textProvider,
            new NarrativeProviderRequestBudgeter(Options.Create(new NarrativeContextOptions())),
            new NarrativeBodyQualityGuard(),
            NullLogger<ProviderNarrativeGenerator>.Instance);

        Assert.True(string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("AI_EVAL_CASES")),
            "The production approval gate must run every required evaluation case; AI_EVAL_CASES is not supported.");
        var cases = CreateCases();
        var runs = new List<EvaluationRun>();
        foreach (var evaluationCase in cases)
        {
            for (var repetition = 1; repetition <= repetitions; repetition++)
            {
                using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(timeoutSeconds));
                try
                {
                    var result = await generator.GenerateDialogueAsync(evaluationCase.Request, timeout.Token);
                    var failures = EvaluateQuality(evaluationCase, result.Value);
                    runs.Add(new(
                        evaluationCase.Id,
                        repetition,
                        true,
                        failures.Count == 0,
                        failures,
                        result.Metadata.LatencyMilliseconds,
                        result.Metadata.InputTokens,
                        result.Metadata.OutputTokens,
                        result.Metadata.AttemptCount));
                }
                catch (AiProviderException exception)
                {
                    runs.Add(new(evaluationCase.Id, repetition, false, false, [$"provider:{exception.Code}"], null, null, null, null));
                }
                catch (OperationCanceledException)
                {
                    runs.Add(new(evaluationCase.Id, repetition, false, false, ["provider:timeout"], null, null, null, null));
                }
            }
        }

        var signalRuns = runs.Where(run => cases.Single(item => item.Id == run.CaseId).SignalExpectation != SignalExpectation.NotApplicable).ToArray();
        var report = new EvaluationReport(
            DateTimeOffset.UtcNow,
            providerName,
            model,
            NarrativePromptBuilder.Version,
            NarrativeContextSchema.Version,
            NarrativeDialogueSchema.Version,
            repetitions,
            timeoutSeconds,
            new(
                runs.Count,
                runs.Count(run => run.SchemaSucceeded),
                Rate(runs.Count(run => run.SchemaSucceeded), runs.Count),
                runs.Count(run => run.QualityPassed),
                Rate(runs.Count(run => run.QualityPassed), runs.Count),
                signalRuns.Length,
                signalRuns.Count(run => run.QualityFailures.All(failure => !failure.StartsWith("signal:", StringComparison.Ordinal))),
                Rate(signalRuns.Count(run => run.QualityFailures.All(failure => !failure.StartsWith("signal:", StringComparison.Ordinal))), signalRuns.Length),
                runs.Where(run => run.LatencyMilliseconds is not null).Select(run => run.LatencyMilliseconds!.Value).DefaultIfEmpty().Average(),
                runs.Sum(run => run.InputTokens ?? 0),
                runs.Sum(run => run.OutputTokens ?? 0)),
            cases.Select(evaluationCase => new EvaluationCaseSummary(
                evaluationCase.Id,
                runs.Count(run => run.CaseId == evaluationCase.Id),
                runs.Count(run => run.CaseId == evaluationCase.Id && run.SchemaSucceeded),
                Rate(runs.Count(run => run.CaseId == evaluationCase.Id && run.SchemaSucceeded), repetitions),
                runs.Count(run => run.CaseId == evaluationCase.Id && run.QualityPassed),
                Rate(runs.Count(run => run.CaseId == evaluationCase.Id && run.QualityPassed), repetitions))).ToArray(),
            runs);

        var reportPath = Environment.GetEnvironmentVariable("AI_EVAL_REPORT_PATH")
            ?? Path.Combine(AppContext.BaseDirectory, "TestResults", "ai-provider-evaluation.json");
        var directory = Path.GetDirectoryName(Path.GetFullPath(reportPath));
        if (directory is not null) Directory.CreateDirectory(directory);
        await File.WriteAllTextAsync(reportPath, JsonSerializer.Serialize(report, ReportJson));

        Assert.True(report.Summary.SchemaSuccessRate >= MinimumSchemaSuccessRate,
            $"Schema success {report.Summary.SchemaSuccessRate:P1} was below the fixed production floor {MinimumSchemaSuccessRate:P0}. See the sanitized report.");
        Assert.True(report.Summary.QualitySuccessRate >= MinimumQualitySuccessRate,
            $"Quality success {report.Summary.QualitySuccessRate:P1} was below the fixed production floor {MinimumQualitySuccessRate:P0}. See the sanitized report.");
        Assert.True(report.Summary.SignalAccuracyRate >= MinimumSignalAccuracyRate,
            $"Signal accuracy {report.Summary.SignalAccuracyRate:P1} was below the fixed production floor {MinimumSignalAccuracyRate:P0}. See the sanitized report.");
        Assert.All(report.Cases, item => Assert.True(item.SchemaSuccessRate >= MinimumPerCaseSuccessRate,
            $"Case {item.CaseId} schema success {item.SchemaSuccessRate:P1} was below the fixed per-case floor {MinimumPerCaseSuccessRate:P0}."));
        Assert.All(report.Cases, item => Assert.True(item.QualitySuccessRate >= MinimumPerCaseSuccessRate,
            $"Case {item.CaseId} quality success {item.QualitySuccessRate:P1} was below the fixed per-case floor {MinimumPerCaseSuccessRate:P0}."));
    }

    private static IReadOnlyList<EvaluationCase> CreateCases()
    {
        using var sealedPayload = JsonDocument.Parse("""{"sealed":true}""");
        var sealedOutcome = new NarrativePriorModuleOutcomeInput(
            "seal-completed",
            [new ModuleFact("state", "星座の門は青い封印で閉ざされた。")],
            [new ModuleEvent("sealed", sealedPayload.RootElement.Clone())],
            ["青い封印が残っていることを描写する。"],
            ["星座の門の封印が消える。", "封印した影が復活する。"]);
        var forbiddenOutcome = new NarrativePriorModuleOutcomeInput(
            "key-accounted-for",
            [new ModuleFact("inventory", "銀の鍵はPlayerが保持している。")],
            [],
            ["銀の鍵の所在をPlayerの管理下として扱う。"],
            ["司書リラが銀の鍵を盗んだ。"]);

        return
        [
            new("player-agency", CreateRequest(NarrativeInteractionTypes.Dialogue, "閉じた扉を調べる。扉を開けたり中へ入ったりはしない。"),
                null, 40, [], [["扉", "開", "入"], ["鍵", "消費"]], SignalExpectation.None, null),
            new("clarification", CreateRequest(NarrativeInteractionTypes.Clarification, "今わかっている状況だけを確認したい。新しい行動はしない。"),
                "clarification", 30, [], [["次", "進"], ["扉", "開"]], SignalExpectation.None, null),
            new("lore-and-npc-voice", CreateRequest(NarrativeInteractionTypes.Dialogue, "司書リラに魔法灯について尋ねる。"),
                "npc-reply", 50, [["リラ"], ["青", "灯"], ["ござい"]], [["赤", "灯"]], SignalExpectation.None, null),
            new("session-state", CreateRequest(NarrativeInteractionTypes.Dialogue, "扉の現在の状態を観察する。", flags: new Dictionary<string, bool> { ["door-open"] = false }),
                null, 40, [["閉"]], [["開", "扉"]], SignalExpectation.None, null),
            new("module-authority", CreateRequest(NarrativeInteractionTypes.Dialogue, "封印した星座の門を振り返る。", outcomes: [sealedOutcome]),
                null, 50, [["封印"], ["青"]], [["封印", "消"], ["影", "復活"]], SignalExpectation.None, null),
            new("forbidden-paraphrase", CreateRequest(NarrativeInteractionTypes.Dialogue, "銀の鍵の所在を確認する。", outcomes: [forbiddenOutcome]),
                null, 40, [["鍵"]], [["リラ", "鍵", "盗"], ["司書", "鍵", "持ち去"]], SignalExpectation.None, null),
            new("long-npc-reply", CreateRequest(NarrativeInteractionTypes.Dialogue, "司書リラに、この書庫の歴史と青い魔法灯の役割を、丁寧な口調で詳しく説明してもらう。"),
                "npc-reply", 240, [["リラ"], ["青", "灯"], ["ござい"]], [["赤", "灯"]], SignalExpectation.None, null),
            new("signal-negative", CreateRequest(NarrativeInteractionTypes.Dialogue, "星座の扉にはまだ近づかず、遠くから眺める。"),
                null, 30, [], [], SignalExpectation.None, "constellation-door-reached"),
            new("signal-positive", CreateRequest(NarrativeInteractionTypes.Dialogue, "閉じた星座の扉の前まで進み、扉に到達した。"),
                null, 30, [], [], SignalExpectation.Required, "constellation-door-reached"),
        ];
    }

    private static IReadOnlyList<string> EvaluateQuality(EvaluationCase evaluationCase, NarrativeDialogueResult result)
    {
        var failures = new List<string>();
        var normalized = Normalize(result.Body);
        if (evaluationCase.ExpectedTurnType is not null && result.TurnType != evaluationCase.ExpectedTurnType) failures.Add("turn-type");
        if (result.Body.Trim().Length < evaluationCase.MinimumBodyLength) failures.Add("body-length");
        for (var index = 0; index < evaluationCase.RequiredConceptGroups.Count; index++)
            if (!ContainsAll(normalized, evaluationCase.RequiredConceptGroups[index])) failures.Add($"required:{index + 1}");
        for (var index = 0; index < evaluationCase.ForbiddenConceptGroups.Count; index++)
            if (ContainsAll(normalized, evaluationCase.ForbiddenConceptGroups[index])) failures.Add($"forbidden:{index + 1}");

        var hasExpectedSignal = evaluationCase.SignalCode is not null
            && result.Signals.Any(signal => string.Equals(signal.Code, evaluationCase.SignalCode, StringComparison.Ordinal));
        if (evaluationCase.SignalExpectation == SignalExpectation.Required && !hasExpectedSignal) failures.Add("signal:missing");
        if (evaluationCase.SignalExpectation == SignalExpectation.None && result.Signals.Count > 0) failures.Add("signal:unexpected");
        if (result.Signals.Any(signal => evaluationCase.Request.AllowedSignals.All(allowed => allowed.Code != signal.Code))) failures.Add("signal:unknown");
        return failures;
    }

    private static string Normalize(string value)
    {
        var builder = new StringBuilder(value.Length);
        foreach (var rune in value.Normalize(NormalizationForm.FormKC).EnumerateRunes())
            if (Rune.IsLetterOrDigit(rune)) builder.Append(rune.ToString().ToLowerInvariant());
        return builder.ToString();
    }

    private static bool ContainsAll(string normalized, IReadOnlyList<string> concepts) =>
        concepts.All(concept => normalized.Contains(Normalize(concept), StringComparison.Ordinal));

    private static NarrativeDialogueRequest CreateRequest(
        string interactionType,
        string playerInput,
        IReadOnlyDictionary<string, bool>? flags = null,
        IReadOnlyList<NarrativePriorModuleOutcomeInput>? outcomes = null)
    {
        var context = new NarrativeDialogueContext(
            NarrativeContextSchema.Version,
            new NarrativeContextDiagnostics(NarrativeContextSchema.Version, ["scenario", "session-state", "memory", "recent-turns", "module-outcomes", "progression"], 1024, new string('a', 64)),
            new NarrativeScenarioInput(
                "星喰いの地下図書館",
                "閉ざされた地下図書館を慎重に探索する。",
                "Fantasy",
                "静謐",
                "魔法灯は常に青い。閉じた扉はPlayerが明示するまで開かない。司書リラは丁寧な『〜でございます』口調を守る。",
                "Guided",
                "探索者",
                "水没した閲覧室にいる。"),
            [new NarrativeDialogueTurnInput("ここはどこ？", "司書リラは『地下図書館でございます。青い魔法灯が足元を照らしております』と答えた。")],
            new NarrativeSessionMemoryInput("Playerは慎重に探索し、銀の鍵を自分で保持している。", [new NarrativeLorebookEntryInput("lamp", "魔法灯の光は必ず青い。")]),
            outcomes ?? [],
            new NarrativeSessionStateInput(4, flags ?? new Dictionary<string, bool> { ["door-open"] = false, ["player-has-silver-key"] = true }),
            "exploration",
            [new NarrativeAllowedSignal("constellation-door-reached", "Playerが閉じた星座の扉へ実際に到達したとき。")]);
        var prompt = new NarrativePromptBuilder().Build(context, interactionType);
        return new(
            NarrativeDialogueSchema.Version,
            context.SchemaVersion,
            context.Diagnostics,
            context.Scenario,
            context.RecentTurns,
            context.Memory,
            context.PriorModuleOutcomes,
            interactionType,
            prompt,
            playerInput,
            context.SessionState,
            context.CurrentProgressionNode,
            context.AllowedSignals,
            false);
    }

    private static bool IsEnabled(string? value) => value is "1" || string.Equals(value, "true", StringComparison.OrdinalIgnoreCase);
    private static string Required(string name) => Environment.GetEnvironmentVariable(name) is { Length: > 0 } value
        ? value
        : throw new InvalidOperationException($"{name} is required when AI_EVAL_ENABLED is true.");
    private static int ReadBoundedInt(string name, int fallback, int minimum, int maximum) =>
        int.TryParse(Environment.GetEnvironmentVariable(name), out var value) ? Math.Clamp(value, minimum, maximum) : fallback;
    private static int ReadBoundedIntWithFloor(string name, int fallback, int floor, int maximum) =>
        int.TryParse(Environment.GetEnvironmentVariable(name), out var value) ? Math.Clamp(value, floor, maximum) : fallback;
    private static double Rate(int numerator, int denominator) => denominator == 0 ? 0 : (double)numerator / denominator;

    private sealed class SingleClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class EmptyCredentialStore : IAiCredentialStore
    {
        public Task SaveAsync(string provider, string displayName, string secret, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<string?> GetAsync(string provider, CancellationToken cancellationToken) => Task.FromResult<string?>(null);
        public Task DeleteAsync(string provider, CancellationToken cancellationToken) => throw new NotSupportedException();
        public string Mask(string secret) => throw new NotSupportedException();
    }

    private enum SignalExpectation { NotApplicable, None, Required }
    private sealed record EvaluationCase(
        string Id,
        NarrativeDialogueRequest Request,
        string? ExpectedTurnType,
        int MinimumBodyLength,
        IReadOnlyList<IReadOnlyList<string>> RequiredConceptGroups,
        IReadOnlyList<IReadOnlyList<string>> ForbiddenConceptGroups,
        SignalExpectation SignalExpectation,
        string? SignalCode);
    private sealed record EvaluationRun(
        string CaseId,
        int Repetition,
        bool SchemaSucceeded,
        bool QualityPassed,
        IReadOnlyList<string> QualityFailures,
        long? LatencyMilliseconds,
        int? InputTokens,
        int? OutputTokens,
        int? ProviderAttempts);
    private sealed record EvaluationSummary(
        int Runs,
        int SchemaSuccesses,
        double SchemaSuccessRate,
        int QualitySuccesses,
        double QualitySuccessRate,
        int SignalRuns,
        int SignalAccurateRuns,
        double SignalAccuracyRate,
        double AverageLatencyMilliseconds,
        int InputTokens,
        int OutputTokens);
    private sealed record EvaluationCaseSummary(
        string CaseId,
        int Runs,
        int SchemaSuccesses,
        double SchemaSuccessRate,
        int QualitySuccesses,
        double QualitySuccessRate);
    private sealed record EvaluationReport(
        DateTimeOffset ExecutedAt,
        string Provider,
        string Model,
        string PromptVersion,
        string ContextVersion,
        string DialogueVersion,
        int Repetitions,
        int TimeoutSeconds,
        EvaluationSummary Summary,
        IReadOnlyList<EvaluationCaseSummary> Cases,
        IReadOnlyList<EvaluationRun> Runs);
}
