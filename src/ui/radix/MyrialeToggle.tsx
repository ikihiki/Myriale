import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as Toggle from '@radix-ui/react-toggle';
import { cx } from './cx';

export const MyrialeToggle = forwardRef<
  ElementRef<typeof Toggle.Root>,
  ComponentPropsWithoutRef<typeof Toggle.Root>
>(function MyrialeToggle({ className, ...props }, ref) {
  return <Toggle.Root ref={ref} className={cx('myr-ui-toggle', className)} {...props} />;
});
