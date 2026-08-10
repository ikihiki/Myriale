import { useEffect, useState } from 'react';
import type { EvaluationsApi, EvaluationSessionSummary } from '../api/evaluationsApi';
import type { LoadState } from '../shared/evaluationPageModel';
import { useEvaluationContainer } from '../shared/useEvaluationContainer';
import { EvaluationListPresentation } from './EvaluationListPresentation';
export function EvaluationListContainer({ api }: { api?: EvaluationsApi } = {}) {
  const context = useEvaluationContainer(api); const [state, setState] = useState<LoadState<EvaluationSessionSummary[]>>({ status: 'loading' }); const [reload, setReload] = useState(0);
  useEffect(() => { const controller = new AbortController(); setState({ status: 'loading' }); void context.api.listSessions(controller.signal).then((data) => setState({ status: 'ready', data })).catch((error: unknown) => { if (!controller.signal.aborted) setState({ status: 'error', message: error instanceof Error ? error.message : '評価一覧を取得できませんでした。' }); }); return () => controller.abort(); }, [context.api, reload]);
  const nav = (key: Parameters<NonNullable<typeof context.navigate>>[0], options?: Parameters<NonNullable<typeof context.navigate>>[1]) => context.navigate?.(key, options);
  return <EvaluationListPresentation account={context.account} state={state} onOpen={(evaluationId) => nav('evaluationOverview', { evaluationId })} onCreate={() => nav('evaluationCreate')} onRetry={() => setReload((v) => v + 1)} onNavigate={nav} onLogout={context.logout} />;
}
