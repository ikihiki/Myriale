import{j}from"./jsx-runtime-Cf8x2fCZ.js";import{w as c,e,u as o}from"./index-C3Z0PGzo.js";import{M as x,c as P}from"./MyrialeApp-DDas1-Wn.js";/* empty css               */import"./index-yBjzXJbu.js";import"./index-BlmOqGMO.js";import"./AppChrome-B5ZJ3NP-.js";import"./SessionTurn-DWZJ2ukf.js";import"./account-Cq75HoV1.js";const K={title:"Session notes auto generation/Wireframe from user stories",component:x,render:()=>j.jsx(x,{initialUrl:"/sessions/SES-PREP-1098/play",initialDb:P("notesReview")}),parameters:{notes:"ノート系ユーザーストーリーは独立画面ではなく、セッション中のサイド/全画面ノートワークスペースとして表示します。"}},s=n=>c(n.getByTestId("session-notes-full")),i={name:"US-AN01: 重要情報からノートを自動作成してほしい",play:async({canvasElement:n,step:a})=>{const t=c(n);await a("セッション画面内の全画面ノートで新規ノートを作成し、編集ダイアログを開く",async()=>{await e(t.getByTestId("app-db-summary")).toHaveTextContent("route playSession"),await e(t.getByTestId("app-db-summary")).toHaveTextContent("notes full"),await o.click(s(t).getByRole("button",{name:"場所追加"})),await e(t.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("地下天文台"),await e(t.getByTestId("app-db-summary")).toHaveTextContent("open location-4")})}},r={name:"US-AN02: 既存ノートをセッション中に更新したい",play:async({canvasElement:n,step:a})=>{const t=c(n);await a("既存ノートをダイアログで開き、項目を編集する",async()=>{await o.click(s(t).getByRole("button",{name:"月読ミナトを編集"})),await o.clear(t.getByLabelText("別名")),await o.type(t.getByLabelText("別名"),"水際の案内人"),await e(t.getByRole("dialog",{name:"ノート編集"})).toHaveTextContent("月読ミナト"),await e(t.getByTestId("session-notes-notice")).toHaveTextContent("編集中")})}},p={name:"US-AN03: セッション中にノート一覧をすぐ見たい",play:async({canvasElement:n,step:a})=>{const t=c(n);await a("プレイ画面のノート全画面に一覧・検索・Contextが同時に表示される",async()=>{await e(s(t).getByLabelText("ノート一覧")).toHaveTextContent("月読ミナト"),await e(s(t).getByLabelText("ノートContext")).toHaveTextContent("Canon Notes"),await e(s(t).getByTestId("canon-count")).toHaveTextContent("2件")})}},y={name:"US-AN04: ノート更新判断をセッション中に行いたい",play:async({canvasElement:n,step:a})=>{const t=c(n);await a("整合性判断を同じノートワークスペースで行う",async()=>{await o.click(s(t).getByRole("button",{name:"整合性チェック"})),await e(s(t).getByTestId("consistency-issue")).toHaveTextContent("矛盾候補"),await o.click(s(t).getByRole("button",{name:"噂として保持"})),await e(t.getByTestId("session-notes-notice")).toHaveTextContent("噂として保持")})}},m={name:"US-AN05: ノート確認の表示方法を切り替えたい",play:async({canvasElement:n,step:a})=>{const t=c(n);await a("DBのUI状態で全画面からサイド表示へ戻せる",async()=>{await o.click(t.getByRole("button",{name:"サイド表示に戻す"})),await e(t.getByTestId("app-db-summary")).toHaveTextContent("notes side"),await e(t.getByTestId("session-notes-side")).toHaveTextContent("月読ミナト")})}},l={name:"US-AN06: 矛盾が出たら判断が必要と通知してほしい",play:async({canvasElement:n,step:a})=>{const t=c(n);await a("整合性チェックで矛盾候補を出し、Canon変更はユーザー操作に委ねる",async()=>{await o.click(s(t).getByRole("button",{name:"整合性チェック"})),await e(s(t).getByTestId("consistency-issue")).toHaveTextContent("王都地下"),await o.click(s(t).getByRole("button",{name:"AI出力を修正"})),await e(t.getByTestId("session-notes-notice")).toHaveTextContent("Canonは変更しません")})}},v={name:"US-AN07: ノート更新と同時に要約も育てたい",play:async({canvasElement:n,step:a})=>{const t=c(n);await a("次ターンContextをノートから再構築する",async()=>{await o.click(s(t).getByRole("button",{name:"Context再構築"})),await e(s(t).getByTestId("context-stack")).toHaveTextContent("次ターンContext"),await e(t.getByTestId("session-notes-notice")).toHaveTextContent("再構築")})}};var w,d,u;i.parameters={...i.parameters,docs:{...(w=i.parameters)==null?void 0:w.docs,source:{originalSource:`{
  name: 'US-AN01: 重要情報からノートを自動作成してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('セッション画面内の全画面ノートで新規ノートを作成し、編集ダイアログを開く', async () => {
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route playSession');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('notes full');
      await userEvent.click(notes(canvas).getByRole('button', {
        name: '場所追加'
      }));
      await expect(canvas.getByRole('dialog', {
        name: 'ノート編集'
      })).toHaveTextContent('地下天文台');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('open location-4');
    });
  }
}`,...(u=(d=i.parameters)==null?void 0:d.docs)==null?void 0:u.source}}};var g,T,B;r.parameters={...r.parameters,docs:{...(g=r.parameters)==null?void 0:g.docs,source:{originalSource:`{
  name: 'US-AN02: 既存ノートをセッション中に更新したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('既存ノートをダイアログで開き、項目を編集する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', {
        name: '月読ミナトを編集'
      }));
      await userEvent.clear(canvas.getByLabelText('別名'));
      await userEvent.type(canvas.getByLabelText('別名'), '水際の案内人');
      await expect(canvas.getByRole('dialog', {
        name: 'ノート編集'
      })).toHaveTextContent('月読ミナト');
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('編集中');
    });
  }
}`,...(B=(T=r.parameters)==null?void 0:T.docs)==null?void 0:B.source}}};var C,S,N;p.parameters={...p.parameters,docs:{...(C=p.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: 'US-AN03: セッション中にノート一覧をすぐ見たい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('プレイ画面のノート全画面に一覧・検索・Contextが同時に表示される', async () => {
      await expect(notes(canvas).getByLabelText('ノート一覧')).toHaveTextContent('月読ミナト');
      await expect(notes(canvas).getByLabelText('ノートContext')).toHaveTextContent('Canon Notes');
      await expect(notes(canvas).getByTestId('canon-count')).toHaveTextContent('2件');
    });
  }
}`,...(N=(S=p.parameters)==null?void 0:S.docs)==null?void 0:N.source}}};var A,U,b;y.parameters={...y.parameters,docs:{...(A=y.parameters)==null?void 0:A.docs,source:{originalSource:`{
  name: 'US-AN04: ノート更新判断をセッション中に行いたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('整合性判断を同じノートワークスペースで行う', async () => {
      await userEvent.click(notes(canvas).getByRole('button', {
        name: '整合性チェック'
      }));
      await expect(notes(canvas).getByTestId('consistency-issue')).toHaveTextContent('矛盾候補');
      await userEvent.click(notes(canvas).getByRole('button', {
        name: '噂として保持'
      }));
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('噂として保持');
    });
  }
}`,...(b=(U=y.parameters)==null?void 0:U.docs)==null?void 0:b.source}}};var H,E,I;m.parameters={...m.parameters,docs:{...(H=m.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: 'US-AN05: ノート確認の表示方法を切り替えたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('DBのUI状態で全画面からサイド表示へ戻せる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'サイド表示に戻す'
      }));
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('notes side');
      await expect(canvas.getByTestId('session-notes-side')).toHaveTextContent('月読ミナト');
    });
  }
}`,...(I=(E=m.parameters)==null?void 0:E.docs)==null?void 0:I.source}}};var R,k,f;l.parameters={...l.parameters,docs:{...(R=l.parameters)==null?void 0:R.docs,source:{originalSource:`{
  name: 'US-AN06: 矛盾が出たら判断が必要と通知してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('整合性チェックで矛盾候補を出し、Canon変更はユーザー操作に委ねる', async () => {
      await userEvent.click(notes(canvas).getByRole('button', {
        name: '整合性チェック'
      }));
      await expect(notes(canvas).getByTestId('consistency-issue')).toHaveTextContent('王都地下');
      await userEvent.click(notes(canvas).getByRole('button', {
        name: 'AI出力を修正'
      }));
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('Canonは変更しません');
    });
  }
}`,...(f=(k=l.parameters)==null?void 0:k.docs)==null?void 0:f.source}}};var L,h,D;v.parameters={...v.parameters,docs:{...(L=v.parameters)==null?void 0:L.docs,source:{originalSource:`{
  name: 'US-AN07: ノート更新と同時に要約も育てたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('次ターンContextをノートから再構築する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', {
        name: 'Context再構築'
      }));
      await expect(notes(canvas).getByTestId('context-stack')).toHaveTextContent('次ターンContext');
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('再構築');
    });
  }
}`,...(D=(h=v.parameters)==null?void 0:h.docs)==null?void 0:D.source}}};const Q=["USAN01CreatePendingNote","USAN02UpdateExistingNote","USAN03NotificationBadgeAndList","USAN04ReviewApplyRejectSnooze","USAN05TuneNotificationSettings","USAN06ConflictDecision","USAN07UpdateSummaryForContext"];export{i as USAN01CreatePendingNote,r as USAN02UpdateExistingNote,p as USAN03NotificationBadgeAndList,y as USAN04ReviewApplyRejectSnooze,m as USAN05TuneNotificationSettings,l as USAN06ConflictDecision,v as USAN07UpdateSummaryForContext,Q as __namedExportsOrder,K as default};
