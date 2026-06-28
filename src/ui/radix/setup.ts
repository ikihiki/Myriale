if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  const resizeObserverWindow = window as Window & typeof globalThis & { ResizeObserver?: typeof ResizeObserver };
  resizeObserverWindow.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as typeof ResizeObserver;
}

if (typeof window !== 'undefined' && window.HTMLElement) {
  const htmlElement = window.HTMLElement.prototype as HTMLElement & {
    hasPointerCapture?: (pointerId: number) => boolean;
    setPointerCapture?: (pointerId: number) => void;
    releasePointerCapture?: (pointerId: number) => void;
  };
  htmlElement.hasPointerCapture ??= () => false;
  htmlElement.setPointerCapture ??= () => {};
  htmlElement.releasePointerCapture ??= () => {};
}

if (typeof window !== 'undefined' && window.Element) {
  window.Element.prototype.scrollIntoView ??= () => {};
}
