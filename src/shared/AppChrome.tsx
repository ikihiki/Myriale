import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { STORY_IDS, navigateToStory, useAppNavigation, type StoryKey } from './nav';
import './appChrome.css';

/**
 * AppChrome — the real product's global navigation.
 *
 * Instead of a wireframe-style "flow" strip, every screen is wrapped in the same
 * application chrome a shipped app would have:
 *   - a top app bar with the brand, the primary sections, and an account menu;
 *   - a breadcrumb row showing where this screen sits in the hierarchy.
 * Each wireframe keeps its own contextual left-rail for in-page navigation; this
 * is the global layer above it. Links jump to the canonical story for each
 * destination via Storybook's selectStory event (see ./nav).
 */

export type SectionId = 'library' | 'sessions' | 'operations' | 'account';

type NavLink = { label: string; to: StoryKey; hint?: string };
type Section = { id: SectionId; label: string; to: StoryKey; links: NavLink[] };

const sections: Section[] = [
  {
    id: 'library',
    label: 'ライブラリ',
    to: 'scenarioRegister',
    links: [
      { label: 'シナリオを登録', to: 'scenarioRegister', hint: 'ウィザードで新規シナリオ' },
      { label: 'シナリオを編集', to: 'scenarioEdit', hint: '既存シナリオを改善・公開' },
      { label: '高度なシナリオ実行', to: 'advancedScenario', hint: '候補・条件・非公開情報でAI進行を制御' },
    ],
  },
  {
    id: 'sessions',
    label: 'セッション',
    to: 'startSession',
    links: [
      { label: 'セッションを開始', to: 'startSession', hint: 'シナリオを選んで主人公決定' },
      { label: 'プレイ中の対話', to: 'playSession', hint: 'AIとの対話で物語を進める' },
      { label: 'セッションを再開', to: 'resumeSession', hint: '中断した続きから再開' },
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
      { label: '監査ログ', to: 'auditLog', hint: '重要操作の記録' },
    ],
  },
];

const accountLinks: NavLink[] = [
  { label: 'プロフィール', to: 'profile' },
  { label: 'セキュリティ', to: 'security' },
  { label: 'データ書き出し', to: 'exportData' },
  { label: '運用コンソール', to: 'adminUsers' },
  { label: '退会', to: 'withdraw' },
];

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
  /** The screen content this chrome wraps. */
  children: ReactNode;
};

export function AppChrome({ section, breadcrumbs, account = null, onNavigate, children }: AppChromeProps) {
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const appNavigate = useAppNavigation();

  // Close any open menu on outside click or Escape.
  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        setOpenSection(null);
        setAccountOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenSection(null);
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const go = (to: StoryKey) => {
    setOpenSection(null);
    setAccountOpen(false);
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
    <div className="app-chrome">
      <div className="app-bar" ref={barRef}>
        <div className="app-bar-inner">
          <button
            type="button"
            className="app-brand"
            aria-label="Myriale ホームへ"
            onClick={() => go('scenarioRegister')}
          >
            <span className="app-brand-sigil" aria-hidden="true">霧</span>
            <span className="app-brand-name">Myriale</span>
          </button>

          <nav className="app-sections" aria-label="主要セクション">
            {sections.map((item) => {
              const expanded = openSection === item.id;
              return (
                <div className="app-section" key={item.id}>
                  <button
                    type="button"
                    className={`app-section-button ${section === item.id ? 'active' : ''}`.trim()}
                    aria-haspopup="true"
                    aria-expanded={expanded}
                    aria-current={section === item.id ? 'page' : undefined}
                    onClick={() => setOpenSection(expanded ? null : item.id)}
                  >
                    {item.label}
                    <span className="caret" aria-hidden="true">⌄</span>
                  </button>
                  {expanded && (
                    <div className="app-menu" role="menu" aria-label={`${item.label}メニュー`}>
                      {item.links.map((link) => (
                        <button
                          key={link.to}
                          type="button"
                          role="menuitem"
                          className="app-menu-item"
                          onClick={() => go(link.to)}
                        >
                          <span className="app-menu-label">{link.label}</span>
                          {link.hint && <small className="app-menu-hint">{link.hint}</small>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="app-account">
            {account ? (
              <>
                <button
                  type="button"
                  className={`account-trigger ${section === 'account' ? 'active' : ''}`.trim()}
                  aria-haspopup="true"
                  aria-expanded={accountOpen}
                  aria-controls={menuId}
                  aria-label={`アカウントメニュー: ${account.name}`}
                  onClick={() => setAccountOpen((current) => !current)}
                >
                  <span className="account-avatar" aria-hidden="true">{account.initials}</span>
                  <span className="account-meta">
                    <strong>{account.name}</strong>
                    <small>{account.role ?? account.email}</small>
                  </span>
                  <span className="caret" aria-hidden="true">⌄</span>
                </button>
                {accountOpen && (
                  <div className="app-menu account-menu" id={menuId} role="menu" aria-label="アカウントメニュー">
                    <div className="account-menu-head">
                      <strong>{account.name}</strong>
                      <small>{account.email}</small>
                    </div>
                    {accountLinks.map((link) => (
                      <button
                        key={link.to}
                        type="button"
                        role="menuitem"
                        className="app-menu-item"
                        onClick={() => go(link.to)}
                      >
                        <span className="app-menu-label">{link.label}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      className="app-menu-item logout"
                      onClick={() => go('login')}
                    >
                      <span className="app-menu-label">ログアウト</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="account-signed-out">
                <button type="button" className="signin-link" onClick={() => go('login')}>
                  ログイン
                </button>
                <button type="button" className="signin-cta" onClick={() => go('register')}>
                  新規登録
                </button>
              </div>
            )}
          </div>
        </div>

        <nav className="app-breadcrumb" aria-label="現在地">
          <ol>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={`${crumb.label}-${index}`}>
                  {isLast || !crumb.to ? (
                    <span aria-current={isLast ? 'page' : undefined}>{crumb.label}</span>
                  ) : (
                    <button type="button" className="crumb-link" onClick={() => go(crumb.to as StoryKey)}>
                      {crumb.label}
                    </button>
                  )}
                  {!isLast && <span className="crumb-sep" aria-hidden="true">/</span>}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="app-canvas">{children}</div>
    </div>
  );
}
