import type { ReactNode } from 'react';
import { Badge, type BadgeTone } from '../../components/ui';
import { stateMeta } from '../stateMeta';
import type { AccountState } from '../types';

const stateTones: Record<AccountState, BadgeTone> = {
  active: 'success',
  unverified: 'warning',
  pending: 'warning',
  suspended: 'danger',
  deleted: 'neutral',
};

export function StatusBadge({ state, children }: { state: AccountState; children?: ReactNode }) {
  return <Badge tone={stateTones[state]} dot className="!pr-2.75 !pl-2.25" data-state={state}>{children ?? stateMeta[state].label}</Badge>;
}
