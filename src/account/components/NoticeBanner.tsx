import type { ReactNode } from 'react';

type NoticeTone = 'info' | 'success' | 'warning' | 'danger';

const toneClassNames: Record<NoticeTone, string> = {
  info: 'shadow-[inset_4px_0_0_var(--iris)]',
  success: 'shadow-[inset_4px_0_0_var(--verde)]',
  warning: 'shadow-[inset_4px_0_0_var(--ember)]',
  danger: 'shadow-[inset_4px_0_0_var(--seal)]',
};

export function NoticeBanner({ children, tone = 'info', testId = 'um-notice' }: { children: ReactNode; tone?: NoticeTone; testId?: string }) {
  return (
    <div className={`mb-[18px] rounded-2xl bg-[rgba(18,16,25,.86)] px-4 py-3 text-sm leading-normal text-[#fff6e7] ${toneClassNames[tone]}`} role="status" data-testid={testId}>
      {children}
    </div>
  );
}
