import{j as f}from"./jsx-runtime-BO8uF4Og.js";import{w as s,e as n,u as a}from"./index-C4S39nCK.js";import{E as D,M as b}from"./MyrialeApp-fX0t_m1z.js";import{c as A}from"./SessionPresentation-BIoDDMg8.js";import{r as O}from"./index-D4H_InIO.js";import{c as F}from"./scenarioRegistrationFixtures-D0pA5sl_.js";/* empty css               */import"./ConditionTablePresentation-ybfbi74E.js";import"./Surfaces-xpIMDkG0.js";import"./EditPane-OsFMeo59.js";import"./MyrialeToggle-nBW4_8Wv.js";import"./navigationRecipes-DkSbwkz5.js";import"./index-DzKAYa42.js";import"./AppChrome-CqlUs9ri.js";import"./MyrialeMenu-CLGgTteF.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./ModuleUiHost-CoZk1x5n.js";import"./account-CrOIROJF.js";import"./SessionListPresentation-Cou-SJ3F.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-Cizm6efh.js";const N={title:"目覚めの研究室",summary:`# シナリオ
閉鎖された地下研究施設から脱出します。
# 描写
- 緊張感のある静かな雰囲気を維持する`,genre:"SF,ミステリー,脱出劇",aiFreedom:"低: 厳密に守る",heroMode:"free",heroFreeGenerationAllowed:!1,hero:"記憶を失った人物として自由に作成する。",opening:"あなたは閉鎖された地下研究施設で目を覚ます。",illustrationStyle:"冷たい研究施設のコンセプトアート",illustrationMood:"静かな緊張感",illustrationNegative:"明るい屋外、コミカルな表現",sampleScene:"非常灯だけが点滅する無人の実験室。",ruleData:structuredClone(F)},M={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function I({scenarioId:i}){const[o,t]=O.useState(!1),e=async g=>(t(!0),await Promise.resolve(),t(!1),{ok:!0,message:`「${g.title}」の変更を保存しました。`,value:{scenarioId:i}}),r=async(g,c)=>({ok:!0,message:c==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",value:{message:c==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",suggestions:[{id:"edit-suggestion",body:`## 改稿案

研究施設の非常灯が、一定の間隔で明滅しています。`,rationale:"現在の設定を維持した案です。"}]}}),j=async(g,c)=>({ok:!0,message:"隔離されたルールエンジンで実行しました。",value:{snapshot:{schemaVersion:"rule-action-snapshot.v1",snapshotId:"EDIT-DEBUG",currentLocation:{id:c.currentLocationCode,code:c.currentLocationCode,name:c.currentLocationCode,description:""},objects:[],actions:[]},decision:null,selectedRuleCode:null,appliedEffects:[],postState:null,facts:[],events:[],hints:[],forbiddenFacts:[]}});return f.jsx(D,{account:M,scenarioId:i,initialValues:N,status:"ready",saving:o,aiWorking:!1,actions:{save:e,assist:r,debug:j},onRetry:()=>{},onLogout:()=>{}})}I.__docgenInfo={description:"",methods:[],displayName:"MockEditScenarioContainer",props:{scenarioId:{required:!0,tsType:{name:"string"},description:""}}};const le={title:"ユーザーストーリー/Edit scenario",component:b,render:()=>f.jsx(b,{initialUrl:"/scenarios/SCN-AWAKENING-LAB/edit",initialDb:A("empty"),editScenarioContainer:I}),parameters:{notes:"シナリオ登録と同じ共通フォームを使い、保存済みの値を読み込んで編集します。"}},w=async(i,o)=>{await a.click(await i.findByRole("button",{name:`${o}へ`}))},l={name:"US-E01: 作成画面と同じフォームで既存シナリオを編集したい",play:async({canvasElement:i,step:o})=>{const t=s(i);await o("登録画面と同じ7ステップの編集ウィザードに保存済み内容を読み込む",async()=>{await n(t.getByRole("main",{name:"シナリオ編集ウィザード"})).toBeVisible(),await n(t.getByRole("complementary",{name:"契約の改稿"})).toBeVisible(),await n(t.getByLabelText("シナリオタイトル")).toHaveValue("目覚めの研究室"),await n(t.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("SF"),await n(t.getByRole("button",{name:"AI裁量へ"})).toBeVisible(),await n(t.getByRole("button",{name:"主人公へ"})).toBeVisible(),await n(t.getByRole("button",{name:"第一場面へ"})).toBeVisible(),await n(t.getByRole("button",{name:"挿絵へ"})).toBeVisible()})}},y={name:"US-E02: タイトル・タグ・基本情報を編集して保存したい",play:async({canvasElement:i,step:o})=>{const t=s(i);await o("タイトルと基本情報を変更する",async()=>{const e=t.getByLabelText("シナリオタイトル");await a.clear(e),await a.type(e,"目覚めの研究室・改");const r=t.getByLabelText("基本情報");await a.clear(r),await a.type(r,`# シナリオ
改稿した研究施設から脱出します。`)}),await o("変更を保存する",async()=>{await a.click(t.getByRole("button",{name:"変更を保存"})),await n(t.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました")})}},u={name:"US-E03: 主人公と第一場面を作成時と同じ操作で編集したい",play:async({canvasElement:i,step:o})=>{const t=s(i);await w(t,"主人公"),await o("主人公の前提を編集する",async()=>{const e=t.getByLabelText("主人公の設定");await a.clear(e),await a.type(e,"研究員または被験者として自由に作成する。")}),await w(t,"第一場面"),await o("開始シーンを編集する",async()=>{const e=t.getByLabelText("開始シーン");await a.clear(e),await a.type(e,"非常灯が点滅する実験室で目を覚ます。"),await n(e).toHaveValue("非常灯が点滅する実験室で目を覚ます。")})}},m={name:"US-E04: 挿絵設定を作成時と同じ操作で編集したい",play:async({canvasElement:i,step:o})=>{const t=s(i);await w(t,"挿絵"),await o("画風・ムード・NG要素を編集できる",async()=>{await n(t.getByLabelText("挿絵の画風")).toHaveValue("冷たい研究施設のコンセプトアート"),await n(t.getByLabelText("挿絵のムード")).toHaveValue("静かな緊張感"),await n(t.getByLabelText("挿絵の禁止要素")).toHaveValue("明るい屋外、コミカルな表現")})}},p={name:"US-E11: 既存ルールデータのstable codeを保って編集したい",play:async({canvasElement:i,step:o})=>{const t=s(i),e=s(i.ownerDocument.body);await w(t,"世界データ"),await o("Object Typeの行から編集ペインを開き、stable codeを保って表示名を編集する",async()=>{await a.click(t.getByRole("button",{name:/^書庫の扉を編集$/})),await n(e.getByRole("dialog",{name:"書庫の扉"})).toBeVisible(),await n(e.getByLabelText("種類のstable code")).toHaveValue("archive-door"),await a.click(e.getByRole("button",{name:"開いているを編集"})),await n(e.getByRole("dialog",{name:"開いている"})).toHaveAttribute("data-layer","1"),await n(e.getByLabelText("状態1のstable code")).toHaveValue("open"),await a.click(e.getByRole("button",{name:"状態の編集を完了"})),await a.click(e.getByRole("button",{name:"扉を開けるを編集"})),await n(e.getByRole("dialog",{name:"扉を開ける"})).toHaveAttribute("data-layer","1"),await n(e.getByLabelText("アクション1のstable code")).toHaveValue("open"),await a.click(e.getByRole("button",{name:"アクションの編集を完了"})),await a.clear(e.getByLabelText("種類の表示名")),await a.type(e.getByLabelText("種類の表示名"),"封印書庫の扉"),await a.click(e.getByRole("button",{name:"編集を完了"}))}),await o("同じページでLocationとObjectの編集ペインを順番に開く",async()=>{await a.click(t.getByRole("button",{name:"水没した閲覧室を編集"})),await n(e.getByLabelText("場所のstable code")).toHaveValue("sunken-library"),await a.clear(e.getByLabelText("場所の表示名")),await a.type(e.getByLabelText("場所の表示名"),"水没した中央閲覧室"),await a.click(e.getByRole("button",{name:"編集を完了"})),await a.click(t.getByRole("button",{name:"北書庫の扉を編集"})),await n(e.getByLabelText("オブジェクトのstable code")).toHaveValue("north-archive-door"),await a.click(e.getByRole("button",{name:"編集を完了"}))}),await o("Type generic ruleとObject adjust operationを維持したまま変更を保存する",async()=>{await a.click(t.getByRole("button",{name:/^封印書庫の扉を編集$/})),await n(e.getByRole("button",{name:"generic-openの実行ルールを編集"})).toBeVisible(),await a.click(e.getByRole("button",{name:"編集を完了"})),await a.click(t.getByRole("button",{name:"北書庫の扉を編集"})),await n(e.getByRole("table",{name:"Object states"})).toHaveTextContent("開いている"),await n(e.getByRole("table",{name:"Object actions"})).toHaveTextContent("扉を開ける"),await n(e.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"})).toBeVisible(),await a.click(e.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"})),await n(e.queryByLabelText("実行ルールの優先度")).not.toBeInTheDocument(),await a.click(e.getByRole("button",{name:"閉じる"})),await a.click(e.getByRole("button",{name:"編集を完了"})),await n(t.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await a.click(t.getByRole("button",{name:"変更を保存"})),await n(t.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました"),await n(t.queryByRole("button",{name:"アクション結果へ"})).not.toBeInTheDocument()})}};var v,B,d;l.parameters={...l.parameters,docs:{...(v=l.parameters)==null?void 0:v.docs,source:{originalSource:`{
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
      await expect(canvas.getByRole('button', {
        name: 'AI裁量へ'
      })).toBeVisible();
      await expect(canvas.getByRole('button', {
        name: '主人公へ'
      })).toBeVisible();
      await expect(canvas.getByRole('button', {
        name: '第一場面へ'
      })).toBeVisible();
      await expect(canvas.getByRole('button', {
        name: '挿絵へ'
      })).toBeVisible();
    });
  }
}`,...(d=(B=l.parameters)==null?void 0:B.docs)==null?void 0:d.source}}};var x,E,R;y.parameters={...y.parameters,docs:{...(x=y.parameters)==null?void 0:x.docs,source:{originalSource:`{
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
}`,...(R=(E=y.parameters)==null?void 0:E.docs)==null?void 0:R.source}}};var T,S,k;u.parameters={...u.parameters,docs:{...(T=u.parameters)==null?void 0:T.docs,source:{originalSource:`{
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
    await goToStep(canvas, '第一場面');
    await step('開始シーンを編集する', async () => {
      const opening = canvas.getByLabelText('開始シーン');
      await userEvent.clear(opening);
      await userEvent.type(opening, '非常灯が点滅する実験室で目を覚ます。');
      await expect(opening).toHaveValue('非常灯が点滅する実験室で目を覚ます。');
    });
  }
}`,...(k=(S=u.parameters)==null?void 0:S.docs)==null?void 0:k.source}}};var L,V,H;m.parameters={...m.parameters,docs:{...(L=m.parameters)==null?void 0:L.docs,source:{originalSource:`{
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
}`,...(H=(V=m.parameters)==null?void 0:V.docs)==null?void 0:H.source}}};var h,C,U;p.parameters={...p.parameters,docs:{...(h=p.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: 'US-E11: 既存ルールデータのstable codeを保って編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '世界データ');
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
    await step('同じページでLocationとObjectの編集ペインを順番に開く', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '水没した閲覧室を編集'
      }));
      await expect(screen.getByLabelText('場所のstable code')).toHaveValue('sunken-library');
      await userEvent.clear(screen.getByLabelText('場所の表示名'));
      await userEvent.type(screen.getByLabelText('場所の表示名'), '水没した中央閲覧室');
      await userEvent.click(screen.getByRole('button', {
        name: '編集を完了'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '北書庫の扉を編集'
      }));
      await expect(screen.getByLabelText('オブジェクトのstable code')).toHaveValue('north-archive-door');
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
}`,...(U=(C=p.parameters)==null?void 0:C.docs)==null?void 0:U.source}}};const ye=["USE01EditExistingScenario","USE02EditBasics","USE03EditHeroAndOpening","USE04EditIllustration","USE11EditRuleDataWithStableCodes"];export{l as USE01EditExistingScenario,y as USE02EditBasics,u as USE03EditHeroAndOpening,m as USE04EditIllustration,p as USE11EditRuleDataWithStableCodes,ye as __namedExportsOrder,le as default};
