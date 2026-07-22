import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{r as u}from"./index-D4H_InIO.js";import{w,u as l,e as n}from"./index-C4S39nCK.js";import{W as b,s as x,w as S,a as y,c as g}from"./scenarioWizardStyles-DJZsp9P6.js";/* empty css               */const k={title:"コンポーネント/WizardNavigation",parameters:{layout:"centered",notes:"ウィザード画面の左レールを共通化したコンポーネントです。狭い幅ではdetailsとして折りたたみ、縦積み時に本文を押し下げすぎないようにします。"},decorators:[t=>e.jsxs("div",{className:`${x} !min-h-[420px] !w-[min(980px,92vw)]`,children:[e.jsx(t,{}),e.jsxs("main",{className:S,"aria-label":"Story本文",children:[e.jsx("p",{className:y,children:"Wizard navigation sample"}),e.jsxs("div",{className:g,"aria-label":"サンプル進捗",children:[e.jsx("span",{children:"02"}),e.jsx("strong",{children:"本文領域"}),e.jsx("small",{children:"ナビゲーションの横に来る紙面です。"})]})]})]})]},h=[{id:"cover",label:"01 / 表紙",meta:"Draft保存のための最小入力",ariaLabel:"表紙へ"},{id:"lore",label:"02 / 世界の掟",meta:"ジャンル、雰囲気、Lore",ariaLabel:"世界の掟へ"},{id:"ai",label:"03 / AI裁量",meta:"AIが広げてよい範囲",ariaLabel:"AI裁量へ"},{id:"opening",label:"04 / 第一場面",meta:"最初のNarrativeの固定",ariaLabel:"第一場面へ"}],s={name:"Default — 左レールのウィザードナビ",render:function(){const[a,i]=u.useState("lore");return e.jsx(b,{title:"契約の背表紙",ariaLabel:"登録ウィザードのステップ",help:"ステップを選ぶと紙面側の入力内容が切り替わります。",items:h,activeId:a,onSelect:i,markerLabel:"ScenarioId",markerValue:"SCN-DRAFT-042"})},play:async({canvasElement:t})=>{const a=w(t);await l.click(a.getByRole("button",{name:"AI裁量へ"})),await n(a.getByRole("button",{name:"AI裁量へ"})).toHaveAttribute("aria-current","step")}},r={name:"Narrow — 縦積み時は折りたたみ",parameters:{viewport:{defaultViewport:"mobile1"}},decorators:[t=>e.jsxs("div",{className:`${x} !min-h-[420px] !w-[360px]`,children:[e.jsx(t,{}),e.jsxs("main",{className:S,"aria-label":"狭幅Story本文",children:[e.jsx("p",{className:y,children:"Compact layout"}),e.jsxs("div",{className:g,"aria-label":"狭幅進捗",children:[e.jsx("span",{children:"02"}),e.jsx("strong",{children:"本文を優先"}),e.jsx("small",{children:"ナビは必要な時だけ開きます。"})]})]})]})],render:function(){const[a,i]=u.useState("lore");return e.jsx(b,{title:"Session Flow",ariaLabel:"狭幅ウィザードのステップ",help:"狭い画面で開いたときだけステップ一覧を表示します。",items:h,activeId:a,onSelect:i,markerLabel:"SessionId",markerValue:"SES-READY-019"})},play:async({canvasElement:t})=>{const a=w(t);await n(a.getByText("Session Flow")).toBeVisible(),await l.click(a.getByText("Session Flow")),await l.click(a.getByRole("button",{name:"第一場面へ"})),await n(a.getByRole("button",{name:"第一場面へ"})).toHaveAttribute("aria-current","step")}};var o,c,m;s.parameters={...s.parameters,docs:{...(o=s.parameters)==null?void 0:o.docs,source:{originalSource:`{
  name: 'Default — 左レールのウィザードナビ',
  render: function Render() {
    const [active, setActive] = useState('lore');
    return <WizardNavigation title="契約の背表紙" ariaLabel="登録ウィザードのステップ" help="ステップを選ぶと紙面側の入力内容が切り替わります。" items={items} activeId={active} onSelect={setActive} markerLabel="ScenarioId" markerValue="SCN-DRAFT-042" />;
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: 'AI裁量へ'
    }));
    await expect(canvas.getByRole('button', {
      name: 'AI裁量へ'
    })).toHaveAttribute('aria-current', 'step');
  }
}`,...(m=(c=s.parameters)==null?void 0:c.docs)==null?void 0:m.source}}};var d,p,v;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
  name: 'Narrow — 縦積み時は折りたたみ',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
  decorators: [Story => <div className={\`\${scenarioWizardShellClass} !min-h-[420px] !w-[360px]\`}>
        <Story />
        <main className={wizardPaperClass} aria-label="狭幅Story本文">
          <p className={wizardKickerClass}>Compact layout</p>
          <div className={wizardProgressClass} aria-label="狭幅進捗">
            <span>02</span>
            <strong>本文を優先</strong>
            <small>ナビは必要な時だけ開きます。</small>
          </div>
        </main>
      </div>],
  render: function Render() {
    const [active, setActive] = useState('lore');
    return <WizardNavigation title="Session Flow" ariaLabel="狭幅ウィザードのステップ" help="狭い画面で開いたときだけステップ一覧を表示します。" items={items} activeId={active} onSelect={setActive} markerLabel="SessionId" markerValue="SES-READY-019" />;
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Session Flow')).toBeVisible();
    await userEvent.click(canvas.getByText('Session Flow'));
    await userEvent.click(canvas.getByRole('button', {
      name: '第一場面へ'
    }));
    await expect(canvas.getByRole('button', {
      name: '第一場面へ'
    })).toHaveAttribute('aria-current', 'step');
  }
}`,...(v=(p=r.parameters)==null?void 0:p.docs)==null?void 0:v.source}}};const E=["Default","NarrowCollapsed"];export{s as Default,r as NarrowCollapsed,E as __namedExportsOrder,k as default};
