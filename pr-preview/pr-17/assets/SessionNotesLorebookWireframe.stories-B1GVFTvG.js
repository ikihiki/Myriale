import{w as i,u as c,e as s}from"./index-C3Z0PGzo.js";import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as d}from"./index-BlmOqGMO.js";import{A as Le}from"./AppChrome-Bf8Q-wkI.js";import{S as Ie}from"./SessionTurn-DWZJ2ukf.js";/* empty css               */import"./index-yBjzXJbu.js";const N=[{id:"person-minato",kind:"person",name:"月読ミナト",aliases:"濡れた外套の人物",details:"年齢不詳。濡れた外套を着ているが足元だけ乾いている。",speechOrAtmosphere:"静かな敬語。主人公の名前を聞き出そうとしない。",relationsOrFacilities:"主人公に警告する協力者候補。銀の鍵を知っている。",stateOrRules:"現在地: 水没した閲覧室 / 感情: 警戒しつつ協力的",firstTurn:"Turn 04",certainty:"Canon"},{id:"location-library",kind:"location",name:"水没した地下図書館",aliases:"星を食べ終えた図書館",details:"王都地下に広がる水没書庫。黒い水が膝まである。",speechOrAtmosphere:"湿った紙、星図灯の反射、遠い咳払い。",relationsOrFacilities:"索引棚、閉じた星座の扉、螺旋階段。",stateOrRules:"禁則: 名前を答えると棚の一部になる。",firstTurn:"Turn 01",certainty:"Canon"},{id:"person-rumor",kind:"person",name:"鐘楼の主",aliases:"未来の主人公という噂",details:"正体は不明。ミナトの言葉から存在だけ示唆された。",speechOrAtmosphere:"未登場。声や口調は未確定。",relationsOrFacilities:"主人公と関係がある可能性。",stateOrRules:"断定禁止。AIは可能性として扱う。",firstTurn:"Turn 09",certainty:"噂"}],Be={name:"霧野しおり",email:"reader@myriale.example",initials:"霧野",role:"プレイヤー"};function ie(){const[n,o]=d.useState(N),[a,x]=d.useState(N[0].id),[le,m]=d.useState("Lorebookは自由メモではなく、Canon/未確定/噂を分けた構造化ノートとしてAIが参照します。"),[B,de]=d.useState(""),[me,pe]=d.useState(["person-minato","location-library"]),[ue,xe]=d.useState(`1) Scenario Lore
2) Lorebook Canon: 月読ミナト / 水没した地下図書館
3) Session State
4) ChapterSummary
5) Recent Turns: 直近6件`),[R,ve]=d.useState("Chapter 1: 水没した地下図書館で銀の鍵を得て、月読ミナトから名前の危険を聞いた。"),[ye,Ce]=d.useState("Canon「王都地下」と新出情報「海底都市」が矛盾する可能性があります。"),[he,be]=d.useState(null),r=n.find(t=>t.id===a)??n[0],ge=n.filter(t=>`${t.name} ${t.aliases}`.includes(B)),j=n.filter(t=>t.certainty==="Canon"),p=t=>{o(l=>l.map(u=>u.id===r.id?{...u,...t}:u))},Te=()=>{const t={id:`person-${n.length+1}`,kind:"person",name:"灯守アキラ",aliases:"灯台の記録係",details:"外見: 煤けた外套、片目に星図レンズ。年齢感は30代。",speechOrAtmosphere:"短く断定的に話す。語尾は「だろう」。",relationsOrFacilities:"地下天文台の記録係。主人公へ螺旋階段の由来を教える。",stateOrRules:"現在地: 地下天文台 / 確定前の提案",firstTurn:"Turn 13",certainty:"未確定"};o(l=>[...l,t]),x(t.id),m("人物ノートを作成しました。構造化項目と初出TurnIdを保存し、検索・参照できます。")},H=()=>{const t={id:`location-${n.length+1}`,kind:"location",name:"地下天文台",aliases:"星図盤の間",details:"種別: ダンジョン / 位置: 螺旋階段の先 / 危険度: 中",speechOrAtmosphere:"乾いた石、古い真鍮、回転する星図盤の低い音。",relationsOrFacilities:"主要施設: 星図盤、観測窓、封印扉。",stateOrRules:"禁則: 星図盤起動前に封印扉を開けない。",firstTurn:"Turn 14",certainty:"未確定"};o(l=>[...l,t]),x(t.id),m("場所ノートを作成しました。以後の描写で位置関係・雰囲気・禁則を参照できます。")},ke=()=>{H(),m("AIが新規地点を検出し、ノート作成候補として提示しました。自動確定はせず、採用/編集/破棄を選べます。")},L=t=>{p({certainty:t}),m(`${r.name}の確定度を「${t}」にしました。Canonは強く参照され、噂は可能性として扱われます。`)},we=()=>{pe(j.map(t=>t.id)),xe(`1) Scenario Lore
2) Lorebook Canon: ${j.map(t=>t.name).join(" / ")}
3) Session State: 現在地・所持品・関係性
4) ChapterSummary: ${R}
5) Recent Turns: 直近6件`),m("次ターンContextをLorebook Canon、Session State、ChapterSummary、Recent Turnsで再構築しました。")},Se=()=>{ve("Chapter 2: 螺旋階段から地下天文台へ移動。銀の鍵は閉じた星座と関係し、ミナトは名前の危険を避けるよう促した。"),m("章境界を場所移動として扱い、ChapterSummaryを生成・更新しました。次の生成で優先参照されます。")},je=()=>{Ce("矛盾候補: 水没した地下図書館の所在地 Canon「王都地下」と、新出発言「海底都市」が競合しています。"),m("整合性チェックで矛盾候補を検出しました。修正の確定はユーザーが行います。")},I=t=>{be(t),m({updateNote:"ノートを更新する判断を記録しました。Canon変更はユーザー確定として扱います。",reviseOutput:"AI出力を修正する判断を記録しました。Canonは変更しません。",keepRumor:"今回の情報を噂として未確定保持しました。AIには断定させません。"}[t])};return e.jsx(Le,{section:"sessions",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"セッション",to:"startSession"},{label:"Lorebook"}],account:Be,children:e.jsxs("div",{className:"scenario-forge scenario-forge-wizard session-lorebook-wireframe",children:[e.jsxs("aside",{className:"contract-spine","aria-label":"Lorebook操作",children:[e.jsx("strong",{children:"Lorebook"}),e.jsx("p",{className:"toc-help",children:"人物・場所をCanon辞書として整備し、長編の参照と圧縮Contextに使います。"}),e.jsxs("div",{className:"wizard-step-list",role:"list","aria-label":"Lorebookアクション",children:[e.jsxs("button",{className:"spine-row spine-step",onClick:Te,"aria-label":"人物ノートを新規作成",children:[e.jsx("span",{children:"人物を作成"}),e.jsx("small",{children:"プロフィール構造化"})]}),e.jsxs("button",{className:"spine-row spine-step",onClick:H,"aria-label":"場所ノートを新規作成",children:[e.jsx("span",{children:"場所を作成"}),e.jsx("small",{children:"地理と雰囲気"})]}),e.jsxs("button",{className:"spine-row spine-step",onClick:ke,"aria-label":"AIに追加候補を提案させる",children:[e.jsx("span",{children:"AI候補提案"}),e.jsx("small",{children:"採用前の候補"})]}),e.jsxs("button",{className:"spine-row spine-step",onClick:we,"aria-label":"次ターンContextを再構築",children:[e.jsx("span",{children:"Context再構築"}),e.jsx("small",{children:"Canon + Summary"})]}),e.jsxs("button",{className:"spine-row spine-step",onClick:je,"aria-label":"整合性チェック",children:[e.jsx("span",{children:"整合性チェック"}),e.jsx("small",{children:"矛盾候補を提示"})]})]}),e.jsxs("div",{className:"scenario-id",children:[e.jsx("span",{children:"Canon Notes"}),e.jsxs("b",{"data-testid":"canon-count",children:[j.length,"件"]})]})]}),e.jsxs("main",{className:"forge-paper wizard-paper program-driven-main","aria-label":"Lorebookノート管理",children:[e.jsx("p",{className:"kicker",children:"Session notes / Structured Lorebook"}),e.jsx("div",{className:"notice",role:"status","data-testid":"lorebook-notice",children:le}),e.jsxs("section",{className:"lorebook-reference-turn","aria-label":"Lorebook参照つきターン",children:[e.jsx(Ie,{ariaLabel:"Lorebook参照ターン",lead:{tone:"player",tag:"YOU",text:"ミナトに銀の鍵と閉じた星座の関係を尋ねる"},narrative:"ミナトはいつもの静かな敬語で答える。『その鍵は出口だけでなく、あなたが忘れた過去も開きます』。AIはCanonの口調・関係性・場所ルールを優先して描写した。",narrativeTag:"AI",narrativeTestId:"lorebook-turn-narrative"}),e.jsx("div",{className:"referenced-notes","aria-label":"このターンで参照されたノート","data-testid":"referenced-notes",children:me.map(t=>{const l=n.find(u=>u.id===t);return l?e.jsx("button",{onClick:()=>x(t),children:l.name},t):null})})]}),e.jsxs("section",{className:"lorebook-layout","aria-label":"ノート一覧と編集",children:[e.jsxs("div",{className:"lorebook-list","aria-label":"ノート一覧",children:[e.jsxs("label",{children:["ノート検索",e.jsx("input",{"aria-label":"ノート検索",value:B,onChange:t=>de(t.target.value),placeholder:"人物・場所名で検索"})]}),ge.map(t=>e.jsxs("button",{className:`note-notification ${r.id===t.id?"active":""}`,onClick:()=>x(t.id),"aria-label":`${t.name}を開く`,children:[e.jsxs("span",{children:[t.kind==="person"?"人物":"場所"," / ",t.certainty]}),e.jsx("strong",{children:t.name}),e.jsxs("small",{children:[t.aliases," · ",t.firstTurn]})]},t.id))]}),e.jsxs("article",{className:"lorebook-editor","aria-label":"ノート編集","data-testid":"note-editor",children:[e.jsxs("header",{children:[e.jsx("span",{children:r.kind==="person"?"人物ノート":"場所ノート"}),e.jsx("h2",{children:r.name}),e.jsxs("p",{children:[r.firstTurn," 初出 / 確定度: ",e.jsx("b",{children:r.certainty})]})]}),e.jsxs("div",{className:"lorebook-fields",children:[e.jsxs("label",{children:["表示名",e.jsx("input",{"aria-label":"表示名",value:r.name,onChange:t=>p({name:t.target.value})})]}),e.jsxs("label",{children:["別名",e.jsx("input",{"aria-label":"別名",value:r.aliases,onChange:t=>p({aliases:t.target.value})})]}),e.jsxs("label",{children:["外見・種別・詳細",e.jsx("textarea",{"aria-label":"外見・種別・詳細",value:r.details,onChange:t=>p({details:t.target.value})})]}),e.jsxs("label",{children:["口調または雰囲気",e.jsx("textarea",{"aria-label":"口調または雰囲気",value:r.speechOrAtmosphere,onChange:t=>p({speechOrAtmosphere:t.target.value})})]}),e.jsxs("label",{children:["関係性または施設",e.jsx("textarea",{"aria-label":"関係性または施設",value:r.relationsOrFacilities,onChange:t=>p({relationsOrFacilities:t.target.value})})]}),e.jsxs("label",{children:["現在状態または禁則",e.jsx("textarea",{"aria-label":"現在状態または禁則",value:r.stateOrRules,onChange:t=>p({stateOrRules:t.target.value})})]})]}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{className:"primary",onClick:()=>L("Canon"),children:"Canonにする"}),e.jsx("button",{onClick:()=>L("未確定"),children:"未確定にする"}),e.jsx("button",{onClick:()=>L("噂"),children:"噂にする"})]})]})]})]}),e.jsxs("aside",{className:"ai-bookmark wizard-summary","aria-label":"Lorebook Context",children:[e.jsx("h2",{children:"Context"}),e.jsxs("article",{children:[e.jsx("h3",{children:"Context Stack"}),e.jsx("pre",{className:"context-stack","data-testid":"context-stack",children:ue})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"ChapterSummary"}),e.jsx("p",{"data-testid":"chapter-summary",children:R}),e.jsx("button",{onClick:Se,children:"章要約を生成"})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"矛盾チェック"}),e.jsx("p",{"data-testid":"consistency-issue",children:ye}),e.jsxs("div",{className:"button-row exception-actions",children:[e.jsx("button",{onClick:()=>I("updateNote"),children:"ノートを更新"}),e.jsx("button",{onClick:()=>I("reviseOutput"),children:"AI出力を修正"}),e.jsx("button",{onClick:()=>I("keepRumor"),children:"噂として保持"})]}),e.jsxs("p",{"data-testid":"issue-action",children:["判断: ",he??"未選択"]})]})]})]})})}ie.__docgenInfo={description:"",methods:[],displayName:"SessionNotesLorebookWireframe"};const Oe={title:"Session notes Lorebook/Wireframe from user stories",component:ie,parameters:{notes:"docs/user-stories/session-notes-lorebook-user-stories.md の各ユーザーストーリー（US-L01〜L10）を、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。"}},v={name:"US-L01: 人物ノートに詳細情報を登録したい",play:async({canvasElement:n,step:o})=>{const a=i(n);await o("人物ノートを新規作成し、構造化されたプロフィールを保存する",async()=>{await c.click(a.getByRole("button",{name:"人物ノートを新規作成"})),await s(a.getByTestId("note-editor")).toHaveTextContent("灯守アキラ"),await s(a.getByLabelText("外見・種別・詳細")).toHaveValue(s.stringContaining("星図レンズ")),await s(a.getByTestId("lorebook-notice")).toHaveTextContent("人物ノートを作成")})}},y={name:"US-L02: 場所ノートに詳細情報を登録したい",play:async({canvasElement:n,step:o})=>{const a=i(n);await o("場所ノートを新規作成し、位置関係・雰囲気・禁則を保存する",async()=>{await c.click(a.getByRole("button",{name:"場所ノートを新規作成"})),await s(a.getByTestId("note-editor")).toHaveTextContent("地下天文台"),await s(a.getByLabelText("現在状態または禁則")).toHaveValue(s.stringContaining("封印扉")),await s(a.getByTestId("lorebook-notice")).toHaveTextContent("場所ノートを作成")})}},C={name:"US-L03: Canonと未確定情報を分けて管理したい",play:async({canvasElement:n,step:o})=>{const a=i(n);await o("ノートの確定度を噂へ変更し、AIに断定させない扱いにする",async()=>{await c.click(a.getByRole("button",{name:"噂にする"})),await s(a.getByTestId("note-editor")).toHaveTextContent("噂"),await s(a.getByTestId("lorebook-notice")).toHaveTextContent("可能性として扱われます")})}},h={name:"US-L04: AIにLorebookを参照して語ってほしい",play:async({canvasElement:n,step:o})=>{const a=i(n);await o("ターン内に参照された人物・場所ノートを表示し、Canonを優先してNarrativeを生成する",async()=>{await s(a.getByTestId("lorebook-turn-narrative")).toHaveTextContent("Canon"),await s(a.getByTestId("referenced-notes")).toHaveTextContent("月読ミナト"),await s(a.getByTestId("referenced-notes")).toHaveTextContent("水没した地下図書館")})}},b={name:"US-L05: 矛盾しそうなとき勝手に変更せず確認してほしい",play:async({canvasElement:n,step:o})=>{const a=i(n);await o("矛盾候補を確認し、噂として保持する判断をユーザーが行う",async()=>{await c.click(a.getByRole("button",{name:"整合性チェック"})),await s(a.getByTestId("consistency-issue")).toHaveTextContent("矛盾候補"),await c.click(a.getByRole("button",{name:"噂として保持"})),await s(a.getByTestId("issue-action")).toHaveTextContent("keepRumor"),await s(a.getByTestId("lorebook-notice")).toHaveTextContent("断定させません")})}},g={name:"US-L06: AIに追加候補を提案してほしい",play:async({canvasElement:n,step:o})=>{const a=i(n);await o("AIが新規地点を検出して、採用前のノート作成候補を提示する",async()=>{await c.click(a.getByRole("button",{name:"AIに追加候補を提案させる"})),await s(a.getByTestId("note-editor")).toHaveTextContent("地下天文台"),await s(a.getByTestId("lorebook-notice")).toHaveTextContent("自動確定はせず")})}},T={name:"US-L07: Lorebookを圧縮コンテキストとして使いたい",play:async({canvasElement:n,step:o})=>{const a=i(n);await o("Lorebook Canon・Session State・ChapterSummary・Recent TurnsでContextを再構築する",async()=>{await c.click(a.getByRole("button",{name:"次ターンContextを再構築"})),await s(a.getByTestId("context-stack")).toHaveTextContent("Lorebook Canon"),await s(a.getByTestId("context-stack")).toHaveTextContent("Recent Turns"),await s(a.getByTestId("lorebook-notice")).toHaveTextContent("再構築")})}},k={name:"US-L08: 章単位で要約を生成・更新したい",play:async({canvasElement:n,step:o})=>{const a=i(n);await o("章境界をもとにChapterSummaryを生成し、次回生成で優先参照する",async()=>{await c.click(a.getByRole("button",{name:"章要約を生成"})),await s(a.getByTestId("chapter-summary")).toHaveTextContent("Chapter 2"),await s(a.getByTestId("lorebook-notice")).toHaveTextContent("優先参照")})}},w={name:"US-L09: 参照しているノートをUIで可視化したい",play:async({canvasElement:n,step:o})=>{const a=i(n);await o("参照ノートのチップから該当ノート編集へ移動する",async()=>{await c.click(a.getByRole("button",{name:"水没した地下図書館"})),await s(a.getByTestId("note-editor")).toHaveTextContent("水没した地下図書館"),await s(a.getByTestId("note-editor")).toHaveTextContent("場所ノート")})}},S={name:"US-L10: ノートと要約の整合性チェックをしたい",play:async({canvasElement:n,step:o})=>{const a=i(n);await o("整合性チェックで矛盾候補を提示し、修正確定はユーザーに委ねる",async()=>{await c.click(a.getByRole("button",{name:"整合性チェック"})),await s(a.getByTestId("consistency-issue")).toHaveTextContent("王都地下"),await s(a.getByTestId("lorebook-notice")).toHaveTextContent("ユーザーが行います")})}};var U,f,A;v.parameters={...v.parameters,docs:{...(U=v.parameters)==null?void 0:U.docs,source:{originalSource:`{
  name: 'US-L01: 人物ノートに詳細情報を登録したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('人物ノートを新規作成し、構造化されたプロフィールを保存する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '人物ノートを新規作成'
      }));
      await expect(canvas.getByTestId('note-editor')).toHaveTextContent('灯守アキラ');
      await expect(canvas.getByLabelText('外見・種別・詳細')).toHaveValue(expect.stringContaining('星図レンズ'));
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('人物ノートを作成');
    });
  }
}`,...(A=(f=v.parameters)==null?void 0:f.docs)==null?void 0:A.source}}};var E,O,$;y.parameters={...y.parameters,docs:{...(E=y.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: 'US-L02: 場所ノートに詳細情報を登録したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('場所ノートを新規作成し、位置関係・雰囲気・禁則を保存する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '場所ノートを新規作成'
      }));
      await expect(canvas.getByTestId('note-editor')).toHaveTextContent('地下天文台');
      await expect(canvas.getByLabelText('現在状態または禁則')).toHaveValue(expect.stringContaining('封印扉'));
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('場所ノートを作成');
    });
  }
}`,...($=(O=y.parameters)==null?void 0:O.docs)==null?void 0:$.source}}};var F,z,V;C.parameters={...C.parameters,docs:{...(F=C.parameters)==null?void 0:F.docs,source:{originalSource:`{
  name: 'US-L03: Canonと未確定情報を分けて管理したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ノートの確定度を噂へ変更し、AIに断定させない扱いにする', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '噂にする'
      }));
      await expect(canvas.getByTestId('note-editor')).toHaveTextContent('噂');
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('可能性として扱われます');
    });
  }
}`,...(V=(z=C.parameters)==null?void 0:z.docs)==null?void 0:V.source}}};var _,P,W;h.parameters={...h.parameters,docs:{...(_=h.parameters)==null?void 0:_.docs,source:{originalSource:`{
  name: 'US-L04: AIにLorebookを参照して語ってほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ターン内に参照された人物・場所ノートを表示し、Canonを優先してNarrativeを生成する', async () => {
      await expect(canvas.getByTestId('lorebook-turn-narrative')).toHaveTextContent('Canon');
      await expect(canvas.getByTestId('referenced-notes')).toHaveTextContent('月読ミナト');
      await expect(canvas.getByTestId('referenced-notes')).toHaveTextContent('水没した地下図書館');
    });
  }
}`,...(W=(P=h.parameters)==null?void 0:P.docs)==null?void 0:W.source}}};var D,G,M;b.parameters={...b.parameters,docs:{...(D=b.parameters)==null?void 0:D.docs,source:{originalSource:`{
  name: 'US-L05: 矛盾しそうなとき勝手に変更せず確認してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('矛盾候補を確認し、噂として保持する判断をユーザーが行う', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '整合性チェック'
      }));
      await expect(canvas.getByTestId('consistency-issue')).toHaveTextContent('矛盾候補');
      await userEvent.click(canvas.getByRole('button', {
        name: '噂として保持'
      }));
      await expect(canvas.getByTestId('issue-action')).toHaveTextContent('keepRumor');
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('断定させません');
    });
  }
}`,...(M=(G=b.parameters)==null?void 0:G.docs)==null?void 0:M.source}}};var Y,q,J;g.parameters={...g.parameters,docs:{...(Y=g.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  name: 'US-L06: AIに追加候補を提案してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('AIが新規地点を検出して、採用前のノート作成候補を提示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに追加候補を提案させる'
      }));
      await expect(canvas.getByTestId('note-editor')).toHaveTextContent('地下天文台');
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('自動確定はせず');
    });
  }
}`,...(J=(q=g.parameters)==null?void 0:q.docs)==null?void 0:J.source}}};var K,Q,X;T.parameters={...T.parameters,docs:{...(K=T.parameters)==null?void 0:K.docs,source:{originalSource:`{
  name: 'US-L07: Lorebookを圧縮コンテキストとして使いたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Lorebook Canon・Session State・ChapterSummary・Recent TurnsでContextを再構築する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '次ターンContextを再構築'
      }));
      await expect(canvas.getByTestId('context-stack')).toHaveTextContent('Lorebook Canon');
      await expect(canvas.getByTestId('context-stack')).toHaveTextContent('Recent Turns');
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('再構築');
    });
  }
}`,...(X=(Q=T.parameters)==null?void 0:Q.docs)==null?void 0:X.source}}};var Z,ee,te;k.parameters={...k.parameters,docs:{...(Z=k.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  name: 'US-L08: 章単位で要約を生成・更新したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('章境界をもとにChapterSummaryを生成し、次回生成で優先参照する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '章要約を生成'
      }));
      await expect(canvas.getByTestId('chapter-summary')).toHaveTextContent('Chapter 2');
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('優先参照');
    });
  }
}`,...(te=(ee=k.parameters)==null?void 0:ee.docs)==null?void 0:te.source}}};var ae,ne,se;w.parameters={...w.parameters,docs:{...(ae=w.parameters)==null?void 0:ae.docs,source:{originalSource:`{
  name: 'US-L09: 参照しているノートをUIで可視化したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('参照ノートのチップから該当ノート編集へ移動する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '水没した地下図書館'
      }));
      await expect(canvas.getByTestId('note-editor')).toHaveTextContent('水没した地下図書館');
      await expect(canvas.getByTestId('note-editor')).toHaveTextContent('場所ノート');
    });
  }
}`,...(se=(ne=w.parameters)==null?void 0:ne.docs)==null?void 0:se.source}}};var oe,re,ce;S.parameters={...S.parameters,docs:{...(oe=S.parameters)==null?void 0:oe.docs,source:{originalSource:`{
  name: 'US-L10: ノートと要約の整合性チェックをしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('整合性チェックで矛盾候補を提示し、修正確定はユーザーに委ねる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '整合性チェック'
      }));
      await expect(canvas.getByTestId('consistency-issue')).toHaveTextContent('王都地下');
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('ユーザーが行います');
    });
  }
}`,...(ce=(re=S.parameters)==null?void 0:re.docs)==null?void 0:ce.source}}};const $e=["USL01CreatePersonNote","USL02CreateLocationNote","USL03SeparateCanonTentativeRumor","USL04AiReferencesLorebook","USL05ResolveConflictByUserDecision","USL06AiSuggestsNoteCandidates","USL07RebuildCompressedContext","USL08GenerateChapterSummary","USL09ShowReferencedNotes","USL10RunConsistencyCheck"];export{v as USL01CreatePersonNote,y as USL02CreateLocationNote,C as USL03SeparateCanonTentativeRumor,h as USL04AiReferencesLorebook,b as USL05ResolveConflictByUserDecision,g as USL06AiSuggestsNoteCandidates,T as USL07RebuildCompressedContext,k as USL08GenerateChapterSummary,w as USL09ShowReferencedNotes,S as USL10RunConsistencyCheck,$e as __namedExportsOrder,Oe as default};
