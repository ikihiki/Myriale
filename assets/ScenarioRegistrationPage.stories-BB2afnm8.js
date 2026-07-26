import{j as y}from"./jsx-runtime-BO8uF4Og.js";import{r as at}from"./index-D4H_InIO.js";import{w as c,e as n,u as t}from"./index-C4S39nCK.js";import{S as ct,e as st,M as p,c as rt}from"./MyrialeApp-DgBbvyqe.js";import{u as lt,c as M}from"./SessionPresentation-BIoDDMg8.js";import{w as yt,c as mt}from"./scenarioRegistrationFixtures-D0pA5sl_.js";/* empty css               */import"./ConditionTablePresentation-ybfbi74E.js";import"./Surfaces-xpIMDkG0.js";import"./EditPane-OsFMeo59.js";import"./MyrialeToggle-nBW4_8Wv.js";import"./navigationRecipes-DkSbwkz5.js";import"./index-DzKAYa42.js";import"./AppChrome-CqlUs9ri.js";import"./MyrialeMenu-CLGgTteF.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./ModuleUiHost-CoZk1x5n.js";import"./account-CrOIROJF.js";import"./SessionListPresentation-Cou-SJ3F.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-Cizm6efh.js";const wt={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function V({ruleData:i}){const o=lt(),[e,a]=at.useState("未発行"),s=async r=>{if(!r.title.trim())return{ok:!1,message:"タイトルを入力すると下書き保存できます。",fieldErrors:{title:["シナリオタイトルを入力してください。"]}};const m="SCN-DRAFT-0427";return a(m),o==null||o.dispatch({type:"SCENARIO_SAVED",scenario:{id:m,title:r.title.trim(),status:"draft",genre:r.genre,updatedAt:"2026-07-23",summary:r.summary,tone:"",lore:"",aiFreedom:r.aiFreedom,heroMode:r.heroMode,heroFreeGenerationAllowed:r.heroFreeGenerationAllowed,hero:r.hero,opening:r.opening,illustrationStyle:r.illustrationStyle,illustrationMood:r.illustrationMood,illustrationNegative:r.illustrationNegative,sampleScene:r.sampleScene}}),{ok:!0,message:`「${r.title.trim()}」をDraftとして保存しました。ScenarioIdを発行しました。`,value:{scenarioId:m}}},w=async(r,m)=>m==="summary"?{ok:!0,message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",value:{message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",suggestions:[{id:"summary-1",body:`## 物語の目的

地下に沈んだ王都で、禁書を読むたびに書き換わる星座の謎を追います。

- 水没した書庫を探索する
- 失われる記憶の代償を選ぶ`,rationale:"タイトル、ジャンル、基本情報からMarkdown案を生成しました。"}]}}:m==="illustration-style"?{ok:!0,message:"シナリオに合う画風候補を提示しました。",value:{message:"シナリオに合う画風候補を提示しました。",suggestions:[{id:"style-1",body:"銅版画風、影絵、水彩写本。低彩度で星図の金線だけを強調。",rationale:"既存のムードとNG要素に合わせました。"}]}}:m==="illustration-prompt"?{ok:!0,message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",value:{message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",suggestions:[{id:"prompt-1",body:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",rationale:"プロンプトとNG要素を分離しました。"}],prompt:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",negativePrompt:r.illustrationNegative}}:{ok:!0,message:"サンプルシーンのプレビューを生成しました。",value:{message:"サンプルシーンのプレビューを生成しました。",suggestions:[],previewText:`[Preview / 保存対象外] ${r.sampleScene} / ${r.illustrationStyle} / ${r.illustrationMood}`}};return y.jsx(ct,{account:wt,scenarioId:e,initialValues:i?{...st,title:"星喰いの地下図書館",ruleData:structuredClone(i)}:void 0,saving:!1,aiWorking:!1,actions:{saveDraft:s,assist:w},onLogout:()=>{}})}function N(){return y.jsx(V,{})}function nt(){return y.jsx(V,{ruleData:mt})}function ot(){return y.jsx(V,{ruleData:yt})}N.__docgenInfo={description:"",methods:[],displayName:"MockScenarioRegistrationContainer"};nt.__docgenInfo={description:"",methods:[],displayName:"MockScenarioRegistrationWithRuleDataContainer"};ot.__docgenInfo={description:"",methods:[],displayName:"MockWestDoorAuthoringContainer"};const jt={title:"ユーザーストーリー/Scenario registration",component:p,render:()=>y.jsx(p,{initialUrl:"/scenarios/new",initialDb:M("registrationDraft"),scenarioRegistrationContainer:N}),parameters:{notes:"docs/user-stories/scenario-registration.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}};function it({initialUrl:i}){const o=at.useMemo(()=>{const e=rt();return e.logout(),e},[]);return y.jsx(p,{initialUrl:i,initialDb:M("registrationDraft"),accountApi:o,scenarioRegistrationContainer:N})}const l=async(i,o)=>{await t.click(await i.findByRole("button",{name:`${o}へ`}))},u={name:"認証: ログイン後にシナリオ作成へ戻る",render:()=>y.jsx(it,{initialUrl:"/scenarios/new"}),play:async({canvasElement:i,step:o})=>{const e=c(i);await o("未ログインではログイン画面へ移動し、元のURLを保持する",async()=>{await n(await e.findByRole("main",{name:"ログイン"})).toBeVisible(),await n(e.getByTestId("app-url")).toHaveTextContent("/account/login"),await n(e.getByTestId("app-url")).toHaveTextContent("redirect=%2Fscenarios%2Fnew")}),await o("ログインすると元のシナリオ作成画面へ戻る",async()=>{await t.clear(e.getByLabelText("メールアドレス")),await t.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await t.type(e.getByTestId("login-password"),"a"),await t.click(e.getByRole("button",{name:"ログインする"})),await n(await e.findByRole("main",{name:"シナリオ登録ウィザード"})).toBeVisible(),await n(e.getByTestId("app-url")).toHaveTextContent("/scenarios/new")})}},g={name:"認証: 戻り先がなければホームへ進む",render:()=>y.jsx(it,{initialUrl:"/account/login"}),play:async({canvasElement:i,step:o})=>{const e=c(i);await o("戻り先なしでログインする",async()=>{await n(await e.findByRole("main",{name:"ログイン"})).toBeVisible(),await t.clear(e.getByLabelText("メールアドレス")),await t.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await t.type(e.getByTestId("login-password"),"a"),await t.click(e.getByRole("button",{name:"ログインする"}))}),await o("デフォルトのホーム画面へ移動する",async()=>{await n(await e.findByRole("main",{name:"Myrialeトップページ"})).toBeVisible(),await n(e.getByTestId("app-url")).toHaveTextContent("/")})}},v={name:"US-01: 新しいシナリオを作成したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await o("タイトル未入力では、下書き保存に必要な項目を説明する",async()=>{await t.click(e.getByRole("button",{name:"下書き保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("タイトルを入力すると下書き保存できます。")}),await o("タイトルだけ入力してDraft保存し、ScenarioIdを発行する",async()=>{await t.type(e.getByLabelText("シナリオタイトル"),"星喰いの地下図書館"),await t.click(e.getByRole("button",{name:"下書き保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました"),await n(e.getByText("SCN-DRAFT-0427")).toBeVisible()})}},b={name:"US-02: シナリオのジャンルをタグで指定したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await o("タイトル直下へ複数のジャンルタグを追加し、表紙サマリーへ反映する",async()=>{const a=e.getByLabelText("ジャンルタグを追加");await t.type(a,"ポストアポカリプス{Enter}"),await t.type(a,"巡礼譚"),await t.click(e.getByRole("button",{name:"タグを追加"})),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("# ポストアポカリプス"),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("# 巡礼譚"),await n(e.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("# ポストアポカリプス # 巡礼譚")}),await o("不要なタグを個別に削除できる",async()=>{await t.click(e.getByRole("button",{name:"巡礼譚タグを削除"})),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).not.toHaveTextContent("# 巡礼譚")})}},d={name:"US-04: AIの裁量レベルを調整したい",play:async({canvasElement:i,step:o})=>{const e=c(i),a=c(i.ownerDocument.body);await l(e,"AI裁量"),await o("AI裁量を高へ変更し、生成時の挙動差を明示する",async()=>{const s=e.getAllByRole("combobox",{name:"AI裁量"})[0];await t.click(s),await t.click(await a.findByRole("option",{name:"高: 展開を広げる"})),await n(s).toHaveTextContent("高: 展開を広げる"),await n(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("高: 展開を広げる")})}},x={name:"US-05: 初期キャラクター条件を設定したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await l(e,"主人公"),await o("主人公の扱いと自由生成時の前提を入力する",async()=>{await n(e.getByRole("combobox",{name:"主人公の扱い"})).toHaveTextContent("自由生成のみ"),await t.clear(e.getByLabelText("主人公の設定")),await t.type(e.getByLabelText("主人公の設定"),"主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で自由に決められる。"),n(e.getByLabelText("主人公の設定").value).toContain("新人地図師"),await n(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("自由生成")})}},B={name:"US-06: シナリオの開始シーンを定義したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await l(e,"第一場面"),await o("開始シーンを固定し、初回Narrativeの材料にする",async()=>{await t.clear(e.getByLabelText("開始シーン")),await t.type(e.getByLabelText("開始シーン"),"あなたは灰の降る駅で、宛名のない切符を握っている。"),n(e.getByLabelText("開始シーン").value).toContain("灰の降る駅"),await n(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("固定")})}},T={name:"US-11: 挿絵のテイストを指定したい",play:async({canvasElement:i,step:o})=>{const e=c(i);c(i.ownerDocument.body),await l(e,"挿絵"),await o("文章と視覚表現を揃える画風を指定する",async()=>{await t.clear(e.getByLabelText("挿絵の画風")),await t.type(e.getByLabelText("挿絵の画風"),"古い天文図の銅版画、インクの滲み、低彩度"),n(e.getByLabelText("挿絵の画風").value).toContain("銅版画")})}},R={name:"US-12: 挿絵の雰囲気を指定したい",play:async({canvasElement:i,step:o})=>{const e=c(i);c(i.ownerDocument.body),await l(e,"挿絵"),await o("挿絵生成に使う感情的トーンを複数指定する",async()=>{await t.clear(e.getByLabelText("挿絵のムード")),await t.type(e.getByLabelText("挿絵のムード"),"孤独、湿度、薄明、遠い鐘の音"),n(e.getByLabelText("挿絵のムード").value).toContain("薄明")})}},S={name:"US-13: 挿絵の禁止要素を指定したい",play:async({canvasElement:i,step:o})=>{const e=c(i);c(i.ownerDocument.body),await l(e,"挿絵"),await o("年齢制限や世界観を守るNG要素を入力する",async()=>{await t.clear(e.getByLabelText("挿絵の禁止要素")),await t.type(e.getByLabelText("挿絵の禁止要素"),"現代兵器、スマートフォン、過度な流血"),n(e.getByLabelText("挿絵の禁止要素").value).toContain("スマートフォン")})}},E={name:"US-14: 挿絵を事前にプレビューしたい",play:async({canvasElement:i,step:o})=>{const e=c(i);c(i.ownerDocument.body),await l(e,"挿絵"),await o("サンプルシーンを入力し、本番相当の挿絵を保存せず生成する",async()=>{await t.clear(e.getByLabelText("サンプルシーン")),await t.type(e.getByLabelText("サンプルシーン"),"地下書庫の水面に星座が反射している。"),await t.click(e.getByRole("button",{name:"サンプルシーンで生成"})),await n(e.getByTestId("illustration-preview")).toHaveTextContent("保存対象外"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("まだ確定していません")})}},C={name:"US-15: プレビューを見ながら挿絵設定を調整したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await l(e,"挿絵"),await o("設定を変更して再生成し、納得した設定のみ保存対象にする",async()=>{await t.clear(e.getByLabelText("挿絵の画風")),await t.type(e.getByLabelText("挿絵の画風"),"影絵、余白多め、灯火だけ金色"),await t.click(e.getByRole("button",{name:"サンプルシーンで生成"})),n(e.getByLabelText("挿絵の画風").value).toContain("影絵"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("設定はまだ確定していません")})}},I={name:"US-17: 登録内容をAIに相談したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await o("AIに相談しても、提案は自動確定しない",async()=>{await t.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await n(e.getByTestId("ai-suggestion")).toHaveTextContent("基本情報案を3つ提示しました"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},k={name:"US-18: どのAIに聞くかを選択したい",play:async({canvasElement:i,step:o})=>{const e=c(i),a=c(i.ownerDocument.body);await l(e,"挿絵"),await o("用途に合わせて相談先AIを選び、選択したAIで提案を生成する",async()=>{await t.click(e.getByRole("combobox",{name:"相談先AI"})),await t.click(await a.findByRole("option",{name:"挿絵AI"})),await t.click(e.getByRole("button",{name:"画風を相談"})),await n(e.getByRole("combobox",{name:"相談先AI"})).toHaveTextContent("挿絵AI"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵AIに挿絵テイストを相談しました")})}},L={name:"US-19: シナリオの基本情報をAIに補完してもらいたい",play:async({canvasElement:i,step:o})=>{const e=c(i);await o("基本情報候補を見て、採用してからMarkdown本文に入れる",async()=>{await t.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await t.click(e.getByRole("button",{name:"採用して編集"})),n(e.getByLabelText("基本情報").value).toContain("## 物語の目的"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("採用しました"),await t.click(e.getByRole("button",{name:"プレビュー"})),await n(e.getByRole("article",{name:"基本情報のMarkdownプレビュー"})).toHaveTextContent("水没した書庫を探索する")})}},H={name:"US-21: 挿絵テイストをAIに相談したい",play:async({canvasElement:i,step:o})=>{const e=c(i);await l(e,"挿絵"),await o("シナリオに合う画風候補をAIに提示してもらう",async()=>{await t.click(e.getByRole("button",{name:"画風を相談"})),await n(e.getByTestId("ai-suggestion")).toHaveTextContent("画風候補"),await n(e.getByTestId("ai-suggestion")).toHaveTextContent("銅版画風")})}},f={name:"US-22: 挿絵プロンプトをAIに生成させたい",play:async({canvasElement:i,step:o})=>{const e=c(i);await l(e,"挿絵"),await o("画像生成用プロンプトとネガティブを分離して出力する",async()=>{await t.click(e.getByRole("button",{name:"プロンプトを生成"})),await n(e.getByTestId("ai-suggestion")).toHaveTextContent("ネガティブプロンプト"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵プロンプトを相談しました")})}},F=()=>y.jsx(p,{initialUrl:"/scenarios/new",initialDb:M("registrationDraft"),scenarioRegistrationContainer:nt}),A={name:"US-23: Object Typeの状態とアクションを定義したい",play:async({canvasElement:i,step:o})=>{const e=c(i),a=c(i.ownerDocument.body);await l(e,"世界データ"),await o("新しい種類へstable code、状態、公開範囲を登録する",async()=>{await t.click(e.getByRole("button",{name:"種類を追加"})),await t.clear(a.getByLabelText("種類のstable code")),await t.type(a.getByLabelText("種類のstable code"),"sealed-door"),await t.clear(a.getByLabelText("種類の表示名")),await t.type(a.getByLabelText("種類の表示名"),"隔壁扉"),await t.click(a.getByRole("button",{name:"状態を追加"})),await t.clear(a.getByLabelText("状態1のstable code")),await t.type(a.getByLabelText("状態1のstable code"),"open"),await n(a.getByRole("combobox",{name:"公開"})).toHaveTextContent("public"),await t.click(a.getByRole("button",{name:"状態の編集を完了"})),await n(a.getByRole("button",{name:"新しい状態を編集"})).toBeVisible()}),await o("AIへ列挙するアクションinterfaceを登録する",async()=>{await t.click(a.getByRole("button",{name:"アクションを追加"})),await t.clear(a.getByLabelText("アクション1のstable code")),await t.type(a.getByLabelText("アクション1のstable code"),"open"),await t.clear(a.getByLabelText("アクション1の表示名")),await t.type(a.getByLabelText("アクション1の表示名"),"扉を開ける"),await n(a.getByRole("combobox",{name:"visibility"})).toHaveTextContent("AI choice")})}},D={name:"US-24: Locationを作成してObjectを初期配置したい",render:F,play:async({canvasElement:i,step:o})=>{const e=c(i),a=c(i.ownerDocument.body);await l(e,"世界データ"),await o("場所を追加してstable codeを維持する",async()=>{await t.click(e.getByRole("button",{name:"場所を追加"})),await t.clear(a.getByLabelText("場所のstable code")),await t.type(a.getByLabelText("場所のstable code"),"sealed-vault"),await t.clear(a.getByLabelText("場所の表示名")),await t.type(a.getByLabelText("場所の表示名"),"封印書庫"),await t.click(a.getByRole("button",{name:"編集を完了"})),await n(e.getByRole("button",{name:"封印書庫を編集"})).toBeVisible()}),await o("Objectの状態を1つの表で確認し、受け継いだ状態は初期値だけ変更する",async()=>{await t.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await n(a.getByRole("region",{name:"ordered Type mixins"})).toHaveTextContent("書庫の扉"),await n(a.getByRole("combobox",{name:"初期配置"})).toHaveTextContent("水没した閲覧室");const s=a.getByRole("table",{name:"Object states"});await n(s).toHaveTextContent("開いている"),await n(s).toHaveTextContent("封印名"),await n(s).not.toHaveTextContent("mixin由来"),await t.click(a.getByRole("button",{name:"openの状態を確認"})),await n(a.queryByLabelText("Object state code")).not.toBeInTheDocument(),await t.type(a.getByLabelText("openの初期値"),"true"),await n(a.getByRole("button",{name:"継承値へ戻す"})).toBeEnabled()})}},h={name:"US-25: 状態とアクションに決定的な結果を設定したい",render:F,play:async({canvasElement:i,step:o})=>{const e=c(i),a=c(i.ownerDocument.body);await l(e,"世界データ"),await o("Object paneの統合rule tableで既存adjustのeffective結果を開く",async()=>{await t.click(e.getByRole("button",{name:"北書庫の扉を編集"}));const s=a.getByRole("table",{name:"Object rules"});await n(s).toHaveTextContent("archive-door:generic-open"),await n(s).not.toHaveTextContent("mixin由来"),await t.click(a.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"}))}),await o("継承condition/priorityと調整済み結果をread-onlyで確認する",async()=>{await n(a.getByText(/override \/ delete \/ adjustを開始することはできません/)).toBeVisible(),await n(a.getAllByText("100")[0]).toBeVisible(),await n(a.getByText("set-state → emit-fact")).toBeVisible(),await n(a.queryByLabelText("実行ルールの優先度")).not.toBeInTheDocument()}),await o("世界データ末尾の公開準備チェックが決定性を確認する",async()=>{await n(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です")})}},U={name:"US-26: 参照中の種類と場所を安全に削除したい",render:F,play:async({canvasElement:i,step:o})=>{const e=c(i),a=c(i.ownerDocument.body);await l(e,"世界データ"),await o("Objectが参照中の種類は削除を拒否する",async()=>{await t.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await t.click(a.getByRole("button",{name:"この種類を削除"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("先に種類を変更するかオブジェクトを削除"),await t.click(a.getByRole("button",{name:"編集ペインを閉じる"}))}),await o("同じページでObjectが配置中のLocationも削除を拒否する",async()=>{await t.click(e.getByRole("button",{name:"水没した閲覧室を編集"})),await t.click(a.getByRole("button",{name:"この場所を削除"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("先に配置先を変更するかオブジェクトを削除")})}},j={name:"US-27: 既存mutationを保持してDraft保存したい",render:F,play:async({canvasElement:i,step:o})=>{const e=c(i),a=c(i.ownerDocument.body);await l(e,"世界データ"),await o("既存adjust operationはeffective結果だけをread-onlyで表示する",async()=>{await t.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await t.click(a.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"})),await n(a.queryByLabelText("実行ルールの優先度")).not.toBeInTheDocument(),await n(a.getByText(/既存の変更内容は保存時もそのまま保持されます/)).toBeVisible(),await t.click(a.getByRole("button",{name:"閉じる"})),await t.click(a.getByRole("button",{name:"編集を完了"}))}),await o("既存mutationを変更せず下書き保存できる",async()=>{await t.click(e.getByRole("button",{name:"下書き保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました")})}},O={name:"西の扉seed: 統合テーブルで契約と結果を編集・保存する",render:()=>y.jsx(p,{initialUrl:"/scenarios/new",initialDb:M("registrationDraft"),scenarioRegistrationContainer:ot}),play:async({canvasElement:i,step:o})=>{const e=c(i),a=c(i.ownerDocument.body);await l(e,"世界データ"),await t.click(e.getByRole("button",{name:"西の扉を編集"})),await o("ordered mixinを維持しながら状態・アクション・ruleを各1つの表で表示する",async()=>{const s=a.getByRole("region",{name:"ordered Type mixins"});await n(s).toHaveTextContent("開閉可能"),await n(s).toHaveTextContent("出口の扉"),await n(a.getByRole("table",{name:"Object states"})).toHaveTextContent("開いている"),await n(a.getByRole("table",{name:"Object states"})).toHaveTextContent("方向"),await n(a.getByRole("table",{name:"Object actions"})).toHaveTextContent("出口を確認する"),await n(a.getByRole("table",{name:"Object rules"})).toHaveTextContent("exit-door:generic-open-and-exit"),await n(a.getByRole("table",{name:"Object rules"})).toHaveTextContent("local:west-inspect-exit")}),await o("受け継いだ状態は初期値だけ、Objectのアクションとadd ruleは編集できる",async()=>{await t.click(a.getByRole("button",{name:"openの状態を確認"})),await t.type(a.getByLabelText("openの初期値"),"true"),await t.click(a.getByRole("button",{name:"閉じる"})),await t.click(a.getByRole("button",{name:"inspect-exitのアクションを確認"})),await t.clear(a.getByLabelText("Object action label")),await t.type(a.getByLabelText("Object action label"),"出口を詳しく確認する"),await t.click(a.getByRole("button",{name:"閉じる"})),await t.click(a.getByRole("button",{name:"local:west-inspect-exitの実行ルールを確認"}));const s=a.getByRole("table",{name:"実行条件 table"});await n(s).toHaveTextContent("状態：direction ＝"),await t.click(c(s).getByRole("button",{name:"ルートの実行条件を編集"}));const w=a.getByRole("dialog",{name:"実行条件を編集"});await n(w).toHaveAttribute("data-layer","2"),await t.click(c(w).getByRole("combobox",{name:"実行条件の条件種別"})),await t.click(await a.findByRole("option",{name:"すべて成立（AND）"})),await t.click(c(w).getByRole("button",{name:"子条件を追加"})),await t.click(c(w).getByRole("button",{name:"実行条件の編集を完了"})),await n(s).toHaveTextContent("すべて成立（AND）"),await n(s).toHaveTextContent("AND 2"),await t.clear(a.getByLabelText("実行ルールの優先度")),await t.type(a.getByLabelText("実行ルールの優先度"),"95"),await t.click(a.getByRole("button",{name:"閉じる"}))}),await o("既存overrideはread-onlyのままeffective 8 effectを保持する",async()=>{await t.click(a.getByRole("button",{name:"exit-door:generic-open-and-exitの実行ルールを確認"})),await n(a.getByText("set-state → move-session → emit-fact → emit-fact → emit-event → add-narrative-hint → forbid-narrative-fact → forbid-narrative-fact")).toBeVisible(),await n(a.queryByLabelText("実行ルールの優先度")).not.toBeInTheDocument(),await t.click(a.getByRole("button",{name:"閉じる"}))}),await o("編集内容と既存mutationを下書き保存する",async()=>{await t.click(a.getByRole("button",{name:"編集を完了"})),await n(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await t.click(e.getByRole("button",{name:"下書き保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました")})}};var P,q,G;u.parameters={...u.parameters,docs:{...(P=u.parameters)==null?void 0:P.docs,source:{originalSource:`{
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
}`,...(G=(q=u.parameters)==null?void 0:q.docs)==null?void 0:G.source}}};var W,_,$;g.parameters={...g.parameters,docs:{...(W=g.parameters)==null?void 0:W.docs,source:{originalSource:`{
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
}`,...($=(_=g.parameters)==null?void 0:_.docs)==null?void 0:$.source}}};var K,z,J;v.parameters={...v.parameters,docs:{...(K=v.parameters)==null?void 0:K.docs,source:{originalSource:`{
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
}`,...(J=(z=v.parameters)==null?void 0:z.docs)==null?void 0:J.source}}};var Q,X,Y;b.parameters={...b.parameters,docs:{...(Q=b.parameters)==null?void 0:Q.docs,source:{originalSource:`{
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
}`,...(Y=(X=b.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};var Z,ee,te;d.parameters={...d.parameters,docs:{...(Z=d.parameters)==null?void 0:Z.docs,source:{originalSource:`{
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
}`,...(te=(ee=d.parameters)==null?void 0:ee.docs)==null?void 0:te.source}}};var ae,ne,oe;x.parameters={...x.parameters,docs:{...(ae=x.parameters)==null?void 0:ae.docs,source:{originalSource:`{
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
}`,...(oe=(ne=x.parameters)==null?void 0:ne.docs)==null?void 0:oe.source}}};var ie,ce,se;B.parameters={...B.parameters,docs:{...(ie=B.parameters)==null?void 0:ie.docs,source:{originalSource:`{
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
}`,...(se=(ce=B.parameters)==null?void 0:ce.docs)==null?void 0:se.source}}};var re,le,ye;T.parameters={...T.parameters,docs:{...(re=T.parameters)==null?void 0:re.docs,source:{originalSource:`{
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
}`,...(ve=(ge=S.parameters)==null?void 0:ge.docs)==null?void 0:ve.source}}};var be,de,xe;E.parameters={...E.parameters,docs:{...(be=E.parameters)==null?void 0:be.docs,source:{originalSource:`{
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
}`,...(xe=(de=E.parameters)==null?void 0:de.docs)==null?void 0:xe.source}}};var Be,Te,Re;C.parameters={...C.parameters,docs:{...(Be=C.parameters)==null?void 0:Be.docs,source:{originalSource:`{
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
}`,...(Ce=(Ee=I.parameters)==null?void 0:Ee.docs)==null?void 0:Ce.source}}};var Ie,ke,Le;k.parameters={...k.parameters,docs:{...(Ie=k.parameters)==null?void 0:Ie.docs,source:{originalSource:`{
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
}`,...(Le=(ke=k.parameters)==null?void 0:ke.docs)==null?void 0:Le.source}}};var He,fe,Ae;L.parameters={...L.parameters,docs:{...(He=L.parameters)==null?void 0:He.docs,source:{originalSource:`{
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
}`,...(Ae=(fe=L.parameters)==null?void 0:fe.docs)==null?void 0:Ae.source}}};var De,he,Ue;H.parameters={...H.parameters,docs:{...(De=H.parameters)==null?void 0:De.docs,source:{originalSource:`{
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
}`,...(Ue=(he=H.parameters)==null?void 0:he.docs)==null?void 0:Ue.source}}};var je,Oe,Me;f.parameters={...f.parameters,docs:{...(je=f.parameters)==null?void 0:je.docs,source:{originalSource:`{
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
}`,...(Me=(Oe=f.parameters)==null?void 0:Oe.docs)==null?void 0:Me.source}}};var Fe,Ve,Ne;A.parameters={...A.parameters,docs:{...(Fe=A.parameters)==null?void 0:Fe.docs,source:{originalSource:`{
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
      await userEvent.clear(screen.getByLabelText('状態1のstable code'));
      await userEvent.type(screen.getByLabelText('状態1のstable code'), 'open');
      await expect(screen.getByRole('combobox', {
        name: '公開'
      })).toHaveTextContent('public');
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
      await userEvent.clear(screen.getByLabelText('アクション1のstable code'));
      await userEvent.type(screen.getByLabelText('アクション1のstable code'), 'open');
      await userEvent.clear(screen.getByLabelText('アクション1の表示名'));
      await userEvent.type(screen.getByLabelText('アクション1の表示名'), '扉を開ける');
      await expect(screen.getByRole('combobox', {
        name: 'visibility'
      })).toHaveTextContent('AI choice');
    });
  }
}`,...(Ne=(Ve=A.parameters)==null?void 0:Ve.docs)==null?void 0:Ne.source}}};var Pe,qe,Ge;D.parameters={...D.parameters,docs:{...(Pe=D.parameters)==null?void 0:Pe.docs,source:{originalSource:`{
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
    await step('Objectの状態を1つの表で確認し、受け継いだ状態は初期値だけ変更する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '北書庫の扉を編集'
      }));
      await expect(screen.getByRole('region', {
        name: 'ordered Type mixins'
      })).toHaveTextContent('書庫の扉');
      await expect(screen.getByRole('combobox', {
        name: '初期配置'
      })).toHaveTextContent('水没した閲覧室');
      const states = screen.getByRole('table', {
        name: 'Object states'
      });
      await expect(states).toHaveTextContent('開いている');
      await expect(states).toHaveTextContent('封印名');
      await expect(states).not.toHaveTextContent('mixin由来');
      await userEvent.click(screen.getByRole('button', {
        name: 'openの状態を確認'
      }));
      await expect(screen.queryByLabelText('Object state code')).not.toBeInTheDocument();
      await userEvent.type(screen.getByLabelText('openの初期値'), 'true');
      await expect(screen.getByRole('button', {
        name: '継承値へ戻す'
      })).toBeEnabled();
    });
  }
}`,...(Ge=(qe=D.parameters)==null?void 0:qe.docs)==null?void 0:Ge.source}}};var We,_e,$e;h.parameters={...h.parameters,docs:{...(We=h.parameters)==null?void 0:We.docs,source:{originalSource:`{
  name: 'US-25: 状態とアクションに決定的な結果を設定したい',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '世界データ');
    await step('Object paneの統合rule tableで既存adjustのeffective結果を開く', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '北書庫の扉を編集'
      }));
      const rules = screen.getByRole('table', {
        name: 'Object rules'
      });
      await expect(rules).toHaveTextContent('archive-door:generic-open');
      await expect(rules).not.toHaveTextContent('mixin由来');
      await userEvent.click(screen.getByRole('button', {
        name: 'archive-door:generic-openの実行ルールを確認'
      }));
    });
    await step('継承condition/priorityと調整済み結果をread-onlyで確認する', async () => {
      await expect(screen.getByText(/override \\/ delete \\/ adjustを開始することはできません/)).toBeVisible();
      await expect(screen.getAllByText('100')[0]).toBeVisible();
      await expect(screen.getByText('set-state → emit-fact')).toBeVisible();
      await expect(screen.queryByLabelText('実行ルールの優先度')).not.toBeInTheDocument();
    });
    await step('世界データ末尾の公開準備チェックが決定性を確認する', async () => {
      await expect(canvas.getByTestId('rule-readiness')).toHaveTextContent('決定的です');
    });
  }
}`,...($e=(_e=h.parameters)==null?void 0:_e.docs)==null?void 0:$e.source}}};var Ke,ze,Je;U.parameters={...U.parameters,docs:{...(Ke=U.parameters)==null?void 0:Ke.docs,source:{originalSource:`{
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
}`,...(Je=(ze=U.parameters)==null?void 0:ze.docs)==null?void 0:Je.source}}};var Qe,Xe,Ye;j.parameters={...j.parameters,docs:{...(Qe=j.parameters)==null?void 0:Qe.docs,source:{originalSource:`{
  name: 'US-27: 既存mutationを保持してDraft保存したい',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '世界データ');
    await step('既存adjust operationはeffective結果だけをread-onlyで表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '北書庫の扉を編集'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: 'archive-door:generic-openの実行ルールを確認'
      }));
      await expect(screen.queryByLabelText('実行ルールの優先度')).not.toBeInTheDocument();
      await expect(screen.getByText(/既存の変更内容は保存時もそのまま保持されます/)).toBeVisible();
      await userEvent.click(screen.getByRole('button', {
        name: '閉じる'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: '編集を完了'
      }));
    });
    await step('既存mutationを変更せず下書き保存できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '下書き保存'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('Draftとして保存しました');
    });
  }
}`,...(Ye=(Xe=j.parameters)==null?void 0:Xe.docs)==null?void 0:Ye.source}}};var Ze,et,tt;O.parameters={...O.parameters,docs:{...(Ze=O.parameters)==null?void 0:Ze.docs,source:{originalSource:`{
  name: '西の扉seed: 統合テーブルで契約と結果を編集・保存する',
  render: () => <MyrialeApp initialUrl="/scenarios/new" initialDb={createDemoDb('registrationDraft')} scenarioRegistrationContainer={MockWestDoorAuthoringContainer} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '世界データ');
    await userEvent.click(canvas.getByRole('button', {
      name: '西の扉を編集'
    }));
    await step('ordered mixinを維持しながら状態・アクション・ruleを各1つの表で表示する', async () => {
      const mixins = screen.getByRole('region', {
        name: 'ordered Type mixins'
      });
      await expect(mixins).toHaveTextContent('開閉可能');
      await expect(mixins).toHaveTextContent('出口の扉');
      await expect(screen.getByRole('table', {
        name: 'Object states'
      })).toHaveTextContent('開いている');
      await expect(screen.getByRole('table', {
        name: 'Object states'
      })).toHaveTextContent('方向');
      await expect(screen.getByRole('table', {
        name: 'Object actions'
      })).toHaveTextContent('出口を確認する');
      await expect(screen.getByRole('table', {
        name: 'Object rules'
      })).toHaveTextContent('exit-door:generic-open-and-exit');
      await expect(screen.getByRole('table', {
        name: 'Object rules'
      })).toHaveTextContent('local:west-inspect-exit');
    });
    await step('受け継いだ状態は初期値だけ、Objectのアクションとadd ruleは編集できる', async () => {
      await userEvent.click(screen.getByRole('button', {
        name: 'openの状態を確認'
      }));
      await userEvent.type(screen.getByLabelText('openの初期値'), 'true');
      await userEvent.click(screen.getByRole('button', {
        name: '閉じる'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: 'inspect-exitのアクションを確認'
      }));
      await userEvent.clear(screen.getByLabelText('Object action label'));
      await userEvent.type(screen.getByLabelText('Object action label'), '出口を詳しく確認する');
      await userEvent.click(screen.getByRole('button', {
        name: '閉じる'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: 'local:west-inspect-exitの実行ルールを確認'
      }));
      const conditionTable = screen.getByRole('table', {
        name: '実行条件 table'
      });
      await expect(conditionTable).toHaveTextContent('状態：direction ＝');
      await userEvent.click(within(conditionTable).getByRole('button', {
        name: 'ルートの実行条件を編集'
      }));
      const conditionPane = screen.getByRole('dialog', {
        name: '実行条件を編集'
      });
      await expect(conditionPane).toHaveAttribute('data-layer', '2');
      await userEvent.click(within(conditionPane).getByRole('combobox', {
        name: '実行条件の条件種別'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: 'すべて成立（AND）'
      }));
      await userEvent.click(within(conditionPane).getByRole('button', {
        name: '子条件を追加'
      }));
      await userEvent.click(within(conditionPane).getByRole('button', {
        name: '実行条件の編集を完了'
      }));
      await expect(conditionTable).toHaveTextContent('すべて成立（AND）');
      await expect(conditionTable).toHaveTextContent('AND 2');
      await userEvent.clear(screen.getByLabelText('実行ルールの優先度'));
      await userEvent.type(screen.getByLabelText('実行ルールの優先度'), '95');
      await userEvent.click(screen.getByRole('button', {
        name: '閉じる'
      }));
    });
    await step('既存overrideはread-onlyのままeffective 8 effectを保持する', async () => {
      await userEvent.click(screen.getByRole('button', {
        name: 'exit-door:generic-open-and-exitの実行ルールを確認'
      }));
      await expect(screen.getByText('set-state → move-session → emit-fact → emit-fact → emit-event → add-narrative-hint → forbid-narrative-fact → forbid-narrative-fact')).toBeVisible();
      await expect(screen.queryByLabelText('実行ルールの優先度')).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', {
        name: '閉じる'
      }));
    });
    await step('編集内容と既存mutationを下書き保存する', async () => {
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
}`,...(tt=(et=O.parameters)==null?void 0:et.docs)==null?void 0:tt.source}}};const Ot=["AuthenticationReturnsToScenarioCreation","AuthenticationDefaultsToHome","US01CreateDraftScenario","US02SpecifyGenreTag","US04TuneAiFreedom","US05SetInitialCharacter","US06DefineOpeningScene","US11SpecifyIllustrationStyle","US12SpecifyIllustrationMood","US13SpecifyNegativeElements","US14PreviewIllustration","US15IterateIllustrationSettings","US17ConsultAiAboutRegistration","US18SelectAiByPurpose","US19AiCompletesSummary","US21ConsultIllustrationTaste","US22GenerateIllustrationPrompt","US23DefineObjectTypeStatesAndActions","US24CreateLocationsAndPlaceObjects","US25AuthorDeterministicActionResults","US26KeepDependenciesSafe","US27SaveIncompleteRuleDataAsDraft","AuthorWestDoorSeedWithEightOrderedEffects"];export{g as AuthenticationDefaultsToHome,u as AuthenticationReturnsToScenarioCreation,O as AuthorWestDoorSeedWithEightOrderedEffects,v as US01CreateDraftScenario,b as US02SpecifyGenreTag,d as US04TuneAiFreedom,x as US05SetInitialCharacter,B as US06DefineOpeningScene,T as US11SpecifyIllustrationStyle,R as US12SpecifyIllustrationMood,S as US13SpecifyNegativeElements,E as US14PreviewIllustration,C as US15IterateIllustrationSettings,I as US17ConsultAiAboutRegistration,k as US18SelectAiByPurpose,L as US19AiCompletesSummary,H as US21ConsultIllustrationTaste,f as US22GenerateIllustrationPrompt,A as US23DefineObjectTypeStatesAndActions,D as US24CreateLocationsAndPlaceObjects,h as US25AuthorDeterministicActionResults,U as US26KeepDependenciesSafe,j as US27SaveIncompleteRuleDataAsDraft,Ot as __namedExportsOrder,jt as default};
