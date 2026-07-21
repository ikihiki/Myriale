import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{r as c}from"./index-D4H_InIO.js";import{w as s,u as n,e as o}from"./index-DwFX8Wt9.js";import{B as r}from"./account-BfLs3ao6.js";import{M as $,a as ee,b as ae,c as te,d as L,e as O,f as q,g as z,h as G,i as W,j as K,k as _,l as d,m as U,n as J,o as Q,p as y}from"./MyrialeToggle-Cu4mkWU9.js";import{M as X,a as Y}from"./MyrialeMenu-FzkaUt8s.js";import"./index-DzKAYa42.js";const de={title:"コンポーネント/Myriale Radix primitives",parameters:{layout:"centered",notes:"Radix UI PrimitivesをMyriale専用ラッパー経由で導入した検証ギャラリーです。見た目は既存CSSの紙面・霧・iris/emberの雰囲気を維持し、挙動とアクセシビリティだけをRadixに委ねます。"},decorators:[i=>e.jsx("div",{className:"account-kit",style:{minHeight:"auto",padding:28,width:"min(820px, 92vw)"},children:e.jsx("div",{className:"reg-card",style:{padding:28,overflow:"visible"},children:e.jsx(i,{})})})]},p={name:"Dialog / Select / Tabs / Menu — 雰囲気を保つRadix導入サンプル",render:function(){const[a,t]=c.useState("mist"),[l,m]=c.useState("未選択");return e.jsxs("div",{style:{display:"grid",gap:22},children:[e.jsxs("header",{children:[e.jsx("p",{className:"kicker",children:"Radix pilot"}),e.jsx("h1",{style:{margin:0,fontFamily:"Georgia, serif",letterSpacing:"-0.04em"},children:"霧の紙片を崩さず、振る舞いだけを借りる"}),e.jsx("p",{className:"section-lead",children:"Dialog、Select、Tabs、Dropdown MenuをMyrialeの薄いラッパーから利用します。画面側はRadixへ直接依存しない想定です。"})]}),e.jsxs("div",{className:"button-row",children:[e.jsxs(L,{children:[e.jsx(O,{asChild:!0,children:e.jsx(r,{variant:"primary",children:"契約書プレビューを開く"})}),e.jsx(q,{title:"契約書プレビュー",description:"DialogのフォーカストラップとEscapeでの閉じる挙動をRadixに任せ、紙面の装いはMyriale側で保ちます。",footer:e.jsx(z,{asChild:!0,children:e.jsx(r,{variant:"primary",children:"確認して閉じる"})}),children:e.jsxs("div",{className:"myr-ui-note-card",children:[e.jsx("p",{children:"語り手: 霧の向こうに旧駅舎が浮かび上がる。"}),e.jsx("p",{children:"次の入力で、プレイヤーは灯りを掲げるか、手帳を開くかを選ぶ。"})]})})]}),e.jsxs(G,{children:[e.jsx(W,{asChild:!0,children:e.jsx(r,{variant:"ghost",children:"導入メモ"})}),e.jsx(K,{children:e.jsx("p",{style:{margin:0,lineHeight:1.6},children:"既存CSSのtokenを優先し、Radixのglobal resetやテーマは使いません。"})})]}),e.jsxs(X,{children:[e.jsx(Y,{asChild:!0,children:e.jsx(r,{variant:"ghost",children:"アカウント操作"})}),e.jsxs(_,{"aria-label":"アカウント操作",children:[e.jsx(d,{onSelect:()=>m("プロフィールを開く"),children:"プロフィールを開く"}),e.jsx(d,{onSelect:()=>m("通知設定"),children:"通知設定"}),e.jsx(d,{onSelect:()=>m("ログアウト"),children:"ログアウト"})]})]})]}),e.jsx(U,{label:"語り口の濃度",value:a,onValueChange:t,options:[{value:"mist",label:"薄霧",description:"余白を残す静かな描写"},{value:"iris",label:"菫",description:"幻想味を少し強める"},{value:"ember",label:"熾火",description:"緊張感を前面に出す"}],help:"Radix Selectを使っても、既存の丸み・紙面色・irisアクセントを維持します。",testId:"tone-select"}),e.jsxs(J,{defaultValue:"policy",children:[e.jsx(Q,{ariaLabel:"導入方針",items:[{value:"policy",label:"方針"},{value:"tokens",label:"トークン"},{value:"checks",label:"検証"}]}),e.jsx(y,{value:"policy",className:"myr-ui-note-card",style:{marginTop:12},children:"画面単位ではなく、Dialog/Select/Menuなどの部品単位で段階移行します。"}),e.jsx(y,{value:"tokens",className:"myr-ui-note-card",style:{marginTop:12},children:"`--void`, `--paper`, `--vellum`, `--iris`, `--ember` をMyriale側のtokenとして保持します。"}),e.jsx(y,{value:"checks",className:"myr-ui-note-card",style:{marginTop:12},children:"Storybook play、キーボード操作、フォーカス表示、既存CSSとの衝突を確認します。"})]}),e.jsxs("p",{className:"field-help","data-testid":"pilot-state",children:["選択中: ",a," / メニュー: ",l]})]})},play:async({canvasElement:i,step:a})=>{const t=s(i),l=s(i.ownerDocument.body);await a("Dialogを開いて内容を確認し、閉じられる",async()=>{await n.click(t.getByRole("button",{name:"契約書プレビューを開く"})),await o(l.getByRole("dialog",{name:"契約書プレビュー"})).toBeVisible(),await n.click(l.getByRole("button",{name:"確認して閉じる"})),await o(l.queryByRole("dialog",{name:"契約書プレビュー"})).not.toBeInTheDocument()}),await a("Selectで語り口を変更できる",async()=>{await n.click(t.getByTestId("tone-select")),await n.click(l.getByRole("option",{name:/熾火/})),await o(t.getByTestId("pilot-state")).toHaveTextContent("ember")}),await a("Tabsで表示を切り替えられる",async()=>{await n.click(t.getByRole("tab",{name:"検証"})),await o(t.getByText(/Storybook play/)).toBeVisible()}),await a("Menuの選択結果を反映できる",async()=>{await n.click(t.getByRole("button",{name:"アカウント操作"})),await n.click(l.getByRole("menuitem",{name:"通知設定"})),await o(t.getByTestId("pilot-state")).toHaveTextContent("通知設定")})}},g={name:"Dialog — 契約書モーダル",render:()=>e.jsxs(L,{children:[e.jsx(O,{asChild:!0,children:e.jsx(r,{variant:"primary",children:"Dialogを開く"})}),e.jsx(q,{title:"契約書の確認",description:"フォーカストラップ、Escape、閉じる操作をRadixに任せるMyriale Dialogです。",footer:e.jsx(z,{asChild:!0,children:e.jsx(r,{variant:"primary",children:"閉じる"})}),children:e.jsx("div",{className:"myr-ui-note-card",children:e.jsx("p",{children:"この紙片はMyrialeのDialogプリミティブとして再利用できます。"})})})]}),play:async({canvasElement:i})=>{const a=s(i),t=s(i.ownerDocument.body);await n.click(a.getByRole("button",{name:"Dialogを開く"})),await o(t.getByRole("dialog",{name:"契約書の確認"})).toBeVisible(),await n.click(t.getByRole("button",{name:"閉じる"})),await o(t.queryByRole("dialog",{name:"契約書の確認"})).not.toBeInTheDocument()}},v={name:"Select — 紙面に馴染む選択欄",render:function(){const[a,t]=c.useState("mist");return e.jsxs("div",{style:{maxWidth:420},children:[e.jsx(U,{label:"語り口",value:a,onValueChange:t,options:[{value:"mist",label:"薄霧",description:"余白と静けさを残す"},{value:"iris",label:"菫",description:"幻想味を強める"},{value:"ember",label:"熾火",description:"緊張感を強める"}],help:"AccountKitのSelectFieldもこのプリミティブを使います。",testId:"component-select"}),e.jsxs("p",{className:"field-help","data-testid":"component-select-value",children:["選択中: ",a]})]})},play:async({canvasElement:i})=>{const a=s(i),t=s(i.ownerDocument.body);await n.click(a.getByRole("combobox",{name:"語り口"})),await n.click(await t.findByRole("option",{name:/熾火/})),await o(a.getByTestId("component-select-value")).toHaveTextContent("ember")}},h={name:"Tabs — 方針を切り替える紙片",render:()=>e.jsxs(J,{defaultValue:"overview",children:[e.jsx(Q,{ariaLabel:"Radix導入メモ",items:[{value:"overview",label:"概要"},{value:"tokens",label:"トークン"},{value:"testing",label:"検証"}]}),e.jsx(y,{value:"overview",className:"myr-ui-note-card",style:{marginTop:12},children:"Radixは挙動を受け持ち、Myriale側が見た目を受け持ちます。"}),e.jsx(y,{value:"tokens",className:"myr-ui-note-card",style:{marginTop:12},children:"`--paper`, `--vellum`, `--iris`, `--ember` を中心に既存の空気を保ちます。"}),e.jsx(y,{value:"testing",className:"myr-ui-note-card",style:{marginTop:12},children:"Storybook playとVitestでキーボード/role/表示を確認します。"})]}),play:async({canvasElement:i})=>{const a=s(i);await n.click(a.getByRole("tab",{name:"検証"})),await o(a.getByText(/Storybook play/)).toBeVisible()}},b={name:"Popover / Menu — 小さな補助面と操作メニュー",render:function(){const[a,t]=c.useState("未選択");return e.jsxs("div",{style:{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"},children:[e.jsxs(G,{children:[e.jsx(W,{asChild:!0,children:e.jsx(r,{variant:"ghost",children:"Popoverを開く"})}),e.jsx(K,{children:e.jsx("p",{style:{margin:0,lineHeight:1.6},children:"補足説明や軽いヘルプを紙片として表示します。"})})]}),e.jsxs(X,{children:[e.jsx(Y,{asChild:!0,children:e.jsx(r,{variant:"ghost",children:"Menuを開く"})}),e.jsxs(_,{"aria-label":"コンポーネントメニュー",children:[e.jsx(d,{onSelect:()=>t("保存"),children:"保存"}),e.jsx(d,{onSelect:()=>t("複製"),children:"複製"}),e.jsx(d,{onSelect:()=>t("削除"),children:"削除"})]})]}),e.jsxs("span",{className:"field-help","data-testid":"component-menu-choice",children:["選択: ",a]})]})},play:async({canvasElement:i})=>{const a=s(i),t=s(i.ownerDocument.body);await n.click(a.getByRole("button",{name:"Popoverを開く"})),await o(t.getByText("補足説明や軽いヘルプを紙片として表示します。")).toBeVisible(),await n.click(a.getByRole("button",{name:"Menuを開く"})),await n.click(t.getByRole("menuitem",{name:"複製"})),await o(a.getByTestId("component-menu-choice")).toHaveTextContent("複製")}},M={name:"Checkbox / Radio / Toggle / Progress — 入力状態もRadixへ",render:function(){const[a,t]=c.useState(!0),[l,m]=c.useState("erase"),[u,Z]=c.useState(!1),x=a?3:2;return e.jsxs("div",{style:{display:"grid",gap:18},children:[e.jsx($,{label:"ノート更新を通知する","aria-label":"ノート更新を通知する",checked:a,onCheckedChange:t}),e.jsx(ee,{label:"データの取り扱い方針",value:l,onValueChange:m,options:[{value:"erase",label:"完全削除する"},{value:"anonymize",label:"匿名化して保持する"}]}),e.jsx(ae,{pressed:u,onPressedChange:Z,"aria-label":"秘密メモの表示",children:u?"秘密メモを隠す":"秘密メモを表示"}),u&&e.jsx("p",{className:"field-help",children:"霧の奥にだけ見える補足メモです。"}),e.jsxs("div",{children:[e.jsxs("p",{className:"field-help",style:{marginTop:0},children:["準備度: ",x," / 3"]}),e.jsx(te,{value:x,max:3,"aria-label":"準備度"})]}),e.jsxs("span",{className:"field-help","data-testid":"component-form-state",children:["通知: ",a?"ON":"OFF"," / 方針: ",l," / メモ: ",u?"表示":"非表示"]})]})},play:async({canvasElement:i})=>{const a=s(i);await n.click(a.getByRole("checkbox",{name:"ノート更新を通知する"})),await n.click(a.getByRole("radio",{name:"匿名化して保持する"})),await n.click(a.getByRole("button",{name:"秘密メモの表示"})),await o(a.getByText("霧の奥にだけ見える補足メモです。")).toBeVisible(),await o(a.getByTestId("component-form-state")).toHaveTextContent("通知: OFF"),await o(a.getByTestId("component-form-state")).toHaveTextContent("方針: anonymize"),await o(a.getByRole("progressbar",{name:"準備度"})).toHaveAttribute("aria-valuenow","2")}};var w,T,C;p.parameters={...p.parameters,docs:{...(w=p.parameters)==null?void 0:w.docs,source:{originalSource:`{
  name: 'Dialog / Select / Tabs / Menu — 雰囲気を保つRadix導入サンプル',
  render: function Render() {
    const [tone, setTone] = useState('mist');
    const [menuChoice, setMenuChoice] = useState('未選択');
    return <div style={{
      display: 'grid',
      gap: 22
    }}>
        <header>
          <p className="kicker">Radix pilot</p>
          <h1 style={{
          margin: 0,
          fontFamily: 'Georgia, serif',
          letterSpacing: '-0.04em'
        }}>
            霧の紙片を崩さず、振る舞いだけを借りる
          </h1>
          <p className="section-lead">
            Dialog、Select、Tabs、Dropdown MenuをMyrialeの薄いラッパーから利用します。画面側はRadixへ直接依存しない想定です。
          </p>
        </header>

        <div className="button-row">
          <MyrialeDialogRoot>
            <MyrialeDialogTrigger asChild>
              <Button variant="primary">契約書プレビューを開く</Button>
            </MyrialeDialogTrigger>
            <MyrialeDialogContent title="契約書プレビュー" description="DialogのフォーカストラップとEscapeでの閉じる挙動をRadixに任せ、紙面の装いはMyriale側で保ちます。" footer={<MyrialeDialogClose asChild>
                  <Button variant="primary">確認して閉じる</Button>
                </MyrialeDialogClose>}>
              <div className="myr-ui-note-card">
                <p>語り手: 霧の向こうに旧駅舎が浮かび上がる。</p>
                <p>次の入力で、プレイヤーは灯りを掲げるか、手帳を開くかを選ぶ。</p>
              </div>
            </MyrialeDialogContent>
          </MyrialeDialogRoot>

          <MyrialePopoverRoot>
            <MyrialePopoverTrigger asChild>
              <Button variant="ghost">導入メモ</Button>
            </MyrialePopoverTrigger>
            <MyrialePopoverContent>
              <p style={{
              margin: 0,
              lineHeight: 1.6
            }}>
                既存CSSのtokenを優先し、Radixのglobal resetやテーマは使いません。
              </p>
            </MyrialePopoverContent>
          </MyrialePopoverRoot>

          <MyrialeMenuRoot>
            <MyrialeMenuTrigger asChild>
              <Button variant="ghost">アカウント操作</Button>
            </MyrialeMenuTrigger>
            <MyrialeMenuContent aria-label="アカウント操作">
              <MyrialeMenuItem onSelect={() => setMenuChoice('プロフィールを開く')}>プロフィールを開く</MyrialeMenuItem>
              <MyrialeMenuItem onSelect={() => setMenuChoice('通知設定')}>通知設定</MyrialeMenuItem>
              <MyrialeMenuItem onSelect={() => setMenuChoice('ログアウト')}>ログアウト</MyrialeMenuItem>
            </MyrialeMenuContent>
          </MyrialeMenuRoot>
        </div>

        <MyrialeSelect label="語り口の濃度" value={tone} onValueChange={setTone} options={[{
        value: 'mist',
        label: '薄霧',
        description: '余白を残す静かな描写'
      }, {
        value: 'iris',
        label: '菫',
        description: '幻想味を少し強める'
      }, {
        value: 'ember',
        label: '熾火',
        description: '緊張感を前面に出す'
      }]} help="Radix Selectを使っても、既存の丸み・紙面色・irisアクセントを維持します。" testId="tone-select" />

        <MyrialeTabsRoot defaultValue="policy">
          <MyrialeTabsList ariaLabel="導入方針" items={[{
          value: 'policy',
          label: '方針'
        }, {
          value: 'tokens',
          label: 'トークン'
        }, {
          value: 'checks',
          label: '検証'
        }]} />
          <MyrialeTabsContent value="policy" className="myr-ui-note-card" style={{
          marginTop: 12
        }}>
            画面単位ではなく、Dialog/Select/Menuなどの部品単位で段階移行します。
          </MyrialeTabsContent>
          <MyrialeTabsContent value="tokens" className="myr-ui-note-card" style={{
          marginTop: 12
        }}>
            \`--void\`, \`--paper\`, \`--vellum\`, \`--iris\`, \`--ember\` をMyriale側のtokenとして保持します。
          </MyrialeTabsContent>
          <MyrialeTabsContent value="checks" className="myr-ui-note-card" style={{
          marginTop: 12
        }}>
            Storybook play、キーボード操作、フォーカス表示、既存CSSとの衝突を確認します。
          </MyrialeTabsContent>
        </MyrialeTabsRoot>

        <p className="field-help" data-testid="pilot-state">
          選択中: {tone} / メニュー: {menuChoice}
        </p>
      </div>;
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('Dialogを開いて内容を確認し、閉じられる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '契約書プレビューを開く'
      }));
      await expect(screen.getByRole('dialog', {
        name: '契約書プレビュー'
      })).toBeVisible();
      await userEvent.click(screen.getByRole('button', {
        name: '確認して閉じる'
      }));
      await expect(screen.queryByRole('dialog', {
        name: '契約書プレビュー'
      })).not.toBeInTheDocument();
    });
    await step('Selectで語り口を変更できる', async () => {
      await userEvent.click(canvas.getByTestId('tone-select'));
      await userEvent.click(screen.getByRole('option', {
        name: /熾火/
      }));
      await expect(canvas.getByTestId('pilot-state')).toHaveTextContent('ember');
    });
    await step('Tabsで表示を切り替えられる', async () => {
      await userEvent.click(canvas.getByRole('tab', {
        name: '検証'
      }));
      await expect(canvas.getByText(/Storybook play/)).toBeVisible();
    });
    await step('Menuの選択結果を反映できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'アカウント操作'
      }));
      await userEvent.click(screen.getByRole('menuitem', {
        name: '通知設定'
      }));
      await expect(canvas.getByTestId('pilot-state')).toHaveTextContent('通知設定');
    });
  }
}`,...(C=(T=p.parameters)==null?void 0:T.docs)==null?void 0:C.source}}};var R,B,j;g.parameters={...g.parameters,docs:{...(R=g.parameters)==null?void 0:R.docs,source:{originalSource:`{
  name: 'Dialog — 契約書モーダル',
  render: () => <MyrialeDialogRoot>
      <MyrialeDialogTrigger asChild>
        <Button variant="primary">Dialogを開く</Button>
      </MyrialeDialogTrigger>
      <MyrialeDialogContent title="契約書の確認" description="フォーカストラップ、Escape、閉じる操作をRadixに任せるMyriale Dialogです。" footer={<MyrialeDialogClose asChild>
            <Button variant="primary">閉じる</Button>
          </MyrialeDialogClose>}>
        <div className="myr-ui-note-card">
          <p>この紙片はMyrialeのDialogプリミティブとして再利用できます。</p>
        </div>
      </MyrialeDialogContent>
    </MyrialeDialogRoot>,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', {
      name: 'Dialogを開く'
    }));
    await expect(screen.getByRole('dialog', {
      name: '契約書の確認'
    })).toBeVisible();
    await userEvent.click(screen.getByRole('button', {
      name: '閉じる'
    }));
    await expect(screen.queryByRole('dialog', {
      name: '契約書の確認'
    })).not.toBeInTheDocument();
  }
}`,...(j=(B=g.parameters)==null?void 0:B.docs)==null?void 0:j.source}}};var k,S,D;v.parameters={...v.parameters,docs:{...(k=v.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: 'Select — 紙面に馴染む選択欄',
  render: function Render() {
    const [value, setValue] = useState('mist');
    return <div style={{
      maxWidth: 420
    }}>
        <MyrialeSelect label="語り口" value={value} onValueChange={setValue} options={[{
        value: 'mist',
        label: '薄霧',
        description: '余白と静けさを残す'
      }, {
        value: 'iris',
        label: '菫',
        description: '幻想味を強める'
      }, {
        value: 'ember',
        label: '熾火',
        description: '緊張感を強める'
      }]} help="AccountKitのSelectFieldもこのプリミティブを使います。" testId="component-select" />
        <p className="field-help" data-testid="component-select-value">選択中: {value}</p>
      </div>;
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('combobox', {
      name: '語り口'
    }));
    await userEvent.click(await screen.findByRole('option', {
      name: /熾火/
    }));
    await expect(canvas.getByTestId('component-select-value')).toHaveTextContent('ember');
  }
}`,...(D=(S=v.parameters)==null?void 0:S.docs)==null?void 0:D.source}}};var f,N,E;h.parameters={...h.parameters,docs:{...(f=h.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: 'Tabs — 方針を切り替える紙片',
  render: () => <MyrialeTabsRoot defaultValue="overview">
      <MyrialeTabsList ariaLabel="Radix導入メモ" items={[{
      value: 'overview',
      label: '概要'
    }, {
      value: 'tokens',
      label: 'トークン'
    }, {
      value: 'testing',
      label: '検証'
    }]} />
      <MyrialeTabsContent value="overview" className="myr-ui-note-card" style={{
      marginTop: 12
    }}>
        Radixは挙動を受け持ち、Myriale側が見た目を受け持ちます。
      </MyrialeTabsContent>
      <MyrialeTabsContent value="tokens" className="myr-ui-note-card" style={{
      marginTop: 12
    }}>
        \`--paper\`, \`--vellum\`, \`--iris\`, \`--ember\` を中心に既存の空気を保ちます。
      </MyrialeTabsContent>
      <MyrialeTabsContent value="testing" className="myr-ui-note-card" style={{
      marginTop: 12
    }}>
        Storybook playとVitestでキーボード/role/表示を確認します。
      </MyrialeTabsContent>
    </MyrialeTabsRoot>,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', {
      name: '検証'
    }));
    await expect(canvas.getByText(/Storybook play/)).toBeVisible();
  }
}`,...(E=(N=h.parameters)==null?void 0:N.docs)==null?void 0:E.source}}};var I,P,V;b.parameters={...b.parameters,docs:{...(I=b.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: 'Popover / Menu — 小さな補助面と操作メニュー',
  render: function Render() {
    const [choice, setChoice] = useState('未選択');
    return <div style={{
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
        <MyrialePopoverRoot>
          <MyrialePopoverTrigger asChild>
            <Button variant="ghost">Popoverを開く</Button>
          </MyrialePopoverTrigger>
          <MyrialePopoverContent>
            <p style={{
            margin: 0,
            lineHeight: 1.6
          }}>補足説明や軽いヘルプを紙片として表示します。</p>
          </MyrialePopoverContent>
        </MyrialePopoverRoot>

        <MyrialeMenuRoot>
          <MyrialeMenuTrigger asChild>
            <Button variant="ghost">Menuを開く</Button>
          </MyrialeMenuTrigger>
          <MyrialeMenuContent aria-label="コンポーネントメニュー">
            <MyrialeMenuItem onSelect={() => setChoice('保存')}>保存</MyrialeMenuItem>
            <MyrialeMenuItem onSelect={() => setChoice('複製')}>複製</MyrialeMenuItem>
            <MyrialeMenuItem onSelect={() => setChoice('削除')}>削除</MyrialeMenuItem>
          </MyrialeMenuContent>
        </MyrialeMenuRoot>

        <span className="field-help" data-testid="component-menu-choice">選択: {choice}</span>
      </div>;
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', {
      name: 'Popoverを開く'
    }));
    await expect(screen.getByText('補足説明や軽いヘルプを紙片として表示します。')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', {
      name: 'Menuを開く'
    }));
    await userEvent.click(screen.getByRole('menuitem', {
      name: '複製'
    }));
    await expect(canvas.getByTestId('component-menu-choice')).toHaveTextContent('複製');
  }
}`,...(V=(P=b.parameters)==null?void 0:P.docs)==null?void 0:V.source}}};var H,F,A;M.parameters={...M.parameters,docs:{...(H=M.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: 'Checkbox / Radio / Toggle / Progress — 入力状態もRadixへ',
  render: function Render() {
    const [notes, setNotes] = useState(true);
    const [policy, setPolicy] = useState('erase');
    const [visible, setVisible] = useState(false);
    const progress = notes ? 3 : 2;
    return <div style={{
      display: 'grid',
      gap: 18
    }}>
        <MyrialeCheckbox label="ノート更新を通知する" aria-label="ノート更新を通知する" checked={notes} onCheckedChange={setNotes} />
        <MyrialeRadioGroup label="データの取り扱い方針" value={policy} onValueChange={setPolicy} options={[{
        value: 'erase',
        label: '完全削除する'
      }, {
        value: 'anonymize',
        label: '匿名化して保持する'
      }]} />
        <MyrialeToggle pressed={visible} onPressedChange={setVisible} aria-label="秘密メモの表示">
          {visible ? '秘密メモを隠す' : '秘密メモを表示'}
        </MyrialeToggle>
        {visible && <p className="field-help">霧の奥にだけ見える補足メモです。</p>}
        <div>
          <p className="field-help" style={{
          marginTop: 0
        }}>準備度: {progress} / 3</p>
          <MyrialeProgress value={progress} max={3} aria-label="準備度" />
        </div>
        <span className="field-help" data-testid="component-form-state">
          通知: {notes ? 'ON' : 'OFF'} / 方針: {policy} / メモ: {visible ? '表示' : '非表示'}
        </span>
      </div>;
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('checkbox', {
      name: 'ノート更新を通知する'
    }));
    await userEvent.click(canvas.getByRole('radio', {
      name: '匿名化して保持する'
    }));
    await userEvent.click(canvas.getByRole('button', {
      name: '秘密メモの表示'
    }));
    await expect(canvas.getByText('霧の奥にだけ見える補足メモです。')).toBeVisible();
    await expect(canvas.getByTestId('component-form-state')).toHaveTextContent('通知: OFF');
    await expect(canvas.getByTestId('component-form-state')).toHaveTextContent('方針: anonymize');
    await expect(canvas.getByRole('progressbar', {
      name: '準備度'
    })).toHaveAttribute('aria-valuenow', '2');
  }
}`,...(A=(F=M.parameters)==null?void 0:F.docs)==null?void 0:A.source}}};const ye=["DialogSelectTabsAndMenu","DialogComponent","SelectComponent","TabsComponent","PopoverAndMenuComponents","CheckboxRadioToggleAndProgressComponents"];export{M as CheckboxRadioToggleAndProgressComponents,g as DialogComponent,p as DialogSelectTabsAndMenu,b as PopoverAndMenuComponents,v as SelectComponent,h as TabsComponent,ye as __namedExportsOrder,de as default};
