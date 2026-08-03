namespace Myriale.Api.Data;

public enum SessionNoteKind
{
    Person,
    Location,
    Item,
    Organization,
    Rule,
}

public enum SessionNoteCanonStatus
{
    Canon,
    Unconfirmed,
    Rumor,
}

public enum SessionNoteUpdateSource
{
    User,
    AiApproved,
}

public enum SessionNoteProposalStatus
{
    Pending,
    Snoozed,
    Applied,
    Rejected,
}

public static class SessionMemoryEnumValues
{
    public static string ToWireValue(this SessionNoteKind value) => value switch
    {
        SessionNoteKind.Person => "person",
        SessionNoteKind.Location => "location",
        SessionNoteKind.Item => "item",
        SessionNoteKind.Organization => "organization",
        SessionNoteKind.Rule => "rule",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWireValue(this SessionNoteCanonStatus value) => value switch
    {
        SessionNoteCanonStatus.Canon => "canon",
        SessionNoteCanonStatus.Unconfirmed => "unconfirmed",
        SessionNoteCanonStatus.Rumor => "rumor",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWireValue(this SessionNoteUpdateSource value) => value switch
    {
        SessionNoteUpdateSource.User => "user",
        SessionNoteUpdateSource.AiApproved => "ai-approved",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWireValue(this SessionNoteProposalStatus value) => value switch
    {
        SessionNoteProposalStatus.Pending => "pending",
        SessionNoteProposalStatus.Snoozed => "snoozed",
        SessionNoteProposalStatus.Applied => "applied",
        SessionNoteProposalStatus.Rejected => "rejected",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static bool TryParseNoteKind(string value, out SessionNoteKind result) => TryParse(value, out result,
        ("person", SessionNoteKind.Person), ("location", SessionNoteKind.Location), ("item", SessionNoteKind.Item),
        ("organization", SessionNoteKind.Organization), ("rule", SessionNoteKind.Rule));

    public static bool TryParseCanonStatus(string value, out SessionNoteCanonStatus result) => TryParse(value, out result,
        ("canon", SessionNoteCanonStatus.Canon), ("unconfirmed", SessionNoteCanonStatus.Unconfirmed), ("rumor", SessionNoteCanonStatus.Rumor));

    public static SessionNoteKind ParseNoteKind(string value) => TryParseNoteKind(value, out var result)
        ? result : throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown note kind.");

    public static SessionNoteCanonStatus ParseCanonStatus(string value) => TryParseCanonStatus(value, out var result)
        ? result : throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown canon status.");

    public static SessionNoteUpdateSource ParseUpdateSource(string value) => value switch
    {
        "user" => SessionNoteUpdateSource.User,
        "ai-approved" => SessionNoteUpdateSource.AiApproved,
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown update source."),
    };

    public static SessionNoteProposalStatus ParseProposalStatus(string value) => value switch
    {
        "pending" => SessionNoteProposalStatus.Pending,
        "snoozed" => SessionNoteProposalStatus.Snoozed,
        "applied" => SessionNoteProposalStatus.Applied,
        "rejected" => SessionNoteProposalStatus.Rejected,
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown proposal status."),
    };

    private static bool TryParse<T>(string value, out T result, params (string Wire, T Value)[] values) where T : struct
    {
        foreach (var candidate in values)
        {
            if (string.Equals(value, candidate.Wire, StringComparison.Ordinal))
            {
                result = candidate.Value;
                return true;
            }
        }
        result = default;
        return false;
    }
}
