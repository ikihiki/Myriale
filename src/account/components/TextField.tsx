import { useId } from 'react';
import { Input } from '../../components/ui';
import { Field, fieldDescriptionId } from './Field';

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
      <Input className="placeholder:text-[#a89f93]" id={id} aria-label={label} aria-describedby={error ? fieldDescriptionId(id, 'error') : help ? fieldDescriptionId(id, 'help') : undefined} aria-invalid={error ? true : undefined} type={type} value={value} placeholder={placeholder} required={required} autoComplete={autoComplete} inputMode={inputMode} name={name} data-testid={testId} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
