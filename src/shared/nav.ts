import { addons } from '@storybook/preview-api';

/**
 * Central cross-wireframe navigation map.
 *
 * Every wireframe is one section/page of the same Myriale app. These are the
 * canonical Storybook story ids that the global app navigation (AppChrome)
 * links to, so "go to my account", "open the library", etc. resolve to the same
 * destinations everywhere. Navigation uses Storybook's `selectStory` channel
 * event — the same mechanism @storybook/addon-links uses — so no extra
 * dependency is needed.
 */
export const STORY_IDS = {
  // Account / auth (User management wireframe)
  login: 'user-management-wireframe-from-user-stories--um-03-login-with-email',
  register: 'user-management-wireframe-from-user-stories--um-01-register-with-email',
  resetPassword: 'user-management-wireframe-from-user-stories--um-05-reset-password',
  profile: 'user-management-wireframe-from-user-stories--um-08-view-profile',
  security: 'user-management-wireframe-from-user-stories--um-10-manage-security',
  exportData: 'user-management-wireframe-from-user-stories--um-12-export-data',
  withdraw: 'user-management-wireframe-from-user-stories--um-11-delete-account',
  adminUsers: 'user-management-wireframe-from-user-stories--um-13-admin-user-list',
  auditLog: 'user-management-wireframe-from-user-stories--um-16-audit-log',
  // Library / authoring
  scenarioRegister: 'scenario-registration-wireframe-from-user-stories--us-01-create-draft-scenario',
  scenarioEdit: 'edit-scenario-wireframe-from-user-stories--use-01-edit-existing-scenario',
  advancedScenario: 'advanced-scenario-execution-wireframe-from-user-stories--usas-01-define-cast-pool',
  // Sessions
  startSession: 'start-session-wireframe-from-user-stories--uss-01-start-new-session-from-scenario',
  playSession: 'session-play-dialogue-wireframe-from-user-stories--usp-01-current-situation-narrative',
  resumeSession: 'session-resume-wireframe-from-user-stories--usr-01-resume-from-last-state',
  programDriven: 'program-driven-narrative-wireframe-from-user-stories--uspg-01-forced-mode-disables-input',
} as const;

export type StoryKey = keyof typeof STORY_IDS;

/** Navigate to another wireframe's story (no-op outside a Storybook preview). */
export function navigateToStory(storyId: string) {
  try {
    addons.getChannel().emit('selectStory', { storyId });
  } catch {
    // Outside Storybook (e.g. a plain unit-test render) there is no channel;
    // the navigation is simply a no-op.
  }
}
