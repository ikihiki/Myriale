import { useState } from 'react';
import { ArchiveCard, Button, Input, Label, PageCanvas, PageShell, Textarea } from '../../components/ui';
import { useForm, useStore } from '@tanstack/react-form';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { MyrialeDialogContent, MyrialeDialogRoot, MyrialeSelect } from '../../ui/MyrialeRadix';
import type { ScenarioSummary } from './scenarioPresentation';
import type { StartSessionPresentationProps } from './startSessionModel';

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

function ProtagonistForm({
  scenario,
  onBeginStory,
  onRecommendHero,
  isBeginning,
  isRecommending,
  onLogin,
  canConfigureInterpretation,
  interpretationEnabled,
  onInterpretationEnabledChange,
}: {
  scenario: ScenarioSummary;
  onBeginStory: (selectedHero: string, interpretationEnabled: boolean) => Promise<import('./startSessionModel').StartSessionCommandResult>;
  onRecommendHero: StartSessionPresentationProps['onRecommendHero'];
  isBeginning: boolean;
  isRecommending: boolean;
  onLogin: () => void;
  canConfigureInterpretation: boolean;
  interpretationEnabled: boolean;
  onInterpretationEnabledChange: (enabled: boolean) => void;
}) {
  const heroCandidates = scenario.hero.split('\n').map((candidate) => candidate.trim()).filter(Boolean);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [beginError, setBeginError] = useState('');
  const [requiresLogin, setRequiresLogin] = useState(false);
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
  const formValues = useStore(form.store, (state) => state.values);
  const heroInputMode = scenario.heroMode === 'free' || formValues.heroSelection === FREE_GENERATION_OPTION
    ? 'free'
    : 'select';
  const heroForSummary = scenario.heroMode === 'fixed'
    ? scenario.hero
    : heroInputMode === 'free'
      ? `${formValues.createdName} / ${formValues.createdProfile}`
      : formValues.heroSelection;

  const generateAiHero = async () => {
    setAiSuggestion('');
    const result = await onRecommendHero({
      name: form.state.values.createdName,
      profile: form.state.values.createdProfile,
    });
    if (result.ok && result.value) {
      form.setFieldValue('createdName', result.value.name);
      form.setFieldValue('createdProfile', result.value.profile);
      setAiSuggestion(result.message ?? 'AI案を入力欄へ反映しました。確認・修正してから確定してください。');
    } else {
      setAiSuggestion(result.message ?? '主人公案を取得できませんでした。');
    }
  };

  const beginStory = async () => {
    setBeginError('');
    setRequiresLogin(false);
    const result = await onBeginStory(heroForSummary, interpretationEnabled);
    if (!result.ok) {
      setBeginError(result.message ?? 'Sessionを開始できませんでした。');
      setRequiresLogin(result.requiresLogin === true);
    }
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
                  onClick={() => void generateAiHero()}
                  disabled={isRecommending}
                >
                  {isRecommending ? 'AIが主人公を推薦しています…' : 'AIに主人公を生成してもらう'}
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

export function StartSessionPresentation({
  account,
  scenario,
  status,
  loadError,
  canConfigureInterpretation,
  isBeginning,
  isRecommending,
  onLogout,
  onLogin,
  onScenarioList,
  onRecommendHero,
  onBeginStory,
}: StartSessionPresentationProps) {
  const [interpretationEnabled, setInterpretationEnabled] = useState(false);
  const sessionCrumbs: Crumb[] = [
    { label: 'Myriale', to: 'home' },
    { label: 'セッション', to: 'scenarioList' },
    { label: 'セッション開始' },
  ];

  if (status === 'loading') {
    return (
      <AppChrome section="sessions" breadcrumbs={sessionCrumbs} account={account} onLogout={onLogout}>
        <main className="grid min-h-[calc(100vh-118px)] place-items-center bg-[image:var(--myr-screen-background)] p-6 text-myr-ink">
          <p className="rounded-full bg-myr-paper px-5 py-3 font-black shadow-myr-card" role="status">シナリオを読み込んでいます。</p>
        </main>
      </AppChrome>
    );
  }

  if (status === 'error' || !scenario) {
    return (
      <AppChrome section="sessions" breadcrumbs={sessionCrumbs} account={account} onLogout={onLogout}>
        <main className="grid min-h-[calc(100vh-118px)] place-items-center bg-[image:var(--myr-screen-background)] p-6 text-myr-ink">
          <section className="max-w-xl rounded-myr-panel bg-myr-paper p-8 text-center shadow-myr-panel" aria-label="シナリオ読み込みエラー">
            <h1 className="font-myr-display text-4xl">シナリオを読み込めませんでした</h1>
            <p className="my-4 text-myr-slate">{loadError ?? '指定されたシナリオが見つかりません。シナリオ一覧から選び直してください。'}</p>
            <Button variant="secondary" size="lg" onClick={onScenarioList}>
              シナリオ一覧へ
            </Button>
          </section>
        </main>
      </AppChrome>
    );
  }

  return (
    <AppChrome section="sessions" breadcrumbs={sessionCrumbs} account={account} onLogout={onLogout}>
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
                {scenario.title}
              </Label>
            </div>
            <Button variant="text" onClick={onScenarioList}>
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
                  {scenario.opening}
                </p>
              </article>
            </section>

            <ProtagonistForm
              scenario={scenario}
              onBeginStory={onBeginStory}
              onRecommendHero={onRecommendHero}
              isBeginning={isBeginning}
              isRecommending={isRecommending}
              onLogin={onLogin}
              canConfigureInterpretation={canConfigureInterpretation}
              interpretationEnabled={interpretationEnabled}
              onInterpretationEnabledChange={setInterpretationEnabled}
            />
          </section>
        </PageShell>
      </PageCanvas>
    </AppChrome>
  );
}
