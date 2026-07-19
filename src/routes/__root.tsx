import { createRootRouteWithContext, Outlet, useRouter, useRouterState } from '@tanstack/react-router';
import { AppNavigationProvider } from '../shared/nav';
import { appHrefForStoryKey } from '../app/navigation';
import { useAppStore } from '../app/store';
import { HomePage } from '../features/home/HomePage';
import type { AppRouterContext } from '../router';

export const Route = createRootRouteWithContext<AppRouterContext>()({
  component: RootLayout,
  notFoundComponent: HomePage,
});

function RootLayout() {
  const router = useRouter();
  const location = useRouterState({ select: (state) => state.location });
  const { db } = useAppStore();
  const { showDebugPanel } = Route.useRouteContext();
  const currentUrl = `${location.pathname}${location.searchStr}`;
  const navigate = (key: Parameters<typeof appHrefForStoryKey>[0], options?: Parameters<typeof appHrefForStoryKey>[1]) => {
    router.history.push(appHrefForStoryKey(key, options));
  };

  return (
    <AppNavigationProvider navigate={navigate}>
      <div className="myriale-app" data-testid="myriale-app" data-current-url={currentUrl}>
        {showDebugPanel && (
          <div className="app-url-console" aria-label="アプリURLとデモDB状態">
            <strong>App URL</strong>
            <code data-testid="app-url">{currentUrl}</code>
            <span data-testid="app-db-summary">
              scenarios {Object.keys(db.scenarios).length} / sessions {Object.keys(db.playSessions).length} / route {location.pathname}
              {db.ui.selectedSessionId && db.playSessions[db.ui.selectedSessionId]
                ? ` / turns ${db.playSessions[db.ui.selectedSessionId].turn}`
                : ''}
              {` / session ${db.ui.sessionView ?? 'dialogue'} / notes ${db.ui.notesPanelMode ?? 'side'}${db.ui.openNoteId ? ` / open ${db.ui.openNoteId}` : ''}`}
            </span>
          </div>
        )}
        <div key={currentUrl} className="myriale-screen-host">
          <Outlet />
        </div>
      </div>
    </AppNavigationProvider>
  );
}
