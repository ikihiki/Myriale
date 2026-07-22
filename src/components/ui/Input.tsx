import { forwardRef, type ComponentPropsWithoutRef } from 'react';

const baseClassName = '[font:inherit] w-full rounded-2xl border border-myr-line bg-myr-paper-bright px-3.5 py-3 text-myr-ink';

function cx(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export const Input = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cx(baseClassName, className)} {...props} />;
  },
);
