import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{r as y}from"./index-D4H_InIO.js";import{w as i,u as x,e as t}from"./index-C4S39nCK.js";import{a as l,I as v,T as h}from"./Surfaces-xpIMDkG0.js";import{E as B}from"./EditPane-C5jhZN_z.js";import"./index-BIT3Y9dO.js";import"./index-DzKAYa42.js";const C={title:"コンポーネント/EditPane",parameters:{layout:"fullscreen"}};function b(){const[n,a]=y.useState(!1);return e.jsxs("main",{className:"min-h-screen bg-[#eee7da] p-8",children:[e.jsx(l,{onClick:()=>a(!0),children:"場所を編集"}),e.jsx(B,{open:n,onOpenChange:a,eyebrow:"場所",title:"霧の図書館",description:"物語内で参照する場所の名前と空気を整えます。",footer:e.jsx(l,{onClick:()=>a(!1),children:"編集を完了"}),children:e.jsxs("div",{className:"grid gap-4",children:[e.jsxs("label",{children:["表示名",e.jsx(v,{defaultValue:"霧の図書館"})]}),e.jsxs("label",{children:["説明",e.jsx(h,{defaultValue:"書架のあいだを淡い霧が流れている。"})]})]})})]})}const o={name:"デスクトップ — 右編集ペイン",render:()=>e.jsx(b,{}),play:async({canvasElement:n})=>{const a=i(n),s=i(n.ownerDocument.body);await x.click(a.getByRole("button",{name:"場所を編集"})),await t(s.getByRole("dialog",{name:"霧の図書館"})).toBeVisible(),await t(s.getByRole("button",{name:"編集ペインを閉じる"})).toBeVisible()}},r={name:"スマホ — 全画面編集",parameters:{viewport:{defaultViewport:"mobile1"}},render:()=>e.jsx(b,{}),play:async({canvasElement:n})=>{const a=i(n),s=i(n.ownerDocument.body);await x.click(a.getByRole("button",{name:"場所を編集"}));const c=s.getByRole("dialog",{name:"霧の図書館"});await t(c).toBeVisible(),await t(c).toHaveClass("max-md:w-screen"),await t(c).toHaveClass("max-md:h-[100dvh]")}};var m,d,p;o.parameters={...o.parameters,docs:{...(m=o.parameters)==null?void 0:m.docs,source:{originalSource:`{
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
}`,...(p=(d=o.parameters)==null?void 0:d.docs)==null?void 0:p.source}}};var u,w,g;r.parameters={...r.parameters,docs:{...(u=r.parameters)==null?void 0:u.docs,source:{originalSource:`{
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
}`,...(g=(w=r.parameters)==null?void 0:w.docs)==null?void 0:g.source}}};const P=["DesktopRightPane","MobileFullScreen"];export{o as DesktopRightPane,r as MobileFullScreen,P as __namedExportsOrder,C as default};
