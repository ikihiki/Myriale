import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createFetchAccountApi, type AccountApi, type AccountUser } from '../api/accountApi';

const AccountApiContext = createContext<AccountApi | null>(null);

export function AccountApiProvider({ api, children }: { api: AccountApi; children: ReactNode }) {
  return createElement(AccountApiContext.Provider, { value: api }, children);
}

export type AccountSessionStatus = 'unknown' | 'anonymous' | 'authenticated';

export function useAccountSession(apiOverride?: AccountApi) {
  const sharedApi = useContext(AccountApiContext);
  const fallbackApi = useMemo(() => createFetchAccountApi(), []);
  const api = apiOverride ?? sharedApi ?? fallbackApi;
  const [user, setUser] = useState<AccountUser | null>(null);
  const [status, setStatus] = useState<AccountSessionStatus>('unknown');

  useEffect(() => {
    const controller = new AbortController();
    api.getMe(controller.signal)
      .then((current) => {
        setUser(current);
        setStatus(current ? 'authenticated' : 'anonymous');
      })
      .catch(() => setStatus('anonymous'));
    return () => controller.abort();
  }, [api]);

  const acceptUser = useCallback((next: AccountUser) => {
    setUser(next);
    setStatus('authenticated');
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
  }, []);

  return { api, user, status, acceptUser, clearUser };
}
