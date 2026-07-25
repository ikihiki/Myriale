import { useId, useState, type ReactNode } from 'react';
import { breadcrumbLinkClassName, Button, navigationRecipe } from '../components/ui';
import {
  MyrialeMenuContent,
  MyrialeMenuItem,
  MyrialeMenuRoot,
  MyrialeMenuTrigger,
} from '../ui/MyrialeRadix';
import { STORY_IDS, navigateToStory, useAppNavigation, type StoryKey } from './nav';

/**
 * AppChrome — the real product's global navigation.
 *
 * Instead of a page-level "flow" strip, every screen is wrapped in the same
 * application chrome a shipped app would have:
 *   - a top app bar with the brand, the primary sections, and an account menu;
 *   - a breadcrumb row showing where this screen sits in the hierarchy.
 * Each page keeps its own contextual left-rail for in-page navigation; this
 * is the global layer above it. Links jump to the canonical story for each
 * destination via Storybook's selectStory event (see ./nav).
 */

export type SectionId = 'home' | 'library' | 'sessions' | 'operations' | 'account';

type NavLink = { label: string; to: StoryKey; hint?: string };
type Section = { id: SectionId; label: string; to: StoryKey; links: NavLink[] };

const sections: Section[] = [
  {
    id: 'home',
    label: 'ホーム',
    to: 'home',
    links: [
      { label: 'トップページ', to: 'home', hint: '中断SessionとおすすめScenario' },
      { label: 'シナリオを検索', to: 'scenarioList', hint: '遊べるScenarioを探して開始' },
      { label: 'シナリオを新規作成', to: 'scenarioRegister', hint: '新しい契約書を書く' },
    ],
  },
  {
    id: 'library',
    label: 'ライブラリ',
    to: 'scenarioList',
    links: [
      { label: 'シナリオ一覧', to: 'scenarioList', hint: '遊べるScenarioを確認・編集' },
      { label: 'シナリオ登録', to: 'scenarioRegister', hint: 'ウィザードで新規シナリオ' },
    ],
  },
  {
    id: 'sessions',
    label: 'セッション',
    to: 'sessionList',
    links: [
      { label: 'セッション一覧', to: 'sessionList', hint: '進行中と完了済みの物語を見る' },
      { label: 'セッションを開始', to: 'scenarioList', hint: 'シナリオを選んで主人公決定' },
      { label: 'プレイ中の対話', to: 'playSession', hint: 'AIとの対話で物語を進める' },
      { label: 'プログラム主導の進行', to: 'programDriven', hint: 'バトル・判定・強制イベント' },
      { label: 'モード遷移と例外', to: 'modeTransition', hint: '切替・中断・復帰の共通基盤' },
      { label: 'ノート自動生成', to: 'sessionNotesAuto', hint: 'Lorebook更新通知と差分レビュー' },
      { label: 'Lorebook管理', to: 'sessionNotesLorebook', hint: '人物・場所・Canon辞書と要約' },
    ],
  },
  {
    id: 'operations',
    label: '運用',
    to: 'adminUsers',
    links: [
      { label: 'ユーザー管理', to: 'adminUsers', hint: '一覧・停止・サポート' },
      { label: 'AIキー管理', to: 'adminAiKeys', hint: '文章AI/挿絵AIの接続設定' },
      { label: '監査ログ', to: 'auditLog', hint: '重要操作の記録' },
    ],
  },
];

const accountLinks: NavLink[] = [
  { label: 'プロフィール', to: 'profile' },
  { label: 'セキュリティ', to: 'security' },
  { label: 'データ書き出し', to: 'exportData' },
  { label: '運用コンソール', to: 'adminUsers' },
  { label: 'AIキー管理', to: 'adminAiKeys' },
  { label: '退会', to: 'withdraw' },
];

const focusRingClassName = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-myr-iris focus-visible:rounded-md';
const accountTriggerClassName = `inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-[rgba(255,246,231,.18)] bg-[rgba(255,246,231,.06)] py-1.25 pr-2.5 pl-1.5 text-myr-cream transition-[background] duration-150 ease-[ease] hover:bg-[rgba(255,246,231,.14)] motion-reduce:transition-none ${focusRingClassName}`;
const activeAccountTriggerClassName = `inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-myr-ember bg-[rgba(255,246,231,.06)] py-1.25 pr-2.5 pl-1.5 text-myr-cream transition-[background] duration-150 ease-[ease] hover:bg-[rgba(255,246,231,.14)] motion-reduce:transition-none ${focusRingClassName}`;
const caretClassName = 'text-myr-caption opacity-70';

export type Crumb = { label: string; to?: StoryKey };

export type AppChromeProps = {
  /** Highlighted top-level section for the current screen. */
  section: SectionId;
  /** Breadcrumb trail from app root to the current screen. */
  breadcrumbs: Crumb[];
  /**
   * Auth state. When signed out, the account menu collapses to ログイン/新規登録
   * actions instead of an avatar menu.
   */
  account?: { name: string; email: string; initials: string; role?: string } | null;
  /** App-level navigation override. Defaults to Storybook story navigation. */
  onNavigate?: (to: StoryKey) => void;
  /** Optional logout handler; defaults to navigating to the login screen. */
  onLogout?: () => void | Promise<void>;
  /** The screen content this chrome wraps. */
  children: ReactNode;
};

export function AppChrome({ section, breadcrumbs, account = null, onNavigate, onLogout, children }: AppChromeProps) {
  const appNavigate = useAppNavigation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuId = useId();

  const go = (to: StoryKey) => {
    setIsMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(to);
      return;
    }
    if (appNavigate) {
      appNavigate(to);
      return;
    }
    navigateToStory(STORY_IDS[to]);
  };

  return (
    <div className="min-h-screen [&_*]:box-border">
      <div className="sticky top-0 z-50 border-b border-[rgba(255,246,231,.14)] bg-[linear-gradient(120deg,rgba(18,16,25,.97),rgba(38,31,54,.97))] font-myr-body text-myr-cream shadow-[0_10px_30px_rgba(18,16,25,.28)] backdrop-blur-md">
        <div className="mx-auto flex max-w-myr-chrome items-center gap-4 px-5 py-2.5 max-myr-chrome:flex-wrap max-myr-chrome:gap-x-3 max-myr-chrome:gap-y-2 max-md:flex-nowrap">
          <Button
            type="button"
            className={`inline-flex cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-transparent py-1 pr-2 pl-1 text-myr-cream hover:bg-[rgba(255,246,231,.08)] ${focusRingClassName}`}
            aria-label="Myriale ホームへ"
            onClick={() => go('home')}
          >
            <span
              className="grid size-9 place-items-center rounded-full border border-[rgba(255,255,255,.28)] bg-[conic-gradient(from_180deg,var(--myr-color-iris),var(--myr-color-ember),var(--myr-color-mist),var(--myr-color-iris))] font-['Shippori_Mincho',Georgia,serif] text-lg font-black text-[#17121d]"
              aria-hidden="true"
            >
              霧
            </span>
            <span className="font-myr-display text-xl tracking-[.02em] max-myr-chrome:hidden">Myriale</span>
          </Button>

          <Button
            type="button"
            className={`ml-auto hidden size-11 cursor-pointer place-items-center rounded-xl border border-[rgba(255,246,231,.18)] bg-[rgba(255,246,231,.06)] p-0 text-myr-cream hover:bg-[rgba(255,246,231,.14)] max-md:grid ${focusRingClassName}`}
            aria-label={isMobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
            aria-expanded={isMobileMenuOpen}
            aria-controls={mobileMenuId}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            <span className="grid w-5 gap-1.25" aria-hidden="true">
              <span className={`h-0.5 rounded-full bg-current transition-transform motion-reduce:transition-none ${isMobileMenuOpen ? 'translate-y-1.75 rotate-45' : ''}`} />
              <span className={`h-0.5 rounded-full bg-current transition-opacity motion-reduce:transition-none ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 rounded-full bg-current transition-transform motion-reduce:transition-none ${isMobileMenuOpen ? '-translate-y-1.75 -rotate-45' : ''}`} />
            </span>
          </Button>

          <nav className="ml-2 flex gap-1 max-md:hidden" aria-label="主要セクション">
            {sections.map((item) => {
              const isActive = section === item.id;
              return (
                <MyrialeMenuRoot key={item.id} modal={false}>
                  <div className="relative">
                    <MyrialeMenuTrigger asChild>
                      <Button
                        type="button"
                        className={navigationRecipe({ role: 'appChromeItem', active: isActive })}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {item.label}
                        <span className={caretClassName} aria-hidden="true">⌄</span>
                      </Button>
                    </MyrialeMenuTrigger>
                    <MyrialeMenuContent className="!min-w-57.5" align="start" aria-label={`${item.label}メニュー`}>
                      {item.links.map((link) => (
                        <MyrialeMenuItem key={link.to} className={navigationRecipe({ role: 'menuItem' })} onSelect={() => go(link.to)}>
                          <span className="text-sm font-bold">{link.label}</span>
                          {link.hint && <small className="text-xs text-myr-ink-subtle">{link.hint}</small>}
                        </MyrialeMenuItem>
                      ))}
                    </MyrialeMenuContent>
                  </div>
                </MyrialeMenuRoot>
              );
            })}
          </nav>

          <div className="relative ml-auto max-md:hidden">
            {account ? (
              <MyrialeMenuRoot modal={false}>
                <MyrialeMenuTrigger asChild>
                  <Button
                    type="button"
                    className={section === 'account' ? activeAccountTriggerClassName : accountTriggerClassName}
                    aria-label={`アカウントメニュー: ${account.name}`}
                  >
                    <span
                      className="grid size-8 place-items-center rounded-full bg-[conic-gradient(from_180deg,var(--myr-color-iris),var(--myr-color-ember),var(--myr-color-mist),var(--myr-color-iris))] font-[Georgia,serif] text-myr-ui-sm font-extrabold text-[#17121d]"
                      aria-hidden="true"
                    >
                      {account.initials}
                    </span>
                    <span className="grid text-left leading-[1.15] max-myr-chrome:hidden">
                      <strong className="text-myr-ui-sm">{account.name}</strong>
                      <small className="text-myr-caption text-[rgba(255,246,231,.6)]">{account.role ?? account.email}</small>
                    </span>
                    <span className={caretClassName} aria-hidden="true">⌄</span>
                  </Button>
                </MyrialeMenuTrigger>
                <MyrialeMenuContent className="!min-w-62.5" aria-label="アカウントメニュー">
                  <div className="mb-1.5 border-b border-[rgba(36,27,47,.12)] px-3 pt-2 pb-2.5">
                    <strong className="block text-sm">{account.name}</strong>
                    <small className="break-all text-xs text-myr-ink-subtle">{account.email}</small>
                  </div>
                  {accountLinks.map((link) => (
                    <MyrialeMenuItem key={link.to} className={navigationRecipe({ role: 'menuItem' })} onSelect={() => go(link.to)}>
                      <span className="text-sm font-bold">{link.label}</span>
                    </MyrialeMenuItem>
                  ))}
                  <MyrialeMenuItem
                    className={navigationRecipe({ role: 'menuItem', danger: true })}
                    onSelect={() => { void (onLogout ? onLogout() : go('login')); }}
                  >
                    <span className="text-sm font-bold">ログアウト</span>
                  </MyrialeMenuItem>
                </MyrialeMenuContent>
              </MyrialeMenuRoot>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  className={`cursor-pointer rounded-full border-0 bg-transparent px-3 py-2 font-bold text-myr-cream hover:bg-[rgba(255,246,231,.1)] ${focusRingClassName}`}
                  onClick={() => go('login')}
                >
                  ログイン
                </Button>
                <Button
                  type="button"
                  className={`cursor-pointer rounded-full border border-myr-ember bg-myr-paper px-4 py-2 font-extrabold text-myr-void hover:bg-white ${focusRingClassName}`}
                  onClick={() => go('register')}
                >
                  新規登録
                </Button>
              </div>
            )}
          </div>
        </div>

        {isMobileMenuOpen && (
          <div
            id={mobileMenuId}
            className="hidden border-t border-[rgba(255,246,231,.12)] bg-[rgba(18,16,25,.96)] px-4 py-4 shadow-[0_18px_35px_rgba(18,16,25,.32)] max-md:block"
            onKeyDown={(event) => {
              if (event.key === 'Escape') setIsMobileMenuOpen(false);
            }}
          >
            <nav className="mx-auto grid max-h-[calc(100vh-8rem)] max-w-myr-chrome gap-4 overflow-y-auto pr-1" aria-label="モバイルメニュー">
              <div className="grid gap-2">
                {sections.map((item) => {
                  const isActive = section === item.id;
                  return (
                    <section
                      key={item.id}
                      className={`overflow-hidden rounded-2xl border ${isActive ? 'border-[rgba(234,91,68,.72)] bg-[rgba(234,91,68,.08)]' : 'border-[rgba(255,246,231,.12)] bg-[rgba(255,246,231,.04)]'}`}
                      aria-labelledby={`${mobileMenuId}-${item.id}`}
                    >
                      <Button
                        id={`${mobileMenuId}-${item.id}`}
                        type="button"
                        className={`flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-4 py-3 text-left font-extrabold text-myr-cream hover:bg-[rgba(255,246,231,.08)] ${focusRingClassName}`}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => go(item.to)}
                      >
                        <span>{item.label}</span>
                        <span className="text-myr-caption text-[rgba(255,246,231,.52)]" aria-hidden="true">→</span>
                      </Button>
                      <div className="grid border-t border-[rgba(255,246,231,.1)] py-1">
                        {item.links.map((link) => (
                          <Button
                            key={`${item.id}-${link.to}-${link.label}`}
                            type="button"
                            className={`grid cursor-pointer gap-0.5 border-0 bg-transparent px-4 py-2.5 text-left text-myr-cream hover:bg-[rgba(255,246,231,.08)] ${focusRingClassName}`}
                            onClick={() => go(link.to)}
                          >
                            <span className="text-sm font-bold">{link.label}</span>
                            {link.hint && <small className="text-xs leading-5 text-[rgba(255,246,231,.56)]">{link.hint}</small>}
                          </Button>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>

              <section className="rounded-2xl border border-[rgba(255,246,231,.12)] bg-[rgba(255,246,231,.04)] p-3" aria-label="アカウント">
                {account ? (
                  <>
                    <div className="flex items-center gap-3 border-b border-[rgba(255,246,231,.1)] px-1 pb-3">
                      <span
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-[conic-gradient(from_180deg,var(--myr-color-iris),var(--myr-color-ember),var(--myr-color-mist),var(--myr-color-iris))] font-[Georgia,serif] text-myr-ui-sm font-extrabold text-[#17121d]"
                        aria-hidden="true"
                      >
                        {account.initials}
                      </span>
                      <span className="min-w-0 leading-tight">
                        <strong className="block text-sm">{account.name}</strong>
                        <small className="block truncate text-xs text-[rgba(255,246,231,.56)]">{account.role ?? account.email}</small>
                      </span>
                    </div>
                    <div className="grid pt-1">
                      {accountLinks.map((link) => (
                        <Button
                          key={`mobile-account-${link.to}`}
                          type="button"
                          className={`cursor-pointer rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-sm font-bold text-myr-cream hover:bg-[rgba(255,246,231,.08)] ${focusRingClassName}`}
                          onClick={() => go(link.to)}
                        >
                          {link.label}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        className={`mt-1 cursor-pointer rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-sm font-bold text-[#ff9b8a] hover:bg-[rgba(234,91,68,.12)] ${focusRingClassName}`}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          void (onLogout ? onLogout() : go('login'));
                        }}
                      >
                        ログアウト
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      className={`cursor-pointer rounded-xl border border-[rgba(255,246,231,.18)] bg-transparent px-3 py-2.5 font-bold text-myr-cream hover:bg-[rgba(255,246,231,.08)] ${focusRingClassName}`}
                      onClick={() => go('login')}
                    >
                      ログイン
                    </Button>
                    <Button
                      type="button"
                      className={`cursor-pointer rounded-xl border border-myr-ember bg-myr-paper px-3 py-2.5 font-extrabold text-myr-void hover:bg-white ${focusRingClassName}`}
                      onClick={() => go('register')}
                    >
                      新規登録
                    </Button>
                  </div>
                )}
              </section>
            </nav>
          </div>
        )}

        <nav className="border-t border-[rgba(255,246,231,.1)] bg-[rgba(18,16,25,.35)]" aria-label="現在地">
          <ol className="mx-auto flex max-w-myr-chrome list-none flex-wrap items-center gap-2 px-5 py-2 text-xs">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li className="inline-flex items-center gap-2" key={`${crumb.label}-${index}`}>
                  {isLast || !crumb.to ? (
                    <span className={navigationRecipe({ role: 'breadcrumb', current: isLast })} aria-current={isLast ? 'page' : undefined}>
                      {crumb.label}
                    </span>
                  ) : (
                    <Button
                      type="button"
                      className={`${navigationRecipe({ role: 'breadcrumb' })} ${breadcrumbLinkClassName}`}
                      onClick={() => go(crumb.to as StoryKey)}
                    >
                      {crumb.label}
                    </Button>
                  )}
                  {!isLast && <span className="text-[rgba(255,246,231,.3)]" aria-hidden="true">/</span>}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="min-h-[calc(100vh-96px)]">{children}</div>
    </div>
  );
}
