import { useAppStore } from '../../app/store';
import { Button, surfaceRecipe, textRecipe } from '../../components/ui';
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
        className={surfaceRecipe({ role: 'canvas' })}
      >
        <main
          className={surfaceRecipe({ role: 'shell', width: 'content' })}
          aria-label="セッション開始前のシナリオ一覧"
        >
          <p className={`mb-2 ${textRecipe('eyebrow')}`}>
            Session Start / Scenario library
          </p>
          <section aria-label="シナリオ一覧">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-myr-ink/15 pb-5 md:flex-row md:items-end">
              <div>
                <h1 className={`m-0 max-w-[820px] ${textRecipe('display')}`}>
                  どの物語を、今夜ひらきますか。
                </h1>
                <p className={`mt-4 max-w-[680px] ${textRecipe('bodySm')} !leading-7`}>
                  <strong className="text-myr-ink">利用可能なScenarioを選択します。</strong>
                  選択するとイントロと主人公選択をすぐに表示します。
                </p>
              </div>
              <Button variant="secondary" className="shadow-myr-card" onClick={openRegistration}>
                新しいシナリオを登録
              </Button>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3" data-testid="scenario-list">
              {scenarios.map((scenario) => (
                <article
                  className={`group flex min-h-64 flex-col ${surfaceRecipe({ role: 'card', variant: 'archive' })} transition duration-200 hover:-translate-y-1 hover:border-myr-iris/40 hover:bg-myr-paper`}
                  data-testid={`scenario-card-${scenario.id}`}
                  key={scenario.id}
                >
                  <span className={`${textRecipe('eyebrowData')} !tracking-[0.08em]`}>
                    {scenario.status} / {scenario.id}
                  </span>
                  <h2 className={`my-2 ${textRecipe('section')} !text-[clamp(1.5rem,2vw,2.125rem)]`}>
                    {scenario.title}
                  </h2>
                  <p className="m-0 text-sm font-bold text-myr-slate">{scenario.genre} / {scenario.tone}</p>
                  <p className={`mt-3 mb-5 flex-1 ${textRecipe('bodySm')}`}>{scenario.lore}</p>
                  <Button variant="primary" onClick={() => startScenario(scenario.id)}>
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
