import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { MockSessionAiHistoryContainer } from './session-ai-history-page/MockSessionAiHistoryContainer';

const back = fn();

const meta = {
  title: 'ユーザーストーリー/Session AI history',
  component: MockSessionAiHistoryContainer,
  args: {
    sessionId: 'SES-AUTHOR-042',
    scenario: 'success',
    onBack: back,
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MockSessionAiHistoryContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const 作者がAI送受信履歴を確認する: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('作者は対象セッションとシナリオ、AI交換回数を確認する', async () => {
      await expect(canvas.getByRole('heading', { name: 'AI対話履歴' })).toBeVisible();
      await expect(canvas.getByText('星喰いの地下図書館')).toBeVisible();
      await expect(canvas.getByText('2')).toBeVisible();
    });

    await step('処理順にステージ、プロファイル、モデル、状態、時間、トークンを確認する', async () => {
      const timeline = canvas.getByRole('region', { name: 'AI対話の時系列' });
      const exchanges = within(timeline).getAllByRole('article');
      await expect(exchanges).toHaveLength(2);
      await expect(within(exchanges[0]).getByRole('heading', { name: 'selecting-action' })).toBeVisible();
      await expect(within(exchanges[0]).getByText('gpt-5-mini')).toBeVisible();
      await expect(within(exchanges[0]).getByText('入力 842 / 出力 116')).toBeVisible();
      await expect(within(exchanges[0]).getByText('succeeded')).toBeVisible();
    });

    await step('送信プロンプトと受信結果を開閉し、必要な詳細だけを読む', async () => {
      const firstExchange = canvas.getAllByRole('article')[0];
      const validationSummary = within(firstExchange).getByText('検証結果');
      await userEvent.click(validationSummary);
      await expect(within(firstExchange).getByText(/schema: valid/)).toBeVisible();
      await userEvent.click(within(firstExchange).getByText('AIから受信した結果'));
    });

    await step('確認後は元のセッションへ戻る', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '← セッションに戻る' }));
      await expect(back).toHaveBeenCalled();
    });
  },
};

export const AI対話がまだない: Story = {
  args: { scenario: 'empty' },
  play: async ({ canvasElement, step }) => {
    await step('AI処理前は、履歴がまだない理由を確認できる', async () => {
      await expect(within(canvasElement).getByText('AI対話の記録はまだありません')).toBeVisible();
    });
  },
};

export const 読み込み中: Story = {
  args: { scenario: 'loading' },
};

export const 読み込み失敗から再試行する: Story = {
  args: { scenario: 'error' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('取得に失敗した場合はエラー内容と再試行導線を確認する', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
      await userEvent.click(canvas.getByRole('button', { name: 'もう一度読み込む' }));
    });
    await step('再試行後はサーバーから取得した履歴を表示する', async () => {
      await expect(canvas.getByRole('region', { name: 'AI対話の時系列' })).toBeVisible();
    });
  },
};
