import type { ReactNode } from 'react';

export type FieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
};

export function fieldDescriptionId(htmlFor: string, role: 'help' | 'error') {
  return `${htmlFor}-${role}`;
}

export function Field({ label, htmlFor, required, help, error, children }: FieldProps) {
  return (
    <div className="my-4 grid gap-1.75">
      <label className="text-myr-ui-sm font-extrabold text-[#4a4357]" htmlFor={htmlFor}>
        {label}
        {required && <span className="text-[var(--seal)]" aria-hidden="true"> *</span>}
      </label>
      {children}
      {help && !error && <p id={fieldDescriptionId(htmlFor, 'help')} className="m-0 text-xs leading-normal text-myr-account-ink-soft">{help}</p>}
      {error && <p id={fieldDescriptionId(htmlFor, 'error')} className="m-0 text-xs font-bold text-[var(--seal)]" role="alert">{error}</p>}
    </div>
  );
}
