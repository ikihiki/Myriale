import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { useAppNavigation, type StoryKey } from '../../shared/nav';
import {
  fetchHomeDashboard,
  isHomeDashboardApiEnabled,
  type HomeDashboardDto,
  type HomeDashboardLoadState,
} from '../../app/homeDashboardApi';
import { createDemoDb, useOptionalAppStore, type AppDb, type PlaySessionRecord, type ScenarioRecord } from '../../app/store';
import './homePage.css';

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

const homeButtonMotionClassName = 'transition-[transform,box-shadow,background] duration-[160ms] ease-[ease] hover:-translate-y-px hover:shadow-[0_10px_24px_rgba(18,16,25,.16)] motion-reduce:transition-none motion-reduce:hover:translate-y-0';
const homeDarkButtonClassName = `border border-[rgba(36,27,47,.14)] rounded-full bg-[rgba(36,27,47,.92)] px-4 py-myr-control-y text-myr-paper ${homeButtonMotionClassName}`;
const homePrimaryButtonClassName = `border border-[rgba(36,27,47,.14)] rounded-full bg-myr-gold px-4 py-myr-control-y font-black text-[#1d1725] ${homeButtonMotionClassName}`;
const homeTextButtonClassName = `mt-[10px] border border-[rgba(36,27,47,.14)] rounded-full bg-transparent px-4 py-myr-control-y font-black text-[#6f4fd8] shadow-none ${homeButtonMotionClassName}`;

const homePanelClassName = 'grid gap-[18px] rounded-myr-shell border border-[rgba(220,231,242,.54)] bg-[radial-gradient(circle_at_10%_0%,rgba(124,92,255,.10),transparent_30%),linear-gradient(135deg,rgba(255,250,240,.97),rgba(255,248,232,.90))] p-[clamp(18px,3vw,26px)] shadow-[0_24px_80px_rgba(18,16,25,.18)] max-[720px]:rounded-[20px] max-[720px]:p-[18px]';
const homeSectionHeadClassName = 'flex flex-wrap items-center justify-between gap-[14px]';
const homeCardClassName = 'home-card relative grid min-h-[230px] content-start gap-[10px] overflow-hidden rounded-myr-panel border border-[rgba(36,27,47,.12)] bg-[rgba(255,254,249,.82)] p-myr-card-inset';
const homeCardLabelClassName = 'text-myr-caption font-black tracking-[.08em] text-[#6f4fd8] uppercase';
const homeCardTitleClassName = "m-0 font-['Yu_Mincho','Hiragino_Mincho_ProN',Georgia,serif] text-[25px] leading-[1.08] tracking-myr-display";
const homeCardCopyClassName = 'm-0 leading-[1.58] text-myr-slate';
const homeCardMetaClassName = 'leading-[1.45] text-myr-ink-subtle';
const homeCardActionsClassName = 'mt-2 flex flex-wrap items-center gap-[10px] self-end max-[720px]:[&>button]:w-full';

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
        dashboard.recommendedScenarios.forEach((scenario) => {
          store?.dispatch({
            type: 'SCENARIO_SAVED',
            scenario: {
              id: scenario.id,
              title: scenario.title,
              status: normalizeScenarioStatus(scenario.status),
              genre: scenario.genre,
              updatedAt: scenario.updatedAt,
              summary: scenario.summary,
              heroMode: scenario.heroMode,
              heroFreeGenerationAllowed: scenario.heroFreeGenerationAllowed,
              hero: scenario.hero,
            },
          });
        });
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
    query: { scenarioId: scenario.id },
  });

  return (
    <AppChrome section="home" breadcrumbs={crumbs} account={vm.account}>
      <main className="grid gap-[18px] p-[18px] text-[#241b2f] max-[720px]:p-[10px]" aria-label="Myrialeトップページ">
        <section
          className="home-hero relative grid min-h-[340px] grid-cols-[minmax(0,1fr)_minmax(220px,320px)] items-stretch gap-[clamp(18px,5vw,52px)] overflow-hidden rounded-[32px] border border-[rgba(220,231,242,.54)] bg-[linear-gradient(90deg,rgba(25,20,33,.80)_1px,transparent_1px)_0_0/46px_46px,linear-gradient(0deg,rgba(25,20,33,.08)_1px,transparent_1px)_0_0/46px_46px,radial-gradient(circle_at_78%_20%,rgba(124,92,255,.30),transparent_28%),radial-gradient(circle_at_15%_12%,rgba(217,164,65,.20),transparent_30%),linear-gradient(135deg,#fffaf0_0%,#efe3c6_48%,#dce7f2_100%)] p-[clamp(26px,5vw,58px)] shadow-[0_24px_80px_rgba(18,16,25,.18)] max-[820px]:grid-cols-1 max-[720px]:rounded-[20px] max-[720px]:p-[18px]"
          aria-label="トップページの主要操作"
        >
          <div className="relative z-[1] grid max-w-[780px] content-center gap-4">
            <p className="kicker m-0 max-w-[700px] text-[16px] leading-[1.85] text-[#4c5262]">Myriale top</p>
            <h1 className="m-0 max-w-[740px] font-['Yu_Mincho','Hiragino_Mincho_ProN',Georgia,serif] text-[clamp(42px,7vw,88px)] leading-[.96] tracking-[-.08em]">
              物語の机を、今日の続きに整える。
            </h1>
            <p className="m-0 max-w-[700px] text-[16px] leading-[1.85] text-[#4c5262]">
              中断したセッション、今すぐ遊べるシナリオ、書きかけの構想をひとつの入口に集約しました。
              読む、遊ぶ、作る。次の一手をここから始めます。
            </p>
            {loadState.status !== 'idle' && (
              <p
                className="m-0 inline-flex w-fit max-w-[700px] rounded-full border border-[rgba(111,79,216,.22)] bg-[rgba(255,250,240,.72)] px-3 py-2 text-myr-ui-sm font-extrabold leading-[1.85] text-[#5c4772]"
                data-testid="home-data-source"
              >
                {loadState.status === 'loading' && 'APIからホーム情報を読み込んでいます。'}
                {loadState.status === 'loaded' && 'APIのホーム情報を表示しています。'}
                {loadState.status === 'error' && `APIに接続できないためデモ情報を表示しています。${loadState.message}`}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-[10px] max-[720px]:[&>button]:w-full" aria-label="トップページの主要導線">
              <Button className={homePrimaryButtonClassName} onClick={() => go('scenarioList')} data-testid="home-search-scenarios">
                シナリオを検索して開始
              </Button>
              <Button className={homeDarkButtonClassName} onClick={() => go('scenarioRegister')} data-testid="home-create-scenario">
                シナリオを新規作成
              </Button>
            </div>
          </div>
          <aside
            className="relative z-[1] grid min-h-[230px] self-center gap-[10px] rounded-3xl border border-[rgba(36,27,47,.16)] bg-[linear-gradient(180deg,rgba(25,20,33,.94),rgba(36,27,47,.88)),#191421] p-5 text-myr-paper max-[820px]:min-h-0"
            aria-label="現在の活動概要"
          >
            <span className="text-myr-caption font-black tracking-[.18em] text-[#c6b7d9] uppercase">Desk ledger</span>
            <strong className="font-[Georgia,'Times_New_Roman',serif] text-[clamp(72px,10vw,120px)] leading-[.85] text-myr-gold">
              {vm.resumableSessions.length}
            </strong>
            <small className="font-extrabold text-[#f4eedf]">再開できるセッション</small>
            <dl className="mt-auto mb-0 grid gap-2">
              <div className="flex justify-between gap-3 border-t border-[rgba(244,238,223,.16)] pt-[10px]">
                <dt className="m-0 text-[#c6b7d9]">進行中</dt>
                <dd className="m-0 font-black text-myr-gold">{vm.activeSessionCount}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-[rgba(244,238,223,.16)] pt-[10px]">
                <dt className="m-0 text-[#c6b7d9]">公開シナリオ</dt>
                <dd className="m-0 font-black text-myr-gold">{vm.publishedScenarioCount}</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className={homePanelClassName} aria-label="中断しているセッション">
          <div className={homeSectionHeadClassName}>
            <div className="grid gap-0.5">
              <p className="kicker m-0">Continue</p>
              <h2 className="m-0 font-['Yu_Mincho','Hiragino_Mincho_ProN',Georgia,serif] text-[clamp(28px,4vw,44px)] tracking-[-.06em]">
                中断しているセッション
              </h2>
            </div>
            <Button type="button" className={homeTextButtonClassName} onClick={() => go('resumeSession')}>
              すべて見る
            </Button>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[14px]">
            {vm.resumableSessions.length > 0 ? (
              vm.resumableSessions.map((session) => (
                <article className={homeCardClassName} key={session.id} data-testid={`home-session-${session.id}`}>
                  <span className={homeCardLabelClassName}>{session.stateLabel} / {session.turnLabel}</span>
                  <h3 className={homeCardTitleClassName}>{session.scenarioTitle}</h3>
                  <p className={homeCardCopyClassName}>{session.summary}</p>
                  <small className={homeCardMetaClassName}>{session.hero}</small>
                  <div className={homeCardActionsClassName}>
                    <Button className={homePrimaryButtonClassName} onClick={() => go(session.destination)}>
                      {session.resumeLabel}
                    </Button>
                  </div>
                </article>
              ))
            ) : (
              <article className={`${homeCardClassName} border-dashed bg-[rgba(220,231,242,.36)]`}>
                <span className={homeCardLabelClassName}>Ready</span>
                <h3 className={homeCardTitleClassName}>再開待ちのセッションはありません</h3>
                <p className={homeCardCopyClassName}>シナリオを選んで、新しい物語の準備を始められます。</p>
                <div className={homeCardActionsClassName}>
                  <Button className={homePrimaryButtonClassName} onClick={() => go('startSession')}>シナリオを探す</Button>
                </div>
              </article>
            )}
          </div>
        </section>

        <section className={homePanelClassName} aria-label="おすすめのシナリオ">
          <div className={homeSectionHeadClassName}>
            <div className="grid gap-0.5">
              <p className="kicker m-0">Recommended</p>
              <h2 className="m-0 font-['Yu_Mincho','Hiragino_Mincho_ProN',Georgia,serif] text-[clamp(28px,4vw,44px)] tracking-[-.06em]">
                おすすめのシナリオ
              </h2>
            </div>
            <Button type="button" className={homeTextButtonClassName} onClick={() => go('startSession')}>
              検索画面へ
            </Button>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[14px]">
            {vm.recommendedScenarios.map((scenario) => (
              <article className={homeCardClassName} key={scenario.id} data-testid={`home-scenario-${scenario.id}`}>
                <span className={homeCardLabelClassName}>{scenario.visibilityLabel} / {scenario.id}</span>
                <h3 className={homeCardTitleClassName}>{scenario.title}</h3>
                <p className={homeCardCopyClassName}>{scenario.summary ?? scenario.genre}</p>
                <small className={homeCardMetaClassName}>{scenario.updatedLabel}</small>
                <div className={homeCardActionsClassName}>
                  <Button className={homePrimaryButtonClassName} onClick={() => startRecommendedScenario(scenario)}>このシナリオで開始</Button>
                  <Button className={homeDarkButtonClassName} onClick={() => go('scenarioEdit')}>詳細を編集</Button>
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
