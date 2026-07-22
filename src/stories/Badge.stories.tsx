import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { Badge, type BadgeTone } from '../components/ui';

const meta = {
  title: 'コンポーネント/UI/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div data-myriale-theme="archive" className="w-full max-w-myr-focused rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const tones: BadgeTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const labels: Record<BadgeTone, string> = {
  neutral: '下書き',
  info: '準備中',
  success: '接続済み',
  warning: '確認待ち',
  danger: '切断',
};

export const TonesAndDots: Story = {
  name: 'トーンと装飾ドット',
  render: () => (
    <div className="grid gap-5">
      <header className="grid gap-2">
        <p className="text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby">Session status</p>
        <h1 className="font-myr-display text-3xl">状態バッジ</h1>
      </header>
      <div className="flex flex-wrap gap-3" aria-label="Badge tones">
        {tones.map((tone) => (
          <Badge key={tone} tone={tone} dot role="status" aria-label={`${tone}: ${labels[tone]}`}>
            {labels[tone]}
          </Badge>
        ))}
      </div>
      <Badge tone="success" role="status" aria-label="dot なしの保存状態">自動保存済み</Badge>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('全トーンを状態として公開する', async () => {
      for (const tone of tones) {
        await expect(canvas.getByRole('status', { name: `${tone}: ${labels[tone]}` })).toHaveTextContent(labels[tone]);
      }
    });
    await step('ドットを読み上げ対象から除外する', async () => {
      for (const tone of tones) {
        const badge = canvas.getByRole('status', { name: `${tone}: ${labels[tone]}` });
        await expect(badge.firstElementChild).toHaveAttribute('aria-hidden', 'true');
      }
      await expect(canvas.getByRole('status', { name: 'dot なしの保存状態' }).children).toHaveLength(0);
    });
  },
};
