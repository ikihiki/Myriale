import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{w as v,e as s}from"./index-C4S39nCK.js";import{L as t}from"./Surfaces-CQIJcDfy.js";import"./index-D4H_InIO.js";const u={title:"コンポーネント/UI/Label",component:t,parameters:{layout:"centered"},decorators:[a=>e.jsx("div",{"data-myriale-theme":"archive",className:"w-full max-w-myr-reading rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel",children:e.jsx(a,{})})]},m=["display","section","sectionEditorial","eyebrow","eyebrowData","label","body","bodySm","caption","data"],o={name:"テキストロール",render:()=>e.jsx("div",{className:"grid gap-5",children:m.map(a=>e.jsxs("div",{className:"grid gap-2",children:[e.jsx("span",{className:"font-myr-mono text-xs text-myr-ruby",children:a}),e.jsx(t,{as:"p",textRole:a,"data-testid":`label-${a}`,children:"霧の向こうで物語が目を覚ます"})]},a))}),play:async({canvasElement:a,step:i})=>{const l=v(a);await i("すべてのテキストロールを段落として表示する",async()=>{for(const n of m){const c=l.getByTestId(`label-${n}`);await s(c.tagName).toBe("P"),await s(c).toBeVisible()}})}},r={name:"意味のある as 出力",render:()=>e.jsxs("article",{className:"grid gap-4","aria-labelledby":"semantic-label-title",children:[e.jsx(t,{as:"p",textRole:"eyebrow",children:"Archive / Scenario 014"}),e.jsx(t,{as:"h1",textRole:"display",id:"semantic-label-title",children:"星喰いの図書館"}),e.jsx(t,{as:"h2",textRole:"sectionEditorial",children:"第一章　閉ざされた書庫"}),e.jsx(t,{as:"p",textRole:"body",children:"探索者たちは、失われた頁を求めて夜の図書館へ入ります。"}),e.jsx(t,{as:"time",textRole:"data",dateTime:"2026-07-22T20:00:00+09:00",children:"2026.07.22 / 20:00"}),e.jsx(t,{as:"span",textRole:"caption",role:"status","aria-live":"polite",children:"下書き保存済み"})]}),play:async({canvasElement:a,step:i})=>{const l=v(a);await i("見出し階層を as 属性で出力する",async()=>{await s(l.getByRole("heading",{level:1,name:"星喰いの図書館"})).toBeVisible(),await s(l.getByRole("heading",{level:2,name:"第一章　閉ざされた書庫"})).toBeVisible()}),await i("時刻と状態を意味のある要素で出力する",async()=>{const n=l.getByText("2026.07.22 / 20:00");await s(n.tagName).toBe("TIME"),await s(n).toHaveAttribute("datetime","2026-07-22T20:00:00+09:00"),await s(l.getByRole("status")).toHaveTextContent("下書き保存済み")})}};var d,p,b;o.parameters={...o.parameters,docs:{...(d=o.parameters)==null?void 0:d.docs,source:{originalSource:`{
  name: 'テキストロール',
  render: () => <div className="grid gap-5">
      {roles.map(role => <div className="grid gap-2" key={role}>
          <span className="font-myr-mono text-xs text-myr-ruby">{role}</span>
          <Label as="p" textRole={role} data-testid={\`label-\${role}\`}>霧の向こうで物語が目を覚ます</Label>
        </div>)}
    </div>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('すべてのテキストロールを段落として表示する', async () => {
      for (const role of roles) {
        const label = canvas.getByTestId(\`label-\${role}\`);
        await expect(label.tagName).toBe('P');
        await expect(label).toBeVisible();
      }
    });
  }
}`,...(b=(p=o.parameters)==null?void 0:p.docs)==null?void 0:b.source}}};var x,y,g;r.parameters={...r.parameters,docs:{...(x=r.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: '意味のある as 出力',
  render: () => <article className="grid gap-4" aria-labelledby="semantic-label-title">
      <Label as="p" textRole="eyebrow">Archive / Scenario 014</Label>
      <Label as="h1" textRole="display" id="semantic-label-title">星喰いの図書館</Label>
      <Label as="h2" textRole="sectionEditorial">第一章　閉ざされた書庫</Label>
      <Label as="p" textRole="body">探索者たちは、失われた頁を求めて夜の図書館へ入ります。</Label>
      <Label as="time" textRole="data" dateTime="2026-07-22T20:00:00+09:00">2026.07.22 / 20:00</Label>
      <Label as="span" textRole="caption" role="status" aria-live="polite">下書き保存済み</Label>
    </article>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('見出し階層を as 属性で出力する', async () => {
      await expect(canvas.getByRole('heading', {
        level: 1,
        name: '星喰いの図書館'
      })).toBeVisible();
      await expect(canvas.getByRole('heading', {
        level: 2,
        name: '第一章　閉ざされた書庫'
      })).toBeVisible();
    });
    await step('時刻と状態を意味のある要素で出力する', async () => {
      const time = canvas.getByText('2026.07.22 / 20:00');
      await expect(time.tagName).toBe('TIME');
      await expect(time).toHaveAttribute('datetime', '2026-07-22T20:00:00+09:00');
      await expect(canvas.getByRole('status')).toHaveTextContent('下書き保存済み');
    });
  }
}`,...(g=(y=r.parameters)==null?void 0:y.docs)==null?void 0:g.source}}};const L=["TextRoles","SemanticElements"];export{r as SemanticElements,o as TextRoles,L as __namedExportsOrder,u as default};
