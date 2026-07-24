import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{r as u}from"./index-D4H_InIO.js";import{w as s,u as i,e as o}from"./index-C4S39nCK.js";import{b as J,a as d,L as ne}from"./Surfaces-xpIMDkG0.js";import{B as g}from"./account-BWNsQhIt.js";import{M as le,a as se,b as re,c as ce,d as y,e as m,f as p,g as v,h as Q,i as X,j as Y,k as Z,l as h,m as ee,n as ae,o as te,p as b}from"./MyrialeToggle-CqDS5xl9.js";import{M as ie,a as oe}from"./MyrialeMenu-BTf3rYTM.js";import"./navigationRecipes-DkSbwkz5.js";import"./index-BIT3Y9dO.js";import"./index-DzKAYa42.js";const we={title:"コンポーネント/Myriale Radix primitives",parameters:{layout:"centered",notes:"Radix UI PrimitivesをMyriale専用ラッパー経由で導入した検証ギャラリーです。見た目は既存CSSの紙面・霧・iris/emberの雰囲気を維持し、挙動とアクセシビリティだけをRadixに委ねます。"},decorators:[n=>e.jsx("div",{className:"account-kit",style:{minHeight:"auto",padding:28,width:"min(820px, 92vw)"},children:e.jsx("div",{className:"reg-card",style:{padding:28,overflow:"visible"},children:e.jsx(n,{})})})]},w={name:"Dialog / Select / Tabs / Menu — 雰囲気を保つRadix導入サンプル",render:function(){const[a,t]=u.useState("mist"),[l,r]=u.useState("未選択");return e.jsxs("div",{style:{display:"grid",gap:22},children:[e.jsxs("header",{children:[e.jsx(ne,{as:"p",textRole:"eyebrow",className:"mb-2",children:"Radix pilot"}),e.jsx("h1",{style:{margin:0,fontFamily:"Georgia, serif",letterSpacing:"-0.04em"},children:"霧の紙片を崩さず、振る舞いだけを借りる"}),e.jsx("p",{className:"section-lead",children:"Dialog、Select、Tabs、Dropdown MenuをMyrialeの薄いラッパーから利用します。画面側はRadixへ直接依存しない想定です。"})]}),e.jsxs("div",{className:J,children:[e.jsxs(y,{children:[e.jsx(m,{asChild:!0,children:e.jsx(g,{variant:"primary",children:"契約書プレビューを開く"})}),e.jsx(p,{title:"契約書プレビュー",description:"DialogのフォーカストラップとEscapeでの閉じる挙動をRadixに任せ、紙面の装いはMyriale側で保ちます。",footer:e.jsx(v,{asChild:!0,children:e.jsx(g,{variant:"primary",children:"確認して閉じる"})}),children:e.jsxs("div",{className:"myr-ui-note-card",children:[e.jsx("p",{children:"語り手: 霧の向こうに旧駅舎が浮かび上がる。"}),e.jsx("p",{children:"次の入力で、プレイヤーは灯りを掲げるか、手帳を開くかを選ぶ。"})]})})]}),e.jsxs(Q,{children:[e.jsx(X,{asChild:!0,children:e.jsx(g,{variant:"ghost",children:"導入メモ"})}),e.jsx(Y,{children:e.jsx("p",{style:{margin:0,lineHeight:1.6},children:"既存CSSのtokenを優先し、Radixのglobal resetやテーマは使いません。"})})]}),e.jsxs(ie,{children:[e.jsx(oe,{asChild:!0,children:e.jsx(g,{variant:"ghost",children:"アカウント操作"})}),e.jsxs(Z,{"aria-label":"アカウント操作",children:[e.jsx(h,{onSelect:()=>r("プロフィールを開く"),children:"プロフィールを開く"}),e.jsx(h,{onSelect:()=>r("通知設定"),children:"通知設定"}),e.jsx(h,{onSelect:()=>r("ログアウト"),children:"ログアウト"})]})]})]}),e.jsx(ee,{label:"語り口の濃度",value:a,onValueChange:t,options:[{value:"mist",label:"薄霧",description:"余白を残す静かな描写"},{value:"iris",label:"菫",description:"幻想味を少し強める"},{value:"ember",label:"熾火",description:"緊張感を前面に出す"}],help:"Radix Selectを使っても、既存の丸み・紙面色・irisアクセントを維持します。",testId:"tone-select"}),e.jsxs(ae,{defaultValue:"policy",children:[e.jsx(te,{ariaLabel:"導入方針",items:[{value:"policy",label:"方針"},{value:"tokens",label:"トークン"},{value:"checks",label:"検証"}]}),e.jsx(b,{value:"policy",className:"myr-ui-note-card",style:{marginTop:12},children:"画面単位ではなく、Dialog/Select/Menuなどの部品単位で段階移行します。"}),e.jsx(b,{value:"tokens",className:"myr-ui-note-card",style:{marginTop:12},children:"`--void`, `--paper`, `--vellum`, `--iris`, `--ember` をMyriale側のtokenとして保持します。"}),e.jsx(b,{value:"checks",className:"myr-ui-note-card",style:{marginTop:12},children:"Storybook play、キーボード操作、フォーカス表示、既存CSSとの衝突を確認します。"})]}),e.jsxs("p",{className:"field-help","data-testid":"pilot-state",children:["選択中: ",a," / メニュー: ",l]})]})},play:async({canvasElement:n,step:a})=>{const t=s(n),l=s(n.ownerDocument.body);await a("Dialogを開いて内容を確認し、閉じられる",async()=>{await i.click(t.getByRole("button",{name:"契約書プレビューを開く"})),await o(l.getByRole("dialog",{name:"契約書プレビュー"})).toBeVisible(),await i.click(l.getByRole("button",{name:"確認して閉じる"})),await o(l.queryByRole("dialog",{name:"契約書プレビュー"})).not.toBeInTheDocument()}),await a("Selectで語り口を変更できる",async()=>{await i.click(t.getByTestId("tone-select")),await i.click(l.getByRole("option",{name:/熾火/})),await o(t.getByTestId("pilot-state")).toHaveTextContent("ember")}),await a("Tabsで表示を切り替えられる",async()=>{await i.click(t.getByRole("tab",{name:"検証"})),await o(t.getByText(/Storybook play/)).toBeVisible()}),await a("Menuの選択結果を反映できる",async()=>{await i.click(t.getByRole("button",{name:"アカウント操作"})),await i.click(l.getByRole("menuitem",{name:"通知設定"})),await o(t.getByTestId("pilot-state")).toHaveTextContent("通知設定")})}},M={name:"Dialog — 契約書モーダル",render:()=>e.jsxs(y,{children:[e.jsx(m,{asChild:!0,children:e.jsx(g,{variant:"primary",children:"Dialogを開く"})}),e.jsx(p,{title:"契約書の確認",description:"フォーカストラップ、Escape、閉じる操作をRadixに任せるMyriale Dialogです。",footer:e.jsx(v,{asChild:!0,children:e.jsx(g,{variant:"primary",children:"閉じる"})}),children:e.jsx("div",{className:"myr-ui-note-card",children:e.jsx("p",{children:"この紙片はMyrialeのDialogプリミティブとして再利用できます。"})})})]}),play:async({canvasElement:n})=>{const a=s(n),t=s(n.ownerDocument.body);await i.click(a.getByRole("button",{name:"Dialogを開く"})),await o(t.getByRole("dialog",{name:"契約書の確認"})).toBeVisible(),await i.click(t.getByRole("button",{name:"閉じる"})),await o(t.queryByRole("dialog",{name:"契約書の確認"})).not.toBeInTheDocument()}},B={name:"Dialog — size / tone / footer roles",render:()=>e.jsxs("div",{className:"grid gap-4",children:[e.jsx("p",{className:"section-lead",children:"default 540px、wide 620px、editor 760pxとwarning toneを同じDialog APIで確認します。"}),e.jsxs("div",{className:J,children:[e.jsxs(y,{children:[e.jsx(m,{asChild:!0,children:e.jsx(d,{variant:"ghost",children:"Defaultを開く"})}),e.jsx(p,{title:"Default dialog",description:"標準確認に使う540pxのDialogです。",footer:e.jsx(v,{asChild:!0,children:e.jsx(d,{variant:"primary",children:"Defaultを完了"})}),children:e.jsx("input",{"aria-label":"Defaultの入力",defaultValue:"霧の契約"})})]}),e.jsxs(y,{children:[e.jsx(m,{asChild:!0,children:e.jsx(d,{variant:"ghost",children:"Wideを開く"})}),e.jsx(p,{title:"Wide dialog",description:"開始前レビューに使う620pxのDialogです。",size:"wide",footer:e.jsx(v,{asChild:!0,children:e.jsx(d,{variant:"primary",children:"Wideを完了"})}),children:e.jsx("div",{className:"myr-ui-note-card",children:"Scenarioと主人公のサマリーを横にゆとりを持って表示します。"})})]}),e.jsxs(y,{children:[e.jsx(m,{asChild:!0,children:e.jsx(d,{variant:"ghost",children:"Editorを開く"})}),e.jsxs(p,{title:"Editor dialog",description:"複雑なフォームや表を維持する760pxのDialogです。",size:"editor",bodyClassName:"grid grid-cols-2 gap-3 max-sm:grid-cols-1",footer:e.jsxs(e.Fragment,{children:[e.jsx(d,{variant:"ghost",children:"下書き"}),e.jsx(v,{asChild:!0,children:e.jsx(d,{variant:"primary",children:"Editorを保存"})})]}),children:[e.jsxs("label",{className:"grid gap-1",children:["人物名",e.jsx("input",{"aria-label":"Editorの人物名",defaultValue:"月読ミナト"})]}),e.jsxs("label",{className:"grid gap-1",children:["役割",e.jsx("input",{"aria-label":"Editorの役割",defaultValue:"案内人"})]})]})]}),e.jsxs(y,{children:[e.jsx(m,{asChild:!0,children:e.jsx(d,{variant:"danger",children:"Warningを開く"})}),e.jsx(p,{title:"Warning dialog",description:"取り消せない操作を明確に区別します。",tone:"warning",footer:e.jsxs(e.Fragment,{children:[e.jsx(d,{variant:"danger",children:"破棄を確定"}),e.jsx(v,{asChild:!0,children:e.jsx(d,{variant:"ghost",children:"キャンセル"})})]}),children:"この操作は元に戻せません。"})]})]})]}),play:async({canvasElement:n,step:a})=>{const t=s(n),l=s(n.ownerDocument.body);await a("defaultはアクセシブルな名前と説明を持ち、フォーカスを閉じ込め、Escapeで閉じる",async()=>{const r=t.getByRole("button",{name:"Defaultを開く"});await i.click(r);const c=l.getByRole("dialog",{name:"Default dialog"});await o(c).toHaveAttribute("data-size","default"),await o(c).toHaveAttribute("data-tone","default"),await o(c).toHaveAccessibleDescription("標準確認に使う540pxのDialogです。"),await o(c).toContainElement(n.ownerDocument.activeElement),await i.tab(),await i.tab(),await i.tab(),await o(c).toContainElement(n.ownerDocument.activeElement),await i.keyboard("{Escape}"),await o(l.queryByRole("dialog",{name:"Default dialog"})).not.toBeInTheDocument(),await o(r).toHaveFocus()}),await a("wideとeditorは型付きsize roleとfooter順序を反映する",async()=>{await i.click(t.getByRole("button",{name:"Wideを開く"}));const r=l.getByRole("dialog",{name:"Wide dialog"});await o(r).toHaveAttribute("data-size","wide"),await i.click(l.getByRole("button",{name:"Wideを完了"})),await i.click(t.getByRole("button",{name:"Editorを開く"}));const c=l.getByRole("dialog",{name:"Editor dialog"});await o(c).toHaveAttribute("data-size","editor");const j=s(c).getAllByRole("button").map(x=>x.textContent);await o(j).toEqual(["下書き","Editorを保存","×"]),await i.click(l.getByRole("button",{name:"Editorを保存"}))}),await a("warning toneと危険操作footerを表示する",async()=>{await i.click(t.getByRole("button",{name:"Warningを開く"}));const r=l.getByRole("dialog",{name:"Warning dialog"});await o(r).toHaveAttribute("data-tone","warning"),await o(s(r).getByRole("heading",{name:"Warning dialog"})).toHaveClass("text-myr-ruby"),await i.click(l.getByRole("button",{name:"キャンセル"}))})}},C={name:"Select — 紙面に馴染む選択欄",render:function(){const[a,t]=u.useState("mist");return e.jsxs("div",{style:{maxWidth:420},children:[e.jsx(ee,{label:"語り口",value:a,onValueChange:t,options:[{value:"mist",label:"薄霧",description:"余白と静けさを残す"},{value:"iris",label:"菫",description:"幻想味を強める"},{value:"ember",label:"熾火",description:"緊張感を強める"}],help:"AccountKitのSelectFieldもこのプリミティブを使います。",testId:"component-select"}),e.jsxs("p",{className:"field-help","data-testid":"component-select-value",children:["選択中: ",a]})]})},play:async({canvasElement:n})=>{const a=s(n),t=s(n.ownerDocument.body);await i.click(a.getByRole("combobox",{name:"語り口"})),await i.click(await t.findByRole("option",{name:/熾火/})),await o(a.getByTestId("component-select-value")).toHaveTextContent("ember")}},R={name:"Tabs — 方針を切り替える紙片",render:()=>e.jsxs(ae,{defaultValue:"overview",children:[e.jsx(te,{ariaLabel:"Radix導入メモ",items:[{value:"overview",label:"概要"},{value:"tokens",label:"トークン"},{value:"testing",label:"検証"}]}),e.jsx(b,{value:"overview",className:"myr-ui-note-card",style:{marginTop:12},children:"Radixは挙動を受け持ち、Myriale側が見た目を受け持ちます。"}),e.jsx(b,{value:"tokens",className:"myr-ui-note-card",style:{marginTop:12},children:"`--paper`, `--vellum`, `--iris`, `--ember` を中心に既存の空気を保ちます。"}),e.jsx(b,{value:"testing",className:"myr-ui-note-card",style:{marginTop:12},children:"Storybook playとVitestでキーボード/role/表示を確認します。"})]}),play:async({canvasElement:n,step:a})=>{const t=s(n);await a("クリックでタブを切り替える",async()=>{await i.click(t.getByRole("tab",{name:"検証"})),await o(t.getByText(/Storybook play/)).toBeVisible()}),await a("矢印キーでRadixのroving focusと選択を保つ",async()=>{await i.keyboard("{ArrowLeft}"),await o(t.getByRole("tab",{name:"トークン"})).toHaveAttribute("data-state","active"),await o(t.getByText(/`--paper`/)).toBeVisible()})}},D={name:"Popover / Menu — 小さな補助面と操作メニュー",render:function(){const[a,t]=u.useState("未選択");return e.jsxs("div",{style:{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"},children:[e.jsxs(Q,{children:[e.jsx(X,{asChild:!0,children:e.jsx(g,{variant:"ghost",children:"Popoverを開く"})}),e.jsx(Y,{children:e.jsx("p",{style:{margin:0,lineHeight:1.6},children:"補足説明や軽いヘルプを紙片として表示します。"})})]}),e.jsxs(ie,{children:[e.jsx(oe,{asChild:!0,children:e.jsx(g,{variant:"ghost",children:"Menuを開く"})}),e.jsxs(Z,{"aria-label":"コンポーネントメニュー",children:[e.jsx(h,{onSelect:()=>t("保存"),children:"保存"}),e.jsx(h,{onSelect:()=>t("複製"),children:"複製"}),e.jsx(h,{onSelect:()=>t("削除"),children:"削除"})]})]}),e.jsxs("span",{className:"field-help","data-testid":"component-menu-choice",children:["選択: ",a]})]})},play:async({canvasElement:n})=>{const a=s(n),t=s(n.ownerDocument.body);await i.click(a.getByRole("button",{name:"Popoverを開く"})),await o(t.getByText("補足説明や軽いヘルプを紙片として表示します。")).toBeVisible(),await i.click(a.getByRole("button",{name:"Menuを開く"})),await i.click(t.getByRole("menuitem",{name:"複製"})),await o(a.getByTestId("component-menu-choice")).toHaveTextContent("複製")}},T={name:"Checkbox / Radio / Toggle / Progress — 入力状態もRadixへ",render:function(){const[a,t]=u.useState(!0),[l,r]=u.useState("erase"),[c,j]=u.useState(!1),x=a?3:2;return e.jsxs("div",{style:{display:"grid",gap:18},children:[e.jsx(le,{label:"ノート更新を通知する","aria-label":"ノート更新を通知する",checked:a,onCheckedChange:t}),e.jsx(se,{label:"データの取り扱い方針",value:l,onValueChange:r,options:[{value:"erase",label:"完全削除する"},{value:"anonymize",label:"匿名化して保持する"}]}),e.jsx(re,{pressed:c,onPressedChange:j,"aria-label":"秘密メモの表示",children:c?"秘密メモを隠す":"秘密メモを表示"}),c&&e.jsx("p",{className:"field-help",children:"霧の奥にだけ見える補足メモです。"}),e.jsxs("div",{children:[e.jsxs("p",{className:"field-help",style:{marginTop:0},children:["準備度: ",x," / 3"]}),e.jsx(ce,{value:x,max:3,"aria-label":"準備度"})]}),e.jsxs("span",{className:"field-help","data-testid":"component-form-state",children:["通知: ",a?"ON":"OFF"," / 方針: ",l," / メモ: ",c?"表示":"非表示"]})]})},play:async({canvasElement:n})=>{const a=s(n);await i.click(a.getByRole("checkbox",{name:"ノート更新を通知する"})),await i.click(a.getByRole("radio",{name:"匿名化して保持する"})),await i.click(a.getByRole("button",{name:"秘密メモの表示"})),await o(a.getByText("霧の奥にだけ見える補足メモです。")).toBeVisible(),await o(a.getByTestId("component-form-state")).toHaveTextContent("通知: OFF"),await o(a.getByTestId("component-form-state")).toHaveTextContent("方針: anonymize"),await o(a.getByRole("progressbar",{name:"準備度"})).toHaveAttribute("aria-valuenow","2")}};var f,k,E;w.parameters={...w.parameters,docs:{...(f=w.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: 'Dialog / Select / Tabs / Menu — 雰囲気を保つRadix導入サンプル',
  render: function Render() {
    const [tone, setTone] = useState('mist');
    const [menuChoice, setMenuChoice] = useState('未選択');
    return <div style={{
      display: 'grid',
      gap: 22
    }}>
        <header>
          <Label as="p" textRole="eyebrow" className="mb-2">Radix pilot</Label>
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

        <div className={actionRowClassName}>
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
}`,...(E=(k=w.parameters)==null?void 0:k.docs)==null?void 0:E.source}}};var S,N,I;M.parameters={...M.parameters,docs:{...(S=M.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
}`,...(I=(N=M.parameters)==null?void 0:N.docs)==null?void 0:I.source}}};var H,V,P;B.parameters={...B.parameters,docs:{...(H=B.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: 'Dialog — size / tone / footer roles',
  render: () => <div className="grid gap-4">
      <p className="section-lead">default 540px、wide 620px、editor 760pxとwarning toneを同じDialog APIで確認します。</p>
      <div className={actionRowClassName}>
        <MyrialeDialogRoot>
          <MyrialeDialogTrigger asChild><UiButton variant="ghost">Defaultを開く</UiButton></MyrialeDialogTrigger>
          <MyrialeDialogContent title="Default dialog" description="標準確認に使う540pxのDialogです。" footer={<MyrialeDialogClose asChild><UiButton variant="primary">Defaultを完了</UiButton></MyrialeDialogClose>}>
            <input aria-label="Defaultの入力" defaultValue="霧の契約" />
          </MyrialeDialogContent>
        </MyrialeDialogRoot>

        <MyrialeDialogRoot>
          <MyrialeDialogTrigger asChild><UiButton variant="ghost">Wideを開く</UiButton></MyrialeDialogTrigger>
          <MyrialeDialogContent title="Wide dialog" description="開始前レビューに使う620pxのDialogです。" size="wide" footer={<MyrialeDialogClose asChild><UiButton variant="primary">Wideを完了</UiButton></MyrialeDialogClose>}>
            <div className="myr-ui-note-card">Scenarioと主人公のサマリーを横にゆとりを持って表示します。</div>
          </MyrialeDialogContent>
        </MyrialeDialogRoot>

        <MyrialeDialogRoot>
          <MyrialeDialogTrigger asChild><UiButton variant="ghost">Editorを開く</UiButton></MyrialeDialogTrigger>
          <MyrialeDialogContent title="Editor dialog" description="複雑なフォームや表を維持する760pxのDialogです。" size="editor" bodyClassName="grid grid-cols-2 gap-3 max-sm:grid-cols-1" footer={<><UiButton variant="ghost">下書き</UiButton><MyrialeDialogClose asChild><UiButton variant="primary">Editorを保存</UiButton></MyrialeDialogClose></>}>
            <label className="grid gap-1">人物名<input aria-label="Editorの人物名" defaultValue="月読ミナト" /></label>
            <label className="grid gap-1">役割<input aria-label="Editorの役割" defaultValue="案内人" /></label>
          </MyrialeDialogContent>
        </MyrialeDialogRoot>

        <MyrialeDialogRoot>
          <MyrialeDialogTrigger asChild><UiButton variant="danger">Warningを開く</UiButton></MyrialeDialogTrigger>
          <MyrialeDialogContent title="Warning dialog" description="取り消せない操作を明確に区別します。" tone="warning" footer={<><UiButton variant="danger">破棄を確定</UiButton><MyrialeDialogClose asChild><UiButton variant="ghost">キャンセル</UiButton></MyrialeDialogClose></>}>
            この操作は元に戻せません。
          </MyrialeDialogContent>
        </MyrialeDialogRoot>
      </div>
    </div>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('defaultはアクセシブルな名前と説明を持ち、フォーカスを閉じ込め、Escapeで閉じる', async () => {
      const trigger = canvas.getByRole('button', {
        name: 'Defaultを開く'
      });
      await userEvent.click(trigger);
      const dialog = screen.getByRole('dialog', {
        name: 'Default dialog'
      });
      await expect(dialog).toHaveAttribute('data-size', 'default');
      await expect(dialog).toHaveAttribute('data-tone', 'default');
      await expect(dialog).toHaveAccessibleDescription('標準確認に使う540pxのDialogです。');
      await expect(dialog).toContainElement(canvasElement.ownerDocument.activeElement as HTMLElement);
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      await expect(dialog).toContainElement(canvasElement.ownerDocument.activeElement as HTMLElement);
      await userEvent.keyboard('{Escape}');
      await expect(screen.queryByRole('dialog', {
        name: 'Default dialog'
      })).not.toBeInTheDocument();
      await expect(trigger).toHaveFocus();
    });
    await step('wideとeditorは型付きsize roleとfooter順序を反映する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'Wideを開く'
      }));
      const wide = screen.getByRole('dialog', {
        name: 'Wide dialog'
      });
      await expect(wide).toHaveAttribute('data-size', 'wide');
      await userEvent.click(screen.getByRole('button', {
        name: 'Wideを完了'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: 'Editorを開く'
      }));
      const editor = screen.getByRole('dialog', {
        name: 'Editor dialog'
      });
      await expect(editor).toHaveAttribute('data-size', 'editor');
      const editorActions = within(editor).getAllByRole('button').map(button => button.textContent);
      await expect(editorActions).toEqual(['下書き', 'Editorを保存', '×']);
      await userEvent.click(screen.getByRole('button', {
        name: 'Editorを保存'
      }));
    });
    await step('warning toneと危険操作footerを表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'Warningを開く'
      }));
      const warning = screen.getByRole('dialog', {
        name: 'Warning dialog'
      });
      await expect(warning).toHaveAttribute('data-tone', 'warning');
      await expect(within(warning).getByRole('heading', {
        name: 'Warning dialog'
      })).toHaveClass('text-myr-ruby');
      await userEvent.click(screen.getByRole('button', {
        name: 'キャンセル'
      }));
    });
  }
}`,...(P=(V=B.parameters)==null?void 0:V.docs)==null?void 0:P.source}}};var A,W,U;C.parameters={...C.parameters,docs:{...(A=C.parameters)==null?void 0:A.docs,source:{originalSource:`{
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
}`,...(U=(W=C.parameters)==null?void 0:W.docs)==null?void 0:U.source}}};var z,F,L;R.parameters={...R.parameters,docs:{...(z=R.parameters)==null?void 0:z.docs,source:{originalSource:`{
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
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('クリックでタブを切り替える', async () => {
      await userEvent.click(canvas.getByRole('tab', {
        name: '検証'
      }));
      await expect(canvas.getByText(/Storybook play/)).toBeVisible();
    });
    await step('矢印キーでRadixのroving focusと選択を保つ', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await expect(canvas.getByRole('tab', {
        name: 'トークン'
      })).toHaveAttribute('data-state', 'active');
      await expect(canvas.getByText(/\`--paper\`/)).toBeVisible();
    });
  }
}`,...(L=(F=R.parameters)==null?void 0:F.docs)==null?void 0:L.source}}};var q,O,G;D.parameters={...D.parameters,docs:{...(q=D.parameters)==null?void 0:q.docs,source:{originalSource:`{
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
}`,...(G=(O=D.parameters)==null?void 0:O.docs)==null?void 0:G.source}}};var K,_,$;T.parameters={...T.parameters,docs:{...(K=T.parameters)==null?void 0:K.docs,source:{originalSource:`{
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
}`,...($=(_=T.parameters)==null?void 0:_.docs)==null?void 0:$.source}}};const Me=["DialogSelectTabsAndMenu","DialogComponent","DialogRoles","SelectComponent","TabsComponent","PopoverAndMenuComponents","CheckboxRadioToggleAndProgressComponents"];export{T as CheckboxRadioToggleAndProgressComponents,M as DialogComponent,B as DialogRoles,w as DialogSelectTabsAndMenu,D as PopoverAndMenuComponents,C as SelectComponent,R as TabsComponent,Me as __namedExportsOrder,we as default};
