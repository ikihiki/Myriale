import { useId, useState } from 'react';
import { MyrialeProgress, MyrialeToggle } from '../../ui/MyrialeRadix';
import { defaultPasswordRequirements, passwordStrength, strengthLabel } from '../password';
import type { PasswordRequirement } from '../types';
import { Field } from './Field';

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
      <div className="password-field">
        <input id={id} aria-label={label} type={visible ? 'text' : 'password'} value={value} autoComplete={autoComplete} data-testid={testId} onChange={(event) => onChange(event.target.value)} />
        <MyrialeToggle className="password-toggle" pressed={visible} aria-label={visible ? 'パスワードを隠す' : 'パスワードを表示'} onPressedChange={setVisible}>
          {visible ? '隠す' : '表示'}
        </MyrialeToggle>
      </div>
      {showStrength && (
        <div className="strength-block">
          <MyrialeProgress className="strength-meter" value={strength} max={reqs.length} data-strength={strength} aria-hidden="true" />
          <p className="strength-label" data-testid={testId ? `${testId}-strength` : undefined}>強度: {strengthLabel(strength, reqs.length)}</p>
        </div>
      )}
      {showChecklist && (
        <ul className="req-list" aria-label="パスワード要件">
          {reqs.map((requirement) => {
            const met = requirement.test(value);
            return <li key={requirement.id} className={met ? 'met' : ''} data-met={met}><span aria-hidden="true">{met ? '✓' : '○'}</span> {requirement.label}</li>;
          })}
        </ul>
      )}
    </Field>
  );
}
