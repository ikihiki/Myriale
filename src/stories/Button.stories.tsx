import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { SparkleIcon } from '../components/icons';
import { Button, type ButtonSize, type ButtonVariant } from '../components/ui';

const meta = {
  title: 'コンポーネント/UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div data-myriale-theme="archive" className="w-full max-w-myr-reading rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'text', 'danger', 'icon'];
const sizes: ButtonSize[] = ['sm', 'md', 'lg', 'iconSm', 'iconMd'];

export const VariantsAndBehavior: Story = {
  name: 'バリアントとクリック操作',
  render: function Render() {
    const [message, setMessage] = useState('アクションを選択してください');

    return (
      <div className="grid gap-6">
        <header className="grid gap-2">
          <p className="text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby">Session actions</p>
          <h1 className="font-myr-display text-3xl">物語を動かすボタン</h1>
        </header>
        <div className="flex flex-wrap items-center gap-3" aria-label="Button variants">
          {variants.map((variant) => (
            <Button
              key={variant}
              type="button"
              variant={variant}
              aria-label={variant === 'icon' ? 'ひらめきを追加' : undefined}
              onClick={() => setMessage(`${variant} を選択しました`)}
            >
              {variant === 'icon' ? <SparkleIcon /> : variant}
            </Button>
          ))}
        </div>
        <div className="rounded-myr-card bg-myr-ink p-4 text-myr-paper">
          <div className="flex flex-wrap items-center gap-3" aria-label="Dark surface buttons">
            <Button type="button" variant="primary" surface="dark">続きを生成</Button>
            <Button type="button" variant="ghost" surface="dark">下書きへ戻す</Button>
            <Button type="button" variant="icon" surface="dark" aria-label="暗い面のひらめき"><SparkleIcon /></Button>
          </div>
        </div>
        <output className="text-sm font-bold text-myr-slate" aria-live="polite">{message}</output>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('すべてのボタンバリアントを公開する', async () => {
      for (const variant of variants.filter((variant) => variant !== 'icon')) {
        await expect(canvas.getByRole('button', { name: variant })).toBeVisible();
      }
      await expect(canvas.getByRole('button', { name: 'ひらめきを追加' })).toBeVisible();
    });
    await step('クリック結果をライブ領域へ反映する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'danger' }));
      await expect(canvas.getByText('danger を選択しました')).toBeVisible();
    });
    await step('暗い面でもアクセシブルな操作名を保つ', async () => {
      await expect(canvas.getByRole('button', { name: '暗い面のひらめき' })).toHaveAccessibleName('暗い面のひらめき');
    });
  },
};

export const SizesAndStates: Story = {
  name: 'サイズと状態',
  render: () => (
    <div className="grid gap-6">
      <section className="grid gap-3" aria-labelledby="button-size-heading">
        <h2 id="button-size-heading" className="font-myr-display text-2xl">選択できるサイズ</h2>
        <div className="flex flex-wrap items-center gap-3">
          {sizes.map((size) => (
            <Button
              key={size}
              type="button"
              variant={size.startsWith('icon') ? 'icon' : 'secondary'}
              size={size}
              aria-label={size.startsWith('icon') ? `${size} のひらめき` : undefined}
            >
              {size.startsWith('icon') ? <SparkleIcon /> : size}
            </Button>
          ))}
        </div>
      </section>
      <section className="grid gap-3" aria-labelledby="button-state-heading">
        <h2 id="button-state-heading" className="font-myr-display text-2xl">操作状態</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="primary">利用可能</Button>
          <Button type="button" variant="secondary" disabled>生成中は利用不可</Button>
          <Button type="button">互換ボタン</Button>
        </div>
      </section>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('すべてのサイズを操作名付きで表示する', async () => {
      for (const size of sizes) {
        const name = size.startsWith('icon') ? `${size} のひらめき` : size;
        await expect(canvas.getByRole('button', { name })).toBeVisible();
      }
    });
    await step('disabled と互換表示を維持する', async () => {
      await expect(canvas.getByRole('button', { name: '生成中は利用不可' })).toBeDisabled();
      await expect(canvas.getByRole('button', { name: '互換ボタン' })).not.toBeDisabled();
    });
  },
};
