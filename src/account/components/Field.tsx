import type { ReactNode } from 'react';

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
    <div className={`field ${error ? 'has-error' : ''}`.trim()}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="req-star" aria-hidden="true"> *</span>}
      </label>
      {children}
      {help && !error && <p className="field-help">{help}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
