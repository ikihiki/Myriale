# シナリオ編集に関するユーザーストーリー

## 前提

Scenario の published definition version は immutable である。編集は所有者の新しい draft version に対して行い、Location、Object Type、Object placement、action result を登録時と同じ editor/validation で変更する。publish 後の変更は新規 Session にだけ反映され、既存 Session は開始時に pin した version を使い続ける。

---

## US-E01: published Scenario から新しい draft を作りたい

As a シナリオ作者
I want 現在の published definition を基に編集 draft を作りたい
So that 稼働中 Session を壊さず改善できる

期待される結果

- published version 自体は変更されない。
- 新 draft は Location/Object Type/action/Object/result の stable ID/code を維持する。
- revision と競合制御により、古い editor からの上書きを `409` 相当で拒否する。
- title-only または incomplete draft も保存できる。

## US-E02: Location と Object placement を編集したい

As a シナリオ作者
I want Location の説明や Object の初期配置を変更したい
So that 新しい Session の世界構成を改善できる

期待される結果

- Location の追加・更新と Object の一つの初期 placement を編集できる。
- 参照中 Location の削除は依存 Object を remap/delete するまで拒否される。
- existing Session の現在 Location/placement は変更されない。

## US-E03: Object Type の state/action を編集したい

As a シナリオ作者
I want state schema/default/public projection/action interface を更新したい
So that Object の能力と公開情報を改善できる

期待される結果

- type/action の stable code を維持して編集できる。
- initial override と全 result/effect path が新 schema に適合するか検証される。
- private property が public projection に意図せず追加された場合は review で明示する。
- 参照中 type/action の削除は依存 Object/result の解消まで拒否される。

## US-E04: Object action result を編集したい

As a シナリオ作者
I want condition、priority、effects、extension binding を変更したい
So that state ごとの振る舞いを修正できる

期待される結果

- typed form で versioned condition/effect AST を編集する。
- raw script や任意 JSON Patch は登録できない。
- extension binding は exact ID/version/digest/configuration を選択する。
- draft では incomplete warning を許可し、publish では missing/ambiguous result や invalid target を blocking error にする。

## US-E05: runtime と同じ rule preview を確認したい

As a シナリオ作者
I want 編集中の state/action/result を実行前に確認したい
So that 分岐漏れと公開情報漏えいを防げる

期待される結果

- current Location、public Object state、enumerated actions を表示する。
- `from state -> action -> selected result -> effects -> post-state` を表示する。
- private state、hidden branches、module config が player/AI projection に出ないことを確認できる。
- preview は draft data を使い、本番 Session を変更しない。

## US-E06: nested validation error を修正したい

As a シナリオ作者
I want エラーが該当 row/field に表示されてほしい
So that 大きな Scenario でも原因を特定できる

期待される結果

- API error path を `objectTypes[0].actions[1].code` や `objects[2].actionResults[0].effects[1]` のように UI field へ割り当てる。
- draft-save error と publish-blocking readiness error を区別する。
- 重複 stable code、broken reference、schema mismatch、invalid effect target を具体的に表示する。

## US-E07: 新しい definition version を公開したい

As a シナリオ作者
I want readiness を満たした draft を publish したい
So that 新規プレイヤーに確定した rule set を提供できる

期待される結果

- 全 enabled Object/state/action に決定的な result があることを検証する。
- public projection、condition/effect AST、placement、extension identity/configuration を検証する。
- 成功時は immutable published version を作成する。
- 新規 Session は最新版を pin し、既存 Session は旧版を維持する。

## US-E08: version と baseline の違いを理解したい

As a 運用者
I want contract baseline と Scenario revision/dependency version を区別したい
So that 不適切な reset や暗黙 migration を避けられる

期待される結果

- 新 Object-rule contract/schema/artifact は `1` / `.v1` から開始する。
- 旧 wire/data shape、旧 package、旧 active execution の compatibility adapter は提供しない。
- revision、sequence、SHA-256、dependency/toolchain/application version は reset しない。
- rebuilt extension package は新しい `1.0.0` と新 digest を持つ。

## 総括

編集は `draft -> readiness preview -> publish` の cycle で行う。登録と編集は同じ stable ID、typed editor、validation、privacy boundary を共有し、published definition と既存 Session の再現性を守る。
