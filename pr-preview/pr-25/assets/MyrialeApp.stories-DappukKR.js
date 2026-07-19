import{w as o,e as a,u as s}from"./index-C3Z0PGzo.js";import{M as k,c as i}from"./MyrialeApp-CfOFfhnU.js";/* empty css               */import"./jsx-runtime-BO8uF4Og.js";import"./index-D4H_InIO.js";import"./AppChrome-rTXYFIQu.js";import"./MyrialeToggle-9z9YzCAE.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-Za2vh9EI.js";import"./WizardNavigation-_WVmaYVB.js";import"./SessionTurn-CnU6KSUh.js";import"./account-CnHKn01-.js";const z={title:"アプリ/Myriale app",component:k,parameters:{notes:"統合アプリとして操作するStoryです。initialUrlで直接画面を開き、Redux風デモDBをseedします。"}},r={name:"トップページ: 中断セッションとおすすめシナリオ",args:{initialUrl:"/",initialDb:i("resumableSession")},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("トップページで今日の導線・中断Session・おすすめScenarioを確認する",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/"),await a(e.getByRole("main",{name:"Myrialeトップページ"})).toBeVisible(),await a(e.getByRole("heading",{name:"物語の机を、今日の続きに整える。"})).toBeVisible(),await a(e.getByRole("complementary",{name:"現在の活動概要"})).toHaveTextContent("再開できるセッション"),await a(e.getByRole("region",{name:"中断しているセッション"})).toHaveTextContent("星喰いの地下図書館"),await a(e.getByRole("region",{name:"おすすめのシナリオ"})).toHaveTextContent("灰の駅と宛名のない切符")}),await t("おすすめシナリオから開始すると一覧を挟まずイントロへ遷移する",async()=>{const u=o(e.getByTestId("home-scenario-SCN-STAR-LIBRARY"));await s.click(u.getByRole("button",{name:"このシナリオで開始"})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/start?"),await a(e.getByTestId("app-url")).toHaveTextContent("scenarioId=SCN-STAR-LIBRARY"),await a(e.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await a(e.getByTestId("selected-scenario-title")).toHaveTextContent("星喰いの地下図書館"),await s.click(e.getByRole("button",{name:"Myriale ホームへ"}))}),await t("主要導線から検索・新規作成・再開へ遷移できる",async()=>{await s.click(e.getByTestId("home-search-scenarios")),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/start"),await s.click(e.getByRole("button",{name:"Myriale ホームへ"})),await s.click(e.getByTestId("home-create-scenario")),await a(e.getByTestId("app-url")).toHaveTextContent("/scenarios/new"),await s.click(e.getByRole("button",{name:"Myriale ホームへ"})),await s.click(e.getByRole("button",{name:"再開する"})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098/resume")})}},c={name:"統合アプリ: シナリオ選択からプレイ画面へ遷移する",args:{initialUrl:"/sessions/start",initialDb:i("activeSession")},play:async({canvasElement:n,step:t})=>{const e=o(n),u=o(n.ownerDocument.body);await t("URL風の状態からセッション開始画面を直接開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/start"),await a(e.getByRole("region",{name:"シナリオ一覧"})).toBeVisible()}),await t("アプリ内ナビゲーションでプレイ画面へ移動し、統合版はイントロのみを表示する",async()=>{await s.click(e.getAllByRole("button",{name:"セッション"})[0]),await s.click(u.getByRole("menuitem",{name:/プレイ中の対話/})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(e.getByTestId("dialogue-log")).toHaveTextContent("水没した閲覧室"),await a(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}},l={name:"URL直開き: プレイ中セッション",args:{initialUrl:"/sessions/SES-PREP-1098",initialDb:i("activeSession")},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("URLとDB seedで目的画面を再現する",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route playSession"),await a(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}},p={name:"URL直開き: セッション中のLorebook管理",args:{initialUrl:"/sessions/SES-PREP-1098",initialDb:i("lorebook")},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("ノート用DBをseedしてセッション画面内のLorebookを開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route playSession"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("notes full"),await a(e.getByTestId("session-notes-full")).toHaveTextContent("月読ミナト")})}},m={name:"URL直開き: ユーザー管理",args:{initialUrl:"/account/admin/users",initialDb:i("adminUsers")},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("管理者向けデモDBでユーザー管理を開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/account/admin/users"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route adminUsers")})}},y={name:"URL直開き: 中断セッション再開",args:{initialUrl:"/sessions/SES-PREP-1098/resume",initialDb:i("resumableSession")},play:async({canvasElement:n,step:t})=>{const e=o(n);await t("中断セッションの再開画面を直接開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098/resume"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route resumeSession")})}};var v,d,w;r.parameters={...r.parameters,docs:{...(v=r.parameters)==null?void 0:v.docs,source:{originalSource:`{
  name: 'トップページ: 中断セッションとおすすめシナリオ',
  args: {
    initialUrl: '/',
    initialDb: createDemoDb('resumableSession')
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
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/start?');
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('scenarioId=SCN-STAR-LIBRARY');
      await expect(canvas.getByRole('region', {
        name: 'イントロNarrative'
      })).toBeVisible();
      await expect(canvas.getByTestId('selected-scenario-title')).toHaveTextContent('星喰いの地下図書館');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Myriale ホームへ'
      }));
    });
    await step('主要導線から検索・新規作成・再開へ遷移できる', async () => {
      await userEvent.click(canvas.getByTestId('home-search-scenarios'));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/start');
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
}`,...(w=(d=r.parameters)==null?void 0:d.docs)==null?void 0:w.source}}};var g,T,B;c.parameters={...c.parameters,docs:{...(g=c.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: '統合アプリ: シナリオ選択からプレイ画面へ遷移する',
  args: {
    initialUrl: '/sessions/start',
    initialDb: createDemoDb('activeSession')
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('URL風の状態からセッション開始画面を直接開く', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/start');
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
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('水没した閲覧室');
      await expect(canvas.queryByRole('article', {
        name: 'Turn 02'
      })).not.toBeInTheDocument();
    });
  }
}`,...(B=(T=c.parameters)==null?void 0:T.docs)==null?void 0:B.source}}};var x,R,S;l.parameters={...l.parameters,docs:{...(x=l.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: 'URL直開き: プレイ中セッション',
  args: {
    initialUrl: '/sessions/SES-PREP-1098',
    initialDb: createDemoDb('activeSession')
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('URLとDB seedで目的画面を再現する', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route playSession');
      await expect(canvas.queryByRole('article', {
        name: 'Turn 02'
      })).not.toBeInTheDocument();
    });
  }
}`,...(S=(R=l.parameters)==null?void 0:R.docs)==null?void 0:S.source}}};var b,I,E;p.parameters={...p.parameters,docs:{...(b=p.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: 'URL直開き: セッション中のLorebook管理',
  args: {
    initialUrl: '/sessions/SES-PREP-1098',
    initialDb: createDemoDb('lorebook')
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ノート用DBをseedしてセッション画面内のLorebookを開く', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route playSession');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('notes full');
      await expect(canvas.getByTestId('session-notes-full')).toHaveTextContent('月読ミナト');
    });
  }
}`,...(E=(I=p.parameters)==null?void 0:I.docs)==null?void 0:E.source}}};var C,H,D;m.parameters={...m.parameters,docs:{...(C=m.parameters)==null?void 0:C.docs,source:{originalSource:`{
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
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route adminUsers');
    });
  }
}`,...(D=(H=m.parameters)==null?void 0:H.docs)==null?void 0:D.source}}};var P,U,h;y.parameters={...y.parameters,docs:{...(P=y.parameters)==null?void 0:P.docs,source:{originalSource:`{
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
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route resumeSession');
    });
  }
}`,...(h=(U=y.parameters)==null?void 0:U.docs)==null?void 0:h.source}}};const G=["HomeDashboard","FullAppHappyPath","DirectOpenPlaySession","DirectOpenLorebook","DirectOpenAdminUsers","RecoverableSessionDemo"];export{m as DirectOpenAdminUsers,p as DirectOpenLorebook,l as DirectOpenPlaySession,c as FullAppHappyPath,r as HomeDashboard,y as RecoverableSessionDemo,G as __namedExportsOrder,z as default};
