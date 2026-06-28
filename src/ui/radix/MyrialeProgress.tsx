import type { ComponentPropsWithoutRef } from 'react';
import * as Progress from '@radix-ui/react-progress';
import { cx } from './cx';

export function MyrialeProgress({
  value,
  max = 100,
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Progress.Root> & { value: number; max?: number }) {
  const normalized = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <Progress.Root className={cx('myr-ui-progress', className)} value={value} max={max} {...props}>
      <Progress.Indicator className="myr-ui-progress-indicator" style={{ transform: `translateX(-${100 - normalized}%)` }} />
    </Progress.Root>
  );
}
