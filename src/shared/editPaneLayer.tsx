import { createContext, useContext, type ReactNode } from 'react';

export const EDIT_PANE_Z_INDEX_BASE = 100;
export const EDIT_PANE_Z_INDEX_STEP = 100;
export const EDIT_PANE_SURFACE_OFFSET = 10;
export const EDIT_PANE_FLOATING_OFFSET = 20;

type EditPaneLayerContextValue = {
  layer: number;
  portalHost: HTMLElement | null;
};

export function getEditPaneOverlayZIndex(layer: number) {
  return EDIT_PANE_Z_INDEX_BASE + Math.max(0, layer) * EDIT_PANE_Z_INDEX_STEP;
}

export function getEditPaneSurfaceZIndex(layer: number) {
  return getEditPaneOverlayZIndex(layer) + EDIT_PANE_SURFACE_OFFSET;
}

export function getEditPaneFloatingZIndex(layer: number) {
  return getEditPaneOverlayZIndex(layer) + EDIT_PANE_FLOATING_OFFSET;
}

const EditPaneLayerContext = createContext<EditPaneLayerContextValue | null>(null);

export function EditPaneLayerProvider({ layer, portalHost, children }: { layer: number; portalHost: HTMLElement | null; children: ReactNode }) {
  return <EditPaneLayerContext.Provider value={{ layer, portalHost }}>{children}</EditPaneLayerContext.Provider>;
}

export function useEditPaneLayer() {
  return useContext(EditPaneLayerContext)?.layer ?? null;
}

export function useEditPanePortalHost() {
  return useContext(EditPaneLayerContext)?.portalHost;
}
