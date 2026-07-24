import { useMemo, type ComponentType } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { createFetchAccountApi, type AccountApi } from '../account/api/accountApi';
import { AccountApiProvider } from '../account/hooks/useAccountSession';
import { createAppRouter, type AppHistoryMode } from '../router';
import { AppStoreProvider, type AppDb } from './store';
import { createMyrialeQueryClient, MyrialeQueryProvider } from './queryClient';

export type MyrialeAppProps = {
  accountApi?: AccountApi;
  initialUrl?: string;
  initialDb?: AppDb;
  showDebugPanel?: boolean;
  historyMode?: AppHistoryMode;
  scenarioListContainer?: ComponentType;
  scenarioRegistrationContainer?: ComponentType;
  editScenarioContainer?: ComponentType<{ scenarioId: string }>;
  sessionContainer?: ComponentType<{ sessionId: string }>;
  startSessionContainer?: ComponentType<{ scenarioId: string }>;
};

export function MyrialeApp({
  accountApi,
  initialUrl = '/',
  initialDb,
  showDebugPanel = true,
  historyMode = 'memory',
  scenarioListContainer,
  scenarioRegistrationContainer,
  editScenarioContainer,
  sessionContainer,
  startSessionContainer,
}: MyrialeAppProps) {
  const resolvedAccountApi = useMemo(() => accountApi ?? createFetchAccountApi(), [accountApi]);
  const router = useMemo(
    () => createAppRouter({ initialUrl, historyMode, showDebugPanel, accountApi: resolvedAccountApi, scenarioListContainer, scenarioRegistrationContainer, editScenarioContainer, sessionContainer, startSessionContainer }),
    [editScenarioContainer, historyMode, initialUrl, resolvedAccountApi, scenarioListContainer, scenarioRegistrationContainer, sessionContainer, showDebugPanel, startSessionContainer],
  );
  const queryClient = useMemo(() => createMyrialeQueryClient(), []);

  return (
    <MyrialeQueryProvider client={queryClient}>
      <AccountApiProvider api={resolvedAccountApi}>
        <AppStoreProvider initialDb={initialDb}>
          <RouterProvider router={router} />
        </AppStoreProvider>
      </AccountApiProvider>
    </MyrialeQueryProvider>
  );
}
