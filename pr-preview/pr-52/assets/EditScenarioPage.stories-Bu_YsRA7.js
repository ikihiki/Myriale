import{j as I}from"./jsx-runtime-BO8uF4Og.js";import{w as c,e as a,u as n}from"./index-C4S39nCK.js";import{E as j,M as g}from"./MyrialeApp-B6dVSlb8.js";import{c as A}from"./SessionPresentation-CgKm7HXU.js";import{r as O}from"./index-D4H_InIO.js";import{c as D}from"./scenarioRegistrationFixtures-Dz8Zpj2f.js";/* empty css               */import"./AppChrome-D1WZMIQm.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BJ2tbK4f.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CtcPHE9S.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./ModuleUiHost-CoZk1x5n.js";import"./account-BQw43enD.js";import"./SessionListPresentation-DoQShwvc.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-CgkOYOr_.js";const F={title:"目覚めの研究室",summary:`# シナリオ
閉鎖された地下研究施設から脱出します。
# 描写
- 緊張感のある静かな雰囲気を維持する`,genre:"SF,ミステリー,脱出劇",aiFreedom:"低: 厳密に守る",heroMode:"free",heroFreeGenerationAllowed:!1,hero:"記憶を失った人物として自由に作成する。",opening:"あなたは閉鎖された地下研究施設で目を覚ます。",illustrationStyle:"冷たい研究施設のコンセプトアート",illustrationMood:"静かな緊張感",illustrationNegative:"明るい屋外、コミカルな表現",sampleScene:"非常灯だけが点滅する無人の実験室。",ruleData:structuredClone(D)},N={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function k({scenarioId:o}){const[t,e]=O.useState(!1),s=async u=>(e(!0),await Promise.resolve(),e(!1),{ok:!0,message:`「${u.title}」の変更を保存しました。`,value:{scenarioId:o}}),r=async(u,w)=>({ok:!0,message:w==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",value:{message:w==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",suggestions:[{id:"edit-suggestion",body:`## 改稿案

研究施設の非常灯が、一定の間隔で明滅しています。`,rationale:"現在の設定を維持した案です。"}]}});return I.jsx(j,{account:N,scenarioId:o,initialValues:F,status:"ready",saving:t,aiWorking:!1,actions:{save:s,assist:r},onRetry:()=>{},onLogout:()=>{}})}k.__docgenInfo={description:"",methods:[],displayName:"MockEditScenarioContainer",props:{scenarioId:{required:!0,tsType:{name:"string"},description:""}}};const ie={title:"ユーザーストーリー/Edit scenario",component:g,render:()=>I.jsx(g,{initialUrl:"/scenarios/SCN-AWAKENING-LAB/edit",initialDb:A("empty"),editScenarioContainer:k}),parameters:{notes:"シナリオ登録と同じ共通フォームを使い、保存済みの値を読み込んで編集します。"}},i=async(o,t)=>{await n.click(o.getByRole("button",{name:`${t}へ`}))},l={name:"US-E01: 作成画面と同じフォームで既存シナリオを編集したい",play:async({canvasElement:o,step:t})=>{const e=c(o);await t("登録画面と同じ8ステップの編集ウィザードに保存済み内容を読み込む",async()=>{await a(e.getByRole("main",{name:"シナリオ編集ウィザード"})).toBeVisible(),await a(e.getByRole("complementary",{name:"契約の改稿"})).toBeVisible(),await a(e.getByLabelText("シナリオタイトル")).toHaveValue("目覚めの研究室"),await a(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("SF"),await a(e.getByRole("button",{name:"AI裁量へ"})).toBeVisible(),await a(e.getByRole("button",{name:"主人公へ"})).toBeVisible(),await a(e.getByRole("button",{name:"第一場面へ"})).toBeVisible(),await a(e.getByRole("button",{name:"挿絵へ"})).toBeVisible()})}},p={name:"US-E02: タイトル・タグ・基本情報を編集して保存したい",play:async({canvasElement:o,step:t})=>{const e=c(o);await t("タイトルと基本情報を変更する",async()=>{const s=e.getByLabelText("シナリオタイトル");await n.clear(s),await n.type(s,"目覚めの研究室・改");const r=e.getByLabelText("基本情報");await n.clear(r),await n.type(r,`# シナリオ
改稿した研究施設から脱出します。`)}),await t("変更を保存する",async()=>{await n.click(e.getByRole("button",{name:"変更を保存"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました")})}},y={name:"US-E03: 主人公と第一場面を作成時と同じ操作で編集したい",play:async({canvasElement:o,step:t})=>{const e=c(o);await i(e,"主人公"),await t("主人公の前提を編集する",async()=>{const s=e.getByLabelText("主人公の設定");await n.clear(s),await n.type(s,"研究員または被験者として自由に作成する。")}),await i(e,"第一場面"),await t("開始シーンを編集する",async()=>{const s=e.getByLabelText("開始シーン");await n.clear(s),await n.type(s,"非常灯が点滅する実験室で目を覚ます。"),await a(s).toHaveValue("非常灯が点滅する実験室で目を覚ます。")})}},m={name:"US-E04: 挿絵設定を作成時と同じ操作で編集したい",play:async({canvasElement:o,step:t})=>{const e=c(o);await i(e,"挿絵"),await t("画風・ムード・NG要素を編集できる",async()=>{await a(e.getByLabelText("挿絵の画風")).toHaveValue("冷たい研究施設のコンセプトアート"),await a(e.getByLabelText("挿絵のムード")).toHaveValue("静かな緊張感"),await a(e.getByLabelText("挿絵の禁止要素")).toHaveValue("明るい屋外、コミカルな表現")})}},v={name:"US-E11: 既存ルールデータのstable codeを保って編集したい",play:async({canvasElement:o,step:t})=>{const e=c(o);await i(e,"種類と状態"),await t("保存済みObject Typeのstate/action interfaceを読み込んで表示名を編集する",async()=>{await a(e.getByRole("heading",{name:"保存済みObject Typeを編集"})).toBeVisible(),await a(e.getByLabelText("種類のstable code")).toHaveValue("archive-door"),await a(e.getByLabelText("状態1のcode")).toHaveValue("open"),await a(e.getByLabelText("アクション1のcode")).toHaveValue("open"),await n.clear(e.getByLabelText("種類の表示名")),await n.type(e.getByLabelText("種類の表示名"),"封印書庫の扉")}),await i(e,"場所と配置"),await t("LocationとObject placementのstable codeを保って表示名だけ改稿する",async()=>{await a(e.getByLabelText("場所のstable code")).toHaveValue("sunken-library"),await n.clear(e.getByLabelText("場所の表示名")),await n.type(e.getByLabelText("場所の表示名"),"水没した中央閲覧室"),await a(e.getByLabelText("オブジェクトのstable code")).toHaveValue("north-archive-door")}),await i(e,"アクション結果"),await t("決定的な結果を維持したまま変更を保存する",async()=>{await a(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await n.click(e.getByRole("button",{name:"変更を保存"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました")})}};var b,d,B;l.parameters={...l.parameters,docs:{...(b=l.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: 'US-E01: 作成画面と同じフォームで既存シナリオを編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('登録画面と同じ8ステップの編集ウィザードに保存済み内容を読み込む', async () => {
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
}`,...(B=(d=l.parameters)==null?void 0:d.docs)==null?void 0:B.source}}};var x,E,T;p.parameters={...p.parameters,docs:{...(x=p.parameters)==null?void 0:x.docs,source:{originalSource:`{
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
}`,...(T=(E=p.parameters)==null?void 0:E.docs)==null?void 0:T.source}}};var S,L,V;y.parameters={...y.parameters,docs:{...(S=y.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
}`,...(V=(L=y.parameters)==null?void 0:L.docs)==null?void 0:V.source}}};var H,R,h;m.parameters={...m.parameters,docs:{...(H=m.parameters)==null?void 0:H.docs,source:{originalSource:`{
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
}`,...(h=(R=m.parameters)==null?void 0:R.docs)==null?void 0:h.source}}};var U,f,C;v.parameters={...v.parameters,docs:{...(U=v.parameters)==null?void 0:U.docs,source:{originalSource:`{
  name: 'US-E11: 既存ルールデータのstable codeを保って編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '種類と状態');
    await step('保存済みObject Typeのstate/action interfaceを読み込んで表示名を編集する', async () => {
      await expect(canvas.getByRole('heading', {
        name: '保存済みObject Typeを編集'
      })).toBeVisible();
      await expect(canvas.getByLabelText('種類のstable code')).toHaveValue('archive-door');
      await expect(canvas.getByLabelText('状態1のcode')).toHaveValue('open');
      await expect(canvas.getByLabelText('アクション1のcode')).toHaveValue('open');
      await userEvent.clear(canvas.getByLabelText('種類の表示名'));
      await userEvent.type(canvas.getByLabelText('種類の表示名'), '封印書庫の扉');
    });
    await goToStep(canvas, '場所と配置');
    await step('LocationとObject placementのstable codeを保って表示名だけ改稿する', async () => {
      await expect(canvas.getByLabelText('場所のstable code')).toHaveValue('sunken-library');
      await userEvent.clear(canvas.getByLabelText('場所の表示名'));
      await userEvent.type(canvas.getByLabelText('場所の表示名'), '水没した中央閲覧室');
      await expect(canvas.getByLabelText('オブジェクトのstable code')).toHaveValue('north-archive-door');
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
}`,...(C=(f=v.parameters)==null?void 0:f.docs)==null?void 0:C.source}}};const ce=["USE01EditExistingScenario","USE02EditBasics","USE03EditHeroAndOpening","USE04EditIllustration","USE11EditRuleDataWithStableCodes"];export{l as USE01EditExistingScenario,p as USE02EditBasics,y as USE03EditHeroAndOpening,m as USE04EditIllustration,v as USE11EditRuleDataWithStableCodes,ce as __namedExportsOrder,ie as default};
