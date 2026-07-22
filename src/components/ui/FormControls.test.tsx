import { createRef, useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Field, Input, Textarea } from '.';

function expectClasses(element: Element, classNames: string[]) {
  for (const className of classNames) expect(element.classList.contains(className)).toBe(true);
}

afterEach(cleanup);

describe('Input', () => {
  it('forwards its ref and standard native, ARIA, and data props without forwarding variant', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} variant="underline" type="password" name="secret" autoComplete="current-password" aria-label="Secret" data-state="ready" />);

    const input = screen.getByLabelText('Secret');
    expect(ref.current).toBe(input);
    expect(input.getAttribute('type')).toBe('password');
    expect(input.getAttribute('name')).toBe('secret');
    expect(input.getAttribute('autocomplete')).toBe('current-password');
    expect(input.getAttribute('data-state')).toBe('ready');
    expect(input.hasAttribute('variant')).toBe(false);
    expectClasses(input, ['rounded-none', 'border-b-2', 'border-myr-ink/20', 'bg-white/45', 'px-3', 'py-2.5', 'shadow-none']);
  });

  it('defaults to field, merges className, and supports controlled changes', () => {
    function ControlledInput() {
      const [value, setValue] = useState('before');
      return <Input aria-label="Controlled input" className="custom-control" value={value} onChange={(event) => setValue(event.target.value)} />;
    }

    render(<ControlledInput />);
    const input = screen.getByLabelText('Controlled input');
    expectClasses(input, ['w-full', 'rounded-2xl', 'border-myr-line', 'bg-myr-paper-bright', 'px-3.5', 'py-3', 'custom-control']);
    fireEvent.change(input, { target: { value: 'after' } });
    expect((input as HTMLInputElement).value).toBe('after');
  });

  it('exposes compact, borderless, and common state recipes', () => {
    render(
      <>
        <Input aria-label="Compact" variant="compact" />
        <Input aria-label="Borderless" variant="borderless" />
        <Input aria-label="Invalid" aria-invalid="true" />
        <Input aria-label="Readonly" readOnly />
        <Input aria-label="Disabled" disabled />
      </>,
    );

    expectClasses(screen.getByLabelText('Compact'), ['min-h-[30px]', 'px-2', 'py-1.5', 'text-myr-ui-sm']);
    expectClasses(screen.getByLabelText('Borderless'), ['rounded-none', 'border-0', 'bg-transparent', 'shadow-none']);
    expectClasses(screen.getByLabelText('Invalid'), ['aria-invalid:border-myr-ruby', 'aria-invalid:bg-[#fff7f5]']);
    expectClasses(screen.getByLabelText('Readonly'), ['read-only:bg-myr-vellum/35', 'read-only:text-myr-slate']);
    expectClasses(screen.getByLabelText('Disabled'), ['disabled:cursor-not-allowed', 'disabled:opacity-60']);
  });
});

describe('Textarea', () => {
  it('forwards its ref, native props, and caller className', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} aria-label="Notes" rows={4} className="min-h-24" data-testid="notes" />);

    const textarea = screen.getByLabelText('Notes');
    expect(ref.current).toBe(textarea);
    expect(textarea.getAttribute('rows')).toBe('4');
    expectClasses(textarea, ['[font:inherit]', 'min-h-[126px]', 'resize-y', 'rounded-2xl', 'border-myr-line', 'bg-myr-paper-bright', 'px-3.5', 'py-3', 'text-myr-ink', 'min-h-24']);
  });

  it('uses the textarea-specific composer recipe', () => {
    render(<Textarea variant="composer" aria-label="Composer" />);

    const textarea = screen.getByLabelText('Composer');
    expect(textarea.hasAttribute('variant')).toBe(false);
    expectClasses(textarea, ['block', 'min-h-[76px]', 'max-h-[220px]', 'rounded-none', 'border-0', 'bg-transparent', 'px-[19px]', 'pt-[17px]', 'pb-2', 'text-[15px]', 'leading-[1.6]']);
  });
});

describe('Field', () => {
  it('associates label, help, required, and error roles with stable IDs', () => {
    const { rerender } = render(
      <Field label="名前" htmlFor="account-name" required help="公開名です">
        <Input id="account-name" aria-describedby="account-name-help" />
      </Field>,
    );

    expect(screen.getByLabelText(/^名前/).getAttribute('aria-describedby')).toBe('account-name-help');
    expect(screen.getByText('公開名です').getAttribute('id')).toBe('account-name-help');

    rerender(
      <Field label="名前" htmlFor="account-name" required help="公開名です" error="入力してください">
        <Input id="account-name" aria-invalid="true" aria-describedby="account-name-error" />
      </Field>,
    );

    expect(screen.queryByText('公開名です')).toBe(null);
    expect(screen.getByRole('alert').getAttribute('id')).toBe('account-name-error');
  });
});
