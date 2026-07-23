using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Data;

// API integration tests depend on deterministic scenarios, but application startup must remain empty.
internal static class ScenarioTestFixtureData
{
    public static readonly IReadOnlyList<Scenario> Scenarios =
    [
        new Scenario
        {
            Id = "SCN-STAR-LIBRARY",
            Title = "星喰いの地下図書館",
            Summary = "地下に沈んだ王都で、銀の鍵と星図灯を携え、記憶を奪う禁書と閉じた星座の扉に挑む探索譚。",
            Genre = "ダークファンタジー探索譚",
            Tone = "静かで不穏、淡い希望",
            Lore = "星座は魔法体系の鍵。水没した閲覧室には銀の鍵と星図灯が残され、死者の名を記す禁書を読む者は記憶を奪われる。最深部の『閉じた星座』の扉は星図の判定に成功した者だけを通す。",
            AiFreedom = "中: 設定を守りつつ提案する",
            HeroMode = "select",
            HeroFreeGenerationAllowed = false,
            Hero = "ミラ / 星図を読む巡礼者\nセオ / 星図を燃やす護衛\nエル / 記憶を失った写字生",
            Opening = "あなたは水没した閲覧室で目を覚ます。",
            IllustrationStyle = "銅版画風 / 低彩度 / 細密",
            IllustrationMood = "孤独、湿った静けさ、薄い金色の灯り",
            IllustrationNegative = "現代車両、銃器、過度な流血",
            SampleScene = "水没した閲覧室で、星図を抱えた司書が振り向く。",
            Status = "published",
            AuthorId = "TEST-AUTHOR",
            CreatedAt = new DateTimeOffset(2026, 6, 10, 0, 0, 0, TimeSpan.Zero),
            UpdatedAt = new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.Zero),
        },
        new Scenario
        {
            Id = "SCN-NEON-ARCHIVE",
            Title = "ネオン喰いの地下データ書庫",
            Summary = "酸性雨に沈む企業都市の地下で、量子鍵と星図デッキを携え、記憶を焼く禁制アーカイブと閉鎖ゲートを突破するサイバーパンク潜入譚。",
            Genre = "サイバーパンク潜入スリラー",
            Tone = "冷たいネオン、監視下の緊張、反逆の微光",
            Lore = "巨大企業オルフェウスは市民の記憶を星座形式のデータとして地下書庫へ保管している。浸水したサーバー閲覧層には量子鍵と星図デッキが残され、禁制アーカイブへ接続した者は自分の記憶をBlack ICEに焼かれる。最深部の『閉じた星座』ゲートは星図認証に成功した侵入者だけを通す。",
            AiFreedom = "中: 企業都市と電脳侵入の法則を守りつつ提案する",
            HeroMode = "select",
            HeroFreeGenerationAllowed = false,
            Hero = "レイ / 失われた記憶を追うネットランナー\nジン / 企業警備を裏切ったクローム傭兵\nミオ / 禁制アーカイブから逃げた合成人格",
            Opening = "あなたは非常灯だけが明滅する浸水サーバー閲覧層で意識を取り戻す。頭蓋内端末には、覚えのない星座データが脈打っている。",
            IllustrationStyle = "ネオノワール / 高密度サイバーパンク / シネマティック",
            IllustrationMood = "シアンとマゼンタのネオン、酸性雨、濡れたクローム、深い影",
            IllustrationNegative = "中世装備、牧歌的風景、明るい昼光、コミカルなデフォルメ",
            SampleScene = "浸水した地下サーバー群の奥で、閉じた星座ゲートと企業Black ICEの輪郭がネオンに浮かぶ。",
            Status = "published",
            AuthorId = "TEST-AUTHOR",
            CreatedAt = new DateTimeOffset(2026, 7, 23, 0, 0, 0, TimeSpan.Zero),
            UpdatedAt = new DateTimeOffset(2026, 7, 23, 0, 0, 0, TimeSpan.Zero),
        },
        new Scenario
        {
            Id = "SCN-ASH-STATION",
            Title = "灰の駅と宛名のない切符",
            Summary = "朝が来ない荒野を、宛名のない切符だけを頼りに渡るロードムービー。",
            Genre = "終末ロードムービー",
            Tone = "乾いた祈り、遠い汽笛",
            Lore = "朝が来ない荒野では、切符だけが次の町を覚えている。",
            AiFreedom = "高: 展開を広げる",
            HeroMode = "free",
            HeroFreeGenerationAllowed = false,
            Hero = "灰の駅で目覚めた旅人。名前と過去はプレイヤーが自由に決められる。",
            Opening = "あなたは灰の降る駅で、宛名のない切符を握っている。",
            IllustrationStyle = "水彩 / くすんだ暖色 / 粒状感",
            IllustrationMood = "郷愁、灰、遠い光",
            IllustrationNegative = "鮮やかな原色、近未来都市",
            SampleScene = "灰の降る無人駅で、宛名のない切符が淡く光る。",
            Status = "published",
            AuthorId = "TEST-AUTHOR",
            CreatedAt = new DateTimeOffset(2026, 6, 12, 0, 0, 0, TimeSpan.Zero),
            UpdatedAt = new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.Zero),
        },
        new Scenario
        {
            Id = "SCN-MOONLIT-GARDEN",
            Title = "月虹の庭と眠らない時計",
            Summary = "月虹が咲く庭園で、止まらない時計塔と消えた庭師の秘密を追う幻想譚。",
            Genre = "幻想庭園ミステリ",
            Tone = "華やかで切ない、夜明け前の期待",
            Lore = "庭園の花は訪問者の記憶から色を得る。時計塔が十三回鳴ると、選ばなかった未来が姿を現す。",
            AiFreedom = "中: 庭園の法則を守りつつ提案する",
            HeroMode = "select",
            HeroFreeGenerationAllowed = true,
            Hero = "イリス / 月虹を集める若い庭師\nカイ / 時計塔を修理する旅の技師\nマレ / 忘れられた未来を記録する画家",
            Opening = "十三回目の鐘が鳴り、あなたの足元に見覚えのない月虹の花が咲く。",
            IllustrationStyle = "幻想植物画 / 月光色 / 装飾的",
            IllustrationMood = "月虹、夜露、静かな祝祭",
            IllustrationNegative = "現代的な電子機器、昼の青空、過度な恐怖表現",
            SampleScene = "月虹の花が揺れる庭園で、止まらない時計塔を三人の旅人が見上げる。",
            Status = "published",
            AuthorId = "TEST-AUTHOR",
            CreatedAt = new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero),
            UpdatedAt = new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.Zero),
        },
        new Scenario
        {
            Id = "SCN-GLASS-FOREST",
            Title = "硝子の森と夜明けの司書",
            Summary = "嘘を映す硝子の森で、夜明けを失った書架の秘密を追う幻想ミステリ。",
            Genre = "幻想ミステリ",
            Tone = "透明で緊張感のある静けさ",
            Lore = "森の硝子片は、嘘をついた者の声だけを反射する。",
            AiFreedom = "低: 厳密に守る",
            HeroMode = "fixed",
            HeroFreeGenerationAllowed = false,
            Hero = "リュシエン / 夜明け前の森を巡る司書",
            Opening = "夜明け前の森で、割れた書架が小さく鳴る。",
            IllustrationStyle = "硝子版画 / 青白い光 / 緻密",
            IllustrationMood = "透明、静寂、夜明け前",
            IllustrationNegative = "現代建築、原色、コミカルな表現",
            SampleScene = "硝子の木々の間で、司書が割れた本を拾い上げる。",
            Status = "published",
            AuthorId = "TEST-AUTHOR",
            CreatedAt = new DateTimeOffset(2026, 6, 16, 0, 0, 0, TimeSpan.Zero),
            UpdatedAt = new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.Zero),
        },
    ];

    public static readonly IReadOnlyList<ScenarioProgressionNode> ProgressionNodes =
    [
        new ScenarioProgressionNode
        {
            Id = "SPN-STAR-LIBRARY-EXPLORATION",
            ScenarioId = "SCN-STAR-LIBRARY",
            Code = "exploration",
            IsInitial = true,
            AllowedNarrativeSignalsJson = "[\"constellation-door-reached\"]",
        },
        new ScenarioProgressionNode
        {
            Id = "SPN-NEON-ARCHIVE-INFILTRATION",
            ScenarioId = "SCN-NEON-ARCHIVE",
            Code = "archive-infiltration",
            IsInitial = true,
            AllowedNarrativeSignalsJson = "[\"constellation-firewall-reached\"]",
        },
        new ScenarioProgressionNode
        {
            Id = "SPN-NEON-ARCHIVE-GATE-CHECK",
            ScenarioId = "SCN-NEON-ARCHIVE",
            Code = "constellation-gate-check",
            IsInitial = false,
            AllowedNarrativeSignalsJson = "[]",
        },
        new ScenarioProgressionNode
        {
            Id = "SPN-STAR-LIBRARY-DOOR-CHECK",
            ScenarioId = "SCN-STAR-LIBRARY",
            Code = "constellation-door-check",
            IsInitial = false,
            AllowedNarrativeSignalsJson = "[\"constellation-guardian-awakened\"]",
        },
        new ScenarioProgressionNode
        {
            Id = "SPN-STAR-LIBRARY-GUARDIAN-BATTLE",
            ScenarioId = "SCN-STAR-LIBRARY",
            Code = "guardian-battle",
            IsInitial = false,
            AllowedNarrativeSignalsJson = "[]",
        },
    ];

    public static readonly IReadOnlyList<ScenarioProgressionTransition> ProgressionTransitions =
    [
        new ScenarioProgressionTransition
        {
            Id = "SPT-STAR-LIBRARY-DOOR-REACHED",
            SourceNodeId = "SPN-STAR-LIBRARY-EXPLORATION",
            SignalCode = "constellation-door-reached",
            TriggerDescription = "Playerが閉じた星座の扉の場所まで実際に到達したときだけ発火する。扉について話す、尋ねる、遠くから見るだけでは発火しない。",
            TargetNodeId = "SPN-STAR-LIBRARY-DOOR-CHECK",
        },
        new ScenarioProgressionTransition
        {
            Id = "SPT-NEON-ARCHIVE-FIREWALL-REACHED",
            SourceNodeId = "SPN-NEON-ARCHIVE-INFILTRATION",
            SignalCode = "constellation-firewall-reached",
            TriggerDescription = "Playerが地下データ書庫の最深部にある『閉じた星座』ファイアウォールへ実際に到達したときだけ発火する。ゲートについて調べる、遠隔スキャンする、噂を聞くだけでは発火しない。",
            TargetNodeId = "SPN-NEON-ARCHIVE-GATE-CHECK",
        },
        new ScenarioProgressionTransition
        {
            Id = "SPT-STAR-LIBRARY-GUARDIAN-AWAKENED",
            SourceNodeId = "SPN-STAR-LIBRARY-DOOR-CHECK",
            SignalCode = "constellation-guardian-awakened",
            TriggerDescription = "星座の扉の確定Outcomeで図書館の守護者が起動し、そのNarrative handoffが完了したときに発火する。",
            TargetNodeId = "SPN-STAR-LIBRARY-GUARDIAN-BATTLE",
        },
    ];

    public static async Task CreateAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        if (await db.Scenarios.AnyAsync(cancellationToken)) return;
        db.Scenarios.AddRange(Scenarios.Select(Clone));
        db.ScenarioProgressionNodes.AddRange(ProgressionNodes.Select(Clone));
        db.ScenarioProgressionTransitions.AddRange(ProgressionTransitions.Select(Clone));
        await db.SaveChangesAsync(cancellationToken);
    }

    private static ScenarioProgressionNode Clone(ScenarioProgressionNode node) => new()
    {
        Id = node.Id,
        ScenarioId = node.ScenarioId,
        Code = node.Code,
        IsInitial = node.IsInitial,
        AllowedNarrativeSignalsJson = node.AllowedNarrativeSignalsJson,
    };

    private static ScenarioProgressionTransition Clone(ScenarioProgressionTransition transition) => new()
    {
        Id = transition.Id,
        SourceNodeId = transition.SourceNodeId,
        SignalCode = transition.SignalCode,
        TriggerDescription = transition.TriggerDescription,
        TargetNodeId = transition.TargetNodeId,
        ModuleId = transition.ModuleId,
        ModuleVersion = transition.ModuleVersion,
        ModuleDigest = transition.ModuleDigest,
        ModuleConfigurationJson = transition.ModuleConfigurationJson,
        ModuleContextJson = transition.ModuleContextJson,
        ModuleRandomValueCount = transition.ModuleRandomValueCount,
    };

    private static Scenario Clone(Scenario scenario) => new()
    {
        Id = scenario.Id,
        Title = scenario.Title,
        Summary = scenario.Summary,
        Genre = scenario.Genre,
        Tone = scenario.Tone,
        Lore = scenario.Lore,
        AiFreedom = scenario.AiFreedom,
        HeroMode = scenario.HeroMode,
        HeroFreeGenerationAllowed = scenario.HeroFreeGenerationAllowed,
        Hero = scenario.Hero,
        Opening = scenario.Opening,
        IllustrationStyle = scenario.IllustrationStyle,
        IllustrationMood = scenario.IllustrationMood,
        IllustrationNegative = scenario.IllustrationNegative,
        SampleScene = scenario.SampleScene,
        Status = scenario.Status,
        AuthorId = scenario.AuthorId,
        CreatedAt = scenario.CreatedAt,
        UpdatedAt = scenario.UpdatedAt,
    };
}
