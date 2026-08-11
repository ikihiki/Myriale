import { useState } from 'react';
import { EvaluationListPresentation } from '../../features/evaluations/list/EvaluationListPresentation';
import { EvaluationCreatePresentation } from '../../features/evaluations/create/EvaluationCreatePresentation';
import { EvaluationOverviewPresentation } from '../../features/evaluations/overview/EvaluationOverviewPresentation';
import { EvaluationSetupPresentation } from '../../features/evaluations/setup/EvaluationSetupPresentation';
import { EvaluationExecutionPresentation } from '../../features/evaluations/execution/EvaluationExecutionPresentation';
import { EvaluationReviewAdminPresentation } from '../../features/evaluations/review-admin/EvaluationReviewAdminPresentation';
import { EvaluationBlindReviewPresentation } from '../../features/evaluations/blind-review/EvaluationBlindReviewPresentation';
import { EvaluationResultsPresentation } from '../../features/evaluations/results/EvaluationResultsPresentation';
import type { EvaluationSession } from '../../features/evaluations/api/evaluationsApi';
import {
  account,
  assignment,
  batches,
  corpora,
  draftSession,
  execution,
  quotes,
  response,
  results,
  sessions,
} from './evaluationFixtures';
const navigate = () => undefined;
const logout = () => undefined;
export function MockEvaluationListContainer() {
  return (
    <EvaluationListPresentation
      account={account}
      state={{ status: 'ready', data: sessions }}
      onOpen={navigate}
      onCreate={navigate}
      onRetry={navigate}
      onNavigate={navigate}
      onLogout={logout}
    />
  );
}
export function MockEvaluationCreateContainer({
  sourceScenarioId,
}: {
  sourceScenarioId?: string;
}) {
  const [creating, setCreating] = useState(false);
  return (
    <EvaluationCreatePresentation
      account={account}
      initialScenarioId={sourceScenarioId}
      creating={creating}
      onCreate={async () => {
        setCreating(true);
        await Promise.resolve();
        setCreating(false);
        return {
          ok: true,
          message: '評価Draftを作成しました。',
          value: draftSession,
        };
      }}
      onNavigate={navigate}
      onLogout={logout}
    />
  );
}
export function MockEvaluationOverviewContainer({
  evaluationId,
}: {
  evaluationId: string;
}) {
  const [session, setSession] = useState(draftSession);
  return (
    <EvaluationOverviewPresentation
      account={account}
      evaluationId={evaluationId}
      state={{ status: 'ready', data: session }}
      starting={false}
      onStart={async () => {
        const value = { ...session, status: 'queued' as const };
        setSession(value);
        return { ok: true, message: '開始しました。', value };
      }}
      onRetry={navigate}
      onNavigate={navigate}
      onLogout={logout}
    />
  );
}
export function MockEvaluationSetupContainer({
  evaluationId,
}: {
  evaluationId: string;
}) {
  const [session, setSession] = useState(draftSession);
  const ok = (value: EvaluationSession, message: string) => {
    setSession(value);
    return Promise.resolve({ ok: true, message, value });
  };
  return (
    <EvaluationSetupPresentation
      account={account}
      evaluationId={evaluationId}
      state={{ status: 'ready', data: { session, corpora, quotes } }}
      busy={false}
      actions={{
        addFixed: () => ok(session, '固定ケースを追加しました。'),
        addQuoted: (input) =>
          ok(
            {
              ...session,
              situations: [
                ...session.situations,
                {
                  id: 'SIT-NEW',
                  label: input.label,
                  stage: input.stage,
                  source: 'quoted',
                  sourceLabel: 'Session quote',
                  snapshotHash: 'sha256:new',
                  preview: '引用preview',
                  createdAt: '2026-08-10T03:00:00Z',
                },
              ],
            },
            'Session stageを引用して固定しました。',
          ),
        removeSituation: async () => ({ ok: true, message: '削除しました。' }),
        addCandidate: (input) =>
          ok(
            {
              ...session,
              candidates: [...session.candidates, { id: 'CAN-NEW', ...input }],
            },
            '候補を追加しました。',
          ),
        saveDesign: (reviewPolicy, rubric) =>
          ok({ ...session, reviewPolicy, rubric }, 'Rubricを保存しました。'),
      }}
      onRetry={navigate}
      onNavigate={navigate}
      onLogout={logout}
    />
  );
}
export function MockEvaluationExecutionContainer({
  evaluationId,
}: {
  evaluationId: string;
}) {
  return (
    <EvaluationExecutionPresentation
      account={account}
      evaluationId={evaluationId}
      state={{
        status: 'ready',
        data: {
          session: { ...draftSession, status: 'completedWithErrors' },
          execution,
        },
      }}
      busy={false}
      onCancel={async () => ({ ok: true, message: 'cancelled' })}
      onRetryFailed={async () => ({
        ok: true,
        message: '失敗attemptを再投入しました。',
      })}
      onRefresh={navigate}
      onNavigate={navigate}
      onLogout={logout}
    />
  );
}
export function MockEvaluationReviewAdminContainer({
  evaluationId,
}: {
  evaluationId: string;
}) {
  const [list, setList] = useState(batches);
  return (
    <EvaluationReviewAdminPresentation
      account={account}
      evaluationId={evaluationId}
      state={{
        status: 'ready',
        data: { session: { ...draftSession, status: 'review' }, batches: list },
      }}
      busy={false}
      onCreateBatch={async (label) => {
        setList((v) => [
          ...v,
          {
            id: 'BATCH-NEW',
            reviewerLabel: label,
            assignmentCount: 4,
            completedCount: 0,
            status: 'open',
            assignments: [
              {
                opaqueCode: 'REV-NEW',
                reviewerId: label,
                status: 'draft',
                itemCount: 4,
                judgedItemCount: 0,
              },
            ],
          },
        ]);
        return { ok: true, message: 'Review batchを作成しました。' };
      }}
      onClose={async () => ({
        ok: true,
        message: 'レビューを締め切りました。',
      })}
      onReveal={async () => ({
        ok: true,
        message: '候補identityを公開しました。',
      })}
      onRetry={navigate}
      onNavigate={navigate}
      onLogout={logout}
    />
  );
}
export function MockEvaluationBlindReviewContainer() {
  const [current, setCurrent] = useState(assignment);
  return (
    <EvaluationBlindReviewPresentation
      account={account}
      state={{ status: 'ready', data: current }}
      saving={false}
      onSave={async () => ({
        ok: true,
        message: 'Draftを自動保存しました。',
        value: current,
      })}
      onSubmit={async () => {
        const value = {
          ...current,
          currentIndex: 1,
          item: null,
        } as typeof current;
        setCurrent(value);
        return { ok: true, message: 'Judgmentを提出してlockしました。', value };
      }}
      onRetry={navigate}
      onNavigate={navigate}
      onLogout={logout}
    />
  );
}
export function MockEvaluationResultsContainer({
  evaluationId,
}: {
  evaluationId: string;
}) {
  const [detail, setDetail] = useState<typeof response | null>(null);
  return (
    <EvaluationResultsPresentation
      account={account}
      evaluationId={evaluationId}
      state={{
        status: 'ready',
        data: {
          session: { ...draftSession, status: 'completed' },
          results,
          exports: [],
        },
      }}
      response={detail ? { status: 'ready', data: detail } : null}
      busy={false}
      onOpenResponse={() => setDetail(response)}
      onExport={async (format) => ({
        ok: true,
        message: `${format.toUpperCase()} exportを作成しました。`,
      })}
      onRetry={navigate}
      onNavigate={navigate}
      onLogout={logout}
    />
  );
}
