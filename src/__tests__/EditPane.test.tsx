import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from '../components/ui';
import { EditPane } from '../shared/EditPane';
import { getEditPaneFloatingZIndex, getEditPaneOverlayZIndex, getEditPaneSurfaceZIndex } from '../shared/editPaneLayer';

function Harness() {
  const [open, setOpen] = useState(false);
  return <><Button onClick={() => setOpen(true)}>編集する</Button><EditPane open={open} onOpenChange={setOpen} title="場所を編集"><input aria-label="場所名" /></EditPane></>;
}

afterEach(cleanup);

describe('EditPane', () => {
  it('assigns each pane depth its own 100-point z-index band', () => {
    expect(getEditPaneOverlayZIndex(0)).toBe(100);
    expect(getEditPaneSurfaceZIndex(0)).toBe(110);
    expect(getEditPaneFloatingZIndex(0)).toBe(120);
    expect(getEditPaneOverlayZIndex(1)).toBe(200);
    expect(getEditPaneSurfaceZIndex(1)).toBe(210);
    expect(getEditPaneFloatingZIndex(1)).toBe(220);
    expect(getEditPaneOverlayZIndex(2)).toBe(300);
    expect(getEditPaneSurfaceZIndex(2)).toBe(310);
    expect(getEditPaneFloatingZIndex(2)).toBe(320);
  });

  it('opens as an accessible dialog and closes with Escape', async () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: '編集する' });
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: '場所を編集' });
    expect(dialog).toHaveClass('right-0', 'max-md:w-screen', 'max-md:h-[100dvh]');
    expect(dialog).toHaveStyle({ zIndex: '110' });
    expect(document.querySelector('[data-edit-pane-overlay-layer="0"]')).toHaveStyle({ zIndex: '100' });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '場所を編集' })).not.toBeInTheDocument());
  });
});
