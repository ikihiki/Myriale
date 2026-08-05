using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Diagnostics;
using Myriale.Architecture.Analyzers;

namespace Myriale.Architecture.Analyzers.Tests;

public sealed class SliceReferenceAnalyzerTests
{
    private const string AttributeSource = """
        namespace Myriale.Api.Architecture
        {
            [System.AttributeUsage(
                System.AttributeTargets.Class |
                System.AttributeTargets.Struct |
                System.AttributeTargets.Interface |
                System.AttributeTargets.Enum |
                System.AttributeTargets.Delegate,
                Inherited = false)]
            public sealed class CrossSliceContractAttribute : System.Attribute;

            [System.AttributeUsage(System.AttributeTargets.Assembly, AllowMultiple = true)]
            public sealed class CrossSliceMigrationAttribute(
                string sourceSlice,
                string targetSlice,
                string issue,
                string removeByWave) : System.Attribute;
        }
        """;

    [Fact]
    public async Task Allows_same_slice_legacy_external_and_exact_exported_contract_references()
    {
        var diagnostics = await AnalyzeAsync("""
            using Myriale.Api.Architecture;

            namespace Myriale.Api.Features.Catalog.Identifiers
            {
                [CrossSliceContract]
                public readonly record struct ItemId(int Value);
            }

            namespace Myriale.Api.Features.Catalog.Contracts
            {
                using Myriale.Api.Features.Catalog.Identifiers;

                [CrossSliceContract]
                public sealed record ItemContract(ItemId Id);
            }

            namespace Myriale.Api.Features.Catalog.Application.Ports
            {
                using Myriale.Api.Features.Catalog.Contracts;
                using Myriale.Api.Features.Catalog.Identifiers;

                [CrossSliceContract]
                public interface IItemCatalog
                {
                    System.Threading.Tasks.Task<(ItemId Id, ItemContract Contract)> GetAsync(
                        ItemId id,
                        System.Threading.CancellationToken cancellationToken);
                }
            }

            namespace Myriale.Api.Features.Orders.Application
            {
                using Myriale.Api.Features.Catalog.Application.Ports;
                using Myriale.Api.Features.Catalog.Contracts;
                using Myriale.Api.Features.Catalog.Identifiers;

                internal sealed class SameSliceHelper;

                internal sealed class Consumer(IItemCatalog catalog)
                {
                    internal async System.Threading.Tasks.Task<ItemContract> RunAsync(ItemId id)
                    {
                        SameSliceHelper helper = new();
                        _ = helper;
                        var (_, contract) = await catalog.GetAsync(id, default);
                        return contract;
                    }
                }
            }

            namespace Myriale.Api.Application.Legacy
            {
                internal sealed class LegacyType;
            }

            namespace Myriale.Api.Features.Orders.Infrastructure
            {
                internal sealed class LegacyConsumer(Myriale.Api.Application.Legacy.LegacyType value);
            }
            """);

        Assert.Empty(ArchitectureDiagnostics(diagnostics));
    }

    [Fact]
    public async Task Reports_unexported_cross_slice_types_in_declarations()
    {
        var diagnostics = await AnalyzeAsync("""
            namespace Myriale.Api.Features.Provider.Contracts
            {
                public interface IBase;
                public sealed class MarkerAttribute : System.Attribute;
                public class Payload;
                public delegate Payload PayloadDelegate(Payload input);
                public interface IGeneric<T>;
            }

            namespace Myriale.Api.Features.Consumer.Application
            {
                using Myriale.Api.Features.Provider.Contracts;

                [Marker]
                internal sealed class Consumer<T> : IBase, IGeneric<Payload>
                    where T : Payload
                {
                    private Payload field = new();
                    private Payload Property { get; set; } = new();
                    private event PayloadDelegate? Changed;

                    internal (Payload Left, Payload Right) Handle(Payload input)
                    {
                        Changed?.Invoke(input);
                        return (field, Property);
                    }
                }
            }
            """);

        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == SliceReferenceAnalyzer.UnexportedReferenceId);
    }

    [Fact]
    public async Task Reports_operation_and_body_references()
    {
        var diagnostics = await AnalyzeAsync("""
            namespace Myriale.Api.Features.Provider.Contracts
            {
                public sealed class Payload
                {
                    public static Payload Current { get; } = new();
                    public static Payload Create() => new();
                    public void Execute() { }
                }

                public sealed class PayloadException : System.Exception;
            }

            namespace Myriale.Api.Features.Consumer.Application
            {
                using Myriale.Api.Features.Provider.Contracts;

                internal sealed class Consumer
                {
                    internal object Run(object value)
                    {
                        Payload local = new Payload();
                        local.Execute();
                        _ = Payload.Current;
                        _ = Payload.Create();
                        _ = typeof(Payload);
                        _ = (Payload)value;
                        _ = value as Payload;
                        _ = value is Payload;
                        System.Action methodGroup = local.Execute;
                        methodGroup();

                        try { throw new PayloadException(); }
                        catch (PayloadException) { }

                        return local;
                    }
                }
            }
            """);

        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == SliceReferenceAnalyzer.UnexportedReferenceId);
    }

    [Fact]
    public async Task Reports_generic_method_and_extension_method_references()
    {
        var diagnostics = await AnalyzeAsync("""
            namespace Myriale.Api.Features.Provider.Contracts
            {
                public sealed class Payload;

                public static class ProviderExtensions
                {
                    public static T Echo<T>(this T value) => value;
                }
            }

            namespace Myriale.Api.Features.Consumer.Application
            {
                using Myriale.Api.Features.Provider.Contracts;

                internal static class Consumer
                {
                    internal static object Run(Payload value) => value.Echo<Payload>();
                }
            }
            """);

        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == SliceReferenceAnalyzer.UnexportedReferenceId &&
            diagnostic.GetMessage().Contains("ProviderExtensions", StringComparison.Ordinal));
        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == SliceReferenceAnalyzer.UnexportedReferenceId &&
            diagnostic.GetMessage().Contains("Payload", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Reports_references_inside_async_lambdas()
    {
        var diagnostics = await AnalyzeAsync("""
            namespace Myriale.Api.Features.Provider.Contracts
            {
                public sealed class Payload
                {
                    public static System.Threading.Tasks.Task<Payload> LoadAsync() =>
                        System.Threading.Tasks.Task.FromResult(new Payload());
                }
            }

            namespace Myriale.Api.Features.Consumer.Application
            {
                internal static class Consumer
                {
                    internal static async System.Threading.Tasks.Task<object> RunAsync()
                    {
                        System.Func<System.Threading.Tasks.Task<object>> load = async () =>
                        {
                            await System.Threading.Tasks.Task.Yield();
                            return await Myriale.Api.Features.Provider.Contracts.Payload.LoadAsync();
                        };

                        return await load();
                    }
                }
            }
            """);

        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == SliceReferenceAnalyzer.UnexportedReferenceId);
    }

    [Fact]
    public async Task Reports_export_in_forbidden_layer()
    {
        var diagnostics = await AnalyzeAsync("""
            using Myriale.Api.Architecture;

            namespace Myriale.Api.Features.Provider.Infrastructure
            {
                [CrossSliceContract]
                public sealed class ExportedRepository;
            }
            """);

        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == SliceReferenceAnalyzer.InvalidExportId);
    }

    [Fact]
    public async Task Reports_cross_slice_reference_to_forbidden_layer_even_when_marked()
    {
        var diagnostics = await AnalyzeAsync("""
            using Myriale.Api.Architecture;

            namespace Myriale.Api.Features.Provider.Domain
            {
                [CrossSliceContract]
                public sealed class AggregateEntity;
            }

            namespace Myriale.Api.Features.Consumer.Application
            {
                internal sealed class Consumer(
                    Myriale.Api.Features.Provider.Domain.AggregateEntity entity);
            }
            """);

        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == SliceReferenceAnalyzer.ForbiddenReferenceId);
    }

    [Fact]
    public async Task Reports_unknown_feature_namespace()
    {
        var diagnostics = await AnalyzeAsync("""
            namespace Myriale.Api.Features
            {
                public sealed class UnownedContract;
            }

            namespace Myriale.Api.Features.Consumer.Application
            {
                internal sealed class Consumer(Myriale.Api.Features.UnownedContract value);
            }
            """);

        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == SliceReferenceAnalyzer.UnknownSliceId);
    }

    [Fact]
    public async Task Reports_signature_leakage_from_exported_contracts_ports_and_generics()
    {
        var diagnostics = await AnalyzeAsync("""
            using Myriale.Api.Architecture;

            namespace Myriale.Api.Features.Provider.Contracts
            {
                public class HiddenPayload;

                [CrossSliceContract]
                public delegate HiddenPayload Factory<T>(T input)
                    where T : HiddenPayload;

                [CrossSliceContract]
                public sealed record ExportedEnvelope(
                    System.Collections.Generic.IReadOnlyList<HiddenPayload> Values);
            }

            namespace Myriale.Api.Features.Provider.Application.Ports
            {
                using Myriale.Api.Features.Provider.Contracts;

                [CrossSliceContract]
                public interface IProviderPort
                {
                    System.Threading.Tasks.Task<(HiddenPayload Value, int Count)> GetAsync();
                }
            }
            """);

        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == SliceReferenceAnalyzer.SignatureLeakId);
    }

    [Fact]
    public async Task Requires_the_exact_referenced_type_to_be_exported()
    {
        var diagnostics = await AnalyzeAsync("""
            using Myriale.Api.Architecture;

            namespace Myriale.Api.Features.Provider.Contracts
            {
                [CrossSliceContract]
                public interface IExportedContract;

                public sealed class ConcreteContract : IExportedContract;
            }

            namespace Myriale.Api.Features.Consumer.Application
            {
                internal sealed class Consumer(
                    Myriale.Api.Features.Provider.Contracts.ConcreteContract contract);
            }
            """);

        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == SliceReferenceAnalyzer.UnexportedReferenceId &&
            diagnostic.GetMessage().Contains("ConcreteContract", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Allows_only_the_declared_cross_slice_migration_pair()
    {
        var diagnostics = await AnalyzeAsync("""
            using Myriale.Api.Architecture;
            [assembly: CrossSliceMigration("Consumer", "Provider", "wave-migration", "Wave8")]

            namespace Myriale.Api.Features.Provider.Domain
            {
                public sealed class ProviderEntity;
            }

            namespace Myriale.Api.Features.Other.Domain
            {
                public sealed class OtherEntity;
            }

            namespace Myriale.Api.Features.Consumer.Application
            {
                internal sealed class Allowed(Myriale.Api.Features.Provider.Domain.ProviderEntity entity);
                internal sealed class Rejected(Myriale.Api.Features.Other.Domain.OtherEntity entity);
            }
            """);

        Assert.DoesNotContain(diagnostics, diagnostic =>
            diagnostic.GetMessage().Contains("ProviderEntity", StringComparison.Ordinal));
        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == SliceReferenceAnalyzer.ForbiddenReferenceId &&
            diagnostic.GetMessage().Contains("OtherEntity", StringComparison.Ordinal));
    }

    private static async Task<ImmutableArray<Diagnostic>> AnalyzeAsync(string source)
    {
        var parseOptions = new CSharpParseOptions(LanguageVersion.Preview);
        var attributeTree = CSharpSyntaxTree.ParseText(
            AttributeSource,
            parseOptions,
            path: "CrossSliceContractAttribute.cs");
        var fixtureTree = CSharpSyntaxTree.ParseText(
            source,
            parseOptions,
            path: "AnalyzerFixture.cs");

        var compilation = CSharpCompilation.Create(
            assemblyName: "AnalyzerFixture",
            syntaxTrees: [attributeTree, fixtureTree],
            references: GetPlatformReferences(),
            options: new CSharpCompilationOptions(
                OutputKind.DynamicallyLinkedLibrary,
                nullableContextOptions: NullableContextOptions.Enable));

        var compilerErrors = compilation.GetDiagnostics()
            .Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)
            .ToArray();
        Assert.True(
            compilerErrors.Length == 0,
            "Fixture did not compile:" + Environment.NewLine +
            string.Join(Environment.NewLine, compilerErrors.Select(error => error.ToString())));

        return await compilation
            .WithAnalyzers(ImmutableArray.Create<DiagnosticAnalyzer>(new SliceReferenceAnalyzer()))
            .GetAnalyzerDiagnosticsAsync();
    }

    private static IEnumerable<MetadataReference> GetPlatformReferences()
    {
        var trustedPlatformAssemblies =
            (string?)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES") ??
            throw new InvalidOperationException("Trusted platform assemblies are unavailable.");

        return trustedPlatformAssemblies
            .Split(Path.PathSeparator)
            .Select(path => MetadataReference.CreateFromFile(path));
    }

    private static IEnumerable<Diagnostic> ArchitectureDiagnostics(
        ImmutableArray<Diagnostic> diagnostics) =>
        diagnostics.Where(diagnostic =>
            diagnostic.Id.StartsWith("MYRSLICE", StringComparison.Ordinal));
}
