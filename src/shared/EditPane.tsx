import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../components/ui';

export type EditPaneProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * A focused editor surface that slides in from the right on larger screens and
 * occupies the full viewport on small screens. Radix Dialog provides focus
 * trapping, Escape dismissal, scroll locking, and trigger-focus restoration.
 */
export function EditPane({ open, onOpenChange, title, description, eyebrow = '編集', children, footer }: EditPaneProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-[#17121d]/48 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in motion-reduce:animate-none" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[71] grid w-[min(680px,calc(100vw-40px))] grid-rows-[auto_minmax(0,1fr)_auto] border-l border-[#d9cfbd] bg-[#fffaf0] text-myr-ink shadow-[-24px_0_70px_rgba(23,18,29,.24)] outline-none data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 data-[state=closed]:transition-transform data-[state=open]:transition-transform motion-reduce:transition-none max-md:inset-0 max-md:h-[100dvh] max-md:w-screen max-md:border-0">
          <header className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#d9cfbd] bg-[linear-gradient(135deg,#fffaf0,#f4eddf)] px-6 py-5 max-md:px-4 max-md:py-4">
            <div className="min-w-0">
              <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-myr-slate-muted">{eyebrow}</p>
              <Dialog.Title className="font-myr-display text-xl font-bold leading-tight text-myr-ink">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-1 text-sm leading-6 text-myr-ink-subtle">{description}</Dialog.Description>}
            </div>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="sm" className="size-10 !p-0" aria-label="編集ペインを閉じる">×</Button>
            </Dialog.Close>
          </header>
          <div className="min-h-0 overflow-y-auto overscroll-contain px-6 py-5 max-md:px-4">{children}</div>
          {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-[#d9cfbd] bg-[#fffaf0]/95 px-6 py-4 max-md:px-4">{footer}</footer>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
