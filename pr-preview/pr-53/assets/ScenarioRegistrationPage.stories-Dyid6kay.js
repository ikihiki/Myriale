import{j as y}from"./jsx-runtime-BO8uF4Og.js";import{r as at}from"./index-D4H_InIO.js";import{w as c,e as a,u as t}from"./index-C4S39nCK.js";import{S as ct,e as st,M as w,c as rt}from"./MyrialeApp-B0NQEon1.js";import{u as lt,c as O}from"./SessionPresentation-BjM1TTZ7.js";import{w as yt,c as mt}from"./scenarioRegistrationFixtures-DeS1t2eb.js";/* empty css               */import"./AppChrome-CBArT6hJ.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-DnR2L1gN.js";import"./editPaneLayer-BYDGh10V.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CuT8m0Jw.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./EditPane-C3MJ4kyA.js";import"./ModuleUiHost-CoZk1x5n.js";import"./account-CGbtz8io.js";import"./SessionListPresentation-Dg-uj_rK.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-Cizm6efh.js";const wt={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function F({ruleData:i}){const o=lt(),[e,n]=at.useState("未発行"),l=async s=>{if(!s.title.trim())return{ok:!1,message:"タイトルを入力すると下書き保存できます。",fieldErrors:{title:["シナリオタイトルを入力してください。"]}};const m="SCN-DRAFT-0427";return n(m),o==null||o.dispatch({type:"SCENARIO_SAVED",scenario:{id:m,title:s.title.trim(),status:"draft",genre:s.genre,updatedAt:"2026-07-23",summary:s.summary,tone:"",lore:"",aiFreedom:s.aiFreedom,heroMode:s.heroMode,heroFreeGenerationAllowed:s.heroFreeGenerationAllowed,hero:s.hero,opening:s.opening,illustrationStyle:s.illustrationStyle,illustrationMood:s.illustrationMood,illustrationNegative:s.illustrationNegative,sampleScene:s.sampleScene}}),{ok:!0,message:`「${s.title.trim()}」をDraftとして保存しました。ScenarioIdを発行しました。`,value:{scenarioId:m}}},p=async(s,m)=>m==="summary"?{ok:!0,message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",value:{message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",suggestions:[{id:"summary-1",body:`## 物語の目的

地下に沈んだ王都で、禁書を読むたびに書き換わる星座の謎を追います。

- 水没した書庫を探索する
- 失われる記憶の代償を選ぶ`,rationale:"タイトル、ジャンル、基本情報からMarkdown案を生成しました。"}]}}:m==="illustration-style"?{ok:!0,message:"シナリオに合う画風候補を提示しました。",value:{message:"シナリオに合う画風候補を提示しました。",suggestions:[{id:"style-1",body:"銅版画風、影絵、水彩写本。低彩度で星図の金線だけを強調。",rationale:"既存のムードとNG要素に合わせました。"}]}}:m==="illustration-prompt"?{ok:!0,message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",value:{message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",suggestions:[{id:"prompt-1",body:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",rationale:"プロンプトとNG要素を分離しました。"}],prompt:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",negativePrompt:s.illustrationNegative}}:{ok:!0,message:"サンプルシーンのプレビューを生成しました。",value:{message:"サンプルシーンのプレビューを生成しました。",suggestions:[],previewText:`[Preview / 保存対象外] ${s.sampleScene} / ${s.illustrationStyle} / ${s.illustrationMood}`}};return y.jsx(ct,{account:wt,scenarioId:e,initialValues:i?{...st,title:"星喰いの地下図書館",ruleData:structuredClone(i)}:void 0,saving:!1,aiWorking:!1,actions:{saveDraft:l,assist:p},onLogout:()=>{}})}function N(){return y.jsx(F,{})}function nt(){return y.jsx(F,{ruleData:mt})}function ot(){return y.jsx(F,{ruleData:yt})}N.__docgenInfo={description:"",methods:[],displayName:"MockScenarioRegistrationContainer"};nt.__docgenInfo={description:"",methods:[],displayName:"MockScenarioRegistrationWithRuleDataContainer"};ot.__docgenInfo={description:"",methods:[],displayName:"MockWestDoorAuthoringContainer"};const Vt={title:"ユーザーストーリー/Scenario registration",component:w,render:()=>y.jsx(w,{initialUrl:"/scenarios/new",initialDb:O("registrationDraft"),scenarioRegistrationContainer:N}),parameters:{notes:"docs/user-stories/scenario-registration.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}};function it({initialUrl:i}){const o=at.useMemo(()=>{const e=rt();return e.logout(),e},[]);return y.jsx(w,{initialUrl:i,initialDb:O("registrationDraft"),accountApi:o,scenarioRegistrationContainer:N})}const r=async(i,o)=>{await t.click(await i.findByRole("button",{name:`${o}へ`}))},u={name:"認証: ログイン後にシナリオ作成へ戻る",render:()=>y.jsx(it,{initialUrl:"/scenarios/new"}),play:async({canvasElement:i,step:o})=>{const e=c(i);await o("未ログインではログイン画面へ移動し、元のURLを保持する",async()=>{await a(await e.findByRole("main",{name:"ログイン"})).toBeVisible(),await a(e.getByTestId("app-url")).toHaveTextContent("/account/login"),await a(e.getByTestId("app-url")).toHaveTextContent("redirect=%2Fscenarios%2Fnew")}),await o("ログインすると元のシナリオ作成画面へ戻る",async()=>{await t.clear(e.getByLabelText("メールアドレス")),await t.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await t.type(e.getByTestId("login-password"),"a"),await t.click(e.getByRole("button",{name:"ログインする"})),await a(await e.findByRole("main",{name:"シナリオ登録ウィザード"})).toBeVisible(),await a(e.getByTestId("app-url")).toHaveTextContent("/scenarios/new")})}},g={name:"認証: 戻り先がなければホームへ進む",render:()=>y.jsx(it,{initialUrl:"/account/login"}),play:async({canvasElement:i,step:o})=>{const e=c(i);await o("戻り先なしでログインする",async()=>{await a(await e.findByRole("main",{name:"ログイン"})).toBeVisible(),await t.clear(e.getByLabelText("メールアドレス")),await t.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await t.type(e.getByTestId("login-password"),"a"),await t.click(e.getByRole("button",{name:"ログインする"}))}),await o("デフォルトのホーム画面へ移動する",async()=>{await a(await e.findByRole("main",{name:"Myrialeトップページ"})).toBeVisible(),await a(e.getByTestId("app-url")).toHaveTextContent("/")})}},v={name:"US-01: 新しいシナリオを作成したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await o("タイトル未入力では、下書き保存に必要な項目を説明する",async()=>{await t.click(e.getByRole("button",{name:"下書き保存"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("タイトルを入力すると下書き保存できます。")}),await o("タイトルだけ入力してDraft保存し、ScenarioIdを発行する",async()=>{await t.type(e.getByLabelText("シナリオタイトル"),"星喰いの地下図書館"),await t.click(e.getByRole("button",{name:"下書き保存"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました"),await a(e.getByText("SCN-DRAFT-0427")).toBeVisible()})}},B={name:"US-02: シナリオのジャンルをタグで指定したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await o("タイトル直下へ複数のジャンルタグを追加し、表紙サマリーへ反映する",async()=>{const n=e.getByLabelText("ジャンルタグを追加");await t.type(n,"ポストアポカリプス{Enter}"),await t.type(n,"巡礼譚"),await t.click(e.getByRole("button",{name:"タグを追加"})),await a(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("# ポストアポカリプス"),await a(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("# 巡礼譚"),await a(e.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("# ポストアポカリプス # 巡礼譚")}),await o("不要なタグを個別に削除できる",async()=>{await t.click(e.getByRole("button",{name:"巡礼譚タグを削除"})),await a(e.getByRole("group",{name:"登録済みジャンルタグ"})).not.toHaveTextContent("# 巡礼譚")})}},x={name:"US-04: AIの裁量レベルを調整したい",play:async({canvasElement:i,step:o})=>{const e=c(i),n=c(i.ownerDocument.body);await r(e,"AI裁量"),await o("AI裁量を高へ変更し、生成時の挙動差を明示する",async()=>{const l=e.getAllByRole("combobox",{name:"AI裁量"})[0];await t.click(l),await t.click(await n.findByRole("option",{name:"高: 展開を広げる"})),await a(l).toHaveTextContent("高: 展開を広げる"),await a(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("高: 展開を広げる")})}},b={name:"US-05: 初期キャラクター条件を設定したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await r(e,"主人公"),await o("主人公の扱いと自由生成時の前提を入力する",async()=>{await a(e.getByRole("combobox",{name:"主人公の扱い"})).toHaveTextContent("自由生成のみ"),await t.clear(e.getByLabelText("主人公の設定")),await t.type(e.getByLabelText("主人公の設定"),"主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で自由に決められる。"),a(e.getByLabelText("主人公の設定").value).toContain("新人地図師"),await a(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("自由生成")})}},d={name:"US-06: シナリオの開始シーンを定義したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await r(e,"第一場面"),await o("開始シーンを固定し、初回Narrativeの材料にする",async()=>{await t.clear(e.getByLabelText("開始シーン")),await t.type(e.getByLabelText("開始シーン"),"あなたは灰の降る駅で、宛名のない切符を握っている。"),a(e.getByLabelText("開始シーン").value).toContain("灰の降る駅"),await a(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("固定")})}},T={name:"US-11: 挿絵のテイストを指定したい",play:async({canvasElement:i,step:o})=>{const e=c(i);c(i.ownerDocument.body),await r(e,"挿絵"),await o("文章と視覚表現を揃える画風を指定する",async()=>{await t.clear(e.getByLabelText("挿絵の画風")),await t.type(e.getByLabelText("挿絵の画風"),"古い天文図の銅版画、インクの滲み、低彩度"),a(e.getByLabelText("挿絵の画風").value).toContain("銅版画")})}},R={name:"US-12: 挿絵の雰囲気を指定したい",play:async({canvasElement:i,step:o})=>{const e=c(i);c(i.ownerDocument.body),await r(e,"挿絵"),await o("挿絵生成に使う感情的トーンを複数指定する",async()=>{await t.clear(e.getByLabelText("挿絵のムード")),await t.type(e.getByLabelText("挿絵のムード"),"孤独、湿度、薄明、遠い鐘の音"),a(e.getByLabelText("挿絵のムード").value).toContain("薄明")})}},S={name:"US-13: 挿絵の禁止要素を指定したい",play:async({canvasElement:i,step:o})=>{const e=c(i);c(i.ownerDocument.body),await r(e,"挿絵"),await o("年齢制限や世界観を守るNG要素を入力する",async()=>{await t.clear(e.getByLabelText("挿絵の禁止要素")),await t.type(e.getByLabelText("挿絵の禁止要素"),"現代兵器、スマートフォン、過度な流血"),a(e.getByLabelText("挿絵の禁止要素").value).toContain("スマートフォン")})}},E={name:"US-14: 挿絵を事前にプレビューしたい",play:async({canvasElement:i,step:o})=>{const e=c(i);c(i.ownerDocument.body),await r(e,"挿絵"),await o("サンプルシーンを入力し、本番相当の挿絵を保存せず生成する",async()=>{await t.clear(e.getByLabelText("サンプルシーン")),await t.type(e.getByLabelText("サンプルシーン"),"地下書庫の水面に星座が反射している。"),await t.click(e.getByRole("button",{name:"サンプルシーンで生成"})),await a(e.getByTestId("illustration-preview")).toHaveTextContent("保存対象外"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("まだ確定していません")})}},C={name:"US-15: プレビューを見ながら挿絵設定を調整したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await r(e,"挿絵"),await o("設定を変更して再生成し、納得した設定のみ保存対象にする",async()=>{await t.clear(e.getByLabelText("挿絵の画風")),await t.type(e.getByLabelText("挿絵の画風"),"影絵、余白多め、灯火だけ金色"),await t.click(e.getByRole("button",{name:"サンプルシーンで生成"})),a(e.getByLabelText("挿絵の画風").value).toContain("影絵"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("設定はまだ確定していません")})}},I={name:"US-17: 登録内容をAIに相談したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await o("AIに相談しても、提案は自動確定しない",async()=>{await t.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await a(e.getByTestId("ai-suggestion")).toHaveTextContent("基本情報案を3つ提示しました"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},H={name:"US-18: どのAIに聞くかを選択したい",play:async({canvasElement:i,step:o})=>{const e=c(i),n=c(i.ownerDocument.body);await r(e,"挿絵"),await o("用途に合わせて相談先AIを選び、選択したAIで提案を生成する",async()=>{await t.click(e.getByRole("combobox",{name:"相談先AI"})),await t.click(await n.findByRole("option",{name:"挿絵AI"})),await t.click(e.getByRole("button",{name:"画風を相談"})),await a(e.getByRole("combobox",{name:"相談先AI"})).toHaveTextContent("挿絵AI"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵AIに挿絵テイストを相談しました")})}},k={name:"US-19: シナリオの基本情報をAIに補完してもらいたい",play:async({canvasElement:i,step:o})=>{const e=c(i);await o("基本情報候補を見て、採用してからMarkdown本文に入れる",async()=>{await t.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await t.click(e.getByRole("button",{name:"採用して編集"})),a(e.getByLabelText("基本情報").value).toContain("## 物語の目的"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("採用しました"),await t.click(e.getByRole("button",{name:"プレビュー"})),await a(e.getByRole("article",{name:"基本情報のMarkdownプレビュー"})).toHaveTextContent("水没した書庫を探索する")})}},L={name:"US-21: 挿絵テイストをAIに相談したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await r(e,"挿絵"),await o("シナリオに合う画風候補をAIに提示してもらう",async()=>{await t.click(e.getByRole("button",{name:"画風を相談"})),await a(e.getByTestId("ai-suggestion")).toHaveTextContent("画風候補"),await a(e.getByTestId("ai-suggestion")).toHaveTextContent("銅版画風")})}},A={name:"US-22: 挿絵プロンプトをAIに生成させたい",play:async({canvasElement:i,step:o})=>{const e=c(i);await r(e,"挿絵"),await o("画像生成用プロンプトとネガティブを分離して出力する",async()=>{await t.click(e.getByRole("button",{name:"プロンプトを生成"})),await a(e.getByTestId("ai-suggestion")).toHaveTextContent("ネガティブプロンプト"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵プロンプトを相談しました")})}},M=()=>y.jsx(w,{initialUrl:"/scenarios/new",initialDb:O("registrationDraft"),scenarioRegistrationContainer:nt}),f={name:"US-23: Object Typeの状態とアクションを定義したい",play:async({canvasElement:i,step:o})=>{const e=c(i),n=c(i.ownerDocument.body);await r(e,"世界データ"),await o("新しい種類へstable code、状態、公開範囲を登録する",async()=>{await t.click(e.getByRole("button",{name:"種類を追加"})),await t.clear(n.getByLabelText("種類のstable code")),await t.type(n.getByLabelText("種類のstable code"),"sealed-door"),await t.clear(n.getByLabelText("種類の表示名")),await t.type(n.getByLabelText("種類の表示名"),"隔壁扉"),await t.click(n.getByRole("button",{name:"状態を追加"})),await t.clear(n.getByLabelText("状態1のcode")),await t.type(n.getByLabelText("状態1のcode"),"open"),await a(n.getByRole("combobox",{name:"状態1の公開範囲"})).toHaveTextContent("公開"),await t.click(n.getByRole("button",{name:"状態の編集を完了"})),await a(n.getByRole("button",{name:"新しい状態を編集"})).toBeVisible()}),await o("AIへ列挙するアクションinterfaceを登録する",async()=>{await t.click(n.getByRole("button",{name:"アクションを追加"})),await t.clear(n.getByLabelText("アクション1のcode")),await t.type(n.getByLabelText("アクション1のcode"),"open"),await t.clear(n.getByLabelText("アクション1の表示名")),await t.type(n.getByLabelText("アクション1の表示名"),"扉を開ける"),await a(n.getByRole("combobox",{name:"アクション1の公開先"})).toHaveTextContent("AI候補")})}},D={name:"US-24: Locationを作成してObjectを初期配置したい",render:M,play:async({canvasElement:i,step:o})=>{const e=c(i),n=c(i.ownerDocument.body);await r(e,"世界データ"),await o("場所を追加してstable codeを維持する",async()=>{await t.click(e.getByRole("button",{name:"場所を追加"})),await t.clear(n.getByLabelText("場所のstable code")),await t.type(n.getByLabelText("場所のstable code"),"sealed-vault"),await t.clear(n.getByLabelText("場所の表示名")),await t.type(n.getByLabelText("場所の表示名"),"封印書庫"),await t.click(n.getByRole("button",{name:"編集を完了"})),await a(e.getByRole("button",{name:"封印書庫を編集"})).toBeVisible()}),await o("Objectがordered mixinと1つの初期配置を参照する",async()=>{await t.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await a(n.getByRole("region",{name:"ordered Type mixins"})).toHaveTextContent("書庫の扉"),await a(n.getByRole("combobox",{name:"初期配置"})).toHaveTextContent("水没した閲覧室")})}},U={name:"US-25: 状態とアクションに決定的な結果を設定したい",render:M,play:async({canvasElement:i,step:o})=>{const e=c(i),n=c(i.ownerDocument.body);await r(e,"世界データ"),await o("Object TypeのAction paneからObject個別ルールを開く",async()=>{await t.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await t.click(n.getByRole("button",{name:"扉を開けるを編集"})),await a(n.getByRole("heading",{name:"オブジェクト別の実行ルール"})).toBeVisible(),await a(n.getByRole("cell",{name:/北書庫の扉/})).toBeVisible(),await t.click(n.getByRole("button",{name:"北書庫の扉の実行ルールを編集"}))}),await o("Object個別条件、priorityと順序付きeffectを確認する",async()=>{await a(n.getByTestId("rule-result-preview")).toHaveTextContent("北書庫の扉"),await a(n.getByTestId("rule-result-preview")).toHaveTextContent("2 effect"),await a(n.getByLabelText("実行ルールの優先度")).toHaveValue(100),await a(n.getByLabelText("実行ルールのアクション")).toHaveAttribute("readonly"),await a(n.getByText("1. 状態を更新")).toBeVisible(),await a(n.getByText("2. 確定した事実を追加")).toBeVisible()}),await o("世界データ末尾の公開準備チェックが決定性を確認する",async()=>{await a(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await a(e.queryByRole("button",{name:"アクション結果へ"})).not.toBeInTheDocument()})}},h={name:"US-26: 参照中の種類と場所を安全に削除したい",render:M,play:async({canvasElement:i,step:o})=>{const e=c(i),n=c(i.ownerDocument.body);await r(e,"世界データ"),await o("Objectが参照中の種類は削除を拒否する",async()=>{await t.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await t.click(n.getByRole("button",{name:"この種類を削除"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("先に種類を変更するかオブジェクトを削除"),await t.click(n.getByRole("button",{name:"編集ペインを閉じる"}))}),await o("同じページでObjectが配置中のLocationも削除を拒否する",async()=>{await t.click(e.getByRole("button",{name:"水没した閲覧室を編集"})),await t.click(n.getByRole("button",{name:"この場所を削除"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("先に配置先を変更するかオブジェクトを削除")})}},V={name:"US-27: 不完全なルールデータを警告付きでDraft保存したい",render:M,play:async({canvasElement:i,step:o})=>{const e=c(i),n=c(i.ownerDocument.body);await r(e,"世界データ"),await o("必須のObject個別ルールを削除すると公開準備の警告を表示する",async()=>{await t.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await t.click(n.getByRole("button",{name:"扉を開けるを編集"})),await t.click(n.getByRole("button",{name:"北書庫の扉の実行ルールを編集"})),await t.click(n.getByRole("button",{name:"この実行ルールを削除"})),await t.click(n.getByRole("button",{name:"アクションの編集を完了"})),await t.click(n.getByRole("button",{name:"編集を完了"})),await a(e.getByRole("region",{name:"公開準備チェック"})).toHaveTextContent("下書き警告"),await a(e.getByRole("region",{name:"公開準備チェック"})).toHaveTextContent("実行ルールが未設定")}),await o("警告があっても下書き保存できる",async()=>{await t.click(e.getByRole("button",{name:"下書き保存"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("未設定項目が1件")})}},j={name:"西の扉seed: 8つの実行内容を編集・並べ替え・保存する",render:()=>y.jsx(w,{initialUrl:"/scenarios/new",initialDb:O("registrationDraft"),scenarioRegistrationContainer:ot}),play:async({canvasElement:i,step:o})=>{const e=c(i),n=c(i.ownerDocument.body);await o("Scenario Editorだけで作成したinside / outside、exit-door、open-and-exit、west-doorを確認する",async()=>{await r(e,"世界データ"),await a(e.getByRole("button",{name:"地下研究室を編集"})).toBeVisible(),await a(e.getByRole("button",{name:"研究施設の外を編集"})).toBeVisible(),await a(e.getByRole("button",{name:/^出口の扉を編集$/})).toBeVisible(),await a(e.getByRole("button",{name:"西の扉を編集"})).toBeVisible()}),await o("Object paneでordered mixin、解決済みsource、Object local ruleを確認する",async()=>{await t.click(e.getByRole("button",{name:"西の扉を編集"}));const l=n.getByRole("region",{name:"ordered Type mixins"});await a(l).toHaveTextContent("開閉可能"),await a(l).toHaveTextContent("出口の扉");const p=n.getByRole("region",{name:"解決済み設定preview"});await a(p).toHaveTextContent("source: 開閉可能"),await a(p).toHaveTextContent("source: Object local"),await a(n.getByRole("region",{name:"Object action rules"})).toHaveTextContent("inspect-exit"),await t.click(n.getByRole("button",{name:"編集を完了"}))}),await o("Action paneのtableから西の扉ルールを開き、8項目を順序どおり表示する",async()=>{await t.click(e.getByRole("button",{name:/^出口の扉を編集$/})),await t.click(n.getByRole("button",{name:"扉を開けて外へ出るを編集"})),await a(n.getByRole("heading",{name:"オブジェクト別の実行ルール"})).toBeVisible(),await t.click(n.getByRole("button",{name:"西の扉の実行ルールを編集"})),await a(n.getByLabelText("実行ルールの条件値")).toHaveValue("false"),await a(n.getByLabelText("実行ルールのアクション")).toHaveAttribute("readonly"),await a(n.getByTestId("rule-result-preview")).toHaveTextContent("8 effect");const l=n.getByRole("list",{name:"順序付きの実行内容"});await a(l).toHaveTextContent("1. 状態を更新"),await a(l).toHaveTextContent("2. プレイヤーの現在地を移動"),await a(l).toHaveTextContent("5. 出来事を記録"),await a(l).toHaveTextContent("7. 矛盾する描写を禁止"),await a(n.getByLabelText("5番目の出来事の名前")).toHaveValue("session-moved"),await a(n.getByLabelText("5番目の出来事の場所code")).toHaveValue("outside")}),await o("出来事と禁止描写を編集し、キーボード操作できる順序変更ボタンで並べ替える",async()=>{await t.clear(n.getByLabelText("5番目の出来事の名前")),await t.type(n.getByLabelText("5番目の出来事の名前"),"player-left-building"),await t.click(n.getByRole("button",{name:"7番目を上へ移動"})),await a(n.getByRole("list",{name:"順序付きの実行内容"})).toHaveTextContent("6. 矛盾する描写を禁止"),await a(n.getByLabelText("6番目の文章")).toHaveValue("まだ室内にいる")}),await o("公開準備を満たした8項目を下書き保存する",async()=>{await t.click(n.getByRole("button",{name:"実行ルールの編集を完了"})),await t.click(n.getByRole("button",{name:"アクションの編集を完了"})),await t.click(n.getByRole("button",{name:"編集を完了"})),await a(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await t.click(e.getByRole("button",{name:"下書き保存"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました")})}};var $,P,G;u.parameters={...u.parameters,docs:{...($=u.parameters)==null?void 0:$.docs,source:{originalSource:`{
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
}`,...(G=(P=u.parameters)==null?void 0:P.docs)==null?void 0:G.source}}};var W,_,q;g.parameters={...g.parameters,docs:{...(W=g.parameters)==null?void 0:W.docs,source:{originalSource:`{
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
}`,...(q=(_=g.parameters)==null?void 0:_.docs)==null?void 0:q.source}}};var K,z,J;v.parameters={...v.parameters,docs:{...(K=v.parameters)==null?void 0:K.docs,source:{originalSource:`{
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
}`,...(J=(z=v.parameters)==null?void 0:z.docs)==null?void 0:J.source}}};var Q,X,Y;B.parameters={...B.parameters,docs:{...(Q=B.parameters)==null?void 0:Q.docs,source:{originalSource:`{
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
}`,...(Y=(X=B.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};var Z,ee,te;x.parameters={...x.parameters,docs:{...(Z=x.parameters)==null?void 0:Z.docs,source:{originalSource:`{
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
}`,...(te=(ee=x.parameters)==null?void 0:ee.docs)==null?void 0:te.source}}};var ae,ne,oe;b.parameters={...b.parameters,docs:{...(ae=b.parameters)==null?void 0:ae.docs,source:{originalSource:`{
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
}`,...(oe=(ne=b.parameters)==null?void 0:ne.docs)==null?void 0:oe.source}}};var ie,ce,se;d.parameters={...d.parameters,docs:{...(ie=d.parameters)==null?void 0:ie.docs,source:{originalSource:`{
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
}`,...(se=(ce=d.parameters)==null?void 0:ce.docs)==null?void 0:se.source}}};var re,le,ye;T.parameters={...T.parameters,docs:{...(re=T.parameters)==null?void 0:re.docs,source:{originalSource:`{
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
}`,...(ye=(le=T.parameters)==null?void 0:le.docs)==null?void 0:ye.source}}};var me,we,pe;R.parameters={...R.parameters,docs:{...(me=R.parameters)==null?void 0:me.docs,source:{originalSource:`{
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
}`,...(pe=(we=R.parameters)==null?void 0:we.docs)==null?void 0:pe.source}}};var ue,ge,ve;S.parameters={...S.parameters,docs:{...(ue=S.parameters)==null?void 0:ue.docs,source:{originalSource:`{
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
}`,...(ve=(ge=S.parameters)==null?void 0:ge.docs)==null?void 0:ve.source}}};var Be,xe,be;E.parameters={...E.parameters,docs:{...(Be=E.parameters)==null?void 0:Be.docs,source:{originalSource:`{
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
}`,...(be=(xe=E.parameters)==null?void 0:xe.docs)==null?void 0:be.source}}};var de,Te,Re;C.parameters={...C.parameters,docs:{...(de=C.parameters)==null?void 0:de.docs,source:{originalSource:`{
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
}`,...(Re=(Te=C.parameters)==null?void 0:Te.docs)==null?void 0:Re.source}}};var Se,Ee,Ce;I.parameters={...I.parameters,docs:{...(Se=I.parameters)==null?void 0:Se.docs,source:{originalSource:`{
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
}`,...(Ce=(Ee=I.parameters)==null?void 0:Ee.docs)==null?void 0:Ce.source}}};var Ie,He,ke;H.parameters={...H.parameters,docs:{...(Ie=H.parameters)==null?void 0:Ie.docs,source:{originalSource:`{
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
}`,...(ke=(He=H.parameters)==null?void 0:He.docs)==null?void 0:ke.source}}};var Le,Ae,fe;k.parameters={...k.parameters,docs:{...(Le=k.parameters)==null?void 0:Le.docs,source:{originalSource:`{
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
}`,...(fe=(Ae=k.parameters)==null?void 0:Ae.docs)==null?void 0:fe.source}}};var De,Ue,he;L.parameters={...L.parameters,docs:{...(De=L.parameters)==null?void 0:De.docs,source:{originalSource:`{
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
}`,...(he=(Ue=L.parameters)==null?void 0:Ue.docs)==null?void 0:he.source}}};var Ve,je,Oe;A.parameters={...A.parameters,docs:{...(Ve=A.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
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
}`,...(Oe=(je=A.parameters)==null?void 0:je.docs)==null?void 0:Oe.source}}};var Me,Fe,Ne;f.parameters={...f.parameters,docs:{...(Me=f.parameters)==null?void 0:Me.docs,source:{originalSource:`{
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
      await userEvent.click(screen.getByRole('button', {
        name: '状態の編集を完了'
      }));
      await expect(screen.getByRole('button', {
        name: '新しい状態を編集'
      })).toBeVisible();
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
}`,...(Ne=(Fe=f.parameters)==null?void 0:Fe.docs)==null?void 0:Ne.source}}};var $e,Pe,Ge;D.parameters={...D.parameters,docs:{...($e=D.parameters)==null?void 0:$e.docs,source:{originalSource:`{
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
    await step('Objectがordered mixinと1つの初期配置を参照する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '北書庫の扉を編集'
      }));
      await expect(screen.getByRole('region', {
        name: 'ordered Type mixins'
      })).toHaveTextContent('書庫の扉');
      await expect(screen.getByRole('combobox', {
        name: '初期配置'
      })).toHaveTextContent('水没した閲覧室');
    });
  }
}`,...(Ge=(Pe=D.parameters)==null?void 0:Pe.docs)==null?void 0:Ge.source}}};var We,_e,qe;U.parameters={...U.parameters,docs:{...(We=U.parameters)==null?void 0:We.docs,source:{originalSource:`{
  name: 'US-25: 状態とアクションに決定的な結果を設定したい',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '世界データ');
    await step('Object TypeのAction paneからObject個別ルールを開く', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: /^書庫の扉を編集$/
      }));
      await userEvent.click(screen.getByRole('button', {
        name: '扉を開けるを編集'
      }));
      await expect(screen.getByRole('heading', {
        name: 'オブジェクト別の実行ルール'
      })).toBeVisible();
      await expect(screen.getByRole('cell', {
        name: /北書庫の扉/
      })).toBeVisible();
      await userEvent.click(screen.getByRole('button', {
        name: '北書庫の扉の実行ルールを編集'
      }));
    });
    await step('Object個別条件、priorityと順序付きeffectを確認する', async () => {
      await expect(screen.getByTestId('rule-result-preview')).toHaveTextContent('北書庫の扉');
      await expect(screen.getByTestId('rule-result-preview')).toHaveTextContent('2 effect');
      await expect(screen.getByLabelText('実行ルールの優先度')).toHaveValue(100);
      await expect(screen.getByLabelText('実行ルールのアクション')).toHaveAttribute('readonly');
      await expect(screen.getByText('1. 状態を更新')).toBeVisible();
      await expect(screen.getByText('2. 確定した事実を追加')).toBeVisible();
    });
    await step('世界データ末尾の公開準備チェックが決定性を確認する', async () => {
      await expect(canvas.getByTestId('rule-readiness')).toHaveTextContent('決定的です');
      await expect(canvas.queryByRole('button', {
        name: 'アクション結果へ'
      })).not.toBeInTheDocument();
    });
  }
}`,...(qe=(_e=U.parameters)==null?void 0:_e.docs)==null?void 0:qe.source}}};var Ke,ze,Je;h.parameters={...h.parameters,docs:{...(Ke=h.parameters)==null?void 0:Ke.docs,source:{originalSource:`{
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
}`,...(Je=(ze=h.parameters)==null?void 0:ze.docs)==null?void 0:Je.source}}};var Qe,Xe,Ye;V.parameters={...V.parameters,docs:{...(Qe=V.parameters)==null?void 0:Qe.docs,source:{originalSource:`{
  name: 'US-27: 不完全なルールデータを警告付きでDraft保存したい',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '世界データ');
    await step('必須のObject個別ルールを削除すると公開準備の警告を表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: /^書庫の扉を編集$/
      }));
      await userEvent.click(screen.getByRole('button', {
        name: '扉を開けるを編集'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: '北書庫の扉の実行ルールを編集'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: 'この実行ルールを削除'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: 'アクションの編集を完了'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: '編集を完了'
      }));
      await expect(canvas.getByRole('region', {
        name: '公開準備チェック'
      })).toHaveTextContent('下書き警告');
      await expect(canvas.getByRole('region', {
        name: '公開準備チェック'
      })).toHaveTextContent('実行ルールが未設定');
    });
    await step('警告があっても下書き保存できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '下書き保存'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('Draftとして保存しました');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('未設定項目が1件');
    });
  }
}`,...(Ye=(Xe=V.parameters)==null?void 0:Xe.docs)==null?void 0:Ye.source}}};var Ze,et,tt;j.parameters={...j.parameters,docs:{...(Ze=j.parameters)==null?void 0:Ze.docs,source:{originalSource:`{
  name: '西の扉seed: 8つの実行内容を編集・並べ替え・保存する',
  render: () => <MyrialeApp initialUrl="/scenarios/new" initialDb={createDemoDb('registrationDraft')} scenarioRegistrationContainer={MockWestDoorAuthoringContainer} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('Scenario Editorだけで作成したinside / outside、exit-door、open-and-exit、west-doorを確認する', async () => {
      await goToStep(canvas, '世界データ');
      await expect(canvas.getByRole('button', {
        name: '地下研究室を編集'
      })).toBeVisible();
      await expect(canvas.getByRole('button', {
        name: '研究施設の外を編集'
      })).toBeVisible();
      await expect(canvas.getByRole('button', {
        name: /^出口の扉を編集$/
      })).toBeVisible();
      await expect(canvas.getByRole('button', {
        name: '西の扉を編集'
      })).toBeVisible();
    });
    await step('Object paneでordered mixin、解決済みsource、Object local ruleを確認する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '西の扉を編集'
      }));
      const mixins = screen.getByRole('region', {
        name: 'ordered Type mixins'
      });
      await expect(mixins).toHaveTextContent('開閉可能');
      await expect(mixins).toHaveTextContent('出口の扉');
      const preview = screen.getByRole('region', {
        name: '解決済み設定preview'
      });
      await expect(preview).toHaveTextContent('source: 開閉可能');
      await expect(preview).toHaveTextContent('source: Object local');
      await expect(screen.getByRole('region', {
        name: 'Object action rules'
      })).toHaveTextContent('inspect-exit');
      await userEvent.click(screen.getByRole('button', {
        name: '編集を完了'
      }));
    });
    await step('Action paneのtableから西の扉ルールを開き、8項目を順序どおり表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: /^出口の扉を編集$/
      }));
      await userEvent.click(screen.getByRole('button', {
        name: '扉を開けて外へ出るを編集'
      }));
      await expect(screen.getByRole('heading', {
        name: 'オブジェクト別の実行ルール'
      })).toBeVisible();
      await userEvent.click(screen.getByRole('button', {
        name: '西の扉の実行ルールを編集'
      }));
      await expect(screen.getByLabelText('実行ルールの条件値')).toHaveValue('false');
      await expect(screen.getByLabelText('実行ルールのアクション')).toHaveAttribute('readonly');
      await expect(screen.getByTestId('rule-result-preview')).toHaveTextContent('8 effect');
      const effects = screen.getByRole('list', {
        name: '順序付きの実行内容'
      });
      await expect(effects).toHaveTextContent('1. 状態を更新');
      await expect(effects).toHaveTextContent('2. プレイヤーの現在地を移動');
      await expect(effects).toHaveTextContent('5. 出来事を記録');
      await expect(effects).toHaveTextContent('7. 矛盾する描写を禁止');
      await expect(screen.getByLabelText('5番目の出来事の名前')).toHaveValue('session-moved');
      await expect(screen.getByLabelText('5番目の出来事の場所code')).toHaveValue('outside');
    });
    await step('出来事と禁止描写を編集し、キーボード操作できる順序変更ボタンで並べ替える', async () => {
      await userEvent.clear(screen.getByLabelText('5番目の出来事の名前'));
      await userEvent.type(screen.getByLabelText('5番目の出来事の名前'), 'player-left-building');
      await userEvent.click(screen.getByRole('button', {
        name: '7番目を上へ移動'
      }));
      await expect(screen.getByRole('list', {
        name: '順序付きの実行内容'
      })).toHaveTextContent('6. 矛盾する描写を禁止');
      await expect(screen.getByLabelText('6番目の文章')).toHaveValue('まだ室内にいる');
    });
    await step('公開準備を満たした8項目を下書き保存する', async () => {
      await userEvent.click(screen.getByRole('button', {
        name: '実行ルールの編集を完了'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: 'アクションの編集を完了'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: '編集を完了'
      }));
      await expect(canvas.getByTestId('rule-readiness')).toHaveTextContent('決定的です');
      await userEvent.click(canvas.getByRole('button', {
        name: '下書き保存'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('Draftとして保存しました');
    });
  }
}`,...(tt=(et=j.parameters)==null?void 0:et.docs)==null?void 0:tt.source}}};const jt=["AuthenticationReturnsToScenarioCreation","AuthenticationDefaultsToHome","US01CreateDraftScenario","US02SpecifyGenreTag","US04TuneAiFreedom","US05SetInitialCharacter","US06DefineOpeningScene","US11SpecifyIllustrationStyle","US12SpecifyIllustrationMood","US13SpecifyNegativeElements","US14PreviewIllustration","US15IterateIllustrationSettings","US17ConsultAiAboutRegistration","US18SelectAiByPurpose","US19AiCompletesSummary","US21ConsultIllustrationTaste","US22GenerateIllustrationPrompt","US23DefineObjectTypeStatesAndActions","US24CreateLocationsAndPlaceObjects","US25AuthorDeterministicActionResults","US26KeepDependenciesSafe","US27SaveIncompleteRuleDataAsDraft","AuthorWestDoorSeedWithEightOrderedEffects"];export{g as AuthenticationDefaultsToHome,u as AuthenticationReturnsToScenarioCreation,j as AuthorWestDoorSeedWithEightOrderedEffects,v as US01CreateDraftScenario,B as US02SpecifyGenreTag,x as US04TuneAiFreedom,b as US05SetInitialCharacter,d as US06DefineOpeningScene,T as US11SpecifyIllustrationStyle,R as US12SpecifyIllustrationMood,S as US13SpecifyNegativeElements,E as US14PreviewIllustration,C as US15IterateIllustrationSettings,I as US17ConsultAiAboutRegistration,H as US18SelectAiByPurpose,k as US19AiCompletesSummary,L as US21ConsultIllustrationTaste,A as US22GenerateIllustrationPrompt,f as US23DefineObjectTypeStatesAndActions,D as US24CreateLocationsAndPlaceObjects,U as US25AuthorDeterministicActionResults,h as US26KeepDependenciesSafe,V as US27SaveIncompleteRuleDataAsDraft,jt as __namedExportsOrder,Vt as default};
