import{j as c}from"./jsx-runtime-BO8uF4Og.js";import{r as m}from"./index-D4H_InIO.js";import{w as i,e as a,u as s}from"./index-C4S39nCK.js";import{M as p}from"./Surfaces-xpIMDkG0.js";const x={title:"コンポーネント/UI/MarkdownEditor",component:p,parameters:{layout:"centered"},decorators:[n=>c.jsx("div",{"data-myriale-theme":"archive",className:"w-[min(860px,92vw)] rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel",children:c.jsx(n,{})})]},o={name:"Markdown入力とプレビュー",args:{label:"基本情報",value:"",onChange:()=>{}},render:function(){const[r,t]=m.useState(`## 物語の導入

水没した地下図書館で、**銀の鍵**を探します。

- 禁書を開かない
- 星図灯を失わない`);return c.jsx(p,{label:"基本情報",value:r,onChange:t,help:"見出し、強調、リスト、リンクをMarkdownで記述できます。"})},play:async({canvasElement:n,step:r})=>{const t=i(n);await r("Markdown本文を編集できる",async()=>{const e=t.getByLabelText("基本情報");await a(e).toHaveValue(a.stringContaining("## 物語の導入")),await s.click(e),await s.keyboard("{End}{Enter}- 閉じた星座の扉を調べる"),await a(e).toHaveValue(a.stringContaining("閉じた星座の扉"))}),await r("プレビューではMarkdownを構造化して表示する",async()=>{await s.click(t.getByRole("button",{name:"プレビュー"}));const e=t.getByRole("article",{name:"基本情報のMarkdownプレビュー"});await a(i(e).getByRole("heading",{name:"物語の導入"})).toBeVisible(),await a(i(e).getByText("銀の鍵")).toBeVisible()})}};var l,d,w;o.parameters={...o.parameters,docs:{...(l=o.parameters)==null?void 0:l.docs,source:{originalSource:`{
  name: 'Markdown入力とプレビュー',
  args: {
    label: '基本情報',
    value: '',
    onChange: () => undefined
  },
  render: function Render() {
    const [value, setValue] = useState('## 物語の導入\\n\\n水没した地下図書館で、**銀の鍵**を探します。\\n\\n- 禁書を開かない\\n- 星図灯を失わない');
    return <MarkdownEditor label="基本情報" value={value} onChange={setValue} help="見出し、強調、リスト、リンクをMarkdownで記述できます。" />;
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Markdown本文を編集できる', async () => {
      const editor = canvas.getByLabelText('基本情報');
      await expect(editor).toHaveValue(expect.stringContaining('## 物語の導入'));
      await userEvent.click(editor);
      await userEvent.keyboard('{End}{Enter}- 閉じた星座の扉を調べる');
      await expect(editor).toHaveValue(expect.stringContaining('閉じた星座の扉'));
    });
    await step('プレビューではMarkdownを構造化して表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'プレビュー'
      }));
      const preview = canvas.getByRole('article', {
        name: '基本情報のMarkdownプレビュー'
      });
      await expect(within(preview).getByRole('heading', {
        name: '物語の導入'
      })).toBeVisible();
      await expect(within(preview).getByText('銀の鍵')).toBeVisible();
    });
  }
}`,...(w=(d=o.parameters)==null?void 0:d.docs)==null?void 0:w.source}}};const k=["EditAndPreview"];export{o as EditAndPreview,k as __namedExportsOrder,x as default};
