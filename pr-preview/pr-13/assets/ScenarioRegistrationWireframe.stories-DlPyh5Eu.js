import{w as r,u as c,e as i}from"./index-C3Z0PGzo.js";import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as o}from"./index-BlmOqGMO.js";import{A as xa}from"./AppChrome-BYYLhV_J.js";/* empty css               */import"./index-yBjzXJbu.js";const m=[{id:"cover",label:"表紙",help:"Draft保存のための最小入力"},{id:"lore",label:"世界の掟",help:"ジャンル、雰囲気、Lore"},{id:"ai",label:"AI裁量",help:"AIが広げてよい範囲"},{id:"hero",label:"主人公",help:"初期キャラクター条件"},{id:"opening",label:"第一場面",help:"最初のNarrativeの固定"},{id:"illustration",label:"挿絵",help:"画風、NG、プレビュー"}];function Pe(){const[n,s]=o.useState("cover"),[a,$e]=o.useState(""),[z,G]=o.useState(""),[F,Me]=o.useState("ダークファンタジー"),[O,We]=o.useState("静かで不穏"),[R,_e]=o.useState(`星座は魔法体系の鍵。
死者の名前を読むと記憶を失う。`),[k,qe]=o.useState("中: 設定を守りつつ提案する"),[N,Je]=o.useState("禁書司書の見習い。名前はセッション開始時に入力。"),[V,Ke]=o.useState("あなたは水没した閲覧室で目を覚ます。"),[D,Qe]=o.useState("銅版画風 / 低彩度 / 細密"),[Xe,Ye]=o.useState("孤独、湿った静けさ、薄い金色の灯り"),[P,Ze]=o.useState("現代車両、銃器、過度な流血"),[ea,aa]=o.useState("水没した閲覧室で、星図を抱えた司書が振り向く。"),[ta,na]=o.useState("未発行"),[sa,v]=o.useState("タイトルだけで下書き保存できます。"),[$,ia]=o.useState("文章AI"),[ca,oa]=o.useState("AIの提案は、採用するまで本文に反映されません。"),[ra,la]=o.useState("プレビュー未生成"),y=m.findIndex(t=>t.id===n),p=m[y],pa=()=>{if(!a.trim()){v("タイトルを入力すると下書き保存できます。");return}na("SCN-DRAFT-0427"),v(`「${a}」をDraftとして保存しました。ScenarioIdを発行しました。`)},x=t=>{oa({概要:"概要案を3つ提示しました。採用、編集、破棄を選べます。",世界観:"世界観の矛盾候補を2件見つけました。理由を確認してから反映できます。",挿絵テイスト:"シナリオに合う画風候補を提示しました: 銅版画風、影絵、水彩写本。",挿絵プロンプト:"画像生成用プロンプトとネガティブプロンプトを分離して生成しました。"}[t]),v(`${$}に${t}を相談しました。自動確定はしません。`)},va=()=>{G("地下に沈んだ王都で、禁書を読むたびに星座が書き換わる探索譚。"),v("AIの概要案を本文へ採用しました。編集してから保存できます。")},ya=()=>{la("本番相当の挿絵プレビューを生成しました（保存対象外）。"),v("サンプルシーンで挿絵をプレビューしました。設定はまだ確定していません。")},ga=t=>t==="cover"?a?"保存候補":"未入力":t==="lore"?R?"入力済み":"未入力":t==="ai"?k:t==="hero"?N?"入力済み":"未入力":t==="opening"?V?"固定":"AI生成":D?"入力済み":"未入力",M=t=>{const g=m[y+t];g&&s(g.id)},ma=[{label:"Myriale",to:"scenarioRegister"},{label:"ライブラリ",to:"scenarioRegister"},{label:"シナリオを登録"}];return e.jsx(xa,{section:"library",breadcrumbs:ma,account:{name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"作者"},children:e.jsxs("div",{className:"scenario-forge scenario-forge-wizard",children:[e.jsxs("aside",{className:"contract-spine","aria-label":"契約の背表紙",children:[e.jsx("strong",{children:"契約の背表紙"}),e.jsx("div",{className:"wizard-step-list",role:"list","aria-label":"登録ウィザードのステップ",children:m.map((t,g)=>e.jsxs("button",{className:`spine-row spine-step ${n===t.id?"active":""}`,onClick:()=>s(t.id),"aria-label":`${t.label}へ`,"aria-current":n===t.id?"step":void 0,children:[e.jsxs("span",{children:[String(g+1).padStart(2,"0")," / ",t.label]}),e.jsx("small",{children:ga(t.id)})]},t.id))}),e.jsxs("div",{className:"scenario-id",children:[e.jsx("span",{children:"ScenarioId"}),e.jsx("b",{children:ta})]})]}),e.jsxs("main",{className:"forge-paper wizard-paper","aria-label":"シナリオ登録ウィザード",children:[e.jsx("p",{className:"kicker",children:"Scenario Forge / Wizard registration"}),e.jsx("div",{className:"notice",role:"status","data-testid":"scenario-notice",children:sa}),e.jsxs("div",{className:"wizard-progress","aria-label":"ウィザード進捗",children:[e.jsx("span",{children:String(y+1).padStart(2,"0")}),e.jsx("strong",{children:p.label})]}),n==="cover"&&e.jsxs("section",{className:"wizard-panel","aria-label":"表紙",children:[e.jsxs("p",{children:[e.jsxs("strong",{children:[p.help,"。"]}),"シナリオは未完成で保存できます。最初はタイトルだけでDraftを作り、あとから設定を足します。"]}),e.jsxs("label",{children:["シナリオタイトル *",e.jsx("input",{"aria-label":"シナリオタイトル",value:a,onChange:t=>$e(t.target.value),placeholder:"星喰いの地下図書館"})]}),e.jsxs("label",{children:["概要（空でも保存できます）",e.jsx("textarea",{"aria-label":"概要",value:z,onChange:t=>G(t.target.value)})]}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{className:"primary",onClick:pa,children:"下書き保存"}),e.jsx("button",{onClick:()=>x("概要"),children:"AIに概要案を出してもらう"}),e.jsx("button",{onClick:va,children:"採用して編集"})]})]}),n==="lore"&&e.jsxs("section",{className:"wizard-panel","aria-label":"世界の掟",children:[e.jsxs("p",{children:[e.jsxs("strong",{children:[p.help,"。"]}),"ジャンル、雰囲気、Loreは文章AIと挿絵AIが共通して読む契約です。"]}),e.jsxs("label",{children:["ジャンル",e.jsx("input",{"aria-label":"ジャンル",value:F,onChange:t=>Me(t.target.value)})]}),e.jsxs("label",{children:["雰囲気",e.jsx("input",{"aria-label":"雰囲気",value:O,onChange:t=>We(t.target.value)})]}),e.jsxs("label",{children:["Lore",e.jsx("textarea",{"aria-label":"世界観やルール",value:R,onChange:t=>_e(t.target.value)})]}),e.jsx("button",{onClick:()=>x("世界観"),children:"矛盾をチェック"})]}),n==="ai"&&e.jsxs("section",{className:"wizard-panel","aria-label":"AI裁量",children:[e.jsxs("p",{children:[e.jsxs("strong",{children:[p.help,"。"]}),"物語が暴走しない範囲と、AIに展開を広げてもらう範囲を明示します。"]}),e.jsxs("label",{children:["AI裁量",e.jsxs("select",{"aria-label":"AI裁量",value:k,onChange:t=>qe(t.target.value),children:[e.jsx("option",{children:"低: 厳密に守る"}),e.jsx("option",{children:"中: 設定を守りつつ提案する"}),e.jsx("option",{children:"高: 展開を広げる"})]})]})]}),n==="hero"&&e.jsxs("section",{className:"wizard-panel","aria-label":"主人公",children:[e.jsxs("p",{children:[e.jsxs("strong",{children:[p.help,"。"]}),"導入で毎回説明しなくてよい条件を置きます。セッション側で上書きできる余地も残します。"]}),e.jsxs("label",{children:["主人公の前提",e.jsx("textarea",{"aria-label":"主人公の前提",value:N,onChange:t=>Je(t.target.value)})]})]}),n==="opening"&&e.jsxs("section",{className:"wizard-panel","aria-label":"第一場面",children:[e.jsxs("p",{children:[e.jsxs("strong",{children:[p.help,"。"]}),"開始シーンを固定すると、毎回同じ導入から物語を始められます。未入力ならAI生成です。"]}),e.jsxs("label",{children:["開始シーン",e.jsx("textarea",{"aria-label":"開始シーン",value:V,onChange:t=>Ke(t.target.value)})]})]}),n==="illustration"&&e.jsxs("section",{className:"wizard-panel","aria-label":"挿絵の筆致",children:[e.jsxs("p",{children:[e.jsxs("strong",{children:[p.help,"。"]}),"テイスト、ムード、禁止要素を登録し、本番前に保存されないプレビューで確認します。"]}),e.jsxs("label",{children:["画風",e.jsx("input",{"aria-label":"挿絵の画風",value:D,onChange:t=>Qe(t.target.value)})]}),e.jsxs("label",{children:["ムード",e.jsx("input",{"aria-label":"挿絵のムード",value:Xe,onChange:t=>Ye(t.target.value)})]}),e.jsxs("label",{children:["NG要素",e.jsx("textarea",{"aria-label":"挿絵の禁止要素",value:P,onChange:t=>Ze(t.target.value)})]}),e.jsxs("label",{children:["サンプルシーン",e.jsx("textarea",{"aria-label":"サンプルシーン",value:ea,onChange:t=>aa(t.target.value)})]}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{onClick:()=>x("挿絵テイスト"),children:"画風を相談"}),e.jsx("button",{onClick:()=>x("挿絵プロンプト"),children:"プロンプトを生成"}),e.jsx("button",{className:"primary",onClick:ya,children:"サンプルシーンで生成"})]})]}),e.jsxs("nav",{className:"wizard-actions","aria-label":"ウィザード操作",children:[e.jsx("button",{onClick:()=>M(-1),disabled:y===0,children:"戻る"}),e.jsx("button",{className:"primary",onClick:()=>M(1),disabled:y===m.length-1,children:"次へ"})]})]}),e.jsxs("aside",{className:"ai-bookmark wizard-summary","aria-label":"入力サマリー",children:[e.jsx("h2",{children:"サマリー"}),e.jsxs("label",{children:["相談先",e.jsxs("select",{"aria-label":"相談先AI",value:$,onChange:t=>ia(t.target.value),children:[e.jsx("option",{children:"文章AI"}),e.jsx("option",{children:"挿絵AI"}),e.jsx("option",{children:"ルール確認AI"})]})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"表紙"}),e.jsx("p",{children:a||"タイトル未入力"}),e.jsx("p",{children:z||"概要は空でも保存できます"})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"この登録でAIが読む契約"}),e.jsxs("p",{children:["Genre: ",F]}),e.jsxs("p",{children:["Tone: ",O]}),e.jsxs("p",{children:["Lore: ",R.split(`
`).filter(Boolean).length,"項目"]}),e.jsxs("p",{children:["AI裁量: ",k]})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"主人公と第一場面"}),e.jsx("p",{children:N}),e.jsx("p",{children:V})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"挿絵"}),e.jsx("p",{children:D}),e.jsxs("p",{children:["NG: ",P]})]}),e.jsxs("article",{"data-testid":"ai-suggestion",children:[e.jsx("h3",{children:"提案候補"}),e.jsx("p",{children:ca})]}),e.jsxs("article",{"data-testid":"illustration-preview",children:[e.jsx("h3",{children:"挿絵プレビュー"}),e.jsx("p",{children:ra})]})]})]})})}Pe.__docgenInfo={description:"",methods:[],displayName:"ScenarioRegistrationWireframe"};const ha={title:"Scenario registration/Wireframe from user stories",component:Pe,parameters:{notes:"docs/user-stories/scenario-registration.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。"}},l=async(n,s)=>{await c.click(n.getByRole("button",{name:`${s}へ`}))},u={name:"US-01: 新しいシナリオを作成したい",play:async({canvasElement:n,step:s})=>{const a=r(n);await s("タイトル未入力では、下書き保存に必要な項目を説明する",async()=>{await c.click(a.getByRole("button",{name:"下書き保存"})),await i(a.getByTestId("scenario-notice")).toHaveTextContent("タイトルを入力すると下書き保存できます。")}),await s("タイトルだけ入力してDraft保存し、ScenarioIdを発行する",async()=>{await c.type(a.getByLabelText("シナリオタイトル"),"星喰いの地下図書館"),await c.click(a.getByRole("button",{name:"下書き保存"})),await i(a.getByTestId("scenario-notice")).toHaveTextContent("Draftとして保存しました"),await i(a.getByText("SCN-DRAFT-0427")).toBeVisible()})}},d={name:"US-02: ジャンルや雰囲気を指定したい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"世界の掟"),await s("ジャンルと雰囲気を入力し、AIが読む契約に即時反映する",async()=>{await c.clear(a.getByLabelText("ジャンル")),await c.type(a.getByLabelText("ジャンル"),"ポストアポカリプス巡礼譚"),await c.clear(a.getByLabelText("雰囲気")),await c.type(a.getByLabelText("雰囲気"),"乾いた祈り、淡い希望"),await i(a.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("ポストアポカリプス巡礼譚"),await i(a.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("乾いた祈り、淡い希望")})}},w={name:"US-03: 世界観や前提条件を設定したい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"世界の掟"),await s("世界観やルールをLoreとして入力する",async()=>{await c.clear(a.getByLabelText("世界観やルール")),await c.type(a.getByLabelText("世界観やルール"),`魔法は星図を燃料にする。
王都の外では朝が来ない。`),await i(a.getByText("世界の掟")).toBeVisible(),await i(a.getByRole("complementary",{name:"入力サマリー"})).toHaveTextContent("Lore: 2項目")})}},S={name:"US-04: AIの裁量レベルを調整したい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"AI裁量"),await s("AI裁量を高へ変更し、生成時の挙動差を明示する",async()=>{await c.selectOptions(a.getByLabelText("AI裁量"),"高: 展開を広げる"),await i(a.getByLabelText("AI裁量")).toHaveValue("高: 展開を広げる"),await i(a.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("高: 展開を広げる")})}},T={name:"US-05: 初期キャラクター条件を設定したい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"主人公"),await s("主人公の立場と名前の扱いを入力する",async()=>{await c.clear(a.getByLabelText("主人公の前提")),await c.type(a.getByLabelText("主人公の前提"),"主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で上書き可能。"),await i(a.getByLabelText("主人公の前提")).toHaveValue(i.stringContaining("新人地図師")),await i(a.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("主人公")})}},b={name:"US-06: シナリオの開始シーンを定義したい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"第一場面"),await s("開始シーンを固定し、初回Narrativeの材料にする",async()=>{await c.clear(a.getByLabelText("開始シーン")),await c.type(a.getByLabelText("開始シーン"),"あなたは灰の降る駅で、宛名のない切符を握っている。"),await i(a.getByLabelText("開始シーン")).toHaveValue(i.stringContaining("灰の降る駅")),await i(a.getByRole("complementary",{name:"契約の背表紙"})).toHaveTextContent("固定")})}},h={name:"US-11: 挿絵のテイストを指定したい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"挿絵"),await s("文章と視覚表現を揃える画風を指定する",async()=>{await c.clear(a.getByLabelText("挿絵の画風")),await c.type(a.getByLabelText("挿絵の画風"),"古い天文図の銅版画、インクの滲み、低彩度"),await i(a.getByLabelText("挿絵の画風")).toHaveValue(i.stringContaining("銅版画"))})}},B={name:"US-12: 挿絵の雰囲気を指定したい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"挿絵"),await s("挿絵生成に使う感情的トーンを複数指定する",async()=>{await c.clear(a.getByLabelText("挿絵のムード")),await c.type(a.getByLabelText("挿絵のムード"),"孤独、湿度、薄明、遠い鐘の音"),await i(a.getByLabelText("挿絵のムード")).toHaveValue(i.stringContaining("薄明"))})}},I={name:"US-13: 挿絵の禁止要素を指定したい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"挿絵"),await s("年齢制限や世界観を守るNG要素を入力する",async()=>{await c.clear(a.getByLabelText("挿絵の禁止要素")),await c.type(a.getByLabelText("挿絵の禁止要素"),"現代兵器、スマートフォン、過度な流血"),await i(a.getByLabelText("挿絵の禁止要素")).toHaveValue(i.stringContaining("スマートフォン"))})}},j={name:"US-14: 挿絵を事前にプレビューしたい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"挿絵"),await s("サンプルシーンを入力し、本番相当の挿絵を保存せず生成する",async()=>{await c.clear(a.getByLabelText("サンプルシーン")),await c.type(a.getByLabelText("サンプルシーン"),"地下書庫の水面に星座が反射している。"),await c.click(a.getByRole("button",{name:"サンプルシーンで生成"})),await i(a.getByTestId("illustration-preview")).toHaveTextContent("保存対象外"),await i(a.getByTestId("scenario-notice")).toHaveTextContent("まだ確定していません")})}},C={name:"US-15: プレビューを見ながら挿絵設定を調整したい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"挿絵"),await s("設定を変更して再生成し、納得した設定のみ保存対象にする",async()=>{await c.clear(a.getByLabelText("挿絵の画風")),await c.type(a.getByLabelText("挿絵の画風"),"影絵、余白多め、灯火だけ金色"),await c.click(a.getByRole("button",{name:"サンプルシーンで生成"})),await i(a.getByLabelText("挿絵の画風")).toHaveValue(i.stringContaining("影絵")),await i(a.getByTestId("scenario-notice")).toHaveTextContent("設定はまだ確定していません")})}},A={name:"US-17: 登録内容をAIに相談したい",play:async({canvasElement:n,step:s})=>{const a=r(n);await s("AIに相談しても、提案は自動確定しない",async()=>{await c.click(a.getByRole("button",{name:"AIに概要案を出してもらう"})),await i(a.getByTestId("ai-suggestion")).toHaveTextContent("概要案を3つ提示しました"),await i(a.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},L={name:"US-18: どのAIに聞くかを選択したい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"挿絵"),await s("用途に合わせて相談先AIを選び、選択したAIで提案を生成する",async()=>{await c.selectOptions(a.getByLabelText("相談先AI"),"挿絵AI"),await c.click(a.getByRole("button",{name:"画風を相談"})),await i(a.getByLabelText("相談先AI")).toHaveValue("挿絵AI"),await i(a.getByTestId("scenario-notice")).toHaveTextContent("挿絵AIに挿絵テイストを相談しました")})}},E={name:"US-19: シナリオ概要をAIに補完してもらいたい",play:async({canvasElement:n,step:s})=>{const a=r(n);await s("概要候補を見て、採用してから編集可能な本文に入れる",async()=>{await c.click(a.getByRole("button",{name:"AIに概要案を出してもらう"})),await c.click(a.getByRole("button",{name:"採用して編集"})),await i(a.getByLabelText("概要")).toHaveValue(i.stringContaining("地下に沈んだ王都")),await i(a.getByTestId("scenario-notice")).toHaveTextContent("採用しました")})}},U={name:"US-20: 世界観設定をAIにチェックしてもらいたい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"世界の掟"),await s("Loreの矛盾や不足をチェックし、理由を確認する",async()=>{await c.click(a.getByRole("button",{name:"矛盾をチェック"})),await i(a.getByTestId("ai-suggestion")).toHaveTextContent("矛盾候補"),await i(a.getByTestId("scenario-notice")).toHaveTextContent("自動確定はしません")})}},H={name:"US-21: 挿絵テイストをAIに相談したい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"挿絵"),await s("シナリオに合う画風候補をAIに提示してもらう",async()=>{await c.click(a.getByRole("button",{name:"画風を相談"})),await i(a.getByTestId("ai-suggestion")).toHaveTextContent("画風候補"),await i(a.getByTestId("ai-suggestion")).toHaveTextContent("銅版画風")})}},f={name:"US-22: 挿絵プロンプトをAIに生成させたい",play:async({canvasElement:n,step:s})=>{const a=r(n);await l(a,"挿絵"),await s("画像生成用プロンプトとネガティブを分離して出力する",async()=>{await c.click(a.getByRole("button",{name:"プロンプトを生成"})),await i(a.getByTestId("ai-suggestion")).toHaveTextContent("ネガティブプロンプト"),await i(a.getByTestId("scenario-notice")).toHaveTextContent("挿絵プロンプトを相談しました")})}};var W,_,q;u.parameters={...u.parameters,docs:{...(W=u.parameters)==null?void 0:W.docs,source:{originalSource:`{
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
}`,...(q=(_=u.parameters)==null?void 0:_.docs)==null?void 0:q.source}}};var J,K,Q;d.parameters={...d.parameters,docs:{...(J=d.parameters)==null?void 0:J.docs,source:{originalSource:`{
  name: 'US-02: ジャンルや雰囲気を指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '世界の掟');
    await step('ジャンルと雰囲気を入力し、AIが読む契約に即時反映する', async () => {
      await userEvent.clear(canvas.getByLabelText('ジャンル'));
      await userEvent.type(canvas.getByLabelText('ジャンル'), 'ポストアポカリプス巡礼譚');
      await userEvent.clear(canvas.getByLabelText('雰囲気'));
      await userEvent.type(canvas.getByLabelText('雰囲気'), '乾いた祈り、淡い希望');
      await expect(canvas.getByRole('complementary', {
        name: '入力サマリー'
      })).toHaveTextContent('ポストアポカリプス巡礼譚');
      await expect(canvas.getByRole('complementary', {
        name: '入力サマリー'
      })).toHaveTextContent('乾いた祈り、淡い希望');
    });
  }
}`,...(Q=(K=d.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};var X,Y,Z;w.parameters={...w.parameters,docs:{...(X=w.parameters)==null?void 0:X.docs,source:{originalSource:`{
  name: 'US-03: 世界観や前提条件を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '世界の掟');
    await step('世界観やルールをLoreとして入力する', async () => {
      await userEvent.clear(canvas.getByLabelText('世界観やルール'));
      await userEvent.type(canvas.getByLabelText('世界観やルール'), '魔法は星図を燃料にする。\\n王都の外では朝が来ない。');
      await expect(canvas.getByText('世界の掟')).toBeVisible();
      await expect(canvas.getByRole('complementary', {
        name: '入力サマリー'
      })).toHaveTextContent('Lore: 2項目');
    });
  }
}`,...(Z=(Y=w.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var ee,ae,te;S.parameters={...S.parameters,docs:{...(ee=S.parameters)==null?void 0:ee.docs,source:{originalSource:`{
  name: 'US-04: AIの裁量レベルを調整したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'AI裁量');
    await step('AI裁量を高へ変更し、生成時の挙動差を明示する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('AI裁量'), '高: 展開を広げる');
      await expect(canvas.getByLabelText('AI裁量')).toHaveValue('高: 展開を広げる');
      await expect(canvas.getByRole('complementary', {
        name: '契約の背表紙'
      })).toHaveTextContent('高: 展開を広げる');
    });
  }
}`,...(te=(ae=S.parameters)==null?void 0:ae.docs)==null?void 0:te.source}}};var ne,se,ie;T.parameters={...T.parameters,docs:{...(ne=T.parameters)==null?void 0:ne.docs,source:{originalSource:`{
  name: 'US-05: 初期キャラクター条件を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '主人公');
    await step('主人公の立場と名前の扱いを入力する', async () => {
      await userEvent.clear(canvas.getByLabelText('主人公の前提'));
      await userEvent.type(canvas.getByLabelText('主人公の前提'), '主人公は失踪した師匠を追う新人地図師。名前と年齢はセッション側で上書き可能。');
      await expect(canvas.getByLabelText('主人公の前提')).toHaveValue(expect.stringContaining('新人地図師'));
      await expect(canvas.getByRole('complementary', {
        name: '契約の背表紙'
      })).toHaveTextContent('主人公');
    });
  }
}`,...(ie=(se=T.parameters)==null?void 0:se.docs)==null?void 0:ie.source}}};var ce,oe,re;b.parameters={...b.parameters,docs:{...(ce=b.parameters)==null?void 0:ce.docs,source:{originalSource:`{
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
      await expect(canvas.getByLabelText('開始シーン')).toHaveValue(expect.stringContaining('灰の降る駅'));
      await expect(canvas.getByRole('complementary', {
        name: '契約の背表紙'
      })).toHaveTextContent('固定');
    });
  }
}`,...(re=(oe=b.parameters)==null?void 0:oe.docs)==null?void 0:re.source}}};var le,pe,ve;h.parameters={...h.parameters,docs:{...(le=h.parameters)==null?void 0:le.docs,source:{originalSource:`{
  name: 'US-11: 挿絵のテイストを指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('文章と視覚表現を揃える画風を指定する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の画風'));
      await userEvent.type(canvas.getByLabelText('挿絵の画風'), '古い天文図の銅版画、インクの滲み、低彩度');
      await expect(canvas.getByLabelText('挿絵の画風')).toHaveValue(expect.stringContaining('銅版画'));
    });
  }
}`,...(ve=(pe=h.parameters)==null?void 0:pe.docs)==null?void 0:ve.source}}};var ye,ge,me;B.parameters={...B.parameters,docs:{...(ye=B.parameters)==null?void 0:ye.docs,source:{originalSource:`{
  name: 'US-12: 挿絵の雰囲気を指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('挿絵生成に使う感情的トーンを複数指定する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵のムード'));
      await userEvent.type(canvas.getByLabelText('挿絵のムード'), '孤独、湿度、薄明、遠い鐘の音');
      await expect(canvas.getByLabelText('挿絵のムード')).toHaveValue(expect.stringContaining('薄明'));
    });
  }
}`,...(me=(ge=B.parameters)==null?void 0:ge.docs)==null?void 0:me.source}}};var xe,ue,de;I.parameters={...I.parameters,docs:{...(xe=I.parameters)==null?void 0:xe.docs,source:{originalSource:`{
  name: 'US-13: 挿絵の禁止要素を指定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('年齢制限や世界観を守るNG要素を入力する', async () => {
      await userEvent.clear(canvas.getByLabelText('挿絵の禁止要素'));
      await userEvent.type(canvas.getByLabelText('挿絵の禁止要素'), '現代兵器、スマートフォン、過度な流血');
      await expect(canvas.getByLabelText('挿絵の禁止要素')).toHaveValue(expect.stringContaining('スマートフォン'));
    });
  }
}`,...(de=(ue=I.parameters)==null?void 0:ue.docs)==null?void 0:de.source}}};var we,Se,Te;j.parameters={...j.parameters,docs:{...(we=j.parameters)==null?void 0:we.docs,source:{originalSource:`{
  name: 'US-14: 挿絵を事前にプレビューしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
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
}`,...(Te=(Se=j.parameters)==null?void 0:Se.docs)==null?void 0:Te.source}}};var be,he,Be;C.parameters={...C.parameters,docs:{...(be=C.parameters)==null?void 0:be.docs,source:{originalSource:`{
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
      await expect(canvas.getByLabelText('挿絵の画風')).toHaveValue(expect.stringContaining('影絵'));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('設定はまだ確定していません');
    });
  }
}`,...(Be=(he=C.parameters)==null?void 0:he.docs)==null?void 0:Be.source}}};var Ie,je,Ce;A.parameters={...A.parameters,docs:{...(Ie=A.parameters)==null?void 0:Ie.docs,source:{originalSource:`{
  name: 'US-17: 登録内容をAIに相談したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('AIに相談しても、提案は自動確定しない', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに概要案を出してもらう'
      }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('概要案を3つ提示しました');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('自動確定はしません');
    });
  }
}`,...(Ce=(je=A.parameters)==null?void 0:je.docs)==null?void 0:Ce.source}}};var Ae,Le,Ee;L.parameters={...L.parameters,docs:{...(Ae=L.parameters)==null?void 0:Ae.docs,source:{originalSource:`{
  name: 'US-18: どのAIに聞くかを選択したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('用途に合わせて相談先AIを選び、選択したAIで提案を生成する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('相談先AI'), '挿絵AI');
      await userEvent.click(canvas.getByRole('button', {
        name: '画風を相談'
      }));
      await expect(canvas.getByLabelText('相談先AI')).toHaveValue('挿絵AI');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('挿絵AIに挿絵テイストを相談しました');
    });
  }
}`,...(Ee=(Le=L.parameters)==null?void 0:Le.docs)==null?void 0:Ee.source}}};var Ue,He,fe;E.parameters={...E.parameters,docs:{...(Ue=E.parameters)==null?void 0:Ue.docs,source:{originalSource:`{
  name: 'US-19: シナリオ概要をAIに補完してもらいたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('概要候補を見て、採用してから編集可能な本文に入れる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AIに概要案を出してもらう'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '採用して編集'
      }));
      await expect(canvas.getByLabelText('概要')).toHaveValue(expect.stringContaining('地下に沈んだ王都'));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('採用しました');
    });
  }
}`,...(fe=(He=E.parameters)==null?void 0:He.docs)==null?void 0:fe.source}}};var Re,ke,Ne;U.parameters={...U.parameters,docs:{...(Re=U.parameters)==null?void 0:Re.docs,source:{originalSource:`{
  name: 'US-20: 世界観設定をAIにチェックしてもらいたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '世界の掟');
    await step('Loreの矛盾や不足をチェックし、理由を確認する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '矛盾をチェック'
      }));
      await expect(canvas.getByTestId('ai-suggestion')).toHaveTextContent('矛盾候補');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('自動確定はしません');
    });
  }
}`,...(Ne=(ke=U.parameters)==null?void 0:ke.docs)==null?void 0:Ne.source}}};var Ve,De,ze;H.parameters={...H.parameters,docs:{...(Ve=H.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
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
}`,...(ze=(De=H.parameters)==null?void 0:De.docs)==null?void 0:ze.source}}};var Ge,Fe,Oe;f.parameters={...f.parameters,docs:{...(Ge=f.parameters)==null?void 0:Ge.docs,source:{originalSource:`{
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
}`,...(Oe=(Fe=f.parameters)==null?void 0:Fe.docs)==null?void 0:Oe.source}}};const Ba=["US01CreateDraftScenario","US02SpecifyGenreAndTone","US03DefineLoreContract","US04TuneAiFreedom","US05SetInitialCharacter","US06DefineOpeningScene","US11SpecifyIllustrationStyle","US12SpecifyIllustrationMood","US13SpecifyNegativeElements","US14PreviewIllustration","US15IterateIllustrationSettings","US17ConsultAiAboutRegistration","US18SelectAiByPurpose","US19AiCompletesSummary","US20AiChecksLore","US21ConsultIllustrationTaste","US22GenerateIllustrationPrompt"];export{u as US01CreateDraftScenario,d as US02SpecifyGenreAndTone,w as US03DefineLoreContract,S as US04TuneAiFreedom,T as US05SetInitialCharacter,b as US06DefineOpeningScene,h as US11SpecifyIllustrationStyle,B as US12SpecifyIllustrationMood,I as US13SpecifyNegativeElements,j as US14PreviewIllustration,C as US15IterateIllustrationSettings,A as US17ConsultAiAboutRegistration,L as US18SelectAiByPurpose,E as US19AiCompletesSummary,U as US20AiChecksLore,H as US21ConsultIllustrationTaste,f as US22GenerateIllustrationPrompt,Ba as __namedExportsOrder,ha as default};
