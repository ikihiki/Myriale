import { useId } from 'react';
import { Field, fieldControlClassNames } from './Field';

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  help,
  error,
  required,
  autoComplete,
  inputMode,
  name,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'search';
  placeholder?: string;
  help?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'search';
  name?: string;
  testId?: string;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} required={required} help={help} error={error}>
      <input className={fieldControlClassNames[error ? 'error' : 'default']} id={id} aria-label={label} aria-invalid={error ? true : undefined} type={type} value={value} placeholder={placeholder} required={required} autoComplete={autoComplete} inputMode={inputMode} name={name} data-testid={testId} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
