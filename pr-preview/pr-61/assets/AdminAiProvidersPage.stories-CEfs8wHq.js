import{w as o,e as a,u as t}from"./index-C4S39nCK.js";import{A as y}from"./AdminAiProvidersPage-VOYqhWuN.js";/* empty css               */import"./jsx-runtime-BO8uF4Og.js";import"./index-D4H_InIO.js";import"./Surfaces-hfywbPiG.js";import"./AppChrome-B2qQgyKk.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-CSioTFV0.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CZ4CxpT9.js";const b={title:"運用/AI Provider administration",component:y,parameters:{notes:"Profile定義とCredential secretを分離し、revision付きの破壊的操作とprofile-scoped testを確認するStoryです。"}},r={play:async({canvasElement:p,step:i})=>{const e=o(p);await i("ProfileとCredentialが独立した一覧として表示される",async()=>{await a(await e.findByTestId("ai-profile-card-openai")).toBeVisible(),await a(await e.findByTestId("ai-credential-row-runpod")).toBeVisible(),await a(e.getByTestId("ai-profile-card-runpod")).toHaveTextContent("r1")}),await i("Deployment ProfileをDB定義として上書きする",async()=>{const n=o(e.getByTestId("ai-profile-card-openai"));await t.click(n.getByRole("button",{name:"DBで上書き"})),await a(e.getByLabelText("Profile ID")).toHaveValue("openai"),await a(e.getByTestId("ai-admin-notice")).toHaveTextContent("「Profileを保存」を押してください"),await t.click(e.getByRole("button",{name:"DB上書きを保存"})),await a(await e.findByTestId("ai-profile-card-openai")).toHaveTextContent("database")}),await i("AIごとの追加システムプロンプトを編集して保存する",async()=>{const n=o(e.getByTestId("ai-profile-card-runpod"));await t.click(n.getByRole("button",{name:"編集"}));const c=e.getByLabelText("Profile追加システムプロンプト");await t.clear(c),await t.type(c,"直前の行動から自然につなぎ、情景と仕草を小説風に描く。"),await t.click(e.getByRole("button",{name:"Profileを保存"})),await a(await e.findByTestId("ai-profile-card-runpod")).toHaveTextContent("r2")}),await i("Credentialを置換するとrevisionを保持して更新する",async()=>{const n=o(e.getByTestId("ai-credential-row-runpod"));await t.click(n.getByRole("button",{name:"置換"})),await t.type(e.getByLabelText("Credential Secret"),"replacement-secret"),await t.click(e.getByRole("button",{name:"Credentialを保存"})),await a(await e.findByTestId("ai-credential-row-runpod")).toHaveTextContent("r2")}),await i("Profile-scoped connection testを実行する",async()=>{const n=o(e.getByTestId("ai-profile-card-runpod"));await t.click(n.getByRole("button",{name:"接続テスト"})),await a(e.getByTestId("ai-admin-notice")).toHaveTextContent("接続テストを完了しました")})}};var s,l,d;r.parameters={...r.parameters,docs:{...(s=r.parameters)==null?void 0:s.docs,source:{originalSource:`{
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ProfileとCredentialが独立した一覧として表示される', async () => {
      await expect(await canvas.findByTestId('ai-profile-card-openai')).toBeVisible();
      await expect(await canvas.findByTestId('ai-credential-row-runpod')).toBeVisible();
      await expect(canvas.getByTestId('ai-profile-card-runpod')).toHaveTextContent('r1');
    });
    await step('Deployment ProfileをDB定義として上書きする', async () => {
      const deploymentProfile = within(canvas.getByTestId('ai-profile-card-openai'));
      await userEvent.click(deploymentProfile.getByRole('button', {
        name: 'DBで上書き'
      }));
      await expect(canvas.getByLabelText('Profile ID')).toHaveValue('openai');
      await expect(canvas.getByTestId('ai-admin-notice')).toHaveTextContent('「Profileを保存」を押してください');
      await userEvent.click(canvas.getByRole('button', {
        name: 'DB上書きを保存'
      }));
      await expect(await canvas.findByTestId('ai-profile-card-openai')).toHaveTextContent('database');
    });
    await step('AIごとの追加システムプロンプトを編集して保存する', async () => {
      const profile = within(canvas.getByTestId('ai-profile-card-runpod'));
      await userEvent.click(profile.getByRole('button', {
        name: '編集'
      }));
      const systemPrompt = canvas.getByLabelText('Profile追加システムプロンプト');
      await userEvent.clear(systemPrompt);
      await userEvent.type(systemPrompt, '直前の行動から自然につなぎ、情景と仕草を小説風に描く。');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Profileを保存'
      }));
      await expect(await canvas.findByTestId('ai-profile-card-runpod')).toHaveTextContent('r2');
    });
    await step('Credentialを置換するとrevisionを保持して更新する', async () => {
      const credential = within(canvas.getByTestId('ai-credential-row-runpod'));
      await userEvent.click(credential.getByRole('button', {
        name: '置換'
      }));
      await userEvent.type(canvas.getByLabelText('Credential Secret'), 'replacement-secret');
      await userEvent.click(canvas.getByRole('button', {
        name: 'Credentialを保存'
      }));
      await expect(await canvas.findByTestId('ai-credential-row-runpod')).toHaveTextContent('r2');
    });
    await step('Profile-scoped connection testを実行する', async () => {
      const profile = within(canvas.getByTestId('ai-profile-card-runpod'));
      await userEvent.click(profile.getByRole('button', {
        name: '接続テスト'
      }));
      await expect(canvas.getByTestId('ai-admin-notice')).toHaveTextContent('接続テストを完了しました');
    });
  }
}`,...(d=(l=r.parameters)==null?void 0:l.docs)==null?void 0:d.source}}};const C=["SplitProfileAndCredentialManagement"];export{r as SplitProfileAndCredentialManagement,C as __namedExportsOrder,b as default};
