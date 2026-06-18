export const ADDON_ID = 'myriale/comment-system';
export const PANEL_ID = `${ADDON_ID}/panel`;

export const EVENTS = {
  MODE_CHANGED: `${ADDON_ID}/mode-changed`,
  TARGET_SELECTED: `${ADDON_ID}/target-selected`,
  COMMENTS_UPDATED: `${ADDON_ID}/comments-updated`,
} as const;

export type CommentMode = 'interactive' | 'select';

export type SelectedTarget = {
  id: string;
  label: string;
  elementName: string;
  selector: string;
  elementText: string;
};

export type StoryComment = SelectedTarget & {
  text: string;
};
