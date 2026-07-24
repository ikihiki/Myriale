import type { AppNavigateOptions, StoryKey } from '../shared/nav';

const navigationPaths: Record<StoryKey, string> = {
  home: '/',
  scenarioRegister: '/scenarios/new',
  scenarioEdit: '/scenarios/SCN-STAR-LIBRARY/edit',
  advancedScenario: '/scenarios/SCN-STAR-LIBRARY/edit',
  scenarioList: '/scenarios',
  startSession: '/sessions/start',
  playSession: '/sessions',
  sessionList: '/sessions',
  programDriven: '/scenarios',
  modeTransition: '/scenarios',
  sessionNotesAuto: '/scenarios',
  sessionNotesLorebook: '/scenarios',
  login: '/account/login',
  register: '/account/register',
  resetPassword: '/account/reset-password',
  profile: '/account/profile',
  security: '/account/security',
  exportData: '/account/export',
  withdraw: '/account/withdraw',
  adminUsers: '/account/admin/users',
  auditLog: '/account/admin/audit-log',
  adminAiKeys: '/admin',
};

export function appPathForStoryKey(key: StoryKey, options?: AppNavigateOptions): string {
  if (options?.scenarioId && (key === 'scenarioEdit' || key === 'advancedScenario')) {
    return `/scenarios/${encodeURIComponent(options.scenarioId)}/edit`;
  }
  if (options?.sessionId) {
    const session = `/sessions/${encodeURIComponent(options.sessionId)}`;
    if (key === 'programDriven') return `${session}/program`;
    if (key === 'modeTransition') return `${session}/mode-exception`;
    if (key === 'sessionNotesAuto' || key === 'sessionNotesLorebook') return `${session}/notes`;
    if (key === 'playSession') return session;
  }
  return navigationPaths[key];
}

export function appHrefForStoryKey(key: StoryKey, options?: AppNavigateOptions): string {
  const path = appPathForStoryKey(key, options);
  const search = new URLSearchParams(options?.query).toString();
  return search ? `${path}?${search}` : path;
}
