import { describe, expect, it } from 'vitest';
import { navigationRecipe } from './navigationRecipes';

function expectClasses(value: string, ...classNames: string[]) {
  classNames.forEach((className) => expect(value).toContain(className));
}

describe('navigationRecipe', () => {
  it('expresses active and inactive app chrome states without changing item geometry', () => {
    const inactive = navigationRecipe({ role: 'appChromeItem' });
    const active = navigationRecipe({ role: 'appChromeItem', active: true });

    expectClasses(inactive, 'rounded-full', 'border-transparent', 'text-[rgba(255,246,231,.86)]');
    expectClasses(active, 'rounded-full', 'border-myr-ember', 'bg-myr-paper', 'text-myr-void');
  });

  it('keeps menu geometry while switching the danger tone', () => {
    const standard = navigationRecipe({ role: 'menuItem' });
    const danger = navigationRecipe({ role: 'menuItem', danger: true });

    expectClasses(standard, '!grid', '!rounded-myr-control', 'data-[highlighted]:!bg-[rgba(124,92,255,.1)]');
    expectClasses(danger, '!grid', '!border-t', '!text-[#b8453f]', 'data-[highlighted]:!bg-[rgba(184,69,63,.1)]');
  });

  it('marks the current breadcrumb independently from its interaction wrapper', () => {
    expect(navigationRecipe({ role: 'breadcrumb' })).toBe('text-[rgba(255,246,231,.62)]');
    expect(navigationRecipe({ role: 'breadcrumb', current: true })).toBe('font-bold text-myr-cream');
  });

  it('shares rail semantics while preserving wizard and account densities', () => {
    const wizard = navigationRecipe({ role: 'railItem', density: 'wizard', active: true });
    const account = navigationRecipe({ role: 'railItem', density: 'account', active: true });

    expectClasses(wizard, 'w-full', 'text-left', 'px-2.25', 'shadow-[inset_3px_0_0_#d9a441]');
    expectClasses(account, 'w-full', 'text-left', 'px-3.5', 'border-[var(--ember)]', 'bg-myr-paper');
    expect(wizard).not.toContain('px-3.5');
    expect(account).not.toContain('px-2.25');
  });

  it('styles a Radix tab through its generated data-state', () => {
    expectClasses(
      navigationRecipe({ role: 'tabItem' }),
      'data-[state=active]:bg-[var(--myr-ui-ink)]',
      'data-[state=active]:text-white',
      'focus-visible:outline-myr-iris',
    );
  });
});
