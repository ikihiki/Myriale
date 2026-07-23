import{j as c}from"./jsx-runtime-BO8uF4Og.js";import{w as o,e as t,u as s}from"./index-C4S39nCK.js";import{M as l}from"./MyrialeApp-zlad6OLU.js";import{c as Be}from"./SessionPresentation-snv_O4YT.js";import{M as P}from"./MockSessionContainer-rV9Eq5Dg.js";/* empty css               */import"./index-D4H_InIO.js";import"./AppChrome-CHMriQiq.js";import"./Surfaces-CQIJcDfy.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BLjquTkO.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-C73OeBTK.js";import"./ModuleUiHost-Dq6FqUxM.js";import"./account-D2w1pibX.js";import"./scenarioWizardStyles-BR3QgEqM.js";import"./SessionListPresentation-D-fbhDNR.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-E1lLWSiL.js";import"./SessionActivityFeed-BdT5gTWl.js";const H=()=>{const a=Be("activeSession");return{...a,playSessions:{...a.playSessions,"SES-PREP-1098":{...a.playSessions["SES-PREP-1098"],turn:12,summary:"複数ターン経過後のアプリ画面確認用ログ。"}}}},Me={title:"ユーザーストーリー/Session play dialogue",component:l,render:()=>c.jsx(l,{initialUrl:"/sessions/SES-PREP-1098",initialDb:H(),sessionContainer:P}),parameters:{notes:"docs/user-stories/session-play-dialogue-user-stories.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},r=async(a,n)=>{const e=a.getByLabelText("自由に行動や会話を入力");await s.clear(e),await s.type(e,n),await s.click(a.getByRole("button",{name:"行動を送る"}))},y={name:"US-P01: AIが現在の状況を語ってほしい",play:async({canvasElement:a,step:n})=>{const e=o(a);await n("ActiveなSessionの開始時に、現在地・周囲・直近の出来事をNarrativeとして表示する",async()=>{await t(e.getByTestId("session-state")).toHaveTextContent("Active"),await t(e.getByTestId("turn-1-narrative")).toHaveTextContent("水没した閲覧室"),await t(e.getByTestId("turn-1-narrative")).toHaveTextContent("銀の鍵"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("現在地、周囲、直近の出来事")})}},u={name:"完了済みSession: 読み取り専用で物語を開く",render:()=>{const a=H();return c.jsx(l,{initialUrl:"/sessions/SES-PREP-1098",initialDb:{...a,playSessions:{...a.playSessions,"SES-PREP-1098":{...a.playSessions["SES-PREP-1098"],state:"Completed"}}},sessionContainer:P})},play:async({canvasElement:a,step:n})=>{const e=o(a);await n("完了済みの物語はログを表示したまま進行操作を隠す",async()=>{await t(e.getByTestId("session-state")).toHaveTextContent("Completed"),await t(e.getByTestId("completed-session-read-only")).toBeVisible(),await t(e.queryByLabelText("自由に行動や会話を入力")).not.toBeInTheDocument(),await t(e.getByTestId("dialogue-log")).toHaveTextContent("水没した閲覧室")})}},v={name:"US-P02/P03: 自然言語で行動を入力し、結果を物語として受け取る",play:async({canvasElement:a,step:n})=>{const e=o(a);await n("自由入力欄に自然な文章で行動を書く",async()=>{await s.type(e.getByLabelText("自由に行動や会話を入力"),"周囲を警戒しながら閲覧室を出る"),await t(e.getByLabelText("自由に行動や会話を入力")).toHaveValue("周囲を警戒しながら閲覧室を出る")}),await n("送信すると行動として解釈され、成功・想定外の展開を含むNarrativeが生成される",async()=>{await s.click(e.getByRole("button",{name:"行動を送る"})),await t(e.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 周囲を警戒しながら閲覧室を出る"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("想定外の痕跡"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("結果をNarrativeとして生成")})}},p={name:"Composer: Shift+Enterで改行し、Enterで送信する",play:async({canvasElement:a,step:n})=>{const e=o(a),i=e.getByLabelText("自由に行動や会話を入力");await n("Shift+Enterは送信せず改行する",async()=>{await s.type(i,"一行目"),await s.keyboard("{Shift>}{Enter}{/Shift}二行目"),await t(i).toHaveValue(`一行目
二行目`),await t(e.getByTestId("dialogue-log")).not.toHaveTextContent("プレイヤーの入力: 一行目")}),await n("Enterは入力を送信し、composerを空に戻す",async()=>{await s.keyboard("{Enter}"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 一行目 二行目"),await t(i).toHaveValue("")})}},m={name:"Narrative generation: loading中は入力操作を無効化する",render:()=>c.jsx(l,{initialUrl:"/sessions/SES-PREP-1098",initialDb:H(),sessionContainer:({sessionId:a})=>c.jsx(P,{sessionId:a,initiallySubmitting:!0})}),play:async({canvasElement:a,step:n})=>{const e=o(a);await n("Narrative生成中の進行表示を示し、重複操作につながる入力Controlsを無効化する",async()=>{await t(e.getByRole("button",{name:"Narrativeを生成中"})).toBeDisabled(),await t(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled(),await t(e.getByRole("button",{name:"AIに次の行動を提案してもらう"})).toBeDisabled()})}},d={name:"Composer: 送信ボタンの二重clickでTurnを重複作成しない",render:()=>c.jsx(l,{initialUrl:"/sessions/SES-PREP-1098",initialDb:H(),sessionContainer:({sessionId:a})=>c.jsx(P,{sessionId:a,submissionDelayMs:25})}),play:async({canvasElement:a,step:n})=>{const e=o(a),i=e.getByLabelText("自由に行動や会話を入力");await s.type(i,"二重送信されないことを確認する"),await n("送信ボタンを素早く二重clickしても、最初の送信中に再送しない",async()=>{await s.dblClick(e.getByRole("button",{name:"行動を送る"}));const Te=await e.findByRole("article",{name:"Turn 13"});await t(Te).toHaveTextContent("プレイヤーの入力: 二重送信されないことを確認する"),await t(e.queryByRole("article",{name:"Turn 14"})).not.toBeInTheDocument()})}},w={name:"US-P04: NPCと自然に会話したい",play:async({canvasElement:a,step:n})=>{const e=o(a);await n("NPCへの発話を自由入力で送る",async()=>{await r(e,"書架の奥にいる人物に「あなたは誰？」と尋ねる")}),await n("NPCの立場・関係性に沿った返答がNarrativeに入り、会話内容が文脈に残る",async()=>{await t(e.getByTestId("dialogue-log")).toHaveTextContent("書架の奥の人物"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("会話内容はセッション文脈に記録")})}},g={name:"US-P05: AIに補足説明や再説明を求めたい",play:async({canvasElement:a,step:n})=>{const e=o(a);await n("補足説明ボタンから「今の状況を簡単にまとめて」を送る",async()=>{await s.click(e.getByRole("button",{name:"状況を簡単にまとめて聞く"})),await t(e.getByTestId("dialogue-log")).toHaveTextContent("補足説明")}),await n("補足要求は行動扱いにせず、物語進行やSession状態を変化させない",async()=>{await t(e.getByTestId("dialogue-notice")).toHaveTextContent("行動ではない"),await t(e.getByTestId("session-state")).toHaveTextContent("Active"),await t(e.getByTestId("active-turn-summary")).toHaveTextContent("物語状態は変化しない")})}},T={name:"US-P05B: AIに次の行動案を推薦してほしい",play:async({canvasElement:a,step:n})=>{const e=o(a);await n("AI推薦ボタンを押すと、現在の状況に沿った行動案が入力欄へ入る",async()=>{await s.click(e.getByRole("button",{name:"AIに次の行動を提案してもらう"})),await t(e.getByLabelText("自由に行動や会話を入力")).toHaveValue("銀の鍵を扉にかざし、刻まれた星座との対応を確かめる"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("内容を編集してから送信できます")})}},B={name:"US-P06: 自分の入力がどう解釈されたか知りたい",play:async({canvasElement:a,step:n})=>{const e=o(a);await r(e,"酒場の奥にいる人物に話しかける"),await n("解釈トグルはPlayer Inputの直下にあり、押すと内部解釈を表示する",async()=>{await s.click(e.getByRole("button",{name:"Turn 13の入力解釈を見る"})),await t(e.getByTestId("turn-13-interpretation")).toHaveTextContent("NPCへの会話として解釈"),await t(e.queryByText("入力直下に内部解釈を表示しました。意図とのズレがあれば、削除・やり直しできます。")).not.toBeInTheDocument()}),await n("もう一度押すと解釈を隠せる",async()=>{await s.click(e.getByRole("button",{name:"Turn 13の入力解釈を隠す"})),await t(e.queryByTestId("turn-13-interpretation")).not.toBeInTheDocument()})}},x={name:"US-P07: 未送信の入力を取り消したい",play:async({canvasElement:a,step:n})=>{const e=o(a);await n("未送信の入力は削除ボタンで取り消せる",async()=>{await s.type(e.getByLabelText("自由に行動や会話を入力"),"入力ミス"),await s.click(e.getByRole("button",{name:"入力を消去"})),await t(e.getByLabelText("自由に行動や会話を入力")).toHaveValue(""),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("入力欄の未送信テキストを無効化"),await t(e.queryByRole("button",{name:"直前のターンに戻る"})).not.toBeInTheDocument()})}},I={name:"US-P08/P10: 対話だけで進み、AIは入力を待つ",play:async({canvasElement:a,step:n})=>{const e=o(a);await n("Narrative → Input → Narrativeのループが、明示的な「次へ」なしで続く",async()=>{await r(e,"銀の鍵を掲げて反応を見る"),await r(e,"反応した書架へ近づく"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 反応した書架へ近づく")}),await n("AIは重要な進行を勝手に進めず、次のPlayer Inputを待つ",async()=>{await t(e.getByTestId("dialogue-notice")).toHaveTextContent("次の重要な進行は入力待ち")})}},C={name:"US-P09: 見出しリンク（TOC）から対話ログを振り返りたい",play:async({canvasElement:a,step:n})=>{const e=o(a);await n("多数のTurnに対して、TOCはTurn一覧ではなくAIが考えた場面見出しを表示する",async()=>{await t(e.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("目覚めと銀の鍵"),await t(e.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("濡れた書架の声"),await t(e.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("螺旋階段と星図灯"),await t(e.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("閉じた星座の扉"),await t(e.getByRole("article",{name:"Turn 12"})).toBeVisible()}),await n("TOCの末尾は常に最後のTurn（Turn 12）を指す見出しになっている",async()=>{await t(e.getByTestId("heading-link-12")).toHaveTextContent("Turn 12から")}),await n("AI見出しを選ぶと、その見出しが始まる切り替わりTurnへジャンプする",async()=>{await s.click(e.getByRole("button",{name:"見出し「螺旋階段と星図灯」へ（Turn 08から）"})),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("場面の切り替わりTurn 08へジャンプ"),await t(e.getByTestId("active-turn-summary")).toHaveTextContent("08 / 螺旋階段へ向かう"),await t(e.getByTestId("active-heading-summary")).toHaveTextContent("螺旋階段と星図灯（Turn 08から）"),await t(e.getByTestId("session-state")).toHaveTextContent("Active")}),await n("末尾の見出しを選ぶと、最後のTurnへジャンプして選択表示される",async()=>{await s.click(e.getByTestId("heading-link-12")),await t(e.getByTestId("active-turn-summary")).toHaveTextContent("12 / 入力待ちの静止点"),await t(e.getByRole("article",{name:"Turn 12"})).toHaveClass("session-turn selected")})}},b={name:"US-P10/Notes: セッション中いつでもノートを参照・編集したい",play:async({canvasElement:a,step:n})=>{const e=o(a);await n("プレイ画面のサイドでノートを素早く確認・編集できる",async()=>{await t(e.getByRole("button",{name:/^全画面表示$/})).toBeVisible(),await t(e.getByRole("slider",{name:"ノート表示比率"})).toBeVisible(),await t(e.getByTestId("session-notes-side")).toHaveTextContent("月読ミナト"),await s.click(o(e.getByTestId("session-notes-side")).getByRole("button",{name:"月読ミナトを編集"})),await t(e.getByRole("dialog",{name:"ノート編集"})).toBeVisible(),await t(e.getByTestId("note-edit-dialog")).toHaveAttribute("data-size","editor"),await t(e.getByTestId("app-db-summary")).toHaveTextContent("open person-minato"),await s.clear(e.getByLabelText("別名")),await s.type(e.getByLabelText("別名"),"水際の案内人"),await s.click(e.getAllByRole("button",{name:"閉じる"})[0]),await t(e.queryByRole("dialog",{name:"ノート編集"})).not.toBeInTheDocument()}),await n("全画面で集中編集に切り替えても、一覧・編集・Context・整合性を1画面で操作できる",async()=>{await s.click(e.getByRole("button",{name:/^全画面表示$/})),await t(e.getByTestId("session-notes-focus")).toBeVisible(),await t(e.getByTestId("session-notes-full")).toHaveTextContent("月読ミナト"),await t(e.getByTestId("app-db-summary")).toHaveTextContent("notes full"),await s.click(o(e.getByTestId("session-notes-full")).getByRole("button",{name:"場所追加"})),await t(e.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("地下天文台"),await s.click(e.getByRole("button",{name:"閉じる"})),await s.click(o(e.getByTestId("session-notes-full")).getByRole("button",{name:"Context再構築"})),await t(o(e.getByTestId("session-notes-full")).getByTestId("context-stack")).toHaveTextContent("次ターンContext")})}},S={name:"US-P11: 「ここまで戻る」で任意の過去ターンまで巻き戻したい",play:async({canvasElement:a,step:n})=>{const e=o(a);await r(e,"書架の奥にいる人物に話しかける"),await r(e,"銀の鍵を水面に沈めてみる"),await n("過去Turnの「ここまで戻る」を押すと確認ダイアログを表示する",async()=>{const i=o(e.getByRole("article",{name:"Turn 01"}));await s.click(i.getByRole("button",{name:"ここまで戻る"})),await t(e.getByRole("dialog",{name:"巻き戻し確認"})).toBeVisible(),await t(e.getByTestId("rewind-dialog")).toHaveTextContent("非同期処理を無効化"),await t(e.getByTestId("rewind-dialog")).toHaveAttribute("data-tone","warning")}),await n("確定すると指定ターン以降を無効化し、巻き戻し地点から再入力できる",async()=>{await s.click(e.getByRole("button",{name:"巻き戻しを確定"})),await t(e.getByTestId("dialogue-log")).not.toHaveTextContent("銀の鍵を水面に沈めてみる"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("AIコンテキストを再構築"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeVisible()})}};var E,R,A;y.parameters={...y.parameters,docs:{...(E=y.parameters)==null?void 0:E.docs,source:{originalSource:`{
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
}`,...(A=(R=y.parameters)==null?void 0:R.docs)==null?void 0:A.source}}};var k,h,U;u.parameters={...u.parameters,docs:{...(k=u.parameters)==null?void 0:k.docs,source:{originalSource:`{
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
}`,...(U=(h=u.parameters)==null?void 0:h.docs)==null?void 0:U.source}}};var N,D,f;v.parameters={...v.parameters,docs:{...(N=v.parameters)==null?void 0:N.docs,source:{originalSource:`{
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
}`,...(f=(D=v.parameters)==null?void 0:D.docs)==null?void 0:f.source}}};var L,V,O;p.parameters={...p.parameters,docs:{...(L=p.parameters)==null?void 0:L.docs,source:{originalSource:`{
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
}`,...(O=(V=p.parameters)==null?void 0:V.docs)==null?void 0:O.source}}};var q,M,j;m.parameters={...m.parameters,docs:{...(q=m.parameters)==null?void 0:q.docs,source:{originalSource:`{
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
}`,...(j=(M=m.parameters)==null?void 0:M.docs)==null?void 0:j.source}}};var F,W,$;d.parameters={...d.parameters,docs:{...(F=d.parameters)==null?void 0:F.docs,source:{originalSource:`{
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
}`,...($=(W=d.parameters)==null?void 0:W.docs)==null?void 0:$.source}}};var z,G,K;w.parameters={...w.parameters,docs:{...(z=w.parameters)==null?void 0:z.docs,source:{originalSource:`{
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
    });
  }
}`,...(K=(G=w.parameters)==null?void 0:G.docs)==null?void 0:K.source}}};var _,J,Q;g.parameters={...g.parameters,docs:{...(_=g.parameters)==null?void 0:_.docs,source:{originalSource:`{
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
}`,...(Q=(J=g.parameters)==null?void 0:J.docs)==null?void 0:Q.source}}};var X,Y,Z;T.parameters={...T.parameters,docs:{...(X=T.parameters)==null?void 0:X.docs,source:{originalSource:`{
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
}`,...(Z=(Y=T.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var ee,te,ae;B.parameters={...B.parameters,docs:{...(ee=B.parameters)==null?void 0:ee.docs,source:{originalSource:`{
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
}`,...(ae=(te=B.parameters)==null?void 0:te.docs)==null?void 0:ae.source}}};var ne,se,oe;x.parameters={...x.parameters,docs:{...(ne=x.parameters)==null?void 0:ne.docs,source:{originalSource:`{
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
}`,...(oe=(se=x.parameters)==null?void 0:se.docs)==null?void 0:oe.source}}};var ie,ce,re;I.parameters={...I.parameters,docs:{...(ie=I.parameters)==null?void 0:ie.docs,source:{originalSource:`{
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
}`,...(re=(ce=I.parameters)==null?void 0:ce.docs)==null?void 0:re.source}}};var le,ye,ue;C.parameters={...C.parameters,docs:{...(le=C.parameters)==null?void 0:le.docs,source:{originalSource:`{
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
}`,...(ue=(ye=C.parameters)==null?void 0:ye.docs)==null?void 0:ue.source}}};var ve,pe,me;b.parameters={...b.parameters,docs:{...(ve=b.parameters)==null?void 0:ve.docs,source:{originalSource:`{
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
}`,...(me=(pe=b.parameters)==null?void 0:pe.docs)==null?void 0:me.source}}};var de,we,ge;S.parameters={...S.parameters,docs:{...(de=S.parameters)==null?void 0:de.docs,source:{originalSource:`{
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
}`,...(ge=(we=S.parameters)==null?void 0:we.docs)==null?void 0:ge.source}}};const je=["USP01CurrentSituationNarrative","CompletedSessionReadOnly","USP02AndP03NaturalInputToNarrativeResult","ComposerKeyboardBehavior","NarrativeGenerationLoading","ComposerDoubleClickCreatesOneTurn","USP04TalkWithNpcNaturally","USP05AskClarificationWithoutProgress","USP05BRecommendNextAction","USP06ShowInputInterpretation","USP07DeleteDraftInput","USP08AndP10ContinuousLoopWaitsForInput","USP09ReviewLogFromToc","USP10NotesAlwaysAvailableSideAndFull","USP11RewindToAnyPastTurn"];export{u as CompletedSessionReadOnly,d as ComposerDoubleClickCreatesOneTurn,p as ComposerKeyboardBehavior,m as NarrativeGenerationLoading,y as USP01CurrentSituationNarrative,v as USP02AndP03NaturalInputToNarrativeResult,w as USP04TalkWithNpcNaturally,g as USP05AskClarificationWithoutProgress,T as USP05BRecommendNextAction,B as USP06ShowInputInterpretation,x as USP07DeleteDraftInput,I as USP08AndP10ContinuousLoopWaitsForInput,C as USP09ReviewLogFromToc,b as USP10NotesAlwaysAvailableSideAndFull,S as USP11RewindToAnyPastTurn,je as __namedExportsOrder,Me as default};
