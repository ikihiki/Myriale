import{j as Y}from"./jsx-runtime-BO8uF4Og.js";import{w as s,e,u as n}from"./index-DwFX8Wt9.js";import{M as b,c as Z}from"./MyrialeApp-Bs7NW2Gl.js";/* empty css               */import"./index-D4H_InIO.js";import"./MyrialeToggle-Cu4mkWU9.js";import"./index-DzKAYa42.js";import"./AppChrome-BVb5UrEk.js";import"./MyrialeMenu-FzkaUt8s.js";import"./account-DPjXj8MC.js";import"./ModuleUiHost-Bo0AQgho.js";import"./WizardNavigation-_WVmaYVB.js";import"./SessionTurn-CnU6KSUh.js";const ya={title:"ユーザーストーリー/Program-driven narrative",component:b,render:()=>Y.jsx(b,{initialUrl:"/sessions/SES-PREP-1098",initialDb:Z("programDrivenSession")}),parameters:{notes:"docs/user-stories/program-driven-narrative-user-stories.md の各ユーザーストーリー（US-PG01〜PG10）を、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},c=async o=>{const t=o.queryByRole("button",{name:"デバッグパネルを表示"});t&&await n.click(t)},i=async o=>{const t=o.queryByRole("button",{name:"デバッグパネルを非表示"});t&&await n.click(t)},l={name:"US-PG01: 自由入力を禁止しモードを切り替えたい",play:async({canvasElement:o,step:t})=>{const a=s(o);await c(a),await t("初期はAI対話モードで、自由入力が有効",async()=>{await e(a.getByTestId("mode-badge")).toHaveTextContent("対話中"),await e(a.getByLabelText("自由に行動や会話を入力")).toBeEnabled()}),await t("バトル開始でForced Modeに入り、自由入力が無効化され理由が示される",async()=>{await n.click(a.getByRole("button",{name:"バトルを開始"})),await e(a.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await e(a.getByLabelText("自由に行動や会話を入力")).toBeDisabled(),await e(a.getByTestId("input-disabled-reason")).toHaveTextContent("自由入力は無効")}),await i(a)}},w={name:"US-PG02: バトルをボタン操作で進行したい",play:async({canvasElement:o,step:t})=>{const a=s(o);await c(a),await n.click(a.getByRole("button",{name:"バトルを開始"})),await t("攻撃/防御/スキル/逃走の行動ボタンが表示される",async()=>{const r=a.getByRole("group",{name:"バトル行動"});for(const X of["攻撃","防御","スキル","逃走"])await e(s(r).getByRole("button",{name:X})).toBeVisible()}),await t("行動を選ぶと即座に確定され、自由入力は使えない",async()=>{await n.click(a.getByRole("button",{name:"スキル"})),await e(a.getByTestId("program-log")).toHaveTextContent("行動「スキル」確定"),await e(a.getByLabelText("自由に行動や会話を入力")).toBeDisabled()}),await i(a)}},m={name:"US-PG03: バトル結果をプログラムで判定してほしい",play:async({canvasElement:o,step:t})=>{const a=s(o);await c(a),await n.click(a.getByRole("button",{name:"バトルを開始"})),await t("命中・ダメージ・状態変化がプログラムで確定し、Session Stateに反映される",async()=>{await n.click(a.getByRole("button",{name:"攻撃"})),await e(a.getByTestId("program-log")).toHaveTextContent("与ダメージ8"),await e(a.getByTestId("summary-battle")).toHaveTextContent("敵HP 16")}),await i(a)}},y={name:"US-PG04: 判定（ダイスロール）を明示的に実行したい",play:async({canvasElement:o,step:t})=>{const a=s(o);await c(a);const r=s(o.ownerDocument.body);await t("テストハーネスでダイスを6に固定し、判定モードに入る",async()=>{await n.click(a.getByRole("combobox",{name:"ダイス固定値"})),await n.click(await r.findByRole("option",{name:"6"})),await n.click(a.getByRole("button",{name:"判定を開始"})),await e(a.getByTestId("mode-badge")).toHaveTextContent("判定中")}),await t("「ダイスを振る」でプログラム生成の結果が表示され、成功/失敗が即時に分かる",async()=>{await n.click(a.getByTestId("roll-button")),await e(a.getByTestId("roll-result")).toHaveTextContent("d6 = 6 → 成功"),await e(a.getByTestId("summary-roll")).toHaveTextContent("d6=6（成功）")}),await i(a)}},g={name:"US-PG05: ダイス結果に基づき強制的に進めたい",play:async({canvasElement:o,step:t})=>{const a=s(o);await c(a);const r=s(o.ownerDocument.body);await t("失敗が出る値（2）に固定して判定する",async()=>{await n.click(a.getByRole("combobox",{name:"ダイス固定値"})),await n.click(await r.findByRole("option",{name:"2"})),await n.click(a.getByRole("button",{name:"判定を開始"})),await n.click(a.getByTestId("roll-button"))}),await t("成功/失敗の分岐がプログラムで決定され、操作なしで次のシーンへ進む",async()=>{await e(a.getByTestId("program-log")).toHaveTextContent("失敗ルート"),await e(a.getByTestId("program-log")).toHaveTextContent("プレイヤー操作なし"),await e(a.getByTestId("program-notice")).toHaveTextContent("失敗ルートへ自動で進めました")}),await i(a)}},v={name:"US-PG06: 強制イベントを中断不可で実行したい",play:async({canvasElement:o,step:t})=>{const a=s(o);await c(a),await n.click(a.getByRole("button",{name:"強制イベントを発生"})),await t("自由入力も分岐選択も無効化され、制御不能であることが明示される",async()=>{await e(a.getByTestId("mode-badge")).toHaveTextContent("イベント進行中"),await e(a.getByTestId("event-lock")).toHaveTextContent("中断・分岐はできません"),await e(a.getByLabelText("自由に行動や会話を入力")).toBeDisabled()}),await i(a)}},d={name:"US-PG07: 強制イベント中もナラティブはAIに語らせたい",play:async({canvasElement:o,step:t})=>{const a=s(o);await c(a),await n.click(a.getByRole("button",{name:"強制イベントを発生"})),await t("プログラムが事実を確定し、描写・心情・演出はAIが生成する",async()=>{await n.click(a.getByTestId("event-advance")),await e(a.getByTestId("program-log")).toHaveTextContent("イベント確定: 落下ダメージ5"),await e(a.getByTestId("program-notice")).toHaveTextContent("AIが描写・心情・演出を生成")}),await i(a)}},p={name:"US-PG08: シーン終了後にAI対話へ戻りたい",play:async({canvasElement:o,step:t})=>{const a=s(o);await c(a),await n.click(a.getByRole("button",{name:"バトルを開始"})),await t("シーン終了でForced Modeが解除され、自由入力欄が再表示される",async()=>{await n.click(a.getByRole("button",{name:"AI対話へ戻る"})),await e(a.getByTestId("mode-badge")).toHaveTextContent("対話中"),await e(a.getByLabelText("自由に行動や会話を入力")).toBeEnabled(),await e(a.queryByTestId("input-disabled-reason")).not.toBeInTheDocument()}),await t("対話モードでは自由入力で物語を進められる",async()=>{await n.type(a.getByLabelText("自由に行動や会話を入力"),"星図灯を掲げて先へ進む"),await n.click(a.getByTestId("send-free-input")),await e(a.getByTestId("program-log")).toHaveTextContent("星図灯を掲げて先へ進む")}),await i(a)}},u={name:"US-PG09: 現在の進行モードを分かるようにしたい",play:async({canvasElement:o,step:t})=>{const a=s(o);await c(a),await t("対話 → バトル → 判定 → イベントで、モードバッジが切り替わる",async()=>{await e(a.getByTestId("mode-badge")).toHaveTextContent("対話中"),await n.click(a.getByRole("button",{name:"バトルを開始"})),await e(a.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await n.click(a.getByRole("button",{name:"判定を開始"})),await e(a.getByTestId("mode-badge")).toHaveTextContent("判定中"),await n.click(a.getByRole("button",{name:"強制イベントを発生"})),await e(a.getByTestId("mode-badge")).toHaveTextContent("イベント進行中"),await e(a.getByTestId("summary-mode")).toHaveTextContent("Forced Mode")}),await i(a)}},B={name:"US-PG10: プログラム主導シーンをテストしやすくしたい",play:async({canvasElement:o,step:t})=>{const a=s(o);await c(a);const r=s(o.ownerDocument.body);await t("作者は判定値を固定して、同じ結果を再現できる",async()=>{await n.click(a.getByRole("combobox",{name:"ダイス固定値"})),await n.click(await r.findByRole("option",{name:"5"})),await n.click(a.getByRole("button",{name:"判定を開始"})),await n.click(a.getByTestId("roll-button")),await e(a.getByTestId("roll-result")).toHaveTextContent("d6 = 5 → 成功")}),await t("特定シーン（バトル）から単体で実行できる",async()=>{await n.click(a.getByRole("button",{name:"バトルを開始"})),await e(a.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await e(a.getByRole("group",{name:"バトル行動"})).toBeVisible()}),await i(a)}};var T,x,I;l.parameters={...l.parameters,docs:{...(T=l.parameters)==null?void 0:T.docs,source:{originalSource:`{
  name: 'US-PG01: 自由入力を禁止しモードを切り替えたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await openDebugPanel(canvas);
    await step('初期はAI対話モードで、自由入力が有効', async () => {
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('対話中');
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
}`,...(I=(x=l.parameters)==null?void 0:x.docs)==null?void 0:I.source}}};var P,R,E;w.parameters={...w.parameters,docs:{...(P=w.parameters)==null?void 0:P.docs,source:{originalSource:`{
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
}`,...(E=(R=w.parameters)==null?void 0:R.docs)==null?void 0:E.source}}};var S,k,H;m.parameters={...m.parameters,docs:{...(S=m.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
}`,...(H=(k=m.parameters)==null?void 0:k.docs)==null?void 0:H.source}}};var C,D,G;y.parameters={...y.parameters,docs:{...(C=y.parameters)==null?void 0:C.docs,source:{originalSource:`{
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
}`,...(G=(D=y.parameters)==null?void 0:D.docs)==null?void 0:G.source}}};var U,h,f;g.parameters={...g.parameters,docs:{...(U=g.parameters)==null?void 0:U.docs,source:{originalSource:`{
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
}`,...(f=(h=g.parameters)==null?void 0:h.docs)==null?void 0:f.source}}};var A,L,M;v.parameters={...v.parameters,docs:{...(A=v.parameters)==null?void 0:A.docs,source:{originalSource:`{
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
}`,...(M=(L=v.parameters)==null?void 0:L.docs)==null?void 0:M.source}}};var F,q,V;d.parameters={...d.parameters,docs:{...(F=d.parameters)==null?void 0:F.docs,source:{originalSource:`{
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
}`,...(V=(q=d.parameters)==null?void 0:q.docs)==null?void 0:V.source}}};var j,O,N;p.parameters={...p.parameters,docs:{...(j=p.parameters)==null?void 0:j.docs,source:{originalSource:`{
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
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('対話中');
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
    await step('対話 → バトル → 判定 → イベントで、モードバッジが切り替わる', async () => {
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('対話中');
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
}`,...(W=(Q=B.parameters)==null?void 0:Q.docs)==null?void 0:W.source}}};const ga=["USPG01ForcedModeDisablesInput","USPG02BattleByButtons","USPG03ProgramResolvesBattle","USPG04RollDice","USPG05AutoBranchOnRoll","USPG06ForcedEvent","USPG07AiNarratesDuringEvent","USPG08ReturnToDialogue","USPG09ShowCurrentMode","USPG10TestHarness"];export{l as USPG01ForcedModeDisablesInput,w as USPG02BattleByButtons,m as USPG03ProgramResolvesBattle,y as USPG04RollDice,g as USPG05AutoBranchOnRoll,v as USPG06ForcedEvent,d as USPG07AiNarratesDuringEvent,p as USPG08ReturnToDialogue,u as USPG09ShowCurrentMode,B as USPG10TestHarness,ga as __namedExportsOrder,ya as default};
