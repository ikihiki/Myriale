using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Modules;

namespace Myriale.Api.Data;

public static class DemoModuleSeedData
{
    public const string ConstellationDoorModuleId = "com.myriale.star-eater.constellation-door";
    public const string ConstellationDoorModuleVersion = "1.0.0";
    public const string PackageFileName = "constellation-door-1.0.0.myriale-module";
    public const string GuardianBattleModuleId = "com.myriale.rules.turn-battle";
    public const string GuardianBattleModuleVersion = "1.0.0";
    public const string GuardianBattlePackageFileName = "guardian-battle-1.0.0.myriale-module";

    public static async Task SeedAsync(
        ApplicationDbContext db,
        IModulePackageService packages,
        IWebHostEnvironment environment,
        CancellationToken cancellationToken = default)
    {
        var installed = await InstallAsync(packages, environment, PackageFileName, ConstellationDoorModuleId, ConstellationDoorModuleVersion, cancellationToken);
        var battle = await InstallAsync(packages, environment, GuardianBattlePackageFileName, GuardianBattleModuleId, GuardianBattleModuleVersion, cancellationToken);

        await ConfigureTransitionAsync(
            db,
            "SPT-STAR-LIBRARY-DOOR-REACHED",
            installed.Package,
            "銀の鍵と星図灯で『閉じた星座』の扉を開く",
            "水没した地下図書館・閉じた星座の扉",
            "銀の鍵",
            "星図灯",
            cancellationToken);
        await ConfigureTransitionAsync(
            db,
            "SPT-NEON-ARCHIVE-FIREWALL-REACHED",
            installed.Package,
            "量子鍵と星図デッキで『閉じた星座』ファイアウォールを突破する",
            "オルフェウス地下データ書庫・閉じた星座ゲート",
            "量子鍵",
            "星図デッキ",
            cancellationToken);
        await ConfigureBattleTransitionAsync(db, battle.Package, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task<ModulePackageInstallResult> InstallAsync(
        IModulePackageService packages,
        IWebHostEnvironment environment,
        string fileName,
        string expectedModuleId,
        string expectedVersion,
        CancellationToken cancellationToken)
    {
        var packagePath = Path.Combine(environment.ContentRootPath, "DemoModules", fileName);
        if (!File.Exists(packagePath))
            throw new InvalidOperationException($"Demo module package is missing: {packagePath}. Run scripts/build-demo-modules.py.");
        await using var stream = File.OpenRead(packagePath);
        var installed = await packages.InstallAsync(stream, cancellationToken);
        if (installed.Package.ModuleId != expectedModuleId || installed.Package.Version != expectedVersion)
            throw new InvalidOperationException($"The {fileName} demo package has an unexpected identity.");
        await packages.SetEnabledAsync(installed.Package.Digest, true, cancellationToken);
        return installed;
    }

    private static async Task ConfigureBattleTransitionAsync(ApplicationDbContext db, ModulePackage package, CancellationToken cancellationToken)
    {
        var transition = await db.ScenarioProgressionTransitions.SingleAsync(item => item.Id == "SPT-STAR-LIBRARY-GUARDIAN-AWAKENED", cancellationToken);
        transition.ModuleId = package.ModuleId;
        transition.ModuleVersion = package.Version;
        transition.ModuleDigest = package.Digest;
        transition.ModuleConfigurationJson = JsonSerializer.Serialize(new
        {
            playerName = "星図を読む巡礼者", enemyName = "図書館の守護者",
            playerHp = 24, enemyHp = 22, playerAttack = 6, enemyAttack = 5,
            skillName = "星図灯の閃光", skillPower = 10, skillUses = 2, fleeChance = 35,
            victoryCode = "guardian-defeated", defeatCode = "guardian-victorious",
            fleeCode = "guardian-escaped", victoryFlag = "guardian-defeated",
        });
        transition.ModuleContextJson = JsonSerializer.Serialize(new { location = "閉じた星座の扉前", encounter = "防衛機構" });
        transition.ModuleRandomValueCount = 0;
    }

    private static async Task ConfigureTransitionAsync(
        ApplicationDbContext db,
        string transitionId,
        ModulePackage package,
        string purpose,
        string location,
        string keyItem,
        string lightSource,
        CancellationToken cancellationToken)
    {
        var transition = await db.ScenarioProgressionTransitions
            .SingleAsync(item => item.Id == transitionId, cancellationToken);
        transition.ModuleId = package.ModuleId;
        transition.ModuleVersion = package.Version;
        transition.ModuleDigest = package.Digest;
        transition.ModuleConfigurationJson = JsonSerializer.Serialize(new
        {
            purpose,
            diceCount = 1,
            diceSides = 20,
            modifier = 2,
            target = 13,
        });
        transition.ModuleContextJson = JsonSerializer.Serialize(new { location, keyItem, lightSource });
        transition.ModuleRandomValueCount = 1;
    }
}
