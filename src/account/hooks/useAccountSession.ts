import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createFetchAccountApi, type AccountApi, type AccountUser } from '../api/accountApi';

export type AccountSessionStatus = 'unknown' | 'anonymous' | 'authenticated';
type AccountSession = ReturnType<typeof useAccountSessionState>;
const AccountSessionContext = createContext<AccountSession | null>(null);

export function AccountApiProvider({ api, children }: { api: AccountApi; children: ReactNode }) {
  const session = useAccountSessionState(api, true);
  return createElement(AccountSessionContext.Provider, { value: session }, children);
}

export function useAccountSession(apiOverride?: AccountApi) {
  const shared = useContext(AccountSessionContext);
  const fallbackApi = useMemo(() => createFetchAccountApi(), []);
  const usesSharedSession = Boolean(shared && !apiOverride);
  const local = useAccountSessionState(apiOverride ?? fallbackApi, !usesSharedSession);
  return usesSharedSession ? shared! : local;
}

function useAccountSessionState(api: AccountApi, enabled: boolean) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [status, setStatus] = useState<AccountSessionStatus>('unknown');

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    api.getMe(controller.signal)
      .then((current) => {
        setUser(current);
        setStatus(current ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        setUser(null);
        setStatus('anonymous');
      });
    return () => controller.abort();
  }, [api, enabled]);

  const acceptUser = useCallback((next: AccountUser) => {
    setUser(next);
    setStatus('authenticated');
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
  }, []);

  return useMemo(() => ({ api, user, status, acceptUser, clearUser }), [acceptUser, api, clearUser, status, user]);
}
