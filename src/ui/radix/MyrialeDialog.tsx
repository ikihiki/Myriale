import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { dialogRecipe, type DialogSize, type DialogTone } from '../../components/ui';
import { cx } from './cx';

export const MyrialeDialogRoot = Dialog.Root;
export const MyrialeDialogTrigger = Dialog.Trigger;
export const MyrialeDialogClose = Dialog.Close;

export type MyrialeDialogContentProps = Dialog.DialogContentProps & {
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  size?: DialogSize;
  tone?: DialogTone;
  bodyClassName?: string;
  footerClassName?: string;
  /** Keep content inline for embedded pages/tests; default portals to body. */
  portal?: boolean;
};

export function MyrialeDialogContent({
  title,
  description,
  children,
  footer,
  size = 'default',
  tone = 'default',
  bodyClassName,
  footerClassName,
  className,
  portal = true,
  ...props
}: MyrialeDialogContentProps) {
  const content = (
    <>
      <Dialog.Overlay className={dialogRecipe({ role: 'overlay' })} />
      <Dialog.Content className={cx(dialogRecipe({ role: 'surface', size, tone }), className)} data-size={size} data-tone={tone} {...props}>
        <div className={dialogRecipe({ role: 'sigil' })} aria-hidden="true">霧</div>
        <Dialog.Title className={dialogRecipe({ role: 'title', tone })}>{title}</Dialog.Title>
        {description && <Dialog.Description className={dialogRecipe({ role: 'description', tone })}>{description}</Dialog.Description>}
        <div className={cx(dialogRecipe({ role: 'body' }), bodyClassName)}>{children}</div>
        {footer && <div className={cx(dialogRecipe({ role: 'footer' }), footerClassName)}>{footer}</div>}
        <Dialog.Close className={dialogRecipe({ role: 'close' })} aria-label="閉じる">×</Dialog.Close>
      </Dialog.Content>
    </>
  );

  return portal ? <Dialog.Portal>{content}</Dialog.Portal> : content;
}
