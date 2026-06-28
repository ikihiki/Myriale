import type { StoryKey } from '../shared/nav';

export type AppScreen =
  | 'home'
  | 'scenarioRegister'
  | 'scenarioEdit'
  | 'startSession'
  | 'playSession'
  | 'resumeSession'
  | 'login'
  | 'register'
  | 'resetPassword'
  | 'oauth'
  | 'profile'
  | 'profileEdit'
  | 'security'
  | 'exportData'
  | 'withdraw'
  | 'adminUsers'
  | 'adminUserDetail'
  | 'auditLog';

export type AppRoute = {
  screen: AppScreen;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
};

export const DEFAULT_APP_URL = '/';

const screenUrls: Record<AppScreen, string> = {
  home: '/',
  scenarioRegister: '/scenarios/new',
  scenarioEdit: '/scenarios/SCN-STAR-LIBRARY/edit',
  startSession: '/sessions/start',
  playSession: '/sessions/SES-PREP-1098',
  resumeSession: '/sessions/SES-PREP-1098/resume',
  login: '/account/login',
  register: '/account/register',
  resetPassword: '/account/reset-password',
  oauth: '/account/oauth',
  profile: '/account/profile',
  profileEdit: '/account/profile/edit',
  security: '/account/security',
  exportData: '/account/export',
  withdraw: '/account/withdraw',
  adminUsers: '/account/admin/users',
  adminUserDetail: '/account/admin/users/USR-1088',
  auditLog: '/account/admin/audit-log',
};

export function appUrlForStoryKey(key: StoryKey): string {
  if (key === 'advancedScenario') return screenUrls.scenarioEdit;
  if (key === 'programDriven' || key === 'modeTransition' || key === 'sessionNotesAuto' || key === 'sessionNotesLorebook') {
    return screenUrls.playSession;
  }
  return screenUrls[key as AppScreen] ?? DEFAULT_APP_URL;
}

export function routeForStoryKey(key: StoryKey): AppRoute {
  return parseAppUrl(appUrlForStoryKey(key));
}

export function parseAppUrl(input: string | undefined | null): AppRoute {
  const raw = input?.trim() || DEFAULT_APP_URL;
  let url: URL;
  try {
    url = new URL(raw, 'https://myriale.local');
  } catch {
    url = new URL(DEFAULT_APP_URL, 'https://myriale.local');
  }

  const path = normalizePath(url.pathname);
  const query = Object.fromEntries(url.searchParams.entries());
  const segments = path.split('/').filter(Boolean);
  const fallback = () => buildRoute('home', '/', {}, query);

  if (path === '/') return buildRoute('home', path, {}, query);
  if (path === '/scenarios/new') return buildRoute('scenarioRegister', path, {}, query);
  if (segments[0] === 'scenarios' && segments[1] && segments[2] === 'edit') {
    return buildRoute('scenarioEdit', path, { scenarioId: decodeURIComponent(segments[1]) }, query);
  }
  if (segments[0] === 'scenarios' && segments[1] && segments[2] === 'run-settings') {
    return buildRoute('scenarioEdit', `/scenarios/${segments[1]}/edit`, { scenarioId: decodeURIComponent(segments[1]) }, query);
  }
  if (path === '/sessions/start') return buildRoute('startSession', path, {}, query);
  if (segments[0] === 'sessions' && segments[1]) {
    const sessionId = decodeURIComponent(segments[1]);
    if (!segments[2] || segments[2] === 'play' || segments[2] === 'program' || segments[2] === 'mode-exception' || segments[2] === 'notes') {
      return buildRoute('playSession', `/sessions/${encodeURIComponent(sessionId)}`, { sessionId }, query);
    }
    if (segments[2] === 'resume') return buildRoute('resumeSession', path, { sessionId }, query);
  }
  if (segments[0] === 'account') {
    if (segments[1] === 'register') return buildRoute('register', path, {}, query);
    if (segments[1] === 'login') return buildRoute('login', path, {}, query);
    if (segments[1] === 'reset-password') return buildRoute('resetPassword', path, {}, query);
    if (segments[1] === 'oauth') return buildRoute('oauth', path, {}, query);
    if (segments[1] === 'profile' && segments[2] === 'edit') return buildRoute('profileEdit', path, {}, query);
    if (segments[1] === 'profile') return buildRoute('profile', path, {}, query);
    if (segments[1] === 'security') return buildRoute('security', path, {}, query);
    if (segments[1] === 'export') return buildRoute('exportData', path, {}, query);
    if (segments[1] === 'withdraw') return buildRoute('withdraw', path, {}, query);
    if (segments[1] === 'admin' && segments[2] === 'users' && segments[3]) {
      return buildRoute('adminUserDetail', path, { userId: decodeURIComponent(segments[3]) }, query);
    }
    if (segments[1] === 'admin' && segments[2] === 'users') return buildRoute('adminUsers', path, {}, query);
    if (segments[1] === 'admin' && segments[2] === 'audit-log') return buildRoute('auditLog', path, {}, query);
  }
  return fallback();
}

export function formatAppUrl(route: AppRoute): string {
  const search = new URLSearchParams(route.query).toString();
  return search ? `${route.path}?${search}` : route.path;
}

function normalizePath(pathname: string) {
  const normalized = pathname.replace(/\/+/g, '/').replace(/\/$/, '');
  return normalized || '/';
}

function buildRoute(
  screen: AppScreen,
  path: string,
  params: Record<string, string>,
  query: Record<string, string>,
): AppRoute {
  return { screen, path, params, query };
}
