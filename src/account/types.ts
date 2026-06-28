import type { ReactNode } from 'react';

export type AccountState = 'active' | 'unverified' | 'suspended' | 'deleted' | 'pending';

export type PasswordRequirement = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export type OAuthProvider = { id: string; label: string; glyph: string };
export type DefItem = { term: string; value: ReactNode };

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  registered: string;
  lastLogin: string;
  state: AccountState;
  sessions: number;
};

export type NavItem = { id: string; label: string };
