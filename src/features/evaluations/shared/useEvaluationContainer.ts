import { useMemo } from 'react';
import { toAppChromeAccount } from '../../../account/accountPresentation';
import { useAccountSession } from '../../../account/hooks/useAccountSession';
import { useAppNavigation } from '../../../shared/nav';
import { createFetchEvaluationsApi, type EvaluationsApi } from '../api/evaluationsApi';
export function useEvaluationContainer(api?: EvaluationsApi) {
  const evaluationApi = useMemo(() => api ?? createFetchEvaluationsApi(), [api]);
  const accountSession = useAccountSession();
  const navigate = useAppNavigation();
  const logout = async () => { await accountSession.api.logout(); accountSession.clearUser(); navigate?.('login'); };
  return { api: evaluationApi, account: toAppChromeAccount(accountSession.user), navigate, logout };
}
