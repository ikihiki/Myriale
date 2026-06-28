import { AppNavigationProvider, type StoryKey } from '../shared/nav';
import { DEFAULT_APP_URL, appUrlForStoryKey, formatAppUrl, parseAppUrl } from './routes';
import { AppScreenHost } from './screens';
import { AppStoreProvider, type AppDb, useAppStore } from './store';
import './myrialeApp.css';

export type MyrialeAppProps = {
  initialUrl?: string;
  initialDb?: AppDb;
  showDebugPanel?: boolean;
};

export function MyrialeApp({ initialUrl = DEFAULT_APP_URL, initialDb, showDebugPanel = true }: MyrialeAppProps) {
  return (
    <AppStoreProvider initialUrl={initialUrl} initialDb={initialDb}>
      <MyrialeAppRuntime showDebugPanel={showDebugPanel} />
    </AppStoreProvider>
  );
}

function MyrialeAppRuntime({ showDebugPanel }: { showDebugPanel: boolean }) {
  const { db, dispatch } = useAppStore();
  const currentUrl = formatAppUrl(db.ui.route);
  const navigate = (key: StoryKey) => dispatch({ type: 'NAVIGATE', route: parseAppUrl(appUrlForStoryKey(key)) });

  return (
    <AppNavigationProvider navigate={navigate}>
      <div className="myriale-app" data-testid="myriale-app" data-current-url={currentUrl}>
        {showDebugPanel && (
          <div className="app-url-console" aria-label="アプリURLとデモDB状態">
            <strong>App URL</strong>
            <code data-testid="app-url">{currentUrl}</code>
            <span data-testid="app-db-summary">
              scenarios {Object.keys(db.scenarios).length} / sessions {Object.keys(db.playSessions).length} / route {db.ui.route.screen}
              {db.ui.selectedSessionId && db.playSessions[db.ui.selectedSessionId]
                ? ` / turns ${db.playSessions[db.ui.selectedSessionId].turn}`
                : ''}
              {` / session ${db.ui.sessionView ?? 'dialogue'} / notes ${db.ui.notesPanelMode ?? 'side'}${db.ui.openNoteId ? ` / open ${db.ui.openNoteId}` : ''}`}
            </span>
          </div>
        )}
        <div key={currentUrl} className="myriale-screen-host">
          <AppScreenHost route={db.ui.route} />
        </div>
      </div>
    </AppNavigationProvider>
  );
}
