import { useMemo, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { createFetchScenarioApi, type ScenarioApi } from '../../app/scenarioApi';
import { toAppChromeAccount } from '../../account/accountPresentation';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { STORY_IDS, navigateToStory, useAppNavigation } from '../../shared/nav';
import { createSession, type SessionApiError } from '../session-play/sessionPlayApi';
import { StartSessionPresentation } from './StartSessionPresentation';
import { toScenarioSummary } from './scenarioPresentation';
import type { StartSessionCommandResult, StartSessionHeroDraft } from './startSessionModel';

export function StartSessionContainer({ scenarioId, api }: { scenarioId: string; api?: ScenarioApi }) {
  const router = useRouter();
  const appNavigate = useAppNavigation();
  const accountSession = useAccountSession();
  const scenarioApi = useMemo(() => api ?? createFetchScenarioApi(), [api]);
  const [sessionRequestId] = useState(() => `session-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`);
  const [isBeginning, setIsBeginning] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const scenarioQuery = useQuery({
    queryKey: ['scenarios', 'detail', scenarioId],
    queryFn: ({ signal }) => scenarioApi.getScenario(scenarioId, signal),
    staleTime: 30_000,
  });
  const scenario = useMemo(
    () => scenarioQuery.data ? toScenarioSummary(scenarioQuery.data) : null,
    [scenarioQuery.data],
  );

  const navigateTo = (destination: 'scenarioList' | 'login') => {
    if (appNavigate) appNavigate(destination);
    else navigateToStory(STORY_IDS[destination]);
  };
  const goToLogin = () => navigateTo('login');
  const logout = async () => {
    await accountSession.api.logout();
    accountSession.clearUser();
    goToLogin();
  };

  const recommendHero = async (draft: StartSessionHeroDraft) => {
    if (isRecommending) return { ok: false, message: '主人公案を生成中です。' };
    setIsRecommending(true);
    try {
      const recommendation = await scenarioApi.recommendHero(scenarioId, {
        currentName: draft.name,
        currentProfile: draft.profile,
      });
      return {
        ok: true,
        message: recommendation.message,
        value: { name: recommendation.name, profile: recommendation.profile },
      };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : '主人公案を取得できませんでした。' };
    } finally {
      setIsRecommending(false);
    }
  };

  const beginStory = async (selectedHero: string, interpretationEnabled: boolean): Promise<StartSessionCommandResult> => {
    if (isBeginning) return { ok: false, message: 'Sessionを作成中です。' };
    if (accountSession.status === 'anonymous') {
      return { ok: false, message: 'Sessionを開始するにはログインが必要です。', requiresLogin: true };
    }

    setIsBeginning(true);
    try {
      const session = await createSession(scenarioId, sessionRequestId, undefined, interpretationEnabled, selectedHero);
      router.history.push(`/sessions/${encodeURIComponent(session.id)}`);
      return { ok: true };
    } catch (error) {
      const apiError = error as SessionApiError;
      if (apiError.status === 401) {
        accountSession.clearUser();
        return {
          ok: false,
          message: 'Sessionを開始するにはログインが必要です。ログイン後、もう一度開始してください。',
          requiresLogin: true,
        };
      }
      return { ok: false, message: error instanceof Error ? error.message : 'Sessionを開始できませんでした。' };
    } finally {
      setIsBeginning(false);
    }
  };

  const loadError = scenarioQuery.error instanceof Error
    ? scenarioQuery.error.message
    : '指定されたシナリオが見つかりません。シナリオ一覧から選び直してください。';

  return <StartSessionPresentation
    account={toAppChromeAccount(accountSession.user)}
    scenario={scenario}
    status={scenarioQuery.isPending ? 'loading' : scenarioQuery.isError || !scenario ? 'error' : 'ready'}
    loadError={loadError}
    canConfigureInterpretation={accountSession.user?.canDebugDialogue === true}
    isBeginning={isBeginning}
    isRecommending={isRecommending}
    onLogout={logout}
    onLogin={goToLogin}
    onScenarioList={() => navigateTo('scenarioList')}
    onRecommendHero={recommendHero}
    onBeginStory={beginStory}
  />;
}
