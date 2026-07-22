import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { noticeRecipe, type NoticeTone, type NoticeVariant } from './statusRecipes';

function cx(...classNames: Array<string | undefined | false>) {
  return classNames.filter(Boolean).join(' ');
}

export type NoticeProps = ComponentPropsWithoutRef<'div'> & {
  tone?: NoticeTone;
  variant?: NoticeVariant;
};

export const Notice = forwardRef<HTMLDivElement, NoticeProps>(
  function Notice({ className, tone = 'info', variant = 'inverse', role = 'status', ...props }, ref) {
    return <div ref={ref} className={cx(noticeRecipe(tone, variant), className)} role={role} {...props} />;
  },
);
