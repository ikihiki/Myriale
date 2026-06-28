import { useMemo } from 'react';
import { EditScenarioWireframe } from '../EditScenarioWireframe';
import { ModeTransitionExceptionWireframe } from '../ModeTransitionExceptionWireframe';
import { ProgramDrivenNarrativeWireframe } from '../ProgramDrivenNarrativeWireframe';
import { ScenarioRegistrationWireframe } from '../ScenarioRegistrationWireframe';
import { SessionNotesAutoGenerationWireframe } from '../SessionNotesAutoGenerationWireframe';
import { SessionNotesLorebookWireframe } from '../SessionNotesLorebookWireframe';
import { SessionPlayDialogueWireframe } from '../SessionPlayDialogueWireframe';
import { SessionResumeWireframe } from '../SessionResumeWireframe';
import { StartSessionWireframe } from '../StartSessionWireframe';
import { UserManagementWireframe, type UMView } from '../UserManagementWireframe';
import { AppNavigationProvider, type StoryKey } from '../shared/nav';
import { appUrlForStoryKey, formatAppUrl, parseAppUrl, type AppRoute } from './routes';
import { AppStoreProvider, type AppDb, useAppStore } from './store';
import './myrialeApp.css';

export type MyrialeAppProps = {
  initialUrl?: string;
  initialDb?: AppDb;
  showDebugPanel?: boolean;
};

export function MyrialeApp({ initialUrl = '/scenarios/new', initialDb, showDebugPanel = true }: MyrialeAppProps) {
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
  const screen = useMemo(() => renderScreen(db.ui.route), [db.ui.route, currentUrl]);

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
              {` / notes ${db.ui.notesPanelMode ?? 'side'}${db.ui.openNoteId ? ` / open ${db.ui.openNoteId}` : ''}`}
            </span>
          </div>
        )}
        <div key={currentUrl} className="myriale-screen-host">
          {screen}
        </div>
      </div>
    </AppNavigationProvider>
  );
}

function renderScreen(route: AppRoute) {
  const screen = route.screen;
  const accountView = route.query.view as UMView | undefined;
  switch (screen) {
    case 'scenarioRegister':
      return <ScenarioRegistrationWireframe />;
    case 'scenarioEdit':
      return <EditScenarioWireframe />;
    case 'startSession':
      return <StartSessionWireframe />;
    case 'playSession':
      return <SessionPlayDialogueWireframe />;
    case 'resumeSession':
      return <SessionResumeWireframe />;
    case 'programDriven':
      return <ProgramDrivenNarrativeWireframe />;
    case 'modeTransition':
      return <ModeTransitionExceptionWireframe />;
    case 'sessionNotesAuto':
      return <SessionNotesAutoGenerationWireframe />;
    case 'sessionNotesLorebook':
      return <SessionNotesLorebookWireframe />;
    case 'login':
      return <UserManagementWireframe initialView={accountView ?? 'login'} />;
    case 'register':
      return <UserManagementWireframe initialView={accountView ?? 'register'} />;
    case 'resetPassword':
      return <UserManagementWireframe initialView={accountView ?? 'reset'} />;
    case 'oauth':
      return <UserManagementWireframe initialView="oauth" />;
    case 'profile':
      return <UserManagementWireframe initialView="profile" />;
    case 'profileEdit':
      return <UserManagementWireframe initialView="profile-edit" />;
    case 'security':
      return <UserManagementWireframe initialView="security" />;
    case 'exportData':
      return <UserManagementWireframe initialView="export" />;
    case 'withdraw':
      return <UserManagementWireframe initialView="withdraw" />;
    case 'adminUsers':
      return <UserManagementWireframe initialView="admin-list" />;
    case 'adminUserDetail':
      return <UserManagementWireframe initialView="admin-detail" />;
    case 'auditLog':
      return <UserManagementWireframe initialView="audit" />;
    default:
      return <UserManagementWireframe initialView={'register' satisfies UMView} />;
  }
}
