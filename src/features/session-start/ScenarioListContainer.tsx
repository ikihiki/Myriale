import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toAppChromeAccount } from '../../account/accountPresentation';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { createFetchScenarioApi, type ScenarioApi } from '../../app/scenarioApi';
import { useOptionalAppStore, type ScenarioRecord } from '../../app/store';
import { STORY_IDS, navigateToStory, useAppNavigation } from '../../shared/nav';
import { ScenarioListPresentation } from './ScenarioListPresentation';
import { toScenarioSummary } from './scenarioPresentation';

export function ScenarioListContainer({ api }: { api?: ScenarioApi } = {}) {
  const store = useOptionalAppStore();
  const dispatch = store?.dispatch;
  const appNavigate = useAppNavigation();
  const accountSession = useAccountSession();
  const scenarioApi = useMemo(() => api ?? createFetchScenarioApi(), [api]);
  const scenariosQuery = useQuery({
    queryKey: ['scenarios', 'list'],
    queryFn: ({ signal }) => scenarioApi.getScenarios(signal),
    staleTime: 30_000,
  });
  useEffect(() => {
    if (!scenariosQuery.data || !dispatch) return;
    dispatch({
      type: 'SCENARIOS_LOADED',
      scenarios: scenariosQuery.data.map((scenario): ScenarioRecord => ({
        ...scenario,
        status: scenario.status === 'published' || scenario.status === 'private' ? scenario.status : 'draft',
      })),
    });
  }, [dispatch, scenariosQuery.data]);

  const scenarios = useMemo(
    () => (scenariosQuery.data ?? []).map(toScenarioSummary),
    [scenariosQuery.data],
  );

  const navigateTo = (destination: 'scenarioRegister' | 'startSession' | 'login', scenarioId?: string) => {
    if (appNavigate) {
      if (destination === 'startSession') appNavigate(destination, { query: { scenarioId: scenarioId ?? '' } });
      else appNavigate(destination);
      return;
    }
    navigateToStory(STORY_IDS[destination]);
  };

  const logout = async () => {
    await accountSession.api.logout();
    accountSession.clearUser();
    navigateTo('login');
  };

  return <ScenarioListPresentation
    account={toAppChromeAccount(accountSession.user)}
    scenarios={scenarios}
    status={scenariosQuery.isPending ? 'loading' : scenariosQuery.isError ? 'error' : 'ready'}
    loadError={scenariosQuery.error instanceof Error ? scenariosQuery.error.message : undefined}
    onRetry={() => void scenariosQuery.refetch()}
    onRegistration={() => navigateTo('scenarioRegister')}
    onStart={(scenarioId) => navigateTo('startSession', scenarioId)}
    onLogout={logout}
  />;
}
