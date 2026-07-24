import{w as o,e as a,u as s}from"./index-C4S39nCK.js";import{M as F}from"./MyrialeApp-B6dVSlb8.js";import{c as i}from"./SessionPresentation-CgKm7HXU.js";import{M as w}from"./MockSessionContainer-CaYcypJ6.js";import{M as _}from"./MockStartSessionContainer-B9sMoFR4.js";/* empty css               */import"./jsx-runtime-BO8uF4Og.js";import"./index-D4H_InIO.js";import"./AppChrome-D1WZMIQm.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BJ2tbK4f.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CtcPHE9S.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./ModuleUiHost-CoZk1x5n.js";import"./account-BQw43enD.js";import"./SessionListPresentation-DoQShwvc.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-CgkOYOr_.js";const me={title:"アプリ/Myriale app",component:F,parameters:{notes:"統合アプリとして操作するStoryです。initialUrlで直接画面を開き、Redux風デモDBをseedします。"}},c={name:"トップページ: 進行中セッションとおすすめシナリオ",args:{initialUrl:"/",initialDb:i("activeSession"),startSessionContainer:_},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("トップページで今日の導線・進行中Session・おすすめScenarioを確認する",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/"),await a(e.getByRole("main",{name:"Myrialeトップページ"})).toBeVisible(),await a(e.getByRole("heading",{name:"物語の机を、今日の続きに整える。"})).toBeVisible(),await a(e.getByRole("complementary",{name:"現在の活動概要"})).toHaveTextContent("進行中のセッション"),await a(e.getByRole("region",{name:"進行中のセッション"})).toHaveTextContent("星喰いの地下図書館"),await a(e.getByRole("region",{name:"おすすめのシナリオ"})).toHaveTextContent("灰の駅と宛名のない切符")}),await t("おすすめシナリオから開始すると一覧を挟まずイントロへ遷移する",async()=>{const r=o(e.getByTestId("home-scenario-SCN-STAR-LIBRARY"));await s.click(r.getByRole("button",{name:"このシナリオで開始"})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/start?scenarioId=SCN-STAR-LIBRARY"),await a(e.getByTestId("app-url")).not.toHaveTextContent("title="),await a(await e.findByRole("region",{name:"イントロNarrative"})).toBeVisible(),await a(e.getByTestId("selected-scenario-title")).toHaveTextContent("星喰いの地下図書館"),await s.click(e.getByRole("button",{name:"Myriale ホームへ"}))}),await t("主要導線から検索・新規作成・進行中セッションへ遷移できる",async()=>{await s.click(e.getByTestId("home-search-scenarios")),await a(e.getByTestId("app-url")).toHaveTextContent("/scenarios"),await s.click(e.getByRole("button",{name:"Myriale ホームへ"})),await s.click(e.getByTestId("home-create-scenario")),await a(e.getByTestId("app-url")).toHaveTextContent("/scenarios/new"),await s.click(e.getByRole("button",{name:"Myriale ホームへ"}));const r=o(e.getByTestId("home-session-SES-PREP-1098"));await s.click(r.getByRole("button",{name:"この物語に戻る"})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098")})}},l={name:"統合アプリ: シナリオ選択からプレイ画面へ遷移する",args:{initialUrl:"/sessions/SES-PREP-1098",initialDb:i("activeSession"),sessionContainer:w},play:async({canvasElement:n,step:t})=>{const e=o(n),r=o(n.ownerDocument.body);await t("URLから現在のプレイ中セッションを直接開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(await e.findByTestId("dialogue-log")).toHaveTextContent("水没した閲覧室")}),await t("アプリ内ナビゲーションでプレイ画面へ移動し、統合版はイントロのみを表示する",async()=>{await s.click(e.getAllByRole("button",{name:"セッション"})[0]),await s.click(r.getByRole("menuitem",{name:/プレイ中の対話/})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(await e.findByTestId("dialogue-log")).toHaveTextContent("水没した閲覧室"),await a(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()}),await t("パンくずのセッションからセッション一覧へ戻る",async()=>{const Y=o(e.getByRole("navigation",{name:"現在地"}));await s.click(Y.getByRole("button",{name:"セッション"})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions")})}},p={name:"URL直開き: プレイ中セッション",args:{initialUrl:"/sessions/SES-PREP-1098",initialDb:i("activeSession"),sessionContainer:w},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("URLとDB seedで目的画面を再現する",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route /sessions/SES-PREP-1098"),await a(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}},m={name:"E2E: API経由のSession作成と対話",args:{initialUrl:"/scenarios",initialDb:i("activeSession")}},y={name:"E2E: API経由のSession再読み込み",args:{initialUrl:"/sessions/SES-E2E-0001",initialDb:i("activeSession")}},d={name:"URL直開き: セッション中のLorebook管理",args:{initialUrl:"/sessions/SES-PREP-1098",initialDb:i("lorebook"),sessionContainer:w},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("ノート用DBをseedしてセッション画面内のLorebookを開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route /sessions/SES-PREP-1098"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("notes full"),await a(e.getByTestId("session-notes-full")).toHaveTextContent("月読ミナト")})}},v={name:"URL直開き: ユーザー管理",args:{initialUrl:"/account/admin/users",initialDb:i("adminUsers")},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("管理者向けデモDBでユーザー管理を開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/account/admin/users"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route /account/admin/users")})}},u={name:"URL直開き: 進行中セッションへ再参加",args:{initialUrl:"/sessions/SES-PREP-1098",initialDb:i("activeSession"),sessionContainer:w},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("セッションIDのURLから物語へ直接戻る",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route /sessions/SES-PREP-1098"),await a(await e.findByTestId("dialogue-log")).toBeVisible()})}};var g,S,T;c.parameters={...c.parameters,docs:{...(g=c.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: 'トップページ: 進行中セッションとおすすめシナリオ',
  args: {
    initialUrl: '/',
    initialDb: createDemoDb('activeSession'),
    startSessionContainer: MockStartSessionContainer
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('トップページで今日の導線・進行中Session・おすすめScenarioを確認する', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/');
      await expect(canvas.getByRole('main', {
        name: 'Myrialeトップページ'
      })).toBeVisible();
      await expect(canvas.getByRole('heading', {
        name: '物語の机を、今日の続きに整える。'
      })).toBeVisible();
      await expect(canvas.getByRole('complementary', {
        name: '現在の活動概要'
      })).toHaveTextContent('進行中のセッション');
      await expect(canvas.getByRole('region', {
        name: '進行中のセッション'
      })).toHaveTextContent('星喰いの地下図書館');
      await expect(canvas.getByRole('region', {
        name: 'おすすめのシナリオ'
      })).toHaveTextContent('灰の駅と宛名のない切符');
    });
    await step('おすすめシナリオから開始すると一覧を挟まずイントロへ遷移する', async () => {
      const recommended = within(canvas.getByTestId('home-scenario-SCN-STAR-LIBRARY'));
      await userEvent.click(recommended.getByRole('button', {
        name: 'このシナリオで開始'
      }));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/start?scenarioId=SCN-STAR-LIBRARY');
      await expect(canvas.getByTestId('app-url')).not.toHaveTextContent('title=');
      await expect(await canvas.findByRole('region', {
        name: 'イントロNarrative'
      })).toBeVisible();
      await expect(canvas.getByTestId('selected-scenario-title')).toHaveTextContent('星喰いの地下図書館');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Myriale ホームへ'
      }));
    });
    await step('主要導線から検索・新規作成・進行中セッションへ遷移できる', async () => {
      await userEvent.click(canvas.getByTestId('home-search-scenarios'));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/scenarios');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Myriale ホームへ'
      }));
      await userEvent.click(canvas.getByTestId('home-create-scenario'));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/scenarios/new');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Myriale ホームへ'
      }));
      const sessionCard = within(canvas.getByTestId('home-session-SES-PREP-1098'));
      await userEvent.click(sessionCard.getByRole('button', {
        name: 'この物語に戻る'
      }));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
    });
  }
}`,...(T=(S=c.parameters)==null?void 0:S.docs)==null?void 0:T.source}}};var B,E,R;l.parameters={...l.parameters,docs:{...(B=l.parameters)==null?void 0:B.docs,source:{originalSource:`{
  name: '統合アプリ: シナリオ選択からプレイ画面へ遷移する',
  args: {
    initialUrl: '/sessions/SES-PREP-1098',
    initialDb: createDemoDb('activeSession'),
    sessionContainer: MockSessionContainer
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('URLから現在のプレイ中セッションを直接開く', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(await canvas.findByTestId('dialogue-log')).toHaveTextContent('水没した閲覧室');
    });
    await step('アプリ内ナビゲーションでプレイ画面へ移動し、統合版はイントロのみを表示する', async () => {
      await userEvent.click(canvas.getAllByRole('button', {
        name: 'セッション'
      })[0]);
      await userEvent.click(screen.getByRole('menuitem', {
        name: /プレイ中の対話/
      }));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(await canvas.findByTestId('dialogue-log')).toHaveTextContent('水没した閲覧室');
      await expect(canvas.queryByRole('article', {
        name: 'Turn 02'
      })).not.toBeInTheDocument();
    });
    await step('パンくずのセッションからセッション一覧へ戻る', async () => {
      const breadcrumbs = within(canvas.getByRole('navigation', {
        name: '現在地'
      }));
      await userEvent.click(breadcrumbs.getByRole('button', {
        name: 'セッション'
      }));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions');
    });
  }
}`,...(R=(E=l.parameters)==null?void 0:E.docs)==null?void 0:R.source}}};var x,b,C;p.parameters={...p.parameters,docs:{...(x=p.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: 'URL直開き: プレイ中セッション',
  args: {
    initialUrl: '/sessions/SES-PREP-1098',
    initialDb: createDemoDb('activeSession'),
    sessionContainer: MockSessionContainer
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('URLとDB seedで目的画面を再現する', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route /sessions/SES-PREP-1098');
      await expect(canvas.queryByRole('article', {
        name: 'Turn 02'
      })).not.toBeInTheDocument();
    });
  }
}`,...(C=(b=p.parameters)==null?void 0:b.docs)==null?void 0:C.source}}};var I,P,D;m.parameters={...m.parameters,docs:{...(I=m.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: 'E2E: API経由のSession作成と対話',
  args: {
    initialUrl: '/scenarios',
    initialDb: createDemoDb('activeSession')
  }
}`,...(D=(P=m.parameters)==null?void 0:P.docs)==null?void 0:D.source}}};var H,k,U;y.parameters={...y.parameters,docs:{...(H=y.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: 'E2E: API経由のSession再読み込み',
  args: {
    initialUrl: '/sessions/SES-E2E-0001',
    initialDb: createDemoDb('activeSession')
  }
}`,...(U=(k=y.parameters)==null?void 0:k.docs)==null?void 0:U.source}}};var h,L,f;d.parameters={...d.parameters,docs:{...(h=d.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: 'URL直開き: セッション中のLorebook管理',
  args: {
    initialUrl: '/sessions/SES-PREP-1098',
    initialDb: createDemoDb('lorebook'),
    sessionContainer: MockSessionContainer
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ノート用DBをseedしてセッション画面内のLorebookを開く', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route /sessions/SES-PREP-1098');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('notes full');
      await expect(canvas.getByTestId('session-notes-full')).toHaveTextContent('月読ミナト');
    });
  }
}`,...(f=(L=d.parameters)==null?void 0:L.docs)==null?void 0:f.source}}};var M,A,N;v.parameters={...v.parameters,docs:{...(M=v.parameters)==null?void 0:M.docs,source:{originalSource:`{
  name: 'URL直開き: ユーザー管理',
  args: {
    initialUrl: '/account/admin/users',
    initialDb: createDemoDb('adminUsers')
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('管理者向けデモDBでユーザー管理を開く', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/account/admin/users');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route /account/admin/users');
    });
  }
}`,...(N=(A=v.parameters)==null?void 0:A.docs)==null?void 0:N.source}}};var V,O,q;u.parameters={...u.parameters,docs:{...(V=u.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: 'URL直開き: 進行中セッションへ再参加',
  args: {
    initialUrl: '/sessions/SES-PREP-1098',
    initialDb: createDemoDb('activeSession'),
    sessionContainer: MockSessionContainer
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('セッションIDのURLから物語へ直接戻る', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route /sessions/SES-PREP-1098');
      await expect(await canvas.findByTestId('dialogue-log')).toBeVisible();
    });
  }
}`,...(q=(O=u.parameters)==null?void 0:O.docs)==null?void 0:q.source}}};const ye=["HomeDashboard","FullAppHappyPath","DirectOpenPlaySession","NetworkBackedSessionLifecycle","NetworkBackedSessionReload","DirectOpenLorebook","DirectOpenAdminUsers","RecoverableSessionDemo"];export{v as DirectOpenAdminUsers,d as DirectOpenLorebook,p as DirectOpenPlaySession,l as FullAppHappyPath,c as HomeDashboard,m as NetworkBackedSessionLifecycle,y as NetworkBackedSessionReload,u as RecoverableSessionDemo,ye as __namedExportsOrder,me as default};
