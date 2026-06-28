import type { AccountState } from '../types';
import { stateMeta } from '../stateMeta';

export function IdentitySeal({
  state = 'active',
  initials,
  caption,
  size = 'md',
}: {
  state?: AccountState;
  initials: string;
  caption?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`identity-seal identity-${state} identity-${size}`}>
      <span className="identity-seal-mark" role="img" aria-label={`Myriale 会員之證 / ${stateMeta[state].label}`}>
        {initials}
      </span>
      {caption && <small className="identity-seal-caption">{caption}</small>}
    </div>
  );
}
