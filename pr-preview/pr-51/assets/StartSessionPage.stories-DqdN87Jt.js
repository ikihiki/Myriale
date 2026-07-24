import{j as S}from"./jsx-runtime-BO8uF4Og.js";import{w as c,e as a,u as o,a as x}from"./index-C4S39nCK.js";import{t as $,a as J,M as u}from"./MyrialeApp-CPFZFLKC.js";import{b as K,c as z}from"./SessionPresentation-C9XPT9Jt.js";import{u as Q,n as X,S as Z}from"./AppChrome-BaZraqhs.js";import{M as Y}from"./MockStartSessionContainer-8vKlmiO9.js";/* empty css               */import"./index-D4H_InIO.js";import"./Surfaces-xpIMDkG0.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BJ2tbK4f.js";import"./index-DzKAYa42.js";import"./ModuleUiHost-QlDy0LN2.js";import"./account-BQw43enD.js";import"./SessionListPresentation-BxuhmsOg.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-CMz3MXAB.js";import"./MyrialeMenu-CtcPHE9S.js";const ee={name:"霧野しおり",email:"reader@myriale.example",initials:"霧野",role:"プレイヤー"};function b(){const t=Q(),{db:n}=K(),e=Object.values(n.scenarios).map($),s=(i,d)=>{if(t){i==="startSession"?t(i,{query:{scenarioId:d??""}}):i==="scenarioEdit"?t(i,{scenarioId:d??""}):t(i);return}X(Z[i])};return S.jsx(J,{account:ee,scenarios:e,status:"ready",onRetry:()=>{},onRegistration:()=>s("scenarioRegister"),onEdit:i=>s("scenarioEdit",i),onStart:i=>s("startSession",i),onLogout:()=>{}})}b.__docgenInfo={description:"",methods:[],displayName:"MockScenarioListContainer"};const de={title:"ユーザーストーリー/Start session",component:u,render:()=>S.jsx(u,{initialUrl:"/scenarios",initialDb:z("activeSession"),scenarioListContainer:b,startSessionContainer:Y}),parameters:{notes:"docs/user-stories/start-session.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},r=async(t,n="星喰いの地下図書館")=>{await o.click(t.getByRole("button",{name:`${n}で開始`})),await t.findByTestId("selected-scenario-title")},l={name:"US-S01: シナリオから新しいセッションを開始したい",play:async({canvasElement:t,step:n})=>{const e=c(t);await n("シナリオ一覧から対象Scenarioを確認し、登録導線も見える",async()=>{await a(e.getByRole("region",{name:"シナリオ一覧"})).toBeVisible(),await a(e.getByTestId("scenario-list")).toHaveTextContent("星喰いの地下図書館"),await a(e.getByRole("button",{name:"新しいシナリオを登録"})).toBeVisible(),await a(e.getAllByRole("button",{name:"編集"}).length).toBeGreaterThan(0),await a(e.getByRole("navigation",{name:"主要セクション"}).querySelector('[aria-current="page"]')).toHaveTextContent("ライブラリ"),await a(e.queryByRole("complementary",{name:"シナリオ登録導線"})).not.toBeInTheDocument()}),await n("Scenarioを選択すると、余分な状態表示を挟まずイントロと主人公選択を表示する",async()=>{await r(e),await a(e.getByTestId("selected-scenario-title")).toHaveTextContent("星喰いの地下図書館"),await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await a(e.queryByTestId("session-notice")).not.toBeInTheDocument(),await a(e.queryByRole("complementary",{name:"セッション状態サマリー"})).not.toBeInTheDocument()})}},y={name:"US-S02: セッション開始時にシナリオのイントロを見たい",play:async({canvasElement:t,step:n})=>{const e=c(t);c(t.ownerDocument.body),await r(e),await n("Preparing状態で、主人公未確定のイントロNarrativeを読む",async()=>{await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await a(e.getByTestId("intro-narrative")).toHaveTextContent("あなたは水没した閲覧室で目を覚ます。"),await a(e.getByTestId("intro-narrative")).not.toHaveTextContent("名もなき旅人")}),await n("同じページで主人公選択ができる",async()=>{await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible()})}},m={name:"US-S03: イントロ後に主人公を確定したい",play:async({canvasElement:t,step:n})=>{const e=c(t),s=c(t.ownerDocument.body);await r(e),await n("イントロと同じページで候補を選び、Session固有データとして確定する",async()=>{await o.click(e.getByRole("combobox",{name:"候補キャラクター"})),await a(s.queryByRole("option",{name:"自由生成"})).not.toBeInTheDocument(),await o.click(await s.findByRole("option",{name:"エル / 記憶を失った写字生"})),await a(e.getByLabelText("主人公の名前")).toHaveValue("エル"),await a(e.getByLabelText("主人公の名前")).toHaveAttribute("readonly"),await a(e.getByLabelText("主人公プロフィール")).toHaveValue("記憶を失った写字生"),await a(e.getByLabelText("主人公プロフィール")).toHaveAttribute("readonly"),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await x(()=>a(e.getByRole("dialog",{name:"開始前の最終確認"})).toBeVisible()),await a(e.getByTestId("start-summary")).toHaveTextContent("エル / 記憶を失った写字生")})}},w={name:"US-S03C/D: 主人公を作成し、AI案は確認してから確定する",play:async({canvasElement:t,step:n})=>{const e=c(t);await r(e,"灰の駅と宛名のない切符"),await n("自由生成が許可されたシナリオでは、名前とプロフィールを最初から編集できる",async()=>{await a(e.queryByRole("combobox",{name:"主人公の扱い"})).not.toBeInTheDocument(),await o.clear(e.getByLabelText("主人公の名前")),await o.type(e.getByLabelText("主人公の名前"),"ユイ"),await a(e.getByLabelText("主人公の名前")).toHaveValue("ユイ")}),await n("AI生成ボタンはフォームを補助するだけで、自動確定しない",async()=>{await o.click(e.getByRole("button",{name:"AIに主人公を生成してもらう"})),await a(e.getByLabelText("主人公の名前")).toHaveValue("ノクト"),await a(e.getByRole("status")).toHaveTextContent("確認・修正してから確定"),await a(e.getByRole("button",{name:"開始内容を確認"})).toBeVisible()})}},p={name:"US-S03B: 選択式で許可された場合だけ自由生成へ切り替える",render:()=>S.jsx(u,{initialUrl:"/scenarios",initialDb:z("activeSession"),scenarioListContainer:b,startSessionContainer:Y}),play:async({canvasElement:t,step:n})=>{const e=c(t);await r(e,"月虹の庭と眠らない時計"),await n("候補キャラクターの選択肢から、許可された自由生成へ切り替えられる",async()=>{const s=c(t.ownerDocument.body),i=e.getByRole("combobox",{name:"候補キャラクター"});await o.click(i),await o.click(await s.findByRole("option",{name:"自由生成"})),await a(i).toHaveTextContent("自由生成"),await x(()=>a(e.getByLabelText("主人公の名前")).toBeVisible()),await o.click(i),await o.click(await s.findByRole("option",{name:"カイ / 時計塔を修理する旅の技師"})),await a(e.getByLabelText("主人公の名前")).toHaveValue("カイ"),await a(e.getByLabelText("主人公の名前")).toHaveAttribute("readonly")})}},v={name:"US-S03A: 固定主人公は読み取り専用で表示する",play:async({canvasElement:t,step:n})=>{const e=c(t);await r(e,"硝子の森と夜明けの司書"),await n("固定主人公だけを表示し、選択や自由生成を許可しない",async()=>{await a(e.getByTestId("fixed-hero")).toBeVisible(),await a(e.getByLabelText("主人公の名前")).toHaveValue("リュシエン"),await a(e.getByLabelText("主人公の名前")).toHaveAttribute("readonly"),await a(e.getByLabelText("主人公プロフィール")).toHaveValue("夜明け前の森を巡る司書"),await a(e.getByLabelText("主人公プロフィール")).toHaveAttribute("readonly"),await a(e.queryByRole("combobox",{name:"候補キャラクター"})).not.toBeInTheDocument()})}},B={name:"US-S04: セッション開始前に内容を最終確認したい",play:async({canvasElement:t,step:n})=>{const e=c(t);await r(e),await n("権限があるPlayerだけがデバッグ用の解釈説明を選択できる",async()=>{const s=e.getByRole("checkbox",{name:/解釈説明を有効にする/});await a(s).not.toBeChecked(),await o.click(s),await a(s).toBeChecked()}),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await n("ダイアログの開始サマリーでScenario概要、主人公、デバッグ設定を確認する",async()=>{await x(()=>a(e.getByRole("dialog",{name:"開始前の最終確認"})).toBeVisible()),await a(e.getByTestId("start-review-dialog")).toHaveAttribute("data-size","wide"),await a(e.getByTestId("start-summary")).toHaveTextContent("Scenario: 星喰いの地下図書館"),await a(e.getByTestId("start-summary")).toHaveTextContent("解釈説明: 有効（デバッグ）"),await a(e.getByTestId("start-summary")).toHaveTextContent("主人公: ミラ")}),await n("修正を選ぶとダイアログを閉じて主人公選択へ戻れる",async()=>{await o.click(e.getByRole("button",{name:"主人公選択を修正"})),await a(e.queryByRole("dialog",{name:"開始前の最終確認"})).not.toBeInTheDocument(),await a(e.getByRole("region",{name:"主人公確定"})).toBeVisible(),await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible()})}},g={name:"US-S05: セッションを正式に開始したい",play:async({canvasElement:t,step:n})=>{const e=c(t);await r(e),await o.click(e.getByRole("button",{name:"開始内容を確認"})),await n("API未設定では架空のSessionへfallbackせず、明示的なエラーを表示する",async()=>{await o.click(e.getByRole("button",{name:"物語を始める"})),await a(e.getByRole("alert")).toHaveTextContent("Session APIが設定されていません"),await a(e.getByTestId("app-url")).not.toHaveTextContent("/sessions/SES-PREP-1098"),await a(e.queryByTestId("session-state")).not.toBeInTheDocument()})}};var T,R,I;l.parameters={...l.parameters,docs:{...(T=l.parameters)==null?void 0:T.docs,source:{originalSource:`{
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
      await expect(canvas.getAllByRole('button', {
        name: '編集'
      }).length).toBeGreaterThan(0);
      await expect(canvas.getByRole('navigation', {
        name: '主要セクション'
      }).querySelector('[aria-current="page"]')).toHaveTextContent('ライブラリ');
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
}`,...(I=(R=l.parameters)==null?void 0:R.docs)==null?void 0:I.source}}};var H,C,h;y.parameters={...y.parameters,docs:{...(H=y.parameters)==null?void 0:H.docs,source:{originalSource:`{
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
}`,...(h=(C=y.parameters)==null?void 0:C.docs)==null?void 0:h.source}}};var k,E,V;m.parameters={...m.parameters,docs:{...(k=m.parameters)==null?void 0:k.docs,source:{originalSource:`{
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
}`,...(V=(E=m.parameters)==null?void 0:E.docs)==null?void 0:V.source}}};var A,L,U;w.parameters={...w.parameters,docs:{...(A=w.parameters)==null?void 0:A.docs,source:{originalSource:`{
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
}`,...(U=(L=w.parameters)==null?void 0:L.docs)==null?void 0:U.source}}};var D,f,P;p.parameters={...p.parameters,docs:{...(D=p.parameters)==null?void 0:D.docs,source:{originalSource:`{
  name: 'US-S03B: 選択式で許可された場合だけ自由生成へ切り替える',
  render: () => <MyrialeApp initialUrl="/scenarios" initialDb={createDemoDb('activeSession')} scenarioListContainer={MockScenarioListContainer} startSessionContainer={MockStartSessionContainer} />,
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
}`,...(P=(f=p.parameters)==null?void 0:f.docs)==null?void 0:P.source}}};var q,N,F;v.parameters={...v.parameters,docs:{...(q=v.parameters)==null?void 0:q.docs,source:{originalSource:`{
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
}`,...(F=(N=v.parameters)==null?void 0:N.docs)==null?void 0:F.source}}};var M,O,j;B.parameters={...B.parameters,docs:{...(M=B.parameters)==null?void 0:M.docs,source:{originalSource:`{
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
}`,...(j=(O=B.parameters)==null?void 0:O.docs)==null?void 0:j.source}}};var _,G,W;g.parameters={...g.parameters,docs:{...(_=g.parameters)==null?void 0:_.docs,source:{originalSource:`{
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
    await step('API未設定では架空のSessionへfallbackせず、明示的なエラーを表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '物語を始める'
      }));
      await expect(canvas.getByRole('alert')).toHaveTextContent('Session APIが設定されていません');
      await expect(canvas.getByTestId('app-url')).not.toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(canvas.queryByTestId('session-state')).not.toBeInTheDocument();
    });
  }
}`,...(W=(G=g.parameters)==null?void 0:G.docs)==null?void 0:W.source}}};const Te=["USS01StartNewSessionFromScenario","USS02ReadIntroBeforeHero","USS03ConfirmHeroAfterIntro","USS03CreateHeroWithAiAssistance","USS03SelectHeroWithOptionalFreeGeneration","USS03FixedHeroIsReadOnly","USS04ReviewBeforeStarting","USS05BeginActiveSession"];export{l as USS01StartNewSessionFromScenario,y as USS02ReadIntroBeforeHero,m as USS03ConfirmHeroAfterIntro,w as USS03CreateHeroWithAiAssistance,v as USS03FixedHeroIsReadOnly,p as USS03SelectHeroWithOptionalFreeGeneration,B as USS04ReviewBeforeStarting,g as USS05BeginActiveSession,Te as __namedExportsOrder,de as default};
