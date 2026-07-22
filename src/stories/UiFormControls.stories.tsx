import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { Input, Textarea } from '../components/ui';

const meta: Meta = {
  title: 'コンポーネント/Form Controls',
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="grid w-[min(680px,92vw)] gap-5 rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const Variants: Story = {
  name: 'Input / Textarea variants',
  render: function Render() {
    const [name, setName] = useState('Myriale');
    const [password, setPassword] = useState('mist-2026');
    const [notes, setNotes] = useState('一行目');
    return (
      <div className="grid gap-4 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-xs [&_label]:font-black">
        <label>Default<Input aria-label="Default input" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Password<Input aria-label="Password input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label>Disabled<Input aria-label="Disabled input" value="変更不可" disabled /></label>
        <label>Readonly<Input aria-label="Readonly input" value="参照専用" readOnly /></label>
        <label>Invalid<Input aria-label="Invalid input" aria-invalid="true" className="border-myr-ruby !bg-[#fff7f5]" defaultValue="修正が必要" /></label>
        <label>Compact<Input aria-label="Compact input" className="min-h-[30px] !px-2 !py-1.5 text-myr-ui-sm" defaultValue="コンパクト" /></label>
        <label>Borderless<Input aria-label="Borderless input" className="rounded-none border-0 bg-transparent shadow-none" defaultValue="境界線なし" /></label>
        <label>Textarea<Textarea aria-label="Textarea input" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('標準入力はキーボード操作で値を更新する', async () => {
      const input = canvas.getByLabelText('Default input');
      await userEvent.clear(input);
      await userEvent.type(input, '星喰いの図書館');
      await expect(input).toHaveValue('星喰いの図書館');
    });
    await step('パスワード属性と各状態を保持する', async () => {
      await expect(canvas.getByLabelText('Password input')).toHaveAttribute('type', 'password');
      await expect(canvas.getByLabelText('Disabled input')).toBeDisabled();
      await expect(canvas.getByLabelText('Readonly input')).toHaveAttribute('readonly');
      await expect(canvas.getByLabelText('Invalid input')).toHaveAttribute('aria-invalid', 'true');
    });
    await step('Tab移動とTextareaの改行入力が機能する', async () => {
      const textarea = canvas.getByLabelText('Textarea input');
      textarea.focus();
      await userEvent.keyboard('{End}{Enter}二行目');
      await expect(textarea).toHaveValue('一行目\n二行目');
      await userEvent.tab();
      await expect(textarea).not.toHaveFocus();
    });
  },
};
