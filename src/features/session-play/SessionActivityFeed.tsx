import { useEffect, useState } from 'react';
import { Button, Input, Textarea, toneTextClassNames, type BadgeTone } from '../../components/ui';
import type { NarrativeTurnApiResponse, SessionApiResponse, SessionExecutionApiResponse, SessionNoteProposalApiResponse } from './sessionPlayApi';
import './SessionActivityFeed.css';

const statusCopy: Record<string, string> = {
  queued: '生成待ちです。', running: '生成しています……', 'retry-wait': '一時的な問題のため再試行します。',
  'cancel-requested': 'キャンセルしています……', failed: '生成できませんでした。', cancelled: 'キャンセルしました。',
  succeeded: '生成が完了しました。', superseded: 'Sessionが先へ進んだため、この結果は適用されませんでした。',
};
const kindCopy: Record<string, string> = { narrative: '物語', 'module-handoff': 'Module結果の物語', 'note-proposal': 'ノートの変更案', image: '場面の画像' };

const executionStatusTone: Record<SessionExecutionApiResponse['status'], BadgeTone> = {
  queued: 'neutral',
  running: 'info',
  'retry-wait': 'warning',
  'cancel-requested': 'warning',
  failed: 'danger',
  cancelled: 'neutral',
  succeeded: 'success',
  superseded: 'neutral',
};

const executionStatusClass: Record<SessionExecutionApiResponse['status'], string> = {
  queued: toneTextClassNames[executionStatusTone.queued],
  running: toneTextClassNames[executionStatusTone.running],
  'retry-wait': toneTextClassNames[executionStatusTone['retry-wait']],
  'cancel-requested': toneTextClassNames[executionStatusTone['cancel-requested']],
  failed: toneTextClassNames[executionStatusTone.failed],
  cancelled: `${toneTextClassNames[executionStatusTone.cancelled]} opacity-72`,
  succeeded: toneTextClassNames[executionStatusTone.succeeded],
  superseded: `${toneTextClassNames[executionStatusTone.superseded]} opacity-72`,
};
const artifactClass = 'mx-auto mb-3 w-[min(100%,720px)] rounded-myr-card border border-myr-ink/14 bg-[#fffbf1] px-4 py-3.5';

export function SessionInputItem({ text }: { text: string }) {
  return <article className="session-input-item mt-0.5 mr-2 mb-2 ml-[52px] w-fit max-w-[min(82%,620px)] justify-self-end rounded-[18px_18px_5px_18px] border border-[#c9bce4] bg-[#ebe5f8] px-[15px] py-[11px] text-[#2c2440] shadow-[0_7px_20px_rgba(58,43,83,.14)]" data-testid="session-input-item" aria-label="Player Input"><p className="m-0 font-bold leading-[1.55]">{text}</p></article>;
}

export function NarrativeTurnItem({ turn }: { turn: NarrativeTurnApiResponse }) {
  return <article className="grid gap-2 rounded-myr-card border border-myr-ink/14 bg-[rgba(255,254,249,.68)] p-3.5" data-testid="narrative-turn-item" aria-label="公開済みNarrative Turn"><p className="m-0 max-w-none leading-[1.65] text-[#303644]"><span className="mr-2 inline-block rounded-full bg-myr-gold px-2 py-px align-middle text-[10px] font-black tracking-[.1em] text-[#17151f]" aria-hidden="true">AI</span>{turn.narrative?.body ?? 'Narrativeを表示できません。'}</p></article>;
}

const activeExecutionStatuses = ['queued', 'running', 'retry-wait', 'cancel-requested'];
const formatElapsed = (milliseconds: number) => {
  const totalSeconds = Number.isFinite(milliseconds) ? Math.max(0, Math.floor(milliseconds / 1000)) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}時間${minutes % 60}分`;
  if (minutes > 0) return `${minutes}分${seconds}秒`;
  return `${seconds}秒`;
};

function ExecutionStatusLine({ execution, elapsed }: { execution: SessionExecutionApiResponse; elapsed: string }) {
  return <span className="execution-status-copy inline-flex items-baseline justify-end gap-2" key={`${execution.status}-${execution.revision}`}>
    {kindCopy[execution.kind] ?? execution.kind}: {statusCopy[execution.status] ?? execution.status}
    <span className="whitespace-nowrap text-[color-mix(in_srgb,currentColor_68%,transparent)] tabular-nums" aria-hidden="true">{elapsed}</span>
  </span>;
}

export function SessionExecutionItem({ execution, onAction, keepSucceededStatusVisible = false }: { execution: SessionExecutionApiResponse; onAction?: (id: string, action: 'retry' | 'cancel' | 'dismiss') => void; keepSucceededStatusVisible?: boolean }) {
  const active = activeExecutionStatuses.includes(execution.status);
  const failed = execution.status === 'failed';
  const succeeded = execution.status === 'succeeded';
  const [now, setNow] = useState(() => Date.now());
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    setHidden(false);
    if (!succeeded || keepSucceededStatusVisible) return undefined;
    const timer = window.setTimeout(() => setHidden(true), 720);
    return () => window.clearTimeout(timer);
  }, [succeeded, execution.revision, keepSucceededStatusVisible]);

  if (hidden) return null;
  const startedAt = Date.parse(execution.startedAt ?? execution.createdAt);
  const finishedAt = execution.completedAt ? Date.parse(execution.completedAt) : now;
  const elapsed = formatElapsed(finishedAt - startedAt);
  const statusLine = <ExecutionStatusLine execution={execution} elapsed={elapsed} />;
  const canCancelInput = failed && execution.triggerType === 'player-input' && execution.capabilities.canDismiss;
  const actions = (execution.capabilities.canRetry || execution.capabilities.canCancel || canCancelInput) && <div className={`execution-actions flex min-h-[26px] justify-end gap-1.5 ${failed ? 'mt-[5px]' : 'mt-1'}`}>
    {execution.capabilities.canRetry && <Button variant="ghost" size="sm" onClick={() => onAction?.(execution.id, 'retry')}>再試行</Button>}
    {execution.capabilities.canCancel && <Button variant="ghost" size="sm" onClick={() => onAction?.(execution.id, 'cancel')}>キャンセル</Button>}
    {canCancelInput && <Button variant="ghost" size="sm" onClick={() => onAction?.(execution.id, 'dismiss')}>入力取り消し</Button>}
  </div>;

  return (
    <article className={`session-execution-item status-${execution.status} -mt-[3px] mr-2 mb-2 ml-auto w-[min(100%,680px)] justify-self-end border-0 bg-transparent p-0 text-right text-myr-caption leading-[1.45] ${executionStatusClass[execution.status]} ${succeeded && !keepSucceededStatusVisible ? 'execution-is-completing' : ''}`} data-testid={`execution-${execution.id}`} role={failed ? 'alert' : 'status'} aria-live={active ? 'polite' : undefined}>
      {execution.developmentDiagnostics ? <details className="m-0">
        <summary className="execution-diagnostics-summary min-h-5 cursor-pointer list-inside text-inherit select-none focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-myr-iris">{statusLine}</summary>
        <div className="mt-[7px] ml-auto w-[min(100%,620px)] rounded-xl bg-white/[.045] px-3.5 py-3 text-left text-[#aaa2b3]">
          <span className="mb-2 block font-extrabold">開発者向け詳細</span>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 [&_dd]:m-0 [&_dd]:wrap-anywhere"><dt>Execution ID</dt><dd><code>{execution.id}</code></dd><dt>Session ID</dt><dd><code>{execution.developmentDiagnostics.sessionId}</code></dd><dt>Revision</dt><dd>{execution.developmentDiagnostics.revision}</dd><dt>Lease</dt><dd>{execution.developmentDiagnostics.leaseOwner ?? '—'} {execution.developmentDiagnostics.leaseTokenHint ?? ''}</dd></dl>
          {execution.developmentDiagnostics.attempts.map((attempt) => <section key={attempt.id} className="mt-3.5">
            <strong>Attempt {attempt.attemptNumber}</strong>
            <dl className="my-[7px] mb-2.5 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 [&_dd]:m-0 [&_dd]:wrap-anywhere"><dt>Status</dt><dd>{attempt.status}</dd><dt>Provider</dt><dd>{attempt.provider ?? '—'} / {attempt.model ?? '—'}</dd><dt>Latency</dt><dd>{attempt.latencyMilliseconds == null ? '—' : `${attempt.latencyMilliseconds}ms`}</dd></dl>
            {attempt.sentPrompt && <ExecutionPayload label="送信したプロンプト" value={attempt.sentPrompt} />}
            {attempt.receivedResult && <ExecutionPayload label="受信した結果" value={attempt.receivedResult} />}
            {attempt.validationResult && <ExecutionPayload label="バリデーション結果" value={attempt.validationResult} />}
            {(attempt.exceptionChain || attempt.redactedResponseExcerpt) && <ExecutionPayload label="例外情報" value={JSON.stringify({ exceptionChain: attempt.exceptionChain, redactedResponseExcerpt: attempt.redactedResponseExcerpt }, null, 2)} />}
          </section>)}
        </div>
      </details> : <div className="min-h-5 text-inherit">{statusLine}</div>}
      {actions}
    </article>
  );
}

function ExecutionPayload({ label, value }: { label: string; value: string }) {
  return <details className="mt-1.5 border-t border-[#aaa2b3]/18 pt-1.5"><summary className="cursor-pointer font-[750]">{label}</summary><pre className="mt-[7px] max-h-[260px] overflow-auto wrap-anywhere whitespace-pre-wrap rounded-lg bg-black/18 p-[9px] text-left text-myr-caption text-[#c8c1d0]">{value}</pre></details>;
}

export type NoteReviewRequest = { expectedNoteRevision: number; title?: string; body?: string };
export function NoteProposalItem({ proposal, onReview }: { proposal: SessionNoteProposalApiResponse; onReview?: (id: string, action: 'apply' | 'edit-apply' | 'reject' | 'snooze', request: NoteReviewRequest) => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(proposal.proposedTitle);
  const [body, setBody] = useState(proposal.proposedBody);
  const request = { expectedNoteRevision: proposal.expectedNoteRevision };
  return <article className={artifactClass} data-testid="note-proposal-item"><strong>ノート変更案: {proposal.proposedTitle}</strong><div className="my-2.5 grid gap-2 [&_del]:block [&_del]:rounded-myr-control [&_del]:bg-[#fff0ef] [&_del]:p-2.5 [&_del]:no-underline [&_ins]:block [&_ins]:rounded-myr-control [&_ins]:bg-[#eff9f1] [&_ins]:p-2.5 [&_ins]:no-underline"><del>{proposal.beforeBody || '（新規ノート）'}</del><ins>{proposal.proposedBody}</ins></div><p>根拠: {proposal.rationale}</p>{editing && <fieldset aria-label="ノート変更案を編集"><label>タイトル<Input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>本文<Textarea value={body} onChange={(event) => setBody(event.target.value)} /></label><div className="button-row"><Button variant="primary" size="sm" onClick={() => onReview?.(proposal.artifactId, 'edit-apply', { ...request, title, body })}>編集内容を適用</Button><Button variant="ghost" size="sm" onClick={() => setEditing(false)}>編集をやめる</Button></div></fieldset>}{proposal.status === 'pending' && !editing && <div className="button-row"><Button variant="primary" size="sm" onClick={() => onReview?.(proposal.artifactId, 'apply', request)}>適用</Button><Button variant="secondary" size="sm" onClick={() => setEditing(true)}>編集して適用</Button><Button variant="danger" size="sm" onClick={() => onReview?.(proposal.artifactId, 'reject', request)}>却下</Button><Button variant="ghost" size="sm" onClick={() => onReview?.(proposal.artifactId, 'snooze', request)}>あとで</Button></div>}</article>;
}
export function ImageArtifactItem({ mediaUrl, contentType }: { mediaUrl?: string | null; contentType: string }) {
  return <figure className={artifactClass} data-testid="image-artifact-item">{mediaUrl ? <img className="block max-h-[420px] w-full rounded-xl object-cover" src={mediaUrl} alt="生成された場面" loading="lazy" /> : <div className="grid min-h-[180px] place-items-center rounded-xl bg-[linear-gradient(135deg,#d7d0f6,#b9dce0)] font-extrabold" role="img" aria-label="画像Artifactのプレビュー">画像プレビュー</div>}<figcaption>{contentType} / Narrativeとは独立した任意成果物</figcaption></figure>;
}

export function SessionActivityFeed({ session, onExecutionAction, onNoteReview, keepSucceededStatusVisible = false }: { session: SessionApiResponse; onExecutionAction?: (id: string, action: 'retry' | 'cancel' | 'dismiss') => void; onNoteReview?: (id: string, action: 'apply' | 'edit-apply' | 'reject' | 'snooze', request: NoteReviewRequest) => void; keepSucceededStatusVisible?: boolean }) {
  const inputs = new Map((session.inputs ?? []).map((item) => [item.id, item]));
  const executions = new Map((session.executions ?? []).map((item) => [item.id, item]));
  const turns = new Map(session.turns.map((item) => [item.id, item]));
  const artifacts = new Map((session.artifacts ?? []).map((item) => [item.id, item]));
  const proposals = new Map((session.noteProposals ?? []).map((item) => [item.artifactId, item]));
  const activity = session.activity ?? [];
  return <section className="grid max-h-[48vh] gap-2.5 overflow-auto pr-1.5" role="log" aria-label="Session activity" data-testid="session-activity-feed">
    {activity.map((item) => {
      if (item.type === 'input') { const input = inputs.get(item.id); return input ? <SessionInputItem key={`input-${item.id}`} text={input.text} /> : null; }
      if (item.type === 'execution') { const execution = executions.get(item.id); return execution ? <SessionExecutionItem key={`execution-${item.id}`} execution={execution} onAction={onExecutionAction} keepSucceededStatusVisible={keepSucceededStatusVisible} /> : null; }
      if (item.type === 'turn') { const turn = turns.get(item.id); return turn ? <NarrativeTurnItem key={`turn-${item.id}`} turn={turn} /> : null; }
      const artifact = artifacts.get(item.id); if (!artifact) return null;
      if (artifact.kind === 'image') return <ImageArtifactItem key={`artifact-${item.id}`} mediaUrl={artifact.mediaUrl} contentType={artifact.contentType} />;
      if (artifact.kind === 'note-patch') { const proposal = proposals.get(item.id); return proposal ? <NoteProposalItem key={`artifact-${item.id}`} proposal={proposal} onReview={onNoteReview} /> : null; }
      return null;
    })}
  </section>;
}
