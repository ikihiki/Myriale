import{j as nt}from"./jsx-runtime-BO8uF4Og.js";import{w as o,u as s,e}from"./index-C4S39nCK.js";import{M as x,c as st}from"./MyrialeApp-Cn4gHc_j.js";/* empty css               */import"./index-D4H_InIO.js";import"./MyrialeToggle-Bg-kC3W_.js";import"./Textarea-CcOK8MJX.js";import"./navigationRecipes-DkSbwkz5.js";import"./index-DzKAYa42.js";import"./AppChrome-1oAPIq2I.js";import"./MyrialeMenu-D5uDeAxS.js";import"./textRecipes-MDckTkYd.js";import"./account-2Bmf3pGL.js";import"./ModuleUiHost-BqYiOWAU.js";import"./scenarioWizardStyles-tiXjmn5i.js";import"./SessionTurn-CGwTZaxd.js";import"./SessionActivityFeed-Na1GoQpS.js";const ot=()=>{const n=st("activeSession");return{...n,playSessions:{...n.playSessions,"SES-PREP-1098":{...n.playSessions["SES-PREP-1098"],turn:12,summary:"複数ターン経過後のアプリ画面確認用ログ。"}}}},Ht={title:"ユーザーストーリー/Session play dialogue",component:x,render:()=>nt.jsx(x,{initialUrl:"/sessions/SES-PREP-1098",initialDb:ot()}),parameters:{notes:"docs/user-stories/session-play-dialogue-user-stories.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},i=async(n,a)=>{const t=n.getByLabelText("自由に行動や会話を入力");await s.clear(t),await s.type(t,a),await s.click(n.getByRole("button",{name:"行動を送る"}))},r={name:"US-P01: AIが現在の状況を語ってほしい",play:async({canvasElement:n,step:a})=>{const t=o(n);await a("ActiveなSessionの開始時に、現在地・周囲・直近の出来事をNarrativeとして表示する",async()=>{await e(t.getByTestId("session-state")).toHaveTextContent("Active"),await e(t.getByTestId("turn-1-narrative")).toHaveTextContent("水没した閲覧室"),await e(t.getByTestId("turn-1-narrative")).toHaveTextContent("銀の鍵"),await e(t.getByRole("status")).toHaveTextContent("現在地、周囲、直近の出来事")})}},l={name:"US-P02/P03: 自然言語で行動を入力し、結果を物語として受け取る",play:async({canvasElement:n,step:a})=>{const t=o(n);await a("自由入力欄に自然な文章で行動を書く",async()=>{await s.type(t.getByLabelText("自由に行動や会話を入力"),"周囲を警戒しながら閲覧室を出る"),await e(t.getByLabelText("自由に行動や会話を入力")).toHaveValue("周囲を警戒しながら閲覧室を出る")}),await a("送信すると行動として解釈され、成功・想定外の展開を含むNarrativeが生成される",async()=>{await s.click(t.getByRole("button",{name:"行動を送る"})),await e(t.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 周囲を警戒しながら閲覧室を出る"),await e(t.getByTestId("dialogue-log")).toHaveTextContent("想定外の痕跡"),await e(t.getByRole("status")).toHaveTextContent("結果をNarrativeとして生成")})}},y={name:"Composer: Shift+Enterで改行し、Enterで送信する",play:async({canvasElement:n,step:a})=>{const t=o(n),c=t.getByLabelText("自由に行動や会話を入力");await a("Shift+Enterは送信せず改行する",async()=>{await s.type(c,"一行目"),await s.keyboard("{Shift>}{Enter}{/Shift}二行目"),await e(c).toHaveValue(`一行目
二行目`),await e(t.getByTestId("dialogue-log")).not.toHaveTextContent("プレイヤーの入力: 一行目")}),await a("Enterは入力を送信し、composerを空に戻す",async()=>{await s.keyboard("{Enter}"),await e(t.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 一行目 二行目"),await e(c).toHaveValue("")})}},v={name:"US-P04: NPCと自然に会話したい",play:async({canvasElement:n,step:a})=>{const t=o(n);await a("NPCへの発話を自由入力で送る",async()=>{await i(t,"書架の奥にいる人物に「あなたは誰？」と尋ねる")}),await a("NPCの立場・関係性に沿った返答がNarrativeに入り、会話内容が文脈に残る",async()=>{await e(t.getByTestId("dialogue-log")).toHaveTextContent("書架の奥の人物"),await e(t.getByTestId("dialogue-log")).toHaveTextContent("会話内容はセッション文脈に記録")})}},u={name:"US-P05: AIに補足説明や再説明を求めたい",play:async({canvasElement:n,step:a})=>{const t=o(n);await a("補足説明ボタンから「今の状況を簡単にまとめて」を送る",async()=>{await s.click(t.getByRole("button",{name:"状況を簡単にまとめて聞く"})),await e(t.getByTestId("dialogue-log")).toHaveTextContent("補足説明")}),await a("補足要求は行動扱いにせず、物語進行やSession状態を変化させない",async()=>{await e(t.getByRole("status")).toHaveTextContent("行動ではない"),await e(t.getByTestId("session-state")).toHaveTextContent("Active"),await e(t.getByTestId("active-turn-summary")).toHaveTextContent("物語状態は変化しない")})}},w={name:"US-P05B: AIに次の行動案を推薦してほしい",play:async({canvasElement:n,step:a})=>{const t=o(n);await a("AI推薦ボタンを押すと、現在の状況に沿った行動案が入力欄へ入る",async()=>{await s.click(t.getByRole("button",{name:"AIに次の行動を提案してもらう"})),await e(t.getByLabelText("自由に行動や会話を入力")).toHaveValue("銀の鍵を扉にかざし、刻まれた星座との対応を確かめる"),await e(t.getByRole("status")).toHaveTextContent("内容を編集してから送信できます")})}},p={name:"US-P06: 自分の入力がどう解釈されたか知りたい",play:async({canvasElement:n,step:a})=>{const t=o(n);await i(t,"酒場の奥にいる人物に話しかける"),await a("解釈トグルはPlayer Inputの直下にあり、押すと内部解釈を表示する",async()=>{await s.click(t.getByRole("button",{name:"Turn 13の入力解釈を見る"})),await e(t.getByTestId("turn-13-interpretation")).toHaveTextContent("NPCへの会話として解釈"),await e(t.queryByText("入力直下に内部解釈を表示しました。意図とのズレがあれば、削除・やり直しできます。")).not.toBeInTheDocument()}),await a("もう一度押すと解釈を隠せる",async()=>{await s.click(t.getByRole("button",{name:"Turn 13の入力解釈を隠す"})),await e(t.queryByTestId("turn-13-interpretation")).not.toBeInTheDocument()})}},m={name:"US-P07: 未送信の入力を取り消したい",play:async({canvasElement:n,step:a})=>{const t=o(n);await a("未送信の入力は削除ボタンで取り消せる",async()=>{await s.type(t.getByLabelText("自由に行動や会話を入力"),"入力ミス"),await s.click(t.getByRole("button",{name:"入力を消去"})),await e(t.getByLabelText("自由に行動や会話を入力")).toHaveValue(""),await e(t.getByRole("status")).toHaveTextContent("入力欄の未送信テキストを無効化"),await e(t.queryByRole("button",{name:"直前のターンに戻る"})).not.toBeInTheDocument()})}},g={name:"US-P08/P10: 対話だけで進み、AIは入力を待つ",play:async({canvasElement:n,step:a})=>{const t=o(n);await a("Narrative → Input → Narrativeのループが、明示的な「次へ」なしで続く",async()=>{await i(t,"銀の鍵を掲げて反応を見る"),await i(t,"反応した書架へ近づく"),await e(t.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 反応した書架へ近づく")}),await a("AIは重要な進行を勝手に進めず、次のPlayer Inputを待つ",async()=>{await e(t.getByRole("status")).toHaveTextContent("次の重要な進行は入力待ち")})}},T={name:"US-P09: 見出しリンク（TOC）から対話ログを振り返りたい",play:async({canvasElement:n,step:a})=>{const t=o(n);await a("多数のTurnに対して、TOCはTurn一覧ではなくAIが考えた場面見出しを表示する",async()=>{await e(t.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("目覚めと銀の鍵"),await e(t.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("濡れた書架の声"),await e(t.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("螺旋階段と星図灯"),await e(t.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("閉じた星座の扉"),await e(t.getByRole("article",{name:"Turn 12"})).toBeVisible()}),await a("TOCの末尾は常に最後のTurn（Turn 12）を指す見出しになっている",async()=>{await e(t.getByTestId("heading-link-12")).toHaveTextContent("Turn 12から")}),await a("AI見出しを選ぶと、その見出しが始まる切り替わりTurnへジャンプする",async()=>{await s.click(t.getByRole("button",{name:"見出し「螺旋階段と星図灯」へ（Turn 08から）"})),await e(t.getByRole("status")).toHaveTextContent("場面の切り替わりTurn 08へジャンプ"),await e(t.getByTestId("active-turn-summary")).toHaveTextContent("08 / 螺旋階段へ向かう"),await e(t.getByTestId("active-heading-summary")).toHaveTextContent("螺旋階段と星図灯（Turn 08から）"),await e(t.getByTestId("session-state")).toHaveTextContent("Active")}),await a("末尾の見出しを選ぶと、最後のTurnへジャンプして選択表示される",async()=>{await s.click(t.getByTestId("heading-link-12")),await e(t.getByTestId("active-turn-summary")).toHaveTextContent("12 / 入力待ちの静止点"),await e(t.getByRole("article",{name:"Turn 12"})).toHaveClass("session-turn selected")})}},d={name:"US-P10/Notes: セッション中いつでもノートを参照・編集したい",play:async({canvasElement:n,step:a})=>{const t=o(n);await a("プレイ画面のサイドでノートを素早く確認・編集できる",async()=>{await e(t.getByRole("button",{name:/^全画面表示$/})).toBeVisible(),await e(t.getByRole("slider",{name:"ノート表示比率"})).toBeVisible(),await e(t.getByTestId("session-notes-side")).toHaveTextContent("月読ミナト"),await s.click(o(t.getByTestId("session-notes-side")).getByRole("button",{name:"月読ミナトを編集"})),await e(t.getByRole("dialog",{name:"ノート編集"})).toBeVisible(),await e(t.getByTestId("note-edit-dialog")).toHaveAttribute("data-size","editor"),await e(t.getByTestId("app-db-summary")).toHaveTextContent("open person-minato"),await s.clear(t.getByLabelText("別名")),await s.type(t.getByLabelText("別名"),"水際の案内人"),await s.click(t.getAllByRole("button",{name:"閉じる"})[0]),await e(t.queryByRole("dialog",{name:"ノート編集"})).not.toBeInTheDocument()}),await a("全画面で集中編集に切り替えても、一覧・編集・Context・整合性を1画面で操作できる",async()=>{await s.click(t.getByRole("button",{name:/^全画面表示$/})),await e(t.getByTestId("session-notes-focus")).toBeVisible(),await e(t.getByTestId("session-notes-full")).toHaveTextContent("月読ミナト"),await e(t.getByTestId("app-db-summary")).toHaveTextContent("notes full"),await s.click(o(t.getByTestId("session-notes-full")).getByRole("button",{name:"場所追加"})),await e(t.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("地下天文台"),await s.click(t.getByRole("button",{name:"閉じる"})),await s.click(o(t.getByTestId("session-notes-full")).getByRole("button",{name:"Context再構築"})),await e(o(t.getByTestId("session-notes-full")).getByTestId("context-stack")).toHaveTextContent("次ターンContext")})}},B={name:"US-P11: 「ここまで戻る」で任意の過去ターンまで巻き戻したい",play:async({canvasElement:n,step:a})=>{const t=o(n);await i(t,"書架の奥にいる人物に話しかける"),await i(t,"銀の鍵を水面に沈めてみる"),await a("過去Turnの「ここまで戻る」を押すと確認ダイアログを表示する",async()=>{const c=o(t.getByRole("article",{name:"Turn 01"}));await s.click(c.getByRole("button",{name:"ここまで戻る"})),await e(t.getByRole("dialog",{name:"巻き戻し確認"})).toBeVisible(),await e(t.getByTestId("rewind-dialog")).toHaveTextContent("非同期処理を無効化"),await e(t.getByTestId("rewind-dialog")).toHaveAttribute("data-tone","warning")}),await a("確定すると指定ターン以降を無効化し、巻き戻し地点から再入力できる",async()=>{await s.click(t.getByRole("button",{name:"巻き戻しを確定"})),await e(t.getByTestId("dialogue-log")).not.toHaveTextContent("銀の鍵を水面に沈めてみる"),await e(t.getByRole("status")).toHaveTextContent("AIコンテキストを再構築"),await e(t.getByLabelText("自由に行動や会話を入力")).toBeVisible()})}};var I,C,H;r.parameters={...r.parameters,docs:{...(I=r.parameters)==null?void 0:I.docs,source:{originalSource:`{
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
      await expect(canvas.getByRole('status')).toHaveTextContent('現在地、周囲、直近の出来事');
    });
  }
}`,...(H=(C=r.parameters)==null?void 0:C.docs)==null?void 0:H.source}}};var b,R,S;l.parameters={...l.parameters,docs:{...(b=l.parameters)==null?void 0:b.docs,source:{originalSource:`{
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
      await expect(canvas.getByRole('status')).toHaveTextContent('結果をNarrativeとして生成');
    });
  }
}`,...(S=(R=l.parameters)==null?void 0:R.docs)==null?void 0:S.source}}};var P,E,A;y.parameters={...y.parameters,docs:{...(P=y.parameters)==null?void 0:P.docs,source:{originalSource:`{
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
}`,...(A=(E=y.parameters)==null?void 0:E.docs)==null?void 0:A.source}}};var h,k,U;v.parameters={...v.parameters,docs:{...(h=v.parameters)==null?void 0:h.docs,source:{originalSource:`{
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
}`,...(U=(k=v.parameters)==null?void 0:k.docs)==null?void 0:U.source}}};var N,f,V;u.parameters={...u.parameters,docs:{...(N=u.parameters)==null?void 0:N.docs,source:{originalSource:`{
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
      await expect(canvas.getByRole('status')).toHaveTextContent('行動ではない');
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
      await expect(canvas.getByTestId('active-turn-summary')).toHaveTextContent('物語状態は変化しない');
    });
  }
}`,...(V=(f=u.parameters)==null?void 0:f.docs)==null?void 0:V.source}}};var L,O,D;w.parameters={...w.parameters,docs:{...(L=w.parameters)==null?void 0:L.docs,source:{originalSource:`{
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
      await expect(canvas.getByRole('status')).toHaveTextContent('内容を編集してから送信できます');
    });
  }
}`,...(D=(O=w.parameters)==null?void 0:O.docs)==null?void 0:D.source}}};var q,F,W;p.parameters={...p.parameters,docs:{...(q=p.parameters)==null?void 0:q.docs,source:{originalSource:`{
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
}`,...(W=(F=p.parameters)==null?void 0:F.docs)==null?void 0:W.source}}};var $,j,z;m.parameters={...m.parameters,docs:{...($=m.parameters)==null?void 0:$.docs,source:{originalSource:`{
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
      await expect(canvas.getByRole('status')).toHaveTextContent('入力欄の未送信テキストを無効化');
      await expect(canvas.queryByRole('button', {
        name: '直前のターンに戻る'
      })).not.toBeInTheDocument();
    });
  }
}`,...(z=(j=m.parameters)==null?void 0:j.docs)==null?void 0:z.source}}};var K,M,_;g.parameters={...g.parameters,docs:{...(K=g.parameters)==null?void 0:K.docs,source:{originalSource:`{
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
      await expect(canvas.getByRole('status')).toHaveTextContent('次の重要な進行は入力待ち');
    });
  }
}`,...(_=(M=g.parameters)==null?void 0:M.docs)==null?void 0:_.source}}};var G,J,Q;T.parameters={...T.parameters,docs:{...(G=T.parameters)==null?void 0:G.docs,source:{originalSource:`{
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
      await expect(canvas.getByRole('status')).toHaveTextContent('場面の切り替わりTurn 08へジャンプ');
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
}`,...(Q=(J=T.parameters)==null?void 0:J.docs)==null?void 0:Q.source}}};var X,Y,Z;d.parameters={...d.parameters,docs:{...(X=d.parameters)==null?void 0:X.docs,source:{originalSource:`{
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
}`,...(Z=(Y=d.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var tt,et,at;B.parameters={...B.parameters,docs:{...(tt=B.parameters)==null?void 0:tt.docs,source:{originalSource:`{
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
      await expect(canvas.getByRole('status')).toHaveTextContent('AIコンテキストを再構築');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeVisible();
    });
  }
}`,...(at=(et=B.parameters)==null?void 0:et.docs)==null?void 0:at.source}}};const bt=["USP01CurrentSituationNarrative","USP02AndP03NaturalInputToNarrativeResult","ComposerKeyboardBehavior","USP04TalkWithNpcNaturally","USP05AskClarificationWithoutProgress","USP05BRecommendNextAction","USP06ShowInputInterpretation","USP07DeleteDraftInput","USP08AndP10ContinuousLoopWaitsForInput","USP09ReviewLogFromToc","USP10NotesAlwaysAvailableSideAndFull","USP11RewindToAnyPastTurn"];export{y as ComposerKeyboardBehavior,r as USP01CurrentSituationNarrative,l as USP02AndP03NaturalInputToNarrativeResult,v as USP04TalkWithNpcNaturally,u as USP05AskClarificationWithoutProgress,w as USP05BRecommendNextAction,p as USP06ShowInputInterpretation,m as USP07DeleteDraftInput,g as USP08AndP10ContinuousLoopWaitsForInput,T as USP09ReviewLogFromToc,d as USP10NotesAlwaysAvailableSideAndFull,B as USP11RewindToAnyPastTurn,bt as __namedExportsOrder,Ht as default};
