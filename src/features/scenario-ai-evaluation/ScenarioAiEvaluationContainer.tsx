import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { toAppChromeAccount } from '../../account/accountPresentation';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { createFetchScenarioApi, type ScenarioApi, type ScenarioApiError } from '../../app/scenarioApi';
import { ScenarioAiEvaluationPresentation } from './ScenarioAiEvaluationPresentation';
import type { ScenarioAiEvaluationActions } from './scenarioAiEvaluationModel';

export function ScenarioAiEvaluationContainer({ scenarioId, api }: { scenarioId: string; api?: ScenarioApi }) {
  const navigate = useNavigate();
  const accountSession = useAccountSession();
  const scenarioApi = useMemo(() => api ?? createFetchScenarioApi(), [api]);
  const [reloadKey, setReloadKey] = useState(0);
  const query = useQuery({
    queryKey: ['scenarios', scenarioId, 'ai-evaluation-corpus', reloadKey],
    queryFn: async ({ signal }) => {
      const [scenario, manifest, recentRuns] = await Promise.all([
        scenarioApi.getScenario(scenarioId, signal),
        scenarioApi.getScenarioAiEvaluationCorpus(scenarioId, signal),
        scenarioApi.listScenarioAiEvaluationRuns(scenarioId, signal),
      ]);
      return { scenarioTitle: scenario.title, manifest, recentRuns };
    },
  });

  const runCorpus: ScenarioAiEvaluationActions['runCorpus'] = async (profileIds, repetitions, caseIds) => {
    try {
      const value = await scenarioApi.createScenarioAiEvaluationCorpusRun(scenarioId, { profileIds, repetitions, caseIds });
      return { ok: true, message: `${value.summary.caseCount}ケース・${value.summary.attemptCount} attemptsのCorpus評価を完了しました。`, value };
    } catch (caught) {
      const error = caught as ScenarioApiError;
      return { ok: false, message: error.errors?.evaluation?.[0] ?? error.errors?.profile?.[0] ?? error.message ?? 'Corpus評価を実行できませんでした。' };
    }
  };

  const exportRun: ScenarioAiEvaluationActions['exportRun'] = async (runId, format) => {
    try {
      const blob = await scenarioApi.exportScenarioAiEvaluationRun(scenarioId, runId, format);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${runId}.${format}`; anchor.click(); URL.revokeObjectURL(url);
      return { ok: true, message: `${format.toUpperCase()}をエクスポートしました。` };
    } catch (caught) {
      return { ok: false, message: caught instanceof Error ? caught.message : '評価結果をエクスポートできませんでした。' };
    }
  };

  const logout = async () => {
    await accountSession.api.logout();
    accountSession.clearUser();
    await navigate({ to: '/account/login' });
  };

  const state = query.isPending
    ? { status: 'loading' as const }
    : query.isError
      ? { status: 'error' as const, message: query.error instanceof Error ? query.error.message : 'Corpusを読み込めませんでした。' }
      : { status: 'ready' as const, ...query.data };

  return <ScenarioAiEvaluationPresentation
    account={toAppChromeAccount(accountSession.user)}
    scenarioId={scenarioId}
    state={state}
    actions={{ runCorpus, exportRun, retry: () => setReloadKey((value) => value + 1), backToScenario: () => void navigate({ to: '/scenarios/$scenarioId/edit', params: { scenarioId } }), logout }}
  />;
}
