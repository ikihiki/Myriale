import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{r as m}from"./index-D4H_InIO.js";import{w as r,u as c,e as t}from"./index-C4S39nCK.js";import{a as l,I as T,T as O}from"./Surfaces-xpIMDkG0.js";import{E as d}from"./EditPane-BQJklamt.js";import{M as P}from"./MyrialeToggle-DCXJQOk6.js";import"./navigationRecipes-DkSbwkz5.js";import"./index-DzKAYa42.js";const G={title:"コンポーネント/EditPane",parameters:{layout:"fullscreen"}};function C(){const[n,o]=m.useState(!1);return e.jsxs("main",{className:"min-h-screen bg-[#eee7da] p-8",children:[e.jsx(l,{onClick:()=>o(!0),children:"場所を編集"}),e.jsx(d,{open:n,onOpenChange:o,eyebrow:"場所",title:"霧の図書館",description:"物語内で参照する場所の名前と空気を整えます。",footer:e.jsx(l,{onClick:()=>o(!1),children:"編集を完了"}),children:e.jsxs("div",{className:"grid gap-4",children:[e.jsxs("label",{children:["表示名",e.jsx(T,{defaultValue:"霧の図書館"})]}),e.jsxs("label",{children:["説明",e.jsx(O,{defaultValue:"書架のあいだを淡い霧が流れている。"})]})]})})]})}function H(){const[n,o]=m.useState(!1),[i,a]=m.useState(!1);return e.jsxs("main",{className:"min-h-screen bg-[#eee7da] p-8",children:[e.jsx(l,{onClick:()=>o(!0),children:"種類を編集"}),e.jsx(d,{open:n,onOpenChange:o,eyebrow:"オブジェクト種類",title:"書庫の扉",children:e.jsxs("div",{className:"grid gap-4",children:[e.jsx("p",{children:"状態定義をテーブルで管理します。"}),e.jsx(l,{onClick:()=>a(!0),children:"開いているを編集"})]})}),e.jsx(d,{layer:1,open:i,onOpenChange:a,eyebrow:"状態定義",title:"開いている",footer:e.jsx(l,{onClick:()=>a(!1),children:"状態の編集を完了"}),children:e.jsxs("label",{children:["状態code",e.jsx(T,{defaultValue:"open"})]})})]})}function V(){const[n,o]=m.useState(!1),[i,a]=m.useState(!1),[s,p]=m.useState("mist");return e.jsxs("main",{className:"min-h-screen bg-[#eee7da] p-8",children:[e.jsx(l,{onClick:()=>o(!0),children:"ポータル検証を開く"}),e.jsxs(d,{open:n,onOpenChange:o,eyebrow:"親",title:"親ペイン",children:[e.jsx("p",{children:"親ペインの内容です。"}),e.jsx(l,{onClick:()=>a(!0),children:"子ペインを開く"})]}),e.jsx(d,{layer:1,open:i,onOpenChange:a,eyebrow:"子",title:"子ペイン",children:e.jsxs("div",{className:"grid gap-4","data-testid":"child-pane-nearby-area",children:[e.jsx(P,{label:"語り口",value:s,onValueChange:p,options:[{value:"mist",label:"薄霧"},{value:"iris",label:"菫"},{value:"ember",label:"熾火"}]}),e.jsxs("p",{"data-testid":"selected-tone",children:["選択中: ",s]}),e.jsx(l,{variant:"ghost",children:"近くの操作"})]})})]})}const u={name:"デスクトップ — 編集ペインを重ねる",render:()=>e.jsx(H,{}),play:async({canvasElement:n})=>{const o=r(n),i=r(n.ownerDocument.body);await c.click(o.getByRole("button",{name:"種類を編集"})),await c.click(i.getByRole("button",{name:"開いているを編集"}));const a=i.getByRole("dialog",{name:"開いている"});await t(a).toBeVisible(),await t(a).toHaveAttribute("data-layer","1");const s=r(a).getByRole("separator",{name:"編集ペインの幅を変更"});await c.click(s),await c.keyboard("{Home}"),await t(s).toHaveAttribute("aria-valuenow","360"),await c.keyboard("{ArrowLeft}"),await t(s).toHaveAttribute("aria-valuenow","384")}},w={name:"Select — 子ペイン内ポータルとEscape階層",render:()=>e.jsx(V,{}),play:async({canvasElement:n,step:o})=>{const i=r(n),a=r(n.ownerDocument.body);await o("子ペイン内のSelect optionと余白を操作してもペインを閉じない",async()=>{await c.click(i.getByRole("button",{name:"ポータル検証を開く"})),await c.click(a.getByRole("button",{name:"子ペインを開く"}));const s=a.getByRole("dialog",{name:"子ペイン"});await c.click(r(s).getByRole("combobox",{name:"語り口"}));const p=await a.findByRole("option",{name:"熾火"});await t(s).toContainElement(p),await c.click(p),await t(a.getByTestId("selected-tone")).toHaveTextContent("ember"),await t(s).toBeInTheDocument(),await c.click(r(s).getByRole("combobox",{name:"語り口"}));const I=await a.findByRole("listbox");await c.click(I),await t(n.ownerDocument.querySelector('[data-edit-pane-layer="1"]')).toBeInTheDocument(),await t(n.ownerDocument.querySelector('[data-edit-pane-layer="0"]')).toBeInTheDocument()}),await o("EscapeはSelect、子ペイン、親ペインの順に閉じる",async()=>{await c.keyboard("{Escape}"),await t(a.queryByRole("listbox")).not.toBeInTheDocument(),await t(a.getByRole("dialog",{name:"子ペイン"})).toBeInTheDocument(),await c.click(a.getByRole("button",{name:"近くの操作"})),await t(a.getByRole("dialog",{name:"子ペイン"})).toBeInTheDocument(),await c.keyboard("{Escape}"),await t(a.queryByRole("dialog",{name:"子ペイン"})).not.toBeInTheDocument(),await t(a.getByRole("dialog",{name:"親ペイン"})).toBeInTheDocument(),await c.keyboard("{Escape}"),await t(a.queryByRole("dialog",{name:"親ペイン"})).not.toBeInTheDocument()})}},y={name:"デスクトップ — 右編集ペイン",render:()=>e.jsx(C,{}),play:async({canvasElement:n})=>{const o=r(n),i=r(n.ownerDocument.body);await c.click(o.getByRole("button",{name:"場所を編集"})),await t(i.getByRole("dialog",{name:"霧の図書館"})).toBeVisible(),await t(i.getByRole("button",{name:"編集ペインを閉じる"})).toBeVisible()}},h={name:"スマホ — 全画面編集",parameters:{viewport:{defaultViewport:"mobile1"}},render:()=>e.jsx(C,{}),play:async({canvasElement:n})=>{const o=r(n),i=r(n.ownerDocument.body);await c.click(o.getByRole("button",{name:"場所を編集"}));const a=i.getByRole("dialog",{name:"霧の図書館"});await t(a).toBeVisible(),await t(a).toHaveClass("max-md:w-screen"),await t(a).toHaveClass("max-md:h-[100dvh]")}};var b,g,x;u.parameters={...u.parameters,docs:{...(b=u.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: 'デスクトップ — 編集ペインを重ねる',
  render: () => <NestedPaneDemo />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', {
      name: '種類を編集'
    }));
    await userEvent.click(screen.getByRole('button', {
      name: '開いているを編集'
    }));
    const child = screen.getByRole('dialog', {
      name: '開いている'
    });
    await expect(child).toBeVisible();
    await expect(child).toHaveAttribute('data-layer', '1');
    const separator = within(child).getByRole('separator', {
      name: '編集ペインの幅を変更'
    });
    await userEvent.click(separator);
    await userEvent.keyboard('{Home}');
    await expect(separator).toHaveAttribute('aria-valuenow', '360');
    await userEvent.keyboard('{ArrowLeft}');
    await expect(separator).toHaveAttribute('aria-valuenow', '384');
  }
}`,...(x=(g=u.parameters)==null?void 0:g.docs)==null?void 0:x.source}}};var B,v,R;w.parameters={...w.parameters,docs:{...(B=w.parameters)==null?void 0:B.docs,source:{originalSource:`{
  name: 'Select — 子ペイン内ポータルとEscape階層',
  render: () => <NestedSelectPortalDemo />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('子ペイン内のSelect optionと余白を操作してもペインを閉じない', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'ポータル検証を開く'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: '子ペインを開く'
      }));
      const child = screen.getByRole('dialog', {
        name: '子ペイン'
      });
      await userEvent.click(within(child).getByRole('combobox', {
        name: '語り口'
      }));
      const option = await screen.findByRole('option', {
        name: '熾火'
      });
      await expect(child).toContainElement(option);
      await userEvent.click(option);
      await expect(screen.getByTestId('selected-tone')).toHaveTextContent('ember');
      await expect(child).toBeInTheDocument();
      await userEvent.click(within(child).getByRole('combobox', {
        name: '語り口'
      }));
      const listbox = await screen.findByRole('listbox');
      await userEvent.click(listbox);
      await expect(canvasElement.ownerDocument.querySelector('[data-edit-pane-layer="1"]')).toBeInTheDocument();
      await expect(canvasElement.ownerDocument.querySelector('[data-edit-pane-layer="0"]')).toBeInTheDocument();
    });
    await step('EscapeはSelect、子ペイン、親ペインの順に閉じる', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      await expect(screen.getByRole('dialog', {
        name: '子ペイン'
      })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', {
        name: '近くの操作'
      }));
      await expect(screen.getByRole('dialog', {
        name: '子ペイン'
      })).toBeInTheDocument();
      await userEvent.keyboard('{Escape}');
      await expect(screen.queryByRole('dialog', {
        name: '子ペイン'
      })).not.toBeInTheDocument();
      await expect(screen.getByRole('dialog', {
        name: '親ペイン'
      })).toBeInTheDocument();
      await userEvent.keyboard('{Escape}');
      await expect(screen.queryByRole('dialog', {
        name: '親ペイン'
      })).not.toBeInTheDocument();
    });
  }
}`,...(R=(v=w.parameters)==null?void 0:v.docs)==null?void 0:R.source}}};var E,k,D;y.parameters={...y.parameters,docs:{...(E=y.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: 'デスクトップ — 右編集ペイン',
  render: () => <PaneDemo />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', {
      name: '場所を編集'
    }));
    await expect(screen.getByRole('dialog', {
      name: '霧の図書館'
    })).toBeVisible();
    await expect(screen.getByRole('button', {
      name: '編集ペインを閉じる'
    })).toBeVisible();
  }
}`,...(D=(k=y.parameters)==null?void 0:k.docs)==null?void 0:D.source}}};var j,f,S;h.parameters={...h.parameters,docs:{...(j=h.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'スマホ — 全画面編集',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
  render: () => <PaneDemo />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', {
      name: '場所を編集'
    }));
    const dialog = screen.getByRole('dialog', {
      name: '霧の図書館'
    });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveClass('max-md:w-screen');
    await expect(dialog).toHaveClass('max-md:h-[100dvh]');
  }
}`,...(S=(f=h.parameters)==null?void 0:f.docs)==null?void 0:S.source}}};const J=["NestedOverlappingPane","SelectPortalAndEscapeHierarchy","DesktopRightPane","MobileFullScreen"];export{y as DesktopRightPane,h as MobileFullScreen,u as NestedOverlappingPane,w as SelectPortalAndEscapeHierarchy,J as __namedExportsOrder,G as default};
