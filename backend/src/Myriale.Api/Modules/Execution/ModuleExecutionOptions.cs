namespace Myriale.Api.Modules.Execution;

public sealed class ModuleExecutionOptions
{
    public const string SectionName = "ModuleExecutions";
    public int MaxRandomValues { get; set; } = 64;
}
