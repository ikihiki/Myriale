import{j as Ve}from"./jsx-runtime-BO8uF4Og.js";import{w as s,u as a,e as t}from"./index-C4S39nCK.js";import{M as h,c as xe}from"./MyrialeApp-Bdz5qkEr.js";import"./account-D2w1pibX.js";import"./index-D4H_InIO.js";import"./AppChrome-Cb-Bi4JU.js";import"./Surfaces-CQIJcDfy.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BLjquTkO.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-C73OeBTK.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-E1lLWSiL.js";import"./scenarioWizardStyles-BLXZEqRf.js";import"./SessionActivityFeed-BK8PBvn8.js";import"./ModuleUiHost-Dq6FqUxM.js";const he={register:"/account/register","verify-email":"/account/register?view=verify-email",login:"/account/login",reset:"/account/reset-password",oauth:"/account/oauth",profile:"/account/profile","profile-edit":"/account/profile/edit",security:"/account/security",export:"/account/export",withdraw:"/account/withdraw","admin-list":"/account/admin/users","admin-detail":"/account/admin/users/USR-1088","admin-ai-keys":"/admin",audit:"/account/admin/audit-log"},Fe={title:"ユーザーストーリー/User management",component:h,render:n=>Ve.jsx(h,{initialUrl:he[n.initialView??"register"],initialDb:xe("adminUsers")}),parameters:{layout:"fullscreen",notes:"ユーザー管理Markdown要件は変更せず、Storybook story/play function としてユーザー導線を表現します。"}},r={name:"US-UM01: 新規登録したい（メール/パスワード）",args:{initialView:"register"},play:async({canvasElement:n,step:i})=>{const e=s(n);await i("要件未満のパスワードは拒否される",async()=>{await a.type(e.getByLabelText("表示名"),"新しい旅人"),await a.type(e.getByLabelText("メールアドレス"),"new-reader@example.com"),await a.type(e.getByTestId("register-password"),"short"),await a.click(e.getByRole("button",{name:"登録する"})),await t(e.getByTestId("um-notice")).toHaveTextContent("要件を満たしていません")}),await i("要件を満たすとUserIdが発行されプロフィールへ進む",async()=>{await a.clear(e.getByTestId("register-password")),await a.type(e.getByTestId("register-password"),"letters1"),await a.type(e.getByLabelText("パスワード（確認）"),"letters1"),await a.click(e.getByRole("button",{name:"登録する"})),await t(e.getByRole("region",{name:"プロフィール"})).toBeVisible(),await t(e.getByTestId("issued-user-id")).toHaveTextContent("USR-2F9A")})}},o={name:"US-UM02: メール確認をしたい（Phase 2）",args:{initialView:"verify-email"}},c={name:"US-UM03: ログインしたい（メール/パスワード）",args:{initialView:"login"},play:async({canvasElement:n,step:i})=>{const e=s(n);await i("Identity cookieセッションを開始しプロフィールへ進む",async()=>{await a.clear(e.getByLabelText("メールアドレス")),await a.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await a.type(e.getByTestId("login-password"),"mist-library-2026"),await a.click(e.getByRole("button",{name:"ログインする"})),await t(e.getByRole("region",{name:"プロフィール"})).toBeVisible()})}},m={name:"US-UM04: ログアウトしたい",args:{initialView:"profile"},play:async({canvasElement:n,step:i})=>{const e=s(n);await i("ログアウトでログイン画面へ戻る",async()=>{await a.click(await e.findByRole("button",{name:"ログアウト"})),await t(e.getByRole("main",{name:"ログイン"})).toBeVisible()})}},l={name:"US-UM05: パスワードを再設定したい",args:{initialView:"reset"}},p={name:"US-UM06: OAuthでサインインしたい（Phase 2）",args:{initialView:"oauth"}},d={name:"US-UM07: 外部アカウントを連携したい（Phase 2）",args:{initialView:"security"}},u={name:"US-UM08: プロフィールを確認したい",args:{initialView:"profile"}},w={name:"US-UM09: プロフィールを編集したい",args:{initialView:"profile-edit"}},g={name:"US-UM10: データを書き出したい（Phase 3）",args:{initialView:"export"}},y={name:"US-UM11: 退会したい",args:{initialView:"withdraw"}},U={name:"US-UM12: セキュリティ設定を管理したい（Phase 3）",args:{initialView:"security"}},v={name:"US-UM13: 管理者としてユーザー一覧を見たい（Phase 2）",args:{initialView:"admin-list"}},M={name:"US-UM14: 管理者としてユーザー詳細を操作したい（Phase 2）",args:{initialView:"admin-detail"}},S={name:"US-UM15: サポート調査したい（Phase 3）",args:{initialView:"admin-list"}},B={name:"US-UM16: 監査ログを確認したい（Phase 3）",args:{initialView:"audit"}},V={name:"Admin: AI Provider管理",args:{initialView:"admin-ai-keys"},play:async({canvasElement:n,step:i})=>{const e=s(n);await i("/adminをAppChrome付きの運用画面として表示する",async()=>{await t(await e.findByRole("main",{name:"AI Provider管理"})).toBeVisible(),await t(e.getByRole("navigation",{name:"主要セクション"})).toBeVisible(),await t(e.getByTestId("app-url")).toHaveTextContent("/admin")}),await i("Vault設定済みのRunpodを確認し、接続テストを行う",async()=>{const x=await e.findByTestId("ai-key-row-runpod");await t(x).toHaveTextContent("Vault / 環境変数"),await t(x).toHaveTextContent("使用中"),await a.click(s(x).getByRole("button",{name:"接続テスト"})),await t(await e.findByTestId("ai-key-notice")).toHaveTextContent("接続テストに成功")})}};var T,b,E;r.parameters={...r.parameters,docs:{...(T=r.parameters)==null?void 0:T.docs,source:{originalSource:`{
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
}`,...(E=(b=r.parameters)==null?void 0:b.docs)==null?void 0:E.source}}};var f,R,I;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: 'US-UM02: メール確認をしたい（Phase 2）',
  args: {
    initialView: 'verify-email'
  }
}`,...(I=(R=o.parameters)==null?void 0:R.docs)==null?void 0:I.source}}};var P,A,k;c.parameters={...c.parameters,docs:{...(P=c.parameters)==null?void 0:P.docs,source:{originalSource:`{
  name: 'US-UM03: ログインしたい（メール/パスワード）',
  args: {
    initialView: 'login'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Identity cookieセッションを開始しプロフィールへ進む', async () => {
      await userEvent.clear(canvas.getByLabelText('メールアドレス'));
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'reader@myriale.example');
      await userEvent.type(canvas.getByTestId('login-password'), 'mist-library-2026');
      await userEvent.click(canvas.getByRole('button', {
        name: 'ログインする'
      }));
      await expect(canvas.getByRole('region', {
        name: 'プロフィール'
      })).toBeVisible();
    });
  }
}`,...(k=(A=c.parameters)==null?void 0:A.docs)==null?void 0:k.source}}};var L,C,H;m.parameters={...m.parameters,docs:{...(L=m.parameters)==null?void 0:L.docs,source:{originalSource:`{
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
}`,...(H=(C=m.parameters)==null?void 0:C.docs)==null?void 0:H.source}}};var D,O,W;l.parameters={...l.parameters,docs:{...(D=l.parameters)==null?void 0:D.docs,source:{originalSource:`{
  name: 'US-UM05: パスワードを再設定したい',
  args: {
    initialView: 'reset'
  }
}`,...(W=(O=l.parameters)==null?void 0:O.docs)==null?void 0:W.source}}};var j,F,K;p.parameters={...p.parameters,docs:{...(j=p.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'US-UM06: OAuthでサインインしたい（Phase 2）',
  args: {
    initialView: 'oauth'
  }
}`,...(K=(F=p.parameters)==null?void 0:F.docs)==null?void 0:K.source}}};var _,q,z;d.parameters={...d.parameters,docs:{...(_=d.parameters)==null?void 0:_.docs,source:{originalSource:`{
  name: 'US-UM07: 外部アカウントを連携したい（Phase 2）',
  args: {
    initialView: 'security'
  }
}`,...(z=(q=d.parameters)==null?void 0:q.docs)==null?void 0:z.source}}};var G,J,N;u.parameters={...u.parameters,docs:{...(G=u.parameters)==null?void 0:G.docs,source:{originalSource:`{
  name: 'US-UM08: プロフィールを確認したい',
  args: {
    initialView: 'profile'
  }
}`,...(N=(J=u.parameters)==null?void 0:J.docs)==null?void 0:N.source}}};var Q,X,Y;w.parameters={...w.parameters,docs:{...(Q=w.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  name: 'US-UM09: プロフィールを編集したい',
  args: {
    initialView: 'profile-edit'
  }
}`,...(Y=(X=w.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};var Z,$,ee;g.parameters={...g.parameters,docs:{...(Z=g.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  name: 'US-UM10: データを書き出したい（Phase 3）',
  args: {
    initialView: 'export'
  }
}`,...(ee=($=g.parameters)==null?void 0:$.docs)==null?void 0:ee.source}}};var ae,te,ne;y.parameters={...y.parameters,docs:{...(ae=y.parameters)==null?void 0:ae.docs,source:{originalSource:`{
  name: 'US-UM11: 退会したい',
  args: {
    initialView: 'withdraw'
  }
}`,...(ne=(te=y.parameters)==null?void 0:te.docs)==null?void 0:ne.source}}};var ie,se,re;U.parameters={...U.parameters,docs:{...(ie=U.parameters)==null?void 0:ie.docs,source:{originalSource:`{
  name: 'US-UM12: セキュリティ設定を管理したい（Phase 3）',
  args: {
    initialView: 'security'
  }
}`,...(re=(se=U.parameters)==null?void 0:se.docs)==null?void 0:re.source}}};var oe,ce,me;v.parameters={...v.parameters,docs:{...(oe=v.parameters)==null?void 0:oe.docs,source:{originalSource:`{
  name: 'US-UM13: 管理者としてユーザー一覧を見たい（Phase 2）',
  args: {
    initialView: 'admin-list'
  }
}`,...(me=(ce=v.parameters)==null?void 0:ce.docs)==null?void 0:me.source}}};var le,pe,de;M.parameters={...M.parameters,docs:{...(le=M.parameters)==null?void 0:le.docs,source:{originalSource:`{
  name: 'US-UM14: 管理者としてユーザー詳細を操作したい（Phase 2）',
  args: {
    initialView: 'admin-detail'
  }
}`,...(de=(pe=M.parameters)==null?void 0:pe.docs)==null?void 0:de.source}}};var ue,we,ge;S.parameters={...S.parameters,docs:{...(ue=S.parameters)==null?void 0:ue.docs,source:{originalSource:`{
  name: 'US-UM15: サポート調査したい（Phase 3）',
  args: {
    initialView: 'admin-list'
  }
}`,...(ge=(we=S.parameters)==null?void 0:we.docs)==null?void 0:ge.source}}};var ye,Ue,ve;B.parameters={...B.parameters,docs:{...(ye=B.parameters)==null?void 0:ye.docs,source:{originalSource:`{
  name: 'US-UM16: 監査ログを確認したい（Phase 3）',
  args: {
    initialView: 'audit'
  }
}`,...(ve=(Ue=B.parameters)==null?void 0:Ue.docs)==null?void 0:ve.source}}};var Me,Se,Be;V.parameters={...V.parameters,docs:{...(Me=V.parameters)==null?void 0:Me.docs,source:{originalSource:`{
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
    await step('Vault設定済みのRunpodを確認し、接続テストを行う', async () => {
      const runpod = await canvas.findByTestId('ai-key-row-runpod');
      await expect(runpod).toHaveTextContent('Vault / 環境変数');
      await expect(runpod).toHaveTextContent('使用中');
      await userEvent.click(within(runpod).getByRole('button', {
        name: '接続テスト'
      }));
      await expect(await canvas.findByTestId('ai-key-notice')).toHaveTextContent('接続テストに成功');
    });
  }
}`,...(Be=(Se=V.parameters)==null?void 0:Se.docs)==null?void 0:Be.source}}};const Ke=["UM01RegisterWithEmail","UM02VerifyEmail","UM03LoginWithEmail","UM04Logout","UM05ResetPassword","UM06OAuthSignIn","UM07LinkOAuth","UM08Profile","UM09EditProfile","UM10ExportData","UM11Withdraw","UM12SecuritySettings","UM13AdminUserList","UM14AdminUserDetail","UM15SupportLookup","UM16AuditLog","UM17AdminAiKeys"];export{r as UM01RegisterWithEmail,o as UM02VerifyEmail,c as UM03LoginWithEmail,m as UM04Logout,l as UM05ResetPassword,p as UM06OAuthSignIn,d as UM07LinkOAuth,u as UM08Profile,w as UM09EditProfile,g as UM10ExportData,y as UM11Withdraw,U as UM12SecuritySettings,v as UM13AdminUserList,M as UM14AdminUserDetail,S as UM15SupportLookup,B as UM16AuditLog,V as UM17AdminAiKeys,Ke as __namedExportsOrder,Fe as default};
