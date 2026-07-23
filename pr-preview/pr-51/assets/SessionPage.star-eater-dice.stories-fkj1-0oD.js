import{j as n}from"./jsx-runtime-BO8uF4Og.js";import{w as u,e as t}from"./index-C4S39nCK.js";import{a as v}from"./SessionPresentation-B-rbd35n.js";/* empty css               */import"./index-D4H_InIO.js";import"./Surfaces-xpIMDkG0.js";import"./SessionIcons-yGOCmQwo.js";import"./AppChrome-BVr8BnXp.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BJ2tbK4f.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CtcPHE9S.js";import"./SessionTurn-9KUaF1pl.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./SessionActivityFeed-CMz3MXAB.js";const g=async()=>({ok:!0,notice:"ok"}),j={title:"デモ/星喰いの地下図書館/星座の扉判定",component:v,args:{sessionId:"SES-STAR-EATER-DICE",account:null,sessionStateLabel:"Active",turns:[{id:1,turnTitle:"閉じた星座の扉",narrative:"銀の鍵を差し込み、星図灯を掲げると扉の星々が判定を要求した。",kind:"action"}],headingLinks:[{title:"閉じた星座の扉",startTurnId:1,summary:"判定開始地点"}],onSubmit:g,onRecommend:async()=>({ok:!0,value:"星図を調べる",notice:"ok"})}},o={args:{activeModulePanel:n.jsxs("section",{"data-testid":"active-module-turn","aria-label":"現在のモジュール判定",children:[n.jsx("strong",{children:"銀の鍵と星図灯で『閉じた星座』の扉を開く"}),n.jsx("p",{children:"1d20 / 目標値13 / 補正+2"}),n.jsx("button",{type:"button",children:"星図灯を掲げて判定する"})]})},play:async({canvasElement:i,step:a})=>{const e=u(i);await a("Narrativeから判定のForced Modeへ移行し、現在の目的を表示する",async()=>{await t(e.getByTestId("active-module-turn")).toHaveTextContent("閉じた星座"),await t(e.getByTestId("mode-badge")).toHaveTextContent("判定中")}),await a("判定中は通常の自由入力を無効化する",async()=>{await t(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled(),await t(e.getByTestId("input-disabled-reason")).toHaveTextContent("自由入力")})}},s={args:{moduleHandoffPending:!0},play:async({canvasElement:i,step:a})=>{const e=u(i);await a("再読み込み後も保存済み結果を失わずNarrative handoff待ちを表示する",async()=>{await t(e.getByTestId("module-handoff-pending")).toHaveTextContent("ダイス結果とSession Effectは保存済み"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled()})}};var r,c,d;o.parameters={...o.parameters,docs:{...(r=o.parameters)==null?void 0:r.docs,source:{originalSource:`{
  args: {
    activeModulePanel: <section data-testid="active-module-turn" aria-label="現在のモジュール判定"><strong>銀の鍵と星図灯で『閉じた星座』の扉を開く</strong><p>1d20 / 目標値13 / 補正+2</p><button type="button">星図灯を掲げて判定する</button></section>
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
}`,...(d=(c=o.parameters)==null?void 0:c.docs)==null?void 0:d.source}}};var p,m,l;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    moduleHandoffPending: true
  },
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('再読み込み後も保存済み結果を失わずNarrative handoff待ちを表示する', async () => {
      await expect(canvas.getByTestId('module-handoff-pending')).toHaveTextContent('ダイス結果とSession Effectは保存済み');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
    });
  }
}`,...(l=(m=s.parameters)==null?void 0:m.docs)==null?void 0:l.source}}};const k=["ActiveDiceModule","PersistedHandoffPending"];export{o as ActiveDiceModule,s as PersistedHandoffPending,k as __namedExportsOrder,j as default};
