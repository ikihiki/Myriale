import{j as s}from"./jsx-runtime-BO8uF4Og.js";import{w as u,e as t,u as a}from"./index-C4S39nCK.js";import{A as L,M as p}from"./MyrialeApp-BjILjPdc.js";import{c as d}from"./SessionPresentation-DGHeCpe_.js";import{r as w}from"./index-D4H_InIO.js";/* empty css               */import"./AdminAiProvidersPage-DTVL3kaI.js";import"./Surfaces-hfywbPiG.js";import"./AppChrome-CaJxHzCb.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-DBs-w9aD.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-d7jVExt_.js";import"./ConditionTablePresentation-JmdLPG0b.js";import"./EditPane-DyZaeiBP.js";import"./scenarioWizardStyles-CPcslTFI.js";import"./NarrativeBody-4Kg13oE8.js";import"./ModuleUiHost-CQPmid6l.js";import"./TurnInspectionPresentation-CerC6ryl.js";import"./account-Bdcpq1bL.js";import"./SessionListPresentation-CV3LYKA6.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-UcBTXClw.js";import"./SessionActivityFeed-B0l1fOng.js";const m=[{id:"story-openai",displayName:"Story OpenAI",model:"gpt-story-mini",revision:4,credentialRevision:2},{id:"story-local",displayName:"Story Local",model:"qwen-story-8b",revision:7,credentialRevision:5},{id:"runpod-llm",displayName:"LLM（Deckard 40B GGUF）",model:"DavidAU/Qwen3.6-40B-Claude-4.6-Opus-Deckard-Heretic-Uncensored-Thinking-NEO-CODE-Di-IMatrix-MAX-GGUF",revision:0,credentialRevision:0}],V={"story-openai":"扉の向こうには、止まった星時計と青い観測記録が静かに並んでいます。","story-local":"古いドームの隙間から月光が差し、中央の望遠鏡だけがゆっくり北を向きます。","runpod-llm":"星時計の針が淡く発光し、閉ざされていた観測窓がゆっくりと夜空へ開きます。"};function O(n){const o=m.find(e=>e.id===n);return{provider:n,model:o.model,responseId:`response-${n}`,requestId:`request-${n}`,inputTokens:48,outputTokens:24,latencyMilliseconds:n==="story-openai"?180:n==="story-local"?320:640,attemptCount:1,finishReason:"stop"}}function A({scenario:n="success"}){const[o,e]=w.useState(m[0].id),i=w.useRef(0),D=async()=>{if(i.current+=1,n==="provider-error-once"&&i.current===2)return{ok:!1,message:"Providerが一時的に利用できません。会話履歴と生成済み応答を保持したまま再試行できます。"};if(n==="revision-conflict")return{ok:!1,message:"AI ProfileまたはCredentialが更新されました。最新情報を再読み込みしたため、内容を確認して再実行してください。",action:"reload"};const g=o;return{ok:!0,message:"次のassistant応答を生成しました。",value:{message:{role:"assistant",content:V[g]},metadata:O(g)}}};return s.jsx(L,{account:{name:"運用管理者",email:"admin@myriale.example",initials:"運管",role:"AI管理者"},state:{status:"ready",profiles:m,selectedProfileId:o},actions:{selectProfile:e,generate:D,retry:()=>{},logout:()=>{}}})}A.__docgenInfo={description:"",methods:[],displayName:"MockAiPlaygroundContainer",props:{scenario:{required:!1,tsType:{name:"union",raw:"'success' | 'provider-error-once' | 'revision-conflict'",elements:[{name:"literal",value:"'success'"},{name:"literal",value:"'provider-error-once'"},{name:"literal",value:"'revision-conflict'"}]},description:"",defaultValue:{value:"'success'",computed:!1}}}};const v=n=>()=>s.jsx(A,{scenario:n}),se={title:"ユーザーストーリー/AI Conversation Playground",component:p,render:()=>s.jsx(p,{initialUrl:"/admin/ai-playground",initialDb:d("empty"),aiPlaygroundContainer:v("success")})},r={name:"同じ会話から複数の応答候補を比較して管理する",play:async({canvasElement:n,step:o})=>{const e=u(n);await o("3つのProfileから生成して3件の独立した応答を保持する",async()=>{await t(e.getByRole("main",{name:"AI Conversation Playground"})).toBeVisible(),await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await a.selectOptions(e.getByLabelText("AI Profile"),"story-local"),await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await a.selectOptions(e.getByLabelText("AI Profile"),"runpod-llm"),await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("3件の応答"),await t(e.getByRole("button",{name:"応答 1を選択"})).toBeVisible(),await t(e.getByRole("button",{name:"応答 2を選択"})).toBeVisible(),await t(e.getByRole("button",{name:"応答 3を選択"})).toHaveAttribute("aria-pressed","true"),await t(e.queryByLabelText("3番目のmessage content")).not.toBeInTheDocument(),await a.click(e.getByRole("button",{name:"会話を全消去"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("3件の応答"),await a.click(e.getByRole("button",{name:"サンプル初期化"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("3件の応答")}),await o("古い応答を選ぶと本文とmetadataが切り替わる",async()=>{await a.click(e.getByRole("button",{name:"応答 1を選択"})),await t(e.getByTestId("ai-playground-response-detail")).toHaveTextContent("扉の向こうには"),await t(e.getByTestId("ai-playground-response-detail")).toHaveTextContent("gpt-story-mini"),await t(e.getByTestId("ai-playground-response-detail")).toHaveTextContent("48 in / 24 out")}),await o("選択した応答だけを会話履歴へ明示的に追加する",async()=>{await a.click(e.getByRole("button",{name:"選択した応答を会話へ追加"})),await t(e.getByLabelText("3番目のmessage content")).toHaveValue("扉の向こうには、止まった星時計と青い観測記録が静かに並んでいます。"),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("3件の応答")}),await o("1件を削除してから全応答を明示的に消去する",async()=>{await a.click(e.getByRole("button",{name:"応答 2を削除"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("2件の応答"),await t(e.queryByRole("button",{name:"応答 2を選択"})).not.toBeInTheDocument(),await a.click(e.getByRole("button",{name:"応答をすべて消去"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("0件の応答"),await t(e.getByLabelText("3番目のmessage content")).toBeVisible()})}},c={render:()=>s.jsx(p,{initialUrl:"/admin/ai-playground",initialDb:d("empty"),aiPlaygroundContainer:v("provider-error-once")}),play:async({canvasElement:n,step:o})=>{const e=u(n),i="古い天文台の扉を開けます。中の様子を教えてください。";await o("先に成功した応答を保持する",async()=>{await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答")}),await o("後続のProvider errorでも会話と成功済み応答を保持する",async()=>{await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByRole("alert")).toHaveTextContent("一時的に利用できません"),await t(e.getByLabelText("2番目のmessage content")).toHaveValue(i),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答"),await t(e.getByTestId("ai-playground-response-detail")).toHaveTextContent("扉の向こうには")}),await o("同じ履歴で再試行すると新しい応答だけを追加する",async()=>{await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("2件の応答")})}},l={play:async({canvasElement:n,step:o})=>{const e=u(n);await o("壊れたJSONを拒否して現在の履歴を残す",async()=>{await a.click(e.getByText("JSON import / export")),await a.click(e.getByLabelText("会話履歴import JSON")),await a.paste("{broken"),await a.click(e.getByRole("button",{name:"JSONを読み込む"})),await t(e.getByRole("alert")).toHaveTextContent("変更されていません"),await t(e.getByLabelText("2番目のmessage content")).toHaveValue("古い天文台の扉を開けます。中の様子を教えてください。")}),await o("空履歴では生成できない",async()=>{await a.click(e.getByRole("button",{name:"会話を全消去"})),await t(e.getByRole("button",{name:"次のassistant応答を生成"})).toBeDisabled(),await t(e.getByText(/会話履歴は空です/)).toBeVisible()})}},y={render:()=>s.jsx(p,{initialUrl:"/admin/ai-playground",initialDb:d("empty"),aiPlaygroundContainer:v("revision-conflict")}),play:async({canvasElement:n,step:o})=>{const e=u(n);await o("revision conflictを安全な再読込案内として表示する",async()=>{await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByRole("alert")).toHaveTextContent("最新情報を再読み込み"),await t(e.getByLabelText("2番目のmessage content")).toHaveValue("古い天文台の扉を開けます。中の様子を教えてください。")})}};var B,x,T;r.parameters={...r.parameters,docs:{...(B=r.parameters)==null?void 0:B.docs,source:{originalSource:`{
  name: '同じ会話から複数の応答候補を比較して管理する',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('3つのProfileから生成して3件の独立した応答を保持する', async () => {
      await expect(canvas.getByRole('main', {
        name: 'AI Conversation Playground'
      })).toBeVisible();
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await userEvent.selectOptions(canvas.getByLabelText('AI Profile'), 'story-local');
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await userEvent.selectOptions(canvas.getByLabelText('AI Profile'), 'runpod-llm');
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('3件の応答');
      await expect(canvas.getByRole('button', {
        name: '応答 1を選択'
      })).toBeVisible();
      await expect(canvas.getByRole('button', {
        name: '応答 2を選択'
      })).toBeVisible();
      await expect(canvas.getByRole('button', {
        name: '応答 3を選択'
      })).toHaveAttribute('aria-pressed', 'true');
      await expect(canvas.queryByLabelText('3番目のmessage content')).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole('button', {
        name: '会話を全消去'
      }));
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('3件の応答');
      await userEvent.click(canvas.getByRole('button', {
        name: 'サンプル初期化'
      }));
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('3件の応答');
    });
    await step('古い応答を選ぶと本文とmetadataが切り替わる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '応答 1を選択'
      }));
      await expect(canvas.getByTestId('ai-playground-response-detail')).toHaveTextContent('扉の向こうには');
      await expect(canvas.getByTestId('ai-playground-response-detail')).toHaveTextContent('gpt-story-mini');
      await expect(canvas.getByTestId('ai-playground-response-detail')).toHaveTextContent('48 in / 24 out');
    });
    await step('選択した応答だけを会話履歴へ明示的に追加する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '選択した応答を会話へ追加'
      }));
      await expect(canvas.getByLabelText('3番目のmessage content')).toHaveValue('扉の向こうには、止まった星時計と青い観測記録が静かに並んでいます。');
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('3件の応答');
    });
    await step('1件を削除してから全応答を明示的に消去する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '応答 2を削除'
      }));
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('2件の応答');
      await expect(canvas.queryByRole('button', {
        name: '応答 2を選択'
      })).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole('button', {
        name: '応答をすべて消去'
      }));
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('0件の応答');
      await expect(canvas.getByLabelText('3番目のmessage content')).toBeVisible();
    });
  }
}`,...(T=(x=r.parameters)==null?void 0:x.docs)==null?void 0:T.source}}};var b,R,C;c.parameters={...c.parameters,docs:{...(b=c.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => <MyrialeApp initialUrl="/admin/ai-playground" initialDb={createDemoDb('empty')} aiPlaygroundContainer={containerFor('provider-error-once')} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const before = '古い天文台の扉を開けます。中の様子を教えてください。';
    await step('先に成功した応答を保持する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('1件の応答');
    });
    await step('後続のProvider errorでも会話と成功済み応答を保持する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await expect(canvas.getByRole('alert')).toHaveTextContent('一時的に利用できません');
      await expect(canvas.getByLabelText('2番目のmessage content')).toHaveValue(before);
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('1件の応答');
      await expect(canvas.getByTestId('ai-playground-response-detail')).toHaveTextContent('扉の向こうには');
    });
    await step('同じ履歴で再試行すると新しい応答だけを追加する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      }));
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('2件の応答');
    });
  }
}`,...(C=(R=c.parameters)==null?void 0:R.docs)==null?void 0:C.source}}};var H,k,I;l.parameters={...l.parameters,docs:{...(H=l.parameters)==null?void 0:H.docs,source:{originalSource:`{
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
        name: '会話を全消去'
      }));
      await expect(canvas.getByRole('button', {
        name: '次のassistant応答を生成'
      })).toBeDisabled();
      await expect(canvas.getByText(/会話履歴は空です/)).toBeVisible();
    });
  }
}`,...(I=(k=l.parameters)==null?void 0:k.docs)==null?void 0:I.source}}};var f,E,P;y.parameters={...y.parameters,docs:{...(f=y.parameters)==null?void 0:f.docs,source:{originalSource:`{
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
}`,...(P=(E=y.parameters)==null?void 0:E.docs)==null?void 0:P.source}}};const ie=["BuildAndGenerateConversation","ProviderErrorPreservesHistory","InvalidImportAndEmptyHistory","RevisionConflictRequestsReview"];export{r as BuildAndGenerateConversation,l as InvalidImportAndEmptyHistory,c as ProviderErrorPreservesHistory,y as RevisionConflictRequestsReview,ie as __namedExportsOrder,se as default};
