using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public sealed class DemoHomeDashboardService : IHomeDashboardService
{
    public Task<HomeDashboardResponse> GetDashboardAsync(CancellationToken cancellationToken)
    {
        var response = new HomeDashboardResponse(
            Account: new AccountSummaryDto(
                DisplayName: "ミリア",
                Email: "reader@myriale.example",
                Initials: "ミリ",
                Role: "Reader",
                UnreadNotifications: 2,
                CurrentWorkspaceName: "Myriale Library"),
            ResumableSessions:
            [
                new PlaySessionSummaryDto(
                    Id: "SES-PREP-1098",
                    ScenarioId: "SCN-001",
                    ScenarioTitle: "月影の図書館",
                    State: "Paused",
                    HeroName: "リュカ",
                    Turn: 14,
                    Summary: "禁書庫の扉を開く直前で中断しています。",
                    TurnDisplay: "第14ターン"),
                new PlaySessionSummaryDto(
                    Id: "SES-ACT-2042",
                    ScenarioId: "SCN-002",
                    ScenarioTitle: "霧の港町",
                    State: "Active",
                    HeroName: "ノア",
                    Turn: 7,
                    Summary: "灯台守への聞き込みを継続できます。",
                    TurnDisplay: "第7ターン")
            ],
            RecommendedScenarios:
            [
                new ScenarioSummaryDto(
                    Id: "SCN-001",
                    Title: "月影の図書館",
                    Genre: "Mystery",
                    Status: "published",
                    UpdatedAt: new DateOnly(2026, 6, 10),
                    Summary: "古い魔導図書館で失われた索引を探す短編シナリオ。"),
                new ScenarioSummaryDto(
                    Id: "SCN-002",
                    Title: "霧の港町",
                    Genre: "Fantasy",
                    Status: "published",
                    UpdatedAt: new DateOnly(2026, 6, 12),
                    Summary: "濃霧に包まれた港町で、消えた船員の行方を追います。"),
                new ScenarioSummaryDto(
                    Id: "SCN-003",
                    Title: "星屑のキャラバン",
                    Genre: "Adventure",
                    Status: "published",
                    UpdatedAt: new DateOnly(2026, 6, 18),
                    Summary: "砂漠を渡る隊商とともに星読みの遺跡を目指します。")
            ]);

        return Task.FromResult(response);
    }
}
