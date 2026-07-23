import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarkdownEditor } from './MarkdownEditor';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function ControlledEditor({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <MarkdownEditor label="基本情報" value={value} onChange={setValue} help="Markdownで入力します。" />;
}

describe('MarkdownEditor', () => {
  it('edits Markdown and renders a safe preview', () => {
    render(<ControlledEditor initial={'## 導入\n\n- 銀の鍵'} />);

    expect((screen.getByLabelText('基本情報') as HTMLTextAreaElement).value).toBe('## 導入\n\n- 銀の鍵');
    fireEvent.click(screen.getByRole('button', { name: 'プレビュー' }));

    const preview = screen.getByRole('article', { name: '基本情報のMarkdownプレビュー' });
    expect(preview.querySelector('h2')?.textContent).toBe('導入');
    expect(preview.querySelector('li')?.textContent).toBe('銀の鍵');
  });

  it('inserts Markdown around the selected text', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    render(<ControlledEditor initial="地下図書館" />);
    const textarea = screen.getByLabelText('基本情報') as HTMLTextAreaElement;
    textarea.setSelectionRange(0, textarea.value.length);

    fireEvent.click(screen.getByRole('button', { name: '太字' }));

    expect(textarea.value).toBe('**地下図書館**');
  });

  it('associates help and error messages with the editor', () => {
    render(<MarkdownEditor label="基本情報" value="" onChange={() => undefined} help="Markdownで入力します。" error="入力内容を確認してください。" />);

    const textarea = screen.getByLabelText('基本情報');
    const descriptionIds = textarea.getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(descriptionIds.map((id) => document.getElementById(id)?.textContent).join(' ')).toBe('入力内容を確認してください。 Markdownで入力します。');
    expect(screen.getByRole('alert').textContent).toBe('入力内容を確認してください。');
  });
});
