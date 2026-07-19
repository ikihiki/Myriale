import{j}from"./jsx-runtime-BO8uF4Og.js";import{w as i,e as a,u as o,a as p}from"./index-DwFX8Wt9.js";import{M as u,c as W}from"./MyrialeApp-D5UnQMKJ.js";/* empty css               */import"./index-D4H_InIO.js";import"./MyrialeToggle-Cu4mkWU9.js";import"./index-DzKAYa42.js";import"./AppChrome-BVb5UrEk.js";import"./MyrialeMenu-FzkaUt8s.js";import"./account-DPjXj8MC.js";import"./WizardNavigation-_WVmaYVB.js";import"./SessionTurn-CnU6KSUh.js";const te={title:"ユーザーストーリー/Start session",component:u,render:()=>j.jsx(u,{initialUrl:"/scenarios",initialDb:W("activeSession")}),parameters:{notes:"docs/user-stories/start-session.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},s=async(n,t="星喰いの地下図書館")=>{await o.click(n.getByRole("button",{name:`${t}で開始`})),await n.findByTestId("selected-scenario-title")},c={name:"US-S01: シナリオから新しいセッションを開始したい",play:async({canvasElement:n,step:t})=>{const e=i(n);await t("シナリオ一覧から対象Scenarioを確認し、登録導線も見える",async()=>{await a(e.getByRole("region",{name:"シナリオ一覧"})).toBeVisible(),await a(e.getByTestId("scenario-list")).toHaveTextContent("星喰いの地下図書館"),await a(e.getByRole("button",{name:"新しいシナリオを登録"})).toBeVisible(),await a(e.queryByRole("complementary",{name:"シナリオ登録導線"})).not.toBeInTheDocument()}),await t("Scenarioを選択すると、余分な状態表示を挟まずイントロと主人公選択を表示する",async()=>{await s(e),await a(e.getByTestId("selected-scenario-title")).toHaveTextContent("星喰いの地下図書館"),await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await a(e.queryByTestId("session-notice")).not.toBeInTheDocument(),await a(e.queryByRole("complementary",{name:"セッション状態サマリー"})).not.toBeInTheDocument()})}},r={name:"US-S02: セッション開始時にシナリオのイントロを見たい",play:async({canvasElement:n,step:t})=>{const e=i(n);i(n.ownerDocument.body),await s(e),await t("Preparing状態で、主人公未確定のイントロNarrativeを読む",async()=>{await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await a(e.getByTestId("intro-narrative")).toHaveTextContent("あなたは水没した閲覧室"),await a(e.getByTestId("intro-narrative")).toHaveTextContent("名もなき旅人")}),await t("同じページで主人公選択ができる",async()=>{await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible()})}},l={name:"US-S03: イントロ後に主人公を確定したい",play:async({canvasElement:n,step:t})=>{const e=i(n),M=i(n.ownerDocument.body);await s(e),await t("イントロと同じページで候補を選び、Session固有データとして確定する",async()=>{await a(e.queryByRole("button",{name:"自由生成する"})).not.toBeInTheDocument(),await o.click(e.getByRole("combobox",{name:"候補キャラクター"})),await o.click(await M.findByRole("option",{name:"エル / 記憶を失った写字生"})),await a(e.getByLabelText("主人公の名前")).toHaveValue("エル"),await a(e.getByLabelText("主人公の名前")).toHaveAttribute("readonly"),await a(e.getByLabelText("主人公プロフィール")).toHaveValue("記憶を失った写字生"),await a(e.getByLabelText("主人公プロフィール")).toHaveAttribute("readonly"),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await p(()=>a(e.getByRole("dialog",{name:"開始前の最終確認"})).toBeVisible()),await a(e.getByTestId("start-summary")).toHaveTextContent("エル / 記憶を失った写字生")})}},y={name:"US-S03C/D: 主人公を作成し、AI案は確認してから確定する",play:async({canvasElement:n,step:t})=>{const e=i(n);await s(e,"灰の駅と宛名のない切符"),await t("自由生成が許可されたシナリオでは、名前とプロフィールを最初から編集できる",async()=>{await a(e.queryByRole("combobox",{name:"主人公の扱い"})).not.toBeInTheDocument(),await o.clear(e.getByLabelText("主人公の名前")),await o.type(e.getByLabelText("主人公の名前"),"ユイ"),await a(e.getByLabelText("主人公の名前")).toHaveValue("ユイ")}),await t("AI生成ボタンはフォームを補助するだけで、自動確定しない",async()=>{await o.click(e.getByRole("button",{name:"AIに主人公を生成してもらう"})),await a(e.getByLabelText("主人公の名前")).toHaveValue("ノクト"),await a(e.getByRole("status")).toHaveTextContent("確認・修正してから確定"),await a(e.getByRole("button",{name:"開始内容を確認"})).toBeVisible()})}},m={name:"US-S03B: 選択式で許可された場合だけ自由生成へ切り替える",render:()=>j.jsx(u,{initialUrl:"/scenarios",initialDb:W("activeSession")}),play:async({canvasElement:n,step:t})=>{const e=i(n);await s(e,"月虹の庭と眠らない時計"),await t("候補選択を維持したまま、許可された自由生成へ切り替えられる",async()=>{await a(e.getByRole("combobox",{name:"候補キャラクター"})).toBeVisible(),await o.click(e.getByRole("button",{name:"自由生成する"})),await p(()=>a(e.getByLabelText("主人公の名前")).toBeVisible()),await a(e.queryByRole("combobox",{name:"候補キャラクター"})).not.toBeInTheDocument(),await o.click(e.getByRole("button",{name:"候補から選ぶ"})),await p(()=>a(e.getByRole("combobox",{name:"候補キャラクター"})).toBeVisible())})}},w={name:"US-S03A: 固定主人公は読み取り専用で表示する",play:async({canvasElement:n,step:t})=>{const e=i(n);await s(e,"硝子の森と夜明けの司書"),await t("固定主人公だけを表示し、選択や自由生成を許可しない",async()=>{await a(e.getByTestId("fixed-hero")).toBeVisible(),await a(e.getByLabelText("主人公の名前")).toHaveValue("リュシエン"),await a(e.getByLabelText("主人公の名前")).toHaveAttribute("readonly"),await a(e.getByLabelText("主人公プロフィール")).toHaveValue("夜明け前の森を巡る司書"),await a(e.getByLabelText("主人公プロフィール")).toHaveAttribute("readonly"),await a(e.queryByRole("combobox",{name:"候補キャラクター"})).not.toBeInTheDocument(),await a(e.queryByRole("button",{name:"自由生成する"})).not.toBeInTheDocument()})}},v={name:"US-S04: セッション開始前に内容を最終確認したい",play:async({canvasElement:n,step:t})=>{const e=i(n);await s(e),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await t("ダイアログの開始サマリーでScenario概要と主人公を確認する",async()=>{await p(()=>a(e.getByRole("dialog",{name:"開始前の最終確認"})).toBeVisible()),await a(e.getByTestId("start-summary")).toHaveTextContent("Scenario: 星喰いの地下図書館"),await a(e.getByTestId("start-summary")).toHaveTextContent("主人公: ミラ")}),await t("修正を選ぶとダイアログを閉じて主人公選択へ戻れる",async()=>{await o.click(e.getByRole("button",{name:"主人公選択を修正"})),await a(e.queryByRole("dialog",{name:"開始前の最終確認"})).not.toBeInTheDocument(),await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible()})}},B={name:"US-S05: セッションを正式に開始したい",play:async({canvasElement:n,step:t})=>{const e=i(n);await s(e),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await t("確認ダイアログの「物語を始める」でSessionをActiveにし、US-P01のプレイ画面へ合流する",async()=>{await o.click(e.getByRole("button",{name:"物語を始める"})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(e.getByTestId("session-state")).toHaveTextContent("Active"),await a(e.getByTestId("turn-1-narrative")).toHaveTextContent("水没した閲覧室"),await a(e.getByTestId("turn-1-narrative")).toHaveTextContent("銀の鍵"),await a(e.getByRole("status")).toHaveTextContent("イントロのみ"),await a(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}};var g,x,b;c.parameters={...c.parameters,docs:{...(g=c.parameters)==null?void 0:g.docs,source:{originalSource:`{
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
}`,...(b=(x=c.parameters)==null?void 0:x.docs)==null?void 0:b.source}}};var S,T,d;r.parameters={...r.parameters,docs:{...(S=r.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
      await expect(canvas.getByTestId('intro-narrative')).toHaveTextContent('あなたは水没した閲覧室');
      await expect(canvas.getByTestId('intro-narrative')).toHaveTextContent('名もなき旅人');
    });
    await step('同じページで主人公選択ができる', async () => {
      await expect(canvas.getByRole('region', {
        name: '主人公確定'
      })).toBeVisible();
    });
  }
}`,...(d=(T=r.parameters)==null?void 0:T.docs)==null?void 0:d.source}}};var R,I,H;l.parameters={...l.parameters,docs:{...(R=l.parameters)==null?void 0:R.docs,source:{originalSource:`{
  name: 'US-S03: イントロ後に主人公を確定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await startPreparing(canvas);
    await step('イントロと同じページで候補を選び、Session固有データとして確定する', async () => {
      await expect(canvas.queryByRole('button', {
        name: '自由生成する'
      })).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole('combobox', {
        name: '候補キャラクター'
      }));
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
}`,...(H=(I=l.parameters)==null?void 0:I.docs)==null?void 0:H.source}}};var V,h,U;y.parameters={...y.parameters,docs:{...(V=y.parameters)==null?void 0:V.docs,source:{originalSource:`{
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
}`,...(U=(h=y.parameters)==null?void 0:h.docs)==null?void 0:U.source}}};var E,D,C;m.parameters={...m.parameters,docs:{...(E=m.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: 'US-S03B: 選択式で許可された場合だけ自由生成へ切り替える',
  render: () => <MyrialeApp initialUrl="/scenarios" initialDb={createDemoDb('activeSession')} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas, '月虹の庭と眠らない時計');
    await step('候補選択を維持したまま、許可された自由生成へ切り替えられる', async () => {
      await expect(canvas.getByRole('combobox', {
        name: '候補キャラクター'
      })).toBeVisible();
      await userEvent.click(canvas.getByRole('button', {
        name: '自由生成する'
      }));
      await waitFor(() => expect(canvas.getByLabelText('主人公の名前')).toBeVisible());
      await expect(canvas.queryByRole('combobox', {
        name: '候補キャラクター'
      })).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole('button', {
        name: '候補から選ぶ'
      }));
      await waitFor(() => expect(canvas.getByRole('combobox', {
        name: '候補キャラクター'
      })).toBeVisible());
    });
  }
}`,...(C=(D=m.parameters)==null?void 0:D.docs)==null?void 0:C.source}}};var A,L,k;w.parameters={...w.parameters,docs:{...(A=w.parameters)==null?void 0:A.docs,source:{originalSource:`{
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
      await expect(canvas.queryByRole('button', {
        name: '自由生成する'
      })).not.toBeInTheDocument();
    });
  }
}`,...(k=(L=w.parameters)==null?void 0:L.docs)==null?void 0:k.source}}};var q,f,P;v.parameters={...v.parameters,docs:{...(q=v.parameters)==null?void 0:q.docs,source:{originalSource:`{
  name: 'US-S04: セッション開始前に内容を最終確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: '開始内容を確認'
    }));
    await step('ダイアログの開始サマリーでScenario概要と主人公を確認する', async () => {
      await waitFor(() => expect(canvas.getByRole('dialog', {
        name: '開始前の最終確認'
      })).toBeVisible());
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('Scenario: 星喰いの地下図書館');
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
}`,...(P=(f=v.parameters)==null?void 0:f.docs)==null?void 0:P.source}}};var F,N,O;B.parameters={...B.parameters,docs:{...(F=B.parameters)==null?void 0:F.docs,source:{originalSource:`{
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
}`,...(O=(N=B.parameters)==null?void 0:N.docs)==null?void 0:O.source}}};const ne=["USS01StartNewSessionFromScenario","USS02ReadIntroBeforeHero","USS03ConfirmHeroAfterIntro","USS03CreateHeroWithAiAssistance","USS03SelectHeroWithOptionalFreeGeneration","USS03FixedHeroIsReadOnly","USS04ReviewBeforeStarting","USS05BeginActiveSession"];export{c as USS01StartNewSessionFromScenario,r as USS02ReadIntroBeforeHero,l as USS03ConfirmHeroAfterIntro,y as USS03CreateHeroWithAiAssistance,w as USS03FixedHeroIsReadOnly,m as USS03SelectHeroWithOptionalFreeGeneration,v as USS04ReviewBeforeStarting,B as USS05BeginActiveSession,ne as __namedExportsOrder,te as default};
