import{j as s}from"./jsx-runtime-BO8uF4Og.js";import{w as d,u as n,e as i}from"./index-C4S39nCK.js";import{a as ne,b as oe,c as se,d as re,e as ce,f as le,g as ue,h as de,M as l}from"./MyrialeApp-5p4T9Hc3.js";import{c as pe}from"./SessionPresentation-aPi_CQwP.js";import{r as y}from"./index-D4H_InIO.js";/* empty css               */import"./AdminAiProvidersPage-CgTK15Bi.js";import"./Surfaces-CzbTO6k_.js";import"./AppChrome-BJsxH9du.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-Buo1oKda.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CD8vBQ2i.js";import"./ConditionTablePresentation-CHGjlQyc.js";import"./EditPane-Cr8CgrZD.js";import"./scenarioWizardStyles-zxLrTCdZ.js";import"./NarrativeBody-4Kg13oE8.js";import"./ModuleUiHost-DC_KPAuE.js";import"./TurnInspectionPresentation-JEipLAGQ.js";import"./account-3SMbygbA.js";import"./SessionListPresentation-Dn2G4cwz.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-g7mZ0DmF.js";import"./SessionActivityFeed-DfVnD2W4.js";const p={name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"評価Organizer"},u={id:"EVAL-NARRATIVE-26",name:"Narrative候補 2026-08",description:"同一situationsで候補を比較し、人手rubricで採用判断する。",status:"draft",situationCount:2,candidateCount:2,completedResponseCount:0,plannedResponseCount:8,createdAt:"2026-08-10T01:00:00Z",updatedAt:"2026-08-10T01:10:00Z",situations:[{id:"SIT-FIXED",label:"閉ざされた東棟",stage:"narrative",source:"fixed",sourceLabel:"narrative-core v2.1",snapshotHash:"sha256:fixed",preview:"禁止情報を守り、新しい手掛かりを一つ提示する。",createdAt:"2026-08-10T01:02:00Z"},{id:"SIT-QUOTED",label:"星図書館 Turn 12",stage:"narrative",source:"quoted",sourceLabel:"Session 星図書館 / Turn 12",snapshotHash:"sha256:quoted",preview:"司書に封印書庫について尋ねる。",createdAt:"2026-08-10T01:03:00Z"}],candidates:[{id:"CAN-A",label:"Recommended profile",profileId:"runpod-recommended",profileRevision:4,repetitions:2,generation:{temperature:.8,maxOutputTokens:1200,seed:42,thinkingEnabled:!1}},{id:"CAN-B",label:"Economy profile",profileId:"runpod-economy",profileRevision:7,repetitions:2,generation:{temperature:.8,maxOutputTokens:1200,seed:42,thinkingEnabled:!1}}],rubric:[{id:"quality",label:"Narrative quality",description:"物語としての完成度",scaleMin:1,scaleMax:5,weight:1,required:!0},{id:"fidelity",label:"Instruction fidelity",description:"状況と指示への忠実さ",scaleMin:1,scaleMax:5,weight:1,required:!0}],reviewPolicy:"double-blind",identitiesRevealed:!1,revision:3},ve=[u,{...u,id:"EVAL-COMPLETE",name:"Action schema regression",status:"completed",completedResponseCount:8,reviewProgress:{completed:8,total:8},identitiesRevealed:!0}],me=[{id:"narrative-core",version:"2.1",name:"Narrative core cases",description:"continuity / fidelity / safetyの固定ケース",cases:[{id:"case-east-wing",label:"閉ざされた東棟",stage:"narrative",preview:"新しい手掛かりを一つ提示する。"},{id:"case-forbidden-name",label:"禁止情報の保持",stage:"narrative",preview:"未公開の固有名詞を出さない。"}]}],ye={scenarios:[{id:"SCN-STAR-LIBRARY",title:"星降る図書館",sessions:[{id:"SES-LIBRARY",title:"星図書館の探索",turns:[{id:"TURN-12",index:12,stages:[{stage:"action",label:"Action decision",preview:"封印書庫を調べるactionを選択。",interactionId:"SAI-ACTION"},{stage:"narrative",label:"Narrative after state",preview:"司書に封印書庫について尋ね、鍵の由来が示される。",interactionId:"SAI-NARRATIVE"}]}]}]}]},ge={status:"completedWithErrors",planned:8,queued:0,running:0,succeeded:7,failed:1,cancelled:0,startedAt:"2026-08-10T02:00:00Z",updatedAt:"2026-08-10T02:04:00Z",failures:[{attemptId:"ATT-8",situationLabel:"星図書館 Turn 12",candidateLabel:"Economy profile",error:"provider timeout after durable invocation",retryable:!0}]},we=[{id:"BATCH-A",reviewerLabel:"reviewer-account-id",assignmentCount:4,completedCount:3,status:"open",assignments:[{opaqueCode:"REV-DEMO",reviewerId:"reviewer-account-id",status:"draft",itemCount:4,judgedItemCount:3}]}],be={assignmentId:"ASSIGN-DEMO",evaluationLabel:"Narrative候補のblind review",status:"open",currentIndex:0,total:2,item:{itemId:"ITEM-1",situationLabel:"閉ざされた東棟",situationContext:"禁止情報を守り、新しい手掛かりを一つ提示する。",candidateCode:"Candidate K",responseText:"メイドは声を落とし、東棟の帳簿にだけ残る訪問者の印について語った。",rubric:[{criterionId:"quality",label:"Narrative quality",description:"物語としての完成度",scaleMin:1,scaleMax:5,required:!0},{criterionId:"fidelity",label:"Instruction fidelity",description:"状況と指示への忠実さ",scaleMin:1,scaleMax:5,required:!0}]}},J={identitiesRevealed:!1,candidateMatrix:[{candidateId:"CAN-A",candidateLabel:"Recommended profile",candidateCode:"Candidate K",rubricScores:{quality:4.6,fidelity:4.8},overall:4.7,responseCount:4},{candidateId:"CAN-B",candidateLabel:"Economy profile",candidateCode:"Candidate R",rubricScores:{quality:3.9,fidelity:4.1},overall:4,responseCount:4}],situationMatrix:[{situationId:"SIT-FIXED",situationLabel:"閉ざされた東棟",scores:{"Candidate K":4.8,"Candidate R":4.1}},{situationId:"SIT-QUOTED",situationLabel:"星図書館 Turn 12",scores:{"Candidate K":4.6,"Candidate R":3.9}}],distributions:[{label:"Candidate K",machineAverage:.91,humanAverage:4.7,agreement:.84},{label:"Candidate R",machineAverage:.77,humanAverage:4,agreement:.72}],failureClusters:[{label:"provider_timeout",count:1}],operations:[{candidateLabel:"Candidate K",averageLatencyMilliseconds:1280,totalCostUsd:.018},{candidateLabel:"Candidate R",averageLatencyMilliseconds:840,totalCostUsd:.009}],responses:[{id:"RESP-1",situationLabel:"閉ざされた東棟",candidateLabel:"Recommended profile",candidateCode:"Candidate K",status:"succeeded",machineScore:.93,humanScore:4.8},{id:"RESP-2",situationLabel:"星図書館 Turn 12",candidateLabel:"Economy profile",candidateCode:"Candidate R",status:"failed"}]},xe={...J.responses[0],output:"メイドは帳簿の頁を開き、訪問者が残した星形の印を示した。",labels:["schema_valid","continuity_pass"],latencyMilliseconds:1280,inputTokens:540,outputTokens:220,costUsd:.0042,judgments:[{source:"machine",criterion:"schema",score:1},{source:"human",criterion:"quality",score:4.8,note:"新情報が自然"}]},o=()=>{},v=()=>{};function G(){return s.jsx(ce,{account:p,state:{status:"ready",data:ve},onOpen:o,onCreate:o,onRetry:o,onNavigate:o,onLogout:v})}function X({sourceScenarioId:a}){const[t,e]=y.useState(!1);return s.jsx(se,{account:p,initialScenarioId:a,creating:t,onCreate:async()=>(e(!0),await Promise.resolve(),e(!1),{ok:!0,message:"評価Draftを作成しました。",value:u}),onNavigate:o,onLogout:v})}function z({evaluationId:a}){const[t,e]=y.useState(u);return s.jsx(le,{account:p,evaluationId:a,state:{status:"ready",data:t},starting:!1,onStart:async()=>{const r={...t,status:"queued"};return e(r),{ok:!0,message:"開始しました。",value:r}},onRetry:o,onNavigate:o,onLogout:v})}function $({evaluationId:a}){const[t,e]=y.useState(u),r=(c,C)=>(e(c),Promise.resolve({ok:!0,message:C,value:c}));return s.jsx(de,{account:p,evaluationId:a,state:{status:"ready",data:{session:t,corpora:me,quotes:ye}},busy:!1,actions:{addFixed:()=>r(t,"固定ケースを追加しました。"),addQuoted:c=>r({...t,situations:[...t.situations,{id:"SIT-NEW",label:c.label,stage:c.stage,source:"quoted",sourceLabel:"Session quote",snapshotHash:"sha256:new",preview:"引用preview",createdAt:"2026-08-10T03:00:00Z"}]},"Session stageを引用して固定しました。"),removeSituation:async()=>({ok:!0,message:"削除しました。"}),addCandidate:c=>r({...t,candidates:[...t.candidates,{id:"CAN-NEW",...c}]},"候補を追加しました。"),saveDesign:(c,C)=>r({...t,reviewPolicy:c,rubric:C},"Rubricを保存しました。")},onRetry:o,onNavigate:o,onLogout:v})}function ee({evaluationId:a}){return s.jsx(ue,{account:p,evaluationId:a,state:{status:"ready",data:{session:{...u,status:"completedWithErrors"},execution:ge}},busy:!1,onCancel:async()=>({ok:!0,message:"cancelled"}),onRetryFailed:async()=>({ok:!0,message:"失敗attemptを再投入しました。"}),onRefresh:o,onNavigate:o,onLogout:v})}function te({evaluationId:a}){const[t,e]=y.useState(we);return s.jsx(ne,{account:p,evaluationId:a,state:{status:"ready",data:{session:{...u,status:"review"},batches:t}},busy:!1,onCreateBatch:async r=>(e(c=>[...c,{id:"BATCH-NEW",reviewerLabel:r,assignmentCount:4,completedCount:0,status:"open",assignments:[{opaqueCode:"REV-NEW",reviewerId:r,status:"draft",itemCount:4,judgedItemCount:0}]}]),{ok:!0,message:"Review batchを作成しました。"}),onClose:async()=>({ok:!0,message:"レビューを締め切りました。"}),onReveal:async()=>({ok:!0,message:"候補identityを公開しました。"}),onRetry:o,onNavigate:o,onLogout:v})}function ae(){const[a,t]=y.useState(be);return s.jsx(oe,{account:p,state:{status:"ready",data:a},saving:!1,onSave:async()=>({ok:!0,message:"Draftを自動保存しました。",value:a}),onSubmit:async()=>{const e={...a,currentIndex:1,item:null};return t(e),{ok:!0,message:"Judgmentを提出してlockしました。",value:e}},onRetry:o,onNavigate:o,onLogout:v})}function ie({evaluationId:a}){const[t,e]=y.useState(null);return s.jsx(re,{account:p,evaluationId:a,state:{status:"ready",data:{session:{...u,status:"completed"},results:J,exports:[]}},response:t?{status:"ready",data:t}:null,busy:!1,onOpenResponse:()=>e(xe),onExport:async r=>({ok:!0,message:`${r.toUpperCase()} exportを作成しました。`}),onRetry:o,onNavigate:o,onLogout:v})}G.__docgenInfo={description:"",methods:[],displayName:"MockEvaluationListContainer"};X.__docgenInfo={description:"",methods:[],displayName:"MockEvaluationCreateContainer",props:{sourceScenarioId:{required:!1,tsType:{name:"string"},description:""}}};z.__docgenInfo={description:"",methods:[],displayName:"MockEvaluationOverviewContainer",props:{evaluationId:{required:!0,tsType:{name:"string"},description:""}}};$.__docgenInfo={description:"",methods:[],displayName:"MockEvaluationSetupContainer",props:{evaluationId:{required:!0,tsType:{name:"string"},description:""}}};ee.__docgenInfo={description:"",methods:[],displayName:"MockEvaluationExecutionContainer",props:{evaluationId:{required:!0,tsType:{name:"string"},description:""}}};te.__docgenInfo={description:"",methods:[],displayName:"MockEvaluationReviewAdminContainer",props:{evaluationId:{required:!0,tsType:{name:"string"},description:""}}};ae.__docgenInfo={description:"",methods:[],displayName:"MockEvaluationBlindReviewContainer"};ie.__docgenInfo={description:"",methods:[],displayName:"MockEvaluationResultsContainer",props:{evaluationId:{required:!0,tsType:{name:"string"},description:""}}};const m={initialDb:pe("empty"),showDebugPanel:!1},Qe={title:"ユーザーストーリー/Evaluation sessions",component:l},g={render:()=>s.jsx(l,{...m,initialUrl:"/evaluations",evaluationListContainer:G}),play:async({canvasElement:a,step:t})=>{const e=d(a);await t("independent evaluation listを確認する",async()=>{await i(e.getByRole("main",{name:"評価セッション"})).toBeVisible(),await i(e.getByText("Narrative候補 2026-08")).toBeVisible(),await i(e.getByText("Action schema regression")).toBeVisible()})}},w={render:()=>s.jsx(l,{...m,initialUrl:"/evaluations/new?sourceScenarioId=SCN-STAR-LIBRARY",evaluationCreateContainer:X}),play:async({canvasElement:a,step:t})=>{const e=d(a);await t("Scenario prefillを保ったDraftを作成する",async()=>{await i(e.getByText(/Scenario SCN-STAR-LIBRARY/)).toBeVisible(),await n.clear(e.getByLabelText("評価名")),await n.type(e.getByLabelText("評価名"),"星図書館 Narrative比較"),await n.type(e.getByLabelText("評価の説明"),"固定ケースと引用turnを比較する"),await n.click(e.getByRole("button",{name:"Draftを作成してセットアップへ"})),await i(e.getByTestId("evaluation-create-notice")).toHaveTextContent("作成しました")})}},b={render:()=>s.jsx(l,{...m,initialUrl:"/evaluations/EVAL-NARRATIVE-26",evaluationOverviewContainer:z}),play:async({canvasElement:a,step:t})=>{const e=d(a);await t("開始条件を確認してstartする",async()=>{await i(e.getByText("開始できます。開始後は入力snapshotが固定されます。")).toBeVisible(),await n.click(e.getByRole("button",{name:"評価を開始"})),await i(e.getByText("Queued")).toBeVisible()})}},x={render:()=>s.jsx(l,{...m,initialUrl:"/evaluations/EVAL-NARRATIVE-26/setup",evaluationSetupContainer:$}),play:async({canvasElement:a,step:t})=>{const e=d(a);await t("固定ケースと引用pickerを確認する",async()=>{await i(e.getByText("Scenario → Session → Turn timeline → stage preview → 引用して固定")).toBeVisible(),await n.click(e.getByRole("checkbox",{name:/閉ざされた東棟/})),await n.click(e.getByRole("button",{name:"選択した固定ケースを追加"})),await i(e.getByTestId("evaluation-setup-notice")).toHaveTextContent("固定ケースを追加しました")}),await t("候補とHuman rubricを設定する",async()=>{await n.type(e.getByLabelText("候補の表示名"),"New candidate"),await n.type(e.getByLabelText("候補のAI Profile ID"),"profile-new"),await n.click(e.getByRole("button",{name:"候補を追加"})),await i(e.getByText("New candidate × 1")).toBeVisible(),await n.click(e.getByRole("button",{name:"Rubricを保存"})),await i(e.getByTestId("evaluation-setup-notice")).toHaveTextContent("Rubricを保存しました")})}},B={render:()=>s.jsx(l,{...m,initialUrl:"/evaluations/EVAL-NARRATIVE-26/execution",evaluationExecutionContainer:ee}),play:async({canvasElement:a,step:t})=>{const e=d(a);await t("durable progressとretryable failureを確認する",async()=>{await i(e.getByRole("progressbar",{name:"評価実行進捗"})).toBeVisible(),await i(e.getByText("provider timeout after durable invocation")).toBeVisible(),await n.click(e.getByRole("button",{name:"失敗attemptを再試行"}))})}},E={render:()=>s.jsx(l,{...m,initialUrl:"/evaluations/EVAL-NARRATIVE-26/reviews",evaluationReviewAdminContainer:te}),play:async({canvasElement:a,step:t})=>{const e=d(a);await t("opaque review batchを発行する",async()=>{await n.type(e.getByLabelText("Reviewer account IDs"),"Reviewer B"),await n.click(e.getByRole("button",{name:"Opaque assignmentを発行"})),await i(e.getByText("Reviewer B")).toBeVisible(),await i(e.getByTestId("review-admin-notice")).toHaveTextContent("作成しました")})}},R={render:()=>s.jsx(l,{...m,initialUrl:"/evaluations/review/ASSIGN-DEMO",evaluationBlindReviewContainer:ae}),play:async({canvasElement:a,step:t})=>{const e=d(a);await t("identityやmachine scoreなしでrubricを入力する",async()=>{await i(e.getByTestId("blind-response")).toBeVisible(),await i(e.queryByText("runpod-recommended")).not.toBeInTheDocument(),await n.type(e.getByLabelText("Narrative quality score"),"5"),await n.type(e.getByLabelText("Instruction fidelity score"),"4"),await n.type(e.getByLabelText("Reviewer note"),"continuity is strong"),await n.click(e.getByRole("button",{name:"提出して次へ"})),await i(e.getByText("このassignmentのレビューは完了しました。")).toBeVisible()})}},T={render:()=>s.jsx(l,{...m,initialUrl:"/evaluations/EVAL-NARRATIVE-26/results",evaluationResultsContainer:ie}),play:async({canvasElement:a,step:t})=>{const e=d(a);await t("hidden identityのaggregateを確認する",async()=>{await i(e.getByText("identity hidden")).toBeVisible(),await i(e.getByText("Candidate × rubric matrix")).toBeVisible(),await i(e.getByText("Machine / human / agreement")).toBeVisible()}),await t("response drill-downとexportを操作する",async()=>{await n.click(e.getByRole("button",{name:/閉ざされた東棟/})),await i(e.getByTestId("response-drilldown")).toHaveTextContent("訪問者が残した星形の印"),await n.click(e.getByRole("button",{name:"JSON export"})),await i(e.getByText(/JSON exportを作成しました/)).toBeVisible()})}};var A,I,f;g.parameters={...g.parameters,docs:{...(A=g.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => <MyrialeApp {...base} initialUrl="/evaluations" evaluationListContainer={MockEvaluationListContainer} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const c = within(canvasElement);
    await step('independent evaluation listを確認する', async () => {
      await expect(c.getByRole('main', {
        name: '評価セッション'
      })).toBeVisible();
      await expect(c.getByText('Narrative候補 2026-08')).toBeVisible();
      await expect(c.getByText('Action schema regression')).toBeVisible();
    });
  }
}`,...(f=(I=g.parameters)==null?void 0:I.docs)==null?void 0:f.source}}};var S,L,h;w.parameters={...w.parameters,docs:{...(S=w.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <MyrialeApp {...base} initialUrl="/evaluations/new?sourceScenarioId=SCN-STAR-LIBRARY" evaluationCreateContainer={MockEvaluationCreateContainer} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const c = within(canvasElement);
    await step('Scenario prefillを保ったDraftを作成する', async () => {
      await expect(c.getByText(/Scenario SCN-STAR-LIBRARY/)).toBeVisible();
      await userEvent.clear(c.getByLabelText('評価名'));
      await userEvent.type(c.getByLabelText('評価名'), '星図書館 Narrative比較');
      await userEvent.type(c.getByLabelText('評価の説明'), '固定ケースと引用turnを比較する');
      await userEvent.click(c.getByRole('button', {
        name: 'Draftを作成してセットアップへ'
      }));
      await expect(c.getByTestId('evaluation-create-notice')).toHaveTextContent('作成しました');
    });
  }
}`,...(h=(L=w.parameters)==null?void 0:L.docs)==null?void 0:h.source}}};var k,N,V;b.parameters={...b.parameters,docs:{...(k=b.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => <MyrialeApp {...base} initialUrl="/evaluations/EVAL-NARRATIVE-26" evaluationOverviewContainer={MockEvaluationOverviewContainer} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const c = within(canvasElement);
    await step('開始条件を確認してstartする', async () => {
      await expect(c.getByText('開始できます。開始後は入力snapshotが固定されます。')).toBeVisible();
      await userEvent.click(c.getByRole('button', {
        name: '評価を開始'
      }));
      await expect(c.getByText('Queued')).toBeVisible();
    });
  }
}`,...(V=(N=b.parameters)==null?void 0:N.docs)==null?void 0:V.source}}};var M,q,O;x.parameters={...x.parameters,docs:{...(M=x.parameters)==null?void 0:M.docs,source:{originalSource:`{
  render: () => <MyrialeApp {...base} initialUrl="/evaluations/EVAL-NARRATIVE-26/setup" evaluationSetupContainer={MockEvaluationSetupContainer} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const c = within(canvasElement);
    await step('固定ケースと引用pickerを確認する', async () => {
      await expect(c.getByText('Scenario → Session → Turn timeline → stage preview → 引用して固定')).toBeVisible();
      await userEvent.click(c.getByRole('checkbox', {
        name: /閉ざされた東棟/
      }));
      await userEvent.click(c.getByRole('button', {
        name: '選択した固定ケースを追加'
      }));
      await expect(c.getByTestId('evaluation-setup-notice')).toHaveTextContent('固定ケースを追加しました');
    });
    await step('候補とHuman rubricを設定する', async () => {
      await userEvent.type(c.getByLabelText('候補の表示名'), 'New candidate');
      await userEvent.type(c.getByLabelText('候補のAI Profile ID'), 'profile-new');
      await userEvent.click(c.getByRole('button', {
        name: '候補を追加'
      }));
      await expect(c.getByText('New candidate × 1')).toBeVisible();
      await userEvent.click(c.getByRole('button', {
        name: 'Rubricを保存'
      }));
      await expect(c.getByTestId('evaluation-setup-notice')).toHaveTextContent('Rubricを保存しました');
    });
  }
}`,...(O=(q=x.parameters)==null?void 0:q.docs)==null?void 0:O.source}}};var D,U,j;B.parameters={...B.parameters,docs:{...(D=B.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => <MyrialeApp {...base} initialUrl="/evaluations/EVAL-NARRATIVE-26/execution" evaluationExecutionContainer={MockEvaluationExecutionContainer} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const c = within(canvasElement);
    await step('durable progressとretryable failureを確認する', async () => {
      await expect(c.getByRole('progressbar', {
        name: '評価実行進捗'
      })).toBeVisible();
      await expect(c.getByText('provider timeout after durable invocation')).toBeVisible();
      await userEvent.click(c.getByRole('button', {
        name: '失敗attemptを再試行'
      }));
    });
  }
}`,...(j=(U=B.parameters)==null?void 0:U.docs)==null?void 0:j.source}}};var _,P,H;E.parameters={...E.parameters,docs:{...(_=E.parameters)==null?void 0:_.docs,source:{originalSource:`{
  render: () => <MyrialeApp {...base} initialUrl="/evaluations/EVAL-NARRATIVE-26/reviews" evaluationReviewAdminContainer={MockEvaluationReviewAdminContainer} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const c = within(canvasElement);
    await step('opaque review batchを発行する', async () => {
      await userEvent.type(c.getByLabelText('Reviewer account IDs'), 'Reviewer B');
      await userEvent.click(c.getByRole('button', {
        name: 'Opaque assignmentを発行'
      }));
      await expect(c.getByText('Reviewer B')).toBeVisible();
      await expect(c.getByTestId('review-admin-notice')).toHaveTextContent('作成しました');
    });
  }
}`,...(H=(P=E.parameters)==null?void 0:P.docs)==null?void 0:H.source}}};var K,Q,Z;R.parameters={...R.parameters,docs:{...(K=R.parameters)==null?void 0:K.docs,source:{originalSource:`{
  render: () => <MyrialeApp {...base} initialUrl="/evaluations/review/ASSIGN-DEMO" evaluationBlindReviewContainer={MockEvaluationBlindReviewContainer} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const c = within(canvasElement);
    await step('identityやmachine scoreなしでrubricを入力する', async () => {
      await expect(c.getByTestId('blind-response')).toBeVisible();
      await expect(c.queryByText('runpod-recommended')).not.toBeInTheDocument();
      await userEvent.type(c.getByLabelText('Narrative quality score'), '5');
      await userEvent.type(c.getByLabelText('Instruction fidelity score'), '4');
      await userEvent.type(c.getByLabelText('Reviewer note'), 'continuity is strong');
      await userEvent.click(c.getByRole('button', {
        name: '提出して次へ'
      }));
      await expect(c.getByText('このassignmentのレビューは完了しました。')).toBeVisible();
    });
  }
}`,...(Z=(Q=R.parameters)==null?void 0:Q.docs)==null?void 0:Z.source}}};var F,W,Y;T.parameters={...T.parameters,docs:{...(F=T.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <MyrialeApp {...base} initialUrl="/evaluations/EVAL-NARRATIVE-26/results" evaluationResultsContainer={MockEvaluationResultsContainer} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const c = within(canvasElement);
    await step('hidden identityのaggregateを確認する', async () => {
      await expect(c.getByText('identity hidden')).toBeVisible();
      await expect(c.getByText('Candidate × rubric matrix')).toBeVisible();
      await expect(c.getByText('Machine / human / agreement')).toBeVisible();
    });
    await step('response drill-downとexportを操作する', async () => {
      await userEvent.click(c.getByRole('button', {
        name: /閉ざされた東棟/
      }));
      await expect(c.getByTestId('response-drilldown')).toHaveTextContent('訪問者が残した星形の印');
      await userEvent.click(c.getByRole('button', {
        name: 'JSON export'
      }));
      await expect(c.getByText(/JSON exportを作成しました/)).toBeVisible();
    });
  }
}`,...(Y=(W=T.parameters)==null?void 0:W.docs)==null?void 0:Y.source}}};const Ze=["ListEvaluationSessions","CreateEvaluationDraft","OverviewAndStart","SetupFixedAndQuotedSituations","RecoverExecutionProgress","AdministerBlindReview","CompleteOpaqueReview","InspectResultsAndExport"];export{E as AdministerBlindReview,R as CompleteOpaqueReview,w as CreateEvaluationDraft,T as InspectResultsAndExport,g as ListEvaluationSessions,b as OverviewAndStart,B as RecoverExecutionProgress,x as SetupFixedAndQuotedSituations,Ze as __namedExportsOrder,Qe as default};
