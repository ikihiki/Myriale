import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from '../components/ui';
import { EditPane, getEditPaneWidthStorageKey } from '../shared/EditPane';
import { getEditPaneFloatingZIndex, getEditPaneOverlayZIndex, getEditPaneSurfaceZIndex } from '../shared/editPaneLayer';
import { MyrialeSelect } from '../ui/radix/MyrialeSelect';
import '../ui/radix/setup';

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
  fireEvent(window, new Event('resize'));
}

function Harness() {
  const [open, setOpen] = useState(false);
  return <><Button onClick={() => setOpen(true)}>編集する</Button><EditPane open={open} onOpenChange={setOpen} title="場所を編集"><input aria-label="場所名" /></EditPane></>;
}

function OpenPane({ layer = 0 }: { layer?: number }) {
  const [open, setOpen] = useState(true);
  return <EditPane layer={layer} open={open} onOpenChange={setOpen} title={`レイヤー${layer}`}><p>編集内容</p></EditPane>;
}

function NestedSelectHarness() {
  const [parentOpen, setParentOpen] = useState(true);
  const [childOpen, setChildOpen] = useState(false);
  const [value, setValue] = useState('mist');
  return (
    <>
      <EditPane open={parentOpen} onOpenChange={setParentOpen} title="親ペイン"><p>親の内容</p><Button onClick={() => setChildOpen(true)}>子ペインを開く</Button></EditPane>
      <EditPane layer={1} open={childOpen} onOpenChange={setChildOpen} title="子ペイン">
        <MyrialeSelect label="語り口" value={value} onValueChange={setValue} options={[
          { value: 'mist', label: '薄霧' },
          { value: 'ember', label: '熾火' },
        ]} />
        <p data-testid="selection">{value}</p>
        <button type="button">近くの操作</button>
      </EditPane>
    </>
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  setViewportWidth(1024);
});

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

  it('resizes from the left edge, clamps to the viewport, and persists per layer', async () => {
    setViewportWidth(1200);
    render(<OpenPane layer={1} />);
    const separator = screen.getByRole('separator', { name: '編集ペインの幅を変更' });
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveAttribute('aria-valuemin', '360');
    expect(separator).toHaveAttribute('aria-valuemax', '960');

    fireEvent.pointerDown(separator, { button: 0, pointerId: 1, clientX: 580 });
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 410 });
    await waitFor(() => expect(separator).toHaveAttribute('aria-valuenow', '790'));
    expect(window.localStorage.getItem(getEditPaneWidthStorageKey(1))).toBe('790');

    fireEvent.pointerMove(document, { pointerId: 1, clientX: -200 });
    await waitFor(() => expect(separator).toHaveAttribute('aria-valuenow', '960'));
    fireEvent.pointerUp(document, { pointerId: 1 });
    expect(window.localStorage.getItem(getEditPaneWidthStorageKey(1))).toBe('960');
  });

  it('restores a stored layer width and clamps invalidly large values', () => {
    setViewportWidth(900);
    window.localStorage.setItem(getEditPaneWidthStorageKey(0), '540');
    window.localStorage.setItem(getEditPaneWidthStorageKey(1), '2000');
    const { unmount } = render(<OpenPane layer={0} />);
    expect(screen.getByRole('separator', { name: '編集ペインの幅を変更' })).toHaveAttribute('aria-valuenow', '540');
    unmount();

    render(<OpenPane layer={1} />);
    const separator = screen.getByRole('separator', { name: '編集ペインの幅を変更' });
    expect(separator).toHaveAttribute('aria-valuemax', '844');
    expect(separator).toHaveAttribute('aria-valuenow', '844');
  });

  it('supports ArrowLeft/ArrowRight and Home/End keyboard resizing', () => {
    setViewportWidth(1000);
    window.localStorage.setItem(getEditPaneWidthStorageKey(0), '600');
    render(<OpenPane />);
    const separator = screen.getByRole('separator', { name: '編集ペインの幅を変更' });

    fireEvent.keyDown(separator, { key: 'ArrowLeft' });
    expect(separator).toHaveAttribute('aria-valuenow', '624');
    fireEvent.keyDown(separator, { key: 'ArrowRight' });
    expect(separator).toHaveAttribute('aria-valuenow', '600');
    fireEvent.keyDown(separator, { key: 'Home' });
    expect(separator).toHaveAttribute('aria-valuenow', '360');
    fireEvent.keyDown(separator, { key: 'End' });
    expect(separator).toHaveAttribute('aria-valuenow', '960');
    expect(window.localStorage.getItem(getEditPaneWidthStorageKey(0))).toBe('960');
  });

  it('keeps mobile panes full-width while retaining the desktop width', () => {
    setViewportWidth(390);
    window.localStorage.setItem(getEditPaneWidthStorageKey(0), '500');
    render(<OpenPane />);
    const dialog = screen.getByRole('dialog', { name: 'レイヤー0' });
    expect(dialog).toHaveClass('max-md:w-screen', 'max-md:inset-0');
    expect(dialog.style.getPropertyValue('--edit-pane-width')).toBe('360px');
  });

  it('hosts Select content inside the child pane and option/padding/nearby clicks do not dismiss panes', async () => {
    render(<NestedSelectHarness />);
    fireEvent.click(screen.getByRole('button', { name: '子ペインを開く' }));
    const child = await screen.findByRole('dialog', { name: '子ペイン' });
    fireEvent.click(within(child).getByRole('combobox', { name: '語り口' }));
    const option = await screen.findByRole('option', { name: '熾火' });
    expect(child).toContainElement(option);
    fireEvent.click(option);
    await waitFor(() => expect(screen.getByTestId('selection')).toHaveTextContent('ember'));
    expect(screen.getByRole('dialog', { name: '子ペイン' })).toBeInTheDocument();
    expect(document.querySelector('[data-edit-pane-layer="0"]')).toBeInTheDocument();

    fireEvent.click(within(child).getByRole('combobox', { name: '語り口' }));
    const listbox = await screen.findByRole('listbox');
    fireEvent.pointerDown(listbox);
    expect(document.querySelector('[data-edit-pane-layer="1"]')).toBeInTheDocument();
    expect(document.querySelector('[data-edit-pane-layer="0"]')).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? listbox, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    fireEvent.click(within(child).getByRole('button', { name: '近くの操作' }));
    expect(screen.getByRole('dialog', { name: '子ペイン' })).toBeInTheDocument();
    expect(document.querySelector('[data-edit-pane-layer="0"]')).toBeInTheDocument();
  });

  it('closes only the open Select on a same-trigger pointer sequence and can reopen it', async () => {
    render(<NestedSelectHarness />);
    fireEvent.click(screen.getByRole('button', { name: '子ペインを開く' }));
    const child = await screen.findByRole('dialog', { name: '子ペイン' });
    const trigger = within(child).getByRole('combobox', { name: '語り口' });

    fireEvent.click(trigger);
    await screen.findByRole('listbox');

    fireEvent.pointerDown(trigger, { button: 0, pointerId: 1 });
    fireEvent.pointerUp(trigger, { button: 0, pointerId: 1 });
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(screen.getByRole('dialog', { name: '子ペイン' })).toBeVisible();
    expect(screen.getByRole('dialog', { name: '親ペイン' })).toBeVisible();

    fireEvent.click(trigger);
    expect(await screen.findByRole('listbox')).toBeVisible();
  });

  it('closes Select, nested pane, then parent pane on successive Escape presses', async () => {
    render(<NestedSelectHarness />);
    fireEvent.click(screen.getByRole('button', { name: '子ペインを開く' }));
    const child = await screen.findByRole('dialog', { name: '子ペイン' });
    fireEvent.click(within(child).getByRole('combobox', { name: '語り口' }));
    await screen.findByRole('listbox');

    fireEvent.keyDown(document.activeElement ?? child, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(screen.getByRole('dialog', { name: '子ペイン' })).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement ?? child, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '子ペイン' })).not.toBeInTheDocument());
    expect(screen.getByRole('dialog', { name: '親ペイン' })).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '親ペイン' })).not.toBeInTheDocument());
  });
});
