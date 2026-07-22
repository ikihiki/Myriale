import{f as s,w as X,e as n,u as c}from"./index-C4S39nCK.js";import{S as L}from"./SessionActivityFeed-B-_rw5LW.js";import"./jsx-runtime-BO8uF4Og.js";import"./index-D4H_InIO.js";const i="2026-07-21T12:00:00Z",T=(e,o="narrative")=>({id:`EXE-${o}-${e}`,sessionId:"SES-FIXTURE",kind:o,triggerType:o==="narrative"?"player-input":"session-turn",triggerId:"INP-1",status:e,revision:2,isRetryable:e==="failed"||e==="cancelled",attemptCount:e==="retry-wait"?1:2,maxAttempts:3,errorCode:e==="failed"?"provider_timeout":null,userErrorMessage:e==="failed"?"AIサービスから時間内に応答がありませんでした。":null,createdAt:i,startedAt:i,completedAt:["failed","cancelled","succeeded","superseded"].includes(e)?i:null,capabilities:{canRetry:e==="failed"||e==="cancelled",canCancel:["queued","running","retry-wait","cancel-requested"].includes(e),canDismiss:["failed","cancelled","succeeded","superseded"].includes(e)},developmentDiagnostics:{sessionId:"SES-FIXTURE",triggerType:"player-input",triggerId:"INP-1",revision:2,leaseOwner:e==="running"?"worker-fixture":null,leaseTokenHint:e==="running"?"…ABCD1234":null,leaseExpiresAt:e==="running"?i:null,attempts:[{id:"ATT-1",attemptNumber:1,status:e==="retry-wait"?"failed":e,workerId:"worker-fixture",provider:"mock",model:"fixture-model",providerRequestId:"resp-fixture",startedAt:i,completedAt:i,latencyMilliseconds:123,inputTokens:20,outputTokens:42,finishReason:"stop",errorCode:e==="failed"?"provider_timeout":null,errorCategory:e==="failed"?"TimeoutException":null,retryable:e==="failed",correlationId:"corr-1",traceId:"0123456789abcdef0123456789abcdef",spanId:"0123456789abcdef",exceptionChain:e==="failed"?"AiProviderException -> TimeoutException":null,redactedResponseExcerpt:e==="failed"?"Authorization=[REDACTED]":null,sentPrompt:'{"messages":[{"role":"system","content":"Narrative rules"},{"role":"user","content":"銀の鍵を扉にかざす"}]}',receivedResult:'{"schemaVersion":"narrative-dialogue.v8","turnType":"action-result","heading":"銀の鍵を掲げる","body":"鍵の光が石扉をなぞる。","signals":[],"interpretation":null}',validationResult:e==="failed"?'{"status":"failed","errorCode":"provider_timeout","reason":"AI Provider request timed out."}':'{"status":"passed","checks":["dialogue-contract","progression-signals"]}',promptVersion:"dialogue.v8",contextHash:"abc123",contextSizeBytes:2048}]}}),r=(e="failed")=>{const o=T(e),a=T("failed","image"),t=T("succeeded","note-proposal");return{id:"SES-FIXTURE",scenarioId:"SCN-1",status:"active",revision:4,interpretationEnabled:!1,pendingInputs:[],createdAt:i,updatedAt:i,inputs:[{id:"INP-1",requestId:"req-1",text:"銀の鍵を扉にかざす",interactionType:"dialogue",acceptedAfterTurnId:"TRN-OPEN",acceptedSessionRevision:1,createdAt:i}],executions:[o,a,t],turns:[{id:"TRN-OPEN",position:1,kind:"narrative",narrative:{body:"水没した書庫で、銀の鍵が淡く光っている。",turnType:"opening"},createdAt:i},{id:"TRN-2",position:2,previousTurnId:"TRN-OPEN",kind:"narrative",narrative:{body:"鍵の光が石扉の輪郭をなぞり、静かに道が開いた。",playerInputId:"INP-1",turnType:"action-result"},createdAt:i}],artifacts:[{id:"ART-IMG",executionId:a.id,kind:"image",status:"committed",contentType:"image/png",createdAt:i},{id:"ART-NOTE",executionId:t.id,kind:"note-patch",status:"committed",contentType:"application/json",createdAt:i}],noteProposals:[{artifactId:"ART-NOTE",sourceTurnId:"TRN-2",expectedNoteRevision:0,proposedTitle:"銀の鍵",beforeBody:"",proposedBody:"石扉を開くと淡く光る鍵。",rationale:"Turn 2で扉を開いた事実に基づく。",status:"pending",createdAt:i}],activity:[{type:"turn",id:"TRN-OPEN",order:1},{type:"input",id:"INP-1",order:2},{type:"execution",id:o.id,order:3,causalId:"INP-1"},{type:"turn",id:"TRN-2",order:4,causalId:"INP-1"},{type:"execution",id:a.id,order:5,causalId:"TRN-2"},{type:"artifact",id:"ART-IMG",order:6,causalId:a.id},{type:"execution",id:t.id,order:7,causalId:"TRN-2"},{type:"artifact",id:"ART-NOTE",order:8,causalId:t.id}]}},Z={title:"Session/Execution and artifacts",component:L,parameters:{layout:"padded"}},d={args:{session:r("queued"),onExecutionAction:s()}},l={args:{session:r("running"),onExecutionAction:s()}},u={args:{session:r("retry-wait"),onExecutionAction:s()}},p={args:{session:r("cancelled"),onExecutionAction:s()}},m={args:{session:r("succeeded"),onExecutionAction:s()}},y={args:{session:r("superseded"),onExecutionAction:s()}},g={args:{session:r("failed"),onExecutionAction:s(),onNoteReview:s()},play:async({canvasElement:e,args:o,step:a})=>{const t=X(e);await a("Player Input remains separate from the failure",async()=>{await n(t.getByTestId("session-input-item")).toHaveTextContent("銀の鍵を扉にかざす"),await n(t.getAllByTestId("narrative-turn-item")).toHaveLength(2),await n(t.queryByText("AIサービスから時間内に応答がありませんでした。")).not.toBeInTheDocument(),await n(t.getByRole("button",{name:"入力取り消し"})).toBeInTheDocument()}),await a("Retry updates the existing execution slot",async()=>{await c.click(t.getAllByRole("button",{name:"再試行"})[0]),await n(o.onExecutionAction).toHaveBeenCalled()}),await a("The status line toggles safe development diagnostics",async()=>{const U=t.getAllByText(/物語: 生成できませんでした/)[0];await c.click(U),await c.click(t.getAllByText("例外情報")[0]),await n(t.getAllByText(/Authorization=\[REDACTED\]/).length).toBeGreaterThan(0),await n(t.getAllByText("送信したプロンプト").length).toBeGreaterThan(0),await n(t.getAllByText("受信した結果").length).toBeGreaterThan(0),await n(t.getAllByText("バリデーション結果").length).toBeGreaterThan(0),await n(t.queryByText(/Bearer secret/i)).not.toBeInTheDocument()}),await a("Narrative success and image failure remain partial success",async()=>{await n(t.getByText(/場面の画像: 生成できませんでした/)).toBeInTheDocument(),await n(t.getByTestId("image-artifact-item")).toBeInTheDocument()}),await a("Note proposal is reviewable but not auto-applied",async()=>{await n(t.getByTestId("note-proposal-item")).toHaveTextContent("石扉を開くと淡く光る鍵"),await c.click(t.getByRole("button",{name:"適用"})),await n(o.onNoteReview).toHaveBeenCalled()})}};var v;const x={args:{session:{...r("failed"),executions:(v=r("failed").executions)==null?void 0:v.map(e=>({...e,developmentDiagnostics:null}))},onExecutionAction:s()},play:async({canvasElement:e,step:o})=>{const a=X(e);await o("Production omits developer-only details",async()=>{await n(a.queryByText("開発者向け詳細")).not.toBeInTheDocument(),await n(a.queryByText("AIサービスから時間内に応答がありませんでした。")).not.toBeInTheDocument(),await n(a.getByRole("button",{name:"入力取り消し"})).toBeInTheDocument()})}};var A,w,B;d.parameters={...d.parameters,docs:{...(A=d.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('queued'),
    onExecutionAction: fn()
  }
}`,...(B=(w=d.parameters)==null?void 0:w.docs)==null?void 0:B.source}}};var I,f,E;l.parameters={...l.parameters,docs:{...(I=l.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('running'),
    onExecutionAction: fn()
  }
}`,...(E=(f=l.parameters)==null?void 0:f.docs)==null?void 0:E.source}}};var h,R,N;u.parameters={...u.parameters,docs:{...(h=u.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('retry-wait'),
    onExecutionAction: fn()
  }
}`,...(N=(R=u.parameters)==null?void 0:R.docs)==null?void 0:N.source}}};var D,b,S;p.parameters={...p.parameters,docs:{...(D=p.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('cancelled'),
    onExecutionAction: fn()
  }
}`,...(S=(b=p.parameters)==null?void 0:b.docs)==null?void 0:S.source}}};var C,P,k;m.parameters={...m.parameters,docs:{...(C=m.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('succeeded'),
    onExecutionAction: fn()
  }
}`,...(k=(P=m.parameters)==null?void 0:P.docs)==null?void 0:k.source}}};var F,q,H;y.parameters={...y.parameters,docs:{...(F=y.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('superseded'),
    onExecutionAction: fn()
  }
}`,...(H=(q=y.parameters)==null?void 0:q.docs)==null?void 0:H.source}}};var G,O,_;g.parameters={...g.parameters,docs:{...(G=g.parameters)==null?void 0:G.docs,source:{originalSource:`{
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
      await expect(canvas.queryByText('AIサービスから時間内に応答がありませんでした。')).not.toBeInTheDocument();
      await expect(canvas.getByRole('button', {
        name: '入力取り消し'
      })).toBeInTheDocument();
    });
    await step('Retry updates the existing execution slot', async () => {
      await userEvent.click(canvas.getAllByRole('button', {
        name: '再試行'
      })[0]);
      await expect(args.onExecutionAction).toHaveBeenCalled();
    });
    await step('The status line toggles safe development diagnostics', async () => {
      const status = canvas.getAllByText(/物語: 生成できませんでした/)[0];
      await userEvent.click(status);
      await userEvent.click(canvas.getAllByText('例外情報')[0]);
      await expect(canvas.getAllByText(/Authorization=\\[REDACTED\\]/).length).toBeGreaterThan(0);
      await expect(canvas.getAllByText('送信したプロンプト').length).toBeGreaterThan(0);
      await expect(canvas.getAllByText('受信した結果').length).toBeGreaterThan(0);
      await expect(canvas.getAllByText('バリデーション結果').length).toBeGreaterThan(0);
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
}`,...(_=(O=g.parameters)==null?void 0:O.docs)==null?void 0:_.source}}};var z,M,W;x.parameters={...x.parameters,docs:{...(z=x.parameters)==null?void 0:z.docs,source:{originalSource:`{
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
      await expect(canvas.queryByText('AIサービスから時間内に応答がありませんでした。')).not.toBeInTheDocument();
      await expect(canvas.getByRole('button', {
        name: '入力取り消し'
      })).toBeInTheDocument();
    });
  }
}`,...(W=(M=x.parameters)==null?void 0:M.docs)==null?void 0:W.source}}};const J=["Queued","Running","RetryWait","Cancelled","Succeeded","Superseded","FailedWithDevelopmentDiagnostics","ProductionRedaction"];export{p as Cancelled,g as FailedWithDevelopmentDiagnostics,x as ProductionRedaction,d as Queued,u as RetryWait,l as Running,m as Succeeded,y as Superseded,J as __namedExportsOrder,Z as default};
