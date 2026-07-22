import { useMemo, useState } from 'react';
import { ArchiveCard, Button, Input, Label, PageCanvas, PageShell, Textarea } from '../../components/ui';
import { useRouter } from '@tanstack/react-router';
import { useForm, useStore } from '@tanstack/react-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFetchScenarioApi, type ScenarioApi } from '../../app/scenarioApi';
import { toAppChromeAccount } from '../../account/accountPresentation';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { createSession, type SessionApiError } from '../session-play/sessionPlayApi';
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
      <Label as="label" textRole="label" className="grid gap-2">
        名前
        <Input
          variant="underline"
          aria-label="主人公の名前"
          aria-readonly="true"
          readOnly
          value={protagonist.name}
        />
      </Label>
      <Label as="label" textRole="label" className="grid gap-2">
        プロフィール
        <Textarea
          className="!min-h-28 !rounded-myr-card !border-myr-ink/15 !px-3 !py-3 !text-base !leading-7 !shadow-none"
          aria-label="主人公プロフィール"
          aria-readonly="true"
          readOnly
          value={protagonist.profile}
        />
      </Label>
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
          <Label as="p" textRole="eyebrowData" className="mb-2">
            Protagonist
          </Label>
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
                  <Label as="label" textRole="label" className="grid gap-2">
                    名前
                    <Input
                      variant="underline"
                      aria-label="主人公の名前"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                  </Label>
                )}
              </form.Field>
              <form.Field name="createdProfile">
                {(field) => (
                  <Label as="label" textRole="label" className="grid gap-2">
                    プロフィール
                    <Textarea
                      className="!min-h-36 !rounded-myr-card !border-myr-ink/20 !bg-white/55 !px-3 !py-3 !text-base !leading-7"
                      aria-label="主人公プロフィール"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                  </Label>
                )}
              </form.Field>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateAiHero}
                  disabled={heroRecommendation.isPending}
                >
                  {heroRecommendation.isPending ? 'AIが主人公を推薦しています…' : 'AIに主人公を生成してもらう'}
                </Button>
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
            <Button type="submit" variant="primary" size="lg" className="shadow-myr-card">
              開始内容を確認
            </Button>
          </div>
        </form>
      </section>

      <MyrialeDialogRoot open={reviewOpen} onOpenChange={setReviewOpen}>
        <MyrialeDialogContent
          title="開始前の最終確認"
          description="Scenarioと主人公を確認してから物語を開始します。"
          size="wide"
          portal={false}
          data-testid="start-review-dialog"
          footer={(
            <>
              <Button variant="ghost" onClick={() => setReviewOpen(false)}>
                主人公選択を修正
              </Button>
              {requiresLogin ? (
                <Button variant="secondary" onClick={onLogin}>
                  ログインへ
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => void beginStory()} disabled={isBeginning}>
                  {isBeginning ? 'Sessionを作成しています…' : '物語を始める'}
                </Button>
              )}
            </>
          )}
        >
          {beginError && <p className="m-0 mb-4 text-sm font-bold text-myr-ruby" role="alert">{beginError}</p>}
          <ArchiveCard as="article" className="!bg-white/65" data-testid="start-summary">
            <Label textRole="eyebrowData" className="!tracking-[0.08em]">Session snapshot</Label>
            <Label as="h2" textRole="section" className="my-2 !text-3xl">{scenario.title}</Label>
            <p className="my-2 text-sm text-myr-slate">Scenario: {scenario.title}</p>
            {canConfigureInterpretation && (
              <p className="my-2 text-sm text-myr-slate">
                解釈説明: {interpretationEnabled ? '有効（デバッグ）' : '無効'}
              </p>
            )}
            <p className="my-2 text-sm text-myr-slate">主人公: {heroForSummary}</p>
          </ArchiveCard>
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
            <Button variant="secondary" size="lg" onClick={backToScenarioList}>
              シナリオ一覧へ
            </Button>
          </section>
        </main>
      </AppChrome>
    );
  }

  return (
    <AppChrome section="sessions" breadcrumbs={sessionCrumbs} account={chromeAccount} onLogout={logout}>
      <PageCanvas data-myriale-theme="archive">
        <PageShell width="focused" aria-label="セッション開始アプリ画面">
          <header className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-myr-ink/15 pb-5 md:flex-row">
            <div>
              <Label as="p" textRole="eyebrow" className="mb-2">
                Session Start / Scenario to play
              </Label>
              <Label
                as="h1"
                textRole="display"
                className="m-0 max-w-myr-section"
                data-testid="selected-scenario-title"
              >
                {selectedScenario.title}
              </Label>
            </div>
            <Button variant="text" onClick={backToScenarioList}>
              シナリオ一覧へ戻る
            </Button>
          </header>

          <section
            className="overflow-hidden rounded-myr-card bg-white/45 px-5 shadow-myr-card md:px-8 [&_.myr-ui-field]:mb-5 [&_.myr-ui-field>label]:!text-xs [&_.myr-ui-field>label]:!font-black [&_.myr-ui-field>label]:!tracking-myr-label [&_.myr-ui-field>label]:!text-myr-slate [&_.myr-ui-select-trigger]:!rounded-none [&_.myr-ui-select-trigger]:!border-x-0 [&_.myr-ui-select-trigger]:!border-t-0 [&_.myr-ui-select-trigger]:!border-b-2 [&_.myr-ui-select-trigger]:!border-myr-ink/20 [&_.myr-ui-select-trigger]:!bg-white/45"
            aria-label="イントロと主人公選択"
          >
            <section className="relative py-7 md:py-9" aria-label="イントロNarrative">
              <Label as="p" textRole="eyebrowData" className="mb-3">
                Opening narrative
              </Label>
              <article className="relative pr-4 before:pointer-events-none before:absolute before:-top-8 before:right-0 before:font-myr-display before:text-8xl before:text-myr-iris/10 before:content-['✦']" data-testid="intro-narrative">
                <p className="relative z-10 m-0 max-w-200 font-myr-display text-[clamp(1.25rem,2.5vw,1.75rem)] leading-[1.65] tracking-[-0.025em]">
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
        </PageShell>
      </PageCanvas>
    </AppChrome>
  );
}
