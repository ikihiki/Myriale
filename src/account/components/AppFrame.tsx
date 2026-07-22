import type { ReactNode } from 'react';
import { Button as SharedButton, navigationRecipe } from '../../components/ui';
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
    <div className={`grid min-h-screen gap-[18px] p-[18px] max-[1080px]:grid-cols-1 ${aside ? 'grid-cols-[248px_minmax(0,1fr)_minmax(260px,320px)]' : 'grid-cols-[248px_minmax(0,1fr)]'}`}>
      <aside
        className="sticky top-[18px] grid min-h-[calc(100vh-36px)] content-start gap-[18px] self-start rounded-[18px_8px_8px_18px] bg-[linear-gradient(180deg,#201b2d,#17151f)] p-[22px] text-myr-cream [&_.desk-brand_small]:text-[#c9bdd8] [&_.desk-brand_strong]:text-myr-cream max-[1080px]:min-h-0 max-[1080px]:rounded-myr-card"
        aria-label="アカウントナビゲーション"
      >
        <DeskBrand subtitle="Account" />
        <div className="flex items-center gap-3 border-y border-[rgba(244,238,223,.14)] py-3.5">
          <IdentitySeal state={user.state} initials={user.initials} size="sm" />
          <div className="min-w-0">
            <strong className="block text-sm">{user.name}</strong>
            <small className="block break-all text-myr-caption text-[#c9bdd8]">{user.email}</small>
          </div>
        </div>
        <nav className="grid gap-2.5" aria-label="アカウント画面切り替え">
          {nav.map((item) => {
            const isActive = active === item.id;
            return (
              <SharedButton
                key={item.id}
                className={navigationRecipe({ role: 'railItem', density: 'account', active: isActive })}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </SharedButton>
            );
          })}
        </nav>
        <Button variant="text" className="justify-self-start text-[var(--ember)]" onClick={onLogout}>ログアウト</Button>
      </aside>
      <main className="grid min-w-0 content-start gap-[18px] px-1.5 py-2">{children}</main>
      {aside && (
        <aside
          className="sticky top-[18px] grid content-start gap-3.5 self-start rounded-[8px_24px_24px_8px] border border-myr-line bg-[rgba(255,250,240,.9)] p-5 shadow-myr-surface [&_h2]:m-0 [&_h2]:font-[Georgia,serif] [&_h2]:text-xl max-[1080px]:static"
          aria-label="状態サマリー"
        >
          {aside}
        </aside>
      )}
    </div>
  );
}
