import * as Toggle from '@radix-ui/react-toggle';
import React, { useEffect, useMemo, useState } from 'react';
import { AddonPanel } from '@storybook/components';
import { addons, types, useChannel } from '@storybook/manager-api';
import { ADDON_ID, EVENTS, PANEL_ID, type CommentMode, type SelectedTarget, type StoryComment } from './constants';
import { commentSummary } from './dom';

const emptySelection: SelectedTarget = {
  id: '未選択',
  label: '未選択',
  elementName: 'none',
  selector: '選択モードでプレビュー内のHTML要素をクリックしてください。',
  elementText: '',
};

const panelStyle: React.CSSProperties = {
  height: '100%',
  padding: 16,
  display: 'grid',
  gap: 12,
  alignContent: 'start',
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
};

const codeStyle: React.CSSProperties = {
  display: 'block',
  padding: 10,
  borderRadius: 10,
  background: '#f6f2ff',
  color: '#45289a',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  fontSize: 12,
};

const buttonStyle = (active = false): React.CSSProperties => ({
  border: 0,
  borderRadius: 999,
  padding: '9px 12px',
  cursor: 'pointer',
  fontWeight: 800,
  color: active ? '#121019' : 'var(--myr-color-paper)',
  background: active ? '#ff9f68' : '#241b2f',
});

const CommentPanel = () => {
  const [mode, setMode] = useState<CommentMode>('interactive');
  const [selected, setSelected] = useState<SelectedTarget>(emptySelection);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [copyMessage, setCopyMessage] = useState('');
  const summary = useMemo(() => commentSummary(comments), [comments]);

  const emit = useChannel({
    [EVENTS.TARGET_SELECTED]: (selection: SelectedTarget) => setSelected(selection),
  });

  useEffect(() => {
    emit(EVENTS.MODE_CHANGED, mode);
  }, [emit, mode]);

  useEffect(() => {
    emit(EVENTS.COMMENTS_UPDATED, comments);
  }, [comments, emit]);

  const addComment = () => {
    const text = commentText.trim();
    if (!text || selected === emptySelection) return;
    setComments((current) => [...current, { ...selected, text }]);
    setCommentText('');
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyMessage('コピーしました。Codexへ貼り付けられます。');
    } catch {
      setCopyMessage('自動コピーできませんでした。まとめ欄を手動でコピーしてください。');
    }
  };

  return (
    <div style={panelStyle}>
      <div>
        <h2 style={{ margin: 0 }}>コメント</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--myr-color-ink-subtle)' }}>HTML要素を選び、Codexへ渡すレビューコメントを集めます。</p>
      </div>

      <div style={buttonRowStyle} role="group" aria-label="コメント操作モード">
        <Toggle.Root style={buttonStyle(mode === 'interactive')} pressed={mode === 'interactive'} onPressedChange={() => setMode('interactive')}>
          インタラクティブ
        </Toggle.Root>
        <Toggle.Root style={buttonStyle(mode === 'select')} pressed={mode === 'select'} onPressedChange={() => setMode('select')}>
          選択
        </Toggle.Root>
      </div>
      <p style={{ margin: 0, color: 'var(--myr-color-ink-subtle)' }}>
        {mode === 'select'
          ? '選択モード中はボタンや入力欄を実行せず、クリックしたHTML要素をコメント対象にします。'
          : 'インタラクティブモード中は通常操作を優先します。'}
      </p>

      <section aria-label="選択中のHTML要素">
        <strong>選択中: {selected.label}</strong>
        <code style={codeStyle}>{selected.selector}</code>
        <small>&lt;{selected.elementName}&gt; {selected.elementText}</small>
      </section>

      <textarea
        aria-label="コメント内容"
        value={commentText}
        onChange={(event) => setCommentText(event.target.value)}
        placeholder="このHTML要素へのコメントを書く"
        style={{ minHeight: 90, borderRadius: 12, border: '1px solid #d8cee7', padding: 10, resize: 'vertical' }}
      />
      <button style={buttonStyle(true)} onClick={addComment}>コメントを追加</button>

      <section aria-label="コメント一覧" style={{ display: 'grid', gap: 8 }}>
        {comments.length === 0 ? (
          <p style={{ color: 'var(--myr-color-ink-subtle)' }}>コメントはまだありません。</p>
        ) : comments.map((comment, index) => (
          <article key={`${comment.selector}-${index}`} style={{ border: '1px solid #e3d8ef', borderRadius: 12, padding: 10 }}>
            <strong>{comment.label}</strong>
            <code style={codeStyle}>{comment.selector}</code>
            <p style={{ marginBottom: 0 }}>{comment.text}</p>
          </article>
        ))}
      </section>

      <section aria-label="Codex連携" style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Codex連携用まとめ</h3>
        <button style={buttonStyle()} onClick={copySummary}>コメントをまとめてコピー</button>
        {copyMessage && <p role="status" style={{ margin: 0, color: '#45289a' }}>{copyMessage}</p>}
        <textarea aria-label="Codex連携用コメントまとめ" readOnly value={summary} style={{ minHeight: 150, borderRadius: 12, border: '1px solid #d8cee7', padding: 10, fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 12 }} />
      </section>
    </div>
  );
};

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'コメント',
    render: ({ active }) => (
      <AddonPanel active={!!active}>
        <CommentPanel />
      </AddonPanel>
    ),
  });
});
