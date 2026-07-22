import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { Input, type InputVariant } from '../components/ui';

const meta = {
  title: 'コンポーネント/UI/Input',
  component: Input,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div data-myriale-theme="archive" className="w-full max-w-myr-focused rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

const variants: InputVariant[] = ['field', 'underline', 'compact', 'borderless'];

export const VariantsAndEditing: Story = {
  name: 'バリアントと編集',
  render: function Render() {
    const [title, setTitle] = useState('星喰いの図書館');

    return (
      <div className="grid gap-5">
        <header className="grid gap-2">
          <p className="text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby">Scenario metadata</p>
          <h1 className="font-myr-display text-3xl">入力欄</h1>
        </header>
        {variants.map((variant) => (
          <label className="grid gap-2 text-sm font-extrabold text-myr-slate" key={variant}>
            {variant}
            <Input
              aria-label={`${variant} input`}
              variant={variant}
              value={variant === 'field' ? title : undefined}
              defaultValue={variant === 'field' ? undefined : `${variant} の記録`}
              onChange={variant === 'field' ? (event) => setTitle(event.target.value) : undefined}
            />
          </label>
        ))}
        <output className="text-sm text-myr-slate" aria-live="polite">現在の題名: {title}</output>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('全バリアントを表示する', async () => {
      for (const variant of variants) await expect(canvas.getByLabelText(`${variant} input`)).toBeVisible();
    });
    await step('標準入力をキーボードで編集する', async () => {
      const input = canvas.getByLabelText('field input');
      await userEvent.clear(input);
      await userEvent.type(input, '霧の王冠');
      await expect(input).toHaveValue('霧の王冠');
      await expect(canvas.getByText('現在の題名: 霧の王冠')).toBeVisible();
    });
  },
};

export const ValidationAndNativeStates: Story = {
  name: '検証とネイティブ状態',
  render: () => (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-extrabold text-myr-slate">
        修正が必要な題名
        <Input aria-label="invalid scenario title" defaultValue="?" aria-invalid="true" aria-describedby="invalid-title-message" />
      </label>
      <p id="invalid-title-message" className="text-sm font-bold text-myr-ruby">題名は2文字以上で入力してください。</p>
      <label className="grid gap-2 text-sm font-extrabold text-myr-slate">
        読み取り専用の識別子
        <Input aria-label="readonly scenario id" value="scenario-014" readOnly />
      </label>
      <label className="grid gap-2 text-sm font-extrabold text-myr-slate">
        同期中の入力
        <Input aria-label="disabled sync field" value="同期を待っています" disabled />
      </label>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('エラー状態を説明文へ関連付ける', async () => {
      const invalid = canvas.getByLabelText('invalid scenario title');
      await expect(invalid).toHaveAttribute('aria-invalid', 'true');
      await expect(invalid).toHaveAccessibleDescription('題名は2文字以上で入力してください。');
    });
    await step('readonly と disabled を区別する', async () => {
      await expect(canvas.getByLabelText('readonly scenario id')).toHaveAttribute('readonly');
      await expect(canvas.getByLabelText('readonly scenario id')).not.toBeDisabled();
      await expect(canvas.getByLabelText('disabled sync field')).toBeDisabled();
    });
  },
};
