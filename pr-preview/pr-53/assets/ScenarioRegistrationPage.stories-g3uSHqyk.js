import{j as l}from"./jsx-runtime-BO8uF4Og.js";import{r as tt}from"./index-D4H_InIO.js";import{w as c,e as a,u as t}from"./index-C4S39nCK.js";import{S as ct,e as it,M as w,c as rt}from"./MyrialeApp-CBtnitmT.js";import{u as lt,c as j}from"./SessionPresentation-BjM1TTZ7.js";import{w as yt,c as mt}from"./scenarioRegistrationFixtures-DBXR4Jfg.js";/* empty css               */import"./AppChrome-CBArT6hJ.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-DnR2L1gN.js";import"./editPaneLayer-BYDGh10V.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CuT8m0Jw.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./EditPane-C3MJ4kyA.js";import"./ModuleUiHost-CoZk1x5n.js";import"./account-CGbtz8io.js";import"./SessionListPresentation-Dg-uj_rK.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-Cizm6efh.js";const wt={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function F({ruleData:s}){const o=lt(),[e,n]=tt.useState("未発行"),y=async i=>{if(!i.title.trim())return{ok:!1,message:"タイトルを入力すると下書き保存できます。",fieldErrors:{title:["シナリオタイトルを入力してください。"]}};const m="SCN-DRAFT-0427";return n(m),o==null||o.dispatch({type:"SCENARIO_SAVED",scenario:{id:m,title:i.title.trim(),status:"draft",genre:i.genre,updatedAt:"2026-07-23",summary:i.summary,tone:"",lore:"",aiFreedom:i.aiFreedom,heroMode:i.heroMode,heroFreeGenerationAllowed:i.heroFreeGenerationAllowed,hero:i.hero,opening:i.opening,illustrationStyle:i.illustrationStyle,illustrationMood:i.illustrationMood,illustrationNegative:i.illustrationNegative,sampleScene:i.sampleScene}}),{ok:!0,message:`「${i.title.trim()}」をDraftとして保存しました。ScenarioIdを発行しました。`,value:{scenarioId:m}}},st=async(i,m)=>m==="summary"?{ok:!0,message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",value:{message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",suggestions:[{id:"summary-1",body:`## 物語の目的

地下に沈んだ王都で、禁書を読むたびに書き換わる星座の謎を追います。

- 水没した書庫を探索する
- 失われる記憶の代償を選ぶ`,rationale:"タイトル、ジャンル、基本情報からMarkdown案を生成しました。"}]}}:m==="illustration-style"?{ok:!0,message:"シナリオに合う画風候補を提示しました。",value:{message:"シナリオに合う画風候補を提示しました。",suggestions:[{id:"style-1",body:"銅版画風、影絵、水彩写本。低彩度で星図の金線だけを強調。",rationale:"既存のムードとNG要素に合わせました。"}]}}:m==="illustration-prompt"?{ok:!0,message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",value:{message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",suggestions:[{id:"prompt-1",body:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",rationale:"プロンプトとNG要素を分離しました。"}],prompt:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",negativePrompt:i.illustrationNegative}}:{ok:!0,message:"サンプルシーンのプレビューを生成しました。",value:{message:"サンプルシーンのプレビューを生成しました。",suggestions:[],previewText:`[Preview / 保存対象外] ${i.sampleScene} / ${i.illustrationStyle} / ${i.illustrationMood}`}};return l.jsx(ct,{account:wt,scenarioId:e,initialValues:s?{...it,title:"星喰いの地下図書館",ruleData:structuredClone(s)}:void 0,saving:!1,aiWorking:!1,actions:{saveDraft:y,assist:st},onLogout:()=>{}})}function O(){return l.jsx(F,{})}function at(){return l.jsx(F,{ruleData:mt})}function nt(){return l.jsx(F,{ruleData:yt})}O.__docgenInfo={description:"",methods:[],displayName:"MockScenarioRegistrationContainer"};at.__docgenInfo={description:"",methods:[],displayName:"MockScenarioRegistrationWithRuleDataContainer"};nt.__docgenInfo={description:"",methods:[],displayName:"MockWestDoorAuthoringContainer"};const Vt={title:"ユーザーストーリー/Scenario registration",component:w,render:()=>l.jsx(w,{initialUrl:"/scenarios/new",initialDb:j("registrationDraft"),scenarioRegistrationContainer:O}),parameters:{notes:"docs/user-stories/scenario-registration.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}};function ot({initialUrl:s}){const o=tt.useMemo(()=>{const e=rt();return e.logout(),e},[]);return l.jsx(w,{initialUrl:s,initialDb:j("registrationDraft"),accountApi:o,scenarioRegistrationContainer:O})}const r=async(s,o)=>{await t.click(s.getByRole("button",{name:`${o}へ`}))},p={name:"認証: ログイン後にシナリオ作成へ戻る",render:()=>l.jsx(ot,{initialUrl:"/scenarios/new"}),play:async({canvasElement:s,step:o})=>{const e=c(s);await o("未ログインではログイン画面へ移動し、元のURLを保持する",async()=>{await a(await e.findByRole("main",{name:"ログイン"})).toBeVisible(),await a(e.getByTestId("app-url")).toHaveTextContent("/account/login"),await a(e.getByTestId("app-url")).toHaveTextContent("redirect=%2Fscenarios%2Fnew")}),await o("ログインすると元のシナリオ作成画面へ戻る",async()=>{await t.clear(e.getByLabelText("メールアドレス")),await t.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await t.type(e.getByTestId("login-password"),"a"),await t.click(e.getByRole("button",{name:"ログインする"})),await a(await e.findByRole("main",{name:"シナリオ登録ウィザード"})).toBeVisible(),await a(e.getByTestId("app-url")).toHaveTextContent("/scenarios/new")})}},u={name:"認証: 戻り先がなければホームへ進む",render:()=>l.jsx(ot,{initialUrl:"/account/login"}),play:async({canvasElement:s,step:o})=>{const e=c(s);await o("戻り先なしでログインする",async()=>{await a(await e.findByRole("main",{name:"ログイン"})).toBeVisible(),await t.clear(e.getByLabelText("メールアドレス")),await t.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await t.type(e.getByTestId("login-password"),"a"),await t.click(e.getByRole("button",{name:"ログインする"}))}),await o("デフォルトのホーム画面へ移動する",async()=>{await a(await e.findByRole("main",{name:"Myrialeトップページ"})).toBeVisible(),await a(e.getByTestId("app-url")).toHaveTextContent("/")})}},g={name:"US-01: 新しいシナリオを作成したい",play:async({canvasElement:s,step:o})=>{const e=c(s);await o("タイトル未入力では、下書き保存に必要な項目を説明する",async()=>{await t.click(e.getByRole("button",{name:"下書き保存"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("タイトルを入力すると下書き保存できます。")}),await o("タイトルだけ入力してDraft保存し、ScenarioIdを発行する",async()=>{await t.type(e.getByLabelText("シナリオタイトル"),"星喰いの地下図書館"),await t.click(e.getByRole("button",{name:"下書き保存"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました"),await a(e.getByText("SCN-DRAFT-0427")).toBeVisible()})}},v={name:"US-02: シナリオのジャンルをタグで指定したい",play:async({canvasElement:s,step:o})=>{const e=c(s);await o("タイトル直下へ複数のジャンルタグを追加し、表紙サマリーへ反映する",async()=>{const n=e.getByLabelText("ジャンルタグを追加");await t.type(n,"ポストアポカリプス{Enter}"),await t.type(n,"巡礼譚"),await t.click(e.getByRole("button",{name:"タグを追加"})),await a(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("# ポストアポカリプス"),await a(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("# 巡礼譚"),await a(e.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("# ポストアポカリプス # 巡礼譚")}),await o("不要なタグを個別に削除できる",async()=>{await t.click(e.getByRole("button",{name:"巡礼譚タグを削除"})),await a(e.getByRole("group",{name:"登録済みジャンルタグ"})).not.toHaveTextContent("# 巡礼譚")})}},B={name:"US-04: AIの裁量レベルを調整したい",play:async({canvasElement:s,step:o})=>{const e=c(s),n=c(s.ownerDocument.body);await r(e,"AI裁量"),await o("AI裁量を高へ変更し、生成時の挙動差を明示する",async()=>{const y=e.getAllByRole("combobox",{name:"AI裁量"})[0];await t.click(y),await t.click(await n.findByRole("option",{name:"高: 展開を広げる"})),await a(y).toHaveTextContent("高: 展開を広げる"),await a(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("高: 展開を広げる")})}},b={name:"US-05: 初期キャラクター条件を設定したい",play:async({canvasElement:s,step:o})=>{const e=c(s);await r(e,"主人公"),await o("主人公の扱いと自由生成時の前提を入力する",async()=>{await a(e.getByRole("combobox",{name:"主人公の扱い"})).toHaveTextContent("自由生成のみ"),await t.clear(e.getByLabelText("主人公の設定")),await t.type(e.getByLabelText("主人公の設定"),"主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で自由に決められる。"),a(e.getByLabelText("主人公の設定").value).toContain("新人地図師"),await a(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("自由生成")})}},x={name:"US-06: シナリオの開始シーンを定義したい",play:async({canvasElement:s,step:o})=>{const e=c(s);await r(e,"第一場面"),await o("開始シーンを固定し、初回Narrativeの材料にする",async()=>{await t.clear(e.getByLabelText("開始シーン")),await t.type(e.getByLabelText("開始シーン"),"あなたは灰の降る駅で、宛名のない切符を握っている。"),a(e.getByLabelText("開始シーン").value).toContain("灰の降る駅"),await a(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("固定")})}},d={name:"US-11: 挿絵のテイストを指定したい",play:async({canvasElement:s,step:o})=>{const e=c(s);c(s.ownerDocument.body),await r(e,"挿絵"),await o("文章と視覚表現を揃える画風を指定する",async()=>{await t.clear(e.getByLabelText("挿絵の画風")),await t.type(e.getByLabelText("挿絵の画風"),"古い天文図の銅版画、インクの滲み、低彩度"),a(e.getByLabelText("挿絵の画風").value).toContain("銅版画")})}},T={name:"US-12: 挿絵の雰囲気を指定したい",play:async({canvasElement:s,step:o})=>{const e=c(s);c(s.ownerDocument.body),await r(e,"挿絵"),await o("挿絵生成に使う感情的トーンを複数指定する",async()=>{await t.clear(e.getByLabelText("挿絵のムード")),await t.type(e.getByLabelText("挿絵のムード"),"孤独、湿度、薄明、遠い鐘の音"),a(e.getByLabelText("挿絵のムード").value).toContain("薄明")})}},R={name:"US-13: 挿絵の禁止要素を指定したい",play:async({canvasElement:s,step:o})=>{const e=c(s);c(s.ownerDocument.body),await r(e,"挿絵"),await o("年齢制限や世界観を守るNG要素を入力する",async()=>{await t.clear(e.getByLabelText("挿絵の禁止要素")),await t.type(e.getByLabelText("挿絵の禁止要素"),"現代兵器、スマートフォン、過度な流血"),a(e.getByLabelText("挿絵の禁止要素").value).toContain("スマートフォン")})}},S={name:"US-14: 挿絵を事前にプレビューしたい",play:async({canvasElement:s,step:o})=>{const e=c(s);c(s.ownerDocument.body),await r(e,"挿絵"),await o("サンプルシーンを入力し、本番相当の挿絵を保存せず生成する",async()=>{await t.clear(e.getByLabelText("サンプルシーン")),await t.type(e.getByLabelText("サンプルシーン"),"地下書庫の水面に星座が反射している。"),await t.click(e.getByRole("button",{name:"サンプルシーンで生成"})),await a(e.getByTestId("illustration-preview")).toHaveTextContent("保存対象外"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("まだ確定していません")})}},E={name:"US-15: プレビューを見ながら挿絵設定を調整したい",play:async({canvasElement:s,step:o})=>{const e=c(s);await r(e,"挿絵"),await o("設定を変更して再生成し、納得した設定のみ保存対象にする",async()=>{await t.clear(e.getByLabelText("挿絵の画風")),await t.type(e.getByLabelText("挿絵の画風"),"影絵、余白多め、灯火だけ金色"),await t.click(e.getByRole("button",{name:"サンプルシーンで生成"})),a(e.getByLabelText("挿絵の画風").value).toContain("影絵"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("設定はまだ確定していません")})}},C={name:"US-17: 登録内容をAIに相談したい",play:async({canvasElement:s,step:o})=>{const e=c(s);await o("AIに相談しても、提案は自動確定しない",async()=>{await t.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await a(e.getByTestId("ai-suggestion")).toHaveTextContent("基本情報案を3つ提示しました"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},I={name:"US-18: どのAIに聞くかを選択したい",play:async({canvasElement:s,step:o})=>{const e=c(s),n=c(s.ownerDocument.body);await r(e,"挿絵"),await o("用途に合わせて相談先AIを選び、選択したAIで提案を生成する",async()=>{await t.click(e.getByRole("combobox",{name:"相談先AI"})),await t.click(await n.findByRole("option",{name:"挿絵AI"})),await t.click(e.getByRole("button",{name:"画風を相談"})),await a(e.getByRole("combobox",{name:"相談先AI"})).toHaveTextContent("挿絵AI"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵AIに挿絵テイストを相談しました")})}},H={name:"US-19: シナリオの基本情報をAIに補完してもらいたい",play:async({canvasElement:s,step:o})=>{const e=c(s);await o("基本情報候補を見て、採用してからMarkdown本文に入れる",async()=>{await t.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await t.click(e.getByRole("button",{name:"採用して編集"})),a(e.getByLabelText("基本情報").value).toContain("## 物語の目的"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("採用しました"),await t.click(e.getByRole("button",{name:"プレビュー"})),await a(e.getByRole("article",{name:"基本情報のMarkdownプレビュー"})).toHaveTextContent("水没した書庫を探索する")})}},k={name:"US-21: 挿絵テイストをAIに相談したい",play:async({canvasElement:s,step:o})=>{const e=c(s);await r(e,"挿絵"),await o("シナリオに合う画風候補をAIに提示してもらう",async()=>{await t.click(e.getByRole("button",{name:"画風を相談"})),await a(e.getByTestId("ai-suggestion")).toHaveTextContent("画風候補"),await a(e.getByTestId("ai-suggestion")).toHaveTextContent("銅版画風")})}},L={name:"US-22: 挿絵プロンプトをAIに生成させたい",play:async({canvasElement:s,step:o})=>{const e=c(s);await r(e,"挿絵"),await o("画像生成用プロンプトとネガティブを分離して出力する",async()=>{await t.click(e.getByRole("button",{name:"プロンプトを生成"})),await a(e.getByTestId("ai-suggestion")).toHaveTextContent("ネガティブプロンプト"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵プロンプトを相談しました")})}},M=()=>l.jsx(w,{initialUrl:"/scenarios/new",initialDb:j("registrationDraft"),scenarioRegistrationContainer:at}),A={name:"US-23: Object Typeの状態とアクションを定義したい",play:async({canvasElement:s,step:o})=>{const e=c(s),n=c(s.ownerDocument.body);await r(e,"世界データ"),await o("新しい種類へstable code、状態、公開範囲を登録する",async()=>{await t.click(e.getByRole("button",{name:"種類を追加"})),await t.clear(n.getByLabelText("種類のstable code")),await t.type(n.getByLabelText("種類のstable code"),"sealed-door"),await t.clear(n.getByLabelText("種類の表示名")),await t.type(n.getByLabelText("種類の表示名"),"隔壁扉"),await t.click(n.getByRole("button",{name:"状態を追加"})),await t.clear(n.getByLabelText("状態1のcode")),await t.type(n.getByLabelText("状態1のcode"),"open"),await a(n.getByRole("combobox",{name:"状態1の公開範囲"})).toHaveTextContent("公開"),await t.click(n.getByRole("button",{name:"状態の編集を完了"})),await a(n.getByRole("button",{name:"新しい状態を編集"})).toBeVisible()}),await o("AIへ列挙するアクションinterfaceを登録する",async()=>{await t.click(n.getByRole("button",{name:"アクションを追加"})),await t.clear(n.getByLabelText("アクション1のcode")),await t.type(n.getByLabelText("アクション1のcode"),"open"),await t.clear(n.getByLabelText("アクション1の表示名")),await t.type(n.getByLabelText("アクション1の表示名"),"扉を開ける"),await a(n.getByRole("combobox",{name:"アクション1の公開先"})).toHaveTextContent("AI候補")})}},f={name:"US-24: Locationを作成してObjectを初期配置したい",render:M,play:async({canvasElement:s,step:o})=>{const e=c(s),n=c(s.ownerDocument.body);await r(e,"世界データ"),await o("場所を追加してstable codeを維持する",async()=>{await t.click(e.getByRole("button",{name:"場所を追加"})),await t.clear(n.getByLabelText("場所のstable code")),await t.type(n.getByLabelText("場所のstable code"),"sealed-vault"),await t.clear(n.getByLabelText("場所の表示名")),await t.type(n.getByLabelText("場所の表示名"),"封印書庫"),await t.click(n.getByRole("button",{name:"編集を完了"})),await a(e.getByRole("button",{name:"封印書庫を編集"})).toBeVisible()}),await o("Objectが種類と1つの初期配置を参照する",async()=>{await t.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await a(n.getByRole("combobox",{name:"オブジェクト種類"})).toHaveTextContent("書庫の扉"),await a(n.getByRole("combobox",{name:"初期配置"})).toHaveTextContent("水没した閲覧室")})}},D={name:"US-25: 状態とアクションに決定的な結果を設定したい",render:M,play:async({canvasElement:s,step:o})=>{const e=c(s),n=c(s.ownerDocument.body);await r(e,"世界データ"),await o("Object TypeのAction paneからObject個別ルールを開く",async()=>{await t.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await t.click(n.getByRole("button",{name:"扉を開けるを編集"})),await a(n.getByRole("heading",{name:"オブジェクト別の実行ルール"})).toBeVisible(),await a(n.getByRole("cell",{name:/北書庫の扉/})).toBeVisible(),await t.click(n.getByRole("button",{name:"北書庫の扉の実行ルールを編集"}))}),await o("Object個別条件、priorityと順序付きeffectを確認する",async()=>{await a(n.getByTestId("rule-result-preview")).toHaveTextContent("北書庫の扉"),await a(n.getByTestId("rule-result-preview")).toHaveTextContent("2 effect"),await a(n.getByLabelText("実行ルールの優先度")).toHaveValue(100),await a(n.getByLabelText("実行ルールのアクション")).toHaveAttribute("readonly"),await a(n.getByText("1. 状態を更新")).toBeVisible(),await a(n.getByText("2. 確定した事実を追加")).toBeVisible()}),await o("世界データ末尾の公開準備チェックが決定性を確認する",async()=>{await a(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await a(e.queryByRole("button",{name:"アクション結果へ"})).not.toBeInTheDocument()})}},U={name:"US-26: 参照中の種類と場所を安全に削除したい",render:M,play:async({canvasElement:s,step:o})=>{const e=c(s),n=c(s.ownerDocument.body);await r(e,"世界データ"),await o("Objectが参照中の種類は削除を拒否する",async()=>{await t.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await t.click(n.getByRole("button",{name:"この種類を削除"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("先に種類を変更するかオブジェクトを削除"),await t.click(n.getByRole("button",{name:"編集ペインを閉じる"}))}),await o("同じページでObjectが配置中のLocationも削除を拒否する",async()=>{await t.click(e.getByRole("button",{name:"水没した閲覧室を編集"})),await t.click(n.getByRole("button",{name:"この場所を削除"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("先に配置先を変更するかオブジェクトを削除")})}},h={name:"US-27: 不完全なルールデータを警告付きでDraft保存したい",render:M,play:async({canvasElement:s,step:o})=>{const e=c(s),n=c(s.ownerDocument.body);await r(e,"世界データ"),await o("必須のObject個別ルールを削除すると公開準備の警告を表示する",async()=>{await t.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await t.click(n.getByRole("button",{name:"扉を開けるを編集"})),await t.click(n.getByRole("button",{name:"北書庫の扉の実行ルールを編集"})),await t.click(n.getByRole("button",{name:"この実行ルールを削除"})),await t.click(n.getByRole("button",{name:"アクションの編集を完了"})),await t.click(n.getByRole("button",{name:"編集を完了"})),await a(e.getByRole("region",{name:"公開準備チェック"})).toHaveTextContent("下書き警告"),await a(e.getByRole("region",{name:"公開準備チェック"})).toHaveTextContent("実行ルールが未設定")}),await o("警告があっても下書き保存できる",async()=>{await t.click(e.getByRole("button",{name:"下書き保存"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました"),await a(e.getByTestId("scenario-notice")).toHaveTextContent("未設定項目が1件")})}},V={name:"西の扉seed: 8つの実行内容を編集・並べ替え・保存する",render:()=>l.jsx(w,{initialUrl:"/scenarios/new",initialDb:j("registrationDraft"),scenarioRegistrationContainer:nt}),play:async({canvasElement:s,step:o})=>{const e=c(s),n=c(s.ownerDocument.body);await o("Scenario Editorだけで作成したinside / outside、exit-door、open-and-exit、west-doorを確認する",async()=>{await r(e,"世界データ"),await a(e.getByRole("button",{name:"地下研究室を編集"})).toBeVisible(),await a(e.getByRole("button",{name:"研究施設の外を編集"})).toBeVisible(),await a(e.getByRole("button",{name:/^出口の扉を編集$/})).toBeVisible(),await a(e.getByRole("button",{name:"西の扉を編集"})).toBeVisible()}),await o("Action paneのtableから西の扉ルールを開き、8項目を順序どおり表示する",async()=>{await t.click(e.getByRole("button",{name:/^出口の扉を編集$/})),await t.click(n.getByRole("button",{name:"扉を開けて外へ出るを編集"})),await a(n.getByRole("heading",{name:"オブジェクト別の実行ルール"})).toBeVisible(),await t.click(n.getByRole("button",{name:"西の扉の実行ルールを編集"})),await a(n.getByLabelText("実行ルールの条件値")).toHaveValue("false"),await a(n.getByLabelText("実行ルールのアクション")).toHaveAttribute("readonly"),await a(n.getByTestId("rule-result-preview")).toHaveTextContent("8 effect");const y=n.getByRole("list",{name:"順序付きの実行内容"});await a(y).toHaveTextContent("1. 状態を更新"),await a(y).toHaveTextContent("2. プレイヤーの現在地を移動"),await a(y).toHaveTextContent("5. 出来事を記録"),await a(y).toHaveTextContent("7. 矛盾する描写を禁止"),await a(n.getByLabelText("5番目の出来事の名前")).toHaveValue("session-moved"),await a(n.getByLabelText("5番目の出来事の場所code")).toHaveValue("outside")}),await o("出来事と禁止描写を編集し、キーボード操作できる順序変更ボタンで並べ替える",async()=>{await t.clear(n.getByLabelText("5番目の出来事の名前")),await t.type(n.getByLabelText("5番目の出来事の名前"),"player-left-building"),await t.click(n.getByRole("button",{name:"7番目を上へ移動"})),await a(n.getByRole("list",{name:"順序付きの実行内容"})).toHaveTextContent("6. 矛盾する描写を禁止"),await a(n.getByLabelText("6番目の文章")).toHaveValue("まだ室内にいる")}),await o("公開準備を満たした8項目を下書き保存する",async()=>{await t.click(n.getByRole("button",{name:"実行ルールの編集を完了"})),await t.click(n.getByRole("button",{name:"アクションの編集を完了"})),await t.click(n.getByRole("button",{name:"編集を完了"})),await a(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await t.click(e.getByRole("button",{name:"下書き保存"})),await a(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました")})}};var N,$,P;p.parameters={...p.parameters,docs:{...(N=p.parameters)==null?void 0:N.docs,source:{originalSource:`{
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
}`,...(P=($=p.parameters)==null?void 0:$.docs)==null?void 0:P.source}}};var G,W,_;u.parameters={...u.parameters,docs:{...(G=u.parameters)==null?void 0:G.docs,source:{originalSource:`{
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
}`,...(_=(W=u.parameters)==null?void 0:W.docs)==null?void 0:_.source}}};var q,K,z;g.parameters={...g.parameters,docs:{...(q=g.parameters)==null?void 0:q.docs,source:{originalSource:`{
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
}`,...(z=(K=g.parameters)==null?void 0:K.docs)==null?void 0:z.source}}};var J,Q,X;v.parameters={...v.parameters,docs:{...(J=v.parameters)==null?void 0:J.docs,source:{originalSource:`{
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
}`,...(X=(Q=v.parameters)==null?void 0:Q.docs)==null?void 0:X.source}}};var Y,Z,ee;B.parameters={...B.parameters,docs:{...(Y=B.parameters)==null?void 0:Y.docs,source:{originalSource:`{
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
}`,...(ee=(Z=B.parameters)==null?void 0:Z.docs)==null?void 0:ee.source}}};var te,ae,ne;b.parameters={...b.parameters,docs:{...(te=b.parameters)==null?void 0:te.docs,source:{originalSource:`{
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
}`,...(ne=(ae=b.parameters)==null?void 0:ae.docs)==null?void 0:ne.source}}};var oe,se,ce;x.parameters={...x.parameters,docs:{...(oe=x.parameters)==null?void 0:oe.docs,source:{originalSource:`{
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
}`,...(ce=(se=x.parameters)==null?void 0:se.docs)==null?void 0:ce.source}}};var ie,re,le;d.parameters={...d.parameters,docs:{...(ie=d.parameters)==null?void 0:ie.docs,source:{originalSource:`{
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
}`,...(le=(re=d.parameters)==null?void 0:re.docs)==null?void 0:le.source}}};var ye,me,we;T.parameters={...T.parameters,docs:{...(ye=T.parameters)==null?void 0:ye.docs,source:{originalSource:`{
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
}`,...(we=(me=T.parameters)==null?void 0:me.docs)==null?void 0:we.source}}};var pe,ue,ge;R.parameters={...R.parameters,docs:{...(pe=R.parameters)==null?void 0:pe.docs,source:{originalSource:`{
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
}`,...(ge=(ue=R.parameters)==null?void 0:ue.docs)==null?void 0:ge.source}}};var ve,Be,be;S.parameters={...S.parameters,docs:{...(ve=S.parameters)==null?void 0:ve.docs,source:{originalSource:`{
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
}`,...(be=(Be=S.parameters)==null?void 0:Be.docs)==null?void 0:be.source}}};var xe,de,Te;E.parameters={...E.parameters,docs:{...(xe=E.parameters)==null?void 0:xe.docs,source:{originalSource:`{
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
}`,...(Te=(de=E.parameters)==null?void 0:de.docs)==null?void 0:Te.source}}};var Re,Se,Ee;C.parameters={...C.parameters,docs:{...(Re=C.parameters)==null?void 0:Re.docs,source:{originalSource:`{
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
}`,...(Ee=(Se=C.parameters)==null?void 0:Se.docs)==null?void 0:Ee.source}}};var Ce,Ie,He;I.parameters={...I.parameters,docs:{...(Ce=I.parameters)==null?void 0:Ce.docs,source:{originalSource:`{
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
}`,...(He=(Ie=I.parameters)==null?void 0:Ie.docs)==null?void 0:He.source}}};var ke,Le,Ae;H.parameters={...H.parameters,docs:{...(ke=H.parameters)==null?void 0:ke.docs,source:{originalSource:`{
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
}`,...(Ae=(Le=H.parameters)==null?void 0:Le.docs)==null?void 0:Ae.source}}};var fe,De,Ue;k.parameters={...k.parameters,docs:{...(fe=k.parameters)==null?void 0:fe.docs,source:{originalSource:`{
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
}`,...(Ue=(De=k.parameters)==null?void 0:De.docs)==null?void 0:Ue.source}}};var he,Ve,je;L.parameters={...L.parameters,docs:{...(he=L.parameters)==null?void 0:he.docs,source:{originalSource:`{
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
}`,...(je=(Ve=L.parameters)==null?void 0:Ve.docs)==null?void 0:je.source}}};var Me,Fe,Oe;A.parameters={...A.parameters,docs:{...(Me=A.parameters)==null?void 0:Me.docs,source:{originalSource:`{
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
}`,...(Oe=(Fe=A.parameters)==null?void 0:Fe.docs)==null?void 0:Oe.source}}};var Ne,$e,Pe;f.parameters={...f.parameters,docs:{...(Ne=f.parameters)==null?void 0:Ne.docs,source:{originalSource:`{
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
}`,...(Pe=($e=f.parameters)==null?void 0:$e.docs)==null?void 0:Pe.source}}};var Ge,We,_e;D.parameters={...D.parameters,docs:{...(Ge=D.parameters)==null?void 0:Ge.docs,source:{originalSource:`{
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
}`,...(_e=(We=D.parameters)==null?void 0:We.docs)==null?void 0:_e.source}}};var qe,Ke,ze;U.parameters={...U.parameters,docs:{...(qe=U.parameters)==null?void 0:qe.docs,source:{originalSource:`{
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
}`,...(ze=(Ke=U.parameters)==null?void 0:Ke.docs)==null?void 0:ze.source}}};var Je,Qe,Xe;h.parameters={...h.parameters,docs:{...(Je=h.parameters)==null?void 0:Je.docs,source:{originalSource:`{
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
}`,...(Xe=(Qe=h.parameters)==null?void 0:Qe.docs)==null?void 0:Xe.source}}};var Ye,Ze,et;V.parameters={...V.parameters,docs:{...(Ye=V.parameters)==null?void 0:Ye.docs,source:{originalSource:`{
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
}`,...(et=(Ze=V.parameters)==null?void 0:Ze.docs)==null?void 0:et.source}}};const jt=["AuthenticationReturnsToScenarioCreation","AuthenticationDefaultsToHome","US01CreateDraftScenario","US02SpecifyGenreTag","US04TuneAiFreedom","US05SetInitialCharacter","US06DefineOpeningScene","US11SpecifyIllustrationStyle","US12SpecifyIllustrationMood","US13SpecifyNegativeElements","US14PreviewIllustration","US15IterateIllustrationSettings","US17ConsultAiAboutRegistration","US18SelectAiByPurpose","US19AiCompletesSummary","US21ConsultIllustrationTaste","US22GenerateIllustrationPrompt","US23DefineObjectTypeStatesAndActions","US24CreateLocationsAndPlaceObjects","US25AuthorDeterministicActionResults","US26KeepDependenciesSafe","US27SaveIncompleteRuleDataAsDraft","AuthorWestDoorSeedWithEightOrderedEffects"];export{u as AuthenticationDefaultsToHome,p as AuthenticationReturnsToScenarioCreation,V as AuthorWestDoorSeedWithEightOrderedEffects,g as US01CreateDraftScenario,v as US02SpecifyGenreTag,B as US04TuneAiFreedom,b as US05SetInitialCharacter,x as US06DefineOpeningScene,d as US11SpecifyIllustrationStyle,T as US12SpecifyIllustrationMood,R as US13SpecifyNegativeElements,S as US14PreviewIllustration,E as US15IterateIllustrationSettings,C as US17ConsultAiAboutRegistration,I as US18SelectAiByPurpose,H as US19AiCompletesSummary,k as US21ConsultIllustrationTaste,L as US22GenerateIllustrationPrompt,A as US23DefineObjectTypeStatesAndActions,f as US24CreateLocationsAndPlaceObjects,D as US25AuthorDeterministicActionResults,U as US26KeepDependenciesSafe,h as US27SaveIncompleteRuleDataAsDraft,jt as __namedExportsOrder,Vt as default};
