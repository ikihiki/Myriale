# TODO: 『星喰いの地下図書館』Module総合デモ

## 目的

既存シナリオ『星喰いの地下図書館』を使い、通常のNarrative Turnからプログラム駆動のModule Turnへ移行し、確定したOutcomeを再びNarrative Turnへ自動的に引き渡す一連のプレイを実装する。

最初の実装単位は「閉じた星座」の扉を開くダイス判定とする。その後、判定失敗から図書館の守護者とのJRPG風ターン制戦闘へ分岐させ、Module基盤の総合デモへ拡張する。

この文書は実装TODOであり、一般的な振る舞いの要件やModuleの設計境界は既存のUser StoryおよびArchitecture文書を正本とする。

## デモの通しフロー

1. プレイヤーは通常のAI対話で水没した地下図書館を探索する。
2. 「閉じた星座」の扉へ到達すると、自由入力からダイス判定Moduleへ移行する。
3. プレイヤーが判定を実行し、ホスト提供乱数とModuleのルールによって成功・失敗を確定する。
4. 成功時は扉が開き、OutcomeとSession Stateへ確定結果を反映する。
5. 失敗時は防衛機構が起動し、守護者との戦闘へ進むことを確定する。
6. ダイス判定完了後、AIは確定結果を変更せずNarrative Turnとして描写する。
7. 戦闘が必要な場合はJRPG戦闘Moduleへ移行し、複数ラウンドを同じModule Turn内で進行する。
8. 戦闘完了後、勝利・敗北・逃走などの確定結果を自動的にNarrative Turnへ引き渡す。
9. 強制進行の終了後、通常のAI対話へ復帰する。

## フェーズ0: 永続Narrative入力とScenario進行

現在のSession APIはModule Turnの作成・取得とModule OutcomeからのNarrative生成までを提供している。通常のプレイヤー入力を永続化してAI Narrativeを生成する経路、およびNarrativeの進行条件からModule Turnを開始する仕組みは、このデモの先行作業として実装する。

### プレイヤー入力とNarrative

- [ ] Session所有のプレイヤー入力を、順序付きかつ冪等に永続化するAPIとエンティティ境界を定義する。
- [ ] プレイヤー入力からAI Narrative Turnを生成し、Sessionの`NextTurnPosition`と同じ同時実行境界で一度だけ追加する。
- [ ] AI失敗、client retry、複数worker競合、Session進行競合時の状態と再試行方法を定義する。
- [ ] 通常対話では、Narrative生成完了後に次のプレイヤー入力を待つ。

### Scenario進行オーケストレーター

- [ ] Scenarioの進行ノードと、各ノードから開始するModule定義を永続化する。
- [ ] NarrativeまたはModule Outcomeの確定データから次の進行ノードを評価するhost側オーケストレーターを実装する。
- [ ] Narrative生成結果を本文だけでなく、許可された進行signalを含む構造化結果として返す契約を定義する。
- [ ] Narrative用promptには現在nodeで許可されたsignalだけを渡し、hostがschemaとallowlistを検証してから永続化する。
- [ ] 「閉じた星座」の扉への到達を表すsignalを、Narrative Turnと同じtransactionでreceipt付きの確定データとして保存する。
- [ ] Module開始条件にはNarrative本文の再解釈ではなく、検証・永続化済みsignal、Outcome code、durable emitted event、またはSession flagを使用する。
- [ ] Narrative signalおよび進行遷移ごとのreceiptと一意制約を設け、retry、複数worker、クラッシュ回復時もsignalと次のModule Turnを一度だけ保存する。
- [ ] オーケストレーターの状態をSession GETで安全に確認でき、GET自体は進行処理を開始しないようにする。
- [ ] ダイス失敗時は`constellation-guardian-awakened`を根拠として、Narrative handoff完了後に戦闘Module Turnを作成する。

## フェーズ1: 星座の扉のダイス判定

### Scenario Authoringとの統合

- [ ] Scenarioが利用するModule packageとconfigurationを指定できるようにする。
- [ ] Narrativeからダイス判定を開始する条件をシナリオ側で表現する。
- [ ] 『星喰いの地下図書館』に「閉じた星座」の扉の判定設定を追加する。
- [ ] Session開始時に、このデモで使用するModuleのID、version、digestとconfiguration snapshotを固定する。
- [ ] Session開始後にScenario側のModule指定が変更されても、進行中Sessionは固定済みsnapshotを使用する。
- [ ] Scenario進行用のModule Turn作成をhost内部のオーケストレーター経路へ限定する。
- [ ] 既存のclient駆動Module Turn作成APIは、Scenario Sessionでは内部化または拒否し、少なくとも現在nodeとSession固定snapshotへの完全一致をhost側で強制する。
- [ ] クライアントが任意のModule identity、configuration、contextを指定してScenario進行を迂回できないことを検証する。

### ダイス判定Module

- [ ] SDKを使った実Module packageとして実装する。
- [ ] 目標値、ダイス式、補正値、成功・失敗条件をconfigurationで受け取る。
- [ ] ダイス値にはホスト提供乱数だけを使用する。
- [ ] Runtime UIには判定目的、目標値、補正値、ダイス結果、成功・失敗を表示する。
- [ ] Runtime UIは判定開始などのintentだけを送信し、ダイス値や結果を権威値として送信しない。
- [ ] 完了時に成功または失敗を表す唯一の正式な`ModuleOutcome`を返す。
- [ ] 成功時に`constellation-door-opened`を`set-flag` Effectで設定する。
- [ ] 失敗時に`constellation-guardian-awakened`を`set-flag` Effectで設定する。
- [ ] Narrative HintsとForbidden Narrative Factsを設定し、AIが判定結果を改変しないようにする。

### セッション統合

- [ ] Narrative TurnからSession所有のModule Turnを開始する。
- [ ] Module実行中は通常の自由入力を無効化し、現在の目的を表示する。
- [ ] 再読み込みや画面遷移後も同じ判定状態を再開できる。
- [ ] 完了OutcomeとEffectが冪等に保存され、再送時に重複適用されないことを確認する。
- [ ] 完了後に自動Narrative handoffが実行されることを確認する。
- [ ] Narrative Turn生成失敗時も判定結果とEffectを維持し、完了requestのreplayで再試行できることを確認する。

## フェーズ2: 図書館の守護者とのJRPG戦闘

### 戦闘Module

- [ ] SDKを使った実Module packageとして実装する。
- [ ] プレイヤーと敵の初期能力、利用可能スキル、勝敗条件をconfigurationで受け取る。
- [ ] `攻撃`、`防御`、`スキル`、`逃走`を構造化Actionとして提供する。
- [ ] HP、ダメージ、行動順、状態、ラウンド数、勝敗をModuleのprivate Stateで管理する。
- [ ] public ViewStateにはプレイヤーが確認できる戦闘情報だけを含める。
- [ ] ダメージなどの乱数にはホスト提供乱数だけを使用する。
- [ ] 複数ラウンドを1つのModule Turn内で進行する。
- [ ] Runtime UIはAction intentだけを送信し、HP、ダメージ、状態、勝敗を権威値として送信しない。
- [ ] 勝利、敗北、逃走のいずれかで唯一の正式な`ModuleOutcome`を返す。
- [ ] 勝利時に`guardian-defeated`を`set-flag` Effectで設定する。
- [ ] AIへ公開する事実と、変更を禁止する戦闘結果を明示する。

### セッション統合

- [ ] ダイス判定失敗後のNarrativeから戦闘Module Turnへ移行する。
- [ ] 戦闘中の再読み込みや切断後も、同じExecutionとラウンドから再開できる。
- [ ] 同一Request IDの再送でActionやダメージが二重適用されないことを確認する。
- [ ] 戦闘完了後にOutcome Effectを一度だけ適用する。
- [ ] 戦闘結果からNarrative Turnを自動生成する。
- [ ] Narrative描写後に通常のAI対話へ復帰する。

## Module packageの配布と開発環境bootstrap

- [ ] ダイス判定Moduleと戦闘Moduleを再現可能な手順でbuildし、`.myriale-module` packageを生成する。
- [ ] クリーンなAppHost起動時に、デモ用Module packageをcatalogへ導入する開発用bootstrapを用意する。
- [ ] packageのdigestを導入後に確定し、seed Scenarioまたは開発用設定がそのexact identityを参照する。
- [ ] Moduleが管理者承認済みかつenabledな状態でのみデモSessionを開始できるようにする。
- [ ] DB再作成後も、文書化されたbootstrap手順だけで両Moduleを再導入できることを確認する。
- [ ] CIまたはintegration testでpackage生成、install、rescan、resolve、executionまでを検証する。

## デモデータと物語上の確定事項

- [ ] 水没した閲覧室、銀の鍵、星図灯、記憶を奪う禁書、「閉じた星座」の扉を既存シナリオ設定と整合させる。
- [ ] 成功時、扉が開いたことを確定事実としてNarrativeへ渡す。
- [ ] 失敗時、守護者が起動したことを確定事実としてNarrativeへ渡す。
- [ ] 戦闘完了時、勝敗、残りHP、使用済みリソース、守護者の状態を確定事実としてNarrativeへ渡す。
- [ ] AIが敗北を勝利へ変更する、消費済みリソースを復元する、撃破済みの敵を理由なく復活させる、といった描写を禁止する。

## テストとレビュー手順

### 自動テスト

- [ ] 固定乱数でダイス判定の成功経路を再現する。
- [ ] 固定乱数でダイス判定の失敗経路を再現する。
- [ ] ダイス判定の中断・再開とrequest replayを検証する。
- [ ] 戦闘の勝利経路を固定乱数で再現する。
- [ ] 戦闘の敗北または逃走経路を固定乱数で再現する。
- [ ] 戦闘の中断・再開と複数Actionの冪等性を検証する。
- [ ] Runtime UIが権威値を送信してもModule結果を改変できないことを検証する。
- [ ] Outcome Effectのexactly-once適用を検証する。
- [ ] 各Module完了後のautomatic Narrative handoffを検証する。
- [ ] AIへのrequestにprivate State、configuration、context、乱数、receipt、diagnosticsが含まれないことを検証する。

### 手動レビュー

- [ ] PRにAppHostとStorybookの起動手順を記載する。
- [ ] 『星喰いの地下図書館』開始から星座の扉までの操作手順を記載する。
- [ ] authorityを変更しないテスト専用seedまたはconfigurationで、ダイス判定の成功・失敗を決定論的に再現する。
- [ ] 手動レビュー手順に、使用するseed/configuration、期待する乱数列、Outcome、Session flagを記載する。
- [ ] 戦闘開始からNarrative復帰までの通し操作手順を記載する。
- [ ] browser-toolのsnapshot、screenshot、または明示的なassertionでUI動作を確認する。

## フェーズ別完了条件

### フェーズ0: 永続Narrative入力とScenario進行

- [ ] プレイヤー入力とAI NarrativeがSessionの順序付きTurnとして永続化される。
- [ ] retry、複数worker、クラッシュ回復時も同じ入力、Narrative signal、進行遷移が重複保存されない。
- [ ] Narrative本文を再解釈せず、hostが検証・永続化した構造化signalからSession所有Module Turnを一度だけ開始できる。
- [ ] Session開始時にModule identityとconfiguration snapshotが固定される。
- [ ] Scenario Sessionではクライアントが固定snapshot外のModule identity、configuration、contextでModule Turnを作成できない。

### フェーズ1: ダイス判定デモ

- [ ] Narrativeから星座の扉のダイス判定Moduleへ移行できる。
- [ ] 成功経路では扉が開き、自動Narrative handoff後に通常対話へ復帰する。
- [ ] 失敗経路では守護者の起動までを確定し、自動Narrative handoff後に戦闘開始予定の進行状態へ遷移する。
- [ ] ダイス値はホストとModuleが確定し、Runtime UIやAIから改変できない。
- [ ] 判定Module Turnを再読み込み後に継続でき、OutcomeとSession Effectが重複適用されない。
- [ ] ダイスModule packageをクリーンな開発環境へ再現可能な手順で導入できる。

### フェーズ2: JRPG戦闘を含む総合デモ

- [ ] ダイス失敗経路で、1つのSession内にNarrative、ダイス判定Module、Narrative、戦闘Module、Narrativeが順番に保存される。
- [ ] 戦闘内部の複数操作とラウンドが、Session全体では1つのModule Turnとして保存される。
- [ ] HP、ダメージ、状態、勝敗はModuleが確定し、Runtime UIやAIから改変できない。
- [ ] 戦闘Module Turnを再読み込み後に継続でき、Action、Outcome、Session Effectが重複適用されない。
- [ ] 戦闘完了後にNarrative handoffが自動実行され、AIが確定結果に従った描写を返す。
- [ ] 強制進行終了後に通常のAI対話へ復帰できる。
- [ ] 両Module packageをクリーンな開発環境へ再現可能な手順で導入できる。
- [ ] 自動テスト、frontend build、Storybook build、backend buildが成功する。

## 対象外

- 汎用的なJRPG戦闘エンジンへの拡張
- 経験値、所持品、通貨などの新しいSession Effect種別
- untrusted third-party Moduleのsandbox化
- Module marketplace
- 汎用Module authoring UI
- シナリオバージョン固定
- DB migrationや現在のDB lifecycleの変更
- 全分岐の実装や本格的な戦闘バランス調整

## 既存要件・設計への参照

- `docs/user-stories/program-driven-narrative-user-stories.md`
  - Forced Mode、ボタン式戦闘、ダイス判定、自動分岐、確定結果のNarrative化、固定値テスト
- `docs/user-stories/mode-transition-and-exception-user-stories.md`
  - モード表示、切り替え、正常復帰、エラー・離脱後の再開
- `docs/user-stories/session-play-dialogue-user-stories.md`
  - Narrative復帰後のプレイヤー入力待ち
- `docs/architecture/module-runtime.md`
  - Module Turn境界、ホスト提供乱数、revision、永続化、冪等性
- `docs/architecture/module-packages.md`
  - Module packageの構成と不変性
- `docs/architecture/module-ui-protocol.md`
  - sandboxed Runtime UI、intent、ViewState、AvailableActions、UiEvents
- `docs/architecture/module-effects.md`
  - 正式Outcome、Emitted Events、Effectのexactly-once適用、automatic Narrative handoff
- `docs/architecture/module-security.md`
  - trusted Moduleと秘密情報の境界
- `docs/architecture/module-versioning.md`
  - Module ID、version、digestの固定
