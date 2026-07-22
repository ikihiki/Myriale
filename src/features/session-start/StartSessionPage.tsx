import { useMemo, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useForm, useStore } from '@tanstack/react-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFetchScenarioApi, type ScenarioApi } from '../../app/scenarioApi';
import { toAppChromeAccount } from '../../account/accountPresentation';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { createSession, getSessionApiBaseUrl, type SessionApiError } from '../session-play/sessionPlayApi';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { MyrialeDialogContent, MyrialeDialogRoot, MyrialeSelect } from '../../ui/MyrialeRadix';
import { STORY_IDS, navigateToStory, useAppNavigation } from '../../shared/nav';
import { toScenarioSummary, type ScenarioSummary } from './scenarioPresentation';

function protagonistDetails(value: string) {
  const [name, ...profileParts] = value.split('/').map((part) => part.trim());
  return {
    name: name || '名前未設定',
    profile: profileParts.join(' / ') || 'プロフィールは設定されていません。',
  };
}

function ReadOnlyProtagonistFields({ value, testId }: { value: string; testId: string }) {
  const protagonist = protagonistDetails(value);

  return (
    <div className="grid gap-4" data-testid={testId}>
      <label className="grid gap-2 text-xs font-black tracking-myr-label text-myr-slate">
        名前
        <input
          className="!cursor-not-allowed !rounded-none !border-x-0 !border-t-0 !border-b-2 !border-myr-ink/15 !bg-myr-vellum/35 !px-3 !py-2.5 !text-base !text-myr-slate !shadow-none"
          aria-label="主人公の名前"
          aria-readonly="true"
          readOnly
          value={protagonist.name}
        />
      </label>
      <label className="grid gap-2 text-xs font-black tracking-myr-label text-myr-slate">
        プロフィール
        <textarea
          className="!min-h-28 !cursor-not-allowed !rounded-myr-card !border !border-myr-ink/15 !bg-myr-vellum/35 !px-3 !py-3 !text-base !leading-7 !text-myr-slate !shadow-none"
          aria-label="主人公プロフィール"
          aria-readonly="true"
          readOnly
          value={protagonist.profile}
        />
      </label>
    </div>
  );
}

const FREE_GENERATION_OPTION = '__free-generation__';

export type StartSessionSearch = {
  scenarioId?: string;
};

function ProtagonistForm({
  scenario,
  api,
  onBeginStory,
  isBeginning,
  beginError,
  requiresLogin,
  onLogin,
  canConfigureInterpretation,
  interpretationEnabled,
  onInterpretationEnabledChange,
}: {
  scenario: ScenarioSummary;
  api: ScenarioApi;
  onBeginStory: (selectedHero: string) => Promise<void> | void;
  isBeginning: boolean;
  beginError: string;
  requiresLogin: boolean;
  onLogin: () => void;
  canConfigureInterpretation: boolean;
  interpretationEnabled: boolean;
  onInterpretationEnabledChange: (enabled: boolean) => void;
}) {
  const heroCandidates = scenario.hero.split('\n').map((candidate) => candidate.trim()).filter(Boolean);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const form = useForm({
    defaultValues: {
      heroSelection: scenario.heroMode === 'free' ? FREE_GENERATION_OPTION : heroCandidates[0] ?? '',
      createdName: 'アオイ',
      createdProfile: 'この世界の掟にまだ不慣れな旅人。',
    },
    onSubmit: () => {
      setReviewOpen(true);
    },
  });
  const heroRecommendation = useMutation({
    mutationFn: () => api.recommendHero(scenario.id, {
      currentName: form.state.values.createdName,
      currentProfile: form.state.values.createdProfile,
    }),
    onSuccess: (recommendation) => {
      form.setFieldValue('createdName', recommendation.name);
      form.setFieldValue('createdProfile', recommendation.profile);
      setAiSuggestion(recommendation.message);
    },
    onError: (error) => {
      setAiSuggestion(error instanceof Error ? error.message : '主人公案を取得できませんでした。');
    },
  });
  const formValues = useStore(form.store, (state) => state.values);
  const heroInputMode = scenario.heroMode === 'free' || formValues.heroSelection === FREE_GENERATION_OPTION
    ? 'free'
    : 'select';
  const heroForSummary = scenario.heroMode === 'fixed'
    ? scenario.hero
    : heroInputMode === 'free'
      ? `${formValues.createdName} / ${formValues.createdProfile}`
      : formValues.heroSelection;

  const generateAiHero = () => {
    setAiSuggestion('');
    heroRecommendation.mutate();
  };

  const beginStory = async () => {
    await onBeginStory(heroForSummary);
  };

  return (
    <>
      <section className="border-t border-myr-ink/20 py-7 md:py-9" aria-label="主人公確定">
        <div className="mb-6">
          <p className="mb-2 font-myr-mono text-myr-caption font-black tracking-[0.14em] text-myr-ruby uppercase">
            Protagonist
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          {scenario.heroMode === 'select' && (
            <>
              <form.Field name="heroSelection">
                {(field) => (
                  <MyrialeSelect
                    label="候補キャラクター"
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    options={[
                      ...heroCandidates.map((candidate) => ({ value: candidate, label: candidate })),
                      ...(scenario.heroFreeGenerationAllowed
                        ? [{ value: FREE_GENERATION_OPTION, label: '自由生成' }]
                        : []),
                    ]}
                  />
                )}
              </form.Field>
              {heroInputMode === 'select' && (
                <ReadOnlyProtagonistFields value={formValues.heroSelection} testId="readonly-hero" />
              )}
            </>
          )}

          {scenario.heroMode === 'fixed' && (
            <ReadOnlyProtagonistFields value={scenario.hero} testId="fixed-hero" />
          )}

          {heroInputMode === 'free' && (
            <div className="grid gap-4">
              <form.Field name="createdName">
                {(field) => (
                  <label className="grid gap-2 text-xs font-black tracking-myr-label text-myr-slate">
                    名前
                    <input
                      className="!rounded-none !border-x-0 !border-t-0 !border-b-2 !border-myr-ink/20 !bg-white/45 !px-3 !py-2.5 !text-base !text-myr-ink focus:!border-myr-iris focus:!outline-none"
                      aria-label="主人公の名前"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                  </label>
                )}
              </form.Field>
              <form.Field name="createdProfile">
                {(field) => (
                  <label className="grid gap-2 text-xs font-black tracking-myr-label text-myr-slate">
                    プロフィール
                    <textarea
                      className="!min-h-36 !rounded-myr-card !border !border-myr-ink/20 !bg-white/55 !px-3 !py-3 !text-base !leading-7 !text-myr-ink focus:!border-myr-iris focus:!outline-none"
                      aria-label="主人公プロフィール"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                  </label>
                )}
              </form.Field>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="!rounded-full !bg-myr-vellum !px-4 !py-2.5 !text-xs !font-black !text-myr-ink hover:!bg-myr-mist focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-myr-iris"
                  onClick={generateAiHero}
                  disabled={heroRecommendation.isPending}
                >
                  {heroRecommendation.isPending ? 'AIが主人公を推薦しています…' : 'AIに主人公を生成してもらう'}
                </button>
                {aiSuggestion && <p className="m-0 text-xs font-bold text-myr-iris" role="status">{aiSuggestion}</p>}
              </div>
            </div>
          )}

          {canConfigureInterpretation && (
            <section className="mt-7 border-t border-myr-ink/15 pt-5" aria-label="解釈説明のデバッグ設定">
              <label className="flex items-start gap-3 rounded-myr-card bg-myr-vellum/55 p-4 text-sm text-myr-ink">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-myr-iris"
                  checked={interpretationEnabled}
                  onChange={(event) => onInterpretationEnabledChange(event.target.checked)}
                />
                <span>
                  <strong className="block">解釈説明を有効にする</strong>
                  <span className="mt-1 block text-xs leading-5 text-myr-slate">
                    デバッグ用です。有効なSessionではAIに短い解釈説明も生成させ、「どう解釈された？」を表示します。
                  </span>
                </span>
              </label>
            </section>
          )}

          <div className="mt-7 flex justify-end border-t border-myr-ink/15 pt-5">
            <button
              type="submit"
              className="!rounded-full !bg-myr-gold !px-5 !py-3 !text-sm !font-black !text-myr-void shadow-myr-card transition hover:!-translate-y-0.5 hover:!bg-myr-ink hover:!text-myr-paper focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-myr-iris"
            >
              開始内容を確認
            </button>
          </div>
        </form>
      </section>

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
              {requiresLogin ? (
                <button
                  className="!rounded-full !bg-myr-ink !px-4 !py-2.5 !font-extrabold !text-myr-paper hover:!bg-myr-iris"
                  onClick={onLogin}
                >
                  ログインへ
                </button>
              ) : (
                <button
                  className="!rounded-full !bg-myr-ink !px-4 !py-2.5 !font-extrabold !text-myr-paper hover:!bg-myr-iris"
                  onClick={() => void beginStory()}
                  disabled={isBeginning}
                >
                  {isBeginning ? 'Sessionを作成しています…' : '物語を始める'}
                </button>
              )}
            </>
          )}
        >
          {beginError && <p className="m-0 mb-4 text-sm font-bold text-myr-ruby" role="alert">{beginError}</p>}
          <article className="rounded-myr-card border border-myr-ink/15 bg-white/65 p-4 shadow-myr-card" data-testid="start-summary">
            <span className="font-myr-mono text-myr-caption font-black tracking-[0.08em] text-myr-ruby uppercase">Session snapshot</span>
            <h2 className="my-2 font-myr-display text-3xl leading-none tracking-myr-display">{scenario.title}</h2>
            <p className="my-2 text-sm text-myr-slate">Scenario: {scenario.title}</p>
            {canConfigureInterpretation && (
              <p className="my-2 text-sm text-myr-slate">
                解釈説明: {interpretationEnabled ? '有効（デバッグ）' : '無効'}
              </p>
            )}
            <p className="my-2 text-sm text-myr-slate">主人公: {heroForSummary}</p>
          </article>
        </MyrialeDialogContent>
      </MyrialeDialogRoot>
    </>
  );
}

export function StartSessionPage({ search, api }: { search?: StartSessionSearch; api?: ScenarioApi } = {}) {
  const router = useRouter();
  const appNavigate = useAppNavigation();
  const accountSession = useAccountSession();
  const chromeAccount = toAppChromeAccount(accountSession.user);
  const scenarioApi = useMemo(() => api ?? createFetchScenarioApi(), [api]);
  const [sessionRequestId] = useState(() => `session-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`);
  const [isBeginning, setIsBeginning] = useState(false);
  const [beginError, setBeginError] = useState('');
  const [interpretationEnabled, setInterpretationEnabled] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const scenarioId = search?.scenarioId;
  const scenarioQuery = useQuery({
    queryKey: ['scenarios', 'detail', scenarioId],
    queryFn: ({ signal }) => scenarioApi.getScenario(scenarioId!, signal),
    enabled: Boolean(scenarioId),
    staleTime: 30_000,
  });
  const selectedScenario = useMemo<ScenarioSummary | null>(
    () => scenarioQuery.data ? toScenarioSummary(scenarioQuery.data) : null,
    [scenarioQuery.data],
  );
  const navigateTo = (destination: 'scenarioList' | 'login') => {
    if (appNavigate) {
      appNavigate(destination);
      return;
    }
    navigateToStory(STORY_IDS[destination]);
  };
  const backToScenarioList = () => navigateTo('scenarioList');
  const goToLogin = () => navigateTo('login');
  const logout = async () => {
    await accountSession.api.logout();
    accountSession.clearUser();
    goToLogin();
  };

  const beginStory = async (selectedHero: string) => {
    if (!scenarioId || isBeginning) return;
    if (!getSessionApiBaseUrl()) {
      if (appNavigate) {
        appNavigate('playSession');
        return;
      }
      navigateToStory(STORY_IDS.playSession);
      return;
    }

    if (accountSession.status === 'anonymous') {
      setBeginError('Sessionを開始するにはログインが必要です。');
      setRequiresLogin(true);
      return;
    }

    setBeginError('');
    setRequiresLogin(false);
    setIsBeginning(true);
    try {
      const session = await createSession(scenarioId, sessionRequestId, undefined, interpretationEnabled, selectedHero);
      router.history.push(`/sessions/${encodeURIComponent(session.id)}`);
    } catch (error) {
      const apiError = error as SessionApiError;
      if (apiError.status === 401) {
        accountSession.clearUser();
        setBeginError('Sessionを開始するにはログインが必要です。ログイン後、もう一度開始してください。');
        setRequiresLogin(true);
      } else {
        setBeginError(error instanceof Error ? error.message : 'Sessionを開始できませんでした。');
      }
    } finally {
      setIsBeginning(false);
    }
  };

  const sessionCrumbs: Crumb[] = [
    { label: 'Myriale', to: 'home' },
    { label: 'セッション', to: 'scenarioList' },
    { label: 'セッション開始' },
  ];
  if (scenarioId && scenarioQuery.isPending) {
    return (
      <AppChrome section="sessions" breadcrumbs={sessionCrumbs} account={chromeAccount} onLogout={logout}>
        <main className="grid min-h-[calc(100vh-118px)] place-items-center bg-[image:var(--myr-screen-background)] p-6 text-myr-ink">
          <p className="rounded-full bg-myr-paper px-5 py-3 font-black shadow-myr-card" role="status">シナリオを読み込んでいます。</p>
        </main>
      </AppChrome>
    );
  }

  if (!scenarioId || scenarioQuery.isError || !selectedScenario) {
    return (
      <AppChrome section="sessions" breadcrumbs={sessionCrumbs} account={chromeAccount} onLogout={logout}>
        <main className="grid min-h-[calc(100vh-118px)] place-items-center bg-[image:var(--myr-screen-background)] p-6 text-myr-ink">
          <section className="max-w-xl rounded-myr-panel bg-myr-paper p-8 text-center shadow-myr-panel" aria-label="シナリオ読み込みエラー">
            <h1 className="font-myr-display text-4xl">シナリオを読み込めませんでした</h1>
            <p className="my-4 text-myr-slate">
              {!scenarioId
                ? '開始するシナリオが指定されていません。'
                : scenarioQuery.error instanceof Error
                  ? scenarioQuery.error.message
                  : '指定されたシナリオが見つかりません。シナリオ一覧から選び直してください。'}
            </p>
            <button className="!rounded-full !bg-myr-ink !px-5 !py-3 !font-black !text-myr-paper" onClick={backToScenarioList}>
              シナリオ一覧へ
            </button>
          </section>
        </main>
      </AppChrome>
    );
  }

  return (
    <AppChrome section="sessions" breadcrumbs={sessionCrumbs} account={chromeAccount} onLogout={logout}>
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
              <p className="mb-2 text-myr-caption font-extrabold tracking-[0.16em] text-myr-ink-subtle uppercase">
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

          <section
            className="overflow-hidden rounded-myr-card bg-white/45 px-5 shadow-myr-card md:px-8 [&_.myr-ui-field]:mb-5 [&_.myr-ui-field>label]:!text-xs [&_.myr-ui-field>label]:!font-black [&_.myr-ui-field>label]:!tracking-myr-label [&_.myr-ui-field>label]:!text-myr-slate [&_.myr-ui-select-trigger]:!rounded-none [&_.myr-ui-select-trigger]:!border-x-0 [&_.myr-ui-select-trigger]:!border-t-0 [&_.myr-ui-select-trigger]:!border-b-2 [&_.myr-ui-select-trigger]:!border-myr-ink/20 [&_.myr-ui-select-trigger]:!bg-white/45"
            aria-label="イントロと主人公選択"
          >
            <section className="relative py-7 md:py-9" aria-label="イントロNarrative">
              <p className="mb-3 font-myr-mono text-myr-caption font-black tracking-[0.14em] text-myr-ruby uppercase">
                Opening narrative
              </p>
              <article className="relative pr-4 before:pointer-events-none before:absolute before:-top-8 before:right-0 before:font-myr-display before:text-8xl before:text-myr-iris/10 before:content-['✦']" data-testid="intro-narrative">
                <p className="relative z-10 m-0 max-w-[800px] font-myr-display text-[clamp(1.25rem,2.5vw,1.75rem)] leading-[1.65] tracking-[-0.025em]">
                  {selectedScenario.opening}
                </p>
              </article>
            </section>

            <ProtagonistForm
              scenario={selectedScenario}
              api={scenarioApi}
              onBeginStory={beginStory}
              isBeginning={isBeginning}
              beginError={beginError}
              requiresLogin={requiresLogin}
              onLogin={goToLogin}
              canConfigureInterpretation={accountSession.user?.canDebugDialogue === true}
              interpretationEnabled={interpretationEnabled}
              onInterpretationEnabledChange={setInterpretationEnabled}
            />
          </section>
        </main>
      </div>
    </AppChrome>
  );
}
