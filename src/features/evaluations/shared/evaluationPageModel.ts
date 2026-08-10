import type { EvaluationSession } from '../api/evaluationsApi';

export type LoadState<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };
export type EvaluationAccount = { name: string; email: string; initials: string; role?: string } | null;
export type EvaluationCommand<T = undefined> = { ok: boolean; message: string; value?: T };
export type EvaluationPageActions = { retry: () => void; logout: () => void | Promise<void> };
export type EvaluationTab = 'overview' | 'setup' | 'execution' | 'reviews' | 'results';

export function canStart(session: EvaluationSession) { return session.status === 'draft' && session.situations.length > 0 && session.candidates.length > 0; }
export function statusLabel(status: EvaluationSession['status']) {
  return ({ draft: 'Draft', queued: 'Queued', running: 'Running', review: 'Review', completed: 'Completed', completedWithErrors: 'Completed with errors', cancelled: 'Cancelled', archived: 'Archived' } as const)[status];
}
