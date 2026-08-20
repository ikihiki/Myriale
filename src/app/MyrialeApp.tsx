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
  aiPlaygroundContainer?: ComponentType;
  scenarioListContainer?: ComponentType;
  scenarioRegistrationContainer?: ComponentType;
  scenarioAiEvaluationContainer?: ComponentType<{ scenarioId: string }>;
  editScenarioContainer?: ComponentType<{ scenarioId: string }>;
  sessionContainer?: ComponentType<{ sessionId: string }>;
  turnInspectionContainer?: ComponentType<{ sessionId: string; turnId: string }>;
  startSessionContainer?: ComponentType<{ scenarioId: string }>;
};

export function MyrialeApp({
  accountApi,
  initialUrl = '/',
  initialDb,
  showDebugPanel = true,
  historyMode = 'memory',
  aiPlaygroundContainer,
  scenarioListContainer,
  scenarioRegistrationContainer,
  scenarioAiEvaluationContainer,
  editScenarioContainer,
  sessionContainer,
  turnInspectionContainer,
  startSessionContainer,
}: MyrialeAppProps) {
  const resolvedAccountApi = useMemo(() => accountApi ?? createFetchAccountApi(), [accountApi]);
  const router = useMemo(
    () => createAppRouter({ initialUrl, historyMode, showDebugPanel, accountApi: resolvedAccountApi, aiPlaygroundContainer, scenarioListContainer, scenarioRegistrationContainer, editScenarioContainer, scenarioAiEvaluationContainer, sessionContainer, turnInspectionContainer, startSessionContainer }),
    [aiPlaygroundContainer, editScenarioContainer, historyMode, initialUrl, resolvedAccountApi, scenarioAiEvaluationContainer, scenarioListContainer, scenarioRegistrationContainer, sessionContainer, showDebugPanel, startSessionContainer, turnInspectionContainer],
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
