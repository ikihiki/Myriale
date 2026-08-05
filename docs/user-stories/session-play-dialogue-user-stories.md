# session-play-dialogue-user-stories.md
## セッション進行（AI対話モード）に関するユーザーストーリー

本ドキュメントは、Session（セッション）を進行する際に、
プレイヤーが AI と自然言語で対話しながら物語を進めるモード
（AI対話モード）についてのユーザーストーリーを定義する。

前提用語  
- Session: 現在進行中のプレイ単位  
- Narrative: AIが生成する物語の語り  
- Player Input: プレイヤーが入力する自然言語  
- Input: Serverが受け付けたプレイヤー入力の不変な事実
- Execution: Narrative生成のqueued/running/retry/failed/cancelled状態
- Artifact: 生成・検証された成果物
- Turn: 成功したNarrativeまたはModule結果だけを公開した正式な進行単位
- Entity: 人物、動物、物品、端末などを共通に表す世界内対象。NPC は人物 Entity の物語上の役割であり、専用 domain type ではない
- Structured Profile: Entity Type が宣言し Entity が値を供給する静的プロフィール
- ProfileMarkdown: Structured Profile を補足する Entity-local の自由記述
- AI-managed state transition: `ai` authority field だけを更新する検証可能な構造化結果
- AI: 語り手・世界・人物 Entity を含む登場対象を描写する存在

---

## US-P01: AIが現在の状況を語ってほしい

As a プレイヤー  
I want AIに現在の状況を語ってほしい  
So that 今何が起きているか理解できる  

背景・意図  
- セッション進行は常に状況提示から始まる  
- プレイヤーは世界の状態を把握したい  

前提条件  
- セッション状態が Active である  

ユーザー行動  
- 特になし（自動）  

期待される結果  
- 現在地、周囲の状況、直近の出来事が Narrative として表示される  
- 主人公視点で語られる  

補足  
- 文章量や詳細度は Session 設定（テンポ・詳細度）に従う  

---

## US-P02: 自然言語で行動を入力したい

As a プレイヤー  
I want 自然な文章で行動を入力したい  
So that RPGらしい没入感を得られる  

背景・意図  
- 定型コマンドではなく対話で進めたい  
- AIの解釈能力を活かしたい  

ユーザー行動  
- テキスト入力欄に自由に行動を入力する  

例  
- 「酒場の奥にいる人物に話しかける」  
- 「周囲を警戒しながら村を出る」  

期待される結果  
- 入力内容が行動として解釈される  
- Narrative 生成に使用される  

非機能・制約  
- 文法的に不完全でも受理される  
- 命令形・描写混在も許容する  

---

## US-P03: AIが行動の結果を物語として返してほしい

As a プレイヤー  
I want 自分の行動の結果を物語として知りたい  
So that 世界がどう反応したか分かる  

背景・意図  
- 行動 → 結果 → 次の判断、というループが基本  

ユーザー行動  
- 行動を入力する  

期待される結果  
- 行動結果が Narrative として生成される  
- 成功・失敗・想定外の展開が描写される  

補足  
- AIは常にプレイヤーの行動を肯定するとは限らない  
- 状態・確率・物語整合性を考慮する  

### 非同期生成と失敗時の期待

- Player Inputは送信受付直後に独立した履歴要素として表示・保存される。
- 直後のExecution slotがqueued、running、retry-wait、cancel-requested、failed、cancelled、succeeded、supersededを表す。
- 失敗してもInputは消えず、失敗をNarrative Turnとして描画しない。
- Retryは同じExecution slotを更新し、入力編集は新しいInput/Executionを作り旧処理をsupersededにする。
- ブラウザを閉じても処理は継続し、再訪時に全active/failed Executionを因果位置へ復元する。
- inline errorは保存済みであることと次の操作（Retry、Edit、Details、Dismiss）を示す。
- Narrative成功後の画像・ノート失敗はpartial successであり、Narrativeを取り消さない。

---

## US-P04: 人物として描写されるEntityと自然に会話したい

As a プレイヤー  
I want 人物として描写されるEntityと自然に会話したい
So that 物語世界に没入できる  

背景・意図  
- 会話は物語体験の中核  
- 選択肢ではなく対話したい  

ユーザー行動  
- 会話内容を自由入力する  

期待される結果  
- AIが Entity の resolved Structured Profile、補足 ProfileMarkdown、公開済み事実、保存済み runtime state に沿って返答する
- 構造化 profile と Markdown が矛盾する場合は構造化値を優先する
- profile に含まれる秘密を自動的に player-visible fact として扱わない
- 会話に伴う AI-managed state は検証・commit 後にセッション文脈へ記録される

補足
- 同一 Entity は保存済み profile/state に基づいて一貫した口調・態度を保つ
- 人物以外の Entity も同じ profile/state 機構を利用でき、NPC 専用 aggregate や conversation mode は前提にしない

---

## US-P05: AIに補足説明や再説明を求めたい

As a プレイヤー  
I want 分からない点をAIに聞き直したい  
So that 状況を正しく理解できる  

背景・意図  
- 展開が複雑で理解が追いつかないことがある  

ユーザー行動  
- 補足を求める文章を入力する  

例  
- 「今の状況を簡単にまとめて」  
- 「その人物は誰？」  

期待される結果  
- AIが要約・補足説明を返す  
- 物語進行自体は変化しない  

非機能・制約  
- 補足要求は行動として扱わない  

---

## US-P06: 自分の入力がどう解釈されたか知りたい

As a プレイヤー  
I want 自分の行動がどう解釈されたか知りたい  
So that 意図とズレていないか確認できる  

背景・意図  
- 自然言語入力は誤解釈が起きうる  

ユーザー行動  
- 解釈確認を求める  

例  
- 「今の行動はどう解釈された？」  

期待される結果  
- AIが内部解釈を簡潔に説明する  
- 必要に応じてやり直しを促す  

補足  
- 通常UIでは非表示でもよい  

---

## US-P07: ボタン操作で直前の行動を取り消してやり直したい

As a プレイヤー  
I want 削除ややり直しボタンで直前の行動を修正したい  
So that 入力ミスや誤解釈を簡単に修正できる  

背景・意図  
- 対話中の操作は即時性と確実性が重要  

前提条件  
- セッション状態が Active  
- 直前ターンが存在する  

UI要件  
- 入力欄付近に  
  - 「削除（入力取り消し）」  
  - 「やり直し（直前ターン巻き戻し）」  
  が表示される  

ユーザー行動  
- 対応するボタンを押す  

期待される結果  
- 削除: 入力が無効化され再入力できる  
- やり直し: 直前ターンが巻き戻される  

制約  
- 巻き戻し可能範囲は制限される  

---

## US-P08: 対話を続けるだけで自然に物語を進めたい

As a プレイヤー  
I want 対話を続けるだけで物語が進んでほしい  
So that 操作を意識せず没入できる  

背景・意図  
- UI操作より物語体験を優先したい  

期待される結果  
- Narrative → Input → Narrative のループが自然に継続する  
- 明示的な「次へ」操作が不要  

---

## US-P09: 見出しリンク（TOC）から対話ログを振り返りたい

As a プレイヤー  
I want 見出しリンク（TOC）を使って対話ログを振り返りたい  
So that 長いセッションでも必要な場面にすぐ戻れる  

背景・意図  
- 対話ログは長文化しやすい  
- スクロールだけでは重要場面を見失いやすい  

UI要件  
- ログ画面に TOC パネルを表示する  
- 各 Turn に対して  
  - ターン番号  
  - AI生成の短い見出し  
  を表示する  

ユーザー行動  
- TOCの見出しを選択する  

期待される結果  
- 該当ターンに即座にジャンプする  
- Narrative と Player Input が強調表示される  

制約  
- ReadOnly 表示  
- セッション状態は変化しない  

---

## US-P10: AIが主導しすぎず、必ず入力を待ってほしい

As a プレイヤー  
I want AIが勝手に物語を進めすぎないでほしい  
So that 自分の選択が物語を動かしていると感じられる  

背景・意図  
- AI主導が強すぎると「読まされている感」が出る  

期待される結果  
- 重要な進行は必ず Player Input を待つ  
- AIは状況提示と結果描写に専念する  

---

## US-P11: 「ここまで戻る」で任意の過去ターンまで巻き戻したい

As a プレイヤー  
I want 任意のターンまで巻き戻したい  
So that 分岐や選択をやり直せる  

背景・意図  
- 試行錯誤は対話型RPGの楽しさの一部  

前提条件  
- 対話ログが Turn 単位で管理されている  

UI要件  
- 各ターンに「ここまで戻る」操作を表示  
- 確認ダイアログを表示する  

ユーザー行動  
- 巻き戻したいターンで操作を実行する  

期待される結果  
- 指定ターン以降のログが無効化される  
- AIコンテキストが再構築される  
- 巻き戻し地点から再入力できる  

制約  
- 巻き戻し可能範囲は制限される  
- 非同期処理（挿絵生成など）は無効化またはキャンセルされる  


---

## US-P12: EntityのAI-managed stateを次の対話と再読み込み後も引き継ぎたい

As a プレイヤー
I want 対話によって変化したEntityの認識や態度が継続してほしい
So that 長いSessionや再訪でも関係性が一貫する

背景・意図
- `trust`、`mood`、`recognizedTopics` などは静的 profile ではなく Session ごとの runtime state である
- retry や worker 再実行で同じ変化が二重適用されてはならない

期待される結果
- 対象 Entity の `ai` authority fields について、現在の保存 state と expected object revision を入力に構造化 transition を生成する
- transition は schema、Entity identity、field authority、expected revision を検証し、commit 前に durable checkpoint として保存する
- authored effects と AI state replacement は一つの authority commit で適用し、成功時だけ `SessionObjectState.Revision` を進める
- 次ターンと Session 再読み込みは、prompt の再生成結果ではなく保存済み post-state を正本として利用する
- Narrative 生成に失敗しても committed state は取り消さない。Narrative retry、同一 request retry、lease loss 後の再開では checkpoint と committed post-state を再利用し、transition の生成・commit を重複させない
- stale revision、schema 違反、`rules` field・他 Entity・Location の変更要求は state を変更せず拒否し、必要なら最新 snapshot から処理をやり直す

---

## US-P13: Locationを移動した後は現在地に合うEntityだけを文脈に含めてほしい

As a プレイヤー
I want 複数のLocationを自由に移動し、現在地にいる対象と対話したい
So that 遠隔地の秘密を漏らさず自然な世界移動を体験できる

期待される結果
- Scenario の複数 Location と `move-session` / `move-object` による移動を維持する
- Entity の現在位置は初期 definition ではなく runtime の `SessionObjectState.LocationId` を正本とする
- action selection と AI state transition には Session location と対象 Entity location を別々に渡す
- Narrative prompt は post-effect の Session location にいる Entity、global Entity、移動直後の描写に必要な selected/affected Entity のみに profile context を限定する
- unrelated Location の Structured Profile、ProfileMarkdown、private state は prompt や player response に含めない
- 移動後の次ターンでは新しい Location の Entity が通常 context になり、以前の Location の Entity は remote data として除外される

---

## 総括

- AI対話モードは
  「状況提示 → 自然言語入力 → 結果描写」
  を基本ループとする
- UI操作による
  - 修正
  - 巻き戻し
  - ログ参照
  により、安全で長期プレイ可能な体験を実現する
- Entity の静的 profile と runtime state を分離し、field ごとの `rules` / `ai` authority、revision、checkpoint により再実行可能な状態継続を実現する
- runtime/post-effect Location に基づく安全な projection により、自由な移動と remote Entity 情報の非漏えいを両立する
- 本設計は将来の
  - 選択肢UI
  - 戦闘UI
  - 分岐管理
  の基盤となる
