import{j as _}from"./jsx-runtime-BO8uF4Og.js";import{w as r,e as n,u as t}from"./index-C4S39nCK.js";import{E as X,M as B}from"./MyrialeApp-5p4T9Hc3.js";import{c as Y}from"./SessionPresentation-aPi_CQwP.js";import{r as Z}from"./index-D4H_InIO.js";import{c as ee}from"./scenarioRegistrationFixtures-CK6CETnx.js";/* empty css               */import"./AdminAiProvidersPage-CgTK15Bi.js";import"./Surfaces-CzbTO6k_.js";import"./AppChrome-BJsxH9du.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-Buo1oKda.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CD8vBQ2i.js";import"./ConditionTablePresentation-CHGjlQyc.js";import"./EditPane-Cr8CgrZD.js";import"./scenarioWizardStyles-zxLrTCdZ.js";import"./NarrativeBody-4Kg13oE8.js";import"./ModuleUiHost-DC_KPAuE.js";import"./TurnInspectionPresentation-JEipLAGQ.js";import"./account-3SMbygbA.js";import"./SessionListPresentation-Dn2G4cwz.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-g7mZ0DmF.js";import"./SessionActivityFeed-DfVnD2W4.js";const ae={title:"目覚めの研究室",summary:`# シナリオ
閉鎖された地下研究施設から脱出します。
# 描写
- 緊張感のある静かな雰囲気を維持する`,genre:"SF,ミステリー,脱出劇",tone:"静謐で緊張感のあるSFミステリー",lore:"施設の過去は断片的に明かし、同じ手掛かりや所作を反復しない。各応答では新しい事実か状況変化を一つ進める。",aiFreedom:"低: 厳密に守る",heroMode:"free",heroFreeGenerationAllowed:!1,hero:"記憶を失った人物として自由に作成する。",opening:"あなたは閉鎖された地下研究施設で目を覚ます。",illustrationStyle:"冷たい研究施設のコンセプトアート",illustrationMood:"静かな緊張感",illustrationNegative:"明るい屋外、コミカルな表現",sampleScene:"非常灯だけが点滅する無人の実験室。",ruleData:structuredClone(ee)},te={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function W({scenarioId:i}){const[o,e]=Z.useState(!1),a=async l=>(e(!0),await Promise.resolve(),e(!1),{ok:!0,message:`「${l.title}」の変更を保存しました。`,value:{scenarioId:i}}),s=async(l,c)=>({ok:!0,message:c==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",value:{message:c==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",suggestions:[{id:"edit-suggestion",body:`## 改稿案

研究施設の非常灯が、一定の間隔で明滅しています。`,rationale:"現在の設定を維持した案です。"}]}}),q=async(l,c)=>({ok:!0,message:"隔離されたルールエンジンで実行しました。",value:{snapshot:{schemaVersion:"rule-action-snapshot.v1",snapshotId:"EDIT-DEBUG",currentLocation:{id:c.currentLocationCode,code:c.currentLocationCode,name:c.currentLocationCode,description:""},objects:[],actions:[]},decision:null,selectedRuleCode:null,appliedEffects:[],postState:null,facts:[],events:[],hints:[],forbiddenFacts:[]}}),K=async(l,c)=>({ok:!0,message:`${l} / ${c} の状態と過去Turnを取り込みました。`,value:{sessionId:l,turnId:c,testCase:{recentTurns:[{playerInput:"館について教えて",narrative:"メイドは紅茶を注ぎ、庭のバラについて語った。"}],playerInput:"この館について、まだ知らないことを教えて",selectedObject:{id:"maid",code:"maid",name:"メイド",locationId:"salon",isGlobal:!1,revision:2,state:{trust:2}},selectedAction:{objectId:"maid",actionId:"talk",code:"talk",label:"会話する",description:"",argumentSchema:{},enabled:!0},postState:{schemaVersion:"rule-post-state.v1",currentLocation:{id:"salon",code:"salon",name:"応接間",description:"雨音の響く応接間。"},objects:[],sessionFlags:{},sessionStateRevision:4},facts:[],events:[],narrativeHints:["新しい情報を一つ明かす。"],forbiddenNarrativeFacts:[],entities:[{code:"maid",name:"メイド",profileMarkdown:"館に長く仕えるメイド。"}]}}}),z=async l=>({ok:!0,message:"同じ状態・過去Turn・AIで、公開版と未保存ドラフトを生成しました。",value:{publishedDefinitionVersionId:"DEF-PUBLISHED",aiProfileId:"runpod-recommended",published:{heading:"雨の応接間",body:"メイドは再び紅茶を注ぎ、庭のバラについて語った。",model:"demo",latencyMilliseconds:620},draft:{heading:"閉ざされた東棟",body:`「東棟の帳簿には、前の主人が最後に会った人物の名が残っています」

${l.tone}を保ちながら、彼女は鍵の所在を初めて明かした。`,model:"demo",latencyMilliseconds:640}}}),J=async()=>({ok:!0,message:"公開準備が完了しています。シナリオを公開できます。",value:{definitionVersionId:`demo-${i}`,ready:!0,errors:{}}}),Q=async()=>({ok:!0,message:"シナリオを公開しました。公開版として利用できます。"});return _.jsx(X,{account:te,scenarioId:i,initialValues:ae,status:"ready",saving:o,aiWorking:!1,actions:{save:a,assist:s,debug:q,importNarrativeTest:K,compareNarrativeDraft:z,openEvaluationCreate:()=>{},checkReadiness:J,publish:Q},onRetry:()=>{},onLogout:()=>{}})}W.__docgenInfo={description:"",methods:[],displayName:"MockEditScenarioContainer",props:{scenarioId:{required:!0,tsType:{name:"string"},description:""}}};const he={title:"ユーザーストーリー/Edit scenario",component:B,render:()=>_.jsx(B,{initialUrl:"/scenarios/SCN-AWAKENING-LAB/edit",initialDb:Y("empty"),editScenarioContainer:W}),parameters:{notes:"シナリオ登録と同じ共通フォームを使い、保存済みの値を読み込んで編集します。"}},y=async(i,o)=>{await t.click(await i.findByRole("button",{name:`${o}へ`}))},u={name:"US-E01: 作成画面と同じフォームで既存シナリオを編集したい",play:async({canvasElement:i,step:o})=>{const e=r(i);await o("登録画面と同じ7ステップの編集ウィザードに保存済み内容を読み込む",async()=>{await n(e.getByRole("main",{name:"シナリオ編集ウィザード"})).toBeVisible(),await n(e.getByRole("complementary",{name:"契約の改稿"})).toBeVisible(),await n(e.getByLabelText("シナリオタイトル")).toHaveValue("目覚めの研究室"),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("SF");for(const a of["基本情報","場所","主人公","エンティティ","開始状態","挿絵","テスト"])await n(e.getByRole("button",{name:`${a}へ`})).toBeVisible()})}},m={name:"US-E02: タイトル・タグ・基本情報を編集して保存したい",play:async({canvasElement:i,step:o})=>{const e=r(i);await o("タイトルと基本情報を変更する",async()=>{const a=e.getByLabelText("シナリオタイトル");await t.clear(a),await t.type(a,"目覚めの研究室・改");const s=e.getByLabelText("基本情報");await t.clear(s),await t.type(s,`# シナリオ
改稿した研究施設から脱出します。`)}),await o("変更を保存する",async()=>{await t.click(e.getByRole("button",{name:"変更を保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました")})}},p={name:"US-E03: 主人公と第一場面を作成時と同じ操作で編集したい",play:async({canvasElement:i,step:o})=>{const e=r(i);await y(e,"主人公"),await o("主人公の前提を編集する",async()=>{const a=e.getByLabelText("主人公の設定");await t.clear(a),await t.type(a,"研究員または被験者として自由に作成する。")}),await y(e,"開始状態"),await o("保存済みの開始場所と初期ステートを確認する",async()=>{await n(e.getByRole("combobox",{name:"セッション開始場所"})).toHaveTextContent("水没した閲覧室"),await n(e.getByRole("combobox",{name:"北書庫の扉の開いている初期値"})).toHaveTextContent("false")}),await o("開始シーンを編集する",async()=>{const a=e.getByLabelText("開始シーン");await t.clear(a),await t.type(a,"非常灯が点滅する実験室で目を覚ます。"),await n(a).toHaveValue("非常灯が点滅する実験室で目を覚ます。")})}},v={name:"US-E04: 挿絵設定を作成時と同じ操作で編集したい",play:async({canvasElement:i,step:o})=>{const e=r(i);await y(e,"挿絵"),await o("画風・ムード・NG要素を編集できる",async()=>{await n(e.getByLabelText("挿絵の画風")).toHaveValue("冷たい研究施設のコンセプトアート"),await n(e.getByLabelText("挿絵のムード")).toHaveValue("静かな緊張感"),await n(e.getByLabelText("挿絵の禁止要素")).toHaveValue("明るい屋外、コミカルな表現")})}},w={name:"US-E05: 保存済み下書きの公開準備を確認して公開したい",play:async({canvasElement:i,step:o})=>{const e=r(i);await o("公開準備を確認するまで公開操作は無効になっている",async()=>{await n(e.getByRole("button",{name:"シナリオを公開"})).toBeDisabled(),await t.click(e.getByRole("button",{name:"公開準備を確認"})),await n(e.getByTestId("publish-readiness")).toHaveTextContent("公開できます。")}),await o("準備完了後にシナリオを公開する",async()=>{await t.click(e.getByRole("button",{name:"シナリオを公開"})),await n(e.getByTestId("publish-success")).toHaveTextContent("公開が完了しました。"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("シナリオを公開しました。")})}},g={name:"US-E06: Sessionの状態を取り込み、公開版よりドラフトが改善したか反復確認したい",play:async({canvasElement:i,step:o})=>{const e=r(i);await o("基本情報のトーンと世界観を未保存のまま改稿する",async()=>{const a=e.getByLabelText("シナリオのトーン");await t.clear(a),await t.type(a,"静謐で、同じ所作を繰り返さず、新しい事実を一つずつ明かす");const s=e.getByLabelText("世界観・設定");await t.clear(s),await t.type(s,"館の東棟には前主人の帳簿があり、メイドは信頼が高まった時だけ存在を明かす。")}),await y(e,"テスト"),await o("SessionとTurnを指定して実際のテスト条件をインポートする",async()=>{await t.type(e.getByLabelText("インポートするSession ID"),"SES-MAID-001"),await t.type(e.getByLabelText("インポートするTurn ID"),"TRN-MAID-004"),await t.click(e.getByRole("button",{name:"インポート"})),await n(e.getByTestId("narrative-test-notice")).toHaveTextContent("取り込みました"),await n(e.getByLabelText("Turn 1 Narrative")).toHaveValue("メイドは紅茶を注ぎ、庭のバラについて語った。")}),await o("過去Turnと状態を編集し、公開版と未保存ドラフトを同じ条件で比較する",async()=>{const a=e.getByLabelText("Turn 1 Narrative");await t.clear(a),await t.type(a,"メイドは庭の由来を説明した。"),await t.click(e.getByRole("button",{name:"公開版と未保存ドラフトを比較"}));const s=await e.findByTestId("narrative-comparison");await n(s).toHaveTextContent("公開版"),await n(s).toHaveTextContent("未保存ドラフト"),await n(s).toHaveTextContent("東棟の帳簿"),await n(e.getByTestId("scenario-notice")).not.toHaveTextContent("変更を保存しました")})}},b={name:"US-E07: Scenarioを起点に独立した評価Draftを作成したい",play:async({canvasElement:i,step:o})=>{const e=r(i);await y(e,"テスト"),await o("Session Turnを取り込み、Narrative比較条件を確認する",async()=>{await t.type(e.getByLabelText("インポートするSession ID"),"SES-MAID-001"),await t.type(e.getByLabelText("インポートするTurn ID"),"TRN-MAID-004"),await t.click(e.getByRole("button",{name:"インポート"})),await n(e.getByLabelText("NarrativeテストのPlayer Input")).toHaveValue("この館について、まだ知らないことを教えて")}),await o("Scenarioにネストせず、新しい評価ドメインへの導線を使う",async()=>{await n(e.getByRole("button",{name:"評価セッションを作成"})).toBeVisible(),await n(e.getByText(/評価はScenarioに所属せず/)).toBeVisible(),await t.click(e.getByRole("button",{name:"評価セッションを作成"}))})}},d={name:"US-E11: 既存ルールデータのstable codeを保って編集したい",play:async({canvasElement:i,step:o})=>{const e=r(i),a=r(i.ownerDocument.body);await y(e,"エンティティ"),await o("Object Typeの行から編集ペインを開き、stable codeを保って表示名を編集する",async()=>{await t.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await n(a.getByRole("dialog",{name:"書庫の扉"})).toBeVisible(),await n(a.getByLabelText("種類のstable code")).toHaveValue("archive-door"),await t.click(a.getByRole("button",{name:"開いているを編集"})),await n(a.getByRole("dialog",{name:"開いている"})).toHaveAttribute("data-layer","1"),await n(a.getByLabelText("状態1のstable code")).toHaveValue("open"),await t.click(a.getByRole("button",{name:"状態の編集を完了"})),await t.click(a.getByRole("button",{name:"扉を開けるを編集"})),await n(a.getByRole("dialog",{name:"扉を開ける"})).toHaveAttribute("data-layer","1"),await n(a.getByLabelText("アクション1のstable code")).toHaveValue("open"),await t.click(a.getByRole("button",{name:"アクションの編集を完了"})),await t.clear(a.getByLabelText("種類の表示名")),await t.type(a.getByLabelText("種類の表示名"),"封印書庫の扉"),await t.click(a.getByRole("button",{name:"編集を完了"}))}),await y(e,"場所"),await o("場所とエンティティの各ステップで編集ペインを開く",async()=>{await t.click(e.getByRole("button",{name:"水没した閲覧室を編集"})),await n(a.getByLabelText("場所のstable code")).toHaveValue("sunken-library"),await t.clear(a.getByLabelText("場所の表示名")),await t.type(a.getByLabelText("場所の表示名"),"水没した中央閲覧室"),await t.click(a.getByRole("button",{name:"編集を完了"})),await y(e,"エンティティ"),await t.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await n(a.getByLabelText("エンティティのstable code")).toHaveValue("north-archive-door"),await t.click(a.getByRole("button",{name:"編集を完了"}))}),await o("Type generic ruleとObject adjust operationを維持したまま変更を保存する",async()=>{await t.click(e.getByRole("button",{name:/^封印書庫の扉を編集$/})),await n(a.getByRole("button",{name:"generic-openの実行ルールを編集"})).toBeVisible(),await t.click(a.getByRole("button",{name:"編集を完了"})),await t.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await n(a.getByRole("table",{name:"Object states"})).toHaveTextContent("開いている"),await n(a.getByRole("table",{name:"Object actions"})).toHaveTextContent("扉を開ける"),await n(a.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"})).toBeVisible(),await t.click(a.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"})),await n(a.queryByLabelText("実行ルールの優先度")).not.toBeInTheDocument(),await t.click(a.getByRole("button",{name:"閉じる"})),await t.click(a.getByRole("button",{name:"編集を完了"})),await n(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await t.click(e.getByRole("button",{name:"変更を保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました"),await n(e.queryByRole("button",{name:"アクション結果へ"})).not.toBeInTheDocument()})}};var T,x,E;u.parameters={...u.parameters,docs:{...(T=u.parameters)==null?void 0:T.docs,source:{originalSource:`{
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
}`,...(E=(x=u.parameters)==null?void 0:x.docs)==null?void 0:E.source}}};var S,R,k;m.parameters={...m.parameters,docs:{...(S=m.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
}`,...(k=(R=m.parameters)==null?void 0:R.docs)==null?void 0:k.source}}};var H,L,h;p.parameters={...p.parameters,docs:{...(H=p.parameters)==null?void 0:H.docs,source:{originalSource:`{
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
}`,...(h=(L=p.parameters)==null?void 0:L.docs)==null?void 0:h.source}}};var I,C,V;v.parameters={...v.parameters,docs:{...(I=v.parameters)==null?void 0:I.docs,source:{originalSource:`{
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
}`,...(V=(C=v.parameters)==null?void 0:C.docs)==null?void 0:V.source}}};var D,f,U;w.parameters={...w.parameters,docs:{...(D=w.parameters)==null?void 0:D.docs,source:{originalSource:`{
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
}`,...(U=(f=w.parameters)==null?void 0:f.docs)==null?void 0:U.source}}};var N,A,j;g.parameters={...g.parameters,docs:{...(N=g.parameters)==null?void 0:N.docs,source:{originalSource:`{
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
}`,...(j=(A=g.parameters)==null?void 0:A.docs)==null?void 0:j.source}}};var M,F,O;b.parameters={...b.parameters,docs:{...(M=b.parameters)==null?void 0:M.docs,source:{originalSource:`{
  name: 'US-E07: Scenarioを起点に独立した評価Draftを作成したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'テスト');
    await step('Session Turnを取り込み、Narrative比較条件を確認する', async () => {
      await userEvent.type(canvas.getByLabelText('インポートするSession ID'), 'SES-MAID-001');
      await userEvent.type(canvas.getByLabelText('インポートするTurn ID'), 'TRN-MAID-004');
      await userEvent.click(canvas.getByRole('button', {
        name: 'インポート'
      }));
      await expect(canvas.getByLabelText('NarrativeテストのPlayer Input')).toHaveValue('この館について、まだ知らないことを教えて');
    });
    await step('Scenarioにネストせず、新しい評価ドメインへの導線を使う', async () => {
      await expect(canvas.getByRole('button', {
        name: '評価セッションを作成'
      })).toBeVisible();
      await expect(canvas.getByText(/評価はScenarioに所属せず/)).toBeVisible();
      await userEvent.click(canvas.getByRole('button', {
        name: '評価セッションを作成'
      }));
    });
  }
}`,...(O=(F=b.parameters)==null?void 0:F.docs)==null?void 0:O.source}}};var $,P,G;d.parameters={...d.parameters,docs:{...($=d.parameters)==null?void 0:$.docs,source:{originalSource:`{
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
}`,...(G=(P=d.parameters)==null?void 0:P.docs)==null?void 0:G.source}}};const Ie=["USE01EditExistingScenario","USE02EditBasics","USE03EditHeroAndOpening","USE04EditIllustration","USE05CheckReadinessAndPublish","USE06CompareUnsavedDraftNarrative","USE07CreateIndependentEvaluation","USE11EditRuleDataWithStableCodes"];export{u as USE01EditExistingScenario,m as USE02EditBasics,p as USE03EditHeroAndOpening,v as USE04EditIllustration,w as USE05CheckReadinessAndPublish,g as USE06CompareUnsavedDraftNarrative,b as USE07CreateIndependentEvaluation,d as USE11EditRuleDataWithStableCodes,Ie as __namedExportsOrder,he as default};
