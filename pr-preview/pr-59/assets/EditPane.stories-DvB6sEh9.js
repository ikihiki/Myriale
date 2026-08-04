import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{r as m}from"./index-D4H_InIO.js";import{w as s,u as i,e as a}from"./index-C4S39nCK.js";import{a as l,I,T as H}from"./Surfaces-hfywbPiG.js";import{E as d}from"./EditPane-CacH2v8L.js";import{M as V}from"./MyrialeToggle-CSioTFV0.js";import"./navigationRecipes-DkSbwkz5.js";import"./index-DzKAYa42.js";const G={title:"コンポーネント/EditPane",parameters:{layout:"fullscreen"}};function C(){const[n,o]=m.useState(!1);return e.jsxs("main",{className:"min-h-screen bg-[#eee7da] p-8",children:[e.jsx(l,{onClick:()=>o(!0),children:"場所を編集"}),e.jsx(d,{open:n,onOpenChange:o,eyebrow:"場所",title:"霧の図書館",description:"物語内で参照する場所の名前と空気を整えます。",footer:e.jsx(l,{onClick:()=>o(!1),children:"編集を完了"}),children:e.jsxs("div",{className:"grid gap-4",children:[e.jsxs("label",{children:["表示名",e.jsx(I,{defaultValue:"霧の図書館"})]}),e.jsxs("label",{children:["説明",e.jsx(H,{defaultValue:"書架のあいだを淡い霧が流れている。"})]})]})})]})}function O(){const[n,o]=m.useState(!1),[c,t]=m.useState(!1);return e.jsxs("main",{className:"min-h-screen bg-[#eee7da] p-8",children:[e.jsx(l,{onClick:()=>o(!0),children:"種類を編集"}),e.jsx(d,{open:n,onOpenChange:o,eyebrow:"オブジェクト種類",title:"書庫の扉",children:e.jsxs("div",{className:"grid gap-4",children:[e.jsx("p",{children:"状態定義をテーブルで管理します。"}),e.jsx(l,{onClick:()=>t(!0),children:"開いているを編集"})]})}),e.jsx(d,{layer:1,open:c,onOpenChange:t,eyebrow:"状態定義",title:"開いている",footer:e.jsx(l,{onClick:()=>t(!1),children:"状態の編集を完了"}),children:e.jsxs("label",{children:["状態code",e.jsx(I,{defaultValue:"open"})]})})]})}function P(){const[n,o]=m.useState(!1),[c,t]=m.useState(!1),[r,u]=m.useState("mist");return e.jsxs("main",{className:"min-h-screen bg-[#eee7da] p-8",children:[e.jsx(l,{onClick:()=>o(!0),children:"ポータル検証を開く"}),e.jsxs(d,{open:n,onOpenChange:o,eyebrow:"親",title:"親ペイン",children:[e.jsx("p",{children:"親ペインの内容です。"}),e.jsx(l,{onClick:()=>t(!0),children:"子ペインを開く"})]}),e.jsx(d,{layer:1,open:c,onOpenChange:t,eyebrow:"子",title:"子ペイン",children:e.jsxs("div",{className:"grid gap-4","data-testid":"child-pane-nearby-area",children:[e.jsx(V,{label:"語り口",value:r,onValueChange:u,options:[{value:"mist",label:"薄霧"},{value:"iris",label:"菫"},{value:"ember",label:"熾火"}]}),e.jsxs("p",{"data-testid":"selected-tone",children:["選択中: ",r]}),e.jsx(l,{variant:"ghost",children:"近くの操作"})]})})]})}const w={name:"デスクトップ — 編集ペインを重ねる",render:()=>e.jsx(O,{}),play:async({canvasElement:n})=>{const o=s(n),c=s(n.ownerDocument.body);await i.click(o.getByRole("button",{name:"種類を編集"})),await i.click(c.getByRole("button",{name:"開いているを編集"}));const t=c.getByRole("dialog",{name:"開いている"});await a(t).toBeVisible(),await a(t).toHaveAttribute("data-layer","1");const r=s(t).getByRole("separator",{name:"編集ペインの幅を変更"});await i.click(r),await i.keyboard("{Home}"),await a(r).toHaveAttribute("aria-valuenow","360"),await i.keyboard("{ArrowLeft}"),await a(r).toHaveAttribute("aria-valuenow","384")}},y={name:"Select — 子ペイン内ポータルとEscape階層",render:()=>e.jsx(P,{}),play:async({canvasElement:n,step:o})=>{const c=s(n),t=s(n.ownerDocument.body);await o("Select optionと同じtriggerの再クリックでもペインを閉じない",async()=>{await i.click(c.getByRole("button",{name:"ポータル検証を開く"})),await i.click(t.getByRole("button",{name:"子ペインを開く"}));const r=t.getByRole("dialog",{name:"子ペイン"});await i.click(s(r).getByRole("combobox",{name:"語り口"}));const u=await t.findByRole("option",{name:"熾火"});await a(r).toContainElement(u),await i.click(u),await a(t.getByTestId("selected-tone")).toHaveTextContent("ember"),await a(r).toBeInTheDocument();const p=s(r).getByRole("combobox",{name:"語り口"});await i.click(p),await t.findByRole("listbox"),await i.click(p),await a(t.queryByRole("listbox")).not.toBeInTheDocument(),await a(t.getByRole("dialog",{name:"子ペイン"})).toBeVisible(),await a(n.ownerDocument.querySelector('[data-edit-pane-layer="0"]')).toBeVisible(),await i.click(p),await a(p).toHaveAttribute("aria-expanded","true"),await a(t.getByRole("listbox")).toBeInTheDocument(),await a(n.ownerDocument.querySelector('[data-edit-pane-layer="1"]')).toBeInTheDocument(),await a(n.ownerDocument.querySelector('[data-edit-pane-layer="0"]')).toBeInTheDocument()}),await o("EscapeはSelect、子ペイン、親ペインの順に閉じる",async()=>{await i.keyboard("{Escape}"),await a(t.queryByRole("listbox")).not.toBeInTheDocument(),await a(t.getByRole("dialog",{name:"子ペイン"})).toBeInTheDocument(),await i.click(t.getByRole("button",{name:"近くの操作"})),await a(t.getByRole("dialog",{name:"子ペイン"})).toBeInTheDocument(),await i.keyboard("{Escape}"),await a(t.queryByRole("dialog",{name:"子ペイン"})).not.toBeInTheDocument(),await a(t.getByRole("dialog",{name:"親ペイン"})).toBeInTheDocument(),await i.keyboard("{Escape}"),await a(t.queryByRole("dialog",{name:"親ペイン"})).not.toBeInTheDocument()})}},g={name:"デスクトップ — 右編集ペイン",render:()=>e.jsx(C,{}),play:async({canvasElement:n})=>{const o=s(n),c=s(n.ownerDocument.body);await i.click(o.getByRole("button",{name:"場所を編集"})),await a(c.getByRole("dialog",{name:"霧の図書館"})).toBeVisible(),await a(c.getByRole("button",{name:"編集ペインを閉じる"})).toBeVisible()}},b={name:"スマホ — 全画面編集",parameters:{viewport:{defaultViewport:"mobile1"}},render:()=>e.jsx(C,{}),play:async({canvasElement:n})=>{const o=s(n),c=s(n.ownerDocument.body);await i.click(o.getByRole("button",{name:"場所を編集"}));const t=c.getByRole("dialog",{name:"霧の図書館"});await a(t).toBeVisible(),await a(t).toHaveClass("max-md:w-screen"),await a(t).toHaveClass("max-md:h-[100dvh]")}};var h,B,x;w.parameters={...w.parameters,docs:{...(h=w.parameters)==null?void 0:h.docs,source:{originalSource:`{
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
}`,...(x=(B=w.parameters)==null?void 0:B.docs)==null?void 0:x.source}}};var v,R,E;y.parameters={...y.parameters,docs:{...(v=y.parameters)==null?void 0:v.docs,source:{originalSource:`{
  name: 'Select — 子ペイン内ポータルとEscape階層',
  render: () => <NestedSelectPortalDemo />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('Select optionと同じtriggerの再クリックでもペインを閉じない', async () => {
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
      const trigger = within(child).getByRole('combobox', {
        name: '語り口'
      });
      await userEvent.click(trigger);
      await screen.findByRole('listbox');
      await userEvent.click(trigger);
      await expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      await expect(screen.getByRole('dialog', {
        name: '子ペイン'
      })).toBeVisible();
      await expect(canvasElement.ownerDocument.querySelector('[data-edit-pane-layer="0"]')).toBeVisible();
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(screen.getByRole('listbox')).toBeInTheDocument();
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
}`,...(E=(R=y.parameters)==null?void 0:R.docs)==null?void 0:E.source}}};var k,D,j;g.parameters={...g.parameters,docs:{...(k=g.parameters)==null?void 0:k.docs,source:{originalSource:`{
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
}`,...(j=(D=g.parameters)==null?void 0:D.docs)==null?void 0:j.source}}};var f,S,T;b.parameters={...b.parameters,docs:{...(f=b.parameters)==null?void 0:f.docs,source:{originalSource:`{
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
}`,...(T=(S=b.parameters)==null?void 0:S.docs)==null?void 0:T.source}}};const J=["NestedOverlappingPane","SelectPortalAndEscapeHierarchy","DesktopRightPane","MobileFullScreen"];export{g as DesktopRightPane,b as MobileFullScreen,w as NestedOverlappingPane,y as SelectPortalAndEscapeHierarchy,J as __namedExportsOrder,G as default};
