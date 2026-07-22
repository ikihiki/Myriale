import{j as M}from"./jsx-runtime-BO8uF4Og.js";import{w as i,e as a,u as o,a as x}from"./index-C4S39nCK.js";import{M as u,c as z}from"./MyrialeApp-Bdz5qkEr.js";/* empty css               */import"./index-D4H_InIO.js";import"./AppChrome-Cb-Bi4JU.js";import"./Surfaces-CQIJcDfy.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BLjquTkO.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-C73OeBTK.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-E1lLWSiL.js";import"./scenarioWizardStyles-BLXZEqRf.js";import"./SessionActivityFeed-BK8PBvn8.js";import"./account-D2w1pibX.js";import"./ModuleUiHost-Dq6FqUxM.js";const re={title:"ユーザーストーリー/Start session",component:u,render:()=>M.jsx(u,{initialUrl:"/scenarios",initialDb:z("activeSession")}),parameters:{notes:"docs/user-stories/start-session.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},c=async(n,t="星喰いの地下図書館")=>{await o.click(n.getByRole("button",{name:`${t}で開始`})),await n.findByTestId("selected-scenario-title")},r={name:"US-S01: シナリオから新しいセッションを開始したい",play:async({canvasElement:n,step:t})=>{const e=i(n);await t("シナリオ一覧から対象Scenarioを確認し、登録導線も見える",async()=>{await a(e.getByRole("region",{name:"シナリオ一覧"})).toBeVisible(),await a(e.getByTestId("scenario-list")).toHaveTextContent("星喰いの地下図書館"),await a(e.getByRole("button",{name:"新しいシナリオを登録"})).toBeVisible(),await a(e.queryByRole("complementary",{name:"シナリオ登録導線"})).not.toBeInTheDocument()}),await t("Scenarioを選択すると、余分な状態表示を挟まずイントロと主人公選択を表示する",async()=>{await c(e),await a(e.getByTestId("selected-scenario-title")).toHaveTextContent("星喰いの地下図書館"),await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await a(e.queryByTestId("session-notice")).not.toBeInTheDocument(),await a(e.queryByRole("complementary",{name:"セッション状態サマリー"})).not.toBeInTheDocument()})}},l={name:"US-S02: セッション開始時にシナリオのイントロを見たい",play:async({canvasElement:n,step:t})=>{const e=i(n);i(n.ownerDocument.body),await c(e),await t("Preparing状態で、主人公未確定のイントロNarrativeを読む",async()=>{await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await a(e.getByTestId("intro-narrative")).toHaveTextContent("あなたは水没した閲覧室で目を覚ます。"),await a(e.getByTestId("intro-narrative")).not.toHaveTextContent("名もなき旅人")}),await t("同じページで主人公選択ができる",async()=>{await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible()})}},y={name:"US-S03: イントロ後に主人公を確定したい",play:async({canvasElement:n,step:t})=>{const e=i(n),s=i(n.ownerDocument.body);await c(e),await t("イントロと同じページで候補を選び、Session固有データとして確定する",async()=>{await o.click(e.getByRole("combobox",{name:"候補キャラクター"})),await a(s.queryByRole("option",{name:"自由生成"})).not.toBeInTheDocument(),await o.click(await s.findByRole("option",{name:"エル / 記憶を失った写字生"})),await a(e.getByLabelText("主人公の名前")).toHaveValue("エル"),await a(e.getByLabelText("主人公の名前")).toHaveAttribute("readonly"),await a(e.getByLabelText("主人公プロフィール")).toHaveValue("記憶を失った写字生"),await a(e.getByLabelText("主人公プロフィール")).toHaveAttribute("readonly"),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await x(()=>a(e.getByRole("dialog",{name:"開始前の最終確認"})).toBeVisible()),await a(e.getByTestId("start-summary")).toHaveTextContent("エル / 記憶を失った写字生")})}},w={name:"US-S03C/D: 主人公を作成し、AI案は確認してから確定する",play:async({canvasElement:n,step:t})=>{const e=i(n);await c(e,"灰の駅と宛名のない切符"),await t("自由生成が許可されたシナリオでは、名前とプロフィールを最初から編集できる",async()=>{await a(e.queryByRole("combobox",{name:"主人公の扱い"})).not.toBeInTheDocument(),await o.clear(e.getByLabelText("主人公の名前")),await o.type(e.getByLabelText("主人公の名前"),"ユイ"),await a(e.getByLabelText("主人公の名前")).toHaveValue("ユイ")}),await t("AI生成ボタンはフォームを補助するだけで、自動確定しない",async()=>{await o.click(e.getByRole("button",{name:"AIに主人公を生成してもらう"})),await a(e.getByLabelText("主人公の名前")).toHaveValue("ノクト"),await a(e.getByRole("status")).toHaveTextContent("確認・修正してから確定"),await a(e.getByRole("button",{name:"開始内容を確認"})).toBeVisible()})}},m={name:"US-S03B: 選択式で許可された場合だけ自由生成へ切り替える",render:()=>M.jsx(u,{initialUrl:"/scenarios",initialDb:z("activeSession")}),play:async({canvasElement:n,step:t})=>{const e=i(n);await c(e,"月虹の庭と眠らない時計"),await t("候補キャラクターの選択肢から、許可された自由生成へ切り替えられる",async()=>{const s=i(n.ownerDocument.body),g=e.getByRole("combobox",{name:"候補キャラクター"});await o.click(g),await o.click(await s.findByRole("option",{name:"自由生成"})),await a(g).toHaveTextContent("自由生成"),await x(()=>a(e.getByLabelText("主人公の名前")).toBeVisible()),await o.click(g),await o.click(await s.findByRole("option",{name:"カイ / 時計塔を修理する旅の技師"})),await a(e.getByLabelText("主人公の名前")).toHaveValue("カイ"),await a(e.getByLabelText("主人公の名前")).toHaveAttribute("readonly")})}},v={name:"US-S03A: 固定主人公は読み取り専用で表示する",play:async({canvasElement:n,step:t})=>{const e=i(n);await c(e,"硝子の森と夜明けの司書"),await t("固定主人公だけを表示し、選択や自由生成を許可しない",async()=>{await a(e.getByTestId("fixed-hero")).toBeVisible(),await a(e.getByLabelText("主人公の名前")).toHaveValue("リュシエン"),await a(e.getByLabelText("主人公の名前")).toHaveAttribute("readonly"),await a(e.getByLabelText("主人公プロフィール")).toHaveValue("夜明け前の森を巡る司書"),await a(e.getByLabelText("主人公プロフィール")).toHaveAttribute("readonly"),await a(e.queryByRole("combobox",{name:"候補キャラクター"})).not.toBeInTheDocument()})}},p={name:"US-S04: セッション開始前に内容を最終確認したい",play:async({canvasElement:n,step:t})=>{const e=i(n);await c(e),await t("権限があるPlayerだけがデバッグ用の解釈説明を選択できる",async()=>{const s=e.getByRole("checkbox",{name:/解釈説明を有効にする/});await a(s).not.toBeChecked(),await o.click(s),await a(s).toBeChecked()}),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await t("ダイアログの開始サマリーでScenario概要、主人公、デバッグ設定を確認する",async()=>{await x(()=>a(e.getByRole("dialog",{name:"開始前の最終確認"})).toBeVisible()),await a(e.getByTestId("start-review-dialog")).toHaveAttribute("data-size","wide"),await a(e.getByTestId("start-summary")).toHaveTextContent("Scenario: 星喰いの地下図書館"),await a(e.getByTestId("start-summary")).toHaveTextContent("解釈説明: 有効（デバッグ）"),await a(e.getByTestId("start-summary")).toHaveTextContent("主人公: ミラ")}),await t("修正を選ぶとダイアログを閉じて主人公選択へ戻れる",async()=>{await o.click(e.getByRole("button",{name:"主人公選択を修正"})),await a(e.queryByRole("dialog",{name:"開始前の最終確認"})).not.toBeInTheDocument(),await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible()})}},B={name:"US-S05: セッションを正式に開始したい",play:async({canvasElement:n,step:t})=>{const e=i(n);await c(e),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await t("確認ダイアログの「物語を始める」でSessionをActiveにし、US-P01のプレイ画面へ合流する",async()=>{await o.click(e.getByRole("button",{name:"物語を始める"})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(e.getByTestId("session-state")).toHaveTextContent("Active"),await a(e.getByTestId("turn-1-narrative")).toHaveTextContent("水没した閲覧室"),await a(e.getByTestId("turn-1-narrative")).toHaveTextContent("銀の鍵"),await a(e.getByRole("status")).toHaveTextContent("イントロのみ"),await a(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}};var b,d,S;r.parameters={...r.parameters,docs:{...(b=r.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: 'US-S01: シナリオから新しいセッションを開始したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('シナリオ一覧から対象Scenarioを確認し、登録導線も見える', async () => {
      await expect(canvas.getByRole('region', {
        name: 'シナリオ一覧'
      })).toBeVisible();
      await expect(canvas.getByTestId('scenario-list')).toHaveTextContent('星喰いの地下図書館');
      await expect(canvas.getByRole('button', {
        name: '新しいシナリオを登録'
      })).toBeVisible();
      await expect(canvas.queryByRole('complementary', {
        name: 'シナリオ登録導線'
      })).not.toBeInTheDocument();
    });
    await step('Scenarioを選択すると、余分な状態表示を挟まずイントロと主人公選択を表示する', async () => {
      await startPreparing(canvas);
      await expect(canvas.getByTestId('selected-scenario-title')).toHaveTextContent('星喰いの地下図書館');
      await expect(canvas.getByRole('region', {
        name: 'イントロNarrative'
      })).toBeVisible();
      await expect(canvas.getByRole('region', {
        name: '主人公確定'
      })).toBeVisible();
      await expect(canvas.queryByTestId('session-notice')).not.toBeInTheDocument();
      await expect(canvas.queryByRole('complementary', {
        name: 'セッション状態サマリー'
      })).not.toBeInTheDocument();
    });
  }
}`,...(S=(d=r.parameters)==null?void 0:d.docs)==null?void 0:S.source}}};var T,R,H;l.parameters={...l.parameters,docs:{...(T=l.parameters)==null?void 0:T.docs,source:{originalSource:`{
  name: 'US-S02: セッション開始時にシナリオのイントロを見たい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await startPreparing(canvas);
    await step('Preparing状態で、主人公未確定のイントロNarrativeを読む', async () => {
      await expect(canvas.getByRole('region', {
        name: 'イントロNarrative'
      })).toBeVisible();
      await expect(canvas.getByTestId('intro-narrative')).toHaveTextContent('あなたは水没した閲覧室で目を覚ます。');
      await expect(canvas.getByTestId('intro-narrative')).not.toHaveTextContent('名もなき旅人');
    });
    await step('同じページで主人公選択ができる', async () => {
      await expect(canvas.getByRole('region', {
        name: '主人公確定'
      })).toBeVisible();
    });
  }
}`,...(H=(R=l.parameters)==null?void 0:R.docs)==null?void 0:H.source}}};var I,h,C;y.parameters={...y.parameters,docs:{...(I=y.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: 'US-S03: イントロ後に主人公を確定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await startPreparing(canvas);
    await step('イントロと同じページで候補を選び、Session固有データとして確定する', async () => {
      await userEvent.click(canvas.getByRole('combobox', {
        name: '候補キャラクター'
      }));
      await expect(screen.queryByRole('option', {
        name: '自由生成'
      })).not.toBeInTheDocument();
      await userEvent.click(await screen.findByRole('option', {
        name: 'エル / 記憶を失った写字生'
      }));
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('エル');
      await expect(canvas.getByLabelText('主人公の名前')).toHaveAttribute('readonly');
      await expect(canvas.getByLabelText('主人公プロフィール')).toHaveValue('記憶を失った写字生');
      await expect(canvas.getByLabelText('主人公プロフィール')).toHaveAttribute('readonly');
      await userEvent.click(canvas.getByRole('button', {
        name: '開始内容を確認'
      }));
      await waitFor(() => expect(canvas.getByRole('dialog', {
        name: '開始前の最終確認'
      })).toBeVisible());
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('エル / 記憶を失った写字生');
    });
  }
}`,...(C=(h=y.parameters)==null?void 0:h.docs)==null?void 0:C.source}}};var V,E,U;w.parameters={...w.parameters,docs:{...(V=w.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: 'US-S03C/D: 主人公を作成し、AI案は確認してから確定する',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas, '灰の駅と宛名のない切符');
    await step('自由生成が許可されたシナリオでは、名前とプロフィールを最初から編集できる', async () => {
      await expect(canvas.queryByRole('combobox', {
        name: '主人公の扱い'
      })).not.toBeInTheDocument();
      await userEvent.clear(canvas.getByLabelText('主人公の名前'));
      await userEvent.type(canvas.getByLabelText('主人公の名前'), 'ユイ');
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('ユイ');
    });
    await step('AI生成ボタンはフォームを補助するだけで、自動確定しない', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに主人公を生成してもらう'
      }));
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('ノクト');
      await expect(canvas.getByRole('status')).toHaveTextContent('確認・修正してから確定');
      await expect(canvas.getByRole('button', {
        name: '開始内容を確認'
      })).toBeVisible();
    });
  }
}`,...(U=(E=w.parameters)==null?void 0:E.docs)==null?void 0:U.source}}};var k,A,D;m.parameters={...m.parameters,docs:{...(k=m.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: 'US-S03B: 選択式で許可された場合だけ自由生成へ切り替える',
  render: () => <MyrialeApp initialUrl="/scenarios" initialDb={createDemoDb('activeSession')} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas, '月虹の庭と眠らない時計');
    await step('候補キャラクターの選択肢から、許可された自由生成へ切り替えられる', async () => {
      const screen = within(canvasElement.ownerDocument.body);
      const protagonistSelect = canvas.getByRole('combobox', {
        name: '候補キャラクター'
      });
      await userEvent.click(protagonistSelect);
      await userEvent.click(await screen.findByRole('option', {
        name: '自由生成'
      }));
      await expect(protagonistSelect).toHaveTextContent('自由生成');
      await waitFor(() => expect(canvas.getByLabelText('主人公の名前')).toBeVisible());
      await userEvent.click(protagonistSelect);
      await userEvent.click(await screen.findByRole('option', {
        name: 'カイ / 時計塔を修理する旅の技師'
      }));
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('カイ');
      await expect(canvas.getByLabelText('主人公の名前')).toHaveAttribute('readonly');
    });
  }
}`,...(D=(A=m.parameters)==null?void 0:A.docs)==null?void 0:D.source}}};var L,f,P;v.parameters={...v.parameters,docs:{...(L=v.parameters)==null?void 0:L.docs,source:{originalSource:`{
  name: 'US-S03A: 固定主人公は読み取り専用で表示する',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas, '硝子の森と夜明けの司書');
    await step('固定主人公だけを表示し、選択や自由生成を許可しない', async () => {
      await expect(canvas.getByTestId('fixed-hero')).toBeVisible();
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('リュシエン');
      await expect(canvas.getByLabelText('主人公の名前')).toHaveAttribute('readonly');
      await expect(canvas.getByLabelText('主人公プロフィール')).toHaveValue('夜明け前の森を巡る司書');
      await expect(canvas.getByLabelText('主人公プロフィール')).toHaveAttribute('readonly');
      await expect(canvas.queryByRole('combobox', {
        name: '候補キャラクター'
      })).not.toBeInTheDocument();
    });
  }
}`,...(P=(f=v.parameters)==null?void 0:f.docs)==null?void 0:P.source}}};var q,F,N;p.parameters={...p.parameters,docs:{...(q=p.parameters)==null?void 0:q.docs,source:{originalSource:`{
  name: 'US-S04: セッション開始前に内容を最終確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await step('権限があるPlayerだけがデバッグ用の解釈説明を選択できる', async () => {
      const interpretation = canvas.getByRole('checkbox', {
        name: /解釈説明を有効にする/
      });
      await expect(interpretation).not.toBeChecked();
      await userEvent.click(interpretation);
      await expect(interpretation).toBeChecked();
    });
    await userEvent.click(canvas.getByRole('button', {
      name: '開始内容を確認'
    }));
    await step('ダイアログの開始サマリーでScenario概要、主人公、デバッグ設定を確認する', async () => {
      await waitFor(() => expect(canvas.getByRole('dialog', {
        name: '開始前の最終確認'
      })).toBeVisible());
      await expect(canvas.getByTestId('start-review-dialog')).toHaveAttribute('data-size', 'wide');
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('Scenario: 星喰いの地下図書館');
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('解釈説明: 有効（デバッグ）');
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('主人公: ミラ');
    });
    await step('修正を選ぶとダイアログを閉じて主人公選択へ戻れる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '主人公選択を修正'
      }));
      await expect(canvas.queryByRole('dialog', {
        name: '開始前の最終確認'
      })).not.toBeInTheDocument();
      await expect(canvas.getByRole('region', {
        name: '主人公確定'
      })).toBeVisible();
      await expect(canvas.getByRole('region', {
        name: 'イントロNarrative'
      })).toBeVisible();
    });
  }
}`,...(N=(F=p.parameters)==null?void 0:F.docs)==null?void 0:N.source}}};var O,j,W;B.parameters={...B.parameters,docs:{...(O=B.parameters)==null?void 0:O.docs,source:{originalSource:`{
  name: 'US-S05: セッションを正式に開始したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: '開始内容を確認'
    }));
    await step('確認ダイアログの「物語を始める」でSessionをActiveにし、US-P01のプレイ画面へ合流する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '物語を始める'
      }));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
      await expect(canvas.getByTestId('turn-1-narrative')).toHaveTextContent('水没した閲覧室');
      await expect(canvas.getByTestId('turn-1-narrative')).toHaveTextContent('銀の鍵');
      await expect(canvas.getByRole('status')).toHaveTextContent('イントロのみ');
      await expect(canvas.queryByRole('article', {
        name: 'Turn 02'
      })).not.toBeInTheDocument();
    });
  }
}`,...(W=(j=B.parameters)==null?void 0:j.docs)==null?void 0:W.source}}};const le=["USS01StartNewSessionFromScenario","USS02ReadIntroBeforeHero","USS03ConfirmHeroAfterIntro","USS03CreateHeroWithAiAssistance","USS03SelectHeroWithOptionalFreeGeneration","USS03FixedHeroIsReadOnly","USS04ReviewBeforeStarting","USS05BeginActiveSession"];export{r as USS01StartNewSessionFromScenario,l as USS02ReadIntroBeforeHero,y as USS03ConfirmHeroAfterIntro,w as USS03CreateHeroWithAiAssistance,v as USS03FixedHeroIsReadOnly,m as USS03SelectHeroWithOptionalFreeGeneration,p as USS04ReviewBeforeStarting,B as USS05BeginActiveSession,le as __namedExportsOrder,re as default};
