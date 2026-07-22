import{j as Y}from"./jsx-runtime-BO8uF4Og.js";import{w as s,e as a,u as n}from"./index-C4S39nCK.js";import{M as b,c as Z}from"./MyrialeApp-BtT9NTu5.js";import{M as $}from"./MockSessionPageContainer-COiUpd3N.js";/* empty css               */import"./index-D4H_InIO.js";import"./AppChrome-Cb-Bi4JU.js";import"./Surfaces-CQIJcDfy.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BLjquTkO.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-C73OeBTK.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-E1lLWSiL.js";import"./scenarioWizardStyles-BLXZEqRf.js";import"./SessionActivityFeed-BK8PBvn8.js";import"./account-D2w1pibX.js";import"./ModuleUiHost-Dq6FqUxM.js";const Be={title:"ユーザーストーリー/Program-driven narrative",component:b,render:()=>Y.jsx(b,{initialUrl:"/sessions/SES-PREP-1098",initialDb:Z("programDrivenSession"),sessionPageContainer:$}),parameters:{notes:"docs/user-stories/program-driven-narrative-user-stories.md の各ユーザーストーリー（US-PG01〜PG10）を、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},i=async o=>{const t=o.queryByRole("button",{name:"デバッグパネルを表示"});t&&await n.click(t)},r=async o=>{const t=o.queryByRole("button",{name:"デバッグパネルを非表示"});t&&await n.click(t)},l={name:"US-PG01: 自由入力を禁止しモードを切り替えたい",play:async({canvasElement:o,step:t})=>{const e=s(o);await i(e),await t("AI生成成功後のステータスを残すデバッグ設定を切り替えられる",async()=>{const c=e.getByRole("checkbox",{name:/成功後もAI生成ステータスを表示する/});await a(c).not.toBeChecked(),await n.click(c),await a(c).toBeChecked()}),await t("初期は余分なモード説明を表示せず、自由入力が有効",async()=>{await a(e.queryByTestId("mode-badge")).not.toBeInTheDocument(),await a(e.getByLabelText("自由に行動や会話を入力")).toBeEnabled()}),await t("バトル開始でForced Modeに入り、自由入力が無効化され理由が示される",async()=>{await n.click(e.getByRole("button",{name:"バトルを開始"})),await a(e.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await a(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled(),await a(e.getByTestId("input-disabled-reason")).toHaveTextContent("自由入力は無効")}),await r(e)}},m={name:"US-PG02: バトルをボタン操作で進行したい",play:async({canvasElement:o,step:t})=>{const e=s(o);await i(e),await n.click(e.getByRole("button",{name:"バトルを開始"})),await t("攻撃/防御/スキル/逃走の行動ボタンが表示される",async()=>{const c=e.getByRole("group",{name:"バトル行動"});for(const X of["攻撃","防御","スキル","逃走"])await a(s(c).getByRole("button",{name:X})).toBeVisible()}),await t("行動を選ぶと即座に確定され、自由入力は使えない",async()=>{await n.click(e.getByRole("button",{name:"スキル"})),await a(e.getByTestId("program-log")).toHaveTextContent("行動「スキル」確定"),await a(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled()}),await r(e)}},w={name:"US-PG03: バトル結果をプログラムで判定してほしい",play:async({canvasElement:o,step:t})=>{const e=s(o);await i(e),await n.click(e.getByRole("button",{name:"バトルを開始"})),await t("命中・ダメージ・状態変化がプログラムで確定し、Session Stateに反映される",async()=>{await n.click(e.getByRole("button",{name:"攻撃"})),await a(e.getByTestId("program-log")).toHaveTextContent("与ダメージ8"),await a(e.getByTestId("summary-battle")).toHaveTextContent("敵HP 16")}),await r(e)}},y={name:"US-PG04: 判定（ダイスロール）を明示的に実行したい",play:async({canvasElement:o,step:t})=>{const e=s(o);await i(e);const c=s(o.ownerDocument.body);await t("テストハーネスでダイスを6に固定し、判定モードに入る",async()=>{await n.click(e.getByRole("combobox",{name:"ダイス固定値"})),await n.click(await c.findByRole("option",{name:"6"})),await n.click(e.getByRole("button",{name:"判定を開始"})),await a(e.getByTestId("mode-badge")).toHaveTextContent("判定中")}),await t("「ダイスを振る」でプログラム生成の結果が表示され、成功/失敗が即時に分かる",async()=>{await n.click(e.getByTestId("roll-button")),await a(e.getByTestId("roll-result")).toHaveTextContent("d6 = 6 → 成功"),await a(e.getByTestId("summary-roll")).toHaveTextContent("d6=6（成功）")}),await r(e)}},g={name:"US-PG05: ダイス結果に基づき強制的に進めたい",play:async({canvasElement:o,step:t})=>{const e=s(o);await i(e);const c=s(o.ownerDocument.body);await t("失敗が出る値（2）に固定して判定する",async()=>{await n.click(e.getByRole("combobox",{name:"ダイス固定値"})),await n.click(await c.findByRole("option",{name:"2"})),await n.click(e.getByRole("button",{name:"判定を開始"})),await n.click(e.getByTestId("roll-button"))}),await t("成功/失敗の分岐がプログラムで決定され、操作なしで次のシーンへ進む",async()=>{await a(e.getByTestId("program-log")).toHaveTextContent("失敗ルート"),await a(e.getByTestId("program-log")).toHaveTextContent("プレイヤー操作なし"),await a(e.getByTestId("program-notice")).toHaveTextContent("失敗ルートへ自動で進めました")}),await r(e)}},d={name:"US-PG06: 強制イベントを中断不可で実行したい",play:async({canvasElement:o,step:t})=>{const e=s(o);await i(e),await n.click(e.getByRole("button",{name:"強制イベントを発生"})),await t("自由入力も分岐選択も無効化され、制御不能であることが明示される",async()=>{await a(e.getByTestId("mode-badge")).toHaveTextContent("イベント進行中"),await a(e.getByTestId("event-lock")).toHaveTextContent("中断・分岐はできません"),await a(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled()}),await r(e)}},v={name:"US-PG07: 強制イベント中もナラティブはAIに語らせたい",play:async({canvasElement:o,step:t})=>{const e=s(o);await i(e),await n.click(e.getByRole("button",{name:"強制イベントを発生"})),await t("プログラムが事実を確定し、描写・心情・演出はAIが生成する",async()=>{await n.click(e.getByTestId("event-advance")),await a(e.getByTestId("program-log")).toHaveTextContent("イベント確定: 落下ダメージ5"),await a(e.getByTestId("program-notice")).toHaveTextContent("AIが描写・心情・演出を生成")}),await r(e)}},p={name:"US-PG08: シーン終了後にAI対話へ戻りたい",play:async({canvasElement:o,step:t})=>{const e=s(o);await i(e),await n.click(e.getByRole("button",{name:"バトルを開始"})),await t("シーン終了でForced Modeが解除され、自由入力欄が再表示される",async()=>{await n.click(e.getByRole("button",{name:"AI対話へ戻る"})),await a(e.queryByTestId("mode-badge")).not.toBeInTheDocument(),await a(e.getByLabelText("自由に行動や会話を入力")).toBeEnabled(),await a(e.queryByTestId("input-disabled-reason")).not.toBeInTheDocument()}),await t("対話モードでは自由入力で物語を進められる",async()=>{await n.type(e.getByLabelText("自由に行動や会話を入力"),"星図灯を掲げて先へ進む"),await n.click(e.getByTestId("send-free-input")),await a(e.getByTestId("program-log")).toHaveTextContent("星図灯を掲げて先へ進む")}),await r(e)}},u={name:"US-PG09: 現在の進行モードを分かるようにしたい",play:async({canvasElement:o,step:t})=>{const e=s(o);await i(e),await t("Forced Modeでは、バトル → 判定 → イベントのモードバッジが切り替わる",async()=>{await a(e.queryByTestId("mode-badge")).not.toBeInTheDocument(),await n.click(e.getByRole("button",{name:"バトルを開始"})),await a(e.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await n.click(e.getByRole("button",{name:"判定を開始"})),await a(e.getByTestId("mode-badge")).toHaveTextContent("判定中"),await n.click(e.getByRole("button",{name:"強制イベントを発生"})),await a(e.getByTestId("mode-badge")).toHaveTextContent("イベント進行中"),await a(e.getByTestId("summary-mode")).toHaveTextContent("Forced Mode")}),await r(e)}},B={name:"US-PG10: プログラム主導シーンをテストしやすくしたい",play:async({canvasElement:o,step:t})=>{const e=s(o);await i(e);const c=s(o.ownerDocument.body);await t("作者は判定値を固定して、同じ結果を再現できる",async()=>{await n.click(e.getByRole("combobox",{name:"ダイス固定値"})),await n.click(await c.findByRole("option",{name:"5"})),await n.click(e.getByRole("button",{name:"判定を開始"})),await n.click(e.getByTestId("roll-button")),await a(e.getByTestId("roll-result")).toHaveTextContent("d6 = 5 → 成功")}),await t("特定シーン（バトル）から単体で実行できる",async()=>{await n.click(e.getByRole("button",{name:"バトルを開始"})),await a(e.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await a(e.getByRole("group",{name:"バトル行動"})).toBeVisible()}),await r(e)}};var T,x,I;l.parameters={...l.parameters,docs:{...(T=l.parameters)==null?void 0:T.docs,source:{originalSource:`{
  name: 'US-PG01: 自由入力を禁止しモードを切り替えたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openDebugPanel(canvas);
    await step('AI生成成功後のステータスを残すデバッグ設定を切り替えられる', async () => {
      const setting = canvas.getByRole('checkbox', {
        name: /成功後もAI生成ステータスを表示する/
      });
      await expect(setting).not.toBeChecked();
      await userEvent.click(setting);
      await expect(setting).toBeChecked();
    });
    await step('初期は余分なモード説明を表示せず、自由入力が有効', async () => {
      await expect(canvas.queryByTestId('mode-badge')).not.toBeInTheDocument();
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeEnabled();
    });
    await step('バトル開始でForced Modeに入り、自由入力が無効化され理由が示される', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'バトルを開始'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('バトル中');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
      await expect(canvas.getByTestId('input-disabled-reason')).toHaveTextContent('自由入力は無効');
    });
    await closeDebugPanel(canvas);
  }
}`,...(I=(x=l.parameters)==null?void 0:x.docs)==null?void 0:I.source}}};var P,k,R;m.parameters={...m.parameters,docs:{...(P=m.parameters)==null?void 0:P.docs,source:{originalSource:`{
  name: 'US-PG02: バトルをボタン操作で進行したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openDebugPanel(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: 'バトルを開始'
    }));
    await step('攻撃/防御/スキル/逃走の行動ボタンが表示される', async () => {
      const group = canvas.getByRole('group', {
        name: 'バトル行動'
      });
      for (const action of ['攻撃', '防御', 'スキル', '逃走']) {
        await expect(within(group).getByRole('button', {
          name: action
        })).toBeVisible();
      }
    });
    await step('行動を選ぶと即座に確定され、自由入力は使えない', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'スキル'
      }));
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('行動「スキル」確定');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
    });
    await closeDebugPanel(canvas);
  }
}`,...(R=(k=m.parameters)==null?void 0:k.docs)==null?void 0:R.source}}};var E,S,D;w.parameters={...w.parameters,docs:{...(E=w.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: 'US-PG03: バトル結果をプログラムで判定してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openDebugPanel(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: 'バトルを開始'
    }));
    await step('命中・ダメージ・状態変化がプログラムで確定し、Session Stateに反映される', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '攻撃'
      }));
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('与ダメージ8');
      await expect(canvas.getByTestId('summary-battle')).toHaveTextContent('敵HP 16');
    });
    await closeDebugPanel(canvas);
  }
}`,...(D=(S=w.parameters)==null?void 0:S.docs)==null?void 0:D.source}}};var C,H,G;y.parameters={...y.parameters,docs:{...(C=y.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: 'US-PG04: 判定（ダイスロール）を明示的に実行したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openDebugPanel(canvas);
    const screen = within(canvasElement.ownerDocument.body);
    await step('テストハーネスでダイスを6に固定し、判定モードに入る', async () => {
      await userEvent.click(canvas.getByRole('combobox', {
        name: 'ダイス固定値'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: '6'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '判定を開始'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('判定中');
    });
    await step('「ダイスを振る」でプログラム生成の結果が表示され、成功/失敗が即時に分かる', async () => {
      await userEvent.click(canvas.getByTestId('roll-button'));
      await expect(canvas.getByTestId('roll-result')).toHaveTextContent('d6 = 6 → 成功');
      await expect(canvas.getByTestId('summary-roll')).toHaveTextContent('d6=6（成功）');
    });
    await closeDebugPanel(canvas);
  }
}`,...(G=(H=y.parameters)==null?void 0:H.docs)==null?void 0:G.source}}};var U,h,f;g.parameters={...g.parameters,docs:{...(U=g.parameters)==null?void 0:U.docs,source:{originalSource:`{
  name: 'US-PG05: ダイス結果に基づき強制的に進めたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openDebugPanel(canvas);
    const screen = within(canvasElement.ownerDocument.body);
    await step('失敗が出る値（2）に固定して判定する', async () => {
      await userEvent.click(canvas.getByRole('combobox', {
        name: 'ダイス固定値'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: '2'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '判定を開始'
      }));
      await userEvent.click(canvas.getByTestId('roll-button'));
    });
    await step('成功/失敗の分岐がプログラムで決定され、操作なしで次のシーンへ進む', async () => {
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('失敗ルート');
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('プレイヤー操作なし');
      await expect(canvas.getByTestId('program-notice')).toHaveTextContent('失敗ルートへ自動で進めました');
    });
    await closeDebugPanel(canvas);
  }
}`,...(f=(h=g.parameters)==null?void 0:h.docs)==null?void 0:f.source}}};var A,M,F;d.parameters={...d.parameters,docs:{...(A=d.parameters)==null?void 0:A.docs,source:{originalSource:`{
  name: 'US-PG06: 強制イベントを中断不可で実行したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openDebugPanel(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: '強制イベントを発生'
    }));
    await step('自由入力も分岐選択も無効化され、制御不能であることが明示される', async () => {
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('イベント進行中');
      await expect(canvas.getByTestId('event-lock')).toHaveTextContent('中断・分岐はできません');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
    });
    await closeDebugPanel(canvas);
  }
}`,...(F=(M=d.parameters)==null?void 0:M.docs)==null?void 0:F.source}}};var L,q,V;v.parameters={...v.parameters,docs:{...(L=v.parameters)==null?void 0:L.docs,source:{originalSource:`{
  name: 'US-PG07: 強制イベント中もナラティブはAIに語らせたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openDebugPanel(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: '強制イベントを発生'
    }));
    await step('プログラムが事実を確定し、描写・心情・演出はAIが生成する', async () => {
      await userEvent.click(canvas.getByTestId('event-advance'));
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('イベント確定: 落下ダメージ5');
      await expect(canvas.getByTestId('program-notice')).toHaveTextContent('AIが描写・心情・演出を生成');
    });
    await closeDebugPanel(canvas);
  }
}`,...(V=(q=v.parameters)==null?void 0:q.docs)==null?void 0:V.source}}};var j,O,N;p.parameters={...p.parameters,docs:{...(j=p.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'US-PG08: シーン終了後にAI対話へ戻りたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openDebugPanel(canvas);
    await userEvent.click(canvas.getByRole('button', {
      name: 'バトルを開始'
    }));
    await step('シーン終了でForced Modeが解除され、自由入力欄が再表示される', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'AI対話へ戻る'
      }));
      await expect(canvas.queryByTestId('mode-badge')).not.toBeInTheDocument();
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeEnabled();
      await expect(canvas.queryByTestId('input-disabled-reason')).not.toBeInTheDocument();
    });
    await step('対話モードでは自由入力で物語を進められる', async () => {
      await userEvent.type(canvas.getByLabelText('自由に行動や会話を入力'), '星図灯を掲げて先へ進む');
      await userEvent.click(canvas.getByTestId('send-free-input'));
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('星図灯を掲げて先へ進む');
    });
    await closeDebugPanel(canvas);
  }
}`,...(N=(O=p.parameters)==null?void 0:O.docs)==null?void 0:N.source}}};var _,z,J;u.parameters={...u.parameters,docs:{...(_=u.parameters)==null?void 0:_.docs,source:{originalSource:`{
  name: 'US-PG09: 現在の進行モードを分かるようにしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openDebugPanel(canvas);
    await step('Forced Modeでは、バトル → 判定 → イベントのモードバッジが切り替わる', async () => {
      await expect(canvas.queryByTestId('mode-badge')).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole('button', {
        name: 'バトルを開始'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('バトル中');
      await userEvent.click(canvas.getByRole('button', {
        name: '判定を開始'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('判定中');
      await userEvent.click(canvas.getByRole('button', {
        name: '強制イベントを発生'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('イベント進行中');
      await expect(canvas.getByTestId('summary-mode')).toHaveTextContent('Forced Mode');
    });
    await closeDebugPanel(canvas);
  }
}`,...(J=(z=u.parameters)==null?void 0:z.docs)==null?void 0:J.source}}};var K,Q,W;B.parameters={...B.parameters,docs:{...(K=B.parameters)==null?void 0:K.docs,source:{originalSource:`{
  name: 'US-PG10: プログラム主導シーンをテストしやすくしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openDebugPanel(canvas);
    const screen = within(canvasElement.ownerDocument.body);
    await step('作者は判定値を固定して、同じ結果を再現できる', async () => {
      await userEvent.click(canvas.getByRole('combobox', {
        name: 'ダイス固定値'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: '5'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '判定を開始'
      }));
      await userEvent.click(canvas.getByTestId('roll-button'));
      await expect(canvas.getByTestId('roll-result')).toHaveTextContent('d6 = 5 → 成功');
    });
    await step('特定シーン（バトル）から単体で実行できる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'バトルを開始'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('バトル中');
      await expect(canvas.getByRole('group', {
        name: 'バトル行動'
      })).toBeVisible();
    });
    await closeDebugPanel(canvas);
  }
}`,...(W=(Q=B.parameters)==null?void 0:Q.docs)==null?void 0:W.source}}};const be=["USPG01ForcedModeDisablesInput","USPG02BattleByButtons","USPG03ProgramResolvesBattle","USPG04RollDice","USPG05AutoBranchOnRoll","USPG06ForcedEvent","USPG07AiNarratesDuringEvent","USPG08ReturnToDialogue","USPG09ShowCurrentMode","USPG10TestHarness"];export{l as USPG01ForcedModeDisablesInput,m as USPG02BattleByButtons,w as USPG03ProgramResolvesBattle,y as USPG04RollDice,g as USPG05AutoBranchOnRoll,d as USPG06ForcedEvent,v as USPG07AiNarratesDuringEvent,p as USPG08ReturnToDialogue,u as USPG09ShowCurrentMode,B as USPG10TestHarness,be as __namedExportsOrder,Be as default};
