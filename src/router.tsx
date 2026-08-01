import type { ComponentType } from 'react';
import { createBrowserHistory, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { createFetchAccountApi, type AccountApi } from './account/api/accountApi';
import { ScenarioRegistrationContainer } from './features/scenario-registration/ScenarioRegistrationContainer';
import { EditScenarioContainer } from './features/scenario-editor/EditScenarioContainer';
import { ScenarioListContainer } from './features/session-start/ScenarioListContainer';
import { SessionContainer } from './features/session-play/SessionContainer';
import { TurnInspectionContainer } from './features/turn-inspection/TurnInspectionContainer';
import { StartSessionContainer } from './features/session-start/StartSessionContainer';
import { routeTree } from './routeTree.gen';

export type AppRouterContext = {
  showDebugPanel: boolean;
  accountApi: AccountApi;
  scenarioListContainer: ComponentType;
  scenarioRegistrationContainer: ComponentType;
  editScenarioContainer: ComponentType<{ scenarioId: string }>;
  sessionContainer: ComponentType<{ sessionId: string }>;
  turnInspectionContainer: ComponentType<{ sessionId: string; turnId: string }>;
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
  turnInspectionContainer = TurnInspectionContainer,
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
  turnInspectionContainer?: ComponentType<{ sessionId: string; turnId: string }>;
  startSessionContainer?: ComponentType<{ scenarioId: string }>;
} = {}) {
  const history = historyMode === 'browser'
    ? createBrowserHistory()
    : createMemoryHistory({ initialEntries: [initialUrl] });

  return createRouter({
    routeTree,
    history,
    context: { showDebugPanel, accountApi, scenarioListContainer, scenarioRegistrationContainer, editScenarioContainer, sessionContainer, turnInspectionContainer, startSessionContainer },
    defaultPreload: 'intent',
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
