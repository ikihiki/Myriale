namespace Myriale.Api.Features.Scenarios.Domain;

public enum ScenarioPublicationStatus
{
    Draft,
    Published,
}

public enum DefinitionStatus
{
    Draft,
    Published,
}

public enum HeroMode
{
    Fixed,
    Select,
    Free,
}

public enum ActionVisibility
{
    AiChoice,
    ManualUi,
    SystemOnly,
}

public enum ActionExecutionMode
{
    Rule,
    ExtensionModule,
}

public static class ScenarioEnumValues
{
    public static string ToWireValue(this ScenarioPublicationStatus value) => value switch
    {
        ScenarioPublicationStatus.Draft => "draft",
        ScenarioPublicationStatus.Published => "published",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWireValue(this DefinitionStatus value) => value switch
    {
        DefinitionStatus.Draft => "draft",
        DefinitionStatus.Published => "published",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWireValue(this HeroMode value) => value switch
    {
        HeroMode.Fixed => "fixed",
        HeroMode.Select => "select",
        HeroMode.Free => "free",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWireValue(this ActionVisibility value) => value switch
    {
        ActionVisibility.AiChoice => "ai-choice",
        ActionVisibility.ManualUi => "manual-ui",
        ActionVisibility.SystemOnly => "system-only",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWireValue(this ActionExecutionMode value) => value switch
    {
        ActionExecutionMode.Rule => "rule",
        ActionExecutionMode.ExtensionModule => "extension-module",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static HeroMode ParseHeroMode(string? value) => value switch
    {
        "fixed" => HeroMode.Fixed,
        "select" => HeroMode.Select,
        "free" or null => HeroMode.Free,
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown hero mode."),
    };

    public static ActionVisibility ParseActionVisibility(string value) => value switch
    {
        "ai-choice" => ActionVisibility.AiChoice,
        "manual-ui" => ActionVisibility.ManualUi,
        "system-only" => ActionVisibility.SystemOnly,
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown action visibility."),
    };

    public static ActionExecutionMode ParseActionExecutionMode(string value) => value switch
    {
        "rule" => ActionExecutionMode.Rule,
        "extension-module" => ActionExecutionMode.ExtensionModule,
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown action execution mode."),
    };
}

public readonly record struct ScenarioTitle
{
    public string Value { get; }
    public ScenarioTitle(string value)
    {
        value = value?.Trim() ?? string.Empty;
        if (value.Length is 0 or > 160) throw new ArgumentOutOfRangeException(nameof(value), "Scenario title must contain 1-160 characters.");
        Value = value;
    }
    public static implicit operator string(ScenarioTitle value) => value.Value;
    public static implicit operator ScenarioTitle(string value) => new(value);
    public override string ToString() => Value;
}

public readonly record struct IllustrationPrompt
{
    public string Value { get; }
    public IllustrationPrompt(string? value)
    {
        value = value?.Trim() ?? string.Empty;
        if (value.Length > 240) throw new ArgumentOutOfRangeException(nameof(value), "Illustration prompt must not exceed 240 characters.");
        Value = value;
    }
    public static implicit operator string(IllustrationPrompt value) => value.Value ?? string.Empty;
    public static implicit operator IllustrationPrompt(string? value) => new(value);
    public override string ToString() => Value ?? string.Empty;
}
