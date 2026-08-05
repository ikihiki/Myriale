using System.Reflection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.ModuleHandoffs.Application;
using Myriale.Api.Features.ScenarioTurns.Application;
using Myriale.Api.Infrastructure.Persistence;
using Myriale.Api.Infrastructure.Composition.ModuleHandoffs;
using Myriale.Api.Features.ScenarioTurns.Infrastructure;

namespace Myriale.Api.Tests;

public sealed class Phase10ArchitectureTests
{
    private static readonly Assembly Api = typeof(Program).Assembly;

    [Fact]
    public void EveryEndpointHandlerIsFreeOfDbContextAndIdentityManagers()
    {
        var endpoints = Api.GetTypes()
            .Where(type => type.Namespace?.EndsWith(".Http", StringComparison.Ordinal) == true && type.Name.EndsWith("Endpoints", StringComparison.Ordinal))
            .SelectMany(DeclaredMethodsIncludingNested)
            .ToArray();

        Assert.NotEmpty(endpoints);
        Assert.All(endpoints, method => Assert.All(method.GetParameters(), parameter =>
        {
            Assert.NotEqual(typeof(ApplicationDbContext), parameter.ParameterType);
            Assert.False(IsClosedGeneric(parameter.ParameterType, typeof(UserManager<>)), $"{method.DeclaringType?.Name}.{method.Name}");
            Assert.False(IsClosedGeneric(parameter.ParameterType, typeof(SignInManager<>)), $"{method.DeclaringType?.Name}.{method.Name}");
        }));
    }

    [Fact]
    public void EveryExecutionHandlerIsFreeOfApplicationDbContext()
    {
        var handlers = Api.GetTypes().Where(type => !type.IsAbstract && typeof(ISessionExecutionService).IsAssignableFrom(type)).ToArray();
        Assert.NotEmpty(handlers);
        Assert.All(handlers, handler => Assert.All(handler.GetConstructors(), constructor =>
            Assert.DoesNotContain(constructor.GetParameters(), parameter => parameter.ParameterType == typeof(ApplicationDbContext))));
    }

    [Fact]
    public void ApplicationContainsNoInfrastructureOrEndpointImplementations()
    {
        var violations = Api.GetTypes().Where(type => type.Namespace?.Contains(".Application", StringComparison.Ordinal) == true)
            .Where(type => type.Name.Length > 2 && type.Name.StartsWith("Ef", StringComparison.Ordinal) && char.IsUpper(type.Name[2])
                || type.Namespace!.Contains(".Infrastructure", StringComparison.Ordinal)
                || type.Namespace!.Contains(".Endpoints", StringComparison.Ordinal))
            .Select(type => type.FullName).ToArray();
        Assert.Empty(violations);

        Assert.Equal("Myriale.Api.Infrastructure.Composition.ScenarioTurns", typeof(EfScenarioExecutionFence).Namespace);
        Assert.Equal("Myriale.Api.Infrastructure.Composition.ModuleHandoffs", typeof(EfModuleHandoffPublishUnitOfWork).Namespace);
    }

    [Fact]
    public void DomainTypesReferenceNeitherEntityFrameworkNorAspNetCore()
    {
        var migratedDomainNamespaces = new[]
        {
            "Myriale.Api.Features.Sessions.Domain",
            "Myriale.Api.Features.SessionExecutions.Domain",
            "Myriale.Api.Features.ProgressionRuntime.Domain",
        };
        var violations = Api.GetTypes()
            .Where(type => migratedDomainNamespaces.Any(prefix => type.Namespace?.StartsWith(prefix, StringComparison.Ordinal) == true))
            .SelectMany(type => ReferencedTypes(type).Select(reference => (Type: type, Reference: reference)))
            .Where(item => item.Reference.Namespace?.StartsWith("Microsoft.EntityFrameworkCore", StringComparison.Ordinal) == true
                || item.Reference.Namespace?.StartsWith("Microsoft.AspNetCore", StringComparison.Ordinal) == true)
            .Select(item => $"{item.Type.FullName} -> {item.Reference.FullName}")
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        Assert.Empty(violations);
    }

    [Fact]
    public void ApplicationTypesReferenceNeitherEndpointsNorInfrastructureImplementations()
    {
        var violations = Api.GetTypes()
            .Where(type => type.Namespace?.Contains(".Application", StringComparison.Ordinal) == true)
            .SelectMany(type => ReferencedTypes(type).Select(reference => (Type: type, Reference: reference)))
            .Where(item => item.Reference.Namespace?.StartsWith("Myriale.Api.Endpoints", StringComparison.Ordinal) == true
                || item.Reference.Namespace?.StartsWith("Myriale.Api.Infrastructure", StringComparison.Ordinal) == true
                    && item.Reference != typeof(ApplicationDbContext))
            .Select(item => $"{item.Type.FullName} -> {item.Reference.FullName}")
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        Assert.Empty(violations);
    }

    [Fact]
    public void RepositoryContractsExposeNeitherDbSetNorIQueryable()
    {
        var repositories = Api.GetTypes().Where(type => type.IsInterface && type.Namespace?.Contains(".Application", StringComparison.Ordinal) == true
            && type.Name.EndsWith("Repository", StringComparison.Ordinal));
        Assert.All(repositories.SelectMany(type => type.GetMethods()), method =>
        {
            Assert.False(IsDbQuery(method.ReturnType), method.ToString());
            Assert.All(method.GetParameters(), parameter => Assert.False(IsDbQuery(parameter.ParameterType), method.ToString()));
        });
    }

    [Fact]
    public void ModernizedAggregateLifecycleSettersAreNotPublic()
    {
        var aggregates = new[]
        {
            typeof(Session), typeof(SessionTurn), typeof(SessionPlayerInput), typeof(SessionArtifact),
            typeof(SessionObjectState), typeof(SessionRuleActionStep), typeof(SessionProgressState),
            typeof(SessionProgressionTransitionReceipt), typeof(AiProviderProfile), typeof(AiCredential),
            typeof(ModulePackage), typeof(ApplicationUser), typeof(SessionExecutionAttempt), typeof(SessionAiInteraction),
        };
        var lifecycleNames = new HashSet<string>(StringComparer.Ordinal)
        {
            "Id", "SessionId", "OwnerId", "Revision", "Status", "State", "Stage", "Kind", "CurrentNodeId",
            "HeadTurnId", "Position", "PreviousTurnId", "UpdatedAt", "CompletedAt", "CommittedAt", "ValidatedAt",
            "WithdrawnAt", "Enabled", "IsEnabled", "InteractionType", "DialogueTurnType",
        };
        Assert.All(aggregates.SelectMany(type => type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(property => property.DeclaringType == type && lifecycleNames.Contains(property.Name))), property =>
                Assert.False(property.SetMethod?.IsPublic == true, $"{property.DeclaringType?.Name}.{property.Name}"));
    }

    [Fact]
    public void ClosedDiscriminatorsAndDeletedCompatibilitySymbolsStayAbsent()
    {
        Assert.Equal(typeof(SessionAiInteractionStage), typeof(SessionAiInteraction).GetProperty(nameof(SessionAiInteraction.Stage))!.PropertyType);
        Assert.Equal(typeof(SessionAiInteractionStatus), typeof(SessionAiInteraction).GetProperty(nameof(SessionAiInteraction.Status))!.PropertyType);

        var absent = new[]
        {
            "Myriale.Api.Data.SessionAiInteractionStages", "Myriale.Api.Data.SessionAiInteractionStatuses",
            "Myriale.Api.Services.ScenarioDefinitionAuthoringService",
            "Myriale.Api.Services.SessionInputService", "Myriale.Api.Services.SessionInputAcceptanceResult",
            "Myriale.Api.Contracts.NarrativeInteractionTypes", "Myriale.Api.Features.ModuleExecutions.Infrastructure.ModuleHandoffPreparer",
            "Myriale.Api.Services.SessionScenarioProgressionService", "Myriale.Api.Services.PlaySessionListingService",
            "Myriale.Api.Features.ModulePackages.IModulePackageService", "Myriale.Api.Features.ModulePackages.ModulePackageService",
            "Myriale.Api.Features.ModulePackages.Infrastructure.IModulePackageRuntimeCatalog", "Myriale.Api.Features.ModulePackages.Infrastructure.ModulePackageRuntimeCatalog",
            "Myriale.Api.Data.AiProviderKey", "Myriale.Api.Data.AiProviderProfileDefinition",
            "Myriale.Api.Services.IAiCredentialStore", "Myriale.Api.Services.IAiProviderSelectionStore",
            "Myriale.Api.Services.SessionExecutionStateMachine", "Myriale.Api.Services.SessionExecutionCompletion",
            "Myriale.Api.Data.SessionExecutionKinds", "Myriale.Api.Data.SessionExecutionStatuses", "Myriale.Api.Data.SessionExecutionEnumValues",
            "Myriale.Api.Services.ScenarioRuleWorld", "Myriale.Api.Services.ScenarioEffectApplier", "Myriale.Api.Data.ScenarioTurnStages",
        };
        Assert.All(absent, name => Assert.Null(Api.GetType(name)));
    }

    private static IEnumerable<Type> ReferencedTypes(Type type)
    {
        if (type.BaseType is { } baseType) foreach (var reference in Flatten(baseType)) yield return reference;
        foreach (var implemented in type.GetInterfaces()) foreach (var reference in Flatten(implemented)) yield return reference;
        foreach (var field in type.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static))
            foreach (var reference in Flatten(field.FieldType)) yield return reference;
        foreach (var property in type.GetProperties(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static))
            foreach (var reference in Flatten(property.PropertyType)) yield return reference;
        foreach (var method in type.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly))
        {
            foreach (var reference in Flatten(method.ReturnType)) yield return reference;
            foreach (var parameter in method.GetParameters())
                foreach (var reference in Flatten(parameter.ParameterType)) yield return reference;
        }
    }

    private static IEnumerable<Type> Flatten(Type type)
    {
        yield return type;
        if (type.HasElementType && type.GetElementType() is { } element)
            foreach (var reference in Flatten(element)) yield return reference;
        if (type.IsGenericType)
            foreach (var argument in type.GetGenericArguments())
                foreach (var reference in Flatten(argument)) yield return reference;
    }

    private static IEnumerable<MethodInfo> DeclaredMethodsIncludingNested(Type endpoint) =>
        new[] { endpoint }.Concat(endpoint.GetNestedTypes(BindingFlags.NonPublic | BindingFlags.Public))
            .SelectMany(type => type.GetMethods(BindingFlags.Static | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly));

    private static bool IsClosedGeneric(Type type, Type open) => type.IsGenericType && type.GetGenericTypeDefinition() == open;
    private static bool IsDbQuery(Type type) => type.IsGenericType
        && (type.GetGenericTypeDefinition() == typeof(DbSet<>) || type.GetGenericTypeDefinition() == typeof(IQueryable<>));
}
