import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { Textarea, type TextareaVariant } from '../components/ui';

const meta = {
  title: 'コンポーネント/UI/Textarea',
  component: Textarea,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div data-myriale-theme="archive" className="w-full max-w-myr-focused rounded-myr-panel bg-myr-paper p-6 font-myr-body text-myr-ink shadow-myr-panel">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

const variants: TextareaVariant[] = ['field', 'underline', 'compact', 'borderless', 'composer'];

export const VariantsAndEditing: Story = {
  name: 'バリアントと複数行編集',
  render: function Render() {
    const [notes, setNotes] = useState('扉には月の紋章がある。');

    return (
      <div className="grid gap-5">
        <header className="grid gap-2">
          <p className="text-myr-caption font-extrabold uppercase tracking-myr-label text-myr-ruby">Session notes</p>
          <h1 className="font-myr-display text-3xl">複数行入力</h1>
        </header>
        {variants.map((variant) => (
          <label className="grid gap-2 text-sm font-extrabold text-myr-slate" key={variant}>
            {variant}
            <Textarea
              aria-label={`${variant} textarea`}
              variant={variant}
              value={variant === 'field' ? notes : undefined}
              defaultValue={variant === 'field' ? undefined : `${variant} で残す物語の断片`}
              onChange={variant === 'field' ? (event) => setNotes(event.target.value) : undefined}
              rows={variant === 'compact' ? 2 : 3}
            />
          </label>
        ))}
        <output className="whitespace-pre-wrap text-sm text-myr-slate" aria-live="polite">記録: {notes}</output>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea 固有の全バリアントを表示する', async () => {
      for (const variant of variants) await expect(canvas.getByLabelText(`${variant} textarea`)).toBeVisible();
    });
    await step('改行を含む記録を編集する', async () => {
      const textarea = canvas.getByLabelText('field textarea');
      await userEvent.click(textarea);
      await userEvent.keyboard('{End}{Enter}司書は合言葉を待っている。');
      await expect(textarea).toHaveValue('扉には月の紋章がある。\n司書は合言葉を待っている。');
    });
    await step('composer も複数行入力として公開する', async () => {
      await expect(canvas.getByLabelText('composer textarea')).toHaveAttribute('rows', '3');
    });
  },
};

export const ValidationAndNativeStates: Story = {
  name: '検証とネイティブ状態',
  render: () => (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-extrabold text-myr-slate">
        修正が必要な導入文
        <Textarea aria-label="invalid opening" aria-invalid="true" aria-describedby="opening-error" defaultValue="短すぎます" />
      </label>
      <p id="opening-error" className="text-sm font-bold text-myr-ruby">導入文は情景が伝わる長さで入力してください。</p>
      <label className="grid gap-2 text-sm font-extrabold text-myr-slate">
        確定済みの要約
        <Textarea aria-label="readonly summary" value="夜明けまで門を守った。" readOnly />
      </label>
      <label className="grid gap-2 text-sm font-extrabold text-myr-slate">
        生成中の本文
        <Textarea aria-label="disabled generated text" value="生成中です" disabled />
      </label>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('エラー説明を入力へ関連付ける', async () => {
      await expect(canvas.getByLabelText('invalid opening')).toHaveAccessibleDescription('導入文は情景が伝わる長さで入力してください。');
    });
    await step('参照専用と無効状態を保持する', async () => {
      await expect(canvas.getByLabelText('readonly summary')).toHaveAttribute('readonly');
      await expect(canvas.getByLabelText('disabled generated text')).toBeDisabled();
    });
  },
};
