import { useId, useState } from 'react';
import { Input } from '../../components/ui';
import { MyrialeProgress, MyrialeToggle } from '../../ui/MyrialeRadix';
import { defaultPasswordRequirements, passwordStrength, strengthLabel } from '../password';
import type { PasswordRequirement } from '../types';
import { Field, fieldControlClassNames } from './Field';

export function PasswordField({
  label = 'パスワード',
  value,
  onChange,
  autoComplete = 'new-password',
  requirements,
  showStrength = false,
  showChecklist = false,
  help,
  error,
  testId,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  requirements?: PasswordRequirement[];
  showStrength?: boolean;
  showChecklist?: boolean;
  help?: string;
  error?: string;
  testId?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const reqs = requirements ?? defaultPasswordRequirements;
  const strength = passwordStrength(value, reqs);

  return (
    <Field label={label} htmlFor={id} help={help} error={error}>
      <div className="relative flex">
        <Input className={`${fieldControlClassNames[error ? 'error' : 'default']} pr-16`} id={id} aria-label={label} aria-invalid={error ? true : undefined} type={visible ? 'text' : 'password'} value={value} autoComplete={autoComplete} data-testid={testId} onChange={(event) => onChange(event.target.value)} />
        <MyrialeToggle className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full border-0 bg-[rgba(36,27,47,.08)] px-2.5 py-1.5 text-xs font-bold text-[#4a4357] aria-pressed:bg-[rgba(124,92,255,.16)] aria-pressed:text-[var(--iris-deep)]" pressed={visible} aria-label={visible ? 'パスワードを隠す' : 'パスワードを表示'} onPressedChange={setVisible}>
          {visible ? '隠す' : '表示'}
        </MyrialeToggle>
      </div>
      {showStrength && (
        <div className="mt-2.5">
          <MyrialeProgress className="strength-meter h-1.5 overflow-hidden rounded-full bg-[rgba(36,27,47,.12)]" value={strength} max={reqs.length} data-strength={strength} aria-hidden="true" />
          <p className="mt-1.5 mb-0 text-xs font-bold text-myr-account-ink-soft" data-testid={testId ? `${testId}-strength` : undefined}>強度: {strengthLabel(strength, reqs.length)}</p>
        </div>
      )}
      {showChecklist && (
        <ul className="mt-2.5 mb-0 grid list-none gap-1 p-0 text-xs text-myr-account-ink-soft" aria-label="パスワード要件">
          {reqs.map((requirement) => {
            const met = requirement.test(value);
            return <li key={requirement.id} className={met ? 'text-[var(--verde)]' : ''} data-met={met}><span className={met ? 'font-extrabold text-[var(--verde)]' : 'font-extrabold text-[#b6ada0]'} aria-hidden="true">{met ? '✓' : '○'}</span> {requirement.label}</li>;
          })}
        </ul>
      )}
    </Field>
  );
}
