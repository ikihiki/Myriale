# 高度なシナリオ実行のユーザーストーリー

## 前提

高度なシナリオ実行は、Location、Object Type、Object placement、Object action result によって世界を制御する。Session は開始時の published Scenario definition version を pin し、Object ごとの private state、現在配置、revision を保持する。

Object Type は state schema/default/public projection と action interface を定義する。Object は type と初期 Location を参照し、state/action ごとの条件付き result/effects/extension binding を定義する。ルールエンジンだけが result を選び、AI は公開された action 候補から `{objectId, actionId, arguments}` を選択する。

---

## US-AS01: 場所と Object の配置を定義したい

As a シナリオ作者
I want stable code を持つ Location を作り、Object を一つの初期 Location に配置したい
So that 世界の地理と操作対象を決定論的に構成できる

期待される結果

- Object は一つの初期 `LocationId` を持つ。
- 実行中の移動は検証済み `move-object` effect として現在配置を更新する。
- 現在 Location と global Object 以外は、明示的な遠隔公開ルールなしに action snapshot へ出ない。
- 参照中 Location の削除は Object の remap/delete が完了するまで拒否される。

## US-AS02: 再利用可能な Object Type を定義したい

As a シナリオ作者
I want Object Type に状態と action interface を定義したい
So that 同じ種類の扉、人物、装置を一貫した規則で作れる

期待される結果

- strict state schema、default state、public projection を定義できる。
- action ごとに stable code、label、説明、argument schema、availability、visibility を定義できる。
- private properties は AI、プレイヤー、通常 API payload に含まれない。
- Object は schema-valid な initial state override だけを持てる。

## US-AS03: 状態ごとの action result を設定したい

As a シナリオ作者
I want `(Object, from-state, action)` ごとに条件と結果を定義したい
So that AI の即興ではなく Scenario data が世界変化を決める

期待される結果

- condition/effect は許可された path/operator の versioned AST で保存される。
- result は priority 順に決定され、同 priority ambiguity は publish できない。
- enabled action に result がない状態も publish-blocking error になる。
- state 更新、数値増減、set 操作、配置移動、flags、facts/events/hints、completion を構成できる。

## US-AS04: 公開情報と秘密情報を分離したい

As a シナリオ作者
I want Object state の公開範囲を whitelist で指定したい
So that 謎の答えや hidden condition を漏らさずに AI と UI を動かせる

期待される結果

- AI action chooser には public projection、action descriptors、argument schemas だけを渡す。
- private state、hidden result branches、effect AST、extension binding/configuration、乱数は渡さない。
- narrative には commit 後の public state と明示的な facts/hints/forbidden facts だけを渡す。
- author/debug UI は権限付きで private definition を確認できるが、player projection と明確に分離する。

## US-AS05: 章・ビートや強制イベントをデータで表現したい

As a シナリオ作者
I want 長編進行を専用 Object の state/actions/results で表現したい
So that 進行条件も他の世界ルールと同じ方法で検証・監査できる

期待される結果

- chapter/beat/access/mandatory event は progression 用 Object Type/Object として定義できる。
- 条件成立時の system-only action と effects が進行 state を変更する。
- narrative 自体は進行を変更しない。
- 現在 state、未成立条件、適用 result を author-only preview で確認できる。

## US-AS06: 複雑な mechanics だけ extension に委譲したい

As a シナリオ作者
I want battle 等の action result に exact extension を bind したい
So that 汎用 rule を保ちながら専用ロジックを利用できる

期待される結果

- binding は exact ID/version/digest/configuration を published definition に保存する。
- ルールエンジンだけが binding を実行する。
- extension は別 module、進行先、任意 DB mutation、narrative を選べない。
- declarative action と extension action は同じ atomic post-state commit と narrative ordering を使う。

## US-AS07: Session ごとに Scenario version を固定したい

As a プレイヤー
I want プレイ中の世界ルールが編集で突然変わらないようにしたい
So that 長期 Session を同じ条件で続けられる

期待される結果

- Session 作成時に immutable published definition version を pin する。
- Object の merged initial state と placement を Session runtime state に初期化する。
- 新しい publish は新規 Session だけに使われる。
- 既存 Session は pinned Location/Object Type/Object/result/extension identity を使い続ける。

## US-AS08: stale な action を安全に拒否したい

As a プレイヤー
I want 別操作で状況が変わった場合に古い選択を適用しないでほしい
So that 二重実行や矛盾した状態を防げる

期待される結果

- snapshot は relevant Object/Session revisions を含む。
- 適用直前に revision、availability、condition を再検証する。
- stale selection は mutation 前に拒否し、最新 state から再列挙する。
- 古い snapshot に対する AI decision や manual-ui dispatch を再利用しない。

## US-AS09: action 適用後の narrative 障害から復旧したい

As a プレイヤー
I want 文章生成が失敗しても確定済み action を失わず再試行したい
So that 二重判定や二重効果なしに物語を続けられる

期待される結果

- UI は `state committed / narrative pending` を区別して表示する。
- retry は保存済み public post-state/facts だけを使う。
- enumeration、action decision、random、extension、effects は再実行しない。
- canonical narrative は action step ごとに一件だけ公開される。

## US-AS10: Scenario rule を途中状態からテストしたい

As a シナリオ作者
I want Location、Object state、flags を指定して rule を preview したい
So that 分岐漏れと private/public projection を公開前に確認できる

期待される結果

- runtime と同じ evaluator で action enumeration/result selection/effects を表示する。
- fixed random values により extension path も再現できる。
- missing result、ambiguous result、invalid path/target、hidden-data leakage を検出する。
- preview は本番 Session と published version を変更しない。

## 総括

高度な進行の権威は pinned Scenario definition、Session Object state、Object rules、必要時の bound extension にある。AI は候補選択と post-state narrative に限定され、秘密情報、状態差分、module identity を確定しない。
