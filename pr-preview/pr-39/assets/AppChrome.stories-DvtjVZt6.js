import{j as p}from"./jsx-runtime-BO8uF4Og.js";import{w as a,e,u}from"./index-C4S39nCK.js";import{A as x}from"./AppChrome-g5XN0vrs.js";import"./index-D4H_InIO.js";import"./Textarea-CZBz46eo.js";import"./MyrialeToggle-BOe0OaPT.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-B2wDKsEi.js";const O={title:"コンポーネント/AppChrome",component:x,parameters:{layout:"fullscreen",notes:"全ワイヤー共通のアプリ・ナビゲーション。上部バー（ブランド / セクション / アカウントメニュー）とパンくずで、実アプリと同じ移動ができます。各セクションやアカウントメニューから対応ワイヤーのストーリーへ遷移します。",docs:{description:{component:`AppChrome — the global application navigation shared by every page.

This is the real product chrome (top app bar with brand + sections + account
menu, plus a breadcrumb row) that wraps each screen, replacing the earlier
page-level flow strip. Rendered here on its own so the navigation model
and its menus can be reviewed in isolation.`}}}},m=p.jsx("div",{style:{padding:28,font:"14px/1.6 Inter, sans-serif",color:"#241b2f"},children:p.jsx("p",{style:{margin:0,color:"#5f506c"},children:"ここに各アプリ画面の画面が入ります。上のバーとパンくずがアプリ全体の現在地と移動先を示します。"})}),s={name:"ログイン中（アカウントメニューあり）",args:{section:"library",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"ライブラリ",to:"scenarioRegister"},{label:"シナリオを登録"}],account:{name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"},children:m},play:async({canvasElement:t,step:n})=>{const i=a(t),o=a(t.ownerDocument.body),l=i.getByRole("navigation",{name:"主要セクション"});await n("主要セクションがアプリバーに並ぶ",async()=>{await e(l).toBeVisible(),await e(a(l).getByRole("button",{name:/ライブラリ/})).toHaveAttribute("aria-current","page")}),await n("セクションを開くとページ一覧（メニュー）が出る",async()=>{await u.click(a(l).getByRole("button",{name:/セッション/})),await e(o.getByRole("menu")).toBeVisible(),await e(o.getByRole("menuitem",{name:/セッションを開始/})).toBeVisible()}),await n("アカウントメニューを開ける",async()=>{await u.click(i.getByRole("button",{name:/アカウントメニュー: 霧野しおり/})),await e(o.getByRole("menuitem",{name:"プロフィール"})).toBeVisible(),await e(o.getByRole("menuitem",{name:"ログアウト"})).toBeVisible()})}},r={name:"サインアウト（ログイン/新規登録）",args:{section:"account",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"アカウント"},{label:"ログイン"}],account:null,children:m},play:async({canvasElement:t})=>{const n=a(t);await e(n.getByRole("button",{name:"ログイン"})).toBeVisible(),await e(n.getByRole("button",{name:"新規登録"})).toBeVisible()}},c={name:"運用セクション（管理者）",args:{section:"operations",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"運用",to:"adminUsers"},{label:"ユーザー一覧"}],account:{name:"運用 司書",email:"ops@myriale.example",initials:"運",role:"管理者"},children:m},play:async({canvasElement:t})=>{const n=a(t),i=n.getByRole("navigation",{name:"主要セクション"});await e(a(i).getByRole("button",{name:/運用/})).toHaveAttribute("aria-current","page"),await e(n.getByRole("navigation",{name:"現在地"})).toHaveTextContent("ユーザー一覧")}};var b,g,y;s.parameters={...s.parameters,docs:{...(b=s.parameters)==null?void 0:b.docs,source:{originalSource:`{
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
    const screen = within(canvasElement.ownerDocument.body);
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
      await expect(screen.getByRole('menu')).toBeVisible();
      await expect(screen.getByRole('menuitem', {
        name: /セッションを開始/
      })).toBeVisible();
    });
    await step('アカウントメニューを開ける', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: /アカウントメニュー: 霧野しおり/
      }));
      await expect(screen.getByRole('menuitem', {
        name: 'プロフィール'
      })).toBeVisible();
      await expect(screen.getByRole('menuitem', {
        name: 'ログアウト'
      })).toBeVisible();
    });
  }
}`,...(y=(g=s.parameters)==null?void 0:g.docs)==null?void 0:y.source}}};var d,w,B;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
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
}`,...(B=(w=r.parameters)==null?void 0:w.docs)==null?void 0:B.source}}};var v,R,h;c.parameters={...c.parameters,docs:{...(v=c.parameters)==null?void 0:v.docs,source:{originalSource:`{
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
}`,...(h=(R=c.parameters)==null?void 0:R.docs)==null?void 0:h.source}}};const j=["SignedIn","SignedOut","OperationsConsole"];export{c as OperationsConsole,s as SignedIn,r as SignedOut,j as __namedExportsOrder,O as default};
