import type { ComponentType } from 'react';
import { createBrowserHistory, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { createFetchAccountApi, type AccountApi } from './account/api/accountApi';
import { SessionContainer } from './features/session-play/SessionContainer';
import { routeTree } from './routeTree.gen';

export type AppRouterContext = {
  showDebugPanel: boolean;
  accountApi: AccountApi;
  sessionContainer: ComponentType<{ sessionId: string }>;
};

export type AppHistoryMode = 'browser' | 'memory';

export function createAppRouter({
  initialUrl = '/',
  historyMode = 'memory',
  showDebugPanel = true,
  accountApi = createFetchAccountApi(),
  sessionContainer = SessionContainer,
}: {
  initialUrl?: string;
  historyMode?: AppHistoryMode;
  showDebugPanel?: boolean;
  accountApi?: AccountApi;
  sessionContainer?: ComponentType<{ sessionId: string }>;
} = {}) {
  const history = historyMode === 'browser'
    ? createBrowserHistory()
    : createMemoryHistory({ initialEntries: [initialUrl] });

  return createRouter({
    routeTree,
    history,
    context: { showDebugPanel, accountApi, sessionContainer },
    defaultPreload: 'intent',
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
