import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{r as f}from"./index-D4H_InIO.js";import{w as v,e as l,u as d}from"./index-C4S39nCK.js";import{n}from"./Surfaces-CQIJcDfy.js";const j={title:"コンポーネント/UI/Textarea",component:n,parameters:{layout:"centered"},decorators:[s=>e.jsx("div",{"data-myriale-theme":"archive",className:"w-full max-w-myr-focused rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel",children:e.jsx(s,{})})]},c=["field","underline","compact","borderless","composer"],i={name:"バリアントと複数行編集",render:function(){const[t,r]=f.useState("扉には月の紋章がある。");return e.jsxs("div",{className:"grid gap-5",children:[e.jsxs("header",{className:"grid gap-2",children:[e.jsx("p",{className:"text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby",children:"Session notes"}),e.jsx("h1",{className:"font-myr-display text-3xl",children:"複数行入力"})]}),c.map(a=>e.jsxs("label",{className:"grid gap-2 text-sm font-extrabold text-myr-slate",children:[a,e.jsx(n,{"aria-label":`${a} textarea`,variant:a,value:a==="field"?t:void 0,defaultValue:a==="field"?void 0:`${a} で残す物語の断片`,onChange:a==="field"?g=>r(g.target.value):void 0,rows:a==="compact"?2:3})]},a)),e.jsxs("output",{className:"whitespace-pre-wrap text-sm text-myr-slate","aria-live":"polite",children:["記録: ",t]})]})},play:async({canvasElement:s,step:t})=>{const r=v(s);await t("Textarea 固有の全バリアントを表示する",async()=>{for(const a of c)await l(r.getByLabelText(`${a} textarea`)).toBeVisible()}),await t("改行を含む記録を編集する",async()=>{const a=r.getByLabelText("field textarea");await d.click(a),await d.keyboard("{End}{Enter}司書は合言葉を待っている。"),await l(a).toHaveValue(`扉には月の紋章がある。
司書は合言葉を待っている。`)}),await t("composer も複数行入力として公開する",async()=>{await l(r.getByLabelText("composer textarea")).toHaveAttribute("rows","3")})}},o={name:"検証とネイティブ状態",render:()=>e.jsxs("div",{className:"grid gap-4",children:[e.jsxs("label",{className:"grid gap-2 text-sm font-extrabold text-myr-slate",children:["修正が必要な導入文",e.jsx(n,{"aria-label":"invalid opening","aria-invalid":"true","aria-describedby":"opening-error",defaultValue:"短すぎます"})]}),e.jsx("p",{id:"opening-error",className:"text-sm font-bold text-myr-ruby",children:"導入文は情景が伝わる長さで入力してください。"}),e.jsxs("label",{className:"grid gap-2 text-sm font-extrabold text-myr-slate",children:["確定済みの要約",e.jsx(n,{"aria-label":"readonly summary",value:"夜明けまで門を守った。",readOnly:!0})]}),e.jsxs("label",{className:"grid gap-2 text-sm font-extrabold text-myr-slate",children:["生成中の本文",e.jsx(n,{"aria-label":"disabled generated text",value:"生成中です",disabled:!0})]})]}),play:async({canvasElement:s,step:t})=>{const r=v(s);await t("エラー説明を入力へ関連付ける",async()=>{await l(r.getByLabelText("invalid opening")).toHaveAccessibleDescription("導入文は情景が伝わる長さで入力してください。")}),await t("参照専用と無効状態を保持する",async()=>{await l(r.getByLabelText("readonly summary")).toHaveAttribute("readonly"),await l(r.getByLabelText("disabled generated text")).toBeDisabled()})}};var m,x,p;i.parameters={...i.parameters,docs:{...(m=i.parameters)==null?void 0:m.docs,source:{originalSource:`{
  name: 'バリアントと複数行編集',
  render: function Render() {
    const [notes, setNotes] = useState('扉には月の紋章がある。');
    return <div className="grid gap-5">
        <header className="grid gap-2">
          <p className="text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby">Session notes</p>
          <h1 className="font-myr-display text-3xl">複数行入力</h1>
        </header>
        {variants.map(variant => <label className="grid gap-2 text-sm font-extrabold text-myr-slate" key={variant}>
            {variant}
            <Textarea aria-label={\`\${variant} textarea\`} variant={variant} value={variant === 'field' ? notes : undefined} defaultValue={variant === 'field' ? undefined : \`\${variant} で残す物語の断片\`} onChange={variant === 'field' ? event => setNotes(event.target.value) : undefined} rows={variant === 'compact' ? 2 : 3} />
          </label>)}
        <output className="whitespace-pre-wrap text-sm text-myr-slate" aria-live="polite">記録: {notes}</output>
      </div>;
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Textarea 固有の全バリアントを表示する', async () => {
      for (const variant of variants) await expect(canvas.getByLabelText(\`\${variant} textarea\`)).toBeVisible();
    });
    await step('改行を含む記録を編集する', async () => {
      const textarea = canvas.getByLabelText('field textarea');
      await userEvent.click(textarea);
      await userEvent.keyboard('{End}{Enter}司書は合言葉を待っている。');
      await expect(textarea).toHaveValue('扉には月の紋章がある。\\n司書は合言葉を待っている。');
    });
    await step('composer も複数行入力として公開する', async () => {
      await expect(canvas.getByLabelText('composer textarea')).toHaveAttribute('rows', '3');
    });
  }
}`,...(p=(x=i.parameters)==null?void 0:x.docs)==null?void 0:p.source}}};var y,b,u;o.parameters={...o.parameters,docs:{...(y=o.parameters)==null?void 0:y.docs,source:{originalSource:`{
  name: '検証とネイティブ状態',
  render: () => <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-extrabold text-myr-slate">
        修正が必要な導入文
        <Textarea aria-label="invalid opening" aria-invalid="true" aria-describedby="opening-error" defaultValue="短すぎます" />
      </label>
      <p id="opening-error" className="text-sm font-bold text-myr-ruby">導入文は情景が伝わる長さで入力してください。</p>
      <label className="grid gap-2 text-sm font-extrabold text-myr-slate">
        確定済みの要約
        <Textarea aria-label="readonly summary" value="夜明けまで門を守った。" readOnly />
      </label>
      <label className="grid gap-2 text-sm font-extrabold text-myr-slate">
        生成中の本文
        <Textarea aria-label="disabled generated text" value="生成中です" disabled />
      </label>
    </div>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('エラー説明を入力へ関連付ける', async () => {
      await expect(canvas.getByLabelText('invalid opening')).toHaveAccessibleDescription('導入文は情景が伝わる長さで入力してください。');
    });
    await step('参照専用と無効状態を保持する', async () => {
      await expect(canvas.getByLabelText('readonly summary')).toHaveAttribute('readonly');
      await expect(canvas.getByLabelText('disabled generated text')).toBeDisabled();
    });
  }
}`,...(u=(b=o.parameters)==null?void 0:b.docs)==null?void 0:u.source}}};const B=["VariantsAndEditing","ValidationAndNativeStates"];export{o as ValidationAndNativeStates,i as VariantsAndEditing,B as __namedExportsOrder,j as default};
