import{j as u}from"./jsx-runtime-BO8uF4Og.js";import{r as Et}from"./index-D4H_InIO.js";import{w as c,e as n,u as t}from"./index-C4S39nCK.js";import{c as Lt}from"./AdminAiProvidersPage-DTVL3kaI.js";import{a as ht,e as Ht,M as d}from"./MyrialeApp-CsDupTdJ.js";import{u as At,c as $}from"./SessionPresentation-DGHeCpe_.js";import{w as Ut,c as Dt}from"./scenarioRegistrationFixtures-CK6CETnx.js";/* empty css               */import"./Surfaces-hfywbPiG.js";import"./AppChrome-CaJxHzCb.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-DBs-w9aD.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-d7jVExt_.js";import"./ConditionTablePresentation-JmdLPG0b.js";import"./EditPane-DyZaeiBP.js";import"./scenarioWizardStyles-CPcslTFI.js";import"./NarrativeBody-4Kg13oE8.js";import"./ModuleUiHost-CQPmid6l.js";import"./TurnInspectionPresentation-CerC6ryl.js";import"./account-Bdcpq1bL.js";import"./SessionListPresentation-CV3LYKA6.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-UcBTXClw.js";import"./SessionActivityFeed-B0l1fOng.js";const jt={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"};function K({ruleData:o}){const i=At(),[e,a]=Et.useState(o?"SCN-DRAFT-0427":"未発行"),s=async m=>{if(!m.title.trim())return{ok:!1,message:"タイトルを入力すると下書き保存できます。",fieldErrors:{title:["シナリオタイトルを入力してください。"]}};const y="SCN-DRAFT-0427";return a(y),i==null||i.dispatch({type:"SCENARIO_SAVED",scenario:{id:y,title:m.title.trim(),status:"draft",genre:m.genre,updatedAt:"2026-07-23",summary:m.summary,tone:"",lore:"",aiFreedom:m.aiFreedom,heroMode:m.heroMode,heroFreeGenerationAllowed:m.heroFreeGenerationAllowed,hero:m.hero,opening:m.opening,illustrationStyle:m.illustrationStyle,illustrationMood:m.illustrationMood,illustrationNegative:m.illustrationNegative,sampleScene:m.sampleScene}}),{ok:!0,message:`「${m.title.trim()}」をDraftとして保存しました。ScenarioIdを発行しました。`,value:{scenarioId:y}}},g=async(m,y)=>y==="summary"?{ok:!0,message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",value:{message:"基本情報案を3つ提示しました。採用、編集、破棄を選べます。",suggestions:[{id:"summary-1",body:`## 物語の目的

地下に沈んだ王都で、禁書を読むたびに書き換わる星座の謎を追います。

- 水没した書庫を探索する
- 失われる記憶の代償を選ぶ`,rationale:"タイトル、ジャンル、基本情報からMarkdown案を生成しました。"}]}}:y==="illustration-style"?{ok:!0,message:"シナリオに合う画風候補を提示しました。",value:{message:"シナリオに合う画風候補を提示しました。",suggestions:[{id:"style-1",body:"銅版画風、影絵、水彩写本。低彩度で星図の金線だけを強調。",rationale:"既存のムードとNG要素に合わせました。"}]}}:y==="illustration-prompt"?{ok:!0,message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",value:{message:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",suggestions:[{id:"prompt-1",body:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",rationale:"プロンプトとNG要素を分離しました。"}],prompt:"submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",negativePrompt:m.illustrationNegative}}:{ok:!0,message:"サンプルシーンのプレビューを生成しました。",value:{message:"サンプルシーンのプレビューを生成しました。",suggestions:[],previewText:`[Preview / 保存対象外] ${m.sampleScene} / ${m.illustrationStyle} / ${m.illustrationMood}`}},q=async(m,y)=>{var Q,X;const r=(o==null?void 0:o.objects.find(p=>p.code===y.objectCode))??(o==null?void 0:o.objects[0]),w=(o==null?void 0:o.locations.find(p=>p.code===y.currentLocationCode))??(o==null?void 0:o.locations[0]),v=r?[...r.actions,...r.mixinTypeCodes.flatMap(p=>{var Z;return((Z=o==null?void 0:o.objectTypes.find(ft=>ft.code===p))==null?void 0:Z.actions)??[]})].find(p=>p.code===y.actionCode):void 0,z=((Q=y.objects.find(p=>p.objectCode===(r==null?void 0:r.code)))==null?void 0:Q.state)??{},J=y.trigger==="enumerate"?null:{...z,open:!0};return{ok:!0,message:"隔離されたルールエンジンで実行しました。本番データは変更されていません。",value:{snapshot:{schemaVersion:"rule-action-snapshot.v1",snapshotId:"DEBUG-STORY",currentLocation:{id:(w==null?void 0:w.code)??"",code:(w==null?void 0:w.code)??"",name:(w==null?void 0:w.name)??"",description:(w==null?void 0:w.description)??""},objects:r?[{id:r.code,code:r.code,name:r.name,locationId:((X=y.objects.find(p=>p.objectCode===r.code))==null?void 0:X.locationCode)??r.initialLocationCode,isGlobal:r.global,revision:0,state:z}]:[],actions:r&&v?[{objectId:r.code,actionId:v.code,code:v.code,label:v.label,description:v.description,argumentSchema:{},enabled:!0}]:[]},decision:y.trigger==="enumerate"||!r||!v?null:{schemaVersion:"rule-action-decision.v1",objectId:r.code,actionId:v.code,arguments:y.arguments},selectedRuleCode:y.trigger==="enumerate"?null:"open-door-when-closed",appliedEffects:y.trigger==="enumerate"?[]:[{type:"set-state",targetId:r==null?void 0:r.code,path:"state.open",value:!0}],postState:J&&r&&w?{schemaVersion:"rule-post-state.v1",currentLocation:{id:w.code,code:w.code,name:w.name,description:w.description},objects:[{id:r.code,code:r.code,name:r.name,locationId:r.initialLocationCode,isGlobal:r.global,revision:1,state:J}],sessionFlags:y.flags,sessionStateRevision:1}:null,facts:y.trigger==="enumerate"?[]:["西扉が開いた。"],events:[],hints:y.playerInput?["入力から「扉を開ける」が選択されました。"]:[],forbiddenFacts:[]}}};return u.jsx(ht,{account:jt,scenarioId:e,initialValues:o?{...Ht,title:"星喰いの地下図書館",ruleData:structuredClone(o)}:void 0,saving:!1,aiWorking:!1,actions:{saveDraft:s,assist:g,debug:q},onLogout:()=>{}})}function Y(){return u.jsx(K,{})}function Ct(){return u.jsx(K,{ruleData:Dt})}function kt(){return u.jsx(K,{ruleData:Ut})}Y.__docgenInfo={description:"",methods:[],displayName:"MockScenarioRegistrationContainer"};Ct.__docgenInfo={description:"",methods:[],displayName:"MockScenarioRegistrationWithRuleDataContainer"};kt.__docgenInfo={description:"",methods:[],displayName:"MockWestDoorAuthoringContainer"};const sa={title:"ユーザーストーリー/Scenario registration",component:d,render:()=>u.jsx(d,{initialUrl:"/scenarios/new",initialDb:$("registrationDraft"),scenarioRegistrationContainer:Y}),parameters:{notes:"docs/user-stories/scenario-registration.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}};function It({initialUrl:o}){const i=Et.useMemo(()=>{const e=Lt();return e.logout(),e},[]);return u.jsx(d,{initialUrl:o,initialDb:$("registrationDraft"),accountApi:i,scenarioRegistrationContainer:Y})}const l=async(o,i)=>{await t.click(await o.findByRole("button",{name:`${i}へ`}))},B={name:"認証: ログイン後にシナリオ作成へ戻る",render:()=>u.jsx(It,{initialUrl:"/scenarios/new"}),play:async({canvasElement:o,step:i})=>{const e=c(o);await i("未ログインではログイン画面へ移動し、元のURLを保持する",async()=>{await n(await e.findByRole("main",{name:"ログイン"})).toBeVisible(),await n(e.getByTestId("app-url")).toHaveTextContent("/account/login"),await n(e.getByTestId("app-url")).toHaveTextContent("redirect=%2Fscenarios%2Fnew")}),await i("ログインすると元のシナリオ作成画面へ戻る",async()=>{await t.clear(e.getByLabelText("メールアドレス")),await t.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await t.type(e.getByTestId("login-password"),"letters1"),await t.click(e.getByRole("button",{name:"ログインする"})),await n(await e.findByRole("main",{name:"シナリオ登録ウィザード"})).toBeVisible(),await n(e.getByTestId("app-url")).toHaveTextContent("/scenarios/new")})}},x={name:"認証: 戻り先がなければホームへ進む",render:()=>u.jsx(It,{initialUrl:"/account/login"}),play:async({canvasElement:o,step:i})=>{const e=c(o);await i("戻り先なしでログインする",async()=>{await n(await e.findByRole("main",{name:"ログイン"})).toBeVisible(),await t.clear(e.getByLabelText("メールアドレス")),await t.type(e.getByLabelText("メールアドレス"),"reader@myriale.example"),await t.type(e.getByTestId("login-password"),"letters1"),await t.click(e.getByRole("button",{name:"ログインする"}))}),await i("デフォルトのホーム画面へ移動する",async()=>{await n(await e.findByRole("main",{name:"Myrialeトップページ"})).toBeVisible(),await n(e.getByTestId("app-url")).toHaveTextContent("/")})}},T={name:"US-01: 新しいシナリオを作成したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await i("タイトル未入力では、下書き保存に必要な項目を説明する",async()=>{await t.click(e.getByRole("button",{name:"下書き保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("タイトルを入力すると下書き保存できます。")}),await i("タイトルだけ入力してDraft保存し、ScenarioIdを発行する",async()=>{await t.type(e.getByLabelText("シナリオタイトル"),"星喰いの地下図書館"),await t.click(e.getByRole("button",{name:"下書き保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました"),await n(e.getByText("SCN-DRAFT-0427")).toBeVisible()})}},R={name:"US-02: シナリオのジャンルをタグで指定したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await i("タイトル直下へ複数のジャンルタグを追加し、表紙サマリーへ反映する",async()=>{const a=e.getByLabelText("ジャンルタグを追加");await t.type(a,"ポストアポカリプス{Enter}"),await t.type(a,"巡礼譚"),await t.click(e.getByRole("button",{name:"タグを追加"})),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("# ポストアポカリプス"),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).toHaveTextContent("# 巡礼譚"),await n(e.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("# ポストアポカリプス # 巡礼譚")}),await i("不要なタグを個別に削除できる",async()=>{await t.click(e.getByRole("button",{name:"巡礼譚タグを削除"})),await n(e.getByRole("group",{name:"登録済みジャンルタグ"})).not.toHaveTextContent("# 巡礼譚")})}},S={name:"US-04: AIの裁量レベルを調整したい",play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await l(e,"基本情報"),await i("AI裁量を高へ変更し、生成時の挙動差を明示する",async()=>{const s=e.getAllByRole("combobox",{name:"AI裁量"})[0];await t.click(s),await t.click(await a.findByRole("option",{name:"高: 展開を広げる"})),await n(s).toHaveTextContent("高: 展開を広げる"),await n(e.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("高: 展開を広げる")})}},E={name:"US-05: 初期キャラクター条件を設定したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await l(e,"主人公"),await i("主人公の扱いと自由生成時の前提を入力する",async()=>{await n(e.getByRole("combobox",{name:"主人公の扱い"})).toHaveTextContent("自由生成のみ"),await t.clear(e.getByLabelText("主人公の設定")),await t.type(e.getByLabelText("主人公の設定"),"主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で自由に決められる。"),n(e.getByLabelText("主人公の設定").value).toContain("新人地図師"),await n(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("自由生成")})}},C={name:"US-06: シナリオの開始シーンを定義したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await l(e,"開始状態"),await i("開始シーンを固定し、初回Narrativeの材料にする",async()=>{await t.clear(e.getByLabelText("開始シーン")),await t.type(e.getByLabelText("開始シーン"),"あなたは灰の降る駅で、宛名のない切符を握っている。"),n(e.getByLabelText("開始シーン").value).toContain("灰の降る駅"),await n(e.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("固定")})}},k={name:"US-11: 挿絵のテイストを指定したい",play:async({canvasElement:o,step:i})=>{const e=c(o);c(o.ownerDocument.body),await l(e,"挿絵"),await i("文章と視覚表現を揃える画風を指定する",async()=>{await t.clear(e.getByLabelText("挿絵の画風")),await t.type(e.getByLabelText("挿絵の画風"),"古い天文図の銅版画、インクの滲み、低彩度"),n(e.getByLabelText("挿絵の画風").value).toContain("銅版画")})}},I={name:"US-12: 挿絵の雰囲気を指定したい",play:async({canvasElement:o,step:i})=>{const e=c(o);c(o.ownerDocument.body),await l(e,"挿絵"),await i("挿絵生成に使う感情的トーンを複数指定する",async()=>{await t.clear(e.getByLabelText("挿絵のムード")),await t.type(e.getByLabelText("挿絵のムード"),"孤独、湿度、薄明、遠い鐘の音"),n(e.getByLabelText("挿絵のムード").value).toContain("薄明")})}},f={name:"US-13: 挿絵の禁止要素を指定したい",play:async({canvasElement:o,step:i})=>{const e=c(o);c(o.ownerDocument.body),await l(e,"挿絵"),await i("年齢制限や世界観を守るNG要素を入力する",async()=>{await t.clear(e.getByLabelText("挿絵の禁止要素")),await t.type(e.getByLabelText("挿絵の禁止要素"),"現代兵器、スマートフォン、過度な流血"),n(e.getByLabelText("挿絵の禁止要素").value).toContain("スマートフォン")})}},L={name:"US-14: 挿絵を事前にプレビューしたい",play:async({canvasElement:o,step:i})=>{const e=c(o);c(o.ownerDocument.body),await l(e,"挿絵"),await i("サンプルシーンを入力し、本番相当の挿絵を保存せず生成する",async()=>{await t.clear(e.getByLabelText("サンプルシーン")),await t.type(e.getByLabelText("サンプルシーン"),"地下書庫の水面に星座が反射している。"),await t.click(e.getByRole("button",{name:"サンプルシーンで生成"})),await n(e.getByTestId("illustration-preview")).toHaveTextContent("保存対象外"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("まだ確定していません")})}},h={name:"US-15: プレビューを見ながら挿絵設定を調整したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await l(e,"挿絵"),await i("設定を変更して再生成し、納得した設定のみ保存対象にする",async()=>{await t.clear(e.getByLabelText("挿絵の画風")),await t.type(e.getByLabelText("挿絵の画風"),"影絵、余白多め、灯火だけ金色"),await t.click(e.getByRole("button",{name:"サンプルシーンで生成"})),n(e.getByLabelText("挿絵の画風").value).toContain("影絵"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("設定はまだ確定していません")})}},H={name:"US-17: 登録内容をAIに相談したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await i("AIに相談しても、提案は自動確定しない",async()=>{await t.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await n(e.getByTestId("ai-suggestion")).toHaveTextContent("基本情報案を3つ提示しました"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},A={name:"US-18: どのAIに聞くかを選択したい",play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await l(e,"挿絵"),await i("用途に合わせて相談先AIを選び、選択したAIで提案を生成する",async()=>{await t.click(e.getByRole("combobox",{name:"相談先AI"})),await t.click(await a.findByRole("option",{name:"挿絵AI"})),await t.click(e.getByRole("button",{name:"画風を相談"})),await n(e.getByRole("combobox",{name:"相談先AI"})).toHaveTextContent("挿絵AI"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵AIに挿絵テイストを相談しました")})}},U={name:"US-19: シナリオの基本情報をAIに補完してもらいたい",play:async({canvasElement:o,step:i})=>{const e=c(o);await i("基本情報候補を見て、採用してからMarkdown本文に入れる",async()=>{await t.click(e.getByRole("button",{name:"AIに基本情報案を出してもらう"})),await t.click(e.getByRole("button",{name:"採用して編集"})),n(e.getByLabelText("基本情報").value).toContain("## 物語の目的"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("採用しました"),await t.click(c(e.getByLabelText("基本情報の表示切替")).getByRole("button",{name:"プレビュー"})),await n(e.getByRole("article",{name:"基本情報のMarkdownプレビュー"})).toHaveTextContent("水没した書庫を探索する")})}},D={name:"US-21: 挿絵テイストをAIに相談したい",play:async({canvasElement:o,step:i})=>{const e=c(o);await l(e,"挿絵"),await i("シナリオに合う画風候補をAIに提示してもらう",async()=>{await t.click(e.getByRole("button",{name:"画風を相談"})),await n(e.getByTestId("ai-suggestion")).toHaveTextContent("画風候補"),await n(e.getByTestId("ai-suggestion")).toHaveTextContent("銅版画風")})}},j={name:"US-22: 挿絵プロンプトをAIに生成させたい",play:async({canvasElement:o,step:i})=>{const e=c(o);await l(e,"挿絵"),await i("画像生成用プロンプトとネガティブを分離して出力する",async()=>{await t.click(e.getByRole("button",{name:"プロンプトを生成"})),await n(e.getByTestId("ai-suggestion")).toHaveTextContent("ネガティブプロンプト"),await n(e.getByTestId("scenario-notice")).toHaveTextContent("挿絵プロンプトを相談しました")})}},b=()=>u.jsx(d,{initialUrl:"/scenarios/new",initialDb:$("registrationDraft"),scenarioRegistrationContainer:Ct}),V={name:"Entity: 人物と物品を同じMarkdownプロフィールで設定する",render:b,play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await l(e,"エンティティ"),await i("人物も物品も同じエンティティとして追加する",async()=>{await t.click(e.getByRole("button",{name:"エンティティを追加"})),await t.clear(a.getByLabelText("エンティティのstable code")),await t.type(a.getByLabelText("エンティティのstable code"),"archivist-mira"),await t.clear(a.getByLabelText("エンティティの表示名")),await t.type(a.getByLabelText("エンティティの表示名"),"司書ミラ"),await t.click(a.getByRole("combobox",{name:"初期配置"})),await t.click(await a.findByRole("option",{name:"星見の階段 / astral-stair"}))}),await i("外観、演技指針、知識、秘密を共通Markdownへ記述する",async()=>{await t.clear(a.getByLabelText("エンティティプロフィール")),await t.type(a.getByLabelText("エンティティプロフィール"),`## 外観

星図を縫い込んだ濃紺のローブを着ている。

## 人物像と演技指針

慎重で観察力が高く、答えを直接明かさず星図を使って示唆する。

## 話し方

一人称は「私」。静かで短い敬語。

## 秘密

王都が沈んだ本当の原因を知っている。`),await t.click(a.getByRole("button",{name:"編集を完了"}));const s=e.getByRole("table",{name:"エンティティ一覧"});await n(c(s).getByText("司書ミラ")).toBeVisible()})}},O={name:"US-SR16: 作成手順を制作順に把握する",render:b,play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await i("7ステップが制作順に並ぶことを確認する",async()=>{const s=e.getByRole("list",{name:"登録ウィザードのステップ"}),g=c(s).getAllByRole("button").map(q=>q.getAttribute("aria-label"));n(g).toEqual(["基本情報へ","場所へ","主人公へ","エンティティへ","開始状態へ","挿絵へ","テストへ"])}),await i("主人公の扱いを独立して編集できることを確認する",async()=>{await l(e,"主人公"),await n(e.getByRole("combobox",{name:"主人公の扱い"})).toBeVisible(),await n(e.queryByRole("button",{name:"エンティティを追加"})).not.toBeInTheDocument()}),await i("場所とエンティティを別々に編集できることを確認する",async()=>{await l(e,"場所"),await n(e.getByRole("button",{name:"場所を追加"})).toBeVisible(),await n(e.queryByRole("button",{name:"エンティティを追加"})).not.toBeInTheDocument(),await l(e,"エンティティ"),await n(e.getByRole("button",{name:"エンティティを追加"})).toBeVisible(),await n(e.queryByRole("button",{name:"場所を追加"})).not.toBeInTheDocument()}),await i("開始状態で開始条件を編集できることを確認する",async()=>{await l(e,"開始状態"),await n(e.getByLabelText("ウィザード進捗")).toHaveTextContent("05開始状態");const s=e.getByRole("table",{name:"全エンティティの初期ステート一覧"});await n(c(s).getByRole("columnheader",{name:"エンティティ"})).toBeVisible(),await n(c(s).getByRole("columnheader",{name:"基準値"})).toBeVisible(),await n(c(s).getByRole("columnheader",{name:"初期値"})).toBeVisible(),await t.click(e.getByRole("combobox",{name:"セッション開始場所"})),await t.click(await a.findByRole("option",{name:"星見の階段 / astral-stair"})),await n(e.getByRole("combobox",{name:"セッション開始場所"})).toHaveTextContent("星見の階段"),await t.click(e.getByRole("combobox",{name:"北書庫の扉の開いている初期値"})),await t.click(await a.findByRole("option",{name:"true"})),await n(c(s).getByText("上書き中")).toBeVisible()})}},F={name:"US-23: Object Typeの状態とアクションを定義したい",play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await l(e,"エンティティ"),await i("新しい種類へstable code、状態、公開範囲を登録する",async()=>{await t.click(e.getByRole("button",{name:"種類を追加"})),await t.clear(a.getByLabelText("種類のstable code")),await t.type(a.getByLabelText("種類のstable code"),"sealed-door"),await t.clear(a.getByLabelText("種類の表示名")),await t.type(a.getByLabelText("種類の表示名"),"隔壁扉"),await t.click(a.getByRole("button",{name:"状態を追加"})),await t.clear(a.getByLabelText("状態1のstable code")),await t.type(a.getByLabelText("状態1のstable code"),"open"),await n(a.getByRole("combobox",{name:"公開"})).toHaveTextContent("public"),await t.click(a.getByRole("button",{name:"状態の編集を完了"})),await n(a.getByRole("button",{name:"新しい状態を編集"})).toBeVisible()}),await i("AIへ列挙するアクションinterfaceを登録する",async()=>{await t.click(a.getByRole("button",{name:"アクションを追加"})),await t.clear(a.getByLabelText("アクション1のstable code")),await t.type(a.getByLabelText("アクション1のstable code"),"open"),await t.clear(a.getByLabelText("アクション1の表示名")),await t.type(a.getByLabelText("アクション1の表示名"),"扉を開ける"),await n(a.getByRole("combobox",{name:"visibility"})).toHaveTextContent("AI choice")})}},M={name:"US-24: Locationを作成してObjectを初期配置したい",render:b,play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await l(e,"場所"),await i("場所を追加してstable codeを維持する",async()=>{await t.click(e.getByRole("button",{name:"場所を追加"})),await t.clear(a.getByLabelText("場所のstable code")),await t.type(a.getByLabelText("場所のstable code"),"sealed-vault"),await t.clear(a.getByLabelText("場所の表示名")),await t.type(a.getByLabelText("場所の表示名"),"封印書庫"),await t.click(a.getByRole("button",{name:"編集を完了"})),await n(e.getByRole("button",{name:"封印書庫を編集"})).toBeVisible()}),await l(e,"エンティティ"),await i("Objectの状態を1つの表で確認し、受け継いだ状態は初期値だけ変更する",async()=>{await t.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await n(a.getByRole("region",{name:"ordered Type mixins"})).toHaveTextContent("書庫の扉"),await n(a.getByRole("combobox",{name:"初期配置"})).toHaveTextContent("水没した閲覧室");const s=a.getByRole("table",{name:"Object states"});await n(s).toHaveTextContent("開いている"),await n(s).toHaveTextContent("封印名"),await n(s).not.toHaveTextContent("mixin由来"),await t.click(a.getByRole("button",{name:"openの状態を確認"})),await n(a.queryByLabelText("Object state code")).not.toBeInTheDocument(),await t.type(a.getByLabelText("openの初期値"),"true"),await n(a.getByRole("button",{name:"継承値へ戻す"})).toBeEnabled()})}},N={name:"US-25: 状態とアクションに決定的な結果を設定したい",render:b,play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await l(e,"エンティティ"),await i("Object paneの統合rule tableで既存adjustのeffective結果を開く",async()=>{await t.click(e.getByRole("button",{name:"北書庫の扉を編集"}));const s=a.getByRole("table",{name:"Object rules"});await n(s).toHaveTextContent("archive-door:generic-open"),await n(s).not.toHaveTextContent("mixin由来"),await t.click(a.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"}))}),await i("継承condition/priorityと調整済み結果をread-onlyで確認する",async()=>{await n(a.getByText(/override \/ delete \/ adjustを開始することはできません/)).toBeVisible(),await n(a.getAllByText("100")[0]).toBeVisible(),await n(a.getByText("set-state → emit-fact")).toBeVisible(),await n(a.queryByLabelText("実行ルールの優先度")).not.toBeInTheDocument()}),await i("オブジェクト末尾の公開準備チェックが決定性を確認する",async()=>{await n(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です")})}},P={name:"US-26: 参照中の種類と場所を安全に削除したい",render:b,play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await l(e,"エンティティ"),await i("Objectが参照中の種類は削除を拒否する",async()=>{await t.click(e.getByRole("button",{name:/^書庫の扉を編集$/})),await t.click(a.getByRole("button",{name:"この種類を削除"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("先に種類を変更するかエンティティを削除"),await t.click(a.getByRole("button",{name:"編集ペインを閉じる"}))}),await l(e,"場所"),await i("場所ステップでObjectが配置中のLocationも削除を拒否する",async()=>{await t.click(e.getByRole("button",{name:"水没した閲覧室を編集"})),await t.click(a.getByRole("button",{name:"この場所を削除"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("開始場所に選ばれています")})}},G={name:"US-27: 既存mutationを保持してDraft保存したい",render:b,play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await l(e,"エンティティ"),await i("既存adjust operationはeffective結果だけをread-onlyで表示する",async()=>{await t.click(e.getByRole("button",{name:"北書庫の扉を編集"})),await t.click(a.getByRole("button",{name:"archive-door:generic-openの実行ルールを確認"})),await n(a.queryByLabelText("実行ルールの優先度")).not.toBeInTheDocument(),await n(a.getByText(/既存の変更内容は保存時もそのまま保持されます/)).toBeVisible(),await t.click(a.getByRole("button",{name:"閉じる"})),await t.click(a.getByRole("button",{name:"編集を完了"}))}),await i("既存mutationを変更せず下書き保存できる",async()=>{await t.click(e.getByRole("button",{name:"下書き保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました")})}},W={name:"US-SR12: 任意状態からルールエンジンを動作確認する",render:b,play:async({canvasElement:o,step:i})=>{const e=c(o);await l(e,"テスト"),await i("全状態を上書きして公開状態と利用可能アクションを確認する",async()=>{const a=e.getAllByLabelText(/のstate$/)[0];await t.clear(a),await t.click(a),await t.paste('{"open":false}'),await t.click(e.getByRole("button",{name:"公開状態とアクションを確認"})),await n(e.getByRole("complementary",{name:"デバッグ実行結果"})).toHaveTextContent("扉を開ける")}),await i("アクションを直接発動してselected ruleとpost-stateを確認する",async()=>{await t.click(e.getByRole("button",{name:"アクションを直接発動"})),await n(e.getByText(/open-door-when-closed/)).toBeVisible(),await n(e.getByTestId("debug-post-state")).toHaveTextContent('"open": true')}),await i("ユーザー入力から選ばれるアクションと物語材料を確認する",async()=>{await t.type(e.getByLabelText("デバッグ用ユーザー入力"),"扉をゆっくり開ける"),await t.click(e.getByRole("button",{name:"入力から起きることを確認"})),await n(e.getByRole("complementary",{name:"デバッグ実行結果"})).toHaveTextContent("入力から「扉を開ける」が選択されました。"),await n(e.getByTestId("debug-notice")).toHaveTextContent("本番データは変更されていません")})}},_={name:"西の扉seed: 統合テーブルで契約と結果を編集・保存する",render:()=>u.jsx(d,{initialUrl:"/scenarios/new",initialDb:$("registrationDraft"),scenarioRegistrationContainer:kt}),play:async({canvasElement:o,step:i})=>{const e=c(o),a=c(o.ownerDocument.body);await l(e,"エンティティ"),await t.click(e.getByRole("button",{name:"西の扉を編集"})),await i("ordered mixinを維持しながら状態・アクション・ruleを各1つの表で表示する",async()=>{const s=a.getByRole("region",{name:"ordered Type mixins"});await n(s).toHaveTextContent("開閉可能"),await n(s).toHaveTextContent("出口の扉"),await n(a.getByRole("table",{name:"Object states"})).toHaveTextContent("開いている"),await n(a.getByRole("table",{name:"Object states"})).toHaveTextContent("方向"),await n(a.getByRole("table",{name:"Object actions"})).toHaveTextContent("出口を確認する"),await n(a.getByRole("table",{name:"Object rules"})).toHaveTextContent("exit-door:generic-open-and-exit"),await n(a.getByRole("table",{name:"Object rules"})).toHaveTextContent("local:west-inspect-exit")}),await i("受け継いだ状態は初期値だけ、Objectのアクションとadd ruleは編集できる",async()=>{await t.click(a.getByRole("button",{name:"openの状態を確認"})),await t.type(a.getByLabelText("openの初期値"),"true"),await t.click(a.getByRole("button",{name:"閉じる"})),await t.click(a.getByRole("button",{name:"inspect-exitのアクションを確認"})),await t.clear(a.getByLabelText("Object action label")),await t.type(a.getByLabelText("Object action label"),"出口を詳しく確認する"),await t.click(a.getByRole("button",{name:"閉じる"})),await t.click(a.getByRole("button",{name:"local:west-inspect-exitの実行ルールを確認"}));const s=a.getByRole("table",{name:"実行条件 table"});await n(s).toHaveTextContent("状態：direction ＝"),await t.click(c(s).getByRole("button",{name:"ルートの実行条件を編集"}));const g=a.getByRole("dialog",{name:"実行条件を編集"});await n(g).toHaveAttribute("data-layer","2"),await t.click(c(g).getByRole("combobox",{name:"実行条件の条件種別"})),await t.click(await a.findByRole("option",{name:"すべて成立（AND）"})),await t.click(c(g).getByRole("button",{name:"子条件を追加"})),await t.click(c(g).getByRole("button",{name:"実行条件の編集を完了"})),await n(s).toHaveTextContent("すべて成立（AND）"),await n(s).toHaveTextContent("AND 2"),await t.clear(a.getByLabelText("実行ルールの優先度")),await t.type(a.getByLabelText("実行ルールの優先度"),"95"),await t.click(a.getByRole("button",{name:"閉じる"}))}),await i("既存overrideはread-onlyのままeffective 8 effectを保持する",async()=>{await t.click(a.getByRole("button",{name:"exit-door:generic-open-and-exitの実行ルールを確認"})),await n(a.getByText("set-state → move-session → emit-fact → emit-fact → emit-event → add-narrative-hint → forbid-narrative-fact → forbid-narrative-fact")).toBeVisible(),await n(a.queryByLabelText("実行ルールの優先度")).not.toBeInTheDocument(),await t.click(a.getByRole("button",{name:"閉じる"}))}),await i("編集内容と既存mutationを下書き保存する",async()=>{await t.click(a.getByRole("button",{name:"編集を完了"})),await n(e.getByTestId("rule-readiness")).toHaveTextContent("決定的です"),await t.click(e.getByRole("button",{name:"下書き保存"})),await n(e.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました")})}};var ee,te,ae;B.parameters={...B.parameters,docs:{...(ee=B.parameters)==null?void 0:ee.docs,source:{originalSource:`{
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
      await userEvent.type(canvas.getByTestId('login-password'), 'letters1');
      await userEvent.click(canvas.getByRole('button', {
        name: 'ログインする'
      }));
      await expect(await canvas.findByRole('main', {
        name: 'シナリオ登録ウィザード'
      })).toBeVisible();
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/scenarios/new');
    });
  }
}`,...(ae=(te=B.parameters)==null?void 0:te.docs)==null?void 0:ae.source}}};var ne,oe,ie;x.parameters={...x.parameters,docs:{...(ne=x.parameters)==null?void 0:ne.docs,source:{originalSource:`{
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
      await userEvent.type(canvas.getByTestId('login-password'), 'letters1');
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
}`,...(ie=(oe=x.parameters)==null?void 0:oe.docs)==null?void 0:ie.source}}};var ce,se,re;T.parameters={...T.parameters,docs:{...(ce=T.parameters)==null?void 0:ce.docs,source:{originalSource:`{
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
}`,...(re=(se=T.parameters)==null?void 0:se.docs)==null?void 0:re.source}}};var le,ye,me;R.parameters={...R.parameters,docs:{...(le=R.parameters)==null?void 0:le.docs,source:{originalSource:`{
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
}`,...(me=(ye=R.parameters)==null?void 0:ye.docs)==null?void 0:me.source}}};var we,pe,ue;S.parameters={...S.parameters,docs:{...(we=S.parameters)==null?void 0:we.docs,source:{originalSource:`{
  name: 'US-04: AIの裁量レベルを調整したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '基本情報');
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
        name: '入力サマリー'
      })).toHaveTextContent('高: 展開を広げる');
    });
  }
}`,...(ue=(pe=S.parameters)==null?void 0:pe.docs)==null?void 0:ue.source}}};var ge,ve,be;E.parameters={...E.parameters,docs:{...(ge=E.parameters)==null?void 0:ge.docs,source:{originalSource:`{
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
}`,...(be=(ve=E.parameters)==null?void 0:ve.docs)==null?void 0:be.source}}};var de,Be,xe;C.parameters={...C.parameters,docs:{...(de=C.parameters)==null?void 0:de.docs,source:{originalSource:`{
  name: 'US-06: シナリオの開始シーンを定義したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '開始状態');
    await step('開始シーンを固定し、初回Narrativeの材料にする', async () => {
      await userEvent.clear(canvas.getByLabelText('開始シーン'));
      await userEvent.type(canvas.getByLabelText('開始シーン'), 'あなたは灰の降る駅で、宛名のない切符を握っている。');
      expect((canvas.getByLabelText('開始シーン') as HTMLTextAreaElement).value).toContain('灰の降る駅');
      await expect(canvas.getByRole('complementary', {
        name: '契約の背表紙'
      })).toHaveTextContent('固定');
    });
  }
}`,...(xe=(Be=C.parameters)==null?void 0:Be.docs)==null?void 0:xe.source}}};var Te,Re,Se;k.parameters={...k.parameters,docs:{...(Te=k.parameters)==null?void 0:Te.docs,source:{originalSource:`{
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
}`,...(Se=(Re=k.parameters)==null?void 0:Re.docs)==null?void 0:Se.source}}};var Ee,Ce,ke;I.parameters={...I.parameters,docs:{...(Ee=I.parameters)==null?void 0:Ee.docs,source:{originalSource:`{
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
}`,...(ke=(Ce=I.parameters)==null?void 0:Ce.docs)==null?void 0:ke.source}}};var Ie,fe,Le;f.parameters={...f.parameters,docs:{...(Ie=f.parameters)==null?void 0:Ie.docs,source:{originalSource:`{
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
}`,...(Le=(fe=f.parameters)==null?void 0:fe.docs)==null?void 0:Le.source}}};var he,He,Ae;L.parameters={...L.parameters,docs:{...(he=L.parameters)==null?void 0:he.docs,source:{originalSource:`{
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
}`,...(Ae=(He=L.parameters)==null?void 0:He.docs)==null?void 0:Ae.source}}};var Ue,De,je;h.parameters={...h.parameters,docs:{...(Ue=h.parameters)==null?void 0:Ue.docs,source:{originalSource:`{
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
}`,...(je=(De=h.parameters)==null?void 0:De.docs)==null?void 0:je.source}}};var Ve,Oe,Fe;H.parameters={...H.parameters,docs:{...(Ve=H.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
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
}`,...(Fe=(Oe=H.parameters)==null?void 0:Oe.docs)==null?void 0:Fe.source}}};var Me,Ne,Pe;A.parameters={...A.parameters,docs:{...(Me=A.parameters)==null?void 0:Me.docs,source:{originalSource:`{
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
}`,...(Pe=(Ne=A.parameters)==null?void 0:Ne.docs)==null?void 0:Pe.source}}};var Ge,We,_e;U.parameters={...U.parameters,docs:{...(Ge=U.parameters)==null?void 0:Ge.docs,source:{originalSource:`{
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
      await userEvent.click(within(canvas.getByLabelText('基本情報の表示切替')).getByRole('button', {
        name: 'プレビュー'
      }));
      await expect(canvas.getByRole('article', {
        name: '基本情報のMarkdownプレビュー'
      })).toHaveTextContent('水没した書庫を探索する');
    });
  }
}`,...(_e=(We=U.parameters)==null?void 0:We.docs)==null?void 0:_e.source}}};var $e,qe,Ke;D.parameters={...D.parameters,docs:{...($e=D.parameters)==null?void 0:$e.docs,source:{originalSource:`{
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
}`,...(Ke=(qe=D.parameters)==null?void 0:qe.docs)==null?void 0:Ke.source}}};var Ye,ze,Je;j.parameters={...j.parameters,docs:{...(Ye=j.parameters)==null?void 0:Ye.docs,source:{originalSource:`{
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
}`,...(Je=(ze=j.parameters)==null?void 0:ze.docs)==null?void 0:Je.source}}};var Qe,Xe,Ze;V.parameters={...V.parameters,docs:{...(Qe=V.parameters)==null?void 0:Qe.docs,source:{originalSource:`{
  name: 'Entity: 人物と物品を同じMarkdownプロフィールで設定する',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, 'エンティティ');
    await step('人物も物品も同じエンティティとして追加する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'エンティティを追加'
      }));
      await userEvent.clear(screen.getByLabelText('エンティティのstable code'));
      await userEvent.type(screen.getByLabelText('エンティティのstable code'), 'archivist-mira');
      await userEvent.clear(screen.getByLabelText('エンティティの表示名'));
      await userEvent.type(screen.getByLabelText('エンティティの表示名'), '司書ミラ');
      await userEvent.click(screen.getByRole('combobox', {
        name: '初期配置'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: '星見の階段 / astral-stair'
      }));
    });
    await step('外観、演技指針、知識、秘密を共通Markdownへ記述する', async () => {
      await userEvent.clear(screen.getByLabelText('エンティティプロフィール'));
      await userEvent.type(screen.getByLabelText('エンティティプロフィール'), '## 外観\\n\\n星図を縫い込んだ濃紺のローブを着ている。\\n\\n## 人物像と演技指針\\n\\n慎重で観察力が高く、答えを直接明かさず星図を使って示唆する。\\n\\n## 話し方\\n\\n一人称は「私」。静かで短い敬語。\\n\\n## 秘密\\n\\n王都が沈んだ本当の原因を知っている。');
      await userEvent.click(screen.getByRole('button', {
        name: '編集を完了'
      }));
      const table = canvas.getByRole('table', {
        name: 'エンティティ一覧'
      });
      await expect(within(table).getByText('司書ミラ')).toBeVisible();
    });
  }
}`,...(Ze=(Xe=V.parameters)==null?void 0:Xe.docs)==null?void 0:Ze.source}}};var et,tt,at;O.parameters={...O.parameters,docs:{...(et=O.parameters)==null?void 0:et.docs,source:{originalSource:`{
  name: 'US-SR16: 作成手順を制作順に把握する',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('7ステップが制作順に並ぶことを確認する', async () => {
      const navigation = canvas.getByRole('list', {
        name: '登録ウィザードのステップ'
      });
      const labels = within(navigation).getAllByRole('button').map(button => button.getAttribute('aria-label'));
      expect(labels).toEqual(['基本情報へ', '場所へ', '主人公へ', 'エンティティへ', '開始状態へ', '挿絵へ', 'テストへ']);
    });
    await step('主人公の扱いを独立して編集できることを確認する', async () => {
      await goToStep(canvas, '主人公');
      await expect(canvas.getByRole('combobox', {
        name: '主人公の扱い'
      })).toBeVisible();
      await expect(canvas.queryByRole('button', {
        name: 'エンティティを追加'
      })).not.toBeInTheDocument();
    });
    await step('場所とエンティティを別々に編集できることを確認する', async () => {
      await goToStep(canvas, '場所');
      await expect(canvas.getByRole('button', {
        name: '場所を追加'
      })).toBeVisible();
      await expect(canvas.queryByRole('button', {
        name: 'エンティティを追加'
      })).not.toBeInTheDocument();
      await goToStep(canvas, 'エンティティ');
      await expect(canvas.getByRole('button', {
        name: 'エンティティを追加'
      })).toBeVisible();
      await expect(canvas.queryByRole('button', {
        name: '場所を追加'
      })).not.toBeInTheDocument();
    });
    await step('開始状態で開始条件を編集できることを確認する', async () => {
      await goToStep(canvas, '開始状態');
      await expect(canvas.getByLabelText('ウィザード進捗')).toHaveTextContent('05開始状態');
      const initialStateTable = canvas.getByRole('table', {
        name: '全エンティティの初期ステート一覧'
      });
      await expect(within(initialStateTable).getByRole('columnheader', {
        name: 'エンティティ'
      })).toBeVisible();
      await expect(within(initialStateTable).getByRole('columnheader', {
        name: '基準値'
      })).toBeVisible();
      await expect(within(initialStateTable).getByRole('columnheader', {
        name: '初期値'
      })).toBeVisible();
      await userEvent.click(canvas.getByRole('combobox', {
        name: 'セッション開始場所'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: '星見の階段 / astral-stair'
      }));
      await expect(canvas.getByRole('combobox', {
        name: 'セッション開始場所'
      })).toHaveTextContent('星見の階段');
      await userEvent.click(canvas.getByRole('combobox', {
        name: '北書庫の扉の開いている初期値'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: 'true'
      }));
      await expect(within(initialStateTable).getByText('上書き中')).toBeVisible();
    });
  }
}`,...(at=(tt=O.parameters)==null?void 0:tt.docs)==null?void 0:at.source}}};var nt,ot,it;F.parameters={...F.parameters,docs:{...(nt=F.parameters)==null?void 0:nt.docs,source:{originalSource:`{
  name: 'US-23: Object Typeの状態とアクションを定義したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, 'エンティティ');
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
}`,...(it=(ot=F.parameters)==null?void 0:ot.docs)==null?void 0:it.source}}};var ct,st,rt;M.parameters={...M.parameters,docs:{...(ct=M.parameters)==null?void 0:ct.docs,source:{originalSource:`{
  name: 'US-24: Locationを作成してObjectを初期配置したい',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, '場所');
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
    await goToStep(canvas, 'エンティティ');
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
}`,...(rt=(st=M.parameters)==null?void 0:st.docs)==null?void 0:rt.source}}};var lt,yt,mt;N.parameters={...N.parameters,docs:{...(lt=N.parameters)==null?void 0:lt.docs,source:{originalSource:`{
  name: 'US-25: 状態とアクションに決定的な結果を設定したい',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, 'エンティティ');
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
    await step('オブジェクト末尾の公開準備チェックが決定性を確認する', async () => {
      await expect(canvas.getByTestId('rule-readiness')).toHaveTextContent('決定的です');
    });
  }
}`,...(mt=(yt=N.parameters)==null?void 0:yt.docs)==null?void 0:mt.source}}};var wt,pt,ut;P.parameters={...P.parameters,docs:{...(wt=P.parameters)==null?void 0:wt.docs,source:{originalSource:`{
  name: 'US-26: 参照中の種類と場所を安全に削除したい',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, 'エンティティ');
    await step('Objectが参照中の種類は削除を拒否する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: /^書庫の扉を編集$/
      }));
      await userEvent.click(screen.getByRole('button', {
        name: 'この種類を削除'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('先に種類を変更するかエンティティを削除');
      await userEvent.click(screen.getByRole('button', {
        name: '編集ペインを閉じる'
      }));
    });
    await goToStep(canvas, '場所');
    await step('場所ステップでObjectが配置中のLocationも削除を拒否する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '水没した閲覧室を編集'
      }));
      await userEvent.click(screen.getByRole('button', {
        name: 'この場所を削除'
      }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('開始場所に選ばれています');
    });
  }
}`,...(ut=(pt=P.parameters)==null?void 0:pt.docs)==null?void 0:ut.source}}};var gt,vt,bt;G.parameters={...G.parameters,docs:{...(gt=G.parameters)==null?void 0:gt.docs,source:{originalSource:`{
  name: 'US-27: 既存mutationを保持してDraft保存したい',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, 'エンティティ');
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
}`,...(bt=(vt=G.parameters)==null?void 0:vt.docs)==null?void 0:bt.source}}};var dt,Bt,xt;W.parameters={...W.parameters,docs:{...(dt=W.parameters)==null?void 0:dt.docs,source:{originalSource:`{
  name: 'US-SR12: 任意状態からルールエンジンを動作確認する',
  render: renderRuleDataFixture,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'テスト');
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
}`,...(xt=(Bt=W.parameters)==null?void 0:Bt.docs)==null?void 0:xt.source}}};var Tt,Rt,St;_.parameters={..._.parameters,docs:{...(Tt=_.parameters)==null?void 0:Tt.docs,source:{originalSource:`{
  name: '西の扉seed: 統合テーブルで契約と結果を編集・保存する',
  render: () => <MyrialeApp initialUrl="/scenarios/new" initialDb={createDemoDb('registrationDraft')} scenarioRegistrationContainer={MockWestDoorAuthoringContainer} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, 'エンティティ');
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
}`,...(St=(Rt=_.parameters)==null?void 0:Rt.docs)==null?void 0:St.source}}};const ra=["AuthenticationReturnsToScenarioCreation","AuthenticationDefaultsToHome","US01CreateDraftScenario","US02SpecifyGenreTag","US04TuneAiFreedom","US05SetInitialCharacter","US06DefineOpeningScene","US11SpecifyIllustrationStyle","US12SpecifyIllustrationMood","US13SpecifyNegativeElements","US14PreviewIllustration","US15IterateIllustrationSettings","US17ConsultAiAboutRegistration","US18SelectAiByPurpose","US19AiCompletesSummary","US21ConsultIllustrationTaste","US22GenerateIllustrationPrompt","ConfigureEntityProfile","ConfigureInitialSceneFromWorldData","US23DefineObjectTypeStatesAndActions","US24CreateLocationsAndPlaceObjects","US25AuthorDeterministicActionResults","US26KeepDependenciesSafe","US27SaveIncompleteRuleDataAsDraft","US12DebugRuleEngineFromArbitraryState","AuthorWestDoorSeedWithEightOrderedEffects"];export{x as AuthenticationDefaultsToHome,B as AuthenticationReturnsToScenarioCreation,_ as AuthorWestDoorSeedWithEightOrderedEffects,V as ConfigureEntityProfile,O as ConfigureInitialSceneFromWorldData,T as US01CreateDraftScenario,R as US02SpecifyGenreTag,S as US04TuneAiFreedom,E as US05SetInitialCharacter,C as US06DefineOpeningScene,k as US11SpecifyIllustrationStyle,W as US12DebugRuleEngineFromArbitraryState,I as US12SpecifyIllustrationMood,f as US13SpecifyNegativeElements,L as US14PreviewIllustration,h as US15IterateIllustrationSettings,H as US17ConsultAiAboutRegistration,A as US18SelectAiByPurpose,U as US19AiCompletesSummary,D as US21ConsultIllustrationTaste,j as US22GenerateIllustrationPrompt,F as US23DefineObjectTypeStatesAndActions,M as US24CreateLocationsAndPlaceObjects,N as US25AuthorDeterministicActionResults,P as US26KeepDependenciesSafe,G as US27SaveIncompleteRuleDataAsDraft,ra as __namedExportsOrder,sa as default};
