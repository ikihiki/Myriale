import type { ReactNode } from 'react';
import { Button, Notice } from '../../../components/ui';
import type { LoadState } from './evaluationPageModel';
export function EvaluationLoadState<T>({ state, onRetry, children }: { state: LoadState<T>; onRetry: () => void; children: (data: T) => ReactNode }) {
  if (state.status === 'loading') return <Notice tone="info">評価データを読み込んでいます。</Notice>;
  if (state.status === 'error') return <div className="grid gap-3"><Notice tone="danger">{state.message}</Notice><Button className="w-fit" variant="secondary" onClick={onRetry}>もう一度読み込む</Button></div>;
  return <>{children(state.data)}</>;
}
