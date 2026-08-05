using System.Collections.Concurrent;
using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Operations;

namespace Myriale.Architecture.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class SliceReferenceAnalyzer : DiagnosticAnalyzer
{
    private static readonly SyntaxKind[] SyntaxKinds = Enum.GetValues(typeof(SyntaxKind))
        .Cast<SyntaxKind>()
        .Where(kind => kind != SyntaxKind.None)
        .ToArray();

    public const string UnexportedReferenceId = "MYRSLICE001";
    public const string InvalidExportId = "MYRSLICE002";
    public const string SignatureLeakId = "MYRSLICE003";
    public const string UnknownSliceId = "MYRSLICE004";
    public const string ForbiddenReferenceId = "MYRSLICE005";

    private static readonly DiagnosticDescriptor UnexportedReference = new(
        UnexportedReferenceId,
        "Cross-slice type is not exported",
        "Type '{0}' from slice '{1}' is referenced by slice '{2}' but is not marked CrossSliceContract",
        "Architecture",
        DiagnosticSeverity.Error,
        isEnabledByDefault: true);

    private static readonly DiagnosticDescriptor InvalidExport = new(
        InvalidExportId,
        "Cross-slice export is invalid",
        "Exported type '{0}' must be declared in Identifiers, Contracts, or Application.Ports of its owning slice",
        "Architecture",
        DiagnosticSeverity.Error,
        isEnabledByDefault: true);

    private static readonly DiagnosticDescriptor SignatureLeak = new(
        SignatureLeakId,
        "Cross-slice contract signature leaks a non-exported type",
        "Exported type '{0}' exposes '{1}', which must also be an exported type in an allowed layer",
        "Architecture",
        DiagnosticSeverity.Error,
        isEnabledByDefault: true);

    private static readonly DiagnosticDescriptor UnknownSlice = new(
        UnknownSliceId,
        "Feature namespace cannot be classified",
        "Namespace '{0}' cannot be classified beneath Myriale.Api.Features.<Slice>",
        "Architecture",
        DiagnosticSeverity.Error,
        isEnabledByDefault: true);

    private static readonly DiagnosticDescriptor ForbiddenReference = new(
        ForbiddenReferenceId,
        "Forbidden cross-slice layer reference",
        "Slice '{0}' cannot reference '{1}' because it is a Domain, Infrastructure, Http, or Entity type owned by slice '{2}'",
        "Architecture",
        DiagnosticSeverity.Error,
        isEnabledByDefault: true);

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics =>
        ImmutableArray.Create(
            UnexportedReference,
            InvalidExport,
            SignatureLeak,
            UnknownSlice,
            ForbiddenReference);

    public override void Initialize(AnalysisContext context)
    {
        context.ConfigureGeneratedCodeAnalysis(
            GeneratedCodeAnalysisFlags.Analyze | GeneratedCodeAnalysisFlags.ReportDiagnostics);
        context.EnableConcurrentExecution();

        context.RegisterCompilationStartAction(startContext =>
        {
            var contractAttribute = startContext.Compilation.GetTypeByMetadataName(
                SliceModel.ContractAttributeMetadataName);
            var reportedDiagnostics = new ConcurrentDictionary<DiagnosticKey, byte>();

            startContext.RegisterSymbolAction(
                symbolContext => AnalyzeNamedType(
                    symbolContext,
                    contractAttribute,
                    reportedDiagnostics),
                SymbolKind.NamedType);

            startContext.RegisterSyntaxNodeAction(
                nodeContext => AnalyzeSyntaxNode(
                    nodeContext,
                    contractAttribute,
                    reportedDiagnostics),
                SyntaxKinds);
            startContext.RegisterOperationBlockAction(
                blockContext => AnalyzeOperationBlocks(
                    blockContext,
                    contractAttribute,
                    reportedDiagnostics));
        });
    }

    private static void AnalyzeNamedType(
        SymbolAnalysisContext context,
        INamedTypeSymbol? contractAttribute,
        ConcurrentDictionary<DiagnosticKey, byte> reportedDiagnostics)
    {
        var type = (INamedTypeSymbol)context.Symbol;
        var namespaceName = type.ContainingNamespace.ToDisplayString();
        var isExported = HasContractAttribute(type, contractAttribute);

        if (SliceModel.LooksLikeFeatureNamespace(namespaceName) &&
            !SliceModel.TryClassify(type.ContainingNamespace, out var location))
        {
            ReportOnce(
                context.ReportDiagnostic,
                reportedDiagnostics,
                Diagnostic.Create(
                    UnknownSlice,
                    GetLocation(type),
                    namespaceName));
            return;
        }

        if (!isExported)
        {
            return;
        }

        if (!SliceModel.TryClassify(type.ContainingNamespace, out location) ||
            !location.IsExportLayer ||
            SliceModel.IsEntity(type))
        {
            ReportOnce(
                context.ReportDiagnostic,
                reportedDiagnostics,
                Diagnostic.Create(
                    InvalidExport,
                    GetLocation(type),
                    type.ToDisplayString()));
            return;
        }

        foreach (var exposedType in GetSignatureTypes(type))
        {
            foreach (var namedType in SliceModel.ExpandNamedTypes(exposedType))
            {
                if (SymbolEqualityComparer.Default.Equals(namedType, type.OriginalDefinition) ||
                    !SliceModel.LooksLikeFeatureNamespace(
                        namedType.ContainingNamespace.ToDisplayString()))
                {
                    continue;
                }

                if (!SliceModel.TryClassify(namedType.ContainingNamespace, out var exposedLocation))
                {
                    ReportOnce(
                        context.ReportDiagnostic,
                        reportedDiagnostics,
                        Diagnostic.Create(
                            UnknownSlice,
                            GetLocation(type),
                            namedType.ContainingNamespace.ToDisplayString()));
                    continue;
                }

                if (!HasContractAttribute(namedType, contractAttribute) ||
                    !exposedLocation.IsExportLayer ||
                    SliceModel.IsEntity(namedType))
                {
                    ReportOnce(
                        context.ReportDiagnostic,
                        reportedDiagnostics,
                        Diagnostic.Create(
                            SignatureLeak,
                            GetLocation(type),
                            type.ToDisplayString(),
                            namedType.ToDisplayString()));
                }
            }
        }
    }

    private static void AnalyzeSyntaxNode(
        SyntaxNodeAnalysisContext context,
        INamedTypeSymbol? contractAttribute,
        ConcurrentDictionary<DiagnosticKey, byte> reportedDiagnostics)
    {
        if (!TryGetSourceLocation(context.ContainingSymbol, out var sourceLocation))
        {
            return;
        }

        var referencedTypes = new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default);
        AddSymbolTypes(
            context.SemanticModel.GetSymbolInfo(context.Node, context.CancellationToken).Symbol,
            referencedTypes);

        if (context.Node is ExpressionSyntax expression)
        {
            var typeInfo = context.SemanticModel.GetTypeInfo(expression, context.CancellationToken);
            AddType(typeInfo.Type, referencedTypes);
            AddType(typeInfo.ConvertedType, referencedTypes);
        }

        foreach (var referencedType in referencedTypes)
        {
            AnalyzeReference(
                context.ReportDiagnostic,
                reportedDiagnostics,
                context.Node.GetLocation(),
                sourceLocation,
                referencedType,
                contractAttribute);
        }
    }

    private static void AnalyzeOperationBlocks(
        OperationBlockAnalysisContext context,
        INamedTypeSymbol? contractAttribute,
        ConcurrentDictionary<DiagnosticKey, byte> reportedDiagnostics)
    {
        if (!TryGetSourceLocation(context.OwningSymbol, out var sourceLocation))
        {
            return;
        }

        foreach (var block in context.OperationBlocks)
        {
            foreach (var operation in block.DescendantsAndSelf())
            {
                var referencedTypes = new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default);
                AddType(operation.Type, referencedTypes);
                AddOperationSymbolTypes(operation, referencedTypes);

                foreach (var referencedType in referencedTypes)
                {
                    AnalyzeReference(
                        context.ReportDiagnostic,
                        reportedDiagnostics,
                        operation.Syntax.GetLocation(),
                        sourceLocation,
                        referencedType,
                        contractAttribute);
                }
            }
        }
    }

    private static void AddOperationSymbolTypes(
        IOperation operation,
        HashSet<INamedTypeSymbol> referencedTypes)
    {
        switch (operation)
        {
            case IInvocationOperation invocation:
                AddSymbolTypes(invocation.TargetMethod, referencedTypes);
                break;
            case IObjectCreationOperation creation:
                AddSymbolTypes(creation.Constructor, referencedTypes);
                break;
            case IMethodReferenceOperation methodReference:
                AddSymbolTypes(methodReference.Method, referencedTypes);
                break;
            case IMemberReferenceOperation memberReference:
                AddSymbolTypes(memberReference.Member, referencedTypes);
                break;
            case IConversionOperation conversion:
                AddSymbolTypes(conversion.OperatorMethod, referencedTypes);
                break;
            case IBinaryOperation binary:
                AddSymbolTypes(binary.OperatorMethod, referencedTypes);
                break;
            case IUnaryOperation unary:
                AddSymbolTypes(unary.OperatorMethod, referencedTypes);
                break;
            case ITypeOfOperation typeOf:
                AddType(typeOf.TypeOperand, referencedTypes);
                break;
            case IIsTypeOperation isType:
                AddType(isType.TypeOperand, referencedTypes);
                break;
            case IDeclarationPatternOperation declarationPattern:
                AddType(declarationPattern.MatchedType, referencedTypes);
                break;
            case IRecursivePatternOperation recursivePattern:
                AddType(recursivePattern.MatchedType, referencedTypes);
                break;
            case ICatchClauseOperation catchClause:
                AddType(catchClause.ExceptionType, referencedTypes);
                break;
            case IVariableDeclaratorOperation variable:
                AddType(variable.Symbol.Type, referencedTypes);
                break;
            case ILocalReferenceOperation local:
                AddType(local.Local.Type, referencedTypes);
                break;
        }
    }

    private static void AnalyzeReference(
        Action<Diagnostic> reportDiagnostic,
        ConcurrentDictionary<DiagnosticKey, byte> reportedDiagnostics,
        Location location,
        SliceLocation source,
        INamedTypeSymbol referencedType,
        INamedTypeSymbol? contractAttribute)
    {
        var targetNamespace = referencedType.ContainingNamespace.ToDisplayString();
        if (!SliceModel.LooksLikeFeatureNamespace(targetNamespace))
        {
            return;
        }

        if (!SliceModel.TryClassify(referencedType.ContainingNamespace, out var target))
        {
            ReportOnce(
                reportDiagnostic,
                reportedDiagnostics,
                Diagnostic.Create(UnknownSlice, location, targetNamespace));
            return;
        }

        if (source.Slice == target.Slice)
        {
            return;
        }

        if (target.IsForbiddenLayer || SliceModel.IsEntity(referencedType))
        {
            ReportOnce(
                reportDiagnostic,
                reportedDiagnostics,
                Diagnostic.Create(
                    ForbiddenReference,
                    location,
                    source.Slice,
                    referencedType.ToDisplayString(),
                    target.Slice));
            return;
        }

        if (!target.IsExportLayer)
        {
            ReportOnce(
                reportDiagnostic,
                reportedDiagnostics,
                Diagnostic.Create(
                    UnexportedReference,
                    location,
                    referencedType.ToDisplayString(),
                    target.Slice,
                    source.Slice));
            return;
        }

        if (!HasContractAttribute(referencedType, contractAttribute))
        {
            ReportOnce(
                reportDiagnostic,
                reportedDiagnostics,
                Diagnostic.Create(
                    UnexportedReference,
                    location,
                    referencedType.ToDisplayString(),
                    target.Slice,
                    source.Slice));
        }
    }

    private static bool TryGetSourceLocation(ISymbol? symbol, out SliceLocation sourceLocation)
    {
        while (symbol is not null && symbol is not INamespaceSymbol)
        {
            if (symbol is INamedTypeSymbol namedType &&
                SliceModel.TryClassify(namedType.ContainingNamespace, out sourceLocation))
            {
                return true;
            }

            symbol = symbol.ContainingSymbol;
        }

        sourceLocation = default;
        return false;
    }

    private static void AddSymbolTypes(
        ISymbol? symbol,
        HashSet<INamedTypeSymbol> referencedTypes)
    {
        switch (symbol)
        {
            case INamedTypeSymbol type:
                AddType(type, referencedTypes);
                break;

            case IMethodSymbol method:
                AddType(method.ContainingType, referencedTypes);
                AddType(method.ReturnType, referencedTypes);
                foreach (var parameter in method.Parameters)
                {
                    AddType(parameter.Type, referencedTypes);
                }

                foreach (var typeArgument in method.TypeArguments)
                {
                    AddType(typeArgument, referencedTypes);
                }

                if (method.ReducedFrom is not null)
                {
                    AddType(method.ReducedFrom.ContainingType, referencedTypes);
                }

                break;

            case IPropertySymbol property:
                AddType(property.ContainingType, referencedTypes);
                AddType(property.Type, referencedTypes);
                break;

            case IFieldSymbol field:
                AddType(field.ContainingType, referencedTypes);
                AddType(field.Type, referencedTypes);
                break;

            case IEventSymbol @event:
                AddType(@event.ContainingType, referencedTypes);
                AddType(@event.Type, referencedTypes);
                break;

            case IParameterSymbol parameter:
                AddType(parameter.Type, referencedTypes);
                break;

            case ILocalSymbol local:
                AddType(local.Type, referencedTypes);
                break;

            case IAliasSymbol alias:
                AddSymbolTypes(alias.Target, referencedTypes);
                break;
        }
    }

    private static void AddType(
        ITypeSymbol? type,
        HashSet<INamedTypeSymbol> referencedTypes)
    {
        foreach (var namedType in SliceModel.ExpandNamedTypes(type))
        {
            referencedTypes.Add(namedType);
        }
    }

    private static IEnumerable<ITypeSymbol> GetSignatureTypes(INamedTypeSymbol type)
    {
        if (type.BaseType is not null && type.BaseType.SpecialType != SpecialType.System_Object)
        {
            yield return type.BaseType;
        }

        foreach (var @interface in type.Interfaces)
        {
            yield return @interface;
        }

        foreach (var typeParameter in type.TypeParameters)
        {
            foreach (var constraint in typeParameter.ConstraintTypes)
            {
                yield return constraint;
            }
        }

        foreach (var attribute in type.GetAttributes())
        {
            if (attribute.AttributeClass is not null &&
                attribute.AttributeClass.ToDisplayString() !=
                SliceModel.ContractAttributeMetadataName)
            {
                yield return attribute.AttributeClass;
            }
        }

        if (type.TypeKind == TypeKind.Delegate && type.DelegateInvokeMethod is not null)
        {
            foreach (var signatureType in GetMethodSignatureTypes(type.DelegateInvokeMethod))
            {
                yield return signatureType;
            }
        }

        foreach (var member in type.GetMembers())
        {
            if (!IsExternallyVisible(member))
            {
                continue;
            }

            switch (member)
            {
                case IMethodSymbol method
                    when method.MethodKind is not (
                        MethodKind.PropertyGet or
                        MethodKind.PropertySet or
                        MethodKind.EventAdd or
                        MethodKind.EventRemove):
                    foreach (var signatureType in GetMethodSignatureTypes(method))
                    {
                        yield return signatureType;
                    }

                    break;

                case IPropertySymbol property:
                    yield return property.Type;
                    foreach (var parameter in property.Parameters)
                    {
                        yield return parameter.Type;
                    }

                    break;

                case IFieldSymbol field when !field.IsImplicitlyDeclared:
                    yield return field.Type;
                    break;

                case IEventSymbol @event:
                    yield return @event.Type;
                    break;
            }
        }
    }

    private static IEnumerable<ITypeSymbol> GetMethodSignatureTypes(IMethodSymbol method)
    {
        yield return method.ReturnType;
        foreach (var parameter in method.Parameters)
        {
            yield return parameter.Type;
        }

        foreach (var typeParameter in method.TypeParameters)
        {
            foreach (var constraint in typeParameter.ConstraintTypes)
            {
                yield return constraint;
            }
        }
    }

    private static bool IsExternallyVisible(ISymbol symbol) =>
        symbol.DeclaredAccessibility is Accessibility.Public or
            Accessibility.Protected or
            Accessibility.ProtectedOrInternal;

    private static bool HasContractAttribute(
        INamedTypeSymbol type,
        INamedTypeSymbol? contractAttribute) =>
        contractAttribute is not null &&
        type.GetAttributes().Any(attribute =>
            SymbolEqualityComparer.Default.Equals(
                attribute.AttributeClass,
                contractAttribute));

    private static Location GetLocation(INamedTypeSymbol type) =>
        type.Locations.FirstOrDefault(location => location.IsInSource) ?? Location.None;

    private static void ReportOnce(
        Action<Diagnostic> reportDiagnostic,
        ConcurrentDictionary<DiagnosticKey, byte> reportedDiagnostics,
        Diagnostic diagnostic)
    {
        var span = diagnostic.Location.GetLineSpan();
        var key = new DiagnosticKey(
            diagnostic.Id,
            span.Path ?? string.Empty,
            diagnostic.Location.SourceSpan.Start,
            diagnostic.GetMessage());
        if (reportedDiagnostics.TryAdd(key, 0))
        {
            reportDiagnostic(diagnostic);
        }
    }

    private readonly struct DiagnosticKey : IEquatable<DiagnosticKey>
    {
        internal DiagnosticKey(string id, string path, int start, string message)
        {
            Id = id;
            Path = path;
            Start = start;
            Message = message;
        }

        private string Id { get; }
        private string Path { get; }
        private int Start { get; }
        private string Message { get; }

        public bool Equals(DiagnosticKey other) =>
            Id == other.Id && Path == other.Path && Start == other.Start && Message == other.Message;

        public override bool Equals(object? obj) => obj is DiagnosticKey other && Equals(other);

        public override int GetHashCode()
        {
            unchecked
            {
                var hashCode = Id.GetHashCode();
                hashCode = (hashCode * 397) ^ Path.GetHashCode();
                hashCode = (hashCode * 397) ^ Start;
                hashCode = (hashCode * 397) ^ Message.GetHashCode();
                return hashCode;
            }
        }
    }
}
