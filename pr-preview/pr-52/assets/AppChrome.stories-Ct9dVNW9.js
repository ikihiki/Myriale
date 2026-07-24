import{j as g}from"./jsx-runtime-BO8uF4Og.js";import{w as n,e,u as p}from"./index-C4S39nCK.js";import{A as E}from"./AppChrome-CG0vUER4.js";import"./index-D4H_InIO.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BJ2tbK4f.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CtcPHE9S.js";const L={title:"コンポーネント/AppChrome",component:E,parameters:{layout:"fullscreen",notes:"全ワイヤー共通のアプリ・ナビゲーション。上部バー（ブランド / セクション / アカウントメニュー）とパンくずで、実アプリと同じ移動ができます。各セクションやアカウントメニューから対応ワイヤーのストーリーへ遷移します。",docs:{description:{component:`AppChrome — the global application navigation shared by every page.

This is the real product chrome (top app bar with brand + sections + account
menu, plus a breadcrumb row) that wraps each screen, replacing the earlier
page-level flow strip. Rendered here on its own so the navigation model
and its menus can be reviewed in isolation.`}}}},b=g.jsx("div",{style:{padding:28,font:"14px/1.6 Inter, sans-serif",color:"#241b2f"},children:g.jsx("p",{style:{margin:0,color:"#5f506c"},children:"ここに各アプリ画面の画面が入ります。上のバーとパンくずがアプリ全体の現在地と移動先を示します。"})}),r={name:"ログイン中（アカウントメニューあり）",args:{section:"library",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"ライブラリ",to:"scenarioRegister"},{label:"シナリオを登録"}],account:{name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"},children:b},play:async({canvasElement:i,step:a})=>{const o=n(i),t=n(i.ownerDocument.body),u=o.getByRole("navigation",{name:"主要セクション"});await a("主要セクションがアプリバーに並ぶ",async()=>{await e(u).toBeVisible(),await e(n(u).getByRole("button",{name:/ライブラリ/})).toHaveAttribute("aria-current","page")}),await a("ライブラリにはシナリオ一覧と登録だけが並ぶ",async()=>{await p.click(n(u).getByRole("button",{name:/ライブラリ/}));const s=t.getByRole("menu");await e(s).toBeVisible(),await e(n(s).getAllByRole("menuitem")).toHaveLength(2),await e(n(s).getByRole("menuitem",{name:/シナリオ一覧/})).toBeVisible(),await e(n(s).getByRole("menuitem",{name:/シナリオ登録/})).toBeVisible()}),await a("アカウントメニューを開ける",async()=>{await p.click(o.getByRole("button",{name:/アカウントメニュー: 霧野しおり/})),await e(t.getByRole("menuitem",{name:"プロフィール"})).toBeVisible(),await e(t.getByRole("menuitem",{name:"ログアウト"})).toBeVisible()})}},l={name:"スマホ — ハンバーガーから縦メニュー",parameters:{viewport:{defaultViewport:"mobile1"}},args:{section:"library",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"ライブラリ",to:"scenarioRegister"},{label:"シナリオを登録"}],account:{name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"},children:b},play:async({canvasElement:i,step:a})=>{const o=n(i);await a("狭い画面では主要ナビをハンバーガーに格納する",async()=>{await e(o.getByRole("navigation",{name:"主要セクション"})).not.toBeVisible();const t=o.getByRole("button",{name:"メニューを開く"});await e(t).toBeVisible(),await e(t).toHaveAttribute("aria-expanded","false"),await p.click(t)}),await a("セクションとアカウント操作を縦方向に表示する",async()=>{const t=o.getByRole("navigation",{name:"モバイルメニュー"});await e(t).toBeVisible(),await e(n(t).getByRole("button",{name:/^ライブラリ/})).toHaveAttribute("aria-current","page"),await e(n(t).getByRole("button",{name:/シナリオ登録/})).toBeVisible(),await e(n(t).getByRole("button",{name:"プロフィール"})).toBeVisible()})}},c={name:"サインアウト（ログイン/新規登録）",args:{section:"account",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"アカウント"},{label:"ログイン"}],account:null,children:b},play:async({canvasElement:i})=>{const a=n(i);await e(a.getByRole("button",{name:"ログイン"})).toBeVisible(),await e(a.getByRole("button",{name:"新規登録"})).toBeVisible()}},m={name:"運用セクション（管理者）",args:{section:"operations",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"運用",to:"adminUsers"},{label:"ユーザー一覧"}],account:{name:"運用 司書",email:"ops@myriale.example",initials:"運",role:"管理者"},children:b},play:async({canvasElement:i})=>{const a=n(i),o=a.getByRole("navigation",{name:"主要セクション"});await e(n(o).getByRole("button",{name:/運用/})).toHaveAttribute("aria-current","page"),await e(a.getByRole("navigation",{name:"現在地"})).toHaveTextContent("ユーザー一覧")}};var y,w,B;r.parameters={...r.parameters,docs:{...(y=r.parameters)==null?void 0:y.docs,source:{originalSource:`{
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
}`,...(B=(w=r.parameters)==null?void 0:w.docs)==null?void 0:B.source}}};var d,v,R;l.parameters={...l.parameters,docs:{...(d=l.parameters)==null?void 0:d.docs,source:{originalSource:`{
  name: 'スマホ — ハンバーガーから縦メニュー',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
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
    await step('狭い画面では主要ナビをハンバーガーに格納する', async () => {
      await expect(canvas.getByRole('navigation', {
        name: '主要セクション'
      })).not.toBeVisible();
      const trigger = canvas.getByRole('button', {
        name: 'メニューを開く'
      });
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await userEvent.click(trigger);
    });
    await step('セクションとアカウント操作を縦方向に表示する', async () => {
      const mobileMenu = canvas.getByRole('navigation', {
        name: 'モバイルメニュー'
      });
      await expect(mobileMenu).toBeVisible();
      await expect(within(mobileMenu).getByRole('button', {
        name: /^ライブラリ/
      })).toHaveAttribute('aria-current', 'page');
      await expect(within(mobileMenu).getByRole('button', {
        name: /シナリオ登録/
      })).toBeVisible();
      await expect(within(mobileMenu).getByRole('button', {
        name: 'プロフィール'
      })).toBeVisible();
    });
  }
}`,...(R=(v=l.parameters)==null?void 0:v.docs)==null?void 0:R.source}}};var h,x,V;c.parameters={...c.parameters,docs:{...(h=c.parameters)==null?void 0:h.docs,source:{originalSource:`{
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
}`,...(V=(x=c.parameters)==null?void 0:x.docs)==null?void 0:V.source}}};var M,f,A;m.parameters={...m.parameters,docs:{...(M=m.parameters)==null?void 0:M.docs,source:{originalSource:`{
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
}`,...(A=(f=m.parameters)==null?void 0:f.docs)==null?void 0:A.source}}};const N=["SignedIn","MobileNavigation","SignedOut","OperationsConsole"];export{l as MobileNavigation,m as OperationsConsole,r as SignedIn,c as SignedOut,N as __namedExportsOrder,L as default};
