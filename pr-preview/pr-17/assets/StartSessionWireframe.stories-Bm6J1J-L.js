import{w as x,e as s,u as r}from"./index-C3Z0PGzo.js";import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as o}from"./index-BlmOqGMO.js";import{A as V,n as ye,S as we}from"./AppChrome-Bf8Q-wkI.js";/* empty css               */import"./index-yBjzXJbu.js";const B=[{id:"intro",label:"イントロ",state:"Preparing",help:"主人公未確定のまま導入を読む"},{id:"hero",label:"主人公確定",state:"Preparing",help:"固定、選択、作成、AI案から決める"},{id:"review",label:"最終確認",state:"Preparing",help:"開始前にスナップショットと主人公を確認"},{id:"active",label:"本編開始",state:"Active",help:"最初のNarrativeを生成してプレイへ"}],p={fixed:"リュシエン / 地下図書館の禁書司書",select:"ミラ / 星図を読む巡礼者",create:"アオイ / 灰の駅で目覚めた旅人",ai:"ノクト / 失われた索引を探す見習い司書"},ue=[{id:"SCN-STAR-LIBRARY",title:"星喰いの地下図書館",status:"公開中",genre:"ダークファンタジー探索譚",tone:"静かで不穏、淡い希望",lore:"星座は魔法体系の鍵。死者の名前を読むと記憶を失う。",opening:"あなたは水没した閲覧室で目を覚ます。"},{id:"SCN-ASH-STATION",title:"灰の駅と宛名のない切符",status:"自分用",genre:"終末ロードムービー",tone:"乾いた祈り、遠い汽笛",lore:"朝が来ない荒野では、切符だけが次の町を覚えている。",opening:"あなたは灰の降る駅で、宛名のない切符を握っている。"},{id:"SCN-GLASS-FOREST",title:"硝子の森と夜明けの司書",status:"公開中",genre:"幻想ミステリ",tone:"透明で緊張感のある静けさ",lore:"森の硝子片は、嘘をついた者の声だけを反射する。",opening:"夜明け前の森で、割れた書架が小さく鳴る。"}];function se(){const[n,i]=o.useState(null),[a,l]=o.useState("intro"),[u,T]=o.useState("未作成"),[N,j]=o.useState("NotStarted"),[I,c]=o.useState("まずScenario一覧から開始するシナリオを選択します。"),[d,ne]=o.useState("select"),[C,b]=o.useState(p.select),[R,ie]=o.useState("アオイ"),[H,re]=o.useState("灰の駅で目覚めた旅人。星図を読む力はまだ不安定。"),[ce,oe]=o.useState("AI案は未生成です。生成後もプレイヤー確認まで確定しません。"),[f,A]=o.useState("本編Narrativeはまだ生成されていません。"),k=B.findIndex(t=>t.id===a),E=B[k],P=d==="create"?`${R} / ${H}`:C,U=()=>{c("シナリオ登録ワイヤーフレームへ移動します。"),ye(we.scenarioRegister)},le=t=>{i(t),T("SES-PREP-1098"),j("Preparing"),l("intro"),A("本編Narrativeはまだ生成されていません。"),c(`「${t.title}」から新しいSessionを作成し、Scenario設定をSession用にスナップショットしました。`)},de=()=>{i(null),T("未作成"),j("NotStarted"),l("intro"),c("Scenario一覧へ戻りました。別のScenarioを選択してからウィザードを開始します。")},xe=()=>{l("hero"),c("イントロを読み終えました。主人公を確定してください。")},me=t=>{ne(t),b(p[t]),c(t==="fixed"?"シナリオ定義済みの主人公を確認しました。ユーザー操作なしで候補が固定されます。":t==="select"?"候補から主人公を選択できます。":t==="create"?"名前やプロフィールを入力してSession固有の主人公を作成できます。":"AI案を生成しても、自動確定はされません。")},pe=()=>{oe("AIがイントロとLoreを踏まえた主人公案を生成しました: ノクト / 失われた索引を探す見習い司書。確認・修正してから確定します。"),b(p.ai),c("AI主人公案を提示しました。自動確定はしません。")},ve=()=>{l("review"),c("主人公情報をSession固有データとして確定しました。")},he=()=>{j("Active"),l("active"),A("星図灯が灯ると、あなたの名をまだ知らない地下図書館がゆっくり扉を開く。最初の選択肢が生成されました。"),c("Session状態をActiveに変更し、本編最初のNarrativeを生成しました。")},Se=()=>{l("hero"),c("最終確認から主人公確定へ戻りました。開始前なら前工程に戻れます。")},L=[{label:"Myriale",to:"scenarioRegister"},{label:"セッション",to:"startSession"},{label:n?"セッション開始ウィザード":"シナリオを選ぶ"}],z={name:"霧野しおり",email:"reader@myriale.example",initials:"霧野",role:"プレイヤー"};return n?e.jsx(V,{section:"sessions",breadcrumbs:L,account:z,children:e.jsxs("div",{className:"scenario-forge scenario-forge-wizard start-session-wireframe",children:[e.jsxs("aside",{className:"contract-spine","aria-label":"セッション開始ステップ",children:[e.jsx("strong",{children:"Session Flow"}),e.jsx("div",{className:"wizard-step-list",role:"list","aria-label":"セッション開始ウィザードのステップ",children:B.map((t,ge)=>e.jsxs("button",{className:`spine-row spine-step ${a===t.id?"active":""}`,onClick:()=>l(t.id),"aria-label":`${t.label}へ`,"aria-current":a===t.id?"step":void 0,children:[e.jsxs("span",{children:[String(ge+1).padStart(2,"0")," / ",t.label]}),e.jsx("small",{children:t.state})]},t.id))}),e.jsxs("div",{className:"scenario-id",children:[e.jsx("span",{children:"SessionId"}),e.jsx("b",{children:u})]}),e.jsx("button",{className:"text-button",onClick:de,children:"シナリオ一覧へ戻る"})]}),e.jsxs("main",{className:"forge-paper wizard-paper","aria-label":"セッション開始ワイヤーフレーム",children:[e.jsx("p",{className:"kicker",children:"Session Start / Scenario to play"}),e.jsx("div",{className:"notice",role:"status","data-testid":"session-notice",children:I}),e.jsxs("div",{className:"wizard-progress","aria-label":"開始進捗",children:[e.jsx("span",{children:String(k+1).padStart(2,"0")}),e.jsx("strong",{children:E.label}),e.jsx("small",{children:E.help})]}),a==="intro"&&e.jsxs("section",{className:"wizard-panel","aria-label":"イントロNarrative",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"初回セッションではスキップ不可のイントロです。"}),"Lore、ジャンル、トーン、開始シーンを反映し、主人公未確定のため「あなた」として語ります。"]}),e.jsxs("article",{className:"start-session-narrative","data-testid":"intro-narrative",children:[e.jsx("h2",{children:"導入"}),e.jsxs("p",{children:[n.opening," 頭上では星座が紙魚のようにページを食み、遠くで誰かが名もなき旅人を呼んでいる。"]})]}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{className:"primary",onClick:xe,children:"イントロを読んだので主人公へ"}),e.jsx("button",{disabled:!0,children:"初回はスキップ不可"})]})]}),a==="hero"&&e.jsxs("section",{className:"wizard-panel","aria-label":"主人公確定",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"イントロ後に主人公を確定します。"}),"AIは候補を出せますが、プレイヤーの確認なしに自動確定しません。"]}),e.jsxs("label",{children:["主人公の扱い",e.jsxs("select",{"aria-label":"主人公の扱い",value:d,onChange:t=>me(t.target.value),children:[e.jsx("option",{value:"fixed",children:"キャラクター固定"}),e.jsx("option",{value:"select",children:"キャラクター選択式"}),e.jsx("option",{value:"create",children:"キャラクタークリエイト"}),e.jsx("option",{value:"ai",children:"AIによる自動生成案"})]})]}),d==="select"&&e.jsxs("label",{children:["候補キャラクター",e.jsxs("select",{"aria-label":"候補キャラクター",value:C,onChange:t=>b(t.target.value),children:[e.jsx("option",{children:p.select}),e.jsx("option",{children:"セオ / 星図を燃やす護衛"}),e.jsx("option",{children:"エル / 記憶を失った写字生"})]})]}),d==="create"&&e.jsxs(e.Fragment,{children:[e.jsxs("label",{children:["名前",e.jsx("input",{"aria-label":"主人公の名前",value:R,onChange:t=>ie(t.target.value)})]}),e.jsxs("label",{children:["プロフィール",e.jsx("textarea",{"aria-label":"主人公プロフィール",value:H,onChange:t=>re(t.target.value)})]}),e.jsx("button",{onClick:()=>c("AIがプロフィール入力を補助しました。採用前に編集できます。"),children:"AIに入力補助してもらう"})]}),d==="ai"&&e.jsxs("article",{className:"start-session-card","data-testid":"ai-hero-suggestion",children:[e.jsx("h2",{children:"AI主人公案"}),e.jsx("p",{children:ce}),e.jsx("button",{onClick:pe,children:"AIに任せる"})]}),d==="fixed"&&e.jsx("p",{"data-testid":"fixed-hero",children:p.fixed}),e.jsx("div",{className:"button-row",children:e.jsx("button",{className:"primary",onClick:ve,children:"主人公を確定"})})]}),a==="review"&&e.jsxs("section",{className:"wizard-panel","aria-label":"開始前の最終確認",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"意図しない条件で物語が始まるのを防ぎます。"}),"Scenario概要、主人公、設定スナップショットを確認し、必要なら前工程へ戻れます。"]}),e.jsxs("article",{className:"start-session-card","data-testid":"start-summary",children:[e.jsx("h2",{children:"開始サマリー"}),e.jsxs("p",{children:["Scenario: ",n.title]}),e.jsxs("p",{children:["主人公: ",P]}),e.jsxs("p",{children:["Session状態: ",N]})]}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{onClick:Se,children:"主人公確定へ戻る"}),e.jsx("button",{className:"primary",onClick:he,children:"物語を始める"})]})]}),a==="active"&&e.jsxs("section",{className:"wizard-panel","aria-label":"本編最初のNarrative",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"SessionはActiveです。"}),"確定した主人公情報を反映して、本編最初のNarrativeと選択肢が生成されます。"]}),e.jsxs("article",{className:"start-session-narrative","data-testid":"first-narrative",children:[e.jsx("h2",{children:"本編"}),e.jsx("p",{children:f}),e.jsxs("div",{className:"choice-row",children:[e.jsx("button",{children:"星図灯を掲げる"}),e.jsx("button",{children:"呼び声の主を探す"})]})]})]})]}),e.jsxs("aside",{className:"ai-bookmark wizard-summary","aria-label":"セッション状態サマリー",children:[e.jsx("h2",{children:"Session"}),e.jsxs("article",{children:[e.jsx("h3",{children:"状態"}),e.jsx("p",{"data-testid":"session-state",children:N}),e.jsx("p",{children:u})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"Scenario snapshot"}),e.jsx("p",{"data-testid":"selected-scenario-title",children:n.title}),e.jsx("p",{children:n.genre}),e.jsx("p",{children:n.tone})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"主人公"}),e.jsx("p",{"data-testid":"hero-summary",children:P})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"Narrative"}),e.jsx("p",{children:"イントロ: 表示済みにしてから主人公確定"}),e.jsx("p",{children:f})]})]})]})}):e.jsx(V,{section:"sessions",breadcrumbs:L,account:z,children:e.jsxs("div",{className:"scenario-forge scenario-forge-wizard start-session-wireframe start-session-select-screen",children:[e.jsxs("aside",{className:"contract-spine","aria-label":"セッション開始前の導線",children:[e.jsx("strong",{children:"Scenario Library"}),e.jsxs("div",{className:"wizard-step-list",role:"list","aria-label":"開始前の導線",children:[e.jsxs("button",{className:"spine-row spine-step active","aria-current":"step","aria-label":"シナリオ一覧へ",children:[e.jsx("span",{children:"01 / シナリオ一覧"}),e.jsx("small",{children:"選択してから開始"})]}),e.jsxs("button",{className:"spine-row spine-step",onClick:U,"aria-label":"シナリオ登録へ",children:[e.jsx("span",{children:"02 / 登録導線"}),e.jsx("small",{children:"未登録なら作成"})]})]}),e.jsxs("div",{className:"scenario-id",children:[e.jsx("span",{children:"SessionId"}),e.jsx("b",{children:u})]})]}),e.jsxs("main",{className:"forge-paper wizard-paper","aria-label":"セッション開始前のシナリオ一覧",children:[e.jsx("p",{className:"kicker",children:"Session Start / Scenario library"}),e.jsx("div",{className:"notice",role:"status","data-testid":"session-notice",children:I}),e.jsxs("div",{className:"wizard-progress","aria-label":"一覧進捗",children:[e.jsx("span",{children:"00"}),e.jsx("strong",{children:"シナリオを選択"}),e.jsx("small",{children:"ここではまだSessionウィザードを開始しません"})]}),e.jsxs("section",{className:"wizard-panel","aria-label":"シナリオ一覧",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"利用可能なScenarioを選択します。"}),"Session開始ウィザードは、Scenarioを選んでSession用スナップショットを作成してから始まります。"]}),e.jsx("div",{className:"button-row",children:e.jsx("button",{onClick:U,children:"新しいシナリオを登録"})}),e.jsx("div",{className:"start-session-scenario-list","data-testid":"scenario-list",children:ue.map(t=>e.jsxs("article",{className:"start-session-card","data-testid":`scenario-card-${t.id}`,children:[e.jsxs("span",{children:[t.status," / ",t.id]}),e.jsx("h2",{children:t.title}),e.jsxs("p",{children:[t.genre," / ",t.tone]}),e.jsx("p",{children:t.lore}),e.jsxs("button",{className:"primary",onClick:()=>le(t),children:[t.title,"で開始"]})]},t.id))})]})]})]})})}se.__docgenInfo={description:"",methods:[],displayName:"StartSessionWireframe"};const Ce={title:"Start session/Wireframe from user stories",component:se,parameters:{notes:"docs/user-stories/start-session.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。"}},m=async n=>{await r.click(n.getByRole("button",{name:"星喰いの地下図書館で開始"}))},v={name:"US-S01: シナリオから新しいセッションを開始したい",play:async({canvasElement:n,step:i})=>{const a=x(n);await i("シナリオ一覧から対象Scenarioを確認し、登録導線も見える",async()=>{await s(a.getByRole("region",{name:"シナリオ一覧"})).toBeVisible(),await s(a.getByTestId("scenario-list")).toHaveTextContent("星喰いの地下図書館"),await s(a.getByRole("button",{name:"新しいシナリオを登録"})).toBeVisible(),await s(a.queryByRole("complementary",{name:"シナリオ登録導線"})).not.toBeInTheDocument()}),await i("Scenarioを選択してからSessionウィザードを開始し、設定をスナップショットする",async()=>{await m(a),await s(a.getByTestId("session-notice")).toHaveTextContent("Session用にスナップショット"),await s(a.getByText("SES-PREP-1098")).toBeVisible(),await s(a.getByTestId("session-state")).toHaveTextContent("Preparing"),await s(a.getByRole("complementary",{name:"セッション状態サマリー"})).toHaveTextContent("星喰いの地下図書館")})}},h={name:"US-S02: セッション開始時にシナリオのイントロを見たい",play:async({canvasElement:n,step:i})=>{const a=x(n);await m(a),await i("Preparing状態で、主人公未確定のイントロNarrativeを読む",async()=>{await s(a.getByRole("region",{name:"イントロNarrative"})).toBeVisible(),await s(a.getByTestId("intro-narrative")).toHaveTextContent("あなたは水没した閲覧室"),await s(a.getByTestId("intro-narrative")).toHaveTextContent("名もなき旅人")}),await i("初回セッションではイントロをスキップできないことを示す",async()=>{await s(a.getByRole("button",{name:"初回はスキップ不可"})).toBeDisabled()})}},S={name:"US-S03: イントロ後に主人公を確定したい",play:async({canvasElement:n,step:i})=>{const a=x(n);await m(a),await r.click(a.getByRole("button",{name:"イントロを読んだので主人公へ"})),await i("キャラクター選択式で候補を選び、Session固有データとして確定する",async()=>{await r.selectOptions(a.getByLabelText("候補キャラクター"),"エル / 記憶を失った写字生"),await r.click(a.getByRole("button",{name:"主人公を確定"})),await s(a.getByTestId("session-notice")).toHaveTextContent("Session固有データとして確定"),await s(a.getByTestId("start-summary")).toHaveTextContent("エル / 記憶を失った写字生")})}},g={name:"US-S03C/D: 主人公を作成し、AI案は確認してから確定する",play:async({canvasElement:n,step:i})=>{const a=x(n);await m(a),await r.click(a.getByRole("button",{name:"イントロを読んだので主人公へ"})),await i("キャラクタークリエイトで名前とプロフィールを編集する",async()=>{await r.selectOptions(a.getByLabelText("主人公の扱い"),"create"),await r.clear(a.getByLabelText("主人公の名前")),await r.type(a.getByLabelText("主人公の名前"),"ユイ"),await s(a.getByTestId("hero-summary")).toHaveTextContent("ユイ")}),await i("AIに任せても自動確定せず、確認・修正を促す",async()=>{await r.selectOptions(a.getByLabelText("主人公の扱い"),"ai"),await r.click(a.getByRole("button",{name:"AIに任せる"})),await s(a.getByTestId("ai-hero-suggestion")).toHaveTextContent("確認・修正してから確定"),await s(a.getByTestId("session-notice")).toHaveTextContent("自動確定はしません")})}},y={name:"US-S04: セッション開始前に内容を最終確認したい",play:async({canvasElement:n,step:i})=>{const a=x(n);await m(a),await r.click(a.getByRole("button",{name:"イントロを読んだので主人公へ"})),await r.click(a.getByRole("button",{name:"主人公を確定"})),await i("開始サマリーでScenario概要、主人公、設定を確認する",async()=>{await s(a.getByRole("region",{name:"開始前の最終確認"})).toBeVisible(),await s(a.getByTestId("start-summary")).toHaveTextContent("Scenario: 星喰いの地下図書館"),await s(a.getByTestId("start-summary")).toHaveTextContent("主人公: ミラ")}),await i("必要に応じて前工程へ戻れる",async()=>{await r.click(a.getByRole("button",{name:"主人公確定へ戻る"})),await s(a.getByRole("region",{name:"主人公確定"})).toBeVisible(),await s(a.getByTestId("session-notice")).toHaveTextContent("前工程に戻れます")})}},w={name:"US-S05: セッションを正式に開始したい",play:async({canvasElement:n,step:i})=>{const a=x(n);await m(a),await r.click(a.getByRole("button",{name:"イントロを読んだので主人公へ"})),await r.click(a.getByRole("button",{name:"主人公を確定"})),await i("「物語を始める」でSessionをActiveにし、本編最初のNarrativeを生成する",async()=>{await r.click(a.getByRole("button",{name:"物語を始める"})),await s(a.getByTestId("session-state")).toHaveTextContent("Active"),await s(a.getByTestId("first-narrative")).toHaveTextContent("最初の選択肢が生成されました"),await s(a.getByTestId("session-notice")).toHaveTextContent("本編最初のNarrativeを生成")})}};var O,D,F;v.parameters={...v.parameters,docs:{...(O=v.parameters)==null?void 0:O.docs,source:{originalSource:`{
  name: 'US-S01: シナリオから新しいセッションを開始したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('シナリオ一覧から対象Scenarioを確認し、登録導線も見える', async () => {
      await expect(canvas.getByRole('region', {
        name: 'シナリオ一覧'
      })).toBeVisible();
      await expect(canvas.getByTestId('scenario-list')).toHaveTextContent('星喰いの地下図書館');
      await expect(canvas.getByRole('button', {
        name: '新しいシナリオを登録'
      })).toBeVisible();
      await expect(canvas.queryByRole('complementary', {
        name: 'シナリオ登録導線'
      })).not.toBeInTheDocument();
    });
    await step('Scenarioを選択してからSessionウィザードを開始し、設定をスナップショットする', async () => {
      await startPreparing(canvas);
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('Session用にスナップショット');
      await expect(canvas.getByText('SES-PREP-1098')).toBeVisible();
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Preparing');
      await expect(canvas.getByRole('complementary', {
        name: 'セッション状態サマリー'
      })).toHaveTextContent('星喰いの地下図書館');
    });
  }
}`,...(F=(D=v.parameters)==null?void 0:D.docs)==null?void 0:F.source}}};var $,W,_;h.parameters={...h.parameters,docs:{...($=h.parameters)==null?void 0:$.docs,source:{originalSource:`{
  name: 'US-S02: セッション開始時にシナリオのイントロを見たい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await step('Preparing状態で、主人公未確定のイントロNarrativeを読む', async () => {
      await expect(canvas.getByRole('region', {
        name: 'イントロNarrative'
      })).toBeVisible();
      await expect(canvas.getByTestId('intro-narrative')).toHaveTextContent('あなたは水没した閲覧室');
      await expect(canvas.getByTestId('intro-narrative')).toHaveTextContent('名もなき旅人');
    });
    await step('初回セッションではイントロをスキップできないことを示す', async () => {
      await expect(canvas.getByRole('button', {
        name: '初回はスキップ不可'
      })).toBeDisabled();
    });
  }
}`,...(_=(W=h.parameters)==null?void 0:W.docs)==null?void 0:_.source}}};var M,q,Y;S.parameters={...S.parameters,docs:{...(M=S.parameters)==null?void 0:M.docs,source:{originalSource:`{
  name: 'US-S03: イントロ後に主人公を確定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: 'イントロを読んだので主人公へ'
    }));
    await step('キャラクター選択式で候補を選び、Session固有データとして確定する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('候補キャラクター'), 'エル / 記憶を失った写字生');
      await userEvent.click(canvas.getByRole('button', {
        name: '主人公を確定'
      }));
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('Session固有データとして確定');
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('エル / 記憶を失った写字生');
    });
  }
}`,...(Y=(q=S.parameters)==null?void 0:q.docs)==null?void 0:Y.source}}};var G,J,K;g.parameters={...g.parameters,docs:{...(G=g.parameters)==null?void 0:G.docs,source:{originalSource:`{
  name: 'US-S03C/D: 主人公を作成し、AI案は確認してから確定する',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: 'イントロを読んだので主人公へ'
    }));
    await step('キャラクタークリエイトで名前とプロフィールを編集する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('主人公の扱い'), 'create');
      await userEvent.clear(canvas.getByLabelText('主人公の名前'));
      await userEvent.type(canvas.getByLabelText('主人公の名前'), 'ユイ');
      await expect(canvas.getByTestId('hero-summary')).toHaveTextContent('ユイ');
    });
    await step('AIに任せても自動確定せず、確認・修正を促す', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('主人公の扱い'), 'ai');
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに任せる'
      }));
      await expect(canvas.getByTestId('ai-hero-suggestion')).toHaveTextContent('確認・修正してから確定');
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('自動確定はしません');
    });
  }
}`,...(K=(J=g.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};var Q,X,Z;y.parameters={...y.parameters,docs:{...(Q=y.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  name: 'US-S04: セッション開始前に内容を最終確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: 'イントロを読んだので主人公へ'
    }));
    await userEvent.click(canvas.getByRole('button', {
      name: '主人公を確定'
    }));
    await step('開始サマリーでScenario概要、主人公、設定を確認する', async () => {
      await expect(canvas.getByRole('region', {
        name: '開始前の最終確認'
      })).toBeVisible();
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('Scenario: 星喰いの地下図書館');
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('主人公: ミラ');
    });
    await step('必要に応じて前工程へ戻れる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '主人公確定へ戻る'
      }));
      await expect(canvas.getByRole('region', {
        name: '主人公確定'
      })).toBeVisible();
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('前工程に戻れます');
    });
  }
}`,...(Z=(X=y.parameters)==null?void 0:X.docs)==null?void 0:Z.source}}};var ee,ae,te;w.parameters={...w.parameters,docs:{...(ee=w.parameters)==null?void 0:ee.docs,source:{originalSource:`{
  name: 'US-S05: セッションを正式に開始したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: 'イントロを読んだので主人公へ'
    }));
    await userEvent.click(canvas.getByRole('button', {
      name: '主人公を確定'
    }));
    await step('「物語を始める」でSessionをActiveにし、本編最初のNarrativeを生成する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '物語を始める'
      }));
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
      await expect(canvas.getByTestId('first-narrative')).toHaveTextContent('最初の選択肢が生成されました');
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('本編最初のNarrativeを生成');
    });
  }
}`,...(te=(ae=w.parameters)==null?void 0:ae.docs)==null?void 0:te.source}}};const Re=["USS01StartNewSessionFromScenario","USS02ReadIntroBeforeHero","USS03ConfirmHeroAfterIntro","USS03CreateHeroWithAiAssistance","USS04ReviewBeforeStarting","USS05BeginActiveSession"];export{v as USS01StartNewSessionFromScenario,h as USS02ReadIntroBeforeHero,S as USS03ConfirmHeroAfterIntro,g as USS03CreateHeroWithAiAssistance,y as USS04ReviewBeforeStarting,w as USS05BeginActiveSession,Re as __namedExportsOrder,Ce as default};
