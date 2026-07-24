import{j as l}from"./jsx-runtime-BO8uF4Og.js";import{r as Qe}from"./index-D4H_InIO.js";import{w as c,e as o,u as a}from"./index-C4S39nCK.js";import{S as aa,e as ta,M as h,c as na}from"./MyrialeApp-CbNNvhJi.js";import{u as oa,c as F}from"./SessionPresentation-DP3GsVb7.js";import{c as sa}from"./scenarioRegistrationFixtures-Dz8Zpj2f.js";/* empty css               */import"./AppChrome-BkdY0wXO.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-CqDS5xl9.js";import"./index-BIT3Y9dO.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-BTf3rYTM.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./EditPane-C5jhZN_z.js";import"./ModuleUiHost-CoZk1x5n.js";import"./account-BWNsQhIt.js";import"./SessionListPresentation-D_70Z9Xo.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-CgkOYOr_.js";const ca={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function Xe({withRuleData:n=!1}){const t=oa(),[e,s]=Qe.useState("未発行"),m=async i=>{if(!i.title.trim())return{ok:!1,message:"タイトルを入力すると下書き保存できます。",fieldErrors:{title:["シナリオタイトルを入力してください。"]}};const y="SCN-DRAFT-0427";return s(y),t==null||t.dispatch({type:"SCENARIO_SAVED",scenario:{id:y,title:i.title.trim(),status:"draft",genre:i.genre,updatedAt:"2026-07-23",summary:i.summary,tone:"",lore:"",aiFreedom:i.aiFreedom,heroMode:i.heroMode,heroFreeGenerationAllowed:i.heroFreeGenerationAllowed,hero:i.hero,opening:i.opening,illustrationStyle:i.illustrationStyle,illustrationMood:i.illustrationMood,illustrationNegative:i.illustrationNegative,sampleScene:i.sampleScene}}),{ok:!0,message:`「${i.title.trim()}」をDraftとして保存しました。ScenarioIdを発行しました。`,value:{scenarioId:y}}},ea=async(i,y)=>y==="summary"?{ok:!0,message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",value:{message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",suggestions:[{id:"summary-1",body:`## 物語の目的

地下に沈んだ王都で、禁書を読むたびに書き換わる星座の謎を追います。

- 水没した書庫を探索する
- 失われる記憶の代償を選ぶ`,rationale:"タイトル、ジャンル、基本情報からMarkdown案を生成しました。"}]}}:y==="illustration-style"?{ok:!0,message:"シナリオに合う画風候補を提示しました。",value:{message:"シナリオに合う画風候補を提示しました。",suggestions:[{id:"style-1",body:"銅版画風、影絵、水彩写本。低彩度で星図の金線だけを強調。",rationale:"既存のムードとNG要素に合わせました。"}]}}:y==="illustration-prompt"?{ok:!0,message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",value:{message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",suggestions:[{id:"prompt-1",body:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",rationale:"プロンプトとNG要素を分離しました。"}],prompt:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",negativePrompt:i.illustrationNegative}}:{ok:!0,message:"サンプルシーンのプレビューを生成しました。",value:{message:"サンプルシーンのプレビューを生成しました。",suggestions:[],previewText:`[Preview / 保存対象外] ${i.sampleScene} / ${i.illustrationStyle} / ${i.illustrationMood}`}};return l.jsx(aa,{account:ca,scenarioId:e,initialValues:n?{...ta,title:"星喰いの地下図書館",ruleData:structuredClone(sa)}:void 0,saving:!1,aiWorking:!1,actions:{saveDraft:m,assist:ea},onLogout:()=>{}})}function j(){return l.jsx(Xe,{})}function Ye(){return l.jsx(Xe,{withRuleData:!0})}j.__docgenInfo={description:"",methods:[],displayName:"MockScenarioRegistrationContainer"};Ye.__docgenInfo={description:"",methods:[],displayName:"MockScenarioRegistrationWithRuleDataContainer"};const Ha={title:"ユーザーストーリー/Scenario registration",component:h,render:()=>l.jsx(h,{initialUrl:"/scenarios/new",initialDb:F("registrationDraft"),scenarioRegistrationContainer:j}),parameters:{notes:"docs/user-stories/scenario-registration.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}};function Ze({initialUrl:n}){const t=Qe.useMemo(()=>{const e=na();return e.logout(),e},[]);return l.jsx(h,{initialUrl:n,initialDb:F("registrationDraft"),accountApi:t,scenarioRegistrationContainer:j})}const r=async(n,t)=>{await a.click(n.getByRole("button",{name:`${t}へ`}))},p={name:"認証: ログイン後にシナリオ作成へ戻る",render:()=>l.jsx(Ze,{initialUrl:"/scenarios/new"}),play:async({canvasElement:n,step:t})=>{const e=c(n);await t("未ログインではログイン画面へ移動し、元のURLを保持する",async()=>{await o(await e.findByRole("main",{name:"ログイン"})).toBeVisible(),await o(e.getByTestId("app-url")).toHaveTextContent("/account/login"),await o(e.getByTestId("app-url")).toHaveTextContent("redirect=%2Fscenarios%2Fnew")}),await t("ログインすると元のシナリオ作成画面へ戻る",async()=>{await a.clear(e.getByLabelText("メールアドレス")),await a.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await a.type(e.getByTestId("login-password"),"a"),await a.click(e.getByRole("button",{name:"ログインする"})),await o(await e.findByRole("main",{name:"シナリオ登録ウィザード"})).toBeVisible(),await o(e.getByTestId("app-url")).toHaveTextContent("/scenarios/new")})}},w={name:"認証: 戻り先がなければホームへ進む",render:()=>l.jsx(Ze,{initialUrl:"/account/login"}),play:async({canvasElement:n,step:t})=>{const e=c(n);await t("戻り先なしでログインする",async()=>{await o(await e.findByRole("main",{name:"ログイン"})).toBeVisible(),await a.clear(e.getByLabelText("メールアドレス")),await a.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await a.type(e.getByTestId("login-password"),"a"),await a.click(e.getByRole("button",{name:"ログインする"}))}),await t("デフォルトのホーム画面へ移動する",async()=>{await o(await e.findByRole("main",{name:"Myrialeトップページ"})).toBeVisible(),await o(e.getByTestId("app-url")).toHaveTextContent("/")})}},u={name:"US-01: 新しいシナリオを作成したい",play:async({canvasElement:n,step:t})=>{const e=c(n);await t("タイトル未入力では、下書き保存に必要な項目を説明する",async()=>{await a.click(e.getByRole("button",{name:"下書き保存"})),await o(e.getByTestId("scenario-notice")).toHaveTextContent("タイトルを入力すると下書き保存できます。")}),await t("タイトルだけ入力してDraft保存し、ScenarioIdを発行する",async()=>{await a.type(e.getByLabelText("シナリオタイトル"),"星喰いの地下図書館"),await a.click(e.getByRole("button",{name:"下書き保存"})),await o(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました"),await o(e.getByText("SCN-DRAFT-0427")).toBeVisible()})}},v={name:"US-02: シナリオのジャンルをタグで指定したい",play:async({canvasElement:n,step:t})=>{const e=c(n);await t("タイトル直下へ複数のジャンルタグを追加し、表紙サマリーへ反映する",async()=>{const s=e.getByLabelText("ジャンルタグを追加");await a.type(s,"ポストアポカリプス{Enter}"),await a.type(s,"巡礼譚"),await a.click(e.getByRole("button",{name:"タグを追加"})),await o(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("# ポストアポカリプス"),await o(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("# 巡礼譚"),await o(e.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("# ポストアポカリプス # 巡礼譚")}),await t("不要なタグを個別に削除できる",async()=>{await a.click(e.getByRole("button",{name:"巡礼譚タグを削除"})),await o(e.getByRole("group",{name:"登録済みジャンルタグ"})).not.toHaveTextContent("# 巡礼譚")})}},g={name:"US-04: AIの裁量レベルを調整したい",play:async({canvasElement:n,step:t})=>{const e=c(n),s=c(n.ownerDocument.body);await r(e,"AI裁量"),await t("AI裁量を高へ変更し、生成時の挙動差を明示する",async()=>{const m=e.getAllByRole("combobox",{name:"AI裁量"})[0];await a.click(m),await a.click(await s.findByRole("option",{name:"高: 展開を広げる"})),await o(m).toHaveTextContent("高: 展開を広げる"),await o(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("高: 展開を広げる")})}},x={name:"US-05: 初期キャラクター条件を設定したい",play:async({canvasElement:n,step:t})=>{const e=c(n);await r(e,"主人公"),await t("主人公の扱いと自由生成時の前提を入力する",async()=>{await o(e.getByRole("combobox",{name:"主人公の扱い"})).toHaveTextContent("自由生成のみ"),await a.clear(e.getByLabelText("主人公の設定")),await a.type(e.getByLabelText("主人公の設定"),"主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で自由に決められる。"),o(e.getByLabelText("主人公の設定").value).toContain("新人地図師"),await o(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("自由生成")})}},d={name:"US-06: シナリオの開始シーンを定義したい",play:async({canvasElement:n,step:t})=>{const e=c(n);await r(e,"第一場面"),await t("開始シーンを固定し、初回Narrativeの材料にする",async()=>{await a.clear(e.getByLabelText("開始シーン")),await a.type(e.getByLabelText("開始シーン"),"あなたは灰の降る駅で、宛名のない切符を握っている。"),o(e.getByLabelText("開始シーン").value).toContain("灰の降る駅"),await o(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("固定")})}},T={name:"US-11: 挿絵のテイストを指定したい",play:async({canvasElement:n,step:t})=>{const e=c(n);c(n.ownerDocument.body),await r(e,"挿絵"),await t("文章と視覚表現を揃える画風を指定する",async()=>{await a.clear(e.getByLabelText("挿絵の画風")),await a.type(e.getByLabelText("挿絵の画風"),"古い天文図の銅版画、インクの滲み、低彩度"),o(e.getByLabelText("挿絵の画風").value).toContain("銅版画")})}},B={name:"US-12: 挿絵の雰囲気を指定したい",play:async({canvasElement:n,step:t})=>{const e=c(n);c(n.ownerDocument.body),await r(e,"挿絵"),await t("挿絵生成に使う感情的トーンを複数指定する",async()=>{await a.clear(e.getByLabelText("挿絵のムード")),await a.type(e.getByLabelText("挿絵のムード"),"孤独、湿度、薄明、遠い鐘の音"),o(e.getByLabelText("挿絵のムード").value).toContain("薄明")})}},b={name:"US-13: 挿絵の禁止要素を指定したい",play:async({canvasElement:n,step:t})=>{const e=c(n);c(n.ownerDocument.body),await r(e,"挿絵"),await t("年齢制限や世界観を守るNG要素を入力する",async()=>{await a.clear(e.getByLabelText("挿絵の禁止要素")),await a.type(e.getByLabelText("挿絵の禁止要素"),"現代兵器、スマートフォン、過度な流血"),o(e.getByLabelText("挿絵の禁止要素").value).toContain("スマートフォン")})}},S={name:"US-14: 挿絵を事前にプレビューしたい",play:async({canvasElement:n,step:t})=>{const e=c(n);c(n.ownerDocument.body),await r(e,"挿絵"),await t("サンプルシーンを入力し、本番相当の挿絵を保存せず生成する",async()=>{await a.clear(e.getByLabelText("サンプルシーン")),await a.type(e.getByLabelText("サンプルシーン"),"地下書庫の水面に星座が反射している。"),await a.click(e.getByRole("button",{name:"サンプルシーンで生成"})),await o(e.getByTestId("illustration-preview")).toHaveTextContent("保存対象外"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("まだ確定していません")})}},R={name:"US-15: プレビューを見ながら挿絵設定を調整したい",play:async({canvasElement:n,step:t})=>{const e=c(n);await r(e,"挿絵"),await t("設定を変更して再生成し、納得した設定のみ保存対象にする",async()=>{await a.clear(e.getByLabelText("挿絵の画風")),await a.type(e.getByLabelText("挿絵の画風"),"影絵、余白多め、灯火だけ金色"),await a.click(e.getByRole("button",{name:"サンプルシーンで生成"})),o(e.getByLabelText("挿絵の画風").value).toContain("影絵"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("設定はまだ確定していません")})}},E={name:"US-17: 登録内容をAIに相談したい",play:async({canvasElement:n,step:t})=>{const e=c(n);await t("AIに相談しても、提案は自動確定しない",async()=>{await a.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await o(e.getByTestId("ai-suggestion")).toHaveTextContent("基本情報案を3つ提示しました"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},I={name:"US-18: どのAIに聞くかを選択したい",play:async({canvasElement:n,step:t})=>{const e=c(n),s=c(n.ownerDocument.body);await r(e,"挿絵"),await t("用途に合わせて相談先AIを選び、選択したAIで提案を生成する",async()=>{await a.click(e.getByRole("combobox",{name:"相談先AI"})),await a.click(await s.findByRole("option",{name:"挿絵AI"})),await a.click(e.getByRole("button",{name:"画風を相談"})),await o(e.getByRole("combobox",{name:"相談先AI"})).toHaveTextContent("挿絵AI"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵AIに挿絵テイストを相談しました")})}},C={name:"US-19: シナリオの基本情報をAIに補完してもらいたい",play:async({canvasElement:n,step:t})=>{const e=c(n);await t("基本情報候補を見て、採用してからMarkdown本文に入れる",async()=>{await a.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await a.click(e.getByRole("button",{name:"採用して編集"})),o(e.getByLabelText("基本情報").value).toContain("## 物語の目的"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("採用しました"),await a.click(e.getByRole("button",{name:"プレビュー"})),await o(e.getByRole("article",{name:"基本情報のMarkdownプレビュー"})).toHaveTextContent("水没した書庫を探索する")})}},L={name:"US-21: 挿絵テイストをAIに相談したい",play:async({canvasElement:n,step:t})=>{const e=c(n);await r(e,"挿絵"),await t("シナリオに合う画風候補をAIに提示してもらう",async()=>{await a.click(e.getByRole("button",{name:"画風を相談"})),await o(e.getByTestId("ai-suggestion")).toHaveTextContent("画風候補"),await o(e.getByTestId("ai-suggestion")).toHaveTextContent("銅版画風")})}},A={name:"US-22: 挿絵プロンプトをAIに生成させたい",play:async({canvasElement:n,step:t})=>{const e=c(n);await r(e,"挿絵"),await t("画像生成用プロンプトとネガティブを分離して出力する",async()=>{await a.click(e.getByRole("button",{name:"プロンプトを生成"})),await o(e.getByTestId("ai-suggestion")).toHaveTextContent("ネガティブプロンプト"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵プロンプトを相談しました")})}},M=()=>l.jsx(h,{initialUrl:"/scenarios/new",initialDb:F("registrationDraft"),scenarioRegistrationContainer:Ye}),H={name:"US-23: Object Typeの状態とアクションを定義したい",play:async({canvasElement:n,step:t})=>{const e=c(n),s=c(n.ownerDocument.body);await r(e,"世界データ"),await t("新しい種類へstable code、状態、公開範囲を登録する",async()=>{await a.click(e.getByRole("button",{name:"種類を追加"})),await a.clear(s.getByLabelText("種類のstable code")),await a.type(s.getByLabelText("種類のstable code"),"sealed-door"),await a.clear(s.getByLabelText("種類の表示名")),await a.type(s.getByLabelText("種類の表示名"),"隔壁扉"),await a.click(s.getByRole("button",{name:"状態を追加"})),await a.clear(s.getByLabelText("状態1のcode")),await a.type(s.getByLabelText("状態1のcode"),"open"),await o(s.getByRole("combobox",{name:"状態1の公開範囲"})).toHaveTextContent("公開")}),await t("AIへ列挙するアクションinterfaceを登録する",async()=>{await a.click(s.getByRole("button",{name:"アクションを追加"})),await a.clear(s.getByLabelText("アクション1のcode")),await a.type(s.getByLabelText("アクション1のcode"),"open"),await a.clear(s.getByLabelText("アクション1の表示名")),await a.type(s.getByLabelText("アクション1の表示名"),"扉を開ける"),await o(s.getByRole("combobox",{name:"アクション1の公開先"})).toHaveTextContent("AI候補")})}},U={name:"US-24: Locationを作成してObjectを初期配置したい",render:M,play:async({canvasElement:n,step:t})=>{const e=c(n),s=c(n.ownerDocument.body);await r(e,"世界データ"),await t("場所を追加してstable codeを維持する",async()=>{await a.click(e.getByRole("button",{name:"場所を追加"})),await a.clear(s.getByLabelText("場所のstable code")),await a.type(s.getByLabelText("場所のstable code"),"sealed-vault"),await a.clear(s.getByLabelText("場所の表示名")),await a.type(s.getByLabelText("場所の表示名"),"封印書庫"),await a.click(s.getByRole("button",{name:"編集を完了"})),await o(e.getByRole("button",{name:"封印書庫を編集"})).toBeVisible()}),await t("Objectが種類と1つの初期配置を参照する",async()=>{await a.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await o(s.getByRole("combobox",{name:"オブジェクト種類"})).toHaveTextContent("書庫の扉"),await o(s.getByRole("combobox",{name:"初期配置"})).toHaveTextContent("水没した閲覧室")})}},f={name:"US-25: 状態とアクションに決定的な結果を設定したい",render:M,play:async({canvasElement:n,step:t})=>{const e=c(n);await r(e,"アクション結果"),await t("from state、action、priorityと順序付きeffectを確認する",async()=>{await o(e.getByTestId("rule-result-preview")).toHaveTextContent("北書庫の扉"),await o(e.getByTestId("rule-result-preview")).toHaveTextContent("2 effect"),await o(e.getByLabelText("結果の優先度")).toHaveValue(100),await o(e.getByText("1. set-state")).toBeVisible(),await o(e.getByText("2. emit-fact")).toBeVisible()}),await t("公開準備チェックが決定性を確認する",async()=>{await o(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です")})}},k={name:"US-26: 参照中の種類と場所を安全に削除したい",render:M,play:async({canvasElement:n,step:t})=>{const e=c(n),s=c(n.ownerDocument.body);await r(e,"世界データ"),await t("Objectが参照中の種類は削除を拒否する",async()=>{await a.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await a.click(s.getByRole("button",{name:"この種類を削除"})),await o(e.getByTestId("scenario-notice")).toHaveTextContent("先に種類を変更するかオブジェクトを削除"),await a.click(s.getByRole("button",{name:"編集ペインを閉じる"}))}),await t("同じページでObjectが配置中のLocationも削除を拒否する",async()=>{await a.click(e.getByRole("button",{name:"水没した閲覧室を編集"})),await a.click(s.getByRole("button",{name:"この場所を削除"})),await o(e.getByTestId("scenario-notice")).toHaveTextContent("先に配置先を変更するかオブジェクトを削除")})}},D={name:"US-27: 不完全なルールデータを警告付きでDraft保存したい",render:M,play:async({canvasElement:n,step:t})=>{const e=c(n);await r(e,"アクション結果"),await t("必須のaction resultを削除すると公開準備の警告を表示する",async()=>{await a.click(e.getByRole("button",{name:"この結果を削除"})),await o(e.getByRole("region",{name:"公開準備チェック"})).toHaveTextContent("下書き警告"),await o(e.getByRole("region",{name:"公開準備チェック"})).toHaveTextContent("結果が未設定")}),await t("警告があっても下書き保存できる",async()=>{await a.click(e.getByRole("button",{name:"下書き保存"})),await o(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました"),await o(e.getByTestId("scenario-notice")).toHaveTextContent("未設定項目が1件")})}};var V,O,N;p.parameters={...p.parameters,docs:{...(V=p.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: '認証: ログイン後にシナリオ作成へ戻る',
  render: () => <AnonymousApp initialUrl="/scenarios/new" />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('未ログインではログイン画面へ移動し、元のURLを保持する', async () => {
      await expect(await canvas.findByRole('main', {
        name: 'ログイン'
      })).toBeVisible();
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/account/login');
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('redirect=%2Fscenarios%2Fnew');
    });
    await step('ログインすると元のシナリオ作成画面へ戻る', async () => {
      await userEvent.clear(canvas.getByLabelText('メールアドレス'));
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'reader@myriale.example');
      await userEvent.type(canvas.getByTestId('login-password'), 'a');
      await userEvent.click(canvas.getByRole('button', {
        name: 'ログインする'
      }));
      await expect(await canvas.findByRole('main', {
        name: 'シナリオ登録ウィザード'
      })).toBeVisible();
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/scenarios/new');
    });
  }
}`,...(N=(O=p.parameters)==null?void 0:O.docs)==null?void 0:N.source}}};var P,G,_;w.parameters={...w.parameters,docs:{...(P=w.parameters)==null?void 0:P.docs,source:{originalSource:`{
  name: '認証: 戻り先がなければホームへ進む',
  render: () => <AnonymousApp initialUrl="/account/login" />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('戻り先なしでログインする', async () => {
      await expect(await canvas.findByRole('main', {
        name: 'ログイン'
      })).toBeVisible();
      await userEvent.clear(canvas.getByLabelText('メールアドレス'));
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'reader@myriale.example');
      await userEvent.type(canvas.getByTestId('login-password'), 'a');
      await userEvent.click(canvas.getByRole('button', {
        name: 'ログインする'
      }));
    });
    await step('デフォルトのホーム画面へ移動する', async () => {
      await expect(await canvas.findByRole('main', {
        name: 'Myrialeトップページ'
      })).toBeVisible();
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/');
    });
  }
}`,...(_=(G=w.parameters)==null?void 0:G.docs)==null?void 0:_.source}}};var $,W,q;u.parameters={...u.parameters,docs:{...($=u.parameters)==null?void 0:$.docs,source:{originalSource:`{
  name: 'US-01: 新しいシナリオを作成したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('タイトル未入力では、下書き保存に必要な項目を説明する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '下書き保存'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('タイトルを入力すると下書き保存できます。');
    });
    await step('タイトルだけ入力してDraft保存し、ScenarioIdを発行する', async () => {
      await userEvent.type(canvas.getByLabelText('シナリオタイトル'), '星喰いの地下図書館');
      await userEvent.click(canvas.getByRole('button', {
        name: '下書き保存'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('Draftとして保存しました');
      await expect(canvas.getByText('SCN-DRAFT-0427')).toBeVisible();
    });
  }
}`,...(q=(W=u.parameters)==null?void 0:W.docs)==null?void 0:q.source}}};var K,z,J;v.parameters={...v.parameters,docs:{...(K=v.parameters)==null?void 0:K.docs,source:{originalSource:`{
  name: 'US-02: シナリオのジャンルをタグで指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('タイトル直下へ複数のジャンルタグを追加し、表紙サマリーへ反映する', async () => {
      const input = canvas.getByLabelText('ジャンルタグを追加');
      await userEvent.type(input, 'ポストアポカリプス{Enter}');
      await userEvent.type(input, '巡礼譚');
      await userEvent.click(canvas.getByRole('button', {
        name: 'タグを追加'
      }));
      await expect(canvas.getByRole('group', {
        name: '登録済みジャンルタグ'
      })).toHaveTextContent('# ポストアポカリプス');
      await expect(canvas.getByRole('group', {
        name: '登録済みジャンルタグ'
      })).toHaveTextContent('# 巡礼譚');
      await expect(canvas.getByRole('complementary', {
        name: '入力サマリー'
      })).toHaveTextContent('# ポストアポカリプス # 巡礼譚');
    });
    await step('不要なタグを個別に削除できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '巡礼譚タグを削除'
      }));
      await expect(canvas.getByRole('group', {
        name: '登録済みジャンルタグ'
      })).not.toHaveTextContent('# 巡礼譚');
    });
  }
}`,...(J=(z=v.parameters)==null?void 0:z.docs)==null?void 0:J.source}}};var Q,X,Y;g.parameters={...g.parameters,docs:{...(Q=g.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  name: 'US-04: AIの裁量レベルを調整したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, 'AI裁量');
    await step('AI裁量を高へ変更し、生成時の挙動差を明示する', async () => {
      const aiFreedomField = canvas.getAllByRole('combobox', {
        name: 'AI裁量'
      })[0];
      await userEvent.click(aiFreedomField);
      await userEvent.click(await screen.findByRole('option', {
        name: '高: 展開を広げる'
      }));
      await expect(aiFreedomField).toHaveTextContent('高: 展開を広げる');
      await expect(canvas.getByRole('complementary', {
        name: '契約の背表紙'
      })).toHaveTextContent('高: 展開を広げる');
    });
  }
}`,...(Y=(X=g.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};var Z,ee,ae;x.parameters={...x.parameters,docs:{...(Z=x.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  name: 'US-05: 初期キャラクター条件を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '主人公');
    await step('主人公の扱いと自由生成時の前提を入力する', async () => {
      await expect(canvas.getByRole('combobox', {
        name: '主人公の扱い'
      })).toHaveTextContent('自由生成のみ');
      await userEvent.clear(canvas.getByLabelText('主人公の設定'));
      await userEvent.type(canvas.getByLabelText('主人公の設定'), '主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で自由に決められる。');
      expect((canvas.getByLabelText('主人公の設定') as HTMLTextAreaElement).value).toContain('新人地図師');
      await expect(canvas.getByRole('complementary', {
        name: '契約の背表紙'
      })).toHaveTextContent('自由生成');
    });
  }
}`,...(ae=(ee=x.parameters)==null?void 0:ee.docs)==null?void 0:ae.source}}};var te,ne,oe;d.parameters={...d.parameters,docs:{...(te=d.parameters)==null?void 0:te.docs,source:{originalSource:`{
  name: 'US-06: シナリオの開始シーンを定義したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '第一場面');
    await step('開始シーンを固定し、初回Narrativeの材料にする', async () => {
      await userEvent.clear(canvas.getByLabelText('開始シーン'));
      await userEvent.type(canvas.getByLabelText('開始シーン'), 'あなたは灰の降る駅で、宛名のない切符を握っている。');
      expect((canvas.getByLabelText('開始シーン') as HTMLTextAreaElement).value).toContain('灰の降る駅');
      await expect(canvas.getByRole('complementary', {
        name: '契約の背表紙'
      })).toHaveTextContent('固定');
    });
  }
}`,...(oe=(ne=d.parameters)==null?void 0:ne.docs)==null?void 0:oe.source}}};var se,ce,ie;T.parameters={...T.parameters,docs:{...(se=T.parameters)==null?void 0:se.docs,source:{originalSource:`{
  name: 'US-11: 挿絵のテイストを指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('文章と視覚表現を揃える画風を指定する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の画風'));
      await userEvent.type(canvas.getByLabelText('挿絵の画風'), '古い天文図の銅版画、インクの滲み、低彩度');
      expect((canvas.getByLabelText('挿絵の画風') as HTMLInputElement).value).toContain('銅版画');
    });
  }
}`,...(ie=(ce=T.parameters)==null?void 0:ce.docs)==null?void 0:ie.source}}};var re,le,ye;B.parameters={...B.parameters,docs:{...(re=B.parameters)==null?void 0:re.docs,source:{originalSource:`{
  name: 'US-12: 挿絵の雰囲気を指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('挿絵生成に使う感情的トーンを複数指定する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵のムード'));
      await userEvent.type(canvas.getByLabelText('挿絵のムード'), '孤独、湿度、薄明、遠い鐘の音');
      expect((canvas.getByLabelText('挿絵のムード') as HTMLInputElement).value).toContain('薄明');
    });
  }
}`,...(ye=(le=B.parameters)==null?void 0:le.docs)==null?void 0:ye.source}}};var me,pe,we;b.parameters={...b.parameters,docs:{...(me=b.parameters)==null?void 0:me.docs,source:{originalSource:`{
  name: 'US-13: 挿絵の禁止要素を指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('年齢制限や世界観を守るNG要素を入力する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の禁止要素'));
      await userEvent.type(canvas.getByLabelText('挿絵の禁止要素'), '現代兵器、スマートフォン、過度な流血');
      expect((canvas.getByLabelText('挿絵の禁止要素') as HTMLInputElement).value).toContain('スマートフォン');
    });
  }
}`,...(we=(pe=b.parameters)==null?void 0:pe.docs)==null?void 0:we.source}}};var ue,ve,ge;S.parameters={...S.parameters,docs:{...(ue=S.parameters)==null?void 0:ue.docs,source:{originalSource:`{
  name: 'US-14: 挿絵を事前にプレビューしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('サンプルシーンを入力し、本番相当の挿絵を保存せず生成する', async () => {
      await userEvent.clear(canvas.getByLabelText('サンプルシーン'));
      await userEvent.type(canvas.getByLabelText('サンプルシーン'), '地下書庫の水面に星座が反射している。');
      await userEvent.click(canvas.getByRole('button', {
        name: 'サンプルシーンで生成'
      }));
      await expect(canvas.getByTestId('illustration-preview')).toHaveTextContent('保存対象外');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('まだ確定していません');
    });
  }
}`,...(ge=(ve=S.parameters)==null?void 0:ve.docs)==null?void 0:ge.source}}};var xe,de,Te;R.parameters={...R.parameters,docs:{...(xe=R.parameters)==null?void 0:xe.docs,source:{originalSource:`{
  name: 'US-15: プレビューを見ながら挿絵設定を調整したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('設定を変更して再生成し、納得した設定のみ保存対象にする', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の画風'));
      await userEvent.type(canvas.getByLabelText('挿絵の画風'), '影絵、余白多め、灯火だけ金色');
      await userEvent.click(canvas.getByRole('button', {
        name: 'サンプルシーンで生成'
      }));
      expect((canvas.getByLabelText('挿絵の画風') as HTMLInputElement).value).toContain('影絵');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('設定はまだ確定していません');
    });
  }
}`,...(Te=(de=R.parameters)==null?void 0:de.docs)==null?void 0:Te.source}}};var Be,be,Se;E.parameters={...E.parameters,docs:{...(Be=E.parameters)==null?void 0:Be.docs,source:{originalSource:`{
  name: 'US-17: 登録内容をAIに相談したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('AIに相談しても、提案は自動確定しない', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに基本情報案を出してもらう'
      }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('基本情報案を3つ提示しました');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('自動確定はしません');
    });
  }
}`,...(Se=(be=E.parameters)==null?void 0:be.docs)==null?void 0:Se.source}}};var Re,Ee,Ie;I.parameters={...I.parameters,docs:{...(Re=I.parameters)==null?void 0:Re.docs,source:{originalSource:`{
  name: 'US-18: どのAIに聞くかを選択したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '挿絵');
    await step('用途に合わせて相談先AIを選び、選択したAIで提案を生成する', async () => {
      await userEvent.click(canvas.getByRole('combobox', {
        name: '相談先AI'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: '挿絵AI'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '画風を相談'
      }));
      await expect(canvas.getByRole('combobox', {
        name: '相談先AI'
      })).toHaveTextContent('挿絵AI');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('挿絵AIに挿絵テイストを相談しました');
    });
  }
}`,...(Ie=(Ee=I.parameters)==null?void 0:Ee.docs)==null?void 0:Ie.source}}};var Ce,Le,Ae;C.parameters={...C.parameters,docs:{...(Ce=C.parameters)==null?void 0:Ce.docs,source:{originalSource:`{
  name: 'US-19: シナリオの基本情報をAIに補完してもらいたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('基本情報候補を見て、採用してからMarkdown本文に入れる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに基本情報案を出してもらう'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '採用して編集'
      }));
      expect((canvas.getByLabelText('基本情報') as HTMLTextAreaElement).value).toContain('## 物語の目的');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('採用しました');
      await userEvent.click(canvas.getByRole('button', {
        name: 'プレビュー'
      }));
      await expect(canvas.getByRole('article', {
        name: '基本情報のMarkdownプレビュー'
      })).toHaveTextContent('水没した書庫を探索する');
    });
  }
}`,...(Ae=(Le=C.parameters)==null?void 0:Le.docs)==null?void 0:Ae.source}}};var He,Ue,fe;L.parameters={...L.parameters,docs:{...(He=L.parameters)==null?void 0:He.docs,source:{originalSource:`{
  name: 'US-21: 挿絵テイストをAIに相談したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('シナリオに合う画風候補をAIに提示してもらう', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '画風を相談'
      }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('画風候補');
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('銅版画風');
    });
  }
}`,...(fe=(Ue=L.parameters)==null?void 0:Ue.docs)==null?void 0:fe.source}}};var ke,De,he;A.parameters={...A.parameters,docs:{...(ke=A.parameters)==null?void 0:ke.docs,source:{originalSource:`{
  name: 'US-22: 挿絵プロンプトをAIに生成させたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('画像生成用プロンプトとネガティブを分離して出力する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'プロンプトを生成'
      }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('ネガティブプロンプト');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('挿絵プロンプトを相談しました');
    });
  }
}`,...(he=(De=A.parameters)==null?void 0:De.docs)==null?void 0:he.source}}};var Me,Fe,je;H.parameters={...H.parameters,docs:{...(Me=H.parameters)==null?void 0:Me.docs,source:{originalSource:`{
  name: 'US-23: Object Typeの状態とアクションを定義したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '世界データ');
    await step('新しい種類へstable code、状態、公開範囲を登録する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '種類を追加'
      }));
      await userEvent.clear(screen.getByLabelText('種類のstable code'));
      await userEvent.type(screen.getByLabelText('種類のstable code'), 'sealed-door');
      await userEvent.clear(screen.getByLabelText('種類の表示名'));
      await userEvent.type(screen.getByLabelText('種類の表示名'), '隔壁扉');
      await userEvent.click(screen.getByRole('button', {
        name: '状態を追加'
      }));
      await userEvent.clear(screen.getByLabelText('状態1のcode'));
      await userEvent.type(screen.getByLabelText('状態1のcode'), 'open');
      await expect(screen.getByRole('combobox', {
        name: '状態1の公開範囲'
      })).toHaveTextContent('公開');
    });
    await step('AIへ列挙するアクションinterfaceを登録する', async () => {
      await userEvent.click(screen.getByRole('button', {
        name: 'アクションを追加'
      }));
      await userEvent.clear(screen.getByLabelText('アクション1のcode'));
      await userEvent.type(screen.getByLabelText('アクション1のcode'), 'open');
      await userEvent.clear(screen.getByLabelText('アクション1の表示名'));
      await userEvent.type(screen.getByLabelText('アクション1の表示名'), '扉を開ける');
      await expect(screen.getByRole('combobox', {
        name: 'アクション1の公開先'
      })).toHaveTextContent('AI候補');
    });
  }
}`,...(je=(Fe=H.parameters)==null?void 0:Fe.docs)==null?void 0:je.source}}};var Ve,Oe,Ne;U.parameters={...U.parameters,docs:{...(Ve=U.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
  name: 'US-24: Locationを作成してObjectを初期配置したい',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '世界データ');
    await step('場所を追加してstable codeを維持する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '場所を追加'
      }));
      await userEvent.clear(screen.getByLabelText('場所のstable code'));
      await userEvent.type(screen.getByLabelText('場所のstable code'), 'sealed-vault');
      await userEvent.clear(screen.getByLabelText('場所の表示名'));
      await userEvent.type(screen.getByLabelText('場所の表示名'), '封印書庫');
      await userEvent.click(screen.getByRole('button', {
        name: '編集を完了'
      }));
      await expect(canvas.getByRole('button', {
        name: '封印書庫を編集'
      })).toBeVisible();
    });
    await step('Objectが種類と1つの初期配置を参照する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '北書庫の扉を編集'
      }));
      await expect(screen.getByRole('combobox', {
        name: 'オブジェクト種類'
      })).toHaveTextContent('書庫の扉');
      await expect(screen.getByRole('combobox', {
        name: '初期配置'
      })).toHaveTextContent('水没した閲覧室');
    });
  }
}`,...(Ne=(Oe=U.parameters)==null?void 0:Oe.docs)==null?void 0:Ne.source}}};var Pe,Ge,_e;f.parameters={...f.parameters,docs:{...(Pe=f.parameters)==null?void 0:Pe.docs,source:{originalSource:`{
  name: 'US-25: 状態とアクションに決定的な結果を設定したい',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'アクション結果');
    await step('from state、action、priorityと順序付きeffectを確認する', async () => {
      await expect(canvas.getByTestId('rule-result-preview')).toHaveTextContent('北書庫の扉');
      await expect(canvas.getByTestId('rule-result-preview')).toHaveTextContent('2 effect');
      await expect(canvas.getByLabelText('結果の優先度')).toHaveValue(100);
      await expect(canvas.getByText('1. set-state')).toBeVisible();
      await expect(canvas.getByText('2. emit-fact')).toBeVisible();
    });
    await step('公開準備チェックが決定性を確認する', async () => {
      await expect(canvas.getByTestId('rule-readiness')).toHaveTextContent('決定的です');
    });
  }
}`,...(_e=(Ge=f.parameters)==null?void 0:Ge.docs)==null?void 0:_e.source}}};var $e,We,qe;k.parameters={...k.parameters,docs:{...($e=k.parameters)==null?void 0:$e.docs,source:{originalSource:`{
  name: 'US-26: 参照中の種類と場所を安全に削除したい',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '世界データ');
    await step('Objectが参照中の種類は削除を拒否する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: /^書庫の扉を編集$/
      }));
      await userEvent.click(screen.getByRole('button', {
        name: 'この種類を削除'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('先に種類を変更するかオブジェクトを削除');
      await userEvent.click(screen.getByRole('button', {
        name: '編集ペインを閉じる'
      }));
    });
    await step('同じページでObjectが配置中のLocationも削除を拒否する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '水没した閲覧室を編集'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: 'この場所を削除'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('先に配置先を変更するかオブジェクトを削除');
    });
  }
}`,...(qe=(We=k.parameters)==null?void 0:We.docs)==null?void 0:qe.source}}};var Ke,ze,Je;D.parameters={...D.parameters,docs:{...(Ke=D.parameters)==null?void 0:Ke.docs,source:{originalSource:`{
  name: 'US-27: 不完全なルールデータを警告付きでDraft保存したい',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'アクション結果');
    await step('必須のaction resultを削除すると公開準備の警告を表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'この結果を削除'
      }));
      await expect(canvas.getByRole('region', {
        name: '公開準備チェック'
      })).toHaveTextContent('下書き警告');
      await expect(canvas.getByRole('region', {
        name: '公開準備チェック'
      })).toHaveTextContent('結果が未設定');
    });
    await step('警告があっても下書き保存できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '下書き保存'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('Draftとして保存しました');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('未設定項目が1件');
    });
  }
}`,...(Je=(ze=D.parameters)==null?void 0:ze.docs)==null?void 0:Je.source}}};const Ua=["AuthenticationReturnsToScenarioCreation","AuthenticationDefaultsToHome","US01CreateDraftScenario","US02SpecifyGenreTag","US04TuneAiFreedom","US05SetInitialCharacter","US06DefineOpeningScene","US11SpecifyIllustrationStyle","US12SpecifyIllustrationMood","US13SpecifyNegativeElements","US14PreviewIllustration","US15IterateIllustrationSettings","US17ConsultAiAboutRegistration","US18SelectAiByPurpose","US19AiCompletesSummary","US21ConsultIllustrationTaste","US22GenerateIllustrationPrompt","US23DefineObjectTypeStatesAndActions","US24CreateLocationsAndPlaceObjects","US25AuthorDeterministicActionResults","US26KeepDependenciesSafe","US27SaveIncompleteRuleDataAsDraft"];export{w as AuthenticationDefaultsToHome,p as AuthenticationReturnsToScenarioCreation,u as US01CreateDraftScenario,v as US02SpecifyGenreTag,g as US04TuneAiFreedom,x as US05SetInitialCharacter,d as US06DefineOpeningScene,T as US11SpecifyIllustrationStyle,B as US12SpecifyIllustrationMood,b as US13SpecifyNegativeElements,S as US14PreviewIllustration,R as US15IterateIllustrationSettings,E as US17ConsultAiAboutRegistration,I as US18SelectAiByPurpose,C as US19AiCompletesSummary,L as US21ConsultIllustrationTaste,A as US22GenerateIllustrationPrompt,H as US23DefineObjectTypeStatesAndActions,U as US24CreateLocationsAndPlaceObjects,f as US25AuthorDeterministicActionResults,k as US26KeepDependenciesSafe,D as US27SaveIncompleteRuleDataAsDraft,Ua as __namedExportsOrder,Ha as default};
