import{j as N}from"./jsx-runtime-BO8uF4Og.js";import{w as s,u as o,e}from"./index-C4S39nCK.js";import{M as w}from"./MyrialeApp-g7BbKOr3.js";import{c as P}from"./SessionPresentation-BBjAi6R_.js";import{M as _}from"./MockSessionContainer-Dfb2XqOA.js";/* empty css               */import"./index-D4H_InIO.js";import"./AdminAiProvidersPage-DpaROe00.js";import"./Surfaces-hfywbPiG.js";import"./AppChrome-CaJxHzCb.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-DBs-w9aD.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-d7jVExt_.js";import"./ConditionTablePresentation-JmdLPG0b.js";import"./EditPane-DyZaeiBP.js";import"./scenarioWizardStyles-CPcslTFI.js";import"./NarrativeBody-4Kg13oE8.js";import"./ModuleUiHost-CQPmid6l.js";import"./TurnInspectionPresentation-CerC6ryl.js";import"./account-Bdcpq1bL.js";import"./SessionListPresentation-CV3LYKA6.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-UcBTXClw.js";import"./SessionActivityFeed-B0l1fOng.js";const pt={title:"ユーザーストーリー/Mode transition and exception",component:w,render:()=>N.jsx(w,{initialUrl:"/sessions/SES-PREP-1098",initialDb:P("modeTransitionSession"),sessionContainer:_}),parameters:{notes:"docs/user-stories/mode-transition-and-exception-user-stories.md の各ユーザーストーリー（US-M01〜M08）を、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。"}},c={name:"US-M01: システムが進行モードを明示的に切り替えたい",play:async({canvasElement:n,step:a})=>{const t=s(n);await a("バトル開始でSession Stateのmodeを保存し、通常のターン表示がバトル用操作へ切り替わる",async()=>{await o.click(t.getByRole("button",{name:"バトル開始"})),await e(t.getByTestId("session-mode-state")).toHaveTextContent("バトル"),await e(t.getByTestId("summary-mode")).toHaveTextContent("バトル"),await e(t.getByLabelText("自由に行動や会話を入力")).toBeDisabled(),await e(t.getByTestId("active-battle-turn")).toBeVisible(),await e(t.getByRole("group",{name:"バトルターン行動"})).toBeVisible()}),await a("ターン内の行動ボタンで操作し、結果も通常ターンと同じログ形式で追加する",async()=>{await o.click(t.getByRole("button",{name:"攻撃"})),await e(t.getByTestId("mode-notice")).toHaveTextContent("行動ログは通常ターンと同じ形式"),await e(t.getByTestId("narrative-log")).toHaveTextContent("BATTLE TURN 1"),await e(t.getByTestId("narrative-log")).toHaveTextContent("行動「攻撃」確定"),await e(t.getByTestId("battle-turn-lead")).toHaveTextContent("Battle Turn 2")})}},i={name:"US-M02: 現在の進行モードを理解できるようにしたい",play:async({canvasElement:n,step:a})=>{const t=s(n);await a("判定中バッジと自由入力不可の理由を表示する",async()=>{await o.click(t.getByRole("button",{name:"判定開始"})),await e(t.getByTestId("mode-badge")).toHaveTextContent("判定中"),await e(t.getByTestId("input-disabled-reason")).toHaveTextContent("自由入力と巻き戻しが無効"),await e(t.getByTestId("mode-reason")).toHaveTextContent("自由入力は無効")})}},r={name:"US-M03: プログラム主導モードが正常終了したらAI対話に戻りたい",play:async({canvasElement:n,step:a})=>{const t=s(n);await o.click(t.getByRole("button",{name:"強制イベント開始"})),await a("正常終了でAI対話モードへ復帰し、自由入力を再度有効にする",async()=>{await o.click(t.getByRole("button",{name:"正常終了してAI対話へ戻る"})),await e(t.queryByTestId("mode-badge")).not.toBeInTheDocument(),await e(t.getByLabelText("自由に行動や会話を入力")).toBeEnabled(),await e(t.getByTestId("mode-notice")).toHaveTextContent("自由入力と巻き戻しが再度有効")})}},m={name:"US-M04: エラーが起きても安全に復帰したい",play:async({canvasElement:n,step:a})=>{const t=s(n);await o.click(t.getByRole("button",{name:"バトル開始"})),await a("処理エラー時に確定済みと未確定を明示する",async()=>{await o.click(t.getByRole("button",{name:"処理エラーを発生"})),await e(t.getByTestId("mode-badge")).toHaveTextContent("復旧中"),await e(t.getByTestId("pending-action")).toHaveTextContent("未確定"),await e(t.getByTestId("narrative-log")).toHaveTextContent("未確定=ダメージ反映")}),await a("最後に確定した地点からAI対話へ復帰する",async()=>{await o.click(t.getByRole("button",{name:"最後に確定した地点から再開"})),await e(t.queryByTestId("mode-badge")).not.toBeInTheDocument(),await e(t.getByTestId("recovery-point")).toHaveTextContent("lastConfirmed")})}},d={name:"US-M05: 通信断・画面離脱が起きても再開したい",play:async({canvasElement:n,step:a})=>{const t=s(n);await o.click(t.getByRole("button",{name:"判定開始"})),await a("再接続時にモード状態を復元し、未完了処理を再提示する",async()=>{await o.click(t.getByRole("button",{name:"通信断から再接続"})),await e(t.getByTestId("mode-badge")).toHaveTextContent("判定中"),await e(t.getByTestId("pending-action")).toHaveTextContent("未完了UIを再提示"),await e(t.getByTestId("mode-notice")).toHaveTextContent("モード状態を復元")})}},l={name:"US-M06: プログラム主導モード中は巻き戻し操作を制限したい",play:async({canvasElement:n,step:a})=>{const t=s(n);await a("バトル中は巻き戻しを無効化し、終了後に可能と説明する",async()=>{await o.click(t.getByRole("button",{name:"バトル開始"})),await e(t.queryByRole("button",{name:"直前のターンに戻る"})).not.toBeInTheDocument(),await e(t.getByTestId("summary-rewind")).toHaveTextContent("終了後に可能"),await e(t.getByTestId("input-disabled-reason")).toHaveTextContent("終了後に可能")})}},v={name:"US-M07: モード遷移の履歴をログとして残したい",play:async({canvasElement:n,step:a})=>{const t=s(n);await a("遷移理由と開始時刻をログテーブルへ残す",async()=>{await o.click(t.getByRole("button",{name:"バトル開始"})),await o.click(t.getByRole("button",{name:"正常終了してAI対話へ戻る"}));const p=t.getByRole("table",{name:"モード遷移ログ"});await e(p).toHaveTextContent("バトル開始"),await e(p).toHaveTextContent("プログラム主導シーン正常終了"),await e(p).toHaveTextContent("21:")})}},y={name:"US-M08: 強制進行中でも最低限の情報確認はできるようにしたい",play:async({canvasElement:n,step:a})=>{const t=s(n);await a("強制イベント中でも現在の目的と処理中内容を表示する",async()=>{await o.click(t.getByRole("button",{name:"強制イベント開始"})),await e(t.getByTestId("current-objective")).toHaveTextContent("崩落イベント"),await e(t.getByTestId("processing-detail")).toHaveTextContent("順番に再生"),await e(t.getByTestId("last-confirmed")).toHaveTextContent("Turn 18")})}};var T,g,u;c.parameters={...c.parameters,docs:{...(T=c.parameters)==null?void 0:T.docs,source:{originalSource:`{
  name: 'US-M01: システムが進行モードを明示的に切り替えたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('バトル開始でSession Stateのmodeを保存し、通常のターン表示がバトル用操作へ切り替わる', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'バトル開始'
      }));
      await expect(canvas.getByTestId('session-mode-state')).toHaveTextContent('バトル');
      await expect(canvas.getByTestId('summary-mode')).toHaveTextContent('バトル');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
      await expect(canvas.getByTestId('active-battle-turn')).toBeVisible();
      await expect(canvas.getByRole('group', {
        name: 'バトルターン行動'
      })).toBeVisible();
    });
    await step('ターン内の行動ボタンで操作し、結果も通常ターンと同じログ形式で追加する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '攻撃'
      }));
      await expect(canvas.getByTestId('mode-notice')).toHaveTextContent('行動ログは通常ターンと同じ形式');
      await expect(canvas.getByTestId('narrative-log')).toHaveTextContent('BATTLE TURN 1');
      await expect(canvas.getByTestId('narrative-log')).toHaveTextContent('行動「攻撃」確定');
      await expect(canvas.getByTestId('battle-turn-lead')).toHaveTextContent('Battle Turn 2');
    });
  }
}`,...(u=(g=c.parameters)==null?void 0:g.docs)==null?void 0:u.source}}};var B,x,b;i.parameters={...i.parameters,docs:{...(B=i.parameters)==null?void 0:B.docs,source:{originalSource:`{
  name: 'US-M02: 現在の進行モードを理解できるようにしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('判定中バッジと自由入力不可の理由を表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '判定開始'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('判定中');
      await expect(canvas.getByTestId('input-disabled-reason')).toHaveTextContent('自由入力と巻き戻しが無効');
      await expect(canvas.getByTestId('mode-reason')).toHaveTextContent('自由入力は無効');
    });
  }
}`,...(b=(x=i.parameters)==null?void 0:x.docs)==null?void 0:b.source}}};var I,C,S;r.parameters={...r.parameters,docs:{...(I=r.parameters)==null?void 0:I.docs,source:{originalSource:`{
  name: 'US-M03: プログラム主導モードが正常終了したらAI対話に戻りたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: '強制イベント開始'
    }));
    await step('正常終了でAI対話モードへ復帰し、自由入力を再度有効にする', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '正常終了してAI対話へ戻る'
      }));
      await expect(canvas.queryByTestId('mode-badge')).not.toBeInTheDocument();
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeEnabled();
      await expect(canvas.getByTestId('mode-notice')).toHaveTextContent('自由入力と巻き戻しが再度有効');
    });
  }
}`,...(S=(C=r.parameters)==null?void 0:C.docs)==null?void 0:S.source}}};var H,R,M;m.parameters={...m.parameters,docs:{...(H=m.parameters)==null?void 0:H.docs,source:{originalSource:`{
  name: 'US-M04: エラーが起きても安全に復帰したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: 'バトル開始'
    }));
    await step('処理エラー時に確定済みと未確定を明示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '処理エラーを発生'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('復旧中');
      await expect(canvas.getByTestId('pending-action')).toHaveTextContent('未確定');
      await expect(canvas.getByTestId('narrative-log')).toHaveTextContent('未確定=ダメージ反映');
    });
    await step('最後に確定した地点からAI対話へ復帰する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '最後に確定した地点から再開'
      }));
      await expect(canvas.queryByTestId('mode-badge')).not.toBeInTheDocument();
      await expect(canvas.getByTestId('recovery-point')).toHaveTextContent('lastConfirmed');
    });
  }
}`,...(M=(R=m.parameters)==null?void 0:R.docs)==null?void 0:M.source}}};var E,U,k;d.parameters={...d.parameters,docs:{...(E=d.parameters)==null?void 0:E.docs,source:{originalSource:`{
  name: 'US-M05: 通信断・画面離脱が起きても再開したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: '判定開始'
    }));
    await step('再接続時にモード状態を復元し、未完了処理を再提示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '通信断から再接続'
      }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('判定中');
      await expect(canvas.getByTestId('pending-action')).toHaveTextContent('未完了UIを再提示');
      await expect(canvas.getByTestId('mode-notice')).toHaveTextContent('モード状態を復元');
    });
  }
}`,...(k=(U=d.parameters)==null?void 0:U.docs)==null?void 0:k.source}}};var h,D,A;l.parameters={...l.parameters,docs:{...(h=l.parameters)==null?void 0:h.docs,source:{originalSource:`{
  name: 'US-M06: プログラム主導モード中は巻き戻し操作を制限したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('バトル中は巻き戻しを無効化し、終了後に可能と説明する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'バトル開始'
      }));
      await expect(canvas.queryByRole('button', {
        name: '直前のターンに戻る'
      })).not.toBeInTheDocument();
      await expect(canvas.getByTestId('summary-rewind')).toHaveTextContent('終了後に可能');
      await expect(canvas.getByTestId('input-disabled-reason')).toHaveTextContent('終了後に可能');
    });
  }
}`,...(A=(D=l.parameters)==null?void 0:D.docs)==null?void 0:A.source}}};var f,L,q;v.parameters={...v.parameters,docs:{...(f=v.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: 'US-M07: モード遷移の履歴をログとして残したい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('遷移理由と開始時刻をログテーブルへ残す', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'バトル開始'
      }));
      await userEvent.click(canvas.getByRole('button', {
        name: '正常終了してAI対話へ戻る'
      }));
      const table = canvas.getByRole('table', {
        name: 'モード遷移ログ'
      });
      await expect(table).toHaveTextContent('バトル開始');
      await expect(table).toHaveTextContent('プログラム主導シーン正常終了');
      await expect(table).toHaveTextContent('21:');
    });
  }
}`,...(q=(L=v.parameters)==null?void 0:L.docs)==null?void 0:q.source}}};var j,F,V;y.parameters={...y.parameters,docs:{...(j=y.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'US-M08: 強制進行中でも最低限の情報確認はできるようにしたい',
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('強制イベント中でも現在の目的と処理中内容を表示する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: '強制イベント開始'
      }));
      await expect(canvas.getByTestId('current-objective')).toHaveTextContent('崩落イベント');
      await expect(canvas.getByTestId('processing-detail')).toHaveTextContent('順番に再生');
      await expect(canvas.getByTestId('last-confirmed')).toHaveTextContent('Turn 18');
    });
  }
}`,...(V=(F=y.parameters)==null?void 0:F.docs)==null?void 0:V.source}}};const wt=["USM01ExplicitModeSwitch","USM02ShowCurrentMode","USM03ReturnToDialogue","USM04RecoverFromError","USM05ResumeAfterDisconnect","USM06RestrictRewind","USM07LogTransitions","USM08ShowMinimumInfoDuringForcedMode"];export{c as USM01ExplicitModeSwitch,i as USM02ShowCurrentMode,r as USM03ReturnToDialogue,m as USM04RecoverFromError,d as USM05ResumeAfterDisconnect,l as USM06RestrictRewind,v as USM07LogTransitions,y as USM08ShowMinimumInfoDuringForcedMode,wt as __namedExportsOrder,pt as default};
