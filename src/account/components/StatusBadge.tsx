import type { ReactNode } from 'react';
import { stateMeta } from '../stateMeta';
import type { AccountState } from '../types';

export function StatusBadge({ state, children }: { state: AccountState; children?: ReactNode }) {
  return (
    <span className={`status-badge status-${state}`} data-state={state}>
      <span className="status-dot" aria-hidden="true" />
      {children ?? stateMeta[state].label}
    </span>
  );
}
