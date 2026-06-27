import{w as o,e as s,u as B}from"./index-C3Z0PGzo.js";import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as y}from"./index-BlmOqGMO.js";import{A as ne,n as se,S as R}from"./AppChrome-DsxVHE4T.js";/* empty css               */import"./index-yBjzXJbu.js";const l=r=>r.turns.length,j=[{id:"SES-2087",scenarioTitle:"星喰いの地下図書館",genre:"ダークファンタジー探索譚",hero:"エル / 記憶を失った写字生",playtime:"3時間12分",lastPlayed:"2日前",recap:"あなたは水没した閲覧室で目覚め、銀の鍵と「名前を答えるな」という警告を手にした。書架の奥の人物と接触し、螺旋階段の先で星図灯の在処を探している。",context:["Scenario Lore（星座=魔法体系、死者の名前は禁忌）","Lorebook Canon（銀の鍵 / 書架の奥の人物 / 螺旋階段）","Session State（現在地: 螺旋階段の踊り場、所持品: 銀の鍵）","全Turnログ（Turn 1-6）と要約"],changes:[{kind:"Scenario",detail:"作者がイントロのトーンを「静かで不穏」へ微調整（既存セッションには未適用）。"},{kind:"AI設定",detail:"Narrative生成方針が「描写多め」に更新。再開後の新しいTurnから反映される。"}],turns:[{id:1,turnTitle:"水没した閲覧室で目覚める",narrative:"あなたは水没した閲覧室で目を覚ます。膝まで届く黒い水の上を星図灯の光が揺れ、崩れた書架の奥から誰かの咳払いが聞こえる。懐には濡れていない銀の鍵が残されていた。"},{id:2,turnTitle:"銀の鍵を確かめる",playerInput:"懐の銀の鍵を取り出して刻印を見る",narrative:"鍵の柄には、星座ではなく空白の円が刻まれていた。指でなぞると、水面にまだ開いていない扉の輪郭が一瞬だけ浮かび、すぐに黒い波紋へ戻る。"},{id:3,turnTitle:"周囲を警戒する",playerInput:"音を立てないように周囲を調べる",narrative:"倒れた書架の陰に、濡れていない足跡が続いている。足跡は奥の閲覧机で途切れ、その上には新しいインクで「名前を答えるな」とだけ書かれていた。"},{id:4,turnTitle:"書架の奥の人物に声をかける",playerInput:"咳払いのした方へ声をかける",narrative:"濡れた外套の人物が、半壊した索引棚の影から姿を見せる。「鍵を持つ者がまた来たか」と言い、あなたの名前ではなく、あなたが失ったはずの記憶を尋ねてくる。"},{id:5,turnTitle:"名前を伏せて道を尋ねる",playerInput:"名前は答えず、星図灯の在処を尋ねる",narrative:"人物は短く笑い、「賢明だ」と呟いた。螺旋階段を指し示し、最も高い踊り場でだけ星図灯が本当の名を映すと教える。ただし、灯は嘘をついた者の声を覚えているという。"},{id:6,turnTitle:"螺旋階段の踊り場に立つ",playerInput:"螺旋階段をのぼって踊り場へ向かう",narrative:"螺旋階段の踊り場で星図灯がひとつ灯り、まだ名を知らない扉の輪郭が水面に浮かぶ。あなたの次の一手を待つように、地下図書館は静かに息を潜めている。"}]},{id:"SES-2042",scenarioTitle:"灰の駅と宛名のない切符",genre:"終末ロードムービー",hero:"アオイ / 灰の駅で目覚めた旅人",playtime:"54分",lastPlayed:"先週",recap:"あなたは灰の降る駅で宛名のない切符を握りしめ、朝が来ない荒野を渡る列車を待っている。改札の老人から、次の町の名前は切符だけが覚えていると聞かされた。",context:["Scenario Lore（朝の来ない荒野、切符が記憶を持つ）","Lorebook Canon（宛名のない切符 / 改札の老人）","Session State（現在地: 灰の駅ホーム、所持品: 切符）","全Turnログ（Turn 1-3）と要約"],changes:[],turns:[{id:1,turnTitle:"灰の降る駅で目覚める",narrative:"あなたは灰の降る駅のベンチで目を覚ます。手のなかには宛名のない切符が一枚。時刻表の文字はすべて滲み、朝が来ないまま空だけが薄白く濁っている。"},{id:2,turnTitle:"改札の老人に尋ねる",playerInput:"改札にいる老人に、この切符の行き先を尋ねる",narrative:"老人は切符を一瞥し、「宛名は乗る者が決めるんじゃない、切符が覚えてるのさ」と言う。次の町の名前は、列車が走り出すまで誰にも読めないらしい。"},{id:3,turnTitle:"ホームで列車を待つ",playerInput:"ホームの端で列車が来るのを待つ",narrative:"遠くで汽笛が一度だけ鳴り、灰がいっそう濃くなる。切符の宛名欄に、まだ読めない文字がゆっくりと滲み始めていた。"}]}],ie={name:"霧野しおり",email:"reader@myriale.example",initials:"霧野",role:"プレイヤー"};function X(){const[r,i]=y.useState("list"),[a,p]=y.useState(null),[Z,m]=y.useState("中断中のSession一覧です。再開したいSessionを選ぶと、最終状態から再開できます。"),n=y.useMemo(()=>j.find(t=>t.id===a)??null,[a]),I=t=>{p(t.id),i("confirm"),m(`「${t.scenarioTitle}」を再開します。最終状態（Turn ${l(t)}）から続きを遊べます。再開前にあらすじと変更点を確認してください。`)},ee=()=>{i("list"),m("中断中のSession一覧へ戻りました。別のSessionを選んで再開できます。")},C=()=>{m("SessionをActiveに復帰し、AIコンテキストとすべてのTurnログを復元しました。プレイ画面（Session play dialogue）へ移動します。"),se(R.playSession)},ae=()=>{i("readonly"),m("ReadOnlyモードで開きました。再開せずにこれまでのストーリーを読み返せます。Session状態はSuspendedのままです。")},te=[{label:"Myriale",to:"scenarioRegister"},{label:"セッション",to:"startSession"},{label:n?`${n.scenarioTitle} を再開`:"中断中のセッション"}],b=r==="readonly"?"Suspended (ReadOnly)":"Suspended";return e.jsx(ne,{section:"sessions",breadcrumbs:te,account:ie,children:e.jsxs("div",{className:"scenario-forge scenario-forge-wizard session-resume-wireframe",children:[e.jsxs("aside",{className:"contract-spine","aria-label":"中断中のセッション一覧",children:[e.jsx("strong",{children:"Suspended Sessions"}),e.jsx("p",{className:"toc-help",children:"途中で中断したSessionの一覧です。選ぶと再開前の確認画面に進みます。"}),e.jsx("div",{className:"wizard-step-list",role:"list","aria-label":"中断中セッション",children:j.map(t=>e.jsxs("button",{className:`spine-row spine-step ${a===t.id?"active":""}`,onClick:()=>I(t),"aria-label":`${t.scenarioTitle} を選択`,"aria-current":a===t.id?"step":void 0,"data-testid":`suspended-${t.id}`,children:[e.jsx("span",{children:t.scenarioTitle}),e.jsxs("small",{children:["Turn ",l(t)," / ",t.lastPlayed]})]},t.id))}),e.jsxs("div",{className:"scenario-id",children:[e.jsx("span",{children:"Session state"}),e.jsx("b",{"data-testid":"session-state",children:b})]})]}),e.jsxs("main",{className:"forge-paper wizard-paper","aria-label":"セッション再開ワイヤーフレーム",children:[e.jsx("p",{className:"kicker",children:"Session resume / Continue your story"}),e.jsx("div",{className:"notice",role:"status","data-testid":"resume-notice",children:Z}),r==="list"&&e.jsxs("section",{className:"wizard-panel","aria-label":"中断中のセッション",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"中断したSessionを最終状態から再開できます。"}),"再開したいSessionを選ぶと、あらすじ・進行度・注意点を確認してから続きを始められます。"]}),e.jsx("div",{className:"resume-card-list","data-testid":"session-list",children:j.map(t=>e.jsxs("article",{className:"resume-card","data-testid":`session-card-${t.id}`,children:[e.jsxs("span",{children:["Suspended / ",t.id]}),e.jsx("h2",{children:t.scenarioTitle}),e.jsxs("p",{children:[t.genre," / 主人公: ",t.hero]}),e.jsxs("p",{className:"resume-progress",children:["進行度: Turn ",l(t)," ・ プレイ時間 ",t.playtime," ・ 最終プレイ ",t.lastPlayed]}),e.jsxs("button",{className:"primary",onClick:()=>I(t),children:[t.scenarioTitle,"を再開"]})]},t.id))})]}),n&&r==="confirm"&&e.jsxs("section",{className:"wizard-panel","aria-label":"再開前の確認",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"再開前にこれまでの状況と注意点を確認します。"}),"AI要約のあらすじ、進行度、復元されるAIコンテキスト、中断中の変更点を見てから再開できます。"]}),e.jsxs("article",{className:"resume-card","data-testid":"recap",children:[e.jsx("h2",{children:"これまでのあらすじ（AI要約）"}),e.jsx("p",{children:n.recap})]}),e.jsxs("dl",{className:"resume-progress-grid","data-testid":"progress",children:[e.jsxs("div",{children:[e.jsx("dt",{children:"進行度（ターン数）"}),e.jsxs("dd",{children:["Turn ",l(n)]})]}),e.jsxs("div",{children:[e.jsx("dt",{children:"プレイ時間"}),e.jsx("dd",{children:n.playtime})]}),e.jsxs("div",{children:[e.jsx("dt",{children:"最終プレイ"}),e.jsx("dd",{children:n.lastPlayed})]})]}),e.jsxs("article",{className:"resume-card","data-testid":"context",children:[e.jsx("h2",{children:"復元されるAIコンテキスト"}),e.jsx("p",{children:"食い違いを防ぐため、再開時に以下の文脈を復元します。"}),e.jsx("ul",{children:n.context.map(t=>e.jsx("li",{children:t},t))})]}),e.jsxs("article",{className:`resume-card resume-changes ${n.changes.length===0?"no-change":""}`,"data-testid":"changes",children:[e.jsx("h2",{children:"再開前の注意点"}),n.changes.length===0?e.jsx("p",{children:"中断中にScenarioやAI設定の変更はありません。前回と同じ条件で再開できます。"}):e.jsx("ul",{children:n.changes.map(t=>e.jsxs("li",{children:[e.jsxs("strong",{children:[t.kind,"変更:"]})," ",t.detail]},`${t.kind}-${t.detail}`))})]}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{onClick:ee,children:"一覧へ戻る"}),e.jsx("button",{onClick:ae,"data-testid":"readonly-button",children:"再開せずに読み返す（ReadOnly）"}),e.jsx("button",{className:"primary",onClick:C,"data-testid":"resume-button",children:"確認したので再開する（プレイ画面へ）"})]})]}),n&&r==="readonly"&&e.jsxs("section",{className:"wizard-panel","aria-label":"ReadOnly閲覧",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"ReadOnlyモードで表示しています。"}),"再開せずに、これまでの全Turn（Turn 1〜",l(n),"）を読み返せます。入力欄は無く、Session状態はSuspendedのまま変化しません。"]}),e.jsxs("article",{className:"resume-card","data-testid":"recap",children:[e.jsx("h2",{children:"これまでのあらすじ（AI要約）"}),e.jsx("p",{children:n.recap})]}),e.jsx("div",{className:"resume-restored-log readonly","aria-label":`全Turnログ（Turn 1〜${l(n)}）`,"data-testid":"restored-log",children:n.turns.map(t=>e.jsxs("article",{className:`resume-turn ${t.id===l(n)?"latest":""}`,"aria-label":`Turn ${String(t.id).padStart(2,"0")}`,"data-testid":`restored-turn-${t.id}`,children:[e.jsxs("div",{className:"resume-turn-heading",children:[e.jsxs("span",{children:["Turn ",String(t.id).padStart(2,"0")]}),e.jsx("h3",{children:t.turnTitle})]}),t.playerInput&&e.jsxs("p",{className:"resume-turn-input",children:[e.jsx("span",{className:"sr-only",children:"プレイヤーの入力: "}),"⟶ ",t.playerInput]}),e.jsx("p",{className:"resume-turn-narrative",children:t.narrative})]},t.id))}),e.jsx("p",{className:"readonly-note","data-testid":"readonly-note",children:"ReadOnly: 選択肢や入力は無効です。再開すると続きから操作できます。"}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{onClick:()=>I(n),children:"再開の確認へ戻る"}),e.jsx("button",{className:"primary",onClick:C,"data-testid":"resume-button",children:"読み返したので再開する（プレイ画面へ）"})]})]})]}),e.jsxs("aside",{className:"ai-bookmark wizard-summary","aria-label":"セッション状態サマリー",children:[e.jsx("h2",{children:"Session"}),e.jsxs("article",{children:[e.jsx("h3",{children:"状態"}),e.jsx("p",{"data-testid":"summary-state",children:b}),e.jsx("p",{children:n?n.id:"未選択"})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"Scenario"}),e.jsx("p",{"data-testid":"summary-scenario",children:n?n.scenarioTitle:"一覧から選択してください"}),e.jsx("p",{children:n?n.genre:""})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"進行度"}),e.jsx("p",{"data-testid":"summary-progress",children:n?`Turn ${l(n)} / ${n.playtime}`:"—"})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"主人公"}),e.jsx("p",{children:n?n.hero:"—"})]})]})]})})}X.__docgenInfo={description:"",methods:[],displayName:"SessionResumeWireframe"};const ye={title:"Session resume/Wireframe from user stories",component:X,parameters:{notes:"docs/user-stories/session-resume.md の各ユーザーストーリー（US-R01〜R08）を、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。"}},c="星喰いの地下図書館",re="灰の駅と宛名のない切符",d=async(r,i)=>{await B.click(r.getByRole("button",{name:`${i}を再開`}))},u={name:"US-R01: 中断したセッションを再開したい",play:async({canvasElement:r,step:i})=>{const a=o(r);await i("中断中のSession一覧が表示され、Suspended状態であることが分かる",async()=>{await s(a.getByRole("region",{name:"中断中のセッション"})).toBeVisible(),await s(a.getByTestId("session-list")).toHaveTextContent(c),await s(a.getByTestId("session-state")).toHaveTextContent("Suspended")}),await i("Sessionを選ぶと、最終状態から再開できることが示される",async()=>{await d(a,c),await s(a.getByTestId("resume-notice")).toHaveTextContent("最終状態（Turn 6）から続きを遊べます"),await s(a.getByRole("region",{name:"再開前の確認"})).toBeVisible(),await s(a.getByTestId("summary-scenario")).toHaveTextContent(c)})}},x={name:"US-R02: 再開前に前回のあらすじを確認したい",play:async({canvasElement:r,step:i})=>{const a=o(r);await d(a,c),await i("AI要約された「これまでのあらすじ」が表示される",async()=>{await s(a.getByTestId("recap")).toHaveTextContent("これまでのあらすじ（AI要約）"),await s(a.getByTestId("recap")).toHaveTextContent("水没した閲覧室で目覚め、銀の鍵")})}},S={name:"US-R03: セッションの進行度を確認したい",play:async({canvasElement:r,step:i})=>{const a=o(r);await d(a,c),await i("ターン数とプレイ時間が進行度として表示される",async()=>{await s(a.getByTestId("progress")).toHaveTextContent("Turn 6"),await s(a.getByTestId("progress")).toHaveTextContent("3時間12分"),await s(a.getByTestId("summary-progress")).toHaveTextContent("Turn 6 / 3時間12分")})}},v={name:"US-R04: AIが文脈を理解した状態で再開したい",play:async({canvasElement:r,step:i})=>{const a=o(r);await d(a,c),await i("再開時に復元されるAIコンテキストの内訳が示される",async()=>{await s(a.getByTestId("context")).toHaveTextContent("復元されるAIコンテキスト"),await s(a.getByTestId("context")).toHaveTextContent("Lorebook Canon"),await s(a.getByTestId("context")).toHaveTextContent("Session State（現在地: 螺旋階段の踊り場")})}},T={name:"US-R05: 再開前に注意点を確認したい",play:async({canvasElement:r,step:i})=>{const a=o(r);await d(a,c),await i("中断中に起きたScenario / AI設定の変更点が明示される",async()=>{await s(a.getByTestId("changes")).toHaveTextContent("Scenario変更"),await s(a.getByTestId("changes")).toHaveTextContent("AI設定変更")}),await i("変更がないSessionでは「変更はありません」と示される",async()=>{await B.click(a.getByRole("button",{name:`${re} を選択`})),await s(a.getByTestId("changes")).toHaveTextContent("変更はありません")})}},h={name:"US-R06: 確認後にセッションを再開したい",play:async({canvasElement:r,step:i})=>{const a=o(r);await d(a,c),await i("確認後の再開は、Session play dialogue（プレイ画面）への導線として用意される",async()=>{const p=a.getByRole("button",{name:"確認したので再開する（プレイ画面へ）"});await s(p).toBeVisible(),await s(R.playSession).toMatch(/^session-play-dialogue-/)})}},w={name:"US-R07: 再開直後に直前の内容を確認したい",play:async({canvasElement:r,step:i})=>{const a=o(r);await d(a,c),await i("再開前確認で、復元される全Turnのうち直前のNarrativeが何かを把握できる",async()=>{await s(a.getByTestId("recap")).toHaveTextContent("螺旋階段の先で星図灯の在処を探している")}),await i("再開直後の直前ターンの続きは、遷移先の Session play dialogue で確認できる",async()=>{await s(a.getByRole("button",{name:"確認したので再開する（プレイ画面へ）"})).toBeVisible(),await s(R.playSession).toMatch(/^session-play-dialogue-/)})}},g={name:"US-R08: 再開せずに閲覧だけしたい",play:async({canvasElement:r,step:i})=>{const a=o(r);await d(a,c),await i("「再開せずに読み返す」でReadOnlyモードに入り、状態はSuspendedのまま",async()=>{await B.click(a.getByRole("button",{name:"再開せずに読み返す（ReadOnly）"})),await s(a.getByRole("region",{name:"ReadOnly閲覧"})).toBeVisible(),await s(a.getByTestId("session-state")).toHaveTextContent("Suspended (ReadOnly)"),await s(a.getByTestId("readonly-note")).toHaveTextContent("選択肢や入力は無効")}),await i("ReadOnlyでも全Turn（最初から直前まで）を読み返せる",async()=>{const p=a.getByTestId("restored-log");await s(o(p).getByTestId("restored-turn-1")).toHaveTextContent("水没した閲覧室で目を覚ます"),await s(o(p).getByTestId("restored-turn-6")).toHaveTextContent("螺旋階段の踊り場で星図灯がひとつ灯り")}),await i("ReadOnlyからでも、あらためてプレイ画面へ再開できる",async()=>{await s(a.getByRole("button",{name:"読み返したので再開する（プレイ画面へ）"})).toBeVisible(),await s(R.playSession).toMatch(/^session-play-dialogue-/)})}};var A,N,H;u.parameters={...u.parameters,docs:{...(A=u.parameters)==null?void 0:A.docs,source:{originalSource:`{
  name: 'US-R01: 中断したセッションを再開したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('中断中のSession一覧が表示され、Suspended状態であることが分かる', async () => {
      await expect(canvas.getByRole('region', {
        name: '中断中のセッション'
      })).toBeVisible();
      await expect(canvas.getByTestId('session-list')).toHaveTextContent(STAR_LIBRARY);
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Suspended');
    });
    await step('Sessionを選ぶと、最終状態から再開できることが示される', async () => {
      await selectFromList(canvas, STAR_LIBRARY);
      await expect(canvas.getByTestId('resume-notice')).toHaveTextContent('最終状態（Turn 6）から続きを遊べます');
      await expect(canvas.getByRole('region', {
        name: '再開前の確認'
      })).toBeVisible();
      await expect(canvas.getByTestId('summary-scenario')).toHaveTextContent(STAR_LIBRARY);
    });
  }
}`,...(H=(N=u.parameters)==null?void 0:N.docs)==null?void 0:H.source}}};var U,L,O;x.parameters={...x.parameters,docs:{...(U=x.parameters)==null?void 0:U.docs,source:{originalSource:`{
  name: 'US-R02: 再開前に前回のあらすじを確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('AI要約された「これまでのあらすじ」が表示される', async () => {
      await expect(canvas.getByTestId('recap')).toHaveTextContent('これまでのあらすじ（AI要約）');
      await expect(canvas.getByTestId('recap')).toHaveTextContent('水没した閲覧室で目覚め、銀の鍵');
    });
  }
}`,...(O=(L=x.parameters)==null?void 0:L.docs)==null?void 0:O.source}}};var k,f,E;S.parameters={...S.parameters,docs:{...(k=S.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: 'US-R03: セッションの進行度を確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('ターン数とプレイ時間が進行度として表示される', async () => {
      await expect(canvas.getByTestId('progress')).toHaveTextContent('Turn 6');
      await expect(canvas.getByTestId('progress')).toHaveTextContent('3時間12分');
      await expect(canvas.getByTestId('summary-progress')).toHaveTextContent('Turn 6 / 3時間12分');
    });
  }
}`,...(E=(f=S.parameters)==null?void 0:f.docs)==null?void 0:E.source}}};var _,$,Y;v.parameters={...v.parameters,docs:{...(_=v.parameters)==null?void 0:_.docs,source:{originalSource:`{
  name: 'US-R04: AIが文脈を理解した状態で再開したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('再開時に復元されるAIコンテキストの内訳が示される', async () => {
      await expect(canvas.getByTestId('context')).toHaveTextContent('復元されるAIコンテキスト');
      await expect(canvas.getByTestId('context')).toHaveTextContent('Lorebook Canon');
      await expect(canvas.getByTestId('context')).toHaveTextContent('Session State（現在地: 螺旋階段の踊り場');
    });
  }
}`,...(Y=($=v.parameters)==null?void 0:$.docs)==null?void 0:Y.source}}};var V,F,M;T.parameters={...T.parameters,docs:{...(V=T.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: 'US-R05: 再開前に注意点を確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('中断中に起きたScenario / AI設定の変更点が明示される', async () => {
      await expect(canvas.getByTestId('changes')).toHaveTextContent('Scenario変更');
      await expect(canvas.getByTestId('changes')).toHaveTextContent('AI設定変更');
    });
    await step('変更がないSessionでは「変更はありません」と示される', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: \`\${ASH_STATION} を選択\`
      }));
      await expect(canvas.getByTestId('changes')).toHaveTextContent('変更はありません');
    });
  }
}`,...(M=(F=T.parameters)==null?void 0:F.docs)==null?void 0:M.source}}};var z,P,D;h.parameters={...h.parameters,docs:{...(z=h.parameters)==null?void 0:z.docs,source:{originalSource:`{
  name: 'US-R06: 確認後にセッションを再開したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('確認後の再開は、Session play dialogue（プレイ画面）への導線として用意される', async () => {
      // 再開＝Activeなプレイ画面への遷移。押すと navigateToStory(playSession) で
      // Session play dialogue ストーリーへ移動するため、play内ではクリックしない
      // （クリックすると別ストーリーへ遷移してこのplay自体が中断される）。
      const resumeButton = canvas.getByRole('button', {
        name: '確認したので再開する（プレイ画面へ）'
      });
      await expect(resumeButton).toBeVisible();
      // 遷移先が Session play dialogue（playSession）であることを確認する。
      await expect(STORY_IDS.playSession).toMatch(/^session-play-dialogue-/);
    });
  }
}`,...(D=(P=h.parameters)==null?void 0:P.docs)==null?void 0:D.source}}};var W,q,G;w.parameters={...w.parameters,docs:{...(W=w.parameters)==null?void 0:W.docs,source:{originalSource:`{
  name: 'US-R07: 再開直後に直前の内容を確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('再開前確認で、復元される全Turnのうち直前のNarrativeが何かを把握できる', async () => {
      // 直前の展開（最後のTurnのNarrative）は、あらすじ要約として確認できる。
      await expect(canvas.getByTestId('recap')).toHaveTextContent('螺旋階段の先で星図灯の在処を探している');
    });
    await step('再開直後の直前ターンの続きは、遷移先の Session play dialogue で確認できる', async () => {
      // 再開ボタンはプレイ画面への遷移導線。クリックは遷移を起こすため行わず、
      // 導線の存在と遷移先の妥当性だけを確認する。
      await expect(canvas.getByRole('button', {
        name: '確認したので再開する（プレイ画面へ）'
      })).toBeVisible();
      await expect(STORY_IDS.playSession).toMatch(/^session-play-dialogue-/);
    });
  }
}`,...(G=(q=w.parameters)==null?void 0:q.docs)==null?void 0:G.source}}};var J,K,Q;g.parameters={...g.parameters,docs:{...(J=g.parameters)==null?void 0:J.docs,source:{originalSource:`{
  name: 'US-R08: 再開せずに閲覧だけしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('「再開せずに読み返す」でReadOnlyモードに入り、状態はSuspendedのまま', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '再開せずに読み返す（ReadOnly）'
      }));
      await expect(canvas.getByRole('region', {
        name: 'ReadOnly閲覧'
      })).toBeVisible();
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Suspended (ReadOnly)');
      await expect(canvas.getByTestId('readonly-note')).toHaveTextContent('選択肢や入力は無効');
    });
    await step('ReadOnlyでも全Turn（最初から直前まで）を読み返せる', async () => {
      const restored = canvas.getByTestId('restored-log');
      await expect(within(restored).getByTestId('restored-turn-1')).toHaveTextContent('水没した閲覧室で目を覚ます');
      await expect(within(restored).getByTestId('restored-turn-6')).toHaveTextContent('螺旋階段の踊り場で星図灯がひとつ灯り');
    });
    await step('ReadOnlyからでも、あらためてプレイ画面へ再開できる', async () => {
      // この再開ボタンも Session play dialogue への遷移導線。存在のみ確認する。
      await expect(canvas.getByRole('button', {
        name: '読み返したので再開する（プレイ画面へ）'
      })).toBeVisible();
      await expect(STORY_IDS.playSession).toMatch(/^session-play-dialogue-/);
    });
  }
}`,...(Q=(K=g.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};const ue=["USR01ResumeFromLastState","USR02ReviewRecapBeforeResume","USR03ShowProgress","USR04RestoreAiContext","USR05ShowChangeNotices","USR06ConfirmAndResume","USR07ReviewLastNarrativeAfterResume","USR08ReadOnlyReview"];export{u as USR01ResumeFromLastState,x as USR02ReviewRecapBeforeResume,S as USR03ShowProgress,v as USR04RestoreAiContext,T as USR05ShowChangeNotices,h as USR06ConfirmAndResume,w as USR07ReviewLastNarrativeAfterResume,g as USR08ReadOnlyReview,ue as __namedExportsOrder,ye as default};
