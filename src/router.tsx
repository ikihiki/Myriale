import type { ComponentType } from 'react';
import { createBrowserHistory, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { createFetchAccountApi, type AccountApi } from './account/api/accountApi';
import { ScenarioRegistrationContainer } from './features/scenario-registration/ScenarioRegistrationContainer';
import { EditScenarioContainer } from './features/scenario-editor/EditScenarioContainer';
import { ScenarioListContainer } from './features/session-start/ScenarioListContainer';
import { SessionContainer } from './features/session-play/SessionContainer';
import { SessionAiHistoryContainer } from './features/session-ai-history/SessionAiHistoryContainer';
import { StartSessionContainer } from './features/session-start/StartSessionContainer';
import { routeTree } from './routeTree.gen';

export type AppRouterContext = {
  showDebugPanel: boolean;
  accountApi: AccountApi;
  scenarioListContainer: ComponentType;
  scenarioRegistrationContainer: ComponentType;
  editScenarioContainer: ComponentType<{ scenarioId: string }>;
  sessionContainer: ComponentType<{ sessionId: string }>;
  sessionAiHistoryContainer: ComponentType<{ sessionId: string }>;
  startSessionContainer: ComponentType<{ scenarioId: string }>;
};

export type AppHistoryMode = 'browser' | 'memory';

export function createAppRouter({
  initialUrl = '/',
  historyMode = 'memory',
  showDebugPanel = true,
  accountApi = createFetchAccountApi(),
  scenarioListContainer = ScenarioListContainer,
  scenarioRegistrationContainer = ScenarioRegistrationContainer,
  editScenarioContainer = EditScenarioContainer,
  sessionContainer = SessionContainer,
  sessionAiHistoryContainer = SessionAiHistoryContainer,
  startSessionContainer = StartSessionContainer,
}: {
  initialUrl?: string;
  historyMode?: AppHistoryMode;
  showDebugPanel?: boolean;
  accountApi?: AccountApi;
  scenarioListContainer?: ComponentType;
  scenarioRegistrationContainer?: ComponentType;
  editScenarioContainer?: ComponentType<{ scenarioId: string }>;
  sessionContainer?: ComponentType<{ sessionId: string }>;
  sessionAiHistoryContainer?: ComponentType<{ sessionId: string }>;
  startSessionContainer?: ComponentType<{ scenarioId: string }>;
} = {}) {
  const history = historyMode === 'browser'
    ? createBrowserHistory()
    : createMemoryHistory({ initialEntries: [initialUrl] });

  return createRouter({
    routeTree,
    history,
    context: { showDebugPanel, accountApi, scenarioListContainer, scenarioRegistrationContainer, editScenarioContainer, sessionContainer, sessionAiHistoryContainer, startSessionContainer },
    defaultPreload: 'intent',
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
