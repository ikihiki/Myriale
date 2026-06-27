import{w as d,e as s,u as l}from"./index-C3Z0PGzo.js";import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as p}from"./index-BlmOqGMO.js";import{A as Be,n as Ae,S as ye}from"./AppChrome-D4UNiJ5y.js";/* empty css               */import"./index-yBjzXJbu.js";const f=[{id:"SCN-STAR-LIBRARY",title:"星喰いの地下図書館",summary:"地下に沈んだ王都で、禁書を読むたびに星座が書き換わる探索譚。",genre:"ダークファンタジー探索譚",tone:"静かで不穏、淡い希望",lore:`星座は魔法体系の鍵。
死者の名前を読むと記憶を失う。`,aiFreedom:"中: 設定を守りつつ提案する",narrativePolicy:"二人称・現在形で描写多め。プレイヤーの選択を尊重する。",illustrationStyle:"銅版画風 / 低彩度 / 細密",mood:"孤独、湿った静けさ、薄い金色の灯り",negative:"現代車両、銃器、過度な流血",visibility:"公開中",activeSessions:3,history:[{at:"2日前 14:20",summary:"Loreに「死者の名前」の禁忌を追加"},{at:"5日前 09:05",summary:"概要を全面改稿、ジャンルを探索譚へ変更"},{at:"先週 22:40",summary:"Draftとして新規作成"}]},{id:"SCN-ASH-STATION",title:"灰の駅と宛名のない切符",summary:"朝が来ない荒野を、宛名のない切符だけを頼りに渡るロードムービー。",genre:"終末ロードムービー",tone:"乾いた祈り、遠い汽笛",lore:"朝が来ない荒野では、切符だけが次の町を覚えている。",aiFreedom:"高: 展開を広げる",narrativePolicy:"叙情的で簡潔。移動と別れを軸に進める。",illustrationStyle:"水彩 / くすんだ暖色 / 粒状感",mood:"郷愁、灰、遠い光",negative:"鮮やかな原色、近未来都市",visibility:"非公開",activeSessions:0,history:[{at:"昨日 18:10",summary:"挿絵ムードを「郷愁」に調整"},{at:"先週 11:30",summary:"Draftとして新規作成"}]}],Ce={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"},He=[{id:"basics",label:"基本情報",help:"タイトルと概要（あらすじ）"},{id:"world",label:"世界観",help:"ジャンル・雰囲気・Lore"},{id:"ai",label:"AI設定",help:"AI裁量とNarrative生成方針"},{id:"illustration",label:"挿絵",help:"画風・ムード・NG要素"}];function pe(){const[i,n]=p.useState("list"),[a,r]=p.useState("basics"),[w,me]=p.useState(null),[c,N]=p.useState(null),[xe,u]=p.useState(!1),[we,m]=p.useState("自分のシナリオ一覧です。編集したいシナリオを選んでください。"),[R,k]=p.useState(null),[ue,L]=p.useState("テストプレイは未実行です。"),U=t=>{me(t.id),N({...t,history:[...t.history]}),n("edit"),r("basics"),u(!1),k(null),L("テストプレイは未実行です。"),m(`「${t.title}」の編集画面を開きました。現在の内容を読み込んでいます。`)},he=()=>{n("list"),m("シナリオ一覧へ戻りました。別のシナリオを編集できます。")},v=(t,x)=>{N(C=>C&&{...C,[t]:x}),u(!0)},ge=()=>{k([{kind:"矛盾",detail:"Loreでは「死者の名前は禁忌」だが、概要では名前を読む描写が推奨されています。"},{kind:"改善案",detail:"挿絵NG要素に「現代車両」がありますが、世界観に合わせ「電灯」も追加候補です。"}]),m("AIが編集内容をチェックしました。矛盾点と改善案を提示します（自動確定はしません）。")},Te=()=>{L("仮セッションでイントロと序盤Narrativeを生成しました（本番セッションには反映されません）。"),m("編集後の内容でテストプレイを実行しました。本番セッションには影響しません。")},be=()=>{u(!1),m("編集内容を下書きとして保存しました。確定保存するまで公開版は変わりません。")},Se=()=>{c&&(u(!1),m(`「${c.title}」の編集内容を公開・反映しました。新規セッションは最新版を使います。進行中の${c.activeSessions}件のセッションは影響を受けません。`))},Ee=()=>{m("テストプレイ用のセッション開始ワイヤーフレームへ移動します（本番には影響しません）。"),Ae(ye.startSession)},je=[{label:"Myriale",to:"scenarioRegister"},{label:"ライブラリ",to:"scenarioRegister"},{label:c?`${c.title} を編集`:"シナリオを編集"}],Ie=(c==null?void 0:c.visibility)??"—";return e.jsx(Be,{section:"library",breadcrumbs:je,account:Ce,children:e.jsxs("div",{className:"scenario-forge scenario-forge-wizard edit-scenario-wireframe",children:[e.jsxs("aside",{className:"contract-spine","aria-label":i==="list"?"編集対象の選択":"編集セクション",children:[e.jsx("strong",{children:"Scenario Editor"}),i==="list"?e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"toc-help",children:"自分のシナリオ一覧です。選ぶと編集画面に現在の内容を読み込みます。"}),e.jsx("div",{className:"wizard-step-list",role:"list","aria-label":"編集できるシナリオ",children:f.map(t=>e.jsxs("button",{className:`spine-row spine-step ${w===t.id?"active":""}`,onClick:()=>U(t),"aria-label":`${t.title} を編集対象に選ぶ`,"data-testid":`spine-${t.id}`,children:[e.jsx("span",{children:t.title}),e.jsxs("small",{children:[t.visibility," / ",t.id]})]},t.id))})]}):e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"toc-help",children:"編集する項目を選びます。どの項目も下書き保存でき、公開まで公開版は変わりません。"}),e.jsx("div",{className:"wizard-step-list",role:"list","aria-label":"編集セクション",children:He.map((t,x)=>e.jsxs("button",{className:`spine-row spine-step ${a===t.id?"active":""}`,onClick:()=>r(t.id),"aria-label":`${t.label}へ`,"aria-current":a===t.id?"step":void 0,children:[e.jsxs("span",{children:[String(x+1).padStart(2,"0")," / ",t.label]}),e.jsx("small",{children:t.help})]},t.id))}),e.jsx("button",{className:"text-button",onClick:he,children:"シナリオ一覧へ戻る"})]}),e.jsxs("div",{className:"scenario-id",children:[e.jsx("span",{children:"ScenarioId"}),e.jsx("b",{children:c?c.id:"未選択"})]})]}),e.jsxs("main",{className:"forge-paper wizard-paper","aria-label":"シナリオ編集ワイヤーフレーム",children:[e.jsx("p",{className:"kicker",children:"Scenario edit / Improve and publish"}),e.jsx("div",{className:"notice",role:"status","data-testid":"edit-notice",children:we}),i==="list"&&e.jsxs("section",{className:"wizard-panel","aria-label":"自分のシナリオ一覧",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"既存のシナリオを編集して改善できます。"}),"所有または編集権限のあるシナリオを、公開・非公開に関わらず編集できます。編集は下書きとして保存されます。"]}),e.jsx("div",{className:"edit-scenario-list","data-testid":"scenario-list",children:f.map(t=>{var x;return e.jsxs("article",{className:"edit-scenario-card","data-testid":`card-${t.id}`,children:[e.jsxs("span",{children:[t.visibility," / ",t.id]}),e.jsx("h2",{children:t.title}),e.jsxs("p",{children:[t.genre," / ",t.tone]}),e.jsx("p",{children:t.summary}),e.jsxs("p",{className:"edit-scenario-meta",children:["進行中セッション: ",t.activeSessions,"件 ・ 最終編集: ",((x=t.history[0])==null?void 0:x.at)??"—"]}),e.jsx("button",{className:"primary",onClick:()=>U(t),children:"編集"})]},t.id)})})]}),i==="edit"&&c&&e.jsxs(e.Fragment,{children:[a==="basics"&&e.jsxs("section",{className:"wizard-panel","aria-label":"基本情報の編集",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"タイトルや概要（あらすじ）を編集します。"}),"内容に合った説明へ更新できます。"]}),e.jsxs("label",{children:["タイトル",e.jsx("input",{"aria-label":"シナリオタイトル",value:c.title,onChange:t=>v("title",t.target.value)})]}),e.jsxs("label",{children:["概要（あらすじ）",e.jsx("textarea",{"aria-label":"概要",value:c.summary,onChange:t=>v("summary",t.target.value)})]})]}),a==="world"&&e.jsxs("section",{className:"wizard-panel","aria-label":"世界観の編集",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"ジャンル・雰囲気・Loreを調整します。"}),"更新は以降の新しいセッションに使われ、",e.jsx("em",{children:"進行中の既存セッションには影響しません。"})]}),e.jsxs("label",{children:["ジャンル",e.jsx("input",{"aria-label":"ジャンル",value:c.genre,onChange:t=>v("genre",t.target.value)})]}),e.jsxs("label",{children:["雰囲気",e.jsx("input",{"aria-label":"雰囲気",value:c.tone,onChange:t=>v("tone",t.target.value)})]}),e.jsxs("label",{children:["Lore",e.jsx("textarea",{"aria-label":"世界観やルール",value:c.lore,onChange:t=>v("lore",t.target.value)})]})]}),a==="ai"&&e.jsxs("section",{className:"wizard-panel","aria-label":"AI設定の編集",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"AIの振る舞いを調整します。"}),"AI裁量レベルとNarrative生成方針は、セッション開始前の設定として保存されます。"]}),e.jsxs("label",{children:["AI裁量",e.jsxs("select",{"aria-label":"AI裁量",value:c.aiFreedom,onChange:t=>v("aiFreedom",t.target.value),children:[e.jsx("option",{children:"低: 厳密に守る"}),e.jsx("option",{children:"中: 設定を守りつつ提案する"}),e.jsx("option",{children:"高: 展開を広げる"})]})]}),e.jsxs("label",{children:["Narrative生成方針",e.jsx("textarea",{"aria-label":"Narrative生成方針",value:c.narrativePolicy,onChange:t=>v("narrativePolicy",t.target.value)})]})]}),a==="illustration"&&e.jsxs("section",{className:"wizard-panel","aria-label":"挿絵設定の編集",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"挿絵のテイストや雰囲気を変更します。"}),"画風・ムード・NG要素を編集し、保存されないプレビューで確認できます。"]}),e.jsxs("label",{children:["画風",e.jsx("input",{"aria-label":"挿絵の画風",value:c.illustrationStyle,onChange:t=>v("illustrationStyle",t.target.value)})]}),e.jsxs("label",{children:["ムード",e.jsx("input",{"aria-label":"挿絵のムード",value:c.mood,onChange:t=>v("mood",t.target.value)})]}),e.jsxs("label",{children:["NG要素",e.jsx("textarea",{"aria-label":"挿絵の禁止要素",value:c.negative,onChange:t=>v("negative",t.target.value)})]})]}),e.jsxs("section",{className:"wizard-panel edit-review-panel","aria-label":"確認と反映",children:[e.jsx("h2",{children:"確認 → 反映"}),e.jsx("p",{children:"AIチェックとテストプレイで品質を確認してから、下書き保存・公開できます。AIは補助に限定され、確定は常に作者が行います。"}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{onClick:ge,"data-testid":"ai-check-button",children:"AIにチェック"}),e.jsx("button",{onClick:Te,"data-testid":"preview-button",children:"プレビュー（テストプレイ）"}),e.jsx("button",{onClick:Ee,children:"本番相当のテストプレイへ"})]}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{onClick:be,"data-testid":"save-button",children:"下書き保存"}),e.jsx("button",{className:"primary",onClick:Se,"data-testid":"publish-button",children:"公開して反映"})]}),e.jsxs("label",{className:"edit-visibility",children:["公開状態",e.jsxs("select",{"aria-label":"公開状態",value:c.visibility,onChange:t=>v("visibility",t.target.value),children:[e.jsx("option",{children:"公開中"}),e.jsx("option",{children:"非公開"})]})]})]})]})]}),e.jsxs("aside",{className:"ai-bookmark wizard-summary","aria-label":"編集サマリー",children:[e.jsx("h2",{children:"編集状態"}),e.jsxs("article",{children:[e.jsx("h3",{children:"対象シナリオ"}),e.jsx("p",{"data-testid":"summary-title",children:c?c.title:"一覧から選択してください"}),e.jsxs("p",{"data-testid":"summary-visibility",children:["公開状態: ",Ie]}),e.jsx("p",{"data-testid":"summary-dirty",children:i==="edit"?xe?"未保存の変更があります":"保存済み（変更なし）":"—"})]}),e.jsxs("article",{"data-testid":"ai-check",children:[e.jsx("h3",{children:"AIチェック結果"}),R?e.jsx("ul",{children:R.map(t=>e.jsxs("li",{children:[e.jsxs("strong",{children:[t.kind,":"]})," ",t.detail]},`${t.kind}-${t.detail}`))}):e.jsx("p",{children:"未実行です。AIは矛盾点と改善案を提示しますが、自動確定はしません。"})]}),e.jsxs("article",{"data-testid":"preview-result",children:[e.jsx("h3",{children:"テストプレイ"}),e.jsx("p",{children:ue})]}),e.jsxs("article",{"data-testid":"history",children:[e.jsx("h3",{children:"編集履歴"}),c?e.jsx("ol",{className:"edit-history-list",children:c.history.map(t=>e.jsxs("li",{children:[e.jsx("small",{children:t.at}),e.jsx("span",{children:t.summary})]},`${t.at}-${t.summary}`))}):e.jsx("p",{children:"シナリオを選ぶと編集履歴が表示されます。"})]})]})]})})}pe.__docgenInfo={description:"",methods:[],displayName:"EditScenarioWireframe"};const Ve={title:"Edit scenario/Wireframe from user stories",component:pe,parameters:{notes:"docs/user-stories/edit-scenario.md の各ユーザーストーリー（US-E01〜E10）を、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。"}},o="星喰いの地下図書館",Ne="灰の駅と宛名のない切符",y=async(i,n)=>{const a=d(i.getByTestId("scenario-list")).getByText(n).closest("article");await l.click(d(a).getByRole("button",{name:"編集"}))},H=async(i,n)=>{await l.click(i.getByRole("button",{name:`${n}へ`}))},h={name:"US-E01: 既存のシナリオを編集したい",play:async({canvasElement:i,step:n})=>{const a=d(i);await n("自分のシナリオ一覧が表示され、公開・非公開どちらも編集できる",async()=>{await s(a.getByRole("region",{name:"自分のシナリオ一覧"})).toBeVisible(),await s(a.getByTestId("scenario-list")).toHaveTextContent(o),await s(a.getByTestId("card-SCN-ASH-STATION")).toHaveTextContent("非公開")}),await n("編集を選ぶと編集画面が開き、現在の内容が読み込まれる",async()=>{await y(a,o),await s(a.getByTestId("edit-notice")).toHaveTextContent("現在の内容を読み込んでいます"),await s(a.getByTestId("summary-title")).toHaveTextContent(o),await s(a.getByLabelText("シナリオタイトル")).toHaveValue(o)})}},g={name:"US-E02: シナリオの基本情報を編集したい",play:async({canvasElement:i,step:n})=>{const a=d(i);await y(a,o),await n("タイトルと概要を編集すると、サマリーに反映される",async()=>{const r=a.getByLabelText("シナリオタイトル");await l.clear(r),await l.type(r,"星喰いの地下図書館・改"),await s(a.getByTestId("summary-title")).toHaveTextContent("星喰いの地下図書館・改");const w=a.getByLabelText("概要");await l.clear(w),await l.type(w,"改稿した概要テキスト。"),await s(a.getByTestId("summary-dirty")).toHaveTextContent("未保存の変更があります")})}},T={name:"US-E03: ジャンル・雰囲気・世界観を編集したい",play:async({canvasElement:i,step:n})=>{const a=d(i);await y(a,o),await H(a,"世界観"),await n("世界観セクションで、既存セッションに影響しないことが示される",async()=>{await s(a.getByRole("region",{name:"世界観の編集"})).toHaveTextContent("既存セッションには影響しません")}),await n("ジャンルとLoreを修正できる",async()=>{const r=a.getByLabelText("ジャンル");await l.clear(r),await l.type(r,"幻想ミステリ"),await s(r).toHaveValue("幻想ミステリ"),await s(a.getByLabelText("世界観やルール")).toHaveDisplayValue(/星座は魔法体系の鍵/)})}},b={name:"US-E04: AI関連設定を編集したい",play:async({canvasElement:i,step:n})=>{const a=d(i);await y(a,o),await H(a,"AI設定"),await n("AI裁量レベルとNarrative生成方針を変更できる",async()=>{await l.selectOptions(a.getByLabelText("AI裁量"),"高: 展開を広げる"),await s(a.getByLabelText("AI裁量")).toHaveValue("高: 展開を広げる");const r=a.getByLabelText("Narrative生成方針");await l.clear(r),await l.type(r,"テンポ重視で簡潔に。"),await s(r).toHaveValue("テンポ重視で簡潔に。")})}},S={name:"US-E05: 挿絵設定を編集したい",play:async({canvasElement:i,step:n})=>{const a=d(i);await y(a,o),await H(a,"挿絵"),await n("画風・ムード・NG要素を編集できる",async()=>{const r=a.getByLabelText("挿絵の画風");await l.clear(r),await l.type(r,"影絵 / 高コントラスト"),await s(r).toHaveValue("影絵 / 高コントラスト")}),await n("保存されないプレビューで確認できる",async()=>{await l.click(a.getByTestId("preview-button")),await s(a.getByTestId("preview-result")).toHaveTextContent("本番セッションには反映されません")})}},E={name:"US-E06: 編集内容をAIにチェックしてもらいたい",play:async({canvasElement:i,step:n})=>{const a=d(i);await y(a,o),await n("「AIにチェック」で矛盾点と改善案が提示される",async()=>{await l.click(a.getByTestId("ai-check-button")),await s(a.getByTestId("ai-check")).toHaveTextContent("矛盾:"),await s(a.getByTestId("ai-check")).toHaveTextContent("改善案:")}),await n("AIは自動確定しないことが明示される",async()=>{await s(a.getByTestId("edit-notice")).toHaveTextContent("自動確定はしません")})}},j={name:"US-E07: 編集内容をプレビューしたい",play:async({canvasElement:i,step:n})=>{const a=d(i);await y(a,o),await n("プレビュー（テストプレイ）で仮セッションのイントロ/序盤が生成される",async()=>{await l.click(a.getByTestId("preview-button")),await s(a.getByTestId("preview-result")).toHaveTextContent("イントロと序盤Narrativeを生成"),await s(a.getByTestId("edit-notice")).toHaveTextContent("本番セッションには影響しません")}),await n("本番相当のテストプレイは、Session開始ワイヤーフレームへの導線として用意される",async()=>{await s(a.getByRole("button",{name:"本番相当のテストプレイへ"})).toBeVisible(),await s(ye.startSession).toMatch(/^start-session-/)})}},I={name:"US-E08: 編集内容を保存したい",play:async({canvasElement:i,step:n})=>{const a=d(i);await y(a,o),await n("編集すると未保存状態になり、下書き保存すると保存済みになる",async()=>{await l.type(a.getByLabelText("シナリオタイトル"),"・改"),await s(a.getByTestId("summary-dirty")).toHaveTextContent("未保存の変更があります"),await l.click(a.getByTestId("save-button")),await s(a.getByTestId("edit-notice")).toHaveTextContent("下書きとして保存しました"),await s(a.getByTestId("summary-dirty")).toHaveTextContent("保存済み（変更なし）")})}},B={name:"US-E09: 編集内容を公開・反映したい",play:async({canvasElement:i,step:n})=>{const a=d(i);await y(a,o),await n("公開すると新規セッションに最新版が使われ、既存セッションは影響を受けない",async()=>{await l.click(a.getByTestId("publish-button")),await s(a.getByTestId("edit-notice")).toHaveTextContent("新規セッションは最新版を使います"),await s(a.getByTestId("edit-notice")).toHaveTextContent("3件のセッションは影響を受けません")})}},A={name:"US-E10: シナリオの編集履歴を管理したい",play:async({canvasElement:i,step:n})=>{const a=d(i);await y(a,Ne),await n("編集日時と変更概要が一覧表示される",async()=>{const r=a.getByTestId("history");await s(r).toHaveTextContent("編集履歴"),await s(r).toHaveTextContent("挿絵ムードを「郷愁」に調整"),await s(r).toHaveTextContent("Draftとして新規作成")})}};var _,V,Y;h.parameters={...h.parameters,docs:{...(_=h.parameters)==null?void 0:_.docs,source:{originalSource:`{
  name: 'US-E01: 既存のシナリオを編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('自分のシナリオ一覧が表示され、公開・非公開どちらも編集できる', async () => {
      await expect(canvas.getByRole('region', {
        name: '自分のシナリオ一覧'
      })).toBeVisible();
      await expect(canvas.getByTestId('scenario-list')).toHaveTextContent(STAR_LIBRARY);
      await expect(canvas.getByTestId('card-SCN-ASH-STATION')).toHaveTextContent('非公開');
    });
    await step('編集を選ぶと編集画面が開き、現在の内容が読み込まれる', async () => {
      await openEditor(canvas, STAR_LIBRARY);
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('現在の内容を読み込んでいます');
      await expect(canvas.getByTestId('summary-title')).toHaveTextContent(STAR_LIBRARY);
      await expect(canvas.getByLabelText('シナリオタイトル')).toHaveValue(STAR_LIBRARY);
    });
  }
}`,...(Y=(V=h.parameters)==null?void 0:V.docs)==null?void 0:Y.source}}};var $,D,z;g.parameters={...g.parameters,docs:{...($=g.parameters)==null?void 0:$.docs,source:{originalSource:`{
  name: 'US-E02: シナリオの基本情報を編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('タイトルと概要を編集すると、サマリーに反映される', async () => {
      const title = canvas.getByLabelText('シナリオタイトル');
      await userEvent.clear(title);
      await userEvent.type(title, '星喰いの地下図書館・改');
      await expect(canvas.getByTestId('summary-title')).toHaveTextContent('星喰いの地下図書館・改');
      const summary = canvas.getByLabelText('概要');
      await userEvent.clear(summary);
      await userEvent.type(summary, '改稿した概要テキスト。');
      await expect(canvas.getByTestId('summary-dirty')).toHaveTextContent('未保存の変更があります');
    });
  }
}`,...(z=(D=g.parameters)==null?void 0:D.docs)==null?void 0:z.source}}};var P,O,F;T.parameters={...T.parameters,docs:{...(P=T.parameters)==null?void 0:P.docs,source:{originalSource:`{
  name: 'US-E03: ジャンル・雰囲気・世界観を編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '世界観');
    await step('世界観セクションで、既存セッションに影響しないことが示される', async () => {
      await expect(canvas.getByRole('region', {
        name: '世界観の編集'
      })).toHaveTextContent('既存セッションには影響しません');
    });
    await step('ジャンルとLoreを修正できる', async () => {
      const genre = canvas.getByLabelText('ジャンル');
      await userEvent.clear(genre);
      await userEvent.type(genre, '幻想ミステリ');
      await expect(genre).toHaveValue('幻想ミステリ');
      // Loreには現在の世界観設定が読み込まれている。
      await expect(canvas.getByLabelText('世界観やルール')).toHaveDisplayValue(/星座は魔法体系の鍵/);
    });
  }
}`,...(F=(O=T.parameters)==null?void 0:O.docs)==null?void 0:F.source}}};var G,W,M;b.parameters={...b.parameters,docs:{...(G=b.parameters)==null?void 0:G.docs,source:{originalSource:`{
  name: 'US-E04: AI関連設定を編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, 'AI設定');
    await step('AI裁量レベルとNarrative生成方針を変更できる', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('AI裁量'), '高: 展開を広げる');
      await expect(canvas.getByLabelText('AI裁量')).toHaveValue('高: 展開を広げる');
      const policy = canvas.getByLabelText('Narrative生成方針');
      await userEvent.clear(policy);
      await userEvent.type(policy, 'テンポ重視で簡潔に。');
      await expect(policy).toHaveValue('テンポ重視で簡潔に。');
    });
  }
}`,...(M=(W=b.parameters)==null?void 0:W.docs)==null?void 0:M.source}}};var q,J,K;S.parameters={...S.parameters,docs:{...(q=S.parameters)==null?void 0:q.docs,source:{originalSource:`{
  name: 'US-E05: 挿絵設定を編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '挿絵');
    await step('画風・ムード・NG要素を編集できる', async () => {
      const style = canvas.getByLabelText('挿絵の画風');
      await userEvent.clear(style);
      await userEvent.type(style, '影絵 / 高コントラスト');
      await expect(style).toHaveValue('影絵 / 高コントラスト');
    });
    await step('保存されないプレビューで確認できる', async () => {
      await userEvent.click(canvas.getByTestId('preview-button'));
      await expect(canvas.getByTestId('preview-result')).toHaveTextContent('本番セッションには反映されません');
    });
  }
}`,...(K=(J=S.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};var Q,X,Z;E.parameters={...E.parameters,docs:{...(Q=E.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  name: 'US-E06: 編集内容をAIにチェックしてもらいたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('「AIにチェック」で矛盾点と改善案が提示される', async () => {
      await userEvent.click(canvas.getByTestId('ai-check-button'));
      await expect(canvas.getByTestId('ai-check')).toHaveTextContent('矛盾:');
      await expect(canvas.getByTestId('ai-check')).toHaveTextContent('改善案:');
    });
    await step('AIは自動確定しないことが明示される', async () => {
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('自動確定はしません');
    });
  }
}`,...(Z=(X=E.parameters)==null?void 0:X.docs)==null?void 0:Z.source}}};var ee,ae,te;j.parameters={...j.parameters,docs:{...(ee=j.parameters)==null?void 0:ee.docs,source:{originalSource:`{
  name: 'US-E07: 編集内容をプレビューしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('プレビュー（テストプレイ）で仮セッションのイントロ/序盤が生成される', async () => {
      await userEvent.click(canvas.getByTestId('preview-button'));
      await expect(canvas.getByTestId('preview-result')).toHaveTextContent('イントロと序盤Narrativeを生成');
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('本番セッションには影響しません');
    });
    await step('本番相当のテストプレイは、Session開始ワイヤーフレームへの導線として用意される', async () => {
      await expect(canvas.getByRole('button', {
        name: '本番相当のテストプレイへ'
      })).toBeVisible();
      await expect(STORY_IDS.startSession).toMatch(/^start-session-/);
    });
  }
}`,...(te=(ae=j.parameters)==null?void 0:ae.docs)==null?void 0:te.source}}};var ne,se,ie;I.parameters={...I.parameters,docs:{...(ne=I.parameters)==null?void 0:ne.docs,source:{originalSource:`{
  name: 'US-E08: 編集内容を保存したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('編集すると未保存状態になり、下書き保存すると保存済みになる', async () => {
      await userEvent.type(canvas.getByLabelText('シナリオタイトル'), '・改');
      await expect(canvas.getByTestId('summary-dirty')).toHaveTextContent('未保存の変更があります');
      await userEvent.click(canvas.getByTestId('save-button'));
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('下書きとして保存しました');
      await expect(canvas.getByTestId('summary-dirty')).toHaveTextContent('保存済み（変更なし）');
    });
  }
}`,...(ie=(se=I.parameters)==null?void 0:se.docs)==null?void 0:ie.source}}};var ce,re,le;B.parameters={...B.parameters,docs:{...(ce=B.parameters)==null?void 0:ce.docs,source:{originalSource:`{
  name: 'US-E09: 編集内容を公開・反映したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('公開すると新規セッションに最新版が使われ、既存セッションは影響を受けない', async () => {
      await userEvent.click(canvas.getByTestId('publish-button'));
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('新規セッションは最新版を使います');
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('3件のセッションは影響を受けません');
    });
  }
}`,...(le=(re=B.parameters)==null?void 0:re.docs)==null?void 0:le.source}}};var oe,de,ve;A.parameters={...A.parameters,docs:{...(oe=A.parameters)==null?void 0:oe.docs,source:{originalSource:`{
  name: 'US-E10: シナリオの編集履歴を管理したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, ASH_STATION);
    await step('編集日時と変更概要が一覧表示される', async () => {
      const history = canvas.getByTestId('history');
      await expect(history).toHaveTextContent('編集履歴');
      await expect(history).toHaveTextContent('挿絵ムードを「郷愁」に調整');
      await expect(history).toHaveTextContent('Draftとして新規作成');
    });
  }
}`,...(ve=(de=A.parameters)==null?void 0:de.docs)==null?void 0:ve.source}}};const Ye=["USE01EditExistingScenario","USE02EditBasics","USE03EditWorld","USE04EditAiSettings","USE05EditIllustration","USE06AskAiCheck","USE07PreviewEdit","USE08SaveDraft","USE09PublishEdit","USE10ReviewHistory"];export{h as USE01EditExistingScenario,g as USE02EditBasics,T as USE03EditWorld,b as USE04EditAiSettings,S as USE05EditIllustration,E as USE06AskAiCheck,j as USE07PreviewEdit,I as USE08SaveDraft,B as USE09PublishEdit,A as USE10ReviewHistory,Ye as __namedExportsOrder,Ve as default};
