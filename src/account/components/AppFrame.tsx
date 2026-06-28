import type { ReactNode } from 'react';
import type { AccountState, NavItem } from '../types';
import { Button } from './Button';
import { DeskBrand } from './DeskBrand';
import { IdentitySeal } from './IdentitySeal';

export function AppFrame({
  nav,
  active,
  onNavigate,
  onLogout,
  user,
  children,
  aside,
}: {
  nav: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
  user: { name: string; email: string; state: AccountState; initials: string };
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className={`account-frame ${aside ? 'has-aside' : ''}`.trim()}>
      <aside className="account-rail" aria-label="アカウントナビゲーション">
        <DeskBrand subtitle="Account" />
        <div className="rail-identity">
          <IdentitySeal state={user.state} initials={user.initials} size="sm" />
          <div><strong>{user.name}</strong><small>{user.email}</small></div>
        </div>
        <nav className="account-nav" aria-label="アカウント画面切り替え">
          {nav.map((item) => (
            <button key={item.id} className={active === item.id ? 'active' : ''} aria-current={active === item.id ? 'page' : undefined} onClick={() => onNavigate(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <Button variant="text" className="rail-logout" onClick={onLogout}>ログアウト</Button>
      </aside>
      <main className="account-main">{children}</main>
      {aside && <aside className="account-aside" aria-label="状態サマリー">{aside}</aside>}
    </div>
  );
}
