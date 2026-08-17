import{f as d,w as s,e as a,u as p}from"./index-C4S39nCK.js";import{j as q}from"./jsx-runtime-BO8uF4Og.js";import{r as N}from"./index-D4H_InIO.js";import{t as E,T as P}from"./TurnInspectionPresentation-CerC6ryl.js";import"./Surfaces-hfywbPiG.js";import"./AppChrome-CaJxHzCb.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-DBs-w9aD.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-d7jVExt_.js";const V={session:{id:"SES-AUTHOR-042",status:"active",revision:18,createdAt:"2026-07-29T10:00:00Z",updatedAt:"2026-07-29T10:21:18.120Z"},scenario:{id:"SCN-STAR-LIBRARY",title:"星喰いの地下図書館",definitionVersionId:"SDV-12"},turn:{id:"TURN-018",position:18,kind:"narrative",heading:"封印の解除",narrativeBody:"石の扉を走る銀の線が夜空のように瞬いた。",createdAt:"2026-07-29T10:21:18.120Z"},playerInput:{id:"INPUT-018",text:"扉に刻まれた星座を調べる",interactionType:"dialogue",acceptedAt:"2026-07-29T10:21:13.900Z"},execution:{id:"EXEC-018",kind:"scenario-turn",status:"succeeded",stage:"completed",attemptCount:1,createdAt:"2026-07-29T10:21:13.900Z",queuedAt:"2026-07-29T10:21:13.950Z",startedAt:"2026-07-29T10:21:14.000Z",completedAt:"2026-07-29T10:21:18.036Z",elapsedMilliseconds:4036},aiInteractions:[{id:"AI-INT-001",attemptNumber:1,sequence:1,stage:"action-decision",aiProfileId:"action-decision-primary",status:"succeeded",provider:"OpenAI",model:"gpt-5-mini",providerRequestId:"req_action_018",startedAt:"2026-07-29T10:21:14.000Z",completedAt:"2026-07-29T10:21:15.284Z",elapsedMilliseconds:1284,latencyMilliseconds:1284,inputTokens:842,outputTokens:116,finishReason:"stop",sentPrompt:`[PLAYER]
扉に刻まれた星座を調べる

[STATE]
場所: 禁書庫前`,receivedResult:`{
  "actionId": "inspect-constellation-seal",
  "arguments": { "useItem": "star-map-key" }
}`,validationResult:"schema: valid"},{id:"AI-INT-002",attemptNumber:1,sequence:2,stage:"narrative",aiProfileId:"narrative-main",status:"succeeded",provider:"OpenAI",model:"gpt-5",startedAt:"2026-07-29T10:21:15.511Z",completedAt:"2026-07-29T10:21:18.036Z",elapsedMilliseconds:2525,latencyMilliseconds:2525,inputTokens:1874,outputTokens:428,sentPrompt:"確定したルール処理を変更せず描写してください。",receivedResult:"石の扉を走る銀の線が夜空のように瞬いた。"}],ruleEngine:{stepId:"STEP-018",stage:"completed",schemaVersion:"rule-action-step.v1",preSessionRevision:17,postSessionRevision:18,actionSnapshot:{currentLocation:{id:"archive-hall",name:"書庫前広間"},objects:[{id:"door-01",state:{open:!1}}]},selectedAction:{objectId:"door-01",actionId:"inspect-constellation-seal",objectLabel:"星座の扉",actionLabel:"星座封印を調べる",arguments:{useItem:"star-map-key"}},selectedRuleId:"rule-open-constellation-door",appliedEffects:[{type:"set-state",targetId:"door-01",path:"state.open",value:!0}],postState:{schemaVersion:"post-state.v1",currentLocation:{id:"forbidden-library",name:"禁書庫"},objects:[{id:"door-01",state:{open:!0}}],sessionFlags:{},sessionStateRevision:18},changes:[{kind:"object-state",targetId:"door-01",path:"state.open",before:!1,after:!0},{kind:"location",targetId:null,path:"currentLocation",before:"archive-hall",after:"forbidden-library"}],facts:["禁書庫の封印が解除された"],events:[{type:"door-opened",objectId:"door-01"}],hints:["奥に古い星図が見える"],timing:{createdAt:"2026-07-29T10:21:14.010Z",enumeratedAt:"2026-07-29T10:21:14.080Z",selectedAt:"2026-07-29T10:21:15.284Z",appliedAt:"2026-07-29T10:21:15.480Z",narrativePublishedAt:"2026-07-29T10:21:18.036Z",enumerationElapsedMilliseconds:70,selectionElapsedMilliseconds:1204,applicationElapsedMilliseconds:196,narrativeElapsedMilliseconds:2556,totalElapsedMilliseconds:4026}}},m=E(V),g=E({...V,aiInteractions:[],ruleEngine:null});function k({sessionId:n,turnId:e,scenario:t="success",onBack:i=d()}){const u={...m,sessionId:n,turn:{...m.turn,id:e}},Z=t==="loading"?{status:"loading"}:t==="error"?{status:"error",message:"Turnの実行詳細を読み込めませんでした。時間をおいて再試行してください。"}:{status:"ready",inspection:t==="empty"?{...g,sessionId:n,turn:{...g.turn,id:e}}:u},[M,j]=N.useState(Z);return q.jsx(P,{account:{name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"シナリオ作者"},sessionId:n,turnId:e,state:M,onBack:i,onRetry:()=>j({status:"ready",inspection:u}),onLogout:d()})}k.__docgenInfo={description:"",methods:[],displayName:"MockTurnInspectionContainer",props:{sessionId:{required:!0,tsType:{name:"string"},description:""},turnId:{required:!0,tsType:{name:"string"},description:""},scenario:{required:!1,tsType:{name:"union",raw:"'success' | 'empty' | 'loading' | 'error'",elements:[{name:"literal",value:"'success'"},{name:"literal",value:"'empty'"},{name:"literal",value:"'loading'"},{name:"literal",value:"'error'"}]},description:"",defaultValue:{value:"'success'",computed:!1}},onBack:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"",defaultValue:{value:"fn()",computed:!0}}}};const S=d(),z={title:"ユーザーストーリー/Turn execution inspection",component:k,args:{sessionId:"SES-AUTHOR-042",turnId:"TURN-018",scenario:"success",onBack:S},parameters:{layout:"fullscreen"}},o={play:async({canvasElement:n,step:e})=>{const t=s(n);await e("対象Turnと総実行時間を確認する",async()=>{await a(t.getByRole("heading",{name:"Turn 実行詳細"})).toBeVisible(),await a(t.getByRole("heading",{name:"Turn 18"})).toBeVisible(),await a(t.getByText("4.04 秒")).toBeVisible()}),await e("実行とルールエンジンのタイムラインを確認する",async()=>{await a(t.getByRole("region",{name:"Execution timeline"})).toBeVisible(),await a(t.getByRole("region",{name:"Rule-engine timeline"})).toBeVisible(),await a(t.getByText("星座封印を調べる")).toBeVisible()}),await e("AIの正確な開始・完了時刻と送受信内容を確認する",async()=>{const i=t.getAllByRole("article")[0];await a(s(i).getByText("2026-07-29T10:21:14.000Z")).toBeVisible(),await a(s(i).getByText("2026-07-29T10:21:15.284Z")).toBeVisible(),await p.click(s(i).getByText("検証結果")),await a(s(i).getByText("schema: valid")).toBeVisible()}),await e("セッションに戻る",async()=>{await p.click(t.getByRole("button",{name:"← セッションに戻る"})),await a(S).toHaveBeenCalled()})}},r={args:{scenario:"empty"}},c={args:{scenario:"loading"}},l={args:{scenario:"error"},play:async({canvasElement:n})=>{const e=s(n);await a(e.getByRole("alert")).toBeVisible(),await p.click(e.getByRole("button",{name:"もう一度読み込む"})),await a(e.getByRole("heading",{name:"Turn 18"})).toBeVisible()}};var y,T,v;o.parameters={...o.parameters,docs:{...(y=o.parameters)==null?void 0:y.docs,source:{originalSource:`{
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('対象Turnと総実行時間を確認する', async () => {
      await expect(canvas.getByRole('heading', {
        name: 'Turn 実行詳細'
      })).toBeVisible();
      await expect(canvas.getByRole('heading', {
        name: 'Turn 18'
      })).toBeVisible();
      await expect(canvas.getByText('4.04 秒')).toBeVisible();
    });
    await step('実行とルールエンジンのタイムラインを確認する', async () => {
      await expect(canvas.getByRole('region', {
        name: 'Execution timeline'
      })).toBeVisible();
      await expect(canvas.getByRole('region', {
        name: 'Rule-engine timeline'
      })).toBeVisible();
      await expect(canvas.getByText('星座封印を調べる')).toBeVisible();
    });
    await step('AIの正確な開始・完了時刻と送受信内容を確認する', async () => {
      const exchange = canvas.getAllByRole('article')[0];
      await expect(within(exchange).getByText('2026-07-29T10:21:14.000Z')).toBeVisible();
      await expect(within(exchange).getByText('2026-07-29T10:21:15.284Z')).toBeVisible();
      await userEvent.click(within(exchange).getByText('検証結果'));
      await expect(within(exchange).getByText('schema: valid')).toBeVisible();
    });
    await step('セッションに戻る', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '← セッションに戻る'
      }));
      await expect(back).toHaveBeenCalled();
    });
  }
}`,...(v=(T=o.parameters)==null?void 0:T.docs)==null?void 0:v.source}}};var B,w,b;r.parameters={...r.parameters,docs:{...(B=r.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    scenario: 'empty'
  }
}`,...(b=(w=r.parameters)==null?void 0:w.docs)==null?void 0:b.source}}};var x,h,I;c.parameters={...c.parameters,docs:{...(x=c.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    scenario: 'loading'
  }
}`,...(I=(h=c.parameters)==null?void 0:h.docs)==null?void 0:I.source}}};var R,A,f;l.parameters={...l.parameters,docs:{...(R=l.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    scenario: 'error'
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', {
      name: 'もう一度読み込む'
    }));
    await expect(canvas.getByRole('heading', {
      name: 'Turn 18'
    })).toBeVisible();
  }
}`,...(f=(A=l.parameters)==null?void 0:A.docs)==null?void 0:f.source}}};const G=["Turnの実行経路を確認する","AIまたはルール記録がないTurn","読み込み中","読み込み失敗から再試行する"];export{r as AIまたはルール記録がないTurn,o as Turnの実行経路を確認する,G as __namedExportsOrder,z as default,c as 読み込み中,l as 読み込み失敗から再試行する};
