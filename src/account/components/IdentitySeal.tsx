import type { AccountState } from '../types';
import { stateMeta } from '../stateMeta';

type IdentitySize = 'sm' | 'md';

const sizeClassNames: Record<IdentitySize, string> = {
  sm: 'size-11 text-myr-control',
  md: 'size-18 text-2xl',
};

const stateClassNames: Record<AccountState, string> = {
  active: '[background:radial-gradient(circle_at_32%_26%,rgba(255,255,255,.5),transparent_44%),conic-gradient(from_180deg,var(--verde),var(--mist),#7fd2ad,var(--verde))] text-[#0f2a1f]',
  unverified: '[background:radial-gradient(circle_at_32%_26%,rgba(255,255,255,.5),transparent_44%),conic-gradient(from_180deg,var(--ember),var(--amber),#ffd9a8,var(--ember))]',
  pending: '[background:radial-gradient(circle_at_32%_26%,rgba(255,255,255,.5),transparent_44%),conic-gradient(from_180deg,var(--ember),var(--amber),#ffd9a8,var(--ember))]',
  suspended: '[background:radial-gradient(circle_at_32%_26%,rgba(255,255,255,.4),transparent_44%),conic-gradient(from_180deg,var(--seal),#e08a86,var(--seal))] text-white',
  deleted: '[background:radial-gradient(circle_at_32%_26%,rgba(255,255,255,.2),transparent_44%),#6c6577] text-[#efe9ee] grayscale-[.4]',
};

export function IdentitySeal({
  state = 'active',
  initials,
  caption,
  size = 'md',
}: {
  state?: AccountState;
  initials: string;
  caption?: string;
  size?: IdentitySize;
}) {
  return (
    <div className="inline-grid justify-items-center gap-1.5 text-center">
      <span className={`grid place-items-center rounded-[46%_54%_50%_50%/52%_48%_52%_48%] font-[Georgia,serif] font-extrabold shadow-[inset_0_0_0_2px_rgba(255,255,255,.3),0_6px_16px_rgba(18,16,25,.26)] ${sizeClassNames[size]} ${stateClassNames[state]}`} role="img" aria-label={`Myriale 会員之證 / ${stateMeta[state].label}`}>
        {initials}
      </span>
      {caption && <small className="text-myr-caption tracking-myr-label text-myr-account-ink-soft">{caption}</small>}
    </div>
  );
}
