import{f as s,w as L,e as i,u as v}from"./index-C4S39nCK.js";import{S as Q}from"./SessionActivityFeed-BJX-MIDR.js";import"./jsx-runtime-BO8uF4Og.js";import"./index-D4H_InIO.js";const n="2026-07-21T12:00:00Z",T=(e,o="narrative")=>({id:`EXE-${o}-${e}`,sessionId:"SES-FIXTURE",kind:o,triggerType:o==="narrative"?"player-input":"session-turn",triggerId:"INP-1",status:e,revision:2,isRetryable:e==="failed"||e==="cancelled",attemptCount:e==="retry-wait"?1:2,maxAttempts:3,errorCode:e==="failed"?"provider_timeout":null,userErrorMessage:e==="failed"?"AIサービスから時間内に応答がありませんでした。":null,createdAt:n,startedAt:n,completedAt:["failed","cancelled","succeeded","superseded"].includes(e)?n:null,capabilities:{canRetry:e==="failed"||e==="cancelled",canCancel:["queued","running","retry-wait","cancel-requested"].includes(e),canDismiss:["failed","cancelled","succeeded","superseded"].includes(e)},developmentDiagnostics:{sessionId:"SES-FIXTURE",triggerType:"player-input",triggerId:"INP-1",revision:2,leaseOwner:e==="running"?"worker-fixture":null,leaseTokenHint:e==="running"?"…ABCD1234":null,leaseExpiresAt:e==="running"?n:null,attempts:[{id:"ATT-1",attemptNumber:1,status:e==="retry-wait"?"failed":e,workerId:"worker-fixture",provider:"mock",model:"fixture-model",providerRequestId:"resp-fixture",startedAt:n,completedAt:n,latencyMilliseconds:123,inputTokens:20,outputTokens:42,finishReason:"stop",errorCode:e==="failed"?"provider_timeout":null,errorCategory:e==="failed"?"TimeoutException":null,retryable:e==="failed",correlationId:"corr-1",traceId:"0123456789abcdef0123456789abcdef",spanId:"0123456789abcdef",exceptionChain:e==="failed"?"AiProviderException -> TimeoutException":null,redactedResponseExcerpt:e==="failed"?"Authorization=[REDACTED]":null,promptVersion:"dialogue.v8",contextHash:"abc123",contextSizeBytes:2048}]}}),r=(e="failed")=>{const o=T(e),a=T("failed","image"),t=T("succeeded","note-proposal");return{id:"SES-FIXTURE",scenarioId:"SCN-1",status:"active",revision:4,interpretationEnabled:!1,pendingInputs:[],createdAt:n,updatedAt:n,inputs:[{id:"INP-1",requestId:"req-1",text:"銀の鍵を扉にかざす",interactionType:"dialogue",acceptedAfterTurnId:"TRN-OPEN",acceptedSessionRevision:1,createdAt:n}],executions:[o,a,t],turns:[{id:"TRN-OPEN",position:1,kind:"narrative",narrative:{body:"水没した書庫で、銀の鍵が淡く光っている。",turnType:"opening"},createdAt:n},{id:"TRN-2",position:2,previousTurnId:"TRN-OPEN",kind:"narrative",narrative:{body:"鍵の光が石扉の輪郭をなぞり、静かに道が開いた。",playerInputId:"INP-1",turnType:"action-result"},createdAt:n}],artifacts:[{id:"ART-IMG",executionId:a.id,kind:"image",status:"committed",contentType:"image/png",createdAt:n},{id:"ART-NOTE",executionId:t.id,kind:"note-patch",status:"committed",contentType:"application/json",createdAt:n}],noteProposals:[{artifactId:"ART-NOTE",sourceTurnId:"TRN-2",expectedNoteRevision:0,proposedTitle:"銀の鍵",beforeBody:"",proposedBody:"石扉を開くと淡く光る鍵。",rationale:"Turn 2で扉を開いた事実に基づく。",status:"pending",createdAt:n}],activity:[{type:"turn",id:"TRN-OPEN",order:1},{type:"input",id:"INP-1",order:2},{type:"execution",id:o.id,order:3,causalId:"INP-1"},{type:"turn",id:"TRN-2",order:4,causalId:"INP-1"},{type:"execution",id:a.id,order:5,causalId:"TRN-2"},{type:"artifact",id:"ART-IMG",order:6,causalId:a.id},{type:"execution",id:t.id,order:7,causalId:"TRN-2"},{type:"artifact",id:"ART-NOTE",order:8,causalId:t.id}]}},J={title:"Session/Execution and artifacts",component:Q,parameters:{layout:"padded"}},d={args:{session:r("queued"),onExecutionAction:s()}},l={args:{session:r("running"),onExecutionAction:s()}},u={args:{session:r("retry-wait"),onExecutionAction:s()}},p={args:{session:r("cancelled"),onExecutionAction:s()}},m={args:{session:r("succeeded"),onExecutionAction:s()}},y={args:{session:r("superseded"),onExecutionAction:s()}},x={args:{session:r("failed"),onExecutionAction:s(),onNoteReview:s()},play:async({canvasElement:e,args:o,step:a})=>{const t=L(e);await a("Player Input remains separate from the failure",async()=>{await i(t.getByTestId("session-input-item")).toHaveTextContent("銀の鍵を扉にかざす"),await i(t.getAllByTestId("narrative-turn-item")).toHaveLength(2),await i(t.getAllByRole("alert").some(c=>{var A;return(A=c.textContent)==null?void 0:A.includes("AIサービスから時間内に応答がありませんでした。")})).toBe(!0)}),await a("Retry updates the existing execution slot",async()=>{await v.click(t.getAllByRole("button",{name:"再試行"})[0]),await i(o.onExecutionAction).toHaveBeenCalled()}),await a("Development diagnostics expose safe trace data",async()=>{await v.click(t.getAllByText("開発者向け詳細")[0]),await i(t.getAllByText(/0123456789abcdef0123456789abcdef/).length).toBeGreaterThan(0),await i(t.queryByText(/Bearer secret/i)).not.toBeInTheDocument()}),await a("Narrative success and image failure remain partial success",async()=>{await i(t.getByText(/場面の画像: 生成できませんでした/)).toBeInTheDocument(),await i(t.getByTestId("image-artifact-item")).toBeInTheDocument()}),await a("Note proposal is reviewable but not auto-applied",async()=>{await i(t.getByTestId("note-proposal-item")).toHaveTextContent("石扉を開くと淡く光る鍵"),await v.click(t.getByRole("button",{name:"適用"})),await i(o.onNoteReview).toHaveBeenCalled()})}};var f;const g={args:{session:{...r("failed"),executions:(f=r("failed").executions)==null?void 0:f.map(e=>({...e,developmentDiagnostics:null}))},onExecutionAction:s()},play:async({canvasElement:e,step:o})=>{const a=L(e);await o("Production omits developer-only details",async()=>{await i(a.queryByText("開発者向け詳細")).not.toBeInTheDocument(),await i(a.getAllByRole("alert").some(t=>{var c;return(c=t.textContent)==null?void 0:c.includes("AIサービスから時間内に応答がありませんでした。")})).toBe(!0)})}};var w,I,E;d.parameters={...d.parameters,docs:{...(w=d.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('queued'),
    onExecutionAction: fn()
  }
}`,...(E=(I=d.parameters)==null?void 0:I.docs)==null?void 0:E.source}}};var B,R,N;l.parameters={...l.parameters,docs:{...(B=l.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('running'),
    onExecutionAction: fn()
  }
}`,...(N=(R=l.parameters)==null?void 0:R.docs)==null?void 0:N.source}}};var h,b,S;u.parameters={...u.parameters,docs:{...(h=u.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('retry-wait'),
    onExecutionAction: fn()
  }
}`,...(S=(b=u.parameters)==null?void 0:b.docs)==null?void 0:S.source}}};var C,D,P;p.parameters={...p.parameters,docs:{...(C=p.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('cancelled'),
    onExecutionAction: fn()
  }
}`,...(P=(D=p.parameters)==null?void 0:D.docs)==null?void 0:P.source}}};var F,k,H;m.parameters={...m.parameters,docs:{...(F=m.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('succeeded'),
    onExecutionAction: fn()
  }
}`,...(H=(k=m.parameters)==null?void 0:k.docs)==null?void 0:H.source}}};var q,O,G;y.parameters={...y.parameters,docs:{...(q=y.parameters)==null?void 0:q.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('superseded'),
    onExecutionAction: fn()
  }
}`,...(G=(O=y.parameters)==null?void 0:O.docs)==null?void 0:G.source}}};var M,W,X;x.parameters={...x.parameters,docs:{...(M=x.parameters)==null?void 0:M.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('failed'),
    onExecutionAction: fn(),
    onNoteReview: fn()
  },
  play: async ({
    canvasElement,
    args,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Player Input remains separate from the failure', async () => {
      await expect(canvas.getByTestId('session-input-item')).toHaveTextContent('銀の鍵を扉にかざす');
      await expect(canvas.getAllByTestId('narrative-turn-item')).toHaveLength(2);
      await expect(canvas.getAllByRole('alert').some(alert => alert.textContent?.includes('AIサービスから時間内に応答がありませんでした。'))).toBe(true);
    });
    await step('Retry updates the existing execution slot', async () => {
      await userEvent.click(canvas.getAllByRole('button', {
        name: '再試行'
      })[0]);
      await expect(args.onExecutionAction).toHaveBeenCalled();
    });
    await step('Development diagnostics expose safe trace data', async () => {
      await userEvent.click(canvas.getAllByText('開発者向け詳細')[0]);
      await expect(canvas.getAllByText(/0123456789abcdef0123456789abcdef/).length).toBeGreaterThan(0);
      await expect(canvas.queryByText(/Bearer secret/i)).not.toBeInTheDocument();
    });
    await step('Narrative success and image failure remain partial success', async () => {
      await expect(canvas.getByText(/場面の画像: 生成できませんでした/)).toBeInTheDocument();
      await expect(canvas.getByTestId('image-artifact-item')).toBeInTheDocument();
    });
    await step('Note proposal is reviewable but not auto-applied', async () => {
      await expect(canvas.getByTestId('note-proposal-item')).toHaveTextContent('石扉を開くと淡く光る鍵');
      await userEvent.click(canvas.getByRole('button', {
        name: '適用'
      }));
      await expect(args.onNoteReview).toHaveBeenCalled();
    });
  }
}`,...(X=(W=x.parameters)==null?void 0:W.docs)==null?void 0:X.source}}};var _,U,z;g.parameters={...g.parameters,docs:{...(_=g.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    session: {
      ...sessionActivityFixture('failed'),
      executions: sessionActivityFixture('failed').executions?.map(execution => ({
        ...execution,
        developmentDiagnostics: null
      }))
    },
    onExecutionAction: fn()
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Production omits developer-only details', async () => {
      await expect(canvas.queryByText('開発者向け詳細')).not.toBeInTheDocument();
      await expect(canvas.getAllByRole('alert').some(alert => alert.textContent?.includes('AIサービスから時間内に応答がありませんでした。'))).toBe(true);
    });
  }
}`,...(z=(U=g.parameters)==null?void 0:U.docs)==null?void 0:z.source}}};const K=["Queued","Running","RetryWait","Cancelled","Succeeded","Superseded","FailedWithDevelopmentDiagnostics","ProductionRedaction"];export{p as Cancelled,x as FailedWithDevelopmentDiagnostics,g as ProductionRedaction,d as Queued,u as RetryWait,l as Running,m as Succeeded,y as Superseded,K as __namedExportsOrder,J as default};
