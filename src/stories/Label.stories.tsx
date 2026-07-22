import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { Label, type TextRole } from '../components/ui';

const meta: Meta = {
  title: 'コンポーネント/UI/Label',
  component: Label,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div data-myriale-theme="archive" className="w-full max-w-myr-reading rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

const roles: TextRole[] = ['display', 'section', 'sectionEditorial', 'eyebrow', 'eyebrowData', 'label', 'body', 'bodySm', 'caption', 'data'];

export const TextRoles: Story = {
  name: 'テキストロール',
  render: () => (
    <div className="grid gap-5">
      {roles.map((role) => (
        <div className="grid gap-2" key={role}>
          <span className="font-myr-mono text-xs text-myr-ruby">{role}</span>
          <Label as="p" textRole={role} data-testid={`label-${role}`}>霧の向こうで物語が目を覚ます</Label>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('すべてのテキストロールを段落として表示する', async () => {
      for (const role of roles) {
        const label = canvas.getByTestId(`label-${role}`);
        await expect(label.tagName).toBe('P');
        await expect(label).toBeVisible();
      }
    });
  },
};

export const SemanticElements: Story = {
  name: '意味のある as 出力',
  render: () => (
    <article className="grid gap-4" aria-labelledby="semantic-label-title">
      <Label as="p" textRole="eyebrow">Archive / Scenario 014</Label>
      <Label as="h1" textRole="display" id="semantic-label-title">星喰いの図書館</Label>
      <Label as="h2" textRole="sectionEditorial">第一章　閉ざされた書庫</Label>
      <Label as="p" textRole="body">探索者たちは、失われた頁を求めて夜の図書館へ入ります。</Label>
      <Label as="time" textRole="data" dateTime="2026-07-22T20:00:00+09:00">2026.07.22 / 20:00</Label>
      <Label as="span" textRole="caption" role="status" aria-live="polite">下書き保存済み</Label>
    </article>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('見出し階層を as 属性で出力する', async () => {
      await expect(canvas.getByRole('heading', { level: 1, name: '星喰いの図書館' })).toBeVisible();
      await expect(canvas.getByRole('heading', { level: 2, name: '第一章　閉ざされた書庫' })).toBeVisible();
    });
    await step('時刻と状態を意味のある要素で出力する', async () => {
      const time = canvas.getByText('2026.07.22 / 20:00');
      await expect(time.tagName).toBe('TIME');
      await expect(time).toHaveAttribute('datetime', '2026-07-22T20:00:00+09:00');
      await expect(canvas.getByRole('status')).toHaveTextContent('下書き保存済み');
    });
  },
};
