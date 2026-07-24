import{j as H}from"./jsx-runtime-BO8uF4Og.js";import{w as p,e as t,u as i}from"./index-C4S39nCK.js";import{E as h,M as g}from"./MyrialeApp-ZQngvctH.js";import{c as A}from"./SessionPresentation-D068_rID.js";import{r as C}from"./index-D4H_InIO.js";/* empty css               */import"./AppChrome-D1WZMIQm.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BJ2tbK4f.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CtcPHE9S.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./ModuleUiHost-QlDy0LN2.js";import"./account-BQw43enD.js";import"./SessionListPresentation-DoQShwvc.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-CMz3MXAB.js";const I={title:"目覚めの研究室",summary:`# シナリオ
閉鎖された地下研究施設から脱出します。
# 描写
- 緊張感のある静かな雰囲気を維持する`,genre:"SF,ミステリー,脱出劇",aiFreedom:"低: 厳密に守る",heroMode:"free",heroFreeGenerationAllowed:!1,hero:"記憶を失った人物として自由に作成する。",opening:"あなたは閉鎖された地下研究施設で目を覚ます。",illustrationStyle:"冷たい研究施設のコンセプトアート",illustrationMood:"静かな緊張感",illustrationNegative:"明るい屋外、コミカルな表現",sampleScene:"非常灯だけが点滅する無人の実験室。"},k={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function f({scenarioId:n}){const[a,e]=C.useState(!1),s=async u=>(e(!0),await Promise.resolve(),e(!1),{ok:!0,message:`「${u.title}」の変更を保存しました。`,value:{scenarioId:n}}),o=async(u,w)=>({ok:!0,message:w==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",value:{message:w==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",suggestions:[{id:"edit-suggestion",body:`## 改稿案

研究施設の非常灯が、一定の間隔で明滅しています。`,rationale:"現在の設定を維持した案です。"}]}});return H.jsx(h,{account:k,scenarioId:n,initialValues:I,status:"ready",saving:a,aiWorking:!1,actions:{save:s,assist:o},onRetry:()=>{},onLogout:()=>{}})}f.__docgenInfo={description:"",methods:[],displayName:"MockEditScenarioContainer",props:{scenarioId:{required:!0,tsType:{name:"string"},description:""}}};const ee={title:"ユーザーストーリー/Edit scenario",component:g,render:()=>H.jsx(g,{initialUrl:"/scenarios/SCN-AWAKENING-LAB/edit",initialDb:A("empty"),editScenarioContainer:f}),parameters:{notes:"シナリオ登録と同じ共通フォームを使い、保存済みの値を読み込んで編集します。"}},y=async(n,a)=>{await i.click(n.getByRole("button",{name:`${a}へ`}))},r={name:"US-E01: 作成画面と同じフォームで既存シナリオを編集したい",play:async({canvasElement:n,step:a})=>{const e=p(n);await a("登録画面と同じ5ステップの編集ウィザードに保存済み内容を読み込む",async()=>{await t(e.getByRole("main",{name:"シナリオ編集ウィザード"})).toBeVisible(),await t(e.getByRole("complementary",{name:"契約の改稿"})).toBeVisible(),await t(e.getByLabelText("シナリオタイトル")).toHaveValue("目覚めの研究室"),await t(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("SF"),await t(e.getByRole("button",{name:"AI裁量へ"})).toBeVisible(),await t(e.getByRole("button",{name:"主人公へ"})).toBeVisible(),await t(e.getByRole("button",{name:"第一場面へ"})).toBeVisible(),await t(e.getByRole("button",{name:"挿絵へ"})).toBeVisible()})}},c={name:"US-E02: タイトル・タグ・基本情報を編集して保存したい",play:async({canvasElement:n,step:a})=>{const e=p(n);await a("タイトルと基本情報を変更する",async()=>{const s=e.getByLabelText("シナリオタイトル");await i.clear(s),await i.type(s,"目覚めの研究室・改");const o=e.getByLabelText("基本情報");await i.clear(o),await i.type(o,`# シナリオ
改稿した研究施設から脱出します。`)}),await a("変更を保存する",async()=>{await i.click(e.getByRole("button",{name:"変更を保存"})),await t(e.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました")})}},l={name:"US-E03: 主人公と第一場面を作成時と同じ操作で編集したい",play:async({canvasElement:n,step:a})=>{const e=p(n);await y(e,"主人公"),await a("主人公の前提を編集する",async()=>{const s=e.getByLabelText("主人公の設定");await i.clear(s),await i.type(s,"研究員または被験者として自由に作成する。")}),await y(e,"第一場面"),await a("開始シーンを編集する",async()=>{const s=e.getByLabelText("開始シーン");await i.clear(s),await i.type(s,"非常灯が点滅する実験室で目を覚ます。"),await t(s).toHaveValue("非常灯が点滅する実験室で目を覚ます。")})}},m={name:"US-E04: 挿絵設定を作成時と同じ操作で編集したい",play:async({canvasElement:n,step:a})=>{const e=p(n);await y(e,"挿絵"),await a("画風・ムード・NG要素を編集できる",async()=>{await t(e.getByLabelText("挿絵の画風")).toHaveValue("冷たい研究施設のコンセプトアート"),await t(e.getByLabelText("挿絵のムード")).toHaveValue("静かな緊張感"),await t(e.getByLabelText("挿絵の禁止要素")).toHaveValue("明るい屋外、コミカルな表現")})}};var v,E,B;r.parameters={...r.parameters,docs:{...(v=r.parameters)==null?void 0:v.docs,source:{originalSource:`{
  name: 'US-E01: 作成画面と同じフォームで既存シナリオを編集したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('登録画面と同じ5ステップの編集ウィザードに保存済み内容を読み込む', async () => {
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
}`,...(B=(E=r.parameters)==null?void 0:E.docs)==null?void 0:B.source}}};var d,x,b;c.parameters={...c.parameters,docs:{...(d=c.parameters)==null?void 0:d.docs,source:{originalSource:`{
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
}`,...(b=(x=c.parameters)==null?void 0:x.docs)==null?void 0:b.source}}};var S,T,V;l.parameters={...l.parameters,docs:{...(S=l.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
}`,...(V=(T=l.parameters)==null?void 0:T.docs)==null?void 0:V.source}}};var R,L,U;m.parameters={...m.parameters,docs:{...(R=m.parameters)==null?void 0:R.docs,source:{originalSource:`{
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
}`,...(U=(L=m.parameters)==null?void 0:L.docs)==null?void 0:U.source}}};const ae=["USE01EditExistingScenario","USE02EditBasics","USE03EditHeroAndOpening","USE04EditIllustration"];export{r as USE01EditExistingScenario,c as USE02EditBasics,l as USE03EditHeroAndOpening,m as USE04EditIllustration,ae as __namedExportsOrder,ee as default};
