# シナリオ登録に関するユーザーストーリー

## この文書の扱い

本書は Scenario authoring UI の要求仕様であり、wireframe を埋め込まない。各 user story は frontend Storybook の独立した story として表現し、`@storybook/test` の `play` 関数で「操作」と「期待」を named `step` に分けて検証する。

登録 wizard は title-only draft から開始でき、すべての step で persistent draft save を行える。通常 UI は typed form から state schema、condition/effect AST、module binding を生成し、作者に raw script や任意 JSON Patch を入力させない。

## Authoring model

- **Scenario definition version**: draft/published/retired。published は immutable。
- **Location**: stable code、表示名、説明、authoring metadata。
- **Object Type**: stable code、strict state schema、default state、public projection、actions。
- **Object Type action**: stable action code、label、説明、argument schema、availability、visibility (`ai-choice` / `manual-ui` / `system-only`)。
- **Object**: stable code、type、初期 Location、initial state override、global visibility。
- **Object action result**: from-state/condition、priority、ordered effects、任意の exact extension binding。

Draft save は入力済み要素の構造と参照を検証する。Publish readiness は、すべての enabled `(Object, state, action)` に決定的な result があること、同 priority ambiguity がないこと、projection/effect/binding が有効であることまで検証する。

---

## US-SR01: タイトルだけで draft を作成したい

As a シナリオ作者
I want タイトルだけで Scenario draft を作りたい
So that 詳細が未完成でも authoring を開始できる

期待される結果

- title を必須、概要等を任意として draft version を保存する。
- Scenario ID と draft definition version ID を発行する。
- incomplete readiness warning は表示するが draft save を妨げない。
- 次回同じ draft を開いたとき入力内容を復元する。

Storybook `play` steps

1. `step('タイトルを入力する', ...)` で title field を入力する。
2. `step('下書きを保存する', ...)` で save を実行する。
3. `step('永続化された Draft を確認する', ...)` で saved status と ID-bearing mock response を確認する。
4. `step('未完成 warning を確認する', ...)` で publish 不可だが編集継続可能であることを確認する。

---

## US-SR02: Location を登録したい

As a シナリオ作者
I want Object を配置する Location を定義したい
So that Session の現在地と公開対象を構成できる

期待される結果

- stable code、表示名、説明を入力できる。
- 同一 definition version 内の code 重複を field error にする。
- 保存後の stable ID/code は表示名変更や並べ替えで変わらない。
- draft では Location が一件だけでも保存できる。

Storybook `play` steps

1. `step('Location を追加する', ...)` で add control を操作する。
2. `step('stable code と表示情報を入力する', ...)` で fields を入力する。
3. `step('Location を保存する', ...)` で row save を行う。
4. `step('stable ID と保存状態を確認する', ...)` で再描画後も identity が維持されることを確認する。

---

## US-SR03: Location code の重複を修正したい

As a シナリオ作者
I want 重複 code の場所を明確に知りたい
So that cross-reference を壊さず修正できる

期待される結果

- nested API error を該当 Location code field に表示する。
- 他の有効な draft data は失わない。
- code 修正後に保存できる。

Storybook `play` steps

1. `step('重複する code を入力する', ...)`。
2. `step('保存して field error を確認する', ...)`。
3. `step('code を修正する', ...)`。
4. `step('再保存の成功を確認する', ...)`。

---

## US-SR04: Object Type の state を定義したい

As a シナリオ作者
I want Object Type の状態 schema、default、public projection を定義したい
So that private state を保護しながら一貫した Object を作れる

期待される結果

- stable type code と typed state-property rows を編集できる。
- property ごとに type、required/default、public/private を指定できる。
- default state と Object override が生成 schema に適合するか検証する。
- public projection は whitelist とし、private property を AI/player preview に含めない。

Storybook `play` steps

1. `step('Object Type を追加する', ...)`。
2. `step('state property と default を設定する', ...)`。
3. `step('property を private にする', ...)`。
4. `step('public preview から private 値が除外されることを確認する', ...)`。
5. `step('draft を保存する', ...)`。

---

## US-SR05: Object Type action を定義したい

As a シナリオ作者
I want type が提供する action interface を定義したい
So that AI と manual UI に安全な操作契約を公開できる

期待される結果

- stable action code、label、説明、typed argument schema を編集できる。
- default availability condition を typed condition builder で設定できる。
- visibility を `ai-choice`、`manual-ui`、`system-only` から選べる。
- action は state/effect/module identity を返す契約を持たない。

Storybook `play` steps

1. `step('action を追加する', ...)`。
2. `step('label と argument fields を入力する', ...)`。
3. `step('availability と visibility を設定する', ...)`。
4. `step('公開 action descriptor preview を確認する', ...)`。
5. `step('action を保存する', ...)`。

---

## US-SR06: Object を Location に配置したい

As a シナリオ作者
I want Object Type から Object を作り初期 Location に配置したい
So that Session 開始時の世界を構成できる

期待される結果

- stable Object code、表示名、type、初期 Location を指定できる。
- Object は baseline では一つの初期 Location だけを持つ。
- schema-valid な initial state override と global visibility を設定できる。
- missing type/location reference は該当 selector に error を表示する。

Storybook `play` steps

1. `step('Object を追加する', ...)`。
2. `step('Object Type と Location を選択する', ...)`。
3. `step('initial state override を入力する', ...)`。
4. `step('配置 preview を確認する', ...)`。
5. `step('Object を保存する', ...)`。

---

## US-SR07: Object action result を設定したい

As a シナリオ作者
I want state/action ごとの条件と効果を設定したい
So that Scenario data が世界変化を決定できる

期待される結果

- Object、type action、from-state/condition、priority を選択できる。
- ordered effects を typed editor で追加できる。
- effect target/path/value を type schema と Location/Object references に対して検証する。
- readiness preview に `from state -> action -> selected result -> effects -> post-state` を表示する。

Storybook `play` steps

1. `step('Object action result を追加する', ...)`。
2. `step('from-state と action を選択する', ...)`。
3. `step('set-state effect を設定する', ...)`。
4. `step('result preview で post-state を確認する', ...)`。
5. `step('result を保存する', ...)`。

---

## US-SR08: action result に extension を bind したい

As a シナリオ作者
I want 複雑な action だけ exact extension package に bind したい
So that 通常 rule と専用 mechanics を安全に組み合わせられる

期待される結果

- enabled/installed package から exact module ID/version/digest を選択する。
- package contract/configuration schema baseline `1` に適合する typed config を入力する。
- binding は selected Object action result に属し、AI や player が変更できない。
- extension は別 module、任意 Object、進行先、narrative を選べない旨を UI に示す。

Storybook `play` steps

1. `step('extension result mode を選ぶ', ...)`。
2. `step('exact package を選択する', ...)`。
3. `step('typed configuration を入力する', ...)`。
4. `step('pinned ID/version/digest を確認する', ...)`。
5. `step('binding を保存する', ...)`。

---

## US-SR09: incomplete draft を保存したい

As a シナリオ作者
I want result が未完成でも作業途中を保存したい
So that 大きな Scenario を段階的に作成できる

期待される結果

- structural/schema-invalid data は保存 error にする。
- missing result 等の completeness issue は warning として保存を許可する。
- warning は Object/state/action の該当 row へ移動できる。
- publish button は readiness 未達として disabled または確認時に blocking errors を表示する。

Storybook `play` steps

1. `step('result 未設定の action を作る', ...)`。
2. `step('draft を保存する', ...)`。
3. `step('保存成功と incomplete warning を確認する', ...)`。
4. `step('publish readiness が失敗することを確認する', ...)`。

---

## US-SR10: ambiguous result を publish 前に修正したい

As a シナリオ作者
I want 同 priority で複数成立する result を発見したい
So that runtime が曖昧な分岐を選ばないようにできる

期待される結果

- publish readiness は ambiguity を blocking error にする。
- error は競合する result rows と condition/priority fields を示す。
- priority または condition 修正後、runtime と同じ evaluator で一件だけ選ばれることを preview する。

Storybook `play` steps

1. `step('競合する result を二件作る', ...)`。
2. `step('readiness check を実行する', ...)`。
3. `step('両方の row に ambiguity error が出ることを確認する', ...)`。
4. `step('priority を修正する', ...)`。
5. `step('一意な selected result を確認する', ...)`。

---

## US-SR11: 参照中 entity の削除を安全に扱いたい

As a シナリオ作者
I want 参照中の Location/Object Type/action を誤って削除しないようにしたい
So that Object placement と result の参照整合性を保てる

期待される結果

- 削除前に依存 Object/result を一覧表示する。
- remap または dependent delete を完了するまで削除を拒否する。
- cancellation では draft data を変更しない。

Storybook `play` steps

1. `step('参照中 Location の削除を試す', ...)`。
2. `step('dependency dialog を確認する', ...)`。
3. `step('Object を別 Location に remap する', ...)`。
4. `step('削除が成功することを確認する', ...)`。

---

## US-SR12: readiness preview で public runtime view を確認したい

As a シナリオ作者
I want runtime と同じ evaluator/projection で開始状態を確認したい
So that action 漏れと秘密情報漏えいを防げる

期待される結果

- current Location、現在 Location/global Objects、public state、enabled/disabled actions を表示する。
- 別 Location Object、private state、hidden conditions/outcomes、extension config、random values を表示しない。
- state/arguments を変えて result/effects/post-state を preview できる。
- preview は draft と本番 Session を変更しない。

Storybook `play` steps

1. `step('readiness preview を開く', ...)`。
2. `step('public Objects/actions を確認する', ...)`。
3. `step('private/remote data が存在しないことを確認する', ...)`。
4. `step('action preview を実行する', ...)`。
5. `step('post-state と facts/hints を確認する', ...)`。

---

## US-SR13: ready な draft を publish したい

As a シナリオ作者
I want validation 済み definition version を publish したい
So that 新規 Session が immutable な rule set を pin できる

期待される結果

- Location/type/action/Object/reference/schema/projection/result/effect/binding を完全検証する。
- 成功時に immutable published definition version を作る。
- published version の直接編集を禁止し、次回編集は新 draft を作る。
- Session 作成時に published version と merged Object initial state/placement を pin する。

Storybook `play` steps

1. `step('readiness check を通す', ...)`。
2. `step('publish confirmation を開く', ...)`。
3. `step('publish を確定する', ...)`。
4. `step('immutable published status を確認する', ...)`。
5. `step('新規 Session が version を pin する説明を確認する', ...)`。

---

## US-SR14: publish error を該当 field で修正したい

As a シナリオ作者
I want nested publish errors から該当 editor へ移動したい
So that 大規模 Scenario でも効率よく readiness を満たせる

期待される結果

- API path（例: `objects[2].actionResults[0].effects[1]`）を editor step/row/field に割り当てる。
- summary から field へ focus/scroll できる。
- 修正後に affected validation だけを再実行し、最終的に full readiness を確認する。

Storybook `play` steps

1. `step('nested error response を受け取る', ...)`。
2. `step('error summary を確認する', ...)`。
3. `step('該当 effect field へ移動する', ...)`。
4. `step('値を修正して再検証する', ...)`。
5. `step('publish 可能になることを確認する', ...)`。

## 共通 Storybook acceptance

- 各 user story は独立 story とし、fixture/mock は再利用可能にする。
- `play` は `step` を使い、user action と expectation の目的が Storybook UI で読める名称にする。
- 登録と編集の fixture は同じ stable ID/code を維持する。
- success だけでなく、duplicate code、incomplete readiness、dependency delete refusal、nested errors、concurrency conflict を含める。
- docs は requirements source として維持し、生成 UI や wireframe を本書へ追加しない。
