import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{r as v}from"./index-D4H_InIO.js";import{a as m,t as c,I as M,T as C,b as I}from"./Surfaces-xpIMDkG0.js";const P={queued:"処理待ちです。",running:"処理しています……","retry-wait":"一時的な問題のため再試行します。","cancel-requested":"キャンセルしています……",failed:"処理を完了できませんでした。",cancelled:"キャンセルしました。",succeeded:"処理が完了しました。",superseded:"Sessionが先へ進んだため、この結果は適用されませんでした。"},_={"scenario-turn":"Scenario Turn","note-proposal":"ノートの変更案",image:"場面の画像"},L={"loading-world":"世界と現在地を読み込んでいます。","enumerating-actions":"利用可能なObjectアクションを列挙しています。","selecting-action":"入力に合うObjectアクションを選んでいます。","applying-rules":"選択したアクションのルールを適用しています。","running-extension":"確定済みの拡張アクションを実行しています。","generating-narrative":"確定済みの状態からNarrativeを生成しています。",completed:"Scenario Turnが完了しました。",failed:"Scenario Turnを完了できませんでした。",cancelled:"Scenario Turnをキャンセルしました。"},y={queued:"neutral",running:"info","retry-wait":"warning","cancel-requested":"warning",failed:"danger",cancelled:"neutral",succeeded:"success",superseded:"neutral"},O={queued:c[y.queued],running:c[y.running],"retry-wait":c[y["retry-wait"]],"cancel-requested":c[y["cancel-requested"]],failed:c[y.failed],cancelled:`${c[y.cancelled]} opacity-72`,succeeded:c[y.succeeded],superseded:`${c[y.superseded]} opacity-72`},j="mx-auto mb-3 w-[min(100%,720px)] rounded-myr-card border border-myr-ink/14 bg-myr-session-artifact px-4 py-4";function A({text:n}){return e.jsx("article",{className:"session-input-item mt-0.5 mr-2 mb-2 ml-13 w-fit max-w-[min(82%,620px)] justify-self-end rounded-[18px_18px_5px_18px] border border-[#c9bce4] bg-myr-session-input px-4 py-3 text-[#2c2440] shadow-[0_7px_20px_rgba(58,43,83,.14)]","data-testid":"session-input-item","aria-label":"Player Input",children:e.jsx("p",{className:"m-0 font-bold leading-[1.55]",children:n})})}function h(){return e.jsx("article",{className:"grid gap-2 rounded-myr-card border border-myr-ink/14 bg-myr-session-turn p-4","data-testid":"program-turn-item","aria-label":"Module進行",children:e.jsxs("p",{className:"m-0 max-w-none leading-[1.65] text-[#303644]",children:[e.jsx("span",{className:"mr-2 inline-block rounded-full bg-myr-gold px-2 py-px align-middle text-myr-micro font-black tracking-[.1em] text-[#17151f]","aria-hidden":"true",children:"PROGRAM"}),"判定結果を処理し、Sessionの進行へ反映しました。"]})})}function T({turn:n}){var t,l;const r=(t=n.narrative)==null?void 0:t.interpretation;return e.jsxs("article",{className:"grid gap-2 rounded-myr-card border border-myr-ink/14 bg-myr-session-turn p-4","data-testid":"narrative-turn-item","aria-label":"公開済みNarrative Turn",children:[e.jsxs("p",{className:"m-0 max-w-none leading-[1.65] text-[#303644]",children:[e.jsx("span",{className:"mr-2 inline-block rounded-full bg-myr-gold px-2 py-px align-middle text-myr-micro font-black tracking-[.1em] text-[#17151f]","aria-hidden":"true",children:"AI"}),((l=n.narrative)==null?void 0:l.body)??"Narrativeを表示できません。"]}),r&&e.jsxs("details",{className:"rounded-lg border border-myr-ink/10 bg-white/35 px-3 py-2 text-myr-caption text-[#555b68]",children:[e.jsx("summary",{className:"cursor-pointer font-bold focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-myr-iris",children:"入力の解釈"}),e.jsx("p",{className:"mt-2 mb-0 leading-relaxed",children:r})]})]})}const V=["queued","running","retry-wait","cancel-requested"],D=n=>{const r=Number.isFinite(n)?Math.max(0,Math.floor(n/1e3)):0,t=Math.floor(r/60),l=r%60;return t>=60?`${Math.floor(t/60)}時間${t%60}分`:t>0?`${t}分${l}秒`:`${l}秒`};function $({projection:n}){var u;const r=n.selectedAction,t=n.postState,l=(t==null?void 0:t.currentLocation)??n.currentLocation;return e.jsxs("div",{className:"mt-2 ml-auto grid w-[min(100%,620px)] gap-1.5 rounded-xl border border-myr-ink/10 bg-myr-paper/55 px-3 py-2 text-left text-myr-caption text-myr-ink-soft","data-testid":"scenario-turn-public-projection",children:[l&&e.jsxs("p",{className:"m-0",children:[e.jsx("strong",{children:"現在地:"})," ",l.label]}),n.availableActions&&e.jsxs("p",{className:"m-0",children:[e.jsx("strong",{children:"利用可能な行動:"})," ",n.availableActions.map(o=>o.label).join("、")||"なし"]}),r&&e.jsxs("p",{className:"m-0",children:[e.jsx("strong",{children:"選択:"})," ",r.objectLabel?`${r.objectLabel} / `:"",r.actionLabel??r.actionId]}),t&&e.jsxs("p",{className:"m-0",children:[e.jsx("strong",{children:"確定済み状態:"})," Revision ",t.revision,(u=t.facts)!=null&&u.length?` / ${t.facts.join("、")}`:""]})]})}function z({execution:n,elapsed:r}){var u;const t=n.stage??((u=n.scenarioTurn)==null?void 0:u.stage),l=n.kind==="scenario-turn"&&t?L[t]:P[n.status]??n.status;return e.jsxs("span",{className:"execution-status-copy inline-flex items-baseline justify-end gap-2",children:[_[n.kind]??n.kind,": ",l,e.jsx("span",{className:"whitespace-nowrap text-[color-mix(in_srgb,currentColor_68%,transparent)] tabular-nums","aria-hidden":"true",children:r})]},`${n.status}-${t??""}-${n.revision}`)}function S({execution:n,onAction:r,keepSucceededStatusVisible:t=!1}){var x;const l=V.includes(n.status),u=n.status==="failed",o=n.status==="succeeded",[k,b]=v.useState(()=>Date.now()),[d,g]=v.useState(!1);if(v.useEffect(()=>{if(!l)return;b(Date.now());const i=window.setInterval(()=>b(Date.now()),1e3);return()=>window.clearInterval(i)},[l]),v.useEffect(()=>{if(g(!1),!o||t)return;const i=window.setTimeout(()=>g(!0),720);return()=>window.clearTimeout(i)},[o,n.revision,t]),d)return null;const a=Date.parse(n.startedAt??n.createdAt),p=n.completedAt?Date.parse(n.completedAt):k,s=D(p-a),w=e.jsx(z,{execution:n,elapsed:s}),f=u&&n.triggerType==="player-input"&&n.capabilities.canDismiss,E=(n.capabilities.canRetry||n.capabilities.canCancel||f)&&e.jsxs("div",{className:`execution-actions flex min-h-6.5 justify-end gap-2 ${u?"mt-1.25":"mt-1"}`,children:[n.capabilities.canRetry&&e.jsx(m,{variant:"ghost",size:"sm",onClick:()=>r==null?void 0:r(n.id,"retry"),children:"再試行"}),n.capabilities.canCancel&&e.jsx(m,{variant:"ghost",size:"sm",onClick:()=>r==null?void 0:r(n.id,"cancel"),children:"キャンセル"}),f&&e.jsx(m,{variant:"ghost",size:"sm",onClick:()=>r==null?void 0:r(n.id,"dismiss"),children:"入力取り消し"})]});return e.jsxs("article",{className:`session-execution-item status-${n.status} -mt-0.75 mr-2 mb-2 ml-auto w-[min(100%,680px)] justify-self-end border-0 bg-transparent p-0 text-right text-myr-caption leading-[1.45] ${O[n.status]} ${o&&!t?"execution-is-completing":""}`,"data-testid":`execution-${n.id}`,role:u?"alert":"status","aria-live":l?"polite":void 0,children:[n.developmentDiagnostics?e.jsxs("details",{className:"m-0",children:[e.jsx("summary",{className:"execution-diagnostics-summary min-h-5 cursor-pointer list-inside text-inherit select-none focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-myr-iris",children:w}),e.jsxs("div",{className:"mt-1.75 ml-auto w-[min(100%,620px)] rounded-xl bg-myr-session-diagnostics px-4 py-3 text-left text-[#aaa2b3]",children:[e.jsx("span",{className:"mb-2 block font-extrabold",children:"開発者向け詳細"}),e.jsxs("dl",{className:"grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 [&_dd]:m-0 [&_dd]:wrap-anywhere",children:[e.jsx("dt",{children:"Execution ID"}),e.jsx("dd",{children:e.jsx("code",{children:n.id})}),e.jsx("dt",{children:"Session ID"}),e.jsx("dd",{children:e.jsx("code",{children:n.developmentDiagnostics.sessionId})}),e.jsx("dt",{children:"Revision"}),e.jsx("dd",{children:n.developmentDiagnostics.revision}),e.jsx("dt",{children:"Lease"}),e.jsxs("dd",{children:[n.developmentDiagnostics.leaseOwner??"—"," ",n.developmentDiagnostics.leaseTokenHint??""]})]}),n.developmentDiagnostics.attempts.map(i=>e.jsxs("section",{className:"mt-3.5",children:[e.jsxs("strong",{children:["Attempt ",i.attemptNumber]}),e.jsxs("dl",{className:"my-1.75 mb-2.5 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 [&_dd]:m-0 [&_dd]:wrap-anywhere",children:[e.jsx("dt",{children:"Status"}),e.jsx("dd",{children:i.status}),e.jsx("dt",{children:"Provider"}),e.jsxs("dd",{children:[i.provider??"—"," / ",i.model??"—"]}),e.jsx("dt",{children:"Latency"}),e.jsx("dd",{children:i.latencyMilliseconds==null?"—":`${i.latencyMilliseconds}ms`})]}),i.sentPrompt&&e.jsx(q,{label:"送信したプロンプト",value:i.sentPrompt}),i.receivedResult&&e.jsx(q,{label:"受信した結果",value:i.receivedResult}),i.validationResult&&e.jsx(q,{label:"バリデーション結果",value:i.validationResult}),(i.exceptionChain||i.redactedResponseExcerpt)&&e.jsx(q,{label:"例外情報",value:JSON.stringify({exceptionChain:i.exceptionChain,redactedResponseExcerpt:i.redactedResponseExcerpt},null,2)})]},i.id))]})]}):e.jsx("div",{className:"min-h-5 text-inherit",children:w}),n.kind==="scenario-turn"&&n.scenarioTurn&&e.jsx($,{projection:n.scenarioTurn}),u&&n.kind==="scenario-turn"&&((x=n.scenarioTurn)==null?void 0:x.postState)&&e.jsx("p",{className:"mt-2 mb-0 ml-auto w-[min(100%,620px)] rounded-xl border border-myr-gold/35 bg-myr-paper/70 px-3 py-2 text-left font-bold text-myr-ruby","data-testid":"scenario-turn-committed-failure",children:"Narrativeの生成または公開に失敗しましたが、Objectの状態、配置、適用結果は確定済みです。再試行してもルールは再適用されません。"}),E]})}function q({label:n,value:r}){return e.jsxs("details",{className:"mt-1.5 border-t border-[#aaa2b3]/18 pt-2",children:[e.jsx("summary",{className:"cursor-pointer font-[750]",children:n}),e.jsx("pre",{className:"mt-1.75 max-h-65 overflow-auto wrap-anywhere whitespace-pre-wrap rounded-lg bg-myr-session-payload p-2 text-left text-myr-caption text-[#c8c1d0]",children:r})]})}function R({proposal:n,onReview:r}){const[t,l]=v.useState(!1),[u,o]=v.useState(n.proposedTitle),[k,b]=v.useState(n.proposedBody),d={expectedNoteRevision:n.expectedNoteRevision};return e.jsxs("article",{className:j,"data-testid":"note-proposal-item",children:[e.jsxs("strong",{children:["ノート変更案: ",n.proposedTitle]}),e.jsxs("div",{className:"my-2.5 grid gap-2 [&_del]:block [&_del]:rounded-myr-control [&_del]:bg-myr-session-note-removed [&_del]:p-3 [&_del]:no-underline [&_ins]:block [&_ins]:rounded-myr-control [&_ins]:bg-myr-session-note-added [&_ins]:p-3 [&_ins]:no-underline",children:[e.jsx("del",{children:n.beforeBody||"（新規ノート）"}),e.jsx("ins",{children:n.proposedBody})]}),e.jsxs("p",{children:["根拠: ",n.rationale]}),t&&e.jsxs("fieldset",{"aria-label":"ノート変更案を編集",children:[e.jsxs("label",{children:["タイトル",e.jsx(M,{value:u,onChange:g=>o(g.target.value)})]}),e.jsxs("label",{children:["本文",e.jsx(C,{value:k,onChange:g=>b(g.target.value)})]}),e.jsxs("div",{className:I,children:[e.jsx(m,{variant:"primary",size:"sm",onClick:()=>r==null?void 0:r(n.artifactId,"edit-apply",{...d,title:u,body:k}),children:"編集内容を適用"}),e.jsx(m,{variant:"ghost",size:"sm",onClick:()=>l(!1),children:"編集をやめる"})]})]}),n.status==="pending"&&!t&&e.jsxs("div",{className:I,children:[e.jsx(m,{variant:"primary",size:"sm",onClick:()=>r==null?void 0:r(n.artifactId,"apply",d),children:"適用"}),e.jsx(m,{variant:"secondary",size:"sm",onClick:()=>l(!0),children:"編集して適用"}),e.jsx(m,{variant:"danger",size:"sm",onClick:()=>r==null?void 0:r(n.artifactId,"reject",d),children:"却下"}),e.jsx(m,{variant:"ghost",size:"sm",onClick:()=>r==null?void 0:r(n.artifactId,"snooze",d),children:"あとで"})]})]})}function N({mediaUrl:n,contentType:r}){return e.jsxs("figure",{className:j,"data-testid":"image-artifact-item",children:[n?e.jsx("img",{className:"block max-h-105 w-full rounded-xl object-cover",src:n,alt:"生成された場面",loading:"lazy"}):e.jsx("div",{className:"grid min-h-myr-module-preview-min place-items-center rounded-xl bg-myr-session-preview font-extrabold",role:"img","aria-label":"画像Artifactのプレビュー",children:"画像プレビュー"}),e.jsxs("figcaption",{children:[r," / Narrativeとは独立した任意成果物"]})]})}function H({session:n,onExecutionAction:r,onNoteReview:t,keepSucceededStatusVisible:l=!1}){const u=new Map((n.inputs??[]).map(a=>[a.id,a])),o=new Map((n.executions??[]).map(a=>[a.id,a])),k=new Map(n.turns.map(a=>[a.id,a])),b=new Map((n.artifacts??[]).map(a=>[a.id,a])),d=new Map((n.noteProposals??[]).map(a=>[a.artifactId,a])),g=n.activity??[];return e.jsx("section",{className:"grid max-h-[48vh] gap-3 overflow-auto pr-2",role:"log","aria-label":"Session activity","data-testid":"session-activity-feed",children:g.map(a=>{if(a.type==="input"){const s=u.get(a.id);return s?e.jsx(A,{text:s.text},`input-${a.id}`):null}if(a.type==="execution"){const s=o.get(a.id);return s?e.jsx(S,{execution:s,onAction:r,keepSucceededStatusVisible:l},`execution-${a.id}`):null}if(a.type==="turn"){const s=k.get(a.id);return s?s.kind==="module"&&!s.narrative?e.jsx(h,{},`turn-${a.id}`):e.jsx(T,{turn:s},`turn-${a.id}`):null}const p=b.get(a.id);if(!p)return null;if(p.kind==="image")return e.jsx(N,{mediaUrl:p.mediaUrl,contentType:p.contentType},`artifact-${a.id}`);if(p.kind==="note-patch"){const s=d.get(a.id);return s?e.jsx(R,{proposal:s,onReview:t},`artifact-${a.id}`):null}return null})})}A.__docgenInfo={description:"",methods:[],displayName:"SessionInputItem",props:{text:{required:!0,tsType:{name:"string"},description:""}}};h.__docgenInfo={description:"",methods:[],displayName:"ProgramTurnItem"};T.__docgenInfo={description:"",methods:[],displayName:"NarrativeTurnItem",props:{turn:{required:!0,tsType:{name:"signature",type:"object",raw:`{
  id: string;
  position: number;
  previousTurnId?: string | null;
  kind: string;
  execution?: ModuleExecution | null;
  narrative?: {
    schemaVersion?: string | null;
    turnType?: string | null;
    heading?: string | null;
    body: string;
    playerInputId?: string | null;
    playerInput?: string | null;
    acceptedAfterTurnId?: string | null;
    signals?: string[] | null;
    interpretation?: string | null;
  } | null;
  narrativeHandoff?: {
    status: string;
    errorCode?: string | null;
    errorMessage?: string | null;
  } | null;
  createdAt: string;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"position",value:{name:"number",required:!0}},{key:"previousTurnId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"kind",value:{name:"string",required:!0}},{key:"execution",value:{name:"union",raw:"ModuleExecution | null",elements:[{name:"signature",type:"object",raw:`{
  id: string;
  package: { moduleId: string; version: string; digest: string; contractVersion: string };
  status: string;
  revision: number;
  viewState: unknown;
  availableActions: ModuleAvailableAction[];
  outcome?: ModuleOutcome | null;
  error?: ModuleError | null;
  uiEvents: ModuleEvent[];
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"package",value:{name:"signature",type:"object",raw:"{ moduleId: string; version: string; digest: string; contractVersion: string }",signature:{properties:[{key:"moduleId",value:{name:"string",required:!0}},{key:"version",value:{name:"string",required:!0}},{key:"digest",value:{name:"string",required:!0}},{key:"contractVersion",value:{name:"string",required:!0}}]},required:!0}},{key:"status",value:{name:"string",required:!0}},{key:"revision",value:{name:"number",required:!0}},{key:"viewState",value:{name:"unknown",required:!0}},{key:"availableActions",value:{name:"Array",elements:[{name:"signature",type:"object",raw:"{ id: string; label: string; enabled: boolean; disabledReason?: string | null }",signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"enabled",value:{name:"boolean",required:!0}},{key:"disabledReason",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}}],raw:"ModuleAvailableAction[]",required:!0}},{key:"outcome",value:{name:"union",raw:"ModuleOutcome | null",elements:[{name:"signature",type:"object",raw:"{ category: string; code: string; title: string; summary: string }",signature:{properties:[{key:"category",value:{name:"string",required:!0}},{key:"code",value:{name:"string",required:!0}},{key:"title",value:{name:"string",required:!0}},{key:"summary",value:{name:"string",required:!0}}]}},{name:"null"}],required:!1}},{key:"error",value:{name:"union",raw:"ModuleError | null",elements:[{name:"signature",type:"object",raw:"{ code: string; message: string; details?: unknown }",signature:{properties:[{key:"code",value:{name:"string",required:!0}},{key:"message",value:{name:"string",required:!0}},{key:"details",value:{name:"unknown",required:!1}}]}},{name:"null"}],required:!1}},{key:"uiEvents",value:{name:"Array",elements:[{name:"signature",type:"object",raw:"{ type: string; payload: unknown }",signature:{properties:[{key:"type",value:{name:"string",required:!0}},{key:"payload",value:{name:"unknown",required:!0}}]}}],raw:"ModuleEvent[]",required:!0}}]}},{name:"null"}],required:!1}},{key:"narrative",value:{name:"union",raw:`{
  schemaVersion?: string | null;
  turnType?: string | null;
  heading?: string | null;
  body: string;
  playerInputId?: string | null;
  playerInput?: string | null;
  acceptedAfterTurnId?: string | null;
  signals?: string[] | null;
  interpretation?: string | null;
} | null`,elements:[{name:"signature",type:"object",raw:`{
  schemaVersion?: string | null;
  turnType?: string | null;
  heading?: string | null;
  body: string;
  playerInputId?: string | null;
  playerInput?: string | null;
  acceptedAfterTurnId?: string | null;
  signals?: string[] | null;
  interpretation?: string | null;
}`,signature:{properties:[{key:"schemaVersion",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"turnType",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"heading",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"body",value:{name:"string",required:!0}},{key:"playerInputId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"playerInput",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"acceptedAfterTurnId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"signals",value:{name:"union",raw:"string[] | null",elements:[{name:"Array",elements:[{name:"string"}],raw:"string[]"},{name:"null"}],required:!1}},{key:"interpretation",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}},{name:"null"}],required:!1}},{key:"narrativeHandoff",value:{name:"union",raw:`{
  status: string;
  errorCode?: string | null;
  errorMessage?: string | null;
} | null`,elements:[{name:"signature",type:"object",raw:`{
  status: string;
  errorCode?: string | null;
  errorMessage?: string | null;
}`,signature:{properties:[{key:"status",value:{name:"string",required:!0}},{key:"errorCode",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"errorMessage",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}},{name:"null"}],required:!1}},{key:"createdAt",value:{name:"string",required:!0}}]}},description:""}}};S.__docgenInfo={description:"",methods:[],displayName:"SessionExecutionItem",props:{execution:{required:!0,tsType:{name:"signature",type:"object",raw:`{
  id: string; sessionId: string; kind: 'scenario-turn' | 'note-proposal' | 'image' | string;
  triggerType: string; triggerId: string; status: SessionExecutionStatus; stage?: ScenarioTurnStage | null; scenarioTurn?: ScenarioTurnProjection | null; revision: number; isRetryable: boolean;
  attemptCount: number; maxAttempts: number; nextAttemptAt?: string | null; errorCode?: string | null; userErrorMessage?: string | null;
  createdAt: string; startedAt?: string | null; completedAt?: string | null; cancelRequestedAt?: string | null; dismissedAt?: string | null;
  capabilities: { canRetry: boolean; canCancel: boolean; canDismiss: boolean };
  developmentDiagnostics?: {
    sessionId: string; triggerType: string; triggerId: string; revision: number; leaseOwner?: string | null;
    leaseTokenHint?: string | null; leaseExpiresAt?: string | null; attempts: SessionExecutionAttemptApiResponse[];
  } | null;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"sessionId",value:{name:"string",required:!0}},{key:"kind",value:{name:"union",raw:"'scenario-turn' | 'note-proposal' | 'image' | string",elements:[{name:"literal",value:"'scenario-turn'"},{name:"literal",value:"'note-proposal'"},{name:"literal",value:"'image'"},{name:"string"}],required:!0}},{key:"triggerType",value:{name:"string",required:!0}},{key:"triggerId",value:{name:"string",required:!0}},{key:"status",value:{name:"union",raw:"'queued' | 'running' | 'retry-wait' | 'cancel-requested' | 'succeeded' | 'failed' | 'cancelled' | 'superseded'",elements:[{name:"literal",value:"'queued'"},{name:"literal",value:"'running'"},{name:"literal",value:"'retry-wait'"},{name:"literal",value:"'cancel-requested'"},{name:"literal",value:"'succeeded'"},{name:"literal",value:"'failed'"},{name:"literal",value:"'cancelled'"},{name:"literal",value:"'superseded'"}],required:!0}},{key:"stage",value:{name:"union",raw:"ScenarioTurnStage | null",elements:[{name:"union",raw:`| 'loading-world'
| 'enumerating-actions'
| 'selecting-action'
| 'applying-rules'
| 'running-extension'
| 'generating-narrative'
| 'completed'
| 'failed'
| 'cancelled'`,elements:[{name:"literal",value:"'loading-world'"},{name:"literal",value:"'enumerating-actions'"},{name:"literal",value:"'selecting-action'"},{name:"literal",value:"'applying-rules'"},{name:"literal",value:"'running-extension'"},{name:"literal",value:"'generating-narrative'"},{name:"literal",value:"'completed'"},{name:"literal",value:"'failed'"},{name:"literal",value:"'cancelled'"}],required:!0},{name:"null"}],required:!1}},{key:"scenarioTurn",value:{name:"union",raw:"ScenarioTurnProjection | null",elements:[{name:"signature",type:"object",raw:`{
  schemaVersion: 'scenario-turn.v1' | '1' | string;
  stage: ScenarioTurnStage;
  currentLocation?: { locationId: string; label: string } | null;
  objects?: ScenarioTurnPublicObject[];
  availableActions?: ScenarioTurnPublicAction[];
  selectedAction?: ScenarioTurnSelectedAction | null;
  postState?: ScenarioTurnPublicPostState | null;
  manualUi?: {
    objectId: string;
    actionId: string;
    actionLabel: string;
    visibility: 'manual-ui';
    execution: ModuleExecution;
  } | null;
}`,signature:{properties:[{key:"schemaVersion",value:{name:"union",raw:"'scenario-turn.v1' | '1' | string",elements:[{name:"literal",value:"'scenario-turn.v1'"},{name:"literal",value:"'1'"},{name:"string"}],required:!0}},{key:"stage",value:{name:"union",raw:`| 'loading-world'
| 'enumerating-actions'
| 'selecting-action'
| 'applying-rules'
| 'running-extension'
| 'generating-narrative'
| 'completed'
| 'failed'
| 'cancelled'`,elements:[{name:"literal",value:"'loading-world'"},{name:"literal",value:"'enumerating-actions'"},{name:"literal",value:"'selecting-action'"},{name:"literal",value:"'applying-rules'"},{name:"literal",value:"'running-extension'"},{name:"literal",value:"'generating-narrative'"},{name:"literal",value:"'completed'"},{name:"literal",value:"'failed'"},{name:"literal",value:"'cancelled'"}],required:!0}},{key:"currentLocation",value:{name:"union",raw:"{ locationId: string; label: string } | null",elements:[{name:"signature",type:"object",raw:"{ locationId: string; label: string }",signature:{properties:[{key:"locationId",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}}]}},{name:"null"}],required:!1}},{key:"objects",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  objectId: string;
  objectTypeId?: string | null;
  label: string;
  description?: string | null;
  locationId?: string | null;
  publicState?: Record<string, unknown> | null;
}`,signature:{properties:[{key:"objectId",value:{name:"string",required:!0}},{key:"objectTypeId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"label",value:{name:"string",required:!0}},{key:"description",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"locationId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"publicState",value:{name:"union",raw:"Record<string, unknown> | null",elements:[{name:"Record",elements:[{name:"string"},{name:"unknown"}],raw:"Record<string, unknown>"},{name:"null"}],required:!1}}]}}],raw:"ScenarioTurnPublicObject[]",required:!1}},{key:"availableActions",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  objectId: string;
  actionId: string;
  label: string;
  description?: string | null;
  visibility: 'ai-choice' | 'manual-ui';
  argumentSchema?: Record<string, unknown> | null;
}`,signature:{properties:[{key:"objectId",value:{name:"string",required:!0}},{key:"actionId",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"description",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"visibility",value:{name:"union",raw:"'ai-choice' | 'manual-ui'",elements:[{name:"literal",value:"'ai-choice'"},{name:"literal",value:"'manual-ui'"}],required:!0}},{key:"argumentSchema",value:{name:"union",raw:"Record<string, unknown> | null",elements:[{name:"Record",elements:[{name:"string"},{name:"unknown"}],raw:"Record<string, unknown>"},{name:"null"}],required:!1}}]}}],raw:"ScenarioTurnPublicAction[]",required:!1}},{key:"selectedAction",value:{name:"union",raw:"ScenarioTurnSelectedAction | null",elements:[{name:"signature",type:"object",raw:`{
  objectId: string;
  actionId: string;
  objectLabel?: string | null;
  actionLabel?: string | null;
  arguments?: Record<string, unknown> | null;
  visibility: 'ai-choice' | 'manual-ui';
}`,signature:{properties:[{key:"objectId",value:{name:"string",required:!0}},{key:"actionId",value:{name:"string",required:!0}},{key:"objectLabel",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"actionLabel",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"arguments",value:{name:"union",raw:"Record<string, unknown> | null",elements:[{name:"Record",elements:[{name:"string"},{name:"unknown"}],raw:"Record<string, unknown>"},{name:"null"}],required:!1}},{key:"visibility",value:{name:"union",raw:"'ai-choice' | 'manual-ui'",elements:[{name:"literal",value:"'ai-choice'"},{name:"literal",value:"'manual-ui'"}],required:!0}}]}},{name:"null"}],required:!1}},{key:"postState",value:{name:"union",raw:"ScenarioTurnPublicPostState | null",elements:[{name:"signature",type:"object",raw:`{
  revision: number;
  currentLocation?: { locationId: string; label: string } | null;
  objects: ScenarioTurnPublicObject[];
  facts?: string[];
  events?: string[];
  hints?: string[];
}`,signature:{properties:[{key:"revision",value:{name:"number",required:!0}},{key:"currentLocation",value:{name:"union",raw:"{ locationId: string; label: string } | null",elements:[{name:"signature",type:"object",raw:"{ locationId: string; label: string }",signature:{properties:[{key:"locationId",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}}]}},{name:"null"}],required:!1}},{key:"objects",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  objectId: string;
  objectTypeId?: string | null;
  label: string;
  description?: string | null;
  locationId?: string | null;
  publicState?: Record<string, unknown> | null;
}`,signature:{properties:[{key:"objectId",value:{name:"string",required:!0}},{key:"objectTypeId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"label",value:{name:"string",required:!0}},{key:"description",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"locationId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"publicState",value:{name:"union",raw:"Record<string, unknown> | null",elements:[{name:"Record",elements:[{name:"string"},{name:"unknown"}],raw:"Record<string, unknown>"},{name:"null"}],required:!1}}]}}],raw:"ScenarioTurnPublicObject[]",required:!0}},{key:"facts",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!1}},{key:"events",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!1}},{key:"hints",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!1}}]}},{name:"null"}],required:!1}},{key:"manualUi",value:{name:"union",raw:`{
  objectId: string;
  actionId: string;
  actionLabel: string;
  visibility: 'manual-ui';
  execution: ModuleExecution;
} | null`,elements:[{name:"signature",type:"object",raw:`{
  objectId: string;
  actionId: string;
  actionLabel: string;
  visibility: 'manual-ui';
  execution: ModuleExecution;
}`,signature:{properties:[{key:"objectId",value:{name:"string",required:!0}},{key:"actionId",value:{name:"string",required:!0}},{key:"actionLabel",value:{name:"string",required:!0}},{key:"visibility",value:{name:"literal",value:"'manual-ui'",required:!0}},{key:"execution",value:{name:"signature",type:"object",raw:`{
  id: string;
  package: { moduleId: string; version: string; digest: string; contractVersion: string };
  status: string;
  revision: number;
  viewState: unknown;
  availableActions: ModuleAvailableAction[];
  outcome?: ModuleOutcome | null;
  error?: ModuleError | null;
  uiEvents: ModuleEvent[];
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"package",value:{name:"signature",type:"object",raw:"{ moduleId: string; version: string; digest: string; contractVersion: string }",signature:{properties:[{key:"moduleId",value:{name:"string",required:!0}},{key:"version",value:{name:"string",required:!0}},{key:"digest",value:{name:"string",required:!0}},{key:"contractVersion",value:{name:"string",required:!0}}]},required:!0}},{key:"status",value:{name:"string",required:!0}},{key:"revision",value:{name:"number",required:!0}},{key:"viewState",value:{name:"unknown",required:!0}},{key:"availableActions",value:{name:"Array",elements:[{name:"signature",type:"object",raw:"{ id: string; label: string; enabled: boolean; disabledReason?: string | null }",signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"enabled",value:{name:"boolean",required:!0}},{key:"disabledReason",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}}],raw:"ModuleAvailableAction[]",required:!0}},{key:"outcome",value:{name:"union",raw:"ModuleOutcome | null",elements:[{name:"signature",type:"object",raw:"{ category: string; code: string; title: string; summary: string }",signature:{properties:[{key:"category",value:{name:"string",required:!0}},{key:"code",value:{name:"string",required:!0}},{key:"title",value:{name:"string",required:!0}},{key:"summary",value:{name:"string",required:!0}}]}},{name:"null"}],required:!1}},{key:"error",value:{name:"union",raw:"ModuleError | null",elements:[{name:"signature",type:"object",raw:"{ code: string; message: string; details?: unknown }",signature:{properties:[{key:"code",value:{name:"string",required:!0}},{key:"message",value:{name:"string",required:!0}},{key:"details",value:{name:"unknown",required:!1}}]}},{name:"null"}],required:!1}},{key:"uiEvents",value:{name:"Array",elements:[{name:"signature",type:"object",raw:"{ type: string; payload: unknown }",signature:{properties:[{key:"type",value:{name:"string",required:!0}},{key:"payload",value:{name:"unknown",required:!0}}]}}],raw:"ModuleEvent[]",required:!0}}]},required:!0}}]}},{name:"null"}],required:!1}}]}},{name:"null"}],required:!1}},{key:"revision",value:{name:"number",required:!0}},{key:"isRetryable",value:{name:"boolean",required:!0}},{key:"attemptCount",value:{name:"number",required:!0}},{key:"maxAttempts",value:{name:"number",required:!0}},{key:"nextAttemptAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"errorCode",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"userErrorMessage",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"createdAt",value:{name:"string",required:!0}},{key:"startedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"completedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"cancelRequestedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"dismissedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"capabilities",value:{name:"signature",type:"object",raw:"{ canRetry: boolean; canCancel: boolean; canDismiss: boolean }",signature:{properties:[{key:"canRetry",value:{name:"boolean",required:!0}},{key:"canCancel",value:{name:"boolean",required:!0}},{key:"canDismiss",value:{name:"boolean",required:!0}}]},required:!0}},{key:"developmentDiagnostics",value:{name:"union",raw:`{
  sessionId: string; triggerType: string; triggerId: string; revision: number; leaseOwner?: string | null;
  leaseTokenHint?: string | null; leaseExpiresAt?: string | null; attempts: SessionExecutionAttemptApiResponse[];
} | null`,elements:[{name:"signature",type:"object",raw:`{
  sessionId: string; triggerType: string; triggerId: string; revision: number; leaseOwner?: string | null;
  leaseTokenHint?: string | null; leaseExpiresAt?: string | null; attempts: SessionExecutionAttemptApiResponse[];
}`,signature:{properties:[{key:"sessionId",value:{name:"string",required:!0}},{key:"triggerType",value:{name:"string",required:!0}},{key:"triggerId",value:{name:"string",required:!0}},{key:"revision",value:{name:"number",required:!0}},{key:"leaseOwner",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"leaseTokenHint",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"leaseExpiresAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"attempts",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string; attemptNumber: number; status: string; workerId?: string | null; provider?: string | null; model?: string | null;
  providerRequestId?: string | null; startedAt: string; completedAt?: string | null; latencyMilliseconds?: number | null;
  inputTokens?: number | null; outputTokens?: number | null; finishReason?: string | null; errorCode?: string | null;
  errorCategory?: string | null; retryable: boolean; correlationId?: string | null; traceId?: string | null; spanId?: string | null;
  exceptionChain?: string | null; redactedResponseExcerpt?: string | null; sentPrompt?: string | null; receivedResult?: string | null;
  validationResult?: string | null; promptVersion?: string | null; contextHash?: string | null; contextSizeBytes?: number | null;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"attemptNumber",value:{name:"number",required:!0}},{key:"status",value:{name:"string",required:!0}},{key:"workerId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"provider",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"model",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"providerRequestId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"startedAt",value:{name:"string",required:!0}},{key:"completedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"latencyMilliseconds",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!1}},{key:"inputTokens",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!1}},{key:"outputTokens",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!1}},{key:"finishReason",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"errorCode",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"errorCategory",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"retryable",value:{name:"boolean",required:!0}},{key:"correlationId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"traceId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"spanId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"exceptionChain",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"redactedResponseExcerpt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"sentPrompt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"receivedResult",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"validationResult",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"promptVersion",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"contextHash",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"contextSizeBytes",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!1}}]}}],raw:"SessionExecutionAttemptApiResponse[]",required:!0}}]}},{name:"null"}],required:!1}}]}},description:""},onAction:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string, action: 'retry' | 'cancel' | 'dismiss') => void",signature:{arguments:[{type:{name:"string"},name:"id"},{type:{name:"union",raw:"'retry' | 'cancel' | 'dismiss'",elements:[{name:"literal",value:"'retry'"},{name:"literal",value:"'cancel'"},{name:"literal",value:"'dismiss'"}]},name:"action"}],return:{name:"void"}}},description:""},keepSucceededStatusVisible:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}}}};R.__docgenInfo={description:"",methods:[],displayName:"NoteProposalItem",props:{proposal:{required:!0,tsType:{name:"signature",type:"object",raw:`{
  artifactId: string; sourceTurnId: string; noteId?: string | null; expectedNoteRevision: number; proposedTitle: string;
  beforeBody: string; proposedBody: string; rationale: string; status: string; createdAt: string;
}`,signature:{properties:[{key:"artifactId",value:{name:"string",required:!0}},{key:"sourceTurnId",value:{name:"string",required:!0}},{key:"noteId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"expectedNoteRevision",value:{name:"number",required:!0}},{key:"proposedTitle",value:{name:"string",required:!0}},{key:"beforeBody",value:{name:"string",required:!0}},{key:"proposedBody",value:{name:"string",required:!0}},{key:"rationale",value:{name:"string",required:!0}},{key:"status",value:{name:"string",required:!0}},{key:"createdAt",value:{name:"string",required:!0}}]}},description:""},onReview:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string, action: 'apply' | 'edit-apply' | 'reject' | 'snooze', request: NoteReviewRequest) => void",signature:{arguments:[{type:{name:"string"},name:"id"},{type:{name:"union",raw:"'apply' | 'edit-apply' | 'reject' | 'snooze'",elements:[{name:"literal",value:"'apply'"},{name:"literal",value:"'edit-apply'"},{name:"literal",value:"'reject'"},{name:"literal",value:"'snooze'"}]},name:"action"},{type:{name:"signature",type:"object",raw:"{ expectedNoteRevision: number; title?: string; body?: string }",signature:{properties:[{key:"expectedNoteRevision",value:{name:"number",required:!0}},{key:"title",value:{name:"string",required:!1}},{key:"body",value:{name:"string",required:!1}}]}},name:"request"}],return:{name:"void"}}},description:""}}};N.__docgenInfo={description:"",methods:[],displayName:"ImageArtifactItem",props:{mediaUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:""},contentType:{required:!0,tsType:{name:"string"},description:""}}};H.__docgenInfo={description:"",methods:[],displayName:"SessionActivityFeed",props:{session:{required:!0,tsType:{name:"signature",type:"object",raw:`{
  id: string;
  scenarioId: string;
  status: string;
  headTurnId?: string | null;
  revision: number;
  interpretationEnabled: boolean;
  state?: { revision: number; flags: Record<string, boolean> };
  progression?: { currentNode: string; revision: number; transitionStatus?: string | null; moduleTurnId?: string | null; errorCode?: string | null } | null;
  turns: NarrativeTurnApiResponse[];
  pendingInputs: PendingPlayerInputApiResponse[];
  inputs?: SessionPlayerInputApiResponse[];
  executions?: SessionExecutionApiResponse[];
  artifacts?: SessionArtifactApiResponse[];
  activity?: SessionActivityApiResponse[];
  noteProposals?: SessionNoteProposalApiResponse[];
  createdAt: string;
  updatedAt: string;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"scenarioId",value:{name:"string",required:!0}},{key:"status",value:{name:"string",required:!0}},{key:"headTurnId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"revision",value:{name:"number",required:!0}},{key:"interpretationEnabled",value:{name:"boolean",required:!0}},{key:"state",value:{name:"signature",type:"object",raw:"{ revision: number; flags: Record<string, boolean> }",signature:{properties:[{key:"revision",value:{name:"number",required:!0}},{key:"flags",value:{name:"Record",elements:[{name:"string"},{name:"boolean"}],raw:"Record<string, boolean>",required:!0}}]},required:!1}},{key:"progression",value:{name:"union",raw:"{ currentNode: string; revision: number; transitionStatus?: string | null; moduleTurnId?: string | null; errorCode?: string | null } | null",elements:[{name:"signature",type:"object",raw:"{ currentNode: string; revision: number; transitionStatus?: string | null; moduleTurnId?: string | null; errorCode?: string | null }",signature:{properties:[{key:"currentNode",value:{name:"string",required:!0}},{key:"revision",value:{name:"number",required:!0}},{key:"transitionStatus",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"moduleTurnId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"errorCode",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}},{name:"null"}],required:!1}},{key:"turns",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string;
  position: number;
  previousTurnId?: string | null;
  kind: string;
  execution?: ModuleExecution | null;
  narrative?: {
    schemaVersion?: string | null;
    turnType?: string | null;
    heading?: string | null;
    body: string;
    playerInputId?: string | null;
    playerInput?: string | null;
    acceptedAfterTurnId?: string | null;
    signals?: string[] | null;
    interpretation?: string | null;
  } | null;
  narrativeHandoff?: {
    status: string;
    errorCode?: string | null;
    errorMessage?: string | null;
  } | null;
  createdAt: string;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"position",value:{name:"number",required:!0}},{key:"previousTurnId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"kind",value:{name:"string",required:!0}},{key:"execution",value:{name:"union",raw:"ModuleExecution | null",elements:[{name:"signature",type:"object",raw:`{
  id: string;
  package: { moduleId: string; version: string; digest: string; contractVersion: string };
  status: string;
  revision: number;
  viewState: unknown;
  availableActions: ModuleAvailableAction[];
  outcome?: ModuleOutcome | null;
  error?: ModuleError | null;
  uiEvents: ModuleEvent[];
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"package",value:{name:"signature",type:"object",raw:"{ moduleId: string; version: string; digest: string; contractVersion: string }",signature:{properties:[{key:"moduleId",value:{name:"string",required:!0}},{key:"version",value:{name:"string",required:!0}},{key:"digest",value:{name:"string",required:!0}},{key:"contractVersion",value:{name:"string",required:!0}}]},required:!0}},{key:"status",value:{name:"string",required:!0}},{key:"revision",value:{name:"number",required:!0}},{key:"viewState",value:{name:"unknown",required:!0}},{key:"availableActions",value:{name:"Array",elements:[{name:"signature",type:"object",raw:"{ id: string; label: string; enabled: boolean; disabledReason?: string | null }",signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"enabled",value:{name:"boolean",required:!0}},{key:"disabledReason",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}}],raw:"ModuleAvailableAction[]",required:!0}},{key:"outcome",value:{name:"union",raw:"ModuleOutcome | null",elements:[{name:"signature",type:"object",raw:"{ category: string; code: string; title: string; summary: string }",signature:{properties:[{key:"category",value:{name:"string",required:!0}},{key:"code",value:{name:"string",required:!0}},{key:"title",value:{name:"string",required:!0}},{key:"summary",value:{name:"string",required:!0}}]}},{name:"null"}],required:!1}},{key:"error",value:{name:"union",raw:"ModuleError | null",elements:[{name:"signature",type:"object",raw:"{ code: string; message: string; details?: unknown }",signature:{properties:[{key:"code",value:{name:"string",required:!0}},{key:"message",value:{name:"string",required:!0}},{key:"details",value:{name:"unknown",required:!1}}]}},{name:"null"}],required:!1}},{key:"uiEvents",value:{name:"Array",elements:[{name:"signature",type:"object",raw:"{ type: string; payload: unknown }",signature:{properties:[{key:"type",value:{name:"string",required:!0}},{key:"payload",value:{name:"unknown",required:!0}}]}}],raw:"ModuleEvent[]",required:!0}}]},required:!0},{name:"null"}],required:!1}},{key:"narrative",value:{name:"union",raw:`{
  schemaVersion?: string | null;
  turnType?: string | null;
  heading?: string | null;
  body: string;
  playerInputId?: string | null;
  playerInput?: string | null;
  acceptedAfterTurnId?: string | null;
  signals?: string[] | null;
  interpretation?: string | null;
} | null`,elements:[{name:"signature",type:"object",raw:`{
  schemaVersion?: string | null;
  turnType?: string | null;
  heading?: string | null;
  body: string;
  playerInputId?: string | null;
  playerInput?: string | null;
  acceptedAfterTurnId?: string | null;
  signals?: string[] | null;
  interpretation?: string | null;
}`,signature:{properties:[{key:"schemaVersion",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"turnType",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"heading",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"body",value:{name:"string",required:!0}},{key:"playerInputId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"playerInput",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"acceptedAfterTurnId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"signals",value:{name:"union",raw:"string[] | null",elements:[{name:"Array",elements:[{name:"string"}],raw:"string[]"},{name:"null"}],required:!1}},{key:"interpretation",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}},{name:"null"}],required:!1}},{key:"narrativeHandoff",value:{name:"union",raw:`{
  status: string;
  errorCode?: string | null;
  errorMessage?: string | null;
} | null`,elements:[{name:"signature",type:"object",raw:`{
  status: string;
  errorCode?: string | null;
  errorMessage?: string | null;
}`,signature:{properties:[{key:"status",value:{name:"string",required:!0}},{key:"errorCode",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"errorMessage",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}},{name:"null"}],required:!1}},{key:"createdAt",value:{name:"string",required:!0}}]}}],raw:"NarrativeTurnApiResponse[]",required:!0}},{key:"pendingInputs",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  playerInputId: string;
  requestId: string;
  input: string;
  interactionType: NarrativeInteractionType;
  acceptedAfterTurnId?: string | null;
  status: string;
  isRetryable: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  attemptCount: number;
  updatedAt: string;
}`,signature:{properties:[{key:"playerInputId",value:{name:"string",required:!0}},{key:"requestId",value:{name:"string",required:!0}},{key:"input",value:{name:"string",required:!0}},{key:"interactionType",value:{name:"union",raw:"'dialogue' | 'clarification'",elements:[{name:"literal",value:"'dialogue'"},{name:"literal",value:"'clarification'"}],required:!0}},{key:"acceptedAfterTurnId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"status",value:{name:"string",required:!0}},{key:"isRetryable",value:{name:"boolean",required:!0}},{key:"errorCode",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"errorMessage",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"attemptCount",value:{name:"number",required:!0}},{key:"updatedAt",value:{name:"string",required:!0}}]}}],raw:"PendingPlayerInputApiResponse[]",required:!0}},{key:"inputs",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string; requestId: string; text: string; interactionType: NarrativeInteractionType;
  acceptedAfterTurnId?: string | null; acceptedSessionRevision: number; supersedesInputId?: string | null; createdAt: string;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"requestId",value:{name:"string",required:!0}},{key:"text",value:{name:"string",required:!0}},{key:"interactionType",value:{name:"union",raw:"'dialogue' | 'clarification'",elements:[{name:"literal",value:"'dialogue'"},{name:"literal",value:"'clarification'"}],required:!0}},{key:"acceptedAfterTurnId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"acceptedSessionRevision",value:{name:"number",required:!0}},{key:"supersedesInputId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"createdAt",value:{name:"string",required:!0}}]}}],raw:"SessionPlayerInputApiResponse[]",required:!1}},{key:"executions",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string; sessionId: string; kind: 'scenario-turn' | 'note-proposal' | 'image' | string;
  triggerType: string; triggerId: string; status: SessionExecutionStatus; stage?: ScenarioTurnStage | null; scenarioTurn?: ScenarioTurnProjection | null; revision: number; isRetryable: boolean;
  attemptCount: number; maxAttempts: number; nextAttemptAt?: string | null; errorCode?: string | null; userErrorMessage?: string | null;
  createdAt: string; startedAt?: string | null; completedAt?: string | null; cancelRequestedAt?: string | null; dismissedAt?: string | null;
  capabilities: { canRetry: boolean; canCancel: boolean; canDismiss: boolean };
  developmentDiagnostics?: {
    sessionId: string; triggerType: string; triggerId: string; revision: number; leaseOwner?: string | null;
    leaseTokenHint?: string | null; leaseExpiresAt?: string | null; attempts: SessionExecutionAttemptApiResponse[];
  } | null;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"sessionId",value:{name:"string",required:!0}},{key:"kind",value:{name:"union",raw:"'scenario-turn' | 'note-proposal' | 'image' | string",elements:[{name:"literal",value:"'scenario-turn'"},{name:"literal",value:"'note-proposal'"},{name:"literal",value:"'image'"},{name:"string"}],required:!0}},{key:"triggerType",value:{name:"string",required:!0}},{key:"triggerId",value:{name:"string",required:!0}},{key:"status",value:{name:"union",raw:"'queued' | 'running' | 'retry-wait' | 'cancel-requested' | 'succeeded' | 'failed' | 'cancelled' | 'superseded'",elements:[{name:"literal",value:"'queued'"},{name:"literal",value:"'running'"},{name:"literal",value:"'retry-wait'"},{name:"literal",value:"'cancel-requested'"},{name:"literal",value:"'succeeded'"},{name:"literal",value:"'failed'"},{name:"literal",value:"'cancelled'"},{name:"literal",value:"'superseded'"}],required:!0}},{key:"stage",value:{name:"union",raw:"ScenarioTurnStage | null",elements:[{name:"union",raw:`| 'loading-world'
| 'enumerating-actions'
| 'selecting-action'
| 'applying-rules'
| 'running-extension'
| 'generating-narrative'
| 'completed'
| 'failed'
| 'cancelled'`,elements:[{name:"literal",value:"'loading-world'"},{name:"literal",value:"'enumerating-actions'"},{name:"literal",value:"'selecting-action'"},{name:"literal",value:"'applying-rules'"},{name:"literal",value:"'running-extension'"},{name:"literal",value:"'generating-narrative'"},{name:"literal",value:"'completed'"},{name:"literal",value:"'failed'"},{name:"literal",value:"'cancelled'"}],required:!0},{name:"null"}],required:!1}},{key:"scenarioTurn",value:{name:"union",raw:"ScenarioTurnProjection | null",elements:[{name:"signature",type:"object",raw:`{
  schemaVersion: 'scenario-turn.v1' | '1' | string;
  stage: ScenarioTurnStage;
  currentLocation?: { locationId: string; label: string } | null;
  objects?: ScenarioTurnPublicObject[];
  availableActions?: ScenarioTurnPublicAction[];
  selectedAction?: ScenarioTurnSelectedAction | null;
  postState?: ScenarioTurnPublicPostState | null;
  manualUi?: {
    objectId: string;
    actionId: string;
    actionLabel: string;
    visibility: 'manual-ui';
    execution: ModuleExecution;
  } | null;
}`,signature:{properties:[{key:"schemaVersion",value:{name:"union",raw:"'scenario-turn.v1' | '1' | string",elements:[{name:"literal",value:"'scenario-turn.v1'"},{name:"literal",value:"'1'"},{name:"string"}],required:!0}},{key:"stage",value:{name:"union",raw:`| 'loading-world'
| 'enumerating-actions'
| 'selecting-action'
| 'applying-rules'
| 'running-extension'
| 'generating-narrative'
| 'completed'
| 'failed'
| 'cancelled'`,elements:[{name:"literal",value:"'loading-world'"},{name:"literal",value:"'enumerating-actions'"},{name:"literal",value:"'selecting-action'"},{name:"literal",value:"'applying-rules'"},{name:"literal",value:"'running-extension'"},{name:"literal",value:"'generating-narrative'"},{name:"literal",value:"'completed'"},{name:"literal",value:"'failed'"},{name:"literal",value:"'cancelled'"}],required:!0}},{key:"currentLocation",value:{name:"union",raw:"{ locationId: string; label: string } | null",elements:[{name:"signature",type:"object",raw:"{ locationId: string; label: string }",signature:{properties:[{key:"locationId",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}}]}},{name:"null"}],required:!1}},{key:"objects",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  objectId: string;
  objectTypeId?: string | null;
  label: string;
  description?: string | null;
  locationId?: string | null;
  publicState?: Record<string, unknown> | null;
}`,signature:{properties:[{key:"objectId",value:{name:"string",required:!0}},{key:"objectTypeId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"label",value:{name:"string",required:!0}},{key:"description",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"locationId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"publicState",value:{name:"union",raw:"Record<string, unknown> | null",elements:[{name:"Record",elements:[{name:"string"},{name:"unknown"}],raw:"Record<string, unknown>"},{name:"null"}],required:!1}}]}}],raw:"ScenarioTurnPublicObject[]",required:!1}},{key:"availableActions",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  objectId: string;
  actionId: string;
  label: string;
  description?: string | null;
  visibility: 'ai-choice' | 'manual-ui';
  argumentSchema?: Record<string, unknown> | null;
}`,signature:{properties:[{key:"objectId",value:{name:"string",required:!0}},{key:"actionId",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"description",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"visibility",value:{name:"union",raw:"'ai-choice' | 'manual-ui'",elements:[{name:"literal",value:"'ai-choice'"},{name:"literal",value:"'manual-ui'"}],required:!0}},{key:"argumentSchema",value:{name:"union",raw:"Record<string, unknown> | null",elements:[{name:"Record",elements:[{name:"string"},{name:"unknown"}],raw:"Record<string, unknown>"},{name:"null"}],required:!1}}]}}],raw:"ScenarioTurnPublicAction[]",required:!1}},{key:"selectedAction",value:{name:"union",raw:"ScenarioTurnSelectedAction | null",elements:[{name:"signature",type:"object",raw:`{
  objectId: string;
  actionId: string;
  objectLabel?: string | null;
  actionLabel?: string | null;
  arguments?: Record<string, unknown> | null;
  visibility: 'ai-choice' | 'manual-ui';
}`,signature:{properties:[{key:"objectId",value:{name:"string",required:!0}},{key:"actionId",value:{name:"string",required:!0}},{key:"objectLabel",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"actionLabel",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"arguments",value:{name:"union",raw:"Record<string, unknown> | null",elements:[{name:"Record",elements:[{name:"string"},{name:"unknown"}],raw:"Record<string, unknown>"},{name:"null"}],required:!1}},{key:"visibility",value:{name:"union",raw:"'ai-choice' | 'manual-ui'",elements:[{name:"literal",value:"'ai-choice'"},{name:"literal",value:"'manual-ui'"}],required:!0}}]}},{name:"null"}],required:!1}},{key:"postState",value:{name:"union",raw:"ScenarioTurnPublicPostState | null",elements:[{name:"signature",type:"object",raw:`{
  revision: number;
  currentLocation?: { locationId: string; label: string } | null;
  objects: ScenarioTurnPublicObject[];
  facts?: string[];
  events?: string[];
  hints?: string[];
}`,signature:{properties:[{key:"revision",value:{name:"number",required:!0}},{key:"currentLocation",value:{name:"union",raw:"{ locationId: string; label: string } | null",elements:[{name:"signature",type:"object",raw:"{ locationId: string; label: string }",signature:{properties:[{key:"locationId",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}}]}},{name:"null"}],required:!1}},{key:"objects",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  objectId: string;
  objectTypeId?: string | null;
  label: string;
  description?: string | null;
  locationId?: string | null;
  publicState?: Record<string, unknown> | null;
}`,signature:{properties:[{key:"objectId",value:{name:"string",required:!0}},{key:"objectTypeId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"label",value:{name:"string",required:!0}},{key:"description",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"locationId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"publicState",value:{name:"union",raw:"Record<string, unknown> | null",elements:[{name:"Record",elements:[{name:"string"},{name:"unknown"}],raw:"Record<string, unknown>"},{name:"null"}],required:!1}}]}}],raw:"ScenarioTurnPublicObject[]",required:!0}},{key:"facts",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!1}},{key:"events",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!1}},{key:"hints",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!1}}]}},{name:"null"}],required:!1}},{key:"manualUi",value:{name:"union",raw:`{
  objectId: string;
  actionId: string;
  actionLabel: string;
  visibility: 'manual-ui';
  execution: ModuleExecution;
} | null`,elements:[{name:"signature",type:"object",raw:`{
  objectId: string;
  actionId: string;
  actionLabel: string;
  visibility: 'manual-ui';
  execution: ModuleExecution;
}`,signature:{properties:[{key:"objectId",value:{name:"string",required:!0}},{key:"actionId",value:{name:"string",required:!0}},{key:"actionLabel",value:{name:"string",required:!0}},{key:"visibility",value:{name:"literal",value:"'manual-ui'",required:!0}},{key:"execution",value:{name:"signature",type:"object",raw:`{
  id: string;
  package: { moduleId: string; version: string; digest: string; contractVersion: string };
  status: string;
  revision: number;
  viewState: unknown;
  availableActions: ModuleAvailableAction[];
  outcome?: ModuleOutcome | null;
  error?: ModuleError | null;
  uiEvents: ModuleEvent[];
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"package",value:{name:"signature",type:"object",raw:"{ moduleId: string; version: string; digest: string; contractVersion: string }",signature:{properties:[{key:"moduleId",value:{name:"string",required:!0}},{key:"version",value:{name:"string",required:!0}},{key:"digest",value:{name:"string",required:!0}},{key:"contractVersion",value:{name:"string",required:!0}}]},required:!0}},{key:"status",value:{name:"string",required:!0}},{key:"revision",value:{name:"number",required:!0}},{key:"viewState",value:{name:"unknown",required:!0}},{key:"availableActions",value:{name:"Array",elements:[{name:"signature",type:"object",raw:"{ id: string; label: string; enabled: boolean; disabledReason?: string | null }",signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"enabled",value:{name:"boolean",required:!0}},{key:"disabledReason",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}}],raw:"ModuleAvailableAction[]",required:!0}},{key:"outcome",value:{name:"union",raw:"ModuleOutcome | null",elements:[{name:"signature",type:"object",raw:"{ category: string; code: string; title: string; summary: string }",signature:{properties:[{key:"category",value:{name:"string",required:!0}},{key:"code",value:{name:"string",required:!0}},{key:"title",value:{name:"string",required:!0}},{key:"summary",value:{name:"string",required:!0}}]}},{name:"null"}],required:!1}},{key:"error",value:{name:"union",raw:"ModuleError | null",elements:[{name:"signature",type:"object",raw:"{ code: string; message: string; details?: unknown }",signature:{properties:[{key:"code",value:{name:"string",required:!0}},{key:"message",value:{name:"string",required:!0}},{key:"details",value:{name:"unknown",required:!1}}]}},{name:"null"}],required:!1}},{key:"uiEvents",value:{name:"Array",elements:[{name:"signature",type:"object",raw:"{ type: string; payload: unknown }",signature:{properties:[{key:"type",value:{name:"string",required:!0}},{key:"payload",value:{name:"unknown",required:!0}}]}}],raw:"ModuleEvent[]",required:!0}}]},required:!0}}]}},{name:"null"}],required:!1}}]}},{name:"null"}],required:!1}},{key:"revision",value:{name:"number",required:!0}},{key:"isRetryable",value:{name:"boolean",required:!0}},{key:"attemptCount",value:{name:"number",required:!0}},{key:"maxAttempts",value:{name:"number",required:!0}},{key:"nextAttemptAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"errorCode",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"userErrorMessage",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"createdAt",value:{name:"string",required:!0}},{key:"startedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"completedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"cancelRequestedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"dismissedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"capabilities",value:{name:"signature",type:"object",raw:"{ canRetry: boolean; canCancel: boolean; canDismiss: boolean }",signature:{properties:[{key:"canRetry",value:{name:"boolean",required:!0}},{key:"canCancel",value:{name:"boolean",required:!0}},{key:"canDismiss",value:{name:"boolean",required:!0}}]},required:!0}},{key:"developmentDiagnostics",value:{name:"union",raw:`{
  sessionId: string; triggerType: string; triggerId: string; revision: number; leaseOwner?: string | null;
  leaseTokenHint?: string | null; leaseExpiresAt?: string | null; attempts: SessionExecutionAttemptApiResponse[];
} | null`,elements:[{name:"signature",type:"object",raw:`{
  sessionId: string; triggerType: string; triggerId: string; revision: number; leaseOwner?: string | null;
  leaseTokenHint?: string | null; leaseExpiresAt?: string | null; attempts: SessionExecutionAttemptApiResponse[];
}`,signature:{properties:[{key:"sessionId",value:{name:"string",required:!0}},{key:"triggerType",value:{name:"string",required:!0}},{key:"triggerId",value:{name:"string",required:!0}},{key:"revision",value:{name:"number",required:!0}},{key:"leaseOwner",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"leaseTokenHint",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"leaseExpiresAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"attempts",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string; attemptNumber: number; status: string; workerId?: string | null; provider?: string | null; model?: string | null;
  providerRequestId?: string | null; startedAt: string; completedAt?: string | null; latencyMilliseconds?: number | null;
  inputTokens?: number | null; outputTokens?: number | null; finishReason?: string | null; errorCode?: string | null;
  errorCategory?: string | null; retryable: boolean; correlationId?: string | null; traceId?: string | null; spanId?: string | null;
  exceptionChain?: string | null; redactedResponseExcerpt?: string | null; sentPrompt?: string | null; receivedResult?: string | null;
  validationResult?: string | null; promptVersion?: string | null; contextHash?: string | null; contextSizeBytes?: number | null;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"attemptNumber",value:{name:"number",required:!0}},{key:"status",value:{name:"string",required:!0}},{key:"workerId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"provider",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"model",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"providerRequestId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"startedAt",value:{name:"string",required:!0}},{key:"completedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"latencyMilliseconds",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!1}},{key:"inputTokens",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!1}},{key:"outputTokens",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!1}},{key:"finishReason",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"errorCode",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"errorCategory",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"retryable",value:{name:"boolean",required:!0}},{key:"correlationId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"traceId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"spanId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"exceptionChain",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"redactedResponseExcerpt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"sentPrompt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"receivedResult",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"validationResult",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"promptVersion",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"contextHash",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"contextSizeBytes",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!1}}]}}],raw:"SessionExecutionAttemptApiResponse[]",required:!0}}]}},{name:"null"}],required:!1}}]}}],raw:"SessionExecutionApiResponse[]",required:!1}},{key:"artifacts",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string; executionId: string; kind: 'narrative-text' | 'note-patch' | 'image' | 'summary' | string;
  status: string; contentType: string; mediaUrl?: string | null; metadataJson?: string | null; createdAt: string; committedAt?: string | null;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"executionId",value:{name:"string",required:!0}},{key:"kind",value:{name:"union",raw:"'narrative-text' | 'note-patch' | 'image' | 'summary' | string",elements:[{name:"literal",value:"'narrative-text'"},{name:"literal",value:"'note-patch'"},{name:"literal",value:"'image'"},{name:"literal",value:"'summary'"},{name:"string"}],required:!0}},{key:"status",value:{name:"string",required:!0}},{key:"contentType",value:{name:"string",required:!0}},{key:"mediaUrl",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"metadataJson",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"createdAt",value:{name:"string",required:!0}},{key:"committedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}}],raw:"SessionArtifactApiResponse[]",required:!1}},{key:"activity",value:{name:"Array",elements:[{name:"signature",type:"object",raw:"{ type: 'input' | 'execution' | 'artifact' | 'turn'; id: string; order: number; causalId?: string | null }",signature:{properties:[{key:"type",value:{name:"union",raw:"'input' | 'execution' | 'artifact' | 'turn'",elements:[{name:"literal",value:"'input'"},{name:"literal",value:"'execution'"},{name:"literal",value:"'artifact'"},{name:"literal",value:"'turn'"}],required:!0}},{key:"id",value:{name:"string",required:!0}},{key:"order",value:{name:"number",required:!0}},{key:"causalId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}}],raw:"SessionActivityApiResponse[]",required:!1}},{key:"noteProposals",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  artifactId: string; sourceTurnId: string; noteId?: string | null; expectedNoteRevision: number; proposedTitle: string;
  beforeBody: string; proposedBody: string; rationale: string; status: string; createdAt: string;
}`,signature:{properties:[{key:"artifactId",value:{name:"string",required:!0}},{key:"sourceTurnId",value:{name:"string",required:!0}},{key:"noteId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"expectedNoteRevision",value:{name:"number",required:!0}},{key:"proposedTitle",value:{name:"string",required:!0}},{key:"beforeBody",value:{name:"string",required:!0}},{key:"proposedBody",value:{name:"string",required:!0}},{key:"rationale",value:{name:"string",required:!0}},{key:"status",value:{name:"string",required:!0}},{key:"createdAt",value:{name:"string",required:!0}}]}}],raw:"SessionNoteProposalApiResponse[]",required:!1}},{key:"createdAt",value:{name:"string",required:!0}},{key:"updatedAt",value:{name:"string",required:!0}}]}},description:""},onExecutionAction:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string, action: 'retry' | 'cancel' | 'dismiss') => void",signature:{arguments:[{type:{name:"string"},name:"id"},{type:{name:"union",raw:"'retry' | 'cancel' | 'dismiss'",elements:[{name:"literal",value:"'retry'"},{name:"literal",value:"'cancel'"},{name:"literal",value:"'dismiss'"}]},name:"action"}],return:{name:"void"}}},description:""},onNoteReview:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string, action: 'apply' | 'edit-apply' | 'reject' | 'snooze', request: NoteReviewRequest) => void",signature:{arguments:[{type:{name:"string"},name:"id"},{type:{name:"union",raw:"'apply' | 'edit-apply' | 'reject' | 'snooze'",elements:[{name:"literal",value:"'apply'"},{name:"literal",value:"'edit-apply'"},{name:"literal",value:"'reject'"},{name:"literal",value:"'snooze'"}]},name:"action"},{type:{name:"signature",type:"object",raw:"{ expectedNoteRevision: number; title?: string; body?: string }",signature:{properties:[{key:"expectedNoteRevision",value:{name:"number",required:!0}},{key:"title",value:{name:"string",required:!1}},{key:"body",value:{name:"string",required:!1}}]}},name:"request"}],return:{name:"void"}}},description:""},keepSucceededStatusVisible:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}}}};export{H as S};
