import{j as s}from"./jsx-runtime-BO8uF4Og.js";import{w as p,e as t,u as i}from"./index-C4S39nCK.js";import{A as V,M as y}from"./MyrialeApp-An0RSvi2.js";import{c as u}from"./SessionPresentation-DGHeCpe_.js";import{r as w}from"./index-D4H_InIO.js";/* empty css               */import"./AdminAiProvidersPage-DTVL3kaI.js";import"./Surfaces-hfywbPiG.js";import"./AppChrome-CaJxHzCb.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-DBs-w9aD.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-d7jVExt_.js";import"./ConditionTablePresentation-JmdLPG0b.js";import"./EditPane-DyZaeiBP.js";import"./scenarioWizardStyles-CPcslTFI.js";import"./NarrativeBody-4Kg13oE8.js";import"./ModuleUiHost-CQPmid6l.js";import"./TurnInspectionPresentation-CerC6ryl.js";import"./account-Bdcpq1bL.js";import"./SessionListPresentation-CV3LYKA6.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-UcBTXClw.js";import"./SessionActivityFeed-B0l1fOng.js";const d=[{id:"story-openai",displayName:"Story OpenAI",model:"gpt-story-mini",revision:4,credentialRevision:2},{id:"story-local",displayName:"Story Local",model:"qwen-story-8b",revision:7,credentialRevision:5},{id:"runpod-llm",displayName:"LLM（Deckard 40B GGUF）",model:"DavidAU/Qwen3.6-40B-Claude-4.6-Opus-Deckard-Heretic-Uncensored-Thinking-NEO-CODE-Di-IMatrix-MAX-GGUF",revision:0,credentialRevision:0}],D={"story-openai":"扉の向こうには、止まった星時計と青い観測記録が静かに並んでいます。","story-local":"古いドームの隙間から月光が差し、中央の望遠鏡だけがゆっくり北を向きます。","runpod-llm":"星時計の針が淡く発光し、閉ざされていた観測窓がゆっくりと夜空へ開きます。"};function O(a){const n=d.find(e=>e.id===a);return{provider:a,model:n.model,responseId:`response-${a}`,requestId:`request-${a}`,inputTokens:48,outputTokens:24,latencyMilliseconds:a==="story-openai"?180:a==="story-local"?320:640,attemptCount:1,finishReason:"stop"}}function A({scenario:a="success"}){const[n,e]=w.useState(d[0].id),o=w.useRef(0),L=async()=>{if(o.current+=1,a==="provider-error-once"&&o.current===1)return{ok:!1,message:"Providerが一時的に利用できません。会話履歴を保持したまま再試行できます。"};if(a==="revision-conflict")return{ok:!1,message:"AI ProfileまたはCredentialが更新されました。最新情報を再読み込みしたため、内容を確認して再実行してください。",action:"reload"};const g=n;return{ok:!0,message:"次のassistant応答を生成しました。",value:{message:{role:"assistant",content:D[g]},metadata:O(g)}}};return s.jsx(V,{account:{name:"運用管理者",email:"admin@myriale.example",initials:"運管",role:"AI管理者"},state:{status:"ready",profiles:d,selectedProfileId:n},actions:{selectProfile:e,generate:L,retry:()=>{},logout:()=>{}}})}A.__docgenInfo={description:"",methods:[],displayName:"MockAiPlaygroundContainer",props:{scenario:{required:!1,tsType:{name:"union",raw:"'success' | 'provider-error-once' | 'revision-conflict'",elements:[{name:"literal",value:"'success'"},{name:"literal",value:"'provider-error-once'"},{name:"literal",value:"'revision-conflict'"}]},description:"",defaultValue:{value:"'success'",computed:!1}}}};const v=a=>()=>s.jsx(A,{scenario:a}),se={title:"ユーザーストーリー/AI Conversation Playground",component:y,render:()=>s.jsx(y,{initialUrl:"/admin/ai-playground",initialDb:u("empty"),aiPlaygroundContainer:v("success")})},r={name:"架空の履歴を組み立てて次のassistant応答を生成する",play:async({canvasElement:a,step:n})=>{const e=p(a);await n("system/user/assistantのmessageを時系列で組み立てる",async()=>{await t(e.getByRole("main",{name:"AI Conversation Playground"})).toBeVisible(),await i.click(e.getByRole("button",{name:"+ assistant"})),await i.type(e.getByLabelText("3番目のmessage content"),"以前の案内役の返答です。"),await i.click(e.getByRole("button",{name:"+ user"})),await i.type(e.getByLabelText("4番目のmessage content"),"星時計に触れます。"),await t(e.getByLabelText("3番目のmessage role")).toHaveValue("assistant")}),await n("生成するとassistant応答が末尾へ追加されmetadataを確認できる",async()=>{await i.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(await e.findByText(/扉の向こうには/)).toBeVisible(),await t(e.getByTestId("ai-playground-metadata")).toHaveTextContent("gpt-story-mini"),await t(e.getByTestId("ai-playground-metadata")).toHaveTextContent("48 in / 24 out")}),await n("Profileを切り替えると別modelの応答とmetadataになる",async()=>{await i.selectOptions(e.getByLabelText("AI Profile"),"story-local"),await i.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(await e.findByText(/古いドームの隙間/)).toBeVisible(),await t(e.getByTestId("ai-playground-metadata")).toHaveTextContent("qwen-story-8b")}),await n("新しいllm endpointを選択して実行できる",async()=>{await i.selectOptions(e.getByLabelText("AI Profile"),"runpod-llm"),await i.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(await e.findByText(/観測窓がゆっくりと夜空へ開きます/)).toBeVisible(),await t(e.getByTestId("ai-playground-metadata")).toHaveTextContent("runpod-llm"),await t(e.getByTestId("ai-playground-metadata")).toHaveTextContent("Qwen3.6-40B")})}},c={render:()=>s.jsx(y,{initialUrl:"/admin/ai-playground",initialDb:u("empty"),aiPlaygroundContainer:v("provider-error-once")}),play:async({canvasElement:a,step:n})=>{const e=p(a),o="古い天文台の扉を開けます。中の様子を教えてください。";await n("Provider errorでも編集中の履歴を保持する",async()=>{await i.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByRole("alert")).toHaveTextContent("一時的に利用できません"),await t(e.getByLabelText("2番目のmessage content")).toHaveValue(o)}),await n("同じ履歴で再試行できる",async()=>{await i.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(await e.findByText(/扉の向こうには/)).toBeVisible()})}},l={play:async({canvasElement:a,step:n})=>{const e=p(a);await n("壊れたJSONを拒否して現在の履歴を残す",async()=>{await i.click(e.getByText("JSON import / export")),await i.click(e.getByLabelText("会話履歴import JSON")),await i.paste("{broken"),await i.click(e.getByRole("button",{name:"JSONを読み込む"})),await t(e.getByRole("alert")).toHaveTextContent("変更されていません"),await t(e.getByLabelText("2番目のmessage content")).toHaveValue("古い天文台の扉を開けます。中の様子を教えてください。")}),await n("空履歴では生成できない",async()=>{await i.click(e.getByRole("button",{name:"全消去"})),await t(e.getByRole("button",{name:"次のassistant応答を生成"})).toBeDisabled(),await t(e.getByText(/会話履歴は空です/)).toBeVisible()})}},m={render:()=>s.jsx(y,{initialUrl:"/admin/ai-playground",initialDb:u("empty"),aiPlaygroundContainer:v("revision-conflict")}),play:async({canvasElement:a,step:n})=>{const e=p(a);await n("revision conflictを安全な再読込案内として表示する",async()=>{await i.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByRole("alert")).toHaveTextContent("最新情報を再読み込み"),await t(e.getByLabelText("2番目のmessage content")).toHaveValue("古い天文台の扉を開けます。中の様子を教えてください。")})}};var B,x,b;r.parameters={...r.parameters,docs:{...(B=r.parameters)==null?void 0:B.docs,source:{originalSource:`{
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
      await expect(await canvas.findByText(/扉の向こうには/)).toBeVisible();
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('gpt-story-mini');
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('48 in / 24 out');
    });
    await step('Profileを切り替えると別modelの応答とmetadataになる', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('AI Profile'), 'story-local');
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await expect(await canvas.findByText(/古いドームの隙間/)).toBeVisible();
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('qwen-story-8b');
    });
    await step('新しいllm endpointを選択して実行できる', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('AI Profile'), 'runpod-llm');
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await expect(await canvas.findByText(/観測窓がゆっくりと夜空へ開きます/)).toBeVisible();
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('runpod-llm');
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('Qwen3.6-40B');
    });
  }
}`,...(b=(x=r.parameters)==null?void 0:x.docs)==null?void 0:b.source}}};var T,f,R;c.parameters={...c.parameters,docs:{...(T=c.parameters)==null?void 0:T.docs,source:{originalSource:`{
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
      await expect(await canvas.findByText(/扉の向こうには/)).toBeVisible();
    });
  }
}`,...(R=(f=c.parameters)==null?void 0:f.docs)==null?void 0:R.source}}};var k,E,C;l.parameters={...l.parameters,docs:{...(k=l.parameters)==null?void 0:k.docs,source:{originalSource:`{
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
}`,...(C=(E=l.parameters)==null?void 0:E.docs)==null?void 0:C.source}}};var P,H,I;m.parameters={...m.parameters,docs:{...(P=m.parameters)==null?void 0:P.docs,source:{originalSource:`{
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
}`,...(I=(H=m.parameters)==null?void 0:H.docs)==null?void 0:I.source}}};const oe=["BuildAndGenerateConversation","ProviderErrorPreservesHistory","InvalidImportAndEmptyHistory","RevisionConflictRequestsReview"];export{r as BuildAndGenerateConversation,l as InvalidImportAndEmptyHistory,c as ProviderErrorPreservesHistory,m as RevisionConflictRequestsReview,oe as __namedExportsOrder,se as default};
