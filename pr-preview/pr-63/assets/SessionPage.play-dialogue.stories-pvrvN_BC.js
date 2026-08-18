import{j as c}from"./jsx-runtime-BO8uF4Og.js";import{r as R}from"./index-D4H_InIO.js";import{w as s,e as t,u as o}from"./index-C4S39nCK.js";import{M as l}from"./MyrialeApp-CoNLSV9k.js";import{c as Ee}from"./SessionPresentation-DGHeCpe_.js";import{M as y,p as Re,c as ke}from"./MockSessionContainer-B6cnjGtU.js";/* empty css               */import"./AdminAiProvidersPage-DupJQjuy.js";import"./Surfaces-hfywbPiG.js";import"./AppChrome-CaJxHzCb.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-DBs-w9aD.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-d7jVExt_.js";import"./ConditionTablePresentation-JmdLPG0b.js";import"./EditPane-DyZaeiBP.js";import"./scenarioWizardStyles-CPcslTFI.js";import"./NarrativeBody-4Kg13oE8.js";import"./ModuleUiHost-CQPmid6l.js";import"./TurnInspectionPresentation-CerC6ryl.js";import"./account-Bdcpq1bL.js";import"./SessionListPresentation-CV3LYKA6.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-UcBTXClw.js";import"./SessionActivityFeed-B0l1fOng.js";const P=()=>{const n=Ee("activeSession");return{...n,playSessions:{...n.playSessions,"SES-PREP-1098":{...n.playSessions["SES-PREP-1098"],turn:12,summary:"複数ターン経過後のアプリ画面確認用ログ。"}}}};function he(){const[n]=R.useState(ke),[a,e]=R.useState(0);return c.jsxs("div",{children:[c.jsx("button",{type:"button",className:"m-3 rounded-myr-control border border-myr-border bg-myr-paper px-4 py-2 font-semibold text-myr-ink",onClick:()=>e(i=>i+1),children:"Storyを再マウント"}),c.jsx(l,{initialUrl:"/sessions/SES-PREP-1098",initialDb:Ee("activeSession"),sessionContainer:({sessionId:i})=>c.jsx(y,{sessionId:i,aiManagedEntityFixture:n})},a)]})}const nt={title:"ユーザーストーリー/Session play dialogue",component:l,render:()=>c.jsx(l,{initialUrl:"/sessions/SES-PREP-1098",initialDb:P(),sessionContainer:y}),parameters:{notes:"docs/user-stories/session-play-dialogue-user-stories.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},r=async(n,a)=>{const e=n.getByLabelText("自由に行動や会話を入力");await o.clear(e),await o.type(e,a),await o.click(n.getByRole("button",{name:"行動を送る"}))},v={name:"Generic Entity: AI管理状態・移動・retryをSession内で継続する",render:()=>c.jsx(he,{}),play:async({canvasElement:n,step:a})=>{const e=s(n);await a("初回interactionで未初期化のAI管理状態を生成し、構造化profileとMarkdownに沿って応答する",async()=>{await t(e.getByTestId("turn-1-narrative")).toHaveTextContent("AI管理状態はまだ生成されていません"),await r(e,"案内役に、あなたの役割と安全な進み方を尋ねる"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("構造化プロフィールの役割・価値観・話し方と補足Markdown"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("revision 1としてcommit")}),await a("2回目のinteractionは保存済み状態を入力に使い、次revisionをcommitする",async()=>{await r(e,"さきほどの説明を踏まえて、最も安全な順序を教えて"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("persisted revision 1を入力に使い、revision 2へ更新")}),await a("Session画面をremountしても確定済みturnとAI管理状態を復元する",async()=>{await o.click(e.getByRole("button",{name:"Storyを再マウント"})),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("committed revision=2"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("前の対話で築いた協力姿勢")}),await a("move-session後はruntime locationで見えるEntityを切り替え、remote Entityを通常contextへ漏らさない",async()=>{await r(e,"接続廊下へ移動する");const i=e.getByRole("article",{name:"Turn 04"});await t(i).toHaveTextContent("施設外への脱出扉と解析室への扉"),await t(i).toHaveTextContent("案内AI端末と、解析室内の光学装置は通常のNarrative contextから外れました"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("runtime location")}),await a("privateなAI状態や内部評価はplayer-visibleな画面へ表示しない",async()=>{await t(n).not.toHaveTextContent(Re),await t(n).not.toHaveTextContent("cooperative"),await t(n).not.toHaveTextContent("protective")}),await a("Narrative失敗後のretryは確定済みcheckpointを再利用し、stateを二重更新しない",async()=>{await r(e,"Narrative失敗を再現してから再試行する"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("revision 3で確定済み"),await o.click(e.getByRole("button",{name:"同じ入力を再試行"})),await t(e.getByTestId("dialogue-log")).toHaveTextContent("確定済みrevision 3を再利用"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("revision 3を再利用し、二重commitを防ぎました"),await t(e.getByTestId("dialogue-log")).not.toHaveTextContent("revision 4")})}},u={name:"US-P01: AIが現在の状況を語ってほしい",play:async({canvasElement:n,step:a})=>{const e=s(n);await a("ActiveなSessionの開始時に、現在地・周囲・直近の出来事をNarrativeとして表示する",async()=>{await t(e.getByTestId("session-state")).toHaveTextContent("Active"),await t(e.getByTestId("turn-1-narrative")).toHaveTextContent("水没した閲覧室"),await t(e.getByTestId("turn-1-narrative")).toHaveTextContent("銀の鍵"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("現在地、周囲、直近の出来事")})}},p={name:"完了済みSession: 読み取り専用で物語を開く",render:()=>{const n=P();return c.jsx(l,{initialUrl:"/sessions/SES-PREP-1098",initialDb:{...n,playSessions:{...n.playSessions,"SES-PREP-1098":{...n.playSessions["SES-PREP-1098"],state:"Completed"}}},sessionContainer:y})},play:async({canvasElement:n,step:a})=>{const e=s(n);await a("完了済みの物語はログを表示したまま進行操作を隠す",async()=>{await t(e.getByTestId("session-state")).toHaveTextContent("Completed"),await t(e.getByTestId("completed-session-read-only")).toBeVisible(),await t(e.queryByLabelText("自由に行動や会話を入力")).not.toBeInTheDocument(),await t(e.getByTestId("dialogue-log")).toHaveTextContent("水没した閲覧室")})}},d={name:"Composer: 行動判定AIとナラティブ生成AIを個別に選ぶ",play:async({canvasElement:n,step:a})=>{const e=s(n);await a("2つのAI selectorを推奨profileで初期表示する",async()=>{await t(e.getByLabelText("行動判定AI")).toHaveTextContent("推奨（Deckard 40B AWQ）"),await t(e.getByLabelText("ナラティブ生成AI")).toHaveTextContent("推奨（Deckard 40B AWQ）")}),await a("行動判定だけ最安profileへ変更し、ナラティブ生成の選択は独立して保持する",async()=>{await o.click(e.getByLabelText("行動判定AI")),await o.click(s(document.body).getByRole("option",{name:"最安（Qwen2.5 14B Abliterated AWQ）"})),await t(e.getByLabelText("行動判定AI")).toHaveTextContent("最安（Qwen2.5 14B Abliterated AWQ）"),await t(e.getByLabelText("ナラティブ生成AI")).toHaveTextContent("推奨（Deckard 40B AWQ）")})}},w={name:"US-P02/P03: 自然言語で行動を入力し、結果を物語として受け取る",play:async({canvasElement:n,step:a})=>{const e=s(n);await a("自由入力欄に自然な文章で行動を書く",async()=>{await o.type(e.getByLabelText("自由に行動や会話を入力"),"周囲を警戒しながら閲覧室を出る"),await t(e.getByLabelText("自由に行動や会話を入力")).toHaveValue("周囲を警戒しながら閲覧室を出る")}),await a("送信すると行動として解釈され、成功・想定外の展開を含むNarrativeが生成される",async()=>{await o.click(e.getByRole("button",{name:"行動を送る"})),await t(e.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 周囲を警戒しながら閲覧室を出る"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("想定外の痕跡"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("結果をNarrativeとして生成")})}},m={name:"Composer: Shift+Enterで改行し、Enterで送信する",play:async({canvasElement:n,step:a})=>{const e=s(n),i=e.getByLabelText("自由に行動や会話を入力");await a("Shift+Enterは送信せず改行する",async()=>{await o.type(i,"一行目"),await o.keyboard("{Shift>}{Enter}{/Shift}二行目"),await t(i).toHaveValue(`一行目
二行目`),await t(e.getByTestId("dialogue-log")).not.toHaveTextContent("プレイヤーの入力: 一行目")}),await a("Enterは入力を送信し、composerを空に戻す",async()=>{await o.keyboard("{Enter}"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 一行目 二行目"),await t(i).toHaveValue("")})}},g={name:"Narrative generation: loading中は入力操作を無効化する",render:()=>c.jsx(l,{initialUrl:"/sessions/SES-PREP-1098",initialDb:P(),sessionContainer:({sessionId:n})=>c.jsx(y,{sessionId:n,initiallySubmitting:!0})}),play:async({canvasElement:n,step:a})=>{const e=s(n);await a("Narrative生成中の進行表示を示し、重複操作につながる入力Controlsを無効化する",async()=>{await t(e.getByRole("button",{name:"Narrativeを生成中"})).toBeDisabled(),await t(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled(),await t(e.getByRole("button",{name:"AIに次の行動を提案してもらう"})).toBeDisabled()})}},T={name:"Composer: 送信ボタンの二重clickでTurnを重複作成しない",render:()=>c.jsx(l,{initialUrl:"/sessions/SES-PREP-1098",initialDb:P(),sessionContainer:({sessionId:n})=>c.jsx(y,{sessionId:n,submissionDelayMs:25})}),play:async({canvasElement:n,step:a})=>{const e=s(n),i=e.getByLabelText("自由に行動や会話を入力");await o.type(i,"二重送信されないことを確認する"),await a("送信ボタンを素早く二重clickしても、最初の送信中に再送しない",async()=>{await o.dblClick(e.getByRole("button",{name:"行動を送る"}));const Pe=await e.findByRole("article",{name:"Turn 13"});await t(Pe).toHaveTextContent("プレイヤーの入力: 二重送信されないことを確認する"),await t(e.queryByRole("article",{name:"Turn 14"})).not.toBeInTheDocument()})}},x={name:"US-P04: NPCと自然に会話したい",play:async({canvasElement:n,step:a})=>{const e=s(n);await a("NPCへの発話を自由入力で送る",async()=>{await r(e,"書架の奥にいる人物に「あなたは誰？」と尋ねる")}),await a("NPCの立場・関係性に沿った返答がNarrativeに入り、会話内容が文脈に残る",async()=>{await t(e.getByTestId("dialogue-log")).toHaveTextContent("書架の奥の人物"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("会話内容はセッション文脈に記録");const i=e.getAllByLabelText("登場人物の発言").at(-1);await t(i).toBeVisible(),await t(i).toHaveTextContent("それは閉じた星座を開くものだ")})}},B={name:"US-P05: AIに補足説明や再説明を求めたい",play:async({canvasElement:n,step:a})=>{const e=s(n);await a("補足説明ボタンから「今の状況を簡単にまとめて」を送る",async()=>{await o.click(e.getByRole("button",{name:"状況を簡単にまとめて聞く"})),await t(e.getByTestId("dialogue-log")).toHaveTextContent("補足説明")}),await a("補足要求は行動扱いにせず、物語進行やSession状態を変化させない",async()=>{await t(e.getByTestId("dialogue-notice")).toHaveTextContent("行動ではない"),await t(e.getByTestId("session-state")).toHaveTextContent("Active"),await t(e.getByTestId("active-turn-summary")).toHaveTextContent("物語状態は変化しない")})}},I={name:"US-P05B: AIに次の行動案を推薦してほしい",play:async({canvasElement:n,step:a})=>{const e=s(n);await a("AI推薦ボタンを押すと、現在の状況に沿った行動案が入力欄へ入る",async()=>{await o.click(e.getByRole("button",{name:"AIに次の行動を提案してもらう"})),await t(e.getByLabelText("自由に行動や会話を入力")).toHaveValue("銀の鍵を扉にかざし、刻まれた星座との対応を確かめる"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("内容を編集してから送信できます")})}},C={name:"US-P06: 自分の入力がどう解釈されたか知りたい",play:async({canvasElement:n,step:a})=>{const e=s(n);await r(e,"酒場の奥にいる人物に話しかける"),await a("解釈トグルはPlayer Inputの直下にあり、押すと内部解釈を表示する",async()=>{await o.click(e.getByRole("button",{name:"Turn 13の入力解釈を見る"})),await t(e.getByTestId("turn-13-interpretation")).toHaveTextContent("NPCへの会話として解釈"),await t(e.queryByText("入力直下に内部解釈を表示しました。意図とのズレがあれば、削除・やり直しできます。")).not.toBeInTheDocument()}),await a("もう一度押すと解釈を隠せる",async()=>{await o.click(e.getByRole("button",{name:"Turn 13の入力解釈を隠す"})),await t(e.queryByTestId("turn-13-interpretation")).not.toBeInTheDocument()})}},b={name:"US-P07: 未送信の入力を取り消したい",play:async({canvasElement:n,step:a})=>{const e=s(n);await a("未送信の入力は削除ボタンで取り消せる",async()=>{await o.type(e.getByLabelText("自由に行動や会話を入力"),"入力ミス"),await o.click(e.getByRole("button",{name:"入力を消去"})),await t(e.getByLabelText("自由に行動や会話を入力")).toHaveValue(""),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("入力欄の未送信テキストを無効化"),await t(e.queryByRole("button",{name:"直前のターンに戻る"})).not.toBeInTheDocument()})}},S={name:"US-P08/P10: 対話だけで進み、AIは入力を待つ",play:async({canvasElement:n,step:a})=>{const e=s(n);await a("Narrative → Input → Narrativeのループが、明示的な「次へ」なしで続く",async()=>{await r(e,"銀の鍵を掲げて反応を見る"),await r(e,"反応した書架へ近づく"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 反応した書架へ近づく")}),await a("AIは重要な進行を勝手に進めず、次のPlayer Inputを待つ",async()=>{await t(e.getByTestId("dialogue-notice")).toHaveTextContent("次の重要な進行は入力待ち")})}},H={name:"US-P09: 見出しリンク（TOC）から対話ログを振り返りたい",play:async({canvasElement:n,step:a})=>{const e=s(n);await a("多数のTurnに対して、TOCはTurn一覧ではなくAIが考えた場面見出しを表示する",async()=>{await t(e.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("目覚めと銀の鍵"),await t(e.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("濡れた書架の声"),await t(e.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("螺旋階段と星図灯"),await t(e.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("閉じた星座の扉"),await t(e.getByRole("article",{name:"Turn 12"})).toBeVisible()}),await a("TOCの末尾は常に最後のTurn（Turn 12）を指す見出しになっている",async()=>{await t(e.getByTestId("heading-link-12")).toHaveTextContent("Turn 12から")}),await a("AI見出しを選ぶと、その見出しが始まる切り替わりTurnへジャンプする",async()=>{await o.click(e.getByRole("button",{name:"見出し「螺旋階段と星図灯」へ（Turn 08から）"})),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("場面の切り替わりTurn 08へジャンプ"),await t(e.getByTestId("active-turn-summary")).toHaveTextContent("08 / 螺旋階段へ向かう"),await t(e.getByTestId("active-heading-summary")).toHaveTextContent("螺旋階段と星図灯（Turn 08から）"),await t(e.getByTestId("session-state")).toHaveTextContent("Active")}),await a("末尾の見出しを選ぶと、最後のTurnへジャンプして選択表示される",async()=>{await o.click(e.getByTestId("heading-link-12")),await t(e.getByTestId("active-turn-summary")).toHaveTextContent("12 / 入力待ちの静止点"),await t(e.getByRole("article",{name:"Turn 12"})).toHaveClass("session-turn selected")})}},A={name:"US-P10/Notes: セッション中いつでもノートを参照・編集したい",play:async({canvasElement:n,step:a})=>{const e=s(n);await a("プレイ画面のサイドでノートを素早く確認・編集できる",async()=>{await t(e.getByRole("button",{name:/^全画面表示$/})).toBeVisible(),await t(e.getByRole("slider",{name:"ノート表示比率"})).toBeVisible(),await t(e.getByTestId("session-notes-side")).toHaveTextContent("月読ミナト"),await o.click(s(e.getByTestId("session-notes-side")).getByRole("button",{name:"月読ミナトを編集"})),await t(e.getByRole("dialog",{name:"ノート編集"})).toBeVisible(),await t(e.getByTestId("note-edit-dialog")).toHaveAttribute("data-size","editor"),await t(e.getByTestId("app-db-summary")).toHaveTextContent("open person-minato"),await o.clear(e.getByLabelText("別名")),await o.type(e.getByLabelText("別名"),"水際の案内人"),await o.click(e.getAllByRole("button",{name:"閉じる"})[0]),await t(e.queryByRole("dialog",{name:"ノート編集"})).not.toBeInTheDocument()}),await a("全画面で集中編集に切り替えても、一覧・編集・Context・整合性を1画面で操作できる",async()=>{await o.click(e.getByRole("button",{name:/^全画面表示$/})),await t(e.getByTestId("session-notes-focus")).toBeVisible(),await t(e.getByTestId("session-notes-full")).toHaveTextContent("月読ミナト"),await t(e.getByTestId("app-db-summary")).toHaveTextContent("notes full"),await o.click(s(e.getByTestId("session-notes-full")).getByRole("button",{name:"場所追加"})),await t(e.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("地下天文台"),await o.click(e.getByRole("button",{name:"閉じる"})),await o.click(s(e.getByTestId("session-notes-full")).getByRole("button",{name:"Context再構築"})),await t(s(e.getByTestId("session-notes-full")).getByTestId("context-stack")).toHaveTextContent("次ターンContext")})}},E={name:"US-P11: 「ここまで戻る」で任意の過去ターンまで巻き戻したい",play:async({canvasElement:n,step:a})=>{const e=s(n);await r(e,"書架の奥にいる人物に話しかける"),await r(e,"銀の鍵を水面に沈めてみる"),await a("過去Turnの「ここまで戻る」を押すと確認ダイアログを表示する",async()=>{const i=s(e.getByRole("article",{name:"Turn 01"}));await o.click(i.getByRole("button",{name:"ここまで戻る"})),await t(e.getByRole("dialog",{name:"巻き戻し確認"})).toBeVisible(),await t(e.getByTestId("rewind-dialog")).toHaveTextContent("非同期処理を無効化"),await t(e.getByTestId("rewind-dialog")).toHaveAttribute("data-tone","warning")}),await a("確定すると指定ターン以降を無効化し、巻き戻し地点から再入力できる",async()=>{await o.click(e.getByRole("button",{name:"巻き戻しを確定"})),await t(e.getByTestId("dialogue-log")).not.toHaveTextContent("銀の鍵を水面に沈めてみる"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("AIコンテキストを再構築"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeVisible()})}};var k,h,U;v.parameters={...v.parameters,docs:{...(k=v.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: 'Generic Entity: AI管理状態・移動・retryをSession内で継続する',
  render: () => <AiManagedEntityContinuityStory />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('初回interactionで未初期化のAI管理状態を生成し、構造化profileとMarkdownに沿って応答する', async () => {
      await expect(canvas.getByTestId('turn-1-narrative')).toHaveTextContent('AI管理状態はまだ生成されていません');
      await sendAction(canvas, '案内役に、あなたの役割と安全な進み方を尋ねる');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('構造化プロフィールの役割・価値観・話し方と補足Markdown');
      await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('revision 1としてcommit');
    });
    await step('2回目のinteractionは保存済み状態を入力に使い、次revisionをcommitする', async () => {
      await sendAction(canvas, 'さきほどの説明を踏まえて、最も安全な順序を教えて');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('persisted revision 1を入力に使い、revision 2へ更新');
    });
    await step('Session画面をremountしても確定済みturnとAI管理状態を復元する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'Storyを再マウント'
      }));
      await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('committed revision=2');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('前の対話で築いた協力姿勢');
    });
    await step('move-session後はruntime locationで見えるEntityを切り替え、remote Entityを通常contextへ漏らさない', async () => {
      await sendAction(canvas, '接続廊下へ移動する');
      const latestTurn = canvas.getByRole('article', {
        name: 'Turn 04'
      });
      await expect(latestTurn).toHaveTextContent('施設外への脱出扉と解析室への扉');
      await expect(latestTurn).toHaveTextContent('案内AI端末と、解析室内の光学装置は通常のNarrative contextから外れました');
      await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('runtime location');
    });
    await step('privateなAI状態や内部評価はplayer-visibleな画面へ表示しない', async () => {
      await expect(canvasElement).not.toHaveTextContent(privateStateSentinelForTest);
      await expect(canvasElement).not.toHaveTextContent('cooperative');
      await expect(canvasElement).not.toHaveTextContent('protective');
    });
    await step('Narrative失敗後のretryは確定済みcheckpointを再利用し、stateを二重更新しない', async () => {
      await sendAction(canvas, 'Narrative失敗を再現してから再試行する');
      await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('revision 3で確定済み');
      await userEvent.click(canvas.getByRole('button', {
        name: '同じ入力を再試行'
      }));
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('確定済みrevision 3を再利用');
      await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('revision 3を再利用し、二重commitを防ぎました');
      await expect(canvas.getByTestId('dialogue-log')).not.toHaveTextContent('revision 4');
    });
  }
}`,...(U=(h=v.parameters)==null?void 0:h.docs)==null?void 0:U.source}}};var N,D,f;u.parameters={...u.parameters,docs:{...(N=u.parameters)==null?void 0:N.docs,source:{originalSource:`{
  name: 'US-P01: AIが現在の状況を語ってほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ActiveなSessionの開始時に、現在地・周囲・直近の出来事をNarrativeとして表示する', async () => {
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
      await expect(canvas.getByTestId('turn-1-narrative')).toHaveTextContent('水没した閲覧室');
      await expect(canvas.getByTestId('turn-1-narrative')).toHaveTextContent('銀の鍵');
      await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('現在地、周囲、直近の出来事');
    });
  }
}`,...(f=(D=u.parameters)==null?void 0:D.docs)==null?void 0:f.source}}};var L,V,M;p.parameters={...p.parameters,docs:{...(L=p.parameters)==null?void 0:L.docs,source:{originalSource:`{
  name: '完了済みSession: 読み取り専用で物語を開く',
  render: () => {
    const db = createProgressedPlayDb();
    return <MyrialeApp initialUrl="/sessions/SES-PREP-1098" initialDb={{
      ...db,
      playSessions: {
        ...db.playSessions,
        'SES-PREP-1098': {
          ...db.playSessions['SES-PREP-1098'],
          state: 'Completed'
        }
      }
    }} sessionContainer={MockSessionContainer} />;
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('完了済みの物語はログを表示したまま進行操作を隠す', async () => {
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Completed');
      await expect(canvas.getByTestId('completed-session-read-only')).toBeVisible();
      await expect(canvas.queryByLabelText('自由に行動や会話を入力')).not.toBeInTheDocument();
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('水没した閲覧室');
    });
  }
}`,...(M=(V=p.parameters)==null?void 0:V.docs)==null?void 0:M.source}}};var O,W,Q;d.parameters={...d.parameters,docs:{...(O=d.parameters)==null?void 0:O.docs,source:{originalSource:`{
  name: 'Composer: 行動判定AIとナラティブ生成AIを個別に選ぶ',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('2つのAI selectorを推奨profileで初期表示する', async () => {
      await expect(canvas.getByLabelText('行動判定AI')).toHaveTextContent('推奨（Deckard 40B AWQ）');
      await expect(canvas.getByLabelText('ナラティブ生成AI')).toHaveTextContent('推奨（Deckard 40B AWQ）');
    });
    await step('行動判定だけ最安profileへ変更し、ナラティブ生成の選択は独立して保持する', async () => {
      await userEvent.click(canvas.getByLabelText('行動判定AI'));
      await userEvent.click(within(document.body).getByRole('option', {
        name: '最安（Qwen2.5 14B Abliterated AWQ）'
      }));
      await expect(canvas.getByLabelText('行動判定AI')).toHaveTextContent('最安（Qwen2.5 14B Abliterated AWQ）');
      await expect(canvas.getByLabelText('ナラティブ生成AI')).toHaveTextContent('推奨（Deckard 40B AWQ）');
    });
  }
}`,...(Q=(W=d.parameters)==null?void 0:W.docs)==null?void 0:Q.source}}};var j,q,F;w.parameters={...w.parameters,docs:{...(j=w.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'US-P02/P03: 自然言語で行動を入力し、結果を物語として受け取る',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('自由入力欄に自然な文章で行動を書く', async () => {
      await userEvent.type(canvas.getByLabelText('自由に行動や会話を入力'), '周囲を警戒しながら閲覧室を出る');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toHaveValue('周囲を警戒しながら閲覧室を出る');
    });
    await step('送信すると行動として解釈され、成功・想定外の展開を含むNarrativeが生成される', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '行動を送る'
      }));
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('プレイヤーの入力: 周囲を警戒しながら閲覧室を出る');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('想定外の痕跡');
      await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('結果をNarrativeとして生成');
    });
  }
}`,...(F=(q=w.parameters)==null?void 0:q.docs)==null?void 0:F.source}}};var G,K,$;m.parameters={...m.parameters,docs:{...(G=m.parameters)==null?void 0:G.docs,source:{originalSource:`{
  name: 'Composer: Shift+Enterで改行し、Enterで送信する',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('自由に行動や会話を入力');
    await step('Shift+Enterは送信せず改行する', async () => {
      await userEvent.type(input, '一行目');
      await userEvent.keyboard('{Shift>}{Enter}{/Shift}二行目');
      await expect(input).toHaveValue('一行目\\n二行目');
      await expect(canvas.getByTestId('dialogue-log')).not.toHaveTextContent('プレイヤーの入力: 一行目');
    });
    await step('Enterは入力を送信し、composerを空に戻す', async () => {
      await userEvent.keyboard('{Enter}');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('プレイヤーの入力: 一行目 二行目');
      await expect(input).toHaveValue('');
    });
  }
}`,...($=(K=m.parameters)==null?void 0:K.docs)==null?void 0:$.source}}};var z,_,J;g.parameters={...g.parameters,docs:{...(z=g.parameters)==null?void 0:z.docs,source:{originalSource:`{
  name: 'Narrative generation: loading中は入力操作を無効化する',
  render: () => <MyrialeApp initialUrl="/sessions/SES-PREP-1098" initialDb={createProgressedPlayDb()} sessionContainer={({
    sessionId
  }) => <MockSessionContainer sessionId={sessionId} initiallySubmitting />} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Narrative生成中の進行表示を示し、重複操作につながる入力Controlsを無効化する', async () => {
      await expect(canvas.getByRole('button', {
        name: 'Narrativeを生成中'
      })).toBeDisabled();
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
      await expect(canvas.getByRole('button', {
        name: 'AIに次の行動を提案してもらう'
      })).toBeDisabled();
    });
  }
}`,...(J=(_=g.parameters)==null?void 0:_.docs)==null?void 0:J.source}}};var X,Y,Z;T.parameters={...T.parameters,docs:{...(X=T.parameters)==null?void 0:X.docs,source:{originalSource:`{
  name: 'Composer: 送信ボタンの二重clickでTurnを重複作成しない',
  render: () => <MyrialeApp initialUrl="/sessions/SES-PREP-1098" initialDb={createProgressedPlayDb()} sessionContainer={({
    sessionId
  }) => <MockSessionContainer sessionId={sessionId} submissionDelayMs={25} />} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('自由に行動や会話を入力');
    await userEvent.type(input, '二重送信されないことを確認する');
    await step('送信ボタンを素早く二重clickしても、最初の送信中に再送しない', async () => {
      await userEvent.dblClick(canvas.getByRole('button', {
        name: '行動を送る'
      }));
      const createdTurn = await canvas.findByRole('article', {
        name: 'Turn 13'
      });
      await expect(createdTurn).toHaveTextContent('プレイヤーの入力: 二重送信されないことを確認する');
      await expect(canvas.queryByRole('article', {
        name: 'Turn 14'
      })).not.toBeInTheDocument();
    });
  }
}`,...(Z=(Y=T.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var ee,te,ae;x.parameters={...x.parameters,docs:{...(ee=x.parameters)==null?void 0:ee.docs,source:{originalSource:`{
  name: 'US-P04: NPCと自然に会話したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('NPCへの発話を自由入力で送る', async () => {
      await sendAction(canvas, '書架の奥にいる人物に「あなたは誰？」と尋ねる');
    });
    await step('NPCの立場・関係性に沿った返答がNarrativeに入り、会話内容が文脈に残る', async () => {
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('書架の奥の人物');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('会話内容はセッション文脈に記録');
      const npcSpeech = canvas.getAllByLabelText('登場人物の発言').at(-1);
      await expect(npcSpeech).toBeVisible();
      await expect(npcSpeech).toHaveTextContent('それは閉じた星座を開くものだ');
    });
  }
}`,...(ae=(te=x.parameters)==null?void 0:te.docs)==null?void 0:ae.source}}};var ne,oe,se;B.parameters={...B.parameters,docs:{...(ne=B.parameters)==null?void 0:ne.docs,source:{originalSource:`{
  name: 'US-P05: AIに補足説明や再説明を求めたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('補足説明ボタンから「今の状況を簡単にまとめて」を送る', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '状況を簡単にまとめて聞く'
      }));
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('補足説明');
    });
    await step('補足要求は行動扱いにせず、物語進行やSession状態を変化させない', async () => {
      await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('行動ではない');
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
      await expect(canvas.getByTestId('active-turn-summary')).toHaveTextContent('物語状態は変化しない');
    });
  }
}`,...(se=(oe=B.parameters)==null?void 0:oe.docs)==null?void 0:se.source}}};var ie,ce,re;I.parameters={...I.parameters,docs:{...(ie=I.parameters)==null?void 0:ie.docs,source:{originalSource:`{
  name: 'US-P05B: AIに次の行動案を推薦してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('AI推薦ボタンを押すと、現在の状況に沿った行動案が入力欄へ入る', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに次の行動を提案してもらう'
      }));
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toHaveValue('銀の鍵を扉にかざし、刻まれた星座との対応を確かめる');
      await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('内容を編集してから送信できます');
    });
  }
}`,...(re=(ce=I.parameters)==null?void 0:ce.docs)==null?void 0:re.source}}};var le,ye,ve;C.parameters={...C.parameters,docs:{...(le=C.parameters)==null?void 0:le.docs,source:{originalSource:`{
  name: 'US-P06: 自分の入力がどう解釈されたか知りたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await sendAction(canvas, '酒場の奥にいる人物に話しかける');
    await step('解釈トグルはPlayer Inputの直下にあり、押すと内部解釈を表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'Turn 13の入力解釈を見る'
      }));
      await expect(canvas.getByTestId('turn-13-interpretation')).toHaveTextContent('NPCへの会話として解釈');
      await expect(canvas.queryByText('入力直下に内部解釈を表示しました。意図とのズレがあれば、削除・やり直しできます。')).not.toBeInTheDocument();
    });
    await step('もう一度押すと解釈を隠せる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'Turn 13の入力解釈を隠す'
      }));
      await expect(canvas.queryByTestId('turn-13-interpretation')).not.toBeInTheDocument();
    });
  }
}`,...(ve=(ye=C.parameters)==null?void 0:ye.docs)==null?void 0:ve.source}}};var ue,pe,de;b.parameters={...b.parameters,docs:{...(ue=b.parameters)==null?void 0:ue.docs,source:{originalSource:`{
  name: 'US-P07: 未送信の入力を取り消したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('未送信の入力は削除ボタンで取り消せる', async () => {
      await userEvent.type(canvas.getByLabelText('自由に行動や会話を入力'), '入力ミス');
      await userEvent.click(canvas.getByRole('button', {
        name: '入力を消去'
      }));
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toHaveValue('');
      await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('入力欄の未送信テキストを無効化');
      await expect(canvas.queryByRole('button', {
        name: '直前のターンに戻る'
      })).not.toBeInTheDocument();
    });
  }
}`,...(de=(pe=b.parameters)==null?void 0:pe.docs)==null?void 0:de.source}}};var we,me,ge;S.parameters={...S.parameters,docs:{...(we=S.parameters)==null?void 0:we.docs,source:{originalSource:`{
  name: 'US-P08/P10: 対話だけで進み、AIは入力を待つ',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Narrative → Input → Narrativeのループが、明示的な「次へ」なしで続く', async () => {
      await sendAction(canvas, '銀の鍵を掲げて反応を見る');
      await sendAction(canvas, '反応した書架へ近づく');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('プレイヤーの入力: 反応した書架へ近づく');
    });
    await step('AIは重要な進行を勝手に進めず、次のPlayer Inputを待つ', async () => {
      await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('次の重要な進行は入力待ち');
    });
  }
}`,...(ge=(me=S.parameters)==null?void 0:me.docs)==null?void 0:ge.source}}};var Te,xe,Be;H.parameters={...H.parameters,docs:{...(Te=H.parameters)==null?void 0:Te.docs,source:{originalSource:`{
  name: 'US-P09: 見出しリンク（TOC）から対話ログを振り返りたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('多数のTurnに対して、TOCはTurn一覧ではなくAIが考えた場面見出しを表示する', async () => {
      await expect(canvas.getByRole('complementary', {
        name: 'AI見出しリンクTOC'
      })).toHaveTextContent('目覚めと銀の鍵');
      await expect(canvas.getByRole('complementary', {
        name: 'AI見出しリンクTOC'
      })).toHaveTextContent('濡れた書架の声');
      await expect(canvas.getByRole('complementary', {
        name: 'AI見出しリンクTOC'
      })).toHaveTextContent('螺旋階段と星図灯');
      await expect(canvas.getByRole('complementary', {
        name: 'AI見出しリンクTOC'
      })).toHaveTextContent('閉じた星座の扉');
      await expect(canvas.getByRole('article', {
        name: 'Turn 12'
      })).toBeVisible();
    });
    await step('TOCの末尾は常に最後のTurn（Turn 12）を指す見出しになっている', async () => {
      await expect(canvas.getByTestId('heading-link-12')).toHaveTextContent('Turn 12から');
    });
    await step('AI見出しを選ぶと、その見出しが始まる切り替わりTurnへジャンプする', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '見出し「螺旋階段と星図灯」へ（Turn 08から）'
      }));
      await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('場面の切り替わりTurn 08へジャンプ');
      await expect(canvas.getByTestId('active-turn-summary')).toHaveTextContent('08 / 螺旋階段へ向かう');
      await expect(canvas.getByTestId('active-heading-summary')).toHaveTextContent('螺旋階段と星図灯（Turn 08から）');
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
    });
    await step('末尾の見出しを選ぶと、最後のTurnへジャンプして選択表示される', async () => {
      await userEvent.click(canvas.getByTestId('heading-link-12'));
      await expect(canvas.getByTestId('active-turn-summary')).toHaveTextContent('12 / 入力待ちの静止点');
      await expect(canvas.getByRole('article', {
        name: 'Turn 12'
      })).toHaveClass('session-turn selected');
    });
  }
}`,...(Be=(xe=H.parameters)==null?void 0:xe.docs)==null?void 0:Be.source}}};var Ie,Ce,be;A.parameters={...A.parameters,docs:{...(Ie=A.parameters)==null?void 0:Ie.docs,source:{originalSource:`{
  name: 'US-P10/Notes: セッション中いつでもノートを参照・編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('プレイ画面のサイドでノートを素早く確認・編集できる', async () => {
      await expect(canvas.getByRole('button', {
        name: /^全画面表示$/
      })).toBeVisible();
      await expect(canvas.getByRole('slider', {
        name: 'ノート表示比率'
      })).toBeVisible();
      await expect(canvas.getByTestId('session-notes-side')).toHaveTextContent('月読ミナト');
      await userEvent.click(within(canvas.getByTestId('session-notes-side')).getByRole('button', {
        name: '月読ミナトを編集'
      }));
      await expect(canvas.getByRole('dialog', {
        name: 'ノート編集'
      })).toBeVisible();
      await expect(canvas.getByTestId('note-edit-dialog')).toHaveAttribute('data-size', 'editor');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('open person-minato');
      await userEvent.clear(canvas.getByLabelText('別名'));
      await userEvent.type(canvas.getByLabelText('別名'), '水際の案内人');
      await userEvent.click(canvas.getAllByRole('button', {
        name: '閉じる'
      })[0]);
      await expect(canvas.queryByRole('dialog', {
        name: 'ノート編集'
      })).not.toBeInTheDocument();
    });
    await step('全画面で集中編集に切り替えても、一覧・編集・Context・整合性を1画面で操作できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: /^全画面表示$/
      }));
      await expect(canvas.getByTestId('session-notes-focus')).toBeVisible();
      await expect(canvas.getByTestId('session-notes-full')).toHaveTextContent('月読ミナト');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('notes full');
      await userEvent.click(within(canvas.getByTestId('session-notes-full')).getByRole('button', {
        name: '場所追加'
      }));
      await expect(canvas.getByRole('dialog', {
        name: 'ノート編集'
      })).toHaveTextContent('地下天文台');
      await userEvent.click(canvas.getByRole('button', {
        name: '閉じる'
      }));
      await userEvent.click(within(canvas.getByTestId('session-notes-full')).getByRole('button', {
        name: 'Context再構築'
      }));
      await expect(within(canvas.getByTestId('session-notes-full')).getByTestId('context-stack')).toHaveTextContent('次ターンContext');
    });
  }
}`,...(be=(Ce=A.parameters)==null?void 0:Ce.docs)==null?void 0:be.source}}};var Se,He,Ae;E.parameters={...E.parameters,docs:{...(Se=E.parameters)==null?void 0:Se.docs,source:{originalSource:`{
  name: 'US-P11: 「ここまで戻る」で任意の過去ターンまで巻き戻したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await sendAction(canvas, '書架の奥にいる人物に話しかける');
    await sendAction(canvas, '銀の鍵を水面に沈めてみる');
    await step('過去Turnの「ここまで戻る」を押すと確認ダイアログを表示する', async () => {
      const turnOne = within(canvas.getByRole('article', {
        name: 'Turn 01'
      }));
      await userEvent.click(turnOne.getByRole('button', {
        name: 'ここまで戻る'
      }));
      await expect(canvas.getByRole('dialog', {
        name: '巻き戻し確認'
      })).toBeVisible();
      await expect(canvas.getByTestId('rewind-dialog')).toHaveTextContent('非同期処理を無効化');
      await expect(canvas.getByTestId('rewind-dialog')).toHaveAttribute('data-tone', 'warning');
    });
    await step('確定すると指定ターン以降を無効化し、巻き戻し地点から再入力できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '巻き戻しを確定'
      }));
      await expect(canvas.getByTestId('dialogue-log')).not.toHaveTextContent('銀の鍵を水面に沈めてみる');
      await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('AIコンテキストを再構築');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeVisible();
    });
  }
}`,...(Ae=(He=E.parameters)==null?void 0:He.docs)==null?void 0:Ae.source}}};const ot=["GenericEntityAiManagedStateContinuity","USP01CurrentSituationNarrative","CompletedSessionReadOnly","IndependentAiProfileSelection","USP02AndP03NaturalInputToNarrativeResult","ComposerKeyboardBehavior","NarrativeGenerationLoading","ComposerDoubleClickCreatesOneTurn","USP04TalkWithNpcNaturally","USP05AskClarificationWithoutProgress","USP05BRecommendNextAction","USP06ShowInputInterpretation","USP07DeleteDraftInput","USP08AndP10ContinuousLoopWaitsForInput","USP09ReviewLogFromToc","USP10NotesAlwaysAvailableSideAndFull","USP11RewindToAnyPastTurn"];export{p as CompletedSessionReadOnly,T as ComposerDoubleClickCreatesOneTurn,m as ComposerKeyboardBehavior,v as GenericEntityAiManagedStateContinuity,d as IndependentAiProfileSelection,g as NarrativeGenerationLoading,u as USP01CurrentSituationNarrative,w as USP02AndP03NaturalInputToNarrativeResult,x as USP04TalkWithNpcNaturally,B as USP05AskClarificationWithoutProgress,I as USP05BRecommendNextAction,C as USP06ShowInputInterpretation,b as USP07DeleteDraftInput,S as USP08AndP10ContinuousLoopWaitsForInput,H as USP09ReviewLogFromToc,A as USP10NotesAlwaysAvailableSideAndFull,E as USP11RewindToAnyPastTurn,ot as __namedExportsOrder,nt as default};
