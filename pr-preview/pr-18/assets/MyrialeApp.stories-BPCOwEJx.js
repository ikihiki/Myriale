import{w as s,e as a,u as m}from"./index-C3Z0PGzo.js";import{M as I,c as o}from"./MyrialeApp-DDas1-Wn.js";/* empty css               */import"./jsx-runtime-Cf8x2fCZ.js";import"./index-yBjzXJbu.js";import"./index-BlmOqGMO.js";import"./AppChrome-B5ZJ3NP-.js";import"./SessionTurn-DWZJ2ukf.js";import"./account-Cq75HoV1.js";const q={title:"Myriale app/Integrated app demo",component:I,parameters:{notes:"既存ワイヤーフレームを統合アプリとして操作するStoryです。initialUrlで直接画面を開き、Redux風デモDBをseedします。"}},i={name:"統合アプリ: シナリオ選択からプレイ画面へ遷移する",args:{initialUrl:"/sessions/start",initialDb:o("activeSession")},play:async({canvasElement:n,step:t})=>{const e=s(n);await t("URL風の状態からセッション開始画面を直接開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/start"),await a(e.getByRole("region",{name:"シナリオ一覧"})).toBeVisible()}),await t("アプリ内ナビゲーションでプレイ画面へ移動し、統合版はイントロのみを表示する",async()=>{await m.click(e.getByRole("button",{name:"セッション"})),await m.click(e.getByRole("menuitem",{name:/プレイ中の対話/})),await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098/play"),await a(e.getByTestId("dialogue-log")).toHaveTextContent("水没した閲覧室"),await a(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}},r={name:"URL直開き: プレイ中セッション",args:{initialUrl:"/sessions/SES-PREP-1098/play",initialDb:o("activeSession")},play:async({canvasElement:n,step:t})=>{const e=s(n);await t("URLとDB seedで目的画面を再現する",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098/play"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route playSession"),await a(e.queryByRole("article",{name:"Turn 02"})).not.toBeInTheDocument()})}},c={name:"URL直開き: セッション中のLorebook管理",args:{initialUrl:"/sessions/SES-PREP-1098/play",initialDb:o("lorebook")},play:async({canvasElement:n,step:t})=>{const e=s(n);await t("ノート用DBをseedしてセッション画面内のLorebookを開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098/play"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route playSession"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("notes full"),await a(e.getByTestId("session-notes-full")).toHaveTextContent("月読ミナト")})}},p={name:"URL直開き: ユーザー管理",args:{initialUrl:"/account/admin/users",initialDb:o("adminUsers")},play:async({canvasElement:n,step:t})=>{const e=s(n);await t("管理者向けデモDBでユーザー管理を開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/account/admin/users"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route adminUsers")})}},l={name:"URL直開き: 中断セッション再開",args:{initialUrl:"/sessions/SES-PREP-1098/resume",initialDb:o("resumableSession")},play:async({canvasElement:n,step:t})=>{const e=s(n);await t("中断セッションの再開画面を直接開く",async()=>{await a(e.getByTestId("app-url")).toHaveTextContent("/sessions/SES-PREP-1098/resume"),await a(e.getByTestId("app-db-summary")).toHaveTextContent("route resumeSession")})}};var y,u,d;i.parameters={...i.parameters,docs:{...(y=i.parameters)==null?void 0:y.docs,source:{originalSource:`{
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
    await step('URL風の状態からセッション開始画面を直接開く', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/start');
      await expect(canvas.getByRole('region', {
        name: 'シナリオ一覧'
      })).toBeVisible();
    });
    await step('アプリ内ナビゲーションでプレイ画面へ移動し、統合版はイントロのみを表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'セッション'
      }));
      await userEvent.click(canvas.getByRole('menuitem', {
        name: /プレイ中の対話/
      }));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098/play');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('水没した閲覧室');
      await expect(canvas.queryByRole('article', {
        name: 'Turn 02'
      })).not.toBeInTheDocument();
    });
  }
}`,...(d=(u=i.parameters)==null?void 0:u.docs)==null?void 0:d.source}}};var v,T,w;r.parameters={...r.parameters,docs:{...(v=r.parameters)==null?void 0:v.docs,source:{originalSource:`{
  name: 'URL直開き: プレイ中セッション',
  args: {
    initialUrl: '/sessions/SES-PREP-1098/play',
    initialDb: createDemoDb('activeSession')
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('URLとDB seedで目的画面を再現する', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098/play');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route playSession');
      await expect(canvas.queryByRole('article', {
        name: 'Turn 02'
      })).not.toBeInTheDocument();
    });
  }
}`,...(w=(T=r.parameters)==null?void 0:T.docs)==null?void 0:w.source}}};var g,S,B;c.parameters={...c.parameters,docs:{...(g=c.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: 'URL直開き: セッション中のLorebook管理',
  args: {
    initialUrl: '/sessions/SES-PREP-1098/play',
    initialDb: createDemoDb('lorebook')
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ノート用DBをseedしてセッション画面内のLorebookを開く', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098/play');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route playSession');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('notes full');
      await expect(canvas.getByTestId('session-notes-full')).toHaveTextContent('月読ミナト');
    });
  }
}`,...(B=(S=c.parameters)==null?void 0:S.docs)==null?void 0:B.source}}};var x,b,E;p.parameters={...p.parameters,docs:{...(x=p.parameters)==null?void 0:x.docs,source:{originalSource:`{
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
}`,...(E=(b=p.parameters)==null?void 0:b.docs)==null?void 0:E.source}}};var D,R,P;l.parameters={...l.parameters,docs:{...(D=l.parameters)==null?void 0:D.docs,source:{originalSource:`{
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
}`,...(P=(R=l.parameters)==null?void 0:R.docs)==null?void 0:P.source}}};const M=["FullAppHappyPath","DirectOpenPlaySession","DirectOpenLorebook","DirectOpenAdminUsers","RecoverableSessionDemo"];export{p as DirectOpenAdminUsers,c as DirectOpenLorebook,r as DirectOpenPlaySession,i as FullAppHappyPath,l as RecoverableSessionDemo,M as __namedExportsOrder,q as default};
