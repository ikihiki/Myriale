import{f as s,w as Q,e as n,u as c}from"./index-C4S39nCK.js";import{S as j}from"./SessionActivityFeed-Cpou7mJV.js";import"./jsx-runtime-BO8uF4Og.js";import"./index-D4H_InIO.js";const i="2026-07-21T12:00:00Z",v=(e,o="narrative")=>({id:`EXE-${o}-${e}`,sessionId:"SES-FIXTURE",kind:o,triggerType:o==="narrative"?"player-input":"session-turn",triggerId:"INP-1",status:e,revision:2,isRetryable:e==="failed"||e==="cancelled",attemptCount:e==="retry-wait"?1:2,maxAttempts:3,errorCode:e==="failed"?"provider_timeout":null,userErrorMessage:e==="failed"?"AIサービスから時間内に応答がありませんでした。":null,createdAt:i,startedAt:i,completedAt:["failed","cancelled","succeeded","superseded"].includes(e)?i:null,capabilities:{canRetry:e==="failed"||e==="cancelled",canCancel:["queued","running","retry-wait","cancel-requested"].includes(e),canDismiss:["failed","cancelled","succeeded","superseded"].includes(e)},developmentDiagnostics:{sessionId:"SES-FIXTURE",triggerType:"player-input",triggerId:"INP-1",revision:2,leaseOwner:e==="running"?"worker-fixture":null,leaseTokenHint:e==="running"?"…ABCD1234":null,leaseExpiresAt:e==="running"?i:null,attempts:[{id:"ATT-1",attemptNumber:1,status:e==="retry-wait"?"failed":e,workerId:"worker-fixture",provider:"mock",model:"fixture-model",providerRequestId:"resp-fixture",startedAt:i,completedAt:i,latencyMilliseconds:123,inputTokens:20,outputTokens:42,finishReason:"stop",errorCode:e==="failed"?"provider_timeout":null,errorCategory:e==="failed"?"TimeoutException":null,retryable:e==="failed",correlationId:"corr-1",traceId:"0123456789abcdef0123456789abcdef",spanId:"0123456789abcdef",exceptionChain:e==="failed"?"AiProviderException -> TimeoutException":null,redactedResponseExcerpt:e==="failed"?"Authorization=[REDACTED]":null,sentPrompt:'{"messages":[{"role":"system","content":"Narrative rules"},{"role":"user","content":"銀の鍵を扉にかざす"}]}',receivedResult:'{"schemaVersion":"narrative-dialogue.v8","turnType":"action-result","heading":"銀の鍵を掲げる","body":"鍵の光が石扉をなぞる。","signals":[],"interpretation":null}',validationResult:e==="failed"?'{"status":"failed","errorCode":"provider_timeout","reason":"AI Provider request timed out."}':'{"status":"passed","checks":["dialogue-contract","progression-signals"]}',promptVersion:"dialogue.v8",contextHash:"abc123",contextSizeBytes:2048}]}}),r=(e="failed")=>{const o=v(e),a=v("failed","image"),t=v("succeeded","note-proposal");return{id:"SES-FIXTURE",scenarioId:"SCN-1",status:"active",revision:4,interpretationEnabled:!1,pendingInputs:[],createdAt:i,updatedAt:i,inputs:[{id:"INP-1",requestId:"req-1",text:"銀の鍵を扉にかざす",interactionType:"dialogue",acceptedAfterTurnId:"TRN-OPEN",acceptedSessionRevision:1,createdAt:i}],executions:[o,a,t],turns:[{id:"TRN-OPEN",position:1,kind:"narrative",narrative:{body:"水没した書庫で、銀の鍵が淡く光っている。",turnType:"opening"},createdAt:i},{id:"TRN-2",position:2,previousTurnId:"TRN-OPEN",kind:"narrative",narrative:{body:"鍵の光が石扉の輪郭をなぞり、静かに道が開いた。",playerInputId:"INP-1",turnType:"action-result"},createdAt:i}],artifacts:[{id:"ART-IMG",executionId:a.id,kind:"image",status:"committed",contentType:"image/png",createdAt:i},{id:"ART-NOTE",executionId:t.id,kind:"note-patch",status:"committed",contentType:"application/json",createdAt:i}],noteProposals:[{artifactId:"ART-NOTE",sourceTurnId:"TRN-2",expectedNoteRevision:0,proposedTitle:"銀の鍵",beforeBody:"",proposedBody:"石扉を開くと淡く光る鍵。",rationale:"Turn 2で扉を開いた事実に基づく。",status:"pending",createdAt:i}],activity:[{type:"turn",id:"TRN-OPEN",order:1},{type:"input",id:"INP-1",order:2},{type:"execution",id:o.id,order:3,causalId:"INP-1"},{type:"turn",id:"TRN-2",order:4,causalId:"INP-1"},{type:"execution",id:a.id,order:5,causalId:"TRN-2"},{type:"artifact",id:"ART-IMG",order:6,causalId:a.id},{type:"execution",id:t.id,order:7,causalId:"TRN-2"},{type:"artifact",id:"ART-NOTE",order:8,causalId:t.id}]}},ee={title:"Session/Execution and artifacts",component:j,parameters:{layout:"padded"}},d={args:{session:r("queued"),onExecutionAction:s()}},u={args:{session:r("running"),onExecutionAction:s()}},l={args:{session:r("retry-wait"),onExecutionAction:s()}},p={args:{session:r("cancelled"),onExecutionAction:s()}},m={args:{session:r("succeeded"),onExecutionAction:s()}},y={args:{session:r("succeeded"),onExecutionAction:s(),keepSucceededStatusVisible:!0}},g={args:{session:r("superseded"),onExecutionAction:s()}},x={args:{session:r("failed"),onExecutionAction:s(),onNoteReview:s()},play:async({canvasElement:e,args:o,step:a})=>{const t=Q(e);await a("Player Input remains separate from the failure",async()=>{await n(t.getByTestId("session-input-item")).toHaveTextContent("銀の鍵を扉にかざす"),await n(t.getAllByTestId("narrative-turn-item")).toHaveLength(2),await n(t.queryByText("AIサービスから時間内に応答がありませんでした。")).not.toBeInTheDocument(),await n(t.getByRole("button",{name:"入力取り消し"})).toBeInTheDocument()}),await a("Retry updates the existing execution slot",async()=>{await c.click(t.getAllByRole("button",{name:"再試行"})[0]),await n(o.onExecutionAction).toHaveBeenCalled()}),await a("The status line toggles safe development diagnostics",async()=>{const $=t.getAllByText(/物語: 生成できませんでした/)[0];await c.click($),await c.click(t.getAllByText("例外情報")[0]),await n(t.getAllByText(/Authorization=\[REDACTED\]/).length).toBeGreaterThan(0),await n(t.getAllByText("送信したプロンプト").length).toBeGreaterThan(0),await n(t.getAllByText("受信した結果").length).toBeGreaterThan(0),await n(t.getAllByText("バリデーション結果").length).toBeGreaterThan(0),await n(t.queryByText(/Bearer secret/i)).not.toBeInTheDocument()}),await a("Narrative success and image failure remain partial success",async()=>{await n(t.getByText(/場面の画像: 生成できませんでした/)).toBeInTheDocument(),await n(t.getByTestId("image-artifact-item")).toBeInTheDocument()}),await a("Note proposal is reviewable but not auto-applied",async()=>{await n(t.getByTestId("note-proposal-item")).toHaveTextContent("石扉を開くと淡く光る鍵"),await c.click(t.getByRole("button",{name:"適用"})),await n(o.onNoteReview).toHaveBeenCalled()})}};var A;const T={args:{session:{...r("failed"),executions:(A=r("failed").executions)==null?void 0:A.map(e=>({...e,developmentDiagnostics:null}))},onExecutionAction:s()},play:async({canvasElement:e,step:o})=>{const a=Q(e);await o("Production omits developer-only details",async()=>{await n(a.queryByText("開発者向け詳細")).not.toBeInTheDocument(),await n(a.queryByText("AIサービスから時間内に応答がありませんでした。")).not.toBeInTheDocument(),await n(a.getByRole("button",{name:"入力取り消し"})).toBeInTheDocument()})}};var w,B,I;d.parameters={...d.parameters,docs:{...(w=d.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('queued'),
    onExecutionAction: fn()
  }
}`,...(I=(B=d.parameters)==null?void 0:B.docs)==null?void 0:I.source}}};var f,E,h;u.parameters={...u.parameters,docs:{...(f=u.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('running'),
    onExecutionAction: fn()
  }
}`,...(h=(E=u.parameters)==null?void 0:E.docs)==null?void 0:h.source}}};var R,N,D;l.parameters={...l.parameters,docs:{...(R=l.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('retry-wait'),
    onExecutionAction: fn()
  }
}`,...(D=(N=l.parameters)==null?void 0:N.docs)==null?void 0:D.source}}};var S,b,P;p.parameters={...p.parameters,docs:{...(S=p.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('cancelled'),
    onExecutionAction: fn()
  }
}`,...(P=(b=p.parameters)==null?void 0:b.docs)==null?void 0:P.source}}};var C,k,F;m.parameters={...m.parameters,docs:{...(C=m.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('succeeded'),
    onExecutionAction: fn()
  }
}`,...(F=(k=m.parameters)==null?void 0:k.docs)==null?void 0:F.source}}};var q,H,G;y.parameters={...y.parameters,docs:{...(q=y.parameters)==null?void 0:q.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('succeeded'),
    onExecutionAction: fn(),
    keepSucceededStatusVisible: true
  }
}`,...(G=(H=y.parameters)==null?void 0:H.docs)==null?void 0:G.source}}};var O,_,z;g.parameters={...g.parameters,docs:{...(O=g.parameters)==null?void 0:O.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('superseded'),
    onExecutionAction: fn()
  }
}`,...(z=(_=g.parameters)==null?void 0:_.docs)==null?void 0:z.source}}};var M,V,W;x.parameters={...x.parameters,docs:{...(M=x.parameters)==null?void 0:M.docs,source:{originalSource:`{
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
}`,...(W=(V=x.parameters)==null?void 0:V.docs)==null?void 0:W.source}}};var X,U,L;T.parameters={...T.parameters,docs:{...(X=T.parameters)==null?void 0:X.docs,source:{originalSource:`{
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
}`,...(L=(U=T.parameters)==null?void 0:U.docs)==null?void 0:L.source}}};const te=["Queued","Running","RetryWait","Cancelled","Succeeded","SucceededStatusPinnedForDebug","Superseded","FailedWithDevelopmentDiagnostics","ProductionRedaction"];export{p as Cancelled,x as FailedWithDevelopmentDiagnostics,T as ProductionRedaction,d as Queued,l as RetryWait,u as Running,m as Succeeded,y as SucceededStatusPinnedForDebug,g as Superseded,te as __namedExportsOrder,ee as default};
