using Microsoft.EntityFrameworkCore;
using Mono.Cecil;
using Myriale.Api.Bootstrap;
using Myriale.Api.Bootstrap.Seeding;
using Myriale.Api.Infrastructure.Hosting;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Tests;

public sealed class Wave8StructuralArchitectureTests
{
    private static readonly System.Reflection.Assembly Api = typeof(Program).Assembly;

    [Fact]
    public void SharedInfrastructureAndBootstrapTypesUseTheirCompletedNamespaces()
    {
        Assert.Equal("Myriale.Api.Infrastructure.Persistence", typeof(ApplicationDbContext).Namespace);
        Assert.Equal("Myriale.Api.Infrastructure.Hosting", typeof(DevelopmentErrorDetails).Namespace);
        Assert.Equal("Myriale.Api.Bootstrap", typeof(MyrialeApiHost).Namespace);
        Assert.Equal("Myriale.Api.Bootstrap.Seeding", typeof(AccountSeedData).Namespace);
        Assert.Equal("Myriale.Api.Bootstrap.Seeding", typeof(ScenarioSeedData).Namespace);
        Assert.Equal("Myriale.Api.Bootstrap.Seeding", typeof(ScenarioDefinitionSeedFactory).Namespace);
        Assert.Equal("Myriale.Api.Bootstrap.Seeding", typeof(ScenarioTestFixtureData).Namespace);
    }

    [Fact]
    public void EntityConfigurationsAreFeatureOwnedOrDedicatedCrossSliceRelationships()
    {
        var configurations = Api.GetTypes()
            .Where(type => !type.IsAbstract && type.GetInterfaces().Any(IsEntityTypeConfiguration))
            .ToArray();

        Assert.NotEmpty(configurations);
        Assert.All(configurations, configuration =>
        {
            var @namespace = Assert.IsType<string>(configuration.Namespace);
            Assert.True(
                @namespace.StartsWith("Myriale.Api.Features.", StringComparison.Ordinal)
                    && @namespace.EndsWith(".Infrastructure.Persistence", StringComparison.Ordinal)
                || @namespace == "Myriale.Api.Infrastructure.Persistence.CrossSliceRelationships",
                configuration.FullName);
        });

        var crossSliceRelationships = configurations
            .Where(type => type.Namespace == "Myriale.Api.Infrastructure.Persistence.CrossSliceRelationships")
            .ToArray();
        Assert.NotEmpty(crossSliceRelationships);
        Assert.All(crossSliceRelationships, type =>
        {
            Assert.Empty(type.GetFields(System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic));
            Assert.All(type.GetMethods(System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.DeclaredOnly),
                method => Assert.Equal("Configure", method.Name));
        });
    }

    [Fact]
    public void ApplicationDbContextDiscoversConfigurationsWithoutInlineEntityMapping()
    {
        using var assembly = AssemblyDefinition.ReadAssembly(Api.Location);
        var context = assembly.MainModule.GetType(typeof(ApplicationDbContext).FullName!);
        var onModelCreating = Assert.Single(context.Methods, method => method.Name == "OnModelCreating");
        var calls = onModelCreating.Body.Instructions
            .Select(instruction => instruction.Operand)
            .OfType<MethodReference>()
            .ToArray();

        Assert.Contains(calls, method => method.Name == "ApplyConfigurationsFromAssembly");
        Assert.DoesNotContain(calls, method => method.Name == "Entity"
            && method.DeclaringType.FullName == typeof(ModelBuilder).FullName);
    }

    [Fact]
    public void ProgramDelegatesHostCompositionToMyrialeApiHost()
    {
        using var assembly = AssemblyDefinition.ReadAssembly(Api.Location);
        var program = assembly.MainModule.GetType(typeof(Program).FullName!);
        var references = new[] { program }.Concat(program.NestedTypes)
            .SelectMany(type => type.Methods)
            .Where(method => method.HasBody)
            .SelectMany(method => method.Body.Instructions)
            .Select(instruction => instruction.Operand)
            .OfType<MethodReference>()
            .Select(method => method.DeclaringType.FullName)
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        Assert.Contains(typeof(MyrialeApiHost).FullName, references);
        Assert.DoesNotContain(references, type => type.StartsWith("Myriale.Api.Features.", StringComparison.Ordinal));
        Assert.DoesNotContain(typeof(ApplicationDbContext).FullName, references);
    }

    [Fact]
    public void CrossSliceMigrationBypassIsAbsent()
    {
        Assert.Null(Api.GetType("Myriale.Api.Architecture.CrossSliceMigrationAttribute"));
        Assert.DoesNotContain(
            Api.GetCustomAttributesData(),
            attribute => attribute.AttributeType.FullName == "Myriale.Api.Architecture.CrossSliceMigrationAttribute");
    }

    [Fact]
    public void LegacyHorizontalNamespacesAreAbsent()
    {
        var legacyPrefixes = new[]
        {
            "Myriale.Api.Data",
            "Myriale.Api.Application",
            "Myriale.Api.Services",
            "Myriale.Api.Modules",
            "Myriale.Api.Endpoints",
            "Myriale.Api.Contracts",
        };

        var violations = Api.GetTypes()
            .Where(type => legacyPrefixes.Any(prefix =>
                type.Namespace == prefix
                || type.Namespace?.StartsWith(prefix + ".", StringComparison.Ordinal) == true))
            .Select(type => type.FullName)
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToArray();

        Assert.Empty(violations);
    }

    private static bool IsEntityTypeConfiguration(Type type) =>
        type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IEntityTypeConfiguration<>);
}
