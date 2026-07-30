import{f as u,e as t,w as n,u as p}from"./index-C4S39nCK.js";import{j as H}from"./jsx-runtime-BO8uF4Og.js";import{r as q}from"./index-D4H_InIO.js";import{t as E,S as M}from"./sessionAiHistoryModel-gOa9I3CL.js";import"./Surfaces-xpIMDkG0.js";import"./AppChrome-CqlUs9ri.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-nBW4_8Wv.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CLGgTteF.js";const f={sessionId:"SES-AUTHOR-042",scenarioId:"SCN-STAR-LIBRARY",scenarioTitle:"星喰いの地下図書館",interactions:[{id:"AI-INT-001",executionId:"EXEC-018",executionAttemptId:"ATTEMPT-018-1",attemptNumber:1,sequence:1,stage:"selecting-action",aiProfileId:"action-decision-primary",status:"succeeded",provider:"OpenAI",model:"gpt-5-mini",providerRequestId:"req_action_018",startedAt:"2026-07-29T10:21:14Z",completedAt:"2026-07-29T10:21:15.284Z",latencyMilliseconds:1284,inputTokens:842,outputTokens:116,finishReason:"stop",sentPrompt:`[SYSTEM]
利用可能な行動から、現在の物語に最も自然なものを1つ選択してください。

[STATE]
場所: 禁書庫前
所持品: 星図の鍵

[PLAYER]
扉に刻まれた星座を調べる`,receivedResult:`{
  "actionId": "inspect-constellation-seal",
  "arguments": { "useItem": "star-map-key" },
  "confidence": 0.94
}`,validationResult:`schema: valid
action: enabled
arguments: valid`},{id:"AI-INT-002",executionId:"EXEC-018",executionAttemptId:"ATTEMPT-018-1",attemptNumber:1,sequence:2,stage:"generating-narrative",aiProfileId:"narrative-main",status:"succeeded",provider:"OpenAI",model:"gpt-5",providerRequestId:"req_narrative_018",startedAt:"2026-07-29T10:21:15.511Z",completedAt:"2026-07-29T10:21:18.036Z",latencyMilliseconds:2525,inputTokens:1874,outputTokens:428,finishReason:"stop",sentPrompt:`[SYSTEM]
確定したルール処理を変更せず、日本語の物語として描写してください。

[RESULT]
星図の鍵が反応し、封印が解除された。`,receivedResult:"鍵を星座の中心へ重ねた瞬間、石の扉を走る銀の線が夜空のように瞬いた。長く閉ざされていた禁書庫の空気が、紙と微かな鉄の匂いをまとって流れ出す。",validationResult:`required facts: 3/3 present
forbidden mutation: none`}]},d=E(f),P=E({...f,interactions:[]});function S({sessionId:i,scenario:e="success",onBack:a=u()}){const o=e==="loading"?{status:"loading"}:e==="error"?{status:"error",message:"AI履歴を読み込めませんでした。時間をおいて再試行してください。"}:{status:"ready",history:e==="empty"?P:{...d,sessionId:i}},[s,k]=q.useState(o);return H.jsx(M,{account:{name:"霧野しおり",email:"author@myriale.example",initials:"霧野",role:"シナリオ作者"},sessionId:i,state:s,onBack:a,onRetry:()=>k({status:"ready",history:{...d,sessionId:i}}),onLogout:u()})}S.__docgenInfo={description:"",methods:[],displayName:"MockSessionAiHistoryContainer",props:{sessionId:{required:!0,tsType:{name:"string"},description:""},scenario:{required:!1,tsType:{name:"union",raw:"'success' | 'empty' | 'loading' | 'error'",elements:[{name:"literal",value:"'success'"},{name:"literal",value:"'empty'"},{name:"literal",value:"'loading'"},{name:"literal",value:"'error'"}]},description:"",defaultValue:{value:"'success'",computed:!1}},onBack:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"",defaultValue:{value:"fn()",computed:!0}}}};const V=u(),D={title:"ユーザーストーリー/Session AI history",component:S,args:{sessionId:"SES-AUTHOR-042",scenario:"success",onBack:V},parameters:{layout:"fullscreen"}},c={play:async({canvasElement:i,step:e})=>{const a=n(i);await e("作者は対象セッションとシナリオ、AI交換回数を確認する",async()=>{await t(a.getByRole("heading",{name:"AI対話履歴"})).toBeVisible(),await t(a.getByText("星喰いの地下図書館")).toBeVisible(),await t(a.getByText("2")).toBeVisible()}),await e("処理順にステージ、プロファイル、モデル、状態、時間、トークンを確認する",async()=>{const o=a.getByRole("region",{name:"AI対話の時系列"}),s=n(o).getAllByRole("article");await t(s).toHaveLength(2),await t(n(s[0]).getByRole("heading",{name:"selecting-action"})).toBeVisible(),await t(n(s[0]).getByText("gpt-5-mini")).toBeVisible(),await t(n(s[0]).getByText("入力 842 / 出力 116")).toBeVisible(),await t(n(s[0]).getByText("succeeded")).toBeVisible()}),await e("送信プロンプトと受信結果を開閉し、必要な詳細だけを読む",async()=>{const o=a.getAllByRole("article")[0],s=n(o).getByText("検証結果");await p.click(s),await t(n(o).getByText(/schema: valid/)).toBeVisible(),await p.click(n(o).getByText("AIから受信した結果"))}),await e("確認後は元のセッションへ戻る",async()=>{await p.click(a.getByRole("button",{name:"← セッションに戻る"})),await t(V).toHaveBeenCalled()})}},r={args:{scenario:"empty"},play:async({canvasElement:i,step:e})=>{await e("AI処理前は、履歴がまだない理由を確認できる",async()=>{await t(n(i).getByText("AI対話の記録はまだありません")).toBeVisible()})}},l={args:{scenario:"loading"}},m={args:{scenario:"error"},play:async({canvasElement:i,step:e})=>{const a=n(i);await e("取得に失敗した場合はエラー内容と再試行導線を確認する",async()=>{await t(a.getByRole("alert")).toBeVisible(),await p.click(a.getByRole("button",{name:"もう一度読み込む"}))}),await e("再試行後はサーバーから取得した履歴を表示する",async()=>{await t(a.getByRole("region",{name:"AI対話の時系列"})).toBeVisible()})}};var g,y,w;c.parameters={...c.parameters,docs:{...(g=c.parameters)==null?void 0:g.docs,source:{originalSource:`{
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('作者は対象セッションとシナリオ、AI交換回数を確認する', async () => {
      await expect(canvas.getByRole('heading', {
        name: 'AI対話履歴'
      })).toBeVisible();
      await expect(canvas.getByText('星喰いの地下図書館')).toBeVisible();
      await expect(canvas.getByText('2')).toBeVisible();
    });
    await step('処理順にステージ、プロファイル、モデル、状態、時間、トークンを確認する', async () => {
      const timeline = canvas.getByRole('region', {
        name: 'AI対話の時系列'
      });
      const exchanges = within(timeline).getAllByRole('article');
      await expect(exchanges).toHaveLength(2);
      await expect(within(exchanges[0]).getByRole('heading', {
        name: 'selecting-action'
      })).toBeVisible();
      await expect(within(exchanges[0]).getByText('gpt-5-mini')).toBeVisible();
      await expect(within(exchanges[0]).getByText('入力 842 / 出力 116')).toBeVisible();
      await expect(within(exchanges[0]).getByText('succeeded')).toBeVisible();
    });
    await step('送信プロンプトと受信結果を開閉し、必要な詳細だけを読む', async () => {
      const firstExchange = canvas.getAllByRole('article')[0];
      const validationSummary = within(firstExchange).getByText('検証結果');
      await userEvent.click(validationSummary);
      await expect(within(firstExchange).getByText(/schema: valid/)).toBeVisible();
      await userEvent.click(within(firstExchange).getByText('AIから受信した結果'));
    });
    await step('確認後は元のセッションへ戻る', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '← セッションに戻る'
      }));
      await expect(back).toHaveBeenCalled();
    });
  }
}`,...(w=(y=c.parameters)==null?void 0:y.docs)==null?void 0:w.source}}};var B,x,v;r.parameters={...r.parameters,docs:{...(B=r.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    scenario: 'empty'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    await step('AI処理前は、履歴がまだない理由を確認できる', async () => {
      await expect(within(canvasElement).getByText('AI対話の記録はまだありません')).toBeVisible();
    });
  }
}`,...(v=(x=r.parameters)==null?void 0:x.docs)==null?void 0:v.source}}};var A,T,h;l.parameters={...l.parameters,docs:{...(A=l.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    scenario: 'loading'
  }
}`,...(h=(T=l.parameters)==null?void 0:T.docs)==null?void 0:h.source}}};var I,R,b;m.parameters={...m.parameters,docs:{...(I=m.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    scenario: 'error'
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('取得に失敗した場合はエラー内容と再試行導線を確認する', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
      await userEvent.click(canvas.getByRole('button', {
        name: 'もう一度読み込む'
      }));
    });
    await step('再試行後はサーバーから取得した履歴を表示する', async () => {
      await expect(canvas.getByRole('region', {
        name: 'AI対話の時系列'
      })).toBeVisible();
    });
  }
}`,...(b=(R=m.parameters)==null?void 0:R.docs)==null?void 0:b.source}}};const z=["作者がAI送受信履歴を確認する","AI対話がまだない","読み込み中","読み込み失敗から再試行する"];export{r as AI対話がまだない,z as __namedExportsOrder,D as default,c as 作者がAI送受信履歴を確認する,l as 読み込み中,m as 読み込み失敗から再試行する};
