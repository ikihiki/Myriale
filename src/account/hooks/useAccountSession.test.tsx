import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDemoAccountApi } from '../api/accountApi';
import { AccountApiProvider, useAccountSession } from './useAccountSession';

afterEach(() => cleanup());

function SessionConsumer({ name }: { name: string }) {
  const session = useAccountSession();
  return <section aria-label={name}>
    <span data-testid={`${name}-status`}>{session.status}</span>
    <span data-testid={`${name}-user`}>{session.user?.displayName ?? 'anonymous'}</span>
    <button type="button" onClick={session.clearUser}>clear</button>
  </section>;
}

describe('AccountApiProvider', () => {
  it('shares one authoritative session state across AppChrome consumers', async () => {
    const api = createDemoAccountApi();
    const getMe = vi.spyOn(api, 'getMe');
    render(<AccountApiProvider api={api}>
      <SessionConsumer name="first" />
      <SessionConsumer name="second" />
    </AccountApiProvider>);

    await waitFor(() => expect(screen.getByTestId('first-status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('second-user')).toHaveTextContent('霧野しおり');
    expect(getMe).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByRole('button', { name: 'clear' })[0]);

    expect(screen.getByTestId('first-status')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('second-status')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('first-user')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('second-user')).toHaveTextContent('anonymous');
  });
});
