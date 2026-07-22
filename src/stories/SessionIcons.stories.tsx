import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { ArrowUpIcon, CloseIcon, LightbulbIcon, RotateBackIcon, SparkleIcon } from '../components/icons';
import { Button, DarkPanel, Label } from '../components/ui';

const meta = {
  title: 'コンポーネント/UI/Session Icons',
  component: SparkleIcon,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div data-myriale-theme="archive" className="w-full max-w-myr-reading rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SparkleIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DecorativeDefaults: Story = {
  name: '全アイコンと装飾用デフォルト',
  render: () => (
    <div className="grid gap-5">
      <Label as="h1" textRole="section">セッションアイコン</Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4"><ArrowUpIcon data-testid="ArrowUpIcon" /><span>送信</span></div>
        <div className="flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4"><RotateBackIcon data-testid="RotateBackIcon" /><span>巻き戻す</span></div>
        <div className="flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4"><SparkleIcon data-testid="SparkleIcon" /><span>生成する</span></div>
        <div className="flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4"><LightbulbIcon data-testid="LightbulbIcon" /><span>提案を見る</span></div>
        <div className="flex items-center gap-3 rounded-myr-card bg-myr-vellum p-4"><CloseIcon data-testid="CloseIcon" /><span>閉じる</span></div>
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const names = ['ArrowUpIcon', 'RotateBackIcon', 'SparkleIcon', 'LightbulbIcon', 'CloseIcon'];
    await step('すべてのセッションアイコンを表示する', async () => {
      for (const name of names) await expect(canvas.getByTestId(name)).toBeVisible();
    });
    await step('アイコン単体は装飾として読み上げとフォーカスから除外する', async () => {
      for (const name of names) {
        const icon = canvas.getByTestId(name);
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
        await expect(icon).toHaveAttribute('focusable', 'false');
      }
    });
  },
};

export const IconButtonsAndInheritance: Story = {
  name: '実用的なアイコンボタンと継承',
  render: function Render() {
    const [message, setMessage] = useState('操作を選択してください');
    return (
      <div className="grid gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="primary" onClick={() => setMessage('物語を送信しました')}>
            <ArrowUpIcon data-testid="send-icon" />
            送信
          </Button>
          <Button type="button" variant="ghost" onClick={() => setMessage('直前のターンへ戻りました')}>
            <RotateBackIcon data-testid="undo-icon" />
            巻き戻す
          </Button>
          <Button type="button" variant="icon" aria-label="ひらめきを生成" onClick={() => setMessage('ひらめきを生成しました')}>
            <span className="text-myr-ruby"><SparkleIcon className="size-6" data-testid="large-sparkle-icon" /></span>
          </Button>
          <Button type="button" variant="icon" aria-label="ヒントを表示" onClick={() => setMessage('ヒントを表示しました')}>
            <span className="text-myr-iris"><LightbulbIcon data-testid="hint-icon" /></span>
          </Button>
          <Button type="button" variant="icon" aria-label="ダイアログを閉じる" onClick={() => setMessage('ダイアログを閉じました')}>
            <CloseIcon data-testid="close-icon" />
          </Button>
        </div>
        <DarkPanel>
          <Button type="button" variant="ghost" surface="dark" aria-label="暗い面で巻き戻す">
            <RotateBackIcon data-testid="dark-undo-icon" />
            巻き戻す
          </Button>
        </DarkPanel>
        <output aria-live="polite" className="text-sm font-bold text-myr-slate">{message}</output>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ボタンがアイコンに代わる操作名を提供する', async () => {
      await expect(canvas.getByRole('button', { name: 'ひらめきを生成' })).toHaveAccessibleName('ひらめきを生成');
      await expect(canvas.getByRole('button', { name: 'ダイアログを閉じる' })).toHaveAccessibleName('ダイアログを閉じる');
    });
    await step('サイズ変更と currentColor 継承を保持する', async () => {
      await expect(canvas.getByTestId('large-sparkle-icon')).toHaveClass('size-6', 'stroke-current');
      await expect(canvas.getByTestId('hint-icon')).toHaveClass('stroke-current');
      await expect(canvas.getByTestId('dark-undo-icon')).toHaveClass('stroke-current');
    });
    await step('アイコンボタンのクリックを通知する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'ダイアログを閉じる' }));
      await expect(canvas.getByText('ダイアログを閉じました')).toBeVisible();
    });
  },
};
