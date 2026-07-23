import{j as a}from"./jsx-runtime-BO8uF4Og.js";import{w as u,e as r}from"./index-C4S39nCK.js";import{B as c}from"./Surfaces-CQIJcDfy.js";import"./index-D4H_InIO.js";const b={title:"コンポーネント/UI/Badge",component:c,parameters:{layout:"centered"},decorators:[e=>a.jsx("div",{"data-myriale-theme":"archive",className:"w-full max-w-myr-focused rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel",children:a.jsx(e,{})})]},l=["neutral","info","success","warning","danger"],s={neutral:"下書き",info:"準備中",success:"接続済み",warning:"確認待ち",danger:"切断"},n={name:"トーンと装飾ドット",render:()=>a.jsxs("div",{className:"grid gap-5",children:[a.jsxs("header",{className:"grid gap-2",children:[a.jsx("p",{className:"text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby",children:"Session status"}),a.jsx("h1",{className:"font-myr-display text-3xl",children:"状態バッジ"})]}),a.jsx("div",{className:"flex flex-wrap gap-3","aria-label":"Badge tones",children:l.map(e=>a.jsx(c,{tone:e,dot:!0,role:"status","aria-label":`${e}: ${s[e]}`,children:s[e]},e))}),a.jsx(c,{tone:"success",role:"status","aria-label":"dot なしの保存状態",children:"自動保存済み"})]}),play:async({canvasElement:e,step:i})=>{const o=u(e);await i("全トーンを状態として公開する",async()=>{for(const t of l)await r(o.getByRole("status",{name:`${t}: ${s[t]}`})).toHaveTextContent(s[t])}),await i("ドットを読み上げ対象から除外する",async()=>{for(const t of l){const g=o.getByRole("status",{name:`${t}: ${s[t]}`});await r(g.firstElementChild).toHaveAttribute("aria-hidden","true")}await r(o.getByRole("status",{name:"dot なしの保存状態"}).children).toHaveLength(0)})}};var d,m,p;n.parameters={...n.parameters,docs:{...(d=n.parameters)==null?void 0:d.docs,source:{originalSource:`{
  name: 'トーンと装飾ドット',
  render: () => <div className="grid gap-5">
      <header className="grid gap-2">
        <p className="text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby">Session status</p>
        <h1 className="font-myr-display text-3xl">状態バッジ</h1>
      </header>
      <div className="flex flex-wrap gap-3" aria-label="Badge tones">
        {tones.map(tone => <Badge key={tone} tone={tone} dot role="status" aria-label={\`\${tone}: \${labels[tone]}\`}>
            {labels[tone]}
          </Badge>)}
      </div>
      <Badge tone="success" role="status" aria-label="dot なしの保存状態">自動保存済み</Badge>
    </div>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('全トーンを状態として公開する', async () => {
      for (const tone of tones) {
        await expect(canvas.getByRole('status', {
          name: \`\${tone}: \${labels[tone]}\`
        })).toHaveTextContent(labels[tone]);
      }
    });
    await step('ドットを読み上げ対象から除外する', async () => {
      for (const tone of tones) {
        const badge = canvas.getByRole('status', {
          name: \`\${tone}: \${labels[tone]}\`
        });
        await expect(badge.firstElementChild).toHaveAttribute('aria-hidden', 'true');
      }
      await expect(canvas.getByRole('status', {
        name: 'dot なしの保存状態'
      }).children).toHaveLength(0);
    });
  }
}`,...(p=(m=n.parameters)==null?void 0:m.docs)==null?void 0:p.source}}};const v=["TonesAndDots"];export{n as TonesAndDots,v as __namedExportsOrder,b as default};
