import type { ReactNode } from 'react';
import { stateMeta } from '../stateMeta';
import type { AccountState } from '../types';

const badgeStateClassNames: Record<AccountState, string> = {
  active: 'border-[rgba(47,111,87,.4)] bg-[rgba(47,111,87,.1)] text-[#245741]',
  unverified: 'border-[rgba(217,164,65,.42)] bg-[rgba(217,164,65,.14)] text-[#7a571a]',
  pending: 'border-[rgba(217,164,65,.42)] bg-[rgba(217,164,65,.14)] text-[#7a571a]',
  suspended: 'border-[rgba(184,69,63,.42)] bg-[rgba(184,69,63,.12)] text-[#8c322c]',
  deleted: 'border-myr-line-strong bg-myr-paper-bright text-[#57515f]',
};

const dotStateClassNames: Record<AccountState, string> = {
  active: 'bg-[var(--verde)]',
  unverified: 'bg-[var(--amber)]',
  pending: 'bg-[var(--amber)]',
  suspended: 'bg-[var(--seal)]',
  deleted: 'bg-[var(--ink-soft)]',
};

export function StatusBadge({ state, children }: { state: AccountState; children?: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-[7px] whitespace-nowrap rounded-full border py-1 pr-[11px] pl-[9px] text-xs font-bold ${badgeStateClassNames[state]}`} data-state={state}>
      <span className={`size-2 rounded-full ${dotStateClassNames[state]}`} aria-hidden="true" />
      {children ?? stateMeta[state].label}
    </span>
  );
}
