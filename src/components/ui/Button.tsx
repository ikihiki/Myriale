import { forwardRef, type ComponentPropsWithoutRef } from 'react';

const baseClassName = 'cursor-pointer border-0 [font:inherit] disabled:cursor-not-allowed';

function cx(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export const Button = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<'button'>>(
  function Button({ className, ...props }, ref) {
    return <button ref={ref} className={cx(baseClassName, className)} {...props} />;
  },
);
