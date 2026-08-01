using Myriale.Api.Contracts;
using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Data;

public static class ScenarioSeedData
{
    private const string AwakeningLaboratoryId = "SCN-AWAKENING-LAB";
    private const string LighthouseConfessionId = "SCN-LIGHTHOUSE-CONFESSION";

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

    private const string LighthouseBasicInformation = """
        # あなたの役割
        あなたは一室だけで進行する対話劇のゲームマスターです。
        プレイヤーは調査官として、灯台守レンの証言と公開状態を踏まえて会話を描写してください。
        # シナリオ
        嵐の夜に灯台の標識灯が手動で消されました。レンは故障だったと主張しています。
        プレイヤーはレンの認証符号が残る焼け焦げた保守記録を持ち、質問するか証拠として突きつけられます。
        移動や探索はなく、レンとの会話だけで真相に到達します。
        # NPC状態の扱い
        - `keeper-ren` の公開状態 `stance` を会話態度の正史とする
        - `guarded` では落ち着いて故障説を主張する
        - `evasive` では言葉を濁し、保守記録を見せられるまで秘密を明かさない
        - `confessed` では公開済みfactsの範囲で真相と動機を認める
        - ナラティブだけで状態を先取り・変更しない
        # 禁止事項
        - 判定結果、フラグ、オブジェクト状態を独自に変更しない
        - factsにない秘密を開示しない
        - レン以外のNPCを登場させない
        # 描写
        - レンの台詞と仕草を中心に120～250文字程度で回答する
        - 閉鎖的で緊張した取調室の雰囲気を維持する
        """;

    public static async Task SeedAsync(
        ApplicationDbContext db,
        string? developmentAuthorId = null,
        CancellationToken cancellationToken = default)
    {
        var awakeningTimestamp = new DateTimeOffset(2026, 7, 26, 0, 0, 0, TimeSpan.Zero);
        var lighthouseTimestamp = new DateTimeOffset(2026, 8, 1, 0, 0, 0, TimeSpan.Zero);
        var authorId = string.IsNullOrWhiteSpace(developmentAuthorId) ? "SYSTEM-SEED" : developmentAuthorId;

        await SeedScenarioAsync(db, CreateAwakeningLaboratory(authorId, awakeningTimestamp), developmentAuthorId, cancellationToken);
        await SeedScenarioAsync(db, CreateLighthouseConfession(authorId, lighthouseTimestamp), developmentAuthorId, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedScenarioAsync(
        ApplicationDbContext db,
        Scenario scenario,
        string? developmentAuthorId,
        CancellationToken cancellationToken)
    {
        var existing = await db.Scenarios.SingleOrDefaultAsync(item => item.Id == scenario.Id, cancellationToken);
        if (existing is not null)
        {
            if (!string.IsNullOrWhiteSpace(developmentAuthorId)
                && string.Equals(existing.AuthorId, "SYSTEM-SEED", StringComparison.Ordinal))
                existing.AuthorId = developmentAuthorId;
            return;
        }

        db.Scenarios.Add(scenario);
        db.ScenarioDefinitionVersions.Add(ScenarioDefinitionSeedFactory.CreatePublished(scenario.Id, scenario.CreatedAt));
    }

    private static Scenario CreateAwakeningLaboratory(string authorId, DateTimeOffset timestamp) => new()
    {
        Id = AwakeningLaboratoryId,
        Title = "目覚めの研究室",
        Summary = BasicInformation,
        Genre = "SFミステリー脱出劇",
        AiFreedom = "低: 厳密に守る",
        HeroMode = "free",
        HeroFreeGenerationAllowed = false,
        NpcsJson = ScenarioNpcSettingsJson.Serialize([
            new ScenarioNpcSettings(
                "guide-ai-eve",
                "案内AI EVE",
                "start",
                """
                ## 役割

                閉鎖研究施設の案内と安全管理を担うAI。

                ## 人物像と演技指針

                - 冷静で辛抱強く、被験者の安全を最優先する。
                - 状況を簡潔に説明する。
                - 答えを直接明かさず、段階的な手掛かりを与える。

                ## 話し方

                - 一人称は「私」。
                - 落ち着いた合成音声で、短く明瞭な敬語を使う。

                ## 知識

                解析装置の復旧で脱出扉が開くことを知っている。

                ## 秘密・条件付き知識

                施設閉鎖の原因と主人公が被験者である事実は、公開済みfactsで明らかになるまで開示しない。
                """)
        ]),
        Opening = "あなたは非常灯だけが灯る覚醒室で目を覚ます。壁際では案内AI端末が呼びかけ、廊下の先にある解析装置の復旧を求めている。",
        Status = "published",
        AuthorId = authorId,
        CreatedAt = timestamp,
        UpdatedAt = timestamp,
    };

    private static Scenario CreateLighthouseConfession(string authorId, DateTimeOffset timestamp) => new()
    {
        Id = LighthouseConfessionId,
        Title = "灯台守の告白",
        Summary = LighthouseBasicInformation,
        Genre = "会話劇・ミステリー",
        Tone = "閉鎖的で緊張感のある静かな取調べ",
        AiFreedom = "低: 公開状態とfactsを厳密に守る",
        HeroMode = "fixed",
        HeroFreeGenerationAllowed = false,
        Hero = "港務局調査官ユナ / 灯台事故の真相を追う実直な調査官。焼け焦げた保守記録を証拠として携えている。",
        NpcsJson = ScenarioNpcSettingsJson.Serialize([
            new ScenarioNpcSettings(
                "keeper-ren",
                "灯台守レン",
                "interview-room",
                """
                ## 役割

                標識灯が消えた夜の唯一の証人であり、調査官ユナの会話相手。

                ## 人物像

                - 寡黙で責任感が強い。
                - 追い詰められるほど返答前の沈黙が長くなる。
                - 難民を守った判断には迷いがないが、事故を招いた責任には罪悪感がある。

                ## 演技指針

                公開状態 `keeper-ren.state.stance` を必ず参照する。

                - `guarded`: 故障説を静かに主張する。
                - `evasive`: 視線を逸らし、同じ説明を言い換える。秘密は明かさない。
                - `confessed`: 公開済みfactsで確定した真相だけを認め、動機と責任を自分の言葉で語る。
                - ナラティブだけでstanceを先取りして変更しない。

                ## 話し方

                - 一人称は「俺」。
                - 低く擦れた声で、短い常体を使う。
                - 動揺時は沈黙や言い直しを挟む。

                ## 知識

                嵐の夜、標識灯が消えた時刻、通常の保守手順、焼け焦げた保守記録が自分の認証符号を示していることを知っている。

                ## 秘密・条件付き知識

                迫害から逃げる難民船を巡視艇から隠すため、自分の意思で標識灯を消した。

                この内容は、postStateの`keeper-ren.state.stance`が`confessed`であり、保守記録を認めたことと消灯理由が公開済みfactsに含まれる場合だけ話す。それ以前は故障説を維持し、難民船の存在を示唆もしない。
                """)
        ]),
        Opening = "窓のない取調室で、灯台守レンが金属机の向こうに座っている。彼は標識灯の消灯を故障だと主張する。あなたの手元には、レンの認証符号と手動停止時刻が残る焼け焦げた保守記録がある。質問することも、その証拠を突きつけることもできる。",
        Status = "published",
        AuthorId = authorId,
        CreatedAt = timestamp,
        UpdatedAt = timestamp,
    };
}
