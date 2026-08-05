using Mono.Cecil;
using Mono.Cecil.Cil;
using Myriale.Api.Architecture;

namespace Myriale.Api.Tests;

public sealed class SliceDependencyArchitectureTests
{
    private const string FeaturesPrefix = "Myriale.Api.Features.";
    private const string ExportAttribute = "Myriale.Api.Architecture.CrossSliceContractAttribute";

    [Fact]
    public void EveryFeaturesNamespaceHasExactlyOneRootMarker()
    {
        var featureTypes = typeof(Program).Assembly.GetTypes()
            .Where(type => TryGetSlice(type.Namespace, out _))
            .ToArray();
        var slices = featureTypes.Select(type =>
        {
            _ = TryGetSlice(type.Namespace, out var slice);
            return slice;
        }).Distinct(StringComparer.Ordinal).ToArray();

        Assert.All(slices, slice =>
        {
            var rootNamespace = FeaturesPrefix + slice;
            var marker = Assert.Single(featureTypes, type => type.Namespace == rootNamespace
                && type.GetCustomAttributes(typeof(FeatureSliceAttribute), false).Length == 1);
            Assert.Equal(slice, ((FeatureSliceAttribute)marker.GetCustomAttributes(typeof(FeatureSliceAttribute), false).Single()).Name);
        });
    }

    [Fact]
    public void EmittedIlReferencesOnlyExportedCrossSliceContracts()
    {
        using var assembly = AssemblyDefinition.ReadAssembly(typeof(Program).Assembly.Location);
        var violations = new List<string>();
        var migrations = GetMigrations(assembly);

        foreach (var source in AllTypes(assembly.MainModule.Types).Where(type => TryGetSlice(type.Namespace, out _)))
        {
            _ = TryGetSlice(source.Namespace, out var sourceSlice);
            foreach (var reference in ReferencedTypes(source))
            {
                var target = Resolve(reference);
                if (target is null || target.Module != assembly.MainModule || !TryGetSlice(target.Namespace, out var targetSlice) || sourceSlice == targetSlice)
                    continue;
                if (migrations.Contains((sourceSlice, targetSlice)))
                    continue;

                if (!IsExported(target) || !IsExportableLayer(target, targetSlice))
                    violations.Add($"{source.FullName} ({sourceSlice}) -> {target.FullName} ({targetSlice})");
            }
        }

        Assert.Empty(violations.Distinct(StringComparer.Ordinal).OrderBy(value => value, StringComparer.Ordinal));
    }

    [Fact]
    public void ExportDeclarationsAndSignatureClosureAreValid()
    {
        using var assembly = AssemblyDefinition.ReadAssembly(typeof(Program).Assembly.Location);
        var violations = new List<string>();
        var exports = AllTypes(assembly.MainModule.Types).Where(IsExported).ToArray();
        Assert.NotEmpty(exports);

        foreach (var export in exports)
        {
            if (!TryGetSlice(export.Namespace, out var owner) || !IsExportableLayer(export, owner))
            {
                violations.Add($"Invalid export layer: {export.FullName}");
                continue;
            }

            foreach (var reference in SignatureTypes(export))
            {
                var target = Resolve(reference);
                if (target is null || target.Module != assembly.MainModule || target == export || target.DeclaringType == export)
                    continue;
                if (TryGetSlice(target.Namespace, out _) && !IsExported(target))
                    violations.Add($"Signature leak: {export.FullName} -> {target.FullName}");
            }
        }

        Assert.Empty(violations.Distinct(StringComparer.Ordinal).OrderBy(value => value, StringComparer.Ordinal));
    }

    [Fact]
    public void IdentifierIlDependsOnlyOnBclUnitGeneratorAndArchitectureMetadata()
    {
        using var assembly = AssemblyDefinition.ReadAssembly(typeof(Program).Assembly.Location);
        var violations = AllTypes(assembly.MainModule.Types)
            .Where(type => type.Namespace?.Contains(".Identifiers", StringComparison.Ordinal) == true)
            .SelectMany(type => ReferencedTypes(type).Select(reference => (Source: type, Target: Resolve(reference))))
            .Where(item => item.Target is not null && item.Target != item.Source && item.Target.DeclaringType != item.Source)
            .Where(item => !IsAllowedIdentifierDependency(item.Target!))
            .Select(item => $"{item.Source.FullName} -> {item.Target!.FullName}")
            .Distinct(StringComparer.Ordinal)
            .OrderBy(value => value, StringComparer.Ordinal)
            .ToArray();

        Assert.Empty(violations);
    }

    private static HashSet<(string Source, string Target)> GetMigrations(AssemblyDefinition assembly)
    {
        const string migrationAttribute = "Myriale.Api.Architecture.CrossSliceMigrationAttribute";
        return assembly.CustomAttributes
            .Where(attribute => attribute.AttributeType.FullName == migrationAttribute && attribute.ConstructorArguments.Count >= 2)
            .Select(attribute => (
                Source: (string)attribute.ConstructorArguments[0].Value,
                Target: (string)attribute.ConstructorArguments[1].Value))
            .ToHashSet();
    }

    private static bool IsAllowedIdentifierDependency(TypeDefinition target) =>
        target.Scope.Name != typeof(Program).Assembly.GetName().Name
        || target.Namespace is { } ns && (ns.StartsWith("System", StringComparison.Ordinal)
            || ns.StartsWith("UnitGenerator", StringComparison.Ordinal)
            || ns.StartsWith("Myriale.Api.Architecture", StringComparison.Ordinal));

    private static bool IsExportableLayer(TypeDefinition type, string slice)
    {
        var relative = type.Namespace?[(FeaturesPrefix.Length + slice.Length)..].TrimStart('.') ?? string.Empty;
        return relative == "Identifiers" || relative.StartsWith("Identifiers.", StringComparison.Ordinal)
            || relative == "Contracts" || relative.StartsWith("Contracts.", StringComparison.Ordinal)
            || relative == "Application.Ports" || relative.StartsWith("Application.Ports.", StringComparison.Ordinal);
    }

    private static bool IsExported(TypeDefinition type) => type.CustomAttributes.Any(attribute => attribute.AttributeType.FullName == ExportAttribute);

    private static bool TryGetSlice(string? @namespace, out string slice)
    {
        slice = string.Empty;
        if (@namespace is null || !@namespace.StartsWith(FeaturesPrefix, StringComparison.Ordinal)) return false;
        var remainder = @namespace[FeaturesPrefix.Length..];
        var separator = remainder.IndexOf('.');
        slice = separator < 0 ? remainder : remainder[..separator];
        return slice.Length > 0;
    }

    private static IEnumerable<TypeDefinition> AllTypes(IEnumerable<TypeDefinition> roots)
    {
        foreach (var type in roots)
        {
            yield return type;
            foreach (var nested in AllTypes(type.NestedTypes)) yield return nested;
        }
    }

    private static IEnumerable<TypeReference> ReferencedTypes(TypeDefinition type)
    {
        foreach (var reference in SignatureTypes(type)) yield return reference;
        foreach (var method in type.Methods.Where(method => method.HasBody))
        {
            foreach (var variable in method.Body.Variables) foreach (var reference in Flatten(variable.VariableType)) yield return reference;
            foreach (var handler in method.Body.ExceptionHandlers)
                if (handler.CatchType is not null) foreach (var reference in Flatten(handler.CatchType)) yield return reference;
            foreach (var instruction in method.Body.Instructions)
                foreach (var reference in OperandTypes(instruction.Operand)) yield return reference;
        }
    }

    private static IEnumerable<TypeReference> SignatureTypes(TypeDefinition type)
    {
        if (type.BaseType is not null) foreach (var reference in Flatten(type.BaseType)) yield return reference;
        foreach (var implementation in type.Interfaces) foreach (var reference in Flatten(implementation.InterfaceType)) yield return reference;
        foreach (var attribute in type.CustomAttributes) foreach (var reference in AttributeTypes(attribute)) yield return reference;
        foreach (var parameter in type.GenericParameters)
            foreach (var constraint in parameter.Constraints) foreach (var reference in Flatten(constraint.ConstraintType)) yield return reference;
        foreach (var field in type.Fields) foreach (var reference in Flatten(field.FieldType)) yield return reference;
        foreach (var property in type.Properties) foreach (var reference in Flatten(property.PropertyType)) yield return reference;
        foreach (var @event in type.Events) foreach (var reference in Flatten(@event.EventType)) yield return reference;
        foreach (var method in type.Methods)
        {
            foreach (var reference in Flatten(method.ReturnType)) yield return reference;
            foreach (var parameter in method.Parameters) foreach (var reference in Flatten(parameter.ParameterType)) yield return reference;
            foreach (var parameter in method.GenericParameters)
                foreach (var constraint in parameter.Constraints) foreach (var reference in Flatten(constraint.ConstraintType)) yield return reference;
            foreach (var attribute in method.CustomAttributes) foreach (var reference in AttributeTypes(attribute)) yield return reference;
        }
    }

    private static IEnumerable<TypeReference> AttributeTypes(CustomAttribute attribute)
    {
        foreach (var reference in Flatten(attribute.AttributeType)) yield return reference;
        foreach (var argument in attribute.ConstructorArguments) foreach (var reference in AttributeArgumentTypes(argument)) yield return reference;
        foreach (var argument in attribute.Fields) foreach (var reference in AttributeArgumentTypes(argument.Argument)) yield return reference;
        foreach (var argument in attribute.Properties) foreach (var reference in AttributeArgumentTypes(argument.Argument)) yield return reference;
    }

    private static IEnumerable<TypeReference> AttributeArgumentTypes(CustomAttributeArgument argument)
    {
        foreach (var reference in Flatten(argument.Type)) yield return reference;
        if (argument.Value is TypeReference type) foreach (var reference in Flatten(type)) yield return reference;
        if (argument.Value is CustomAttributeArgument[] arguments)
            foreach (var nested in arguments) foreach (var reference in AttributeArgumentTypes(nested)) yield return reference;
    }

    private static IEnumerable<TypeReference> OperandTypes(object? operand)
    {
        switch (operand)
        {
            case TypeReference type:
                foreach (var reference in Flatten(type)) yield return reference;
                break;
            case MethodReference method:
                foreach (var reference in Flatten(method.DeclaringType)) yield return reference;
                foreach (var reference in Flatten(method.ReturnType)) yield return reference;
                foreach (var parameter in method.Parameters) foreach (var reference in Flatten(parameter.ParameterType)) yield return reference;
                if (method is GenericInstanceMethod genericMethod)
                    foreach (var argument in genericMethod.GenericArguments) foreach (var reference in Flatten(argument)) yield return reference;
                break;
            case FieldReference field:
                foreach (var reference in Flatten(field.DeclaringType)) yield return reference;
                foreach (var reference in Flatten(field.FieldType)) yield return reference;
                break;
            case CallSite callSite:
                foreach (var reference in Flatten(callSite.ReturnType)) yield return reference;
                foreach (var parameter in callSite.Parameters) foreach (var reference in Flatten(parameter.ParameterType)) yield return reference;
                break;
        }
    }

    private static IEnumerable<TypeReference> Flatten(TypeReference type)
    {
        yield return type;
        if (type.DeclaringType is not null) foreach (var reference in Flatten(type.DeclaringType)) yield return reference;
        if (type is TypeSpecification specification) foreach (var reference in Flatten(specification.ElementType)) yield return reference;
        if (type is GenericInstanceType generic)
            foreach (var argument in generic.GenericArguments) foreach (var reference in Flatten(argument)) yield return reference;
        if (type is FunctionPointerType pointer)
        {
            foreach (var reference in Flatten(pointer.ReturnType)) yield return reference;
            foreach (var parameter in pointer.Parameters) foreach (var reference in Flatten(parameter.ParameterType)) yield return reference;
        }
    }

    private static TypeDefinition? Resolve(TypeReference reference)
    {
        try { return reference.Resolve(); }
        catch (AssemblyResolutionException) { return null; }
        catch (ResolutionException) { return null; }
    }
}
