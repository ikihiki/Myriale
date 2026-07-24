import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MarkdownEditor } from '../components/ui';

const meta = {
  title: 'コンポーネント/UI/MarkdownEditor',
  component: MarkdownEditor,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div data-myriale-theme="archive" className="w-[min(860px,92vw)] rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MarkdownEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditAndPreview: Story = {
  name: 'Markdown入力とプレビュー',
  args: {
    label: '基本情報',
    value: '',
    onChange: () => undefined,
  },
  render: function Render() {
    const [value, setValue] = useState('## 物語の導入\n\n水没した地下図書館で、**銀の鍵**を探します。\n\n- 禁書を開かない\n- 星図灯を失わない');
    return <MarkdownEditor label="基本情報" value={value} onChange={setValue} help="見出し、強調、リスト、リンクをMarkdownで記述できます。" />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Markdown本文を編集できる', async () => {
      const editor = canvas.getByLabelText('基本情報');
      await expect(editor).toHaveValue(expect.stringContaining('## 物語の導入'));
      await userEvent.click(editor);
      await userEvent.keyboard('{End}{Enter}- 閉じた星座の扉を調べる');
      await expect(editor).toHaveValue(expect.stringContaining('閉じた星座の扉'));
    });
    await step('プレビューではMarkdownを構造化して表示する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'プレビュー' }));
      const preview = canvas.getByRole('article', { name: '基本情報のMarkdownプレビュー' });
      await expect(within(preview).getByRole('heading', { name: '物語の導入' })).toBeVisible();
      await expect(within(preview).getByText('銀の鍵')).toBeVisible();
    });
  },
};
