namespace Myriale.Api.Features.Dashboard.Contracts;

public sealed record HomeDashboardResponse(
    AccountSummaryDto Account,
    IReadOnlyList<PlaySessionSummaryDto> ActiveSessions,
    IReadOnlyList<ScenarioSummaryDto> RecommendedScenarios);
