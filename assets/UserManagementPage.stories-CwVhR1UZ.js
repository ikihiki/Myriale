import{j as Bt}from"./jsx-runtime-BO8uF4Og.js";import{w as i,u as n,e}from"./index-C3Z0PGzo.js";import{M as b,c as xt}from"./MyrialeApp-CG1aa34y.js";import"./account-CnHKn01-.js";import"./index-D4H_InIO.js";import"./AppChrome-BeUEusgT.js";import"./MyrialeToggle-9z9YzCAE.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-Za2vh9EI.js";import"./WizardNavigation-_WVmaYVB.js";import"./SessionTurn-CnU6KSUh.js";const Ut={register:"/account/register",verify:"/account/register?view=verify",login:"/account/login",reset:"/account/reset-password",oauth:"/account/oauth",profile:"/account/profile","profile-edit":"/account/profile/edit",security:"/account/security",export:"/account/export",withdraw:"/account/withdraw","admin-list":"/account/admin/users","admin-detail":"/account/admin/users/USR-1088",audit:"/account/admin/audit-log"},ft={title:"ユーザーストーリー/User management",component:b,render:s=>Bt.jsx(b,{initialUrl:Ut[s.initialView??"register"],initialDb:xt("adminUsers")}),parameters:{layout:"fullscreen",notes:"docs/user-stories/user-management-user-stories.md の各ユーザーストーリーを、共通UI（Account kit）で組んだアプリ画面にし、play関数で操作手順と期待結果を説明します。"}},c="mist-library-2026",r={name:"US-UM01: 新規登録したい（メール/パスワード）",args:{initialView:"register"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("パスワード要件を満たさないと登録できない",async()=>{await n.type(t.getByLabelText("メールアドレス"),"new-reader@example.com"),await n.type(t.getByTestId("register-password"),"short"),await n.click(t.getByRole("button",{name:"登録する"})),await e(t.getByTestId("um-notice")).toHaveTextContent("要件を満たしていません")}),await a("要件を満たすパスワードで登録し、UserIdを発行する",async()=>{await n.clear(t.getByTestId("register-password")),await n.type(t.getByTestId("register-password"),c),await n.type(t.getByLabelText("パスワード（確認）"),c),await n.click(t.getByRole("button",{name:"登録する"})),await e(t.getByTestId("um-notice")).toHaveTextContent("アカウントを作成しました"),await e(t.getByTestId("issued-user-id")).toHaveTextContent("USR-2F9A")})}},y={name:"US-UM02: 新規登録時にメール確認をしたい（任意）",args:{initialView:"verify"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("確認前はメール未確認の状態が示される",async()=>{await e(t.getByTestId("verify-state")).toHaveTextContent("メール未確認")}),await a("確認リンクを開くと確認済みフラグが立つ",async()=>{await n.click(t.getByRole("button",{name:"確認リンクを開く"})),await e(t.getByTestId("um-notice")).toHaveTextContent("確認済みフラグが立ち"),await e(t.getByTestId("verify-state")).toHaveTextContent("有効")})}},l={name:"US-UM03: ログインしたい（メール/パスワード）",args:{initialView:"login"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("認証失敗時は分かりやすいエラーを表示する",async()=>{await n.type(t.getByLabelText("メールアドレス"),"reader@myriale.example"),await n.type(t.getByTestId("login-password"),"wrong-password"),await n.click(t.getByRole("button",{name:"ログインする"})),await e(t.getByTestId("um-notice")).toHaveTextContent("認証に失敗しました")}),await a("正しい資格情報でセッションを開始し、自分のデータへ",async()=>{await n.clear(t.getByTestId("login-password")),await n.type(t.getByTestId("login-password"),c),await n.click(t.getByRole("button",{name:"ログインする"})),await e(t.getByRole("region",{name:"プロフィール"})).toBeVisible(),await e(t.getByTestId("um-notice")).toHaveTextContent("セッションを開始")})}},w={name:"US-UM04: ログアウトしたい",args:{initialView:"profile"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("ログアウトすると認証セッションが無効化され、ログイン画面へ戻る",async()=>{await n.click(t.getByRole("button",{name:"ログアウト"})),await e(t.getByRole("main",{name:"ログイン"})).toBeVisible(),await e(t.getByTestId("um-notice")).toHaveTextContent("認証セッションを無効化")})}},m={name:"US-UM05: パスワードをリセットしたい",args:{initialView:"reset"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("メールアドレスでリセットを開始する（存在有無を過度に明かさない）",async()=>{await n.type(t.getByLabelText("メールアドレス"),"reader@myriale.example"),await n.click(t.getByRole("button",{name:"リセットメールを送信"})),await e(t.getByTestId("um-notice")).toHaveTextContent("期限付きのリセットリンク")}),await a("リンク先で新しいパスワードを設定する",async()=>{await n.type(t.getByTestId("reset-password"),c),await n.click(t.getByRole("button",{name:"新しいパスワードを保存"})),await e(t.getByTestId("um-notice")).toHaveTextContent("新しいパスワードを保存しました")})}},p={name:"US-UM06: OAuthで登録/ログインしたい",args:{initialView:"oauth"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("OAuthプロバイダを選んで認可し、ログインする",async()=>{await n.click(t.getByRole("button",{name:"Googleで続ける"})),await e(t.getByRole("region",{name:"プロフィール"})).toBeVisible(),await e(t.getByTestId("um-notice")).toHaveTextContent("外部IDと紐づくアカウント")})}},g={name:"US-UM07: OAuthアカウントと既存アカウントを統合したい",args:{initialView:"security"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("再認証なしでは連携を進めない",async()=>{await n.click(t.getByRole("button",{name:"Googleを連携"})),await e(t.getByTestId("um-notice")).toHaveTextContent("本人確認のため")}),await a("本人確認を経て同一Userにログイン手段を追加し、データは保持する",async()=>{await n.type(t.getByTestId("link-reauth"),c),await n.click(t.getByRole("button",{name:"Googleを連携"})),await e(t.getByTestId("um-notice")).toHaveTextContent("既存のシナリオ/セッション/ノートは保持"),await e(t.getByRole("region",{name:"OAuth連携"})).toHaveTextContent("連携済み")})}},u={name:"US-UM08: プロフィールを閲覧したい",args:{initialView:"profile"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("現在のプロフィール値が表示される",async()=>{const o=t.getByTestId("profile-summary");await e(o).toHaveTextContent("表示名"),await e(o).toHaveTextContent("霧野しおり"),await e(o).toHaveTextContent("言語/表示"),await e(o).toHaveTextContent("通知設定")})}},v={name:"US-UM09: プロフィールを編集したい",args:{initialView:"profile-edit"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("表示名を空にすると保存できない",async()=>{await n.clear(t.getByTestId("edit-display-name")),await n.click(t.getByRole("button",{name:"変更を保存"})),await e(t.getByTestId("um-notice")).toHaveTextContent("表示名は空にできません")}),await a("表示名を更新して保存すると、UI表示に反映される",async()=>{await n.type(t.getByTestId("edit-display-name"),"霧野しおり改"),await n.click(t.getByRole("button",{name:"変更を保存"})),await e(t.getByTestId("um-notice")).toHaveTextContent("保存しました"),await e(t.getByTestId("profile-summary")).toHaveTextContent("霧野しおり改")})}},d={name:"US-UM10: アカウントのセキュリティ設定を管理したい",args:{initialView:"security"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("ログイン履歴を閲覧できる",async()=>{await e(t.getByTestId("login-history")).toHaveTextContent("現在のセッション")}),await a("他端末ログアウトで設定変更が反映される",async()=>{await n.click(t.getByRole("button",{name:"他のすべての端末からログアウト"})),await e(t.getByTestId("um-notice")).toHaveTextContent("セッションを無効化しました")})}},T={name:"US-UM11: アカウントを削除（退会）したい",args:{initialView:"withdraw"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("注意事項の同意と再認証がそろうまで削除ボタンは押せない",async()=>{await e(t.getByRole("button",{name:"アカウントを削除する"})).toBeDisabled(),await n.click(t.getByLabelText("退会の注意事項を理解しました")),await n.type(t.getByTestId("withdraw-password"),c),await e(t.getByRole("button",{name:"アカウントを削除する"})).toBeEnabled()}),await a("削除を確定すると、ログインできない削除済み状態になる",async()=>{await n.click(t.getByRole("button",{name:"アカウントを削除する"})),await e(t.getByTestId("withdraw-result")).toHaveTextContent("削除済み"),await e(t.getByTestId("um-notice")).toHaveTextContent("ログインできなくなります")})}},B={name:"US-UM12: 退会前にデータをエクスポートしたい",args:{initialView:"export"},play:async({canvasElement:s,step:a})=>{const t=i(s),o=i(s.ownerDocument.body);await a("対象とフォーマットを選んでエクスポートする",async()=>{await n.click(t.getByRole("combobox",{name:"形式"})),await n.click(await o.findByRole("option",{name:"JSON"})),await n.click(t.getByRole("button",{name:"エクスポートを作成"})),await e(t.getByTestId("export-result")).toHaveTextContent("JSON 形式で書き出しました"),await e(t.getByTestId("export-result")).toHaveTextContent("シナリオ")})}},x={name:"US-UM13: 管理者としてユーザー一覧を管理したい",args:{initialView:"admin-list"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("ユーザーの基本情報（登録日・最終ログイン等）が見られる",async()=>{await e(t.getByRole("region",{name:"ユーザー一覧"})).toBeVisible(),await e(t.getByTestId("user-row-USR-1031")).toHaveTextContent("2026-06-20")}),await a("条件で検索して絞り込める",async()=>{await n.type(t.getByLabelText("ユーザーを検索"),"星見"),await e(t.getByTestId("user-row-USR-1088")).toBeVisible(),await e(t.queryByTestId("user-row-USR-1031")).not.toBeInTheDocument()})}},U={name:"US-UM14: 管理者として不正ユーザーを制限したい",args:{initialView:"admin-list"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("一覧から対象ユーザーの詳細を開く",async()=>{await n.click(t.getByRole("button",{name:"霧野しおりを開く"})),await e(t.getByRole("region",{name:"ユーザー詳細"})).toBeVisible(),await e(t.getByTestId("detail-state")).toHaveTextContent("有効")}),await a("状態を停止に変更し、変更は監査ログに残る",async()=>{await n.click(t.getByRole("button",{name:"停止する"})),await e(t.getByTestId("detail-state")).toHaveTextContent("停止中"),await e(t.getByTestId("um-notice")).toHaveTextContent("監査ログに残ります")})}},I={name:"US-UM15: 管理者としてサポート対応のためユーザー情報を参照したい",args:{initialView:"admin-detail"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("利用状況を参照でき、個人情報は権限で制御される",async()=>{const o=t.getByTestId("detail-summary");await e(o).toHaveTextContent("セッション"),await e(o).toHaveTextContent("権限により一部マスク")})}},E={name:"US-UM16: 監査ログを残したい",args:{initialView:"audit"},play:async({canvasElement:s,step:a})=>{const t=i(s);await a("重要操作が監査ログに残る",async()=>{await e(t.getByTestId("audit-log")).toHaveTextContent("ログイン失敗"),await e(t.getByTestId("audit-log")).toHaveTextContent("退会")}),await a("操作や対象で検索できる",async()=>{await n.type(t.getByLabelText("監査ログを検索"),"OAuth"),await e(t.getByTestId("audit-log")).toHaveTextContent("OAuth連携を追加"),await e(t.getByTestId("audit-log")).not.toHaveTextContent("ログイン失敗")})}};var C,H,R;r.parameters={...r.parameters,docs:{...(C=r.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: 'US-UM01: 新規登録したい（メール/パスワード）',
  args: {
    initialView: 'register'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('パスワード要件を満たさないと登録できない', async () => {
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'new-reader@example.com');
      await userEvent.type(canvas.getByTestId('register-password'), 'short');
      await userEvent.click(canvas.getByRole('button', {
        name: '登録する'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('要件を満たしていません');
    });
    await step('要件を満たすパスワードで登録し、UserIdを発行する', async () => {
      await userEvent.clear(canvas.getByTestId('register-password'));
      await userEvent.type(canvas.getByTestId('register-password'), strongPassword);
      await userEvent.type(canvas.getByLabelText('パスワード（確認）'), strongPassword);
      await userEvent.click(canvas.getByRole('button', {
        name: '登録する'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('アカウントを作成しました');
      await expect(canvas.getByTestId('issued-user-id')).toHaveTextContent('USR-2F9A');
    });
  }
}`,...(R=(H=r.parameters)==null?void 0:H.docs)==null?void 0:R.source}}};var S,M,h;y.parameters={...y.parameters,docs:{...(S=y.parameters)==null?void 0:S.docs,source:{originalSource:`{
  name: 'US-UM02: 新規登録時にメール確認をしたい（任意）',
  args: {
    initialView: 'verify'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('確認前はメール未確認の状態が示される', async () => {
      await expect(canvas.getByTestId('verify-state')).toHaveTextContent('メール未確認');
    });
    await step('確認リンクを開くと確認済みフラグが立つ', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '確認リンクを開く'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('確認済みフラグが立ち');
      await expect(canvas.getByTestId('verify-state')).toHaveTextContent('有効');
    });
  }
}`,...(h=(M=y.parameters)==null?void 0:M.docs)==null?void 0:h.source}}};var k,V,f;l.parameters={...l.parameters,docs:{...(k=l.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: 'US-UM03: ログインしたい（メール/パスワード）',
  args: {
    initialView: 'login'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('認証失敗時は分かりやすいエラーを表示する', async () => {
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'reader@myriale.example');
      await userEvent.type(canvas.getByTestId('login-password'), 'wrong-password');
      await userEvent.click(canvas.getByRole('button', {
        name: 'ログインする'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('認証に失敗しました');
    });
    await step('正しい資格情報でセッションを開始し、自分のデータへ', async () => {
      await userEvent.clear(canvas.getByTestId('login-password'));
      await userEvent.type(canvas.getByTestId('login-password'), strongPassword);
      await userEvent.click(canvas.getByRole('button', {
        name: 'ログインする'
      }));
      await expect(canvas.getByRole('region', {
        name: 'プロフィール'
      })).toBeVisible();
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('セッションを開始');
    });
  }
}`,...(f=(V=l.parameters)==null?void 0:V.docs)==null?void 0:f.source}}};var A,L,O;w.parameters={...w.parameters,docs:{...(A=w.parameters)==null?void 0:A.docs,source:{originalSource:`{
  name: 'US-UM04: ログアウトしたい',
  args: {
    initialView: 'profile'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ログアウトすると認証セッションが無効化され、ログイン画面へ戻る', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'ログアウト'
      }));
      await expect(canvas.getByRole('main', {
        name: 'ログイン'
      })).toBeVisible();
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('認証セッションを無効化');
    });
  }
}`,...(O=(L=w.parameters)==null?void 0:L.docs)==null?void 0:O.source}}};var D,P,G;m.parameters={...m.parameters,docs:{...(D=m.parameters)==null?void 0:D.docs,source:{originalSource:`{
  name: 'US-UM05: パスワードをリセットしたい',
  args: {
    initialView: 'reset'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('メールアドレスでリセットを開始する（存在有無を過度に明かさない）', async () => {
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'reader@myriale.example');
      await userEvent.click(canvas.getByRole('button', {
        name: 'リセットメールを送信'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('期限付きのリセットリンク');
    });
    await step('リンク先で新しいパスワードを設定する', async () => {
      await userEvent.type(canvas.getByTestId('reset-password'), strongPassword);
      await userEvent.click(canvas.getByRole('button', {
        name: '新しいパスワードを保存'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('新しいパスワードを保存しました');
    });
  }
}`,...(G=(P=m.parameters)==null?void 0:P.docs)==null?void 0:G.source}}};var J,N,W;p.parameters={...p.parameters,docs:{...(J=p.parameters)==null?void 0:J.docs,source:{originalSource:`{
  name: 'US-UM06: OAuthで登録/ログインしたい',
  args: {
    initialView: 'oauth'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('OAuthプロバイダを選んで認可し、ログインする', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'Googleで続ける'
      }));
      await expect(canvas.getByRole('region', {
        name: 'プロフィール'
      })).toBeVisible();
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('外部IDと紐づくアカウント');
    });
  }
}`,...(W=(N=p.parameters)==null?void 0:N.docs)==null?void 0:W.source}}};var j,q,F;g.parameters={...g.parameters,docs:{...(j=g.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'US-UM07: OAuthアカウントと既存アカウントを統合したい',
  args: {
    initialView: 'security'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('再認証なしでは連携を進めない', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'Googleを連携'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('本人確認のため');
    });
    await step('本人確認を経て同一Userにログイン手段を追加し、データは保持する', async () => {
      await userEvent.type(canvas.getByTestId('link-reauth'), strongPassword);
      await userEvent.click(canvas.getByRole('button', {
        name: 'Googleを連携'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('既存のシナリオ/セッション/ノートは保持');
      await expect(canvas.getByRole('region', {
        name: 'OAuth連携'
      })).toHaveTextContent('連携済み');
    });
  }
}`,...(F=(q=g.parameters)==null?void 0:q.docs)==null?void 0:F.source}}};var _,z,K;u.parameters={...u.parameters,docs:{...(_=u.parameters)==null?void 0:_.docs,source:{originalSource:`{
  name: 'US-UM08: プロフィールを閲覧したい',
  args: {
    initialView: 'profile'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('現在のプロフィール値が表示される', async () => {
      const summary = canvas.getByTestId('profile-summary');
      await expect(summary).toHaveTextContent('表示名');
      await expect(summary).toHaveTextContent('霧野しおり');
      await expect(summary).toHaveTextContent('言語/表示');
      await expect(summary).toHaveTextContent('通知設定');
    });
  }
}`,...(K=(z=u.parameters)==null?void 0:z.docs)==null?void 0:K.source}}};var Q,X,Y;v.parameters={...v.parameters,docs:{...(Q=v.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  name: 'US-UM09: プロフィールを編集したい',
  args: {
    initialView: 'profile-edit'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('表示名を空にすると保存できない', async () => {
      await userEvent.clear(canvas.getByTestId('edit-display-name'));
      await userEvent.click(canvas.getByRole('button', {
        name: '変更を保存'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('表示名は空にできません');
    });
    await step('表示名を更新して保存すると、UI表示に反映される', async () => {
      await userEvent.type(canvas.getByTestId('edit-display-name'), '霧野しおり改');
      await userEvent.click(canvas.getByRole('button', {
        name: '変更を保存'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('保存しました');
      await expect(canvas.getByTestId('profile-summary')).toHaveTextContent('霧野しおり改');
    });
  }
}`,...(Y=(X=v.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};var Z,$,tt;d.parameters={...d.parameters,docs:{...(Z=d.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  name: 'US-UM10: アカウントのセキュリティ設定を管理したい',
  args: {
    initialView: 'security'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ログイン履歴を閲覧できる', async () => {
      await expect(canvas.getByTestId('login-history')).toHaveTextContent('現在のセッション');
    });
    await step('他端末ログアウトで設定変更が反映される', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '他のすべての端末からログアウト'
      }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('セッションを無効化しました');
    });
  }
}`,...(tt=($=d.parameters)==null?void 0:$.docs)==null?void 0:tt.source}}};var et,at,nt;T.parameters={...T.parameters,docs:{...(et=T.parameters)==null?void 0:et.docs,source:{originalSource:`{
  name: 'US-UM11: アカウントを削除（退会）したい',
  args: {
    initialView: 'withdraw'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('注意事項の同意と再認証がそろうまで削除ボタンは押せない', async () => {
      await expect(canvas.getByRole('button', {
        name: 'アカウントを削除する'
      })).toBeDisabled();
      await userEvent.click(canvas.getByLabelText('退会の注意事項を理解しました'));
      await userEvent.type(canvas.getByTestId('withdraw-password'), strongPassword);
      await expect(canvas.getByRole('button', {
        name: 'アカウントを削除する'
      })).toBeEnabled();
    });
    await step('削除を確定すると、ログインできない削除済み状態になる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'アカウントを削除する'
      }));
      await expect(canvas.getByTestId('withdraw-result')).toHaveTextContent('削除済み');
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('ログインできなくなります');
    });
  }
}`,...(nt=(at=T.parameters)==null?void 0:at.docs)==null?void 0:nt.source}}};var st,it,ot;B.parameters={...B.parameters,docs:{...(st=B.parameters)==null?void 0:st.docs,source:{originalSource:`{
  name: 'US-UM12: 退会前にデータをエクスポートしたい',
  args: {
    initialView: 'export'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('対象とフォーマットを選んでエクスポートする', async () => {
      await userEvent.click(canvas.getByRole('combobox', {
        name: '形式'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: 'JSON'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: 'エクスポートを作成'
      }));
      await expect(canvas.getByTestId('export-result')).toHaveTextContent('JSON 形式で書き出しました');
      await expect(canvas.getByTestId('export-result')).toHaveTextContent('シナリオ');
    });
  }
}`,...(ot=(it=B.parameters)==null?void 0:it.docs)==null?void 0:ot.source}}};var ct,rt,yt;x.parameters={...x.parameters,docs:{...(ct=x.parameters)==null?void 0:ct.docs,source:{originalSource:`{
  name: 'US-UM13: 管理者としてユーザー一覧を管理したい',
  args: {
    initialView: 'admin-list'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ユーザーの基本情報（登録日・最終ログイン等）が見られる', async () => {
      await expect(canvas.getByRole('region', {
        name: 'ユーザー一覧'
      })).toBeVisible();
      await expect(canvas.getByTestId('user-row-USR-1031')).toHaveTextContent('2026-06-20');
    });
    await step('条件で検索して絞り込める', async () => {
      await userEvent.type(canvas.getByLabelText('ユーザーを検索'), '星見');
      await expect(canvas.getByTestId('user-row-USR-1088')).toBeVisible();
      await expect(canvas.queryByTestId('user-row-USR-1031')).not.toBeInTheDocument();
    });
  }
}`,...(yt=(rt=x.parameters)==null?void 0:rt.docs)==null?void 0:yt.source}}};var lt,wt,mt;U.parameters={...U.parameters,docs:{...(lt=U.parameters)==null?void 0:lt.docs,source:{originalSource:`{
  name: 'US-UM14: 管理者として不正ユーザーを制限したい',
  args: {
    initialView: 'admin-list'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('一覧から対象ユーザーの詳細を開く', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '霧野しおりを開く'
      }));
      await expect(canvas.getByRole('region', {
        name: 'ユーザー詳細'
      })).toBeVisible();
      await expect(canvas.getByTestId('detail-state')).toHaveTextContent('有効');
    });
    await step('状態を停止に変更し、変更は監査ログに残る', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '停止する'
      }));
      await expect(canvas.getByTestId('detail-state')).toHaveTextContent('停止中');
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('監査ログに残ります');
    });
  }
}`,...(mt=(wt=U.parameters)==null?void 0:wt.docs)==null?void 0:mt.source}}};var pt,gt,ut;I.parameters={...I.parameters,docs:{...(pt=I.parameters)==null?void 0:pt.docs,source:{originalSource:`{
  name: 'US-UM15: 管理者としてサポート対応のためユーザー情報を参照したい',
  args: {
    initialView: 'admin-detail'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('利用状況を参照でき、個人情報は権限で制御される', async () => {
      const summary = canvas.getByTestId('detail-summary');
      await expect(summary).toHaveTextContent('セッション');
      await expect(summary).toHaveTextContent('権限により一部マスク');
    });
  }
}`,...(ut=(gt=I.parameters)==null?void 0:gt.docs)==null?void 0:ut.source}}};var vt,dt,Tt;E.parameters={...E.parameters,docs:{...(vt=E.parameters)==null?void 0:vt.docs,source:{originalSource:`{
  name: 'US-UM16: 監査ログを残したい',
  args: {
    initialView: 'audit'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('重要操作が監査ログに残る', async () => {
      await expect(canvas.getByTestId('audit-log')).toHaveTextContent('ログイン失敗');
      await expect(canvas.getByTestId('audit-log')).toHaveTextContent('退会');
    });
    await step('操作や対象で検索できる', async () => {
      await userEvent.type(canvas.getByLabelText('監査ログを検索'), 'OAuth');
      await expect(canvas.getByTestId('audit-log')).toHaveTextContent('OAuth連携を追加');
      await expect(canvas.getByTestId('audit-log')).not.toHaveTextContent('ログイン失敗');
    });
  }
}`,...(Tt=(dt=E.parameters)==null?void 0:dt.docs)==null?void 0:Tt.source}}};const At=["UM01RegisterWithEmail","UM02VerifyEmail","UM03LoginWithEmail","UM04Logout","UM05ResetPassword","UM06OAuthSignIn","UM07LinkOAuthToAccount","UM08ViewProfile","UM09EditProfile","UM10ManageSecurity","UM11DeleteAccount","UM12ExportData","UM13AdminUserList","UM14SuspendUser","UM15SupportLookup","UM16AuditLog"];export{r as UM01RegisterWithEmail,y as UM02VerifyEmail,l as UM03LoginWithEmail,w as UM04Logout,m as UM05ResetPassword,p as UM06OAuthSignIn,g as UM07LinkOAuthToAccount,u as UM08ViewProfile,v as UM09EditProfile,d as UM10ManageSecurity,T as UM11DeleteAccount,B as UM12ExportData,x as UM13AdminUserList,U as UM14SuspendUser,I as UM15SupportLookup,E as UM16AuditLog,At as __namedExportsOrder,ft as default};
