import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from '../components/ui';
import { EditPane } from '../shared/EditPane';

function Harness() {
  const [open, setOpen] = useState(false);
  return <><Button onClick={() => setOpen(true)}>編集する</Button><EditPane open={open} onOpenChange={setOpen} title="場所を編集"><input aria-label="場所名" /></EditPane></>;
}

afterEach(cleanup);

describe('EditPane', () => {
  it('opens as an accessible dialog and closes with Escape', async () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: '編集する' });
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: '場所を編集' });
    expect(dialog).toHaveClass('right-0', 'max-md:w-screen', 'max-md:h-[100dvh]');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '場所を編集' })).not.toBeInTheDocument());
  });
});
