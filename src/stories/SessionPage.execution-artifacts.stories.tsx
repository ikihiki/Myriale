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
      await expect(canvas.queryByText('AIサービスから時間内に応答がありませんでした。')).not.toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: '入力取り消し' })).toBeInTheDocument();
    });
    await step('Retry updates the existing execution slot', async () => {
      await userEvent.click(canvas.getAllByRole('button', { name: '再試行' })[0]);
      await expect(args.onExecutionAction).toHaveBeenCalled();
    });
    await step('The status line toggles safe development diagnostics', async () => {
      const status = canvas.getAllByText(/物語: 生成できませんでした/)[0];
      await userEvent.click(status);
      await userEvent.click(canvas.getAllByText('例外情報')[0]);
      await expect(canvas.getAllByText(/Authorization=\[REDACTED\]/).length).toBeGreaterThan(0);
      await expect(canvas.getAllByText('送信したプロンプト').length).toBeGreaterThan(0);
      await expect(canvas.getAllByText('受信した結果').length).toBeGreaterThan(0);
      await expect(canvas.getAllByText('バリデーション結果').length).toBeGreaterThan(0);
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
      await expect(canvas.queryByText('AIサービスから時間内に応答がありませんでした。')).not.toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: '入力取り消し' })).toBeInTheDocument();
    });
  },
};
