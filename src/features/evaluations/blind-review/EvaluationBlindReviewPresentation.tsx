import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Input,
  Notice,
  Panel,
  Textarea,
} from '../../../components/ui';
import type {
  BlindJudgmentInput,
  BlindReviewAssignment,
} from '../api/evaluationsApi';
import { EvaluationPageFrame } from '../shared/EvaluationPageFrame';
import { EvaluationLoadState } from '../shared/EvaluationLoadState';
import type {
  EvaluationAccount,
  EvaluationCommand,
  LoadState,
} from '../shared/evaluationPageModel';
export function EvaluationBlindReviewPresentation({
  account,
  state,
  saving,
  onSave,
  onSubmit,
  onRetry,
  onNavigate,
  onLogout,
}: {
  account: EvaluationAccount;
  state: LoadState<BlindReviewAssignment>;
  saving: boolean;
  onSave: (
    itemId: string,
    input: BlindJudgmentInput,
  ) => Promise<EvaluationCommand<BlindReviewAssignment>>;
  onSubmit: (
    itemId: string,
    input: BlindJudgmentInput,
  ) => Promise<EvaluationCommand<BlindReviewAssignment>>;
  onRetry: () => void;
  onNavigate: Parameters<typeof EvaluationPageFrame>[0]['onNavigate'];
  onLogout: () => void | Promise<void>;
}) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState(
    '候補identityとmachine judgmentはこのworkbenchのDTOに存在しません。',
  );
  const item = state.status === 'ready' ? state.data.item : null;
  useEffect(() => {
    setScores(item?.draft?.scores ?? {});
    setNote(item?.draft?.note ?? '');
  }, [item?.itemId]);
  const invalidCriteria = item?.rubric.filter((criterion) => {
    const score = scores[criterion.criterionId];
    return (
      score !== undefined &&
      (!Number.isFinite(score) ||
        score < criterion.scaleMin ||
        score > criterion.scaleMax)
    );
  }) ?? [];
  const input = { scores, note };
  return (
    <EvaluationPageFrame
      account={account}
      title={
        state.status === 'ready' ? state.data.evaluationLabel : 'Blind review'
      }
      kicker="Opaque reviewer workbench"
      description="Rubricだけでresponseを判定します。"
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <EvaluationLoadState state={state} onRetry={onRetry}>
        {(assignment) => (
          <div className="grid gap-5">
            <div className="flex items-center justify-between">
              <Badge tone="info">
                Item {Math.min(assignment.currentIndex + 1, assignment.total)} /{' '}
                {assignment.total}
              </Badge>
              <span className="text-sm text-myr-ink-subtle">
                Autosave + submit/lock + next
              </span>
            </div>
            {!assignment.item ? (
              <Notice tone="success">
                このassignmentのレビューは完了しました。
              </Notice>
            ) : (
              <>
                <Panel as="section" className="grid gap-3">
                  <div className="flex justify-between gap-3">
                    <h2 className="m-0">{assignment.item.situationLabel}</h2>
                    <Badge tone="neutral">
                      {assignment.item.candidateCode}
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    <strong>Situation</strong>
                    <pre
                      className="m-0 max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-myr-ink/15 bg-myr-vellum/35 p-4 text-sm leading-6 text-myr-ink-subtle"
                      data-testid="blind-situation"
                    >
                      {assignment.item.situationContext}
                    </pre>
                  </div>
                  <div className="grid gap-2">
                    <strong>Response</strong>
                    <article
                      className="whitespace-pre-wrap rounded-xl border border-myr-ink/15 bg-white p-5 leading-8"
                      data-testid="blind-response"
                    >
                      {assignment.item.responseText}
                    </article>
                  </div>
                </Panel>
                <Panel as="section" className="grid gap-5">
                  <h2 className="m-0">Human rubric</h2>
                  {assignment.item.rubric.map((criterion) => (
                    <label key={criterion.criterionId} className="grid gap-2">
                      <span>
                        <strong>{criterion.label}</strong>
                        <small className="block text-myr-ink-subtle">
                          {criterion.description}
                        </small>
                        <small className="block text-myr-ink-subtle">
                          {criterion.scaleMin}〜{criterion.scaleMax}の範囲で入力
                        </small>
                      </span>
                      <Input
                        aria-label={`${criterion.label} score`}
                        aria-invalid={invalidCriteria.some(
                          (item) => item.criterionId === criterion.criterionId,
                        )}
                        type="number"
                        min={criterion.scaleMin}
                        max={criterion.scaleMax}
                        step="any"
                        value={scores[criterion.criterionId] ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setScores((current) => {
                            if (value === '') {
                              const next = { ...current };
                              delete next[criterion.criterionId];
                              return next;
                            }
                            return {
                              ...current,
                              [criterion.criterionId]: Number(value),
                            };
                          });
                        }}
                      />
                    </label>
                  ))}
                  <label>
                    Reviewer note
                    <Textarea
                      aria-label="Reviewer note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </label>
                  {invalidCriteria.length > 0 && (
                    <Notice tone="danger">
                      評価点はRubricに定義された範囲内で入力してください。
                    </Notice>
                  )}
                  <Notice
                    tone={notice.includes('できません') ? 'danger' : 'info'}
                    data-testid="blind-review-notice"
                  >
                    {notice}
                  </Notice>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      disabled={saving || invalidCriteria.length > 0}
                      onClick={() =>
                        void onSave(assignment.item!.itemId, input).then((r) =>
                          setNotice(r.message),
                        )
                      }
                    >
                      {saving ? '保存中…' : 'Draftを保存'}
                    </Button>
                    <Button
                      disabled={
                        saving ||
                        invalidCriteria.length > 0 ||
                        assignment.item.rubric.some(
                          (c) =>
                            c.required && scores[c.criterionId] === undefined,
                        )
                      }
                      onClick={() =>
                        void onSubmit(assignment.item!.itemId, input).then(
                          (r) => setNotice(r.message),
                        )
                      }
                    >
                      提出して次へ
                    </Button>
                  </div>
                </Panel>
              </>
            )}
          </div>
        )}
      </EvaluationLoadState>
    </EvaluationPageFrame>
  );
}
