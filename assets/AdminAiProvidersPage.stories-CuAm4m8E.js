import{w as r,e as t,u as a}from"./index-C4S39nCK.js";import{A as p}from"./AdminAiProvidersPage-uBwKPNeh.js";/* empty css               */import"./jsx-runtime-BO8uF4Og.js";import"./index-D4H_InIO.js";import"./Surfaces-hfywbPiG.js";import"./AppChrome-BVHByNfO.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-CSioTFV0.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CZ4CxpT9.js";const I={title:"運用/AI Provider administration",component:p,parameters:{notes:"Profile定義とCredential secretを分離し、revision付きの破壊的操作とprofile-scoped testを確認するStoryです。"}},n={play:async({canvasElement:l,step:i})=>{const e=r(l);await i("ProfileとCredentialが独立した一覧として表示される",async()=>{await t(await e.findByTestId("ai-profile-row-openai")).toBeVisible(),await t(await e.findByTestId("ai-credential-row-runpod")).toBeVisible(),await t(e.getByTestId("ai-profile-row-runpod")).toHaveTextContent("r1")}),await i("Credentialを置換するとrevisionを保持して更新する",async()=>{const o=r(e.getByTestId("ai-credential-row-runpod"));await a.click(o.getByRole("button",{name:"置換"})),await a.type(e.getByLabelText("Credential Secret"),"replacement-secret"),await a.click(e.getByRole("button",{name:"Credentialを保存"})),await t(await e.findByTestId("ai-credential-row-runpod")).toHaveTextContent("r2")}),await i("Profile-scoped connection testを実行する",async()=>{const o=r(e.getByTestId("ai-profile-row-runpod"));await a.click(o.getByRole("button",{name:"接続テスト"})),await t(e.getByTestId("ai-admin-notice")).toHaveTextContent("接続テストを完了しました")})}};var s,c,d;n.parameters={...n.parameters,docs:{...(s=n.parameters)==null?void 0:s.docs,source:{originalSource:`{
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('ProfileとCredentialが独立した一覧として表示される', async () => {
      await expect(await canvas.findByTestId('ai-profile-row-openai')).toBeVisible();
      await expect(await canvas.findByTestId('ai-credential-row-runpod')).toBeVisible();
      await expect(canvas.getByTestId('ai-profile-row-runpod')).toHaveTextContent('r1');
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
      const profile = within(canvas.getByTestId('ai-profile-row-runpod'));
      await userEvent.click(profile.getByRole('button', {
        name: '接続テスト'
      }));
      await expect(canvas.getByTestId('ai-admin-notice')).toHaveTextContent('接続テストを完了しました');
    });
  }
}`,...(d=(c=n.parameters)==null?void 0:c.docs)==null?void 0:d.source}}};const b=["SplitProfileAndCredentialManagement"];export{n as SplitProfileAndCredentialManagement,b as __namedExportsOrder,I as default};
