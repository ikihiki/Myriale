import{j as e}from"./jsx-runtime-BO8uF4Og.js";import{P as L,c as q,a as v,L as o,N as g,d as b,B as f}from"./Surfaces-hfywbPiG.js";import{A}from"./AppChrome-BVHByNfO.js";const N=new Intl.DateTimeFormat("ja-JP",{dateStyle:"medium",timeStyle:"long"});function d(n){if(!n)return"—";const a=new Date(n);return Number.isNaN(a.getTime())?n:N.format(a)}function p(n){return n==null?"計測なし":n<1e3?`${n} ms`:`${(n/1e3).toFixed(2)} 秒`}function T(n,a){return n==null&&a==null?"記録なし":`入力 ${n??"—"} / 出力 ${a??"—"}`}function w(n){return n.filter(a=>a.startedAt||a.completedAt||a.durationMilliseconds!=null).map(a=>({...a,label:a.label||a.stage,startedLabel:d(a.startedAt),completedLabel:d(a.completedAt),durationLabel:p(a.durationMilliseconds)}))}function I(n){return w([{stage:"enumeration",label:"利用可能な行動を列挙",startedAt:n.createdAt,completedAt:n.enumeratedAt,durationMilliseconds:n.enumerationElapsedMilliseconds},{stage:"selection",label:"入力から行動を選択",startedAt:n.enumeratedAt,completedAt:n.selectedAt,durationMilliseconds:n.selectionElapsedMilliseconds},{stage:"application",label:"ルールと効果を適用",startedAt:n.selectedAt,completedAt:n.appliedAt,durationMilliseconds:n.applicationElapsedMilliseconds},{stage:"narrative",label:"確定状態からNarrativeを公開",startedAt:n.appliedAt,completedAt:n.narrativePublishedAt,durationMilliseconds:n.narrativeElapsedMilliseconds}])}function S(n){var c;const a=n.execution.startedAt??n.execution.queuedAt,r=n.ruleEngine,u=(r==null?void 0:r.timing.narrativePublishedAt)??(r==null?void 0:r.timing.appliedAt)??(r==null?void 0:r.timing.selectedAt)??(r==null?void 0:r.timing.enumeratedAt)??null;return{sessionId:n.session.id,scenarioId:n.scenario.id,scenarioTitle:n.scenario.title,turn:{...n.turn,createdLabel:d(n.turn.createdAt)},playerInput:{...n.playerInput,createdAt:n.playerInput.acceptedAt},execution:{...n.execution,startedLabel:d(a),completedLabel:d(n.execution.completedAt),elapsedLabel:p(n.execution.elapsedMilliseconds),timeline:w([{stage:n.execution.stage??n.execution.status,label:"Turn execution",startedAt:a,completedAt:n.execution.completedAt,durationMilliseconds:n.execution.elapsedMilliseconds}])},interactions:[...n.aiInteractions].sort((s,m)=>Date.parse(s.startedAt)-Date.parse(m.startedAt)||s.attemptNumber-m.attemptNumber||s.sequence-m.sequence).map(s=>({...s,providerLabel:s.provider||"不明",modelLabel:s.model||"不明",startedLabel:d(s.startedAt),completedLabel:d(s.completedAt),latencyLabel:p(s.elapsedMilliseconds??s.latencyMilliseconds),tokenLabel:T(s.inputTokens,s.outputTokens),sentPromptLabel:s.sentPrompt||"送信プロンプトは記録されていません。",receivedResultLabel:s.receivedResult||"受信結果は記録されていません。"})),ruleEngine:r?{startedAt:r.timing.createdAt,completedAt:u,durationMilliseconds:r.timing.totalElapsedMilliseconds??null,timeline:I(r.timing),input:{playerInput:n.playerInput,actionSnapshot:r.actionSnapshot},selectedAction:{selectedRuleId:r.selectedRuleId,action:r.selectedAction},arguments:((c=r.selectedAction)==null?void 0:c.arguments)??null,preState:{sessionRevision:r.preSessionRevision,actionSnapshot:r.actionSnapshot},postState:r.postState,appliedEffects:r.appliedEffects,facts:r.facts,events:r.events,hints:r.hints,derivedChanges:r.changes,startedLabel:d(r.timing.createdAt),completedLabel:d(u),durationLabel:p(r.timing.totalElapsedMilliseconds)}:null,rawJson:JSON.stringify(n,null,2)}}function E(n){return n==null?"記録なし":typeof n=="string"?n:JSON.stringify(n,null,2)}const k="m-0 max-h-[28rem] max-w-full overflow-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-xl border border-[#303847] bg-[#171b24] p-4 font-mono text-xs leading-6 text-[#f7f4ec]";function l({label:n,value:a,mono:r=!1}){return e.jsxs("div",{className:"grid min-w-0 gap-1 border-l border-[#c8c1b5] pl-3",children:[e.jsx("dt",{className:"text-[11px] font-black tracking-[.08em] text-[#55515d] uppercase",children:n}),e.jsx("dd",{className:`m-0 min-w-0 break-words [overflow-wrap:anywhere] text-sm font-bold text-[#211d29] ${r?"font-mono text-xs":""}`,children:a})]})}function i({title:n,value:a,open:r=!1}){return e.jsxs("details",{className:"min-w-0 rounded-xl border border-[#c8c1b5] bg-[#fffdf7]",open:r,children:[e.jsx("summary",{className:"cursor-pointer px-4 py-3 font-extrabold text-[#211d29] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b43c7]",children:n}),e.jsx("pre",{className:`${k} rounded-t-none border-x-0 border-b-0`,children:E(a)})]})}function y({title:n,entries:a}){return a.length?e.jsxs("section",{className:"grid min-w-0 gap-3","aria-label":n,children:[e.jsx(o,{as:"h3",textRole:"sectionEditorial",className:"m-0 !text-xl",children:n}),e.jsx("ol",{className:"m-0 grid min-w-0 gap-2 p-0",children:a.map((r,u)=>e.jsxs("li",{className:"grid min-w-0 gap-2 rounded-xl border border-[#cec7bb] bg-[#fffdf7] p-3 sm:grid-cols-[minmax(0,1fr)_auto]",children:[e.jsxs("div",{className:"min-w-0",children:[e.jsx("strong",{className:"block break-words text-[#211d29]",children:r.label}),e.jsxs("span",{className:"block break-words text-xs text-[#55515d]",children:[r.startedLabel," → ",r.completedLabel]})]}),e.jsx("strong",{className:"text-[#4d36b8] tabular-nums",children:r.durationLabel})]},`${r.stage}-${u}`))})]}):null}function J({interaction:n,index:a}){return e.jsxs("article",{className:"grid min-w-0 gap-4 rounded-2xl border border-[#c8c1b5] bg-[#fffdf7] p-5 shadow-sm","aria-labelledby":`interaction-${n.id}`,children:[e.jsxs("header",{className:"flex min-w-0 flex-wrap items-start justify-between gap-3",children:[e.jsxs("div",{className:"min-w-0",children:[e.jsxs("p",{className:"m-0 font-mono text-[11px] font-bold tracking-widest text-[#4d36b8] uppercase",children:["AI exchange ",a+1," · sequence ",n.sequence]}),e.jsx(o,{as:"h3",textRole:"sectionEditorial",id:`interaction-${n.id}`,className:"m-0 break-words !text-2xl",children:n.stage}),e.jsxs("p",{className:"m-0 break-words text-sm text-[#55515d]",children:["Profile ",e.jsx("code",{children:n.aiProfileId})," · attempt ",n.attemptNumber]})]}),e.jsx(f,{tone:n.status==="succeeded"?"success":n.status==="failed"?"danger":"info",children:n.status})]}),e.jsxs("dl",{className:"grid min-w-0 grid-cols-[repeat(auto-fit,minmax(145px,1fr))] gap-4",children:[e.jsx(l,{label:"Provider",value:n.providerLabel}),e.jsx(l,{label:"Model",value:n.modelLabel}),e.jsx(l,{label:"Elapsed",value:n.latencyLabel}),e.jsx(l,{label:"Tokens",value:n.tokenLabel}),e.jsx(l,{label:"AI started (exact)",value:n.startedAt,mono:!0}),e.jsx(l,{label:"AI completed (exact)",value:n.completedAt??"—",mono:!0})]}),e.jsxs("div",{className:"grid min-w-0 gap-3",children:[e.jsx(i,{title:"送信したプロンプト",value:n.sentPromptLabel,open:!0}),e.jsx(i,{title:"AIから受信した結果",value:n.receivedResultLabel,open:!0}),n.validationResult&&e.jsx(i,{title:"検証結果",value:n.validationResult})]})]})}function V({account:n,sessionId:a,turnId:r,state:u,onBack:c,onRetry:s,onLogout:m}){const t=u.status==="ready"?u.inspection:null,j=[{label:"Myriale",to:"home"},{label:"セッション",to:"sessionList"},{label:(t==null?void 0:t.scenarioTitle)??a},{label:`Turn ${(t==null?void 0:t.turn.position)??r}`},{label:"実行詳細"}];return e.jsx(A,{section:"sessions",breadcrumbs:j,account:n,onLogout:m,children:e.jsx(L,{children:e.jsxs(q,{width:"chrome",className:"min-w-0 gap-7 text-[#211d29]","aria-label":"Turn実行詳細",children:[e.jsxs("header",{className:"grid min-w-0 gap-5 border-b border-[#c8c1b5] pb-6",children:[e.jsx(v,{variant:"secondary",className:"w-fit",onClick:c,children:"← セッションに戻る"}),e.jsxs("div",{className:"flex min-w-0 flex-wrap items-end justify-between gap-5",children:[e.jsxs("div",{className:"min-w-0",children:[e.jsx("p",{className:"kicker m-0 text-[#4d36b8]",children:"Turn-scoped execution inspection"}),e.jsx(o,{as:"h1",textRole:"sectionEditorial",className:"m-0 break-words",children:"Turn 実行詳細"}),e.jsx("p",{className:"m-0 max-w-3xl break-words leading-7 text-[#55515d]",children:"Player InputからAI処理、ルール適用、状態変化まで、このTurnだけの実行経路を確認します。閲覧権限はサーバーが判定します。"})]}),(t==null?void 0:t.execution)&&e.jsxs("div",{className:"grid min-w-44 rounded-xl border border-[#7059d8] bg-[#eee9ff] px-5 py-4 text-right",children:[e.jsx("span",{className:"text-xs font-black tracking-widest text-[#4d36b8] uppercase",children:"Elapsed time"}),e.jsx("strong",{className:"font-myr-display text-4xl text-[#38249c] tabular-nums",children:t.execution.elapsedLabel})]})]})]}),u.status==="loading"&&e.jsx(g,{tone:"info",children:"Turnの実行詳細を読み込んでいます。"}),u.status==="error"&&e.jsxs("div",{className:"grid gap-3",children:[e.jsx(g,{tone:"danger",role:"alert",children:u.message}),e.jsx(v,{variant:"secondary",className:"w-fit",onClick:s,children:"もう一度読み込む"})]}),t&&e.jsxs(e.Fragment,{children:[e.jsxs(b,{as:"section",className:"grid min-w-0 gap-4","aria-label":"Turn概要",children:[e.jsxs("div",{className:"flex min-w-0 flex-wrap items-baseline justify-between gap-3",children:[e.jsxs("div",{className:"min-w-0",children:[e.jsx("p",{className:"kicker m-0 text-[#4d36b8]",children:t.scenarioTitle}),e.jsxs(o,{as:"h2",textRole:"sectionEditorial",className:"m-0 break-words !text-3xl",children:["Turn ",t.turn.position]})]}),e.jsx(f,{tone:"neutral",children:t.turn.kind})]}),e.jsxs("dl",{className:"grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3",children:[e.jsx(l,{label:"Turn ID",value:t.turn.id,mono:!0}),e.jsx(l,{label:"Session ID",value:t.sessionId,mono:!0}),e.jsx(l,{label:"Created",value:t.turn.createdLabel})]}),t.playerInput&&e.jsxs("div",{className:"min-w-0 rounded-xl border border-[#d0c6e7] bg-[#f3effd] p-4",children:[e.jsx("strong",{className:"text-[#38249c]",children:"Player Input"}),e.jsx("p",{className:"m-0 mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[#211d29]",children:t.playerInput.text})]})]}),t.execution&&e.jsxs(b,{as:"section",className:"grid min-w-0 gap-5","aria-label":"Execution timing",children:[e.jsxs("div",{children:[e.jsx("p",{className:"kicker m-0 text-[#4d36b8]",children:"Execution"}),e.jsx(o,{as:"h2",textRole:"sectionEditorial",className:"m-0 !text-3xl",children:"実行タイミング"})]}),e.jsxs("dl",{className:"grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3",children:[e.jsx(l,{label:"Execution ID",value:t.execution.id,mono:!0}),e.jsx(l,{label:"Status / stage",value:`${t.execution.status} / ${t.execution.stage??"—"}`}),e.jsx(l,{label:"Elapsed",value:t.execution.elapsedLabel}),e.jsx(l,{label:"Started",value:t.execution.startedLabel}),e.jsx(l,{label:"Completed",value:t.execution.completedLabel})]}),e.jsx(y,{title:"Execution timeline",entries:t.execution.timeline})]}),e.jsxs(b,{as:"section",className:"grid min-w-0 gap-5","aria-label":"Rule engine details",children:[e.jsxs("div",{children:[e.jsx("p",{className:"kicker m-0 text-[#4d36b8]",children:"Rule engine"}),e.jsx(o,{as:"h2",textRole:"sectionEditorial",className:"m-0 !text-3xl",children:"入力から確定状態まで"}),e.jsx("p",{className:"m-0 max-w-3xl text-[#55515d]",children:"ルールエンジンへ渡した入力、選択されたルール／アクションと引数、適用前後の状態、効果と派生情報を順に示します。"})]}),t.ruleEngine?e.jsxs(e.Fragment,{children:[e.jsxs("dl",{className:"grid min-w-0 gap-4 sm:grid-cols-3",children:[e.jsx(l,{label:"Started",value:t.ruleEngine.startedLabel}),e.jsx(l,{label:"Completed",value:t.ruleEngine.completedLabel}),e.jsx(l,{label:"Duration",value:t.ruleEngine.durationLabel})]}),e.jsx(y,{title:"Rule-engine timeline",entries:t.ruleEngine.timeline}),e.jsxs("div",{className:"grid min-w-0 gap-3 lg:grid-cols-2",children:[e.jsx(i,{title:"Rule input",value:t.ruleEngine.input,open:!0}),e.jsx(i,{title:"Selected rule / action",value:t.ruleEngine.selectedAction,open:!0}),e.jsx(i,{title:"Arguments",value:t.ruleEngine.arguments}),e.jsx(i,{title:"Before state",value:t.ruleEngine.preState}),e.jsx(i,{title:"After state",value:t.ruleEngine.postState}),e.jsx(i,{title:"Applied effects",value:t.ruleEngine.appliedEffects}),e.jsx(i,{title:"Derived changes",value:t.ruleEngine.derivedChanges}),e.jsx(i,{title:"Facts",value:t.ruleEngine.facts}),e.jsx(i,{title:"Events",value:t.ruleEngine.events}),e.jsx(i,{title:"Hints",value:t.ruleEngine.hints})]})]}):e.jsx(g,{tone:"info",children:"このTurnにはルールエンジンの記録がありません。"})]}),e.jsxs("section",{className:"grid min-w-0 gap-4","aria-label":"AI interactions",children:[e.jsxs("div",{children:[e.jsx("p",{className:"kicker m-0 text-[#4d36b8]",children:"AI interactions"}),e.jsx(o,{as:"h2",textRole:"sectionEditorial",className:"m-0 !text-3xl",children:"AI送受信"})]}),t.interactions.length?t.interactions.map((x,h)=>e.jsx(J,{interaction:x,index:h},x.id)):e.jsx(g,{tone:"info",children:"このTurnにはAI対話の記録がありません。"})]}),e.jsxs("details",{className:"min-w-0 rounded-xl border border-[#c8c1b5] bg-[#fffdf7]",children:[e.jsx("summary",{className:"cursor-pointer px-4 py-3 font-extrabold text-[#211d29]",children:"Raw inspection JSON"}),e.jsx("pre",{className:`${k} rounded-t-none border-x-0 border-b-0`,children:t.rawJson})]})]})]})})})}V.__docgenInfo={description:"",methods:[],displayName:"TurnInspectionPresentation",props:{account:{required:!0,tsType:{name:"union",raw:"AppChromeAccount | null",elements:[{name:"NonNullable",elements:[{name:"union",raw:"AppChromeProps['account']"}],raw:"NonNullable<AppChromeProps['account']>"},{name:"null"}]},description:""},sessionId:{required:!0,tsType:{name:"string"},description:""},turnId:{required:!0,tsType:{name:"string"},description:""},state:{required:!0,tsType:{name:"union",raw:`| { status: 'loading' }
| { status: 'error'; message: string }
| { status: 'ready'; inspection: TurnInspection }`,elements:[{name:"signature",type:"object",raw:"{ status: 'loading' }",signature:{properties:[{key:"status",value:{name:"literal",value:"'loading'",required:!0}}]}},{name:"signature",type:"object",raw:"{ status: 'error'; message: string }",signature:{properties:[{key:"status",value:{name:"literal",value:"'error'",required:!0}},{key:"message",value:{name:"string",required:!0}}]}},{name:"signature",type:"object",raw:"{ status: 'ready'; inspection: TurnInspection }",signature:{properties:[{key:"status",value:{name:"literal",value:"'ready'",required:!0}},{key:"inspection",value:{name:"signature",type:"object",raw:`{
  sessionId: string;
  scenarioId: string;
  scenarioTitle: string;
  turn: TurnInspectionDto['turn'] & { createdLabel: string };
  playerInput: { id: string; text: string; interactionType: string; createdAt: string };
  execution: TurnInspectionDto['execution'] & {
    startedLabel: string;
    completedLabel: string;
    elapsedLabel: string;
    timeline: TimelineEntry[];
  };
  interactions: AiInteraction[];
  ruleEngine: {
    startedAt: string;
    completedAt: string | null;
    durationMilliseconds: number | null;
    timeline: TimelineEntry[];
    input: JsonValue;
    selectedAction: JsonValue;
    arguments: JsonValue;
    preState: JsonValue;
    postState: JsonValue;
    appliedEffects: JsonValue[];
    facts: JsonValue[];
    events: JsonValue[];
    hints: JsonValue[];
    derivedChanges: JsonValue[];
    startedLabel: string;
    completedLabel: string;
    durationLabel: string;
  } | null;
  rawJson: string;
}`,signature:{properties:[{key:"sessionId",value:{name:"string",required:!0}},{key:"scenarioId",value:{name:"string",required:!0}},{key:"scenarioTitle",value:{name:"string",required:!0}},{key:"turn",value:{name:"intersection",raw:"TurnInspectionDto['turn'] & { createdLabel: string }",elements:[{name:"signature",raw:"TurnInspectionDto['turn']"},{name:"signature",type:"object",raw:"{ createdLabel: string }",signature:{properties:[{key:"createdLabel",value:{name:"string",required:!0}}]}}],required:!0}},{key:"playerInput",value:{name:"signature",type:"object",raw:"{ id: string; text: string; interactionType: string; createdAt: string }",signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"text",value:{name:"string",required:!0}},{key:"interactionType",value:{name:"string",required:!0}},{key:"createdAt",value:{name:"string",required:!0}}]},required:!0}},{key:"execution",value:{name:"intersection",raw:`TurnInspectionDto['execution'] & {
  startedLabel: string;
  completedLabel: string;
  elapsedLabel: string;
  timeline: TimelineEntry[];
}`,elements:[{name:"signature",raw:"TurnInspectionDto['execution']"},{name:"signature",type:"object",raw:`{
  startedLabel: string;
  completedLabel: string;
  elapsedLabel: string;
  timeline: TimelineEntry[];
}`,signature:{properties:[{key:"startedLabel",value:{name:"string",required:!0}},{key:"completedLabel",value:{name:"string",required:!0}},{key:"elapsedLabel",value:{name:"string",required:!0}},{key:"timeline",value:{name:"Array",elements:[{name:"intersection",raw:`TimelineEntryDto & {
  label: string;
  startedLabel: string;
  completedLabel: string;
  durationLabel: string;
}`,elements:[{name:"signature",type:"object",raw:`{
  label?: string | null;
  stage: string;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMilliseconds?: number | null;
}`,signature:{properties:[{key:"label",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"stage",value:{name:"string",required:!0}},{key:"startedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"completedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"durationMilliseconds",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!1}}]}},{name:"signature",type:"object",raw:`{
  label: string;
  startedLabel: string;
  completedLabel: string;
  durationLabel: string;
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"startedLabel",value:{name:"string",required:!0}},{key:"completedLabel",value:{name:"string",required:!0}},{key:"durationLabel",value:{name:"string",required:!0}}]}}]}],raw:"TimelineEntry[]",required:!0}}]}}],required:!0}},{key:"interactions",value:{name:"Array",elements:[{name:"intersection",raw:`AiInteractionDto & {
  providerLabel: string;
  modelLabel: string;
  startedLabel: string;
  completedLabel: string;
  latencyLabel: string;
  tokenLabel: string;
  sentPromptLabel: string;
  receivedResultLabel: string;
}`,elements:[{name:"signature",type:"object",raw:`{
  id: string;
  attemptNumber: number;
  sequence: number;
  stage: string;
  aiProfileId: string;
  provider?: string | null;
  model?: string | null;
  providerRequestId?: string | null;
  startedAt: string;
  completedAt: string;
  elapsedMilliseconds: number;
  latencyMilliseconds?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  finishReason?: string | null;
  status: string;
  errorCode?: string | null;
  sentPrompt?: string | null;
  receivedResult?: string | null;
  validationResult?: string | null;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"attemptNumber",value:{name:"number",required:!0}},{key:"sequence",value:{name:"number",required:!0}},{key:"stage",value:{name:"string",required:!0}},{key:"aiProfileId",value:{name:"string",required:!0}},{key:"provider",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"model",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"providerRequestId",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"startedAt",value:{name:"string",required:!0}},{key:"completedAt",value:{name:"string",required:!0}},{key:"elapsedMilliseconds",value:{name:"number",required:!0}},{key:"latencyMilliseconds",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!1}},{key:"inputTokens",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!1}},{key:"outputTokens",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!1}},{key:"finishReason",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"status",value:{name:"string",required:!0}},{key:"errorCode",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"sentPrompt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"receivedResult",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"validationResult",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}},{name:"signature",type:"object",raw:`{
  providerLabel: string;
  modelLabel: string;
  startedLabel: string;
  completedLabel: string;
  latencyLabel: string;
  tokenLabel: string;
  sentPromptLabel: string;
  receivedResultLabel: string;
}`,signature:{properties:[{key:"providerLabel",value:{name:"string",required:!0}},{key:"modelLabel",value:{name:"string",required:!0}},{key:"startedLabel",value:{name:"string",required:!0}},{key:"completedLabel",value:{name:"string",required:!0}},{key:"latencyLabel",value:{name:"string",required:!0}},{key:"tokenLabel",value:{name:"string",required:!0}},{key:"sentPromptLabel",value:{name:"string",required:!0}},{key:"receivedResultLabel",value:{name:"string",required:!0}}]}}]}],raw:"AiInteraction[]",required:!0}},{key:"ruleEngine",value:{name:"union",raw:`{
  startedAt: string;
  completedAt: string | null;
  durationMilliseconds: number | null;
  timeline: TimelineEntry[];
  input: JsonValue;
  selectedAction: JsonValue;
  arguments: JsonValue;
  preState: JsonValue;
  postState: JsonValue;
  appliedEffects: JsonValue[];
  facts: JsonValue[];
  events: JsonValue[];
  hints: JsonValue[];
  derivedChanges: JsonValue[];
  startedLabel: string;
  completedLabel: string;
  durationLabel: string;
} | null`,elements:[{name:"signature",type:"object",raw:`{
  startedAt: string;
  completedAt: string | null;
  durationMilliseconds: number | null;
  timeline: TimelineEntry[];
  input: JsonValue;
  selectedAction: JsonValue;
  arguments: JsonValue;
  preState: JsonValue;
  postState: JsonValue;
  appliedEffects: JsonValue[];
  facts: JsonValue[];
  events: JsonValue[];
  hints: JsonValue[];
  derivedChanges: JsonValue[];
  startedLabel: string;
  completedLabel: string;
  durationLabel: string;
}`,signature:{properties:[{key:"startedAt",value:{name:"string",required:!0}},{key:"completedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!0}},{key:"durationMilliseconds",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!0}},{key:"timeline",value:{name:"Array",elements:[{name:"intersection",raw:`TimelineEntryDto & {
  label: string;
  startedLabel: string;
  completedLabel: string;
  durationLabel: string;
}`,elements:[{name:"signature",type:"object",raw:`{
  label?: string | null;
  stage: string;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMilliseconds?: number | null;
}`,signature:{properties:[{key:"label",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"stage",value:{name:"string",required:!0}},{key:"startedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"completedAt",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"durationMilliseconds",value:{name:"union",raw:"number | null",elements:[{name:"number"},{name:"null"}],required:!1}}]}},{name:"signature",type:"object",raw:`{
  label: string;
  startedLabel: string;
  completedLabel: string;
  durationLabel: string;
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"startedLabel",value:{name:"string",required:!0}},{key:"completedLabel",value:{name:"string",required:!0}},{key:"durationLabel",value:{name:"string",required:!0}}]}}]}],raw:"TimelineEntry[]",required:!0}},{key:"input",value:{name:"unknown",required:!0}},{key:"selectedAction",value:{name:"unknown",required:!0}},{key:"arguments",value:{name:"unknown",required:!0}},{key:"preState",value:{name:"unknown",required:!0}},{key:"postState",value:{name:"unknown",required:!0}},{key:"appliedEffects",value:{name:"Array",elements:[{name:"unknown",required:!0}],raw:"JsonValue[]",required:!0}},{key:"facts",value:{name:"Array",elements:[{name:"unknown",required:!0}],raw:"JsonValue[]",required:!0}},{key:"events",value:{name:"Array",elements:[{name:"unknown",required:!0}],raw:"JsonValue[]",required:!0}},{key:"hints",value:{name:"Array",elements:[{name:"unknown",required:!0}],raw:"JsonValue[]",required:!0}},{key:"derivedChanges",value:{name:"Array",elements:[{name:"unknown",required:!0}],raw:"JsonValue[]",required:!0}},{key:"startedLabel",value:{name:"string",required:!0}},{key:"completedLabel",value:{name:"string",required:!0}},{key:"durationLabel",value:{name:"string",required:!0}}]}},{name:"null"}],required:!0}},{key:"rawJson",value:{name:"string",required:!0}}]},required:!0}}]}}]},description:""},onBack:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onRetry:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onLogout:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void | Promise<void>",signature:{arguments:[],return:{name:"union",raw:"void | Promise<void>",elements:[{name:"void"},{name:"Promise",elements:[{name:"void"}],raw:"Promise<void>"}]}}},description:""}}};export{V as T,S as t};
