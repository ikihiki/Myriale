import{j as n}from"./jsx-runtime-BO8uF4Og.js";import{w as x,e as i}from"./index-C4S39nCK.js";import{N as s}from"./Surfaces-xpIMDkG0.js";import"./index-D4H_InIO.js";const N={title:"コンポーネント/UI/Notice",component:s,parameters:{layout:"centered"},decorators:[a=>n.jsx("div",{"data-myriale-theme":"archive",className:"w-full max-w-myr-reading rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel",children:n.jsx(a,{})})]},c=["info","success","warning","danger"],l=["inverse","soft"],m={info:"新しい手掛かりがセッションノートへ追加されました。",success:"物語の進行を保存しました。",warning:"残りのコンテキストが少なくなっています。",danger:"AIプロバイダーへ接続できませんでした。"},t={name:"トーン・バリアント・状態通知",render:()=>n.jsxs("div",{className:"grid gap-6",children:[l.map(a=>n.jsxs("section",{className:"grid gap-3","aria-labelledby":`notice-${a}-heading`,children:[n.jsx("h2",{id:`notice-${a}-heading`,className:"font-myr-display text-2xl",children:a}),c.map(e=>n.jsxs(s,{variant:a,tone:e,"aria-label":`${a} ${e}`,children:[n.jsx("strong",{className:"mr-2 uppercase",children:e}),m[e]]},e))]},a)),n.jsx(s,{role:"alert",tone:"danger",variant:"soft","aria-label":"即時対応が必要なエラー",children:"セッションを続ける前に接続設定を確認してください。"})]}),play:async({canvasElement:a,step:e})=>{const r=x(a);await e("通常の通知は status ロールを持つ",async()=>{for(const y of l)for(const o of c){const v=r.getByRole("status",{name:`${y} ${o}`});await i(v).toHaveTextContent(m[o])}}),await e("即時対応が必要な通知は alert に変更できる",async()=>{await i(r.getByRole("alert",{name:"即時対応が必要なエラー"})).toBeVisible()})}};var d,p,g;t.parameters={...t.parameters,docs:{...(d=t.parameters)==null?void 0:d.docs,source:{originalSource:`{
  name: 'トーン・バリアント・状態通知',
  render: () => <div className="grid gap-6">
      {variants.map(variant => <section className="grid gap-3" aria-labelledby={\`notice-\${variant}-heading\`} key={variant}>
          <h2 id={\`notice-\${variant}-heading\`} className="font-myr-display text-2xl">{variant}</h2>
          {tones.map(tone => <Notice key={tone} variant={variant} tone={tone} aria-label={\`\${variant} \${tone}\`}>
              <strong className="mr-2 uppercase">{tone}</strong>
              {messages[tone]}
            </Notice>)}
        </section>)}
      <Notice role="alert" tone="danger" variant="soft" aria-label="即時対応が必要なエラー">
        セッションを続ける前に接続設定を確認してください。
      </Notice>
    </div>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('通常の通知は status ロールを持つ', async () => {
      for (const variant of variants) {
        for (const tone of tones) {
          const notice = canvas.getByRole('status', {
            name: \`\${variant} \${tone}\`
          });
          await expect(notice).toHaveTextContent(messages[tone]);
        }
      }
    });
    await step('即時対応が必要な通知は alert に変更できる', async () => {
      await expect(canvas.getByRole('alert', {
        name: '即時対応が必要なエラー'
      })).toBeVisible();
    });
  }
}`,...(g=(p=t.parameters)==null?void 0:p.docs)==null?void 0:g.source}}};const b=["TonesVariantsAndSemantics"];export{t as TonesVariantsAndSemantics,b as __namedExportsOrder,N as default};
