import { useState } from 'react';
import type { NarrativeTurnApiResponse, SessionApiResponse, SessionExecutionApiResponse, SessionNoteProposalApiResponse } from './sessionPlayApi';

const statusCopy: Record<string, string> = {
  queued: '生成待ちです。', running: '生成しています……', 'retry-wait': '一時的な問題のため再試行します。',
  'cancel-requested': 'キャンセルしています……', failed: '生成できませんでした。', cancelled: 'キャンセルしました。',
  succeeded: '生成が完了しました。', superseded: 'Sessionが先へ進んだため、この結果は適用されませんでした。',
};
const kindCopy: Record<string, string> = { narrative: '物語', 'module-handoff': 'Module結果の物語', 'note-proposal': 'ノートの変更案', image: '場面の画像' };

export function SessionInputItem({ text }: { text: string }) {
  return <article className="session-input-item" data-testid="session-input-item" aria-label="Player Input"><span aria-hidden="true">⟶</span><p>{text}</p></article>;
}
export function NarrativeTurnItem({ turn }: { turn: NarrativeTurnApiResponse }) {
  return <article className="session-turn" data-testid="narrative-turn-item" aria-label="公開済みNarrative Turn"><p className="session-turn-narrative"><span className="session-turn-narrative-tag" aria-hidden="true">AI</span>{turn.narrative?.body ?? 'Narrativeを表示できません。'}</p></article>;
}
export function SessionExecutionItem({ execution, onAction }: { execution: SessionExecutionApiResponse; onAction?: (id: string, action: 'retry' | 'cancel' | 'dismiss') => void }) {
  const active = ['queued', 'running', 'retry-wait', 'cancel-requested'].includes(execution.status);
  const failed = execution.status === 'failed';
  return (
    <article className={`session-execution-item status-${execution.status}`} data-testid={`execution-${execution.id}`} role={failed ? 'alert' : 'status'} aria-live={active ? 'polite' : undefined}>
      <strong>{kindCopy[execution.kind] ?? execution.kind}: {statusCopy[execution.status] ?? execution.status}</strong>
      {execution.userErrorMessage && <p>{execution.userErrorMessage}</p>}
      {failed && <p>Player Inputと既存のNarrativeは保存されています。</p>}
      <div className="button-row">
        {execution.capabilities.canRetry && <button onClick={() => onAction?.(execution.id, 'retry')}>再試行</button>}
        {execution.capabilities.canCancel && <button onClick={() => onAction?.(execution.id, 'cancel')}>キャンセル</button>}
        {execution.capabilities.canDismiss && <button onClick={() => onAction?.(execution.id, 'dismiss')}>閉じる</button>}
      </div>
      {execution.developmentDiagnostics && (
        <details className="execution-diagnostics"><summary>開発者向け詳細</summary>
          <dl><dt>Execution ID</dt><dd><code>{execution.id}</code></dd><dt>Session ID</dt><dd><code>{execution.developmentDiagnostics.sessionId}</code></dd><dt>Revision</dt><dd>{execution.developmentDiagnostics.revision}</dd><dt>Lease</dt><dd>{execution.developmentDiagnostics.leaseOwner ?? '—'} {execution.developmentDiagnostics.leaseTokenHint ?? ''}</dd></dl>
          {execution.developmentDiagnostics.attempts.map((attempt) => <section key={attempt.id} className="execution-attempt"><strong>Attempt {attempt.attemptNumber}</strong><pre>{JSON.stringify(attempt, null, 2)}</pre></section>)}
        </details>
      )}
    </article>
  );
}
export type NoteReviewRequest = { expectedNoteRevision: number; title?: string; body?: string };
export function NoteProposalItem({ proposal, onReview }: { proposal: SessionNoteProposalApiResponse; onReview?: (id: string, action: 'apply' | 'edit-apply' | 'reject' | 'snooze', request: NoteReviewRequest) => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(proposal.proposedTitle);
  const [body, setBody] = useState(proposal.proposedBody);
  const request = { expectedNoteRevision: proposal.expectedNoteRevision };
  return <article className="note-proposal-item" data-testid="note-proposal-item"><strong>ノート変更案: {proposal.proposedTitle}</strong><div className="note-proposal-diff"><del>{proposal.beforeBody || '（新規ノート）'}</del><ins>{proposal.proposedBody}</ins></div><p>根拠: {proposal.rationale}</p>{editing && <fieldset aria-label="ノート変更案を編集"><label>タイトル<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>本文<textarea value={body} onChange={(event) => setBody(event.target.value)} /></label><div className="button-row"><button onClick={() => onReview?.(proposal.artifactId, 'edit-apply', { ...request, title, body })}>編集内容を適用</button><button onClick={() => setEditing(false)}>編集をやめる</button></div></fieldset>}{proposal.status === 'pending' && !editing && <div className="button-row"><button onClick={() => onReview?.(proposal.artifactId, 'apply', request)}>適用</button><button onClick={() => setEditing(true)}>編集して適用</button><button onClick={() => onReview?.(proposal.artifactId, 'reject', request)}>却下</button><button onClick={() => onReview?.(proposal.artifactId, 'snooze', request)}>後で</button></div>}</article>;
}
export function ImageArtifactItem({ mediaUrl, contentType }: { mediaUrl?: string | null; contentType: string }) {
  return <figure className="image-artifact-item" data-testid="image-artifact-item">{mediaUrl ? <img src={mediaUrl} alt="生成された場面" loading="lazy" /> : <div role="img" aria-label="画像Artifactのプレビュー">画像プレビュー</div>}<figcaption>{contentType} / Narrativeとは独立した任意成果物</figcaption></figure>;
}

export function SessionActivityFeed({ session, onExecutionAction, onNoteReview }: { session: SessionApiResponse; onExecutionAction?: (id: string, action: 'retry' | 'cancel' | 'dismiss') => void; onNoteReview?: (id: string, action: 'apply' | 'edit-apply' | 'reject' | 'snooze', request: NoteReviewRequest) => void }) {
  const inputs = new Map((session.inputs ?? []).map((item) => [item.id, item]));
  const executions = new Map((session.executions ?? []).map((item) => [item.id, item]));
  const turns = new Map(session.turns.map((item) => [item.id, item]));
  const artifacts = new Map((session.artifacts ?? []).map((item) => [item.id, item]));
  const proposals = new Map((session.noteProposals ?? []).map((item) => [item.artifactId, item]));
  const activity = session.activity ?? [];
  return <section className="dialogue-log session-activity-feed" role="log" aria-label="Session activity" data-testid="session-activity-feed">
    {activity.map((item) => {
      if (item.type === 'input') { const input = inputs.get(item.id); return input ? <SessionInputItem key={`input-${item.id}`} text={input.text} /> : null; }
      if (item.type === 'execution') { const execution = executions.get(item.id); return execution ? <SessionExecutionItem key={`execution-${item.id}`} execution={execution} onAction={onExecutionAction} /> : null; }
      if (item.type === 'turn') { const turn = turns.get(item.id); return turn ? <NarrativeTurnItem key={`turn-${item.id}`} turn={turn} /> : null; }
      const artifact = artifacts.get(item.id); if (!artifact) return null;
      if (artifact.kind === 'image') return <ImageArtifactItem key={`artifact-${item.id}`} mediaUrl={artifact.mediaUrl} contentType={artifact.contentType} />;
      if (artifact.kind === 'note-patch') { const proposal = proposals.get(item.id); return proposal ? <NoteProposalItem key={`artifact-${item.id}`} proposal={proposal} onReview={onNoteReview} /> : null; }
      return null;
    })}
  </section>;
}
