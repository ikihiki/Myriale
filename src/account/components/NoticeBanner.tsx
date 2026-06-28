import type { ReactNode } from 'react';

export function NoticeBanner({ children, tone = 'info', testId = 'um-notice' }: { children: ReactNode; tone?: 'info' | 'success' | 'warning' | 'danger'; testId?: string }) {
  return (
    <div className={`um-notice tone-${tone}`} role="status" data-testid={testId}>
      {children}
    </div>
  );
}
