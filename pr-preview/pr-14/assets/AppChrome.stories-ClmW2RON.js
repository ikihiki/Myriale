import{j as m}from"./jsx-runtime-Cf8x2fCZ.js";import{w as t,e,u as p}from"./index-C3Z0PGzo.js";import{A as h}from"./AppChrome-DEx1aaG4.js";import"./index-yBjzXJbu.js";import"./index-BlmOqGMO.js";const A={title:"App shell/Global navigation",component:h,parameters:{layout:"fullscreen",notes:"全ワイヤー共通のアプリ・ナビゲーション。上部バー（ブランド / セクション / アカウントメニュー）とパンくずで、実アプリと同じ移動ができます。各セクションやアカウントメニューから対応ワイヤーのストーリーへ遷移します。",docs:{description:{component:`AppChrome — the global application navigation shared by every wireframe.

This is the real product chrome (top app bar with brand + sections + account
menu, plus a breadcrumb row) that wraps each screen, replacing the earlier
wireframe-style flow strip. Rendered here on its own so the navigation model
and its menus can be reviewed in isolation.`}}}},l=m.jsx("div",{style:{padding:28,font:"14px/1.6 Inter, sans-serif",color:"#241b2f"},children:m.jsx("p",{style:{margin:0,color:"#5f506c"},children:"ここに各ワイヤーフレームの画面が入ります。上のバーとパンくずがアプリ全体の現在地と移動先を示します。"})}),o={name:"ログイン中（アカウントメニューあり）",args:{section:"library",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"ライブラリ",to:"scenarioRegister"},{label:"シナリオを登録"}],account:{name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"},children:l},play:async({canvasElement:i,step:n})=>{const a=t(i),c=a.getByRole("navigation",{name:"主要セクション"});await n("主要セクションがアプリバーに並ぶ",async()=>{await e(c).toBeVisible(),await e(t(c).getByRole("button",{name:/ライブラリ/})).toHaveAttribute("aria-current","page")}),await n("セクションを開くとページ一覧（メニュー）が出る",async()=>{await p.click(t(c).getByRole("button",{name:/セッション/})),await e(a.getByRole("menu",{name:"セッションメニュー"})).toBeVisible(),await e(a.getByRole("menuitem",{name:/セッションを開始/})).toBeVisible()}),await n("アカウントメニューを開ける",async()=>{await p.click(a.getByRole("button",{name:/アカウントメニュー: 霧野しおり/})),await e(a.getByRole("menuitem",{name:"プロフィール"})).toBeVisible(),await e(a.getByRole("menuitem",{name:"ログアウト"})).toBeVisible()})}},s={name:"サインアウト（ログイン/新規登録）",args:{section:"account",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"アカウント"},{label:"ログイン"}],account:null,children:l},play:async({canvasElement:i})=>{const n=t(i);await e(n.getByRole("button",{name:"ログイン"})).toBeVisible(),await e(n.getByRole("button",{name:"新規登録"})).toBeVisible()}},r={name:"運用セクション（管理者）",args:{section:"operations",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"運用",to:"adminUsers"},{label:"ユーザー一覧"}],account:{name:"運用 司書",email:"ops@myriale.example",initials:"運",role:"管理者"},children:l},play:async({canvasElement:i})=>{const n=t(i),a=n.getByRole("navigation",{name:"主要セクション"});await e(t(a).getByRole("button",{name:/運用/})).toHaveAttribute("aria-current","page"),await e(n.getByRole("navigation",{name:"現在地"})).toHaveTextContent("ユーザー一覧")}};var b,u,g;o.parameters={...o.parameters,docs:{...(b=o.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: 'ログイン中（アカウントメニューあり）',
  args: {
    section: 'library',
    breadcrumbs: [{
      label: 'Myriale',
      to: 'scenarioRegister'
    }, {
      label: 'ライブラリ',
      to: 'scenarioRegister'
    }, {
      label: 'シナリオを登録'
    }],
    account: {
      name: '霧野しおり',
      email: 'author@myriale.example',
      initials: '霧野',
      role: '作者'
    },
    children: demoScreen
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const sections = canvas.getByRole('navigation', {
      name: '主要セクション'
    });
    await step('主要セクションがアプリバーに並ぶ', async () => {
      await expect(sections).toBeVisible();
      await expect(within(sections).getByRole('button', {
        name: /ライブラリ/
      })).toHaveAttribute('aria-current', 'page');
    });
    await step('セクションを開くとページ一覧（メニュー）が出る', async () => {
      await userEvent.click(within(sections).getByRole('button', {
        name: /セッション/
      }));
      await expect(canvas.getByRole('menu', {
        name: 'セッションメニュー'
      })).toBeVisible();
      await expect(canvas.getByRole('menuitem', {
        name: /セッションを開始/
      })).toBeVisible();
    });
    await step('アカウントメニューを開ける', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: /アカウントメニュー: 霧野しおり/
      }));
      await expect(canvas.getByRole('menuitem', {
        name: 'プロフィール'
      })).toBeVisible();
      await expect(canvas.getByRole('menuitem', {
        name: 'ログアウト'
      })).toBeVisible();
    });
  }
}`,...(g=(u=o.parameters)==null?void 0:u.docs)==null?void 0:g.source}}};var y,d,w;s.parameters={...s.parameters,docs:{...(y=s.parameters)==null?void 0:y.docs,source:{originalSource:`{
  name: 'サインアウト（ログイン/新規登録）',
  args: {
    section: 'account',
    breadcrumbs: [{
      label: 'Myriale',
      to: 'scenarioRegister'
    }, {
      label: 'アカウント'
    }, {
      label: 'ログイン'
    }],
    account: null,
    children: demoScreen
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', {
      name: 'ログイン'
    })).toBeVisible();
    await expect(canvas.getByRole('button', {
      name: '新規登録'
    })).toBeVisible();
  }
}`,...(w=(d=s.parameters)==null?void 0:d.docs)==null?void 0:w.source}}};var v,B,R;r.parameters={...r.parameters,docs:{...(v=r.parameters)==null?void 0:v.docs,source:{originalSource:`{
  name: '運用セクション（管理者）',
  args: {
    section: 'operations',
    breadcrumbs: [{
      label: 'Myriale',
      to: 'scenarioRegister'
    }, {
      label: '運用',
      to: 'adminUsers'
    }, {
      label: 'ユーザー一覧'
    }],
    account: {
      name: '運用 司書',
      email: 'ops@myriale.example',
      initials: '運',
      role: '管理者'
    },
    children: demoScreen
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const sections = canvas.getByRole('navigation', {
      name: '主要セクション'
    });
    await expect(within(sections).getByRole('button', {
      name: /運用/
    })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('navigation', {
      name: '現在地'
    })).toHaveTextContent('ユーザー一覧');
  }
}`,...(R=(B=r.parameters)==null?void 0:B.docs)==null?void 0:R.source}}};const C=["SignedIn","SignedOut","OperationsConsole"];export{r as OperationsConsole,o as SignedIn,s as SignedOut,C as __namedExportsOrder,A as default};
