import{j as Q}from"./jsx-runtime-Cf8x2fCZ.js";import{w as o,e as t,u as n}from"./index-C3Z0PGzo.js";import{M as w,c as X}from"./MyrialeApp-DDas1-Wn.js";/* empty css               */import"./index-yBjzXJbu.js";import"./index-BlmOqGMO.js";import"./AppChrome-B5ZJ3NP-.js";import"./SessionTurn-DWZJ2ukf.js";import"./account-Cq75HoV1.js";const ce={title:"Program-driven narrative/Wireframe from user stories",component:w,render:()=>Q.jsx(w,{initialUrl:"/sessions/SES-PREP-1098/program",initialDb:X("activeSession")}),parameters:{notes:"docs/user-stories/program-driven-narrative-user-stories.md の各ユーザーストーリー（US-PG01〜PG10）を、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。"}},c={name:"US-PG01: 自由入力を禁止しモードを切り替えたい",play:async({canvasElement:s,step:a})=>{const e=o(s);await a("初期はAI対話モードで、自由入力が有効",async()=>{await t(e.getByTestId("mode-badge")).toHaveTextContent("対話中"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeEnabled()}),await a("バトル開始でForced Modeに入り、自由入力が無効化され理由が示される",async()=>{await n.click(e.getByRole("button",{name:"バトルを開始"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled(),await t(e.getByTestId("input-disabled-reason")).toHaveTextContent("自由入力は無効")})}},i={name:"US-PG02: バトルをボタン操作で進行したい",play:async({canvasElement:s,step:a})=>{const e=o(s);await n.click(e.getByRole("button",{name:"バトルを開始"})),await a("攻撃/防御/スキル/逃走の行動ボタンが表示される",async()=>{const J=e.getByRole("group",{name:"バトル行動"});for(const K of["攻撃","防御","スキル","逃走"])await t(o(J).getByRole("button",{name:K})).toBeVisible()}),await a("行動を選ぶと即座に確定され、自由入力は使えない",async()=>{await n.click(e.getByRole("button",{name:"スキル"})),await t(e.getByTestId("program-log")).toHaveTextContent("行動「スキル」確定"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled()})}},r={name:"US-PG03: バトル結果をプログラムで判定してほしい",play:async({canvasElement:s,step:a})=>{const e=o(s);await n.click(e.getByRole("button",{name:"バトルを開始"})),await a("命中・ダメージ・状態変化がプログラムで確定し、Session Stateに反映される",async()=>{await n.click(e.getByRole("button",{name:"攻撃"})),await t(e.getByTestId("program-log")).toHaveTextContent("与ダメージ8"),await t(e.getByTestId("summary-battle")).toHaveTextContent("敵HP 16")})}},l={name:"US-PG04: 判定（ダイスロール）を明示的に実行したい",play:async({canvasElement:s,step:a})=>{const e=o(s);await a("テストハーネスでダイスを6に固定し、判定モードに入る",async()=>{await n.selectOptions(e.getByLabelText("ダイス固定値"),"6"),await n.click(e.getByRole("button",{name:"判定を開始"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("判定中")}),await a("「ダイスを振る」でプログラム生成の結果が表示され、成功/失敗が即時に分かる",async()=>{await n.click(e.getByTestId("roll-button")),await t(e.getByTestId("roll-result")).toHaveTextContent("d6 = 6 → 成功"),await t(e.getByTestId("summary-roll")).toHaveTextContent("d6=6（成功）")})}},y={name:"US-PG05: ダイス結果に基づき強制的に進めたい",play:async({canvasElement:s,step:a})=>{const e=o(s);await a("失敗が出る値（2）に固定して判定する",async()=>{await n.selectOptions(e.getByLabelText("ダイス固定値"),"2"),await n.click(e.getByRole("button",{name:"判定を開始"})),await n.click(e.getByTestId("roll-button"))}),await a("成功/失敗の分岐がプログラムで決定され、操作なしで次のシーンへ進む",async()=>{await t(e.getByTestId("program-log")).toHaveTextContent("失敗ルート"),await t(e.getByTestId("program-log")).toHaveTextContent("プレイヤー操作なし"),await t(e.getByTestId("program-notice")).toHaveTextContent("失敗ルートへ自動で進めました")})}},m={name:"US-PG06: 強制イベントを中断不可で実行したい",play:async({canvasElement:s,step:a})=>{const e=o(s);await n.click(e.getByRole("button",{name:"強制イベントを発生"})),await a("自由入力も分岐選択も無効化され、制御不能であることが明示される",async()=>{await t(e.getByTestId("mode-badge")).toHaveTextContent("イベント進行中"),await t(e.getByTestId("event-lock")).toHaveTextContent("中断・分岐はできません"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeDisabled()})}},v={name:"US-PG07: 強制イベント中もナラティブはAIに語らせたい",play:async({canvasElement:s,step:a})=>{const e=o(s);await n.click(e.getByRole("button",{name:"強制イベントを発生"})),await a("プログラムが事実を確定し、描写・心情・演出はAIが生成する",async()=>{await n.click(e.getByTestId("event-advance")),await t(e.getByTestId("program-log")).toHaveTextContent("イベント確定: 落下ダメージ5"),await t(e.getByTestId("program-notice")).toHaveTextContent("AIが描写・心情・演出を生成")})}},d={name:"US-PG08: シーン終了後にAI対話へ戻りたい",play:async({canvasElement:s,step:a})=>{const e=o(s);await n.click(e.getByRole("button",{name:"バトルを開始"})),await a("シーン終了でForced Modeが解除され、自由入力欄が再表示される",async()=>{await n.click(e.getByRole("button",{name:"AI対話へ戻る"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("対話中"),await t(e.getByLabelText("自由に行動や会話を入力")).toBeEnabled(),await t(e.queryByTestId("input-disabled-reason")).not.toBeInTheDocument()}),await a("対話モードでは自由入力で物語を進められる",async()=>{await n.type(e.getByLabelText("自由に行動や会話を入力"),"星図灯を掲げて先へ進む"),await n.click(e.getByTestId("send-free-input")),await t(e.getByTestId("program-log")).toHaveTextContent("星図灯を掲げて先へ進む")})}},g={name:"US-PG09: 現在の進行モードを分かるようにしたい",play:async({canvasElement:s,step:a})=>{const e=o(s);await a("対話 → バトル → 判定 → イベントで、モードバッジが切り替わる",async()=>{await t(e.getByTestId("mode-badge")).toHaveTextContent("対話中"),await n.click(e.getByRole("button",{name:"バトルを開始"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await n.click(e.getByRole("button",{name:"判定を開始"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("判定中"),await n.click(e.getByRole("button",{name:"強制イベントを発生"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("イベント進行中"),await t(e.getByTestId("summary-mode")).toHaveTextContent("Forced Mode")})}},p={name:"US-PG10: プログラム主導シーンをテストしやすくしたい",play:async({canvasElement:s,step:a})=>{const e=o(s);await a("作者は判定値を固定して、同じ結果を再現できる",async()=>{await n.selectOptions(e.getByLabelText("ダイス固定値"),"5"),await n.click(e.getByRole("button",{name:"判定を開始"})),await n.click(e.getByTestId("roll-button")),await t(e.getByTestId("roll-result")).toHaveTextContent("d6 = 5 → 成功")}),await a("特定シーン（バトル）から単体で実行できる",async()=>{await n.click(e.getByRole("button",{name:"バトルを開始"})),await t(e.getByTestId("mode-badge")).toHaveTextContent("バトル中"),await t(e.getByRole("group",{name:"バトル行動"})).toBeVisible()})}};var B,u,T;c.parameters={...c.parameters,docs:{...(B=c.parameters)==null?void 0:B.docs,source:{originalSource:`{
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
}`,...(T=(u=c.parameters)==null?void 0:u.docs)==null?void 0:T.source}}};var x,b,I;i.parameters={...i.parameters,docs:{...(x=i.parameters)==null?void 0:x.docs,source:{originalSource:`{
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
}`,...(I=(b=i.parameters)==null?void 0:b.docs)==null?void 0:I.source}}};var S,E,H;r.parameters={...r.parameters,docs:{...(S=r.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
}`,...(H=(E=r.parameters)==null?void 0:E.docs)==null?void 0:H.source}}};var C,P,R;l.parameters={...l.parameters,docs:{...(C=l.parameters)==null?void 0:C.docs,source:{originalSource:`{
  name: 'US-PG04: 判定（ダイスロール）を明示的に実行したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('テストハーネスでダイスを6に固定し、判定モードに入る', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('ダイス固定値'), '6');
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
}`,...(R=(P=l.parameters)==null?void 0:P.docs)==null?void 0:R.source}}};var k,G,U;y.parameters={...y.parameters,docs:{...(k=y.parameters)==null?void 0:k.docs,source:{originalSource:`{
  name: 'US-PG05: ダイス結果に基づき強制的に進めたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('失敗が出る値（2）に固定して判定する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('ダイス固定値'), '2');
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
}`,...(U=(G=y.parameters)==null?void 0:G.docs)==null?void 0:U.source}}};var D,h,L;m.parameters={...m.parameters,docs:{...(D=m.parameters)==null?void 0:D.docs,source:{originalSource:`{
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
}`,...(L=(h=m.parameters)==null?void 0:h.docs)==null?void 0:L.source}}};var A,f,M;v.parameters={...v.parameters,docs:{...(A=v.parameters)==null?void 0:A.docs,source:{originalSource:`{
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
}`,...(M=(f=v.parameters)==null?void 0:f.docs)==null?void 0:M.source}}};var F,O,V;d.parameters={...d.parameters,docs:{...(F=d.parameters)==null?void 0:F.docs,source:{originalSource:`{
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
}`,...(V=(O=d.parameters)==null?void 0:O.docs)==null?void 0:V.source}}};var j,q,N;g.parameters={...g.parameters,docs:{...(j=g.parameters)==null?void 0:j.docs,source:{originalSource:`{
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
}`,...(N=(q=g.parameters)==null?void 0:q.docs)==null?void 0:N.source}}};var _,W,z;p.parameters={...p.parameters,docs:{...(_=p.parameters)==null?void 0:_.docs,source:{originalSource:`{
  name: 'US-PG10: プログラム主導シーンをテストしやすくしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('作者は判定値を固定して、同じ結果を再現できる', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('ダイス固定値'), '5');
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
}`,...(z=(W=p.parameters)==null?void 0:W.docs)==null?void 0:z.source}}};const ie=["USPG01ForcedModeDisablesInput","USPG02BattleByButtons","USPG03ProgramResolvesBattle","USPG04RollDice","USPG05AutoBranchOnRoll","USPG06ForcedEvent","USPG07AiNarratesDuringEvent","USPG08ReturnToDialogue","USPG09ShowCurrentMode","USPG10TestHarness"];export{c as USPG01ForcedModeDisablesInput,i as USPG02BattleByButtons,r as USPG03ProgramResolvesBattle,l as USPG04RollDice,y as USPG05AutoBranchOnRoll,m as USPG06ForcedEvent,v as USPG07AiNarratesDuringEvent,d as USPG08ReturnToDialogue,g as USPG09ShowCurrentMode,p as USPG10TestHarness,ie as __namedExportsOrder,ce as default};
