namespace Myriale.Api.Features.ModuleExecutions.Infrastructure;

public sealed class ModuleExecutionOptions
{
    public const string SectionName = "ModuleExecutions";
    public int MaxRandomValues { get; set; } = 64;
}
