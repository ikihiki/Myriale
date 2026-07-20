import type { AppChromeProps } from '../shared/AppChrome';
import type { AccountUser } from './api/accountApi';

export type AppChromeAccount = NonNullable<AppChromeProps['account']>;

export function toAppChromeAccount(user: AccountUser | null, role = 'プレイヤー'): AppChromeAccount | null {
  if (!user) return null;

  const compactName = Array.from(user.displayName.replace(/\s+/g, '')).slice(0, 2).join('');
  return {
    name: user.displayName,
    email: user.email,
    initials: compactName || '?',
    role,
  };
}
