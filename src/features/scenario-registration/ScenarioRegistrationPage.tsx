import { useMemo, useState } from 'react';
import { ScenarioProgressControls } from '../../ScenarioProgressControls';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { WizardNavigation } from '../../shared/WizardNavigation';
import { MyrialeSelect } from '../../ui/MyrialeRadix';
import { createFetchScenarioApi, firstScenarioFieldError, type ScenarioAiAssistResponse, type ScenarioAiKind, type ScenarioApi, type ScenarioApiError } from '../../app/scenarioApi';
import { useOptionalAppStore } from '../../app/store';

type SuggestionKind = '概要' | '世界観' | '挿絵テイスト' | '挿絵プロンプト';
type WizardStep =
  | 'cover'
  | 'lore'
  | 'ai'
  | 'asCast'
  | 'asLocations'
  | 'asBeats'
  | 'asSecrets'
  | 'asEvents'
  | 'asDebug'
  | 'asTest'
  | 'hero'
  | 'opening'
  | 'illustration';

const wizardSteps: Array<{ id: WizardStep; label: string; help: string }> = [
  { id: 'cover', label: '表紙', help: 'Draft保存のための最小入力' },
  { id: 'lore', label: '世界の掟', help: 'ジャンル、雰囲気、Lore' },
  { id: 'ai', label: 'AI裁量', help: 'AIが広げてよい範囲' },
  { id: 'asCast', label: 'Cast候補', help: 'US-AS01: AIが使ってよい人物候補' },
  { id: 'asLocations', label: 'Location候補', help: 'US-AS02: 場所候補とアクセス条件' },
  { id: 'asBeats', label: 'Chapter / Beat', help: 'US-AS03/04: 章・ビート・条件・禁止事項' },
  { id: 'asSecrets', label: 'HiddenBrief', help: 'US-AS05/06: 非公開情報と公開条件' },
  { id: 'asEvents', label: '強制イベント', help: 'US-AS10: 条件付きイベント' },
  { id: 'asDebug', label: '進行デバッグ', help: 'US-AS07/08/09/12: 補正と参照情報' },
  { id: 'asTest', label: 'テスト実行', help: 'US-AS11: 任意ビートから検証' },
  { id: 'hero', label: '主人公', help: '初期キャラクター条件' },
  { id: 'opening', label: '第一場面', help: '最初のNarrativeの固定' },
  { id: 'illustration', label: '挿絵', help: '画風、NG、プレビュー' },
];


type AdvancedPanelId = 'cast' | 'locations' | 'beats' | 'secrets' | 'events' | 'debug' | 'test';

function RegistrationAdvancedStep({ panel, help }: { panel: AdvancedPanelId; help: string }) {
  return (
    <section className="wizard-panel" aria-label={help}>
      <ScenarioProgressControls initialPanel={panel} />
    </section>
  );
}

export function ScenarioRegistrationPage({ api }: { api?: ScenarioApi } = {}) {
  const store = useOptionalAppStore();
  const scenarioApi = useMemo(() => api ?? createFetchScenarioApi(), [api]);
  const [activeStep, setActiveStep] = useState<WizardStep>('cover');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [genre, setGenre] = useState('ダークファンタジー');
  const [tone, setTone] = useState('静かで不穏');
  const [lore, setLore] = useState('星座は魔法体系の鍵。\n死者の名前を読むと記憶を失う。');
  const [aiFreedom, setAiFreedom] = useState('中: 設定を守りつつ提案する');
  const [heroMode, setHeroMode] = useState<'fixed' | 'select' | 'free'>('free');
  const [heroFreeGenerationAllowed, setHeroFreeGenerationAllowed] = useState(false);
  const [hero, setHero] = useState('禁書司書の見習い。名前やプロフィールはセッション開始時に入力。');
  const [opening, setOpening] = useState('あなたは水没した閲覧室で目を覚ます。');
  const [illustrationStyle, setIllustrationStyle] = useState('銅版画風 / 低彩度 / 細密');
  const [mood, setMood] = useState('孤独、湿った静けさ、薄い金色の灯り');
  const [negative, setNegative] = useState('現代車両、銃器、過度な流血');
  const [sampleScene, setSampleScene] = useState('水没した閲覧室で、星図を抱えた司書が振り向く。');
  const [scenarioId, setScenarioId] = useState('未発行');
  const [notice, setNotice] = useState('タイトルだけで下書き保存できます。');
  const [saveError, setSaveError] = useState<ScenarioApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiTarget, setAiTarget] = useState('文章AI');
  const [suggestion, setSuggestion] = useState('AIの提案は、採用するまで本文に反映されません。');
  const [lastAiResponse, setLastAiResponse] = useState<ScenarioAiAssistResponse | null>(null);
  const [aiWorking, setAiWorking] = useState(false);
  const [preview, setPreview] = useState('プレビュー未生成');

  const currentIndex = wizardSteps.findIndex((step) => step.id === activeStep);
  const currentStep = wizardSteps[currentIndex];

  const saveDraft = async () => {
    setSaveError(null);
    if (!title.trim()) {
      setNotice('タイトルを入力すると下書き保存できます。');
      return;
    }

    setSaving(true);
    try {
      const draft = await scenarioApi.createScenario({
        title,
        summary,
        genre,
        tone,
        lore,
        aiFreedom,
        heroMode,
        heroFreeGenerationAllowed,
        hero,
        opening,
        illustrationStyle,
        illustrationMood: mood,
        illustrationNegative: negative,
        sampleScene,
      });
      setScenarioId(draft.id);
      store?.dispatch({
        type: 'SCENARIO_SAVED',
        scenario: {
          id: draft.id,
          title: draft.title,
          status: 'draft',
          genre: draft.genre,
          updatedAt: draft.updatedAt,
          summary: draft.summary,
          tone: draft.tone,
          lore: draft.lore,
          aiFreedom: draft.aiFreedom,
          heroMode: draft.heroMode,
          heroFreeGenerationAllowed: draft.heroFreeGenerationAllowed,
          hero: draft.hero,
          opening: draft.opening,
          illustrationStyle: draft.illustrationStyle,
          illustrationMood: draft.illustrationMood,
          illustrationNegative: draft.illustrationNegative,
          sampleScene: draft.sampleScene,
        },
      });
      setNotice(`「${draft.title}」をDraftとして保存しました。ScenarioIdを発行しました。`);
    } catch (caught) {
      const error = caught as ScenarioApiError;
      setSaveError(error);
      setNotice(error.errors?.title?.[0] ?? error.message ?? 'シナリオを保存できませんでした。');
    } finally {
      setSaving(false);
    }
  };

  const aiContext = (kind: ScenarioAiKind) => ({
    kind,
    target: aiTarget,
    title,
    summary,
    genre,
    tone,
    lore,
    aiFreedom,
    heroMode,
    heroFreeGenerationAllowed,
    hero,
    opening,
    illustrationStyle,
    illustrationMood: mood,
    illustrationNegative: negative,
    sampleScene,
  });

  const kindFor = (kind: SuggestionKind): ScenarioAiKind => {
    if (kind === '概要') return 'summary';
    if (kind === '世界観') return 'lore-check';
    if (kind === '挿絵テイスト') return 'illustration-style';
    return 'illustration-prompt';
  };

  const consultAi = async (kind: SuggestionKind) => {
    setAiWorking(true);
    try {
      const response = await scenarioApi.assistScenario(aiContext(kindFor(kind)));
      setLastAiResponse(response);
      const first = response.suggestions[0]?.body;
      setSuggestion(first ? `${response.message}\n${first}` : response.message);
      if (response.prompt) setSampleScene(response.prompt);
      setNotice(`${aiTarget}に${kind}を相談しました。モックAIの提案は自動確定はしません。`);
    } catch (caught) {
      const error = caught as ScenarioApiError;
      setNotice(error.message ?? 'AI補助を実行できませんでした。');
    } finally {
      setAiWorking(false);
    }
  };

  const adoptSummary = () => {
    const nextSummary = lastAiResponse?.suggestions[0]?.body ?? '地下に沈んだ王都で、禁書を読むたびに星座が書き換わる探索譚。';
    setSummary(nextSummary);
    setNotice('AIの概要案を本文へ採用しました。編集してから保存できます。');
  };

  const generatePreview = async () => {
    setAiWorking(true);
    try {
      const response = await scenarioApi.assistScenario(aiContext('illustration-preview'));
      setLastAiResponse(response);
      setPreview(response.previewText ?? 'モックAIがプレビューを生成しました（保存対象外）。');
      setNotice('サンプルシーンで挿絵をプレビューしました。設定はまだ確定していません。');
    } catch (caught) {
      const error = caught as ScenarioApiError;
      setNotice(error.message ?? 'プレビューを生成できませんでした。');
    } finally {
      setAiWorking(false);
    }
  };
  const statusFor = (step: WizardStep) => {
    if (step === 'cover') return title ? '保存候補' : '未入力';
    if (step === 'lore') return lore ? '入力済み' : '未入力';
    if (step === 'ai') return aiFreedom;
    if (step.startsWith('as')) return 'US-AS';
    if (step === 'hero') return heroMode === 'fixed' ? '固定' : heroMode === 'select' ? '選択式' : '自由生成';
    if (step === 'opening') return opening ? '固定' : 'AI生成';
    return illustrationStyle ? '入力済み' : '未入力';
  };

  const move = (direction: 1 | -1) => {
    const next = wizardSteps[currentIndex + direction];
    if (next) setActiveStep(next.id);
  };

  const scenarioCrumbs: Crumb[] = [
    { label: 'Myriale', to: 'scenarioRegister' },
    { label: 'ライブラリ', to: 'scenarioRegister' },
    { label: 'シナリオを登録' },
  ];

  return (
    <AppChrome
      section="library"
      breadcrumbs={scenarioCrumbs}
      account={{ name: '霧野しおり', email: 'author@myriale.example', initials: '霧野', role: '作者' }}
    >
      <div className="scenario-forge scenario-forge-wizard">
      <WizardNavigation
        title="契約の背表紙"
        ariaLabel="登録ウィザードのステップ"
        items={wizardSteps.map((step, index) => ({
          id: step.id,
          label: `${String(index + 1).padStart(2, '0')} / ${step.label}`,
          meta: statusFor(step.id),
          ariaLabel: `${step.label}へ`,
        }))}
        activeId={activeStep}
        onSelect={(id) => setActiveStep(id as WizardStep)}
        markerLabel="ScenarioId"
        markerValue={scenarioId}
      />

      <main className="forge-paper wizard-paper" aria-label="シナリオ登録ウィザード">
        <p className="kicker">Scenario Forge / Wizard registration</p>
        <div className="notice" role="status" data-testid="scenario-notice">{notice}</div>

        <div className="wizard-progress" aria-label="ウィザード進捗">
          <span>{String(currentIndex + 1).padStart(2, '0')}</span>
          <strong>{currentStep.label}</strong>
        </div>

        {activeStep === 'cover' && (
          <section className="wizard-panel" aria-label="表紙">
            <p><strong>{currentStep.help}。</strong>シナリオは未完成で保存できます。最初はタイトルだけでDraftを作り、あとから設定を足します。</p>
            <label>シナリオタイトル *<input aria-label="シナリオタイトル" aria-invalid={firstScenarioFieldError(saveError, 'title') ? true : undefined} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="星喰いの地下図書館" /></label>
            <label>概要（空でも保存できます）<textarea aria-label="概要" aria-invalid={firstScenarioFieldError(saveError, 'summary') ? true : undefined} value={summary} onChange={(event) => setSummary(event.target.value)} /></label>
            <div className="button-row"><button className="primary" onClick={saveDraft} disabled={saving}>{saving ? '保存中…' : '下書き保存'}</button><button onClick={() => void consultAi('概要')} disabled={aiWorking}>AIに概要案を出してもらう</button><button onClick={adoptSummary}>採用して編集</button></div>
          </section>
        )}

        {activeStep === 'lore' && (
          <section className="wizard-panel" aria-label="世界の掟">
            <p><strong>{currentStep.help}。</strong>ジャンル、雰囲気、Loreは文章AIと挿絵AIが共通して読む契約です。</p>
            <label>ジャンル<input aria-label="ジャンル" value={genre} onChange={(event) => setGenre(event.target.value)} /></label>
            <label>雰囲気<input aria-label="雰囲気" value={tone} onChange={(event) => setTone(event.target.value)} /></label>
            <label>Lore<textarea aria-label="世界観やルール" value={lore} onChange={(event) => setLore(event.target.value)} /></label>
            <button onClick={() => void consultAi('世界観')} disabled={aiWorking}>矛盾をチェック</button>
          </section>
        )}

        {activeStep === 'ai' && (
          <section className="wizard-panel" aria-label="AI裁量">
            <p><strong>{currentStep.help}。</strong>物語が暴走しない範囲と、AIに展開を広げてもらう範囲を明示します。</p>
            <MyrialeSelect
              label="AI裁量"
              value={aiFreedom}
              onValueChange={setAiFreedom}
              options={[
                { value: '低: 厳密に守る', label: '低: 厳密に守る' },
                { value: '中: 設定を守りつつ提案する', label: '中: 設定を守りつつ提案する' },
                { value: '高: 展開を広げる', label: '高: 展開を広げる' },
              ]}
            />
          </section>
        )}

        {activeStep === 'asCast' && <RegistrationAdvancedStep panel="cast" help={currentStep.help} />}
        {activeStep === 'asLocations' && <RegistrationAdvancedStep panel="locations" help={currentStep.help} />}
        {activeStep === 'asBeats' && <RegistrationAdvancedStep panel="beats" help={currentStep.help} />}
        {activeStep === 'asSecrets' && <RegistrationAdvancedStep panel="secrets" help={currentStep.help} />}
        {activeStep === 'asEvents' && <RegistrationAdvancedStep panel="events" help={currentStep.help} />}
        {activeStep === 'asDebug' && <RegistrationAdvancedStep panel="debug" help={currentStep.help} />}
        {activeStep === 'asTest' && <RegistrationAdvancedStep panel="test" help={currentStep.help} />}

        {activeStep === 'hero' && (
          <section className="wizard-panel" aria-label="主人公">
            <p><strong>{currentStep.help}。</strong>主人公を固定するか、候補から選べるようにするか、プレイヤーの自由生成を許可するかを設定します。</p>
            <MyrialeSelect
              label="主人公の扱い"
              value={heroMode}
              onValueChange={(value) => setHeroMode(value as 'fixed' | 'select' | 'free')}
              options={[
                { value: 'fixed', label: '固定キャラクター' },
                { value: 'select', label: '候補キャラクターから選択' },
                { value: 'free', label: '自由生成のみ' },
              ]}
            />
            {heroMode === 'select' && (
              <label className="choice-row">
                <span>候補選択に加えて自由生成を許可</span>
                <input
                  type="checkbox"
                  aria-label="自由生成を許可"
                  checked={heroFreeGenerationAllowed}
                  onChange={(event) => setHeroFreeGenerationAllowed(event.target.checked)}
                />
              </label>
            )}
            <label>
              {heroMode === 'fixed' ? '固定する主人公' : heroMode === 'select' ? '候補キャラクター（1行に1人）' : '自由生成時の前提・制約'}
              <textarea aria-label="主人公の設定" value={hero} onChange={(event) => setHero(event.target.value)} />
            </label>
          </section>
        )}

        {activeStep === 'opening' && (
          <section className="wizard-panel" aria-label="第一場面">
            <p><strong>{currentStep.help}。</strong>開始シーンを固定すると、毎回同じ導入から物語を始められます。未入力ならAI生成です。</p>
            <label>開始シーン<textarea aria-label="開始シーン" value={opening} onChange={(event) => setOpening(event.target.value)} /></label>
          </section>
        )}

        {activeStep === 'illustration' && (
          <section className="wizard-panel" aria-label="挿絵の筆致">
            <p><strong>{currentStep.help}。</strong>テイスト、ムード、禁止要素を登録し、本番前に保存されないプレビューで確認します。</p>
            <label>画風<input aria-label="挿絵の画風" value={illustrationStyle} onChange={(event) => setIllustrationStyle(event.target.value)} /></label>
            <label>ムード<input aria-label="挿絵のムード" value={mood} onChange={(event) => setMood(event.target.value)} /></label>
            <label>NG要素<textarea aria-label="挿絵の禁止要素" value={negative} onChange={(event) => setNegative(event.target.value)} /></label>
            <label>サンプルシーン<textarea aria-label="サンプルシーン" value={sampleScene} onChange={(event) => setSampleScene(event.target.value)} /></label>
            <div className="button-row"><button onClick={() => void consultAi('挿絵テイスト')} disabled={aiWorking}>画風を相談</button><button onClick={() => void consultAi('挿絵プロンプト')} disabled={aiWorking}>プロンプトを生成</button><button className="primary" onClick={() => void generatePreview()} disabled={aiWorking}>サンプルシーンで生成</button></div>
          </section>
        )}

        <nav className="wizard-actions" aria-label="ウィザード操作">
          <button onClick={() => move(-1)} disabled={currentIndex === 0}>戻る</button>
          <button className="primary" onClick={() => move(1)} disabled={currentIndex === wizardSteps.length - 1}>次へ</button>
        </nav>
      </main>

      <aside className="ai-bookmark wizard-summary" aria-label="入力サマリー">
        <h2>サマリー</h2>
        <MyrialeSelect
          label="相談先AI"
          value={aiTarget}
          onValueChange={setAiTarget}
          options={[
            { value: '文章AI', label: '文章AI' },
            { value: '挿絵AI', label: '挿絵AI' },
            { value: 'ルール確認AI', label: 'ルール確認AI' },
          ]}
        />
        <article><h3>表紙</h3><p>{title || 'タイトル未入力'}</p><p>{summary || '概要は空でも保存できます'}</p></article>
        <article><h3>この登録でAIが読む契約</h3><p>Genre: {genre}</p><p>Tone: {tone}</p><p>Lore: {lore.split('\n').filter(Boolean).length}項目</p><p>AI裁量: {aiFreedom}</p></article>
        {activeStep.startsWith('as') && (
          <article data-testid="advanced-summary"><h3>進行制御</h3><p>{currentStep.label}</p><p>{currentStep.help}</p></article>
        )}
        <article><h3>主人公と第一場面</h3><p>{hero}</p><p>{opening}</p></article>
        <article><h3>挿絵</h3><p>{illustrationStyle}</p><p>NG: {negative}</p></article>
        <article data-testid="ai-suggestion"><h3>提案候補</h3><p>{suggestion}</p></article>
        <article data-testid="illustration-preview"><h3>挿絵プレビュー</h3><p>{preview}</p></article>
      </aside>
    </div>
    </AppChrome>
  );
}
