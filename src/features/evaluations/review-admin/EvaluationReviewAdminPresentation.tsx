import { useState } from 'react';
import { Badge, Button, Input, Notice, Panel } from '../../../components/ui';
import type {
  EvaluationReviewBatch,
  EvaluationSession,
} from '../api/evaluationsApi';
import { EvaluationPageFrame } from '../shared/EvaluationPageFrame';
import { EvaluationLoadState } from '../shared/EvaluationLoadState';
import type {
  EvaluationAccount,
  EvaluationCommand,
  LoadState,
} from '../shared/evaluationPageModel';
type Data = { session: EvaluationSession; batches: EvaluationReviewBatch[] };
export function EvaluationReviewAdminPresentation({
  account,
  evaluationId,
  state,
  busy,
  onCreateBatch,
  onClose,
  onReveal,
  onRetry,
  onNavigate,
  onLogout,
}: {
  account: EvaluationAccount;
  evaluationId: string;
  state: LoadState<Data>;
  busy: boolean;
  onCreateBatch: (label: string) => Promise<EvaluationCommand>;
  onClose: () => Promise<EvaluationCommand>;
  onReveal: () => Promise<EvaluationCommand>;
  onRetry: () => void;
  onNavigate: Parameters<typeof EvaluationPageFrame>[0]['onNavigate'];
  onLogout: () => void | Promise<void>;
}) {
  const [label, setLabel] = useState('');
  const [notice, setNotice] = useState(
    'Reviewer assignmentはopaque URLを使い、候補identityとmachine judgmentを含みません。',
  );
  return (
    <EvaluationPageFrame
      account={account}
      evaluationId={evaluationId}
      activeTab="reviews"
      title={
        state.status === 'ready'
          ? `${state.data.session.name} — レビュー管理`
          : 'レビュー管理'
      }
      kicker="Blind human review"
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <EvaluationLoadState state={state} onRetry={onRetry}>
        {({ session, batches }) => (
          <div className="grid gap-5">
            <Notice
              tone={notice.includes('できません') ? 'danger' : 'info'}
              data-testid="review-admin-notice"
            >
              {notice}
            </Notice>
            <Panel as="section" className="grid gap-4">
              <h2 className="m-0">Review batchを作成</h2>
              <div className="flex flex-wrap gap-3">
                <Input
                  aria-label="Reviewer account IDs"
                  className="max-w-md"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Reviewer account ID（複数はカンマ区切り）"
                />
                <Button
                  disabled={busy || !label.trim()}
                  onClick={() =>
                    void onCreateBatch(label).then((r) => {
                      setNotice(r.message);
                      if (r.ok) setLabel('');
                    })
                  }
                >
                  Opaque assignmentを発行
                </Button>
              </div>
              {batches.map((batch) => (
                <article
                  key={batch.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-myr-ink/10 py-3"
                >
                  <span>
                    <strong>{batch.reviewerLabel}</strong>
                    <small className="block text-myr-ink-subtle">
                      {batch.completedCount}/{batch.assignmentCount} items ·{' '}
                      {batch.id}
                    </small>
                    {batch.assignments.map((assignment) => (
                      <a
                        className="block text-sm"
                        href={`/evaluations/review/${assignment.opaqueCode}`}
                        key={assignment.opaqueCode}
                      >
                        {assignment.reviewerId}: {assignment.opaqueCode} (
                        {assignment.judgedItemCount}/{assignment.itemCount})
                      </a>
                    ))}
                  </span>
                  <Badge
                    tone={batch.status === 'completed' ? 'success' : 'info'}
                  >
                    {batch.status}
                  </Badge>
                </article>
              ))}
            </Panel>
            <Panel as="section" className="grid gap-4">
              <h2 className="m-0">Close / reveal sequence</h2>
              <p className="m-0 text-sm text-myr-ink-subtle">
                Human
                reviewをcloseしてjudgmentをlockした後にだけ、結果上の候補identityをrevealします。
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  disabled={busy || session.status === 'completed'}
                  onClick={() =>
                    void onClose().then((r) => setNotice(r.message))
                  }
                >
                  レビューを締め切る
                </Button>
                <Button
                  disabled={
                    busy ||
                    session.status !== 'completed' ||
                    session.identitiesRevealed
                  }
                  onClick={() =>
                    void onReveal().then((r) => setNotice(r.message))
                  }
                >
                  候補identityを公開
                </Button>
                <Button
                  onClick={() =>
                    onNavigate('evaluationResults', { evaluationId })
                  }
                >
                  集計結果へ
                </Button>
              </div>
            </Panel>
          </div>
        )}
      </EvaluationLoadState>
    </EvaluationPageFrame>
  );
}
