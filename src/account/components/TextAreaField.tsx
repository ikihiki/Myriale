import { useId } from 'react';
import { Textarea } from '../../components/ui';
import { Field, fieldDescriptionId } from './Field';

export function TextAreaField({ label, value, onChange, placeholder, help, error, testId }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; help?: string; error?: string; testId?: string }) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} help={help} error={error}>
      <Textarea className="min-h-25 resize-y leading-[1.6] placeholder:text-[#a89f93]" id={id} aria-label={label} aria-describedby={error ? fieldDescriptionId(id, 'error') : help ? fieldDescriptionId(id, 'help') : undefined} aria-invalid={error ? true : undefined} value={value} placeholder={placeholder} data-testid={testId} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
