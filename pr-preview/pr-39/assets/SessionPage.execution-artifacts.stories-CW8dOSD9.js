import{j as u}from"./jsx-runtime-BO8uF4Og.js";import{r as ne}from"./index-D4H_InIO.js";import{f as r,w as E,e as a,u as d}from"./index-C4S39nCK.js";import{S as te}from"./SessionActivityFeed-CwCBVPY3.js";import"./Surfaces-9URXQPhi.js";const s="2026-07-21T12:00:00Z",I=(e,i="narrative")=>({id:`EXE-${i}-${e}`,sessionId:"SES-FIXTURE",kind:i,triggerType:i==="narrative"?"player-input":"session-turn",triggerId:"INP-1",status:e,revision:2,isRetryable:e==="failed"||e==="cancelled",attemptCount:e==="retry-wait"?1:2,maxAttempts:3,errorCode:e==="failed"?"provider_timeout":null,userErrorMessage:e==="failed"?"AIサービスから時間内に応答がありませんでした。":null,createdAt:s,startedAt:s,completedAt:["failed","cancelled","succeeded","superseded"].includes(e)?s:null,capabilities:{canRetry:e==="failed"||e==="cancelled",canCancel:["queued","running","retry-wait","cancel-requested"].includes(e),canDismiss:["failed","cancelled","succeeded","superseded"].includes(e)},developmentDiagnostics:{sessionId:"SES-FIXTURE",triggerType:"player-input",triggerId:"INP-1",revision:2,leaseOwner:e==="running"?"worker-fixture":null,leaseTokenHint:e==="running"?"…ABCD1234":null,leaseExpiresAt:e==="running"?s:null,attempts:[{id:"ATT-1",attemptNumber:1,status:e==="retry-wait"?"failed":e,workerId:"worker-fixture",provider:"mock",model:"fixture-model",providerRequestId:"resp-fixture",startedAt:s,completedAt:s,latencyMilliseconds:123,inputTokens:20,outputTokens:42,finishReason:"stop",errorCode:e==="failed"?"provider_timeout":null,errorCategory:e==="failed"?"TimeoutException":null,retryable:e==="failed",correlationId:"corr-1",traceId:"0123456789abcdef0123456789abcdef",spanId:"0123456789abcdef",exceptionChain:e==="failed"?"AiProviderException -> TimeoutException":null,redactedResponseExcerpt:e==="failed"?"Authorization=[REDACTED]":null,sentPrompt:'{"messages":[{"role":"system","content":"Narrative rules"},{"role":"user","content":"銀の鍵を扉にかざす"}]}',receivedResult:'{"schemaVersion":"narrative-dialogue.v8","turnType":"action-result","heading":"銀の鍵を掲げる","body":"鍵の光が石扉をなぞる。","signals":[],"interpretation":null}',validationResult:e==="failed"?'{"status":"failed","errorCode":"provider_timeout","reason":"AI Provider request timed out."}':'{"status":"passed","checks":["dialogue-contract","progression-signals"]}',promptVersion:"dialogue.v8",contextHash:"abc123",contextSizeBytes:2048}]}}),o=(e="failed")=>{const i=I(e),n=I("failed","image"),t=I("succeeded","note-proposal");return{id:"SES-FIXTURE",scenarioId:"SCN-1",status:"active",revision:4,interpretationEnabled:!1,pendingInputs:[],createdAt:s,updatedAt:s,inputs:[{id:"INP-1",requestId:"req-1",text:"銀の鍵を扉にかざす",interactionType:"dialogue",acceptedAfterTurnId:"TRN-OPEN",acceptedSessionRevision:1,createdAt:s}],executions:[i,n,t],turns:[{id:"TRN-OPEN",position:1,kind:"narrative",narrative:{body:"水没した書庫で、銀の鍵が淡く光っている。",turnType:"opening"},createdAt:s},{id:"TRN-2",position:2,previousTurnId:"TRN-OPEN",kind:"narrative",narrative:{body:"鍵の光が石扉の輪郭をなぞり、静かに道が開いた。",playerInputId:"INP-1",turnType:"action-result"},createdAt:s}],artifacts:[{id:"ART-IMG",executionId:n.id,kind:"image",status:"committed",contentType:"image/png",createdAt:s},{id:"ART-NOTE",executionId:t.id,kind:"note-patch",status:"committed",contentType:"application/json",createdAt:s}],noteProposals:[{artifactId:"ART-NOTE",sourceTurnId:"TRN-2",expectedNoteRevision:0,proposedTitle:"銀の鍵",beforeBody:"",proposedBody:"石扉を開くと淡く光る鍵。",rationale:"Turn 2で扉を開いた事実に基づく。",status:"pending",createdAt:s}],activity:[{type:"turn",id:"TRN-OPEN",order:1},{type:"input",id:"INP-1",order:2},{type:"execution",id:i.id,order:3,causalId:"INP-1"},{type:"turn",id:"TRN-2",order:4,causalId:"INP-1"},{type:"execution",id:n.id,order:5,causalId:"TRN-2"},{type:"artifact",id:"ART-IMG",order:6,causalId:n.id},{type:"execution",id:t.id,order:7,causalId:"TRN-2"},{type:"artifact",id:"ART-NOTE",order:8,causalId:t.id}]}},de={title:"Session/Execution and artifacts",component:te,parameters:{layout:"padded"}},l={args:{session:o("queued"),onExecutionAction:r()}},p={args:{session:o("running"),onExecutionAction:r()}},m={args:{session:o("retry-wait"),onExecutionAction:r()}},g={args:{session:o("cancelled"),onExecutionAction:r()}},y={args:{session:o("succeeded"),onExecutionAction:r()}},x={args:{session:o("succeeded"),onExecutionAction:r(),keepSucceededStatusVisible:!0}};function ae(){const[e,i]=ne.useState(!1);return u.jsxs(u.Fragment,{children:[u.jsxs("label",{children:[u.jsx("input",{type:"checkbox",checked:e,onChange:n=>i(n.target.checked)}),"成功後もAI生成ステータスを表示する"]}),u.jsx(te,{session:o("succeeded"),keepSucceededStatusVisible:e})]})}const v={args:{session:o("succeeded")},render:()=>u.jsx(ae,{}),play:async({canvasElement:e,step:i})=>{const n=E(e),t=n.getByRole("checkbox",{name:"成功後もAI生成ステータスを表示する"});await i("消失アニメーション中でも設定を有効にするとステータスを保持する",async()=>{await new Promise(c=>window.setTimeout(c,240)),await d.click(t),await new Promise(c=>window.setTimeout(c,800)),await a(n.getByText(/物語: 生成が完了しました/)).toBeVisible()}),await i("連続して切り替えても有効時には消失アニメーションを停止する",async()=>{await d.click(t),await new Promise(B=>window.setTimeout(B,240)),await d.click(t),await new Promise(B=>window.setTimeout(B,800));const c=n.getByTestId("execution-EXE-narrative-succeeded");await a(c).not.toHaveClass("execution-is-completing"),await a(c).toBeVisible()})}},w={args:{session:o("superseded"),onExecutionAction:r()}},T={args:{session:o("failed"),onExecutionAction:r(),onNoteReview:r()},play:async({canvasElement:e,args:i,step:n})=>{const t=E(e);await n("Player Input remains separate from the failure",async()=>{await a(t.getByTestId("session-input-item")).toHaveTextContent("銀の鍵を扉にかざす"),await a(t.getAllByTestId("narrative-turn-item")).toHaveLength(2),await a(t.queryByText("AIサービスから時間内に応答がありませんでした。")).not.toBeInTheDocument(),await a(t.getByRole("button",{name:"入力取り消し"})).toBeInTheDocument()}),await n("Retry updates the existing execution slot",async()=>{await d.click(t.getAllByRole("button",{name:"再試行"})[0]),await a(i.onExecutionAction).toHaveBeenCalled()}),await n("The status line toggles safe development diagnostics",async()=>{const c=t.getAllByText(/物語: 生成できませんでした/)[0];await d.click(c),await d.click(t.getAllByText("例外情報")[0]),await a(t.getAllByText(/Authorization=\[REDACTED\]/).length).toBeGreaterThan(0),await a(t.getAllByText("送信したプロンプト").length).toBeGreaterThan(0),await a(t.getAllByText("受信した結果").length).toBeGreaterThan(0),await a(t.getAllByText("バリデーション結果").length).toBeGreaterThan(0),await a(t.queryByText(/Bearer secret/i)).not.toBeInTheDocument()}),await n("Narrative success and image failure remain partial success",async()=>{await a(t.getByText(/場面の画像: 生成できませんでした/)).toBeInTheDocument(),await a(t.getByTestId("image-artifact-item")).toBeInTheDocument()}),await n("Note proposal is reviewable but not auto-applied",async()=>{await a(t.getByTestId("note-proposal-item")).toHaveTextContent("石扉を開くと淡く光る鍵"),await d.click(t.getByRole("button",{name:"適用"})),await a(i.onNoteReview).toHaveBeenCalled()})}};var f;const A={args:{session:{...o("failed"),executions:(f=o("failed").executions)==null?void 0:f.map(e=>({...e,developmentDiagnostics:null}))},onExecutionAction:r()},play:async({canvasElement:e,step:i})=>{const n=E(e);await i("Production omits developer-only details",async()=>{await a(n.queryByText("開発者向け詳細")).not.toBeInTheDocument(),await a(n.queryByText("AIサービスから時間内に応答がありませんでした。")).not.toBeInTheDocument(),await a(n.getByRole("button",{name:"入力取り消し"})).toBeInTheDocument()})}};var h,R,S;l.parameters={...l.parameters,docs:{...(h=l.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('queued'),
    onExecutionAction: fn()
  }
}`,...(S=(R=l.parameters)==null?void 0:R.docs)==null?void 0:S.source}}};var b,N,k;p.parameters={...p.parameters,docs:{...(b=p.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('running'),
    onExecutionAction: fn()
  }
}`,...(k=(N=p.parameters)==null?void 0:N.docs)==null?void 0:k.source}}};var D,P,C;m.parameters={...m.parameters,docs:{...(D=m.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('retry-wait'),
    onExecutionAction: fn()
  }
}`,...(C=(P=m.parameters)==null?void 0:P.docs)==null?void 0:C.source}}};var F,q,H;g.parameters={...g.parameters,docs:{...(F=g.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('cancelled'),
    onExecutionAction: fn()
  }
}`,...(H=(q=g.parameters)==null?void 0:q.docs)==null?void 0:H.source}}};var V,G,O;y.parameters={...y.parameters,docs:{...(V=y.parameters)==null?void 0:V.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('succeeded'),
    onExecutionAction: fn()
  }
}`,...(O=(G=y.parameters)==null?void 0:G.docs)==null?void 0:O.source}}};var j,X,_;x.parameters={...x.parameters,docs:{...(j=x.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('succeeded'),
    onExecutionAction: fn(),
    keepSucceededStatusVisible: true
  }
}`,...(_=(X=x.parameters)==null?void 0:X.docs)==null?void 0:_.source}}};var z,M,W;v.parameters={...v.parameters,docs:{...(z=v.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('succeeded')
  },
  render: () => <SucceededStatusToggleHarness />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const setting = canvas.getByRole('checkbox', {
      name: '成功後もAI生成ステータスを表示する'
    });
    await step('消失アニメーション中でも設定を有効にするとステータスを保持する', async () => {
      await new Promise(resolve => window.setTimeout(resolve, 240));
      await userEvent.click(setting);
      await new Promise(resolve => window.setTimeout(resolve, 800));
      await expect(canvas.getByText(/物語: 生成が完了しました/)).toBeVisible();
    });
    await step('連続して切り替えても有効時には消失アニメーションを停止する', async () => {
      await userEvent.click(setting);
      await new Promise(resolve => window.setTimeout(resolve, 240));
      await userEvent.click(setting);
      await new Promise(resolve => window.setTimeout(resolve, 800));
      const execution = canvas.getByTestId('execution-EXE-narrative-succeeded');
      await expect(execution).not.toHaveClass('execution-is-completing');
      await expect(execution).toBeVisible();
    });
  }
}`,...(W=(M=v.parameters)==null?void 0:M.docs)==null?void 0:W.source}}};var U,L,Q;w.parameters={...w.parameters,docs:{...(U=w.parameters)==null?void 0:U.docs,source:{originalSource:`{
  args: {
    session: sessionActivityFixture('superseded'),
    onExecutionAction: fn()
  }
}`,...(Q=(L=w.parameters)==null?void 0:L.docs)==null?void 0:Q.source}}};var $,K,Z;T.parameters={...T.parameters,docs:{...($=T.parameters)==null?void 0:$.docs,source:{originalSource:`{
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
}`,...(Z=(K=T.parameters)==null?void 0:K.docs)==null?void 0:Z.source}}};var J,Y,ee;A.parameters={...A.parameters,docs:{...(J=A.parameters)==null?void 0:J.docs,source:{originalSource:`{
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
}`,...(ee=(Y=A.parameters)==null?void 0:Y.docs)==null?void 0:ee.source}}};const ue=["Queued","Running","RetryWait","Cancelled","Succeeded","SucceededStatusPinnedForDebug","SucceededStatusToggleStress","Superseded","FailedWithDevelopmentDiagnostics","ProductionRedaction"];export{g as Cancelled,T as FailedWithDevelopmentDiagnostics,A as ProductionRedaction,l as Queued,m as RetryWait,p as Running,y as Succeeded,x as SucceededStatusPinnedForDebug,v as SucceededStatusToggleStress,w as Superseded,ue as __namedExportsOrder,de as default};
