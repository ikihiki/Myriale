using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public sealed class DemoHomeDashboardService(IPlaySessionListingService sessions) : IHomeDashboardService
{
    public async Task<HomeDashboardResponse> GetDashboardAsync(string ownerId, CancellationToken cancellationToken)
    {
        var resumableSessions = await sessions.ListRejoinableAsync(ownerId, cancellationToken);
        return new HomeDashboardResponse(
            Account: new AccountSummaryDto(
                DisplayName: "ミリア",
                Email: "reader@myriale.example",
                Initials: "ミリ",
                Role: "Reader",
                UnreadNotifications: 2,
                CurrentWorkspaceName: "Myriale Library"),
            ResumableSessions: resumableSessions,
            RecommendedScenarios:
            [
                new ScenarioSummaryDto(
                    Id: "SCN-STAR-LIBRARY",
                    Title: "星喰いの地下図書館",
                    Genre: "ダークファンタジー探索譚",
                    Status: "published",
                    UpdatedAt: new DateOnly(2026, 7, 19),
                    Summary: "地下に沈んだ王都で、禁書を読むたびに星座が書き換わる探索譚。",
                    HeroMode: "select",
                    HeroFreeGenerationAllowed: false,
                    Hero: "ミラ / 星図を読む巡礼者\nセオ / 星図を燃やす護衛\nエル / 記憶を失った写字生"),
                new ScenarioSummaryDto(
                    Id: "SCN-NEON-ARCHIVE",
                    Title: "ネオン喰いの地下データ書庫",
                    Genre: "サイバーパンク潜入スリラー",
                    Status: "published",
                    UpdatedAt: new DateOnly(2026, 7, 23),
                    Summary: "酸性雨に沈む企業都市の地下で、量子鍵と星図デッキを携え、記憶を焼く禁制アーカイブと閉鎖ゲートを突破する潜入譚。",
                    HeroMode: "select",
                    HeroFreeGenerationAllowed: false,
                    Hero: "レイ / 失われた記憶を追うネットランナー\nジン / 企業警備を裏切ったクローム傭兵\nミオ / 禁制アーカイブから逃げた合成人格"),
                new ScenarioSummaryDto(
                    Id: "SCN-ASH-STATION",
                    Title: "灰の駅と宛名のない切符",
                    Genre: "終末ロードムービー",
                    Status: "published",
                    UpdatedAt: new DateOnly(2026, 7, 19),
                    Summary: "朝が来ない荒野を、宛名のない切符だけを頼りに渡るロードムービー。",
                    HeroMode: "free",
                    HeroFreeGenerationAllowed: false,
                    Hero: "灰の駅で目覚めた旅人。名前と過去はプレイヤーが自由に決められる。"),
                new ScenarioSummaryDto(
                    Id: "SCN-GLASS-FOREST",
                    Title: "硝子の森と夜明けの司書",
                    Genre: "幻想ミステリ",
                    Status: "published",
                    UpdatedAt: new DateOnly(2026, 7, 19),
                    Summary: "嘘を映す硝子の森で、夜明けを失った書架の秘密を追う幻想ミステリ。",
                    HeroMode: "fixed",
                    HeroFreeGenerationAllowed: false,
                    Hero: "リュシエン / 夜明け前の森を巡る司書")
            ]);
    }
}
