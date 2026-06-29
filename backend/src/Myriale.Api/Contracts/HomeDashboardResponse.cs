namespace Myriale.Api.Contracts;

public sealed record HomeDashboardResponse(
    AccountSummaryDto Account,
    IReadOnlyList<PlaySessionSummaryDto> ResumableSessions,
    IReadOnlyList<ScenarioSummaryDto> RecommendedScenarios);
