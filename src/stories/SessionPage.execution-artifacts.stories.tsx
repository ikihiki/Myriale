import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { SessionActivityFeed } from '../features/session-play/SessionActivityFeed';
import { sessionActivityFixture } from '../features/session-play/sessionActivityFixtures';

const meta = { title: 'Session/Execution and artifacts', component: SessionActivityFeed, parameters: { layout: 'padded' } } satisfies Meta<typeof SessionActivityFeed>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Queued: Story = { args: { session: sessionActivityFixture('queued'), onExecutionAction: fn() } };
export const Running: Story = { args: { session: sessionActivityFixture('running'), onExecutionAction: fn() } };
export const RetryWait: Story = { args: { session: sessionActivityFixture('retry-wait'), onExecutionAction: fn() } };
export const Cancelled: Story = { args: { session: sessionActivityFixture('cancelled'), onExecutionAction: fn() } };
export const Succeeded: Story = { args: { session: sessionActivityFixture('succeeded'), onExecutionAction: fn() } };
export const Superseded: Story = { args: { session: sessionActivityFixture('superseded'), onExecutionAction: fn() } };

export const FailedWithDevelopmentDiagnostics: Story = {
  args: { session: sessionActivityFixture('failed'), onExecutionAction: fn(), onNoteReview: fn() },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    await step('Player Input remains separate from the failure', async () => {
      await expect(canvas.getByTestId('session-input-item')).toHaveTextContent('銀の鍵を扉にかざす');
      await expect(canvas.getAllByTestId('narrative-turn-item')).toHaveLength(2);
      await expect(canvas.getAllByRole('alert').some((alert) => alert.textContent?.includes('AIサービスから時間内に応答がありませんでした。'))).toBe(true);
    });
    await step('Retry updates the existing execution slot', async () => {
      await userEvent.click(canvas.getAllByRole('button', { name: '再試行' })[0]);
      await expect(args.onExecutionAction).toHaveBeenCalled();
    });
    await step('Development diagnostics expose safe trace data', async () => {
      await userEvent.click(canvas.getAllByText('開発者向け詳細')[0]);
      await expect(canvas.getAllByText(/0123456789abcdef0123456789abcdef/).length).toBeGreaterThan(0);
      await expect(canvas.queryByText(/Bearer secret/i)).not.toBeInTheDocument();
    });
    await step('Narrative success and image failure remain partial success', async () => {
      await expect(canvas.getByText(/場面の画像: 生成できませんでした/)).toBeInTheDocument();
      await expect(canvas.getByTestId('image-artifact-item')).toBeInTheDocument();
    });
    await step('Note proposal is reviewable but not auto-applied', async () => {
      await expect(canvas.getByTestId('note-proposal-item')).toHaveTextContent('石扉を開くと淡く光る鍵');
      await userEvent.click(canvas.getByRole('button', { name: '適用' }));
      await expect(args.onNoteReview).toHaveBeenCalled();
    });
  },
};

export const ProductionRedaction: Story = {
  args: { session: { ...sessionActivityFixture('failed'), executions: sessionActivityFixture('failed').executions?.map((execution) => ({ ...execution, developmentDiagnostics: null })) }, onExecutionAction: fn() },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Production omits developer-only details', async () => {
      await expect(canvas.queryByText('開発者向け詳細')).not.toBeInTheDocument();
      await expect(canvas.getAllByRole('alert').some((alert) => alert.textContent?.includes('AIサービスから時間内に応答がありませんでした。'))).toBe(true);
    });
  },
};
