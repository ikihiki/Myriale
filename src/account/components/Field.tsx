import type { ReactNode } from 'react';

export type FieldControlState = 'default' | 'error';

export const fieldControlClassNames: Record<FieldControlState, string> = {
  default: 'placeholder:text-[#a89f93]',
  error: '!border-[var(--seal)] !bg-[#fff7f5] placeholder:text-[#a89f93]',
};

export function Field({
  label,
  htmlFor,
  required,
  help,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="my-4 grid gap-[7px]">
      <label className="text-myr-ui-sm font-extrabold text-[#4a4357]" htmlFor={htmlFor}>
        {label}
        {required && <span className="text-[var(--seal)]" aria-hidden="true"> *</span>}
      </label>
      {children}
      {help && !error && <p className="m-0 text-xs leading-normal text-myr-account-ink-soft">{help}</p>}
      {error && <p className="m-0 text-xs font-bold text-[var(--seal)]" role="alert">{error}</p>}
    </div>
  );
}
