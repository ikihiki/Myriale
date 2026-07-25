# 『星喰いの地下図書館』Object-rule デモ Phase 1

## デモの目的

このデモは、通常の扉操作を declarative Object rule で処理し、複雑な守護者戦だけを extension module に委譲する。因果系列は常に次の順序である。

```text
Input -> pinned Scenario/Object state -> public Object/action snapshot
      -> {objectId, actionId, arguments} -> Object result / bound extension
      -> committed post-state -> narrative
```

## Scenario definition

Development seed の統合デモ Scenario `SCN-AWAKENING-LAB`（「目覚めの研究室」）では、Object rule と Session 移動を一つの atomic action として確認する。星喰い Scenario の guardian extension contract と同じ runtime/pinning 基盤を使うが、西扉フローの開始対象はこの development seed とする。

- Location `inside`（地下研究室）: 西と東の扉がある開始地点。
- Location `outside`（研究施設の外）: 西扉 action の移動先。屋外専用 Object `outside-antenna` を持つ。
- Object Type `door`: strict state `{ open: boolean }`、public `open`、AI 選択可能 action を持つ。
- Object `west-door`: `inside` に配置、初期 state `{ open: false }`、action `open-and-exit`。
- Object `east-door`: `inside` に配置、初期 state `{ open: false }`。action 列挙順に依存せず西扉を選べることを確認する対照候補。
- `west-door/open-and-exit` の成功 rule は `open == false` のときだけ enabled で、開扉と `Session.CurrentLocationId` の `outside` への移動を同じ action-step で確定する。
- guardian battle action は exact `GuardianBattleModule` package `1.0.0` と digest に bind する。ブラウザや AI は package identity を指定しない。
- 旧 Constellation Door 判定 module と進行 transition は使用しない。

## 西扉デモの期待 contract

### Input

```text
西の扉を開けて外に出る
```

### AI decision

AI は公開済み action snapshot から、ID が実行時に割り当てられた次の一組だけを返す。東扉の action や module identity は返さない。

```json
{
  "objectId": "<west-door の pinned object ID>",
  "actionId": "<open-and-exit の pinned action ID>",
  "arguments": {}
}
```

選択結果の stable code は `west-door/open-and-exit`、表示名は `西の扉 / 扉を開けて外へ出る` となる。

### Applied effects

rule engine は次を順番に一度だけ適用し、全体を同じ checkpoint/transaction で確定する。

1. `set-state`: selected `west-door` の `state.open` を `true` にする。
2. `move-session`: `locationCode: "outside"` を pinned Location ID に解決し、Session の現在地を変更する。
3. facts: `西の扉が開いた。`、`プレイヤーは研究施設の外へ出た。` を emit する。
4. event: `{ "type": "session-moved", "locationCode": "outside" }` を emit する。
5. narrative hint: `冷たい夜風と星空を描写する。` を追加する。
6. forbidden facts: `まだ室内にいる`、`扉は閉じたまま` を追加する。

### Committed post-state

- Session revision が進み、`CurrentLocationId` は `outside` の pinned ID になる。
- `west-door.state.open == true` かつ Object revision は一度だけ増える。
- public post-state の現在地は `研究施設の外` となり、`outside-antenna` が見え、旧現在地限定の `west-door` / `east-door` は Object 一覧から外れる。
- selected action の表示情報と selected target state は action 前 snapshot/checkpoint から保持され、移動後 projection から扉が消えても失われない。

### Narrative

確定後状態と authoritative facts に沿い、少なくとも「西の扉が開いた」「研究施設の外へ出た」と分かる内容にする。例:

> 西の扉が開き、冷たい夜風が流れ込む。あなたは研究施設の外へ踏み出した。

Narrative は「まだ室内にいる」「扉は閉じたまま」と描写してはならない。Narrative generation の retry では checkpoint を再利用し、AI decision、開扉、Session 移動を再実行しない。

※ Storybook fixture と実 API の両方が、この decision/effects/post-state/narrative contract を同じ表示モデルで表現する。

## 起動

```bash
./.mux/init
source /root/.config/myriale/dev-path.sh
./scripts/build-demo-modules.py
aspire run
```

Development seed は published Scenario definition version に Location/Object Type/Object/action results と retained extension の exact digest を保存する。Session 開始時にこの version、各 Object の初期 state/placement を pin する。

## 手動確認: 西扉の declarative action

1. 開発用アカウントで development seed の新規 Session を開始する。
2. `inside` の public snapshot に `east-door` と `west-door` があり、西扉の `{ open: false }` と enabled な `open-and-exit` action が見えることを確認する。
3. 要求文 **「西の扉を開けて外に出る」** をそのまま入力する。
4. AI decision が列挙済み snapshot 内の西扉だけを `{ objectId, actionId, arguments: {} }` で選び、stable code が `west-door/open-and-exit` であることを確認する。
5. rule engine が `set-state(open=true)` と `move-session(outside)` を同じ action-step で適用し、facts/event/hint/forbidden facts を確定することを確認する。
6. Session の現在地が `地下研究室 → 研究施設の外` に変わり、屋外 Object が public post-state に現れ、西扉の selected target state が `open=true` として保持されることを確認する。
7. Narrative が「西の扉が開き、研究施設の外へ出た」という確定後状態に沿い、「まだ室内にいる」「扉は閉じたまま」と描写しないことを確認する。
8. Narrative generation を失敗させて retry し、AI decision、door effect、Session 移動が再実行されないことを確認する。

## 手動確認: bound guardian extension

1. guardian battle を公開する Object state/result へ到達する。
2. action snapshot に `manual-ui` battle action がある場合だけ専用 UI が表示されることを確認する。
3. UI が available action ID、arguments、expected revision だけを送信し、module ID/version/digest や出目を送らないことを確認する。
4. host-provided random values と private module state から battle outcome が決まり、再読み込み/同一 request retry で結果が変わらないことを確認する。
5. completed extension outcome、Object/Session/module state、facts/events/hints が一つの action-step commit で確定することを確認する。
6. narrative がその committed post-state から一件だけ生成されることを確認する。

## Privacy and pinning checks

- 別 Location の Object、private Object state、hidden result branches、effect AST、extension config/binding、random receipt が AI/player/browser payload に出ない。
- Scenario を編集して新 version を publish しても、既存 Session の door rules と extension digest は変わらない。
- 新規 Session は新 published version を pin する。
- stale Object revision の action は mutation 前に拒否され、fresh enumeration が必要になる。

## Storybook

`デモ/Session/西の扉を開けて外へ出る` の `自然言語 → 西扉選択 → open + outside → Narrative` story は、本番の `MyrialeApp` / Session presentation と Storybook 専用 Mock Container を使い、次を `@storybook/test` の `play` steps で操作・検証する。

1. 西と東の扉がある opening を確認し、`西の扉を開けて外に出る` を入力する。
2. 送信して `loading-world` → `enumerating-actions` → `selecting-action` を通り、`西の扉 / 扉を開けて外へ出る` が選ばれることを確認する。
3. `applying-rules` 後に selected target state が `open=true`、location transition が `地下研究室 → 研究施設の外`、fact が `プレイヤーは研究施設の外へ出た` になることを確認する。
4. `generating-narrative` 後に、確定後状態と一致する「あなたは研究施設の外へ踏み出した」という Narrative が表示され、composer が次入力可能になることを確認する。

同 story の `E2E: 手動操作用` は Playwright の `tests/e2e/session-west-door-traversal.spec.ts` から同じ要求文と期待 contract をブラウザ上で検証する。guardian extension、stale revision、safe retry の個別表示は既存の専用 story/test で扱い、西扉 story に別の正本を重複させない。
