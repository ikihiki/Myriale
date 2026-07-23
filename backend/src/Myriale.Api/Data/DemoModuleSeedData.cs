using Microsoft.EntityFrameworkCore;
using Myriale.Api.Modules;

namespace Myriale.Api.Data;

public static class DemoModuleSeedData
{
    public const string ConstellationDoorModuleId = "com.myriale.star-eater.constellation-door";
    public const string ConstellationDoorModuleVersion = "1.0.0";
    public const string PackageFileName = "constellation-door-1.0.0.myriale-module";

    public static async Task SeedAsync(
        ApplicationDbContext db,
        IModulePackageService packages,
        IWebHostEnvironment environment,
        CancellationToken cancellationToken = default)
    {
        var packagePath = Path.Combine(environment.ContentRootPath, "DemoModules", PackageFileName);
        if (!File.Exists(packagePath))
            throw new InvalidOperationException($"Demo module package is missing: {packagePath}. Run scripts/build-demo-modules.py.");

        await using var stream = File.OpenRead(packagePath);
        var installed = await packages.InstallAsync(stream, cancellationToken);
        if (installed.Package.ModuleId != ConstellationDoorModuleId || installed.Package.Version != ConstellationDoorModuleVersion)
            throw new InvalidOperationException("The constellation-door demo package has an unexpected identity.");
        await packages.SetEnabledAsync(installed.Package.Digest, true, cancellationToken);

        var transition = await db.ScenarioProgressionTransitions
            .SingleAsync(item => item.Id == "SPT-STAR-LIBRARY-DOOR-REACHED", cancellationToken);
        transition.ModuleId = installed.Package.ModuleId;
        transition.ModuleVersion = installed.Package.Version;
        transition.ModuleDigest = installed.Package.Digest;
        transition.ModuleConfigurationJson = """
            {"purpose":"銀の鍵と星図灯で『閉じた星座』の扉を開く","diceCount":1,"diceSides":20,"modifier":2,"target":13}
            """;
        transition.ModuleContextJson = """
            {"location":"水没した地下図書館・閉じた星座の扉","keyItem":"銀の鍵","lightSource":"星図灯"}
            """;
        transition.ModuleRandomValueCount = 1;
        await db.SaveChangesAsync(cancellationToken);
    }
}
