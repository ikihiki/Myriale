import{j as g}from"./jsx-runtime-BO8uF4Og.js";import{w as n,e,u as b}from"./index-C4S39nCK.js";import{A}from"./AppChrome-CBArT6hJ.js";import"./index-D4H_InIO.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-DnR2L1gN.js";import"./editPaneLayer-BYDGh10V.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CuT8m0Jw.js";const L={title:"コンポーネント/AppChrome",component:A,parameters:{layout:"fullscreen",notes:"全ワイヤー共通のアプリ・ナビゲーション。上部バー（ブランド / セクション / アカウントメニュー）とパンくずで、実アプリと同じ移動ができます。各セクションやアカウントメニューから対応ワイヤーのストーリーへ遷移します。",docs:{description:{component:`AppChrome — the global application navigation shared by every page.

This is the real product chrome (top app bar with brand + sections + account
menu, plus a breadcrumb row) that wraps each screen, replacing the earlier
page-level flow strip. Rendered here on its own so the navigation model
and its menus can be reviewed in isolation.`}}}},u=g.jsx("div",{style:{padding:28,font:"14px/1.6 Inter, sans-serif",color:"#241b2f"},children:g.jsx("p",{style:{margin:0,color:"#5f506c"},children:"ここに各アプリ画面の画面が入ります。上のバーとパンくずがアプリ全体の現在地と移動先を示します。"})}),l={name:"ログイン中（アカウントメニューあり）",args:{section:"library",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"ライブラリ",to:"scenarioRegister"},{label:"シナリオを登録"}],account:{name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"},children:u},play:async({canvasElement:i,step:a})=>{const o=n(i),t=n(i.ownerDocument.body),s=o.getByRole("navigation",{name:"主要セクション"});await a("主要セクションがアプリバーに並ぶ",async()=>{await e(s).toBeVisible(),await e(n(s).getByRole("button",{name:/ライブラリ/})).toHaveAttribute("aria-current","page")}),await a("ライブラリにはシナリオ一覧と登録だけが並ぶ",async()=>{await b.click(n(s).getByRole("button",{name:/ライブラリ/}));const r=t.getByRole("menu");await e(r).toBeVisible(),await e(n(r).getAllByRole("menuitem")).toHaveLength(2),await e(n(r).getByRole("menuitem",{name:/シナリオ一覧/})).toBeVisible(),await e(n(r).getByRole("menuitem",{name:/シナリオ登録/})).toBeVisible()}),await a("アカウントメニューを開ける",async()=>{await b.click(o.getByRole("button",{name:/アカウントメニュー: 霧野しおり/})),await e(t.getByRole("menuitem",{name:"プロフィール"})).toBeVisible(),await e(t.getByRole("menuitem",{name:"ログアウト"})).toBeVisible()})}},c={name:"スマホ — ハンバーガーから縦メニュー",parameters:{viewport:{defaultViewport:"mobile1"}},args:{section:"library",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"ライブラリ",to:"scenarioRegister"},{label:"シナリオを登録"}],account:{name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"},children:u},play:async({canvasElement:i,step:a})=>{const o=n(i);await a("狭い画面では主要ナビをハンバーガーに格納する",async()=>{const t=o.getByRole("navigation",{name:"主要セクション"});await e(t).toHaveClass("max-md:hidden");const s=o.getByRole("button",{name:"メニューを開く"});await e(s).toHaveClass("max-md:grid"),await e(s).toHaveAttribute("aria-expanded","false"),await b.click(s)}),await a("セクションとアカウント操作を縦方向に表示する",async()=>{const t=o.getByRole("navigation",{name:"モバイルメニュー"});await e(t).toBeVisible(),await e(n(t).getByRole("button",{name:/^ライブラリ/})).toHaveAttribute("aria-current","page"),await e(n(t).getByRole("button",{name:/シナリオ登録/})).toBeVisible(),await e(n(t).getByRole("button",{name:"プロフィール"})).toBeVisible()})}},m={name:"サインアウト（ログイン/新規登録）",args:{section:"account",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"アカウント"},{label:"ログイン"}],account:null,children:u},play:async({canvasElement:i})=>{const a=n(i);await e(a.getByRole("button",{name:"ログイン"})).toBeVisible(),await e(a.getByRole("button",{name:"新規登録"})).toBeVisible()}},p={name:"運用セクション（管理者）",args:{section:"operations",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"運用",to:"adminUsers"},{label:"ユーザー一覧"}],account:{name:"運用 司書",email:"ops@myriale.example",initials:"運",role:"管理者"},children:u},play:async({canvasElement:i})=>{const a=n(i),o=a.getByRole("navigation",{name:"主要セクション"});await e(n(o).getByRole("button",{name:/運用/})).toHaveAttribute("aria-current","page"),await e(a.getByRole("navigation",{name:"現在地"})).toHaveTextContent("ユーザー一覧")}};var y,w,d;l.parameters={...l.parameters,docs:{...(y=l.parameters)==null?void 0:y.docs,source:{originalSource:`{
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
}`,...(d=(w=l.parameters)==null?void 0:w.docs)==null?void 0:d.source}}};var v,B,R;c.parameters={...c.parameters,docs:{...(v=c.parameters)==null?void 0:v.docs,source:{originalSource:`{
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
      const primaryNavigation = canvas.getByRole('navigation', {
        name: '主要セクション'
      });
      await expect(primaryNavigation).toHaveClass('max-md:hidden');
      const trigger = canvas.getByRole('button', {
        name: 'メニューを開く'
      });
      await expect(trigger).toHaveClass('max-md:grid');
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
}`,...(R=(B=c.parameters)==null?void 0:B.docs)==null?void 0:R.source}}};var h,x,V;m.parameters={...m.parameters,docs:{...(h=m.parameters)==null?void 0:h.docs,source:{originalSource:`{
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
}`,...(V=(x=m.parameters)==null?void 0:x.docs)==null?void 0:V.source}}};var H,M,f;p.parameters={...p.parameters,docs:{...(H=p.parameters)==null?void 0:H.docs,source:{originalSource:`{
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
}`,...(f=(M=p.parameters)==null?void 0:M.docs)==null?void 0:f.source}}};const U=["SignedIn","MobileNavigation","SignedOut","OperationsConsole"];export{c as MobileNavigation,p as OperationsConsole,l as SignedIn,m as SignedOut,U as __namedExportsOrder,L as default};
