using Microsoft.CodeAnalysis;

namespace Myriale.Architecture.Analyzers;

internal enum SliceLayer
{
    Unknown,
    Identifiers,
    Contracts,
    ApplicationPorts,
    Domain,
    Infrastructure,
    Http,
    Other,
}

internal readonly struct SliceLocation
{
    internal SliceLocation(string slice, SliceLayer layer)
    {
        Slice = slice;
        Layer = layer;
    }

    internal string Slice { get; }

    internal SliceLayer Layer { get; }

    internal bool IsExportLayer =>
        Layer is SliceLayer.Identifiers or SliceLayer.Contracts or SliceLayer.ApplicationPorts;

    internal bool IsForbiddenLayer =>
        Layer is SliceLayer.Domain or SliceLayer.Infrastructure or SliceLayer.Http;
}

internal static class SliceModel
{
    internal const string FeaturePrefix = "Myriale.Api.Features";
    internal const string ContractAttributeMetadataName =
        "Myriale.Api.Architecture.CrossSliceContractAttribute";

    internal static bool IsInFeatureScope(INamespaceSymbol namespaceSymbol) =>
        IsInFeatureScope(namespaceSymbol.ToDisplayString());

    internal static bool IsInFeatureScope(string namespaceName) =>
        namespaceName.StartsWith(FeaturePrefix + ".", StringComparison.Ordinal);

    internal static bool LooksLikeFeatureNamespace(string namespaceName) =>
        namespaceName.Equals(FeaturePrefix, StringComparison.Ordinal) ||
        IsInFeatureScope(namespaceName);

    internal static bool TryClassify(INamespaceSymbol namespaceSymbol, out SliceLocation location) =>
        TryClassify(namespaceSymbol.ToDisplayString(), out location);

    internal static bool TryClassify(string namespaceName, out SliceLocation location)
    {
        location = default;
        if (!IsInFeatureScope(namespaceName))
        {
            return false;
        }

        var remainder = namespaceName.Substring(FeaturePrefix.Length + 1);
        var segments = remainder.Split('.');
        if (segments.Length < 1 || string.IsNullOrWhiteSpace(segments[0]))
        {
            return false;
        }

        var layer = segments.Length == 1
            ? SliceLayer.Unknown
            : segments[1] switch
            {
                "Identifiers" => SliceLayer.Identifiers,
                "Contracts" => SliceLayer.Contracts,
                "Application" when segments.Length >= 3 && segments[2] == "Ports" =>
                    SliceLayer.ApplicationPorts,
                "Application" => SliceLayer.Other,
                "Domain" => SliceLayer.Domain,
                "Infrastructure" => SliceLayer.Infrastructure,
                "Http" => SliceLayer.Http,
                _ => SliceLayer.Other,
            };

        location = new SliceLocation(segments[0], layer);
        return true;
    }

    internal static bool IsEntity(INamedTypeSymbol type) =>
        type.TypeKind == TypeKind.Class &&
        (type.Name.EndsWith("Entity", StringComparison.Ordinal) ||
         InheritsEntityNamedType(type.BaseType));

    internal static IEnumerable<INamedTypeSymbol> ExpandNamedTypes(ITypeSymbol? type)
    {
        if (type is null)
        {
            yield break;
        }

        switch (type)
        {
            case IArrayTypeSymbol array:
                foreach (var item in ExpandNamedTypes(array.ElementType))
                {
                    yield return item;
                }

                yield break;

            case IPointerTypeSymbol pointer:
                foreach (var item in ExpandNamedTypes(pointer.PointedAtType))
                {
                    yield return item;
                }

                yield break;

            case IFunctionPointerTypeSymbol functionPointer:
                foreach (var item in ExpandNamedTypes(functionPointer.Signature.ReturnType))
                {
                    yield return item;
                }

                foreach (var parameter in functionPointer.Signature.Parameters)
                {
                    foreach (var item in ExpandNamedTypes(parameter.Type))
                    {
                        yield return item;
                    }
                }

                yield break;

            case ITypeParameterSymbol typeParameter:
                foreach (var constraint in typeParameter.ConstraintTypes)
                {
                    foreach (var item in ExpandNamedTypes(constraint))
                    {
                        yield return item;
                    }
                }

                yield break;

            case INamedTypeSymbol named:
                yield return named.OriginalDefinition;

                if (named.IsTupleType)
                {
                    foreach (var element in named.TupleElements)
                    {
                        foreach (var item in ExpandNamedTypes(element.Type))
                        {
                            yield return item;
                        }
                    }
                }

                foreach (var argument in named.TypeArguments)
                {
                    foreach (var item in ExpandNamedTypes(argument))
                    {
                        yield return item;
                    }
                }

                yield break;
        }
    }

    private static bool InheritsEntityNamedType(INamedTypeSymbol? type)
    {
        while (type is not null)
        {
            if (type.Name.EndsWith("Entity", StringComparison.Ordinal))
            {
                return true;
            }

            type = type.BaseType;
        }

        return false;
    }
}
