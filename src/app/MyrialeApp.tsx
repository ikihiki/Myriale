import { useMemo, type ComponentType } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { createFetchAccountApi } from '../account/api/accountApi';
import { AccountApiProvider } from '../account/hooks/useAccountSession';
import { createAppRouter, type AppHistoryMode } from '../router';
import { AppStoreProvider, type AppDb } from './store';
import { createMyrialeQueryClient, MyrialeQueryProvider } from './queryClient';

export type MyrialeAppProps = {
  initialUrl?: string;
  initialDb?: AppDb;
  showDebugPanel?: boolean;
  historyMode?: AppHistoryMode;
  sessionPageContainer?: ComponentType<{ sessionId: string }>;
};

export function MyrialeApp({
  initialUrl = '/',
  initialDb,
  showDebugPanel = true,
  historyMode = 'memory',
  sessionPageContainer,
}: MyrialeAppProps) {
  const accountApi = useMemo(() => createFetchAccountApi(), []);
  const router = useMemo(
    () => createAppRouter({ initialUrl, historyMode, showDebugPanel, accountApi, sessionPageContainer }),
    [accountApi, historyMode, initialUrl, sessionPageContainer, showDebugPanel],
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
