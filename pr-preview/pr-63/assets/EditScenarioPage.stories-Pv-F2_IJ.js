import{j as J}from"./jsx-runtime-BO8uF4Og.js";import{w as l,e as n,u as a}from"./index-C4S39nCK.js";import{E as ne,M as S}from"./MyrialeApp-CoNLSV9k.js";import{c as oe}from"./SessionPresentation-DGHeCpe_.js";import{r as se}from"./index-D4H_InIO.js";import{c as ie}from"./scenarioRegistrationFixtures-CK6CETnx.js";/* empty css               */import"./AdminAiProvidersPage-DupJQjuy.js";import"./Surfaces-hfywbPiG.js";import"./AppChrome-CaJxHzCb.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-DBs-w9aD.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-d7jVExt_.js";import"./ConditionTablePresentation-JmdLPG0b.js";import"./EditPane-DyZaeiBP.js";import"./scenarioWizardStyles-CPcslTFI.js";import"./NarrativeBody-4Kg13oE8.js";import"./ModuleUiHost-CQPmid6l.js";import"./TurnInspectionPresentation-CerC6ryl.js";import"./account-Bdcpq1bL.js";import"./SessionListPresentation-CV3LYKA6.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-UcBTXClw.js";import"./SessionActivityFeed-B0l1fOng.js";const ce={title:"目覚めの研究室",summary:`# シナリオ
閉鎖された地下研究施設から脱出します。
# 描写
- 緊張感のある静かな雰囲気を維持する`,genre:"SF,ミステリー,脱出劇",tone:"静謐で緊張感のあるSFミステリー",lore:"施設の過去は断片的に明かし、同じ手掛かりや所作を反復しない。各応答では新しい事実か状況変化を一つ進める。",aiFreedom:"低: 厳密に守る",heroMode:"free",heroFreeGenerationAllowed:!1,hero:"記憶を失った人物として自由に作成する。",opening:"あなたは閉鎖された地下研究施設で目を覚ます。",illustrationStyle:"冷たい研究施設のコンセプトアート",illustrationMood:"静かな緊張感",illustrationNegative:"明るい屋外、コミカルな表現",sampleScene:"非常灯だけが点滅する無人の実験室。",ruleData:structuredClone(ie)},re={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function Y({scenarioId:s}){const[o,e]=se.useState(!1),t=async c=>(e(!0),await Promise.resolve(),e(!1),{ok:!0,message:`「${c.title}」の変更を保存しました。`,value:{scenarioId:s}}),r=async(c,i)=>({ok:!0,message:i==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",value:{message:i==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",suggestions:[{id:"edit-suggestion",body:`## 改稿案

研究施設の非常灯が、一定の間隔で明滅しています。`,rationale:"現在の設定を維持した案です。"}]}}),K=async(c,i)=>({ok:!0,message:"隔離されたルールエンジンで実行しました。",value:{snapshot:{schemaVersion:"rule-action-snapshot.v1",snapshotId:"EDIT-DEBUG",currentLocation:{id:i.currentLocationCode,code:i.currentLocationCode,name:i.currentLocationCode,description:""},objects:[],actions:[]},decision:null,selectedRuleCode:null,appliedEffects:[],postState:null,facts:[],events:[],hints:[],forbiddenFacts:[]}}),z=async(c,i)=>({ok:!0,message:`${c} / ${i} の状態と過去Turnを取り込みました。`,value:{sessionId:c,turnId:i,testCase:{recentTurns:[{playerInput:"館について教えて",narrative:"メイドは紅茶を注ぎ、庭のバラについて語った。"}],playerInput:"この館について、まだ知らないことを教えて",selectedObject:{id:"maid",code:"maid",name:"メイド",locationId:"salon",isGlobal:!1,revision:2,state:{trust:2}},selectedAction:{objectId:"maid",actionId:"talk",code:"talk",label:"会話する",description:"",argumentSchema:{},enabled:!0},postState:{schemaVersion:"rule-post-state.v1",currentLocation:{id:"salon",code:"salon",name:"応接間",description:"雨音の響く応接間。"},objects:[],sessionFlags:{},sessionStateRevision:4},facts:[],events:[],narrativeHints:["新しい情報を一つ明かす。"],forbiddenNarrativeFacts:[],entities:[{code:"maid",name:"メイド",profileMarkdown:"館に長く仕えるメイド。"}]}}}),Q=async c=>({ok:!0,message:"同じ状態・過去Turn・AIで、公開版と未保存ドラフトを生成しました。",value:{publishedDefinitionVersionId:"DEF-PUBLISHED",aiProfileId:"runpod-recommended",published:{heading:"雨の応接間",body:"メイドは再び紅茶を注ぎ、庭のバラについて語った。",model:"demo",latencyMilliseconds:620},draft:{heading:"閉ざされた東棟",body:`「東棟の帳簿には、前の主人が最後に会った人物の名が残っています」

${c.tone}を保ちながら、彼女は鍵の所在を初めて明かした。`,model:"demo",latencyMilliseconds:640}}}),X=async(c,i)=>{const E=c.flatMap((p,y)=>Array.from({length:i},(le,m)=>({id:`AEA-${y}-${m}`,profileId:p,profileRevision:1,model:p,repetition:m+1,blindCode:`B${y+1}${m+1}`,status:"succeeded",passed:y===0||m!==1,labels:y===0||m!==1?["schema_valid","grounded"]:["schema_valid","forbidden_term"],output:{heading:"比較結果",body:"ブラインド出力"},metadata:{},errorCode:null,inputTokens:510,outputTokens:160,latencyMilliseconds:780+y*240,startedAt:"2026-08-09T00:00:00Z",completedAt:"2026-08-09T00:00:01Z"})));return{ok:!0,message:`${c.length}モデル × ${i}回のブラインド比較を完了しました。`,value:{summary:{id:"AER-STORY",scenarioId:s,status:"completed",corpusId:"myriale-low-cost-model-comparison",corpusVersion:"1.1.0",profileIds:c,repetitions:i,caseCount:1,attemptCount:E.length,passedAttemptCount:E.filter(p=>p.passed).length,createdAt:"2026-08-09T00:00:00Z",completedAt:"2026-08-09T00:00:03Z"},config:{},cases:[{id:"AEC-STORY",caseId:"maid-direct-answer",stage:"narrative",canonicalPayloadHash:"story",request:{},metadata:{},attempts:E}]}}},ee=async(c,i)=>({ok:!0,message:`${i.toUpperCase()}をエクスポートしました。`}),te=async()=>({ok:!0,message:"公開準備が完了しています。シナリオを公開できます。",value:{definitionVersionId:`demo-${s}`,ready:!0,errors:{}}}),ae=async()=>({ok:!0,message:"シナリオを公開しました。公開版として利用できます。"});return J.jsx(ne,{account:re,scenarioId:s,initialValues:ce,status:"ready",saving:o,aiWorking:!1,actions:{save:t,assist:r,debug:K,importNarrativeTest:z,compareNarrativeDraft:Q,runAiEvaluation:X,openAiEvaluationCorpus:()=>{},exportAiEvaluation:ee,checkReadiness:te,publish:ae},onRetry:()=>{},onLogout:()=>{}})}Y.__docgenInfo={description:"",methods:[],displayName:"MockEditScenarioContainer",props:{scenarioId:{required:!0,tsType:{name:"string"},description:""}}};const Ue={title:"ユーザーストーリー/Edit scenario",component:S,render:()=>J.jsx(S,{initialUrl:"/scenarios/SCN-AWAKENING-LAB/edit",initialDb:oe("empty"),editScenarioContainer:Y}),parameters:{notes:"シナリオ登録と同じ共通フォームを使い、保存済みの値を読み込んで編集します。"}},u=async(s,o)=>{await a.click(await s.findByRole("button",{name:`${o}へ`}))},v={name:"US-E01: 作成画面と同じフォームで既存シナリオを編集したい",play:async({canvasElement:s,step:o})=>{const e=l(s);await o("登録画面と同じ7ステップの編集ウィザードに保存済み内容を読み込む",async()=>{await n(e.getByRole("main",{name:"シナリオ編集ウィザード"})).toBeVisible(),await n(e.getByRole("complementary",{name:"契約の改稿"})).toBeVisible(),await n(e.getByLabelText("シナリオタイトル")).toHaveValue("目覚めの研究室"),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("SF");for(const t of["基本情報","場所","主人公","エンティティ","開始状態","挿絵","テスト"])await n(e.getByRole("button",{name:`${t}へ`})).toBeVisible()})}},w={name:"US-E02: タイトル・タグ・基本情報を編集して保存したい",play:async({canvasElement:s,step:o})=>{const e=l(s);await o("タイトルと基本情報を変更する",async()=>{const t=e.getByLabelText("シナリオタイトル");await a.clear(t),await a.type(t,"目覚めの研究室・改");const r=e.getByLabelText("基本情報");await a.clear(r),await a.type(r,`# シナリオ
改稿した研究施設から脱出します。`)}),await o("変更を保存する",async()=>{await a.click(e.getByRole("button",{name:"変更を保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました")})}},d={name:"US-E03: 主人公と第一場面を作成時と同じ操作で編集したい",play:async({canvasElement:s,step:o})=>{const e=l(s);await u(e,"主人公"),await o("主人公の前提を編集する",async()=>{const t=e.getByLabelText("主人公の設定");await a.clear(t),await a.type(t,"研究員または被験者として自由に作成する。")}),await u(e,"開始状態"),await o("保存済みの開始場所と初期ステートを確認する",async()=>{await n(e.getByRole("combobox",{name:"セッション開始場所"})).toHaveTextContent("水没した閲覧室"),await n(e.getByRole("combobox",{name:"北書庫の扉の開いている初期値"})).toHaveTextContent("false")}),await o("開始シーンを編集する",async()=>{const t=e.getByLabelText("開始シーン");await a.clear(t),await a.type(t,"非常灯が点滅する実験室で目を覚ます。"),await n(t).toHaveValue("非常灯が点滅する実験室で目を覚ます。")})}},g={name:"US-E04: 挿絵設定を作成時と同じ操作で編集したい",play:async({canvasElement:s,step:o})=>{const e=l(s);await u(e,"挿絵"),await o("画風・ムード・NG要素を編集できる",async()=>{await n(e.getByLabelText("挿絵の画風")).toHaveValue("冷たい研究施設のコンセプトアート"),await n(e.getByLabelText("挿絵のムード")).toHaveValue("静かな緊張感"),await n(e.getByLabelText("挿絵の禁止要素")).toHaveValue("明るい屋外、コミカルな表現")})}},b={name:"US-E05: 保存済み下書きの公開準備を確認して公開したい",play:async({canvasElement:s,step:o})=>{const e=l(s);await o("公開準備を確認するまで公開操作は無効になっている",async()=>{await n(e.getByRole("button",{name:"シナリオを公開"})).toBeDisabled(),await a.click(e.getByRole("button",{name:"公開準備を確認"})),await n(e.getByTestId("publish-readiness")).toHaveTextContent("公開できます。")}),await o("準備完了後にシナリオを公開する",async()=>{await a.click(e.getByRole("button",{name:"シナリオを公開"})),await n(e.getByTestId("publish-success")).toHaveTextContent("公開が完了しました。"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("シナリオを公開しました。")})}},B={name:"US-E06: Sessionの状態を取り込み、公開版よりドラフトが改善したか反復確認したい",play:async({canvasElement:s,step:o})=>{const e=l(s);await o("基本情報のトーンと世界観を未保存のまま改稿する",async()=>{const t=e.getByLabelText("シナリオのトーン");await a.clear(t),await a.type(t,"静謐で、同じ所作を繰り返さず、新しい事実を一つずつ明かす");const r=e.getByLabelText("世界観・設定");await a.clear(r),await a.type(r,"館の東棟には前主人の帳簿があり、メイドは信頼が高まった時だけ存在を明かす。")}),await u(e,"テスト"),await o("SessionとTurnを指定して実際のテスト条件をインポートする",async()=>{await a.type(e.getByLabelText("インポートするSession ID"),"SES-MAID-001"),await a.type(e.getByLabelText("インポートするTurn ID"),"TRN-MAID-004"),await a.click(e.getByRole("button",{name:"インポート"})),await n(e.getByTestId("narrative-test-notice")).toHaveTextContent("取り込みました"),await n(e.getByLabelText("Turn 1 Narrative")).toHaveValue("メイドは紅茶を注ぎ、庭のバラについて語った。")}),await o("過去Turnと状態を編集し、公開版と未保存ドラフトを同じ条件で比較する",async()=>{const t=e.getByLabelText("Turn 1 Narrative");await a.clear(t),await a.type(t,"メイドは庭の由来を説明した。"),await a.click(e.getByRole("button",{name:"公開版と未保存ドラフトを比較"}));const r=await e.findByTestId("narrative-comparison");await n(r).toHaveTextContent("公開版"),await n(r).toHaveTextContent("未保存ドラフト"),await n(r).toHaveTextContent("東棟の帳簿"),await n(e.getByTestId("scenario-notice")).not.toHaveTextContent("変更を保存しました")})}},T={name:"US-E07: 同じNarrative条件で複数AIを反復ブラインド評価したい",play:async({canvasElement:s,step:o})=>{const e=l(s);await u(e,"テスト"),await o("Session Turnを取り込み、比較対象Profileと反復回数を固定する",async()=>{await a.type(e.getByLabelText("インポートするSession ID"),"SES-MAID-001"),await a.type(e.getByLabelText("インポートするTurn ID"),"TRN-MAID-004"),await a.click(e.getByRole("button",{name:"インポート"})),await n(e.getByLabelText("比較するAI Profile IDs")).toHaveValue(`runpod-economy
runpod-recommended`),await n(e.getByLabelText("AI比較の反復回数")).toHaveValue(3)}),await o("モデル名ではなくBlind codeで合否・latency・tokenを確認する",async()=>{await a.click(e.getByRole("button",{name:"ブラインド比較を実行"}));const t=await e.findByTestId("ai-evaluation-result");await n(t).toHaveTextContent("5 / 6 attempts passed"),await n(t).toHaveTextContent("B11"),await n(t).toHaveTextContent("PASS"),await n(t).toHaveTextContent("FAIL"),await n(t).toHaveTextContent("JSON export"),await n(t).toHaveTextContent("CSV export")})}},x={name:"US-E11: 既存ルールデータのstable codeを保って編集したい",play:async({canvasElement:s,step:o})=>{const e=l(s),t=l(s.ownerDocument.body);await u(e,"エンティティ"),await o("Object Typeの行から編集ペインを開き、stable codeを保って表示名を編集する",async()=>{await a.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await n(t.getByRole("dialog",{name:"書庫の扉"})).toBeVisible(),await n(t.getByLabelText("種類のstable code")).toHaveValue("archive-door"),await a.click(t.getByRole("button",{name:"開いているを編集"})),await n(t.getByRole("dialog",{name:"開いている"})).toHaveAttribute("data-layer","1"),await n(t.getByLabelText("状態1のstable code")).toHaveValue("open"),await a.click(t.getByRole("button",{name:"状態の編集を完了"})),await a.click(t.getByRole("button",{name:"扉を開けるを編集"})),await n(t.getByRole("dialog",{name:"扉を開ける"})).toHaveAttribute("data-layer","1"),await n(t.getByLabelText("アクション1のstable code")).toHaveValue("open"),await a.click(t.getByRole("button",{name:"アクションの編集を完了"})),await a.clear(t.getByLabelText("種類の表示名")),await a.type(t.getByLabelText("種類の表示名"),"封印書庫の扉"),await a.click(t.getByRole("button",{name:"編集を完了"}))}),await u(e,"場所"),await o("場所とエンティティの各ステップで編集ペインを開く",async()=>{await a.click(e.getByRole("button",{name:"水没した閲覧室を編集"})),await n(t.getByLabelText("場所のstable code")).toHaveValue("sunken-library"),await a.clear(t.getByLabelText("場所の表示名")),await a.type(t.getByLabelText("場所の表示名"),"水没した中央閲覧室"),await a.click(t.getByRole("button",{name:"編集を完了"})),await u(e,"エンティティ"),await a.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await n(t.getByLabelText("エンティティのstable code")).toHaveValue("north-archive-door"),await a.click(t.getByRole("button",{name:"編集を完了"}))}),await o("Type generic ruleとObject adjust operationを維持したまま変更を保存する",async()=>{await a.click(e.getByRole("button",{name:/^封印書庫の扉を編集$/})),await n(t.getByRole("button",{name:"generic-openの実行ルールを編集"})).toBeVisible(),await a.click(t.getByRole("button",{name:"編集を完了"})),await a.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await n(t.getByRole("table",{name:"Object states"})).toHaveTextContent("開いている"),await n(t.getByRole("table",{name:"Object actions"})).toHaveTextContent("扉を開ける"),await n(t.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"})).toBeVisible(),await a.click(t.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"})),await n(t.queryByLabelText("実行ルールの優先度")).not.toBeInTheDocument(),await a.click(t.getByRole("button",{name:"閉じる"})),await a.click(t.getByRole("button",{name:"編集を完了"})),await n(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await a.click(e.getByRole("button",{name:"変更を保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました"),await n(e.queryByRole("button",{name:"アクション結果へ"})).not.toBeInTheDocument()})}};var R,H,k;v.parameters={...v.parameters,docs:{...(R=v.parameters)==null?void 0:R.docs,source:{originalSource:`{
  name: 'US-E01: 作成画面と同じフォームで既存シナリオを編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('登録画面と同じ7ステップの編集ウィザードに保存済み内容を読み込む', async () => {
      await expect(canvas.getByRole('main', {
        name: 'シナリオ編集ウィザード'
      })).toBeVisible();
      await expect(canvas.getByRole('complementary', {
        name: '契約の改稿'
      })).toBeVisible();
      await expect(canvas.getByLabelText('シナリオタイトル')).toHaveValue('目覚めの研究室');
      await expect(canvas.getByRole('group', {
        name: '登録済みジャンルタグ'
      })).toHaveTextContent('SF');
      for (const stepName of ['基本情報', '場所', '主人公', 'エンティティ', '開始状態', '挿絵', 'テスト']) {
        await expect(canvas.getByRole('button', {
          name: \`\${stepName}へ\`
        })).toBeVisible();
      }
    });
  }
}`,...(k=(H=v.parameters)==null?void 0:H.docs)==null?void 0:k.source}}};var C,L,h;w.parameters={...w.parameters,docs:{...(C=w.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: 'US-E02: タイトル・タグ・基本情報を編集して保存したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('タイトルと基本情報を変更する', async () => {
      const title = canvas.getByLabelText('シナリオタイトル');
      await userEvent.clear(title);
      await userEvent.type(title, '目覚めの研究室・改');
      const summary = canvas.getByLabelText('基本情報');
      await userEvent.clear(summary);
      await userEvent.type(summary, '# シナリオ\\n改稿した研究施設から脱出します。');
    });
    await step('変更を保存する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '変更を保存'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('変更を保存しました');
    });
  }
}`,...(h=(L=w.parameters)==null?void 0:L.docs)==null?void 0:h.source}}};var I,A,V;d.parameters={...d.parameters,docs:{...(I=d.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: 'US-E03: 主人公と第一場面を作成時と同じ操作で編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '主人公');
    await step('主人公の前提を編集する', async () => {
      const hero = canvas.getByLabelText('主人公の設定');
      await userEvent.clear(hero);
      await userEvent.type(hero, '研究員または被験者として自由に作成する。');
    });
    await goToStep(canvas, '開始状態');
    await step('保存済みの開始場所と初期ステートを確認する', async () => {
      await expect(canvas.getByRole('combobox', {
        name: 'セッション開始場所'
      })).toHaveTextContent('水没した閲覧室');
      await expect(canvas.getByRole('combobox', {
        name: '北書庫の扉の開いている初期値'
      })).toHaveTextContent('false');
    });
    await step('開始シーンを編集する', async () => {
      const opening = canvas.getByLabelText('開始シーン');
      await userEvent.clear(opening);
      await userEvent.type(opening, '非常灯が点滅する実験室で目を覚ます。');
      await expect(opening).toHaveValue('非常灯が点滅する実験室で目を覚ます。');
    });
  }
}`,...(V=(A=d.parameters)==null?void 0:A.docs)==null?void 0:V.source}}};var f,D,U;g.parameters={...g.parameters,docs:{...(f=g.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: 'US-E04: 挿絵設定を作成時と同じ操作で編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('画風・ムード・NG要素を編集できる', async () => {
      await expect(canvas.getByLabelText('挿絵の画風')).toHaveValue('冷たい研究施設のコンセプトアート');
      await expect(canvas.getByLabelText('挿絵のムード')).toHaveValue('静かな緊張感');
      await expect(canvas.getByLabelText('挿絵の禁止要素')).toHaveValue('明るい屋外、コミカルな表現');
    });
  }
}`,...(U=(D=g.parameters)==null?void 0:D.docs)==null?void 0:U.source}}};var N,M,$;b.parameters={...b.parameters,docs:{...(N=b.parameters)==null?void 0:N.docs,source:{originalSource:`{
  name: 'US-E05: 保存済み下書きの公開準備を確認して公開したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('公開準備を確認するまで公開操作は無効になっている', async () => {
      await expect(canvas.getByRole('button', {
        name: 'シナリオを公開'
      })).toBeDisabled();
      await userEvent.click(canvas.getByRole('button', {
        name: '公開準備を確認'
      }));
      await expect(canvas.getByTestId('publish-readiness')).toHaveTextContent('公開できます。');
    });
    await step('準備完了後にシナリオを公開する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'シナリオを公開'
      }));
      await expect(canvas.getByTestId('publish-success')).toHaveTextContent('公開が完了しました。');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('シナリオを公開しました。');
    });
  }
}`,...($=(M=b.parameters)==null?void 0:M.docs)==null?void 0:$.source}}};var j,O,F;B.parameters={...B.parameters,docs:{...(j=B.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'US-E06: Sessionの状態を取り込み、公開版よりドラフトが改善したか反復確認したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('基本情報のトーンと世界観を未保存のまま改稿する', async () => {
      const tone = canvas.getByLabelText('シナリオのトーン');
      await userEvent.clear(tone);
      await userEvent.type(tone, '静謐で、同じ所作を繰り返さず、新しい事実を一つずつ明かす');
      const lore = canvas.getByLabelText('世界観・設定');
      await userEvent.clear(lore);
      await userEvent.type(lore, '館の東棟には前主人の帳簿があり、メイドは信頼が高まった時だけ存在を明かす。');
    });
    await goToStep(canvas, 'テスト');
    await step('SessionとTurnを指定して実際のテスト条件をインポートする', async () => {
      await userEvent.type(canvas.getByLabelText('インポートするSession ID'), 'SES-MAID-001');
      await userEvent.type(canvas.getByLabelText('インポートするTurn ID'), 'TRN-MAID-004');
      await userEvent.click(canvas.getByRole('button', {
        name: 'インポート'
      }));
      await expect(canvas.getByTestId('narrative-test-notice')).toHaveTextContent('取り込みました');
      await expect(canvas.getByLabelText('Turn 1 Narrative')).toHaveValue('メイドは紅茶を注ぎ、庭のバラについて語った。');
    });
    await step('過去Turnと状態を編集し、公開版と未保存ドラフトを同じ条件で比較する', async () => {
      const previousNarrative = canvas.getByLabelText('Turn 1 Narrative');
      await userEvent.clear(previousNarrative);
      await userEvent.type(previousNarrative, 'メイドは庭の由来を説明した。');
      await userEvent.click(canvas.getByRole('button', {
        name: '公開版と未保存ドラフトを比較'
      }));
      const comparison = await canvas.findByTestId('narrative-comparison');
      await expect(comparison).toHaveTextContent('公開版');
      await expect(comparison).toHaveTextContent('未保存ドラフト');
      await expect(comparison).toHaveTextContent('東棟の帳簿');
      await expect(canvas.getByTestId('scenario-notice')).not.toHaveTextContent('変更を保存しました');
    });
  }
}`,...(F=(O=B.parameters)==null?void 0:O.docs)==null?void 0:F.source}}};var P,_,G;T.parameters={...T.parameters,docs:{...(P=T.parameters)==null?void 0:P.docs,source:{originalSource:`{
  name: 'US-E07: 同じNarrative条件で複数AIを反復ブラインド評価したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'テスト');
    await step('Session Turnを取り込み、比較対象Profileと反復回数を固定する', async () => {
      await userEvent.type(canvas.getByLabelText('インポートするSession ID'), 'SES-MAID-001');
      await userEvent.type(canvas.getByLabelText('インポートするTurn ID'), 'TRN-MAID-004');
      await userEvent.click(canvas.getByRole('button', {
        name: 'インポート'
      }));
      await expect(canvas.getByLabelText('比較するAI Profile IDs')).toHaveValue('runpod-economy\\nrunpod-recommended');
      await expect(canvas.getByLabelText('AI比較の反復回数')).toHaveValue(3);
    });
    await step('モデル名ではなくBlind codeで合否・latency・tokenを確認する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'ブラインド比較を実行'
      }));
      const result = await canvas.findByTestId('ai-evaluation-result');
      await expect(result).toHaveTextContent('5 / 6 attempts passed');
      await expect(result).toHaveTextContent('B11');
      await expect(result).toHaveTextContent('PASS');
      await expect(result).toHaveTextContent('FAIL');
      await expect(result).toHaveTextContent('JSON export');
      await expect(result).toHaveTextContent('CSV export');
    });
  }
}`,...(G=(_=T.parameters)==null?void 0:_.docs)==null?void 0:G.source}}};var q,W,Z;x.parameters={...x.parameters,docs:{...(q=x.parameters)==null?void 0:q.docs,source:{originalSource:`{
  name: 'US-E11: 既存ルールデータのstable codeを保って編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, 'エンティティ');
    await step('Object Typeの行から編集ペインを開き、stable codeを保って表示名を編集する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: /^書庫の扉を編集$/
      }));
      await expect(screen.getByRole('dialog', {
        name: '書庫の扉'
      })).toBeVisible();
      await expect(screen.getByLabelText('種類のstable code')).toHaveValue('archive-door');
      await userEvent.click(screen.getByRole('button', {
        name: '開いているを編集'
      }));
      await expect(screen.getByRole('dialog', {
        name: '開いている'
      })).toHaveAttribute('data-layer', '1');
      await expect(screen.getByLabelText('状態1のstable code')).toHaveValue('open');
      await userEvent.click(screen.getByRole('button', {
        name: '状態の編集を完了'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: '扉を開けるを編集'
      }));
      await expect(screen.getByRole('dialog', {
        name: '扉を開ける'
      })).toHaveAttribute('data-layer', '1');
      await expect(screen.getByLabelText('アクション1のstable code')).toHaveValue('open');
      await userEvent.click(screen.getByRole('button', {
        name: 'アクションの編集を完了'
      }));
      await userEvent.clear(screen.getByLabelText('種類の表示名'));
      await userEvent.type(screen.getByLabelText('種類の表示名'), '封印書庫の扉');
      await userEvent.click(screen.getByRole('button', {
        name: '編集を完了'
      }));
    });
    await goToStep(canvas, '場所');
    await step('場所とエンティティの各ステップで編集ペインを開く', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '水没した閲覧室を編集'
      }));
      await expect(screen.getByLabelText('場所のstable code')).toHaveValue('sunken-library');
      await userEvent.clear(screen.getByLabelText('場所の表示名'));
      await userEvent.type(screen.getByLabelText('場所の表示名'), '水没した中央閲覧室');
      await userEvent.click(screen.getByRole('button', {
        name: '編集を完了'
      }));
      await goToStep(canvas, 'エンティティ');
      await userEvent.click(canvas.getByRole('button', {
        name: '北書庫の扉を編集'
      }));
      await expect(screen.getByLabelText('エンティティのstable code')).toHaveValue('north-archive-door');
      await userEvent.click(screen.getByRole('button', {
        name: '編集を完了'
      }));
    });
    await step('Type generic ruleとObject adjust operationを維持したまま変更を保存する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: /^封印書庫の扉を編集$/
      }));
      await expect(screen.getByRole('button', {
        name: 'generic-openの実行ルールを編集'
      })).toBeVisible();
      await userEvent.click(screen.getByRole('button', {
        name: '編集を完了'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '北書庫の扉を編集'
      }));
      await expect(screen.getByRole('table', {
        name: 'Object states'
      })).toHaveTextContent('開いている');
      await expect(screen.getByRole('table', {
        name: 'Object actions'
      })).toHaveTextContent('扉を開ける');
      await expect(screen.getByRole('button', {
        name: 'archive-door:generic-openの実行ルールを確認'
      })).toBeVisible();
      await userEvent.click(screen.getByRole('button', {
        name: 'archive-door:generic-openの実行ルールを確認'
      }));
      await expect(screen.queryByLabelText('実行ルールの優先度')).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', {
        name: '閉じる'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: '編集を完了'
      }));
      await expect(canvas.getByTestId('rule-readiness')).toHaveTextContent('決定的です');
      await userEvent.click(canvas.getByRole('button', {
        name: '変更を保存'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('変更を保存しました');
      await expect(canvas.queryByRole('button', {
        name: 'アクション結果へ'
      })).not.toBeInTheDocument();
    });
  }
}`,...(Z=(W=x.parameters)==null?void 0:W.docs)==null?void 0:Z.source}}};const Ne=["USE01EditExistingScenario","USE02EditBasics","USE03EditHeroAndOpening","USE04EditIllustration","USE05CheckReadinessAndPublish","USE06CompareUnsavedDraftNarrative","USE07CompareAiModelsBlindly","USE11EditRuleDataWithStableCodes"];export{v as USE01EditExistingScenario,w as USE02EditBasics,d as USE03EditHeroAndOpening,g as USE04EditIllustration,b as USE05CheckReadinessAndPublish,B as USE06CompareUnsavedDraftNarrative,T as USE07CompareAiModelsBlindly,x as USE11EditRuleDataWithStableCodes,Ne as __namedExportsOrder,Ue as default};
