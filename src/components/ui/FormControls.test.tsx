import { createRef, useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Input, Textarea } from '.';

afterEach(cleanup);

describe('Input', () => {
  it('forwards its ref and standard native, ARIA, and data props', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} type="password" name="secret" autoComplete="current-password" aria-label="Secret" data-state="ready" />);

    const input = screen.getByLabelText('Secret');
    expect(ref.current).toBe(input);
    expect(input.getAttribute('type')).toBe('password');
    expect(input.getAttribute('name')).toBe('secret');
    expect(input.getAttribute('autocomplete')).toBe('current-password');
    expect(input.getAttribute('data-state')).toBe('ready');
  });

  it('merges className and supports controlled changes', () => {
    function ControlledInput() {
      const [value, setValue] = useState('before');
      return <Input aria-label="Controlled input" className="border-0 bg-transparent" value={value} onChange={(event) => setValue(event.target.value)} />;
    }

    render(<ControlledInput />);
    const input = screen.getByLabelText('Controlled input');
    for (const className of ['w-full', 'rounded-2xl', 'border-0', 'bg-transparent']) {
      expect(input.classList.contains(className)).toBe(true);
    }
    fireEvent.change(input, { target: { value: 'after' } });
    expect((input as HTMLInputElement).value).toBe('after');
  });
});

describe('Textarea', () => {
  it('forwards its ref, merges className, and includes the visual baseline', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} aria-label="Notes" rows={4} className="min-h-24" data-testid="notes" />);

    const textarea = screen.getByLabelText('Notes');
    expect(ref.current).toBe(textarea);
    expect(textarea.getAttribute('rows')).toBe('4');
    for (const className of ['[font:inherit]', 'min-h-[126px]', 'resize-y', 'rounded-2xl', 'border-myr-line', 'bg-myr-paper-bright', 'px-3.5', 'py-3', 'text-myr-ink', 'min-h-24']) {
      expect(textarea.classList.contains(className)).toBe(true);
    }
  });
});
