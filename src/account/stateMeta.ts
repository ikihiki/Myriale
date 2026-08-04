import type { AccountState } from './types';

export const stateMeta: Record<AccountState, { label: string }> = {
  active: { label: '有効' },
  withdrawn: { label: '退会済み' },
};
