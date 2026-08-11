import { useState } from 'react';
import type { EvaluationsApi } from '../api/evaluationsApi';
import { useEvaluationContainer } from '../shared/useEvaluationContainer';
import { EvaluationCreatePresentation } from './EvaluationCreatePresentation';
export function EvaluationCreateContainer({ api, sourceScenarioId }: { api?: EvaluationsApi; sourceScenarioId?: string } = {}) {
  const context = useEvaluationContainer(api); const [creating, setCreating] = useState(false); const nav = (key: Parameters<NonNullable<typeof context.navigate>>[0], options?: Parameters<NonNullable<typeof context.navigate>>[1]) => context.navigate?.(key, options);
  return <EvaluationCreatePresentation account={context.account} initialScenarioId={sourceScenarioId} creating={creating} onCreate={async (input) => { setCreating(true); try { const value = await context.api.createSession(input); nav('evaluationSetup', { evaluationId: value.id }); return { ok: true, message: '評価Draftを作成しました。', value }; } catch (error) { return { ok: false, message: error instanceof Error ? error.message : '評価を作成できませんでした。' }; } finally { setCreating(false); } }} onNavigate={nav} onLogout={context.logout} />;
}
