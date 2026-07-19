import { useMemo } from 'react';
import { RouterProvider } from '@tanstack/react-router';
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
  const router = useMemo(
    () => createAppRouter({ initialUrl, historyMode, showDebugPanel }),
    [historyMode, initialUrl, showDebugPanel],
  );
  const queryClient = useMemo(() => createMyrialeQueryClient(), []);

  return (
    <MyrialeQueryProvider client={queryClient}>
      <AppStoreProvider initialDb={initialDb}>
        <RouterProvider router={router} />
      </AppStoreProvider>
    </MyrialeQueryProvider>
  );
}
