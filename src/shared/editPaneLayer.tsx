import { createContext, useContext, type ReactNode } from 'react';

export const EDIT_PANE_Z_INDEX_BASE = 100;
export const EDIT_PANE_Z_INDEX_STEP = 100;
export const EDIT_PANE_SURFACE_OFFSET = 10;
export const EDIT_PANE_FLOATING_OFFSET = 20;

export function getEditPaneOverlayZIndex(layer: number) {
  return EDIT_PANE_Z_INDEX_BASE + Math.max(0, layer) * EDIT_PANE_Z_INDEX_STEP;
}

export function getEditPaneSurfaceZIndex(layer: number) {
  return getEditPaneOverlayZIndex(layer) + EDIT_PANE_SURFACE_OFFSET;
}

export function getEditPaneFloatingZIndex(layer: number) {
  return getEditPaneOverlayZIndex(layer) + EDIT_PANE_FLOATING_OFFSET;
}

const EditPaneLayerContext = createContext<number | null>(null);

export function EditPaneLayerProvider({ layer, children }: { layer: number; children: ReactNode }) {
  return <EditPaneLayerContext.Provider value={layer}>{children}</EditPaneLayerContext.Provider>;
}

export function useEditPaneLayer() {
  return useContext(EditPaneLayerContext);
}
