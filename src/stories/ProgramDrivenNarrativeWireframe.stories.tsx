import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { ProgramDrivenNarrativeWireframe } from '../ProgramDrivenNarrativeWireframe';
import '../styles.css';

const meta = {
  title: 'Program-driven narrative/Wireframe from user stories',
  component: ProgramDrivenNarrativeWireframe,
  parameters: {
    notes: 'docs/user-stories/program-driven-narrative-user-stories.md の各ユーザーストーリー（US-PG01〜PG10）を、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。',
  },
} satisfies Meta<typeof ProgramDrivenNarrativeWireframe>;

export default meta;
type Story = StoryObj<typeof meta>;

export const USPG01ForcedModeDisablesInput: Story = {
  name: 'US-PG01: 自由入力を禁止しモードを切り替えたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('初期はAI対話モードで、自由入力が有効', async () => {
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('対話中');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeEnabled();
    });
    await step('バトル開始でForced Modeに入り、自由入力が無効化され理由が示される', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'バトルを開始' }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('バトル中');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
      await expect(canvas.getByTestId('input-disabled-reason')).toHaveTextContent('自由入力は無効');
    });
  },
};

export const USPG02BattleByButtons: Story = {
  name: 'US-PG02: バトルをボタン操作で進行したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'バトルを開始' }));
    await step('攻撃/防御/スキル/逃走の行動ボタンが表示される', async () => {
      const group = canvas.getByRole('group', { name: 'バトル行動' });
      for (const action of ['攻撃', '防御', 'スキル', '逃走']) {
        await expect(within(group).getByRole('button', { name: action })).toBeVisible();
      }
    });
    await step('行動を選ぶと即座に確定され、自由入力は使えない', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'スキル' }));
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('行動「スキル」確定');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
    });
  },
};

export const USPG03ProgramResolvesBattle: Story = {
  name: 'US-PG03: バトル結果をプログラムで判定してほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'バトルを開始' }));
    await step('命中・ダメージ・状態変化がプログラムで確定し、Session Stateに反映される', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '攻撃' }));
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('与ダメージ8');
      await expect(canvas.getByTestId('summary-battle')).toHaveTextContent('敵HP 16');
    });
  },
};

export const USPG04RollDice: Story = {
  name: 'US-PG04: 判定（ダイスロール）を明示的に実行したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('テストハーネスでダイスを6に固定し、判定モードに入る', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('ダイス固定値'), '6');
      await userEvent.click(canvas.getByRole('button', { name: '判定を開始' }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('判定中');
    });
    await step('「ダイスを振る」でプログラム生成の結果が表示され、成功/失敗が即時に分かる', async () => {
      await userEvent.click(canvas.getByTestId('roll-button'));
      await expect(canvas.getByTestId('roll-result')).toHaveTextContent('d6 = 6 → 成功');
      await expect(canvas.getByTestId('summary-roll')).toHaveTextContent('d6=6（成功）');
    });
  },
};

export const USPG05AutoBranchOnRoll: Story = {
  name: 'US-PG05: ダイス結果に基づき強制的に進めたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('失敗が出る値（2）に固定して判定する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('ダイス固定値'), '2');
      await userEvent.click(canvas.getByRole('button', { name: '判定を開始' }));
      await userEvent.click(canvas.getByTestId('roll-button'));
    });
    await step('成功/失敗の分岐がプログラムで決定され、操作なしで次のシーンへ進む', async () => {
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('失敗ルート');
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('プレイヤー操作なし');
      await expect(canvas.getByTestId('program-notice')).toHaveTextContent('失敗ルートへ自動で進めました');
    });
  },
};

export const USPG06ForcedEvent: Story = {
  name: 'US-PG06: 強制イベントを中断不可で実行したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '強制イベントを発生' }));
    await step('自由入力も分岐選択も無効化され、制御不能であることが明示される', async () => {
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('イベント進行中');
      await expect(canvas.getByTestId('event-lock')).toHaveTextContent('中断・分岐はできません');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
    });
  },
};

export const USPG07AiNarratesDuringEvent: Story = {
  name: 'US-PG07: 強制イベント中もナラティブはAIに語らせたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '強制イベントを発生' }));
    await step('プログラムが事実を確定し、描写・心情・演出はAIが生成する', async () => {
      await userEvent.click(canvas.getByTestId('event-advance'));
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('イベント確定: 落下ダメージ5');
      await expect(canvas.getByTestId('program-notice')).toHaveTextContent('AIが描写・心情・演出を生成');
    });
  },
};

export const USPG08ReturnToDialogue: Story = {
  name: 'US-PG08: シーン終了後にAI対話へ戻りたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'バトルを開始' }));
    await step('シーン終了でForced Modeが解除され、自由入力欄が再表示される', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'AI対話へ戻る' }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('対話中');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeEnabled();
      await expect(canvas.queryByTestId('input-disabled-reason')).not.toBeInTheDocument();
    });
    await step('対話モードでは自由入力で物語を進められる', async () => {
      await userEvent.type(canvas.getByLabelText('自由に行動や会話を入力'), '星図灯を掲げて先へ進む');
      await userEvent.click(canvas.getByTestId('send-free-input'));
      await expect(canvas.getByTestId('program-log')).toHaveTextContent('星図灯を掲げて先へ進む');
    });
  },
};

export const USPG09ShowCurrentMode: Story = {
  name: 'US-PG09: 現在の進行モードを分かるようにしたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('対話 → バトル → 判定 → イベントで、モードバッジが切り替わる', async () => {
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('対話中');
      await userEvent.click(canvas.getByRole('button', { name: 'バトルを開始' }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('バトル中');
      await userEvent.click(canvas.getByRole('button', { name: '判定を開始' }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('判定中');
      await userEvent.click(canvas.getByRole('button', { name: '強制イベントを発生' }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('イベント進行中');
      await expect(canvas.getByTestId('summary-mode')).toHaveTextContent('Forced Mode');
    });
  },
};

export const USPG10TestHarness: Story = {
  name: 'US-PG10: プログラム主導シーンをテストしやすくしたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('作者は判定値を固定して、同じ結果を再現できる', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('ダイス固定値'), '5');
      await userEvent.click(canvas.getByRole('button', { name: '判定を開始' }));
      await userEvent.click(canvas.getByTestId('roll-button'));
      await expect(canvas.getByTestId('roll-result')).toHaveTextContent('d6 = 5 → 成功');
    });
    await step('特定シーン（バトル）から単体で実行できる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'バトルを開始' }));
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('バトル中');
      await expect(canvas.getByRole('group', { name: 'バトル行動' })).toBeVisible();
    });
  },
};
