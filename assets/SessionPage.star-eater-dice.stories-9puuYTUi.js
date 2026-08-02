import{j as n}from"./jsx-runtime-BO8uF4Og.js";import{w as u,e}from"./index-C4S39nCK.js";import{a as v}from"./SessionPresentation-BVDUG1BA.js";/* empty css               */import"./index-D4H_InIO.js";import"./Surfaces-xpIMDkG0.js";import"./SessionIcons-yGOCmQwo.js";import"./AppChrome-CqlUs9ri.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-nBW4_8Wv.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CLGgTteF.js";import"./SessionTurn-9KUaF1pl.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./SessionActivityFeed-COgkAg7K.js";const y=async()=>({ok:!0,notice:"ok"}),h={title:"デモ/星喰いの地下図書館/星座の扉判定",component:v,args:{sessionId:"SES-STAR-EATER-DICE",account:null,sessionStateLabel:"Active",turns:[{id:1,turnTitle:"閉じた星座の扉",narrative:"銀の鍵を差し込み、星図灯を掲げると扉の星々が判定を要求した。",kind:"action"}],headingLinks:[{title:"閉じた星座の扉",startTurnId:1,summary:"判定開始地点"}],aiProfiles:[{id:"runpod-recommended",displayName:"推奨（Deckard 40B AWQ）"},{id:"runpod-economy",displayName:"最安（Qwen2.5 14B Abliterated AWQ）"}],defaultActionDecisionAiProfileId:"runpod-recommended",defaultNarrativeAiProfileId:"runpod-recommended",onSubmit:y,onRecommend:async()=>({ok:!0,value:"星図を調べる",notice:"ok"})}},o={args:{activeManualActionPanel:n.jsxs("section",{"data-testid":"active-module-turn","aria-label":"現在のモジュール判定",children:[n.jsx("strong",{children:"列挙済みアクション: 星図灯を掲げる"}),n.jsx("p",{children:"対象ObjectとActionはScenario Turnが確定済みです。"}),n.jsx("button",{type:"button",children:"判定する"})]})},play:async({canvasElement:r,step:a})=>{const t=u(r);await a("Narrativeから判定のForced Modeへ移行し、現在の目的を表示する",async()=>{await e(t.getByTestId("active-module-turn")).toHaveTextContent("閉じた星座"),await e(t.getByTestId("mode-badge")).toHaveTextContent("判定中")}),await a("判定中は通常の自由入力を無効化する",async()=>{await e(t.getByLabelText("自由に行動や会話を入力")).toBeDisabled(),await e(t.getByTestId("input-disabled-reason")).toHaveTextContent("自由入力")})}},i={args:{committedStateNarrativePending:!0},play:async({canvasElement:r,step:a})=>{const t=u(r);await a("再読み込み後も確定済みObject状態を失わずNarrative生成待ちを表示する",async()=>{await e(t.getByTestId("committed-state-narrative-pending")).toHaveTextContent("状態、配置、適用結果はすでに保存"),await e(t.getByLabelText("自由に行動や会話を入力")).toBeDisabled()})}};var s,c,d;o.parameters={...o.parameters,docs:{...(s=o.parameters)==null?void 0:s.docs,source:{originalSource:`{
  args: {
    activeManualActionPanel: <section data-testid="active-module-turn" aria-label="現在のモジュール判定"><strong>列挙済みアクション: 星図灯を掲げる</strong><p>対象ObjectとActionはScenario Turnが確定済みです。</p><button type="button">判定する</button></section>
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('Narrativeから判定のForced Modeへ移行し、現在の目的を表示する', async () => {
      await expect(canvas.getByTestId('active-module-turn')).toHaveTextContent('閉じた星座');
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('判定中');
    });
    await step('判定中は通常の自由入力を無効化する', async () => {
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
      await expect(canvas.getByTestId('input-disabled-reason')).toHaveTextContent('自由入力');
    });
  }
}`,...(d=(c=o.parameters)==null?void 0:c.docs)==null?void 0:d.source}}};var m,p,l;i.parameters={...i.parameters,docs:{...(m=i.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    committedStateNarrativePending: true
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('再読み込み後も確定済みObject状態を失わずNarrative生成待ちを表示する', async () => {
      await expect(canvas.getByTestId('committed-state-narrative-pending')).toHaveTextContent('状態、配置、適用結果はすでに保存');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
    });
  }
}`,...(l=(p=i.parameters)==null?void 0:p.docs)==null?void 0:l.source}}};const H=["ActiveManualObjectAction","CommittedStateNarrativePending"];export{o as ActiveManualObjectAction,i as CommittedStateNarrativePending,H as __namedExportsOrder,h as default};
