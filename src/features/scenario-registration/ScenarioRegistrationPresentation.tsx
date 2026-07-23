import { useState } from 'react';
import type { ScenarioAiAssistResponse, ScenarioAiKind } from '../../app/scenarioApi';
import { Button, Input, Label, Notice, SummaryCard, SummaryInset, Textarea } from '../../components/ui';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { WizardNavigation } from '../../shared/WizardNavigation';
import {
  illustrationWizardPanelClass,
  scenarioWizardShellClass,
  wizardActionsClass,
  wizardButtonRowClass,
  wizardKickerClass,
  wizardNoticeClass,
  wizardPanelClass,
  wizardPaperClass,
  wizardProgressClass,
  wizardSummaryClass,
} from '../../shared/scenarioWizardStyles';
import { MyrialeSelect } from '../../ui/MyrialeRadix';
import {
  firstScenarioFieldError,
  initialScenarioRegistrationValues,
  type ScenarioRegistrationActions,
  type ScenarioRegistrationValues,
} from './scenarioRegistrationModel';

type SuggestionKind = '概要' | '世界観' | '挿絵テイスト' | '挿絵プロンプト';
type WizardStep = 'cover' | 'lore' | 'ai' | 'hero' | 'opening' | 'illustration';

const wizardSteps: Array<{ id: WizardStep; label: string; help: string }> = [
  { id: 'cover', label: '表紙', help: 'Draft保存のための最小入力' },
  { id: 'lore', label: '世界の掟', help: 'ジャンル、雰囲気、Lore' },
  { id: 'ai', label: 'AI裁量', help: 'AIが広げてよい範囲' },
  { id: 'hero', label: '主人公', help: '初期キャラクター条件' },
  { id: 'opening', label: '第一場面', help: '最初のNarrativeの固定' },
  { id: 'illustration', label: '挿絵', help: '画風、NG、プレビュー' },
];

const scenarioCrumbs: Crumb[] = [
  { label: 'Myriale', to: 'scenarioRegister' },
  { label: 'ライブラリ', to: 'scenarioRegister' },
  { label: 'シナリオを登録' },
];

type Props = {
  account: { name: string; email: string; initials: string; role?: string } | null;
  scenarioId: string;
  saving: boolean;
  aiWorking: boolean;
  actions: ScenarioRegistrationActions;
  onLogout: () => void | Promise<void>;
};

export function ScenarioRegistrationPresentation({
  account,
  scenarioId,
  saving,
  aiWorking,
  actions,
  onLogout,
}: Props) {
  const [activeStep, setActiveStep] = useState<WizardStep>('cover');
  const [values, setValues] = useState<ScenarioRegistrationValues>(initialScenarioRegistrationValues);
  const [notice, setNotice] = useState('タイトルだけで下書き保存できます。');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();
  const [aiTarget, setAiTarget] = useState('文章AI');
  const [suggestion, setSuggestion] = useState('AIの提案は、採用するまで本文に反映されません。');
  const [lastAiResponse, setLastAiResponse] = useState<ScenarioAiAssistResponse | null>(null);
  const [preview, setPreview] = useState('プレビュー未生成');

  const currentIndex = wizardSteps.findIndex((step) => step.id === activeStep);
  const currentStep = wizardSteps[currentIndex];
  const update = <K extends keyof ScenarioRegistrationValues>(key: K, value: ScenarioRegistrationValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const saveDraft = async () => {
    setFieldErrors(undefined);
    const result = await actions.saveDraft(values);
    setNotice(result.message);
    if (!result.ok) setFieldErrors(result.fieldErrors);
  };

  const kindFor = (kind: SuggestionKind): ScenarioAiKind => {
    if (kind === '概要') return 'summary';
    if (kind === '世界観') return 'lore-check';
    if (kind === '挿絵テイスト') return 'illustration-style';
    return 'illustration-prompt';
  };

  const consultAi = async (kind: SuggestionKind) => {
    const result = await actions.assist(values, kindFor(kind), aiTarget);
    if (!result.ok || !result.value) {
      setNotice(result.message);
      return;
    }
    setLastAiResponse(result.value);
    const first = result.value.suggestions[0]?.body;
    setSuggestion(first ? `${result.value.message}\n${first}` : result.value.message);
    if (result.value.prompt) update('sampleScene', result.value.prompt);
    setNotice(`${aiTarget}に${kind}を相談しました。AIの提案は自動確定はしません。`);
  };

  const adoptSummary = () => {
    const nextSummary = lastAiResponse?.suggestions[0]?.body ?? '地下に沈んだ王都で、禁書を読むたびに星座が書き換わる探索譚。';
    update('summary', nextSummary);
    setNotice('AIの概要案を本文へ採用しました。編集してから保存できます。');
  };

  const generatePreview = async () => {
    const result = await actions.assist(values, 'illustration-preview', aiTarget);
    if (!result.ok || !result.value) {
      setNotice(result.message);
      return;
    }
    setLastAiResponse(result.value);
    setPreview(result.value.previewText ?? 'AIがプレビューを生成しました（保存対象外）。');
    setNotice('サンプルシーンで挿絵をプレビューしました。設定はまだ確定していません。');
  };

  const statusFor = (step: WizardStep) => {
    if (step === 'cover') return values.title ? '保存候補' : '未入力';
    if (step === 'lore') return values.lore ? '入力済み' : '未入力';
    if (step === 'ai') return values.aiFreedom;
    if (step === 'hero') return values.heroMode === 'fixed' ? '固定' : values.heroMode === 'select' ? '選択式' : '自由生成';
    if (step === 'opening') return values.opening ? '固定' : 'AI生成';
    return values.illustrationStyle ? '入力済み' : '未入力';
  };

  const move = (direction: 1 | -1) => {
    const next = wizardSteps[currentIndex + direction];
    if (next) setActiveStep(next.id);
  };

  return (
    <AppChrome section="library" breadcrumbs={scenarioCrumbs} account={account} onLogout={onLogout}>
      <div className={scenarioWizardShellClass}>
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

        <main className={wizardPaperClass} aria-label="シナリオ登録ウィザード">
          <Label as="p" textRole="eyebrow" className={wizardKickerClass}>Scenario Forge / API registration</Label>
          <Notice className={wizardNoticeClass} tone={fieldErrors ? 'danger' : 'info'} data-testid="scenario-notice">{notice}</Notice>

          <div className={wizardProgressClass} aria-label="ウィザード進捗">
            <span>{String(currentIndex + 1).padStart(2, '0')}</span>
            <strong>{currentStep.label}</strong>
          </div>

          {activeStep === 'cover' && (
            <section className={wizardPanelClass} aria-label="表紙">
              <p><strong>{currentStep.help}。</strong>シナリオAPIへ保存する基本情報です。タイトルだけでDraftを作り、ほかの項目はあとから編集できます。</p>
              <label>シナリオタイトル *<Input aria-label="シナリオタイトル" aria-invalid={firstScenarioFieldError(fieldErrors, 'title') ? true : undefined} value={values.title} onChange={(event) => update('title', event.target.value)} placeholder="星喰いの地下図書館" /></label>
              <label>概要（空でも保存できます）<Textarea aria-label="概要" aria-invalid={firstScenarioFieldError(fieldErrors, 'summary') ? true : undefined} value={values.summary} onChange={(event) => update('summary', event.target.value)} /></label>
              <div className={wizardButtonRowClass}><Button variant="primary" size="sm" onClick={() => void saveDraft()} disabled={saving}>{saving ? '保存中…' : '下書き保存'}</Button><Button variant="secondary" size="sm" onClick={() => void consultAi('概要')} disabled={aiWorking}>AIに概要案を出してもらう</Button><Button variant="secondary" size="sm" onClick={adoptSummary}>採用して編集</Button></div>
            </section>
          )}

          {activeStep === 'lore' && (
            <section className={wizardPanelClass} aria-label="世界の掟">
              <p><strong>{currentStep.help}。</strong>ジャンル、雰囲気、LoreはシナリオAPIに保存され、文章AIと挿絵AIが共通して参照します。</p>
              <label>ジャンル<Input aria-label="ジャンル" value={values.genre} onChange={(event) => update('genre', event.target.value)} /></label>
              <label>雰囲気<Input aria-label="雰囲気" value={values.tone} onChange={(event) => update('tone', event.target.value)} /></label>
              <label>Lore<Textarea aria-label="世界観やルール" value={values.lore} onChange={(event) => update('lore', event.target.value)} /></label>
              <Button variant="secondary" size="sm" onClick={() => void consultAi('世界観')} disabled={aiWorking}>矛盾をチェック</Button>
            </section>
          )}

          {activeStep === 'ai' && (
            <section className={wizardPanelClass} aria-label="AI裁量">
              <p><strong>{currentStep.help}。</strong>Narrative生成時にAPIへ渡す裁量レベルを指定します。</p>
              <MyrialeSelect label="AI裁量" value={values.aiFreedom} onValueChange={(value) => update('aiFreedom', value)} options={[
                { value: '低: 厳密に守る', label: '低: 厳密に守る' },
                { value: '中: 設定を守りつつ提案する', label: '中: 設定を守りつつ提案する' },
                { value: '高: 展開を広げる', label: '高: 展開を広げる' },
              ]} />
            </section>
          )}

          {activeStep === 'hero' && (
            <section className={wizardPanelClass} aria-label="主人公">
              <p><strong>{currentStep.help}。</strong>シナリオAPIへ保存する主人公の選択方式と初期条件です。</p>
              <MyrialeSelect label="主人公の扱い" value={values.heroMode} onValueChange={(value) => update('heroMode', value as ScenarioRegistrationValues['heroMode'])} options={[
                { value: 'fixed', label: '固定キャラクター' },
                { value: 'select', label: '候補キャラクターから選択' },
                { value: 'free', label: '自由生成のみ' },
              ]} />
              {values.heroMode === 'select' && (
                <label className="my-3 grid grid-cols-[1fr_auto] items-center gap-2 text-xs font-black text-myr-slate-muted [&_input]:size-4">
                  <span>候補選択に加えて自由生成を許可</span>
                  <input type="checkbox" aria-label="自由生成を許可" checked={values.heroFreeGenerationAllowed} onChange={(event) => update('heroFreeGenerationAllowed', event.target.checked)} />
                </label>
              )}
              <label>{values.heroMode === 'fixed' ? '固定する主人公' : values.heroMode === 'select' ? '候補キャラクター（1行に1人）' : '自由生成時の前提・制約'}<Textarea aria-label="主人公の設定" value={values.hero} onChange={(event) => update('hero', event.target.value)} /></label>
            </section>
          )}

          {activeStep === 'opening' && (
            <section className={wizardPanelClass} aria-label="第一場面">
              <p><strong>{currentStep.help}。</strong>開始シーンをAPIへ保存します。未入力の場合はセッション開始時にAIが生成します。</p>
              <label>開始シーン<Textarea aria-label="開始シーン" value={values.opening} onChange={(event) => update('opening', event.target.value)} /></label>
            </section>
          )}

          {activeStep === 'illustration' && (
            <section className={illustrationWizardPanelClass} aria-label="挿絵の筆致">
              <p><strong>{currentStep.help}。</strong>シナリオAPIへ保存する画風、ムード、禁止要素を設定し、保存対象外のプレビューで確認します。</p>
              <label>画風<Input aria-label="挿絵の画風" value={values.illustrationStyle} onChange={(event) => update('illustrationStyle', event.target.value)} /></label>
              <label>ムード<Input aria-label="挿絵のムード" value={values.illustrationMood} onChange={(event) => update('illustrationMood', event.target.value)} /></label>
              <label>NG要素<Textarea aria-label="挿絵の禁止要素" value={values.illustrationNegative} onChange={(event) => update('illustrationNegative', event.target.value)} /></label>
              <label>サンプルシーン<Textarea aria-label="サンプルシーン" value={values.sampleScene} onChange={(event) => update('sampleScene', event.target.value)} /></label>
              <div className={wizardButtonRowClass}><Button variant="secondary" size="sm" onClick={() => void consultAi('挿絵テイスト')} disabled={aiWorking}>画風を相談</Button><Button variant="secondary" size="sm" onClick={() => void consultAi('挿絵プロンプト')} disabled={aiWorking}>プロンプトを生成</Button><Button variant="primary" size="sm" onClick={() => void generatePreview()} disabled={aiWorking}>サンプルシーンで生成</Button></div>
            </section>
          )}

          <nav className={wizardActionsClass} aria-label="ウィザード操作">
            <Button variant="secondary" size="sm" onClick={() => move(-1)} disabled={currentIndex === 0}>戻る</Button>
            <Button variant="primary" size="sm" onClick={() => move(1)} disabled={currentIndex === wizardSteps.length - 1}>次へ</Button>
          </nav>
        </main>

        <SummaryInset as="aside" className={wizardSummaryClass} aria-label="入力サマリー">
          <h2>API送信内容</h2>
          <MyrialeSelect label="相談先AI" value={aiTarget} onValueChange={setAiTarget} options={[
            { value: '文章AI', label: '文章AI' },
            { value: '挿絵AI', label: '挿絵AI' },
            { value: 'ルール確認AI', label: 'ルール確認AI' },
          ]} />
          <SummaryCard as="article"><h3>表紙</h3><p>{values.title || 'タイトル未入力'}</p><p>{values.summary || '概要は空でも保存できます'}</p></SummaryCard>
          <SummaryCard as="article"><h3>AIが読む契約</h3><p>Genre: {values.genre}</p><p>Tone: {values.tone}</p><p>Lore: {values.lore.split('\n').filter(Boolean).length}項目</p><p>AI裁量: {values.aiFreedom}</p></SummaryCard>
          <SummaryCard as="article"><h3>主人公と第一場面</h3><p>{values.hero}</p><p>{values.opening}</p></SummaryCard>
          <SummaryCard as="article"><h3>挿絵</h3><p>{values.illustrationStyle}</p><p>NG: {values.illustrationNegative}</p></SummaryCard>
          <SummaryCard as="article" data-testid="ai-suggestion"><h3>提案候補</h3><p>{suggestion}</p></SummaryCard>
          <SummaryCard as="article" data-testid="illustration-preview"><h3>挿絵プレビュー</h3><p>{preview}</p></SummaryCard>
        </SummaryInset>
      </div>
    </AppChrome>
  );
}
