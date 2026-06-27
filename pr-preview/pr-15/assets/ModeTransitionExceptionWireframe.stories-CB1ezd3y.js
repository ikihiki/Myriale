import{w as v,u as i,e as n}from"./index-C3Z0PGzo.js";import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as d}from"./index-BlmOqGMO.js";import{A as Se}from"./AppChrome-DsxVHE4T.js";import{S as O}from"./SessionTurn-DWZJ2ukf.js";/* empty css               */import"./index-yBjzXJbu.js";const m={dialogue:{label:"AI対話モード",badge:"対話中",forced:!1,reason:"自由入力で行動や会話を送れます。",objective:"物語を自由に進める",processing:"AIが入力を解釈し、次のNarrativeを生成します。"},battle:{label:"プログラム主導: バトル",badge:"バトル中",forced:!0,reason:"バトル中は状態不整合を避けるため、自由入力と巻き戻しを制限します。",objective:"書架番を撃退する",processing:"行動ボタンの結果をプログラムが確定し、AIは演出だけを語ります。"},roll:{label:"プログラム主導: 判定",badge:"判定中",forced:!0,reason:"判定中はダイス結果をプログラムが確定するため、自由入力は無効です。",objective:"錆びた扉を開けられるか判定する",processing:"d6を生成し、成功/失敗ルートを確定します。"},event:{label:"プログラム主導: 強制イベント",badge:"イベント進行中",forced:!0,reason:"強制イベント中は中断できない処理を安全に完了させるため、入力と巻き戻しを制限します。",objective:"崩落イベントを最後まで処理する",processing:"確定済みの出来事を順番に再生し、終了後にAI対話へ戻します。"},recovering:{label:"復旧確認",badge:"復旧中",forced:!0,reason:"未確定結果を反映せず、どこまで確定したか確認しています。",objective:"安全な進行地点を選んで復帰する",processing:"最後に確定した地点またはセーフポイントから再開できます。"}},Ce={name:"霧野しおり",email:"reader@myriale.example",initials:"霧野",role:"プレイヤー"};function ve(){const[s,o]=d.useState("dialogue"),[t,g]=d.useState("AI対話モード"),[N,$]=d.useState(""),[ge,u]=d.useState("現在はAI対話モードです。自由入力と巻き戻しが利用できます。"),[D,L]=d.useState("Turn 18: 書架番が現れる直前まで確定"),[ue,b]=d.useState("未完了処理なし"),[xe,be]=d.useState(null),[c,P]=d.useState({enemy:"錆びついた書架番",enemyHp:24,playerHp:30,turn:1}),[E,ye]=d.useState([{id:1,mode:"dialogue",narrative:"あなたは星図灯を掲げ、軋む書架の間を進む。まだ自由に話しかけ、調べ、引き返すことができる。"}]),[R,we]=d.useState([{id:1,from:"—",to:"AI対話モード",reason:"セッション再開",startedAt:"21:04:12",endedAt:"継続中"}]),p=m[s],r=p.forced,y=a=>{ye(l=>[...l,{...a,id:l.length+1}])},k=(a,l,A,T="継続中")=>{const h=`21:${String(5+R.length).padStart(2,"0")}:${String(10+R.length).padStart(2,"0")}`;we(x=>[...x,{id:x.length+1,from:m[a].label,to:m[l].label,reason:A,startedAt:h,endedAt:T}])},w=(a,l)=>{k(s,a,l),o(a),g(m[a].label),b(a==="dialogue"?"未完了処理なし":`${m[a].label}の処理が未完了`),u(`${l}: Session Stateのmodeを「${m[a].label}」へ保存し、UIを切り替えました。`),a==="battle"&&P({enemy:"錆びついた書架番",enemyHp:24,playerHp:30,turn:1}),y({mode:a,fact:`MODE: ${m[s].label} → ${m[a].label} / 理由: ${l}`,narrative:a==="dialogue"?"緊張が解け、あなたは再び自分の言葉で物語を動かせる。":a==="battle"?"通常のターン進行画面のまま、次のターン表示がバトル用に切り替わる。行動ボタンはターン内に現れ、結果も同じログ形式で積み上がる。":`${m[a].badge}に入りました。画面は処理中内容と現在の目的を表示し、自由入力を一時的に閉じます。`})},Te=a=>{if(s!=="battle")return;const l={攻撃:8,防御:2,スキル:12,逃走:0},A={攻撃:4,防御:1,スキル:5,逃走:0},T=l[a],h=A[a],x=Math.max(0,c.enemyHp-T),U=Math.max(0,c.playerHp-h),z=c.turn+1;P({...c,enemyHp:x,playerHp:U,turn:z}),L(`Turn ${18+E.length}: バトル行動「${a}」を確定 / 敵HP ${x} / 自HP ${U}`),b(x===0?"バトル結果確定。AI対話へ復帰可能":`Battle Turn ${z} の行動選択待ち`),u(`ターン内のバトル操作で「${a}」を確定しました。行動ログは通常ターンと同じ形式で追加されます。`),y({mode:"battle",fact:`BATTLE TURN ${c.turn}: 行動「${a}」確定 / 与ダメージ${T} / 被ダメージ${h} / 敵HP ${x} / 自HP ${U}`,narrative:a==="逃走"?"あなたは崩れた書架の陰へ飛び込み、敵との距離を取り直す。":`あなたの${a}が書架番の装甲を打ち、通常のターンログとして結果が記録される。`})},he=()=>{L(`Turn ${18+E.length}: ${p.label}の結果を確定`),w("dialogue","プログラム主導シーン正常終了"),b("未完了処理なし"),u("正常終了しました。AI対話モードに戻り、自由入力と巻き戻しが再度有効になりました。")},Be=()=>{k(s,"recovering","プログラム処理エラー"),o("recovering"),g("復旧確認"),b("未確定: ダメージ計算の後半は反映しない"),u("エラーが発生しました。確定済み地点を表示し、未確定の処理結果はSession Stateへ反映しません。"),y({mode:"recovering",fact:"ERROR: ダメージ計算の途中で失敗。確定済み=行動選択まで / 未確定=ダメージ反映",narrative:"物語は一時停止した。あなたが失ったものはない。最後に確かな地点から、もう一度選び直せる。"})},Ie=()=>{b(`${p.label}の未完了UIを再提示`),u("通信断から再接続しました。最後に確定した進行地点からモード状態を復元し、未完了処理を再提示します。"),y({mode:s,fact:`RECONNECT: ${t}を復元 / lastConfirmed=${D}`,narrative:"画面は中断前と同じ進行モードに戻り、まだ確定していない操作だけを再提示する。"})},F=a=>{be(a),o("dialogue"),g("AI対話モード"),b("未完了処理なし"),k("recovering","dialogue",a==="lastConfirmed"?"最後に確定した地点から復帰":"安全なセーフポイントへ復帰","21:12:02"),u(a==="lastConfirmed"?"最後に確定した地点から復帰しました。":"安全なセーフポイントへ戻りました。")},je=()=>{const a=N.trim();!a||r||(y({mode:"dialogue",fact:`PLAYER: ${a}`,narrative:"AIは入力を受け取り、物語を自由に続ける。"}),$(""),u("自由入力を送信しました。"))};return e.jsx(Se,{section:"sessions",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"セッション",to:"startSession"},{label:"モード遷移と例外"}],account:Ce,children:e.jsxs("div",{className:"scenario-forge scenario-forge-wizard program-driven-wireframe mode-transition-wireframe",children:[e.jsxs("aside",{className:"contract-spine","aria-label":"モード遷移トリガー",children:[e.jsx("strong",{children:"Mode Control"}),e.jsx("p",{className:"toc-help",children:"暗黙の切替ではなく、Session Stateのmodeとして保存し、例外時も確定地点から復帰します。"}),e.jsxs("div",{className:"wizard-step-list",role:"list","aria-label":"モード切替",children:[e.jsxs("button",{className:"spine-row spine-step",onClick:()=>w("battle","バトル開始"),"aria-label":"バトル開始",children:[e.jsx("span",{children:"バトル開始"}),e.jsx("small",{children:"自由入力を無効化"})]}),e.jsxs("button",{className:"spine-row spine-step",onClick:()=>w("roll","ダイス判定開始"),"aria-label":"判定開始",children:[e.jsx("span",{children:"判定開始"}),e.jsx("small",{children:"ダイスUIを表示"})]}),e.jsxs("button",{className:"spine-row spine-step",onClick:()=>w("event","強制イベント開始"),"aria-label":"強制イベント開始",children:[e.jsx("span",{children:"強制イベント開始"}),e.jsx("small",{children:"自動進行を表示"})]}),e.jsxs("button",{className:"spine-row spine-step",onClick:he,disabled:!r||s==="recovering","aria-label":"正常終了してAI対話へ戻る",children:[e.jsx("span",{children:"正常終了"}),e.jsx("small",{children:"AI対話へ復帰"})]})]}),e.jsxs("div",{className:"scenario-id",children:[e.jsx("span",{children:"Session mode"}),e.jsx("b",{"data-testid":"session-mode-state",children:t})]})]}),e.jsxs("main",{className:"forge-paper wizard-paper program-driven-main","aria-label":"モード遷移と例外処理",children:[e.jsx("p",{className:"kicker",children:"Session foundation / Mode transitions and exceptions"}),e.jsxs("div",{className:`mode-banner mode-${s==="recovering"?"event":s}`,role:"status","data-testid":"mode-banner",children:[e.jsx("span",{className:"mode-badge","data-testid":"mode-badge",children:p.badge}),e.jsx("span",{className:"mode-reason","data-testid":"mode-reason",children:p.reason})]}),e.jsx("div",{className:"notice",role:"status","data-testid":"mode-notice",children:ge}),e.jsxs("section",{className:"dialogue-log program-log","aria-label":"進行ログ","data-testid":"narrative-log",children:[s==="battle"&&e.jsx(O,{ariaLabel:`バトルターン ${c.turn}`,testId:"active-battle-turn",selected:!0,variantClassName:"turn-battle active-battle-turn",lead:{tone:"program",tag:"BATTLE",text:`Battle Turn ${c.turn}: ${c.enemy} HP ${c.enemyHp} / あなたのHP ${c.playerHp}`,testId:"battle-turn-lead",actions:e.jsx("div",{className:"button-row",role:"group","aria-label":"バトルターン行動",children:["攻撃","防御","スキル","逃走"].map(a=>e.jsx("button",{onClick:()=>Te(a),children:a},a))}),detail:e.jsx("p",{className:"program-hint",children:"通常のターン表示コンポーネント内で、リード部分だけがバトル用操作に切り替わります。"})},narrative:"敵の動き、選択可能な行動、確定後の描写が同じターン進行ログの中で続きます。",narrativeTag:"AI",narrativeTestId:"battle-turn-narrative"}),E.map(a=>e.jsx(O,{ariaLabel:`ログ ${a.id}`,variantClassName:`turn-${a.mode==="recovering"?"event":a.mode}`,lead:a.fact?{tone:"program",tag:"STATE",text:a.fact,testId:`fact-${a.id}`}:void 0,narrative:a.narrative,narrativeTag:"AI",narrativeTestId:`narrative-${a.id}`},a.id))]}),e.jsxs("section",{className:"program-controls dialogue-controls","aria-label":"自由入力と巻き戻し",children:[e.jsx("label",{className:"sr-only",htmlFor:"mode-free-input",children:"自由に行動や会話を入力"}),e.jsxs("div",{className:"free-input-row",children:[e.jsx("input",{id:"mode-free-input","aria-label":"自由に行動や会話を入力",value:N,disabled:r,placeholder:r?"プログラム主導モード中は自由入力できません":"例: 書架番に呼びかける",onChange:a=>$(a.target.value)}),e.jsx("button",{onClick:je,disabled:r,"data-testid":"send-free-input",children:"行動を送る"}),e.jsx("button",{disabled:r,"data-testid":"rewind-button",children:"巻き戻し"})]}),r&&e.jsxs("p",{className:"program-hint input-disabled-reason","data-testid":"input-disabled-reason",children:["自由入力と巻き戻しが無効な理由: ",p.reason," 終了後に可能です。"]})]})]}),e.jsxs("aside",{className:"ai-bookmark wizard-summary","aria-label":"Mode State",children:[e.jsx("h2",{children:"Mode State"}),e.jsxs("article",{children:[e.jsx("h3",{children:"Session State"}),e.jsxs("p",{"data-testid":"summary-mode",children:["mode: ",t]}),e.jsx("p",{children:r?"programDriven=true":"programDriven=false"})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"操作可否"}),e.jsxs("p",{"data-testid":"summary-input",children:["自由入力: ",r?"無効":"有効"]}),e.jsxs("p",{"data-testid":"summary-rewind",children:["巻き戻し: ",r?"終了後に可能":"可能"]})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"強制進行の確認情報"}),e.jsxs("p",{"data-testid":"current-objective",children:["目的: ",p.objective]}),e.jsxs("p",{"data-testid":"processing-detail",children:["処理: ",p.processing]}),e.jsxs("p",{"data-testid":"last-confirmed",children:["確定地点: ",D]}),e.jsxs("p",{"data-testid":"pending-action",children:["未完了: ",ue]})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"例外時だけ使う操作"}),e.jsxs("div",{className:"button-row exception-actions",children:[e.jsx("button",{onClick:Be,disabled:!r||s==="recovering",children:"処理エラーを発生"}),e.jsx("button",{onClick:Ie,disabled:s==="dialogue",children:"通信断から再接続"}),e.jsx("button",{onClick:()=>F("lastConfirmed"),disabled:s!=="recovering",children:"最後に確定した地点から再開"}),e.jsx("button",{onClick:()=>F("safePoint"),disabled:s!=="recovering",children:"安全な地点へ戻る"})]}),e.jsxs("p",{className:"program-hint","data-testid":"recovery-point",children:["復旧選択: ",xe??"未選択"]})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"遷移履歴"}),e.jsxs("table",{className:"wire-table compact","aria-label":"モード遷移ログ",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"From"}),e.jsx("th",{children:"To"}),e.jsx("th",{children:"理由"}),e.jsx("th",{children:"時刻"})]})}),e.jsx("tbody",{children:R.map(a=>e.jsxs("tr",{children:[e.jsx("td",{children:a.from}),e.jsx("td",{children:a.to}),e.jsx("td",{children:a.reason}),e.jsxs("td",{children:[a.startedAt," / ",a.endedAt]})]},a.id))})]})]})]})]})})}ve.__docgenInfo={description:"",methods:[],displayName:"ModeTransitionExceptionWireframe"};const Ue={title:"Mode transition and exception/Wireframe from user stories",component:ve,parameters:{notes:"docs/user-stories/mode-transition-and-exception-user-stories.md の各ユーザーストーリー（US-M01〜M08）を、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。"}},B={name:"US-M01: システムが進行モードを明示的に切り替えたい",play:async({canvasElement:s,step:o})=>{const t=v(s);await o("バトル開始でSession Stateのmodeを保存し、通常のターン表示がバトル用操作へ切り替わる",async()=>{await i.click(t.getByRole("button",{name:"バトル開始"})),await n(t.getByTestId("session-mode-state")).toHaveTextContent("バトル"),await n(t.getByTestId("summary-mode")).toHaveTextContent("バトル"),await n(t.getByLabelText("自由に行動や会話を入力")).toBeDisabled(),await n(t.getByTestId("active-battle-turn")).toBeVisible(),await n(t.getByRole("group",{name:"バトルターン行動"})).toBeVisible()}),await o("ターン内の行動ボタンで操作し、結果も通常ターンと同じログ形式で追加する",async()=>{await i.click(t.getByRole("button",{name:"攻撃"})),await n(t.getByTestId("mode-notice")).toHaveTextContent("行動ログは通常ターンと同じ形式"),await n(t.getByTestId("narrative-log")).toHaveTextContent("BATTLE TURN 1"),await n(t.getByTestId("narrative-log")).toHaveTextContent("行動「攻撃」確定"),await n(t.getByTestId("battle-turn-lead")).toHaveTextContent("Battle Turn 2")})}},I={name:"US-M02: 現在の進行モードを理解できるようにしたい",play:async({canvasElement:s,step:o})=>{const t=v(s);await o("判定中バッジと自由入力不可の理由を表示する",async()=>{await i.click(t.getByRole("button",{name:"判定開始"})),await n(t.getByTestId("mode-badge")).toHaveTextContent("判定中"),await n(t.getByTestId("input-disabled-reason")).toHaveTextContent("自由入力と巻き戻しが無効"),await n(t.getByTestId("mode-reason")).toHaveTextContent("自由入力は無効")})}},j={name:"US-M03: プログラム主導モードが正常終了したらAI対話に戻りたい",play:async({canvasElement:s,step:o})=>{const t=v(s);await i.click(t.getByRole("button",{name:"強制イベント開始"})),await o("正常終了でAI対話モードへ復帰し、自由入力を再度有効にする",async()=>{await i.click(t.getByRole("button",{name:"正常終了してAI対話へ戻る"})),await n(t.getByTestId("mode-badge")).toHaveTextContent("対話中"),await n(t.getByLabelText("自由に行動や会話を入力")).toBeEnabled(),await n(t.getByTestId("mode-notice")).toHaveTextContent("自由入力と巻き戻しが再度有効")})}},S={name:"US-M04: エラーが起きても安全に復帰したい",play:async({canvasElement:s,step:o})=>{const t=v(s);await i.click(t.getByRole("button",{name:"バトル開始"})),await o("処理エラー時に確定済みと未確定を明示する",async()=>{await i.click(t.getByRole("button",{name:"処理エラーを発生"})),await n(t.getByTestId("mode-badge")).toHaveTextContent("復旧中"),await n(t.getByTestId("pending-action")).toHaveTextContent("未確定"),await n(t.getByTestId("narrative-log")).toHaveTextContent("未確定=ダメージ反映")}),await o("最後に確定した地点からAI対話へ復帰する",async()=>{await i.click(t.getByRole("button",{name:"最後に確定した地点から再開"})),await n(t.getByTestId("mode-badge")).toHaveTextContent("対話中"),await n(t.getByTestId("recovery-point")).toHaveTextContent("lastConfirmed")})}},C={name:"US-M05: 通信断・画面離脱が起きても再開したい",play:async({canvasElement:s,step:o})=>{const t=v(s);await i.click(t.getByRole("button",{name:"判定開始"})),await o("再接続時にモード状態を復元し、未完了処理を再提示する",async()=>{await i.click(t.getByRole("button",{name:"通信断から再接続"})),await n(t.getByTestId("mode-badge")).toHaveTextContent("判定中"),await n(t.getByTestId("pending-action")).toHaveTextContent("未完了UIを再提示"),await n(t.getByTestId("mode-notice")).toHaveTextContent("モード状態を復元")})}},H={name:"US-M06: プログラム主導モード中は巻き戻し操作を制限したい",play:async({canvasElement:s,step:o})=>{const t=v(s);await o("バトル中は巻き戻しを無効化し、終了後に可能と説明する",async()=>{await i.click(t.getByRole("button",{name:"バトル開始"})),await n(t.getByTestId("rewind-button")).toBeDisabled(),await n(t.getByTestId("summary-rewind")).toHaveTextContent("終了後に可能"),await n(t.getByTestId("input-disabled-reason")).toHaveTextContent("終了後に可能")})}},f={name:"US-M07: モード遷移の履歴をログとして残したい",play:async({canvasElement:s,step:o})=>{const t=v(s);await o("遷移理由と開始時刻をログテーブルへ残す",async()=>{await i.click(t.getByRole("button",{name:"バトル開始"})),await i.click(t.getByRole("button",{name:"正常終了してAI対話へ戻る"}));const g=t.getByRole("table",{name:"モード遷移ログ"});await n(g).toHaveTextContent("バトル開始"),await n(g).toHaveTextContent("プログラム主導シーン正常終了"),await n(g).toHaveTextContent("21:")})}},M={name:"US-M08: 強制進行中でも最低限の情報確認はできるようにしたい",play:async({canvasElement:s,step:o})=>{const t=v(s);await o("強制イベント中でも現在の目的と処理中内容を表示する",async()=>{await i.click(t.getByRole("button",{name:"強制イベント開始"})),await n(t.getByTestId("current-objective")).toHaveTextContent("崩落イベント"),await n(t.getByTestId("processing-detail")).toHaveTextContent("順番に再生"),await n(t.getByTestId("last-confirmed")).toHaveTextContent("Turn 18")})}};var V,_,W;B.parameters={...B.parameters,docs:{...(V=B.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: 'US-M01: システムが進行モードを明示的に切り替えたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('バトル開始でSession Stateのmodeを保存し、通常のターン表示がバトル用操作へ切り替わる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'バトル開始'
      }));
      await expect(canvas.getByTestId('session-mode-state')).toHaveTextContent('バトル');
      await expect(canvas.getByTestId('summary-mode')).toHaveTextContent('バトル');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
      await expect(canvas.getByTestId('active-battle-turn')).toBeVisible();
      await expect(canvas.getByRole('group', {
        name: 'バトルターン行動'
      })).toBeVisible();
    });
    await step('ターン内の行動ボタンで操作し、結果も通常ターンと同じログ形式で追加する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '攻撃'
      }));
      await expect(canvas.getByTestId('mode-notice')).toHaveTextContent('行動ログは通常ターンと同じ形式');
      await expect(canvas.getByTestId('narrative-log')).toHaveTextContent('BATTLE TURN 1');
      await expect(canvas.getByTestId('narrative-log')).toHaveTextContent('行動「攻撃」確定');
      await expect(canvas.getByTestId('battle-turn-lead')).toHaveTextContent('Battle Turn 2');
    });
  }
}`,...(W=(_=B.parameters)==null?void 0:_.docs)==null?void 0:W.source}}};var Y,q,G;I.parameters={...I.parameters,docs:{...(Y=I.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  name: 'US-M02: 現在の進行モードを理解できるようにしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('判定中バッジと自由入力不可の理由を表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '判定開始'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('判定中');
      await expect(canvas.getByTestId('input-disabled-reason')).toHaveTextContent('自由入力と巻き戻しが無効');
      await expect(canvas.getByTestId('mode-reason')).toHaveTextContent('自由入力は無効');
    });
  }
}`,...(G=(q=I.parameters)==null?void 0:q.docs)==null?void 0:G.source}}};var J,K,Q;j.parameters={...j.parameters,docs:{...(J=j.parameters)==null?void 0:J.docs,source:{originalSource:`{
  name: 'US-M03: プログラム主導モードが正常終了したらAI対話に戻りたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: '強制イベント開始'
    }));
    await step('正常終了でAI対話モードへ復帰し、自由入力を再度有効にする', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '正常終了してAI対話へ戻る'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('対話中');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeEnabled();
      await expect(canvas.getByTestId('mode-notice')).toHaveTextContent('自由入力と巻き戻しが再度有効');
    });
  }
}`,...(Q=(K=j.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};var X,Z,ee;S.parameters={...S.parameters,docs:{...(X=S.parameters)==null?void 0:X.docs,source:{originalSource:`{
  name: 'US-M04: エラーが起きても安全に復帰したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: 'バトル開始'
    }));
    await step('処理エラー時に確定済みと未確定を明示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '処理エラーを発生'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('復旧中');
      await expect(canvas.getByTestId('pending-action')).toHaveTextContent('未確定');
      await expect(canvas.getByTestId('narrative-log')).toHaveTextContent('未確定=ダメージ反映');
    });
    await step('最後に確定した地点からAI対話へ復帰する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '最後に確定した地点から再開'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('対話中');
      await expect(canvas.getByTestId('recovery-point')).toHaveTextContent('lastConfirmed');
    });
  }
}`,...(ee=(Z=S.parameters)==null?void 0:Z.docs)==null?void 0:ee.source}}};var te,ae,ne;C.parameters={...C.parameters,docs:{...(te=C.parameters)==null?void 0:te.docs,source:{originalSource:`{
  name: 'US-M05: 通信断・画面離脱が起きても再開したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: '判定開始'
    }));
    await step('再接続時にモード状態を復元し、未完了処理を再提示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '通信断から再接続'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('判定中');
      await expect(canvas.getByTestId('pending-action')).toHaveTextContent('未完了UIを再提示');
      await expect(canvas.getByTestId('mode-notice')).toHaveTextContent('モード状態を復元');
    });
  }
}`,...(ne=(ae=C.parameters)==null?void 0:ae.docs)==null?void 0:ne.source}}};var se,oe,ie;H.parameters={...H.parameters,docs:{...(se=H.parameters)==null?void 0:se.docs,source:{originalSource:`{
  name: 'US-M06: プログラム主導モード中は巻き戻し操作を制限したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('バトル中は巻き戻しを無効化し、終了後に可能と説明する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'バトル開始'
      }));
      await expect(canvas.getByTestId('rewind-button')).toBeDisabled();
      await expect(canvas.getByTestId('summary-rewind')).toHaveTextContent('終了後に可能');
      await expect(canvas.getByTestId('input-disabled-reason')).toHaveTextContent('終了後に可能');
    });
  }
}`,...(ie=(oe=H.parameters)==null?void 0:oe.docs)==null?void 0:ie.source}}};var re,ce,le;f.parameters={...f.parameters,docs:{...(re=f.parameters)==null?void 0:re.docs,source:{originalSource:`{
  name: 'US-M07: モード遷移の履歴をログとして残したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('遷移理由と開始時刻をログテーブルへ残す', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'バトル開始'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '正常終了してAI対話へ戻る'
      }));
      const table = canvas.getByRole('table', {
        name: 'モード遷移ログ'
      });
      await expect(table).toHaveTextContent('バトル開始');
      await expect(table).toHaveTextContent('プログラム主導シーン正常終了');
      await expect(table).toHaveTextContent('21:');
    });
  }
}`,...(le=(ce=f.parameters)==null?void 0:ce.docs)==null?void 0:le.source}}};var de,me,pe;M.parameters={...M.parameters,docs:{...(de=M.parameters)==null?void 0:de.docs,source:{originalSource:`{
  name: 'US-M08: 強制進行中でも最低限の情報確認はできるようにしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('強制イベント中でも現在の目的と処理中内容を表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '強制イベント開始'
      }));
      await expect(canvas.getByTestId('current-objective')).toHaveTextContent('崩落イベント');
      await expect(canvas.getByTestId('processing-detail')).toHaveTextContent('順番に再生');
      await expect(canvas.getByTestId('last-confirmed')).toHaveTextContent('Turn 18');
    });
  }
}`,...(pe=(me=M.parameters)==null?void 0:me.docs)==null?void 0:pe.source}}};const Ne=["USM01ExplicitModeSwitch","USM02ShowCurrentMode","USM03ReturnToDialogue","USM04RecoverFromError","USM05ResumeAfterDisconnect","USM06RestrictRewind","USM07LogTransitions","USM08ShowMinimumInfoDuringForcedMode"];export{B as USM01ExplicitModeSwitch,I as USM02ShowCurrentMode,j as USM03ReturnToDialogue,S as USM04RecoverFromError,C as USM05ResumeAfterDisconnect,H as USM06RestrictRewind,f as USM07LogTransitions,M as USM08ShowMinimumInfoDuringForcedMode,Ne as __namedExportsOrder,Ue as default};
