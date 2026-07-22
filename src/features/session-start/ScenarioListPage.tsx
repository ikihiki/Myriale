import { useAppStore } from '../../app/store';
import { Button } from '../../components/ui';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { STORY_IDS, navigateToStory, useAppNavigation } from '../../shared/nav';
import { toScenarioSummary } from './scenarioPresentation';

const crumbs: Crumb[] = [
  { label: 'Myriale', to: 'home' },
  { label: 'セッション', to: 'scenarioList' },
  { label: 'シナリオを選ぶ' },
];
const playerAccount = { name: '霧野しおり', email: 'reader@myriale.example', initials: '霧野', role: 'プレイヤー' };

export function ScenarioListPage() {
  const appNavigate = useAppNavigation();
  const { db } = useAppStore();
  const scenarios = Object.values(db.scenarios).map(toScenarioSummary);

  const openRegistration = () => {
    if (appNavigate) {
      appNavigate('scenarioRegister');
      return;
    }
    navigateToStory(STORY_IDS.scenarioRegister);
  };

  const startScenario = (scenarioId: string) => {
    if (appNavigate) {
      appNavigate('startSession', { query: { scenarioId } });
      return;
    }
    navigateToStory(STORY_IDS.startSession);
  };

  return (
    <AppChrome section="sessions" breadcrumbs={crumbs} account={playerAccount}>
      <div
        data-myriale-theme="archive"
        className="min-h-[calc(100vh-118px)] bg-[image:var(--myr-screen-background)] p-3 font-myr-body text-myr-ink md:p-5"
      >
        <main
          className="mx-auto grid min-h-[calc(100vh-158px)] max-w-[1180px] content-start rounded-myr-panel border border-white/40 bg-[image:var(--myr-paper-background)] [background-size:26px_100%,auto] p-5 shadow-myr-panel md:p-8"
          aria-label="セッション開始前のシナリオ一覧"
        >
          <p className="mb-2 text-myr-caption font-extrabold tracking-[0.16em] text-myr-ink-subtle uppercase">
            Session Start / Scenario library
          </p>
          <section aria-label="シナリオ一覧">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-myr-ink/15 pb-5 md:flex-row md:items-end">
              <div>
                <h1 className="m-0 max-w-[820px] font-myr-display text-[clamp(2.25rem,5vw,4.75rem)] leading-[0.95] tracking-[-0.055em]">
                  どの物語を、今夜ひらきますか。
                </h1>
                <p className="mt-4 max-w-[680px] text-sm leading-7 text-myr-slate">
                  <strong className="text-myr-ink">利用可能なScenarioを選択します。</strong>
                  選択するとイントロと主人公選択をすぐに表示します。
                </p>
              </div>
              <Button
                className="!rounded-full !bg-myr-ink !px-4 !py-2.5 !text-sm !font-extrabold !text-myr-paper shadow-myr-card transition hover:!-translate-y-0.5 hover:!bg-myr-iris focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-myr-iris"
                onClick={openRegistration}
              >
                新しいシナリオを登録
              </Button>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3" data-testid="scenario-list">
              {scenarios.map((scenario) => (
                <article
                  className="group flex min-h-64 flex-col rounded-myr-card border border-myr-ink/15 bg-myr-paper/75 p-4 shadow-myr-card transition duration-200 hover:-translate-y-1 hover:border-myr-iris/40 hover:bg-myr-paper"
                  data-testid={`scenario-card-${scenario.id}`}
                  key={scenario.id}
                >
                  <span className="font-myr-mono text-myr-caption font-black tracking-[0.08em] text-myr-ruby uppercase">
                    {scenario.status} / {scenario.id}
                  </span>
                  <h2 className="my-2 font-myr-display text-[clamp(1.5rem,2vw,2.125rem)] leading-none tracking-myr-display">
                    {scenario.title}
                  </h2>
                  <p className="m-0 text-sm font-bold text-myr-slate">{scenario.genre} / {scenario.tone}</p>
                  <p className="mt-3 mb-5 flex-1 text-sm leading-6 text-myr-slate">{scenario.lore}</p>
                  <Button
                    className="!rounded-full !bg-myr-gold !px-4 !py-2.5 !text-sm !font-black !text-myr-void transition group-hover:!bg-myr-ink group-hover:!text-myr-paper focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-myr-iris"
                    onClick={() => startScenario(scenario.id)}
                  >
                    {scenario.title}で開始
                  </Button>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </AppChrome>
  );
}
