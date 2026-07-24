import { ArchiveCard, Badge, Button, Label, Notice, PageCanvas, PageShell } from '../../components/ui';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import type { ScenarioSummary } from './scenarioPresentation';

const crumbs: Crumb[] = [
  { label: 'Myriale', to: 'home' },
  { label: 'セッション', to: 'scenarioList' },
  { label: 'シナリオを選ぶ' },
];

type Props = {
  account: { name: string; email: string; initials: string; role?: string } | null;
  scenarios: ScenarioSummary[];
  status: 'loading' | 'error' | 'ready';
  loadError?: string;
  onRetry: () => void;
  onRegistration: () => void;
  onStart: (scenarioId: string) => void;
  onLogout: () => void | Promise<void>;
};

export function ScenarioListPresentation({
  account,
  scenarios,
  status,
  loadError,
  onRetry,
  onRegistration,
  onStart,
  onLogout,
}: Props) {
  return (
    <AppChrome section="sessions" breadcrumbs={crumbs} account={account} onLogout={onLogout}>
      <PageCanvas data-myriale-theme="archive">
        <PageShell width="content" aria-label="セッション開始前のシナリオ一覧">
          <Label as="p" textRole="eyebrow" className="mb-2">
            Session Start / Scenario library
          </Label>
          <section aria-label="シナリオ一覧">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-myr-ink/15 pb-5 md:flex-row md:items-end">
              <div>
                <Label as="h1" textRole="display" className="m-0 max-w-myr-section">
                  どの物語を、今夜ひらきますか。
                </Label>
                <Label as="p" textRole="bodySm" className="mt-4 max-w-170 !leading-7">
                  <strong className="text-myr-ink">利用可能なScenarioを選択します。</strong>
                  選択するとイントロと主人公選択をすぐに表示します。
                </Label>
              </div>
              <Button variant="secondary" className="shadow-myr-card" onClick={onRegistration}>
                新しいシナリオを登録
              </Button>
            </div>

            {status === 'loading' && <Notice tone="info">シナリオを読み込んでいます。</Notice>}
            {status === 'error' && (
              <Notice tone="danger">
                <span>{loadError ?? 'シナリオ一覧を読み込めませんでした。'}</span>{' '}
                <Button variant="text" size="sm" onClick={onRetry}>再読み込み</Button>
              </Notice>
            )}
            {status === 'ready' && scenarios.length === 0 && (
              <Notice tone="info">利用できるシナリオはまだありません。新しいシナリオを登録してください。</Notice>
            )}
            {status === 'ready' && scenarios.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3" data-testid="scenario-list">
                {scenarios.map((scenario) => (
                  <ArchiveCard
                    as="article"
                    className="group flex min-h-64 flex-col transition duration-200 hover:-translate-y-1 hover:border-myr-iris/40 hover:bg-myr-paper"
                    data-testid={`scenario-card-${scenario.id}`}
                    key={scenario.id}
                  >
                    <Label textRole="eyebrowData" className="!tracking-[0.08em]">
                      {scenario.status} / {scenario.id}
                    </Label>
                    <Label as="h2" textRole="section" className="my-2 !text-[clamp(1.5rem,2vw,2.125rem)]">
                      {scenario.title}
                    </Label>
                    <Badge tone="info" className="mb-3"># {scenario.genre}</Badge>
                    <Label as="p" textRole="bodySm" className="mb-5 line-clamp-5 flex-1">{scenario.basicInformation}</Label>
                    <Button variant="primary" onClick={() => onStart(scenario.id)}>
                      {scenario.title}で開始
                    </Button>
                  </ArchiveCard>
                ))}
              </div>
            )}
          </section>
        </PageShell>
      </PageCanvas>
    </AppChrome>
  );
}
