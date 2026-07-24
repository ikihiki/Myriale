import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{r as p}from"./index-D4H_InIO.js";import{w as r,u as d,e as o}from"./index-C4S39nCK.js";import{a as c,I as f,T as E}from"./Surfaces-xpIMDkG0.js";import{E as u}from"./EditPane-Duz_augU.js";import"./index-BIT3Y9dO.js";import"./index-DzKAYa42.js";const H={title:"コンポーネント/EditPane",parameters:{layout:"fullscreen"}};function R(){const[n,a]=p.useState(!1);return e.jsxs("main",{className:"min-h-screen bg-[#eee7da] p-8",children:[e.jsx(c,{onClick:()=>a(!0),children:"場所を編集"}),e.jsx(u,{open:n,onOpenChange:a,eyebrow:"場所",title:"霧の図書館",description:"物語内で参照する場所の名前と空気を整えます。",footer:e.jsx(c,{onClick:()=>a(!1),children:"編集を完了"}),children:e.jsxs("div",{className:"grid gap-4",children:[e.jsxs("label",{children:["表示名",e.jsx(f,{defaultValue:"霧の図書館"})]}),e.jsxs("label",{children:["説明",e.jsx(E,{defaultValue:"書架のあいだを淡い霧が流れている。"})]})]})})]})}function k(){const[n,a]=p.useState(!1),[s,t]=p.useState(!1);return e.jsxs("main",{className:"min-h-screen bg-[#eee7da] p-8",children:[e.jsx(c,{onClick:()=>a(!0),children:"種類を編集"}),e.jsx(u,{open:n,onOpenChange:a,eyebrow:"オブジェクト種類",title:"書庫の扉",children:e.jsxs("div",{className:"grid gap-4",children:[e.jsx("p",{children:"状態定義をテーブルで管理します。"}),e.jsx(c,{onClick:()=>t(!0),children:"開いているを編集"})]})}),e.jsx(u,{layer:1,open:s,onOpenChange:t,eyebrow:"状態定義",title:"開いている",footer:e.jsx(c,{onClick:()=>t(!1),children:"状態の編集を完了"}),children:e.jsxs("label",{children:["状態code",e.jsx(f,{defaultValue:"open"})]})})]})}const i={name:"デスクトップ — 編集ペインを重ねる",render:()=>e.jsx(k,{}),play:async({canvasElement:n})=>{const a=r(n),s=r(n.ownerDocument.body);await d.click(a.getByRole("button",{name:"種類を編集"})),await d.click(s.getByRole("button",{name:"開いているを編集"}));const t=s.getByRole("dialog",{name:"開いている"});await o(t).toBeVisible(),await o(t).toHaveAttribute("data-layer","1")}},l={name:"デスクトップ — 右編集ペイン",render:()=>e.jsx(R,{}),play:async({canvasElement:n})=>{const a=r(n),s=r(n.ownerDocument.body);await d.click(a.getByRole("button",{name:"場所を編集"})),await o(s.getByRole("dialog",{name:"霧の図書館"})).toBeVisible(),await o(s.getByRole("button",{name:"編集ペインを閉じる"})).toBeVisible()}},m={name:"スマホ — 全画面編集",parameters:{viewport:{defaultViewport:"mobile1"}},render:()=>e.jsx(R,{}),play:async({canvasElement:n})=>{const a=r(n),s=r(n.ownerDocument.body);await d.click(a.getByRole("button",{name:"場所を編集"}));const t=s.getByRole("dialog",{name:"霧の図書館"});await o(t).toBeVisible(),await o(t).toHaveClass("max-md:w-screen"),await o(t).toHaveClass("max-md:h-[100dvh]")}};var w,g,y;i.parameters={...i.parameters,docs:{...(w=i.parameters)==null?void 0:w.docs,source:{originalSource:`{
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
  }
}`,...(y=(g=i.parameters)==null?void 0:g.docs)==null?void 0:y.source}}};var h,x,b;l.parameters={...l.parameters,docs:{...(h=l.parameters)==null?void 0:h.docs,source:{originalSource:`{
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
}`,...(b=(x=l.parameters)==null?void 0:x.docs)==null?void 0:b.source}}};var v,B,j;m.parameters={...m.parameters,docs:{...(v=m.parameters)==null?void 0:v.docs,source:{originalSource:`{
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
}`,...(j=(B=m.parameters)==null?void 0:B.docs)==null?void 0:j.source}}};const A=["NestedOverlappingPane","DesktopRightPane","MobileFullScreen"];export{l as DesktopRightPane,m as MobileFullScreen,i as NestedOverlappingPane,A as __namedExportsOrder,H as default};
