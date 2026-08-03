namespace Myriale.Api.Data;

public readonly record struct ScenarioPublicationStatus
{
    public static readonly ScenarioPublicationStatus Draft = new("draft");
    public static readonly ScenarioPublicationStatus Published = new("published");
    public string Value { get; }
    public ScenarioPublicationStatus(string value) => Value = value is "draft" or "published" ? value : throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown scenario publication status.");
    public static implicit operator string(ScenarioPublicationStatus value) => value.Value;
    public static implicit operator ScenarioPublicationStatus(string value) => new(value);
    public override string ToString() => Value;
}

public readonly record struct DefinitionStatus
{
    public static readonly DefinitionStatus Draft = new("draft");
    public static readonly DefinitionStatus Published = new("published");
    public string Value { get; }
    public DefinitionStatus(string value) => Value = value is "draft" or "published" ? value : throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown definition status.");
    public static implicit operator string(DefinitionStatus value) => value.Value;
    public static implicit operator DefinitionStatus(string value) => new(value);
    public override string ToString() => Value;
}

public readonly record struct HeroPolicy
{
    public static readonly HeroPolicy Fixed = new("fixed");
    public static readonly HeroPolicy Select = new("select");
    public static readonly HeroPolicy Free = new("free");
    public string Value { get; }
    public HeroPolicy(string value) => Value = value is "fixed" or "select" or "free" ? value : throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown hero policy.");
    public static bool TryCreate(string? value, out HeroPolicy policy)
    {
        if (value is "fixed" or "select" or "free") { policy = new(value); return true; }
        policy = default; return false;
    }
    public static implicit operator string(HeroPolicy value) => value.Value;
    public static implicit operator HeroPolicy(string value) => new(value);
    public override string ToString() => Value;
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

public readonly record struct ActionVisibility
{
    public string Value { get; }
    public ActionVisibility(string value) => Value = value is "ai-choice" or "manual-ui" or "system-only" ? value : throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown action visibility.");
    public static bool IsValid(string? value) => value is "ai-choice" or "manual-ui" or "system-only";
    public static implicit operator string(ActionVisibility value) => value.Value;
    public static implicit operator ActionVisibility(string value) => new(value);
    public override string ToString() => Value;
}

public readonly record struct ActionExecutionMode
{
    public string Value { get; }
    public ActionExecutionMode(string value) => Value = value is "rule" or "extension-module" ? value : throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown action execution mode.");
    public static bool IsValid(string? value) => value is "rule" or "extension-module";
    public static implicit operator string(ActionExecutionMode value) => value.Value;
    public static implicit operator ActionExecutionMode(string value) => new(value);
    public override string ToString() => Value;
}
