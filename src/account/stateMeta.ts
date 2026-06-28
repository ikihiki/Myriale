import type { AccountState } from './types';

export const stateMeta: Record<AccountState, { label: string }> = {
  active: { label: '有効' },
  unverified: { label: 'メール未確認' },
  suspended: { label: '停止中' },
  deleted: { label: '削除済み' },
  pending: { label: '保留中' },
};
