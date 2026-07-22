import{j as a}from"./jsx-runtime-BO8uF4Og.js";import{r as f}from"./index-D4H_InIO.js";import{w as h,e as r,u as B}from"./index-C4S39nCK.js";import{S as d}from"./SessionIcons-yGOCmQwo.js";import{a as n}from"./Surfaces-CQIJcDfy.js";const R={title:"コンポーネント/UI/Button",component:n,parameters:{layout:"centered"},decorators:[e=>a.jsx("div",{"data-myriale-theme":"archive",className:"w-full max-w-myr-reading rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel",children:a.jsx(e,{})})]},m=["primary","secondary","ghost","text","danger","icon"],p=["sm","md","lg","iconSm","iconMd"],o={name:"バリアントとクリック操作",render:function(){const[i,s]=f.useState("アクションを選択してください");return a.jsxs("div",{className:"grid gap-6",children:[a.jsxs("header",{className:"grid gap-2",children:[a.jsx("p",{className:"text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby",children:"Session actions"}),a.jsx("h1",{className:"font-myr-display text-3xl",children:"物語を動かすボタン"})]}),a.jsx("div",{className:"flex flex-wrap items-center gap-3","aria-label":"Button variants",children:m.map(t=>a.jsx(n,{type:"button",variant:t,"aria-label":t==="icon"?"ひらめきを追加":void 0,onClick:()=>s(`${t} を選択しました`),children:t==="icon"?a.jsx(d,{}):t},t))}),a.jsx("div",{className:"rounded-myr-card bg-myr-ink p-4 text-myr-paper",children:a.jsxs("div",{className:"flex flex-wrap items-center gap-3","aria-label":"Dark surface buttons",children:[a.jsx(n,{type:"button",variant:"primary",surface:"dark",children:"続きを生成"}),a.jsx(n,{type:"button",variant:"ghost",surface:"dark",children:"下書きへ戻す"}),a.jsx(n,{type:"button",variant:"icon",surface:"dark","aria-label":"暗い面のひらめき",children:a.jsx(d,{})})]})}),a.jsx("output",{className:"text-sm font-bold text-myr-slate","aria-live":"polite",children:i})]})},play:async({canvasElement:e,step:i})=>{const s=h(e);await i("すべてのボタンバリアントを公開する",async()=>{for(const t of m.filter(l=>l!=="icon"))await r(s.getByRole("button",{name:t})).toBeVisible();await r(s.getByRole("button",{name:"ひらめきを追加"})).toBeVisible()}),await i("クリック結果をライブ領域へ反映する",async()=>{await B.click(s.getByRole("button",{name:"danger"})),await r(s.getByText("danger を選択しました")).toBeVisible()}),await i("暗い面でもアクセシブルな操作名を保つ",async()=>{await r(s.getByRole("button",{name:"暗い面のひらめき"})).toHaveAccessibleName("暗い面のひらめき")})}},c={name:"サイズと状態",render:()=>a.jsxs("div",{className:"grid gap-6",children:[a.jsxs("section",{className:"grid gap-3","aria-labelledby":"button-size-heading",children:[a.jsx("h2",{id:"button-size-heading",className:"font-myr-display text-2xl",children:"選択できるサイズ"}),a.jsx("div",{className:"flex flex-wrap items-center gap-3",children:p.map(e=>a.jsx(n,{type:"button",variant:e.startsWith("icon")?"icon":"secondary",size:e,"aria-label":e.startsWith("icon")?`${e} のひらめき`:void 0,children:e.startsWith("icon")?a.jsx(d,{}):e},e))})]}),a.jsxs("section",{className:"grid gap-3","aria-labelledby":"button-state-heading",children:[a.jsx("h2",{id:"button-state-heading",className:"font-myr-display text-2xl",children:"操作状態"}),a.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[a.jsx(n,{type:"button",variant:"primary",children:"利用可能"}),a.jsx(n,{type:"button",variant:"secondary",disabled:!0,children:"生成中は利用不可"}),a.jsx(n,{type:"button",children:"互換ボタン"})]})]})]}),play:async({canvasElement:e,step:i})=>{const s=h(e);await i("すべてのサイズを操作名付きで表示する",async()=>{for(const t of p){const l=t.startsWith("icon")?`${t} のひらめき`:t;await r(s.getByRole("button",{name:l})).toBeVisible()}}),await i("disabled と互換表示を維持する",async()=>{await r(s.getByRole("button",{name:"生成中は利用不可"})).toBeDisabled(),await r(s.getByRole("button",{name:"互換ボタン"})).not.toBeDisabled()})}};var u,y,b;o.parameters={...o.parameters,docs:{...(u=o.parameters)==null?void 0:u.docs,source:{originalSource:`{
  name: 'バリアントとクリック操作',
  render: function Render() {
    const [message, setMessage] = useState('アクションを選択してください');
    return <div className="grid gap-6">
        <header className="grid gap-2">
          <p className="text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby">Session actions</p>
          <h1 className="font-myr-display text-3xl">物語を動かすボタン</h1>
        </header>
        <div className="flex flex-wrap items-center gap-3" aria-label="Button variants">
          {variants.map(variant => <Button key={variant} type="button" variant={variant} aria-label={variant === 'icon' ? 'ひらめきを追加' : undefined} onClick={() => setMessage(\`\${variant} を選択しました\`)}>
              {variant === 'icon' ? <SparkleIcon /> : variant}
            </Button>)}
        </div>
        <div className="rounded-myr-card bg-myr-ink p-4 text-myr-paper">
          <div className="flex flex-wrap items-center gap-3" aria-label="Dark surface buttons">
            <Button type="button" variant="primary" surface="dark">続きを生成</Button>
            <Button type="button" variant="ghost" surface="dark">下書きへ戻す</Button>
            <Button type="button" variant="icon" surface="dark" aria-label="暗い面のひらめき"><SparkleIcon /></Button>
          </div>
        </div>
        <output className="text-sm font-bold text-myr-slate" aria-live="polite">{message}</output>
      </div>;
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('すべてのボタンバリアントを公開する', async () => {
      for (const variant of variants.filter(variant => variant !== 'icon')) {
        await expect(canvas.getByRole('button', {
          name: variant
        })).toBeVisible();
      }
      await expect(canvas.getByRole('button', {
        name: 'ひらめきを追加'
      })).toBeVisible();
    });
    await step('クリック結果をライブ領域へ反映する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'danger'
      }));
      await expect(canvas.getByText('danger を選択しました')).toBeVisible();
    });
    await step('暗い面でもアクセシブルな操作名を保つ', async () => {
      await expect(canvas.getByRole('button', {
        name: '暗い面のひらめき'
      })).toHaveAccessibleName('暗い面のひらめき');
    });
  }
}`,...(b=(y=o.parameters)==null?void 0:y.docs)==null?void 0:b.source}}};var x,g,v;c.parameters={...c.parameters,docs:{...(x=c.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: 'サイズと状態',
  render: () => <div className="grid gap-6">
      <section className="grid gap-3" aria-labelledby="button-size-heading">
        <h2 id="button-size-heading" className="font-myr-display text-2xl">選択できるサイズ</h2>
        <div className="flex flex-wrap items-center gap-3">
          {sizes.map(size => <Button key={size} type="button" variant={size.startsWith('icon') ? 'icon' : 'secondary'} size={size} aria-label={size.startsWith('icon') ? \`\${size} のひらめき\` : undefined}>
              {size.startsWith('icon') ? <SparkleIcon /> : size}
            </Button>)}
        </div>
      </section>
      <section className="grid gap-3" aria-labelledby="button-state-heading">
        <h2 id="button-state-heading" className="font-myr-display text-2xl">操作状態</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="primary">利用可能</Button>
          <Button type="button" variant="secondary" disabled>生成中は利用不可</Button>
          <Button type="button">互換ボタン</Button>
        </div>
      </section>
    </div>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('すべてのサイズを操作名付きで表示する', async () => {
      for (const size of sizes) {
        const name = size.startsWith('icon') ? \`\${size} のひらめき\` : size;
        await expect(canvas.getByRole('button', {
          name
        })).toBeVisible();
      }
    });
    await step('disabled と互換表示を維持する', async () => {
      await expect(canvas.getByRole('button', {
        name: '生成中は利用不可'
      })).toBeDisabled();
      await expect(canvas.getByRole('button', {
        name: '互換ボタン'
      })).not.toBeDisabled();
    });
  }
}`,...(v=(g=c.parameters)==null?void 0:g.docs)==null?void 0:v.source}}};const S=["VariantsAndBehavior","SizesAndStates"];export{c as SizesAndStates,o as VariantsAndBehavior,S as __namedExportsOrder,R as default};
