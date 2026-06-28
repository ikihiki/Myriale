import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cx } from './cx';

export const MyrialeDialogRoot = Dialog.Root;
export const MyrialeDialogTrigger = Dialog.Trigger;
export const MyrialeDialogClose = Dialog.Close;

export function MyrialeDialogContent({
  title,
  description,
  children,
  footer,
  className,
  portal = true,
  ...props
}: Dialog.DialogContentProps & {
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  /** Keep content inline for embedded wireframes/tests; default portals to body. */
  portal?: boolean;
}) {
  const content = (
    <>
      <Dialog.Overlay className="myr-ui-overlay" />
      <Dialog.Content className={cx('myr-ui-surface myr-ui-dialog', className)} {...props}>
        <div className="myr-ui-sigil" aria-hidden="true">霧</div>
        <Dialog.Title className="myr-ui-title">{title}</Dialog.Title>
        {description && <Dialog.Description className="myr-ui-description">{description}</Dialog.Description>}
        <div className="myr-ui-body">{children}</div>
        {footer && <div className="myr-ui-footer">{footer}</div>}
        <Dialog.Close className="myr-ui-icon-button" aria-label="閉じる">×</Dialog.Close>
      </Dialog.Content>
    </>
  );

  return portal ? <Dialog.Portal>{content}</Dialog.Portal> : content;
}
