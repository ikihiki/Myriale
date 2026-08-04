import { describe, expect, it } from 'vitest';
import { toAppChromeAccount } from './accountPresentation';
import type { AccountUser } from './api/accountApi';
import { stateMeta } from './stateMeta';

const accountUser: AccountUser = {
  id: 'USR-1',
  displayName: 'PR37 動作確認',
  email: 'reader@example.test',
  bio: '',
  emailConfirmed: true,
  state: 'active',
};

describe('toAppChromeAccount', () => {
  it('returns no account for an anonymous visitor', () => {
    expect(toAppChromeAccount(null)).toBeNull();
  });

  it('uses the authenticated profile instead of a hard-coded identity', () => {
    expect(toAppChromeAccount(accountUser)).toEqual({
      name: 'PR37 動作確認',
      email: 'reader@example.test',
      initials: 'PR',
      role: 'プレイヤー',
    });
  });

  it('keeps the frontend account-state contract closed to backend states', () => {
    expect(Object.keys(stateMeta)).toEqual(['active', 'withdrawn']);
  });
});
