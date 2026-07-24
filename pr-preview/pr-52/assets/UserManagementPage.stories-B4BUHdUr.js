import{j as Te}from"./jsx-runtime-BO8uF4Og.js";import{w as s,u as t,e as a}from"./index-C4S39nCK.js";import{M as h}from"./MyrialeApp-BaWx72IT.js";import{c as Ve}from"./SessionPresentation-B4OeLPnd.js";import"./account-BQw43enD.js";import"./index-D4H_InIO.js";import"./AppChrome-CG0vUER4.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BJ2tbK4f.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CtcPHE9S.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./ModuleUiHost-CoZk1x5n.js";import"./SessionListPresentation-DJixzVRp.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-CgkOYOr_.js";const he={register:"/account/register","verify-email":"/account/register?view=verify-email",login:"/account/login",reset:"/account/reset-password",oauth:"/account/oauth",profile:"/account/profile","profile-edit":"/account/profile/edit",security:"/account/security",export:"/account/export",withdraw:"/account/withdraw","admin-list":"/account/admin/users","admin-detail":"/account/admin/users/USR-1088","admin-ai-keys":"/admin",audit:"/account/admin/audit-log"},qe={title:"ユーザーストーリー/User management",component:h,render:i=>Te.jsx(h,{initialUrl:he[i.initialView??"register"],initialDb:Ve("adminUsers")}),parameters:{layout:"fullscreen",notes:"ユーザー管理Markdown要件は変更せず、Storybook story/play function としてユーザー導線を表現します。"}},o={name:"US-UM01: 新規登録したい（メール/パスワード）",args:{initialView:"register"},play:async({canvasElement:i,step:n})=>{const e=s(i);await n("要件未満のパスワードは拒否される",async()=>{await t.type(e.getByLabelText("表示名"),"新しい旅人"),await t.type(e.getByLabelText("メールアドレス"),"new-reader@example.com"),await t.type(e.getByTestId("register-password"),"short"),await t.click(e.getByRole("button",{name:"登録する"})),await a(e.getByTestId("um-notice")).toHaveTextContent("要件を満たしていません")}),await n("要件を満たすとUserIdが発行されプロフィールへ進む",async()=>{await t.clear(e.getByTestId("register-password")),await t.type(e.getByTestId("register-password"),"letters1"),await t.type(e.getByLabelText("パスワード（確認）"),"letters1"),await t.click(e.getByRole("button",{name:"登録する"})),await a(e.getByRole("region",{name:"プロフィール"})).toBeVisible(),await a(e.getByTestId("issued-user-id")).toHaveTextContent("USR-2F9A")})}},c={name:"US-UM02: メール確認をしたい（Phase 2）",args:{initialView:"verify-email"}},m={name:"US-UM03: ログインしたい（メール/パスワード）",args:{initialView:"login"},play:async({canvasElement:i,step:n})=>{const e=s(i);await n("Identity cookieセッションを開始し、戻り先がなければホームへ進む",async()=>{await t.clear(e.getByLabelText("メールアドレス")),await t.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await t.type(e.getByTestId("login-password"),"a"),await t.click(e.getByRole("button",{name:"ログインする"})),await a(await e.findByRole("main",{name:"Myrialeトップページ"})).toBeVisible(),await a(e.getByTestId("app-url")).toHaveTextContent("/")})}},p={name:"US-UM04: ログアウトしたい",args:{initialView:"profile"},play:async({canvasElement:i,step:n})=>{const e=s(i);await n("ログアウトでログイン画面へ戻る",async()=>{await t.click(await e.findByRole("button",{name:"ログアウト"})),await a(e.getByRole("main",{name:"ログイン"})).toBeVisible()})}},l={name:"US-UM05: パスワードを再設定したい",args:{initialView:"reset"}},d={name:"US-UM06: OAuthでサインインしたい（Phase 2）",args:{initialView:"oauth"}},w={name:"US-UM07: 外部アカウントを連携したい（Phase 2）",args:{initialView:"security"}},u={name:"US-UM08: プロフィールを確認したい",args:{initialView:"profile"}},y={name:"US-UM09: プロフィールを編集したい",args:{initialView:"profile-edit"}},g={name:"US-UM10: データを書き出したい（Phase 3）",args:{initialView:"export"}},U={name:"US-UM11: 退会したい",args:{initialView:"withdraw"}},v={name:"US-UM12: セキュリティ設定を管理したい（Phase 3）",args:{initialView:"security"}},M={name:"US-UM13: 管理者としてユーザー一覧を見たい（Phase 2）",args:{initialView:"admin-list"}},B={name:"US-UM14: 管理者としてユーザー詳細を操作したい（Phase 2）",args:{initialView:"admin-detail"}},S={name:"US-UM15: サポート調査したい（Phase 3）",args:{initialView:"admin-list"}},x={name:"US-UM16: 監査ログを確認したい（Phase 3）",args:{initialView:"audit"}},T={name:"Admin: AI Provider管理",args:{initialView:"admin-ai-keys"},play:async({canvasElement:i,step:n})=>{const e=s(i);await n("/adminをAppChrome付きの運用画面として表示する",async()=>{await a(await e.findByRole("main",{name:"AI Provider管理"})).toBeVisible(),await a(e.getByRole("navigation",{name:"主要セクション"})).toBeVisible(),await a(e.getByTestId("app-url")).toHaveTextContent("/admin")}),await n("Vault設定済みのOpenAIを確認し、接続テストを行う",async()=>{const r=await e.findByTestId("ai-key-row-openai");await a(r).toHaveTextContent("Vault / 環境変数"),await a(r).toHaveTextContent("使用中"),await t.click(s(r).getByRole("button",{name:"接続テスト"})),await a(await e.findByTestId("ai-key-notice")).toHaveTextContent("接続テストに成功")}),await n("使用するAIをRunpodへ切り替える",async()=>{const r=e.getByTestId("ai-key-row-openai"),V=e.getByTestId("ai-key-row-runpod");await t.click(s(V).getByRole("button",{name:"このAIを使用"})),await a(await e.findByTestId("ai-key-notice")).toHaveTextContent("使用するAIをRunpod Serverlessへ切り替えました"),await a(V).toHaveTextContent("使用中"),await a(r).not.toHaveTextContent("使用中")})}};var I,f,E;o.parameters={...o.parameters,docs:{...(I=o.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: 'US-UM01: 新規登録したい（メール/パスワード）',
  args: {
    initialView: 'register'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('要件未満のパスワードは拒否される', async () => {
      await userEvent.type(canvas.getByLabelText('表示名'), '新しい旅人');
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'new-reader@example.com');
      await userEvent.type(canvas.getByTestId('register-password'), 'short');
      await userEvent.click(canvas.getByRole('button', {
        name: '登録する'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('要件を満たしていません');
    });
    await step('要件を満たすとUserIdが発行されプロフィールへ進む', async () => {
      await userEvent.clear(canvas.getByTestId('register-password'));
      await userEvent.type(canvas.getByTestId('register-password'), 'letters1');
      await userEvent.type(canvas.getByLabelText('パスワード（確認）'), 'letters1');
      await userEvent.click(canvas.getByRole('button', {
        name: '登録する'
      }));
      await expect(canvas.getByRole('region', {
        name: 'プロフィール'
      })).toBeVisible();
      await expect(canvas.getByTestId('issued-user-id')).toHaveTextContent('USR-2F9A');
    });
  }
}`,...(E=(f=o.parameters)==null?void 0:f.docs)==null?void 0:E.source}}};var b,A,R;c.parameters={...c.parameters,docs:{...(b=c.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: 'US-UM02: メール確認をしたい（Phase 2）',
  args: {
    initialView: 'verify-email'
  }
}`,...(R=(A=c.parameters)==null?void 0:A.docs)==null?void 0:R.source}}};var k,P,C;m.parameters={...m.parameters,docs:{...(k=m.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: 'US-UM03: ログインしたい（メール/パスワード）',
  args: {
    initialView: 'login'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Identity cookieセッションを開始し、戻り先がなければホームへ進む', async () => {
      await userEvent.clear(canvas.getByLabelText('メールアドレス'));
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'reader@myriale.example');
      await userEvent.type(canvas.getByTestId('login-password'), 'a');
      await userEvent.click(canvas.getByRole('button', {
        name: 'ログインする'
      }));
      await expect(await canvas.findByRole('main', {
        name: 'Myrialeトップページ'
      })).toBeVisible();
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/');
    });
  }
}`,...(C=(P=m.parameters)==null?void 0:P.docs)==null?void 0:C.source}}};var L,H,O;p.parameters={...p.parameters,docs:{...(L=p.parameters)==null?void 0:L.docs,source:{originalSource:`{
  name: 'US-UM04: ログアウトしたい',
  args: {
    initialView: 'profile'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ログアウトでログイン画面へ戻る', async () => {
      await userEvent.click(await canvas.findByRole('button', {
        name: 'ログアウト'
      }));
      await expect(canvas.getByRole('main', {
        name: 'ログイン'
      })).toBeVisible();
    });
  }
}`,...(O=(H=p.parameters)==null?void 0:H.docs)==null?void 0:O.source}}};var D,W,j;l.parameters={...l.parameters,docs:{...(D=l.parameters)==null?void 0:D.docs,source:{originalSource:`{
  name: 'US-UM05: パスワードを再設定したい',
  args: {
    initialView: 'reset'
  }
}`,...(j=(W=l.parameters)==null?void 0:W.docs)==null?void 0:j.source}}};var F,K,_;d.parameters={...d.parameters,docs:{...(F=d.parameters)==null?void 0:F.docs,source:{originalSource:`{
  name: 'US-UM06: OAuthでサインインしたい（Phase 2）',
  args: {
    initialView: 'oauth'
  }
}`,...(_=(K=d.parameters)==null?void 0:K.docs)==null?void 0:_.source}}};var q,z,G;w.parameters={...w.parameters,docs:{...(q=w.parameters)==null?void 0:q.docs,source:{originalSource:`{
  name: 'US-UM07: 外部アカウントを連携したい（Phase 2）',
  args: {
    initialView: 'security'
  }
}`,...(G=(z=w.parameters)==null?void 0:z.docs)==null?void 0:G.source}}};var J,N,Q;u.parameters={...u.parameters,docs:{...(J=u.parameters)==null?void 0:J.docs,source:{originalSource:`{
  name: 'US-UM08: プロフィールを確認したい',
  args: {
    initialView: 'profile'
  }
}`,...(Q=(N=u.parameters)==null?void 0:N.docs)==null?void 0:Q.source}}};var X,Y,Z;y.parameters={...y.parameters,docs:{...(X=y.parameters)==null?void 0:X.docs,source:{originalSource:`{
  name: 'US-UM09: プロフィールを編集したい',
  args: {
    initialView: 'profile-edit'
  }
}`,...(Z=(Y=y.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var $,ee,ae;g.parameters={...g.parameters,docs:{...($=g.parameters)==null?void 0:$.docs,source:{originalSource:`{
  name: 'US-UM10: データを書き出したい（Phase 3）',
  args: {
    initialView: 'export'
  }
}`,...(ae=(ee=g.parameters)==null?void 0:ee.docs)==null?void 0:ae.source}}};var te,ne,ie;U.parameters={...U.parameters,docs:{...(te=U.parameters)==null?void 0:te.docs,source:{originalSource:`{
  name: 'US-UM11: 退会したい',
  args: {
    initialView: 'withdraw'
  }
}`,...(ie=(ne=U.parameters)==null?void 0:ne.docs)==null?void 0:ie.source}}};var se,re,oe;v.parameters={...v.parameters,docs:{...(se=v.parameters)==null?void 0:se.docs,source:{originalSource:`{
  name: 'US-UM12: セキュリティ設定を管理したい（Phase 3）',
  args: {
    initialView: 'security'
  }
}`,...(oe=(re=v.parameters)==null?void 0:re.docs)==null?void 0:oe.source}}};var ce,me,pe;M.parameters={...M.parameters,docs:{...(ce=M.parameters)==null?void 0:ce.docs,source:{originalSource:`{
  name: 'US-UM13: 管理者としてユーザー一覧を見たい（Phase 2）',
  args: {
    initialView: 'admin-list'
  }
}`,...(pe=(me=M.parameters)==null?void 0:me.docs)==null?void 0:pe.source}}};var le,de,we;B.parameters={...B.parameters,docs:{...(le=B.parameters)==null?void 0:le.docs,source:{originalSource:`{
  name: 'US-UM14: 管理者としてユーザー詳細を操作したい（Phase 2）',
  args: {
    initialView: 'admin-detail'
  }
}`,...(we=(de=B.parameters)==null?void 0:de.docs)==null?void 0:we.source}}};var ue,ye,ge;S.parameters={...S.parameters,docs:{...(ue=S.parameters)==null?void 0:ue.docs,source:{originalSource:`{
  name: 'US-UM15: サポート調査したい（Phase 3）',
  args: {
    initialView: 'admin-list'
  }
}`,...(ge=(ye=S.parameters)==null?void 0:ye.docs)==null?void 0:ge.source}}};var Ue,ve,Me;x.parameters={...x.parameters,docs:{...(Ue=x.parameters)==null?void 0:Ue.docs,source:{originalSource:`{
  name: 'US-UM16: 監査ログを確認したい（Phase 3）',
  args: {
    initialView: 'audit'
  }
}`,...(Me=(ve=x.parameters)==null?void 0:ve.docs)==null?void 0:Me.source}}};var Be,Se,xe;T.parameters={...T.parameters,docs:{...(Be=T.parameters)==null?void 0:Be.docs,source:{originalSource:`{
  name: 'Admin: AI Provider管理',
  args: {
    initialView: 'admin-ai-keys'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('/adminをAppChrome付きの運用画面として表示する', async () => {
      await expect(await canvas.findByRole('main', {
        name: 'AI Provider管理'
      })).toBeVisible();
      await expect(canvas.getByRole('navigation', {
        name: '主要セクション'
      })).toBeVisible();
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/admin');
    });
    await step('Vault設定済みのOpenAIを確認し、接続テストを行う', async () => {
      const openai = await canvas.findByTestId('ai-key-row-openai');
      await expect(openai).toHaveTextContent('Vault / 環境変数');
      await expect(openai).toHaveTextContent('使用中');
      await userEvent.click(within(openai).getByRole('button', {
        name: '接続テスト'
      }));
      await expect(await canvas.findByTestId('ai-key-notice')).toHaveTextContent('接続テストに成功');
    });
    await step('使用するAIをRunpodへ切り替える', async () => {
      const openai = canvas.getByTestId('ai-key-row-openai');
      const runpod = canvas.getByTestId('ai-key-row-runpod');
      await userEvent.click(within(runpod).getByRole('button', {
        name: 'このAIを使用'
      }));
      await expect(await canvas.findByTestId('ai-key-notice')).toHaveTextContent('使用するAIをRunpod Serverlessへ切り替えました');
      await expect(runpod).toHaveTextContent('使用中');
      await expect(openai).not.toHaveTextContent('使用中');
    });
  }
}`,...(xe=(Se=T.parameters)==null?void 0:Se.docs)==null?void 0:xe.source}}};const ze=["UM01RegisterWithEmail","UM02VerifyEmail","UM03LoginWithEmail","UM04Logout","UM05ResetPassword","UM06OAuthSignIn","UM07LinkOAuth","UM08Profile","UM09EditProfile","UM10ExportData","UM11Withdraw","UM12SecuritySettings","UM13AdminUserList","UM14AdminUserDetail","UM15SupportLookup","UM16AuditLog","UM17AdminAiKeys"];export{o as UM01RegisterWithEmail,c as UM02VerifyEmail,m as UM03LoginWithEmail,p as UM04Logout,l as UM05ResetPassword,d as UM06OAuthSignIn,w as UM07LinkOAuth,u as UM08Profile,y as UM09EditProfile,g as UM10ExportData,U as UM11Withdraw,v as UM12SecuritySettings,M as UM13AdminUserList,B as UM14AdminUserDetail,S as UM15SupportLookup,x as UM16AuditLog,T as UM17AdminAiKeys,ze as __namedExportsOrder,qe as default};
