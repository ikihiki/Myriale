import { describe, expect, it } from 'vitest';
import { toAppChromeAccount } from './accountPresentation';

const accountUser = {
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
});
