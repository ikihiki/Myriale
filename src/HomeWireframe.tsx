import { AppChrome, type Crumb } from './shared/AppChrome';
import { useAppNavigation, type StoryKey } from './shared/nav';
import { useOptionalAppStore, type PlaySessionRecord, type ScenarioRecord } from './app/store';

const account = { name: '霧野しおり', email: 'reader@myriale.example', initials: '霧野', role: 'プレイヤー' };

const fallbackScenarios: ScenarioRecord[] = [
  { id: 'SCN-STAR-LIBRARY', title: '星喰いの地下図書館', genre: 'ダークファンタジー探索譚', status: 'published', updatedAt: '2026-06-20 19:30' },
  { id: 'SCN-ASH-STATION', title: '灰の駅と宛名のない切符', genre: '終末ロードムービー', status: 'private', updatedAt: '2026-06-18 22:15' },
];

const fallbackSessions: PlaySessionRecord[] = [
  {
    id: 'SES-PREP-1098',
    scenarioId: 'SCN-STAR-LIBRARY',
    state: 'Paused',
    hero: 'ミラ / 星図を読む巡礼者',
    turn: 7,
    summary: '水没した閲覧室で星図灯が点き、禁書庫への扉が半分だけ開いている。',
  },
];

export function HomeWireframe() {
  const store = useOptionalAppStore();
  const navigate = useAppNavigation();
  const scenarios = Object.values(store?.db.scenarios ?? Object.fromEntries(fallbackScenarios.map((scenario) => [scenario.id, scenario])));
  const sessions = Object.values(store?.db.playSessions ?? Object.fromEntries(fallbackSessions.map((session) => [session.id, session])));
  const pausedSessions = sessions.filter((session) => session.state === 'Paused' || session.state === 'Active');
  const recommended = scenarios.filter((scenario) => scenario.status !== 'draft').slice(0, 3);
  const crumbs: Crumb[] = [{ label: 'Myriale' }, { label: 'ホーム' }];

  const go = (to: StoryKey) => navigate?.(to);
  const scenarioTitle = (scenarioId: string) => scenarios.find((scenario) => scenario.id === scenarioId)?.title ?? '未登録シナリオ';

  return (
    <AppChrome section="home" breadcrumbs={crumbs} account={account}>
      <main className="home-dashboard" aria-label="Myrialeトップページ">
        <section className="home-hero" aria-label="トップページの主要操作">
          <p className="kicker">Myriale home</p>
          <h1>霧の続きへ、すぐ戻る。</h1>
          <p>
            中断したSession、次に遊べるScenario、新規作成への導線を1枚の机に集めました。
            物語を再開するか、新しい契約書を書き始めてください。
          </p>
          <div className="home-actions">
            <button className="primary" onClick={() => go('startSession')} data-testid="home-search-scenarios">
              シナリオを検索して開始
            </button>
            <button onClick={() => go('scenarioRegister')} data-testid="home-create-scenario">
              シナリオを新規作成
            </button>
          </div>
        </section>

        <section className="home-panel home-sessions" aria-label="中断しているセッション">
          <div className="home-section-head">
            <p className="kicker">Continue</p>
            <h2>中断しているセッション</h2>
            <button type="button" className="text-button" onClick={() => go('resumeSession')}>すべて見る</button>
          </div>
          <div className="home-card-grid">
            {pausedSessions.length > 0 ? pausedSessions.map((session) => (
              <article className="home-card session-card" key={session.id} data-testid={`home-session-${session.id}`}>
                <span>{session.state} / Turn {session.turn}</span>
                <h3>{scenarioTitle(session.scenarioId)}</h3>
                <p>{session.summary}</p>
                <small>{session.hero}</small>
                <div className="home-card-actions">
                  <button className="primary" onClick={() => go(session.state === 'Paused' ? 'resumeSession' : 'playSession')}>
                    {session.state === 'Paused' ? '再開する' : 'プレイへ戻る'}
                  </button>
                </div>
              </article>
            )) : (
              <article className="home-card empty-card">
                <h3>中断中のSessionはありません</h3>
                <p>シナリオ検索から新しいSessionを開始できます。</p>
                <button onClick={() => go('startSession')}>シナリオ検索へ</button>
              </article>
            )}
          </div>
        </section>

        <section className="home-panel home-recommended" aria-label="おすすめのシナリオ">
          <div className="home-section-head">
            <p className="kicker">Recommended</p>
            <h2>おすすめのシナリオ</h2>
            <button type="button" className="text-button" onClick={() => go('startSession')}>検索画面へ</button>
          </div>
          <div className="home-card-grid recommended-grid">
            {recommended.map((scenario) => (
              <article className="home-card scenario-card" key={scenario.id} data-testid={`home-scenario-${scenario.id}`}>
                <span>{scenario.status === 'published' ? '公開中' : '自分用'} / {scenario.id}</span>
                <h3>{scenario.title}</h3>
                <p>{scenario.genre}</p>
                <small>更新: {scenario.updatedAt}</small>
                <div className="home-card-actions">
                  <button className="primary" onClick={() => go('startSession')}>このシナリオで開始</button>
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
