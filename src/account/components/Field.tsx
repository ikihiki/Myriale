import type { ReactNode } from 'react';

export type FieldControlState = 'default' | 'error';

export const fieldControlClassNames: Record<FieldControlState, string> = {
  default: 'w-full rounded-2xl border border-[var(--line)] bg-[#fffef9] px-3.5 py-3 text-[var(--ink)] placeholder:text-[#a89f93]',
  error: 'w-full rounded-2xl border border-[var(--seal)] bg-[#fff7f5] px-3.5 py-3 text-[var(--ink)] placeholder:text-[#a89f93]',
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
      <label className="text-[13px] font-extrabold text-[#4a4357]" htmlFor={htmlFor}>
        {label}
        {required && <span className="text-[var(--seal)]" aria-hidden="true"> *</span>}
      </label>
      {children}
      {help && !error && <p className="m-0 text-xs leading-normal text-[var(--ink-soft)]">{help}</p>}
      {error && <p className="m-0 text-xs font-bold text-[var(--seal)]" role="alert">{error}</p>}
    </div>
  );
}
