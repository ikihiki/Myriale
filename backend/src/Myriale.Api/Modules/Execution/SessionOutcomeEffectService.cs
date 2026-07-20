using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;
using Myriale.ModuleSdk;

namespace Myriale.Api.Modules.Execution;

public sealed partial class SessionOutcomeEffectService(ApplicationDbContext db)
{
    private const int MaxFlagDocumentBytes = 65_536;
    private readonly JsonSerializerOptions _json = ModuleJsonSerializerOptions.Create();

    public async Task<SessionOutcomeEffectResult> PrepareAsync(
        ModuleExecution execution,
        ModuleExecutionRequest request,
        ModuleOutcome? outcome,
        CancellationToken cancellationToken)
    {
        if (execution.SessionTurnId is null || outcome is null || outcome.Effects.Count == 0)
            return SessionOutcomeEffectResult.Success;

        if (request.ExpectedSessionRevision is null)
            return Invalid("missing_session_revision", "Session所有のOutcomeにsession revisionが記録されていません。");

        var sessionId = await db.SessionTurns.AsNoTracking()
            .Where(turn => turn.Id == execution.SessionTurnId)
            .Select(turn => turn.SessionId)
            .SingleAsync(cancellationToken);
        var session = await db.Sessions.SingleAsync(item => item.Id == sessionId, cancellationToken);
        var state = await db.SessionStates.SingleAsync(item => item.SessionId == sessionId, cancellationToken);
        if (state.Revision != request.ExpectedSessionRevision.Value)
            return SessionOutcomeEffectResult.Conflict(state.Revision);

        IReadOnlyList<string>? capabilities;
        try
        {
            capabilities = JsonSerializer.Deserialize<IReadOnlyList<string>>(execution.CapabilitiesJson, _json);
        }
        catch (JsonException)
        {
            return Invalid("effect_manifest_unavailable", "実行開始時のCapabilityを確認できません。");
        }

        if (capabilities is null)
            return Invalid("effect_manifest_unavailable", "実行開始時のCapabilityを確認できません。");
        if (!capabilities.Contains(ModuleCapabilities.EmitSessionEffects, StringComparer.Ordinal))
            return Invalid("effect_capability_missing", "モジュールはSession EffectのCapabilityを宣言していません。");

        Dictionary<string, bool> flags;
        try
        {
            flags = JsonSerializer.Deserialize<Dictionary<string, bool>>(state.FlagsJson, _json)
                ?? new Dictionary<string, bool>(StringComparer.Ordinal);
        }
        catch (JsonException)
        {
            return Invalid("session_state_corrupt", "保存済みのSession flag stateを読み込めません。");
        }
        foreach (var effect in outcome.Effects)
        {
            if (!string.Equals(effect.Type, ModuleEffectTypes.SetFlag, StringComparison.Ordinal))
                return Invalid("unsupported_effect", $"未対応のEffect typeです: {effect.Type}");
            if (effect.Payload.ValueKind != JsonValueKind.Object
                || !effect.Payload.TryGetProperty("flagId", out var flagIdElement)
                || flagIdElement.ValueKind != JsonValueKind.String
                || !effect.Payload.TryGetProperty("value", out var valueElement)
                || valueElement.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
                return Invalid("invalid_effect_payload", "set-flagにはflagId文字列とvalue真偽値が必要です。");

            var flagId = flagIdElement.GetString();
            if (string.IsNullOrWhiteSpace(flagId) || flagId.Length > 128 || !FlagIdPattern().IsMatch(flagId))
                return Invalid("invalid_effect_payload", "flagIdは英数字で始まる128文字以内の識別子で指定してください。");
            if (effect.Payload.EnumerateObject().Any(property => property.Name is not ("flagId" or "value")))
                return Invalid("invalid_effect_payload", "set-flagに未対応のプロパティが含まれています。");
            flags[flagId] = valueElement.GetBoolean();
        }

        var flagsJson = JsonSerializer.Serialize(flags, _json);
        if (JsonSerializer.SerializeToUtf8Bytes(flags, _json).Length > MaxFlagDocumentBytes)
            return Invalid("session_state_too_large", "Session flag stateが上限を超えています。");

        var now = DateTimeOffset.UtcNow;
        session.UpdatedAt = now;
        state.FlagsJson = flagsJson;
        state.Revision++;
        state.UpdatedAt = now;
        db.ModuleOutcomeApplications.Add(new ModuleOutcomeApplication
        {
            ExecutionId = execution.Id,
            SessionId = sessionId,
            ModuleExecutionRequestId = request.Id,
            ExpectedSessionRevision = request.ExpectedSessionRevision.Value,
            AppliedSessionRevision = state.Revision,
            EffectCount = outcome.Effects.Count,
            AppliedAt = now,
        });
        return SessionOutcomeEffectResult.Success;
    }

    private static SessionOutcomeEffectResult Invalid(string code, string message) => new(false, code, message, null);

    [GeneratedRegex("^[A-Za-z0-9][A-Za-z0-9._:-]*$", RegexOptions.CultureInvariant)]
    private static partial Regex FlagIdPattern();
}

public sealed record SessionOutcomeEffectResult(
    bool IsSuccess,
    string? Code,
    string? Message,
    long? CurrentSessionRevision)
{
    public static SessionOutcomeEffectResult Success { get; } = new(true, null, null, null);
    public static SessionOutcomeEffectResult Conflict(long currentRevision) =>
        new(false, "session_revision_conflict", "Session stateのrevisionが更新されています。", currentRevision);
    public static SessionOutcomeEffectResult Advanced(long currentRevision) =>
        new(false, "session_advanced", "Module処理中にSessionが進行しました。", currentRevision);
}
