import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{r as f}from"./index-D4H_InIO.js";import{w as v,e as s,u as o}from"./index-C4S39nCK.js";import{I as r}from"./Surfaces-CQIJcDfy.js";const j={title:"コンポーネント/UI/Input",component:r,parameters:{layout:"centered"},decorators:[l=>e.jsx("div",{"data-myriale-theme":"archive",className:"w-full max-w-myr-focused rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel",children:e.jsx(l,{})})]},c=["field","underline","compact","borderless"],n={name:"バリアントと編集",render:function(){const[i,t]=f.useState("星喰いの図書館");return e.jsxs("div",{className:"grid gap-5",children:[e.jsxs("header",{className:"grid gap-2",children:[e.jsx("p",{className:"text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby",children:"Scenario metadata"}),e.jsx("h1",{className:"font-myr-display text-3xl",children:"入力欄"})]}),c.map(a=>e.jsxs("label",{className:"grid gap-2 text-sm font-extrabold text-myr-slate",children:[a,e.jsx(r,{"aria-label":`${a} input`,variant:a,value:a==="field"?i:void 0,defaultValue:a==="field"?void 0:`${a} の記録`,onChange:a==="field"?g=>t(g.target.value):void 0})]},a)),e.jsxs("output",{className:"text-sm text-myr-slate","aria-live":"polite",children:["現在の題名: ",i]})]})},play:async({canvasElement:l,step:i})=>{const t=v(l);await i("全バリアントを表示する",async()=>{for(const a of c)await s(t.getByLabelText(`${a} input`)).toBeVisible()}),await i("標準入力をキーボードで編集する",async()=>{const a=t.getByLabelText("field input");await o.clear(a),await o.type(a,"霧の王冠"),await s(a).toHaveValue("霧の王冠"),await s(t.getByText("現在の題名: 霧の王冠")).toBeVisible()})}},d={name:"検証とネイティブ状態",render:()=>e.jsxs("div",{className:"grid gap-4",children:[e.jsxs("label",{className:"grid gap-2 text-sm font-extrabold text-myr-slate",children:["修正が必要な題名",e.jsx(r,{"aria-label":"invalid scenario title",defaultValue:"?","aria-invalid":"true","aria-describedby":"invalid-title-message"})]}),e.jsx("p",{id:"invalid-title-message",className:"text-sm font-bold text-myr-ruby",children:"題名は2文字以上で入力してください。"}),e.jsxs("label",{className:"grid gap-2 text-sm font-extrabold text-myr-slate",children:["読み取り専用の識別子",e.jsx(r,{"aria-label":"readonly scenario id",value:"scenario-014",readOnly:!0})]}),e.jsxs("label",{className:"grid gap-2 text-sm font-extrabold text-myr-slate",children:["同期中の入力",e.jsx(r,{"aria-label":"disabled sync field",value:"同期を待っています",disabled:!0})]})]}),play:async({canvasElement:l,step:i})=>{const t=v(l);await i("エラー状態を説明文へ関連付ける",async()=>{const a=t.getByLabelText("invalid scenario title");await s(a).toHaveAttribute("aria-invalid","true"),await s(a).toHaveAccessibleDescription("題名は2文字以上で入力してください。")}),await i("readonly と disabled を区別する",async()=>{await s(t.getByLabelText("readonly scenario id")).toHaveAttribute("readonly"),await s(t.getByLabelText("readonly scenario id")).not.toBeDisabled(),await s(t.getByLabelText("disabled sync field")).toBeDisabled()})}};var m,p,x;n.parameters={...n.parameters,docs:{...(m=n.parameters)==null?void 0:m.docs,source:{originalSource:`{
  name: 'バリアントと編集',
  render: function Render() {
    const [title, setTitle] = useState('星喰いの図書館');
    return <div className="grid gap-5">
        <header className="grid gap-2">
          <p className="text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby">Scenario metadata</p>
          <h1 className="font-myr-display text-3xl">入力欄</h1>
        </header>
        {variants.map(variant => <label className="grid gap-2 text-sm font-extrabold text-myr-slate" key={variant}>
            {variant}
            <Input aria-label={\`\${variant} input\`} variant={variant} value={variant === 'field' ? title : undefined} defaultValue={variant === 'field' ? undefined : \`\${variant} の記録\`} onChange={variant === 'field' ? event => setTitle(event.target.value) : undefined} />
          </label>)}
        <output className="text-sm text-myr-slate" aria-live="polite">現在の題名: {title}</output>
      </div>;
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('全バリアントを表示する', async () => {
      for (const variant of variants) await expect(canvas.getByLabelText(\`\${variant} input\`)).toBeVisible();
    });
    await step('標準入力をキーボードで編集する', async () => {
      const input = canvas.getByLabelText('field input');
      await userEvent.clear(input);
      await userEvent.type(input, '霧の王冠');
      await expect(input).toHaveValue('霧の王冠');
      await expect(canvas.getByText('現在の題名: 霧の王冠')).toBeVisible();
    });
  }
}`,...(x=(p=n.parameters)==null?void 0:p.docs)==null?void 0:x.source}}};var y,u,b;d.parameters={...d.parameters,docs:{...(y=d.parameters)==null?void 0:y.docs,source:{originalSource:`{
  name: '検証とネイティブ状態',
  render: () => <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-extrabold text-myr-slate">
        修正が必要な題名
        <Input aria-label="invalid scenario title" defaultValue="?" aria-invalid="true" aria-describedby="invalid-title-message" />
      </label>
      <p id="invalid-title-message" className="text-sm font-bold text-myr-ruby">題名は2文字以上で入力してください。</p>
      <label className="grid gap-2 text-sm font-extrabold text-myr-slate">
        読み取り専用の識別子
        <Input aria-label="readonly scenario id" value="scenario-014" readOnly />
      </label>
      <label className="grid gap-2 text-sm font-extrabold text-myr-slate">
        同期中の入力
        <Input aria-label="disabled sync field" value="同期を待っています" disabled />
      </label>
    </div>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('エラー状態を説明文へ関連付ける', async () => {
      const invalid = canvas.getByLabelText('invalid scenario title');
      await expect(invalid).toHaveAttribute('aria-invalid', 'true');
      await expect(invalid).toHaveAccessibleDescription('題名は2文字以上で入力してください。');
    });
    await step('readonly と disabled を区別する', async () => {
      await expect(canvas.getByLabelText('readonly scenario id')).toHaveAttribute('readonly');
      await expect(canvas.getByLabelText('readonly scenario id')).not.toBeDisabled();
      await expect(canvas.getByLabelText('disabled sync field')).toBeDisabled();
    });
  }
}`,...(b=(u=d.parameters)==null?void 0:u.docs)==null?void 0:b.source}}};const T=["VariantsAndEditing","ValidationAndNativeStates"];export{d as ValidationAndNativeStates,n as VariantsAndEditing,T as __namedExportsOrder,j as default};
