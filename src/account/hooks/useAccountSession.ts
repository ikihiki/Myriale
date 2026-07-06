import { useCallback, useEffect, useMemo, useState } from 'react';
import { createFetchAccountApi, type AccountApi, type AccountUser } from '../api/accountApi';

export type AccountSessionStatus = 'unknown' | 'anonymous' | 'authenticated';

export function useAccountSession(apiOverride?: AccountApi) {
  const api = useMemo(() => apiOverride ?? createFetchAccountApi(), [apiOverride]);
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
