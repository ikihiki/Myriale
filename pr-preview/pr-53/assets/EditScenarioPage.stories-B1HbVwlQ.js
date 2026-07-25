import{j as A}from"./jsx-runtime-BO8uF4Og.js";import{w as s,e as n,u as a}from"./index-C4S39nCK.js";import{E as I,M as b}from"./MyrialeApp-B0NQEon1.js";import{c as D}from"./SessionPresentation-BjM1TTZ7.js";import{r as j}from"./index-D4H_InIO.js";import{c as O}from"./scenarioRegistrationFixtures-DeS1t2eb.js";/* empty css               */import"./AppChrome-CBArT6hJ.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-DnR2L1gN.js";import"./editPaneLayer-BYDGh10V.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CuT8m0Jw.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./EditPane-C3MJ4kyA.js";import"./ModuleUiHost-CoZk1x5n.js";import"./account-CGbtz8io.js";import"./SessionListPresentation-Dg-uj_rK.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-Cizm6efh.js";const F={title:"目覚めの研究室",summary:`# シナリオ
閉鎖された地下研究施設から脱出します。
# 描写
- 緊張感のある静かな雰囲気を維持する`,genre:"SF,ミステリー,脱出劇",aiFreedom:"低: 厳密に守る",heroMode:"free",heroFreeGenerationAllowed:!1,hero:"記憶を失った人物として自由に作成する。",opening:"あなたは閉鎖された地下研究施設で目を覚ます。",illustrationStyle:"冷たい研究施設のコンセプトアート",illustrationMood:"静かな緊張感",illustrationNegative:"明るい屋外、コミカルな表現",sampleScene:"非常灯だけが点滅する無人の実験室。",ruleData:structuredClone(O)},N={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function C({scenarioId:i}){const[o,e]=j.useState(!1),t=async p=>(e(!0),await Promise.resolve(),e(!1),{ok:!0,message:`「${p.title}」の変更を保存しました。`,value:{scenarioId:i}}),c=async(p,g)=>({ok:!0,message:g==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",value:{message:g==="summary"?"基本情報案を提示しました。":"挿絵設定の候補を提示しました。",suggestions:[{id:"edit-suggestion",body:`## 改稿案

研究施設の非常灯が、一定の間隔で明滅しています。`,rationale:"現在の設定を維持した案です。"}]}});return A.jsx(I,{account:N,scenarioId:i,initialValues:F,status:"ready",saving:o,aiWorking:!1,actions:{save:t,assist:c},onRetry:()=>{},onLogout:()=>{}})}C.__docgenInfo={description:"",methods:[],displayName:"MockEditScenarioContainer",props:{scenarioId:{required:!0,tsType:{name:"string"},description:""}}};const re={title:"ユーザーストーリー/Edit scenario",component:b,render:()=>A.jsx(b,{initialUrl:"/scenarios/SCN-AWAKENING-LAB/edit",initialDb:D("empty"),editScenarioContainer:C}),parameters:{notes:"シナリオ登録と同じ共通フォームを使い、保存済みの値を読み込んで編集します。"}},w=async(i,o)=>{await a.click(await i.findByRole("button",{name:`${o}へ`}))},r={name:"US-E01: 作成画面と同じフォームで既存シナリオを編集したい",play:async({canvasElement:i,step:o})=>{const e=s(i);await o("登録画面と同じ7ステップの編集ウィザードに保存済み内容を読み込む",async()=>{await n(e.getByRole("main",{name:"シナリオ編集ウィザード"})).toBeVisible(),await n(e.getByRole("complementary",{name:"契約の改稿"})).toBeVisible(),await n(e.getByLabelText("シナリオタイトル")).toHaveValue("目覚めの研究室"),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("SF"),await n(e.getByRole("button",{name:"AI裁量へ"})).toBeVisible(),await n(e.getByRole("button",{name:"主人公へ"})).toBeVisible(),await n(e.getByRole("button",{name:"第一場面へ"})).toBeVisible(),await n(e.getByRole("button",{name:"挿絵へ"})).toBeVisible()})}},l={name:"US-E02: タイトル・タグ・基本情報を編集して保存したい",play:async({canvasElement:i,step:o})=>{const e=s(i);await o("タイトルと基本情報を変更する",async()=>{const t=e.getByLabelText("シナリオタイトル");await a.clear(t),await a.type(t,"目覚めの研究室・改");const c=e.getByLabelText("基本情報");await a.clear(c),await a.type(c,`# シナリオ
改稿した研究施設から脱出します。`)}),await o("変更を保存する",async()=>{await a.click(e.getByRole("button",{name:"変更を保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました")})}},y={name:"US-E03: 主人公と第一場面を作成時と同じ操作で編集したい",play:async({canvasElement:i,step:o})=>{const e=s(i);await w(e,"主人公"),await o("主人公の前提を編集する",async()=>{const t=e.getByLabelText("主人公の設定");await a.clear(t),await a.type(t,"研究員または被験者として自由に作成する。")}),await w(e,"第一場面"),await o("開始シーンを編集する",async()=>{const t=e.getByLabelText("開始シーン");await a.clear(t),await a.type(t,"非常灯が点滅する実験室で目を覚ます。"),await n(t).toHaveValue("非常灯が点滅する実験室で目を覚ます。")})}},m={name:"US-E04: 挿絵設定を作成時と同じ操作で編集したい",play:async({canvasElement:i,step:o})=>{const e=s(i);await w(e,"挿絵"),await o("画風・ムード・NG要素を編集できる",async()=>{await n(e.getByLabelText("挿絵の画風")).toHaveValue("冷たい研究施設のコンセプトアート"),await n(e.getByLabelText("挿絵のムード")).toHaveValue("静かな緊張感"),await n(e.getByLabelText("挿絵の禁止要素")).toHaveValue("明るい屋外、コミカルな表現")})}},u={name:"US-E11: 既存ルールデータのstable codeを保って編集したい",play:async({canvasElement:i,step:o})=>{const e=s(i),t=s(i.ownerDocument.body);await w(e,"世界データ"),await o("Object Typeの行から編集ペインを開き、stable codeを保って表示名を編集する",async()=>{await a.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await n(t.getByRole("dialog",{name:"書庫の扉"})).toBeVisible(),await n(t.getByLabelText("種類のstable code")).toHaveValue("archive-door"),await a.click(t.getByRole("button",{name:"開いているを編集"})),await n(t.getByRole("dialog",{name:"開いている"})).toHaveAttribute("data-layer","1"),await n(t.getByLabelText("状態1のcode")).toHaveValue("open"),await a.click(t.getByRole("button",{name:"状態の編集を完了"})),await a.click(t.getByRole("button",{name:"扉を開けるを編集"})),await n(t.getByRole("dialog",{name:"扉を開ける"})).toHaveAttribute("data-layer","1"),await n(t.getByLabelText("アクション1のcode")).toHaveValue("open"),await a.click(t.getByRole("button",{name:"アクションの編集を完了"})),await a.clear(t.getByLabelText("種類の表示名")),await a.type(t.getByLabelText("種類の表示名"),"封印書庫の扉"),await a.click(t.getByRole("button",{name:"編集を完了"}))}),await o("同じページでLocationとObjectの編集ペインを順番に開く",async()=>{await a.click(e.getByRole("button",{name:"水没した閲覧室を編集"})),await n(t.getByLabelText("場所のstable code")).toHaveValue("sunken-library"),await a.clear(t.getByLabelText("場所の表示名")),await a.type(t.getByLabelText("場所の表示名"),"水没した中央閲覧室"),await a.click(t.getByRole("button",{name:"編集を完了"})),await a.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await n(t.getByLabelText("オブジェクトのstable code")).toHaveValue("north-archive-door"),await a.click(t.getByRole("button",{name:"編集を完了"}))}),await o("Action pane内のObject個別ルールを維持したまま変更を保存する",async()=>{await a.click(e.getByRole("button",{name:/^封印書庫の扉を編集$/})),await a.click(t.getByRole("button",{name:"扉を開けるを編集"})),await n(t.getByRole("button",{name:"北書庫の扉の実行ルールを編集"})).toBeVisible(),await a.click(t.getByRole("button",{name:"アクションの編集を完了"})),await a.click(t.getByRole("button",{name:"編集を完了"})),await n(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await a.click(e.getByRole("button",{name:"変更を保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("変更を保存しました"),await n(e.queryByRole("button",{name:"アクション結果へ"})).not.toBeInTheDocument()})}};var v,B,d;r.parameters={...r.parameters,docs:{...(v=r.parameters)==null?void 0:v.docs,source:{originalSource:`{
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
}`,...(d=(B=r.parameters)==null?void 0:B.docs)==null?void 0:d.source}}};var x,E,R;l.parameters={...l.parameters,docs:{...(x=l.parameters)==null?void 0:x.docs,source:{originalSource:`{
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
}`,...(R=(E=l.parameters)==null?void 0:E.docs)==null?void 0:R.source}}};var T,S,k;y.parameters={...y.parameters,docs:{...(T=y.parameters)==null?void 0:T.docs,source:{originalSource:`{
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
}`,...(k=(S=y.parameters)==null?void 0:S.docs)==null?void 0:k.source}}};var L,V,H;m.parameters={...m.parameters,docs:{...(L=m.parameters)==null?void 0:L.docs,source:{originalSource:`{
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
}`,...(H=(V=m.parameters)==null?void 0:V.docs)==null?void 0:H.source}}};var h,U,f;u.parameters={...u.parameters,docs:{...(h=u.parameters)==null?void 0:h.docs,source:{originalSource:`{
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
      await expect(screen.getByLabelText('状態1のcode')).toHaveValue('open');
      await userEvent.click(screen.getByRole('button', {
        name: '状態の編集を完了'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: '扉を開けるを編集'
      }));
      await expect(screen.getByRole('dialog', {
        name: '扉を開ける'
      })).toHaveAttribute('data-layer', '1');
      await expect(screen.getByLabelText('アクション1のcode')).toHaveValue('open');
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
    await step('Action pane内のObject個別ルールを維持したまま変更を保存する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: /^封印書庫の扉を編集$/
      }));
      await userEvent.click(screen.getByRole('button', {
        name: '扉を開けるを編集'
      }));
      await expect(screen.getByRole('button', {
        name: '北書庫の扉の実行ルールを編集'
      })).toBeVisible();
      await userEvent.click(screen.getByRole('button', {
        name: 'アクションの編集を完了'
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
}`,...(f=(U=u.parameters)==null?void 0:U.docs)==null?void 0:f.source}}};const le=["USE01EditExistingScenario","USE02EditBasics","USE03EditHeroAndOpening","USE04EditIllustration","USE11EditRuleDataWithStableCodes"];export{r as USE01EditExistingScenario,l as USE02EditBasics,y as USE03EditHeroAndOpening,m as USE04EditIllustration,u as USE11EditRuleDataWithStableCodes,le as __namedExportsOrder,re as default};
