import{j as Be}from"./jsx-runtime-BO8uF4Og.js";import{w as x,u as a,e as i}from"./index-C3Z0PGzo.js";import{M as h,c as xe}from"./MyrialeApp-CP0KSG6E.js";import"./account-DPjXj8MC.js";import"./index-D4H_InIO.js";import"./MyrialeToggle-Cu4mkWU9.js";import"./index-DzKAYa42.js";import"./AppChrome-DEoeM2ef.js";import"./MyrialeMenu-FzkaUt8s.js";import"./WizardNavigation-_WVmaYVB.js";import"./SessionTurn-CnU6KSUh.js";const he={register:"/account/register","verify-email":"/account/register?view=verify-email",login:"/account/login",reset:"/account/reset-password",oauth:"/account/oauth",profile:"/account/profile","profile-edit":"/account/profile/edit",security:"/account/security",export:"/account/export",withdraw:"/account/withdraw","admin-list":"/account/admin/users","admin-detail":"/account/admin/users/USR-1088","admin-ai-keys":"/account/admin/ai-keys",audit:"/account/admin/audit-log"},Ce={title:"ユーザーストーリー/User management",component:h,render:t=>Be.jsx(h,{initialUrl:he[t.initialView??"register"],initialDb:xe("adminUsers")}),parameters:{layout:"fullscreen",notes:"ユーザー管理Markdown要件は変更せず、Storybook story/play function としてユーザー導線を表現します。"}},s={name:"US-UM01: 新規登録したい（メール/パスワード）",args:{initialView:"register"},play:async({canvasElement:t,step:n})=>{const e=x(t);await n("要件未満のパスワードは拒否される",async()=>{await a.type(e.getByLabelText("表示名"),"新しい旅人"),await a.type(e.getByLabelText("メールアドレス"),"new-reader@example.com"),await a.type(e.getByTestId("register-password"),"short"),await a.click(e.getByRole("button",{name:"登録する"})),await i(e.getByTestId("um-notice")).toHaveTextContent("要件を満たしていません")}),await n("要件を満たすとUserIdが発行されプロフィールへ進む",async()=>{await a.clear(e.getByTestId("register-password")),await a.type(e.getByTestId("register-password"),"letters1"),await a.type(e.getByLabelText("パスワード（確認）"),"letters1"),await a.click(e.getByRole("button",{name:"登録する"})),await i(e.getByRole("region",{name:"プロフィール"})).toBeVisible(),await i(e.getByTestId("issued-user-id")).toHaveTextContent("USR-2F9A")})}},r={name:"US-UM02: メール確認をしたい（Phase 2）",args:{initialView:"verify-email"}},o={name:"US-UM03: ログインしたい（メール/パスワード）",args:{initialView:"login"},play:async({canvasElement:t,step:n})=>{const e=x(t);await n("Identity cookieセッションを開始しプロフィールへ進む",async()=>{await a.clear(e.getByLabelText("メールアドレス")),await a.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await a.type(e.getByTestId("login-password"),"mist-library-2026"),await a.click(e.getByRole("button",{name:"ログインする"})),await i(e.getByRole("region",{name:"プロフィール"})).toBeVisible()})}},c={name:"US-UM04: ログアウトしたい",args:{initialView:"profile"},play:async({canvasElement:t,step:n})=>{const e=x(t);await n("ログアウトでログイン画面へ戻る",async()=>{await a.click(await e.findByRole("button",{name:"ログアウト"})),await i(e.getByRole("main",{name:"ログイン"})).toBeVisible()})}},m={name:"US-UM05: パスワードを再設定したい",args:{initialView:"reset"}},l={name:"US-UM06: OAuthでサインインしたい（Phase 2）",args:{initialView:"oauth"}},p={name:"US-UM07: 外部アカウントを連携したい（Phase 2）",args:{initialView:"security"}},d={name:"US-UM08: プロフィールを確認したい",args:{initialView:"profile"}},u={name:"US-UM09: プロフィールを編集したい",args:{initialView:"profile-edit"}},w={name:"US-UM10: データを書き出したい（Phase 3）",args:{initialView:"export"}},g={name:"US-UM11: 退会したい",args:{initialView:"withdraw"}},y={name:"US-UM12: セキュリティ設定を管理したい（Phase 3）",args:{initialView:"security"}},U={name:"US-UM13: 管理者としてユーザー一覧を見たい（Phase 2）",args:{initialView:"admin-list"}},v={name:"US-UM14: 管理者としてユーザー詳細を操作したい（Phase 2）",args:{initialView:"admin-detail"}},M={name:"US-UM15: サポート調査したい（Phase 3）",args:{initialView:"admin-list"}},S={name:"US-UM16: 監査ログを確認したい（Phase 3）",args:{initialView:"audit"}},B={name:"Admin: AIキー管理",args:{initialView:"admin-ai-keys"},play:async({canvasElement:t,step:n})=>{const e=x(t);await n("AIキーを保存し、Aspire Mock AI への接続テストを行う",async()=>{await i(await e.findByRole("region",{name:"AIキー管理"})).toBeVisible(),await a.clear(e.getByLabelText("APIキー")),await a.type(e.getByLabelText("APIキー"),"mock-key-story"),await a.click(e.getByRole("button",{name:"保存する"})),await i(await e.findByTestId("ai-key-notice")).toHaveTextContent("保存しました"),await a.click(e.getAllByRole("button",{name:"接続テスト"})[0]),await i(await e.findByTestId("ai-key-notice")).toHaveTextContent("接続テストに成功")})}};var V,b,E;s.parameters={...s.parameters,docs:{...(V=s.parameters)==null?void 0:V.docs,source:{originalSource:`{
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
}`,...(E=(b=s.parameters)==null?void 0:b.docs)==null?void 0:E.source}}};var T,A,f;r.parameters={...r.parameters,docs:{...(T=r.parameters)==null?void 0:T.docs,source:{originalSource:`{
  name: 'US-UM02: メール確認をしたい（Phase 2）',
  args: {
    initialView: 'verify-email'
  }
}`,...(f=(A=r.parameters)==null?void 0:A.docs)==null?void 0:f.source}}};var k,I,P;o.parameters={...o.parameters,docs:{...(k=o.parameters)==null?void 0:k.docs,source:{originalSource:`{
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
}`,...(P=(I=o.parameters)==null?void 0:I.docs)==null?void 0:P.source}}};var R,L,C;c.parameters={...c.parameters,docs:{...(R=c.parameters)==null?void 0:R.docs,source:{originalSource:`{
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
}`,...(C=(L=c.parameters)==null?void 0:L.docs)==null?void 0:C.source}}};var H,D,O;m.parameters={...m.parameters,docs:{...(H=m.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: 'US-UM05: パスワードを再設定したい',
  args: {
    initialView: 'reset'
  }
}`,...(O=(D=m.parameters)==null?void 0:D.docs)==null?void 0:O.source}}};var W,j,F;l.parameters={...l.parameters,docs:{...(W=l.parameters)==null?void 0:W.docs,source:{originalSource:`{
  name: 'US-UM06: OAuthでサインインしたい（Phase 2）',
  args: {
    initialView: 'oauth'
  }
}`,...(F=(j=l.parameters)==null?void 0:j.docs)==null?void 0:F.source}}};var K,_,q;p.parameters={...p.parameters,docs:{...(K=p.parameters)==null?void 0:K.docs,source:{originalSource:`{
  name: 'US-UM07: 外部アカウントを連携したい（Phase 2）',
  args: {
    initialView: 'security'
  }
}`,...(q=(_=p.parameters)==null?void 0:_.docs)==null?void 0:q.source}}};var z,G,J;d.parameters={...d.parameters,docs:{...(z=d.parameters)==null?void 0:z.docs,source:{originalSource:`{
  name: 'US-UM08: プロフィールを確認したい',
  args: {
    initialView: 'profile'
  }
}`,...(J=(G=d.parameters)==null?void 0:G.docs)==null?void 0:J.source}}};var N,Q,X;u.parameters={...u.parameters,docs:{...(N=u.parameters)==null?void 0:N.docs,source:{originalSource:`{
  name: 'US-UM09: プロフィールを編集したい',
  args: {
    initialView: 'profile-edit'
  }
}`,...(X=(Q=u.parameters)==null?void 0:Q.docs)==null?void 0:X.source}}};var Y,Z,$;w.parameters={...w.parameters,docs:{...(Y=w.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  name: 'US-UM10: データを書き出したい（Phase 3）',
  args: {
    initialView: 'export'
  }
}`,...($=(Z=w.parameters)==null?void 0:Z.docs)==null?void 0:$.source}}};var ee,ae,te;g.parameters={...g.parameters,docs:{...(ee=g.parameters)==null?void 0:ee.docs,source:{originalSource:`{
  name: 'US-UM11: 退会したい',
  args: {
    initialView: 'withdraw'
  }
}`,...(te=(ae=g.parameters)==null?void 0:ae.docs)==null?void 0:te.source}}};var ne,ie,se;y.parameters={...y.parameters,docs:{...(ne=y.parameters)==null?void 0:ne.docs,source:{originalSource:`{
  name: 'US-UM12: セキュリティ設定を管理したい（Phase 3）',
  args: {
    initialView: 'security'
  }
}`,...(se=(ie=y.parameters)==null?void 0:ie.docs)==null?void 0:se.source}}};var re,oe,ce;U.parameters={...U.parameters,docs:{...(re=U.parameters)==null?void 0:re.docs,source:{originalSource:`{
  name: 'US-UM13: 管理者としてユーザー一覧を見たい（Phase 2）',
  args: {
    initialView: 'admin-list'
  }
}`,...(ce=(oe=U.parameters)==null?void 0:oe.docs)==null?void 0:ce.source}}};var me,le,pe;v.parameters={...v.parameters,docs:{...(me=v.parameters)==null?void 0:me.docs,source:{originalSource:`{
  name: 'US-UM14: 管理者としてユーザー詳細を操作したい（Phase 2）',
  args: {
    initialView: 'admin-detail'
  }
}`,...(pe=(le=v.parameters)==null?void 0:le.docs)==null?void 0:pe.source}}};var de,ue,we;M.parameters={...M.parameters,docs:{...(de=M.parameters)==null?void 0:de.docs,source:{originalSource:`{
  name: 'US-UM15: サポート調査したい（Phase 3）',
  args: {
    initialView: 'admin-list'
  }
}`,...(we=(ue=M.parameters)==null?void 0:ue.docs)==null?void 0:we.source}}};var ge,ye,Ue;S.parameters={...S.parameters,docs:{...(ge=S.parameters)==null?void 0:ge.docs,source:{originalSource:`{
  name: 'US-UM16: 監査ログを確認したい（Phase 3）',
  args: {
    initialView: 'audit'
  }
}`,...(Ue=(ye=S.parameters)==null?void 0:ye.docs)==null?void 0:Ue.source}}};var ve,Me,Se;B.parameters={...B.parameters,docs:{...(ve=B.parameters)==null?void 0:ve.docs,source:{originalSource:`{
  name: 'Admin: AIキー管理',
  args: {
    initialView: 'admin-ai-keys'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('AIキーを保存し、Aspire Mock AI への接続テストを行う', async () => {
      await expect(await canvas.findByRole('region', {
        name: 'AIキー管理'
      })).toBeVisible();
      await userEvent.clear(canvas.getByLabelText('APIキー'));
      await userEvent.type(canvas.getByLabelText('APIキー'), 'mock-key-story');
      await userEvent.click(canvas.getByRole('button', {
        name: '保存する'
      }));
      await expect(await canvas.findByTestId('ai-key-notice')).toHaveTextContent('保存しました');
      await userEvent.click(canvas.getAllByRole('button', {
        name: '接続テスト'
      })[0]);
      await expect(await canvas.findByTestId('ai-key-notice')).toHaveTextContent('接続テストに成功');
    });
  }
}`,...(Se=(Me=B.parameters)==null?void 0:Me.docs)==null?void 0:Se.source}}};const He=["UM01RegisterWithEmail","UM02VerifyEmail","UM03LoginWithEmail","UM04Logout","UM05ResetPassword","UM06OAuthSignIn","UM07LinkOAuth","UM08Profile","UM09EditProfile","UM10ExportData","UM11Withdraw","UM12SecuritySettings","UM13AdminUserList","UM14AdminUserDetail","UM15SupportLookup","UM16AuditLog","UM17AdminAiKeys"];export{s as UM01RegisterWithEmail,r as UM02VerifyEmail,o as UM03LoginWithEmail,c as UM04Logout,m as UM05ResetPassword,l as UM06OAuthSignIn,p as UM07LinkOAuth,d as UM08Profile,u as UM09EditProfile,w as UM10ExportData,g as UM11Withdraw,y as UM12SecuritySettings,U as UM13AdminUserList,v as UM14AdminUserDetail,M as UM15SupportLookup,S as UM16AuditLog,B as UM17AdminAiKeys,He as __namedExportsOrder,Ce as default};
