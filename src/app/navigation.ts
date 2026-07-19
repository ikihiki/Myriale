import type { AppNavigateOptions, StoryKey } from '../shared/nav';

const navigationPaths: Record<StoryKey, string> = {
  home: '/',
  scenarioRegister: '/scenarios/new',
  scenarioEdit: '/scenarios/SCN-STAR-LIBRARY/edit',
  advancedScenario: '/scenarios/SCN-STAR-LIBRARY/edit',
  scenarioList: '/scenarios',
  startSession: '/sessions/start',
  playSession: '/sessions/SES-PREP-1098',
  resumeSession: '/sessions/SES-PREP-1098/resume',
  programDriven: '/sessions/SES-PREP-1098',
  modeTransition: '/sessions/SES-PREP-1098',
  sessionNotesAuto: '/sessions/SES-PREP-1098',
  sessionNotesLorebook: '/sessions/SES-PREP-1098',
  login: '/account/login',
  register: '/account/register',
  resetPassword: '/account/reset-password',
  profile: '/account/profile',
  security: '/account/security',
  exportData: '/account/export',
  withdraw: '/account/withdraw',
  adminUsers: '/account/admin/users',
  auditLog: '/account/admin/audit-log',
  adminAiKeys: '/account/admin/ai-keys',
};

export function appPathForStoryKey(key: StoryKey): string {
  return navigationPaths[key];
}

export function appHrefForStoryKey(key: StoryKey, options?: AppNavigateOptions): string {
  const path = appPathForStoryKey(key);
  const search = new URLSearchParams(options?.query).toString();
  return search ? `${path}?${search}` : path;
}
