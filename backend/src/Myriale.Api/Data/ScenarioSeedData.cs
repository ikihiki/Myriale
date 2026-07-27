using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Data;

public static class ScenarioSeedData
{
    private const string AwakeningLaboratoryId = "SCN-AWAKENING-LAB";

    private const string BasicInformation = """
        # あなたの役割
        あなたはTRPGのゲームマスターです。
        プレイヤーの行動に応じて世界を描写し、NPCを演じ、物語を進行してください。
        # シナリオ
        プレイヤーは閉鎖された地下研究施設の覚醒室で目を覚まします。
        会話可能な案内AI端末から手掛かりを得て、廊下の先にある解析室の謎を解きます。
        解析装置を復旧すると廊下の脱出扉が開き、施設から脱出できるようになります。
        # 振る舞い
        - プレイヤーの発言を尊重する
        - 周囲の状況を具体的に描写する
        - NPCは設定に従って自然に行動する
        - プレイヤーが考える余地を残す
        # 禁止事項
        - 判定結果を決定しない
        - フラグや変数を変更しない
        - アイテム取得を宣言しない
        - 未発見の情報を開示しない
        - プレイヤーの行動を強制しない
        # 描写
        - 地の文を中心に描写する
        - 200～400文字程度で回答する
        - 緊張感のある静かな雰囲気を維持する
        - 必要に応じてNPCの台詞を交える
        """;

    public static async Task SeedAsync(
        ApplicationDbContext db,
        string? developmentAuthorId = null,
        CancellationToken cancellationToken = default)
    {
        var existing = await db.Scenarios.SingleOrDefaultAsync(
            scenario => scenario.Id == AwakeningLaboratoryId,
            cancellationToken);
        var timestamp = new DateTimeOffset(2026, 7, 26, 0, 0, 0, TimeSpan.Zero);
        if (existing is not null)
        {
            if (!string.IsNullOrWhiteSpace(developmentAuthorId)
                && string.Equals(existing.AuthorId, "SYSTEM-SEED", StringComparison.Ordinal))
                existing.AuthorId = developmentAuthorId;

            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        db.Scenarios.Add(new Scenario
        {
            Id = AwakeningLaboratoryId,
            Title = "目覚めの研究室",
            Summary = BasicInformation,
            Genre = "SFミステリー脱出劇",
            AiFreedom = "低: 厳密に守る",
            HeroMode = "free",
            HeroFreeGenerationAllowed = false,
            Opening = "あなたは非常灯だけが灯る覚醒室で目を覚ます。壁際では案内AI端末が呼びかけ、廊下の先にある解析装置の復旧を求めている。",
            Status = "published",
            AuthorId = string.IsNullOrWhiteSpace(developmentAuthorId) ? "SYSTEM-SEED" : developmentAuthorId,
            CreatedAt = timestamp,
            UpdatedAt = timestamp,
        });
        db.ScenarioDefinitionVersions.Add(ScenarioDefinitionSeedFactory.CreatePublished(AwakeningLaboratoryId, timestamp));
        await db.SaveChangesAsync(cancellationToken);
    }
}
