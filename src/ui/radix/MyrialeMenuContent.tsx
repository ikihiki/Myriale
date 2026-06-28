import type { ComponentPropsWithoutRef } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cx } from './cx';

export function MyrialeMenuContent({
  children,
  className,
  align = 'end',
  sideOffset = 8,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content className={cx('myr-ui-surface myr-ui-menu', className)} align={align} sideOffset={sideOffset} {...props}>
        {children}
        <DropdownMenu.Arrow className="myr-ui-arrow" />
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}
