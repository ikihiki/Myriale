import{w as x,e as i,u as s}from"./index-C3Z0PGzo.js";import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as l}from"./index-BlmOqGMO.js";import{A as wa}from"./AppChrome-DEx1aaG4.js";/* empty css               */import"./index-yBjzXJbu.js";const F=[{id:"cast",label:"Cast候補",help:"複数の人物候補をテーブル管理"},{id:"locations",label:"Location候補",help:"場所候補とアクセス条件を一覧管理"},{id:"beats",label:"Chapter / Beat",help:"進行単位と出口条件を複数登録"},{id:"secrets",label:"HiddenBrief",help:"非公開情報と公開条件を項目別に管理"},{id:"events",label:"強制イベント",help:"条件付きイベントを複数登録"},{id:"debug",label:"進行デバッグ",help:"現在地・未達条件・参照情報"},{id:"test",label:"テスト実行",help:"任意ビートから検証"}],Ca={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"シナリオ作者"};function g({title:n,children:c,onClose:a}){return e.jsx("div",{className:"wire-dialog-backdrop",role:"presentation",children:e.jsxs("section",{className:"wire-dialog",role:"dialog","aria-modal":"true","aria-label":n,children:[e.jsxs("header",{className:"wire-dialog-head",children:[e.jsx("h2",{children:n}),e.jsx("button",{type:"button","aria-label":"ダイアログを閉じる",onClick:a,children:"×"})]}),c]})})}function Fe(){const[n,c]=l.useState("cast"),[a,o]=l.useState(null),[b,Ve]=l.useState([{name:"月読ミナト",role:"嘘をつく案内人 / 真相を知る唯一のNPC",rule:"登場条件: Chapter 1で鐘楼に入った後。新規NPC生成は例外扱い。"}]),[B,Ge]=l.useState([{name:"沈黙の鐘楼",rule:"危険度: 高 / 関連人物: 月読ミナト / アクセス条件: 星図鍵を入手"}]),[u,Me]=l.useState([{chapter:"Chapter 2: 星図鍵の欠片",beat:"Beat 2-3: 鐘楼で欠片の由来を聞く",entry:"星図鍵を持っている / ミナトが同行している",exit:"欠片の由来を聞く / 次の目的地「地下天文台」をCanonへ追加",forbidden:"黒幕がミナト本人であることを明示しない"}]),[p,_e]=l.useState([{title:"ミナトの正体",hiddenBrief:"ミナトは黒幕の器。鐘楼の鐘が三度鳴るまで本人も自覚していない。",revealCondition:"Chapter 4到達、かつ信頼値70以上で明示可能。それまでは示唆のみ。"}]),[m,We]=l.useState([{title:"鐘が三度鳴る",trigger:"Chapter 4到達、星図鍵が揃う",body:"鐘楼の鐘が三度鳴り、秘匿された記憶が戻る。"}]),[L,Oe]=l.useState("灯守アキラ"),[V,qe]=l.useState("灯台の記録係 / 失われた航路を知る"),[G,Je]=l.useState("登場条件: 地下天文台の封印を調べた後。候補外NPCは提案止まり。"),[U,Ke]=l.useState("地下天文台"),[M,Qe]=l.useState("危険度: 中 / 関連人物: 灯守アキラ / アクセス条件: 星図鍵の欠片を2つ入手"),[N,Xe]=l.useState("Chapter 3: 地下天文台"),[P,Ye]=l.useState("Beat 3-1: 星図盤を起動する"),[_,Ze]=l.useState("星図鍵の欠片を2つ持っている"),[$,ea]=l.useState("星図盤の起動に成功し、地下水路への入口をCanonへ追加"),[W,aa]=l.useState("黒幕の名前をまだ出さない"),[O,ta]=l.useState("鐘楼の主の正体"),[q,na]=l.useState("鐘楼の主は主人公の未来の姿。"),[J,sa]=l.useState("信頼値80以上、かつChapter 5到達"),[D,ia]=l.useState("地下天文台の崩落"),[K,ca]=l.useState("星図盤の起動に失敗、または3ターン経過"),[Q,la]=l.useState("天井の星図が落下し、強制的に地下水路へ移動する。"),[oa,ra]=l.useState("none"),[X,da]=l.useState("Chapter 2 / Beat 2-3"),[xa,h]=l.useState("複数登録できる設計項目を、テーブル一覧と追加ダイアログで管理します。"),[va,Y]=l.useState("現在: Chapter 2 / Beat 2-3。未達条件: 欠片の由来を聞く。"),[Z,ee]=l.useState("参照中: Canon（星図鍵を入手済み） / HiddenBrief（ミナトの秘密） / Beat禁止事項"),ae=F.findIndex(t=>t.id===n),te=F[ae],r=u[u.length-1],v=p[p.length-1],ha=()=>{Ve(t=>[...t,{name:L,role:V,rule:G}]),h(`Cast「${L}」を候補プールに登録しました。AIは原則として候補からNPCを選びます。`),o(null)},pa=()=>{Ge(t=>[...t,{name:U,rule:M}]),h(`Location「${U}」を候補プールに登録しました。未定義場所は仮扱いまたは生成提案になります。`),o(null)},ua=()=>{const t={chapter:N,beat:P,entry:_,exit:$,forbidden:W};Me(y=>[...y,t]),Y(`現在: ${N} / ${P}。未達条件: ${$}。`),h("Chapter / Beatを追加しました。Exit条件を満たすまでAIは次のビートへ進みません。"),o(null)},ma=()=>{_e(t=>[...t,{title:O,hiddenBrief:q,revealCondition:J}]),h("HiddenBriefと公開条件を保存しました。条件未達の秘密は示唆止まりになります。"),ee("参照中: HiddenBrief（公開条件つき） / Canon / 現在Beatの禁止事項"),o(null)},ya=()=>{We(t=>[...t,{title:D,trigger:K,body:Q}]),h(`条件付き強制イベント「${D}」を登録しました。条件達成時にAIが必ず発火させます。`),o(null)},z=t=>{var ne;ra(t);const y={none:"補正なし。現在のBeat条件を監視しています。",reroute:"誘導イベントを生成して、プレイヤーを鐘楼へ戻します。",clue:"NPCの助言で不足した手がかりを補完します。既存Castを優先使用します。",forced:`条件達成を検知したため、強制イベント「${((ne=m[m.length-1])==null?void 0:ne.title)??"未登録イベント"}」を必ず発火させます。`};h(y[t])},ga=()=>{Y(`テスト開始地点: ${X}。Entry条件は満たした扱いで検証中。`),h("指定したビートからテストセッションを開始しました。条件は満たした扱いにできます。")},ba=()=>{ee(`AI参照状況: HiddenBrief ${p.length}件 / Canon: 星図鍵 / Beat禁止事項: ${(r==null?void 0:r.forbidden)??"未設定"}`),h("作者向けデバッグ情報を更新しました。プレイヤー向けUIでは表示されません。")},Ba=[{label:"Myriale",to:"scenarioRegister"},{label:"ライブラリ",to:"scenarioRegister"},{label:"高度なシナリオ実行"}];return e.jsx(wa,{section:"library",breadcrumbs:Ba,account:Ca,children:e.jsxs("div",{className:"scenario-forge scenario-forge-wizard advanced-scenario-wireframe",children:[e.jsxs("aside",{className:"contract-spine","aria-label":"高度なシナリオ実行の設計項目",children:[e.jsx("strong",{children:"Scenario Director"}),e.jsx("p",{className:"toc-help",children:"複数の候補・条件・Canon・HiddenBriefをテーブルで管理し、追加はダイアログで行います。"}),e.jsx("div",{className:"wizard-step-list",role:"list","aria-label":"設計項目",children:F.map((t,y)=>e.jsxs("button",{className:`spine-row spine-step ${n===t.id?"active":""}`,onClick:()=>c(t.id),"aria-label":`${t.label}へ`,"aria-current":n===t.id?"step":void 0,children:[e.jsxs("span",{children:[String(y+1).padStart(2,"0")," / ",t.label]}),e.jsx("small",{children:t.help})]},t.id))}),e.jsxs("div",{className:"scenario-id",children:[e.jsx("span",{children:"Registered"}),e.jsxs("b",{children:[b.length+B.length+u.length+p.length+m.length," items"]})]})]}),e.jsxs("main",{className:"forge-paper wizard-paper program-driven-main","aria-label":"高度なシナリオ実行エディタ",children:[e.jsx("p",{className:"kicker",children:"Advanced scenario execution / Controlled AI"}),e.jsxs("div",{className:"wizard-progress","aria-label":"設計進捗",children:[e.jsx("span",{children:String(ae+1).padStart(2,"0")}),e.jsx("strong",{children:te.label}),e.jsx("small",{children:te.help})]}),e.jsx("div",{className:"notice",role:"status","data-testid":"advanced-notice",children:xa}),n==="cast"&&e.jsxs("section",{className:"wizard-panel","aria-label":"Cast候補",children:[e.jsx("p",{children:"US-AS01: 人物候補をテーブルに複数登録し、役割・秘密・登場条件をダイアログで追加します。"}),e.jsx("button",{className:"primary",onClick:()=>o("cast"),children:"新規Cast"}),e.jsxs("table",{className:"wire-table","aria-label":"Cast候補テーブル",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"人物名"}),e.jsx("th",{children:"役割・秘密"}),e.jsx("th",{children:"登場条件・生成ルール"})]})}),e.jsx("tbody",{children:b.map(t=>e.jsxs("tr",{children:[e.jsx("td",{children:t.name}),e.jsx("td",{children:t.role}),e.jsx("td",{children:t.rule})]},t.name))})]})]}),n==="locations"&&e.jsxs("section",{className:"wizard-panel","aria-label":"Location候補",children:[e.jsx("p",{children:"US-AS02: 場所候補を一覧化し、雰囲気・危険度・関連人物・アクセス条件を行単位で管理します。"}),e.jsx("button",{className:"primary",onClick:()=>o("location"),children:"新規Location"}),e.jsxs("table",{className:"wire-table","aria-label":"Location候補テーブル",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"場所名"}),e.jsx("th",{children:"条件"})]})}),e.jsx("tbody",{children:B.map(t=>e.jsxs("tr",{children:[e.jsx("td",{children:t.name}),e.jsx("td",{children:t.rule})]},t.name))})]})]}),n==="beats"&&e.jsxs("section",{className:"wizard-panel","aria-label":"ChapterとBeat",children:[e.jsx("p",{children:"US-AS03/04: 章・ビート・Entry/Exit条件・禁止事項を複数行で管理し、重要展開のスキップや早すぎる真相開示を防ぎます。"}),e.jsx("button",{className:"primary",onClick:()=>o("beat"),children:"新規Beat"}),e.jsxs("table",{className:"wire-table","aria-label":"Beatテーブル",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Chapter"}),e.jsx("th",{children:"Beat"}),e.jsx("th",{children:"Entry / Exit"}),e.jsx("th",{children:"禁止事項"})]})}),e.jsx("tbody",{children:u.map(t=>e.jsxs("tr",{children:[e.jsx("td",{children:t.chapter}),e.jsx("td",{children:t.beat}),e.jsxs("td",{children:["Entry: ",t.entry,e.jsx("br",{}),"Exit: ",t.exit]}),e.jsx("td",{children:t.forbidden})]},`${t.chapter}-${t.beat}`))})]})]}),n==="secrets"&&e.jsxs("section",{className:"wizard-panel","aria-label":"HiddenBrief",children:[e.jsx("p",{children:"US-AS05/06: HiddenBriefを秘密ごとに複数登録し、それぞれの公開条件をテーブルで確認します。"}),e.jsx("button",{className:"primary",onClick:()=>o("secret"),children:"新規HiddenBrief"}),e.jsxs("table",{className:"wire-table","aria-label":"HiddenBriefテーブル",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"秘密"}),e.jsx("th",{children:"HiddenBrief"}),e.jsx("th",{children:"公開条件"})]})}),e.jsx("tbody",{children:p.map(t=>e.jsxs("tr",{children:[e.jsx("td",{children:t.title}),e.jsx("td",{children:t.hiddenBrief}),e.jsx("td",{children:t.revealCondition})]},t.title))})]})]}),n==="events"&&e.jsxs("section",{className:"wizard-panel","aria-label":"強制イベント",children:[e.jsx("p",{children:"US-AS10: 特定条件で必ず発生するイベントを複数登録し、山場を逃さないようにします。"}),e.jsx("button",{className:"primary",onClick:()=>o("event"),children:"新規強制イベント"}),e.jsxs("table",{className:"wire-table","aria-label":"強制イベントテーブル",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"イベント名"}),e.jsx("th",{children:"トリガー条件"}),e.jsx("th",{children:"内容"})]})}),e.jsx("tbody",{children:m.map(t=>e.jsxs("tr",{children:[e.jsx("td",{children:t.title}),e.jsx("td",{children:t.trigger}),e.jsx("td",{children:t.body})]},t.title))})]})]}),n==="debug"&&e.jsxs("section",{className:"wizard-panel","aria-label":"進行デバッグ",children:[e.jsx("p",{children:"US-AS07/08/09/12: テーブル登録済みの候補を使って、脱線補正、手がかり補完、現在地、AI参照情報を作者だけが確認・操作できます。"}),e.jsxs("div",{className:"program-controls","aria-label":"補正操作",children:[e.jsxs("div",{className:"button-row",children:[e.jsx("button",{onClick:()=>z("reroute"),children:"誘導イベントを生成"}),e.jsx("button",{onClick:()=>z("clue"),children:"補完イベントを生成"}),e.jsx("button",{className:"primary",onClick:()=>z("forced"),children:"条件付き強制イベントを発火"}),e.jsx("button",{onClick:ba,children:"参照情報を更新"})]}),e.jsxs("p",{className:"program-hint","data-testid":"correction-state",children:["補正状態: ",oa]})]}),e.jsx("p",{"data-testid":"debug-refs",children:Z})]}),n==="test"&&e.jsxs("section",{className:"wizard-panel","aria-label":"テスト実行",children:[e.jsx("p",{children:"US-AS11: 登録済みの任意Chapter / Beatを開始地点としてテストセッションを開始し、条件を満たした扱いにして検証します。"}),e.jsxs("label",{children:["テスト開始地点",e.jsx("input",{"aria-label":"テスト開始地点",value:X,onChange:t=>da(t.target.value)})]}),e.jsx("div",{className:"button-row",children:e.jsx("button",{className:"primary",onClick:ga,children:"この地点からテスト開始"})})]})]}),e.jsxs("aside",{className:"ai-bookmark wizard-summary","aria-label":"実行監督サマリー",children:[e.jsx("h2",{children:"Director State"}),e.jsxs("article",{children:[e.jsx("h3",{children:"登録件数"}),e.jsxs("p",{"data-testid":"summary-counts",children:["Cast ",b.length,"件 / Location ",B.length,"件 / Beat ",u.length,"件 / Secret ",p.length,"件 / Event ",m.length,"件"]})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"候補プール"}),e.jsxs("p",{"data-testid":"summary-cast",children:["Cast: ",b.map(t=>t.name).join("、")]}),e.jsxs("p",{"data-testid":"summary-location",children:["Location: ",B.map(t=>t.name).join("、")]})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"進行制御"}),e.jsxs("p",{"data-testid":"summary-beat",children:[r==null?void 0:r.chapter," / ",r==null?void 0:r.beat]}),e.jsxs("p",{children:["Exit: ",r==null?void 0:r.exit]})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"Secret Gate"}),e.jsxs("p",{"data-testid":"summary-secret",children:[v==null?void 0:v.title,": ",v==null?void 0:v.hiddenBrief]}),e.jsxs("p",{children:["公開条件: ",v==null?void 0:v.revealCondition]})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"Debug"}),e.jsx("p",{"data-testid":"session-state",children:va}),e.jsx("p",{children:Z})]})]}),a==="cast"&&e.jsxs(g,{title:"Castを追加",onClose:()=>o(null),children:[e.jsxs("label",{children:["人物名",e.jsx("input",{"aria-label":"人物名",value:L,onChange:t=>Oe(t.target.value)})]}),e.jsxs("label",{children:["役割・性格・秘密",e.jsx("textarea",{"aria-label":"人物の役割と秘密",value:V,onChange:t=>qe(t.target.value)})]}),e.jsxs("label",{children:["登場条件・生成ルール",e.jsx("textarea",{"aria-label":"人物の登場条件",value:G,onChange:t=>Je(t.target.value)})]}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{onClick:()=>o(null),children:"キャンセル"}),e.jsx("button",{className:"primary",onClick:ha,children:"Castを登録"})]})]}),a==="location"&&e.jsxs(g,{title:"Locationを追加",onClose:()=>o(null),children:[e.jsxs("label",{children:["場所名",e.jsx("input",{"aria-label":"場所名",value:U,onChange:t=>Ke(t.target.value)})]}),e.jsxs("label",{children:["場所の条件",e.jsx("textarea",{"aria-label":"場所の条件",value:M,onChange:t=>Qe(t.target.value)})]}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{onClick:()=>o(null),children:"キャンセル"}),e.jsx("button",{className:"primary",onClick:pa,children:"Locationを登録"})]})]}),a==="beat"&&e.jsxs(g,{title:"Beatを追加",onClose:()=>o(null),children:[e.jsxs("label",{children:["Chapter",e.jsx("input",{"aria-label":"Chapter",value:N,onChange:t=>Xe(t.target.value)})]}),e.jsxs("label",{children:["Beat",e.jsx("input",{"aria-label":"Beat",value:P,onChange:t=>Ye(t.target.value)})]}),e.jsxs("label",{children:["Entry条件",e.jsx("textarea",{"aria-label":"Entry条件",value:_,onChange:t=>Ze(t.target.value)})]}),e.jsxs("label",{children:["Exit条件",e.jsx("textarea",{"aria-label":"Exit条件",value:$,onChange:t=>ea(t.target.value)})]}),e.jsxs("label",{children:["このBeatの禁止事項",e.jsx("textarea",{"aria-label":"禁止事項",value:W,onChange:t=>aa(t.target.value)})]}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{onClick:()=>o(null),children:"キャンセル"}),e.jsx("button",{className:"primary",onClick:ua,children:"Beatを固定"})]})]}),a==="secret"&&e.jsxs(g,{title:"HiddenBriefを追加",onClose:()=>o(null),children:[e.jsxs("label",{children:["秘密の名前",e.jsx("input",{"aria-label":"秘密の名前",value:O,onChange:t=>ta(t.target.value)})]}),e.jsxs("label",{children:["HiddenBrief",e.jsx("textarea",{"aria-label":"HiddenBrief",value:q,onChange:t=>na(t.target.value)})]}),e.jsxs("label",{children:["公開条件",e.jsx("textarea",{"aria-label":"公開条件",value:J,onChange:t=>sa(t.target.value)})]}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{onClick:()=>o(null),children:"キャンセル"}),e.jsx("button",{className:"primary",onClick:ma,children:"非公開情報を保存"})]})]}),a==="event"&&e.jsxs(g,{title:"強制イベントを追加",onClose:()=>o(null),children:[e.jsxs("label",{children:["イベント名",e.jsx("input",{"aria-label":"イベント名",value:D,onChange:t=>ia(t.target.value)})]}),e.jsxs("label",{children:["トリガー条件",e.jsx("textarea",{"aria-label":"トリガー条件",value:K,onChange:t=>ca(t.target.value)})]}),e.jsxs("label",{children:["イベント内容",e.jsx("textarea",{"aria-label":"イベント内容",value:Q,onChange:t=>la(t.target.value)})]}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{onClick:()=>o(null),children:"キャンセル"}),e.jsx("button",{className:"primary",onClick:ya,children:"強制イベントを登録"})]})]})]})})}Fe.__docgenInfo={description:"",methods:[],displayName:"AdvancedScenarioExecutionWireframe"};const Aa={title:"Advanced scenario execution/Wireframe from user stories",component:Fe,parameters:{notes:"docs/user-stories/advanced-scenario-execution-user-stories.md の各ユーザーストーリー（US-AS01〜AS12）を、複数登録を前提にテーブル一覧と追加ダイアログで管理するワイヤーフレームにしたものです。"}},d=async(n,c)=>{await s.click(n.getByRole("button",{name:`${c}へ`}))},w={name:"US-AS01: AIに使ってよい人物候補を定義したい",play:async({canvasElement:n,step:c})=>{const a=x(n);await c("Castテーブルから追加ダイアログを開き、人物候補を複数登録する",async()=>{await i(a.getByRole("table",{name:"Cast候補テーブル"})).toHaveTextContent("月読ミナト"),await s.click(a.getByRole("button",{name:"新規Cast"})),await i(a.getByRole("dialog",{name:"Castを追加"})).toBeVisible(),await s.clear(a.getByLabelText("人物名")),await s.type(a.getByLabelText("人物名"),"灯守アキラ"),await s.click(a.getByRole("button",{name:"Castを登録"})),await i(a.getByTestId("advanced-notice")).toHaveTextContent("候補プールに登録しました"),await i(a.getByRole("table",{name:"Cast候補テーブル"})).toHaveTextContent("灯守アキラ"),await i(a.getByTestId("summary-counts")).toHaveTextContent("Cast 2件")})}},C={name:"US-AS02: 場所候補を管理したい",play:async({canvasElement:n,step:c})=>{const a=x(n);await d(a,"Location候補"),await c("Locationテーブルから追加ダイアログを開き、場所候補を複数登録する",async()=>{await s.click(a.getByRole("button",{name:"新規Location"})),await i(a.getByRole("dialog",{name:"Locationを追加"})).toBeVisible(),await s.clear(a.getByLabelText("場所名")),await s.type(a.getByLabelText("場所名"),"地下天文台"),await s.click(a.getByRole("button",{name:"Locationを登録"})),await i(a.getByTestId("advanced-notice")).toHaveTextContent("未定義場所は仮扱い"),await i(a.getByRole("table",{name:"Location候補テーブル"})).toHaveTextContent("地下天文台"),await i(a.getByTestId("summary-counts")).toHaveTextContent("Location 2件")})}},j={name:"US-AS03: 章・ビート単位で制御したい",play:async({canvasElement:n,step:c})=>{const a=x(n);await d(a,"Chapter / Beat"),await c("Beatテーブルから追加ダイアログを開き、現在のChapterとBeatを追加する",async()=>{await s.click(a.getByRole("button",{name:"新規Beat"})),await s.clear(a.getByLabelText("Chapter")),await s.type(a.getByLabelText("Chapter"),"Chapter 3: 地下天文台"),await s.click(a.getByRole("button",{name:"Beatを固定"})),await i(a.getByTestId("advanced-notice")).toHaveTextContent("次のビートへ進みません"),await i(a.getByRole("table",{name:"Beatテーブル"})).toHaveTextContent("Chapter 3"),await i(a.getByTestId("summary-counts")).toHaveTextContent("Beat 2件")})}},S={name:"US-AS04: ビートごとに必須条件と禁止事項を設定したい",play:async({canvasElement:n,step:c})=>{const a=x(n);await d(a,"Chapter / Beat"),await c("Entry/Exit条件と禁止事項をダイアログで追加し、テーブルで確認する",async()=>{await s.click(a.getByRole("button",{name:"新規Beat"})),await s.clear(a.getByLabelText("禁止事項")),await s.type(a.getByLabelText("禁止事項"),"黒幕の名前をまだ出さない"),await s.click(a.getByRole("button",{name:"Beatを固定"})),await i(a.getByTestId("session-state")).toHaveTextContent("未達条件"),await i(a.getByRole("table",{name:"Beatテーブル"})).toHaveTextContent("黒幕の名前をまだ出さない")})}},T={name:"US-AS05: プレイヤーに見せない裏要約を定義したい",play:async({canvasElement:n,step:c})=>{const a=x(n);await d(a,"HiddenBrief"),await c("HiddenBriefテーブルから追加ダイアログを開き、非公開の真相を項目登録する",async()=>{await s.click(a.getByRole("button",{name:"新規HiddenBrief"})),await s.clear(a.getByLabelText("HiddenBrief")),await s.type(a.getByLabelText("HiddenBrief"),"鐘楼の主は主人公の未来の姿。"),await s.click(a.getByRole("button",{name:"非公開情報を保存"})),await i(a.getByRole("table",{name:"HiddenBriefテーブル"})).toHaveTextContent("未来の姿"),await i(a.getByTestId("advanced-notice")).toHaveTextContent("HiddenBrief")})}},H={name:"US-AS06: 裏要約の情報に公開条件を設定したい",play:async({canvasElement:n,step:c})=>{const a=x(n);await d(a,"HiddenBrief"),await c("公開条件を秘密ごとに設定し、テーブルで条件を確認する",async()=>{await s.click(a.getByRole("button",{name:"新規HiddenBrief"})),await s.clear(a.getByLabelText("公開条件")),await s.type(a.getByLabelText("公開条件"),"信頼値80以上、かつChapter 5到達"),await s.click(a.getByRole("button",{name:"非公開情報を保存"})),await i(a.getByTestId("advanced-notice")).toHaveTextContent("示唆止まり"),await i(a.getByRole("table",{name:"HiddenBriefテーブル"})).toHaveTextContent("信頼値80以上")})}},E={name:"US-AS07: AIが逸脱したら軌道修正してほしい",play:async({canvasElement:n,step:c})=>{const a=x(n);await d(a,"進行デバッグ"),await c("登録済み候補を前提に誘導イベントを生成する",async()=>{await s.click(a.getByRole("button",{name:"誘導イベントを生成"})),await i(a.getByTestId("advanced-notice")).toHaveTextContent("鐘楼へ戻します"),await i(a.getByTestId("correction-state")).toHaveTextContent("reroute")})}},f={name:"US-AS08: 必須情報不足なら補完イベントを出してほしい",play:async({canvasElement:n,step:c})=>{const a=x(n);await d(a,"進行デバッグ"),await c("手がかり不足を補完し、既存Castテーブルを優先使用する",async()=>{await s.click(a.getByRole("button",{name:"補完イベントを生成"})),await i(a.getByTestId("advanced-notice")).toHaveTextContent("既存Castを優先使用"),await i(a.getByTestId("correction-state")).toHaveTextContent("clue")})}},A={name:"US-AS09: 実行中の進行状態を確認したい",play:async({canvasElement:n,step:c})=>{const a=x(n);await d(a,"進行デバッグ"),await c("現在のChapter / Beat / 未達条件を作者向けに可視化する",async()=>{await i(a.getByTestId("session-state")).toHaveTextContent("Chapter 2"),await i(a.getByTestId("session-state")).toHaveTextContent("未達条件")})}},R={name:"US-AS10: 条件で必ず発生するイベントを定義したい",play:async({canvasElement:n,step:c})=>{const a=x(n);await d(a,"強制イベント"),await c("強制イベントをテーブルへ複数登録し、条件達成時に発火対象にする",async()=>{await s.click(a.getByRole("button",{name:"新規強制イベント"})),await s.clear(a.getByLabelText("イベント名")),await s.type(a.getByLabelText("イベント名"),"地下天文台の崩落"),await s.click(a.getByRole("button",{name:"強制イベントを登録"})),await i(a.getByRole("table",{name:"強制イベントテーブル"})).toHaveTextContent("地下天文台の崩落"),await d(a,"進行デバッグ"),await s.click(a.getByRole("button",{name:"条件付き強制イベントを発火"})),await i(a.getByTestId("advanced-notice")).toHaveTextContent("必ず発火")})}},k={name:"US-AS11: 途中のビートからテスト実行したい",play:async({canvasElement:n,step:c})=>{const a=x(n);await d(a,"テスト実行"),await c("登録済みBeatを指定して条件を満たした扱いで開始する",async()=>{await s.clear(a.getByLabelText("テスト開始地点")),await s.type(a.getByLabelText("テスト開始地点"),"Chapter 4 / Beat 4-1"),await s.click(a.getByRole("button",{name:"この地点からテスト開始"})),await i(a.getByTestId("session-state")).toHaveTextContent("Chapter 4 / Beat 4-1"),await i(a.getByTestId("advanced-notice")).toHaveTextContent("テストセッション")})}},I={name:"US-AS12: AIが参照している非公開情報を把握したい",play:async({canvasElement:n,step:c})=>{const a=x(n);await d(a,"進行デバッグ"),await c("HiddenBrief / Canon / 現在Beatの参照状況を登録件数つきで確認する",async()=>{await s.click(a.getByRole("button",{name:"参照情報を更新"})),await i(a.getByTestId("debug-refs")).toHaveTextContent("AI参照状況"),await i(a.getByTestId("debug-refs")).toHaveTextContent("HiddenBrief 1件"),await i(a.getByTestId("advanced-notice")).toHaveTextContent("プレイヤー向けUIでは表示されません")})}};var se,ie,ce;w.parameters={...w.parameters,docs:{...(se=w.parameters)==null?void 0:se.docs,source:{originalSource:`{
  name: 'US-AS01: AIに使ってよい人物候補を定義したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Castテーブルから追加ダイアログを開き、人物候補を複数登録する', async () => {
      await expect(canvas.getByRole('table', {
        name: 'Cast候補テーブル'
      })).toHaveTextContent('月読ミナト');
      await userEvent.click(canvas.getByRole('button', {
        name: '新規Cast'
      }));
      await expect(canvas.getByRole('dialog', {
        name: 'Castを追加'
      })).toBeVisible();
      await userEvent.clear(canvas.getByLabelText('人物名'));
      await userEvent.type(canvas.getByLabelText('人物名'), '灯守アキラ');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Castを登録'
      }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('候補プールに登録しました');
      await expect(canvas.getByRole('table', {
        name: 'Cast候補テーブル'
      })).toHaveTextContent('灯守アキラ');
      await expect(canvas.getByTestId('summary-counts')).toHaveTextContent('Cast 2件');
    });
  }
}`,...(ce=(ie=w.parameters)==null?void 0:ie.docs)==null?void 0:ce.source}}};var le,oe,re;C.parameters={...C.parameters,docs:{...(le=C.parameters)==null?void 0:le.docs,source:{originalSource:`{
  name: 'US-AS02: 場所候補を管理したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, 'Location候補');
    await step('Locationテーブルから追加ダイアログを開き、場所候補を複数登録する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規Location'
      }));
      await expect(canvas.getByRole('dialog', {
        name: 'Locationを追加'
      })).toBeVisible();
      await userEvent.clear(canvas.getByLabelText('場所名'));
      await userEvent.type(canvas.getByLabelText('場所名'), '地下天文台');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Locationを登録'
      }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('未定義場所は仮扱い');
      await expect(canvas.getByRole('table', {
        name: 'Location候補テーブル'
      })).toHaveTextContent('地下天文台');
      await expect(canvas.getByTestId('summary-counts')).toHaveTextContent('Location 2件');
    });
  }
}`,...(re=(oe=C.parameters)==null?void 0:oe.docs)==null?void 0:re.source}}};var de,xe,ve;j.parameters={...j.parameters,docs:{...(de=j.parameters)==null?void 0:de.docs,source:{originalSource:`{
  name: 'US-AS03: 章・ビート単位で制御したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, 'Chapter / Beat');
    await step('Beatテーブルから追加ダイアログを開き、現在のChapterとBeatを追加する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規Beat'
      }));
      await userEvent.clear(canvas.getByLabelText('Chapter'));
      await userEvent.type(canvas.getByLabelText('Chapter'), 'Chapter 3: 地下天文台');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Beatを固定'
      }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('次のビートへ進みません');
      await expect(canvas.getByRole('table', {
        name: 'Beatテーブル'
      })).toHaveTextContent('Chapter 3');
      await expect(canvas.getByTestId('summary-counts')).toHaveTextContent('Beat 2件');
    });
  }
}`,...(ve=(xe=j.parameters)==null?void 0:xe.docs)==null?void 0:ve.source}}};var he,pe,ue;S.parameters={...S.parameters,docs:{...(he=S.parameters)==null?void 0:he.docs,source:{originalSource:`{
  name: 'US-AS04: ビートごとに必須条件と禁止事項を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, 'Chapter / Beat');
    await step('Entry/Exit条件と禁止事項をダイアログで追加し、テーブルで確認する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規Beat'
      }));
      await userEvent.clear(canvas.getByLabelText('禁止事項'));
      await userEvent.type(canvas.getByLabelText('禁止事項'), '黒幕の名前をまだ出さない');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Beatを固定'
      }));
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('未達条件');
      await expect(canvas.getByRole('table', {
        name: 'Beatテーブル'
      })).toHaveTextContent('黒幕の名前をまだ出さない');
    });
  }
}`,...(ue=(pe=S.parameters)==null?void 0:pe.docs)==null?void 0:ue.source}}};var me,ye,ge;T.parameters={...T.parameters,docs:{...(me=T.parameters)==null?void 0:me.docs,source:{originalSource:`{
  name: 'US-AS05: プレイヤーに見せない裏要約を定義したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, 'HiddenBrief');
    await step('HiddenBriefテーブルから追加ダイアログを開き、非公開の真相を項目登録する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規HiddenBrief'
      }));
      await userEvent.clear(canvas.getByLabelText('HiddenBrief'));
      await userEvent.type(canvas.getByLabelText('HiddenBrief'), '鐘楼の主は主人公の未来の姿。');
      await userEvent.click(canvas.getByRole('button', {
        name: '非公開情報を保存'
      }));
      await expect(canvas.getByRole('table', {
        name: 'HiddenBriefテーブル'
      })).toHaveTextContent('未来の姿');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('HiddenBrief');
    });
  }
}`,...(ge=(ye=T.parameters)==null?void 0:ye.docs)==null?void 0:ge.source}}};var be,Be,we;H.parameters={...H.parameters,docs:{...(be=H.parameters)==null?void 0:be.docs,source:{originalSource:`{
  name: 'US-AS06: 裏要約の情報に公開条件を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, 'HiddenBrief');
    await step('公開条件を秘密ごとに設定し、テーブルで条件を確認する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規HiddenBrief'
      }));
      await userEvent.clear(canvas.getByLabelText('公開条件'));
      await userEvent.type(canvas.getByLabelText('公開条件'), '信頼値80以上、かつChapter 5到達');
      await userEvent.click(canvas.getByRole('button', {
        name: '非公開情報を保存'
      }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('示唆止まり');
      await expect(canvas.getByRole('table', {
        name: 'HiddenBriefテーブル'
      })).toHaveTextContent('信頼値80以上');
    });
  }
}`,...(we=(Be=H.parameters)==null?void 0:Be.docs)==null?void 0:we.source}}};var Ce,je,Se;E.parameters={...E.parameters,docs:{...(Ce=E.parameters)==null?void 0:Ce.docs,source:{originalSource:`{
  name: 'US-AS07: AIが逸脱したら軌道修正してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, '進行デバッグ');
    await step('登録済み候補を前提に誘導イベントを生成する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '誘導イベントを生成'
      }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('鐘楼へ戻します');
      await expect(canvas.getByTestId('correction-state')).toHaveTextContent('reroute');
    });
  }
}`,...(Se=(je=E.parameters)==null?void 0:je.docs)==null?void 0:Se.source}}};var Te,He,Ee;f.parameters={...f.parameters,docs:{...(Te=f.parameters)==null?void 0:Te.docs,source:{originalSource:`{
  name: 'US-AS08: 必須情報不足なら補完イベントを出してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, '進行デバッグ');
    await step('手がかり不足を補完し、既存Castテーブルを優先使用する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '補完イベントを生成'
      }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('既存Castを優先使用');
      await expect(canvas.getByTestId('correction-state')).toHaveTextContent('clue');
    });
  }
}`,...(Ee=(He=f.parameters)==null?void 0:He.docs)==null?void 0:Ee.source}}};var fe,Ae,Re;A.parameters={...A.parameters,docs:{...(fe=A.parameters)==null?void 0:fe.docs,source:{originalSource:`{
  name: 'US-AS09: 実行中の進行状態を確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, '進行デバッグ');
    await step('現在のChapter / Beat / 未達条件を作者向けに可視化する', async () => {
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Chapter 2');
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('未達条件');
    });
  }
}`,...(Re=(Ae=A.parameters)==null?void 0:Ae.docs)==null?void 0:Re.source}}};var ke,Ie,Le;R.parameters={...R.parameters,docs:{...(ke=R.parameters)==null?void 0:ke.docs,source:{originalSource:`{
  name: 'US-AS10: 条件で必ず発生するイベントを定義したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, '強制イベント');
    await step('強制イベントをテーブルへ複数登録し、条件達成時に発火対象にする', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '新規強制イベント'
      }));
      await userEvent.clear(canvas.getByLabelText('イベント名'));
      await userEvent.type(canvas.getByLabelText('イベント名'), '地下天文台の崩落');
      await userEvent.click(canvas.getByRole('button', {
        name: '強制イベントを登録'
      }));
      await expect(canvas.getByRole('table', {
        name: '強制イベントテーブル'
      })).toHaveTextContent('地下天文台の崩落');
      await goToPanel(canvas, '進行デバッグ');
      await userEvent.click(canvas.getByRole('button', {
        name: '条件付き強制イベントを発火'
      }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('必ず発火');
    });
  }
}`,...(Le=(Ie=R.parameters)==null?void 0:Ie.docs)==null?void 0:Le.source}}};var Ue,Ne,Pe;k.parameters={...k.parameters,docs:{...(Ue=k.parameters)==null?void 0:Ue.docs,source:{originalSource:`{
  name: 'US-AS11: 途中のビートからテスト実行したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, 'テスト実行');
    await step('登録済みBeatを指定して条件を満たした扱いで開始する', async () => {
      await userEvent.clear(canvas.getByLabelText('テスト開始地点'));
      await userEvent.type(canvas.getByLabelText('テスト開始地点'), 'Chapter 4 / Beat 4-1');
      await userEvent.click(canvas.getByRole('button', {
        name: 'この地点からテスト開始'
      }));
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Chapter 4 / Beat 4-1');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('テストセッション');
    });
  }
}`,...(Pe=(Ne=k.parameters)==null?void 0:Ne.docs)==null?void 0:Pe.source}}};var $e,De,ze;I.parameters={...I.parameters,docs:{...($e=I.parameters)==null?void 0:$e.docs,source:{originalSource:`{
  name: 'US-AS12: AIが参照している非公開情報を把握したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, '進行デバッグ');
    await step('HiddenBrief / Canon / 現在Beatの参照状況を登録件数つきで確認する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '参照情報を更新'
      }));
      await expect(canvas.getByTestId('debug-refs')).toHaveTextContent('AI参照状況');
      await expect(canvas.getByTestId('debug-refs')).toHaveTextContent('HiddenBrief 1件');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('プレイヤー向けUIでは表示されません');
    });
  }
}`,...(ze=(De=I.parameters)==null?void 0:De.docs)==null?void 0:ze.source}}};const Ra=["USAS01DefineCastPool","USAS02ManageLocations","USAS03ControlChaptersAndBeats","USAS04SetBeatConstraints","USAS05DefineHiddenBrief","USAS06GateSecretReveal","USAS07AutoRerouteDrift","USAS08GenerateMissingClue","USAS09ViewProgressState","USAS10TriggerForcedEvent","USAS11StartTestFromBeat","USAS12InspectAiReferences"];export{w as USAS01DefineCastPool,C as USAS02ManageLocations,j as USAS03ControlChaptersAndBeats,S as USAS04SetBeatConstraints,T as USAS05DefineHiddenBrief,H as USAS06GateSecretReveal,E as USAS07AutoRerouteDrift,f as USAS08GenerateMissingClue,A as USAS09ViewProgressState,R as USAS10TriggerForcedEvent,k as USAS11StartTestFromBeat,I as USAS12InspectAiReferences,Ra as __namedExportsOrder,Aa as default};
