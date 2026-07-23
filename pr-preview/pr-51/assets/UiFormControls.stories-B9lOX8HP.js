import{j as a}from"./jsx-runtime-BO8uF4Og.js";import{r as x}from"./index-D4H_InIO.js";import{w as T,e as s,u as o}from"./index-C4S39nCK.js";import{a as u,I as n,n as d}from"./Surfaces-CQIJcDfy.js";const I={title:"コンポーネント/Form Controls",parameters:{layout:"centered"},decorators:[r=>a.jsx("div",{className:"grid w-[min(680px,92vw)] gap-5 rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink",children:a.jsx(r,{})})]},b={name:"Input / Textarea variants",render:function(){const[l,e]=x.useState("Myriale"),[t,i]=x.useState("mist-2026"),[p,C]=x.useState("一行目");return a.jsxs("div",{className:"grid gap-5",children:[a.jsxs("section",{className:"grid gap-3 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-xs [&_label]:font-black","aria-label":"Input role matrix",children:[a.jsxs("label",{children:["Field",a.jsx(n,{"aria-label":"Field input",value:l,onChange:c=>e(c.target.value)})]}),a.jsxs("label",{children:["Underline",a.jsx(n,{"aria-label":"Underline input",variant:"underline",defaultValue:"下線入力"})]}),a.jsxs("label",{children:["Compact",a.jsx(n,{"aria-label":"Compact input",variant:"compact",defaultValue:"コンパクト"})]}),a.jsxs("label",{children:["Borderless",a.jsx(n,{"aria-label":"Borderless input",variant:"borderless",defaultValue:"境界線なし"})]}),a.jsxs("label",{children:["Password",a.jsx(n,{"aria-label":"Password input",type:"password",value:t,onChange:c=>i(c.target.value)})]}),a.jsxs("label",{children:["Invalid",a.jsx(n,{"aria-label":"Invalid input","aria-invalid":"true",defaultValue:"修正が必要"})]}),a.jsxs("label",{children:["Readonly",a.jsx(n,{"aria-label":"Readonly input",value:"参照専用",readOnly:!0})]}),a.jsxs("label",{children:["Disabled",a.jsx(n,{"aria-label":"Disabled input",value:"変更不可",disabled:!0})]})]}),a.jsxs("section",{className:"grid gap-3 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-xs [&_label]:font-black","aria-label":"Textarea role matrix",children:[a.jsxs("label",{children:["Field",a.jsx(d,{"aria-label":"Textarea input",value:p,onChange:c=>C(c.target.value)})]}),a.jsxs("label",{children:["Underline",a.jsx(d,{"aria-label":"Underline textarea",variant:"underline",defaultValue:"下線テキスト"})]}),a.jsxs("label",{children:["Compact",a.jsx(d,{"aria-label":"Compact textarea",variant:"compact",defaultValue:"短いメモ"})]}),a.jsxs("label",{children:["Borderless",a.jsx(d,{"aria-label":"Borderless textarea",variant:"borderless",defaultValue:"境界線なし"})]}),a.jsxs("label",{children:["Composer",a.jsx(d,{"aria-label":"Composer textarea",variant:"composer",defaultValue:"次の行動"})]})]})]})},play:async({canvasElement:r,step:l})=>{const e=T(r);await l("標準入力はキーボード操作で値を更新する",async()=>{const t=e.getByLabelText("Field input");await o.clear(t),await o.type(t,"星喰いの図書館"),await s(t).toHaveValue("星喰いの図書館")}),await l("InputとTextareaのrole recipeを公開する",async()=>{await s(e.getByLabelText("Underline input")).toHaveClass("rounded-none","border-b-2","bg-white/45"),await s(e.getByLabelText("Compact input")).toHaveClass("min-h-myr-control-compact","px-2","py-1.5"),await s(e.getByLabelText("Borderless input")).toHaveClass("border-0","bg-transparent","shadow-none"),await s(e.getByLabelText("Composer textarea")).toHaveClass("min-h-myr-composer-min","max-h-myr-composer-max","px-4.75")}),await l("パスワード属性と各状態を保持する",async()=>{await s(e.getByLabelText("Password input")).toHaveAttribute("type","password"),await s(e.getByLabelText("Disabled input")).toBeDisabled(),await s(e.getByLabelText("Disabled input")).toHaveClass("disabled:cursor-not-allowed"),await s(e.getByLabelText("Readonly input")).toHaveAttribute("readonly"),await s(e.getByLabelText("Readonly input")).not.toBeDisabled(),await s(e.getByLabelText("Invalid input")).toHaveAttribute("aria-invalid","true"),await s(e.getByLabelText("Invalid input")).toHaveClass("aria-invalid:border-myr-ruby","aria-invalid:bg-[#fff7f5]")}),await l("Tab移動とTextareaの改行入力が機能する",async()=>{const t=e.getByLabelText("Textarea input");t.focus(),await o.keyboard("{End}{Enter}二行目"),await s(t).toHaveValue(`一行目
二行目`),await o.tab(),await s(t).not.toHaveFocus()})}},j=["primary","secondary","ghost","text","danger","icon"],v=["sm","md","lg","iconSm","iconMd"],m={name:"Button variant × size / semantics",render:function(){const[l,e]=x.useState("未操作");return a.jsxs("div",{className:"grid gap-5",children:[a.jsx("section",{className:"overflow-x-auto","aria-label":"Button role matrix",children:a.jsxs("div",{className:"grid min-w-155 grid-cols-[90px_repeat(5,minmax(92px,1fr))] items-center gap-2",children:[a.jsx("span",{}),v.map(t=>a.jsx("strong",{className:"text-center text-xs",children:t},t)),j.map(t=>a.jsxs("div",{className:"contents",children:[a.jsx("strong",{className:"text-xs",children:t}),v.map(i=>{const p=`${t} ${i}`;return a.jsx(u,{type:"button",variant:t,size:i,"aria-label":t==="icon"?p:void 0,onClick:()=>e(`${p} clicked`),children:t==="icon"?a.jsx("span",{"aria-hidden":"true",children:"✦"}):i},i)})]},t))]})}),a.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[a.jsx(u,{variant:"primary",onClick:()=>e("focus clicked"),children:"Focus target"}),a.jsx(u,{variant:"secondary",disabled:!0,children:"Disabled action"}),a.jsx(u,{onClick:()=>e("plain clicked"),children:"Compatibility button"})]}),a.jsxs("form",{className:"grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end",onSubmit:t=>{t.preventDefault(),e("form submitted")},children:[a.jsxs("label",{className:"grid min-w-0 gap-1.5 text-xs font-black",children:["Form value",a.jsx(n,{name:"title",defaultValue:"星喰いの図書館"})]}),a.jsx(u,{variant:"primary",size:"lg",className:"justify-self-start",children:"Submit without type"})]}),a.jsxs("output",{"aria-live":"polite",children:["状態: ",l]})]})},play:async({canvasElement:r,step:l})=>{const e=T(r);await l("全variantとsizeの組み合わせをtyped recipeで公開する",async()=>{await s(e.getByRole("button",{name:"primary sm"})).toHaveClass("bg-myr-gold","px-3","py-2"),await s(e.getByRole("button",{name:"secondary lg"})).toHaveClass("bg-myr-ink","px-5","py-3"),await s(e.getByRole("button",{name:"icon iconSm"})).toHaveClass("size-7.5","p-0"),await s(e.getByRole("button",{name:"icon iconMd"})).toHaveAccessibleName("icon iconMd")}),await l("focus-visible recipeとdisabled状態を共通化する",async()=>{const t=e.getByRole("button",{name:"Focus target"});t.focus(),await s(t).toHaveFocus(),await s(t).toHaveClass("focus-visible:outline-myr-iris","motion-reduce:transition-none"),await o.keyboard("{Enter}"),await s(e.getByText("状態: focus clicked")).toBeInTheDocument();const i=e.getByRole("button",{name:"Disabled action"});await s(i).toBeDisabled(),await s(i).toHaveClass("disabled:opacity-40","disabled:cursor-not-allowed")}),await l("互換defaultとtype未指定のsubmit semanticsを維持する",async()=>{await s(e.getByRole("button",{name:"Compatibility button"})).toHaveClass("cursor-pointer","border-0","[font:inherit]");const t=e.getByRole("button",{name:"Submit without type"});await s(t).not.toHaveAttribute("type"),await o.click(t),await s(e.getByText("状態: form submitted")).toBeInTheDocument()})}};var y,g,w;b.parameters={...b.parameters,docs:{...(y=b.parameters)==null?void 0:y.docs,source:{originalSource:`{
  name: 'Input / Textarea variants',
  render: function Render() {
    const [name, setName] = useState('Myriale');
    const [password, setPassword] = useState('mist-2026');
    const [notes, setNotes] = useState('一行目');
    return <div className="grid gap-5">
        <section className="grid gap-3 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-xs [&_label]:font-black" aria-label="Input role matrix">
          <label>Field<Input aria-label="Field input" value={name} onChange={event => setName(event.target.value)} /></label>
          <label>Underline<Input aria-label="Underline input" variant="underline" defaultValue="下線入力" /></label>
          <label>Compact<Input aria-label="Compact input" variant="compact" defaultValue="コンパクト" /></label>
          <label>Borderless<Input aria-label="Borderless input" variant="borderless" defaultValue="境界線なし" /></label>
          <label>Password<Input aria-label="Password input" type="password" value={password} onChange={event => setPassword(event.target.value)} /></label>
          <label>Invalid<Input aria-label="Invalid input" aria-invalid="true" defaultValue="修正が必要" /></label>
          <label>Readonly<Input aria-label="Readonly input" value="参照専用" readOnly /></label>
          <label>Disabled<Input aria-label="Disabled input" value="変更不可" disabled /></label>
        </section>
        <section className="grid gap-3 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-xs [&_label]:font-black" aria-label="Textarea role matrix">
          <label>Field<Textarea aria-label="Textarea input" value={notes} onChange={event => setNotes(event.target.value)} /></label>
          <label>Underline<Textarea aria-label="Underline textarea" variant="underline" defaultValue="下線テキスト" /></label>
          <label>Compact<Textarea aria-label="Compact textarea" variant="compact" defaultValue="短いメモ" /></label>
          <label>Borderless<Textarea aria-label="Borderless textarea" variant="borderless" defaultValue="境界線なし" /></label>
          <label>Composer<Textarea aria-label="Composer textarea" variant="composer" defaultValue="次の行動" /></label>
        </section>
      </div>;
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('標準入力はキーボード操作で値を更新する', async () => {
      const input = canvas.getByLabelText('Field input');
      await userEvent.clear(input);
      await userEvent.type(input, '星喰いの図書館');
      await expect(input).toHaveValue('星喰いの図書館');
    });
    await step('InputとTextareaのrole recipeを公開する', async () => {
      await expect(canvas.getByLabelText('Underline input')).toHaveClass('rounded-none', 'border-b-2', 'bg-white/45');
      await expect(canvas.getByLabelText('Compact input')).toHaveClass('min-h-myr-control-compact', 'px-2', 'py-1.5');
      await expect(canvas.getByLabelText('Borderless input')).toHaveClass('border-0', 'bg-transparent', 'shadow-none');
      await expect(canvas.getByLabelText('Composer textarea')).toHaveClass('min-h-myr-composer-min', 'max-h-myr-composer-max', 'px-4.75');
    });
    await step('パスワード属性と各状態を保持する', async () => {
      await expect(canvas.getByLabelText('Password input')).toHaveAttribute('type', 'password');
      await expect(canvas.getByLabelText('Disabled input')).toBeDisabled();
      await expect(canvas.getByLabelText('Disabled input')).toHaveClass('disabled:cursor-not-allowed');
      await expect(canvas.getByLabelText('Readonly input')).toHaveAttribute('readonly');
      await expect(canvas.getByLabelText('Readonly input')).not.toBeDisabled();
      await expect(canvas.getByLabelText('Invalid input')).toHaveAttribute('aria-invalid', 'true');
      await expect(canvas.getByLabelText('Invalid input')).toHaveClass('aria-invalid:border-myr-ruby', 'aria-invalid:bg-[#fff7f5]');
    });
    await step('Tab移動とTextareaの改行入力が機能する', async () => {
      const textarea = canvas.getByLabelText('Textarea input');
      textarea.focus();
      await userEvent.keyboard('{End}{Enter}二行目');
      await expect(textarea).toHaveValue('一行目\\n二行目');
      await userEvent.tab();
      await expect(textarea).not.toHaveFocus();
    });
  }
}`,...(w=(g=b.parameters)==null?void 0:g.docs)==null?void 0:w.source}}};var f,B,h;m.parameters={...m.parameters,docs:{...(f=m.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: 'Button variant × size / semantics',
  render: function Render() {
    const [status, setStatus] = useState('未操作');
    return <div className="grid gap-5">
        <section className="overflow-x-auto" aria-label="Button role matrix">
          <div className="grid min-w-155 grid-cols-[90px_repeat(5,minmax(92px,1fr))] items-center gap-2">
            <span />
            {buttonSizes.map(size => <strong className="text-center text-xs" key={size}>{size}</strong>)}
            {buttonVariants.map(variant => <div className="contents" key={variant}>
                <strong className="text-xs">{variant}</strong>
                {buttonSizes.map(size => {
              const label = \`\${variant} \${size}\`;
              return <Button type="button" variant={variant} size={size} aria-label={variant === 'icon' ? label : undefined} key={size} onClick={() => setStatus(\`\${label} clicked\`)}>
                      {variant === 'icon' ? <span aria-hidden="true">✦</span> : size}
                    </Button>;
            })}
              </div>)}
          </div>
        </section>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => setStatus('focus clicked')}>Focus target</Button>
          <Button variant="secondary" disabled>Disabled action</Button>
          <Button onClick={() => setStatus('plain clicked')}>Compatibility button</Button>
        </div>
        <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" onSubmit={event => {
        event.preventDefault();
        setStatus('form submitted');
      }}>
          <label className="grid min-w-0 gap-1.5 text-xs font-black">Form value<Input name="title" defaultValue="星喰いの図書館" /></label>
          <Button variant="primary" size="lg" className="justify-self-start">Submit without type</Button>
        </form>
        <output aria-live="polite">状態: {status}</output>
      </div>;
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('全variantとsizeの組み合わせをtyped recipeで公開する', async () => {
      await expect(canvas.getByRole('button', {
        name: 'primary sm'
      })).toHaveClass('bg-myr-gold', 'px-3', 'py-2');
      await expect(canvas.getByRole('button', {
        name: 'secondary lg'
      })).toHaveClass('bg-myr-ink', 'px-5', 'py-3');
      await expect(canvas.getByRole('button', {
        name: 'icon iconSm'
      })).toHaveClass('size-7.5', 'p-0');
      await expect(canvas.getByRole('button', {
        name: 'icon iconMd'
      })).toHaveAccessibleName('icon iconMd');
    });
    await step('focus-visible recipeとdisabled状態を共通化する', async () => {
      const focusTarget = canvas.getByRole('button', {
        name: 'Focus target'
      });
      focusTarget.focus();
      await expect(focusTarget).toHaveFocus();
      await expect(focusTarget).toHaveClass('focus-visible:outline-myr-iris', 'motion-reduce:transition-none');
      await userEvent.keyboard('{Enter}');
      await expect(canvas.getByText('状態: focus clicked')).toBeInTheDocument();
      const disabled = canvas.getByRole('button', {
        name: 'Disabled action'
      });
      await expect(disabled).toBeDisabled();
      await expect(disabled).toHaveClass('disabled:opacity-40', 'disabled:cursor-not-allowed');
    });
    await step('互換defaultとtype未指定のsubmit semanticsを維持する', async () => {
      await expect(canvas.getByRole('button', {
        name: 'Compatibility button'
      })).toHaveClass('cursor-pointer', 'border-0', '[font:inherit]');
      const submit = canvas.getByRole('button', {
        name: 'Submit without type'
      });
      await expect(submit).not.toHaveAttribute('type');
      await userEvent.click(submit);
      await expect(canvas.getByText('状態: form submitted')).toBeInTheDocument();
    });
  }
}`,...(h=(B=m.parameters)==null?void 0:B.docs)==null?void 0:h.source}}};const S=["Variants","ButtonRoles"];export{m as ButtonRoles,b as Variants,S as __namedExportsOrder,I as default};
