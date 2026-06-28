import type { ReactNode } from 'react';
import { DeskBrand } from './DeskBrand';
import { SectionHead } from './SectionHead';

export function AuthScaffold({
  ariaLabel,
  kicker,
  title,
  lead,
  children,
  context,
  footer,
}: {
  ariaLabel: string;
  kicker: string;
  title: string;
  lead?: string;
  children: ReactNode;
  context?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-desk">
      <main className="auth-card" aria-label={ariaLabel}>
        <DeskBrand />
        <SectionHead kicker={kicker} title={title} lead={lead} />
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </main>
      {context && <aside className="auth-context" aria-label="補足情報">{context}</aside>}
    </div>
  );
}
