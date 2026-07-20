# TODO: 本番品質のAI対話

## 目的

SessionをServer上の確定データから復元し、自然言語のPlayer Inputに対して、Scenario、会話履歴、Session State、進行条件、Moduleの確定結果を守ったNarrativeを生成できるようにする。

単に外部AI Providerへ接続するだけではなく、再読み込み、通信失敗、request replay、長期Session、NPC会話、補足説明、Scenario進行を含めて、プレイヤーが継続的かつ安全に対話できる状態を完成条件とする。

この文書は実装TODOである。一般的な対話体験は`docs/user-stories/session-play-dialogue-user-stories.md`、Lorebookと長期記憶は`docs/user-stories/session-notes-lorebook-user-stories.md`、制御可能な進行は`docs/user-stories/advanced-scenario-execution-user-stories.md`を正本とする。

## 現在地

フェーズ0で次の基盤は実装済みである。

- [x] Player InputをSession所有の不変イベントとして永続化する。
- [x] 同一`RequestId`のreplayとpayload不一致を検出する。
- [x] 未完了のPlayer InputとAI生成のlease、retry、errorを`SessionPendingPlayerInput`で管理し、完了時に確定Inputへ変換してPending rowを削除する。
- [x] Narrative Turnを`Session.HeadTurnId`のcompare-and-swap境界で一度だけ追加する。
- [x] AIが返した進行signalをhost側のallowlistで検証する。
- [x] Narrative Turn、signal、進行receiptを同一transactionで保存する。
- [x] 検証済みsignalからSession所有のModule Turnを開始する。

現状のNarrative ProviderはMockのみであり、Session画面にはhard-coded Turn、client-only操作、暗黙のlocal fallbackが残っている。本番AIを接続する前に、Session APIを画面とAI Contextの正本にする。

## 目標フロー

1. ScenarioからServer上にSessionを作成する。
2. Scenario Openingを最初のNarrative Turnとして確定する。
3. Session画面は`GET /api/sessions/{sessionId}`からTurn履歴を復元する。
4. プレイヤーが自然言語で行動、NPCへの発話、補足要求を送る。
5. hostがScenario、Session State、Canon、要約、直近Turn、進行条件からAI Contextを構築する。
6. AI Providerがversioned schemaに従った構造化Narrative結果を返す。
7. hostが本文、turn type、signal、確定事項との整合性を検証する。
8. Narrative Turnを保存して画面をServer状態へ再同期する。
9. AIは次の重要なPlayer Inputを待つ。
10. 再読み込みや一時障害の後も同じSessionとPlayer Inputから再開できる。

## フェーズ1: Serverを正本にした会話ループ

### Session開始とOpening

- [x] Scenario開始画面から`POST /api/sessions`を呼び、作成されたSession IDへ遷移する。
- [x] Session作成時にScenarioの`Opening`をroot Narrative Turnとして永続化する。
- [x] Opening TurnがAI障害に依存せず、Scenario作者の確定文として作成されるようにする。
- [x] Session作成requestのreplayや競合でOpening Turnが重複しないことを確認する。

### Session画面のhydrate

- [x] `SessionPage`の初期表示で`GET /api/sessions/{sessionId}`を実行する。
- [x] ServerのTurn ID、Position、Kind、Narrative、Player Input、Module Executionを表示の正本にする。
- [ ] hard-codedな`initialTurns`を本番経路から外し、Storybook fixtureへ分離する。
- [x] API未設定時の暗黙local Narrative fallbackを本番経路から削除する。
- [x] Session、認証、API接続に失敗した場合は成功表示へfallbackせず、明示的なerror stateを表示する。
- [x] 画面再読み込み後に同じOpening、Player Input、Narrative、Module Turnが復元されることを確認する。

### Player Input送信と再試行

- [x] draftごとに`RequestId`を発行し、送信失敗後の再試行では同じIDと本文を維持する。
- [x] draft本文を変更した場合だけ新しい`RequestId`を発行する。
- [x] 送信中は入力欄と送信ボタンを適切にlockし、二重送信を防止する。
- [x] 成功後だけ入力欄をclearし、Session GETまたはmutation responseからServer状態へ同期する。
- [ ] 401、404、409、429、503、timeoutを区別したUIを表示する。
- [x] `request_in_progress`では同じ入力を重複作成せず、待機または再取得できるようにする。
- [x] retryableな生成失敗には明示的な「再試行」操作を表示する。
- [x] acceptedだが未完了のPlayer Inputとwork statusをSession APIから確認・再開できる契約を追加する。

### フェーズ1完了条件

- [ ] Session作成、Opening表示、Player Input、Mock Narrative保存、再読み込み、同一request replayが一連で動作する。
- [ ] 本番画面がhard-codedなSession履歴やlocal成功fallbackに依存しない。
- [ ] ブラウザの二重clickや通信再送でPlayer InputとNarrativeが重複しない。

## フェーズ2: Dialogue契約とAI Context Builder

### 構造化Narrative結果

- [x] `NarrativeDialogueRequest`と`NarrativeDialogueResult`にschema versionを追加する。
- [x] Narrative結果に`turnType`を追加する。
- [x] Narrative結果に短い`heading`を追加する。
- [x] Narrative結果にプレイヤーへ開示可能な`inputInterpretation`を追加する。
- [x] `inputInterpretation`はchain-of-thoughtではなく、行動種別と要約だけを保持する。
- [x] Narrative結果の本文、heading、interpretation、signalsに長さと文字種の上限を設ける。
- [x] schema不一致、余分なfield、空本文、不正signalをhost側で拒否する。

想定するturn type:

- `opening`: Scenario開始時の導入。
- `action-result`: Player Inputによる行動結果。
- `npc-reply`: NPCへの発話に対する返答。
- `clarification`: 状況の要約や再説明。世界状態を進めない。
- `module-handoff`: Module Outcomeの確定結果を描写する。

### Clarificationと非進行制約

- [x] 「今の状況を簡単にまとめて」をclient-only TurnではなくServer requestにする。
- [x] requestで期待するturn typeまたはinteraction typeを明示できるようにする。
- [x] `clarification`ではprogression signalを禁止する。
- [x] `clarification`からhost所有の進行やSession flag変更を確定できないようにする。
- [ ] `clarification`の本文で新規の事件、NPC、場所を確定しないよう、Prompt BuilderとCanon Contextで制約する。
- [x] `clarification`はSessionの理解補助Turnとして履歴に保存する。

### 進行signalの意味

- [x] Scenario progression signalにAI向けのtrigger descriptionを追加する。
- [ ] 必要に応じてpositive exampleとcounter exampleを追加する。
- [x] AI結果のsignalに短い`evidence`を要求する。
- [x] hostが現在node、allowlist、turn type、signal件数、evidenceを検証する。
- [x] opaqueなsignal codeだけをAIへ渡す現在の契約を廃止する。
- [x] signal誤発火時にModule Turnが開始されないことをテストする。

### Context Builder

- [x] `INarrativeContextBuilder`を導入し、Context構築を`SessionNarrativeTurnService`から分離する。
- [ ] Scenario Lore、Tone、AI Freedom、選択済みHeroをContextへ含める。
- [x] 現在のScenario progression nodeと許可された遷移条件を含める。
- [x] Session flagsと現在状態を含める。
- [x] Module OutcomeのPublic Facts、Narrative Hints、Forbidden Narrative Factsを後続対話へ含める。
- [x] Session SummaryとLorebookを後から差し込めるversioned contractを定義する。
- [ ] Recent Turnsの件数ではなくtoken budgetでContext量を制御できるようにする。
- [ ] Contextのschema version、構成要素ID、サイズ、hashを診断用に記録する。
- [ ] private Module State、configuration、context、乱数、receipt、provider secretをAI requestへ含めない。

### Prompt Builder

- [ ] `INarrativePromptBuilder`を導入し、Provider adapterからNarrative指示を分離する。
- [ ] Player Inputをsystem/developer instructionと明確に分離し、prompt injectionを命令として扱わない。
- [ ] Scenario Toneと主人公視点を維持する指示を定義する。
- [ ] Player Inputにない重要な選択や主人公の代理行動を確定しないよう指示する。
- [ ] Narrativeは状況提示または行動結果を描写し、次の重要な決定をPlayerへ返す。
- [ ] Canon、Session flags、Module Outcome、Forbidden Factsを変更しないよう指示する。
- [ ] `AiFreedom`の各値を具体的な生成制約へmappingする。
- [ ] prompt versionを記録し、品質評価で比較できるようにする。

### フェーズ2完了条件

- [ ] Mock Providerを使った契約テストで全turn typeとschema validationが通る。
- [x] clarificationが進行signalやSession Stateを変更しない。
- [x] signalのtrigger descriptionとevidenceがrequest/responseに含まれ、host検証される。
- [ ] Context Builderの出力に必要情報だけが含まれ、非公開データが含まれない。

## フェーズ3: 実AI Provider

### Provider abstraction

- [ ] Narrative固有のContext/Prompt構築と外部Provider通信を分離する。
- [ ] `IAiTextProvider`または同等のProvider非依存interfaceを定義する。
- [ ] Mock Providerを決定論的な開発・テスト用実装として残す。
- [ ] 最初の実ProviderとしてOpenAI adapterを実装する。
- [ ] JSON Schemaに従うstructured outputを使用する。
- [ ] Provider、model、timeout、output token上限、生成設定をconfiguration化する。
- [ ] Provider SDKやAPIの例外をMyriale共通error codeへ正規化する。

### Secretと管理権限

- [ ] AI Provider Key管理Endpointに明示的な管理者authorization policyを設定する。
- [ ] Provider secretを平文DB保存しない方式へ変更する。
- [ ] 環境変数、secret store、ASP.NET Core Data Protection、外部secret managerの採用方針を決定する。
- [ ] secretをAPI response、application log、prompt診断、telemetryへ出さない。
- [ ] AI Keyのtest操作を実Providerへの最小疎通確認に置き換える。
- [ ] `valid`、`invalid-credential`、`rate-limited`、`model-not-found`、`provider-unavailable`を区別する。

### Provider resilience

- [ ] timeout、429、provider 5xx、invalid credential、schema failure、content rejectionを区別する。
- [ ] retry可能errorに指数backoffと最大試行回数を設定する。
- [ ] Providerの`Retry-After`を尊重する。
- [ ] provider failoverを初期リリースに含めるか対象外にするか決定する。
- [ ] 同期HTTP request内で待つ方式からbackground workerへ移行する必要性を評価する。
- [ ] abandonedまたは期限切れleaseを回収するworker/triggerを用意する。
- [ ] 同じPlayer Inputのretryで別のNarrative Turnが生成されないことを確認する。

### Usageと診断

- [ ] Provider、model、prompt version、context versionを記録する。
- [ ] input/output token数、応答時間、attempt count、終了理由を記録する。
- [ ] Provider response IDを安全な診断情報として保持する。
- [ ] Player本文や秘密情報を通常logへそのまま出さない。
- [ ] コスト上限、Session単位rate limit、ユーザー単位rate limitを設定する。

### フェーズ3完了条件

- [ ] 管理者が実Providerを設定・検証できる。
- [ ] API keyがbrowserやlogへ露出しない。
- [ ] 実Providerがschema準拠Narrativeを返し、Session Turnとして保存される。
- [ ] Provider障害時にPlayer Inputが失われず、同じrequestで再試行できる。

## フェーズ4: 会話品質と確定事項の保護

### Player agency

- [ ] Player Inputに書かれていない開錠、移動、契約、戦闘開始、重要item消費をAIが勝手に確定しないようにする。
- [ ] 「調べる」を「開けて入る」へ拡大解釈しない評価ケースを追加する。
- [ ] 行動が不明確な場合は安全な範囲で描写するか、確認を返す。
- [ ] AIが重要な進行後に必ず次のPlayer Inputを待つことを確認する。

### NPC一貫性

- [ ] Scenario Canonとして主要NPCの名前、別名、立場、口調、知識、秘密、公開条件を表現できるようにする。
- [ ] NPCの現在地、感情、関係性などSession固有状態を保持する方針を決定する。
- [ ] 同一NPCがTurn間で名前、口調、経歴を理由なく変更しない評価ケースを追加する。
- [ ] NPCが知らない情報や公開条件未達の秘密を話さないようにする。

### Module結果の連続性

- [ ] Module Outcomeのcode、Public Facts、Emitted Events、Narrative Hintsを後続Contextへ残す。
- [ ] Forbidden Narrative Factsをhandoff直後だけでなく後続対話でも適用する。
- [ ] 適用済みSession flagsとModule確定結果が矛盾した場合は生成をrejectまたは再生成する。
- [ ] 撃破済みの敵、消費済みresource、開いた扉をAIが理由なく元へ戻さない評価ケースを追加する。

### 出力検証

- [ ] response bodyの空文字、過長、反復、schema破損を検出する。
- [ ] Playerの代理行動、Forbidden Facts、明白なCanon矛盾を検出するvalidatorの範囲を決定する。
- [ ] validator失敗時は同じPlayer Inputのattemptとして安全に再生成する。
- [ ] 最大再生成回数を超えた場合はPlayerへ修復可能なerrorを表示する。
- [ ] content safety policyとNarrative表現上の許容範囲を定義する。

### フェーズ4完了条件

- [ ] 固定評価ケースでPlayer agency、NPC一貫性、Canon、Module結果を守れる。
- [ ] 誤ったsignalやForbidden Factsを含む出力がSessionへcommitされない。
- [ ] AIの内部推論を公開せず、短い入力解釈だけを表示できる。

## フェーズ5: Lorebookと長期記憶

### Lorebook永続化

- [ ] 現在client-onlyのSession Notesをbackend entity/APIへ接続する。
- [ ] Person、Location、Item、Organization、Ruleの基本種別を定義する。
- [ ] 表示名、別名、内容、Canon status、初出Turn、更新元Turnを保存する。
- [ ] Canon、未確定、噂を区別する。
- [ ] AIによる追加・更新はcandidateとして保存し、ユーザー承認なしにCanon化しない。
- [ ] Narrative Turnごとに参照したLorebook entry IDを記録する。

### Session/Chapter Summary

- [ ] 一定Turn数またはChapter境界で圧縮Summaryを生成する。
- [ ] Summaryに元Turn範囲、version、生成時刻、確定度を持たせる。
- [ ] Summaryに現在地、登場人物、目的、手がかり、所持状態、Module結果を含める。
- [ ] Summary生成が既存Canonを書き換えないよう検証する。
- [ ] Summary生成失敗が通常対話Turnをrollbackしないよう処理境界を分離する。

### Context retrieval

- [ ] 全Lorebookを毎回送らず、Player Input、直近Turn、現在地、進行nodeから関連entryを選ぶ。
- [ ] Scenario Lore、Canon Lorebook、Session State、Summary、Recent Turnsの優先順位を実装する。
- [ ] token budget超過時のdrop/圧縮順序を定義する。
- [ ] AIが参照したCanonをPlayerまたはauthor向けdebug UIで確認できるようにする。

### フェーズ5完了条件

- [ ] 20 Turn以上前の重要な確定事項をSummary/Lorebookから再構築できる。
- [ ] Canonと噂を区別し、噂を事実として断定しない。
- [ ] Context token量を制限しながら長期Sessionの整合性を維持できる。

## フェーズ6: 品質評価、監視、運用

### 自動契約テスト

- [ ] Context要素の順序、version、token budgetを検証する。
- [ ] Scenario、Session flags、Recent Turnsが正しくProvider requestへ入ることを検証する。
- [ ] private State、configuration、乱数、receipt、secretがrequestへ入らないことを検証する。
- [ ] clarificationでsignalが拒否されることを検証する。
- [ ] Module Public FactsとForbidden Factsが後続Contextへ入ることを検証する。
- [ ] 同一Request IDのretryで同じPlayer Inputと最大1件のNarrative Turnだけが存在することを検証する。
- [ ] Session advance中の生成結果がcommitされないことを検証する。

### 会話品質評価

- [ ] NPC一貫性の固定会話ケースを用意する。
- [ ] Scenario Canon違反を拒否する固定会話ケースを用意する。
- [ ] Player代理行動をしない固定会話ケースを用意する。
- [ ] clarificationが物語を進めない固定会話ケースを用意する。
- [ ] 長期記憶を確認する20 Turn以上のケースを用意する。
- [ ] Module Outcome後の確定事項を維持するケースを用意する。
- [ ] signalのpositive/counter exampleを用いた誤発火テストを用意する。

### 実Provider評価

- [ ] 実Provider評価はAPI keyがある専用環境だけで実行する。
- [ ] model、prompt version、context version、実行日時を記録する。
- [ ] 非決定性を考慮し、必要なケースは複数回評価する。
- [ ] token usage、latency、schema成功率、signal誤発火率を集計する。
- [ ] 通常CIで実行するMock契約テストと、任意の実Provider評価を分離する。

### UIとE2E

- [ ] Storybookでloading、retryable error、non-retryable error、resume、clarificationを再現する。
- [ ] Session作成から複数回対話、再読み込み、retryまでのE2Eを追加する。
- [ ] browser-toolのsnapshot、screenshot、または明示的assertionで実画面を確認する。
- [ ] network request上で同一retryが同じRequest IDを使用することを確認する。

### 運用監視

- [ ] generation成功率、timeout、429、provider 5xx、schema失敗を計測する。
- [ ] retry回数、lease期限切れ、Session advanced、不正signalを計測する。
- [ ] model別のtoken usageとlatencyを計測する。
- [ ] Player本文を含めない標準telemetryと、権限制御された診断手段を分離する。
- [ ] Provider停止時の運用手順とPlayer向け表示を文書化する。

## 推奨PR分割

### PR 1: 実Session会話ループ

- Session作成とOpening Turn。
- Session GETによる画面hydrate。
- hard-coded Turnと暗黙fallbackの本番経路からの除去。
- pending UI、Request ID維持、retry、reload。

### PR 2: Dialogue contractとContext Builder

- turn type、heading、input interpretation。
- clarificationの非進行制約。
- signal description/evidence。
- Context Builder、Prompt Builder、versioning。

### PR 3: 実AI Provider

- Provider abstractionとOpenAI adapter。
- structured output。
- secret管理と管理者policy。
- provider error、retry、usage診断。

### PR 4: 会話品質とModule連続性

- Player agency。
- NPC Canon。
- Module Public FactsとForbidden Facts。
- 出力validatorと固定品質評価。

### PR 5: Lorebookと長期記憶

- Notes backend。
- Session/Chapter Summary。
- 関連entry retrieval。
- 参照元表示と長期Session評価。

### PR 6: 品質評価と運用監視

- Mock契約テスト。
- 実Provider評価suite。
- E2Eとbrowser検証。
- telemetry、rate limit、運用手順。

## 最初の実装単位

最初に着手するのはPR 1とする。本物のAI Providerを先に接続せず、以下をMock AIで完成させる。

- [x] 実ScenarioからSessionを作成する。
- [x] Scenario OpeningをServerへ保存する。
- [x] Session画面がServer履歴を表示する。
- [x] Player Inputを送信してMock Narrativeを保存する。
- [x] 画面再読み込み後に同じログへ戻る。
- [x] 一時失敗後に同じRequest IDで再試行する。
- [x] API障害をlocal成功表示で隠さない。

## 全体完了条件

- [ ] 実Providerを利用したNarrative → Player Input → Narrativeのループが継続する。
- [ ] Session再読み込み、通信再送、Provider一時障害でも入力とTurnが重複・消失しない。
- [ ] AIがScenario Lore、Session State、Canon、Module確定結果に従う。
- [ ] Playerの重要な選択をAIが勝手に確定しない。
- [ ] clarificationでは世界状態や進行を変更しない。
- [ ] NPCが長期Sessionでも立場、口調、関係性を維持する。
- [ ] 誤ったprogression signalとForbidden FactsがSessionへcommitされない。
- [ ] 長期SessionのContextをtoken budget内で再構築できる。
- [ ] Mock契約テスト、backend tests、frontend tests、frontend build、Storybook build、E2Eが成功する。

## 対象外または別途判断

- 複数Provider間の自動failover。
- AIによるLorebook candidateの自動Canon化。
- Playerへchain-of-thoughtを表示する機能。
- AIが直接Session StateやModule Stateを更新する機能。
- 全Scenarioへ共通する汎用的な物語品質スコアの確立。
- 音声対話、画像入力、リアルタイム音声生成。

## 関連文書

- `docs/user-stories/session-play-dialogue-user-stories.md`
- `docs/user-stories/session-notes-lorebook-user-stories.md`
- `docs/user-stories/advanced-scenario-execution-user-stories.md`
- `docs/user-stories/mode-transition-and-exception-user-stories.md`
- `docs/architecture/session-events.md`
- `docs/architecture/module-effects.md`
- `docs/architecture/module-security.md`
- `docs/todos/star-eater-underground-library-module-demo.md`
