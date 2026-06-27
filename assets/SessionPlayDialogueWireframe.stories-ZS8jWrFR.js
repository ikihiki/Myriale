import{w as l,e as n,u as o}from"./index-C3Z0PGzo.js";import{j as a}from"./jsx-runtime-Cf8x2fCZ.js";import{r as p}from"./index-BlmOqGMO.js";import{A as It}from"./AppChrome-DEx1aaG4.js";import{S as Bt}from"./SessionTurn-DWZJ2ukf.js";/* empty css               */import"./index-yBjzXJbu.js";const Ct=[{id:1,turnTitle:"水没した閲覧室で目覚める",narrative:"あなたは水没した閲覧室で目を覚ます。膝まで届く黒い水の上を星図灯の光が揺れ、崩れた書架の奥から誰かの咳払いが聞こえる。直近では、あなたの懐に濡れていない銀の鍵が残されていた。",kind:"action"},{id:2,turnTitle:"銀の鍵を確かめる",playerInput:"懐の銀の鍵を取り出して刻印を見る",interpretation:"所持品確認として解釈しました。目的は銀の鍵の由来と使い道を知ることです。",narrative:"鍵の柄には、星座ではなく空白の円が刻まれていた。指でなぞると、水面にまだ開いていない扉の輪郭が一瞬だけ浮かび、すぐに黒い波紋へ戻る。",kind:"action"},{id:3,turnTitle:"周囲を警戒する",playerInput:"音を立てないように周囲を調べる",interpretation:"探索行動として解釈しました。危険確認と移動先の発見が目的です。",narrative:"倒れた書架の陰に、濡れていない足跡が続いている。足跡は奥の閲覧机で途切れ、その上には新しいインクで「名前を答えるな」とだけ書かれていた。",kind:"action"},{id:4,turnTitle:"書架の奥の人物に気づく",playerInput:"咳払いのした方へ声をかける",interpretation:"NPCへの会話として解釈しました。対象は書架の奥にいる人物です。",narrative:"濡れた外套の人物が、半壊した索引棚の影から姿を見せる。「鍵を持つ者がまた来たか」と言い、あなたの名前ではなく、あなたが失ったはずの記憶を尋ねてくる。会話内容はセッション文脈に記録される。",kind:"action"},{id:5,turnTitle:"名前を聞かれて沈黙する",playerInput:"名前は答えず、ここがどこかを尋ねる",interpretation:"警戒しながら情報収集する会話として解釈しました。",narrative:"人物は満足げにうなずく。「賢い。ここは星を食べ終えた図書館だ。名を渡せば、棚の一部になる」。その声には脅しよりも忠告の響きがある。",kind:"action"},{id:6,turnTitle:"状況を要約してもらう",playerInput:"今の状況を簡単にまとめて",narrative:"補足説明: あなたは水没した地下図書館で目覚め、銀の鍵を持っています。書架の奥の人物は敵とは限らず、名前を答える危険を警告しています。この返答は理解補助であり、物語進行は変化しません。",kind:"clarification"},{id:7,turnTitle:"閉じた星座の話を聞く",playerInput:"銀の鍵で何を開けられるのか聞く",interpretation:"NPCから鍵の用途を聞き出す会話として解釈しました。",narrative:"「閉じた星座だ」と人物は答える。「開けば出口も過去も見える。だが、どちらを選ぶかで失うものが違う」。水面の下で、星図のような光がゆっくり回り始める。",kind:"action"},{id:8,turnTitle:"螺旋階段へ向かう",playerInput:"人物に礼を言い、足跡の先の螺旋階段へ進む",interpretation:"移動と探索の継続として解釈しました。NPCとの会話文脈を保持します。",narrative:"螺旋階段は水面の下へ伸びているはずなのに、足を踏み入れると靴底は乾いた石を捉えた。背後で人物が「灯りが消えたら、鍵ではなく声を使え」と告げる。",kind:"action"},{id:9,turnTitle:"星図灯が弱まる",playerInput:"星図灯を掲げて階段を下りる",interpretation:"慎重な移動として解釈しました。光源の状態変化を確認します。",narrative:"数段下りるたびに星図灯の光は細くなり、代わりに壁の文字が明るく浮かぶ。「ここから先は、選ばなかった行動も記録される」。階段の下で扉がひとつだけ待っている。",kind:"action"},{id:10,turnTitle:"直前の判断を迷う",playerInput:"扉を開ける前に、戻れる道があるか確認する",interpretation:"リスク確認として解釈しました。分岐前の安全確認です。",narrative:"振り返ると、階段はまだ存在している。ただし水面に映るあなたは、扉へ手を伸ばしている。戻ることはできるが、戻った事実もまた図書館に読まれるだろう。",kind:"action"},{id:11,turnTitle:"閉じた星座の扉に触れる",playerInput:"銀の鍵を使わず、まず扉の模様に触れる",interpretation:"直接開錠ではなく調査として解釈しました。罠や反応を確認します。",narrative:"扉の模様は、あなたが見たことのない星座へ組み替わる。鍵穴は現れない。かわりに扉は、あなたの声で「何を忘れたままでいたい？」と問いかけた。",kind:"action"},{id:12,turnTitle:"入力待ちの静止点",narrative:"AIはここで物語を勝手に進めない。扉は問いを残したまま沈黙し、次の重要な進行はPlayer Inputを待っている。",kind:"action"}],St=[{title:"目覚めと銀の鍵",startTurnId:1,summary:"AIがTurn 01〜03を要約して付けた見出し"},{title:"濡れた書架の声",startTurnId:4,summary:"AIがNPCとの会話開始点として抽出"},{title:"螺旋階段と星図灯",startTurnId:8,summary:"AIが探索場面の切り替わりとして抽出"},{title:"閉じた星座の扉",startTurnId:11,summary:"AIが分岐直前の重要場面として抽出"}],ht=(s,i)=>{const t=s.trim(),d=/話|聞|尋|人物|誰|こんにちは|名/.test(t);return{id:i,turnTitle:d?"銀の鍵を知る人物に問いかける":"警戒しながら次の場面へ踏み出す",playerInput:t,interpretation:d?"NPCへの会話として解釈しました。対象は書架の奥にいる人物、目的は銀の鍵と現在地の確認です。":"探索行動として解釈しました。目的は周囲の安全確認と、閲覧室から出る経路の発見です。",narrative:d?"書架の奥の人物は濡れた外套を絞りながら、あなたの銀の鍵を一瞥する。「それは閉じた星座を開くものだ。だが、名前を告げる前に、君が何を忘れたのか確かめたい」と、警戒と興味の混じった声で答える。会話内容はセッション文脈に記録される。":"あなたが足音を殺して進むと、水面の下でページが一斉にめくれた。出口と思われる螺旋階段は見つかるが、手すりには乾いた血ではなく、古いインクが付着している。成功した確認と、想定外の痕跡が次の判断材料になる。",kind:"action"}};function lt(){var E;const[s,i]=p.useState(Ct),[t,d]=p.useState(""),[v,T]=p.useState(1),[f,c]=p.useState("Session状態はActiveです。AIが現在地、周囲、直近の出来事をNarrativeとして提示しました。"),[g,dt]=p.useState([]),[m,k]=p.useState(null),N=p.useMemo(()=>s.find(e=>e.id===v)??s[s.length-1],[v,s]),x=s[s.length-1],I=St.filter(e=>e.startTurnId<=x.id),j=((E=I[I.length-1])==null?void 0:E.startTurnId)===x.id?I:[...I,{title:"最新の対話",startTurnId:x.id,summary:"AIが付けた最新の見出し。TOC末尾は常に最後のTurnを指す"}],u=j.find((e,r)=>{const w=j[r+1];return v>=e.startTurnId&&(!w||v<w.startTurnId)}),U=p.useRef({});p.useEffect(()=>{const e=U.current[v];e&&typeof e.scrollIntoView=="function"&&e.scrollIntoView({block:"nearest",behavior:"smooth"})},[v,s]);const ut=()=>{if(!t.trim()){c("自然言語で行動や会話を入力してください。文法が不完全でも受理します。");return}const e=ht(t,s.length+1);i(r=>[...r,e]),T(e.id),d(""),c("Player Inputを行動として解釈し、結果をNarrativeとして生成しました。次の重要な進行は入力待ちです。")},pt=()=>{const e={id:s.length+1,turnTitle:"状況の再説明",playerInput:"今の状況を簡単にまとめて",narrative:"補足説明: あなたは水没した閲覧室にいて、銀の鍵を持っています。書架の奥には会話できそうな人物がいます。この返答は理解補助であり、物語進行や世界状態は変化しません。",kind:"clarification"};i(r=>[...r,e]),T(e.id),c("補足要求として扱いました。行動ではないため、セッション状態と物語進行は変化しません。")},vt=e=>{const r=!g.includes(e.id);dt(w=>r?[...w,e.id]:w.filter(xt=>xt!==e.id)),r&&c("入力直下に内部解釈を表示しました。意図とのズレがあれば、削除・やり直しできます。")},yt=()=>{d(""),c("削除: 入力欄の未送信テキストを無効化しました。再入力できます。")},Tt=()=>{if(s.length===1){c("巻き戻せる直前ターンがありません。");return}const e=s.slice(0,-1);i(e),T(e[e.length-1].id),c("やり直し: 直前ターンを巻き戻しました。AIコンテキストを再構築し、同じ地点から再入力できます。")},mt=e=>{T(e.startTurnId),c(`AI見出し「${e.title}」から、場面の切り替わりTurn ${String(e.startTurnId).padStart(2,"0")}へジャンプしました。ReadOnly表示のためSession状態は変化しません。`)},gt=e=>{k(e),c(`Turn ${String(e).padStart(2,"0")}まで戻る前に確認します。指定ターン以降のログと非同期処理を無効化します。`)},wt=()=>{if(m==null)return;const e=s.filter(r=>r.id<=m).map(r=>r.id===m?{...r,turnTitle:`${r.turnTitle}（巻き戻し地点）`}:r);i(e),T(m),k(null),c("ここまで戻る: 指定ターン以降のログを無効化し、AIコンテキストを再構築しました。巻き戻し地点から再入力できます。")};return a.jsx(It,{section:"sessions",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"セッション",to:"startSession"},{label:"プレイ中の対話"}],account:{name:"霧野しおり",email:"reader@myriale.example",initials:"霧野",role:"プレイヤー"},children:a.jsxs("div",{className:"scenario-forge scenario-forge-wizard session-play-wireframe",children:[a.jsxs("aside",{className:"contract-spine","aria-label":"AI見出しリンクTOC",children:[a.jsx("strong",{children:"AI Headings"}),a.jsx("p",{className:"toc-help",children:"各Turnではなく、AIがログの区切りに付けた見出しです。選択すると、その場面が始まるTurnへジャンプします。"}),a.jsx("div",{className:"wizard-step-list",role:"list","aria-label":"AI生成見出しリンク",children:j.map(e=>a.jsxs("button",{className:`spine-row spine-step ${(u==null?void 0:u.title)===e.title?"active":""}`,onClick:()=>mt(e),"aria-label":`見出し「${e.title}」へ（Turn ${String(e.startTurnId).padStart(2,"0")}から）`,"aria-current":(u==null?void 0:u.title)===e.title?"step":void 0,"data-testid":`heading-link-${e.startTurnId}`,children:[a.jsx("span",{children:e.title}),a.jsxs("small",{children:["Turn ",String(e.startTurnId).padStart(2,"0"),"から / ",e.summary]})]},e.title))}),a.jsxs("div",{className:"scenario-id",children:[a.jsx("span",{children:"Session state"}),a.jsx("b",{"data-testid":"session-state",children:"Active"})]})]}),a.jsxs("main",{className:"forge-paper wizard-paper","aria-label":"AI対話モード",children:[a.jsx("p",{className:"kicker",children:"Session play / AI dialogue mode"}),a.jsx("div",{className:"notice",role:"status","data-testid":"dialogue-notice",children:f}),a.jsxs("div",{className:"wizard-progress","aria-label":"対話ループ",children:[a.jsx("span",{children:String(x.id).padStart(2,"0")}),a.jsx("strong",{children:"Narrative → Input → Narrative"}),a.jsx("small",{"data-testid":"input-waiting",children:"AIは重要な進行の前に必ずPlayer Inputを待ちます"})]}),a.jsx("section",{className:"dialogue-log","aria-label":"対話ログ","data-testid":"dialogue-log",children:s.map(e=>a.jsx(Bt,{articleRef:r=>{U.current[e.id]=r},ariaLabel:`Turn ${String(e.id).padStart(2,"0")}`,selected:v===e.id,headingActions:a.jsx("button",{onClick:()=>gt(e.id),children:"ここまで戻る"}),narrative:e.narrative,narrativeTestId:`turn-${e.id}-narrative`,lead:e.playerInput?{tone:"player",tag:"⟶",srLabel:"プレイヤーの入力: ",text:e.playerInput,actions:e.interpretation?a.jsx("button",{type:"button",className:"interpretation-toggle","aria-pressed":g.includes(e.id),"aria-label":`Turn ${String(e.id).padStart(2,"0")}の入力解釈を${g.includes(e.id)?"隠す":"見る"}`,onClick:()=>vt(e),children:g.includes(e.id)?"⌄ 解釈を隠す":"⌃ どう解釈された？"}):void 0,detail:e.interpretation&&g.includes(e.id)?a.jsxs("p",{className:"interpretation","data-testid":`turn-${e.id}-interpretation`,children:[a.jsx("span",{className:"interpretation-glyph","aria-hidden":"true",children:"⚙"}),e.interpretation]}):void 0}:void 0},e.id))}),m!=null&&a.jsxs("section",{className:"rewind-dialog",role:"dialog","aria-label":"巻き戻し確認","data-testid":"rewind-dialog",children:[a.jsxs("strong",{children:["Turn ",String(m).padStart(2,"0"),"まで戻りますか？"]}),a.jsx("p",{children:"指定ターン以降のログ、挿絵生成などの非同期処理を無効化またはキャンセルします。"}),a.jsxs("div",{className:"button-row",children:[a.jsx("button",{className:"primary",onClick:wt,children:"巻き戻しを確定"}),a.jsx("button",{onClick:()=>k(null),children:"キャンセル"})]})]}),a.jsxs("section",{className:"dialogue-composer","aria-label":"自然言語入力",children:[a.jsxs("label",{children:["自由に行動や会話を入力",a.jsx("textarea",{"aria-label":"自由に行動や会話を入力",value:t,onChange:e=>d(e.target.value),placeholder:"例: 酒場の奥にいる人物に話しかける / 周囲を警戒しながら村を出る"})]}),a.jsxs("div",{className:"button-row",children:[a.jsx("button",{className:"primary",onClick:ut,children:"行動を送る"}),a.jsx("button",{onClick:pt,children:"状況を簡単にまとめて聞く"}),a.jsx("button",{onClick:yt,children:"削除（入力取り消し）"}),a.jsx("button",{onClick:Tt,children:"やり直し（直前ターン巻き戻し）"})]})]})]}),a.jsxs("aside",{className:"ai-bookmark wizard-summary","aria-label":"セッション状態サマリー",children:[a.jsx("h2",{children:"Play contract"}),a.jsxs("article",{"data-testid":"active-turn-summary",children:[a.jsx("h3",{children:"選択中のTurn"}),a.jsxs("p",{children:[String(N.id).padStart(2,"0")," / ",N.turnTitle]}),a.jsx("p",{children:N.kind==="clarification"?"補足説明: 物語状態は変化しない":"行動結果: Narrativeとして表示"})]}),a.jsxs("article",{"data-testid":"active-heading-summary",children:[a.jsx("h3",{children:"現在のAI見出し"}),a.jsx("p",{children:u?`${u.title}（Turn ${String(u.startTurnId).padStart(2,"0")}から）`:"見出し未生成"}),a.jsx("p",{children:"見出しリンクはTurn一覧ではなく、AIが場面の切り替わりに付けた索引です。"})]}),a.jsxs("article",{children:[a.jsx("h3",{children:"制約"}),a.jsx("p",{children:"ReadOnlyの見出しリンク、直前削除、任意ターン巻き戻し、入力待ちを見える化します。"})]})]})]})})}lt.__docgenInfo={description:"",methods:[],displayName:"SessionPlayDialogueWireframe"};const jt={title:"Session play dialogue/Wireframe from user stories",component:lt,parameters:{notes:"docs/user-stories/session-play-dialogue-user-stories.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。"}},y=async(s,i)=>{const t=s.getByLabelText("自由に行動や会話を入力");await o.clear(t),await o.type(t,i),await o.click(s.getByRole("button",{name:"行動を送る"}))},B={name:"US-P01: AIが現在の状況を語ってほしい",play:async({canvasElement:s,step:i})=>{const t=l(s);await i("ActiveなSessionの開始時に、現在地・周囲・直近の出来事をNarrativeとして表示する",async()=>{await n(t.getByTestId("session-state")).toHaveTextContent("Active"),await n(t.getByTestId("turn-1-narrative")).toHaveTextContent("水没した閲覧室"),await n(t.getByTestId("turn-1-narrative")).toHaveTextContent("銀の鍵"),await n(t.getByRole("status")).toHaveTextContent("現在地、周囲、直近の出来事")})}},C={name:"US-P02/P03: 自然言語で行動を入力し、結果を物語として受け取る",play:async({canvasElement:s,step:i})=>{const t=l(s);await i("自由入力欄に自然な文章で行動を書く",async()=>{await o.type(t.getByLabelText("自由に行動や会話を入力"),"周囲を警戒しながら閲覧室を出る"),await n(t.getByLabelText("自由に行動や会話を入力")).toHaveValue("周囲を警戒しながら閲覧室を出る")}),await i("送信すると行動として解釈され、成功・想定外の展開を含むNarrativeが生成される",async()=>{await o.click(t.getByRole("button",{name:"行動を送る"})),await n(t.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 周囲を警戒しながら閲覧室を出る"),await n(t.getByTestId("dialogue-log")).toHaveTextContent("想定外の痕跡"),await n(t.getByRole("status")).toHaveTextContent("結果をNarrativeとして生成")})}},S={name:"US-P04: NPCと自然に会話したい",play:async({canvasElement:s,step:i})=>{const t=l(s);await i("NPCへの発話を自由入力で送る",async()=>{await y(t,"書架の奥にいる人物に「あなたは誰？」と尋ねる")}),await i("NPCの立場・関係性に沿った返答がNarrativeに入り、会話内容が文脈に残る",async()=>{await n(t.getByTestId("dialogue-log")).toHaveTextContent("書架の奥の人物"),await n(t.getByTestId("dialogue-log")).toHaveTextContent("会話内容はセッション文脈に記録")})}},h={name:"US-P05: AIに補足説明や再説明を求めたい",play:async({canvasElement:s,step:i})=>{const t=l(s);await i("補足説明ボタンから「今の状況を簡単にまとめて」を送る",async()=>{await o.click(t.getByRole("button",{name:"状況を簡単にまとめて聞く"})),await n(t.getByTestId("dialogue-log")).toHaveTextContent("補足説明")}),await i("補足要求は行動扱いにせず、物語進行やSession状態を変化させない",async()=>{await n(t.getByRole("status")).toHaveTextContent("行動ではない"),await n(t.getByTestId("session-state")).toHaveTextContent("Active"),await n(t.getByTestId("active-turn-summary")).toHaveTextContent("物語状態は変化しない")})}},H={name:"US-P06: 自分の入力がどう解釈されたか知りたい",play:async({canvasElement:s,step:i})=>{const t=l(s);await y(t,"酒場の奥にいる人物に話しかける"),await i("解釈トグルはPlayer Inputの直下にあり、押すと内部解釈を表示する",async()=>{await o.click(t.getByRole("button",{name:"Turn 13の入力解釈を見る"})),await n(t.getByTestId("turn-13-interpretation")).toHaveTextContent("NPCへの会話として解釈"),await n(t.getByRole("status")).toHaveTextContent("ズレがあれば、削除・やり直し")}),await i("もう一度押すと解釈を隠せる",async()=>{await o.click(t.getByRole("button",{name:"Turn 13の入力解釈を隠す"})),await n(t.queryByTestId("turn-13-interpretation")).not.toBeInTheDocument()})}},P={name:"US-P07: ボタン操作で直前の行動を取り消してやり直したい",play:async({canvasElement:s,step:i})=>{const t=l(s);await i("未送信の入力は削除ボタンで取り消せる",async()=>{await o.type(t.getByLabelText("自由に行動や会話を入力"),"入力ミス"),await o.click(t.getByRole("button",{name:"削除（入力取り消し）"})),await n(t.getByLabelText("自由に行動や会話を入力")).toHaveValue(""),await n(t.getByRole("status")).toHaveTextContent("入力欄の未送信テキストを無効化")}),await i("送信済みの直前ターンはやり直しボタンで巻き戻せる",async()=>{await y(t,"階段へ急いで向かう"),await n(t.getByTestId("dialogue-log")).toHaveTextContent("階段へ急いで向かう"),await o.click(t.getByRole("button",{name:"やり直し（直前ターン巻き戻し）"})),await n(t.getByTestId("dialogue-log")).not.toHaveTextContent("階段へ急いで向かう"),await n(t.getByRole("status")).toHaveTextContent("直前ターンを巻き戻しました")})}},b={name:"US-P08/P10: 対話だけで進み、AIは入力を待つ",play:async({canvasElement:s,step:i})=>{const t=l(s);await i("Narrative → Input → Narrativeのループが、明示的な「次へ」なしで続く",async()=>{await y(t,"銀の鍵を掲げて反応を見る"),await y(t,"反応した書架へ近づく"),await n(t.getByTestId("dialogue-log")).toHaveTextContent("プレイヤーの入力: 反応した書架へ近づく")}),await i("AIは重要な進行を勝手に進めず、次のPlayer Inputを待っていることを表示する",async()=>{await n(t.getByTestId("input-waiting")).toHaveTextContent("必ずPlayer Inputを待ちます"),await n(t.getByRole("status")).toHaveTextContent("次の重要な進行は入力待ち")})}},A={name:"US-P09: 見出しリンク（TOC）から対話ログを振り返りたい",play:async({canvasElement:s,step:i})=>{const t=l(s);await i("多数のTurnに対して、TOCはTurn一覧ではなくAIが考えた場面見出しを表示する",async()=>{await n(t.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("目覚めと銀の鍵"),await n(t.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("濡れた書架の声"),await n(t.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("螺旋階段と星図灯"),await n(t.getByRole("complementary",{name:"AI見出しリンクTOC"})).toHaveTextContent("閉じた星座の扉"),await n(t.getByRole("article",{name:"Turn 12"})).toBeVisible()}),await i("TOCの末尾は常に最後のTurn（Turn 12）を指す見出しになっている",async()=>{await n(t.getByTestId("heading-link-12")).toHaveTextContent("Turn 12から")}),await i("AI見出しを選ぶと、その見出しが始まる切り替わりTurnへジャンプする",async()=>{await o.click(t.getByRole("button",{name:"見出し「螺旋階段と星図灯」へ（Turn 08から）"})),await n(t.getByRole("status")).toHaveTextContent("場面の切り替わりTurn 08へジャンプ"),await n(t.getByTestId("active-turn-summary")).toHaveTextContent("08 / 螺旋階段へ向かう"),await n(t.getByTestId("active-heading-summary")).toHaveTextContent("螺旋階段と星図灯（Turn 08から）"),await n(t.getByTestId("session-state")).toHaveTextContent("Active")}),await i("末尾の見出しを選ぶと、最後のTurnへジャンプして選択表示される",async()=>{await o.click(t.getByTestId("heading-link-12")),await n(t.getByTestId("active-turn-summary")).toHaveTextContent("12 / 入力待ちの静止点"),await n(t.getByRole("article",{name:"Turn 12"})).toHaveClass("session-turn selected")})}},R={name:"US-P11: 「ここまで戻る」で任意の過去ターンまで巻き戻したい",play:async({canvasElement:s,step:i})=>{const t=l(s);await y(t,"書架の奥にいる人物に話しかける"),await y(t,"銀の鍵を水面に沈めてみる"),await i("過去Turnの「ここまで戻る」を押すと確認ダイアログを表示する",async()=>{const d=l(t.getByRole("article",{name:"Turn 01"}));await o.click(d.getByRole("button",{name:"ここまで戻る"})),await n(t.getByRole("dialog",{name:"巻き戻し確認"})).toBeVisible(),await n(t.getByTestId("rewind-dialog")).toHaveTextContent("非同期処理を無効化")}),await i("確定すると指定ターン以降を無効化し、巻き戻し地点から再入力できる",async()=>{await o.click(t.getByRole("button",{name:"巻き戻しを確定"})),await n(t.getByTestId("dialogue-log")).not.toHaveTextContent("銀の鍵を水面に沈めてみる"),await n(t.getByRole("status")).toHaveTextContent("AIコンテキストを再構築"),await n(t.getByLabelText("自由に行動や会話を入力")).toBeVisible()})}};var O,L,$;B.parameters={...B.parameters,docs:{...(O=B.parameters)==null?void 0:O.docs,source:{originalSource:`{
  name: 'US-P01: AIが現在の状況を語ってほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ActiveなSessionの開始時に、現在地・周囲・直近の出来事をNarrativeとして表示する', async () => {
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
      await expect(canvas.getByTestId('turn-1-narrative')).toHaveTextContent('水没した閲覧室');
      await expect(canvas.getByTestId('turn-1-narrative')).toHaveTextContent('銀の鍵');
      await expect(canvas.getByRole('status')).toHaveTextContent('現在地、周囲、直近の出来事');
    });
  }
}`,...($=(L=B.parameters)==null?void 0:L.docs)==null?void 0:$.source}}};var V,W,D;C.parameters={...C.parameters,docs:{...(V=C.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: 'US-P02/P03: 自然言語で行動を入力し、結果を物語として受け取る',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('自由入力欄に自然な文章で行動を書く', async () => {
      await userEvent.type(canvas.getByLabelText('自由に行動や会話を入力'), '周囲を警戒しながら閲覧室を出る');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toHaveValue('周囲を警戒しながら閲覧室を出る');
    });
    await step('送信すると行動として解釈され、成功・想定外の展開を含むNarrativeが生成される', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '行動を送る'
      }));
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('プレイヤーの入力: 周囲を警戒しながら閲覧室を出る');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('想定外の痕跡');
      await expect(canvas.getByRole('status')).toHaveTextContent('結果をNarrativeとして生成');
    });
  }
}`,...(D=(W=C.parameters)==null?void 0:W.docs)==null?void 0:D.source}}};var F,z,_;S.parameters={...S.parameters,docs:{...(F=S.parameters)==null?void 0:F.docs,source:{originalSource:`{
  name: 'US-P04: NPCと自然に会話したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('NPCへの発話を自由入力で送る', async () => {
      await sendAction(canvas, '書架の奥にいる人物に「あなたは誰？」と尋ねる');
    });
    await step('NPCの立場・関係性に沿った返答がNarrativeに入り、会話内容が文脈に残る', async () => {
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('書架の奥の人物');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('会話内容はセッション文脈に記録');
    });
  }
}`,...(_=(z=S.parameters)==null?void 0:z.docs)==null?void 0:_.source}}};var q,M,G;h.parameters={...h.parameters,docs:{...(q=h.parameters)==null?void 0:q.docs,source:{originalSource:`{
  name: 'US-P05: AIに補足説明や再説明を求めたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('補足説明ボタンから「今の状況を簡単にまとめて」を送る', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '状況を簡単にまとめて聞く'
      }));
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('補足説明');
    });
    await step('補足要求は行動扱いにせず、物語進行やSession状態を変化させない', async () => {
      await expect(canvas.getByRole('status')).toHaveTextContent('行動ではない');
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
      await expect(canvas.getByTestId('active-turn-summary')).toHaveTextContent('物語状態は変化しない');
    });
  }
}`,...(G=(M=h.parameters)==null?void 0:M.docs)==null?void 0:G.source}}};var J,K,Q;H.parameters={...H.parameters,docs:{...(J=H.parameters)==null?void 0:J.docs,source:{originalSource:`{
  name: 'US-P06: 自分の入力がどう解釈されたか知りたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await sendAction(canvas, '酒場の奥にいる人物に話しかける');
    await step('解釈トグルはPlayer Inputの直下にあり、押すと内部解釈を表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'Turn 13の入力解釈を見る'
      }));
      await expect(canvas.getByTestId('turn-13-interpretation')).toHaveTextContent('NPCへの会話として解釈');
      await expect(canvas.getByRole('status')).toHaveTextContent('ズレがあれば、削除・やり直し');
    });
    await step('もう一度押すと解釈を隠せる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'Turn 13の入力解釈を隠す'
      }));
      await expect(canvas.queryByTestId('turn-13-interpretation')).not.toBeInTheDocument();
    });
  }
}`,...(Q=(K=H.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};var X,Y,Z;P.parameters={...P.parameters,docs:{...(X=P.parameters)==null?void 0:X.docs,source:{originalSource:`{
  name: 'US-P07: ボタン操作で直前の行動を取り消してやり直したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('未送信の入力は削除ボタンで取り消せる', async () => {
      await userEvent.type(canvas.getByLabelText('自由に行動や会話を入力'), '入力ミス');
      await userEvent.click(canvas.getByRole('button', {
        name: '削除（入力取り消し）'
      }));
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toHaveValue('');
      await expect(canvas.getByRole('status')).toHaveTextContent('入力欄の未送信テキストを無効化');
    });
    await step('送信済みの直前ターンはやり直しボタンで巻き戻せる', async () => {
      await sendAction(canvas, '階段へ急いで向かう');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('階段へ急いで向かう');
      await userEvent.click(canvas.getByRole('button', {
        name: 'やり直し（直前ターン巻き戻し）'
      }));
      await expect(canvas.getByTestId('dialogue-log')).not.toHaveTextContent('階段へ急いで向かう');
      await expect(canvas.getByRole('status')).toHaveTextContent('直前ターンを巻き戻しました');
    });
  }
}`,...(Z=(Y=P.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var tt,et,at;b.parameters={...b.parameters,docs:{...(tt=b.parameters)==null?void 0:tt.docs,source:{originalSource:`{
  name: 'US-P08/P10: 対話だけで進み、AIは入力を待つ',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Narrative → Input → Narrativeのループが、明示的な「次へ」なしで続く', async () => {
      await sendAction(canvas, '銀の鍵を掲げて反応を見る');
      await sendAction(canvas, '反応した書架へ近づく');
      await expect(canvas.getByTestId('dialogue-log')).toHaveTextContent('プレイヤーの入力: 反応した書架へ近づく');
    });
    await step('AIは重要な進行を勝手に進めず、次のPlayer Inputを待っていることを表示する', async () => {
      await expect(canvas.getByTestId('input-waiting')).toHaveTextContent('必ずPlayer Inputを待ちます');
      await expect(canvas.getByRole('status')).toHaveTextContent('次の重要な進行は入力待ち');
    });
  }
}`,...(at=(et=b.parameters)==null?void 0:et.docs)==null?void 0:at.source}}};var nt,st,it;A.parameters={...A.parameters,docs:{...(nt=A.parameters)==null?void 0:nt.docs,source:{originalSource:`{
  name: 'US-P09: 見出しリンク（TOC）から対話ログを振り返りたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('多数のTurnに対して、TOCはTurn一覧ではなくAIが考えた場面見出しを表示する', async () => {
      await expect(canvas.getByRole('complementary', {
        name: 'AI見出しリンクTOC'
      })).toHaveTextContent('目覚めと銀の鍵');
      await expect(canvas.getByRole('complementary', {
        name: 'AI見出しリンクTOC'
      })).toHaveTextContent('濡れた書架の声');
      await expect(canvas.getByRole('complementary', {
        name: 'AI見出しリンクTOC'
      })).toHaveTextContent('螺旋階段と星図灯');
      await expect(canvas.getByRole('complementary', {
        name: 'AI見出しリンクTOC'
      })).toHaveTextContent('閉じた星座の扉');
      await expect(canvas.getByRole('article', {
        name: 'Turn 12'
      })).toBeVisible();
    });
    await step('TOCの末尾は常に最後のTurn（Turn 12）を指す見出しになっている', async () => {
      await expect(canvas.getByTestId('heading-link-12')).toHaveTextContent('Turn 12から');
    });
    await step('AI見出しを選ぶと、その見出しが始まる切り替わりTurnへジャンプする', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '見出し「螺旋階段と星図灯」へ（Turn 08から）'
      }));
      await expect(canvas.getByRole('status')).toHaveTextContent('場面の切り替わりTurn 08へジャンプ');
      await expect(canvas.getByTestId('active-turn-summary')).toHaveTextContent('08 / 螺旋階段へ向かう');
      await expect(canvas.getByTestId('active-heading-summary')).toHaveTextContent('螺旋階段と星図灯（Turn 08から）');
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
    });
    await step('末尾の見出しを選ぶと、最後のTurnへジャンプして選択表示される', async () => {
      await userEvent.click(canvas.getByTestId('heading-link-12'));
      await expect(canvas.getByTestId('active-turn-summary')).toHaveTextContent('12 / 入力待ちの静止点');
      await expect(canvas.getByRole('article', {
        name: 'Turn 12'
      })).toHaveClass('session-turn selected');
    });
  }
}`,...(it=(st=A.parameters)==null?void 0:st.docs)==null?void 0:it.source}}};var rt,ot,ct;R.parameters={...R.parameters,docs:{...(rt=R.parameters)==null?void 0:rt.docs,source:{originalSource:`{
  name: 'US-P11: 「ここまで戻る」で任意の過去ターンまで巻き戻したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await sendAction(canvas, '書架の奥にいる人物に話しかける');
    await sendAction(canvas, '銀の鍵を水面に沈めてみる');
    await step('過去Turnの「ここまで戻る」を押すと確認ダイアログを表示する', async () => {
      const turnOne = within(canvas.getByRole('article', {
        name: 'Turn 01'
      }));
      await userEvent.click(turnOne.getByRole('button', {
        name: 'ここまで戻る'
      }));
      await expect(canvas.getByRole('dialog', {
        name: '巻き戻し確認'
      })).toBeVisible();
      await expect(canvas.getByTestId('rewind-dialog')).toHaveTextContent('非同期処理を無効化');
    });
    await step('確定すると指定ターン以降を無効化し、巻き戻し地点から再入力できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '巻き戻しを確定'
      }));
      await expect(canvas.getByTestId('dialogue-log')).not.toHaveTextContent('銀の鍵を水面に沈めてみる');
      await expect(canvas.getByRole('status')).toHaveTextContent('AIコンテキストを再構築');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeVisible();
    });
  }
}`,...(ct=(ot=R.parameters)==null?void 0:ot.docs)==null?void 0:ct.source}}};const ft=["USP01CurrentSituationNarrative","USP02AndP03NaturalInputToNarrativeResult","USP04TalkWithNpcNaturally","USP05AskClarificationWithoutProgress","USP06ShowInputInterpretation","USP07DeleteAndRedoPreviousTurn","USP08AndP10ContinuousLoopWaitsForInput","USP09ReviewLogFromToc","USP11RewindToAnyPastTurn"];export{B as USP01CurrentSituationNarrative,C as USP02AndP03NaturalInputToNarrativeResult,S as USP04TalkWithNpcNaturally,h as USP05AskClarificationWithoutProgress,H as USP06ShowInputInterpretation,P as USP07DeleteAndRedoPreviousTurn,b as USP08AndP10ContinuousLoopWaitsForInput,A as USP09ReviewLogFromToc,R as USP11RewindToAnyPastTurn,ft as __namedExportsOrder,jt as default};
