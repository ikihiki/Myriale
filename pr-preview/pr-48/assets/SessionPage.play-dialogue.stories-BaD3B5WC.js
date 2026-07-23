import{j as r}from"./jsx-runtime-BO8uF4Og.js";import{w as o,u as s,e as t}from"./index-C4S39nCK.js";import{M as b}from"./MyrialeApp-gNqUfips.js";import{c as we}from"./SessionPresentation-cUM_ZEXs.js";import{M as S}from"./MockSessionContainer-DjrkrTOM.js";/* empty css               */import"./index-D4H_InIO.js";import"./AppChrome-Cb-Bi4JU.js";import"./Surfaces-CQIJcDfy.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BLjquTkO.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-C73OeBTK.js";import"./ModuleUiHost-Bh6MkF-3.js";import"./account-D2w1pibX.js";import"./scenarioWizardStyles-BR3QgEqM.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-E1lLWSiL.js";import"./SessionActivityFeed-Dum0r2zc.js";const H=()=>{const n=we("activeSession");return{...n,playSessions:{...n.playSessions,"SES-PREP-1098":{...n.playSessions["SES-PREP-1098"],turn:12,summary:"複数ターン経過後のアプリ画面確認用ログ。"}}}},fe={title:"ユーザーストーリー/Session play dialogue",component:b,render:()=>r.jsx(b,{initialUrl:"/sessions/SES-PREP-1098",initialDb:H(),sessionContainer:S}),parameters:{notes:"docs/user-stories/session-play-dialogue-user-stories.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},c=async(n,a)=>{const e=n.getByLabelText("自由に行動や会話を入力");await s.clear(e),await s.type(e,a),await s.click(n.getByRole("button",{name:"行動を送る"}))},l={name:"US-P01: AIが現在の状況を語ってほしい",play:async({canvasElement:n,step:a})=>{const e=o(n);await a("ActiveなSessionの開始時に、現在地・周囲・直近の出来事をNarrativeとして表示する",async()=>{await t(e.getByTestId("session-state")).toHaveTextContent("Active"),await t(e.getByTestId("turn-1-narrative")).toHaveTextContent("水没した閲覧室"),await t(e.getByTestId("turn-1-narrative")).toHaveTextContent("銀の鍵"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("現在地、周囲、直近の出来事")})}},y={name:"US-P02/P03: 自然言語で行動を入力し、結果を物語として受け取る",play:async({canvasElement:n,step:a})=>{const e=o(n);await a("自由入力欄に自然な文章で行動を書く",async()=>{await s.type(e.getByLabelText("自由に行動や会話を入力"),"周囲を警戒しながら閲覧室を出る"),await t(e.getByLabelText("自由に行動や会話を入力")).toHaveValue("周囲を警戒しながら閲覧室を出る")}),await a("送信すると行動として解釈され、成功・想定外の展開を含むNarrativeが生成される",async()=>{await s.click(e.getByRole("button",{name:"行動を送る"})),await t(e.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 周囲を警戒しながら閲覧室を出る"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("想定外の痕跡"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("結果をNarrativeとして生成")})}},u={name:"Composer: Shift+Enterで改行し、Enterで送信する",play:async({canvasElement:n,step:a})=>{const e=o(n),i=e.getByLabelText("自由に行動や会話を入力");await a("Shift+Enterは送信せず改行する",async()=>{await s.type(i,"一行目"),await s.keyboard("{Shift>}{Enter}{/Shift}二行目"),await t(i).toHaveValue(`一行目
二行目`),await t(e.getByTestId("dialogue-log")).not.toHaveTextContent("プレイヤーの入力: 一行目")}),await a("Enterは入力を送信し、composerを空に戻す",async()=>{await s.keyboard("{Enter}"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 一行目 二行目"),await t(i).toHaveValue("")})}},v={name:"Narrative generation: loading中は入力操作を無効化する",render:()=>r.jsx(b,{initialUrl:"/sessions/SES-PREP-1098",initialDb:H(),sessionContainer:({sessionId:n})=>r.jsx(S,{sessionId:n,initiallySubmitting:!0})}),play:async({canvasElement:n,step:a})=>{const e=o(n);await a("Narrative生成中の進行表示を示し、重複操作につながる入力Controlsを無効化する",async()=>{await t(e.getByRole("button",{name:"Narrativeを生成中"})).toBeDisabled(),await t(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled(),await t(e.getByRole("button",{name:"AIに次の行動を提案してもらう"})).toBeDisabled()})}},p={name:"Composer: 送信ボタンの二重clickでTurnを重複作成しない",render:()=>r.jsx(b,{initialUrl:"/sessions/SES-PREP-1098",initialDb:H(),sessionContainer:({sessionId:n})=>r.jsx(S,{sessionId:n,submissionDelayMs:25})}),play:async({canvasElement:n,step:a})=>{const e=o(n),i=e.getByLabelText("自由に行動や会話を入力");await s.type(i,"二重送信されないことを確認する"),await a("送信ボタンを素早く二重clickしても、最初の送信中に再送しない",async()=>{await s.dblClick(e.getByRole("button",{name:"行動を送る"}));const me=await e.findByRole("article",{name:"Turn 13"});await t(me).toHaveTextContent("プレイヤーの入力: 二重送信されないことを確認する"),await t(e.queryByRole("article",{name:"Turn 14"})).not.toBeInTheDocument()})}},m={name:"US-P04: NPCと自然に会話したい",play:async({canvasElement:n,step:a})=>{const e=o(n);await a("NPCへの発話を自由入力で送る",async()=>{await c(e,"書架の奥にいる人物に「あなたは誰？」と尋ねる")}),await a("NPCの立場・関係性に沿った返答がNarrativeに入り、会話内容が文脈に残る",async()=>{await t(e.getByTestId("dialogue-log")).toHaveTextContent("書架の奥の人物"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("会話内容はセッション文脈に記録")})}},w={name:"US-P05: AIに補足説明や再説明を求めたい",play:async({canvasElement:n,step:a})=>{const e=o(n);await a("補足説明ボタンから「今の状況を簡単にまとめて」を送る",async()=>{await s.click(e.getByRole("button",{name:"状況を簡単にまとめて聞く"})),await t(e.getByTestId("dialogue-log")).toHaveTextContent("補足説明")}),await a("補足要求は行動扱いにせず、物語進行やSession状態を変化させない",async()=>{await t(e.getByTestId("dialogue-notice")).toHaveTextContent("行動ではない"),await t(e.getByTestId("session-state")).toHaveTextContent("Active"),await t(e.getByTestId("active-turn-summary")).toHaveTextContent("物語状態は変化しない")})}},g={name:"US-P05B: AIに次の行動案を推薦してほしい",play:async({canvasElement:n,step:a})=>{const e=o(n);await a("AI推薦ボタンを押すと、現在の状況に沿った行動案が入力欄へ入る",async()=>{await s.click(e.getByRole("button",{name:"AIに次の行動を提案してもらう"})),await t(e.getByLabelText("自由に行動や会話を入力")).toHaveValue("銀の鍵を扉にかざし、刻まれた星座との対応を確かめる"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("内容を編集してから送信できます")})}},d={name:"US-P06: 自分の入力がどう解釈されたか知りたい",play:async({canvasElement:n,step:a})=>{const e=o(n);await c(e,"酒場の奥にいる人物に話しかける"),await a("解釈トグルはPlayer Inputの直下にあり、押すと内部解釈を表示する",async()=>{await s.click(e.getByRole("button",{name:"Turn 13の入力解釈を見る"})),await t(e.getByTestId("turn-13-interpretation")).toHaveTextContent("NPCへの会話として解釈"),await t(e.queryByText("入力直下に内部解釈を表示しました。意図とのズレがあれば、削除・やり直しできます。")).not.toBeInTheDocument()}),await a("もう一度押すと解釈を隠せる",async()=>{await s.click(e.getByRole("button",{name:"Turn 13の入力解釈を隠す"})),await t(e.queryByTestId("turn-13-interpretation")).not.toBeInTheDocument()})}},T={name:"US-P07: 未送信の入力を取り消したい",play:async({canvasElement:n,step:a})=>{const e=o(n);await a("未送信の入力は削除ボタンで取り消せる",async()=>{await s.type(e.getByLabelText("自由に行動や会話を入力"),"入力ミス"),await s.click(e.getByRole("button",{name:"入力を消去"})),await t(e.getByLabelText("自由に行動や会話を入力")).toHaveValue(""),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("入力欄の未送信テキストを無効化"),await t(e.queryByRole("button",{name:"直前のターンに戻る"})).not.toBeInTheDocument()})}},B={name:"US-P08/P10: 対話だけで進み、AIは入力を待つ",play:async({canvasElement:n,step:a})=>{const e=o(n);await a("Narrative → Input → Narrativeのループが、明示的な「次へ」なしで続く",async()=>{await c(e,"銀の鍵を掲げて反応を見る"),await c(e,"反応した書架へ近づく"),await t(e.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 反応した書架へ近づく")}),await a("AIは重要な進行を勝手に進めず、次のPlayer Inputを待つ",async()=>{await t(e.getByTestId("dialogue-notice")).toHaveTextContent("次の重要な進行は入力待ち")})}},x={name:"US-P09: 見出しリンク（TOC）から対話ログを振り返りたい",play:async({canvasElement:n,step:a})=>{const e=o(n);await a("多数のTurnに対して、TOCはTurn一覧ではなくAIが考えた場面見出しを表示する",async()=>{await t(e.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("目覚めと銀の鍵"),await t(e.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("濡れた書架の声"),await t(e.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("螺旋階段と星図灯"),await t(e.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("閉じた星座の扉"),await t(e.getByRole("article",{name:"Turn 12"})).toBeVisible()}),await a("TOCの末尾は常に最後のTurn（Turn 12）を指す見出しになっている",async()=>{await t(e.getByTestId("heading-link-12")).toHaveTextContent("Turn 12から")}),await a("AI見出しを選ぶと、その見出しが始まる切り替わりTurnへジャンプする",async()=>{await s.click(e.getByRole("button",{name:"見出し「螺旋階段と星図灯」へ（Turn 08から）"})),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("場面の切り替わりTurn 08へジャンプ"),await t(e.getByTestId("active-turn-summary")).toHaveTextContent("08 / 螺旋階段へ向かう"),await t(e.getByTestId("active-heading-summary")).toHaveTextContent("螺旋階段と星図灯（Turn 08から）"),await t(e.getByTestId("session-state")).toHaveTextContent("Active")}),await a("末尾の見出しを選ぶと、最後のTurnへジャンプして選択表示される",async()=>{await s.click(e.getByTestId("heading-link-12")),await t(e.getByTestId("active-turn-summary")).toHaveTextContent("12 / 入力待ちの静止点"),await t(e.getByRole("article",{name:"Turn 12"})).toHaveClass("session-turn selected")})}},I={name:"US-P10/Notes: セッション中いつでもノートを参照・編集したい",play:async({canvasElement:n,step:a})=>{const e=o(n);await a("プレイ画面のサイドでノートを素早く確認・編集できる",async()=>{await t(e.getByRole("button",{name:/^全画面表示$/})).toBeVisible(),await t(e.getByRole("slider",{name:"ノート表示比率"})).toBeVisible(),await t(e.getByTestId("session-notes-side")).toHaveTextContent("月読ミナト"),await s.click(o(e.getByTestId("session-notes-side")).getByRole("button",{name:"月読ミナトを編集"})),await t(e.getByRole("dialog",{name:"ノート編集"})).toBeVisible(),await t(e.getByTestId("note-edit-dialog")).toHaveAttribute("data-size","editor"),await t(e.getByTestId("app-db-summary")).toHaveTextContent("open person-minato"),await s.clear(e.getByLabelText("別名")),await s.type(e.getByLabelText("別名"),"水際の案内人"),await s.click(e.getAllByRole("button",{name:"閉じる"})[0]),await t(e.queryByRole("dialog",{name:"ノート編集"})).not.toBeInTheDocument()}),await a("全画面で集中編集に切り替えても、一覧・編集・Context・整合性を1画面で操作できる",async()=>{await s.click(e.getByRole("button",{name:/^全画面表示$/})),await t(e.getByTestId("session-notes-focus")).toBeVisible(),await t(e.getByTestId("session-notes-full")).toHaveTextContent("月読ミナト"),await t(e.getByTestId("app-db-summary")).toHaveTextContent("notes full"),await s.click(o(e.getByTestId("session-notes-full")).getByRole("button",{name:"場所追加"})),await t(e.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("地下天文台"),await s.click(e.getByRole("button",{name:"閉じる"})),await s.click(o(e.getByTestId("session-notes-full")).getByRole("button",{name:"Context再構築"})),await t(o(e.getByTestId("session-notes-full")).getByTestId("context-stack")).toHaveTextContent("次ターンContext")})}},C={name:"US-P11: 「ここまで戻る」で任意の過去ターンまで巻き戻したい",play:async({canvasElement:n,step:a})=>{const e=o(n);await c(e,"書架の奥にいる人物に話しかける"),await c(e,"銀の鍵を水面に沈めてみる"),await a("過去Turnの「ここまで戻る」を押すと確認ダイアログを表示する",async()=>{const i=o(e.getByRole("article",{name:"Turn 01"}));await s.click(i.getByRole("button",{name:"ここまで戻る"})),await t(e.getByRole("dialog",{name:"巻き戻し確認"})).toBeVisible(),await t(e.getByTestId("rewind-dialog")).toHaveTextContent("非同期処理を無効化"),await t(e.getByTestId("rewind-dialog")).toHaveAttribute("data-tone","warning")}),await a("確定すると指定ターン以降を無効化し、巻き戻し地点から再入力できる",async()=>{await s.click(e.getByRole("button",{name:"巻き戻しを確定"})),await t(e.getByTestId("dialogue-log")).not.toHaveTextContent("銀の鍵を水面に沈めてみる"),await t(e.getByTestId("dialogue-notice")).toHaveTextContent("AIコンテキストを再構築"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeVisible()})}};var P,R,E;l.parameters={...l.parameters,docs:{...(P=l.parameters)==null?void 0:P.docs,source:{originalSource:`{
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
}`,...(E=(R=l.parameters)==null?void 0:R.docs)==null?void 0:E.source}}};var A,k,h;y.parameters={...y.parameters,docs:{...(A=y.parameters)==null?void 0:A.docs,source:{originalSource:`{
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
}`,...(h=(k=y.parameters)==null?void 0:k.docs)==null?void 0:h.source}}};var U,N,D;u.parameters={...u.parameters,docs:{...(U=u.parameters)==null?void 0:U.docs,source:{originalSource:`{
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
}`,...(D=(N=u.parameters)==null?void 0:N.docs)==null?void 0:D.source}}};var f,L,V;v.parameters={...v.parameters,docs:{...(f=v.parameters)==null?void 0:f.docs,source:{originalSource:`{
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
}`,...(V=(L=v.parameters)==null?void 0:L.docs)==null?void 0:V.source}}};var O,q,M;p.parameters={...p.parameters,docs:{...(O=p.parameters)==null?void 0:O.docs,source:{originalSource:`{
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
}`,...(M=(q=p.parameters)==null?void 0:q.docs)==null?void 0:M.source}}};var j,F,W;m.parameters={...m.parameters,docs:{...(j=m.parameters)==null?void 0:j.docs,source:{originalSource:`{
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
}`,...(W=(F=m.parameters)==null?void 0:F.docs)==null?void 0:W.source}}};var $,z,G;w.parameters={...w.parameters,docs:{...($=w.parameters)==null?void 0:$.docs,source:{originalSource:`{
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
}`,...(G=(z=w.parameters)==null?void 0:z.docs)==null?void 0:G.source}}};var K,_,J;g.parameters={...g.parameters,docs:{...(K=g.parameters)==null?void 0:K.docs,source:{originalSource:`{
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
}`,...(J=(_=g.parameters)==null?void 0:_.docs)==null?void 0:J.source}}};var Q,X,Y;d.parameters={...d.parameters,docs:{...(Q=d.parameters)==null?void 0:Q.docs,source:{originalSource:`{
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
}`,...(Y=(X=d.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};var Z,ee,te;T.parameters={...T.parameters,docs:{...(Z=T.parameters)==null?void 0:Z.docs,source:{originalSource:`{
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
}`,...(te=(ee=T.parameters)==null?void 0:ee.docs)==null?void 0:te.source}}};var ae,ne,se;B.parameters={...B.parameters,docs:{...(ae=B.parameters)==null?void 0:ae.docs,source:{originalSource:`{
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
}`,...(se=(ne=B.parameters)==null?void 0:ne.docs)==null?void 0:se.source}}};var oe,ie,ce;x.parameters={...x.parameters,docs:{...(oe=x.parameters)==null?void 0:oe.docs,source:{originalSource:`{
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
}`,...(ce=(ie=x.parameters)==null?void 0:ie.docs)==null?void 0:ce.source}}};var re,le,ye;I.parameters={...I.parameters,docs:{...(re=I.parameters)==null?void 0:re.docs,source:{originalSource:`{
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
}`,...(ye=(le=I.parameters)==null?void 0:le.docs)==null?void 0:ye.source}}};var ue,ve,pe;C.parameters={...C.parameters,docs:{...(ue=C.parameters)==null?void 0:ue.docs,source:{originalSource:`{
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
}`,...(pe=(ve=C.parameters)==null?void 0:ve.docs)==null?void 0:pe.source}}};const Le=["USP01CurrentSituationNarrative","USP02AndP03NaturalInputToNarrativeResult","ComposerKeyboardBehavior","NarrativeGenerationLoading","ComposerDoubleClickCreatesOneTurn","USP04TalkWithNpcNaturally","USP05AskClarificationWithoutProgress","USP05BRecommendNextAction","USP06ShowInputInterpretation","USP07DeleteDraftInput","USP08AndP10ContinuousLoopWaitsForInput","USP09ReviewLogFromToc","USP10NotesAlwaysAvailableSideAndFull","USP11RewindToAnyPastTurn"];export{p as ComposerDoubleClickCreatesOneTurn,u as ComposerKeyboardBehavior,v as NarrativeGenerationLoading,l as USP01CurrentSituationNarrative,y as USP02AndP03NaturalInputToNarrativeResult,m as USP04TalkWithNpcNaturally,w as USP05AskClarificationWithoutProgress,g as USP05BRecommendNextAction,d as USP06ShowInputInterpretation,T as USP07DeleteDraftInput,B as USP08AndP10ContinuousLoopWaitsForInput,x as USP09ReviewLogFromToc,I as USP10NotesAlwaysAvailableSideAndFull,C as USP11RewindToAnyPastTurn,Le as __namedExportsOrder,fe as default};
