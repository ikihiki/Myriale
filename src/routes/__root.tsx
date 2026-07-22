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
      <div className="min-h-screen bg-[#ece7dc]" data-testid="myriale-app" data-current-url={currentUrl}>
        {showDebugPanel && (
          <div className="sticky top-0 z-50 flex items-center gap-3 border-b border-[rgba(46,36,25,0.16)] bg-[rgba(255,252,244,0.95)] px-4 py-[0.55rem] font-sans text-[0.85rem] leading-[1.4] text-[#382d23] backdrop-blur-[10px]" aria-label="アプリURLとデモDB状態">
            <strong>App URL</strong>
            <code className="rounded-full border border-[rgba(81,63,43,0.22)] bg-[#fffaf0] px-[0.65rem] py-[0.2rem] text-[#7b3f16]" data-testid="app-url">{currentUrl}</code>
            <span className="ml-auto text-[#6f6254]" data-testid="app-db-summary">
              scenarios {Object.keys(db.scenarios).length} / sessions {Object.keys(db.playSessions).length} / route {location.pathname}
              {db.ui.selectedSessionId && db.playSessions[db.ui.selectedSessionId]
                ? ` / turns ${db.playSessions[db.ui.selectedSessionId].turn}`
                : ''}
              {` / session ${db.ui.sessionView ?? 'dialogue'} / notes ${db.ui.notesPanelMode ?? 'side'}${db.ui.openNoteId ? ` / open ${db.ui.openNoteId}` : ''}`}
            </span>
          </div>
        )}
        <div key={currentUrl} className="min-h-[calc(100vh-2.4rem)]">
          <Outlet />
        </div>
      </div>
    </AppNavigationProvider>
  );
}
