import { useCallback, useEffect, useState } from 'react';
import { toAppChromeAccount } from '../../account/accountPresentation';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { useAppNavigation } from '../../shared/nav';
import { fetchSessionList } from './sessionListApi';
import { SessionListPresentation } from './SessionListPresentation';
import { toSessionListItem, type SessionListState } from './sessionListModel';

export function SessionListContainer() {
  const navigate = useAppNavigation();
  const accountSession = useAccountSession();
  const [state, setState] = useState<SessionListState>({ status: 'loading' });
  const [showCompleted, setShowCompleted] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    void fetchSessionList(showCompleted, controller.signal)
      .then((sessions) => setState({ status: 'ready', sessions: sessions.map(toSessionListItem) }))
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: reason instanceof Error ? reason.message : 'セッション一覧を読み込めませんでした。' });
      });
    return () => controller.abort();
  }, [reloadKey, showCompleted]);

  const logout = async () => {
    await accountSession.api.logout();
    accountSession.clearUser();
    navigate?.('login');
  };

  return <SessionListPresentation
    account={toAppChromeAccount(accountSession.user)}
    state={state}
    showCompleted={showCompleted}
    onShowCompletedChange={setShowCompleted}
    onOpenSession={(sessionId) => navigate?.('playSession', { sessionId })}
    onFindScenario={() => navigate?.('scenarioList')}
    onRetry={load}
    onLogout={logout}
  />;
}
