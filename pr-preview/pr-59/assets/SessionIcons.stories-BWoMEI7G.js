import{j as a}from"./jsx-runtime-BO8uF4Og.js";import{r as B}from"./index-D4H_InIO.js";import{w as h,e as t,u as f}from"./index-C4S39nCK.js";import{S as d,A as I,R as l,L as k,C as w}from"./SessionIcons-yGOCmQwo.js";import{L as j,a as r,D as N}from"./Surfaces-xpIMDkG0.js";const L={title:"コンポーネント/UI/Session Icons",component:d,parameters:{layout:"centered"},decorators:[n=>a.jsx("div",{"data-myriale-theme":"archive",className:"w-full max-w-myr-reading rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel",children:a.jsx(n,{})})]},o={name:"全アイコンと装飾用デフォルト",render:()=>a.jsxs("div",{className:"grid gap-5",children:[a.jsx(j,{as:"h1",textRole:"section",children:"セッションアイコン"}),a.jsxs("div",{className:"grid gap-4 sm:grid-cols-2",children:[a.jsxs("div",{className:"flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4",children:[a.jsx(I,{"data-testid":"ArrowUpIcon"}),a.jsx("span",{children:"送信"})]}),a.jsxs("div",{className:"flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4",children:[a.jsx(l,{"data-testid":"RotateBackIcon"}),a.jsx("span",{children:"巻き戻す"})]}),a.jsxs("div",{className:"flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4",children:[a.jsx(d,{"data-testid":"SparkleIcon"}),a.jsx("span",{children:"生成する"})]}),a.jsxs("div",{className:"flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4",children:[a.jsx(k,{"data-testid":"LightbulbIcon"}),a.jsx("span",{children:"提案を見る"})]}),a.jsxs("div",{className:"flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4",children:[a.jsx(w,{"data-testid":"CloseIcon"}),a.jsx("span",{children:"閉じる"})]})]})]}),play:async({canvasElement:n,step:s})=>{const e=h(n),m=["ArrowUpIcon","RotateBackIcon","SparkleIcon","LightbulbIcon","CloseIcon"];await s("すべてのセッションアイコンを表示する",async()=>{for(const i of m)await t(e.getByTestId(i)).toBeVisible()}),await s("アイコン単体は装飾として読み上げとフォーカスから除外する",async()=>{for(const i of m){const p=e.getByTestId(i);await t(p).toHaveAttribute("aria-hidden","true"),await t(p).toHaveAttribute("focusable","false")}})}},c={name:"実用的なアイコンボタンと継承",render:function(){const[s,e]=B.useState("操作を選択してください");return a.jsxs("div",{className:"grid gap-5",children:[a.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[a.jsxs(r,{type:"button",variant:"primary",onClick:()=>e("物語を送信しました"),children:[a.jsx(I,{"data-testid":"send-icon"}),"送信"]}),a.jsxs(r,{type:"button",variant:"ghost",onClick:()=>e("直前のターンへ戻りました"),children:[a.jsx(l,{"data-testid":"undo-icon"}),"巻き戻す"]}),a.jsx(r,{type:"button",variant:"icon","aria-label":"ひらめきを生成",onClick:()=>e("ひらめきを生成しました"),children:a.jsx("span",{className:"text-myr-ruby",children:a.jsx(d,{className:"size-6","data-testid":"large-sparkle-icon"})})}),a.jsx(r,{type:"button",variant:"icon","aria-label":"ヒントを表示",onClick:()=>e("ヒントを表示しました"),children:a.jsx("span",{className:"text-myr-iris",children:a.jsx(k,{"data-testid":"hint-icon"})})}),a.jsx(r,{type:"button",variant:"icon","aria-label":"ダイアログを閉じる",onClick:()=>e("ダイアログを閉じました"),children:a.jsx(w,{"data-testid":"close-icon"})})]}),a.jsx(N,{children:a.jsxs(r,{type:"button",variant:"ghost",surface:"dark","aria-label":"暗い面で巻き戻す",children:[a.jsx(l,{"data-testid":"dark-undo-icon"}),"巻き戻す"]})}),a.jsx("output",{"aria-live":"polite",className:"text-sm font-bold text-myr-slate",children:s})]})},play:async({canvasElement:n,step:s})=>{const e=h(n);await s("ボタンがアイコンに代わる操作名を提供する",async()=>{await t(e.getByRole("button",{name:"ひらめきを生成"})).toHaveAccessibleName("ひらめきを生成"),await t(e.getByRole("button",{name:"ダイアログを閉じる"})).toHaveAccessibleName("ダイアログを閉じる")}),await s("サイズ変更と currentColor 継承を保持する",async()=>{await t(e.getByTestId("large-sparkle-icon")).toHaveClass("size-6","stroke-current"),await t(e.getByTestId("hint-icon")).toHaveClass("stroke-current"),await t(e.getByTestId("dark-undo-icon")).toHaveClass("stroke-current")}),await s("アイコンボタンのクリックを通知する",async()=>{await f.click(e.getByRole("button",{name:"ダイアログを閉じる"})),await t(e.getByText("ダイアログを閉じました")).toBeVisible()})}};var u,v,y;o.parameters={...o.parameters,docs:{...(u=o.parameters)==null?void 0:u.docs,source:{originalSource:`{
  name: '全アイコンと装飾用デフォルト',
  render: () => <div className="grid gap-5">
      <Label as="h1" textRole="section">セッションアイコン</Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4"><ArrowUpIcon data-testid="ArrowUpIcon" /><span>送信</span></div>
        <div className="flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4"><RotateBackIcon data-testid="RotateBackIcon" /><span>巻き戻す</span></div>
        <div className="flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4"><SparkleIcon data-testid="SparkleIcon" /><span>生成する</span></div>
        <div className="flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4"><LightbulbIcon data-testid="LightbulbIcon" /><span>提案を見る</span></div>
        <div className="flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4"><CloseIcon data-testid="CloseIcon" /><span>閉じる</span></div>
      </div>
    </div>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const names = ['ArrowUpIcon', 'RotateBackIcon', 'SparkleIcon', 'LightbulbIcon', 'CloseIcon'];
    await step('すべてのセッションアイコンを表示する', async () => {
      for (const name of names) await expect(canvas.getByTestId(name)).toBeVisible();
    });
    await step('アイコン単体は装飾として読み上げとフォーカスから除外する', async () => {
      for (const name of names) {
        const icon = canvas.getByTestId(name);
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
        await expect(icon).toHaveAttribute('focusable', 'false');
      }
    });
  }
}`,...(y=(v=o.parameters)==null?void 0:v.docs)==null?void 0:y.source}}};var g,x,b;c.parameters={...c.parameters,docs:{...(g=c.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: '実用的なアイコンボタンと継承',
  render: function Render() {
    const [message, setMessage] = useState('操作を選択してください');
    return <div className="grid gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="primary" onClick={() => setMessage('物語を送信しました')}>
            <ArrowUpIcon data-testid="send-icon" />
            送信
          </Button>
          <Button type="button" variant="ghost" onClick={() => setMessage('直前のターンへ戻りました')}>
            <RotateBackIcon data-testid="undo-icon" />
            巻き戻す
          </Button>
          <Button type="button" variant="icon" aria-label="ひらめきを生成" onClick={() => setMessage('ひらめきを生成しました')}>
            <span className="text-myr-ruby"><SparkleIcon className="size-6" data-testid="large-sparkle-icon" /></span>
          </Button>
          <Button type="button" variant="icon" aria-label="ヒントを表示" onClick={() => setMessage('ヒントを表示しました')}>
            <span className="text-myr-iris"><LightbulbIcon data-testid="hint-icon" /></span>
          </Button>
          <Button type="button" variant="icon" aria-label="ダイアログを閉じる" onClick={() => setMessage('ダイアログを閉じました')}>
            <CloseIcon data-testid="close-icon" />
          </Button>
        </div>
        <DarkPanel>
          <Button type="button" variant="ghost" surface="dark" aria-label="暗い面で巻き戻す">
            <RotateBackIcon data-testid="dark-undo-icon" />
            巻き戻す
          </Button>
        </DarkPanel>
        <output aria-live="polite" className="text-sm font-bold text-myr-slate">{message}</output>
      </div>;
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ボタンがアイコンに代わる操作名を提供する', async () => {
      await expect(canvas.getByRole('button', {
        name: 'ひらめきを生成'
      })).toHaveAccessibleName('ひらめきを生成');
      await expect(canvas.getByRole('button', {
        name: 'ダイアログを閉じる'
      })).toHaveAccessibleName('ダイアログを閉じる');
    });
    await step('サイズ変更と currentColor 継承を保持する', async () => {
      await expect(canvas.getByTestId('large-sparkle-icon')).toHaveClass('size-6', 'stroke-current');
      await expect(canvas.getByTestId('hint-icon')).toHaveClass('stroke-current');
      await expect(canvas.getByTestId('dark-undo-icon')).toHaveClass('stroke-current');
    });
    await step('アイコンボタンのクリックを通知する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'ダイアログを閉じる'
      }));
      await expect(canvas.getByText('ダイアログを閉じました')).toBeVisible();
    });
  }
}`,...(b=(x=c.parameters)==null?void 0:x.docs)==null?void 0:b.source}}};const T=["DecorativeDefaults","IconButtonsAndInheritance"];export{o as DecorativeDefaults,c as IconButtonsAndInheritance,T as __namedExportsOrder,L as default};
