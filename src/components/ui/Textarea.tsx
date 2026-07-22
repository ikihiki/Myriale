import { forwardRef, type ComponentPropsWithoutRef } from 'react';

const baseClassName = '[font:inherit] min-h-[126px] w-full resize-y rounded-2xl border border-myr-line bg-myr-paper-bright px-3.5 py-3 text-myr-ink';

function cx(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<'textarea'>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cx(baseClassName, className)} {...props} />;
  },
);
