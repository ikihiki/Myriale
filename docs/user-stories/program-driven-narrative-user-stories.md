# プログラム主導ナラティブのユーザーストーリー

## 目的と責務境界

本ドキュメントは、バトル、判定、強制イベント、専用 UI など、事実を AI に決めさせない場面を定義する。通常の世界変化はシナリオに登録された Object action result をルールエンジンが適用する。複雑な計算や対話 UI が必要な場合だけ、その結果に固定された extension module を実行する。

共通の処理順序は次のとおりである。

```text
プレイヤー入力または manual-ui 操作
  -> pinned Scenario/Object state
  -> 公開 Object/action snapshot
  -> 列挙済み action の選択
  -> Object rule または bound extension
  -> committed post-state
  -> post-state を描写する narrative
```

AI は列挙済みの `{objectId, actionId, arguments}` を選ぶか、確定済み結果を語るだけである。状態、配置、成否、乱数、効果、extension identity は決定しない。

---

## US-PG01: 制約された Object action をボタンで選びたい

As a プレイヤー
I want バトルや判定では実行可能な操作だけを選びたい
So that ルールに反する入力をせずに進行できる

期待される結果

- UI は現在の action snapshot に `manual-ui` として公開された操作だけを表示する。
- 操作は Object ID、action ID、必要な arguments、expected revision として送信される。
- UI は module ID、結果、出目、状態差分を送信しない。
- snapshot にない操作、無効な引数、古い revision は mutation 前に拒否される。

## US-PG02: バトル結果を再現可能な extension で決めたい

As a システム
I want 複雑な戦闘を固定された extension で判定したい
So that 成否と状態変化が公平で監査可能になる

期待される結果

- 公開済み Object action result に固定された exact module ID/version/digest だけが起動する。
- extension は host が保存した乱数、入力 snapshot、private module state から結果を計算する。
- AI、プレイヤー、ブラウザは extension を選択・差し替えできない。
- 完了 outcome は host が検証し、Object/Session/module state と同じ commit boundary で一度だけ適用する。

## US-PG03: ダイスロールを視覚的に実行したい

As a プレイヤー
I want 「ダイスを振る」操作と結果を UI で確認したい
So that 判定に納得感を持てる

期待される結果

- ボタンは active extension が公開した action のときだけ有効になる。
- 出目は host が生成・receipt に固定し、再読み込みや worker retry でも変わらない。
- transient animation は状態権威ではなく、確定結果と revision はサーバー応答から表示する。
- 同じ request ID の再送は保存済み応答を返し、二度振りしない。

## US-PG04: 強制イベントを Object rule で進めたい

As a シナリオ作者
I want 回避不能なイベントを条件付き Object action result として定義したい
So that 必須の展開を決定論的に発生させられる

期待される結果

- system-only action の availability と result condition が成立した場合だけ実行される。
- 章やビートが必要な場合も progression 用 Object の state/action/effects として表現する。
- AI が未登録イベントを状態遷移として発生させることはない。
- イベントの facts/events/forbidden facts は state commit と同時に確定する。

## US-PG05: 状態を変えない質問にも応答してほしい

As a プレイヤー
I want 質問や確認に自然な返答がほしい
So that 不要な世界状態変更なしに会話を続けられる

期待される結果

- action snapshot に system-owned `clarify` または `no-op` が含まれる。
- 選択は監査されるが Object state、配置、Session state は変化しない。
- narrative は変更のない post-state と確定済み公開情報から生成される。

## US-PG06: 確定結果を AI に演出してほしい

As a プレイヤー
I want プログラムで確定した結果を自然な文章で読みたい
So that 再現性と没入感を両立できる

期待される結果

- narrative は state/effect/extension commit の後にのみ生成される。
- AI には public post-state、facts/events/hints、forbidden facts、safe extension outcome だけを渡す。
- AI は成否、状態、配置、発生済み事実を変更できない。
- narrative failure 後の retry は判定や効果を再実行しない。

## US-PG07: extension 終了後に通常入力へ戻りたい

As a プレイヤー
I want 専用 UI の処理が完了したら通常入力へ戻りたい
So that 続きの行動を自然言語で指定できる

期待される結果

- completed extension は active manual UI を閉じる。
- committed post-state から narrative が公開された後、次の input を受理できる。
- 次の入力では最新 Object revisions から新しい action snapshot を列挙する。

## US-PG08: program-driven action を単体テストしたい

As a シナリオ作者
I want Object rule と extension action を固定条件で試したい
So that 公開前に条件、結果、UI、文章化を確認できる

期待される結果

- preview は pinned draft snapshot と固定初期 state/placement/arguments/random values を使用できる。
- `from state -> action -> selected result -> effects -> post-state` を表示する。
- private state と module configuration はプレイヤー向け preview に露出しない。
- preview 実行は本番 Session を変更しない。

## 総括

- 通常の事実変更は declarative Object rule が担当する。
- extension module は bound action の複雑な mechanics/manual UI に限定する。
- AI は列挙済み action の選択と committed post-state の表現だけを担当する。
- durable receipts、revisions、checkpoint retry により公平性、再現性、復旧性を保証する。
