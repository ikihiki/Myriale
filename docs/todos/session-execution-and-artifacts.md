# TODO: Session Input・Execution・Artifactの分離

## 目的

Session画面とバックエンドで、プレイヤーが送信した入力、非同期ワーカーの実行状態、生成された成果物、正式なSession Turnを別の責務として扱う。

Narrative生成失敗時にもPlayer Inputを失わず、失敗を物語上のTurnへ混入させず、入力の直後に再試行可能なExecution状態として表示する。同じ仕組みをNarrativeだけでなく、ノート更新案、画像、要約などの生成にも拡張できるようにする。

この文書は実装計画である。Sessionの不変イベントとmutable stateの原則は`docs/architecture/session-events.md`、対話体験は`docs/user-stories/session-play-dialogue-user-stories.md`、ノート生成体験は`docs/user-stories/session-notes-auto-generation-user-stories.md`を正本とする。

## 設計原則

> Input is a fact. Execution is a process. Artifact is a result. Turn is published canon.

- `SessionPlayerInput`は、Serverが受け付けたユーザー入力の不変な事実である。
- `SessionExecution`は、Narrative、ノート、画像などを生成・適用するmutableな処理状態である。
- `SessionExecutionAttempt`は、Provider呼び出しやworker試行ごとの診断履歴である。
- `SessionArtifact`は、生成された検証前・検証済み・公開済みの成果物を表す。
- `SessionTurn`は、Sessionの正式な履歴へpublishされたNarrativeまたはModule結果だけを表す。
- Provider障害、timeout、cancel、retry待機はSession Turnにしない。
- 失敗したExecutionを画面から黙って削除しない。Player Inputの直後に状態として表示する。
- UI上のdismissは履歴削除ではなく、運用情報の折りたたみまたはユーザー別非表示として扱う。
- Narrative、ノート、画像はExecution lifecycleを共有するが、成功後のdomain modelは型ごとに分ける。

## 完成時の表示

### Narrative生成中

```text
[Player Input]
銀の鍵を扉にかざす

[Execution: running]
Narrativeを生成しています……
                                [キャンセル]
```

### Narrative生成失敗

```text
[Player Input]
銀の鍵を扉にかざす

[Execution: failed]
Narrativeを生成できませんでした。
AIサービスから時間内に応答がありませんでした。
                         [再試行] [入力を編集] [詳細]
```

### Narrative生成成功

```text
[Player Input]
銀の鍵を扉にかざす

[Narrative Turn]
鍵から淡い光が溢れ、石造りの扉が静かに開いた。
```

成功したExecutionは通常表示では折りたたむ。必要な場合だけ「2回目の試行で成功」などの生成詳細を開示する。

### Narrative成功・画像失敗

```text
[Narrative Turn]
鍵から淡い光が溢れ、石造りの扉が静かに開いた。

[Image Execution: failed]
画像を生成できませんでした。
                                      [画像だけ再試行]
```

Narrativeを必須成果物、画像とノート変更案を独立して再試行可能な任意成果物とする。画像が必須のユースケースだけ明示的な`all-required` publish policyを使う。

## 現状と移行対象

### 現状

- `SessionPendingPlayerInput`が、未確定入力の複製とAI生成のstatus、lease、retry、errorを兼務している。
- Player InputはNarrative生成成功時に`SessionPlayerInput`へ変換されるため、生成失敗中の入力は正式な入力イベントになっていない。
- `SessionNarrativeHandoff`がModule OutcomeからNarrativeを生成する別の実行状態を持っている。
- Narrative Provider呼び出しはHTTP request内で実行され、クライアントは完了まで待機する。
- Session APIは`Turns`と`PendingInputs`を返すが、入力、Execution、Artifactを順序付きで表すread modelがない。
- `SessionPage`と`SessionTurn`はPlayer InputとNarrativeを1つの表示単位へ再結合している。
- ページ上部のnoticeが主なエラー表示であり、対象入力との因果関係が見えにくい。
- ノートUIはlocal fixture中心で、Sessionに紐づく永続Note、Note Revision、生成Executionがない。
- Session画像のArtifact、object storage参照、生成Executionがない。

### 移行後

- Player Inputを受付transaction内で即時に永続化する。
- 同じtransactionでNarrative用`SessionExecution`を作成する。
- APIは処理完了を待たず、InputとExecutionを返す。
- workerがqueued Executionをclaimし、Provider呼び出し、検証、Artifact保存、domain publishを実行する。
- UIはInput、Execution、Turn、Artifactを別コンポーネントで表示する。
- `SessionPendingPlayerInput`と`SessionNarrativeHandoff`は段階的に`SessionExecution`へ統合する。

## データモデル

### SessionPlayerInput

既存エンティティを、生成成功後の結果ではなく入力受付時の不変イベントとして使用する。

想定field:

```text
Id
SessionId
RequestId
InteractionType
Text
PayloadHash
AcceptedAfterTurnId
AcceptedSessionRevision
CreatedBy
CreatedAt
SupersedesInputId?
```

制約:

- `(SessionId, RequestId)`または現在のowner境界を含むrequest idempotency制約を維持する。
- 同一Request IDでpayload hashが異なる場合はconflictにする。
- 入力編集は既存rowの上書きではなく、新しいInputとして作成する。
- rewind後もInput自体を物理削除せず、projection上のactive/superseded状態を導出する。

### SessionExecution

共通の非同期処理envelopeを追加する。

想定field:

```text
Id
SessionId
Kind
TriggerType
TriggerId
Status
Revision
IdempotencyKey
PayloadHash
AcceptedHeadTurnId
AcceptedSessionRevision
PublishPolicy
Priority
IsRetryable
AttemptCount
MaxAttempts
NextAttemptAt?
LeaseOwner?
LeaseToken?
LeaseExpiresAt?
ErrorCode?
UserErrorMessage?
CreatedAt
QueuedAt
StartedAt?
CompletedAt?
CancelRequestedAt?
DismissedAt?
SupersededByExecutionId?
```

`Kind`の初期値:

- `narrative`
- `module-handoff`

後続追加:

- `note-proposal`
- `image`
- `summary`

`TriggerType`:

- `player-input`
- `session-turn`
- `module-outcome`
- `manual`

`Status`:

- `queued`: workerによるclaim待ち。
- `running`: 有効なleaseを持つworkerが処理中。
- `retry-wait`: transient failure後の再実行時刻待ち。
- `cancel-requested`: cooperative cancellationを要求済み。
- `succeeded`: 必要な成果物の保存・publishが完了。
- `failed`: retryを終了したか、ユーザー操作が必要。
- `cancelled`: publish前にcancelが確定。
- `superseded`: Session進行、入力編集、別Execution成功などにより結果をpublishしない。

禁止事項:

- `pending`だけでqueued、running、retry待ちを兼ねない。
- stack trace、secret、raw Authorization header、完全なProvider responseをpublic error fieldへ保存しない。
- Session TurnのNarrative本文をExecutionのerror messageへ代用しない。

### SessionExecutionAttempt

Executionの各試行をappend-onlyで保存する。

想定field:

```text
Id
ExecutionId
AttemptNumber
Status
WorkerId?
Provider?
Model?
ProviderRequestId?
StartedAt
CompletedAt?
LatencyMilliseconds?
InputTokens?
OutputTokens?
ErrorCode?
ErrorCategory?
Retryable
CorrelationId?
```

方針:

- retry時に同じAttempt rowを上書きしない。
- Provider/model/token/latency情報はAttemptへ移し、公開済みTurnには必要なprovenanceだけ投影する。
- 内部例外詳細はstructured loggingとobservability基盤を正本にする。
- user-visible errorは正規化されたcodeと安全なmessageから生成する。

### SessionArtifact

共通の生成成果物envelopeを追加する。

想定field:

```text
Id
SessionId
ExecutionId
AttemptId
Kind
Status
ContentType
StorageKey?
Checksum?
MetadataJson?
CreatedAt
ValidatedAt?
CommittedAt?
```

`Kind`:

- `narrative-text`
- `note-patch`
- `image`
- `summary`

`Status`:

- `draft`
- `validated`
- `committed`
- `rejected`

型ごとのdomain model:

- Narrativeは検証・publish後に`SessionTurn`を作る。
- ノートは`SessionNote`と`SessionNoteRevision`へ適用する前の変更案として扱う。
- 画像は`SessionImage`などのtyped recordへobject storage key、MIME type、寸法、checksumを保存する。
- 大きな画像binaryやbase64をExecution/Attempt/DB event historyへ保存しない。

## 整合性と同時実行

### Input受付transaction

1. Sessionと現在head/revisionを読む。
2. Request IDとpayload hashのidempotencyを確認する。
3. `SessionPlayerInput`を作成する。
4. 対応する`SessionExecution(status=queued)`を作成する。
5. 必要ならSession revisionを進める。
6. InputとExecutionを同一transactionでcommitする。

### Worker claim

- PostgreSQLでは`FOR UPDATE SKIP LOCKED`相当のclaimを使用する。
- claim時に`LeaseToken`と`LeaseExpiresAt`を更新する。
- long-runningな画像生成ではheartbeatでleaseを延長する。
- expired leaseは再claim可能にする。
- claim、heartbeat、finishはExecution revisionまたはfencing tokenで保護する。

### Publish guard

Workerが成果物を正式にpublishする前に以下を確認する。

```text
Execution.Status == running
Execution.LeaseToken == worker token
Execution.Revision == expected revision
Session.HeadTurnId == Execution.AcceptedHeadTurnId
Session.Revision is compatible with the accepted boundary
同じExecutionまたはInputからTurnがまだpublishされていない
```

late completion、重複callback、worker再起動、lease expiry後の旧worker結果でTurnやArtifactが二重publishされないunique constraintを追加する。

### Cancelとの競合

- cancelは`cancel-requested`を経由するcooperative operationにする。
- Provider cancellation APIがあればbest effortで呼び出す。
- publish transactionが先にcommitした場合は`succeeded`を正とする。
- cancelが先にfencing tokenを無効化した場合はlate resultをpublishしない。
- cancel endpointはidempotentにする。

### Retry

- timeout、rate limit、temporary provider failureなどはbounded exponential backoffとjitterで自動retryする。
- invalid input、policy rejection、schema incompatibility、model configuration errorは原則自動retryしない。
- transient failureは同じExecutionに新しいAttemptを追加する。
- ユーザーが入力を編集した場合や新しいSession headに対して再実行する場合は、新しいExecutionを作り旧Executionを`superseded`にする。
- retry/callback/publishにはそれぞれidempotency keyまたはunique commit guardを持たせる。

## API計画

### Input受付

```http
POST /api/sessions/{sessionId}/inputs
```

Request例:

```json
{
  "requestId": "client-generated-id",
  "interactionType": "action",
  "text": "銀の鍵を扉にかざす",
  "requestedOutputs": ["narrative"]
}
```

Response:

- 原則`202 Accepted`。
- durableなInputとExecutionを返す。
- `Location`にExecution resourceを設定する。
- 既存requestのreplayでは同じInput/Execution snapshotを返す。

```json
{
  "input": {
    "id": "INP-123",
    "text": "銀の鍵を扉にかざす"
  },
  "execution": {
    "id": "EXE-123",
    "kind": "narrative",
    "status": "queued",
    "revision": 1
  }
}
```

### Execution取得・操作

```http
GET  /api/session-executions/{executionId}
POST /api/session-executions/{executionId}/retry
POST /api/session-executions/{executionId}/cancel
POST /api/session-executions/{executionId}/dismiss
```

- retryはretryableなterminal failureだけを対象にする。
- cancelはqueued、running、retry-wait、cancel-requestedでidempotentに扱う。
- dismissはExecutionを削除せず、通常UIから運用詳細を折りたたむ。
- authorizationではExecutionのSession ownerまたは管理権限を必ず検証する。

### Session read model

永続テーブルを1つへ統合せず、Session APIでordered activity projectionを返す。

```json
{
  "inputs": [],
  "turns": [],
  "executions": [],
  "artifacts": [],
  "activity": [
    { "type": "input", "id": "INP-123", "order": 10 },
    { "type": "execution", "id": "EXE-123", "order": 11 },
    { "type": "turn", "id": "TRN-123", "order": 12 }
  ]
}
```

方針:

- canonical orderingはcausal linkとTurn chainからServer側で構築する。
- 実行中/失敗中のInputはSession再読み込み後も同じ位置に復元する。
- 複数pending executionを返し、最後の1件だけに限定しない。
- UIがstringly typedな内部DB状態を推測しないよう、public status enumとcapabilityを返す。

Execution responseのcapability例:

```json
{
  "canRetry": true,
  "canCancel": false,
  "canDismiss": true
}
```

## Worker計画

最初は既存DBをqueueとして使用し、新しい外部orchestratorの導入は必須にしない。

### SessionExecutionWorker

- `BackgroundService`としてqueued/retry-wait/expired leaseをclaimする。
- Kind別handlerへdispatchする。
- worker loopはbounded batch、cancellation、backoffを持つ。
- shutdown時は新規claimを停止し、処理中Attemptを安全に中断またはlease expiryへ委ねる。

Handler案:

```text
ISessionExecutionHandler
- Kind
- ExecuteAsync(SessionExecutionContext, CancellationToken)
```

初期handler:

- `NarrativeExecutionHandler`
- `ModuleHandoffExecutionHandler`

将来の拡張候補:

- `NoteProposalExecutionHandler`
- `ImageExecutionHandler`
- `SummaryExecutionHandler`

この計画では`NoteProposalExecutionHandler`と`ImageExecutionHandler`の実AI呼び出し本体を実装しない。共通interfaceとKind dispatchが将来の追加を妨げないことだけを保証する。

### 既存workerとの関係

- `AiLeaseRecoveryWorker`のexpired lease処理を新workerのreconciliationへ移す。
- 移行中は旧rowと新Executionを二重claimしないfeature flagまたはmigration boundaryを設ける。
- Provider adapterのretryとExecution retryを二重化しない。
- HTTP transport内の短いretryと、durable retryの責務を明記する。

推奨:

- 同一Attempt内: 接続確立前など安全性が明確な最小transport retry。
- Attempt間: durableなExecution retry policy。

## UI計画

### Component分割

```text
SessionActivityFeed
├── SessionInputItem
├── SessionExecutionItem
├── NarrativeTurnItem
├── ModuleTurnItem
├── NoteProposalItem
└── ImageArtifactItem
```

- 現在の`SessionTurn`が持つPlayer Input表示とNarrative表示を分離する。
- Player Inputは送信受付直後にactivityへ追加する。
- Input直後に同じExecution IDで安定したstatus slotを表示する。
- retryごとに新しい赤い疑似Turnを追加せず、同じExecution slotの状態を更新する。
- successful artifactだけをNarrative Turn、Note proposal、Image attachmentとして表示する。

### Status別表示

`queued`:

- 「生成待ち」または短時間ならspinnerだけ。
- cancel可能ならCancel actionを表示する。

`running`:

- Kindごとの具体的な文言を表示する。
- Narrative: 「物語を生成しています」
- Note: 「ノートの変更案を作成しています」
- Image: 「場面の画像を生成しています」

`retry-wait`:

- 短い自動retryは通常表示を変えない。
- 待機が意味のある長さなら「一時的な問題のため再試行します」を表示する。
- attempt詳細は折りたたむ。

`failed`:

- Inputまたは対象Turnの直後にpersistent inline errorを表示する。
- 「何が失敗したか」「入力や既存Turnは保存されているか」「次にできること」を示す。
- Retry、Edit input、Detailsを必要に応じて表示する。
- page-level toastだけで完結させない。

`cancel-requested`:

- 即座にcancelledと表示せず「キャンセルしています」と表示する。

`cancelled`:

- neutralなcompact markerとRetryを表示する。

`succeeded`:

- Artifactを表示し、Execution状態は通常折りたたむ。
- attemptが複数なら詳細に「2回目の試行で成功」などを表示できる。

`superseded`:

- 通常は折りたたむ。
- 「Sessionが先へ進んだため、この結果は適用されませんでした」など因果関係を説明する。

### Error message

表示例:

```text
Narrativeを生成できませんでした。
AIサービスから時間内に応答がありませんでした。入力内容は保存されています。
```

詳細欄:

- error code
- retryability
- attempt count
- occurred/completed timestamp
- Provider/model
- correlation ID

非表示:

- credential
- raw Authorization header
- system prompt
- 完全なProvider response
- production環境のstack trace

### Environment別のExecution詳細表示

Productionでは、Player向けに正規化されたstatus、error code、安全なmessage、retry/cancel capabilityだけを返す。Developmentでは原因調査を容易にするため、ExecutionとErrorの詳細データをAPIおよびUIの展開可能な診断欄へ表示する。

Developmentで表示する項目:

- Execution ID、Attempt ID、Session ID、Trigger/Input/Turn ID
- Kind、status、revision、attempt number、retryability
- queued、started、completed、next retry、lease expiryの各timestamp
- lease owner、lease tokenの安全な識別子、fencing revision
- Provider、model、Provider request/response ID
- latency、input/output token、finish reason
- error code、error category、例外型、inner exception chain
- timeout値、HTTP status、reason phrase、transport error category
- JSON path、line、byte positionなどschema/deserialize診断
- redaction済みProvider response excerpt
- correlation ID、trace ID、span ID
- prompt/contextのversion、hash、size、component ID。完全なprompt本文は既定で表示しない。

Development UI:

- Execution cardに`開発者向け詳細`の折りたたみ領域を追加する。
- JSONまたはdefinition listで値を確認でき、IDとtrace IDをcopyできるようにする。
- running状態でもlease、attempt、開始時刻、経過時間を確認できるようにする。
- failed状態では例外chainとredaction済みresponse excerptを表示する。
- Development詳細が存在しても、通常のPlayer向けmessageとRetry/Cancel操作を先に表示する。

Productionで非表示にする項目:

- stack traceと例外chain
- lease owner/tokenとworker内部情報
- raw Provider responseおよびresponse excerpt
- prompt/context内容
- internal endpoint、DB診断、JSON parser位置
- trace以外の内部相関情報

全環境で表示・返却禁止:

- credential、API key、Authorization/Cookie header
- secret store pathの値
- Data Protection payload
- redaction前のProvider response
- private Module State

Development判定はServer側の`IHostEnvironment.IsDevelopment()`を正本とする。クライアントからのquery、header、local storageだけで詳細表示を有効化できないようにする。Development専用fieldはoptional contractとし、Productionでは`null`またはfield omissionを保証する。

### Accessibility

- activity履歴は順次更新される領域として`role="log"`を検討する。
- queued、running、retrying、completed、cancelledは`role="status"`またはpolite live regionで通知する。
- ユーザー操作が必要なterminal failureは`role="alert"`を使用する。
- token単位や短周期heartbeatを逐一読み上げない。
- 状態更新でcomposerからfocusを奪わない。
- Retry、Cancel、Detailsのkeyboard操作とfocus styleを保証する。

### 状態同期

初期実装はpollingでよい。

- queued/running/retry-wait/cancel-requestedが存在する間だけpollingする。
- SessionまたはExecution revisionを使って差分をreconcileする。
- terminal stateになったら不要なpollingを停止する。
- `ETag`または`If-None-Match`を後から追加できる契約にする。
- 将来的にSSEまたはSignalRへ変更しても、`SessionExecution`をsource of truthとして維持する。
- Provider固有job IDを直接UIのsource of truthにしない。

## ノートへの拡張

### Domain model

```text
SessionNote
SessionNoteRevision
SessionNoteProposal
```

- AIは直接Canonを上書きせず、`note-patch` Artifactを作る。
- Proposalはsource Turn ID、変更対象field、before/after、根拠を持つ。
- Apply、Edit then Apply、Reject、Snoozeをdomain commandとして実装する。
- Apply時にexpected note revisionを検証し、別更新との競合を防ぐ。
- AI生成状態は`SessionExecution(kind=note-proposal)`で管理する。
- Proposal通知はターンごとに集約可能にする。

## 画像への拡張

### Domain model

```text
SessionImage
- Id
- SessionId
- SourceTurnId?
- SourceInputId?
- ArtifactId
- StorageKey
- ContentType
- Width
- Height
- Checksum
- CreatedAt
```

- object storageへbinaryを保存する。
- signed URLまたは認可されたmedia endpointで取得する。
- thumbnailとoriginalを区別する。
- Narrative成功後に独立Executionとして生成できるようにする。
- image failureでNarrative Turnをrollbackしない。
- 画像だけretry/cancel可能にする。
- rewind、Session削除、retentionに伴うobject cleanup方針を定義する。

## 実装フェーズ

## フェーズ1: UIでInputとTurnを分離

- [ ] `SessionTurn`からPlayer Input表示を分離する。
- [ ] `SessionInputItem`、`NarrativeTurnItem`、`SessionExecutionItem`を追加する。
- [ ] 既存`PendingInputs`を最後の1件だけでなくすべてactivityへ表示する。
- [ ] pending/failed状態を対象Inputの直後へ表示する。
- [ ] page-level noticeは補助通知に限定し、inline errorを正本にする。
- [ ] successful TurnだけをNarrative履歴として表示する。
- [ ] Storybookでqueued、running、retrying、failed、cancelled、succeededの各状態を追加する。
- [ ] keyboard、live region、reduced motionを確認する。

### フェーズ1完了条件

- [ ] InputとNarrativeが別DOM要素・別componentとして表示される。
- [ ] 生成失敗後もInputが履歴上に残る。
- [ ] errorがNarrative Turnとして描画されない。
- [ ] reload後にpending/failed表示が復元される。

## フェーズ2: Inputを受付時に確定

- [ ] `SessionPlayerInput`をInput受付transaction内で作成する。
- [ ] `SessionPendingPlayerInput`から入力イベントの責務を分離する。
- [ ] 既存Request ID replayとpayload mismatch検出を維持する。
- [ ] stale、completed、pendingの導出条件を更新する。
- [ ] API contractでInputとNarrative Turnを別resourceとして返す。
- [ ] 既存データを移行するmigrationとbackfillを追加する。
- [ ] failed pending inputを確定Inputへ移すbackfill ruleを定義する。

### フェーズ2完了条件

- [ ] Providerを呼ばなくてもInputが永続化される。
- [ ] Provider失敗時にもInput IDと本文がSession APIから取得できる。
- [ ] 同一Request IDの二重Inputが作成されない。

## フェーズ3: 共通SessionExecutionを導入

- [ ] `SessionExecution`entityとmigrationを追加する。
- [ ] public status enumとstatus transition guardを追加する。
- [ ] `SessionExecutionAttempt`entityを追加する。
- [ ] `SessionArtifact`envelopeを追加する。
- [ ] unique publish guardとfencing tokenを追加する。
- [ ] Execution取得、retry、cancel、dismiss endpointを追加する。
- [ ] Session responseにExecutionsとordered activity projectionを追加する。
- [ ] Development/Productionで安全なerror details policyを適用する。
- [ ] DevelopmentではExecution、Attempt、lease、Provider、例外chain、redaction済みresponse excerpt、trace/span IDを返す診断contractを追加する。
- [ ] ProductionではDevelopment専用fieldが`null`または省略されることを保証する。
- [ ] OpenAPI contractとfrontend typeを更新する。

### フェーズ3完了条件

- [ ] NarrativeとModule Handoffが同じstatus modelで表現できる。
- [ ] queued、running、retry-wait、failed、cancelled、supersededをAPIから区別できる。
- [ ] attemptごとのProvider診断を取得できる。
- [ ] Development UIでExecution状態、Attempt、例外、trace/span IDの詳細を確認できる。
- [ ] Production UI/APIへDevelopment専用診断が露出しない。
- [ ] failure/cancelがSession Turnを作らない。

## フェーズ4: NarrativeをBackground Workerへ移行

- [ ] `SessionExecutionWorker`を追加する。
- [ ] DB claim、lease、heartbeat、expiry、fencingを実装する。
- [ ] `NarrativeExecutionHandler`を追加する。
- [ ] HTTP request内のNarrative Provider呼び出しをworkerへ移す。
- [ ] Input POSTを`202 Accepted`へ変更する。
- [ ] frontend pollingとreconciliationを追加する。
- [ ] automatic durable retryとdead-letter相当のterminal failureを実装する。
- [ ] worker shutdown/restart後のrecoveryをテストする。
- [ ] late completion、duplicate callback、二重worker完了をテストする。

- [ ] Session Execution用`ActivitySource`、`Meter`、logging scopeを追加する。
- [ ] APIからworker、Provider、Artifact、Turn publishまでtrace contextまたはspan linkを引き継ぐ。
- [ ] queue、duration、retry、failure、lease expiry、Provider token/latencyのmetricsを追加する。
- [ ] OTLP exportとAspire Dashboardでtrace、metric、logを確認する。
- [ ] telemetryにPlayer Input、prompt、credential、private Module Stateが含まれないことをテストする。

### フェーズ4完了条件

- [ ] API Podのrequest lifetimeとAI生成時間が分離される。
- [ ] ブラウザを閉じても生成が継続し、再訪時に状態を復元できる。
- [ ] worker再起動後にqueued/running workが安全に回収される。
- [ ] Narrativeが最大1件だけpublishされる。

## フェーズ5: SessionNarrativeHandoffを統合

- [ ] `SessionNarrativeHandoff`を`SessionExecution(kind=module-handoff)`へmappingする。
- [ ] module outcome、source turn、accepted state revisionのcausal linkを維持する。
- [ ] Sessionが先へ進んだ場合はExecutionを`superseded`にする。
- [ ] matching replayによるretryをExecution endpointへ統一する。
- [ ] 旧Handoff tableのread/writeをfeature flagで段階的に停止する。
- [ ] migration完了後に旧tableとserviceを削除する。

### フェーズ5完了条件

- [ ] Player Input NarrativeとModule Handoffが同じworkerとUI状態を使用する。
- [ ] Module OutcomeはNarrative失敗時にもrollbackされない。
- [ ] superseded handoffがlate Turnを追加しない。

## フェーズ6: ノート変更案のdomain・Execution・UI基盤

このフェーズではノート生成のAI Provider呼び出し本体を実装しない。`note-proposal`を共通Executionで表現できるdomain model、API contract、review UI、テストfixtureまでを対象とする。

- [ ] `SessionNote`と`SessionNoteRevision`を実装する。
- [ ] `note-proposal` Execution kind、status projection、capabilityを追加する。
- [ ] `note-patch` Artifact schemaを追加する。
- [ ] source Turnと根拠を必須にする。
- [ ] Apply、Edit then Apply、Reject、Snooze endpointを追加する。
- [ ] note revision conflictを検出する。
- [ ] Session画面の通知と差分review UIを実装する。
- [ ] test fixtureまたはseed dataでqueued、running、failed、succeededの表示と操作を検証する。
- [ ] `NoteProposalExecutionHandler`、Prompt Builder、Provider adapter呼び出しは実装しない。

### フェーズ6完了条件

- [ ] ノート変更案をExecution/Artifact/API/UIで表現できる。
- [ ] 変更案が自動的にCanonを上書きしない。
- [ ] ユーザーがfixtureまたは既存Artifactの差分と根拠を確認して適用できる。
- [ ] note-proposal Execution failureがNarrative Turnへ影響しない。
- [ ] 実AIへノート生成requestを送信する経路が追加されていない。

## フェーズ7: 画像Artifactのdomain・Execution・UI基盤

このフェーズでは画像生成のAI Provider呼び出し本体を実装しない。`image`を共通Executionで表現し、保存済みまたはfixtureのArtifactをSessionへ添付・表示できる基盤までを対象とする。

- [ ] object storage abstractionを追加する。
- [ ] `SessionImage`entityとmedia endpointを追加する。
- [ ] `image` Execution kind、status projection、capabilityを追加する。
- [ ] Narrative Turnへのimage attachment表示を追加する。
- [ ] 画像Executionのretry/cancel capabilityに応じたUIを追加する。
- [ ] 保存済みArtifactのMIME type、size、dimensions、checksum、moderation metadataを検証する。
- [ ] orphan object cleanupとretentionを実装する。
- [ ] test fixtureまたはseed dataでqueued、running、failed、succeeded、partial successを検証する。
- [ ] `ImageExecutionHandler`、画像Prompt Builder、Provider job作成・polling・streamingは実装しない。

### フェーズ7完了条件

- [ ] 画像ExecutionとArtifactをSession API/UIで表現できる。
- [ ] 画像Execution失敗でNarrativeが消えない。
- [ ] reload後もfixtureまたは保存済み画像のExecution状態とArtifactが復元される。
- [ ] 実AIへ画像生成requestを送信する経路が追加されていない。

## テスト計画

### Domain・DB

- [ ] InputとExecutionが同一transactionで作成される。
- [ ] 同一Request ID replayでInput/Executionが重複しない。
- [ ] payload mismatchがconflictになる。
- [ ] status transitionの不正遷移を拒否する。
- [ ] unique constraintで同じInput/ExecutionからTurnが二重作成されない。
- [ ] expired leaseを別workerがclaimできる。
- [ ] 古いfencing tokenによる完了を拒否する。
- [ ] cancelとsuccessの競合結果が決定的になる。
- [ ] Session headが進んだExecutionはsupersededになる。

### Telemetry

- [ ] Input受付からNarrative Turn publishまで同じtraceまたはspan linkで追跡できる。
- [ ] retryごとに独立Attempt spanが作成され、同じExecutionへ関連付く。
- [ ] success、failed、cancelled、superseded、lease-expiredでspan statusと属性が正しい。
- [ ] counter、histogram、observable gaugeが重複計上されない。
- [ ] metric labelにSession ID、Execution ID、Player Inputが含まれない。
- [ ] telemetry export失敗がdomain処理を失敗させない。
- [ ] Development API/UIに表示するtrace IDとexportされたtraceが一致する。
- [ ] Production telemetryにsecret、prompt全文、Provider response全文が含まれない。

### API

- [ ] Input POSTがInputとqueued Executionを返す。
- [ ] replayが同じresource snapshotを返す。
- [ ] GET Executionが全statusとcapabilityを返す。
- [ ] retry/cancel/dismissがidempotentである。
- [ ] 別ユーザーのExecutionを取得・操作できない。
- [ ] Development responseにExecution/Attempt/lease/Provider/例外chain/trace IDの診断詳細が含まれる。
- [ ] Development error detailsがredaction済みで、credentialや完全なpromptを含まない。
- [ ] Production responseにstack traceやsecretが含まれない。

### Worker

- [ ] transient errorをbackoff後に再試行する。
- [ ] permanent errorを自動再試行しない。
- [ ] worker restart後にlease expiryから復旧する。
- [ ] Provider timeout後のlate responseをpublishしない。
- [ ] duplicate callbackを一度だけcommitする。
- [ ] fixtureまたは保存済みArtifactを使い、Narrative成功・画像Execution失敗をpartial successとして扱える。

### Frontend

- [ ] Inputが送信受付直後に表示される。
- [ ] running状態がInput直後に表示される。
- [ ] failure後もInputが消えない。
- [ ] failureをNarrative Turnとして描画しない。
- [ ] retryで同じExecution slotが更新される。
- [ ] edit inputで新しいInput/Executionへ切り替わる。
- [ ] reload後にactive executionを復元する。
- [ ] 複数active executionを表示できる。
- [ ] pollingがterminal stateで停止する。
- [ ] Development UIだけが`開発者向け詳細`を表示し、Execution、Attempt、例外chain、trace/span IDを確認できる。
- [ ] Production UIにはDevelopment専用診断欄が表示されない。
- [ ] screen readerへ状態変更を過剰でなく通知する。

### E2E

- [ ] Player Input → queued → running → Narrative Turn publish。
- [ ] Player Input → timeout → failed → retry → success。
- [ ] Player Input → running → cancel-requested → cancelled。
- [ ] worker停止 → lease expiry → worker再開 → success。
- [ ] Session advance中のlate completion → superseded。
- [ ] fixtureによるNarrative success → image Execution failure → retry capability表示。実画像AI呼び出しは行わない。
- [ ] fixtureまたは保存済みArtifactによるNarrative success → note proposal → edit/apply → Note Revision作成。実ノートAI呼び出しは行わない。

## OpenTelemetry、Observabilityと運用

既存`Myriale.ServiceDefaults`のOpenTelemetry基盤を拡張し、Session Executionのtrace、metric、structured logをOTLP経由で送信できるようにする。ローカルAspire DashboardとForge環境のcollector/exporterの両方で確認できる構成にする。

### Tracing

専用`ActivitySource`を追加し、以下のspanを作成する。

```text
session.input.accept
session.execution.enqueue
session.execution.claim
session.execution.run
session.execution.attempt
ai.provider.request
session.artifact.validate
session.artifact.persist
session.turn.publish
session.execution.retry.schedule
session.execution.cancel
session.execution.recover-lease
```

要件:

- API受付spanからworker処理へW3C trace contextを引き継ぐ。
- HTTP request終了後も、Executionに保存したtrace parentまたはlinkを使って非同期処理の因果関係を追跡できるようにする。
- retry Attemptは個別spanとし、親Execution spanまたはspan linkで同じExecutionへ関連付ける。
- Provider HTTP instrumentationとMyriale独自の`ai.provider.request`spanを重複計上しないよう責務を分ける。
- exception発生時はspan statusをErrorにし、正規化error codeとretryabilityを記録する。
- cancellation、superseded、lease expiryを通常のfailureと区別する。

低cardinality属性:

```text
myriale.execution.kind
myriale.execution.status
myriale.execution.attempt_number
myriale.execution.retryable
myriale.artifact.kind
myriale.turn.kind
ai.provider.name
ai.model.name
error.type
http.response.status_code
```

高cardinality IDはtrace/span上の属性またはlog scopeには含めてもよいが、metric labelには使用しない。

```text
myriale.session.id
myriale.execution.id
myriale.execution.attempt.id
myriale.input.id
myriale.turn.id
ai.response.id
```

禁止属性:

- Player Input本文
- Narrative全文
- prompt全文
- credential、Authorization header
- redaction前のProvider response
- private Module State

### Metrics

専用`Meter`を追加し、以下を計測する。

Counters:

```text
myriale.session.execution.enqueued
myriale.session.execution.started
myriale.session.execution.completed
myriale.session.execution.failed
myriale.session.execution.retried
myriale.session.execution.cancelled
myriale.session.execution.superseded
myriale.session.execution.lease_expired
myriale.session.artifact.committed
myriale.session.turn.published
```

Histograms:

```text
myriale.session.execution.queue_duration
myriale.session.execution.duration
myriale.session.execution.attempt_duration
myriale.session.execution.retry_delay
myriale.ai.provider.duration
myriale.ai.provider.input_tokens
myriale.ai.provider.output_tokens
myriale.artifact.size
```

Observable gauges:

```text
myriale.session.execution.queue_depth
myriale.session.execution.running
myriale.session.execution.retry_wait
myriale.session.execution.oldest_queued_age
myriale.session.execution.stuck
```

要件:

- metric labelはKind、status、Provider、model、error codeなどboundedな値に限定する。
- Session ID、Execution ID、email、Player Inputをmetric labelへ入れない。
- DB queryをgauge callbackごとに乱発せず、background samplerまたはcached snapshotを使う。
- queue depth、oldest queued age、failure rate、lease expiry、retry exhaustionにalert可能な値を提供する。

### Structured loggingと相関

- Execution ID、Attempt ID、Session ID、Input/Turn ID、trace ID、span IDをlogging scopeへ含める。
- enqueue、claim、retry schedule、cancel request、lease recovery、publish decisionを構造化eventとして記録する。
- Provider failureはstatus、reason、request ID、正規化error code、redaction済みexcerptを記録する。
- Development UIの診断欄からtrace IDをcopyし、Aspire Dashboardまたは接続済みtelemetry backendで検索できるようにする。
- OpenTelemetry logging exporterを有効化しても、既存console logと二重にsecretを出さないredaction boundaryを共有する。

### Configurationとexport

- `OTEL_EXPORTER_OTLP_ENDPOINT`が設定された環境ではtrace、metric、logをOTLPへexportする。
- service name、service version、deployment environment、git commit SHAをresource attributeとして設定する。
- local AspireではDashboardでAPIとworkerの分散traceを確認する。
- exporter障害でSession処理を失敗させない。
- sampling policyをconfiguration化し、Developmentは詳細、Productionはhead/base samplingまたはtail samplingを選択可能にする。
- Productionでerror spanを調査できる一方、機微データを送信しないことをintegration testで確認する。

### 運用

- lease expiry、stuck running、retry exhaustion、orphan Artifactを検知する。
- 管理画面ではPlayer向けmessageとは別にAttempt diagnosticsとtrace linkを表示する。
- Attempt、Artifact、telemetryのretention policyを定義する。
- dashboard/runbookにqueue停滞、Provider障害、worker停止、publish競合の確認手順を記載する。

## Migration方針

1. UI分離を先行し、既存`PendingInputs`をExecution風に表示する。
2. `SessionExecution`tableを追加し、旧処理と並行してshadow writeする。
3. 既存`SessionPendingPlayerInput`と`SessionNarrativeHandoff`をbackfillする。
4. read pathを新Executionへ切り替える。
5. worker claimとwrite pathを新Executionへ切り替える。
6. 旧tableへのwriteを停止する。
7. 運用期間後に旧tableと互換contractを削除する。

Migration中の必須条件:

- 同じworkを旧serviceと新workerが同時実行しない。
- 旧Request ID replayの意味を維持する。
- 既存SessionのTurn chainを変更しない。
- failed pending inputを失わない。
- rollback時に旧read pathへ戻せる期間を設ける。

## 計画ファイルのライフサイクル

この文書は実装中だけ保持する一時的なTODOである。

- 全対象フェーズの実装、migration、テスト、telemetry検証、browser検証が完了するまでは削除しない。
- 完了した設計判断のうち将来も必要な内容は、削除前に`docs/architecture/`、ユーザーストーリー、運用runbook、コードコメントへ移す。
- 未完了項目、既知の制約、後続課題が残る場合は、この文書を削除せず該当checkboxとblockerを更新する。
- 画像・ノートAI Provider呼び出し本体は今回の非目標なので、それらが未実装であることだけを理由に計画完了を妨げない。
- この計画で対象とした実装と検証がすべて完了した最後の変更で、`docs/todos/session-execution-and-artifacts.md`を削除する。
- 計画ファイル削除後も、architecture文書とテストがInput、Execution、Artifact、Turnの境界を正本として説明・保証する状態にする。

## 非目標

本計画では以下を実装対象にしない。

- ノート生成のPrompt Builder、Provider adapter、Execution handlerなど、実AI呼び出し本体。
- 画像生成のPrompt Builder、Provider job作成・polling・streaming、Execution handlerなど、実AI呼び出し本体。
- Temporal、Durable Functionsなど外部workflow engineの導入。
- WebSocketまたはSignalRによるリアルタイム配信。
- token単位のNarrative streaming。
- 生成中のpartial Narrativeを正式Turnとして保存すること。
- AIによるNote Canonの無確認自動更新。
- すべてのArtifactを同一transactionでall-or-nothing publishすること。

## 参考資料

設計判断の背景として参照した一次資料:

- Azure Architecture Center, Asynchronous Request-Reply pattern: https://learn.microsoft.com/en-us/azure/architecture/patterns/asynchronous-request-reply
- Azure Architecture Center, Background jobs guidance: https://learn.microsoft.com/en-us/azure/architecture/best-practices/background-jobs
- PostgreSQL, `SELECT` / `SKIP LOCKED`: https://www.postgresql.org/docs/current/sql-select.html
- OpenAI API, Background mode: https://platform.openai.com/docs/guides/background
- OpenAI API, Conversation state: https://platform.openai.com/docs/guides/conversation-state
- OpenAI API, Webhooks: https://platform.openai.com/docs/guides/webhooks
- Temporal, Retry Policies: https://docs.temporal.io/encyclopedia/retry-policies
- Temporal, Activity Definition and idempotency: https://docs.temporal.io/activity-definition
- Temporal .NET, Cancellation: https://docs.temporal.io/develop/dotnet/cancellation
- Stripe API, Idempotent requests: https://docs.stripe.com/api/idempotent_requests
- Carbon Design System, Notification usage: https://carbondesignsystem.com/components/notification/usage/
- W3C WCAG, Status Messages: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- W3C ARIA23, `role="log"`: https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA23

## 全体完了条件

- [ ] Player Input、Execution、Artifact、Session Turnが別の永続概念として実装されている。
- [ ] Player Inputは生成失敗に関係なく受付時に保存される。
- [ ] 失敗・cancel・retry待機がSession TurnやNarrative contextへ混入しない。
- [ ] Session再読み込み後にInputと全Execution状態を復元できる。
- [ ] worker再起動、lease expiry、重複実行、late completionで二重publishしない。
- [ ] Narrative、Module Handoff、ノート、画像が共通Execution lifecycleを利用する。
- [ ] 成功した成果物だけが型ごとのdomain modelへpublishされる。
- [ ] UIがExecution statusとcapabilityに基づいてRetry、Cancel、Details、Dismissを切り替える。
- [ ] errorは対象Input/Turnの近くに持続表示され、次に可能な操作を示す。
- [ ] OpenTelemetryのtrace、metric、structured logがAPI、worker、Provider、publishを相関できる。
- [ ] DevelopmentではExecutionとErrorの詳細データをUIで確認でき、Productionでは非表示である。
- [ ] ノート・画像のExecution/Artifact/UI基盤は実装されているが、実AI呼び出し本体は追加されていない。
- [ ] 完了した恒久的設計をarchitecture文書とテストへ移している。
- [ ] accessibility、authorization、secret redaction、observability、retentionが検証されている。
- [ ] 最終作業として`docs/todos/session-execution-and-artifacts.md`を削除している。
