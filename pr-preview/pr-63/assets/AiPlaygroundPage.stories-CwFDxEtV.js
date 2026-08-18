import{j as o}from"./jsx-runtime-BO8uF4Og.js";import{w as m,e as a,u as s}from"./index-C4S39nCK.js";import{A as D,M as p}from"./MyrialeApp-CsDupTdJ.js";import{c as v}from"./SessionPresentation-DGHeCpe_.js";import{r as w}from"./index-D4H_InIO.js";/* empty css               */import"./AdminAiProvidersPage-DTVL3kaI.js";import"./Surfaces-hfywbPiG.js";import"./AppChrome-CaJxHzCb.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-DBs-w9aD.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-d7jVExt_.js";import"./ConditionTablePresentation-JmdLPG0b.js";import"./EditPane-DyZaeiBP.js";import"./scenarioWizardStyles-CPcslTFI.js";import"./NarrativeBody-4Kg13oE8.js";import"./ModuleUiHost-CQPmid6l.js";import"./TurnInspectionPresentation-CerC6ryl.js";import"./account-Bdcpq1bL.js";import"./SessionListPresentation-CV3LYKA6.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-UcBTXClw.js";import"./SessionActivityFeed-B0l1fOng.js";const d=[{id:"story-openai",displayName:"Story OpenAI",model:"gpt-story-mini",revision:4,credentialRevision:2},{id:"story-local",displayName:"Story Local",model:"qwen-story-8b",revision:7,credentialRevision:5},{id:"runpod-llm",displayName:"LLM（Deckard 40B GGUF）",model:"DavidAU/Qwen3.6-40B-Claude-4.6-Opus-Deckard-Heretic-Uncensored-Thinking-NEO-CODE-Di-IMatrix-MAX-GGUF",revision:0,credentialRevision:0}],h={"story-openai":"扉の向こうには、止まった星時計と青い観測記録が静かに並んでいます。","story-local":"古いドームの隙間から月光が差し、中央の望遠鏡だけがゆっくり北を向きます。","runpod-llm":"星時計の針が淡く発光し、閉ざされていた観測窓がゆっくりと夜空へ開きます。"};function O(t){const n=d.find(e=>e.id===t);return{provider:t,model:n.model,responseId:`response-${t}`,requestId:`request-${t}`,inputTokens:48,outputTokens:24,latencyMilliseconds:t==="story-openai"?180:t==="story-local"?320:640,attemptCount:1,finishReason:"stop"}}function P({scenario:t="success"}){const[n,e]=w.useState(d[0].id),i=w.useRef(0),L=async()=>{if(i.current+=1,t==="provider-error-once"&&i.current===1)return{ok:!1,message:"Providerが一時的に利用できません。会話履歴を保持したまま再試行できます。"};if(t==="revision-conflict")return{ok:!1,message:"AI ProfileまたはCredentialが更新されました。最新情報を再読み込みしたため、内容を確認して再実行してください。",action:"reload"};const g=n;return{ok:!0,message:"次のassistant応答を生成しました。",value:{message:{role:"assistant",content:h[g]},metadata:O(g)}}};return o.jsx(D,{account:{name:"運用管理者",email:"admin@myriale.example",initials:"運管",role:"AI管理者"},state:{status:"ready",profiles:d,selectedProfileId:n},actions:{selectProfile:e,generate:L,retry:()=>{},logout:()=>{}}})}P.__docgenInfo={description:"",methods:[],displayName:"MockAiPlaygroundContainer",props:{scenario:{required:!1,tsType:{name:"union",raw:"'success' | 'provider-error-once' | 'revision-conflict'",elements:[{name:"literal",value:"'success'"},{name:"literal",value:"'provider-error-once'"},{name:"literal",value:"'revision-conflict'"}]},description:"",defaultValue:{value:"'success'",computed:!1}}}};const u=t=>()=>o.jsx(P,{scenario:t}),oe={title:"ユーザーストーリー/AI Conversation Playground",component:p,render:()=>o.jsx(p,{initialUrl:"/admin/ai-playground",initialDb:v("empty"),aiPlaygroundContainer:u("success")})},r={name:"架空の履歴を組み立てて次のassistant応答を生成する",play:async({canvasElement:t,step:n})=>{const e=m(t);await n("system/user/assistantのmessageを時系列で組み立てる",async()=>{await a(e.getByRole("main",{name:"AI Conversation Playground"})).toBeVisible(),await s.click(e.getByRole("button",{name:"+ assistant"})),await s.type(e.getByLabelText("3番目のmessage content"),"以前の案内役の返答です。"),await s.click(e.getByRole("button",{name:"+ user"})),await s.type(e.getByLabelText("4番目のmessage content"),"星時計に触れます。"),await a(e.getByLabelText("3番目のmessage role")).toHaveValue("assistant")}),await n("生成するとassistant応答が末尾へ追加されmetadataを確認できる",async()=>{await s.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await a(await e.findByRole("article",{name:"Response 1"})).toHaveTextContent("扉の向こうには"),await a(e.getByTestId("ai-playground-metadata")).toHaveTextContent("gpt-story-mini"),await a(e.getByTestId("ai-playground-metadata")).toHaveTextContent("48 in / 24 out"),await a(e.getAllByTestId("ai-playground-response-item")).toHaveLength(1)}),await n("Profileを切り替えると別modelの応答とmetadataになる",async()=>{await s.selectOptions(e.getByLabelText("AI Profile"),"story-local"),await s.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await a(await e.findByRole("article",{name:"Response 2"})).toHaveTextContent("古いドームの隙間"),await a(e.getByTestId("ai-playground-metadata")).toHaveTextContent("qwen-story-8b"),await a(e.getAllByTestId("ai-playground-response-item")).toHaveLength(2),await a(e.getAllByTestId("ai-playground-response-item")[0]).toHaveTextContent("古いドームの隙間")}),await n("新しいllm endpointを選択して実行できる",async()=>{await s.selectOptions(e.getByLabelText("AI Profile"),"runpod-llm"),await s.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await a(await e.findByRole("article",{name:"Response 3"})).toHaveTextContent("観測窓がゆっくりと夜空へ開きます"),await a(e.getByTestId("ai-playground-metadata")).toHaveTextContent("runpod-llm"),await a(e.getByTestId("ai-playground-metadata")).toHaveTextContent("Qwen3.6-40B"),await a(e.getAllByTestId("ai-playground-response-item")).toHaveLength(3)}),await n("個別の応答を削除して残りをリストで管理する",async()=>{await s.click(e.getByRole("button",{name:"Response 2を削除"})),await a(e.getAllByTestId("ai-playground-response-item")).toHaveLength(2),await a(e.queryByRole("article",{name:"Response 2"})).not.toBeInTheDocument(),await a(e.getByRole("article",{name:"Response 3"})).toBeVisible()})}},l={render:()=>o.jsx(p,{initialUrl:"/admin/ai-playground",initialDb:v("empty"),aiPlaygroundContainer:u("provider-error-once")}),play:async({canvasElement:t,step:n})=>{const e=m(t),i="古い天文台の扉を開けます。中の様子を教えてください。";await n("Provider errorでも編集中の履歴を保持する",async()=>{await s.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await a(e.getByRole("alert")).toHaveTextContent("一時的に利用できません"),await a(e.getByLabelText("2番目のmessage content")).toHaveValue(i)}),await n("同じ履歴で再試行できる",async()=>{await s.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await a(await e.findByRole("article",{name:"Response 1"})).toHaveTextContent("扉の向こうには")})}},c={play:async({canvasElement:t,step:n})=>{const e=m(t);await n("壊れたJSONを拒否して現在の履歴を残す",async()=>{await s.click(e.getByText("JSON import / export")),await s.click(e.getByLabelText("会話履歴import JSON")),await s.paste("{broken"),await s.click(e.getByRole("button",{name:"JSONを読み込む"})),await a(e.getByRole("alert")).toHaveTextContent("変更されていません"),await a(e.getByLabelText("2番目のmessage content")).toHaveValue("古い天文台の扉を開けます。中の様子を教えてください。")}),await n("空履歴では生成できない",async()=>{await s.click(e.getByRole("button",{name:"全消去"})),await a(e.getByRole("button",{name:"次のassistant応答を生成"})).toBeDisabled(),await a(e.getByText(/会話履歴は空です/)).toBeVisible()})}},y={render:()=>o.jsx(p,{initialUrl:"/admin/ai-playground",initialDb:v("empty"),aiPlaygroundContainer:u("revision-conflict")}),play:async({canvasElement:t,step:n})=>{const e=m(t);await n("revision conflictを安全な再読込案内として表示する",async()=>{await s.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await a(e.getByRole("alert")).toHaveTextContent("最新情報を再読み込み"),await a(e.getByLabelText("2番目のmessage content")).toHaveValue("古い天文台の扉を開けます。中の様子を教えてください。")})}};var B,x,T;r.parameters={...r.parameters,docs:{...(B=r.parameters)==null?void 0:B.docs,source:{originalSource:`{
  name: '架空の履歴を組み立てて次のassistant応答を生成する',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('system/user/assistantのmessageを時系列で組み立てる', async () => {
      await expect(canvas.getByRole('main', {
        name: 'AI Conversation Playground'
      })).toBeVisible();
      await userEvent.click(canvas.getByRole('button', {
        name: '+ assistant'
      }));
      await userEvent.type(canvas.getByLabelText('3番目のmessage content'), '以前の案内役の返答です。');
      await userEvent.click(canvas.getByRole('button', {
        name: '+ user'
      }));
      await userEvent.type(canvas.getByLabelText('4番目のmessage content'), '星時計に触れます。');
      await expect(canvas.getByLabelText('3番目のmessage role')).toHaveValue('assistant');
    });
    await step('生成するとassistant応答が末尾へ追加されmetadataを確認できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await expect(await canvas.findByRole('article', {
        name: 'Response 1'
      })).toHaveTextContent('扉の向こうには');
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('gpt-story-mini');
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('48 in / 24 out');
      await expect(canvas.getAllByTestId('ai-playground-response-item')).toHaveLength(1);
    });
    await step('Profileを切り替えると別modelの応答とmetadataになる', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('AI Profile'), 'story-local');
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await expect(await canvas.findByRole('article', {
        name: 'Response 2'
      })).toHaveTextContent('古いドームの隙間');
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('qwen-story-8b');
      await expect(canvas.getAllByTestId('ai-playground-response-item')).toHaveLength(2);
      await expect(canvas.getAllByTestId('ai-playground-response-item')[0]).toHaveTextContent('古いドームの隙間');
    });
    await step('新しいllm endpointを選択して実行できる', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('AI Profile'), 'runpod-llm');
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await expect(await canvas.findByRole('article', {
        name: 'Response 3'
      })).toHaveTextContent('観測窓がゆっくりと夜空へ開きます');
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('runpod-llm');
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('Qwen3.6-40B');
      await expect(canvas.getAllByTestId('ai-playground-response-item')).toHaveLength(3);
    });
    await step('個別の応答を削除して残りをリストで管理する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'Response 2を削除'
      }));
      await expect(canvas.getAllByTestId('ai-playground-response-item')).toHaveLength(2);
      await expect(canvas.queryByRole('article', {
        name: 'Response 2'
      })).not.toBeInTheDocument();
      await expect(canvas.getByRole('article', {
        name: 'Response 3'
      })).toBeVisible();
    });
  }
}`,...(T=(x=r.parameters)==null?void 0:x.docs)==null?void 0:T.source}}};var R,b,f;l.parameters={...l.parameters,docs:{...(R=l.parameters)==null?void 0:R.docs,source:{originalSource:`{
  render: () => <MyrialeApp initialUrl="/admin/ai-playground" initialDb={createDemoDb('empty')} aiPlaygroundContainer={containerFor('provider-error-once')} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const before = '古い天文台の扉を開けます。中の様子を教えてください。';
    await step('Provider errorでも編集中の履歴を保持する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await expect(canvas.getByRole('alert')).toHaveTextContent('一時的に利用できません');
      await expect(canvas.getByLabelText('2番目のmessage content')).toHaveValue(before);
    });
    await step('同じ履歴で再試行できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await expect(await canvas.findByRole('article', {
        name: 'Response 1'
      })).toHaveTextContent('扉の向こうには');
    });
  }
}`,...(f=(b=l.parameters)==null?void 0:b.docs)==null?void 0:f.source}}};var H,C,k;c.parameters={...c.parameters,docs:{...(H=c.parameters)==null?void 0:H.docs,source:{originalSource:`{
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('壊れたJSONを拒否して現在の履歴を残す', async () => {
      await userEvent.click(canvas.getByText('JSON import / export'));
      await userEvent.click(canvas.getByLabelText('会話履歴import JSON'));
      await userEvent.paste('{broken');
      await userEvent.click(canvas.getByRole('button', {
        name: 'JSONを読み込む'
      }));
      await expect(canvas.getByRole('alert')).toHaveTextContent('変更されていません');
      await expect(canvas.getByLabelText('2番目のmessage content')).toHaveValue('古い天文台の扉を開けます。中の様子を教えてください。');
    });
    await step('空履歴では生成できない', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '全消去'
      }));
      await expect(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      })).toBeDisabled();
      await expect(canvas.getByText(/会話履歴は空です/)).toBeVisible();
    });
  }
}`,...(k=(C=c.parameters)==null?void 0:C.docs)==null?void 0:k.source}}};var I,E,A;y.parameters={...y.parameters,docs:{...(I=y.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <MyrialeApp initialUrl="/admin/ai-playground" initialDb={createDemoDb('empty')} aiPlaygroundContainer={containerFor('revision-conflict')} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('revision conflictを安全な再読込案内として表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await expect(canvas.getByRole('alert')).toHaveTextContent('最新情報を再読み込み');
      await expect(canvas.getByLabelText('2番目のmessage content')).toHaveValue('古い天文台の扉を開けます。中の様子を教えてください。');
    });
  }
}`,...(A=(E=y.parameters)==null?void 0:E.docs)==null?void 0:A.source}}};const ie=["BuildAndGenerateConversation","ProviderErrorPreservesHistory","InvalidImportAndEmptyHistory","RevisionConflictRequestsReview"];export{r as BuildAndGenerateConversation,c as InvalidImportAndEmptyHistory,l as ProviderErrorPreservesHistory,y as RevisionConflictRequestsReview,ie as __namedExportsOrder,oe as default};
