import type { OAuthProvider } from './types';

export const defaultProviders: OAuthProvider[] = [
  { id: 'google', label: 'Google', glyph: 'G' },
  { id: 'github', label: 'GitHub', glyph: '⌥' },
];
