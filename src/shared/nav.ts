import { addons } from '@storybook/preview-api';
import { createContext, createElement, useContext, type ReactNode } from 'react';

/**
 * Central cross-page navigation map.
 *
 * Every page is one section/page of the same Myriale app. These are the
 * canonical Storybook story ids that the global app navigation (AppChrome)
 * links to, so "go to my account", "open the library", etc. resolve to the same
 * destinations everywhere. Navigation uses Storybook's `selectStory` channel
 * event — the same mechanism @storybook/addon-links uses — so no extra
 * dependency is needed.
 */
export const STORY_IDS = {
  home: 'アプリ-myriale-app--home-dashboard',
  // Account / auth (User management page)
  login: 'ユーザーストーリー-user-management--um-03-login-with-email',
  register: 'ユーザーストーリー-user-management--um-01-register-with-email',
  resetPassword: 'ユーザーストーリー-user-management--um-05-reset-password',
  profile: 'ユーザーストーリー-user-management--um-08-view-profile',
  security: 'ユーザーストーリー-user-management--um-10-manage-security',
  exportData: 'ユーザーストーリー-user-management--um-12-export-data',
  withdraw: 'ユーザーストーリー-user-management--um-11-delete-account',
  adminUsers: 'ユーザーストーリー-user-management--um-13-admin-user-list',
  auditLog: 'ユーザーストーリー-user-management--um-16-audit-log',
  adminAiKeys: 'ユーザーストーリー-user-management--um-17-admin-ai-keys',
  // Library / authoring
  scenarioRegister: 'ユーザーストーリー-scenario-registration--us-01-create-draft-scenario',
  scenarioEdit: 'ユーザーストーリー-edit-scenario--use-01-edit-existing-scenario',
  advancedScenario: 'ユーザーストーリー-scenario-registration--us-04-as-use-advanced-controls-during-registration',
  // Sessions
  scenarioList: 'ユーザーストーリー-start-session--uss-01-start-new-session-from-scenario',
  startSession: 'ユーザーストーリー-start-session--uss-02-read-intro-before-hero',
  playSession: 'ユーザーストーリー-session-play-dialogue--usp-01-current-situation-narrative',
  resumeSession: 'ユーザーストーリー-session-resume--usr-01-resume-from-last-state',
  programDriven: 'ユーザーストーリー-program-driven-narrative--uspg-01-forced-mode-disables-input',
  modeTransition: 'ユーザーストーリー-mode-transition-and-exception--usm-01-explicit-mode-switch',
  sessionNotesAuto: 'ユーザーストーリー-session-notes-auto-generation--usan-01-create-pending-note',
  sessionNotesLorebook: 'ユーザーストーリー-session-notes-lorebook--usl-01-create-person-note',
} as const;

export type StoryKey = keyof typeof STORY_IDS;

export type AppNavigateOptions = {
  query?: Record<string, string>;
  sessionId?: string;
};

type AppNavigate = (to: StoryKey, options?: AppNavigateOptions) => void;

const AppNavigationContext = createContext<AppNavigate | null>(null);

export function AppNavigationProvider({ navigate, children }: { navigate: AppNavigate; children: ReactNode }) {
  return createElement(AppNavigationContext.Provider, { value: navigate }, children);
}

export function useAppNavigation() {
  return useContext(AppNavigationContext);
}

/** Navigate to another page's story (no-op outside a Storybook preview). */
export function navigateToStory(storyId: string) {
  try {
    addons.getChannel().emit('selectStory', { storyId });
  } catch {
    // Outside Storybook (e.g. a plain unit-test render) there is no channel;
    // the navigation is simply a no-op.
  }
}
