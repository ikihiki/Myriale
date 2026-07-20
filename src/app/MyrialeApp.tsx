import { useMemo } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { createFetchAccountApi } from '../account/api/accountApi';
import { AccountApiProvider } from '../account/hooks/useAccountSession';
import { createAppRouter, type AppHistoryMode } from '../router';
import { AppStoreProvider, type AppDb } from './store';
import { createMyrialeQueryClient, MyrialeQueryProvider } from './queryClient';
import './myrialeApp.css';

export type MyrialeAppProps = {
  initialUrl?: string;
  initialDb?: AppDb;
  showDebugPanel?: boolean;
  historyMode?: AppHistoryMode;
};

export function MyrialeApp({
  initialUrl = '/',
  initialDb,
  showDebugPanel = true,
  historyMode = 'memory',
}: MyrialeAppProps) {
  const accountApi = useMemo(() => createFetchAccountApi(), []);
  const router = useMemo(
    () => createAppRouter({ initialUrl, historyMode, showDebugPanel, accountApi }),
    [accountApi, historyMode, initialUrl, showDebugPanel],
  );
  const queryClient = useMemo(() => createMyrialeQueryClient(), []);

  return (
    <MyrialeQueryProvider client={queryClient}>
      <AccountApiProvider api={accountApi}>
        <AppStoreProvider initialDb={initialDb}>
          <RouterProvider router={router} />
        </AppStoreProvider>
      </AccountApiProvider>
    </MyrialeQueryProvider>
  );
}
