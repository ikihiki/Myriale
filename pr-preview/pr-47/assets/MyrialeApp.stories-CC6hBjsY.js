import{w as o,e as a,u as s}from"./index-C4S39nCK.js";import{M as Y}from"./MyrialeApp-CicqGpBw.js";import{c as i}from"./SessionPresentation-cUM_ZEXs.js";import{M as w}from"./MockSessionContainer-DjrkrTOM.js";import{M as F}from"./MockStartSessionContainer-D2aDKkwH.js";/* empty css               */import"./jsx-runtime-BO8uF4Og.js";import"./index-D4H_InIO.js";import"./AppChrome-Cb-Bi4JU.js";import"./Surfaces-CQIJcDfy.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BLjquTkO.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-C73OeBTK.js";import"./ModuleUiHost-Dq6FqUxM.js";import"./account-D2w1pibX.js";import"./scenarioWizardStyles-BR3QgEqM.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-E1lLWSiL.js";import"./SessionActivityFeed-Dum0r2zc.js";const le={title:"アプリ/Myriale app",component:Y,parameters:{notes:"統合アプリとして操作するStoryです。initialUrlで直接画面を開き、Redux風デモDBをseedします。"}},r={name:"トップページ: 中断セッションとおすすめシナリオ",args:{initialUrl:"/",initialDb:i("resumableSession"),startSessionContainer:F},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("トップページで今日の導線・中断Session・おすすめScenarioを確認する",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/"),await a(e.getByRole("main",{name:"Myrialeトップページ"})).toBeVisible(),await a(e.getByRole("heading",{name:"物語の机を、今日の続きに整える。"})).toBeVisible(),await a(e.getByRole("complementary",{name:"現在の活動概要"})).toHaveTextContent("再開できるセッション"),await a(e.getByRole("region",{name:"中断しているセッション"})).toHaveTextContent("星喰いの地下図書館"),await a(e.getByRole("region",{name:"おすすめのシナリオ"})).toHaveTextContent("灰の駅と宛名のない切符")}),await t("おすすめシナリオから開始すると一覧を挟まずイントロへ遷移する",async()=>{const d=o(e.getByTestId("home-scenario-SCN-STAR-LIBRARY"));await s.click(d.getByRole("button",{name:"このシナリオで開始"})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/start?scenarioId=SCN-STAR-LIBRARY"),await a(e.getByTestId("app-url")).not.toHaveTextContent("title="),await a(await e.findByRole("region",{name:"イントロNarrative"})).toBeVisible(),await a(e.getByTestId("selected-scenario-title")).toHaveTextContent("星喰いの地下図書館"),await s.click(e.getByRole("button",{name:"Myriale ホームへ"}))}),await t("主要導線から検索・新規作成・再開へ遷移できる",async()=>{await s.click(e.getByTestId("home-search-scenarios")),await a(e.getByTestId("app-url")).toHaveTextContent("/scenarios"),await s.click(e.getByRole("button",{name:"Myriale ホームへ"})),await s.click(e.getByTestId("home-create-scenario")),await a(e.getByTestId("app-url")).toHaveTextContent("/scenarios/new"),await s.click(e.getByRole("button",{name:"Myriale ホームへ"})),await s.click(e.getByRole("button",{name:"再開する"})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098/resume")})}},c={name:"統合アプリ: シナリオ選択からプレイ画面へ遷移する",args:{initialUrl:"/scenarios",initialDb:i("activeSession"),sessionContainer:w},play:async({canvasElement:n,step:t})=>{const e=o(n),d=o(n.ownerDocument.body);await t("URL風の状態からセッション開始画面を直接開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/scenarios"),await a(e.getByRole("region",{name:"シナリオ一覧"})).toBeVisible()}),await t("アプリ内ナビゲーションでプレイ画面へ移動し、統合版はイントロのみを表示する",async()=>{await s.click(e.getAllByRole("button",{name:"セッション"})[0]),await s.click(d.getByRole("menuitem",{name:/プレイ中の対話/})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(await e.findByTestId("dialogue-log")).toHaveTextContent("水没した閲覧室"),await a(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}},l={name:"URL直開き: プレイ中セッション",args:{initialUrl:"/sessions/SES-PREP-1098",initialDb:i("activeSession"),sessionContainer:w},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("URLとDB seedで目的画面を再現する",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route /sessions/SES-PREP-1098"),await a(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}},m={name:"E2E: API経由のSession作成と対話",args:{initialUrl:"/scenarios",initialDb:i("activeSession")}},p={name:"E2E: API経由のSession再読み込み",args:{initialUrl:"/sessions/SES-E2E-0001",initialDb:i("activeSession")}},y={name:"URL直開き: セッション中のLorebook管理",args:{initialUrl:"/sessions/SES-PREP-1098",initialDb:i("lorebook"),sessionContainer:w},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("ノート用DBをseedしてセッション画面内のLorebookを開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route /sessions/SES-PREP-1098"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("notes full"),await a(e.getByTestId("session-notes-full")).toHaveTextContent("月読ミナト")})}},u={name:"URL直開き: ユーザー管理",args:{initialUrl:"/account/admin/users",initialDb:i("adminUsers")},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("管理者向けデモDBでユーザー管理を開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/account/admin/users"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route /account/admin/users")})}},v={name:"URL直開き: 中断セッション再開",args:{initialUrl:"/sessions/SES-PREP-1098/resume",initialDb:i("resumableSession")},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("中断セッションの再開画面を直接開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098/resume"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route /sessions/SES-PREP-1098/resume")})}};var g,B,T;r.parameters={...r.parameters,docs:{...(g=r.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: 'トップページ: 中断セッションとおすすめシナリオ',
  args: {
    initialUrl: '/',
    initialDb: createDemoDb('resumableSession'),
    startSessionContainer: MockStartSessionContainer
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('トップページで今日の導線・中断Session・おすすめScenarioを確認する', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/');
      await expect(canvas.getByRole('main', {
        name: 'Myrialeトップページ'
      })).toBeVisible();
      await expect(canvas.getByRole('heading', {
        name: '物語の机を、今日の続きに整える。'
      })).toBeVisible();
      await expect(canvas.getByRole('complementary', {
        name: '現在の活動概要'
      })).toHaveTextContent('再開できるセッション');
      await expect(canvas.getByRole('region', {
        name: '中断しているセッション'
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
    await step('主要導線から検索・新規作成・再開へ遷移できる', async () => {
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
      await userEvent.click(canvas.getByRole('button', {
        name: '再開する'
      }));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098/resume');
    });
  }
}`,...(T=(B=r.parameters)==null?void 0:B.docs)==null?void 0:T.source}}};var S,R,E;c.parameters={...c.parameters,docs:{...(S=c.parameters)==null?void 0:S.docs,source:{originalSource:`{
  name: '統合アプリ: シナリオ選択からプレイ画面へ遷移する',
  args: {
    initialUrl: '/scenarios',
    initialDb: createDemoDb('activeSession'),
    sessionContainer: MockSessionContainer
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('URL風の状態からセッション開始画面を直接開く', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/scenarios');
      await expect(canvas.getByRole('region', {
        name: 'シナリオ一覧'
      })).toBeVisible();
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
  }
}`,...(E=(R=c.parameters)==null?void 0:R.docs)==null?void 0:E.source}}};var x,b,C;l.parameters={...l.parameters,docs:{...(x=l.parameters)==null?void 0:x.docs,source:{originalSource:`{
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
}`,...(C=(b=l.parameters)==null?void 0:b.docs)==null?void 0:C.source}}};var I,D,P;m.parameters={...m.parameters,docs:{...(I=m.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: 'E2E: API経由のSession作成と対話',
  args: {
    initialUrl: '/scenarios',
    initialDb: createDemoDb('activeSession')
  }
}`,...(P=(D=m.parameters)==null?void 0:D.docs)==null?void 0:P.source}}};var H,k,U;p.parameters={...p.parameters,docs:{...(H=p.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: 'E2E: API経由のSession再読み込み',
  args: {
    initialUrl: '/sessions/SES-E2E-0001',
    initialDb: createDemoDb('activeSession')
  }
}`,...(U=(k=p.parameters)==null?void 0:k.docs)==null?void 0:U.source}}};var h,L,A;y.parameters={...y.parameters,docs:{...(h=y.parameters)==null?void 0:h.docs,source:{originalSource:`{
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
}`,...(A=(L=y.parameters)==null?void 0:L.docs)==null?void 0:A.source}}};var M,f,N;u.parameters={...u.parameters,docs:{...(M=u.parameters)==null?void 0:M.docs,source:{originalSource:`{
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
}`,...(N=(f=u.parameters)==null?void 0:f.docs)==null?void 0:N.source}}};var V,O,q;v.parameters={...v.parameters,docs:{...(V=v.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: 'URL直開き: 中断セッション再開',
  args: {
    initialUrl: '/sessions/SES-PREP-1098/resume',
    initialDb: createDemoDb('resumableSession')
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('中断セッションの再開画面を直接開く', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098/resume');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route /sessions/SES-PREP-1098/resume');
    });
  }
}`,...(q=(O=v.parameters)==null?void 0:O.docs)==null?void 0:q.source}}};const me=["HomeDashboard","FullAppHappyPath","DirectOpenPlaySession","NetworkBackedSessionLifecycle","NetworkBackedSessionReload","DirectOpenLorebook","DirectOpenAdminUsers","RecoverableSessionDemo"];export{u as DirectOpenAdminUsers,y as DirectOpenLorebook,l as DirectOpenPlaySession,c as FullAppHappyPath,r as HomeDashboard,m as NetworkBackedSessionLifecycle,p as NetworkBackedSessionReload,v as RecoverableSessionDemo,me as __namedExportsOrder,le as default};
