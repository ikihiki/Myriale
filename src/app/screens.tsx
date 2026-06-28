import type { ReactElement } from 'react';
import { EditScenarioPage } from './pages/EditScenarioPage';
import { HomePage } from './pages/HomePage';
import { ScenarioRegistrationPage } from './pages/ScenarioRegistrationPage';
import { SessionPage } from './pages/SessionPage';
import { SessionResumePage } from './pages/SessionResumePage';
import { StartSessionPage } from './pages/StartSessionPage';
import { UserManagementPage, type UMView } from './pages/UserManagementPage';
import type { AppRoute, AppScreen } from './routes';

type AppScreenProps = {
  route: AppRoute;
};

type AppScreenComponent = (props: AppScreenProps) => ReactElement;

const accountViews = {
  login: 'login',
  register: 'register',
  resetPassword: 'reset',
  oauth: 'oauth',
  profile: 'profile',
  profileEdit: 'profile-edit',
  security: 'security',
  exportData: 'export',
  withdraw: 'withdraw',
  adminUsers: 'admin-list',
  adminUserDetail: 'admin-detail',
  auditLog: 'audit',
} satisfies Record<Extract<AppScreen, 'login' | 'register' | 'resetPassword' | 'oauth' | 'profile' | 'profileEdit' | 'security' | 'exportData' | 'withdraw' | 'adminUsers' | 'adminUserDetail' | 'auditLog'>, UMView>;

function AccountScreen({ route }: AppScreenProps) {
  const defaultView = route.screen in accountViews ? accountViews[route.screen as keyof typeof accountViews] : 'register';
  const requestedView = route.query.view as UMView | undefined;
  return <UserManagementPage initialView={requestedView ?? defaultView} />;
}

export const appScreens: Record<AppScreen, AppScreenComponent> = {
  home: () => <HomePage />,
  scenarioRegister: () => <ScenarioRegistrationPage />,
  scenarioEdit: () => <EditScenarioPage />,
  startSession: () => <StartSessionPage />,
  playSession: () => <SessionPage />,
  resumeSession: () => <SessionResumePage />,
  login: AccountScreen,
  register: AccountScreen,
  resetPassword: AccountScreen,
  oauth: AccountScreen,
  profile: AccountScreen,
  profileEdit: AccountScreen,
  security: AccountScreen,
  exportData: AccountScreen,
  withdraw: AccountScreen,
  adminUsers: AccountScreen,
  adminUserDetail: AccountScreen,
  auditLog: AccountScreen,
};

export function AppScreenHost({ route }: AppScreenProps) {
  const Screen = appScreens[route.screen];
  return <Screen route={route} />;
}
