import{j as s}from"./jsx-runtime-BO8uF4Og.js";import{w as i,u as a,e as t}from"./index-C4S39nCK.js";import{A as S,M as u}from"./MyrialeApp-BdZqP98J.js";import{c as d}from"./SessionPresentation-DGHeCpe_.js";import{r as N}from"./index-D4H_InIO.js";/* empty css               */import"./AdminAiProvidersPage-DTVL3kaI.js";import"./Surfaces-hfywbPiG.js";import"./AppChrome-CaJxHzCb.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-DBs-w9aD.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-d7jVExt_.js";import"./ConditionTablePresentation-JmdLPG0b.js";import"./EditPane-DyZaeiBP.js";import"./scenarioWizardStyles-CPcslTFI.js";import"./NarrativeBody-4Kg13oE8.js";import"./ModuleUiHost-CQPmid6l.js";import"./TurnInspectionPresentation-CerC6ryl.js";import"./account-Bdcpq1bL.js";import"./SessionListPresentation-CV3LYKA6.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-UcBTXClw.js";import"./SessionActivityFeed-B0l1fOng.js";const g=[{id:"story-openai",displayName:"Story OpenAI",model:"gpt-story-mini",revision:4,credentialRevision:2},{id:"story-local",displayName:"Story Local",model:"qwen-story-8b",revision:7,credentialRevision:5},{id:"runpod-llm",displayName:"LLM（Deckard 40B GGUF）",model:"DavidAU/Qwen3.6-40B-Claude-4.6-Opus-Deckard-Heretic-Uncensored-Thinking-NEO-CODE-Di-IMatrix-MAX-GGUF",revision:0,credentialRevision:0}],M={"story-openai":"扉の向こうには、止まった星時計と青い観測記録が静かに並んでいます。","story-local":"古いドームの隙間から月光が差し、中央の望遠鏡だけがゆっくり北を向きます。","runpod-llm":"星時計の針が淡く発光し、閉ざされていた観測窓がゆっくりと夜空へ開きます。"};function h(o){const n=g.find(e=>e.id===o);return{provider:o,model:n.model,responseId:`response-${o}`,requestId:`request-${o}`,inputTokens:48,outputTokens:24,latencyMilliseconds:o==="story-openai"?180:o==="story-local"?320:640,attemptCount:1,finishReason:"stop"}}function V({scenario:o="success"}){const n=N.useRef(0),e=async D=>{if(n.current+=1,o==="provider-error-once"&&n.current===2)return{ok:!1,message:"Providerが一時的に利用できません。すべての会話と生成済み応答を保持したまま再試行できます。"};if(o==="revision-conflict")return{ok:!1,message:"AI ProfileまたはCredentialが更新されました。最新情報を再読み込みしたため、内容を確認して再実行してください。",action:"reload"};const w=D;return{ok:!0,message:"次のassistant応答を生成しました。",value:{message:{role:"assistant",content:M[w]},metadata:h(w)}}};return s.jsx(S,{account:{name:"運用管理者",email:"admin@myriale.example",initials:"運管",role:"AI管理者"},state:{status:"ready",profiles:g,defaultProfileId:g[0].id},actions:{generate:e,retry:()=>{},logout:()=>{}}})}V.__docgenInfo={description:"",methods:[],displayName:"MockAiPlaygroundContainer",props:{scenario:{required:!1,tsType:{name:"union",raw:'"success" | "provider-error-once" | "revision-conflict"',elements:[{name:"literal",value:'"success"'},{name:"literal",value:'"provider-error-once"'},{name:"literal",value:'"revision-conflict"'}]},description:"",defaultValue:{value:'"success"',computed:!1}}}};const m=o=>()=>s.jsx(V,{scenario:o}),le={title:"ユーザーストーリー/AI Conversation Playground",component:u,render:()=>s.jsx(u,{initialUrl:"/admin/ai-playground",initialDb:d("empty"),aiPlaygroundContainer:m("success")})};async function v(o,n){const e=o.getByLabelText("選択中の会話名");await a.clear(e),await a.type(e,n)}const c={name:"複数の会話コンテキストと応答を独立して管理する",play:async({canvasElement:o,step:n})=>{const e=i(o);await n("最初の会話を命名し、OpenAI Profileで応答を生成する",async()=>{await t(e.getByRole("main",{name:"AI Conversation Playground"})).toBeVisible(),await v(e,"天文台"),await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答"),await t(e.getByTestId("ai-playground-response-detail")).toHaveTextContent("扉の向こうには")}),await n("2つ目の会話を作り、別Profileから異なる応答セットを生成する",async()=>{await a.click(e.getByRole("button",{name:"新しい会話"})),await v(e,"月面基地"),await a.selectOptions(e.getByLabelText("AI Profile"),"story-local"),await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await a.selectOptions(e.getByLabelText("AI Profile"),"runpod-llm"),await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("2件の応答"),await t(e.getByTestId("ai-playground-response-detail")).toHaveTextContent("星時計の針")}),await n("切り替えると最初の会話のProfile・応答・選択が復元される",async()=>{await a.click(e.getByRole("button",{name:"天文台を選択"})),await t(e.getByLabelText("AI Profile")).toHaveValue("story-openai"),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答"),await t(e.getByTestId("ai-playground-response-detail")).toHaveTextContent("扉の向こうには")}),await n("選択した応答だけを現在の会話へ追加する",async()=>{await a.click(e.getByRole("button",{name:"選択した応答を会話へ追加"})),await t(e.getByLabelText("3番目のmessage content")).toHaveValue("扉の向こうには、止まった星時計と青い観測記録が静かに並んでいます。"),await a.click(e.getByRole("button",{name:"月面基地を選択"})),await t(e.queryByLabelText("3番目のmessage content")).not.toBeInTheDocument(),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("2件の応答")}),await n("複製後の応答削除は元の会話へ影響しない",async()=>{await a.click(e.getByRole("button",{name:"天文台を選択"})),await a.click(e.getByRole("button",{name:"現在の会話を複製"})),await t(e.getByLabelText("選択中の会話名")).toHaveValue("天文台 copy"),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答"),await a.click(e.getByRole("button",{name:"応答 1を削除"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("0件の応答"),await a.click(e.getByRole("button",{name:"天文台を選択"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答"),await t(e.getByLabelText("3番目のmessage content")).toBeVisible()}),await n("現在の会話を削除すると隣の会話へ安全にフォールバックする",async()=>{await a.click(e.getByRole("button",{name:"天文台を削除"})),await t(e.getByLabelText("選択中の会話名")).toHaveValue("月面基地"),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("2件の応答")})}},r={name:"会話内で応答の選択・個別削除・全消去を管理する",play:async({canvasElement:o,step:n})=>{const e=i(o);await n("3つのProfileから応答候補を生成する",async()=>{await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await a.selectOptions(e.getByLabelText("AI Profile"),"story-local"),await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await a.selectOptions(e.getByLabelText("AI Profile"),"runpod-llm"),await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("3件の応答")}),await n("古い応答を選ぶと本文とmetadataが切り替わる",async()=>{await a.click(e.getByRole("button",{name:"応答 1を選択"})),await t(e.getByTestId("ai-playground-response-detail")).toHaveTextContent("扉の向こうには"),await t(e.getByTestId("ai-playground-response-detail")).toHaveTextContent("gpt-story-mini")}),await n("個別削除と全消去は現在の会話だけに適用される",async()=>{await a.click(e.getByRole("button",{name:"応答 2を削除"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("2件の応答"),await a.click(e.getByRole("button",{name:"応答をすべて消去"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("0件の応答"),await t(e.getByLabelText("2番目のmessage content")).toBeVisible()})}},l={render:()=>s.jsx(u,{initialUrl:"/admin/ai-playground",initialDb:d("empty"),aiPlaygroundContainer:m("provider-error-once")}),play:async({canvasElement:o,step:n})=>{const e=i(o);await n("最初の会話に成功した応答を保持する",async()=>{await v(e,"成功済み"),await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答")}),await n("別会話のProvider errorでも両方の会話が残る",async()=>{await a.click(e.getByRole("button",{name:"新しい会話"})),await v(e,"再試行対象"),await a.selectOptions(e.getByLabelText("AI Profile"),"story-local"),await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByRole("alert")).toHaveTextContent("すべての会話"),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("0件の応答"),await t(e.getByLabelText("2番目のmessage content")).toHaveValue("古い天文台の扉を開けます。中の様子を教えてください。"),await a.click(e.getByRole("button",{name:"成功済みを選択"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答"),await t(e.getByTestId("ai-playground-response-detail")).toHaveTextContent("扉の向こうには")}),await n("失敗した会話へ戻って再試行できる",async()=>{await a.click(e.getByRole("button",{name:"再試行対象を選択"})),await t(e.getByLabelText("AI Profile")).toHaveValue("story-local"),await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答"),await t(e.getByTestId("ai-playground-response-detail")).toHaveTextContent("古いドーム")})}},y={play:async({canvasElement:o,step:n})=>{const e=i(o);await n("壊れたJSONを拒否して現在の履歴を残す",async()=>{await a.click(e.getByText("JSON import / export")),await a.click(e.getByLabelText("会話履歴import JSON")),await a.paste("{broken"),await a.click(e.getByRole("button",{name:"JSONを読み込む"})),await t(e.getByRole("alert")).toHaveTextContent("変更されていません"),await t(e.getByLabelText("2番目のmessage content")).toHaveValue("古い天文台の扉を開けます。中の様子を教えてください。")}),await n("空履歴では生成できない",async()=>{await a.click(e.getByRole("button",{name:"会話を全消去"})),await t(e.getByRole("button",{name:"次のassistant応答を生成"})).toBeDisabled(),await t(e.getByText(/会話履歴は空です/)).toBeVisible()})}},p={render:()=>s.jsx(u,{initialUrl:"/admin/ai-playground",initialDb:d("empty"),aiPlaygroundContainer:m("revision-conflict")}),play:async({canvasElement:o,step:n})=>{const e=i(o);await n("revision conflictを安全な再読込案内として表示する",async()=>{await a.click(e.getByRole("button",{name:"次のassistant応答を生成"})),await t(e.getByRole("alert")).toHaveTextContent("最新情報を再読み込み"),await t(e.getByLabelText("2番目のmessage content")).toHaveValue("古い天文台の扉を開けます。中の様子を教えてください。")})}};var B,x,T;c.parameters={...c.parameters,docs:{...(B=c.parameters)==null?void 0:B.docs,source:{originalSource:`{
  name: "複数の会話コンテキストと応答を独立して管理する",
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step("最初の会話を命名し、OpenAI Profileで応答を生成する", async () => {
      await expect(canvas.getByRole("main", {
        name: "AI Conversation Playground"
      })).toBeVisible();
      await renameActiveConversation(canvas, "天文台");
      await userEvent.click(canvas.getByRole("button", {
        name: "次のassistant応答を生成"
      }));
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答");
      await expect(canvas.getByTestId("ai-playground-response-detail")).toHaveTextContent("扉の向こうには");
    });
    await step("2つ目の会話を作り、別Profileから異なる応答セットを生成する", async () => {
      await userEvent.click(canvas.getByRole("button", {
        name: "新しい会話"
      }));
      await renameActiveConversation(canvas, "月面基地");
      await userEvent.selectOptions(canvas.getByLabelText("AI Profile"), "story-local");
      await userEvent.click(canvas.getByRole("button", {
        name: "次のassistant応答を生成"
      }));
      await userEvent.selectOptions(canvas.getByLabelText("AI Profile"), "runpod-llm");
      await userEvent.click(canvas.getByRole("button", {
        name: "次のassistant応答を生成"
      }));
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("2件の応答");
      await expect(canvas.getByTestId("ai-playground-response-detail")).toHaveTextContent("星時計の針");
    });
    await step("切り替えると最初の会話のProfile・応答・選択が復元される", async () => {
      await userEvent.click(canvas.getByRole("button", {
        name: "天文台を選択"
      }));
      await expect(canvas.getByLabelText("AI Profile")).toHaveValue("story-openai");
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答");
      await expect(canvas.getByTestId("ai-playground-response-detail")).toHaveTextContent("扉の向こうには");
    });
    await step("選択した応答だけを現在の会話へ追加する", async () => {
      await userEvent.click(canvas.getByRole("button", {
        name: "選択した応答を会話へ追加"
      }));
      await expect(canvas.getByLabelText("3番目のmessage content")).toHaveValue("扉の向こうには、止まった星時計と青い観測記録が静かに並んでいます。");
      await userEvent.click(canvas.getByRole("button", {
        name: "月面基地を選択"
      }));
      await expect(canvas.queryByLabelText("3番目のmessage content")).not.toBeInTheDocument();
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("2件の応答");
    });
    await step("複製後の応答削除は元の会話へ影響しない", async () => {
      await userEvent.click(canvas.getByRole("button", {
        name: "天文台を選択"
      }));
      await userEvent.click(canvas.getByRole("button", {
        name: "現在の会話を複製"
      }));
      await expect(canvas.getByLabelText("選択中の会話名")).toHaveValue("天文台 copy");
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答");
      await userEvent.click(canvas.getByRole("button", {
        name: "応答 1を削除"
      }));
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("0件の応答");
      await userEvent.click(canvas.getByRole("button", {
        name: "天文台を選択"
      }));
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答");
      await expect(canvas.getByLabelText("3番目のmessage content")).toBeVisible();
    });
    await step("現在の会話を削除すると隣の会話へ安全にフォールバックする", async () => {
      await userEvent.click(canvas.getByRole("button", {
        name: "天文台を削除"
      }));
      await expect(canvas.getByLabelText("選択中の会話名")).toHaveValue("月面基地");
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("2件の応答");
    });
  }
}`,...(T=(x=c.parameters)==null?void 0:x.docs)==null?void 0:T.source}}};var b,R,C;r.parameters={...r.parameters,docs:{...(b=r.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: "会話内で応答の選択・個別削除・全消去を管理する",
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step("3つのProfileから応答候補を生成する", async () => {
      await userEvent.click(canvas.getByRole("button", {
        name: "次のassistant応答を生成"
      }));
      await userEvent.selectOptions(canvas.getByLabelText("AI Profile"), "story-local");
      await userEvent.click(canvas.getByRole("button", {
        name: "次のassistant応答を生成"
      }));
      await userEvent.selectOptions(canvas.getByLabelText("AI Profile"), "runpod-llm");
      await userEvent.click(canvas.getByRole("button", {
        name: "次のassistant応答を生成"
      }));
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("3件の応答");
    });
    await step("古い応答を選ぶと本文とmetadataが切り替わる", async () => {
      await userEvent.click(canvas.getByRole("button", {
        name: "応答 1を選択"
      }));
      await expect(canvas.getByTestId("ai-playground-response-detail")).toHaveTextContent("扉の向こうには");
      await expect(canvas.getByTestId("ai-playground-response-detail")).toHaveTextContent("gpt-story-mini");
    });
    await step("個別削除と全消去は現在の会話だけに適用される", async () => {
      await userEvent.click(canvas.getByRole("button", {
        name: "応答 2を削除"
      }));
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("2件の応答");
      await userEvent.click(canvas.getByRole("button", {
        name: "応答をすべて消去"
      }));
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("0件の応答");
      await expect(canvas.getByLabelText("2番目のmessage content")).toBeVisible();
    });
  }
}`,...(C=(R=r.parameters)==null?void 0:R.docs)==null?void 0:C.source}}};var I,k,H;l.parameters={...l.parameters,docs:{...(I=l.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <MyrialeApp initialUrl="/admin/ai-playground" initialDb={createDemoDb("empty")} aiPlaygroundContainer={containerFor("provider-error-once")} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step("最初の会話に成功した応答を保持する", async () => {
      await renameActiveConversation(canvas, "成功済み");
      await userEvent.click(canvas.getByRole("button", {
        name: "次のassistant応答を生成"
      }));
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答");
    });
    await step("別会話のProvider errorでも両方の会話が残る", async () => {
      await userEvent.click(canvas.getByRole("button", {
        name: "新しい会話"
      }));
      await renameActiveConversation(canvas, "再試行対象");
      await userEvent.selectOptions(canvas.getByLabelText("AI Profile"), "story-local");
      await userEvent.click(canvas.getByRole("button", {
        name: "次のassistant応答を生成"
      }));
      await expect(canvas.getByRole("alert")).toHaveTextContent("すべての会話");
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("0件の応答");
      await expect(canvas.getByLabelText("2番目のmessage content")).toHaveValue("古い天文台の扉を開けます。中の様子を教えてください。");
      await userEvent.click(canvas.getByRole("button", {
        name: "成功済みを選択"
      }));
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答");
      await expect(canvas.getByTestId("ai-playground-response-detail")).toHaveTextContent("扉の向こうには");
    });
    await step("失敗した会話へ戻って再試行できる", async () => {
      await userEvent.click(canvas.getByRole("button", {
        name: "再試行対象を選択"
      }));
      await expect(canvas.getByLabelText("AI Profile")).toHaveValue("story-local");
      await userEvent.click(canvas.getByRole("button", {
        name: "次のassistant応答を生成"
      }));
      await expect(canvas.getByTestId("ai-playground-response-count")).toHaveTextContent("1件の応答");
      await expect(canvas.getByTestId("ai-playground-response-detail")).toHaveTextContent("古いドーム");
    });
  }
}`,...(H=(k=l.parameters)==null?void 0:k.docs)==null?void 0:H.source}}};var E,f,P;y.parameters={...y.parameters,docs:{...(E=y.parameters)==null?void 0:E.docs,source:{originalSource:`{
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step("壊れたJSONを拒否して現在の履歴を残す", async () => {
      await userEvent.click(canvas.getByText("JSON import / export"));
      await userEvent.click(canvas.getByLabelText("会話履歴import JSON"));
      await userEvent.paste("{broken");
      await userEvent.click(canvas.getByRole("button", {
        name: "JSONを読み込む"
      }));
      await expect(canvas.getByRole("alert")).toHaveTextContent("変更されていません");
      await expect(canvas.getByLabelText("2番目のmessage content")).toHaveValue("古い天文台の扉を開けます。中の様子を教えてください。");
    });
    await step("空履歴では生成できない", async () => {
      await userEvent.click(canvas.getByRole("button", {
        name: "会話を全消去"
      }));
      await expect(canvas.getByRole("button", {
        name: "次のassistant応答を生成"
      })).toBeDisabled();
      await expect(canvas.getByText(/会話履歴は空です/)).toBeVisible();
    });
  }
}`,...(P=(f=y.parameters)==null?void 0:f.docs)==null?void 0:P.source}}};var A,L,O;p.parameters={...p.parameters,docs:{...(A=p.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => <MyrialeApp initialUrl="/admin/ai-playground" initialDb={createDemoDb("empty")} aiPlaygroundContainer={containerFor("revision-conflict")} />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step("revision conflictを安全な再読込案内として表示する", async () => {
      await userEvent.click(canvas.getByRole("button", {
        name: "次のassistant応答を生成"
      }));
      await expect(canvas.getByRole("alert")).toHaveTextContent("最新情報を再読み込み");
      await expect(canvas.getByLabelText("2番目のmessage content")).toHaveValue("古い天文台の扉を開けます。中の様子を教えてください。");
    });
  }
}`,...(O=(L=p.parameters)==null?void 0:L.docs)==null?void 0:O.source}}};const ye=["ManageIndependentConversations","ResponseSelectionAndClearing","ProviderErrorPreservesAllConversations","InvalidImportAndEmptyHistory","RevisionConflictRequestsReview"];export{y as InvalidImportAndEmptyHistory,c as ManageIndependentConversations,l as ProviderErrorPreservesAllConversations,r as ResponseSelectionAndClearing,p as RevisionConflictRequestsReview,ye as __namedExportsOrder,le as default};
