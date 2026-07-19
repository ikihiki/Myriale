import { useEffect, useMemo, useState } from 'react';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { useAppNavigation, type StoryKey } from '../../shared/nav';
import {
  fetchHomeDashboard,
  isHomeDashboardApiEnabled,
  type HomeDashboardDto,
  type HomeDashboardLoadState,
} from '../homeDashboardApi';
import { createDemoDb, useOptionalAppStore, type AppDb, type PlaySessionRecord, type ScenarioRecord } from '../store';

type HomeAccount = {
  name: string;
  email: string;
  initials: string;
  role: string;
};

type HomeScenario = ScenarioRecord & {
  visibilityLabel: string;
  updatedLabel: string;
  summary?: string;
};

type HomeSession = PlaySessionRecord & {
  scenarioTitle: string;
  stateLabel: string;
  turnLabel: string;
  resumeLabel: string;
  destination: StoryKey;
};

type HomeDashboardViewModel = {
  account: HomeAccount;
  activeSessionCount: number;
  publishedScenarioCount: number;
  resumableSessions: HomeSession[];
  recommendedScenarios: HomeScenario[];
};

const fallbackDb = createDemoDb('resumableSession');
const crumbs: Crumb[] = [{ label: 'Myriale' }, { label: 'ホーム' }];

export function HomePage() {
  const store = useOptionalAppStore();
  const navigate = useAppNavigation();
  const storeVm = useMemo(() => buildHomeDashboardViewModel(store?.db ?? fallbackDb), [store?.db]);
  const [apiDashboard, setApiDashboard] = useState<HomeDashboardDto | null>(null);
  const [loadState, setLoadState] = useState<HomeDashboardLoadState>({ status: 'idle', source: 'store' });

  useEffect(() => {
    if (!isHomeDashboardApiEnabled()) {
      setLoadState({ status: 'idle', source: 'store' });
      setApiDashboard(null);
      return;
    }

    const controller = new AbortController();
    setLoadState({ status: 'loading', source: 'api' });
    fetchHomeDashboard(controller.signal)
      .then((dashboard) => {
        setApiDashboard(dashboard);
        setLoadState({ status: 'loaded', source: 'api' });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setApiDashboard(null);
        setLoadState({
          status: 'error',
          source: 'store',
          message: error instanceof Error ? error.message : 'Home dashboard API could not be loaded.',
        });
      });

    return () => controller.abort();
  }, []);

  const vm = useMemo(
    () => (apiDashboard ? buildHomeDashboardViewModelFromApi(apiDashboard) : storeVm),
    [apiDashboard, storeVm],
  );

  const go = (to: StoryKey) => navigate?.(to);
  const startRecommendedScenario = (scenario: HomeScenario) => navigate?.('startSession', {
    query: {
      scenarioId: scenario.id,
      title: scenario.title,
      genre: scenario.genre,
      status: scenario.status,
      opening: scenario.opening ?? scenario.summary ?? `${scenario.title}の物語が始まる。`,
    },
  });

  return (
    <AppChrome section="home" breadcrumbs={crumbs} account={vm.account}>
      <main className="home-dashboard" aria-label="Myrialeトップページ">
        <section className="home-hero" aria-label="トップページの主要操作">
          <div className="home-hero-copy">
            <p className="kicker">Myriale top</p>
            <h1>物語の机を、今日の続きに整える。</h1>
            <p>
              中断したセッション、今すぐ遊べるシナリオ、書きかけの構想をひとつの入口に集約しました。
              読む、遊ぶ、作る。次の一手をここから始めます。
            </p>
            {loadState.status !== 'idle' && (
              <p className="home-data-source" data-testid="home-data-source">
                {loadState.status === 'loading' && 'APIからホーム情報を読み込んでいます。'}
                {loadState.status === 'loaded' && 'APIのホーム情報を表示しています。'}
                {loadState.status === 'error' && `APIに接続できないためデモ情報を表示しています。${loadState.message}`}
              </p>
            )}
            <div className="home-actions" aria-label="トップページの主要導線">
              <button className="primary" onClick={() => go('startSession')} data-testid="home-search-scenarios">
                シナリオを検索して開始
              </button>
              <button onClick={() => go('scenarioRegister')} data-testid="home-create-scenario">
                シナリオを新規作成
              </button>
            </div>
          </div>
          <aside className="home-quick-ledger" aria-label="現在の活動概要">
            <span>Desk ledger</span>
            <strong>{vm.resumableSessions.length}</strong>
            <small>再開できるセッション</small>
            <dl>
              <div>
                <dt>進行中</dt>
                <dd>{vm.activeSessionCount}</dd>
              </div>
              <div>
                <dt>公開シナリオ</dt>
                <dd>{vm.publishedScenarioCount}</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="home-panel home-sessions" aria-label="中断しているセッション">
          <div className="home-section-head">
            <div>
              <p className="kicker">Continue</p>
              <h2>中断しているセッション</h2>
            </div>
            <button type="button" className="text-button" onClick={() => go('resumeSession')}>
              すべて見る
            </button>
          </div>

          <div className="home-card-grid">
            {vm.resumableSessions.length > 0 ? (
              vm.resumableSessions.map((session) => (
                <article className="home-card session-card" key={session.id} data-testid={`home-session-${session.id}`}>
                  <span>{session.stateLabel} / {session.turnLabel}</span>
                  <h3>{session.scenarioTitle}</h3>
                  <p>{session.summary}</p>
                  <small>{session.hero}</small>
                  <div className="home-card-actions">
                    <button className="primary" onClick={() => go(session.destination)}>
                      {session.resumeLabel}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <article className="home-card empty-card">
                <span>Ready</span>
                <h3>再開待ちのセッションはありません</h3>
                <p>シナリオを選んで、新しい物語の準備を始められます。</p>
                <div className="home-card-actions">
                  <button className="primary" onClick={() => go('startSession')}>シナリオを探す</button>
                </div>
              </article>
            )}
          </div>
        </section>

        <section className="home-panel home-recommended" aria-label="おすすめのシナリオ">
          <div className="home-section-head">
            <div>
              <p className="kicker">Recommended</p>
              <h2>おすすめのシナリオ</h2>
            </div>
            <button type="button" className="text-button" onClick={() => go('startSession')}>
              検索画面へ
            </button>
          </div>

          <div className="home-card-grid recommended-grid">
            {vm.recommendedScenarios.map((scenario) => (
              <article className="home-card scenario-card" key={scenario.id} data-testid={`home-scenario-${scenario.id}`}>
                <span>{scenario.visibilityLabel} / {scenario.id}</span>
                <h3>{scenario.title}</h3>
                <p>{scenario.summary ?? scenario.genre}</p>
                <small>{scenario.updatedLabel}</small>
                <div className="home-card-actions">
                  <button className="primary" onClick={() => startRecommendedScenario(scenario)}>このシナリオで開始</button>
                  <button onClick={() => go('scenarioEdit')}>詳細を編集</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AppChrome>
  );
}

function buildHomeDashboardViewModel(db: AppDb): HomeDashboardViewModel {
  const scenarios = Object.values(db.scenarios);
  const sessions = Object.values(db.playSessions);
  const currentUser = db.auth.users.find((user) => user.id === db.auth.currentUserId) ?? db.auth.users[0];

  return {
    account: {
      name: currentUser?.name ?? 'Myriale user',
      email: currentUser?.email ?? 'reader@myriale.example',
      initials: currentUser?.name.slice(0, 2) ?? 'My',
      role: currentUser?.role ?? 'プレイヤー',
    },
    activeSessionCount: sessions.filter((session) => session.state === 'Active').length,
    publishedScenarioCount: scenarios.filter((scenario) => scenario.status === 'published').length,
    resumableSessions: sessions
      .filter((session) => session.state === 'Paused' || session.state === 'Active')
      .sort((a, b) => b.turn - a.turn)
      .slice(0, 3)
      .map((session) => toHomeSession(session, scenarios)),
    recommendedScenarios: scenarios
      .filter((scenario) => scenario.status !== 'draft')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 3)
      .map(toHomeScenario),
  };
}

function buildHomeDashboardViewModelFromApi(dashboard: HomeDashboardDto): HomeDashboardViewModel {
  return {
    account: {
      name: dashboard.account.displayName,
      email: dashboard.account.email,
      initials: dashboard.account.initials,
      role: dashboard.account.role,
    },
    activeSessionCount: dashboard.resumableSessions.filter((session) => session.state === 'Active').length,
    publishedScenarioCount: dashboard.recommendedScenarios.filter((scenario) => scenario.status === 'published').length,
    resumableSessions: dashboard.resumableSessions.map((session) => {
      const isPaused = session.state === 'Paused';
      return {
        id: session.id,
        scenarioId: session.scenarioId,
        state: normalizeSessionState(session.state),
        hero: session.heroName,
        turn: session.turn,
        summary: session.summary,
        scenarioTitle: session.scenarioTitle,
        stateLabel: isPaused ? '中断中' : '進行中',
        turnLabel: session.turnDisplay ?? `Turn ${session.turn}`,
        resumeLabel: isPaused ? '再開する' : 'プレイへ戻る',
        destination: isPaused ? 'resumeSession' : 'playSession',
      };
    }),
    recommendedScenarios: dashboard.recommendedScenarios.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      genre: scenario.genre,
      status: normalizeScenarioStatus(scenario.status),
      updatedAt: scenario.updatedAt,
      visibilityLabel: scenario.status === 'published' ? '公開中' : '自分用',
      updatedLabel: `更新: ${scenario.updatedAt}`,
      summary: scenario.summary,
    })),
  };
}

function toHomeSession(session: PlaySessionRecord, scenarios: ScenarioRecord[]): HomeSession {
  const scenarioTitle = scenarios.find((scenario) => scenario.id === session.scenarioId)?.title ?? '未登録シナリオ';
  const isPaused = session.state === 'Paused';
  return {
    ...session,
    scenarioTitle,
    stateLabel: isPaused ? '中断中' : '進行中',
    turnLabel: `Turn ${session.turn}`,
    resumeLabel: isPaused ? '再開する' : 'プレイへ戻る',
    destination: isPaused ? 'resumeSession' : 'playSession',
  };
}

function toHomeScenario(scenario: ScenarioRecord): HomeScenario {
  return {
    ...scenario,
    visibilityLabel: scenario.status === 'published' ? '公開中' : '自分用',
    updatedLabel: `更新: ${scenario.updatedAt}`,
  };
}

function normalizeSessionState(state: string): PlaySessionRecord['state'] {
  if (state === 'NotStarted' || state === 'Preparing' || state === 'Active' || state === 'Paused' || state === 'Completed') {
    return state;
  }
  return 'Paused';
}

function normalizeScenarioStatus(status: string): ScenarioRecord['status'] {
  if (status === 'draft' || status === 'published' || status === 'private') {
    return status;
  }
  return 'private';
}
