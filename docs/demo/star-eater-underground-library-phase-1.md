# 『星喰いの地下図書館』Object-rule デモ Phase 1

## デモの目的

このデモは、通常の扉操作を declarative Object rule で処理し、複雑な守護者戦だけを extension module に委譲する。因果系列は常に次の順序である。

```text
Input -> pinned Scenario/Object state -> public Object/action snapshot
      -> {objectId, actionId, arguments} -> Object result / bound extension
      -> committed post-state -> narrative
```

## Scenario definition

- Location: 地下図書館の星図回廊、星座の扉の向こう側。
- Object Type `door`: strict state `{ status: "closed" | "open" }`、public `status`、action `open`。
- Object `constellation-door`: 初期状態 `closed`、星図回廊に配置。
- `closed + open` の通常成功 result: `status = open`、扉 Object を必要に応じて移動/公開、`constellation-door-opened` fact/event を emit。
- 条件不足 result: 扉 state は変更せず、必要な公開 hint を emit。
- guardian battle action: exact `GuardianBattleModule` package `1.0.0` と digest に bind。ブラウザや AI は package identity を指定しない。
- 旧 Constellation Door 判定 module と進行 transition は使用しない。

## 起動

```bash
./.mux/init
source /root/.config/myriale/dev-path.sh
./scripts/build-demo-modules.py
aspire run
```

Development seed は published Scenario definition version に Location/Object Type/Object/action results と retained extension の exact digest を保存する。Session 開始時にこの version、各 Object の初期 state/placement を pin する。

## 手動確認: declarative door action

1. 開発用アカウントで『星喰いの地下図書館』の新規 Session を開始する。
2. 星図回廊の public snapshot に `constellation-door` の `closed` state と `open` action があることを確認する。
3. 「銀の鍵を使って星座の扉を開ける」と入力する。
4. AI decision が snapshot 内の `{ objectId: "constellation-door", actionId: "open", arguments: ... }` だけを返すことを確認する。
5. rule engine が configured result を適用し、Object state revision と `status: open` を commit することを確認する。
6. narrative が開いた post-state と確定 fact に沿い、扉を閉じたまま描写しないことを確認する。
7. narrative generation を失敗させて retry し、door effect と AI action decision が再実行されないことを確認する。

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

Storybook では少なくとも次を表現する。

- closed door の public action snapshot と declarative apply 中 stage;
- committed open state / narrative pending;
- bound guardian extension の active manual UI;
- completed extension / post-state narrative;
- stale revision と safe retry の表示。
