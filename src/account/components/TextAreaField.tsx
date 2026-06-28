import { useId } from 'react';
import { Field } from './Field';

export function TextAreaField({ label, value, onChange, placeholder, help, error, testId }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; help?: string; error?: string; testId?: string }) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} help={help} error={error}>
      <textarea id={id} aria-label={label} value={value} placeholder={placeholder} data-testid={testId} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
