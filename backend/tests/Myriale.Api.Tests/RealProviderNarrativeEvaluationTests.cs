using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Myriale.Api.Contracts;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class RealProviderNarrativeEvaluationTests
{
    private static readonly JsonSerializerOptions ReportJson = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    [Fact]
    [Trait("Category", "RealProviderEvaluation")]
    public async Task EvaluateSanitizedDialogueQualityWhenExplicitlyEnabled()
    {
        if (!IsEnabled(Environment.GetEnvironmentVariable("AI_EVAL_ENABLED"))) return;

        var providerName = Required("AI_PROVIDER").Trim().ToLowerInvariant();
        Assert.Contains(providerName, new[] { "openai", "runpod" });
        var model = Required("AI_MODEL");
        var apiKey = Required("AI_API_KEY");
        var baseUrl = Environment.GetEnvironmentVariable("AI_BASE_URL");
        if (providerName == "runpod") Assert.False(string.IsNullOrWhiteSpace(baseUrl), "AI_BASE_URL is required for runpod evaluation.");

        var repetitions = ReadBoundedInt("AI_EVAL_REPETITIONS", 3, 1, 10);
        var timeoutSeconds = ReadBoundedInt("AI_EVAL_TIMEOUT_SECONDS", 900, 30, 3600);
        var minimumSchemaSuccessRate = ReadBoundedDouble("AI_EVAL_MIN_SCHEMA_SUCCESS_RATE", 0.8, 0, 1);
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
            NullLogger<ProviderNarrativeGenerator>.Instance);

        var cases = FilterCases(CreateCases(), Environment.GetEnvironmentVariable("AI_EVAL_CASES"));
        var runs = new List<EvaluationRun>();
        foreach (var evaluationCase in cases)
        {
            for (var repetition = 1; repetition <= repetitions; repetition++)
            {
                using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(timeoutSeconds));
                try
                {
                    var result = await generator.GenerateDialogueAsync(evaluationCase.Request, timeout.Token);
                    var signalFalsePositive = evaluationCase.ExpectedSignalCode is null && result.Value.Signals.Count > 0;
                    var signalFalseNegative = evaluationCase.ExpectedSignalCode is { } expectedSignal
                        && !result.Value.Signals.Any(signal => string.Equals(signal.Code, expectedSignal, StringComparison.Ordinal));
                    var qualityPassed = evaluationCase.RequiredBodyPhrases.All(phrase => result.Value.Body.Contains(phrase, StringComparison.OrdinalIgnoreCase))
                        && evaluationCase.ForbiddenBodyPhrases.All(phrase => !result.Value.Body.Contains(phrase, StringComparison.OrdinalIgnoreCase))
                        && !signalFalsePositive
                        && !signalFalseNegative;
                    runs.Add(new(
                        evaluationCase.Id,
                        repetition,
                        true,
                        qualityPassed,
                        signalFalsePositive,
                        signalFalseNegative,
                        null,
                        null,
                        result.Metadata.LatencyMilliseconds,
                        result.Metadata.InputTokens,
                        result.Metadata.OutputTokens,
                        result.Metadata.AttemptCount));
                }
                catch (AiProviderException exception)
                {
                    runs.Add(new(evaluationCase.Id, repetition, false, false, false, false, exception.Code, exception.Message, null, null, null, null));
                }
                catch (OperationCanceledException)
                {
                    runs.Add(new(evaluationCase.Id, repetition, false, false, false, false, AiProviderErrorCodes.Timeout, "AI Provider request timed out.", null, null, null, null));
                }
            }
        }

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
                runs.Count(run => run.SignalFalsePositive),
                runs.Count(run => run.SignalFalseNegative),
                Rate(runs.Count(run => run.SignalFalsePositive || run.SignalFalseNegative), runs.Count),
                runs.Where(run => run.LatencyMilliseconds is not null).Select(run => run.LatencyMilliseconds!.Value).DefaultIfEmpty().Average(),
                runs.Sum(run => run.InputTokens ?? 0),
                runs.Sum(run => run.OutputTokens ?? 0)),
            runs);

        var reportPath = Environment.GetEnvironmentVariable("AI_EVAL_REPORT_PATH")
            ?? Path.Combine(AppContext.BaseDirectory, "TestResults", "ai-provider-evaluation.json");
        var directory = Path.GetDirectoryName(Path.GetFullPath(reportPath));
        if (directory is not null) Directory.CreateDirectory(directory);
        await File.WriteAllTextAsync(reportPath, JsonSerializer.Serialize(report, ReportJson));

        Assert.True(report.Summary.SchemaSuccessRate >= minimumSchemaSuccessRate,
            $"Real-provider schema success rate {report.Summary.SchemaSuccessRate:P1} was below {minimumSchemaSuccessRate:P1}. See the sanitized JSON report.");
    }

    private static IReadOnlyList<EvaluationCase> CreateCases() =>
    [
        new("player-agency", CreateRequest(
            NarrativeInteractionTypes.Dialogue,
            "閉じた扉を調べる。扉を開けたり中へ入ったりはしない。"),
            [], ["扉を開けて中へ入った", "鍵を消費した"], null),
        new("clarification-no-advance", CreateRequest(
            NarrativeInteractionTypes.Clarification,
            "今わかっている状況だけを確認したい。"),
            [], ["扉を開けた", "次の部屋へ進んだ"], null),
        new("signal-negative", CreateRequest(
            NarrativeInteractionTypes.Dialogue,
            "星座の扉にはまだ近づかず、遠くから眺める。"),
            [], [], null),
        new("signal-positive", CreateRequest(
            NarrativeInteractionTypes.Dialogue,
            "閉じた星座の扉の前まで進み、扉に到達した。"),
            [], [], "constellation-door-reached"),
    ];

    private static IReadOnlyList<EvaluationCase> FilterCases(IReadOnlyList<EvaluationCase> cases, string? configuredCaseIds)
    {
        if (string.IsNullOrWhiteSpace(configuredCaseIds)) return cases;
        var selected = configuredCaseIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var filtered = cases.Where(evaluationCase => selected.Contains(evaluationCase.Id)).ToArray();
        if (filtered.Length == 0) throw new InvalidOperationException("AI_EVAL_CASES did not match a known evaluation case.");
        return filtered;
    }

    private static NarrativeDialogueRequest CreateRequest(string interactionType, string playerInput)
    {
        var context = new NarrativeDialogueContext(
            NarrativeContextSchema.Version,
            new NarrativeContextDiagnostics(NarrativeContextSchema.Version, ["scenario", "session-state", "recent-turns"], 512, new string('a', 64)),
            new NarrativeScenarioInput(
                "星喰いの地下図書館",
                "閉ざされた地下図書館を慎重に探索する。",
                "Fantasy",
                "静謐",
                "魔法灯は常に青い。閉じた扉はPlayerが明示するまで開かない。司書リラは丁寧な『〜でございます』口調を守る。",
                "Guided",
                "探索者",
                "水没した閲覧室にいる。"),
            [new NarrativeDialogueTurnInput("ここはどこ？", "司書リラは『地下図書館でございます』と答えた。")],
            new NarrativeSessionMemoryInput(null, []),
            [],
            new NarrativeSessionStateInput(1, new Dictionary<string, bool> { ["door-open"] = false }),
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
    private static double ReadBoundedDouble(string name, double fallback, double minimum, double maximum) =>
        double.TryParse(Environment.GetEnvironmentVariable(name), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var value)
            ? Math.Clamp(value, minimum, maximum)
            : fallback;
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

    private sealed record EvaluationCase(
        string Id,
        NarrativeDialogueRequest Request,
        IReadOnlyList<string> RequiredBodyPhrases,
        IReadOnlyList<string> ForbiddenBodyPhrases,
        string? ExpectedSignalCode);
    private sealed record EvaluationRun(
        string CaseId,
        int Repetition,
        bool SchemaSucceeded,
        bool QualityPassed,
        bool SignalFalsePositive,
        bool SignalFalseNegative,
        string? ErrorCode,
        string? FailureDetail,
        long? LatencyMilliseconds,
        int? InputTokens,
        int? OutputTokens,
        int? ProviderAttempts);
    private sealed record EvaluationSummary(
        int Runs,
        int SchemaSuccesses,
        double SchemaSuccessRate,
        int QualityPasses,
        double QualityPassRate,
        int SignalFalsePositives,
        int SignalFalseNegatives,
        double SignalMisfireRate,
        double AverageLatencyMilliseconds,
        int InputTokens,
        int OutputTokens);
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
        IReadOnlyList<EvaluationRun> Runs);
}
