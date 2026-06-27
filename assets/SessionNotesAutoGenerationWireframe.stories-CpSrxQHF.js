import{w as l,u as r,e as s}from"./index-C3Z0PGzo.js";import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as c}from"./index-BlmOqGMO.js";import{A as de}from"./AppChrome-D4UNiJ5y.js";import{S as C}from"./SessionTurn-DWZJ2ukf.js";/* empty css               */import"./index-yBjzXJbu.js";const S=[{id:"N-104",kind:"new",note:"濡れた外套の人物",field:"新規人物Note",before:"未登録",after:"銀の鍵を知る人物。名前を答える危険を警告する。",turnId:"Turn 04",importance:"high",status:"pending",summary:"新しい人物を検出しました"},{id:"U-219",kind:"update",note:"銀の鍵",field:"用途",before:"用途不明",after:"閉じた星座を開く可能性がある",turnId:"Turn 07",importance:"medium",status:"pending",summary:"既存ノートに用途の更新案があります"},{id:"C-018",kind:"conflict",note:"地下図書館の位置",field:"所在地 Canon",before:"王都地下にある（Canon）",after:"海底に沈んだ都市にあるという発言",turnId:"Turn 09",importance:"high",status:"pending",summary:"Canonへの上書き候補を検出しました"}],N={new:"新規Note案",update:"更新差分",conflict:"矛盾検出",summary:"要約更新"},pe={name:"霧野しおり",email:"reader@myriale.example",initials:"霧野",role:"プレイヤー"};function q(){const[a,i]=c.useState(S),[t,j]=c.useState(S[0].id),[J,w]=c.useState("Turn確定後にAIがノート候補を抽出し、Pendingとして通知しています。自動Canon確定はしません。"),[K,Q]=c.useState("一定ターンごと"),[X,Z]=c.useState("重要度高のみ"),[ee,te]=c.useState("rumorのみ自動追加"),[ne,ae]=c.useState("水没した閲覧室で銀の鍵を得た。濡れた外套の人物は名前を答える危険を警告した。"),[se,oe]=c.useState("現在地: 螺旋階段 / 所持品: 銀の鍵 / 関係性: 外套の人物=警戒しつつ協力的"),b=a.filter(n=>n.status==="pending"),o=a.find(n=>n.id===t)??a[0],d=(n,T,ce)=>{i(le=>le.map(f=>f.id===n?{...f,status:T}:f)),w(ce)},p=n=>{if(n==="apply"){d(o.id,"applied",`「${o.note}」の差分を採用しました。必要な項目だけCanonへ反映しました。`);return}if(n==="edit"){d(o.id,"applied",`「${o.note}」を一部採用しました。編集後の内容だけNoteへ反映します。`);return}if(n==="reject"){d(o.id,"rejected",`「${o.note}」の提案を却下しました。任意の却下理由を残せます。`);return}if(n==="snooze"){d(o.id,"snoozed",`「${o.note}」を保留しました。通知は未処理として残ります。`);return}d(o.id,"applied","矛盾情報をCanon上書きせず「噂/誤認」として未確定で保持しました。")},ie=()=>{const n={id:`N-${300+a.length}`,kind:"new",note:"螺旋階段",field:"新規場所Note",before:"未登録",after:"水面下へ続くが、足元は乾いている不自然な階段。",turnId:`Turn ${10+a.length}`,importance:"medium",status:"pending",summary:"新しい場所を検出しました"};i(T=>[...T,n]),j(n.id),w("Turn確定後の非同期抽出で、新規Note案をPending生成しました。出典TurnIdを紐づけています。")},re=()=>{ae("章要約を更新: 銀の鍵、外套の人物、螺旋階段、閉じた星座が主要な文脈として圧縮されました。"),oe("次ターンContext: Scenario Lore + Lorebook Canon + State + ChapterSummary + 直近Nターン。"),w("ノート更新と同時に、トークン削減用の章要約/状態要約を更新しました。必要なら編集できます。")};return e.jsx(de,{section:"sessions",breadcrumbs:[{label:"Myriale",to:"scenarioRegister"},{label:"セッション",to:"startSession"},{label:"ノート自動生成"}],account:pe,children:e.jsxs("div",{className:"scenario-forge scenario-forge-wizard session-notes-auto-wireframe",children:[e.jsxs("aside",{className:"contract-spine","aria-label":"ノート更新通知",children:[e.jsx("strong",{children:"Note Updates"}),e.jsx("p",{className:"toc-help",children:"AIの抽出結果はCanonへ自動確定せず、Pending通知としてレビューします。"}),e.jsxs("button",{className:"spine-row spine-step active",onClick:ie,"aria-label":"Turnからノート候補を抽出",children:[e.jsx("span",{children:"Turn確定後に抽出"}),e.jsx("small",{children:"ExtractEntitiesFromTurn"})]}),e.jsxs("button",{className:"spine-row spine-step",onClick:re,"aria-label":"要約を更新",children:[e.jsx("span",{children:"要約を更新"}),e.jsx("small",{children:"Context圧縮"})]}),e.jsxs("div",{className:"scenario-id",children:[e.jsx("span",{children:"通知バッジ"}),e.jsxs("b",{"data-testid":"notification-badge",children:[b.length,"件"]})]})]}),e.jsxs("main",{className:"forge-paper wizard-paper program-driven-main","aria-label":"セッションとノート差分レビュー",children:[e.jsx("p",{className:"kicker",children:"Session notes / AI semi-automatic generation"}),e.jsx("div",{className:"notice",role:"status","data-testid":"notes-notice",children:J}),e.jsxs("section",{className:"dialogue-log program-log notes-turn-log","aria-label":"セッションターン","data-testid":"turn-log",children:[e.jsx(C,{ariaLabel:"Turn 04",lead:{tone:"player",tag:"YOU",text:"書架の奥にいる人物に声をかける",testId:"turn-04-input"},narrative:"濡れた外套の人物が姿を見せる。「鍵を持つ者がまた来たか」と言い、あなたの名前ではなく、あなたが失ったはずの記憶を尋ねてくる。",narrativeTag:"AI",narrativeTestId:"turn-04-narrative"}),e.jsx(C,{ariaLabel:"Turn 07",lead:{tone:"player",tag:"YOU",text:"銀の鍵で何を開けられるのか聞く"},narrative:"「閉じた星座だ」と人物は答える。開けば出口も過去も見えるが、どちらを選ぶかで失うものが違う。",narrativeTag:"AI"})]}),e.jsxs("section",{className:"notes-review-layout","aria-label":"通知一覧と差分ビュー",children:[e.jsxs("div",{className:"notes-notification-list","aria-label":"通知一覧",children:[e.jsx("h2",{children:"通知一覧"}),a.map(n=>e.jsxs("button",{className:`note-notification ${o.id===n.id?"active":""}`,onClick:()=>j(n.id),"aria-label":`${n.note}の通知を開く`,children:[e.jsxs("span",{children:[N[n.kind]," / ",n.importance]}),e.jsx("strong",{children:n.note}),e.jsxs("small",{children:[n.summary," · ",n.turnId," · ",n.status]})]},n.id))]}),e.jsxs("article",{className:"note-diff-view","aria-label":"ノート差分ビュー","data-testid":"diff-view",children:[e.jsxs("header",{children:[e.jsx("span",{children:N[o.kind]}),e.jsx("h2",{children:o.note}),e.jsxs("p",{children:[o.turnId," を根拠にしたPending差分です。"]})]}),e.jsxs("table",{className:"wire-table","aria-label":"ノート差分テーブル",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Field"}),e.jsx("th",{children:"Before"}),e.jsx("th",{children:"After"})]})}),e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{children:o.field}),e.jsx("td",{"data-testid":"diff-before",children:o.before}),e.jsx("td",{"data-testid":"diff-after",children:o.after})]})})]}),e.jsxs("div",{className:"button-row",children:[e.jsx("button",{className:"primary",onClick:()=>p("apply"),children:"採用"}),e.jsx("button",{onClick:()=>p("edit"),children:"一部採用"}),e.jsx("button",{onClick:()=>p("reject"),children:"却下"}),e.jsx("button",{onClick:()=>p("snooze"),children:"保留"}),o.kind==="conflict"&&e.jsx("button",{onClick:()=>p("rumor"),children:"噂/誤認として保持"})]})]})]})]}),e.jsxs("aside",{className:"ai-bookmark wizard-summary","aria-label":"ノート自動生成設定",children:[e.jsx("h2",{children:"Lorebook Inbox"}),e.jsxs("article",{children:[e.jsx("h3",{children:"通知設定"}),e.jsxs("label",{children:["通知タイミング",e.jsxs("select",{"aria-label":"通知タイミング",value:K,onChange:n=>Q(n.target.value),children:[e.jsx("option",{children:"毎ターン"}),e.jsx("option",{children:"一定ターンごと"}),e.jsx("option",{children:"章の終わり"}),e.jsx("option",{children:"手動でまとめて確認"})]})]}),e.jsxs("label",{children:["通知対象",e.jsxs("select",{"aria-label":"通知対象",value:X,onChange:n=>Z(n.target.value),children:[e.jsx("option",{children:"人物のみ"}),e.jsx("option",{children:"場所のみ"}),e.jsx("option",{children:"重要度高のみ"}),e.jsx("option",{children:"すべて"})]})]}),e.jsxs("label",{children:["自動採用ポリシー",e.jsxs("select",{"aria-label":"自動採用ポリシー",value:ee,onChange:n=>te(n.target.value),children:[e.jsx("option",{children:"rumorのみ自動追加"}),e.jsx("option",{children:"Canonは必ず確認"}),e.jsx("option",{children:"自動採用しない"})]})]})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"Pending / Canon"}),e.jsxs("p",{"data-testid":"pending-count",children:["Pending ",b.length,"件"]}),e.jsx("p",{children:"Canon上書き: 必ず確認"})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"ChapterSummary"}),e.jsx("p",{"data-testid":"chapter-summary",children:ne})]}),e.jsxs("article",{children:[e.jsx("h3",{children:"State Summary"}),e.jsx("p",{"data-testid":"state-summary",children:se})]})]})]})})}q.__docgenInfo={description:"",methods:[],displayName:"SessionNotesAutoGenerationWireframe"};const we={title:"Session notes auto generation/Wireframe from user stories",component:q,parameters:{notes:"docs/user-stories/session-notes-auto-generation-user-stories.md の各ユーザーストーリー（US-AN01〜AN07）を、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。"}},m={name:"US-AN01: 重要情報からノートを自動作成してほしい",play:async({canvasElement:a,step:i})=>{const t=l(a);await i("Turn確定後に新規エンティティを検出し、Pendingノート案を生成する",async()=>{await r.click(t.getByRole("button",{name:"Turnからノート候補を抽出"})),await s(t.getByTestId("notes-notice")).toHaveTextContent("新規Note案をPending生成"),await s(t.getByTestId("diff-view")).toHaveTextContent("螺旋階段"),await s(t.getByTestId("diff-view")).toHaveTextContent("Turn")})}},u={name:"US-AN02: 既存ノートを自動更新してほしい",play:async({canvasElement:a,step:i})=>{const t=l(a);await i("既存Noteの未記載属性を更新差分として表示する",async()=>{await r.click(t.getByRole("button",{name:"銀の鍵の通知を開く"})),await s(t.getByRole("table",{name:"ノート差分テーブル"})).toHaveTextContent("用途"),await s(t.getByTestId("diff-before")).toHaveTextContent("用途不明"),await s(t.getByTestId("diff-after")).toHaveTextContent("閉じた星座")})}},x={name:"US-AN03: ノート更新通知を見たい",play:async({canvasElement:a,step:i})=>{const t=l(a);await i("通知バッジ件数と通知一覧から差分ビューへ移動できる",async()=>{await s(t.getByTestId("notification-badge")).toHaveTextContent("3件"),await s(t.getByLabelText("通知一覧")).toHaveTextContent("新規Note案"),await r.click(t.getByRole("button",{name:"地下図書館の位置の通知を開く"})),await s(t.getByTestId("diff-view")).toHaveTextContent("Canonへの上書き候補")})}},v={name:"US-AN04: 通知から更新案をレビューして採用/却下したい",play:async({canvasElement:a,step:i})=>{const t=l(a);await i("差分を確認して採用し、自動確定ではなくユーザー操作で反映する",async()=>{await r.click(t.getByRole("button",{name:"採用"})),await s(t.getByTestId("notes-notice")).toHaveTextContent("差分を採用"),await s(t.getByTestId("pending-count")).toHaveTextContent("Pending 2件")})}},y={name:"US-AN05: 通知頻度や粒度を設定したい",play:async({canvasElement:a,step:i})=>{const t=l(a);await i("通知タイミング・対象・自動採用ポリシーを調整する",async()=>{await r.selectOptions(t.getByLabelText("通知タイミング"),"章の終わり"),await r.selectOptions(t.getByLabelText("通知対象"),"人物のみ"),await r.selectOptions(t.getByLabelText("自動採用ポリシー"),"Canonは必ず確認"),await s(t.getByLabelText("通知タイミング")).toHaveValue("章の終わり"),await s(t.getByLabelText("通知対象")).toHaveValue("人物のみ"),await s(t.getByLabelText("自動採用ポリシー")).toHaveValue("Canonは必ず確認")})}},g={name:"US-AN06: 矛盾が出たら判断が必要と通知してほしい",play:async({canvasElement:a,step:i})=>{const t=l(a);await i("Canon上書き候補を矛盾通知として開き、噂/誤認として保持する",async()=>{await r.click(t.getByRole("button",{name:"地下図書館の位置の通知を開く"})),await s(t.getByTestId("diff-view")).toHaveTextContent("Canon"),await r.click(t.getByRole("button",{name:"噂/誤認として保持"})),await s(t.getByTestId("notes-notice")).toHaveTextContent("噂/誤認")})}},h={name:"US-AN07: ノート更新と同時に要約も育てたい",play:async({canvasElement:a,step:i})=>{const t=l(a);await i("章要約とState要約を更新し、次ターンContext構成を確認する",async()=>{await r.click(t.getByRole("button",{name:"要約を更新"})),await s(t.getByTestId("chapter-summary")).toHaveTextContent("章要約を更新"),await s(t.getByTestId("state-summary")).toHaveTextContent("Scenario Lore + Lorebook Canon"),await s(t.getByTestId("notes-notice")).toHaveTextContent("トークン削減用")})}};var B,I,A;m.parameters={...m.parameters,docs:{...(B=m.parameters)==null?void 0:B.docs,source:{originalSource:`{
  name: 'US-AN01: 重要情報からノートを自動作成してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Turn確定後に新規エンティティを検出し、Pendingノート案を生成する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'Turnからノート候補を抽出'
      }));
      await expect(canvas.getByTestId('notes-notice')).toHaveTextContent('新規Note案をPending生成');
      await expect(canvas.getByTestId('diff-view')).toHaveTextContent('螺旋階段');
      await expect(canvas.getByTestId('diff-view')).toHaveTextContent('Turn');
    });
  }
}`,...(A=(I=m.parameters)==null?void 0:I.docs)==null?void 0:A.source}}};var k,H,U;u.parameters={...u.parameters,docs:{...(k=u.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: 'US-AN02: 既存ノートを自動更新してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('既存Noteの未記載属性を更新差分として表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '銀の鍵の通知を開く'
      }));
      await expect(canvas.getByRole('table', {
        name: 'ノート差分テーブル'
      })).toHaveTextContent('用途');
      await expect(canvas.getByTestId('diff-before')).toHaveTextContent('用途不明');
      await expect(canvas.getByTestId('diff-after')).toHaveTextContent('閉じた星座');
    });
  }
}`,...(U=(H=u.parameters)==null?void 0:H.docs)==null?void 0:U.source}}};var E,L,R;x.parameters={...x.parameters,docs:{...(E=x.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: 'US-AN03: ノート更新通知を見たい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('通知バッジ件数と通知一覧から差分ビューへ移動できる', async () => {
      await expect(canvas.getByTestId('notification-badge')).toHaveTextContent('3件');
      await expect(canvas.getByLabelText('通知一覧')).toHaveTextContent('新規Note案');
      await userEvent.click(canvas.getByRole('button', {
        name: '地下図書館の位置の通知を開く'
      }));
      await expect(canvas.getByTestId('diff-view')).toHaveTextContent('Canonへの上書き候補');
    });
  }
}`,...(R=(L=x.parameters)==null?void 0:L.docs)==null?void 0:R.source}}};var P,O,z;v.parameters={...v.parameters,docs:{...(P=v.parameters)==null?void 0:P.docs,source:{originalSource:`{
  name: 'US-AN04: 通知から更新案をレビューして採用/却下したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('差分を確認して採用し、自動確定ではなくユーザー操作で反映する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '採用'
      }));
      await expect(canvas.getByTestId('notes-notice')).toHaveTextContent('差分を採用');
      await expect(canvas.getByTestId('pending-count')).toHaveTextContent('Pending 2件');
    });
  }
}`,...(z=(O=v.parameters)==null?void 0:O.docs)==null?void 0:z.source}}};var $,V,F;y.parameters={...y.parameters,docs:{...($=y.parameters)==null?void 0:$.docs,source:{originalSource:`{
  name: 'US-AN05: 通知頻度や粒度を設定したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('通知タイミング・対象・自動採用ポリシーを調整する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('通知タイミング'), '章の終わり');
      await userEvent.selectOptions(canvas.getByLabelText('通知対象'), '人物のみ');
      await userEvent.selectOptions(canvas.getByLabelText('自動採用ポリシー'), 'Canonは必ず確認');
      await expect(canvas.getByLabelText('通知タイミング')).toHaveValue('章の終わり');
      await expect(canvas.getByLabelText('通知対象')).toHaveValue('人物のみ');
      await expect(canvas.getByLabelText('自動採用ポリシー')).toHaveValue('Canonは必ず確認');
    });
  }
}`,...(F=(V=y.parameters)==null?void 0:V.docs)==null?void 0:F.source}}};var _,W,D;g.parameters={...g.parameters,docs:{...(_=g.parameters)==null?void 0:_.docs,source:{originalSource:`{
  name: 'US-AN06: 矛盾が出たら判断が必要と通知してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Canon上書き候補を矛盾通知として開き、噂/誤認として保持する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '地下図書館の位置の通知を開く'
      }));
      await expect(canvas.getByTestId('diff-view')).toHaveTextContent('Canon');
      await userEvent.click(canvas.getByRole('button', {
        name: '噂/誤認として保持'
      }));
      await expect(canvas.getByTestId('notes-notice')).toHaveTextContent('噂/誤認');
    });
  }
}`,...(D=(W=g.parameters)==null?void 0:W.docs)==null?void 0:D.source}}};var G,Y,M;h.parameters={...h.parameters,docs:{...(G=h.parameters)==null?void 0:G.docs,source:{originalSource:`{
  name: 'US-AN07: ノート更新と同時に要約も育てたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('章要約とState要約を更新し、次ターンContext構成を確認する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '要約を更新'
      }));
      await expect(canvas.getByTestId('chapter-summary')).toHaveTextContent('章要約を更新');
      await expect(canvas.getByTestId('state-summary')).toHaveTextContent('Scenario Lore + Lorebook Canon');
      await expect(canvas.getByTestId('notes-notice')).toHaveTextContent('トークン削減用');
    });
  }
}`,...(M=(Y=h.parameters)==null?void 0:Y.docs)==null?void 0:M.source}}};const Te=["USAN01CreatePendingNote","USAN02UpdateExistingNote","USAN03NotificationBadgeAndList","USAN04ReviewApplyRejectSnooze","USAN05TuneNotificationSettings","USAN06ConflictDecision","USAN07UpdateSummaryForContext"];export{m as USAN01CreatePendingNote,u as USAN02UpdateExistingNote,x as USAN03NotificationBadgeAndList,v as USAN04ReviewApplyRejectSnooze,y as USAN05TuneNotificationSettings,g as USAN06ConflictDecision,h as USAN07UpdateSummaryForContext,Te as __namedExportsOrder,we as default};
