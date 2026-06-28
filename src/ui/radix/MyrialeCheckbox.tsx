import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { cx } from './cx';

export function MyrialeCheckbox({
  label,
  checked,
  onCheckedChange,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Checkbox.Root>, 'checked' | 'onCheckedChange'> & {
  label: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <label className={cx('myr-ui-check-row', className)} htmlFor={id}>
      <Checkbox.Root id={id} className="myr-ui-checkbox" checked={checked} onCheckedChange={(next) => onCheckedChange(next === true)} {...props}>
        <Checkbox.Indicator className="myr-ui-checkbox-indicator">✓</Checkbox.Indicator>
      </Checkbox.Root>
      <span>{label}</span>
    </label>
  );
}
