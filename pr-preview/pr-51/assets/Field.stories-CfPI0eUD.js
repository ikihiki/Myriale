import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{r as d}from"./index-D4H_InIO.js";import{w,e as n,u as s}from"./index-C4S39nCK.js";import{F as x,I as g,a as B,f as I}from"./Surfaces-xpIMDkG0.js";const j={title:"コンポーネント/UI/Field",component:x,parameters:{layout:"centered"},decorators:[i=>e.jsx("div",{"data-myriale-theme":"archive",className:"w-full max-w-myr-focused rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel",children:e.jsx(i,{})})]},o={name:"ヘルプ・必須・検証",render:function(){const[r,t]=d.useState("月影の司書"),[a,p]=d.useState(""),[f,l]=d.useState(!1),c="field-character-name",b=I(c,a?"error":"help");function h(u){if(u.preventDefault(),!r.trim()){p("登場人物の名前を入力してください。"),l(!1);return}p(""),l(!0)}return e.jsxs("form",{className:"grid gap-4",noValidate:!0,onSubmit:h,children:[e.jsxs("header",{className:"grid gap-2",children:[e.jsx("p",{className:"text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby",children:"Character record"}),e.jsx("h1",{className:"font-myr-display text-3xl",children:"登場人物を記録する"})]}),e.jsx(x,{label:"名前",htmlFor:c,required:!0,help:"セッション中に表示する呼び名です。",error:a||void 0,children:e.jsx(g,{id:c,required:!0,value:r,"aria-invalid":a?"true":void 0,"aria-describedby":b,onChange:u=>{t(u.target.value),l(!1)}})}),e.jsx(B,{type:"submit",variant:"primary",children:"登場人物を保存"}),e.jsx("output",{"aria-live":"polite",className:"text-sm font-bold text-myr-slate",children:f?`${r} を保存しました。`:"未保存"})]})},play:async({canvasElement:i,step:r})=>{const t=w(i),a=t.getByLabelText(/^名前/);await r("必須入力とヘルプを関連付ける",async()=>{await n(a).toBeRequired(),await n(a).toHaveAccessibleDescription("セッション中に表示する呼び名です。")}),await r("空の送信時にヘルプをエラーへ置き換える",async()=>{await s.clear(a),await s.click(t.getByRole("button",{name:"登場人物を保存"})),await n(t.getByRole("alert")).toHaveTextContent("登場人物の名前を入力してください。"),await n(a).toHaveAttribute("aria-invalid","true"),await n(t.queryByText("セッション中に表示する呼び名です。")).not.toBeInTheDocument()}),await r("修正した値を保存して結果を通知する",async()=>{await s.type(a,"白銀の旅人"),await s.click(t.getByRole("button",{name:"登場人物を保存"})),await n(t.getByText("白銀の旅人 を保存しました。")).toBeVisible(),await n(t.queryByRole("alert")).not.toBeInTheDocument()})}};var m,y,v;o.parameters={...o.parameters,docs:{...(m=o.parameters)==null?void 0:m.docs,source:{originalSource:`{
  name: 'ヘルプ・必須・検証',
  render: function Render() {
    const [value, setValue] = useState('月影の司書');
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const inputId = 'field-character-name';
    const descriptionId = fieldDescriptionId(inputId, error ? 'error' : 'help');
    function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!value.trim()) {
        setError('登場人物の名前を入力してください。');
        setSaved(false);
        return;
      }
      setError('');
      setSaved(true);
    }
    return <form className="grid gap-4" noValidate onSubmit={submit}>
        <header className="grid gap-2">
          <p className="text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby">Character record</p>
          <h1 className="font-myr-display text-3xl">登場人物を記録する</h1>
        </header>
        <Field label="名前" htmlFor={inputId} required help="セッション中に表示する呼び名です。" error={error || undefined}>
          <Input id={inputId} required value={value} aria-invalid={error ? 'true' : undefined} aria-describedby={descriptionId} onChange={event => {
          setValue(event.target.value);
          setSaved(false);
        }} />
        </Field>
        <Button type="submit" variant="primary">登場人物を保存</Button>
        <output aria-live="polite" className="text-sm font-bold text-myr-slate">{saved ? \`\${value} を保存しました。\` : '未保存'}</output>
      </form>;
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(/^名前/);
    await step('必須入力とヘルプを関連付ける', async () => {
      await expect(input).toBeRequired();
      await expect(input).toHaveAccessibleDescription('セッション中に表示する呼び名です。');
    });
    await step('空の送信時にヘルプをエラーへ置き換える', async () => {
      await userEvent.clear(input);
      await userEvent.click(canvas.getByRole('button', {
        name: '登場人物を保存'
      }));
      await expect(canvas.getByRole('alert')).toHaveTextContent('登場人物の名前を入力してください。');
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(canvas.queryByText('セッション中に表示する呼び名です。')).not.toBeInTheDocument();
    });
    await step('修正した値を保存して結果を通知する', async () => {
      await userEvent.type(input, '白銀の旅人');
      await userEvent.click(canvas.getByRole('button', {
        name: '登場人物を保存'
      }));
      await expect(canvas.getByText('白銀の旅人 を保存しました。')).toBeVisible();
      await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    });
  }
}`,...(v=(y=o.parameters)==null?void 0:y.docs)==null?void 0:v.source}}};const q=["HelpRequiredAndValidation"];export{o as HelpRequiredAndValidation,q as __namedExportsOrder,j as default};
