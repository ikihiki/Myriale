import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { Button, Field, Input, fieldDescriptionId } from '../components/ui';

const meta: Meta = {
  title: 'コンポーネント/UI/Field',
  component: Field,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div data-myriale-theme="archive" className="w-full max-w-myr-focused rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const HelpRequiredAndValidation: Story = {
  name: 'ヘルプ・必須・検証',
  render: function Render() {
    const [value, setValue] = useState('月影の司書');
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const inputId = 'field-character-name';
    const descriptionId = fieldDescriptionId(inputId, error ? 'error' : 'help');

    function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!value.trim()) {
        setError('登場人物の名前を入力してください。');
        setSaved(false);
        return;
      }
      setError('');
      setSaved(true);
    }

    return (
      <form className="grid gap-4" noValidate onSubmit={submit}>
        <header className="grid gap-2">
          <p className="text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby">Character record</p>
          <h1 className="font-myr-display text-3xl">登場人物を記録する</h1>
        </header>
        <Field
          label="名前"
          htmlFor={inputId}
          required
          help="セッション中に表示する呼び名です。"
          error={error || undefined}
        >
          <Input
            id={inputId}
            required
            value={value}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={descriptionId}
            onChange={(event) => {
              setValue(event.target.value);
              setSaved(false);
            }}
          />
        </Field>
        <Button type="submit" variant="primary">登場人物を保存</Button>
        <output aria-live="polite" className="text-sm font-bold text-myr-slate">{saved ? `${value} を保存しました。` : '未保存'}</output>
      </form>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(/^名前/);

    await step('必須入力とヘルプを関連付ける', async () => {
      await expect(input).toBeRequired();
      await expect(input).toHaveAccessibleDescription('セッション中に表示する呼び名です。');
    });
    await step('空の送信時にヘルプをエラーへ置き換える', async () => {
      await userEvent.clear(input);
      await userEvent.click(canvas.getByRole('button', { name: '登場人物を保存' }));
      await expect(canvas.getByRole('alert')).toHaveTextContent('登場人物の名前を入力してください。');
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(canvas.queryByText('セッション中に表示する呼び名です。')).not.toBeInTheDocument();
    });
    await step('修正した値を保存して結果を通知する', async () => {
      await userEvent.type(input, '白銀の旅人');
      await userEvent.click(canvas.getByRole('button', { name: '登場人物を保存' }));
      await expect(canvas.getByText('白銀の旅人 を保存しました。')).toBeVisible();
      await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    });
  },
};
