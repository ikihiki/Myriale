namespace Myriale.ModuleSdk;

public interface IMyrialeModule
{
    ModuleManifest GetManifest();

    ValueTask<ModuleValidationResult> ValidateConfigAsync(
        ModuleValidationRequest request,
        CancellationToken cancellationToken);

    ValueTask<ModuleInitializationResult> InitializeAsync(
        ModuleInitializationRequest request,
        CancellationToken cancellationToken);

    ValueTask<ModuleTransitionResult> DispatchAsync(
        ModuleDispatchRequest request,
        CancellationToken cancellationToken);
}
