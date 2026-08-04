import{j as he}from"./jsx-runtime-BO8uF4Og.js";import{w as r,u as t,e as a}from"./index-C4S39nCK.js";import{M as R}from"./MyrialeApp-DR6VVePB.js";import{c as fe}from"./SessionPresentation-CUMwxRnx.js";import"./account-CrOIROJF.js";import"./index-D4H_InIO.js";import"./ConditionTablePresentation-BBk8wS_M.js";import"./Surfaces-xpIMDkG0.js";import"./EditPane-OsFMeo59.js";import"./MyrialeToggle-nBW4_8Wv.js";import"./navigationRecipes-DkSbwkz5.js";import"./index-DzKAYa42.js";import"./AppChrome-CqlUs9ri.js";import"./MyrialeMenu-CLGgTteF.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./ModuleUiHost-DZh55JlF.js";import"./TurnInspectionPresentation-CcW_7p87.js";import"./SessionListPresentation-Cou-SJ3F.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-CwmT_au6.js";const ke={register:"/account/register","verify-email":"/account/register?view=verify-email",login:"/account/login",reset:"/account/reset-password",oauth:"/account/oauth",profile:"/account/profile","profile-edit":"/account/profile/edit",security:"/account/security",export:"/account/export",withdraw:"/account/withdraw","admin-list":"/account/admin/users","admin-detail":"/account/admin/users/USR-1088","admin-ai-keys":"/admin",audit:"/account/admin/audit-log"},Ye={title:"ユーザーストーリー/User management",component:R,render:s=>he.jsx(R,{initialUrl:ke[s.initialView??"register"],initialDb:fe("adminUsers")}),parameters:{layout:"fullscreen",notes:"ユーザー管理Markdown要件は変更せず、Storybook story/play function としてユーザー導線を表現します。"}},o={name:"US-UM01: 新規登録したい（メール/パスワード）",args:{initialView:"register"},play:async({canvasElement:s,step:i})=>{const e=r(s);await i("要件未満のパスワードは拒否される",async()=>{await t.type(e.getByLabelText("表示名"),"新しい旅人"),await t.type(e.getByLabelText("メールアドレス"),"new-reader@example.com"),await t.type(e.getByTestId("register-password"),"short"),await t.click(e.getByRole("button",{name:"登録する"})),await a(e.getByTestId("um-notice")).toHaveTextContent("要件を満たしていません")}),await i("要件を満たすとUserIdが発行されプロフィールへ進む",async()=>{await t.clear(e.getByTestId("register-password")),await t.type(e.getByTestId("register-password"),"letters1"),await t.type(e.getByLabelText("パスワード（確認）"),"letters1"),await t.click(e.getByRole("button",{name:"登録する"})),await a(e.getByRole("region",{name:"プロフィール"})).toBeVisible(),await a(e.getByTestId("issued-user-id")).toHaveTextContent("USR-2F9A")})}},c={name:"US-UM02: メール確認をしたい（Phase 2）",args:{initialView:"verify-email"}},p={name:"US-UM03: ログインしたい（メール/パスワード）",args:{initialView:"login"},play:async({canvasElement:s,step:i})=>{const e=r(s);await i("Identity cookieセッションを開始し、戻り先がなければホームへ進む",async()=>{await t.clear(e.getByLabelText("メールアドレス")),await t.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await t.type(e.getByTestId("login-password"),"a"),await t.click(e.getByRole("button",{name:"ログインする"})),await a(await e.findByRole("main",{name:"Myrialeトップページ"})).toBeVisible(),await a(e.getByTestId("app-url")).toHaveTextContent("/")})}},m={name:"US-UM04: ログアウトしたい",args:{initialView:"profile"},play:async({canvasElement:s,step:i})=>{const e=r(s);await i("ログアウトでログイン画面へ戻る",async()=>{await t.click(await e.findByRole("button",{name:"ログアウト"})),await a(e.getByRole("main",{name:"ログイン"})).toBeVisible()})}},l={name:"US-UM05: パスワードを再設定したい",args:{initialView:"reset"}},d={name:"US-UM06: OAuthでサインインしたい（Phase 2）",args:{initialView:"oauth"}},w={name:"US-UM07: 外部アカウントを連携したい（Phase 2）",args:{initialView:"security"}},u={name:"US-UM08: プロフィールを確認したい",args:{initialView:"profile"}},y={name:"US-UM09: プロフィールを編集したい",args:{initialView:"profile-edit"}},g={name:"US-UM10: データを書き出したい（Phase 3）",args:{initialView:"export"}},v={name:"US-UM11: 退会したい",args:{initialView:"withdraw"}},U={name:"US-UM12: セキュリティ設定を管理したい（Phase 3）",args:{initialView:"security"}},B={name:"US-UM13: 管理者としてユーザー一覧を見たい（Phase 2）",args:{initialView:"admin-list"}},x={name:"US-UM14: 管理者としてユーザー詳細を操作したい（Phase 2）",args:{initialView:"admin-detail"}},T={name:"US-UM15: サポート調査したい（Phase 3）",args:{initialView:"admin-list"}},M={name:"US-UM16: 監査ログを確認したい（Phase 3）",args:{initialView:"audit"}},S={name:"Admin: AI Provider管理",args:{initialView:"admin-ai-keys"},play:async({canvasElement:s,step:i})=>{const e=r(s);await i("/adminをAppChrome付きの運用画面として表示する",async()=>{await a(await e.findByRole("main",{name:"AI Provider管理"})).toBeVisible(),await a(e.getByRole("navigation",{name:"主要セクション"})).toBeVisible(),await a(e.getByTestId("app-url")).toHaveTextContent("/admin")}),await i("Vault設定済みのOpenAIを確認し、接続テストを行う",async()=>{const n=await e.findByTestId("ai-key-row-openai");await a(n).toHaveTextContent("Vault / 環境変数"),await a(n).toHaveTextContent("使用中"),await t.click(r(n).getByRole("button",{name:"接続テスト"})),await a(await e.findByTestId("ai-key-notice")).toHaveTextContent("接続テストに成功")}),await i("使用するAIをRunpodへ切り替える",async()=>{const n=e.getByTestId("ai-key-row-openai"),I=e.getByTestId("ai-key-row-runpod");await t.click(r(I).getByRole("button",{name:"このAIを使用"})),await a(await e.findByTestId("ai-key-notice")).toHaveTextContent("使用するAIをRunpod Serverlessへ切り替えました"),await a(I).toHaveTextContent("使用中"),await a(n).not.toHaveTextContent("使用中")})}},V={name:"Admin: Provider行からテストプロンプトを送る",args:{initialView:"admin-ai-keys"},play:async({canvasElement:s,step:i})=>{const e=r(s);await i("使用中ではないRunpodの行からプロンプトテストを開く",async()=>{const n=await e.findByTestId("ai-key-row-runpod");await a(n).not.toHaveTextContent("使用中"),await t.click(r(n).getByRole("button",{name:"プロンプトテスト"})),await a(await e.findByRole("region",{name:"Runpod Serverlessのプロンプトテスト"})).toBeVisible()}),await i("Runpodへテスト用プロンプトを直接送信する",async()=>{const n=e.getByLabelText("Runpod Serverlessのテスト用プロンプト");await t.clear(n),await t.type(n,"このProviderの特徴を一文で答えてください。"),await t.click(e.getByRole("button",{name:"Runpod Serverlessへ送信"}))}),await i("使用中を切り替えずRunpodの応答と診断情報を確認する",async()=>{const n=await e.findByTestId("ai-prompt-result");await a(n).toHaveTextContent("テスト応答: このProviderの特徴を一文で答えてください。"),await a(n).toHaveTextContent("runpod"),await a(n).toHaveTextContent("Qwen/Qwen3-8B"),await a(n).toHaveTextContent("184 ms"),await a(e.getByTestId("ai-key-row-openai")).toHaveTextContent("使用中"),await a(e.getByTestId("ai-key-row-runpod")).not.toHaveTextContent("使用中")})}};var h,f,k;o.parameters={...o.parameters,docs:{...(h=o.parameters)==null?void 0:h.docs,source:{originalSource:`{
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
}`,...(k=(f=o.parameters)==null?void 0:f.docs)==null?void 0:k.source}}};var b,E,A;c.parameters={...c.parameters,docs:{...(b=c.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: 'US-UM02: メール確認をしたい（Phase 2）',
  args: {
    initialView: 'verify-email'
  }
}`,...(A=(E=c.parameters)==null?void 0:E.docs)==null?void 0:A.source}}};var C,P,H;p.parameters={...p.parameters,docs:{...(C=p.parameters)==null?void 0:C.docs,source:{originalSource:`{
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
}`,...(H=(P=p.parameters)==null?void 0:P.docs)==null?void 0:H.source}}};var L,O,D;m.parameters={...m.parameters,docs:{...(L=m.parameters)==null?void 0:L.docs,source:{originalSource:`{
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
}`,...(D=(O=m.parameters)==null?void 0:O.docs)==null?void 0:D.source}}};var W,Q,j;l.parameters={...l.parameters,docs:{...(W=l.parameters)==null?void 0:W.docs,source:{originalSource:`{
  name: 'US-UM05: パスワードを再設定したい',
  args: {
    initialView: 'reset'
  }
}`,...(j=(Q=l.parameters)==null?void 0:Q.docs)==null?void 0:j.source}}};var F,K,_;d.parameters={...d.parameters,docs:{...(F=d.parameters)==null?void 0:F.docs,source:{originalSource:`{
  name: 'US-UM06: OAuthでサインインしたい（Phase 2）',
  args: {
    initialView: 'oauth'
  }
}`,...(_=(K=d.parameters)==null?void 0:K.docs)==null?void 0:_.source}}};var q,z,G;w.parameters={...w.parameters,docs:{...(q=w.parameters)==null?void 0:q.docs,source:{originalSource:`{
  name: 'US-UM07: 外部アカウントを連携したい（Phase 2）',
  args: {
    initialView: 'security'
  }
}`,...(G=(z=w.parameters)==null?void 0:z.docs)==null?void 0:G.source}}};var J,N,X;u.parameters={...u.parameters,docs:{...(J=u.parameters)==null?void 0:J.docs,source:{originalSource:`{
  name: 'US-UM08: プロフィールを確認したい',
  args: {
    initialView: 'profile'
  }
}`,...(X=(N=u.parameters)==null?void 0:N.docs)==null?void 0:X.source}}};var Y,Z,$;y.parameters={...y.parameters,docs:{...(Y=y.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  name: 'US-UM09: プロフィールを編集したい',
  args: {
    initialView: 'profile-edit'
  }
}`,...($=(Z=y.parameters)==null?void 0:Z.docs)==null?void 0:$.source}}};var ee,ae,te;g.parameters={...g.parameters,docs:{...(ee=g.parameters)==null?void 0:ee.docs,source:{originalSource:`{
  name: 'US-UM10: データを書き出したい（Phase 3）',
  args: {
    initialView: 'export'
  }
}`,...(te=(ae=g.parameters)==null?void 0:ae.docs)==null?void 0:te.source}}};var ne,ie,se;v.parameters={...v.parameters,docs:{...(ne=v.parameters)==null?void 0:ne.docs,source:{originalSource:`{
  name: 'US-UM11: 退会したい',
  args: {
    initialView: 'withdraw'
  }
}`,...(se=(ie=v.parameters)==null?void 0:ie.docs)==null?void 0:se.source}}};var re,oe,ce;U.parameters={...U.parameters,docs:{...(re=U.parameters)==null?void 0:re.docs,source:{originalSource:`{
  name: 'US-UM12: セキュリティ設定を管理したい（Phase 3）',
  args: {
    initialView: 'security'
  }
}`,...(ce=(oe=U.parameters)==null?void 0:oe.docs)==null?void 0:ce.source}}};var pe,me,le;B.parameters={...B.parameters,docs:{...(pe=B.parameters)==null?void 0:pe.docs,source:{originalSource:`{
  name: 'US-UM13: 管理者としてユーザー一覧を見たい（Phase 2）',
  args: {
    initialView: 'admin-list'
  }
}`,...(le=(me=B.parameters)==null?void 0:me.docs)==null?void 0:le.source}}};var de,we,ue;x.parameters={...x.parameters,docs:{...(de=x.parameters)==null?void 0:de.docs,source:{originalSource:`{
  name: 'US-UM14: 管理者としてユーザー詳細を操作したい（Phase 2）',
  args: {
    initialView: 'admin-detail'
  }
}`,...(ue=(we=x.parameters)==null?void 0:we.docs)==null?void 0:ue.source}}};var ye,ge,ve;T.parameters={...T.parameters,docs:{...(ye=T.parameters)==null?void 0:ye.docs,source:{originalSource:`{
  name: 'US-UM15: サポート調査したい（Phase 3）',
  args: {
    initialView: 'admin-list'
  }
}`,...(ve=(ge=T.parameters)==null?void 0:ge.docs)==null?void 0:ve.source}}};var Ue,Be,xe;M.parameters={...M.parameters,docs:{...(Ue=M.parameters)==null?void 0:Ue.docs,source:{originalSource:`{
  name: 'US-UM16: 監査ログを確認したい（Phase 3）',
  args: {
    initialView: 'audit'
  }
}`,...(xe=(Be=M.parameters)==null?void 0:Be.docs)==null?void 0:xe.source}}};var Te,Me,Se;S.parameters={...S.parameters,docs:{...(Te=S.parameters)==null?void 0:Te.docs,source:{originalSource:`{
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
}`,...(Se=(Me=S.parameters)==null?void 0:Me.docs)==null?void 0:Se.source}}};var Ve,Ie,Re;V.parameters={...V.parameters,docs:{...(Ve=V.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
  name: 'Admin: Provider行からテストプロンプトを送る',
  args: {
    initialView: 'admin-ai-keys'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('使用中ではないRunpodの行からプロンプトテストを開く', async () => {
      const runpod = await canvas.findByTestId('ai-key-row-runpod');
      await expect(runpod).not.toHaveTextContent('使用中');
      await userEvent.click(within(runpod).getByRole('button', {
        name: 'プロンプトテスト'
      }));
      await expect(await canvas.findByRole('region', {
        name: 'Runpod Serverlessのプロンプトテスト'
      })).toBeVisible();
    });
    await step('Runpodへテスト用プロンプトを直接送信する', async () => {
      const prompt = canvas.getByLabelText('Runpod Serverlessのテスト用プロンプト');
      await userEvent.clear(prompt);
      await userEvent.type(prompt, 'このProviderの特徴を一文で答えてください。');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Runpod Serverlessへ送信'
      }));
    });
    await step('使用中を切り替えずRunpodの応答と診断情報を確認する', async () => {
      const result = await canvas.findByTestId('ai-prompt-result');
      await expect(result).toHaveTextContent('テスト応答: このProviderの特徴を一文で答えてください。');
      await expect(result).toHaveTextContent('runpod');
      await expect(result).toHaveTextContent('Qwen/Qwen3-8B');
      await expect(result).toHaveTextContent('184 ms');
      await expect(canvas.getByTestId('ai-key-row-openai')).toHaveTextContent('使用中');
      await expect(canvas.getByTestId('ai-key-row-runpod')).not.toHaveTextContent('使用中');
    });
  }
}`,...(Re=(Ie=V.parameters)==null?void 0:Ie.docs)==null?void 0:Re.source}}};const Ze=["UM01RegisterWithEmail","UM02VerifyEmail","UM03LoginWithEmail","UM04Logout","UM05ResetPassword","UM06OAuthSignIn","UM07LinkOAuth","UM08Profile","UM09EditProfile","UM10ExportData","UM11Withdraw","UM12SecuritySettings","UM13AdminUserList","UM14AdminUserDetail","UM15SupportLookup","UM16AuditLog","UM17AdminAiKeys","UM18AdminAiPromptTest"];export{o as UM01RegisterWithEmail,c as UM02VerifyEmail,p as UM03LoginWithEmail,m as UM04Logout,l as UM05ResetPassword,d as UM06OAuthSignIn,w as UM07LinkOAuth,u as UM08Profile,y as UM09EditProfile,g as UM10ExportData,v as UM11Withdraw,U as UM12SecuritySettings,B as UM13AdminUserList,x as UM14AdminUserDetail,T as UM15SupportLookup,M as UM16AuditLog,S as UM17AdminAiKeys,V as UM18AdminAiPromptTest,Ze as __namedExportsOrder,Ye as default};
