import type { ReactNode } from 'react';
import { Notice, type NoticeTone } from '../../components/ui';

export function NoticeBanner({ children, tone = 'info', testId = 'um-notice' }: { children: ReactNode; tone?: NoticeTone; testId?: string }) {
  return <Notice tone={tone} className="mb-[18px]" data-testid={testId}>{children}</Notice>;
}
