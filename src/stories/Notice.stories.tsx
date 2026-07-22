import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { Notice, type NoticeTone, type NoticeVariant } from '../components/ui';

const meta = {
  title: 'コンポーネント/UI/Notice',
  component: Notice,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div data-myriale-theme="archive" className="w-full max-w-myr-reading rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Notice>;

export default meta;
type Story = StoryObj<typeof meta>;

const tones: NoticeTone[] = ['info', 'success', 'warning', 'danger'];
const variants: NoticeVariant[] = ['inverse', 'soft'];
const messages: Record<NoticeTone, string> = {
  info: '新しい手掛かりがセッションノートへ追加されました。',
  success: '物語の進行を保存しました。',
  warning: '残りのコンテキストが少なくなっています。',
  danger: 'AIプロバイダーへ接続できませんでした。',
};

export const TonesVariantsAndSemantics: Story = {
  name: 'トーン・バリアント・状態通知',
  render: () => (
    <div className="grid gap-6">
      {variants.map((variant) => (
        <section className="grid gap-3" aria-labelledby={`notice-${variant}-heading`} key={variant}>
          <h2 id={`notice-${variant}-heading`} className="font-myr-display text-2xl">{variant}</h2>
          {tones.map((tone) => (
            <Notice key={tone} variant={variant} tone={tone} aria-label={`${variant} ${tone}`}>
              <strong className="mr-2 uppercase">{tone}</strong>
              {messages[tone]}
            </Notice>
          ))}
        </section>
      ))}
      <Notice role="alert" tone="danger" variant="soft" aria-label="即時対応が必要なエラー">
        セッションを続ける前に接続設定を確認してください。
      </Notice>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('通常の通知は status ロールを持つ', async () => {
      for (const variant of variants) {
        for (const tone of tones) {
          const notice = canvas.getByRole('status', { name: `${variant} ${tone}` });
          await expect(notice).toHaveTextContent(messages[tone]);
        }
      }
    });
    await step('即時対応が必要な通知は alert に変更できる', async () => {
      await expect(canvas.getByRole('alert', { name: '即時対応が必要なエラー' })).toBeVisible();
    });
  },
};
