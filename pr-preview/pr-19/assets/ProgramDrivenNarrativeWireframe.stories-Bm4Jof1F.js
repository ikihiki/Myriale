import{j as W}from"./jsx-runtime-BO8uF4Og.js";import{w as s,e as t,u as a}from"./index-C3Z0PGzo.js";import{M as u,c as X}from"./MyrialeApp-CV5q6ybp.js";/* empty css               */import"./index-D4H_InIO.js";import"./MyrialeToggle-Cwz5lpBR.js";import"./index-DzKAYa42.js";import"./AppChrome-BUEzUgbw.js";import"./MyrialeMenu-Ck7b4kC6.js";import"./WizardNavigation-_WVmaYVB.js";import"./SessionTurn-CnU6KSUh.js";import"./account-DB4a6SL9.js";const le={title:"ユーザーストーリー/Program-driven narrative",component:u,render:()=>W.jsx(u,{initialUrl:"/sessions/SES-PREP-1098/program",initialDb:X("activeSession")}),parameters:{notes:"docs/user-stories/program-driven-narrative-user-stories.md の各ユーザーストーリー（US-PG01〜PG10）を、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。"}},i={name:"US-PG01: 自由入力を禁止しモードを切り替えたい",play:async({canvasElement:o,step:n})=>{const e=s(o);await n("初期はAI対話モードで、自由入力が有効",async()=>{await t(e.getByTestId("mode-badge")).toHaveTextContent("対話中"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeEnabled()}),await n("バトル開始でForced Modeに入り、自由入力が無効化され理由が示される",async()=>{await a.click(e.getByRole("button",{name:"バトルを開始"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled(),await t(e.getByTestId("input-disabled-reason")).toHaveTextContent("自由入力は無効")})}},r={name:"US-PG02: バトルをボタン操作で進行したい",play:async({canvasElement:o,step:n})=>{const e=s(o);await a.click(e.getByRole("button",{name:"バトルを開始"})),await n("攻撃/防御/スキル/逃走の行動ボタンが表示される",async()=>{const c=e.getByRole("group",{name:"バトル行動"});for(const Q of["攻撃","防御","スキル","逃走"])await t(s(c).getByRole("button",{name:Q})).toBeVisible()}),await n("行動を選ぶと即座に確定され、自由入力は使えない",async()=>{await a.click(e.getByRole("button",{name:"スキル"})),await t(e.getByTestId("program-log")).toHaveTextContent("行動「スキル」確定"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled()})}},l={name:"US-PG03: バトル結果をプログラムで判定してほしい",play:async({canvasElement:o,step:n})=>{const e=s(o);await a.click(e.getByRole("button",{name:"バトルを開始"})),await n("命中・ダメージ・状態変化がプログラムで確定し、Session Stateに反映される",async()=>{await a.click(e.getByRole("button",{name:"攻撃"})),await t(e.getByTestId("program-log")).toHaveTextContent("与ダメージ8"),await t(e.getByTestId("summary-battle")).toHaveTextContent("敵HP 16")})}},m={name:"US-PG04: 判定（ダイスロール）を明示的に実行したい",play:async({canvasElement:o,step:n})=>{const e=s(o),c=s(o.ownerDocument.body);await n("テストハーネスでダイスを6に固定し、判定モードに入る",async()=>{await a.click(e.getByRole("combobox",{name:"ダイス固定値"})),await a.click(await c.findByRole("option",{name:"6"})),await a.click(e.getByRole("button",{name:"判定を開始"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("判定中")}),await n("「ダイスを振る」でプログラム生成の結果が表示され、成功/失敗が即時に分かる",async()=>{await a.click(e.getByTestId("roll-button")),await t(e.getByTestId("roll-result")).toHaveTextContent("d6 = 6 → 成功"),await t(e.getByTestId("summary-roll")).toHaveTextContent("d6=6（成功）")})}},y={name:"US-PG05: ダイス結果に基づき強制的に進めたい",play:async({canvasElement:o,step:n})=>{const e=s(o),c=s(o.ownerDocument.body);await n("失敗が出る値（2）に固定して判定する",async()=>{await a.click(e.getByRole("combobox",{name:"ダイス固定値"})),await a.click(await c.findByRole("option",{name:"2"})),await a.click(e.getByRole("button",{name:"判定を開始"})),await a.click(e.getByTestId("roll-button"))}),await n("成功/失敗の分岐がプログラムで決定され、操作なしで次のシーンへ進む",async()=>{await t(e.getByTestId("program-log")).toHaveTextContent("失敗ルート"),await t(e.getByTestId("program-log")).toHaveTextContent("プレイヤー操作なし"),await t(e.getByTestId("program-notice")).toHaveTextContent("失敗ルートへ自動で進めました")})}},d={name:"US-PG06: 強制イベントを中断不可で実行したい",play:async({canvasElement:o,step:n})=>{const e=s(o);await a.click(e.getByRole("button",{name:"強制イベントを発生"})),await n("自由入力も分岐選択も無効化され、制御不能であることが明示される",async()=>{await t(e.getByTestId("mode-badge")).toHaveTextContent("イベント進行中"),await t(e.getByTestId("event-lock")).toHaveTextContent("中断・分岐はできません"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled()})}},v={name:"US-PG07: 強制イベント中もナラティブはAIに語らせたい",play:async({canvasElement:o,step:n})=>{const e=s(o);await a.click(e.getByRole("button",{name:"強制イベントを発生"})),await n("プログラムが事実を確定し、描写・心情・演出はAIが生成する",async()=>{await a.click(e.getByTestId("event-advance")),await t(e.getByTestId("program-log")).toHaveTextContent("イベント確定: 落下ダメージ5"),await t(e.getByTestId("program-notice")).toHaveTextContent("AIが描写・心情・演出を生成")})}},g={name:"US-PG08: シーン終了後にAI対話へ戻りたい",play:async({canvasElement:o,step:n})=>{const e=s(o);await a.click(e.getByRole("button",{name:"バトルを開始"})),await n("シーン終了でForced Modeが解除され、自由入力欄が再表示される",async()=>{await a.click(e.getByRole("button",{name:"AI対話へ戻る"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("対話中"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeEnabled(),await t(e.queryByTestId("input-disabled-reason")).not.toBeInTheDocument()}),await n("対話モードでは自由入力で物語を進められる",async()=>{await a.type(e.getByLabelText("自由に行動や会話を入力"),"星図灯を掲げて先へ進む"),await a.click(e.getByTestId("send-free-input")),await t(e.getByTestId("program-log")).toHaveTextContent("星図灯を掲げて先へ進む")})}},w={name:"US-PG09: 現在の進行モードを分かるようにしたい",play:async({canvasElement:o,step:n})=>{const e=s(o);await n("対話 → バトル → 判定 → イベントで、モードバッジが切り替わる",async()=>{await t(e.getByTestId("mode-badge")).toHaveTextContent("対話中"),await a.click(e.getByRole("button",{name:"バトルを開始"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await a.click(e.getByRole("button",{name:"判定を開始"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("判定中"),await a.click(e.getByRole("button",{name:"強制イベントを発生"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("イベント進行中"),await t(e.getByTestId("summary-mode")).toHaveTextContent("Forced Mode")})}},p={name:"US-PG10: プログラム主導シーンをテストしやすくしたい",play:async({canvasElement:o,step:n})=>{const e=s(o),c=s(o.ownerDocument.body);await n("作者は判定値を固定して、同じ結果を再現できる",async()=>{await a.click(e.getByRole("combobox",{name:"ダイス固定値"})),await a.click(await c.findByRole("option",{name:"5"})),await a.click(e.getByRole("button",{name:"判定を開始"})),await a.click(e.getByTestId("roll-button")),await t(e.getByTestId("roll-result")).toHaveTextContent("d6 = 5 → 成功")}),await n("特定シーン（バトル）から単体で実行できる",async()=>{await a.click(e.getByRole("button",{name:"バトルを開始"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await t(e.getByRole("group",{name:"バトル行動"})).toBeVisible()})}};var B,T,b;i.parameters={...i.parameters,docs:{...(B=i.parameters)==null?void 0:B.docs,source:{originalSource:`{
  name: 'US-PG01: 自由入力を禁止しモードを切り替えたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
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
  }
}`,...(b=(T=i.parameters)==null?void 0:T.docs)==null?void 0:b.source}}};var x,I,E;r.parameters={...r.parameters,docs:{...(x=r.parameters)==null?void 0:x.docs,source:{originalSource:`{
  name: 'US-PG02: バトルをボタン操作で進行したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
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
  }
}`,...(E=(I=r.parameters)==null?void 0:I.docs)==null?void 0:E.source}}};var S,R,k;l.parameters={...l.parameters,docs:{...(S=l.parameters)==null?void 0:S.docs,source:{originalSource:`{
  name: 'US-PG03: バトル結果をプログラムで判定してほしい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
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
  }
}`,...(k=(R=l.parameters)==null?void 0:R.docs)==null?void 0:k.source}}};var H,C,P;m.parameters={...m.parameters,docs:{...(H=m.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: 'US-PG04: 判定（ダイスロール）を明示的に実行したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
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
  }
}`,...(P=(C=m.parameters)==null?void 0:C.docs)==null?void 0:P.source}}};var G,U,D;y.parameters={...y.parameters,docs:{...(G=y.parameters)==null?void 0:G.docs,source:{originalSource:`{
  name: 'US-PG05: ダイス結果に基づき強制的に進めたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
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
  }
}`,...(D=(U=y.parameters)==null?void 0:U.docs)==null?void 0:D.source}}};var h,A,f;d.parameters={...d.parameters,docs:{...(h=d.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: 'US-PG06: 強制イベントを中断不可で実行したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: '強制イベントを発生'
    }));
    await step('自由入力も分岐選択も無効化され、制御不能であることが明示される', async () => {
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('イベント進行中');
      await expect(canvas.getByTestId('event-lock')).toHaveTextContent('中断・分岐はできません');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
    });
  }
}`,...(f=(A=d.parameters)==null?void 0:A.docs)==null?void 0:f.source}}};var L,M,F;v.parameters={...v.parameters,docs:{...(L=v.parameters)==null?void 0:L.docs,source:{originalSource:`{
  name: 'US-PG07: 強制イベント中もナラティブはAIに語らせたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: '強制イベントを発生'
    }));
    await step('プログラムが事実を確定し、描写・心情・演出はAIが生成する', async () => {
      await userEvent.click(canvas.getByTestId('event-advance'));
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('イベント確定: 落下ダメージ5');
      await expect(canvas.getByTestId('program-notice')).toHaveTextContent('AIが描写・心情・演出を生成');
    });
  }
}`,...(F=(M=v.parameters)==null?void 0:M.docs)==null?void 0:F.source}}};var V,j,O;g.parameters={...g.parameters,docs:{...(V=g.parameters)==null?void 0:V.docs,source:{originalSource:`{
  name: 'US-PG08: シーン終了後にAI対話へ戻りたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
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
  }
}`,...(O=(j=g.parameters)==null?void 0:j.docs)==null?void 0:O.source}}};var q,N,_;w.parameters={...w.parameters,docs:{...(q=w.parameters)==null?void 0:q.docs,source:{originalSource:`{
  name: 'US-PG09: 現在の進行モードを分かるようにしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
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
  }
}`,...(_=(N=w.parameters)==null?void 0:N.docs)==null?void 0:_.source}}};var z,J,K;p.parameters={...p.parameters,docs:{...(z=p.parameters)==null?void 0:z.docs,source:{originalSource:`{
  name: 'US-PG10: プログラム主導シーンをテストしやすくしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
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
  }
}`,...(K=(J=p.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};const me=["USPG01ForcedModeDisablesInput","USPG02BattleByButtons","USPG03ProgramResolvesBattle","USPG04RollDice","USPG05AutoBranchOnRoll","USPG06ForcedEvent","USPG07AiNarratesDuringEvent","USPG08ReturnToDialogue","USPG09ShowCurrentMode","USPG10TestHarness"];export{i as USPG01ForcedModeDisablesInput,r as USPG02BattleByButtons,l as USPG03ProgramResolvesBattle,m as USPG04RollDice,y as USPG05AutoBranchOnRoll,d as USPG06ForcedEvent,v as USPG07AiNarratesDuringEvent,g as USPG08ReturnToDialogue,w as USPG09ShowCurrentMode,p as USPG10TestHarness,me as __namedExportsOrder,le as default};
