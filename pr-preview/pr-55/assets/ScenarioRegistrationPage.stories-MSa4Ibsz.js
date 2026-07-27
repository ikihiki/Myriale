import{j as u}from"./jsx-runtime-BO8uF4Og.js";import{r as gt}from"./index-D4H_InIO.js";import{w as c,e as n,u as t}from"./index-C4S39nCK.js";import{S as Tt,e as Rt,M as d,c as St}from"./MyrialeApp-fX0t_m1z.js";import{u as Et,c as W}from"./SessionPresentation-BIoDDMg8.js";import{w as Ct,c as It}from"./scenarioRegistrationFixtures-D0pA5sl_.js";/* empty css               */import"./ConditionTablePresentation-ybfbi74E.js";import"./Surfaces-xpIMDkG0.js";import"./EditPane-OsFMeo59.js";import"./MyrialeToggle-nBW4_8Wv.js";import"./navigationRecipes-DkSbwkz5.js";import"./index-DzKAYa42.js";import"./AppChrome-CqlUs9ri.js";import"./MyrialeMenu-CLGgTteF.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./ModuleUiHost-CoZk1x5n.js";import"./account-CrOIROJF.js";import"./SessionListPresentation-Cou-SJ3F.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-Cizm6efh.js";const kt={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function _({ruleData:o}){const i=Et(),[e,a]=gt.useState(o?"SCN-DRAFT-0427":"未発行"),y=async l=>{if(!l.title.trim())return{ok:!1,message:"タイトルを入力すると下書き保存できます。",fieldErrors:{title:["シナリオタイトルを入力してください。"]}};const r="SCN-DRAFT-0427";return a(r),i==null||i.dispatch({type:"SCENARIO_SAVED",scenario:{id:r,title:l.title.trim(),status:"draft",genre:l.genre,updatedAt:"2026-07-23",summary:l.summary,tone:"",lore:"",aiFreedom:l.aiFreedom,heroMode:l.heroMode,heroFreeGenerationAllowed:l.heroFreeGenerationAllowed,hero:l.hero,opening:l.opening,illustrationStyle:l.illustrationStyle,illustrationMood:l.illustrationMood,illustrationNegative:l.illustrationNegative,sampleScene:l.sampleScene}}),{ok:!0,message:`「${l.title.trim()}」をDraftとして保存しました。ScenarioIdを発行しました。`,value:{scenarioId:r}}},v=async(l,r)=>r==="summary"?{ok:!0,message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",value:{message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",suggestions:[{id:"summary-1",body:`## 物語の目的

地下に沈んだ王都で、禁書を読むたびに書き換わる星座の謎を追います。

- 水没した書庫を探索する
- 失われる記憶の代償を選ぶ`,rationale:"タイトル、ジャンル、基本情報からMarkdown案を生成しました。"}]}}:r==="illustration-style"?{ok:!0,message:"シナリオに合う画風候補を提示しました。",value:{message:"シナリオに合う画風候補を提示しました。",suggestions:[{id:"style-1",body:"銅版画風、影絵、水彩写本。低彩度で星図の金線だけを強調。",rationale:"既存のムードとNG要素に合わせました。"}]}}:r==="illustration-prompt"?{ok:!0,message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",value:{message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",suggestions:[{id:"prompt-1",body:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",rationale:"プロンプトとNG要素を分離しました。"}],prompt:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",negativePrompt:l.illustrationNegative}}:{ok:!0,message:"サンプルシーンのプレビューを生成しました。",value:{message:"サンプルシーンのプレビューを生成しました。",suggestions:[],previewText:`[Preview / 保存対象外] ${l.sampleScene} / ${l.illustrationStyle} / ${l.illustrationMood}`}},Bt=async(l,r)=>{var z,J;const s=(o==null?void 0:o.objects.find(p=>p.code===r.objectCode))??(o==null?void 0:o.objects[0]),w=(o==null?void 0:o.locations.find(p=>p.code===r.currentLocationCode))??(o==null?void 0:o.locations[0]),g=s?[...s.actions,...s.mixinTypeCodes.flatMap(p=>{var Q;return((Q=o==null?void 0:o.objectTypes.find(xt=>xt.code===p))==null?void 0:Q.actions)??[]})].find(p=>p.code===r.actionCode):void 0,K=((z=r.objects.find(p=>p.objectCode===(s==null?void 0:s.code)))==null?void 0:z.state)??{},Y=r.trigger==="enumerate"?null:{...K,open:!0};return{ok:!0,message:"隔離されたルールエンジンで実行しました。本番データは変更されていません。",value:{snapshot:{schemaVersion:"rule-action-snapshot.v1",snapshotId:"DEBUG-STORY",currentLocation:{id:(w==null?void 0:w.code)??"",code:(w==null?void 0:w.code)??"",name:(w==null?void 0:w.name)??"",description:(w==null?void 0:w.description)??""},objects:s?[{id:s.code,code:s.code,name:s.name,locationId:((J=r.objects.find(p=>p.objectCode===s.code))==null?void 0:J.locationCode)??s.initialLocationCode,isGlobal:s.global,revision:0,state:K}]:[],actions:s&&g?[{objectId:s.code,actionId:g.code,code:g.code,label:g.label,description:g.description,argumentSchema:{},enabled:!0}]:[]},decision:r.trigger==="enumerate"||!s||!g?null:{schemaVersion:"rule-action-decision.v1",objectId:s.code,actionId:g.code,arguments:r.arguments},selectedRuleCode:r.trigger==="enumerate"?null:"open-door-when-closed",appliedEffects:r.trigger==="enumerate"?[]:[{type:"set-state",targetId:s==null?void 0:s.code,path:"state.open",value:!0}],postState:Y&&s&&w?{schemaVersion:"rule-post-state.v1",currentLocation:{id:w.code,code:w.code,name:w.name,description:w.description},objects:[{id:s.code,code:s.code,name:s.name,locationId:s.initialLocationCode,isGlobal:s.global,revision:1,state:Y}],sessionFlags:r.flags,sessionStateRevision:1}:null,facts:r.trigger==="enumerate"?[]:["西扉が開いた。"],events:[],hints:r.playerInput?["入力から「扉を開ける」が選択されました。"]:[],forbiddenFacts:[]}}};return u.jsx(Tt,{account:kt,scenarioId:e,initialValues:o?{...Rt,title:"星喰いの地下図書館",ruleData:structuredClone(o)}:void 0,saving:!1,aiWorking:!1,actions:{saveDraft:y,assist:v,debug:Bt},onLogout:()=>{}})}function $(){return u.jsx(_,{})}function vt(){return u.jsx(_,{ruleData:It})}function dt(){return u.jsx(_,{ruleData:Ct})}$.__docgenInfo={description:"",methods:[],displayName:"MockScenarioRegistrationContainer"};vt.__docgenInfo={description:"",methods:[],displayName:"MockScenarioRegistrationWithRuleDataContainer"};dt.__docgenInfo={description:"",methods:[],displayName:"MockWestDoorAuthoringContainer"};const Qt={title:"ユーザーストーリー/Scenario registration",component:d,render:()=>u.jsx(d,{initialUrl:"/scenarios/new",initialDb:W("registrationDraft"),scenarioRegistrationContainer:$}),parameters:{notes:"docs/user-stories/scenario-registration.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}};function bt({initialUrl:o}){const i=gt.useMemo(()=>{const e=St();return e.logout(),e},[]);return u.jsx(d,{initialUrl:o,initialDb:W("registrationDraft"),accountApi:i,scenarioRegistrationContainer:$})}const m=async(o,i)=>{await t.click(await o.findByRole("button",{name:`${i}へ`}))},B={name:"認証: ログイン後にシナリオ作成へ戻る",render:()=>u.jsx(bt,{initialUrl:"/scenarios/new"}),play:async({canvasElement:o,step:i})=>{const e=c(o);await i("未ログインではログイン画面へ移動し、元のURLを保持する",async()=>{await n(await e.findByRole("main",{name:"ログイン"})).toBeVisible(),await n(e.getByTestId("app-url")).toHaveTextContent("/account/login"),await n(e.getByTestId("app-url")).toHaveTextContent("redirect=%2Fscenarios%2Fnew")}),await i("ログインすると元のシナリオ作成画面へ戻る",async()=>{await t.clear(e.getByLabelText("メールアドレス")),await t.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await t.type(e.getByTestId("login-password"),"a"),await t.click(e.getByRole("button",{name:"ログインする"})),await n(await e.findByRole("main",{name:"シナリオ登録ウィザード"})).toBeVisible(),await n(e.getByTestId("app-url")).toHaveTextContent("/scenarios/new")})}},x={name:"認証: 戻り先がなければホームへ進む",render:()=>u.jsx(bt,{initialUrl:"/account/login"}),play:async({canvasElement:o,step:i})=>{const e=c(o);await i("戻り先なしでログインする",async()=>{await n(await e.findByRole("main",{name:"ログイン"})).toBeVisible(),await t.clear(e.getByLabelText("メールアドレス")),await t.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await t.type(e.getByTestId("login-password"),"a"),await t.click(e.getByRole("button",{name:"ログインする"}))}),await i("デフォルトのホーム画面へ移動する",async()=>{await n(await e.findByRole("main",{name:"Myrialeトップページ"})).toBeVisible(),await n(e.getByTestId("app-url")).toHaveTextContent("/")})}},T={name:"US-01: 新しいシナリオを作成したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await i("タイトル未入力では、下書き保存に必要な項目を説明する",async()=>{await t.click(e.getByRole("button",{name:"下書き保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("タイトルを入力すると下書き保存できます。")}),await i("タイトルだけ入力してDraft保存し、ScenarioIdを発行する",async()=>{await t.type(e.getByLabelText("シナリオタイトル"),"星喰いの地下図書館"),await t.click(e.getByRole("button",{name:"下書き保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました"),await n(e.getByText("SCN-DRAFT-0427")).toBeVisible()})}},R={name:"US-02: シナリオのジャンルをタグで指定したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await i("タイトル直下へ複数のジャンルタグを追加し、表紙サマリーへ反映する",async()=>{const a=e.getByLabelText("ジャンルタグを追加");await t.type(a,"ポストアポカリプス{Enter}"),await t.type(a,"巡礼譚"),await t.click(e.getByRole("button",{name:"タグを追加"})),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("# ポストアポカリプス"),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("# 巡礼譚"),await n(e.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("# ポストアポカリプス # 巡礼譚")}),await i("不要なタグを個別に削除できる",async()=>{await t.click(e.getByRole("button",{name:"巡礼譚タグを削除"})),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).not.toHaveTextContent("# 巡礼譚")})}},S={name:"US-04: AIの裁量レベルを調整したい",play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await m(e,"AI裁量"),await i("AI裁量を高へ変更し、生成時の挙動差を明示する",async()=>{const y=e.getAllByRole("combobox",{name:"AI裁量"})[0];await t.click(y),await t.click(await a.findByRole("option",{name:"高: 展開を広げる"})),await n(y).toHaveTextContent("高: 展開を広げる"),await n(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("高: 展開を広げる")})}},E={name:"US-05: 初期キャラクター条件を設定したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await m(e,"主人公"),await i("主人公の扱いと自由生成時の前提を入力する",async()=>{await n(e.getByRole("combobox",{name:"主人公の扱い"})).toHaveTextContent("自由生成のみ"),await t.clear(e.getByLabelText("主人公の設定")),await t.type(e.getByLabelText("主人公の設定"),"主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で自由に決められる。"),n(e.getByLabelText("主人公の設定").value).toContain("新人地図師"),await n(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("自由生成")})}},C={name:"US-06: シナリオの開始シーンを定義したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await m(e,"第一場面"),await i("開始シーンを固定し、初回Narrativeの材料にする",async()=>{await t.clear(e.getByLabelText("開始シーン")),await t.type(e.getByLabelText("開始シーン"),"あなたは灰の降る駅で、宛名のない切符を握っている。"),n(e.getByLabelText("開始シーン").value).toContain("灰の降る駅"),await n(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("固定")})}},I={name:"US-11: 挿絵のテイストを指定したい",play:async({canvasElement:o,step:i})=>{const e=c(o);c(o.ownerDocument.body),await m(e,"挿絵"),await i("文章と視覚表現を揃える画風を指定する",async()=>{await t.clear(e.getByLabelText("挿絵の画風")),await t.type(e.getByLabelText("挿絵の画風"),"古い天文図の銅版画、インクの滲み、低彩度"),n(e.getByLabelText("挿絵の画風").value).toContain("銅版画")})}},k={name:"US-12: 挿絵の雰囲気を指定したい",play:async({canvasElement:o,step:i})=>{const e=c(o);c(o.ownerDocument.body),await m(e,"挿絵"),await i("挿絵生成に使う感情的トーンを複数指定する",async()=>{await t.clear(e.getByLabelText("挿絵のムード")),await t.type(e.getByLabelText("挿絵のムード"),"孤独、湿度、薄明、遠い鐘の音"),n(e.getByLabelText("挿絵のムード").value).toContain("薄明")})}},f={name:"US-13: 挿絵の禁止要素を指定したい",play:async({canvasElement:o,step:i})=>{const e=c(o);c(o.ownerDocument.body),await m(e,"挿絵"),await i("年齢制限や世界観を守るNG要素を入力する",async()=>{await t.clear(e.getByLabelText("挿絵の禁止要素")),await t.type(e.getByLabelText("挿絵の禁止要素"),"現代兵器、スマートフォン、過度な流血"),n(e.getByLabelText("挿絵の禁止要素").value).toContain("スマートフォン")})}},H={name:"US-14: 挿絵を事前にプレビューしたい",play:async({canvasElement:o,step:i})=>{const e=c(o);c(o.ownerDocument.body),await m(e,"挿絵"),await i("サンプルシーンを入力し、本番相当の挿絵を保存せず生成する",async()=>{await t.clear(e.getByLabelText("サンプルシーン")),await t.type(e.getByLabelText("サンプルシーン"),"地下書庫の水面に星座が反射している。"),await t.click(e.getByRole("button",{name:"サンプルシーンで生成"})),await n(e.getByTestId("illustration-preview")).toHaveTextContent("保存対象外"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("まだ確定していません")})}},L={name:"US-15: プレビューを見ながら挿絵設定を調整したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await m(e,"挿絵"),await i("設定を変更して再生成し、納得した設定のみ保存対象にする",async()=>{await t.clear(e.getByLabelText("挿絵の画風")),await t.type(e.getByLabelText("挿絵の画風"),"影絵、余白多め、灯火だけ金色"),await t.click(e.getByRole("button",{name:"サンプルシーンで生成"})),n(e.getByLabelText("挿絵の画風").value).toContain("影絵"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("設定はまだ確定していません")})}},A={name:"US-17: 登録内容をAIに相談したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await i("AIに相談しても、提案は自動確定しない",async()=>{await t.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await n(e.getByTestId("ai-suggestion")).toHaveTextContent("基本情報案を3つ提示しました"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},h={name:"US-18: どのAIに聞くかを選択したい",play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await m(e,"挿絵"),await i("用途に合わせて相談先AIを選び、選択したAIで提案を生成する",async()=>{await t.click(e.getByRole("combobox",{name:"相談先AI"})),await t.click(await a.findByRole("option",{name:"挿絵AI"})),await t.click(e.getByRole("button",{name:"画風を相談"})),await n(e.getByRole("combobox",{name:"相談先AI"})).toHaveTextContent("挿絵AI"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵AIに挿絵テイストを相談しました")})}},U={name:"US-19: シナリオの基本情報をAIに補完してもらいたい",play:async({canvasElement:o,step:i})=>{const e=c(o);await i("基本情報候補を見て、採用してからMarkdown本文に入れる",async()=>{await t.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await t.click(e.getByRole("button",{name:"採用して編集"})),n(e.getByLabelText("基本情報").value).toContain("## 物語の目的"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("採用しました"),await t.click(e.getByRole("button",{name:"プレビュー"})),await n(e.getByRole("article",{name:"基本情報のMarkdownプレビュー"})).toHaveTextContent("水没した書庫を探索する")})}},D={name:"US-21: 挿絵テイストをAIに相談したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await m(e,"挿絵"),await i("シナリオに合う画風候補をAIに提示してもらう",async()=>{await t.click(e.getByRole("button",{name:"画風を相談"})),await n(e.getByTestId("ai-suggestion")).toHaveTextContent("画風候補"),await n(e.getByTestId("ai-suggestion")).toHaveTextContent("銅版画風")})}},j={name:"US-22: 挿絵プロンプトをAIに生成させたい",play:async({canvasElement:o,step:i})=>{const e=c(o);await m(e,"挿絵"),await i("画像生成用プロンプトとネガティブを分離して出力する",async()=>{await t.click(e.getByRole("button",{name:"プロンプトを生成"})),await n(e.getByTestId("ai-suggestion")).toHaveTextContent("ネガティブプロンプト"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵プロンプトを相談しました")})}},b=()=>u.jsx(d,{initialUrl:"/scenarios/new",initialDb:W("registrationDraft"),scenarioRegistrationContainer:vt}),O={name:"US-23: Object Typeの状態とアクションを定義したい",play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await m(e,"世界データ"),await i("新しい種類へstable code、状態、公開範囲を登録する",async()=>{await t.click(e.getByRole("button",{name:"種類を追加"})),await t.clear(a.getByLabelText("種類のstable code")),await t.type(a.getByLabelText("種類のstable code"),"sealed-door"),await t.clear(a.getByLabelText("種類の表示名")),await t.type(a.getByLabelText("種類の表示名"),"隔壁扉"),await t.click(a.getByRole("button",{name:"状態を追加"})),await t.clear(a.getByLabelText("状態1のstable code")),await t.type(a.getByLabelText("状態1のstable code"),"open"),await n(a.getByRole("combobox",{name:"公開"})).toHaveTextContent("public"),await t.click(a.getByRole("button",{name:"状態の編集を完了"})),await n(a.getByRole("button",{name:"新しい状態を編集"})).toBeVisible()}),await i("AIへ列挙するアクションinterfaceを登録する",async()=>{await t.click(a.getByRole("button",{name:"アクションを追加"})),await t.clear(a.getByLabelText("アクション1のstable code")),await t.type(a.getByLabelText("アクション1のstable code"),"open"),await t.clear(a.getByLabelText("アクション1の表示名")),await t.type(a.getByLabelText("アクション1の表示名"),"扉を開ける"),await n(a.getByRole("combobox",{name:"visibility"})).toHaveTextContent("AI choice")})}},F={name:"US-24: Locationを作成してObjectを初期配置したい",render:b,play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await m(e,"世界データ"),await i("場所を追加してstable codeを維持する",async()=>{await t.click(e.getByRole("button",{name:"場所を追加"})),await t.clear(a.getByLabelText("場所のstable code")),await t.type(a.getByLabelText("場所のstable code"),"sealed-vault"),await t.clear(a.getByLabelText("場所の表示名")),await t.type(a.getByLabelText("場所の表示名"),"封印書庫"),await t.click(a.getByRole("button",{name:"編集を完了"})),await n(e.getByRole("button",{name:"封印書庫を編集"})).toBeVisible()}),await i("Objectの状態を1つの表で確認し、受け継いだ状態は初期値だけ変更する",async()=>{await t.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await n(a.getByRole("region",{name:"ordered Type mixins"})).toHaveTextContent("書庫の扉"),await n(a.getByRole("combobox",{name:"初期配置"})).toHaveTextContent("水没した閲覧室");const y=a.getByRole("table",{name:"Object states"});await n(y).toHaveTextContent("開いている"),await n(y).toHaveTextContent("封印名"),await n(y).not.toHaveTextContent("mixin由来"),await t.click(a.getByRole("button",{name:"openの状態を確認"})),await n(a.queryByLabelText("Object state code")).not.toBeInTheDocument(),await t.type(a.getByLabelText("openの初期値"),"true"),await n(a.getByRole("button",{name:"継承値へ戻す"})).toBeEnabled()})}},M={name:"US-25: 状態とアクションに決定的な結果を設定したい",render:b,play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await m(e,"世界データ"),await i("Object paneの統合rule tableで既存adjustのeffective結果を開く",async()=>{await t.click(e.getByRole("button",{name:"北書庫の扉を編集"}));const y=a.getByRole("table",{name:"Object rules"});await n(y).toHaveTextContent("archive-door:generic-open"),await n(y).not.toHaveTextContent("mixin由来"),await t.click(a.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"}))}),await i("継承condition/priorityと調整済み結果をread-onlyで確認する",async()=>{await n(a.getByText(/override \/ delete \/ adjustを開始することはできません/)).toBeVisible(),await n(a.getAllByText("100")[0]).toBeVisible(),await n(a.getByText("set-state → emit-fact")).toBeVisible(),await n(a.queryByLabelText("実行ルールの優先度")).not.toBeInTheDocument()}),await i("世界データ末尾の公開準備チェックが決定性を確認する",async()=>{await n(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です")})}},V={name:"US-26: 参照中の種類と場所を安全に削除したい",render:b,play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await m(e,"世界データ"),await i("Objectが参照中の種類は削除を拒否する",async()=>{await t.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await t.click(a.getByRole("button",{name:"この種類を削除"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("先に種類を変更するかオブジェクトを削除"),await t.click(a.getByRole("button",{name:"編集ペインを閉じる"}))}),await i("同じページでObjectが配置中のLocationも削除を拒否する",async()=>{await t.click(e.getByRole("button",{name:"水没した閲覧室を編集"})),await t.click(a.getByRole("button",{name:"この場所を削除"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("先に配置先を変更するかオブジェクトを削除")})}},N={name:"US-27: 既存mutationを保持してDraft保存したい",render:b,play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await m(e,"世界データ"),await i("既存adjust operationはeffective結果だけをread-onlyで表示する",async()=>{await t.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await t.click(a.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"})),await n(a.queryByLabelText("実行ルールの優先度")).not.toBeInTheDocument(),await n(a.getByText(/既存の変更内容は保存時もそのまま保持されます/)).toBeVisible(),await t.click(a.getByRole("button",{name:"閉じる"})),await t.click(a.getByRole("button",{name:"編集を完了"}))}),await i("既存mutationを変更せず下書き保存できる",async()=>{await t.click(e.getByRole("button",{name:"下書き保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました")})}},P={name:"US-SR12: 任意状態からルールエンジンを動作確認する",render:b,play:async({canvasElement:o,step:i})=>{const e=c(o);await m(e,"動作確認"),await i("全状態を上書きして公開状態と利用可能アクションを確認する",async()=>{const a=e.getAllByLabelText(/のstate$/)[0];await t.clear(a),await t.click(a),await t.paste('{"open":false}'),await t.click(e.getByRole("button",{name:"公開状態とアクションを確認"})),await n(e.getByRole("complementary",{name:"デバッグ実行結果"})).toHaveTextContent("扉を開ける")}),await i("アクションを直接発動してselected ruleとpost-stateを確認する",async()=>{await t.click(e.getByRole("button",{name:"アクションを直接発動"})),await n(e.getByText(/open-door-when-closed/)).toBeVisible(),await n(e.getByTestId("debug-post-state")).toHaveTextContent('"open": true')}),await i("ユーザー入力から選ばれるアクションと物語材料を確認する",async()=>{await t.type(e.getByLabelText("デバッグ用ユーザー入力"),"扉をゆっくり開ける"),await t.click(e.getByRole("button",{name:"入力から起きることを確認"})),await n(e.getByRole("complementary",{name:"デバッグ実行結果"})).toHaveTextContent("入力から「扉を開ける」が選択されました。"),await n(e.getByTestId("debug-notice")).toHaveTextContent("本番データは変更されていません")})}},G={name:"西の扉seed: 統合テーブルで契約と結果を編集・保存する",render:()=>u.jsx(d,{initialUrl:"/scenarios/new",initialDb:W("registrationDraft"),scenarioRegistrationContainer:dt}),play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await m(e,"世界データ"),await t.click(e.getByRole("button",{name:"西の扉を編集"})),await i("ordered mixinを維持しながら状態・アクション・ruleを各1つの表で表示する",async()=>{const y=a.getByRole("region",{name:"ordered Type mixins"});await n(y).toHaveTextContent("開閉可能"),await n(y).toHaveTextContent("出口の扉"),await n(a.getByRole("table",{name:"Object states"})).toHaveTextContent("開いている"),await n(a.getByRole("table",{name:"Object states"})).toHaveTextContent("方向"),await n(a.getByRole("table",{name:"Object actions"})).toHaveTextContent("出口を確認する"),await n(a.getByRole("table",{name:"Object rules"})).toHaveTextContent("exit-door:generic-open-and-exit"),await n(a.getByRole("table",{name:"Object rules"})).toHaveTextContent("local:west-inspect-exit")}),await i("受け継いだ状態は初期値だけ、Objectのアクションとadd ruleは編集できる",async()=>{await t.click(a.getByRole("button",{name:"openの状態を確認"})),await t.type(a.getByLabelText("openの初期値"),"true"),await t.click(a.getByRole("button",{name:"閉じる"})),await t.click(a.getByRole("button",{name:"inspect-exitのアクションを確認"})),await t.clear(a.getByLabelText("Object action label")),await t.type(a.getByLabelText("Object action label"),"出口を詳しく確認する"),await t.click(a.getByRole("button",{name:"閉じる"})),await t.click(a.getByRole("button",{name:"local:west-inspect-exitの実行ルールを確認"}));const y=a.getByRole("table",{name:"実行条件 table"});await n(y).toHaveTextContent("状態：direction ＝"),await t.click(c(y).getByRole("button",{name:"ルートの実行条件を編集"}));const v=a.getByRole("dialog",{name:"実行条件を編集"});await n(v).toHaveAttribute("data-layer","2"),await t.click(c(v).getByRole("combobox",{name:"実行条件の条件種別"})),await t.click(await a.findByRole("option",{name:"すべて成立（AND）"})),await t.click(c(v).getByRole("button",{name:"子条件を追加"})),await t.click(c(v).getByRole("button",{name:"実行条件の編集を完了"})),await n(y).toHaveTextContent("すべて成立（AND）"),await n(y).toHaveTextContent("AND 2"),await t.clear(a.getByLabelText("実行ルールの優先度")),await t.type(a.getByLabelText("実行ルールの優先度"),"95"),await t.click(a.getByRole("button",{name:"閉じる"}))}),await i("既存overrideはread-onlyのままeffective 8 effectを保持する",async()=>{await t.click(a.getByRole("button",{name:"exit-door:generic-open-and-exitの実行ルールを確認"})),await n(a.getByText("set-state → move-session → emit-fact → emit-fact → emit-event → add-narrative-hint → forbid-narrative-fact → forbid-narrative-fact")).toBeVisible(),await n(a.queryByLabelText("実行ルールの優先度")).not.toBeInTheDocument(),await t.click(a.getByRole("button",{name:"閉じる"}))}),await i("編集内容と既存mutationを下書き保存する",async()=>{await t.click(a.getByRole("button",{name:"編集を完了"})),await n(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await t.click(e.getByRole("button",{name:"下書き保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました")})}};var X,Z,q;B.parameters={...B.parameters,docs:{...(X=B.parameters)==null?void 0:X.docs,source:{originalSource:`{
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
}`,...(q=(Z=B.parameters)==null?void 0:Z.docs)==null?void 0:q.source}}};var ee,te,ae;x.parameters={...x.parameters,docs:{...(ee=x.parameters)==null?void 0:ee.docs,source:{originalSource:`{
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
}`,...(ae=(te=x.parameters)==null?void 0:te.docs)==null?void 0:ae.source}}};var ne,oe,ie;T.parameters={...T.parameters,docs:{...(ne=T.parameters)==null?void 0:ne.docs,source:{originalSource:`{
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
}`,...(ie=(oe=T.parameters)==null?void 0:oe.docs)==null?void 0:ie.source}}};var ce,se,re;R.parameters={...R.parameters,docs:{...(ce=R.parameters)==null?void 0:ce.docs,source:{originalSource:`{
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
}`,...(re=(se=R.parameters)==null?void 0:se.docs)==null?void 0:re.source}}};var le,ye,me;S.parameters={...S.parameters,docs:{...(le=S.parameters)==null?void 0:le.docs,source:{originalSource:`{
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
}`,...(me=(ye=S.parameters)==null?void 0:ye.docs)==null?void 0:me.source}}};var we,pe,ue;E.parameters={...E.parameters,docs:{...(we=E.parameters)==null?void 0:we.docs,source:{originalSource:`{
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
}`,...(ue=(pe=E.parameters)==null?void 0:pe.docs)==null?void 0:ue.source}}};var ge,ve,de;C.parameters={...C.parameters,docs:{...(ge=C.parameters)==null?void 0:ge.docs,source:{originalSource:`{
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
}`,...(de=(ve=C.parameters)==null?void 0:ve.docs)==null?void 0:de.source}}};var be,Be,xe;I.parameters={...I.parameters,docs:{...(be=I.parameters)==null?void 0:be.docs,source:{originalSource:`{
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
}`,...(xe=(Be=I.parameters)==null?void 0:Be.docs)==null?void 0:xe.source}}};var Te,Re,Se;k.parameters={...k.parameters,docs:{...(Te=k.parameters)==null?void 0:Te.docs,source:{originalSource:`{
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
}`,...(Se=(Re=k.parameters)==null?void 0:Re.docs)==null?void 0:Se.source}}};var Ee,Ce,Ie;f.parameters={...f.parameters,docs:{...(Ee=f.parameters)==null?void 0:Ee.docs,source:{originalSource:`{
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
}`,...(Ie=(Ce=f.parameters)==null?void 0:Ce.docs)==null?void 0:Ie.source}}};var ke,fe,He;H.parameters={...H.parameters,docs:{...(ke=H.parameters)==null?void 0:ke.docs,source:{originalSource:`{
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
}`,...(He=(fe=H.parameters)==null?void 0:fe.docs)==null?void 0:He.source}}};var Le,Ae,he;L.parameters={...L.parameters,docs:{...(Le=L.parameters)==null?void 0:Le.docs,source:{originalSource:`{
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
}`,...(he=(Ae=L.parameters)==null?void 0:Ae.docs)==null?void 0:he.source}}};var Ue,De,je;A.parameters={...A.parameters,docs:{...(Ue=A.parameters)==null?void 0:Ue.docs,source:{originalSource:`{
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
}`,...(je=(De=A.parameters)==null?void 0:De.docs)==null?void 0:je.source}}};var Oe,Fe,Me;h.parameters={...h.parameters,docs:{...(Oe=h.parameters)==null?void 0:Oe.docs,source:{originalSource:`{
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
}`,...(Me=(Fe=h.parameters)==null?void 0:Fe.docs)==null?void 0:Me.source}}};var Ve,Ne,Pe;U.parameters={...U.parameters,docs:{...(Ve=U.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
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
}`,...(Pe=(Ne=U.parameters)==null?void 0:Ne.docs)==null?void 0:Pe.source}}};var Ge,We,_e;D.parameters={...D.parameters,docs:{...(Ge=D.parameters)==null?void 0:Ge.docs,source:{originalSource:`{
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
}`,...(_e=(We=D.parameters)==null?void 0:We.docs)==null?void 0:_e.source}}};var $e,Ke,Ye;j.parameters={...j.parameters,docs:{...($e=j.parameters)==null?void 0:$e.docs,source:{originalSource:`{
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
}`,...(Ye=(Ke=j.parameters)==null?void 0:Ke.docs)==null?void 0:Ye.source}}};var ze,Je,Qe;O.parameters={...O.parameters,docs:{...(ze=O.parameters)==null?void 0:ze.docs,source:{originalSource:`{
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
}`,...(Qe=(Je=O.parameters)==null?void 0:Je.docs)==null?void 0:Qe.source}}};var Xe,Ze,qe;F.parameters={...F.parameters,docs:{...(Xe=F.parameters)==null?void 0:Xe.docs,source:{originalSource:`{
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
}`,...(qe=(Ze=F.parameters)==null?void 0:Ze.docs)==null?void 0:qe.source}}};var et,tt,at;M.parameters={...M.parameters,docs:{...(et=M.parameters)==null?void 0:et.docs,source:{originalSource:`{
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
}`,...(at=(tt=M.parameters)==null?void 0:tt.docs)==null?void 0:at.source}}};var nt,ot,it;V.parameters={...V.parameters,docs:{...(nt=V.parameters)==null?void 0:nt.docs,source:{originalSource:`{
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
}`,...(it=(ot=V.parameters)==null?void 0:ot.docs)==null?void 0:it.source}}};var ct,st,rt;N.parameters={...N.parameters,docs:{...(ct=N.parameters)==null?void 0:ct.docs,source:{originalSource:`{
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
}`,...(rt=(st=N.parameters)==null?void 0:st.docs)==null?void 0:rt.source}}};var lt,yt,mt;P.parameters={...P.parameters,docs:{...(lt=P.parameters)==null?void 0:lt.docs,source:{originalSource:`{
  name: 'US-SR12: 任意状態からルールエンジンを動作確認する',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '動作確認');
    await step('全状態を上書きして公開状態と利用可能アクションを確認する', async () => {
      const state = canvas.getAllByLabelText(/のstate$/)[0];
      await userEvent.clear(state);
      await userEvent.click(state);
      await userEvent.paste('{"open":false}');
      await userEvent.click(canvas.getByRole('button', {
        name: '公開状態とアクションを確認'
      }));
      await expect(canvas.getByRole('complementary', {
        name: 'デバッグ実行結果'
      })).toHaveTextContent('扉を開ける');
    });
    await step('アクションを直接発動してselected ruleとpost-stateを確認する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'アクションを直接発動'
      }));
      await expect(canvas.getByText(/open-door-when-closed/)).toBeVisible();
      await expect(canvas.getByTestId('debug-post-state')).toHaveTextContent('"open": true');
    });
    await step('ユーザー入力から選ばれるアクションと物語材料を確認する', async () => {
      await userEvent.type(canvas.getByLabelText('デバッグ用ユーザー入力'), '扉をゆっくり開ける');
      await userEvent.click(canvas.getByRole('button', {
        name: '入力から起きることを確認'
      }));
      await expect(canvas.getByRole('complementary', {
        name: 'デバッグ実行結果'
      })).toHaveTextContent('入力から「扉を開ける」が選択されました。');
      await expect(canvas.getByTestId('debug-notice')).toHaveTextContent('本番データは変更されていません');
    });
  }
}`,...(mt=(yt=P.parameters)==null?void 0:yt.docs)==null?void 0:mt.source}}};var wt,pt,ut;G.parameters={...G.parameters,docs:{...(wt=G.parameters)==null?void 0:wt.docs,source:{originalSource:`{
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
}`,...(ut=(pt=G.parameters)==null?void 0:pt.docs)==null?void 0:ut.source}}};const Xt=["AuthenticationReturnsToScenarioCreation","AuthenticationDefaultsToHome","US01CreateDraftScenario","US02SpecifyGenreTag","US04TuneAiFreedom","US05SetInitialCharacter","US06DefineOpeningScene","US11SpecifyIllustrationStyle","US12SpecifyIllustrationMood","US13SpecifyNegativeElements","US14PreviewIllustration","US15IterateIllustrationSettings","US17ConsultAiAboutRegistration","US18SelectAiByPurpose","US19AiCompletesSummary","US21ConsultIllustrationTaste","US22GenerateIllustrationPrompt","US23DefineObjectTypeStatesAndActions","US24CreateLocationsAndPlaceObjects","US25AuthorDeterministicActionResults","US26KeepDependenciesSafe","US27SaveIncompleteRuleDataAsDraft","US12DebugRuleEngineFromArbitraryState","AuthorWestDoorSeedWithEightOrderedEffects"];export{x as AuthenticationDefaultsToHome,B as AuthenticationReturnsToScenarioCreation,G as AuthorWestDoorSeedWithEightOrderedEffects,T as US01CreateDraftScenario,R as US02SpecifyGenreTag,S as US04TuneAiFreedom,E as US05SetInitialCharacter,C as US06DefineOpeningScene,I as US11SpecifyIllustrationStyle,P as US12DebugRuleEngineFromArbitraryState,k as US12SpecifyIllustrationMood,f as US13SpecifyNegativeElements,H as US14PreviewIllustration,L as US15IterateIllustrationSettings,A as US17ConsultAiAboutRegistration,h as US18SelectAiByPurpose,U as US19AiCompletesSummary,D as US21ConsultIllustrationTaste,j as US22GenerateIllustrationPrompt,O as US23DefineObjectTypeStatesAndActions,F as US24CreateLocationsAndPlaceObjects,M as US25AuthorDeterministicActionResults,V as US26KeepDependenciesSafe,N as US27SaveIncompleteRuleDataAsDraft,Xt as __namedExportsOrder,Qt as default};
