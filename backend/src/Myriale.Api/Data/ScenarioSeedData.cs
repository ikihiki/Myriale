using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Data;

public static class ScenarioSeedData
{
    public static readonly IReadOnlyList<Scenario> Scenarios =
    [
        new Scenario
        {
            Id = "SCN-STAR-LIBRARY",
            Title = "星喰いの地下図書館",
            Summary = "地下に沈んだ王都で、禁書を読むたびに星座が書き換わる探索譚。",
            Genre = "ダークファンタジー探索譚",
            Tone = "静かで不穏、淡い希望",
            Lore = "星座は魔法体系の鍵。死者の名前を読むと記憶を失う。",
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
            AuthorId = "SEED-AUTHOR",
            CreatedAt = new DateTimeOffset(2026, 6, 10, 0, 0, 0, TimeSpan.Zero),
            UpdatedAt = new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.Zero),
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
            AuthorId = "SEED-AUTHOR",
            CreatedAt = new DateTimeOffset(2026, 6, 12, 0, 0, 0, TimeSpan.Zero),
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
            AuthorId = "SEED-AUTHOR",
            CreatedAt = new DateTimeOffset(2026, 6, 16, 0, 0, 0, TimeSpan.Zero),
            UpdatedAt = new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.Zero),
        },
    ];

    public static async Task SeedAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        if (await db.Scenarios.AnyAsync(cancellationToken)) return;
        db.Scenarios.AddRange(Scenarios.Select(Clone));
        await db.SaveChangesAsync(cancellationToken);
    }

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
