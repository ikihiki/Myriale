import{j as f}from"./jsx-runtime-BO8uF4Og.js";import{w as s,e as n,u as t}from"./index-C4S39nCK.js";import{E as D,M as v}from"./MyrialeApp-CbNNvhJi.js";import{c as A}from"./SessionPresentation-DP3GsVb7.js";import{r as j}from"./index-D4H_InIO.js";import{c as F}from"./scenarioRegistrationFixtures-Dz8Zpj2f.js";/* empty css               */import"./AppChrome-BkdY0wXO.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-CqDS5xl9.js";import"./index-BIT3Y9dO.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-BTf3rYTM.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./EditPane-C5jhZN_z.js";import"./ModuleUiHost-CoZk1x5n.js";import"./account-BWNsQhIt.js";import"./SessionListPresentation-D_70Z9Xo.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-CgkOYOr_.js";const N={title:"目覚めの研究室",summary:`# シナリオ
閉鎖された地下研究施設から脱出します。
# 描写
- 緊張感のある静かな雰囲気を維持する`,genre:"SF,ミステリー,脱出劇",aiFreedom:"低: 厳密に守る",heroMode:"free",heroFreeGenerationAllowed:!1,hero:"記憶を失った人物として自由に作成する。",opening:"あなたは閉鎖された地下研究施設で目を覚ます。",illustrationStyle:"冷たい研究施設のコンセプトアート",illustrationMood:"静かな緊張感",illustrationNegative:"明るい屋外、コミカルな表現",sampleScene:"非常灯だけが点滅する無人の実験室。",ruleData:structuredClone(F)},O={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function I({scenarioId:i}){const[o,e]=j.useState(!1),a=async w=>(e(!0),await Promise.resolve(),e(!1),{ok:!0,message:`「${w.title}」の変更を保存しました。`,value:{scenarioId:i}}),r=async(w,g)=>({ok:!0,message:g==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",value:{message:g==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",suggestions:[{id:"edit-suggestion",body:`## 改稿案

研究施設の非常灯が、一定の間隔で明滅しています。`,rationale:"現在の設定を維持した案です。"}]}});return f.jsx(D,{account:O,scenarioId:i,initialValues:N,status:"ready",saving:o,aiWorking:!1,actions:{save:a,assist:r},onRetry:()=>{},onLogout:()=>{}})}I.__docgenInfo={description:"",methods:[],displayName:"MockEditScenarioContainer",props:{scenarioId:{required:!0,tsType:{name:"string"},description:""}}};const re={title:"ユーザーストーリー/Edit scenario",component:v,render:()=>f.jsx(v,{initialUrl:"/scenarios/SCN-AWAKENING-LAB/edit",initialDb:A("empty"),editScenarioContainer:I}),parameters:{notes:"シナリオ登録と同じ共通フォームを使い、保存済みの値を読み込んで編集します。"}},c=async(i,o)=>{await t.click(i.getByRole("button",{name:`${o}へ`}))},l={name:"US-E01: 作成画面と同じフォームで既存シナリオを編集したい",play:async({canvasElement:i,step:o})=>{const e=s(i);await o("登録画面と同じ7ステップの編集ウィザードに保存済み内容を読み込む",async()=>{await n(e.getByRole("main",{name:"シナリオ編集ウィザード"})).toBeVisible(),await n(e.getByRole("complementary",{name:"契約の改稿"})).toBeVisible(),await n(e.getByLabelText("シナリオタイトル")).toHaveValue("目覚めの研究室"),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("SF"),await n(e.getByRole("button",{name:"AI裁量へ"})).toBeVisible(),await n(e.getByRole("button",{name:"主人公へ"})).toBeVisible(),await n(e.getByRole("button",{name:"第一場面へ"})).toBeVisible(),await n(e.getByRole("button",{name:"挿絵へ"})).toBeVisible()})}},y={name:"US-E02: タイトル・タグ・基本情報を編集して保存したい",play:async({canvasElement:i,step:o})=>{const e=s(i);await o("タイトルと基本情報を変更する",async()=>{const a=e.getByLabelText("シナリオタイトル");await t.clear(a),await t.type(a,"目覚めの研究室・改");const r=e.getByLabelText("基本情報");await t.clear(r),await t.type(r,`# シナリオ
改稿した研究施設から脱出します。`)}),await o("変更を保存する",async()=>{await t.click(e.getByRole("button",{name:"変更を保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました")})}},m={name:"US-E03: 主人公と第一場面を作成時と同じ操作で編集したい",play:async({canvasElement:i,step:o})=>{const e=s(i);await c(e,"主人公"),await o("主人公の前提を編集する",async()=>{const a=e.getByLabelText("主人公の設定");await t.clear(a),await t.type(a,"研究員または被験者として自由に作成する。")}),await c(e,"第一場面"),await o("開始シーンを編集する",async()=>{const a=e.getByLabelText("開始シーン");await t.clear(a),await t.type(a,"非常灯が点滅する実験室で目を覚ます。"),await n(a).toHaveValue("非常灯が点滅する実験室で目を覚ます。")})}},p={name:"US-E04: 挿絵設定を作成時と同じ操作で編集したい",play:async({canvasElement:i,step:o})=>{const e=s(i);await c(e,"挿絵"),await o("画風・ムード・NG要素を編集できる",async()=>{await n(e.getByLabelText("挿絵の画風")).toHaveValue("冷たい研究施設のコンセプトアート"),await n(e.getByLabelText("挿絵のムード")).toHaveValue("静かな緊張感"),await n(e.getByLabelText("挿絵の禁止要素")).toHaveValue("明るい屋外、コミカルな表現")})}},u={name:"US-E11: 既存ルールデータのstable codeを保って編集したい",play:async({canvasElement:i,step:o})=>{const e=s(i),a=s(i.ownerDocument.body);await c(e,"世界データ"),await o("Object Typeの行から編集ペインを開き、stable codeを保って表示名を編集する",async()=>{await t.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await n(a.getByRole("dialog",{name:"書庫の扉"})).toBeVisible(),await n(a.getByLabelText("種類のstable code")).toHaveValue("archive-door"),await n(a.getByLabelText("状態1のcode")).toHaveValue("open"),await n(a.getByLabelText("アクション1のcode")).toHaveValue("open"),await t.clear(a.getByLabelText("種類の表示名")),await t.type(a.getByLabelText("種類の表示名"),"封印書庫の扉"),await t.click(a.getByRole("button",{name:"編集を完了"}))}),await o("同じページでLocationとObjectの編集ペインを順番に開く",async()=>{await t.click(e.getByRole("button",{name:"水没した閲覧室を編集"})),await n(a.getByLabelText("場所のstable code")).toHaveValue("sunken-library"),await t.clear(a.getByLabelText("場所の表示名")),await t.type(a.getByLabelText("場所の表示名"),"水没した中央閲覧室"),await t.click(a.getByRole("button",{name:"編集を完了"})),await t.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await n(a.getByLabelText("オブジェクトのstable code")).toHaveValue("north-archive-door"),await t.click(a.getByRole("button",{name:"編集を完了"}))}),await c(e,"アクション結果"),await o("決定的な結果を維持したまま変更を保存する",async()=>{await n(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await t.click(e.getByRole("button",{name:"変更を保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました")})}};var b,B,d;l.parameters={...l.parameters,docs:{...(b=l.parameters)==null?void 0:b.docs,source:{originalSource:`{
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
}`,...(d=(B=l.parameters)==null?void 0:B.docs)==null?void 0:d.source}}};var x,E,T;y.parameters={...y.parameters,docs:{...(x=y.parameters)==null?void 0:x.docs,source:{originalSource:`{
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
}`,...(T=(E=y.parameters)==null?void 0:E.docs)==null?void 0:T.source}}};var S,L,R;m.parameters={...m.parameters,docs:{...(S=m.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
}`,...(R=(L=m.parameters)==null?void 0:L.docs)==null?void 0:R.source}}};var V,H,h;p.parameters={...p.parameters,docs:{...(V=p.parameters)==null?void 0:V.docs,source:{originalSource:`{
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
}`,...(h=(H=p.parameters)==null?void 0:H.docs)==null?void 0:h.source}}};var k,U,C;u.parameters={...u.parameters,docs:{...(k=u.parameters)==null?void 0:k.docs,source:{originalSource:`{
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
      await expect(screen.getByLabelText('状態1のcode')).toHaveValue('open');
      await expect(screen.getByLabelText('アクション1のcode')).toHaveValue('open');
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
    await goToStep(canvas, 'アクション結果');
    await step('決定的な結果を維持したまま変更を保存する', async () => {
      await expect(canvas.getByTestId('rule-readiness')).toHaveTextContent('決定的です');
      await userEvent.click(canvas.getByRole('button', {
        name: '変更を保存'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('変更を保存しました');
    });
  }
}`,...(C=(U=u.parameters)==null?void 0:U.docs)==null?void 0:C.source}}};const le=["USE01EditExistingScenario","USE02EditBasics","USE03EditHeroAndOpening","USE04EditIllustration","USE11EditRuleDataWithStableCodes"];export{l as USE01EditExistingScenario,y as USE02EditBasics,m as USE03EditHeroAndOpening,p as USE04EditIllustration,u as USE11EditRuleDataWithStableCodes,le as __namedExportsOrder,re as default};
