# Session Memory architecture

Session Memory の最初の縦 slice は、Scenario と同じ DDD/CQRS-lite の境界を採用する。

## Domain model

- `SessionNote` は `Create`、`Edit`、`ApplyProposal`、`CaptureRevision` を通じて変更する。
- note kind、canon status、update source は native enum とし、HTTP/DB では従来どおり lowercase / kebab-case を使う。
- `SessionNote.Revision` は optimistic concurrency token である。
- `SessionNoteProposal` は `pending` / `snoozed` から review でき、`applied` / `rejected` は terminal である。
- terminal proposal の再 review は既存状態を返す idempotent operation とする。
- `SessionNoteProposal.Revision` も optimistic concurrency token とし、同時 review の敗者は HTTP 409 に変換する。

## Application and infrastructure boundaries

- create/update/review は `Application/SessionMemory` の command use case が ownership、validation、domain behavior、競合結果を調整する。
- aggregate の読み込みと保存は用途限定の `ISessionMemoryRepository` を介し、EF 実装は `Infrastructure/SessionMemory` に置く。
- memory read model は no-tracking の `SessionMemoryQueryService` が既存 response contract へ projection する。
- `SessionMemoryEndpoints` と note proposal review handler は `ApplicationDbContext` に依存せず、HTTP と application outcome の変換だけを担う。
- image attach/media handler はこの slice の対象外であり、従来の persistence path を維持する。

## Compatibility and persistence

既存 API の path、request/response shape、validation error code、note ID prefix (`LOR-` / `NOT-`)、revision history (`NRV-`) を維持する。enum の EF converter は既存の lowercase / kebab-case database value を維持する。

この repository は EF migration ではなく startup/test の `EnsureCreatedAsync` を使用している。proposal の `Revision` column を追加したため、既存の開発 database は通常の schema recreate/reset 手順で更新する。
