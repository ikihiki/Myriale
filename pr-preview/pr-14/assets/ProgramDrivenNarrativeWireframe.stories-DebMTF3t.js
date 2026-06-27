import{w as i,e as n,u as c}from"./index-C3Z0PGzo.js";import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as v}from"./index-BlmOqGMO.js";import{A as je}from"./AppChrome-DEx1aaG4.js";import{S as Se}from"./SessionTurn-DWZJ2ukf.js";/* empty css               */import"./index-yBjzXJbu.js";const He={dialogue:{label:"AI対話",badge:"対話中",forced:!1,reason:"自由入力で行動や会話を送れます。"},battle:{label:"バトル",badge:"バトル中",forced:!0,reason:"バトル中はルール検証のため自由入力は無効です。行動ボタンで選びます。"},roll:{label:"判定",badge:"判定中",forced:!0,reason:"判定中は自由入力は無効です。ダイスはプログラムが生成し、AIは結果を変更できません。"},event:{label:"イベント",badge:"イベント進行中",forced:!0,reason:"強制イベント中は自由入力も分岐選択も表示されません。制御不能な状況として最後まで自動再生されます。"}},Ce=[{id:1,mode:"dialogue",narrative:"あなたは星図灯を手に、崩れかけた書架の回廊を進む。前方の闇から、濡れた金属の擦れる音が近づいてくる。"}],ke={name:"霧野しおり",email:"reader@myriale.example",initials:"霧野",role:"プレイヤー"};function ge(){const[o,s]=v.useState("dialogue"),[a,k]=v.useState(Ce),[y,P]=v.useState(""),[r,R]=v.useState({enemy:"錆びついた書架番",playerHp:30,enemyHp:24,finished:!1}),[p,N]=v.useState(null),[ue,d]=v.useState("現在はAI対話モードです。自由入力で物語を進められます。"),[f,ye]=v.useState("ランダム"),g=He[o],u=g.forced,m=t=>{k(l=>[...l,{...t,id:l.length+1}])},xe=()=>{s("battle"),R({enemy:"錆びついた書架番",playerHp:30,enemyHp:24,finished:!1}),m({mode:"battle",fact:"モード遷移: AI対話 → バトル（自由入力を無効化）",narrative:"書架の影から錆びついた書架番が現れ、戦闘が始まった。行動を選べ。"}),d("バトルを開始しました。Forced Modeです。行動はボタンで選び、結果はプログラムが判定します。")},be=()=>{s("roll"),N(null),m({mode:"roll",fact:"モード遷移: 判定開始（自由入力を無効化）",narrative:"錆びついた扉が行く手を阻む。こじ開けられるか――技能判定が必要だ。"}),d("判定モードに入りました。「ダイスを振る」で判定します。結果はプログラムが生成します。")},we=()=>{s("event"),m({mode:"event",fact:"強制イベント: 天井崩落（中断不可）",narrative:"轟音とともに天井が抜ける。あなたの意思とは無関係に、足場が崩れ落ちていく。"}),d("強制イベントが発生しました。中断・分岐はできません。最後まで自動再生されます。")},Be=t=>{if(r.finished)return;const G={攻撃:8,防御:2,スキル:12,逃走:0}[t],E=Math.max(0,r.enemyHp-G),U=t==="防御"?1:t==="逃走"?0:4,A=Math.max(0,r.playerHp-U),M=E===0;R({...r,enemyHp:E,playerHp:A,finished:M}),m({mode:"battle",fact:`行動「${t}」確定: 与ダメージ${G} / 被ダメージ${U} → 敵HP ${E} / 自HP ${A}`,narrative:t==="逃走"?"あなたは身を翻し、回廊の暗がりへ転がり込む。書架番の指先が空を切った。":`あなたの${t}が決まり、書架番の装甲がきしむ。冷たい火花が散った。`}),d(`バトル: 「${t}」をプログラムが判定し、結果をSession Stateに反映しました。`),M&&d("敵を撃破しました。プログラムが決着を確定。AI対話モードへ戻れます。")},Te=()=>{const t=f==="ランダム"?1+Math.floor(Math.random()*6):Number(f),l=t>=4;N({value:t,success:l}),m({mode:"roll",fact:`ダイス: d6 = ${t}（${l?"成功":"失敗"}・しきい値4）`,narrative:l?"錆を噛んだ閂が砕け、扉が軋みながら開く。先へ進める。":"掌に錆が食い込むだけで、扉はびくともしない。別の手を探すしかない。"}),m({mode:"roll",fact:`自動分岐: ${l?"成功ルート → 次のシーンへ":"失敗ルート → 迂回路を提示"}（プレイヤー操作なし）`,narrative:l?"扉の先、星図灯が次の回廊をぼんやりと照らし出した。":"扉は諦めろと言わんばかりに沈黙する。脇の通気口がかすかに風を吐いていた。"}),d(`判定結果（d6=${t}）に基づき、プログラムが${l?"成功":"失敗"}ルートへ自動で進めました。`)},he=()=>{m({mode:"event",fact:"イベント確定: 落下ダメージ5 / 下層フロアへ移動",narrative:"崩れた床とともに下層へ叩きつけられる。土埃の向こう、見知らぬ書庫が広がっていた。痛みの描写も、安堵も、AIが語る。"}),d("強制イベントの確定結果をもとに、AIが描写・心情・演出を生成しました。結果は変更されません。")},x=()=>{s("dialogue"),m({mode:"dialogue",fact:"モード遷移: Forced Mode 解除 → AI対話（自由入力を再表示）",narrative:"緊張が解け、あなたは再び自分の足で立っている。次に何をするかは、あなた次第だ。"}),d("プログラム主導シーンが終了しました。AI対話モードに戻り、自由入力が再び有効です。")},Ie=()=>{const t=y.trim();!t||u||(m({mode:"dialogue",narrative:`（あなたの行動）${t} ……物語はあなたの選択を受けて続いていく。`}),P(""),d("自由入力を行動として解釈し、AIが物語を続けました。"))};return e.jsx(je,{section:"sessions",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"セッション",to:"startSession"},{label:"プログラム主導の進行"}],account:ke,children:e.jsxs("div",{className:"scenario-forge scenario-forge-wizard program-driven-wireframe",children:[e.jsxs("aside",{className:"contract-spine","aria-label":"進行モードのトリガー",children:[e.jsx("strong",{children:"Program-driven Scenes"}),e.jsx("p",{className:"toc-help",children:"AIの自由対話では処理しない場面（バトル・判定・強制イベント）を、プログラム主導で安全に実行します。"}),e.jsxs("div",{className:"wizard-step-list",role:"list","aria-label":"モード遷移トリガー",children:[e.jsxs("button",{className:"spine-row spine-step",onClick:xe,"aria-label":"バトルを開始",children:[e.jsx("span",{children:"バトル開始"}),e.jsx("small",{children:"行動ボタンで戦う"})]}),e.jsxs("button",{className:"spine-row spine-step",onClick:be,"aria-label":"判定を開始",children:[e.jsx("span",{children:"判定開始"}),e.jsx("small",{children:"ダイスロール"})]}),e.jsxs("button",{className:"spine-row spine-step",onClick:we,"aria-label":"強制イベントを発生",children:[e.jsx("span",{children:"強制イベント"}),e.jsx("small",{children:"中断不可の自動進行"})]}),e.jsxs("button",{className:"spine-row spine-step",onClick:x,"aria-label":"AI対話へ戻る",children:[e.jsx("span",{children:"AI対話へ戻る"}),e.jsx("small",{children:"Forced Mode解除"})]})]}),e.jsxs("div",{className:"program-test-harness","aria-label":"作者向けテストハーネス",children:[e.jsx("h3",{children:"テストハーネス"}),e.jsxs("label",{children:["ダイス固定値（再現用）",e.jsxs("select",{"aria-label":"ダイス固定値",value:f,onChange:t=>ye(t.target.value),children:[e.jsx("option",{children:"ランダム"}),e.jsx("option",{children:"1"}),e.jsx("option",{children:"2"}),e.jsx("option",{children:"3"}),e.jsx("option",{children:"4"}),e.jsx("option",{children:"5"}),e.jsx("option",{children:"6"})]})]}),e.jsx("small",{children:"特定イベントやバトルから単体で実行し、判定値を固定・再現できます。"})]}),e.jsxs("div",{className:"scenario-id",children:[e.jsx("span",{children:"Current mode"}),e.jsx("b",{"data-testid":"mode-state",children:g.label})]})]}),e.jsxs("main",{className:"forge-paper wizard-paper program-driven-main","aria-label":"プログラム主導ナラティブ",children:[e.jsx("p",{className:"kicker",children:"Session play / Program-driven mode"}),e.jsxs("div",{className:`mode-banner mode-${o}`,role:"status","data-testid":"mode-banner",children:[e.jsx("span",{className:"mode-badge","data-testid":"mode-badge",children:g.badge}),e.jsx("span",{className:"mode-reason","data-testid":"mode-reason",children:g.reason})]}),e.jsx("div",{className:"notice",role:"status","data-testid":"program-notice",children:ue}),e.jsx("section",{className:"dialogue-log program-log","aria-label":"進行ログ","data-testid":"program-log",children:a.map(t=>e.jsx(Se,{ariaLabel:`ログ ${t.id}`,variantClassName:`turn-${t.mode}`,lead:t.fact?{tone:"program",tag:"PROGRAM",text:t.fact,testId:`fact-${t.id}`}:void 0,narrative:t.narrative,narrativeTag:"AI",narrativeTestId:`narrative-${t.id}`},t.id))}),o==="battle"&&e.jsxs("section",{className:"program-controls battle-controls","aria-label":"バトル操作",children:[e.jsxs("div",{className:"battle-hp","data-testid":"battle-hp",children:[e.jsxs("span",{children:["敵「",r.enemy,"」HP: ",r.enemyHp]}),e.jsxs("span",{children:["あなたのHP: ",r.playerHp]})]}),r.finished?e.jsx("div",{className:"button-row",children:e.jsx("button",{className:"primary",onClick:x,"data-testid":"battle-return",children:"AI対話へ戻る"})}):e.jsx("div",{className:"button-row",role:"group","aria-label":"バトル行動",children:["攻撃","防御","スキル","逃走"].map(t=>e.jsx("button",{onClick:()=>Be(t),children:t},t))}),e.jsx("p",{className:"program-hint",children:"行動はルールで検証され、結果はプログラムが確定します。自由入力はできません。"})]}),o==="roll"&&e.jsxs("section",{className:"program-controls roll-controls","aria-label":"判定操作",children:[e.jsxs("div",{className:"button-row",children:[e.jsx("button",{className:"primary",onClick:Te,"data-testid":"roll-button",children:"ダイスを振る"}),p&&e.jsx("button",{onClick:x,"data-testid":"roll-return",children:"AI対話へ戻る"})]}),p&&e.jsxs("p",{className:`roll-result ${p.success?"success":"fail"}`,"data-testid":"roll-result",children:["d6 = ",p.value," → ",p.success?"成功":"失敗"]}),e.jsx("p",{className:"program-hint",children:"ダイスはプログラムが生成し、AIは結果を変更できません。成功/失敗で自動的に分岐します。"})]}),o==="event"&&e.jsxs("section",{className:"program-controls event-controls","aria-label":"強制イベント",children:[e.jsx("p",{className:"event-lock","data-testid":"event-lock",children:"制御不能な状況です。中断・分岐はできません。"}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{className:"primary",onClick:he,"data-testid":"event-advance",children:"イベントを進める（自動再生）"}),e.jsx("button",{onClick:x,"data-testid":"event-return",children:"イベント終了後、AI対話へ"})]}),e.jsx("p",{className:"program-hint",children:"プログラムが事実を確定し、描写・心情・演出はAIが生成します。結果は変更されません。"})]}),e.jsxs("section",{className:"program-controls dialogue-controls","aria-label":"自由入力",children:[e.jsx("label",{className:"sr-only",htmlFor:"program-free-input",children:"自由に行動や会話を入力"}),e.jsxs("div",{className:"free-input-row",children:[e.jsx("input",{id:"program-free-input","aria-label":"自由に行動や会話を入力",value:y,disabled:u,placeholder:u?"Forced Mode中は自由入力できません":"例: 星図灯を掲げて周囲を照らす",onChange:t=>P(t.target.value)}),e.jsx("button",{onClick:Ie,disabled:u,"data-testid":"send-free-input",children:"行動を送る"})]}),u&&e.jsxs("p",{className:"program-hint input-disabled-reason","data-testid":"input-disabled-reason",children:["自由入力が無効な理由: ",g.reason]})]})]}),e.jsxs("aside",{className:"ai-bookmark wizard-summary","aria-label":"Session State",children:[e.jsx("h2",{children:"Session State"}),e.jsxs("article",{children:[e.jsx("h3",{children:"進行モード"}),e.jsxs("p",{"data-testid":"summary-mode",children:[g.label,"（",u?"Forced Mode":"自由入力可","）"]})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"バトル状態"}),e.jsxs("p",{"data-testid":"summary-battle",children:["敵HP ",r.enemyHp," / 自HP ",r.playerHp,r.finished?" / 決着":""]})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"直近の判定"}),e.jsx("p",{"data-testid":"summary-roll",children:p?`d6=${p.value}（${p.success?"成功":"失敗"}）`:"判定なし"})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"役割分担"}),e.jsx("p",{children:"事実の確定: プログラム"}),e.jsx("p",{children:"描写・演出: AI Narrative"})]})]})]})})}ge.__docgenInfo={description:"",methods:[],displayName:"ProgramDrivenNarrativeWireframe"};const Ae={title:"Program-driven narrative/Wireframe from user stories",component:ge,parameters:{notes:"docs/user-stories/program-driven-narrative-user-stories.md の各ユーザーストーリー（US-PG01〜PG10）を、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。"}},b={name:"US-PG01: 自由入力を禁止しモードを切り替えたい",play:async({canvasElement:o,step:s})=>{const a=i(o);await s("初期はAI対話モードで、自由入力が有効",async()=>{await n(a.getByTestId("mode-badge")).toHaveTextContent("対話中"),await n(a.getByLabelText("自由に行動や会話を入力")).toBeEnabled()}),await s("バトル開始でForced Modeに入り、自由入力が無効化され理由が示される",async()=>{await c.click(a.getByRole("button",{name:"バトルを開始"})),await n(a.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await n(a.getByLabelText("自由に行動や会話を入力")).toBeDisabled(),await n(a.getByTestId("input-disabled-reason")).toHaveTextContent("自由入力は無効")})}},w={name:"US-PG02: バトルをボタン操作で進行したい",play:async({canvasElement:o,step:s})=>{const a=i(o);await c.click(a.getByRole("button",{name:"バトルを開始"})),await s("攻撃/防御/スキル/逃走の行動ボタンが表示される",async()=>{const k=a.getByRole("group",{name:"バトル行動"});for(const y of["攻撃","防御","スキル","逃走"])await n(i(k).getByRole("button",{name:y})).toBeVisible()}),await s("行動を選ぶと即座に確定され、自由入力は使えない",async()=>{await c.click(a.getByRole("button",{name:"スキル"})),await n(a.getByTestId("program-log")).toHaveTextContent("行動「スキル」確定"),await n(a.getByLabelText("自由に行動や会話を入力")).toBeDisabled()})}},B={name:"US-PG03: バトル結果をプログラムで判定してほしい",play:async({canvasElement:o,step:s})=>{const a=i(o);await c.click(a.getByRole("button",{name:"バトルを開始"})),await s("命中・ダメージ・状態変化がプログラムで確定し、Session Stateに反映される",async()=>{await c.click(a.getByRole("button",{name:"攻撃"})),await n(a.getByTestId("program-log")).toHaveTextContent("与ダメージ8"),await n(a.getByTestId("summary-battle")).toHaveTextContent("敵HP 16")})}},T={name:"US-PG04: 判定（ダイスロール）を明示的に実行したい",play:async({canvasElement:o,step:s})=>{const a=i(o);await s("テストハーネスでダイスを6に固定し、判定モードに入る",async()=>{await c.selectOptions(a.getByLabelText("ダイス固定値"),"6"),await c.click(a.getByRole("button",{name:"判定を開始"})),await n(a.getByTestId("mode-badge")).toHaveTextContent("判定中")}),await s("「ダイスを振る」でプログラム生成の結果が表示され、成功/失敗が即時に分かる",async()=>{await c.click(a.getByTestId("roll-button")),await n(a.getByTestId("roll-result")).toHaveTextContent("d6 = 6 → 成功"),await n(a.getByTestId("summary-roll")).toHaveTextContent("d6=6（成功）")})}},h={name:"US-PG05: ダイス結果に基づき強制的に進めたい",play:async({canvasElement:o,step:s})=>{const a=i(o);await s("失敗が出る値（2）に固定して判定する",async()=>{await c.selectOptions(a.getByLabelText("ダイス固定値"),"2"),await c.click(a.getByRole("button",{name:"判定を開始"})),await c.click(a.getByTestId("roll-button"))}),await s("成功/失敗の分岐がプログラムで決定され、操作なしで次のシーンへ進む",async()=>{await n(a.getByTestId("program-log")).toHaveTextContent("失敗ルート"),await n(a.getByTestId("program-log")).toHaveTextContent("プレイヤー操作なし"),await n(a.getByTestId("program-notice")).toHaveTextContent("失敗ルートへ自動で進めました")})}},I={name:"US-PG06: 強制イベントを中断不可で実行したい",play:async({canvasElement:o,step:s})=>{const a=i(o);await c.click(a.getByRole("button",{name:"強制イベントを発生"})),await s("自由入力も分岐選択も無効化され、制御不能であることが明示される",async()=>{await n(a.getByTestId("mode-badge")).toHaveTextContent("イベント進行中"),await n(a.getByTestId("event-lock")).toHaveTextContent("中断・分岐はできません"),await n(a.getByLabelText("自由に行動や会話を入力")).toBeDisabled()})}},j={name:"US-PG07: 強制イベント中もナラティブはAIに語らせたい",play:async({canvasElement:o,step:s})=>{const a=i(o);await c.click(a.getByRole("button",{name:"強制イベントを発生"})),await s("プログラムが事実を確定し、描写・心情・演出はAIが生成する",async()=>{await c.click(a.getByTestId("event-advance")),await n(a.getByTestId("program-log")).toHaveTextContent("イベント確定: 落下ダメージ5"),await n(a.getByTestId("program-notice")).toHaveTextContent("AIが描写・心情・演出を生成")})}},S={name:"US-PG08: シーン終了後にAI対話へ戻りたい",play:async({canvasElement:o,step:s})=>{const a=i(o);await c.click(a.getByRole("button",{name:"バトルを開始"})),await s("シーン終了でForced Modeが解除され、自由入力欄が再表示される",async()=>{await c.click(a.getByRole("button",{name:"AI対話へ戻る"})),await n(a.getByTestId("mode-badge")).toHaveTextContent("対話中"),await n(a.getByLabelText("自由に行動や会話を入力")).toBeEnabled(),await n(a.queryByTestId("input-disabled-reason")).not.toBeInTheDocument()}),await s("対話モードでは自由入力で物語を進められる",async()=>{await c.type(a.getByLabelText("自由に行動や会話を入力"),"星図灯を掲げて先へ進む"),await c.click(a.getByTestId("send-free-input")),await n(a.getByTestId("program-log")).toHaveTextContent("星図灯を掲げて先へ進む")})}},H={name:"US-PG09: 現在の進行モードを分かるようにしたい",play:async({canvasElement:o,step:s})=>{const a=i(o);await s("対話 → バトル → 判定 → イベントで、モードバッジが切り替わる",async()=>{await n(a.getByTestId("mode-badge")).toHaveTextContent("対話中"),await c.click(a.getByRole("button",{name:"バトルを開始"})),await n(a.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await c.click(a.getByRole("button",{name:"判定を開始"})),await n(a.getByTestId("mode-badge")).toHaveTextContent("判定中"),await c.click(a.getByRole("button",{name:"強制イベントを発生"})),await n(a.getByTestId("mode-badge")).toHaveTextContent("イベント進行中"),await n(a.getByTestId("summary-mode")).toHaveTextContent("Forced Mode")})}},C={name:"US-PG10: プログラム主導シーンをテストしやすくしたい",play:async({canvasElement:o,step:s})=>{const a=i(o);await s("作者は判定値を固定して、同じ結果を再現できる",async()=>{await c.selectOptions(a.getByLabelText("ダイス固定値"),"5"),await c.click(a.getByRole("button",{name:"判定を開始"})),await c.click(a.getByTestId("roll-button")),await n(a.getByTestId("roll-result")).toHaveTextContent("d6 = 5 → 成功")}),await s("特定シーン（バトル）から単体で実行できる",async()=>{await c.click(a.getByRole("button",{name:"バトルを開始"})),await n(a.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await n(a.getByRole("group",{name:"バトル行動"})).toBeVisible()})}};var L,$,D;b.parameters={...b.parameters,docs:{...(L=b.parameters)==null?void 0:L.docs,source:{originalSource:`{
  name: 'US-PG01: 自由入力を禁止しモードを切り替えたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('初期はAI対話モードで、自由入力が有効', async () => {
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('対話中');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeEnabled();
    });
    await step('バトル開始でForced Modeに入り、自由入力が無効化され理由が示される', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'バトルを開始'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('バトル中');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
      await expect(canvas.getByTestId('input-disabled-reason')).toHaveTextContent('自由入力は無効');
    });
  }
}`,...(D=($=b.parameters)==null?void 0:$.docs)==null?void 0:D.source}}};var F,O,z;w.parameters={...w.parameters,docs:{...(F=w.parameters)==null?void 0:F.docs,source:{originalSource:`{
  name: 'US-PG02: バトルをボタン操作で進行したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: 'バトルを開始'
    }));
    await step('攻撃/防御/スキル/逃走の行動ボタンが表示される', async () => {
      const group = canvas.getByRole('group', {
        name: 'バトル行動'
      });
      for (const action of ['攻撃', '防御', 'スキル', '逃走']) {
        await expect(within(group).getByRole('button', {
          name: action
        })).toBeVisible();
      }
    });
    await step('行動を選ぶと即座に確定され、自由入力は使えない', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'スキル'
      }));
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('行動「スキル」確定');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
    });
  }
}`,...(z=(O=w.parameters)==null?void 0:O.docs)==null?void 0:z.source}}};var V,_,W;B.parameters={...B.parameters,docs:{...(V=B.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: 'US-PG03: バトル結果をプログラムで判定してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: 'バトルを開始'
    }));
    await step('命中・ダメージ・状態変化がプログラムで確定し、Session Stateに反映される', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '攻撃'
      }));
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('与ダメージ8');
      await expect(canvas.getByTestId('summary-battle')).toHaveTextContent('敵HP 16');
    });
  }
}`,...(W=(_=B.parameters)==null?void 0:_.docs)==null?void 0:W.source}}};var q,J,K;T.parameters={...T.parameters,docs:{...(q=T.parameters)==null?void 0:q.docs,source:{originalSource:`{
  name: 'US-PG04: 判定（ダイスロール）を明示的に実行したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('テストハーネスでダイスを6に固定し、判定モードに入る', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('ダイス固定値'), '6');
      await userEvent.click(canvas.getByRole('button', {
        name: '判定を開始'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('判定中');
    });
    await step('「ダイスを振る」でプログラム生成の結果が表示され、成功/失敗が即時に分かる', async () => {
      await userEvent.click(canvas.getByTestId('roll-button'));
      await expect(canvas.getByTestId('roll-result')).toHaveTextContent('d6 = 6 → 成功');
      await expect(canvas.getByTestId('summary-roll')).toHaveTextContent('d6=6（成功）');
    });
  }
}`,...(K=(J=T.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};var Q,X,Y;h.parameters={...h.parameters,docs:{...(Q=h.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  name: 'US-PG05: ダイス結果に基づき強制的に進めたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('失敗が出る値（2）に固定して判定する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('ダイス固定値'), '2');
      await userEvent.click(canvas.getByRole('button', {
        name: '判定を開始'
      }));
      await userEvent.click(canvas.getByTestId('roll-button'));
    });
    await step('成功/失敗の分岐がプログラムで決定され、操作なしで次のシーンへ進む', async () => {
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('失敗ルート');
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('プレイヤー操作なし');
      await expect(canvas.getByTestId('program-notice')).toHaveTextContent('失敗ルートへ自動で進めました');
    });
  }
}`,...(Y=(X=h.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};var Z,ee,ae;I.parameters={...I.parameters,docs:{...(Z=I.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  name: 'US-PG06: 強制イベントを中断不可で実行したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: '強制イベントを発生'
    }));
    await step('自由入力も分岐選択も無効化され、制御不能であることが明示される', async () => {
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('イベント進行中');
      await expect(canvas.getByTestId('event-lock')).toHaveTextContent('中断・分岐はできません');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
    });
  }
}`,...(ae=(ee=I.parameters)==null?void 0:ee.docs)==null?void 0:ae.source}}};var te,ne,se;j.parameters={...j.parameters,docs:{...(te=j.parameters)==null?void 0:te.docs,source:{originalSource:`{
  name: 'US-PG07: 強制イベント中もナラティブはAIに語らせたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: '強制イベントを発生'
    }));
    await step('プログラムが事実を確定し、描写・心情・演出はAIが生成する', async () => {
      await userEvent.click(canvas.getByTestId('event-advance'));
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('イベント確定: 落下ダメージ5');
      await expect(canvas.getByTestId('program-notice')).toHaveTextContent('AIが描写・心情・演出を生成');
    });
  }
}`,...(se=(ne=j.parameters)==null?void 0:ne.docs)==null?void 0:se.source}}};var oe,ce,re;S.parameters={...S.parameters,docs:{...(oe=S.parameters)==null?void 0:oe.docs,source:{originalSource:`{
  name: 'US-PG08: シーン終了後にAI対話へ戻りたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: 'バトルを開始'
    }));
    await step('シーン終了でForced Modeが解除され、自由入力欄が再表示される', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AI対話へ戻る'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('対話中');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeEnabled();
      await expect(canvas.queryByTestId('input-disabled-reason')).not.toBeInTheDocument();
    });
    await step('対話モードでは自由入力で物語を進められる', async () => {
      await userEvent.type(canvas.getByLabelText('自由に行動や会話を入力'), '星図灯を掲げて先へ進む');
      await userEvent.click(canvas.getByTestId('send-free-input'));
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('星図灯を掲げて先へ進む');
    });
  }
}`,...(re=(ce=S.parameters)==null?void 0:ce.docs)==null?void 0:re.source}}};var ie,le,de;H.parameters={...H.parameters,docs:{...(ie=H.parameters)==null?void 0:ie.docs,source:{originalSource:`{
  name: 'US-PG09: 現在の進行モードを分かるようにしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('対話 → バトル → 判定 → イベントで、モードバッジが切り替わる', async () => {
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('対話中');
      await userEvent.click(canvas.getByRole('button', {
        name: 'バトルを開始'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('バトル中');
      await userEvent.click(canvas.getByRole('button', {
        name: '判定を開始'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('判定中');
      await userEvent.click(canvas.getByRole('button', {
        name: '強制イベントを発生'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('イベント進行中');
      await expect(canvas.getByTestId('summary-mode')).toHaveTextContent('Forced Mode');
    });
  }
}`,...(de=(le=H.parameters)==null?void 0:le.docs)==null?void 0:de.source}}};var me,pe,ve;C.parameters={...C.parameters,docs:{...(me=C.parameters)==null?void 0:me.docs,source:{originalSource:`{
  name: 'US-PG10: プログラム主導シーンをテストしやすくしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('作者は判定値を固定して、同じ結果を再現できる', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('ダイス固定値'), '5');
      await userEvent.click(canvas.getByRole('button', {
        name: '判定を開始'
      }));
      await userEvent.click(canvas.getByTestId('roll-button'));
      await expect(canvas.getByTestId('roll-result')).toHaveTextContent('d6 = 5 → 成功');
    });
    await step('特定シーン（バトル）から単体で実行できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'バトルを開始'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('バトル中');
      await expect(canvas.getByRole('group', {
        name: 'バトル行動'
      })).toBeVisible();
    });
  }
}`,...(ve=(pe=C.parameters)==null?void 0:pe.docs)==null?void 0:ve.source}}};const Me=["USPG01ForcedModeDisablesInput","USPG02BattleByButtons","USPG03ProgramResolvesBattle","USPG04RollDice","USPG05AutoBranchOnRoll","USPG06ForcedEvent","USPG07AiNarratesDuringEvent","USPG08ReturnToDialogue","USPG09ShowCurrentMode","USPG10TestHarness"];export{b as USPG01ForcedModeDisablesInput,w as USPG02BattleByButtons,B as USPG03ProgramResolvesBattle,T as USPG04RollDice,h as USPG05AutoBranchOnRoll,I as USPG06ForcedEvent,j as USPG07AiNarratesDuringEvent,S as USPG08ReturnToDialogue,H as USPG09ShowCurrentMode,C as USPG10TestHarness,Me as __namedExportsOrder,Ae as default};
