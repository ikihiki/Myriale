import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cx } from './cx';

export const MyrialeMenuItem = forwardRef<
  ElementRef<typeof DropdownMenu.Item>,
  ComponentPropsWithoutRef<typeof DropdownMenu.Item>
>(function MyrialeMenuItem({ className, ...props }, ref) {
  return <DropdownMenu.Item ref={ref} className={cx('myr-ui-menu-item', className)} {...props} />;
});
