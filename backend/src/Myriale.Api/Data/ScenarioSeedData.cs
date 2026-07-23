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
        プレイヤーは閉鎖された地下研究施設で目を覚まします。
        記憶を失っており、自身の正体も施設の目的も知りません。
        探索や会話を通して真実を知り、最終的に施設から脱出することが目的です。
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

    public static async Task SeedAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        if (await db.Scenarios.AnyAsync(scenario => scenario.Id == AwakeningLaboratoryId, cancellationToken)) return;

        var timestamp = new DateTimeOffset(2026, 7, 23, 0, 0, 0, TimeSpan.Zero);
        db.Scenarios.Add(new Scenario
        {
            Id = AwakeningLaboratoryId,
            Title = "目覚めの研究室",
            Summary = BasicInformation,
            Genre = "SFミステリー脱出劇",
            Tone = "緊張感のある静かな雰囲気",
            AiFreedom = "低: 厳密に守る",
            HeroMode = "free",
            HeroFreeGenerationAllowed = false,
            Opening = "あなたは閉鎖された地下研究施設で目を覚ます。記憶は失われ、自身の正体も施設の目的も分からない。",
            Status = "published",
            AuthorId = "SYSTEM-SEED",
            CreatedAt = timestamp,
            UpdatedAt = timestamp,
        });
        await db.SaveChangesAsync(cancellationToken);
    }
}
