using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Features.AiProviders.Application;

public enum AiPlaygroundDocumentOutcome
{
    Success,
    NotFound,
    ValidationFailed,
    Conflict,
}

public sealed record AiPlaygroundDocumentResult(
    AiPlaygroundDocumentOutcome Outcome,
    AiPlaygroundDocumentResponse? Value = null,
    string? Error = null);

public sealed class AiPlaygroundDocumentService(ApplicationDbContext dbContext)
{
    public async Task<AiPlaygroundDocumentResult> GetAsync(string ownerAccountId, CancellationToken cancellationToken)
    {
        var stored = await dbContext.AiPlaygroundDocuments
            .AsNoTracking()
            .SingleOrDefaultAsync(document => document.OwnerAccountId == ownerAccountId, cancellationToken);
        return stored is null
            ? new(AiPlaygroundDocumentOutcome.NotFound)
            : new(AiPlaygroundDocumentOutcome.Success, ToResponse(stored));
    }

    public async Task<AiPlaygroundDocumentResult> PutAsync(
        string ownerAccountId,
        JsonElement document,
        long? expectedRevision,
        CancellationToken cancellationToken)
    {
        var validationError = AiPlaygroundDocumentValidator.Validate(document);
        if (validationError is not null)
        {
            return new(AiPlaygroundDocumentOutcome.ValidationFailed, Error: validationError);
        }

        var documentJson = CanonicalJson.Serialize(document);
        var stored = await dbContext.AiPlaygroundDocuments
            .SingleOrDefaultAsync(item => item.OwnerAccountId == ownerAccountId, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        if (stored is null)
        {
            if (expectedRevision is not null)
            {
                return new(AiPlaygroundDocumentOutcome.Conflict, Error: "The AI Playground document does not exist at the expected revision.");
            }

            stored = AiPlaygroundDocument.Create(ownerAccountId, documentJson, now);
            dbContext.AiPlaygroundDocuments.Add(stored);
        }
        else
        {
            if (expectedRevision is null || stored.Revision != expectedRevision)
            {
                return new(AiPlaygroundDocumentOutcome.Conflict, Error: "The AI Playground document has been updated.");
            }

            stored.Update(documentJson, expectedRevision.Value, now);
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return new(AiPlaygroundDocumentOutcome.Conflict, Error: "The AI Playground document has been updated.");
        }
        catch (DbUpdateException) when (expectedRevision is null)
        {
            return new(AiPlaygroundDocumentOutcome.Conflict, Error: "The AI Playground document already exists.");
        }

        return new(AiPlaygroundDocumentOutcome.Success, ToResponse(stored));
    }

    private static AiPlaygroundDocumentResponse ToResponse(AiPlaygroundDocument stored)
    {
        using var parsed = JsonDocument.Parse(stored.DocumentJson);
        return new(parsed.RootElement.Clone(), stored.Revision, stored.UpdatedAt);
    }
}

internal static class CanonicalJson
{
    public static string Serialize(JsonElement element)
    {
        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream))
        {
            Write(element, writer);
        }
        return Encoding.UTF8.GetString(stream.ToArray());
    }

    private static void Write(JsonElement element, Utf8JsonWriter writer)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                writer.WriteStartObject();
                foreach (var property in element.EnumerateObject().OrderBy(property => property.Name, StringComparer.Ordinal))
                {
                    writer.WritePropertyName(property.Name);
                    Write(property.Value, writer);
                }
                writer.WriteEndObject();
                break;
            case JsonValueKind.Array:
                writer.WriteStartArray();
                foreach (var item in element.EnumerateArray()) Write(item, writer);
                writer.WriteEndArray();
                break;
            default:
                element.WriteTo(writer);
                break;
        }
    }
}

internal static class AiPlaygroundDocumentValidator
{
    private const int MaximumDocumentBytes = 2 * 1024 * 1024;
    private static readonly HashSet<string> AcceptedRoles = ["system", "user", "assistant"];
    private static readonly string[] GenerationProperties = ["temperature", "topP", "maximumOutputTokens", "seed", "retryAttempts"];

    public static string? Validate(JsonElement document)
    {
        if (document.ValueKind != JsonValueKind.Object) return "document must be a JSON object.";
        if (Encoding.UTF8.GetByteCount(document.GetRawText()) > MaximumDocumentBytes) return "document exceeds the 2 MB limit.";
        if (!IsBounded(document, 0)) return "document contains an oversized or excessively nested JSON value.";
        if (!TryRequiredString(document, "selectedConversationId", 200, out var selectedConversationId, out var error)) return error;
        if (!document.TryGetProperty("conversations", out var conversations) || conversations.ValueKind != JsonValueKind.Array)
            return "document.conversations must be an array.";
        if (conversations.GetArrayLength() is < 1 or > 100) return "document.conversations must contain between 1 and 100 items.";

        var conversationIds = new HashSet<string>(StringComparer.Ordinal);
        var selectedConversationExists = false;
        var conversationIndex = 0;
        foreach (var conversation in conversations.EnumerateArray())
        {
            var path = $"document.conversations[{conversationIndex++}]";
            if (conversation.ValueKind != JsonValueKind.Object) return $"{path} must be an object.";
            if (!TryRequiredString(conversation, "id", 200, out var conversationId, out error, path)) return error;
            if (!conversationIds.Add(conversationId)) return $"{path}.id must be unique.";
            selectedConversationExists |= conversationId == selectedConversationId;
            if (!TryRequiredString(conversation, "title", 500, out _, out error, path)) return error;
            if (!ValidateNullableString(conversation, "profileId", 200, path, out error)) return error;
            if (!ValidateMessages(conversation, path, out error)) return error;
            if (!ValidateGeneration(conversation, path, out error)) return error;
            if (!ValidateResponses(conversation, path, out error)) return error;
        }

        return selectedConversationExists ? null : "document.selectedConversationId must identify a conversation.";
    }

    private static bool ValidateMessages(JsonElement conversation, string path, out string? error)
    {
        error = null;
        if (!conversation.TryGetProperty("messages", out var messages) || messages.ValueKind != JsonValueKind.Array)
        {
            error = $"{path}.messages must be an array.";
            return false;
        }
        if (messages.GetArrayLength() > 200)
        {
            error = $"{path}.messages cannot contain more than 200 items.";
            return false;
        }

        var ids = new HashSet<string>(StringComparer.Ordinal);
        var index = 0;
        foreach (var message in messages.EnumerateArray())
        {
            var messagePath = $"{path}.messages[{index++}]";
            if (message.ValueKind != JsonValueKind.Object ||
                !TryRequiredString(message, "id", 200, out var id, out error, messagePath) ||
                !TryRequiredString(message, "role", 20, out var role, out error, messagePath) ||
                !TryString(message, "content", 100_000, allowEmpty: true, out _, out error, messagePath)) return false;
            if (!ids.Add(id)) { error = $"{messagePath}.id must be unique."; return false; }
            if (!AcceptedRoles.Contains(role)) { error = $"{messagePath}.role is not accepted."; return false; }
        }
        return true;
    }

    private static bool ValidateGeneration(JsonElement conversation, string path, out string? error)
    {
        error = null;
        if (!conversation.TryGetProperty("generation", out var generation) || generation.ValueKind != JsonValueKind.Object)
        {
            error = $"{path}.generation must be an object.";
            return false;
        }
        foreach (var property in GenerationProperties)
        {
            if (!TryString(generation, property, 64, allowEmpty: true, out _, out error, $"{path}.generation")) return false;
        }
        return true;
    }

    private static bool ValidateResponses(JsonElement conversation, string path, out string? error)
    {
        error = null;
        if (!conversation.TryGetProperty("responses", out var responses) || responses.ValueKind != JsonValueKind.Array)
        {
            error = $"{path}.responses must be an array.";
            return false;
        }
        if (responses.GetArrayLength() > 100)
        {
            error = $"{path}.responses cannot contain more than 100 items.";
            return false;
        }
        if (!ValidateNullableString(conversation, "selectedResponseId", 200, path, out error)) return false;
        var selectedResponseId = conversation.GetProperty("selectedResponseId").ValueKind == JsonValueKind.String
            ? conversation.GetProperty("selectedResponseId").GetString()
            : null;

        var ids = new HashSet<string>(StringComparer.Ordinal);
        var index = 0;
        foreach (var response in responses.EnumerateArray())
        {
            var responsePath = $"{path}.responses[{index++}]";
            if (response.ValueKind != JsonValueKind.Object ||
                !TryRequiredString(response, "id", 200, out var id, out error, responsePath)) return false;
            if (!ids.Add(id)) { error = $"{responsePath}.id must be unique."; return false; }
            if (!response.TryGetProperty("number", out var number) || !number.TryGetInt32(out var responseNumber) || responseNumber < 1)
            { error = $"{responsePath}.number must be a positive integer."; return false; }
            if (!ValidateProfileSnapshot(response, responsePath, out error) ||
                !ValidateResponseMessage(response, responsePath, out error) ||
                !ValidateMetadata(response, responsePath, out error)) return false;
        }

        if (selectedResponseId is not null && !ids.Contains(selectedResponseId))
        {
            error = $"{path}.selectedResponseId must identify a response.";
            return false;
        }
        return true;
    }

    private static bool ValidateProfileSnapshot(JsonElement response, string path, out string? error)
    {
        error = null;
        if (!response.TryGetProperty("profile", out var profile) || profile.ValueKind != JsonValueKind.Object)
        { error = $"{path}.profile must be an object."; return false; }
        return TryRequiredString(profile, "id", 200, out _, out error, $"{path}.profile") &&
            TryRequiredString(profile, "displayName", 500, out _, out error, $"{path}.profile") &&
            TryRequiredString(profile, "model", 500, out _, out error, $"{path}.profile");
    }

    private static bool ValidateResponseMessage(JsonElement response, string path, out string? error)
    {
        error = null;
        if (!response.TryGetProperty("message", out var message) || message.ValueKind != JsonValueKind.Object)
        { error = $"{path}.message must be an object."; return false; }
        if (!TryRequiredString(message, "role", 20, out var role, out error, $"{path}.message") ||
            !TryString(message, "content", 100_000, allowEmpty: true, out _, out error, $"{path}.message")) return false;
        if (role == "assistant") return true;
        error = $"{path}.message.role must be assistant.";
        return false;
    }

    private static bool ValidateMetadata(JsonElement response, string path, out string? error)
    {
        error = null;
        if (!response.TryGetProperty("metadata", out var metadata) || metadata.ValueKind != JsonValueKind.Object)
        { error = $"{path}.metadata must be an object."; return false; }
        return TryRequiredString(metadata, "provider", 200, out _, out error, $"{path}.metadata") &&
            TryRequiredString(metadata, "model", 500, out _, out error, $"{path}.metadata");
    }

    private static bool ValidateNullableString(JsonElement parent, string property, int maximumLength, string path, out string? error)
    {
        error = null;
        if (!parent.TryGetProperty(property, out var value) || value.ValueKind is not (JsonValueKind.String or JsonValueKind.Null))
        { error = $"{path}.{property} must be a string or null."; return false; }
        if (value.ValueKind == JsonValueKind.String && value.GetString()!.Length > maximumLength)
        { error = $"{path}.{property} is too long."; return false; }
        return true;
    }

    private static bool TryRequiredString(JsonElement parent, string property, int maximumLength, out string value, out string? error, string path = "document") =>
        TryString(parent, property, maximumLength, allowEmpty: false, out value, out error, path);

    private static bool TryString(JsonElement parent, string property, int maximumLength, bool allowEmpty, out string value, out string? error, string path)
    {
        value = string.Empty;
        error = null;
        if (!parent.TryGetProperty(property, out var element) || element.ValueKind != JsonValueKind.String)
        { error = $"{path}.{property} must be a string."; return false; }
        value = element.GetString()!;
        if ((!allowEmpty && string.IsNullOrWhiteSpace(value)) || value.Length > maximumLength)
        { error = $"{path}.{property} is empty or too long."; return false; }
        return true;
    }

    private static bool IsBounded(JsonElement element, int depth)
    {
        if (depth > 16) return false;
        if (element.ValueKind == JsonValueKind.String) return element.GetString()!.Length <= 100_000;
        if (element.ValueKind == JsonValueKind.Array)
        {
            if (element.GetArrayLength() > 500) return false;
            return element.EnumerateArray().All(item => IsBounded(item, depth + 1));
        }
        if (element.ValueKind == JsonValueKind.Object)
        {
            var count = 0;
            foreach (var property in element.EnumerateObject())
            {
                if (++count > 50 || property.Name.Length > 100 || !IsBounded(property.Value, depth + 1)) return false;
            }
        }
        return true;
    }
}
