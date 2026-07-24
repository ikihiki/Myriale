import{j as u}from"./jsx-runtime-BO8uF4Og.js";import{w as n,e,u as b}from"./index-C4S39nCK.js";import{A as V}from"./AppChrome-D1WZMIQm.js";import"./index-D4H_InIO.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BJ2tbK4f.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CtcPHE9S.js";const k={title:"コンポーネント/AppChrome",component:V,parameters:{layout:"fullscreen",notes:"全ワイヤー共通のアプリ・ナビゲーション。上部バー（ブランド / セクション / アカウントメニュー）とパンくずで、実アプリと同じ移動ができます。各セクションやアカウントメニューから対応ワイヤーのストーリーへ遷移します。",docs:{description:{component:`AppChrome — the global application navigation shared by every page.

This is the real product chrome (top app bar with brand + sections + account
menu, plus a breadcrumb row) that wraps each screen, replacing the earlier
page-level flow strip. Rendered here on its own so the navigation model
and its menus can be reviewed in isolation.`}}}},p=u.jsx("div",{style:{padding:28,font:"14px/1.6 Inter, sans-serif",color:"#241b2f"},children:u.jsx("p",{style:{margin:0,color:"#5f506c"},children:"ここに各アプリ画面の画面が入ります。上のバーとパンくずがアプリ全体の現在地と移動先を示します。"})}),s={name:"ログイン中（アカウントメニューあり）",args:{section:"library",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"ライブラリ",to:"scenarioRegister"},{label:"シナリオを登録"}],account:{name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"},children:p},play:async({canvasElement:t,step:a})=>{const i=n(t),l=n(t.ownerDocument.body),m=i.getByRole("navigation",{name:"主要セクション"});await a("主要セクションがアプリバーに並ぶ",async()=>{await e(m).toBeVisible(),await e(n(m).getByRole("button",{name:/ライブラリ/})).toHaveAttribute("aria-current","page")}),await a("ライブラリにはシナリオ一覧と登録だけが並ぶ",async()=>{await b.click(n(m).getByRole("button",{name:/ライブラリ/}));const o=l.getByRole("menu");await e(o).toBeVisible(),await e(n(o).getAllByRole("menuitem")).toHaveLength(2),await e(n(o).getByRole("menuitem",{name:/シナリオ一覧/})).toBeVisible(),await e(n(o).getByRole("menuitem",{name:/シナリオ登録/})).toBeVisible()}),await a("アカウントメニューを開ける",async()=>{await b.click(i.getByRole("button",{name:/アカウントメニュー: 霧野しおり/})),await e(l.getByRole("menuitem",{name:"プロフィール"})).toBeVisible(),await e(l.getByRole("menuitem",{name:"ログアウト"})).toBeVisible()})}},r={name:"サインアウト（ログイン/新規登録）",args:{section:"account",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"アカウント"},{label:"ログイン"}],account:null,children:p},play:async({canvasElement:t})=>{const a=n(t);await e(a.getByRole("button",{name:"ログイン"})).toBeVisible(),await e(a.getByRole("button",{name:"新規登録"})).toBeVisible()}},c={name:"運用セクション（管理者）",args:{section:"operations",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"運用",to:"adminUsers"},{label:"ユーザー一覧"}],account:{name:"運用 司書",email:"ops@myriale.example",initials:"運",role:"管理者"},children:p},play:async({canvasElement:t})=>{const a=n(t),i=a.getByRole("navigation",{name:"主要セクション"});await e(n(i).getByRole("button",{name:/運用/})).toHaveAttribute("aria-current","page"),await e(a.getByRole("navigation",{name:"現在地"})).toHaveTextContent("ユーザー一覧")}};var g,y,w;s.parameters={...s.parameters,docs:{...(g=s.parameters)==null?void 0:g.docs,source:{originalSource:`{
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
    await step('ライブラリにはシナリオ一覧と登録だけが並ぶ', async () => {
      await userEvent.click(within(sections).getByRole('button', {
        name: /ライブラリ/
      }));
      const menu = screen.getByRole('menu');
      await expect(menu).toBeVisible();
      await expect(within(menu).getAllByRole('menuitem')).toHaveLength(2);
      await expect(within(menu).getByRole('menuitem', {
        name: /シナリオ一覧/
      })).toBeVisible();
      await expect(within(menu).getByRole('menuitem', {
        name: /シナリオ登録/
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
}`,...(w=(y=s.parameters)==null?void 0:y.docs)==null?void 0:w.source}}};var d,B,v;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
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
}`,...(v=(B=r.parameters)==null?void 0:B.docs)==null?void 0:v.source}}};var R,h,x;c.parameters={...c.parameters,docs:{...(R=c.parameters)==null?void 0:R.docs,source:{originalSource:`{
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
}`,...(x=(h=c.parameters)==null?void 0:h.docs)==null?void 0:x.source}}};const I=["SignedIn","SignedOut","OperationsConsole"];export{c as OperationsConsole,s as SignedIn,r as SignedOut,I as __namedExportsOrder,k as default};
