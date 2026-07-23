import { useId, useRef, useState, type ChangeEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './Button';
import { Textarea } from './Textarea';

export type MarkdownEditorProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  help?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
};

type MarkdownInsertion = {
  label: string;
  prefix: string;
  suffix?: string;
  fallback: string;
};

const insertions: MarkdownInsertion[] = [
  { label: '見出し', prefix: '## ', fallback: '見出し' },
  { label: '太字', prefix: '**', suffix: '**', fallback: '強調する文章' },
  { label: '箇条書き', prefix: '- ', fallback: '項目' },
  { label: 'リンク', prefix: '[', suffix: '](https://)', fallback: 'リンク名' },
];

export function MarkdownEditor({
  id,
  label,
  value,
  onChange,
  placeholder,
  help,
  error,
  disabled,
  className,
}: MarkdownEditorProps) {
  const generatedId = useId();
  const editorId = id ?? `markdown-editor-${generatedId}`;
  const helpId = help ? `${editorId}-help` : undefined;
  const errorId = error ? `${editorId}-error` : undefined;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const insertMarkdown = ({ prefix, suffix = '', fallback }: MarkdownInsertion) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || fallback;
    const inserted = `${prefix}${selected}${suffix}`;
    onChange(`${value.slice(0, start)}${inserted}${value.slice(end)}`);
    setMode('edit');
    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  const descriptionId = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={['grid gap-2', className].filter(Boolean).join(' ')}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label htmlFor={editorId} className="!my-0 text-xs font-black tracking-[0.02em] text-[#4f5767]">{label}</label>
        <div className="flex gap-1 rounded-xl border border-myr-ink/12 bg-white/55 p-1" aria-label={`${label}の表示切替`}>
          <Button type="button" variant={mode === 'edit' ? 'primary' : 'ghost'} size="sm" aria-pressed={mode === 'edit'} onClick={() => setMode('edit')}>編集</Button>
          <Button type="button" variant={mode === 'preview' ? 'primary' : 'ghost'} size="sm" aria-pressed={mode === 'preview'} onClick={() => setMode('preview')}>プレビュー</Button>
        </div>
      </div>

      {mode === 'edit' ? (
        <>
          <div className="flex flex-wrap gap-1 border-y border-myr-ink/10 py-1.5" aria-label={`${label}のMarkdownツールバー`}>
            {insertions.map((insertion) => (
              <Button key={insertion.label} type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => insertMarkdown(insertion)}>{insertion.label}</Button>
            ))}
          </div>
          <Textarea
            ref={textareaRef}
            id={editorId}
            aria-label={label}
            aria-describedby={descriptionId}
            aria-invalid={error ? true : undefined}
            value={value}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            spellCheck
          />
        </>
      ) : (
        <article
          className="min-h-[280px] overflow-auto border-b-2 border-myr-ink/20 bg-white/40 px-4 py-3 text-base leading-7 text-myr-ink [&_a]:font-bold [&_a]:text-myr-iris [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-myr-gold [&_blockquote]:pl-4 [&_h1]:font-myr-display [&_h1]:text-3xl [&_h2]:font-myr-display [&_h2]:text-2xl [&_h3]:font-myr-display [&_h3]:text-xl [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_ul]:list-disc"
          aria-label={`${label}のMarkdownプレビュー`}
        >
          {value.trim() ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown> : <p className="text-myr-slate-muted">Markdownを入力すると、ここにプレビューが表示されます。</p>}
        </article>
      )}

      {error ? <p id={errorId} role="alert" className="m-0 text-xs font-bold text-myr-ruby">{error}</p> : null}
      {help ? <p id={helpId} className="m-0 text-xs leading-5 text-myr-slate-muted">{help}</p> : null}
    </div>
  );
}
