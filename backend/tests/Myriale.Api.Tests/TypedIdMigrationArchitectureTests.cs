using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Tests;

public sealed class TypedIdMigrationArchitectureTests
{
    private static readonly IReadOnlyDictionary<string, string> PrimitiveIdExceptions =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [$"{typeof(ApplicationUser).FullName}.Id"] = "ASP.NET Identity store key remains string at the Identity adapter boundary.",
            [$"{typeof(AiProviderRuntimeSettings).FullName}.Id"] = "Singleton technical key, not an entity reference exposed across Myriale boundaries.",
            [$"{typeof(Session).FullName}.CreationRequestId"] = "Caller-controlled idempotency token.",
            [$"{typeof(SessionTurn).FullName}.AiResponseId"] = "External AI-provider response identifier.",
            [$"{typeof(SessionPlayerInput).FullName}.RequestId"] = "Caller-controlled idempotency token.",
            [$"{typeof(SessionRuleActionStep).FullName}.SelectedRuleId"] = "Synthetic rule identifier without a persisted principal.",
            [$"{typeof(SessionAiInteraction).FullName}.ProviderRequestId"] = "External AI-provider request identifier.",
            [$"{typeof(EvaluationModelInvocation).FullName}.ProviderRequestId"] = "External AI-provider request identifier.",
            [$"{typeof(EvaluationModelInvocation).FullName}.CorrelationId"] = "Observability correlation identifier.",
            [$"{typeof(SessionExecutionAttempt).FullName}.WorkerId"] = "Worker-process lease owner identifier.",
            [$"{typeof(SessionExecutionAttempt).FullName}.ProviderRequestId"] = "External AI-provider request identifier.",
            [$"{typeof(SessionExecutionAttempt).FullName}.CorrelationId"] = "Observability correlation identifier.",
            [$"{typeof(SessionExecutionAttempt).FullName}.TraceId"] = "Distributed trace identifier.",
            [$"{typeof(SessionExecutionAttempt).FullName}.SpanId"] = "Distributed trace span identifier.",
            [$"{typeof(SessionProgressionTransitionReceipt).FullName}.LeaseId"] = "Ephemeral lease token without a persisted principal.",
            [$"{typeof(ModuleExecutionRequest).FullName}.RequestId"] = "Caller-controlled idempotency token.",
        };

    [Fact]
    public void PersistedPrimitiveIdPropertiesAreLimitedToReasonedExceptions()
    {
        using var db = CreateContext();
        var actual = db.Model.GetEntityTypes()
            .Where(entity => entity.ClrType.Assembly == typeof(Program).Assembly)
            .SelectMany(entity => entity.GetProperties()
                .Where(property => IsPrimitive(property.ClrType) && IsIdLike(property.Name))
                .Select(property => $"{entity.ClrType.FullName}.{property.Name}"))
            .OrderBy(value => value, StringComparer.Ordinal)
            .ToArray();

        Assert.Equal(PrimitiveIdExceptions.Keys.OrderBy(value => value, StringComparer.Ordinal), actual);
        Assert.All(PrimitiveIdExceptions.Values, reason => Assert.False(string.IsNullOrWhiteSpace(reason)));
    }

    [Fact]
    public void EveryForeignKeyUsesThePrincipalKeyClrTypes()
    {
        using var db = CreateContext();
        var mismatches = db.Model.GetEntityTypes()
            .SelectMany(entity => entity.GetForeignKeys())
            .Where(foreignKey => !foreignKey.Properties.Select(property => NonNullable(property.ClrType))
                .SequenceEqual(foreignKey.PrincipalKey.Properties.Select(property => NonNullable(property.ClrType))))
            .Select(foreignKey => $"{foreignKey.DeclaringEntityType.ClrType.Name}({string.Join(',', foreignKey.Properties.Select(property => property.Name))}) -> {foreignKey.PrincipalEntityType.ClrType.Name}")
            .ToArray();

        Assert.Empty(mismatches);
    }

    [Fact]
    public void EveryPersistedIdentifierHasAnExplicitPrimitiveProviderConverter()
    {
        using var db = CreateContext();
        var typedProperties = db.Model.GetEntityTypes()
            .SelectMany(entity => entity.GetProperties())
            .Where(property => NonNullable(property.ClrType).Namespace?.EndsWith(".Identifiers", StringComparison.Ordinal) == true)
            .ToArray();

        Assert.NotEmpty(typedProperties);
        Assert.All(typedProperties, property =>
        {
            var converter = property.GetTypeMapping().Converter;
            Assert.NotNull(converter);
            Assert.True(IsPrimitive(NonNullable(converter!.ProviderClrType)), $"{property.DeclaringType.ClrType.Name}.{property.Name}: {converter.ProviderClrType}");
        });
    }

    [Fact]
    public void CrossSliceForeignKeysUseScalarIdsWithoutNavigations()
    {
        using var db = CreateContext();
        var crossSliceForeignKeys = db.Model.GetEntityTypes()
            .SelectMany(entity => entity.GetForeignKeys())
            .Where(foreignKey => TryGetSlice(foreignKey.DeclaringEntityType.ClrType, out var dependentSlice)
                && TryGetSlice(foreignKey.PrincipalEntityType.ClrType, out var principalSlice)
                && !string.Equals(dependentSlice, principalSlice, StringComparison.Ordinal))
            .ToArray();

        Assert.NotEmpty(crossSliceForeignKeys);
        Assert.All(crossSliceForeignKeys, foreignKey =>
        {
            Assert.Null(foreignKey.DependentToPrincipal);
            Assert.Null(foreignKey.PrincipalToDependent);
            Assert.All(foreignKey.Properties, property =>
                Assert.True(property.PropertyInfo is not null, $"{foreignKey.DeclaringEntityType.ClrType.Name}.{property.Name}"));
        });
    }

    [Fact]
    public void TypedIdColumnFacetsAndGeneratedLongKeysRemainStable()
    {
        using var db = CreateContext();

        AssertFacet<Session>(db, nameof(Session.Id), 40, typeof(string));
        AssertFacet<Session>(db, nameof(Session.ScenarioId), 40, typeof(string));
        AssertFacet<ScenarioProgressionNode>(db, nameof(ScenarioProgressionNode.Id), 80, typeof(string));
        AssertFacet<ScenarioProgressionTransition>(db, nameof(ScenarioProgressionTransition.SourceNodeId), 80, typeof(string));
        AssertFacet<ModuleExecution>(db, nameof(ModuleExecution.Id), 40, typeof(string));

        var requestId = db.Model.FindEntityType(typeof(ModuleExecutionRequest))!.FindProperty(nameof(ModuleExecutionRequest.Id))!;
        var outcomeId = db.Model.FindEntityType(typeof(ModuleOutcomeApplication))!.FindProperty(nameof(ModuleOutcomeApplication.Id))!;
        Assert.Equal(ValueGenerated.OnAdd, requestId.ValueGenerated);
        Assert.Equal(ValueGenerated.OnAdd, outcomeId.ValueGenerated);
        Assert.Equal(typeof(long), requestId.GetTypeMapping().Converter!.ProviderClrType);
        Assert.Equal(typeof(long), outcomeId.GetTypeMapping().Converter!.ProviderClrType);
    }

    private static void AssertFacet<TEntity>(DbContext db, string propertyName, int? maxLength, Type providerType)
    {
        var property = db.Model.FindEntityType(typeof(TEntity))!.FindProperty(propertyName)!;
        Assert.Equal(maxLength, property.GetMaxLength());
        Assert.Equal(providerType, property.GetTypeMapping().Converter!.ProviderClrType);
    }

    private static ApplicationDbContext CreateContext() => new(
        new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite("Data Source=:memory:").Options);

    private static bool TryGetSlice(Type type, out string slice)
    {
        const string prefix = "Myriale.Api.Features.";
        slice = string.Empty;
        var @namespace = type.Namespace;
        if (@namespace is null || !@namespace.StartsWith(prefix, StringComparison.Ordinal))
        {
            return false;
        }

        var remainder = @namespace[prefix.Length..];
        var separator = remainder.IndexOf('.');
        slice = separator < 0 ? remainder : remainder[..separator];
        return slice.Length > 0;
    }

    private static Type NonNullable(Type type) => Nullable.GetUnderlyingType(type) ?? type;
    private static bool IsPrimitive(Type type) => NonNullable(type) == typeof(string)
        || NonNullable(type) == typeof(long)
        || NonNullable(type) == typeof(int)
        || NonNullable(type) == typeof(Guid);
    private static bool IsIdLike(string name) => name.Equals("Id", StringComparison.Ordinal)
        || name.EndsWith("Id", StringComparison.Ordinal)
        || name.EndsWith("ID", StringComparison.Ordinal);
}
