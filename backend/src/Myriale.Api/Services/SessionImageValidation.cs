using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace Myriale.Api.Services;

public sealed class SessionImageOptions
{
    public const string SectionName = "SessionImages";
    public long MaxBytes { get; set; } = 5 * 1024 * 1024;
    public int MaxWidth { get; set; } = 4096;
    public int MaxHeight { get; set; } = 4096;
    public int ReconciliationIntervalMinutes { get; set; } = 60;
    public int OrphanGraceMinutes { get; set; } = 60;
}

public sealed record ValidatedSessionImage(byte[] Content, string ContentType, long SizeBytes, int Width, int Height, string Checksum, string ModerationMetadataJson);

public sealed class SessionImageValidator(IOptions<SessionImageOptions> options)
{
    private static readonly byte[] PngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

    public async Task<ValidatedSessionImage> ValidateAsync(
        IFormFile file,
        string expectedChecksum,
        string moderationDecision,
        string? moderationMetadataJson,
        CancellationToken cancellationToken)
    {
        if (!string.Equals(file.ContentType, "image/png", StringComparison.OrdinalIgnoreCase))
            throw new SessionImageValidationException("image_mime_not_allowed", "PNG画像のみ添付できます。");
        if (file.Length <= 0 || file.Length > options.Value.MaxBytes)
            throw new SessionImageValidationException("image_size_invalid", $"画像サイズは1〜{options.Value.MaxBytes} byteである必要があります。");
        if (!string.Equals(moderationDecision, "approved", StringComparison.Ordinal))
            throw new SessionImageValidationException("image_moderation_rejected", "承認済みのmoderation結果が必要です。");

        await using var input = file.OpenReadStream();
        using var memory = new MemoryStream((int)file.Length);
        await input.CopyToAsync(memory, cancellationToken);
        var bytes = memory.ToArray();
        if (bytes.Length != file.Length || bytes.Length < 24 || !bytes.AsSpan(0, 8).SequenceEqual(PngSignature)
            || !bytes.AsSpan(12, 4).SequenceEqual("IHDR"u8))
            throw new SessionImageValidationException("image_content_invalid", "有効なPNG画像ではありません。");

        var width = BinaryPrimitives.ReadInt32BigEndian(bytes.AsSpan(16, 4));
        var height = BinaryPrimitives.ReadInt32BigEndian(bytes.AsSpan(20, 4));
        if (width <= 0 || height <= 0 || width > options.Value.MaxWidth || height > options.Value.MaxHeight)
            throw new SessionImageValidationException("image_dimensions_invalid", $"画像寸法は最大{options.Value.MaxWidth}x{options.Value.MaxHeight}です。");

        var checksum = Convert.ToHexStringLower(SHA256.HashData(bytes));
        if (expectedChecksum.Length != 64 || !CryptographicOperations.FixedTimeEquals(
                System.Text.Encoding.ASCII.GetBytes(checksum),
                System.Text.Encoding.ASCII.GetBytes(expectedChecksum.ToLowerInvariant())))
            throw new SessionImageValidationException("image_checksum_mismatch", "画像checksumが一致しません。");

        var moderation = NormalizeModeration(moderationDecision, moderationMetadataJson);
        return new(bytes, "image/png", bytes.LongLength, width, height, checksum, moderation);
    }

    private static string NormalizeModeration(string decision, string? metadataJson)
    {
        JsonElement metadata = default;
        if (!string.IsNullOrWhiteSpace(metadataJson))
        {
            try { metadata = JsonSerializer.Deserialize<JsonElement>(metadataJson); }
            catch (JsonException) { throw new SessionImageValidationException("image_moderation_invalid", "moderation metadataはJSONで指定してください。"); }
        }
        return JsonSerializer.Serialize(new { decision, metadata = metadata.ValueKind == JsonValueKind.Undefined ? null : (object)metadata });
    }
}

public sealed class SessionImageValidationException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
