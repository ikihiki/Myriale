import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AppChrome } from '../shared/AppChrome';

afterEach(() => cleanup());

const crumbs = [
  { label: 'Myriale' as const, to: 'scenarioRegister' as const },
  { label: 'ライブラリ' as const, to: 'scenarioRegister' as const },
  { label: 'シナリオを登録' as const },
];

describe('AppChrome — global app navigation', () => {
  it('renders the primary sections and marks the active one', () => {
    render(
      <AppChrome section="library" breadcrumbs={crumbs} account={{ name: '霧野しおり', email: 'a@b.c', initials: '霧野' }}>
        <div>screen</div>
      </AppChrome>,
    );
    const nav = screen.getByRole('navigation', { name: '主要セクション' });
    expect(within(nav).getByRole('button', { name: /ライブラリ/ })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: /セッション/ })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /運用/ })).toBeInTheDocument();
  });

  it('opens a section dropdown to reveal its pages', () => {
    render(
      <AppChrome section="library" breadcrumbs={crumbs} account={{ name: '霧野しおり', email: 'a@b.c', initials: '霧野' }}>
        <div>screen</div>
      </AppChrome>,
    );
    const sections = screen.getByRole('navigation', { name: '主要セクション' });
    fireEvent.pointerDown(within(sections).getByRole('button', { name: /運用/ }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /ユーザー管理/ })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: /監査ログ/ })).toBeInTheDocument();
  });

  it('shows an account menu when signed in and login/register when signed out', () => {
    const { rerender } = render(
      <AppChrome section="account" breadcrumbs={crumbs} account={{ name: '霧野しおり', email: 'a@b.c', initials: '霧野' }}>
        <div>screen</div>
      </AppChrome>,
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: /アカウントメニュー: 霧野しおり/ }));
    expect(screen.getByRole('menuitem', { name: 'プロフィール' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'ログアウト' })).toBeInTheDocument();

    rerender(
      <AppChrome section="account" breadcrumbs={crumbs} account={null}>
        <div>screen</div>
      </AppChrome>,
    );
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '新規登録' })).toBeInTheDocument();
  });

  it('renders the breadcrumb trail with the current page last', () => {
    render(
      <AppChrome section="library" breadcrumbs={crumbs} account={null}>
        <div>screen</div>
      </AppChrome>,
    );
    const breadcrumb = screen.getByRole('navigation', { name: '現在地' });
    expect(within(breadcrumb).getByText('シナリオを登録')).toHaveAttribute('aria-current', 'page');
    // Intermediate crumbs are links.
    expect(within(breadcrumb).getByRole('button', { name: 'Myriale' })).toBeInTheDocument();
  });
});
