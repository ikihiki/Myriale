import{j as a}from"./jsx-runtime-BO8uF4Og.js";import{r as b}from"./index-D4H_InIO.js";import{w as f,e as s,u as o}from"./index-C4S39nCK.js";import{B as u,I as l,T}from"./Textarea-CZBz46eo.js";const C={title:"コンポーネント/Form Controls",parameters:{layout:"centered"},decorators:[i=>a.jsx("div",{className:"grid w-[min(680px,92vw)] gap-5 rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink",children:a.jsx(i,{})})]},c={name:"Input / Textarea variants",render:function(){const[n,e]=b.useState("Myriale"),[t,g]=b.useState("mist-2026"),[B,h]=b.useState("一行目");return a.jsxs("div",{className:"grid gap-4 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-xs [&_label]:font-black",children:[a.jsxs("label",{children:["Default",a.jsx(l,{"aria-label":"Default input",value:n,onChange:r=>e(r.target.value)})]}),a.jsxs("label",{children:["Password",a.jsx(l,{"aria-label":"Password input",type:"password",value:t,onChange:r=>g(r.target.value)})]}),a.jsxs("label",{children:["Disabled",a.jsx(l,{"aria-label":"Disabled input",value:"変更不可",disabled:!0})]}),a.jsxs("label",{children:["Readonly",a.jsx(l,{"aria-label":"Readonly input",value:"参照専用",readOnly:!0})]}),a.jsxs("label",{children:["Invalid",a.jsx(l,{"aria-label":"Invalid input","aria-invalid":"true",className:"border-myr-ruby !bg-[#fff7f5]",defaultValue:"修正が必要"})]}),a.jsxs("label",{children:["Compact",a.jsx(l,{"aria-label":"Compact input",className:"min-h-[30px] !px-2 !py-1.5 text-myr-ui-sm",defaultValue:"コンパクト"})]}),a.jsxs("label",{children:["Borderless",a.jsx(l,{"aria-label":"Borderless input",className:"rounded-none border-0 bg-transparent shadow-none",defaultValue:"境界線なし"})]}),a.jsxs("label",{children:["Textarea",a.jsx(T,{"aria-label":"Textarea input",value:B,onChange:r=>h(r.target.value)})]})]})},play:async({canvasElement:i,step:n})=>{const e=f(i);await n("標準入力はキーボード操作で値を更新する",async()=>{const t=e.getByLabelText("Default input");await o.clear(t),await o.type(t,"星喰いの図書館"),await s(t).toHaveValue("星喰いの図書館")}),await n("パスワード属性と各状態を保持する",async()=>{await s(e.getByLabelText("Password input")).toHaveAttribute("type","password"),await s(e.getByLabelText("Disabled input")).toBeDisabled(),await s(e.getByLabelText("Readonly input")).toHaveAttribute("readonly"),await s(e.getByLabelText("Invalid input")).toHaveAttribute("aria-invalid","true")}),await n("Tab移動とTextareaの改行入力が機能する",async()=>{const t=e.getByLabelText("Textarea input");t.focus(),await o.keyboard("{End}{Enter}二行目"),await s(t).toHaveValue(`一行目
二行目`),await o.tab(),await s(t).not.toHaveFocus()})}},d={name:"Button compatibility / form semantics",render:function(){const[n,e]=b.useState("未操作");return a.jsxs("div",{className:"grid gap-4",children:[a.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[a.jsx(u,{onClick:()=>e("plain clicked"),children:"Plain button"}),a.jsx(u,{className:"rounded-full bg-myr-ink px-5 py-2.5 font-extrabold text-myr-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-myr-iris",onClick:()=>e("custom clicked"),children:"Custom button"}),a.jsx(u,{disabled:!0,children:"Disabled button"})]}),a.jsxs("form",{className:"grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end",onSubmit:t=>{t.preventDefault(),e("form submitted")},children:[a.jsxs("label",{className:"grid min-w-0 gap-1.5 text-xs font-black",children:["Form value",a.jsx(l,{name:"title",defaultValue:"星喰いの図書館"})]}),a.jsx(u,{className:"justify-self-start rounded-full bg-myr-gold px-5 py-3 font-black text-myr-ink",children:"Submit without type"})]}),a.jsxs("output",{"aria-live":"polite",children:["状態: ",n]})]})},play:async({canvasElement:i,step:n})=>{const e=f(i);await n("互換ベースと無効状態を公開する",async()=>{await s(e.getByRole("button",{name:"Plain button"})).toHaveClass("cursor-pointer","border-0","[font:inherit]"),await s(e.getByRole("button",{name:"Disabled button"})).toBeDisabled(),await s(e.getByRole("button",{name:"Disabled button"})).toHaveClass("disabled:cursor-not-allowed")}),await n("キーボードフォーカスと操作を保つ",async()=>{const t=e.getByRole("button",{name:"Plain button"});t.focus(),await s(t).toHaveFocus(),await o.keyboard("{Enter}"),await s(e.getByText("状態: plain clicked")).toBeInTheDocument(),await o.tab(),await s(e.getByRole("button",{name:"Custom button"})).toHaveFocus()}),await n("type未指定のボタンはフォームを送信する",async()=>{const t=e.getByRole("button",{name:"Submit without type"});await s(t).not.toHaveAttribute("type"),await o.click(t),await s(e.getByText("状態: form submitted")).toBeInTheDocument()})}};var p,m,x;c.parameters={...c.parameters,docs:{...(p=c.parameters)==null?void 0:p.docs,source:{originalSource:`{
  name: 'Input / Textarea variants',
  render: function Render() {
    const [name, setName] = useState('Myriale');
    const [password, setPassword] = useState('mist-2026');
    const [notes, setNotes] = useState('一行目');
    return <div className="grid gap-4 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-xs [&_label]:font-black">
        <label>Default<Input aria-label="Default input" value={name} onChange={event => setName(event.target.value)} /></label>
        <label>Password<Input aria-label="Password input" type="password" value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label>Disabled<Input aria-label="Disabled input" value="変更不可" disabled /></label>
        <label>Readonly<Input aria-label="Readonly input" value="参照専用" readOnly /></label>
        <label>Invalid<Input aria-label="Invalid input" aria-invalid="true" className="border-myr-ruby !bg-[#fff7f5]" defaultValue="修正が必要" /></label>
        <label>Compact<Input aria-label="Compact input" className="min-h-[30px] !px-2 !py-1.5 text-myr-ui-sm" defaultValue="コンパクト" /></label>
        <label>Borderless<Input aria-label="Borderless input" className="rounded-none border-0 bg-transparent shadow-none" defaultValue="境界線なし" /></label>
        <label>Textarea<Textarea aria-label="Textarea input" value={notes} onChange={event => setNotes(event.target.value)} /></label>
      </div>;
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('標準入力はキーボード操作で値を更新する', async () => {
      const input = canvas.getByLabelText('Default input');
      await userEvent.clear(input);
      await userEvent.type(input, '星喰いの図書館');
      await expect(input).toHaveValue('星喰いの図書館');
    });
    await step('パスワード属性と各状態を保持する', async () => {
      await expect(canvas.getByLabelText('Password input')).toHaveAttribute('type', 'password');
      await expect(canvas.getByLabelText('Disabled input')).toBeDisabled();
      await expect(canvas.getByLabelText('Readonly input')).toHaveAttribute('readonly');
      await expect(canvas.getByLabelText('Invalid input')).toHaveAttribute('aria-invalid', 'true');
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
}`,...(x=(m=c.parameters)==null?void 0:m.docs)==null?void 0:x.source}}};var y,v,w;d.parameters={...d.parameters,docs:{...(y=d.parameters)==null?void 0:y.docs,source:{originalSource:`{
  name: 'Button compatibility / form semantics',
  render: function Render() {
    const [status, setStatus] = useState('未操作');
    return <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setStatus('plain clicked')}>Plain button</Button>
          <Button className="rounded-full bg-myr-ink px-5 py-2.5 font-extrabold text-myr-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-myr-iris" onClick={() => setStatus('custom clicked')}>Custom button</Button>
          <Button disabled>Disabled button</Button>
        </div>
        <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" onSubmit={event => {
        event.preventDefault();
        setStatus('form submitted');
      }}>
          <label className="grid min-w-0 gap-1.5 text-xs font-black">Form value<Input name="title" defaultValue="星喰いの図書館" /></label>
          <Button className="justify-self-start rounded-full bg-myr-gold px-5 py-3 font-black text-myr-ink">Submit without type</Button>
        </form>
        <output aria-live="polite">状態: {status}</output>
      </div>;
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('互換ベースと無効状態を公開する', async () => {
      await expect(canvas.getByRole('button', {
        name: 'Plain button'
      })).toHaveClass('cursor-pointer', 'border-0', '[font:inherit]');
      await expect(canvas.getByRole('button', {
        name: 'Disabled button'
      })).toBeDisabled();
      await expect(canvas.getByRole('button', {
        name: 'Disabled button'
      })).toHaveClass('disabled:cursor-not-allowed');
    });
    await step('キーボードフォーカスと操作を保つ', async () => {
      const plain = canvas.getByRole('button', {
        name: 'Plain button'
      });
      plain.focus();
      await expect(plain).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(canvas.getByText('状態: plain clicked')).toBeInTheDocument();
      await userEvent.tab();
      await expect(canvas.getByRole('button', {
        name: 'Custom button'
      })).toHaveFocus();
    });
    await step('type未指定のボタンはフォームを送信する', async () => {
      const submit = canvas.getByRole('button', {
        name: 'Submit without type'
      });
      await expect(submit).not.toHaveAttribute('type');
      await userEvent.click(submit);
      await expect(canvas.getByText('状態: form submitted')).toBeInTheDocument();
    });
  }
}`,...(w=(v=d.parameters)==null?void 0:v.docs)==null?void 0:w.source}}};const R=["Variants","ButtonCompatibility"];export{d as ButtonCompatibility,c as Variants,R as __namedExportsOrder,C as default};
