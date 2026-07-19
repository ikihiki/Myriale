import { useEffect, useState } from 'react';
import { useAppStore, type ScenarioRecord } from '../../app/store';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { MyrialeDialogContent, MyrialeDialogRoot, MyrialeSelect } from '../../ui/MyrialeRadix';
import { STORY_IDS, navigateToStory, useAppNavigation } from '../../shared/nav';

type HeroMode = 'fixed' | 'select' | 'create' | 'ai';

type ScenarioSummary = {
  id: string;
  title: string;
  status: '公開中' | '自分用';
  genre: string;
  tone: string;
  lore: string;
  opening: string;
};

const heroNames: Record<HeroMode, string> = {
  fixed: 'リュシエン / 地下図書館の禁書司書',
  select: 'ミラ / 星図を読む巡礼者',
  create: 'アオイ / 灰の駅で目覚めた旅人',
  ai: 'ノクト / 失われた索引を探す見習い司書',
};

export type StartSessionSearch = {
  scenarioId?: string;
};

function toScenarioSummary(scenario: ScenarioRecord): ScenarioSummary {
  return {
    id: scenario.id,
    title: scenario.title,
    status: scenario.status === 'published' ? '公開中' : '自分用',
    genre: scenario.genre,
    tone: scenario.tone ?? 'シナリオ設定に基づくトーン',
    lore: scenario.lore ?? '選択したシナリオの設定をSession用に読み込みます。',
    opening: scenario.opening ?? scenario.summary ?? `${scenario.title}の物語が始まる。`,
  };
}

export function StartSessionPage({ search }: { search?: StartSessionSearch } = {}) {
  const appNavigate = useAppNavigation();
  const { db } = useAppStore();
  const scenarios = Object.values(db.scenarios).map(toScenarioSummary);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(search?.scenarioId ?? null);
  const selectedScenario = selectedScenarioId
    ? scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null
    : null;
  const [heroMode, setHeroMode] = useState<HeroMode>('select');
  const [selectedHero, setSelectedHero] = useState(heroNames.select);
  const [createdName, setCreatedName] = useState('アオイ');
  const [createdProfile, setCreatedProfile] = useState('灰の駅で目覚めた旅人。星図を読む力はまだ不安定。');
  const [aiSuggestion, setAiSuggestion] = useState('AI案は未生成です。生成後もプレイヤー確認まで確定しません。');
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    setSelectedScenarioId(search?.scenarioId ?? null);
    setReviewOpen(false);
  }, [search?.scenarioId]);

  const heroForSummary = heroMode === 'create' ? `${createdName} / ${createdProfile}` : selectedHero;

  const openRegistration = () => {
    if (appNavigate) {
      appNavigate('scenarioRegister');
      return;
    }
    navigateToStory(STORY_IDS.scenarioRegister);
  };

  const startPreparing = (scenario: ScenarioSummary) => {
    setSelectedScenarioId(scenario.id);
    setReviewOpen(false);
  };

  const backToScenarioList = () => {
    setSelectedScenarioId(null);
    setReviewOpen(false);
  };

  const updateHeroMode = (mode: HeroMode) => {
    setHeroMode(mode);
    setSelectedHero(heroNames[mode]);
  };

  const generateAiHero = () => {
    setAiSuggestion('AIがイントロとLoreを踏まえた主人公案を生成しました: ノクト / 失われた索引を探す見習い司書。確認・修正してから確定します。');
    setSelectedHero(heroNames.ai);
  };

  const openFinalReview = () => setReviewOpen(true);

  const beginStory = () => {
    setReviewOpen(false);
    if (appNavigate) {
      appNavigate('playSession');
      return;
    }
    navigateToStory(STORY_IDS.playSession);
  };

  const sessionCrumbs: Crumb[] = [
    { label: 'Myriale', to: 'scenarioRegister' },
    { label: 'セッション', to: 'startSession' },
    { label: selectedScenario ? 'セッション開始' : 'シナリオを選ぶ' },
  ];
  const playerAccount = { name: '霧野しおり', email: 'reader@myriale.example', initials: '霧野', role: 'プレイヤー' };

  if (!selectedScenario) {
    return (
      <AppChrome section="sessions" breadcrumbs={sessionCrumbs} account={playerAccount}>
        <div
          data-myriale-theme="archive"
          className="min-h-[calc(100vh-118px)] bg-[image:var(--myr-screen-background)] p-3 font-myr-body text-myr-ink md:p-5"
        >
          <main
            className="mx-auto grid min-h-[calc(100vh-158px)] max-w-[1180px] content-start rounded-myr-panel border border-white/40 bg-[image:var(--myr-paper-background)] [background-size:26px_100%,auto] p-5 shadow-myr-panel md:p-8"
            aria-label="セッション開始前のシナリオ一覧"
          >
            <p className="mb-2 text-[0.6875rem] font-extrabold tracking-[0.16em] text-[#6d587a] uppercase">
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
                <button
                  className="!rounded-full !bg-myr-ink !px-4 !py-2.5 !text-sm !font-extrabold !text-myr-paper shadow-myr-card transition hover:!-translate-y-0.5 hover:!bg-myr-iris focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-myr-iris"
                  onClick={openRegistration}
                >
                  新しいシナリオを登録
                </button>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3" data-testid="scenario-list">
                {scenarios.map((scenario) => (
                  <article
                    className="group flex min-h-64 flex-col rounded-myr-card border border-myr-ink/15 bg-myr-paper/75 p-4 shadow-myr-card transition duration-200 hover:-translate-y-1 hover:border-myr-iris/40 hover:bg-myr-paper"
                    data-testid={`scenario-card-${scenario.id}`}
                    key={scenario.id}
                  >
                    <span className="font-myr-mono text-[0.6875rem] font-black tracking-[0.08em] text-myr-ruby uppercase">
                      {scenario.status} / {scenario.id}
                    </span>
                    <h2 className="my-2 font-myr-display text-[clamp(1.5rem,2vw,2.125rem)] leading-none tracking-[-0.04em]">
                      {scenario.title}
                    </h2>
                    <p className="m-0 text-sm font-bold text-myr-slate">{scenario.genre} / {scenario.tone}</p>
                    <p className="mt-3 mb-5 flex-1 text-sm leading-6 text-myr-slate">{scenario.lore}</p>
                    <button
                      className="!rounded-full !bg-myr-gold !px-4 !py-2.5 !text-sm !font-black !text-myr-void transition group-hover:!bg-myr-ink group-hover:!text-myr-paper focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-myr-iris"
                      onClick={() => startPreparing(scenario)}
                    >
                      {scenario.title}で開始
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </main>
        </div>
      </AppChrome>
    );
  }

  return (
    <AppChrome section="sessions" breadcrumbs={sessionCrumbs} account={playerAccount}>
      <div
        data-myriale-theme="archive"
        className="min-h-[calc(100vh-118px)] bg-[image:var(--myr-screen-background)] p-3 font-myr-body text-myr-ink md:p-5"
      >
        <main
          className="mx-auto grid min-h-[calc(100vh-158px)] max-w-[1040px] content-start rounded-myr-panel border border-white/40 bg-[image:var(--myr-paper-background)] [background-size:26px_100%,auto] p-5 shadow-myr-panel md:p-8"
          aria-label="セッション開始アプリ画面"
        >
          <header className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-myr-ink/15 pb-5 md:flex-row">
            <div>
              <p className="mb-2 text-[0.6875rem] font-extrabold tracking-[0.16em] text-[#6d587a] uppercase">
                Session Start / Scenario to play
              </p>
              <h1
                className="m-0 max-w-[820px] font-myr-display text-[clamp(2.25rem,5vw,4.75rem)] leading-[0.95] tracking-[-0.055em]"
                data-testid="selected-scenario-title"
              >
                {selectedScenario.title}
              </h1>
            </div>
            <button
              className="!rounded-full !bg-transparent !px-0 !py-2 !text-sm !font-black !text-myr-iris underline decoration-myr-iris/30 underline-offset-4 hover:!text-myr-ruby focus-visible:!outline-2 focus-visible:!outline-offset-4 focus-visible:!outline-myr-iris"
              onClick={backToScenarioList}
            >
              シナリオ一覧へ戻る
            </button>
          </header>

          <div className="grid gap-5" aria-label="イントロと主人公選択">
            <section aria-label="イントロNarrative">
              <p className="mb-2 font-myr-mono text-[0.6875rem] font-black tracking-[0.14em] text-myr-ruby uppercase">
                Opening narrative
              </p>
              <article
                className="relative overflow-hidden rounded-myr-card border border-myr-ink/15 border-l-4 border-l-myr-gold bg-myr-paper/80 p-5 shadow-myr-card before:pointer-events-none before:absolute before:-top-8 before:right-3 before:font-myr-display before:text-8xl before:text-myr-iris/10 before:content-['✦'] md:p-7"
                data-testid="intro-narrative"
              >
                <p className="relative z-10 m-0 max-w-[760px] font-myr-display text-[clamp(1.25rem,2.5vw,1.75rem)] leading-[1.65] tracking-[-0.025em]">
                  {selectedScenario.opening} 頭上では星座が紙魚のようにページを食み、遠くで誰かが名もなき旅人を呼んでいる。
                </p>
              </article>
            </section>

            <section
              className="rounded-myr-card border border-myr-ink/15 bg-white/55 p-5 shadow-myr-card md:p-7 [&_.myr-ui-field]:mb-5 [&_.myr-ui-field>label]:!text-xs [&_.myr-ui-field>label]:!font-black [&_.myr-ui-field>label]:!tracking-[0.04em] [&_.myr-ui-field>label]:!text-myr-slate [&_.myr-ui-select-trigger]:!rounded-none [&_.myr-ui-select-trigger]:!border-x-0 [&_.myr-ui-select-trigger]:!border-t-0 [&_.myr-ui-select-trigger]:!border-b-2 [&_.myr-ui-select-trigger]:!border-myr-ink/20 [&_.myr-ui-select-trigger]:!bg-white/45"
              aria-label="主人公確定"
            >
              <div className="mb-5 border-b border-myr-ink/15 pb-4">
                <p className="mb-2 font-myr-mono text-[0.6875rem] font-black tracking-[0.14em] text-myr-ruby uppercase">
                  Protagonist
                </p>
                <h2 className="m-0 font-myr-display text-[clamp(1.75rem,3vw,2.75rem)] leading-none tracking-[-0.045em]">
                  この物語を歩く人を決める
                </h2>
              </div>
              <MyrialeSelect
                label="主人公の扱い"
                value={heroMode}
                onValueChange={(value) => updateHeroMode(value as HeroMode)}
                options={[
                  { value: 'fixed', label: 'キャラクター固定' },
                  { value: 'select', label: 'キャラクター選択式' },
                  { value: 'create', label: 'キャラクタークリエイト' },
                  { value: 'ai', label: 'AIによる自動生成案' },
                ]}
              />
              {heroMode === 'select' && (
                <MyrialeSelect
                  label="候補キャラクター"
                  value={selectedHero}
                  onValueChange={setSelectedHero}
                  options={[
                    { value: heroNames.select, label: heroNames.select },
                    { value: 'セオ / 星図を燃やす護衛', label: 'セオ / 星図を燃やす護衛' },
                    { value: 'エル / 記憶を失った写字生', label: 'エル / 記憶を失った写字生' },
                  ]}
                />
              )}
              {heroMode === 'create' && (
                <div className="grid gap-4">
                  <label className="grid gap-2 text-xs font-black tracking-[0.04em] text-myr-slate">
                    名前
                    <input
                      className="!rounded-none !border-x-0 !border-t-0 !border-b-2 !border-myr-ink/20 !bg-white/45 !px-3 !py-2.5 !text-base !text-myr-ink focus:!border-myr-iris focus:!outline-none"
                      aria-label="主人公の名前"
                      value={createdName}
                      onChange={(event) => setCreatedName(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-xs font-black tracking-[0.04em] text-myr-slate">
                    プロフィール
                    <textarea
                      className="!min-h-36 !rounded-myr-card !border !border-myr-ink/20 !bg-white/55 !px-3 !py-3 !text-base !leading-7 !text-myr-ink focus:!border-myr-iris focus:!outline-none"
                      aria-label="主人公プロフィール"
                      value={createdProfile}
                      onChange={(event) => setCreatedProfile(event.target.value)}
                    />
                  </label>
                  <button
                    className="justify-self-start !rounded-full !bg-myr-vellum !px-4 !py-2.5 !text-xs !font-black !text-myr-ink hover:!bg-myr-mist focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-myr-iris"
                    onClick={() => setCreatedProfile((profile) => `${profile} 失われた記憶の手がかりを追っている。`)}
                  >
                    AIに入力補助してもらう
                  </button>
                </div>
              )}
              {heroMode === 'ai' && (
                <article className="rounded-myr-card border border-myr-iris/25 bg-myr-iris/5 p-4" data-testid="ai-hero-suggestion">
                  <h2 className="m-0 font-myr-display text-2xl tracking-[-0.04em]">AI主人公案</h2>
                  <p className="my-3 text-sm leading-6 text-myr-slate">{aiSuggestion}</p>
                  <button
                    className="!rounded-full !bg-myr-ink !px-4 !py-2.5 !text-xs !font-black !text-myr-paper hover:!bg-myr-iris focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-myr-iris"
                    onClick={generateAiHero}
                  >
                    AIに任せる
                  </button>
                </article>
              )}
              {heroMode === 'fixed' && (
                <p className="rounded-myr-card border border-myr-gold/35 bg-myr-gold/10 p-4 font-bold" data-testid="fixed-hero">
                  {heroNames.fixed}
                </p>
              )}
              <div className="mt-6 flex justify-end border-t border-myr-ink/15 pt-5">
                <button
                  className="!rounded-full !bg-myr-gold !px-5 !py-3 !text-sm !font-black !text-myr-void shadow-myr-card transition hover:!-translate-y-0.5 hover:!bg-myr-ink hover:!text-myr-paper focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-myr-iris"
                  onClick={openFinalReview}
                >
                  開始内容を確認
                </button>
              </div>
            </section>
          </div>

          <MyrialeDialogRoot open={reviewOpen} onOpenChange={setReviewOpen}>
            <MyrialeDialogContent
              title="開始前の最終確認"
              description="Scenarioと主人公を確認してから物語を開始します。"
              className="!w-[min(620px,calc(100vw-32px))] !border-myr-ink/20 !bg-myr-paper !text-myr-ink"
              portal={false}
              data-testid="start-review-dialog"
              footer={(
                <>
                  <button
                    className="!rounded-full !bg-myr-vellum !px-4 !py-2.5 !font-extrabold !text-myr-ink hover:!bg-myr-mist"
                    onClick={() => setReviewOpen(false)}
                  >
                    主人公選択を修正
                  </button>
                  <button
                    className="!rounded-full !bg-myr-ink !px-4 !py-2.5 !font-extrabold !text-myr-paper hover:!bg-myr-iris"
                    onClick={beginStory}
                  >
                    物語を始める
                  </button>
                </>
              )}
            >
              <article className="rounded-myr-card border border-myr-ink/15 bg-white/65 p-4 shadow-myr-card" data-testid="start-summary">
                <span className="font-myr-mono text-[0.6875rem] font-black tracking-[0.08em] text-myr-ruby uppercase">Session snapshot</span>
                <h2 className="my-2 font-myr-display text-3xl leading-none tracking-[-0.04em]">{selectedScenario.title}</h2>
                <p className="my-2 text-sm text-myr-slate">Scenario: {selectedScenario.title}</p>
                <p className="my-2 text-sm text-myr-slate">主人公: {heroForSummary}</p>
              </article>
            </MyrialeDialogContent>
          </MyrialeDialogRoot>
        </main>
      </div>
    </AppChrome>
  );
}
