import { useMemo, useRef, useState } from 'react';
import type { AppChromeAccount } from '../../account/accountPresentation';
import type { AiPlaygroundGenerationOverrides, AiPlaygroundRole } from '../../account/api/adminAiApi';
import { Badge, Button, Input, Label, Notice, PageCanvas, PageShell, Panel, Textarea } from '../../components/ui';
import { AppChrome } from '../../shared/AppChrome';
import type { AiPlaygroundActions, AiPlaygroundRunMetadata, AiPlaygroundState, EditableAiPlaygroundMessage } from './aiPlaygroundModel';
import { exportConversation, parseConversationImport, toRequestMessages } from './aiPlaygroundModel';

type Props = { account: AppChromeAccount | null; state: AiPlaygroundState; actions: AiPlaygroundActions };
type GenerationDraft = { temperature: string; topP: string; maximumOutputTokens: string; seed: string; retryAttempts: string };
const roleTone = { system: 'info', user: 'warning', assistant: 'success' } as const;
const starter = [
  { role: 'system' as const, content: 'あなたは架空世界の案内役です。簡潔に、情景が伝わるように答えてください。' },
  { role: 'user' as const, content: '古い天文台の扉を開けます。中の様子を教えてください。' },
];
const defaultGeneration: GenerationDraft = { temperature: '0.7', topP: '', maximumOutputTokens: '800', seed: '', retryAttempts: '0' };

function toOptionalNumber(value: string) { return value.trim() === '' ? null : Number(value); }

export function AiPlaygroundPresentation({ account, state, actions }: Props) {
  const nextId = useRef(1);
  const createMessages = (items: { role: AiPlaygroundRole; content: string }[]) => items.map((item) => ({ ...item, id: `message-${nextId.current++}` }));
  const [messages, setMessages] = useState<EditableAiPlaygroundMessage[]>(() => createMessages(starter));
  const [generation, setGeneration] = useState<GenerationDraft>(defaultGeneration);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('送信される順序で架空の会話を編集し、次のassistant応答を生成します。');
  const [noticeTone, setNoticeTone] = useState<'info' | 'danger' | 'success'>('info');
  const [metadata, setMetadata] = useState<AiPlaygroundRunMetadata | null>(null);
  const [importText, setImportText] = useState('');
  const [exportText, setExportText] = useState('');

  const ready = state.status === 'ready' ? state : null;
  const selectedProfile = ready?.profiles.find((profile) => profile.id === ready.selectedProfileId) ?? null;
  const hasBlankMessage = messages.some((message) => !message.content.trim());
  const generationOverrides = useMemo<AiPlaygroundGenerationOverrides>(() => ({
    temperature: toOptionalNumber(generation.temperature), topP: toOptionalNumber(generation.topP), maximumOutputTokens: toOptionalNumber(generation.maximumOutputTokens), seed: toOptionalNumber(generation.seed), retryAttempts: toOptionalNumber(generation.retryAttempts),
  }), [generation]);

  const addMessage = (role: AiPlaygroundRole) => setMessages((current) => [...current, ...createMessages([{ role, content: '' }])]);
  const updateMessage = (id: string, update: Partial<Pick<EditableAiPlaygroundMessage, 'role' | 'content'>>) => setMessages((current) => current.map((message) => message.id === id ? { ...message, ...update } : message));
  const moveMessage = (index: number, direction: -1 | 1) => setMessages((current) => { const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const importMessages = () => {
    const result = parseConversationImport(importText);
    setNotice(result.message); setNoticeTone(result.ok ? 'success' : 'danger');
    if (result.ok && result.value) setMessages(createMessages(result.value));
  };
  const exportMessages = async () => {
    const value = exportConversation(messages); setExportText(value); setNotice('role/contentだけをJSONへ書き出しました。'); setNoticeTone('success');
    try { await navigator.clipboard?.writeText(value); } catch { /* Textarea remains available for manual copy. */ }
  };
  const generate = async () => {
    if (messages.length === 0 || hasBlankMessage) { setNotice('空でないmessageを1件以上用意してください。'); setNoticeTone('danger'); return; }
    if (!selectedProfile) { setNotice('実行可能なAI Profileがありません。'); setNoticeTone('danger'); return; }
    setWorking(true);
    try {
      const result = await actions.generate(toRequestMessages(messages), generationOverrides);
      setNotice(result.message); setNoticeTone(result.ok ? 'success' : 'danger');
      if (result.ok && result.value) {
        setMessages((current) => [...current, ...createMessages([result.value!.message])]);
        setMetadata(result.value.metadata);
      }
    } finally { setWorking(false); }
  };

  return <AppChrome section="operations" breadcrumbs={[{ label: 'Myriale', to: 'home' }, { label: '運用', to: 'adminAiProviders' }, { label: 'AI Playground' }]} account={account} onLogout={actions.logout}>
    <PageCanvas data-myriale-theme="archive"><PageShell width="chrome" className="gap-6" aria-label="AI Conversation Playground">
      <header className="grid gap-3 border-b border-[#17151f]/15 pb-5">
        <p className="kicker m-0 text-[#5c4f8f]">Ephemeral admin workspace</p>
        <Label as="h1" textRole="sectionEditorial" className="m-0">AI Conversation Playground</Label>
        <p className="m-0 max-w-4xl leading-7 text-myr-ink-subtle">system / user / assistant の履歴をブラウザ内だけで組み立てます。API keyやProvider base URLは表示・送信しません。</p>
        <Notice tone={noticeTone} role={noticeTone === 'danger' ? 'alert' : 'status'} data-testid="ai-playground-notice">{notice}</Notice>
      </header>

      {state.status === 'loading' && <Notice tone="info">AI Profileを読み込んでいます。</Notice>}
      {state.status === 'error' && <Panel className="grid gap-3"><Notice tone="danger" role="alert">{state.message}</Notice><Button className="w-fit" variant="secondary" onClick={actions.retry}>もう一度読み込む</Button></Panel>}
      {ready && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Panel as="section" className="grid gap-5" aria-label="会話コンテキスト">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><Label as="h2" textRole="sectionEditorial" className="m-0 !text-3xl">Conversation context</Label><p className="m-0 text-sm text-myr-ink-subtle">番号とrailがAPIへ送信される順序を表します。</p></div>
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => setMessages(createMessages(starter))}>サンプル初期化</Button><Button size="sm" variant="secondary" onClick={() => { setMessages([]); setMetadata(null); }}>全消去</Button></div>
          </div>
          <ol className="relative m-0 grid list-none gap-4 p-0 before:absolute before:top-6 before:bottom-6 before:left-[1.05rem] before:w-px before:bg-[#5c4f8f]/35">
            {messages.map((message, index) => <li key={message.id} className="relative grid grid-cols-[2.2rem_minmax(0,1fr)] gap-3" data-testid={`playground-message-${index}`}>
              <div className="relative z-10 grid size-8 place-items-center rounded-full border-2 border-[#5c4f8f] bg-myr-paper text-xs font-black" aria-hidden="true">{index + 1}</div>
              <article className="grid gap-3 rounded-xl border border-[#17151f]/15 bg-white/75 p-4 shadow-sm" aria-label={`${index + 1}番目の${message.role} message`}>
                <div className="flex flex-wrap items-center gap-2"><Badge tone={roleTone[message.role]}>{message.role.toUpperCase()}</Badge><label className="text-xs font-bold">Role<select aria-label={`${index + 1}番目のmessage role`} className="ml-2 rounded-lg border border-[#17151f]/20 bg-white px-2 py-1" value={message.role} onChange={(event) => updateMessage(message.id, { role: event.target.value as AiPlaygroundRole })}><option value="system">system</option><option value="user">user</option><option value="assistant">assistant</option></select></label><div className="ml-auto flex gap-1"><Button size="sm" variant="secondary" aria-label={`${index + 1}番目を上へ`} disabled={index === 0} onClick={() => moveMessage(index, -1)}>↑</Button><Button size="sm" variant="secondary" aria-label={`${index + 1}番目を下へ`} disabled={index === messages.length - 1} onClick={() => moveMessage(index, 1)}>↓</Button><Button size="sm" variant="danger" aria-label={`${index + 1}番目を削除`} onClick={() => setMessages((current) => current.filter((item) => item.id !== message.id))}>削除</Button></div></div>
                <Textarea aria-label={`${index + 1}番目のmessage content`} value={message.content} onChange={(event) => updateMessage(message.id, { content: event.target.value })} className="!min-h-28" placeholder={`${message.role} messageを入力`} />
              </article>
            </li>)}
          </ol>
          {messages.length === 0 && <div className="rounded-xl border border-dashed border-[#17151f]/25 p-8 text-center text-myr-ink-subtle">会話履歴は空です。messageを追加するかJSONをimportしてください。</div>}
          <div className="flex flex-wrap gap-2" aria-label="message追加"><Button variant="secondary" onClick={() => addMessage('system')}>+ system</Button><Button variant="secondary" onClick={() => addMessage('user')}>+ user</Button><Button variant="secondary" onClick={() => addMessage('assistant')}>+ assistant</Button></div>
          <details className="rounded-xl border border-[#17151f]/15 bg-white/60 p-4"><summary className="cursor-pointer font-bold">JSON import / export</summary><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="grid gap-2 font-bold">Import JSON<Textarea aria-label="会話履歴import JSON" className="font-mono text-xs" value={importText} onChange={(event) => setImportText(event.target.value)} /><Button variant="secondary" onClick={importMessages}>JSONを読み込む</Button></label><label className="grid gap-2 font-bold">Export JSON<Textarea aria-label="会話履歴export JSON" className="font-mono text-xs" readOnly value={exportText} placeholder="書き出すとrole/contentだけが表示されます。" /><Button variant="secondary" onClick={() => void exportMessages()}>JSONを書き出す</Button></label></div></details>
        </Panel>

        <aside className="grid gap-5 lg:sticky lg:top-28" aria-label="実行設定と結果">
          <Panel as="section" className="grid gap-4" aria-label="実行設定"><Label as="h2" textRole="sectionEditorial" className="m-0 !text-2xl">Run settings</Label><label className="grid gap-2 font-bold">AI Profile<select aria-label="AI Profile" className="rounded-xl border border-[#17151f]/20 bg-white px-3 py-2" value={ready.selectedProfileId ?? ''} onChange={(event) => actions.selectProfile(event.target.value)}><option value="" disabled>Profileを選択</option>{ready.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName} — {profile.model}</option>)}</select></label>
            <details><summary className="cursor-pointer font-bold">Generation overrides</summary><div className="mt-3 grid grid-cols-2 gap-3"><label className="text-sm">Temperature<Input aria-label="Temperature" type="number" min="0" max="2" step="0.1" value={generation.temperature} onChange={(event) => setGeneration((current) => ({ ...current, temperature: event.target.value }))} /></label><label className="text-sm">Top P<Input aria-label="Top P" type="number" min="0" max="1" step="0.05" value={generation.topP} onChange={(event) => setGeneration((current) => ({ ...current, topP: event.target.value }))} /></label><label className="text-sm">Max output tokens<Input aria-label="Maximum output tokens" type="number" min="1" value={generation.maximumOutputTokens} onChange={(event) => setGeneration((current) => ({ ...current, maximumOutputTokens: event.target.value }))} /></label><label className="text-sm">Seed<Input aria-label="Seed" type="number" value={generation.seed} onChange={(event) => setGeneration((current) => ({ ...current, seed: event.target.value }))} /></label><label className="text-sm">Retry attempts<Input aria-label="Retry attempts" type="number" min="0" value={generation.retryAttempts} onChange={(event) => setGeneration((current) => ({ ...current, retryAttempts: event.target.value }))} /></label></div></details>
            <Button variant="primary" size="lg" disabled={working || !selectedProfile || messages.length === 0 || hasBlankMessage} onClick={() => void generate()}>{working ? '生成中…' : '次のassistant応答を生成'}</Button>
          </Panel>
          <Panel as="section" className="grid gap-3" aria-label="直近の実行結果" data-testid="ai-playground-metadata"><Label as="h2" textRole="sectionEditorial" className="m-0 !text-2xl">Last run</Label>{metadata ? <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-2 text-sm"><dt className="text-myr-ink-subtle">Provider / model</dt><dd className="m-0 break-words text-right font-bold">{metadata.provider} / {metadata.model}</dd><dt className="text-myr-ink-subtle">Tokens</dt><dd className="m-0 text-right">{metadata.inputTokens ?? '—'} in / {metadata.outputTokens ?? '—'} out</dd><dt className="text-myr-ink-subtle">Latency</dt><dd className="m-0 text-right">{metadata.latencyMilliseconds} ms</dd><dt className="text-myr-ink-subtle">Attempt / finish</dt><dd className="m-0 text-right">{metadata.attemptCount} / {metadata.finishReason ?? '—'}</dd><dt className="text-myr-ink-subtle">Response ID</dt><dd className="m-0 break-all text-right font-mono text-xs">{metadata.responseId ?? '—'}</dd><dt className="text-myr-ink-subtle">Request ID</dt><dd className="m-0 break-all text-right font-mono text-xs">{metadata.requestId ?? '—'}</dd></dl> : <p className="m-0 text-sm text-myr-ink-subtle">まだ実行していません。</p>}</Panel>
        </aside>
      </div>}
    </PageShell></PageCanvas>
  </AppChrome>;
}
