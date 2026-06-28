import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { cx } from './cx';

export const MyrialePopoverRoot = Popover.Root;
export const MyrialePopoverTrigger = Popover.Trigger;
export const MyrialePopoverClose = Popover.Close;

export const MyrialePopoverContent = forwardRef<
  ElementRef<typeof Popover.Content>,
  ComponentPropsWithoutRef<typeof Popover.Content>
>(function MyrialePopoverContent({ children, className, sideOffset = 10, align = 'start', ...props }, ref) {
  return (
    <Popover.Portal>
      <Popover.Content ref={ref} sideOffset={sideOffset} align={align} className={cx('myr-ui-surface myr-ui-popover', className)} {...props}>
        {children}
        <Popover.Arrow className="myr-ui-arrow" />
      </Popover.Content>
    </Popover.Portal>
  );
});
