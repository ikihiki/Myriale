import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { MockTurnInspectionContainer } from './turn-inspection-page/MockTurnInspectionContainer';

const back = fn();
const meta = { title: 'ユーザーストーリー/Turn execution inspection', component: MockTurnInspectionContainer, args: { sessionId: 'SES-AUTHOR-042', turnId: 'TURN-018', scenario: 'success', onBack: back }, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof MockTurnInspectionContainer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Turnの実行経路を確認する: Story = { play: async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  await step('対象Turnと総実行時間を確認する', async () => { await expect(canvas.getByRole('heading', { name: 'Turn 実行詳細' })).toBeVisible(); await expect(canvas.getByRole('heading', { name: 'Turn 18' })).toBeVisible(); await expect(canvas.getByText('4.04 秒')).toBeVisible(); });
  await step('実行とルールエンジンのタイムラインを確認する', async () => { await expect(canvas.getByRole('region', { name: 'Execution timeline' })).toBeVisible(); await expect(canvas.getByRole('region', { name: 'Rule-engine timeline' })).toBeVisible(); await expect(canvas.getByText('星座封印を調べる')).toBeVisible(); });
  await step('AIの正確な開始・完了時刻と送受信内容を確認する', async () => { const exchange = canvas.getAllByRole('article')[0]; await expect(within(exchange).getByText('2026-07-29T10:21:14.000Z')).toBeVisible(); await expect(within(exchange).getByText('2026-07-29T10:21:15.284Z')).toBeVisible(); await userEvent.click(within(exchange).getByText('検証結果')); await expect(within(exchange).getByText('schema: valid')).toBeVisible(); });
  await step('セッションに戻る', async () => { await userEvent.click(canvas.getByRole('button', { name: '← セッションに戻る' })); await expect(back).toHaveBeenCalled(); });
} };
export const AIまたはルール記録がないTurn: Story = { args: { scenario: 'empty' } };
export const 読み込み中: Story = { args: { scenario: 'loading' } };
export const 読み込み失敗から再試行する: Story = { args: { scenario: 'error' }, play: async ({ canvasElement }) => { const canvas = within(canvasElement); await expect(canvas.getByRole('alert')).toBeVisible(); await userEvent.click(canvas.getByRole('button', { name: 'もう一度読み込む' })); await expect(canvas.getByRole('heading', { name: 'Turn 18' })).toBeVisible(); } };
