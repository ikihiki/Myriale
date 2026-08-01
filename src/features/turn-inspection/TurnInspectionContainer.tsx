import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toAppChromeAccount } from '../../account/accountPresentation';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { fetchTurnInspection } from './turnInspectionApi';
import { TurnInspectionPresentation } from './TurnInspectionPresentation';
import { toTurnInspection, type TurnInspectionState } from './turnInspectionModel';

export function TurnInspectionContainer({ sessionId, turnId }: { sessionId: string; turnId: string }) {
  const navigate = useNavigate();
  const accountSession = useAccountSession();
  const [state, setState] = useState<TurnInspectionState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const retry = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    void fetchTurnInspection(sessionId, turnId, controller.signal)
      .then((inspection) => setState({ status: 'ready', inspection: toTurnInspection(inspection) }))
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: reason instanceof Error ? reason.message : 'Turnの実行詳細を読み込めませんでした。' });
      });
    return () => controller.abort();
  }, [reloadKey, sessionId, turnId]);

  const logout = async () => {
    await accountSession.api.logout();
    accountSession.clearUser();
    await navigate({ to: '/account/login' });
  };

  return <TurnInspectionPresentation account={toAppChromeAccount(accountSession.user)} sessionId={sessionId} turnId={turnId} state={state} onBack={() => void navigate({ to: '/sessions/$sessionId', params: { sessionId } })} onRetry={retry} onLogout={logout} />;
}
