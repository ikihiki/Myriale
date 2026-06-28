import type { ReactNode } from 'react';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { cx } from './cx';
import type { MyrialeOption } from './types';

export function MyrialeRadioGroup({
  label,
  value,
  onValueChange,
  options,
  className,
}: {
  label: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  options: MyrialeOption[];
  className?: string;
}) {
  return (
    <RadioGroup.Root className={cx('myr-ui-radio-group', className)} value={value} onValueChange={onValueChange} aria-label={typeof label === 'string' ? label : undefined}>
      <div className="myr-ui-radio-legend">{label}</div>
      {options.map((option) => (
        <label key={option.value} className="myr-ui-check-row">
          <RadioGroup.Item className="myr-ui-radio" value={option.value} aria-label={option.label}>
            <RadioGroup.Indicator className="myr-ui-radio-indicator" />
          </RadioGroup.Item>
          <span>{option.label}</span>
        </label>
      ))}
    </RadioGroup.Root>
  );
}
