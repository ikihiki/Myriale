namespace Myriale.Api.Data;

public enum SessionStatus { Active, Completed, Debug }
public enum SessionTurnKind { Narrative, Module }
public enum SessionTurnType { Opening, ActionResult, ModuleHandoff }
public enum SessionInputInteractionType { Dialogue, Clarification }

public static class SessionEnumValues
{
    public static string ToWireValue(this SessionStatus value) => value switch
    {
        SessionStatus.Active => "active", SessionStatus.Completed => "completed", SessionStatus.Debug => "debug",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };
    public static string ToWireValue(this SessionTurnKind value) => value switch
    {
        SessionTurnKind.Narrative => "narrative", SessionTurnKind.Module => "module",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };
    public static string ToWireValue(this SessionTurnType value) => value switch
    {
        SessionTurnType.Opening => "opening", SessionTurnType.ActionResult => "action-result", SessionTurnType.ModuleHandoff => "module-handoff",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };
    public static string ToWireValue(this SessionInputInteractionType value) => value switch
    {
        SessionInputInteractionType.Dialogue => "dialogue", SessionInputInteractionType.Clarification => "clarification",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };
    public static SessionStatus ParseStatus(string value) => value switch { "active" => SessionStatus.Active, "completed" => SessionStatus.Completed, "debug" => SessionStatus.Debug, _ => throw Unknown(value) };
    public static SessionTurnKind ParseTurnKind(string value) => value switch { "narrative" => SessionTurnKind.Narrative, "module" => SessionTurnKind.Module, _ => throw Unknown(value) };
    public static SessionTurnType ParseTurnType(string value) => value switch { "opening" => SessionTurnType.Opening, "action-result" => SessionTurnType.ActionResult, "module-handoff" => SessionTurnType.ModuleHandoff, _ => throw Unknown(value) };
    public static SessionInputInteractionType ParseInteractionType(string value) => value switch { "dialogue" => SessionInputInteractionType.Dialogue, "clarification" => SessionInputInteractionType.Clarification, _ => throw Unknown(value) };
    public static bool TryParseInteractionType(string? value, out SessionInputInteractionType result)
    {
        if (value is "dialogue") { result = SessionInputInteractionType.Dialogue; return true; }
        if (value is "clarification") { result = SessionInputInteractionType.Clarification; return true; }
        result = default; return false;
    }
    private static InvalidOperationException Unknown(string value) => new($"Unknown Session domain value '{value}'.");
}
