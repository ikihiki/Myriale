import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { SessionPresentation } from '../features/session-play/SessionPresentation';
import '../styles.css';

const noopCommand = async () => ({ ok: true, notice: 'ok' });
const meta = {
  title: 'デモ/星喰いの地下図書館/星座の扉判定',
  component: SessionPresentation,
  args: {
    sessionId: 'SES-STAR-EATER-DICE', account: null, sessionStateLabel: 'Active',
    turns: [{ id: 1, turnTitle: '閉じた星座の扉', narrative: '銀の鍵を差し込み、星図灯を掲げると扉の星々が判定を要求した。', kind: 'action' }],
    headingLinks: [{ title: '閉じた星座の扉', startTurnId: 1, summary: '判定開始地点' }],
    onSubmit: noopCommand, onRecommend: async () => ({ ok: true, value: '星図を調べる', notice: 'ok' }),
  },
} satisfies Meta<typeof SessionPresentation>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveManualObjectAction: Story = {
  args: {
    activeManualActionPanel: <section data-testid="active-module-turn" aria-label="現在のモジュール判定"><strong>列挙済みアクション: 星図灯を掲げる</strong><p>対象ObjectとActionはScenario Turnが確定済みです。</p><button type="button">判定する</button></section>,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Narrativeから判定のForced Modeへ移行し、現在の目的を表示する', async () => {
      await expect(canvas.getByTestId('active-module-turn')).toHaveTextContent('閉じた星座');
      await expect(canvas.getByTestId('mode-badge')).toHaveTextContent('判定中');
    });
    await step('判定中は通常の自由入力を無効化する', async () => {
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
      await expect(canvas.getByTestId('input-disabled-reason')).toHaveTextContent('自由入力');
    });
  },
};

export const CommittedStateNarrativePending: Story = {
  args: { committedStateNarrativePending: true },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('再読み込み後も確定済みObject状態を失わずNarrative生成待ちを表示する', async () => {
      await expect(canvas.getByTestId('committed-state-narrative-pending')).toHaveTextContent('状態、配置、適用結果はすでに保存');
      await expect(canvas.getByLabelText('自由に行動や会話を入力')).toBeDisabled();
    });
  },
};
