import{j as A}from"./jsx-runtime-BO8uF4Og.js";import{w as s,e as n,u as a}from"./index-C4S39nCK.js";import{E as M,M as b}from"./MyrialeApp-DR6VVePB.js";import{c as _}from"./SessionPresentation-CUMwxRnx.js";import{r as G}from"./index-D4H_InIO.js";import{c as P}from"./scenarioRegistrationFixtures-Cq4qK-CU.js";/* empty css               */import"./ConditionTablePresentation-BBk8wS_M.js";import"./Surfaces-xpIMDkG0.js";import"./EditPane-OsFMeo59.js";import"./MyrialeToggle-nBW4_8Wv.js";import"./navigationRecipes-DkSbwkz5.js";import"./index-DzKAYa42.js";import"./AppChrome-CqlUs9ri.js";import"./MyrialeMenu-CLGgTteF.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./ModuleUiHost-DZh55JlF.js";import"./TurnInspectionPresentation-CcW_7p87.js";import"./account-CrOIROJF.js";import"./SessionListPresentation-Cou-SJ3F.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-CwmT_au6.js";const W={title:"目覚めの研究室",summary:`# シナリオ
閉鎖された地下研究施設から脱出します。
# 描写
- 緊張感のある静かな雰囲気を維持する`,genre:"SF,ミステリー,脱出劇",aiFreedom:"低: 厳密に守る",heroMode:"free",heroFreeGenerationAllowed:!1,hero:"記憶を失った人物として自由に作成する。",opening:"あなたは閉鎖された地下研究施設で目を覚ます。",illustrationStyle:"冷たい研究施設のコンセプトアート",illustrationMood:"静かな緊張感",illustrationNegative:"明るい屋外、コミカルな表現",sampleScene:"非常灯だけが点滅する無人の実験室。",ruleData:structuredClone(P)},q={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function O({scenarioId:i}){const[o,e]=G.useState(!1),t=async v=>(e(!0),await Promise.resolve(),e(!1),{ok:!0,message:`「${v.title}」の変更を保存しました。`,value:{scenarioId:i}}),l=async(v,c)=>({ok:!0,message:c==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",value:{message:c==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",suggestions:[{id:"edit-suggestion",body:`## 改稿案

研究施設の非常灯が、一定の間隔で明滅しています。`,rationale:"現在の設定を維持した案です。"}]}}),N=async(v,c)=>({ok:!0,message:"隔離されたルールエンジンで実行しました。",value:{snapshot:{schemaVersion:"rule-action-snapshot.v1",snapshotId:"EDIT-DEBUG",currentLocation:{id:c.currentLocationCode,code:c.currentLocationCode,name:c.currentLocationCode,description:""},objects:[],actions:[]},decision:null,selectedRuleCode:null,appliedEffects:[],postState:null,facts:[],events:[],hints:[],forbiddenFacts:[]}}),$=async()=>({ok:!0,message:"公開準備が完了しています。シナリオを公開できます。",value:{definitionVersionId:`demo-${i}`,ready:!0,errors:{}}}),F=async()=>({ok:!0,message:"シナリオを公開しました。公開版として利用できます。"});return A.jsx(M,{account:q,scenarioId:i,initialValues:W,status:"ready",saving:o,aiWorking:!1,actions:{save:t,assist:l,debug:N,checkReadiness:$,publish:F},onRetry:()=>{},onLogout:()=>{}})}O.__docgenInfo={description:"",methods:[],displayName:"MockEditScenarioContainer",props:{scenarioId:{required:!0,tsType:{name:"string"},description:""}}};const ve={title:"ユーザーストーリー/Edit scenario",component:b,render:()=>A.jsx(b,{initialUrl:"/scenarios/SCN-AWAKENING-LAB/edit",initialDb:_("empty"),editScenarioContainer:O}),parameters:{notes:"シナリオ登録と同じ共通フォームを使い、保存済みの値を読み込んで編集します。"}},r=async(i,o)=>{await a.click(await i.findByRole("button",{name:`${o}へ`}))},y={name:"US-E01: 作成画面と同じフォームで既存シナリオを編集したい",play:async({canvasElement:i,step:o})=>{const e=s(i);await o("登録画面と同じ7ステップの編集ウィザードに保存済み内容を読み込む",async()=>{await n(e.getByRole("main",{name:"シナリオ編集ウィザード"})).toBeVisible(),await n(e.getByRole("complementary",{name:"契約の改稿"})).toBeVisible(),await n(e.getByLabelText("シナリオタイトル")).toHaveValue("目覚めの研究室"),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("SF");for(const t of["基本情報","場所","主人公","エンティティ","開始状態","挿絵","動作確認"])await n(e.getByRole("button",{name:`${t}へ`})).toBeVisible()})}},u={name:"US-E02: タイトル・タグ・基本情報を編集して保存したい",play:async({canvasElement:i,step:o})=>{const e=s(i);await o("タイトルと基本情報を変更する",async()=>{const t=e.getByLabelText("シナリオタイトル");await a.clear(t),await a.type(t,"目覚めの研究室・改");const l=e.getByLabelText("基本情報");await a.clear(l),await a.type(l,`# シナリオ
改稿した研究施設から脱出します。`)}),await o("変更を保存する",async()=>{await a.click(e.getByRole("button",{name:"変更を保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました")})}},m={name:"US-E03: 主人公と第一場面を作成時と同じ操作で編集したい",play:async({canvasElement:i,step:o})=>{const e=s(i);await r(e,"主人公"),await o("主人公の前提を編集する",async()=>{const t=e.getByLabelText("主人公の設定");await a.clear(t),await a.type(t,"研究員または被験者として自由に作成する。")}),await r(e,"開始状態"),await o("保存済みの開始場所と初期ステートを確認する",async()=>{await n(e.getByRole("combobox",{name:"セッション開始場所"})).toHaveTextContent("水没した閲覧室"),await n(e.getByRole("combobox",{name:"北書庫の扉の開いている初期値"})).toHaveTextContent("false")}),await o("開始シーンを編集する",async()=>{const t=e.getByLabelText("開始シーン");await a.clear(t),await a.type(t,"非常灯が点滅する実験室で目を覚ます。"),await n(t).toHaveValue("非常灯が点滅する実験室で目を覚ます。")})}},p={name:"US-E04: 挿絵設定を作成時と同じ操作で編集したい",play:async({canvasElement:i,step:o})=>{const e=s(i);await r(e,"挿絵"),await o("画風・ムード・NG要素を編集できる",async()=>{await n(e.getByLabelText("挿絵の画風")).toHaveValue("冷たい研究施設のコンセプトアート"),await n(e.getByLabelText("挿絵のムード")).toHaveValue("静かな緊張感"),await n(e.getByLabelText("挿絵の禁止要素")).toHaveValue("明るい屋外、コミカルな表現")})}},w={name:"US-E05: 保存済み下書きの公開準備を確認して公開したい",play:async({canvasElement:i,step:o})=>{const e=s(i);await o("公開準備を確認するまで公開操作は無効になっている",async()=>{await n(e.getByRole("button",{name:"シナリオを公開"})).toBeDisabled(),await a.click(e.getByRole("button",{name:"公開準備を確認"})),await n(e.getByTestId("publish-readiness")).toHaveTextContent("公開できます。")}),await o("準備完了後にシナリオを公開する",async()=>{await a.click(e.getByRole("button",{name:"シナリオを公開"})),await n(e.getByTestId("publish-success")).toHaveTextContent("公開が完了しました。"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("シナリオを公開しました。")})}},g={name:"US-E11: 既存ルールデータのstable codeを保って編集したい",play:async({canvasElement:i,step:o})=>{const e=s(i),t=s(i.ownerDocument.body);await r(e,"エンティティ"),await o("Object Typeの行から編集ペインを開き、stable codeを保って表示名を編集する",async()=>{await a.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await n(t.getByRole("dialog",{name:"書庫の扉"})).toBeVisible(),await n(t.getByLabelText("種類のstable code")).toHaveValue("archive-door"),await a.click(t.getByRole("button",{name:"開いているを編集"})),await n(t.getByRole("dialog",{name:"開いている"})).toHaveAttribute("data-layer","1"),await n(t.getByLabelText("状態1のstable code")).toHaveValue("open"),await a.click(t.getByRole("button",{name:"状態の編集を完了"})),await a.click(t.getByRole("button",{name:"扉を開けるを編集"})),await n(t.getByRole("dialog",{name:"扉を開ける"})).toHaveAttribute("data-layer","1"),await n(t.getByLabelText("アクション1のstable code")).toHaveValue("open"),await a.click(t.getByRole("button",{name:"アクションの編集を完了"})),await a.clear(t.getByLabelText("種類の表示名")),await a.type(t.getByLabelText("種類の表示名"),"封印書庫の扉"),await a.click(t.getByRole("button",{name:"編集を完了"}))}),await r(e,"場所"),await o("場所とエンティティの各ステップで編集ペインを開く",async()=>{await a.click(e.getByRole("button",{name:"水没した閲覧室を編集"})),await n(t.getByLabelText("場所のstable code")).toHaveValue("sunken-library"),await a.clear(t.getByLabelText("場所の表示名")),await a.type(t.getByLabelText("場所の表示名"),"水没した中央閲覧室"),await a.click(t.getByRole("button",{name:"編集を完了"})),await r(e,"エンティティ"),await a.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await n(t.getByLabelText("エンティティのstable code")).toHaveValue("north-archive-door"),await a.click(t.getByRole("button",{name:"編集を完了"}))}),await o("Type generic ruleとObject adjust operationを維持したまま変更を保存する",async()=>{await a.click(e.getByRole("button",{name:/^封印書庫の扉を編集$/})),await n(t.getByRole("button",{name:"generic-openの実行ルールを編集"})).toBeVisible(),await a.click(t.getByRole("button",{name:"編集を完了"})),await a.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await n(t.getByRole("table",{name:"Object states"})).toHaveTextContent("開いている"),await n(t.getByRole("table",{name:"Object actions"})).toHaveTextContent("扉を開ける"),await n(t.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"})).toBeVisible(),await a.click(t.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"})),await n(t.queryByLabelText("実行ルールの優先度")).not.toBeInTheDocument(),await a.click(t.getByRole("button",{name:"閉じる"})),await a.click(t.getByRole("button",{name:"編集を完了"})),await n(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await a.click(e.getByRole("button",{name:"変更を保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました"),await n(e.queryByRole("button",{name:"アクション結果へ"})).not.toBeInTheDocument()})}};var B,d,x;y.parameters={...y.parameters,docs:{...(B=y.parameters)==null?void 0:B.docs,source:{originalSource:`{
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
      for (const stepName of ['基本情報', '場所', '主人公', 'エンティティ', '開始状態', '挿絵', '動作確認']) {
        await expect(canvas.getByRole('button', {
          name: \`\${stepName}へ\`
        })).toBeVisible();
      }
    });
  }
}`,...(x=(d=y.parameters)==null?void 0:d.docs)==null?void 0:x.source}}};var E,T,R;u.parameters={...u.parameters,docs:{...(E=u.parameters)==null?void 0:E.docs,source:{originalSource:`{
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
}`,...(R=(T=u.parameters)==null?void 0:T.docs)==null?void 0:R.source}}};var S,k,h;m.parameters={...m.parameters,docs:{...(S=m.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
}`,...(h=(k=m.parameters)==null?void 0:k.docs)==null?void 0:h.source}}};var H,L,C;p.parameters={...p.parameters,docs:{...(H=p.parameters)==null?void 0:H.docs,source:{originalSource:`{
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
}`,...(C=(L=p.parameters)==null?void 0:L.docs)==null?void 0:C.source}}};var V,f,U;w.parameters={...w.parameters,docs:{...(V=w.parameters)==null?void 0:V.docs,source:{originalSource:`{
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
}`,...(U=(f=w.parameters)==null?void 0:f.docs)==null?void 0:U.source}}};var I,D,j;g.parameters={...g.parameters,docs:{...(I=g.parameters)==null?void 0:I.docs,source:{originalSource:`{
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
}`,...(j=(D=g.parameters)==null?void 0:D.docs)==null?void 0:j.source}}};const be=["USE01EditExistingScenario","USE02EditBasics","USE03EditHeroAndOpening","USE04EditIllustration","USE05CheckReadinessAndPublish","USE11EditRuleDataWithStableCodes"];export{y as USE01EditExistingScenario,u as USE02EditBasics,m as USE03EditHeroAndOpening,p as USE04EditIllustration,w as USE05CheckReadinessAndPublish,g as USE11EditRuleDataWithStableCodes,be as __namedExportsOrder,ve as default};
