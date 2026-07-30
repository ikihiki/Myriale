import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toAppChromeAccount } from '../../account/accountPresentation';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { fetchSessionAiHistory } from './sessionAiHistoryApi';
import { SessionAiHistoryPresentation } from './SessionAiHistoryPresentation';
import { toSessionAiHistory, type SessionAiHistoryState } from './sessionAiHistoryModel';

export function SessionAiHistoryContainer({ sessionId }: { sessionId: string }) {
  const navigate = useNavigate();
  const accountSession = useAccountSession();
  const [state, setState] = useState<SessionAiHistoryState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const retry = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    void fetchSessionAiHistory(sessionId, controller.signal)
      .then((history) => setState({ status: 'ready', history: toSessionAiHistory(history) }))
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: reason instanceof Error ? reason.message : 'AI履歴を読み込めませんでした。' });
      });
    return () => controller.abort();
  }, [reloadKey, sessionId]);

  const logout = async () => {
    await accountSession.api.logout();
    accountSession.clearUser();
    await navigate({ to: '/account/login' });
  };

  return (
    <SessionAiHistoryPresentation
      account={toAppChromeAccount(accountSession.user)}
      sessionId={sessionId}
      state={state}
      onBack={() => void navigate({ to: '/sessions/$sessionId', params: { sessionId } })}
      onRetry={retry}
      onLogout={logout}
    />
  );
}
