import { useCallback, useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../components/ui';
import { EditPaneLayerProvider, getEditPaneOverlayZIndex, getEditPaneSurfaceZIndex } from './editPaneLayer';

const EDIT_PANE_MIN_WIDTH = 360;
const EDIT_PANE_MAX_WIDTH = 960;
const EDIT_PANE_KEYBOARD_STEP = 24;
const EDIT_PANE_DEFAULT_WIDTHS = [680, 620, 560] as const;

export type EditPaneProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement>;
  /**
   * Nesting depth. Every level automatically receives another 100-point
   * z-index band: 100, 200, 300, and so on.
   */
  layer?: number;
};

export function getEditPaneWidthStorageKey(layer: number) {
  return `myriale:edit-pane-width:${Math.max(0, layer)}`;
}

function getDefaultWidth(layer: number) {
  return EDIT_PANE_DEFAULT_WIDTHS[Math.min(Math.max(0, layer), EDIT_PANE_DEFAULT_WIDTHS.length - 1)];
}

function getWidthBounds(layer: number, viewportWidth: number) {
  const viewportGutter = 40 + Math.min(Math.max(0, layer), 2) * 16;
  const maxWidth = Math.max(EDIT_PANE_MIN_WIDTH, Math.min(EDIT_PANE_MAX_WIDTH, viewportWidth - viewportGutter));
  return { minWidth: Math.min(EDIT_PANE_MIN_WIDTH, maxWidth), maxWidth };
}

function clampWidth(width: number, minWidth: number, maxWidth: number) {
  return Math.min(maxWidth, Math.max(minWidth, width));
}

function readPaneWidth(layer: number, viewportWidth: number) {
  const { minWidth, maxWidth } = getWidthBounds(layer, viewportWidth);
  if (typeof window !== 'undefined') {
    try {
      const storedWidth = Number.parseFloat(window.localStorage.getItem(getEditPaneWidthStorageKey(layer)) ?? '');
      if (Number.isFinite(storedWidth)) return clampWidth(storedWidth, minWidth, maxWidth);
    } catch {
      // localStorage can be unavailable in privacy-restricted browsing contexts.
    }
  }
  return clampWidth(getDefaultWidth(layer), minWidth, maxWidth);
}

function persistPaneWidth(layer: number, width: number) {
  try {
    window.localStorage.setItem(getEditPaneWidthStorageKey(layer), String(Math.round(width)));
  } catch {
    // Resizing remains available even when persistence is unavailable.
  }
}

/**
 * A focused editor surface that slides in from the right on larger screens and
 * occupies the full viewport on small screens. Radix Dialog provides focus
 * trapping, Escape dismissal, scroll locking, and trigger-focus restoration.
 */
export function EditPane({ open, onOpenChange, title, description, eyebrow = '編集', children, footer, initialFocusRef, layer = 0 }: EditPaneProps) {
  const [viewportWidth, setViewportWidth] = useState(() => typeof window === 'undefined' ? 1280 : window.innerWidth);
  const [paneWidth, setPaneWidth] = useState(() => readPaneWidth(layer, typeof window === 'undefined' ? 1280 : window.innerWidth));
  const [isResizing, setIsResizing] = useState(false);
  const [portalHost, setPortalHost] = useState<HTMLDivElement | null>(null);
  const overlayZIndex = getEditPaneOverlayZIndex(layer);
  const surfaceZIndex = getEditPaneSurfaceZIndex(layer);
  const { minWidth, maxWidth } = useMemo(() => getWidthBounds(layer, viewportWidth), [layer, viewportWidth]);

  const updatePaneWidth = useCallback((candidate: number) => {
    const nextWidth = clampWidth(candidate, minWidth, maxWidth);
    setPaneWidth(nextWidth);
    persistPaneWidth(layer, nextWidth);
  }, [layer, maxWidth, minWidth]);

  useEffect(() => {
    setPaneWidth(readPaneWidth(layer, window.innerWidth));
  }, [layer]);

  useEffect(() => {
    const handleViewportResize = () => {
      const nextViewportWidth = window.innerWidth;
      const bounds = getWidthBounds(layer, nextViewportWidth);
      setViewportWidth(nextViewportWidth);
      setPaneWidth((currentWidth) => {
        const nextWidth = clampWidth(currentWidth, bounds.minWidth, bounds.maxWidth);
        if (nextWidth !== currentWidth) persistPaneWidth(layer, nextWidth);
        return nextWidth;
      });
    };
    window.addEventListener('resize', handleViewportResize);
    return () => window.removeEventListener('resize', handleViewportResize);
  }, [layer]);

  useEffect(() => {
    if (!isResizing) return;
    const handlePointerMove = (event: globalThis.PointerEvent) => updatePaneWidth(window.innerWidth - event.clientX);
    const handlePointerUp = () => setIsResizing(false);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp, { once: true });
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, updatePaneWidth]);

  const handleResizePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768 || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsResizing(true);
  };

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let nextWidth: number | undefined;
    if (event.key === 'ArrowLeft') nextWidth = paneWidth + EDIT_PANE_KEYBOARD_STEP;
    if (event.key === 'ArrowRight') nextWidth = paneWidth - EDIT_PANE_KEYBOARD_STEP;
    if (event.key === 'Home') nextWidth = minWidth;
    if (event.key === 'End') nextWidth = maxWidth;
    if (nextWidth === undefined) return;
    event.preventDefault();
    updatePaneWidth(nextWidth);
  };

  const contentStyle = {
    zIndex: surfaceZIndex,
    '--edit-pane-width': `${paneWidth}px`,
  } as CSSProperties & Record<'--edit-pane-width', string>;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay data-edit-pane-overlay-layer={layer} style={{ zIndex: overlayZIndex }} className="fixed inset-0 bg-[#17121d]/48 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in motion-reduce:animate-none" />
        <Dialog.Content ref={setPortalHost} onOpenAutoFocus={(event) => { if (initialFocusRef?.current) { event.preventDefault(); initialFocusRef.current.focus(); } }} data-layer={layer} data-edit-pane-layer={layer} style={contentStyle} className="fixed inset-y-0 right-0 grid w-[var(--edit-pane-width)] grid-rows-[auto_minmax(0,1fr)_auto] border-l border-[#d9cfbd] bg-[#fffaf0] text-myr-ink shadow-[-24px_0_70px_rgba(23,18,29,.24)] outline-none data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 data-[state=closed]:transition-transform data-[state=open]:transition-transform motion-reduce:transition-none max-md:inset-0 max-md:h-[100dvh] max-md:w-screen max-md:border-0">
          <div
            role="separator"
            aria-label="編集ペインの幅を変更"
            aria-orientation="vertical"
            aria-valuemin={Math.round(minWidth)}
            aria-valuemax={Math.round(maxWidth)}
            aria-valuenow={Math.round(paneWidth)}
            aria-valuetext={`${Math.round(paneWidth)}ピクセル`}
            tabIndex={0}
            data-edit-pane-resizer={layer}
            onPointerDown={handleResizePointerDown}
            onKeyDown={handleResizeKeyDown}
            className="group absolute inset-y-0 left-0 z-[1] w-4 -translate-x-1/2 cursor-ew-resize touch-none outline-none max-md:hidden"
          >
            <span aria-hidden="true" className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-myr-iris group-focus-visible:w-0.5 group-focus-visible:bg-myr-iris ${isResizing ? 'bg-myr-iris' : ''}`} />
          </div>
          <EditPaneLayerProvider layer={layer} portalHost={portalHost}>
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
          </EditPaneLayerProvider>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
