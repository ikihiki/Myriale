import { createRef, type FormEvent } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '.';

afterEach(cleanup);

describe('Button', () => {
  it('forwards its ref and standard native, ARIA, and data props', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref} name="action" value="save" aria-label="Save" data-state="ready">保存</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(ref.current).toBe(button);
    expect(button.getAttribute('name')).toBe('action');
    expect(button.getAttribute('value')).toBe('save');
    expect(button.getAttribute('data-state')).toBe('ready');
  });

  it('merges the compatibility base with className', () => {
    render(<Button className="rounded-full bg-myr-ink">続ける</Button>);

    const button = screen.getByRole('button', { name: '続ける' });
    for (const className of ['cursor-pointer', 'border-0', '[font:inherit]', 'disabled:cursor-not-allowed', 'rounded-full', 'bg-myr-ink']) {
      expect(button.classList.contains(className)).toBe(true);
    }
  });

  it('handles clicks and preserves native disabled behavior', () => {
    const enabledClick = vi.fn();
    const disabledClick = vi.fn();
    render(<><Button onClick={enabledClick}>有効</Button><Button disabled onClick={disabledClick}>無効</Button></>);

    fireEvent.click(screen.getByRole('button', { name: '有効' }));
    fireEvent.click(screen.getByRole('button', { name: '無効' }));
    expect(enabledClick).toHaveBeenCalledOnce();
    expect(disabledClick).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: '無効' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('leaves an omitted type unset and retains native form submit behavior', () => {
    const submit = vi.fn((event: FormEvent) => event.preventDefault());
    render(<form onSubmit={submit}><Button>送信</Button></form>);

    const button = screen.getByRole('button', { name: '送信' });
    expect(button.getAttribute('type')).toBeNull();
    fireEvent.click(button);
    expect(submit).toHaveBeenCalledOnce();
  });

  it('preserves an explicit button type', () => {
    render(<Button type="reset">リセット</Button>);
    expect(screen.getByRole('button', { name: 'リセット' }).getAttribute('type')).toBe('reset');
  });
});
