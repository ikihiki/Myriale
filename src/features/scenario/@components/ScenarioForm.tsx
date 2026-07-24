import { useState } from 'react';
import type { ScenarioAiAssistResponse, ScenarioAiKind } from '../../../app/scenarioApi';
import { parseScenarioTags, serializeScenarioTags } from '../../../app/scenarioTags';
import { Badge, Button, Input, Label, MarkdownEditor, Notice, SummaryCard, SummaryInset, Textarea } from '../../../components/ui';
import { AppChrome, type Crumb } from '../../../shared/AppChrome';
import { WizardNavigation } from '../../../shared/WizardNavigation';
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
} from '../../../shared/scenarioWizardStyles';
import { MyrialeSelect } from '../../../ui/MyrialeRadix';
import { ActionResultsEditorPresentation } from './rule-data/ActionResultsEditorPresentation';
import { LocationsObjectsEditorPresentation } from './rule-data/LocationsObjectsEditorPresentation';
import { ObjectTypesEditorPresentation } from './rule-data/ObjectTypesEditorPresentation';
import { validateScenarioRuleData } from './rule-data/scenarioRuleDataModel';
import {
  emptyScenarioFormValues,
  firstScenarioFormFieldError,
  type ScenarioFormActions,
  type ScenarioFormValues,
} from './scenarioFormModel';

type SuggestionKind = '基本情報' | '挿絵テイスト' | '挿絵プロンプト';
type WizardStep = 'cover' | 'ai' | 'hero' | 'opening' | 'illustration' | 'world' | 'results';

const wizardSteps: Array<{ id: WizardStep; label: string; help: string }> = [
  { id: 'cover', label: '表紙', help: 'タイトル、ジャンル、基本情報' },
  { id: 'ai', label: 'AI裁量', help: 'AIが広げてよい範囲' },
  { id: 'hero', label: '主人公', help: '初期キャラクター条件' },
  { id: 'opening', label: '第一場面', help: '最初のNarrativeの固定' },
  { id: 'illustration', label: '挿絵', help: '画風、NG、プレビュー' },
  { id: 'world', label: '世界データ', help: '場所・オブジェクト・種類を一覧で管理' },
  { id: 'results', label: 'アクション結果', help: '決定的な条件・effect' },
];

type Props = {
  mode: 'create' | 'edit';
  account: { name: string; email: string; initials: string; role?: string } | null;
  scenarioId: string;
  initialValues?: ScenarioFormValues;
  saving: boolean;
  aiWorking: boolean;
  actions: ScenarioFormActions;
  onLogout: () => void | Promise<void>;
};

export function ScenarioForm({
  mode,
  account,
  scenarioId,
  initialValues = emptyScenarioFormValues,
  saving,
  aiWorking,
  actions,
  onLogout,
}: Props) {
  const isEditing = mode === 'edit';
  const scenarioCrumbs: Crumb[] = [
    { label: 'Myriale', to: 'home' },
    { label: 'ライブラリ', to: 'scenarioList' },
    { label: isEditing ? 'シナリオを編集' : 'シナリオ登録' },
  ];
  const [activeStep, setActiveStep] = useState<WizardStep>('cover');
  const [values, setValues] = useState<ScenarioFormValues>(initialValues);
  const [genreTagDraft, setGenreTagDraft] = useState('');
  const [notice, setNotice] = useState(isEditing ? '現在のシナリオ内容を読み込みました。' : 'タイトルだけで下書き保存できます。');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();
  const [ruleNoticeDanger, setRuleNoticeDanger] = useState(false);
  const [aiTarget, setAiTarget] = useState('文章AI');
  const [suggestion, setSuggestion] = useState('AIの提案は、採用するまで本文に反映されません。');
  const [lastAiResponse, setLastAiResponse] = useState<ScenarioAiAssistResponse | null>(null);
  const [preview, setPreview] = useState('プレビュー未生成');

  const currentIndex = wizardSteps.findIndex((step) => step.id === activeStep);
  const currentStep = wizardSteps[currentIndex];
  const update = <K extends keyof ScenarioFormValues>(key: K, value: ScenarioFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const genreTags = parseScenarioTags(values.genre);
  const addGenreTags = () => {
    const additions = parseScenarioTags(genreTagDraft);
    if (additions.length === 0) return;
    update('genre', serializeScenarioTags([...genreTags, ...additions]));
    setGenreTagDraft('');
  };
  const removeGenreTag = (tag: string) => {
    update('genre', serializeScenarioTags(genreTags.filter((current) => current !== tag)));
  };

  const saveDraft = async () => {
    setFieldErrors(undefined);
    setRuleNoticeDanger(false);
    const result = await actions.save(values);
    const readinessIssues = validateScenarioRuleData(values.ruleData);
    const warningCount = readinessIssues.filter((issue) => issue.severity === 'warning').length;
    setNotice(result.ok && warningCount > 0 ? `${result.message} 公開準備には未設定項目が${warningCount}件あります。` : result.message);
    if (!result.ok) setFieldErrors(result.fieldErrors);
  };

  const presentRuleNotice = (message: string, danger = false) => {
    setNotice(message);
    setRuleNoticeDanger(danger);
  };

  const kindFor = (kind: SuggestionKind): ScenarioAiKind => {
    if (kind === '基本情報') return 'summary';
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
    const nextSummary = lastAiResponse?.suggestions[0]?.body ?? '## 物語の目的\n\n地下に沈んだ王都で、禁書を読むたびに書き換わる星座の謎を追います。';
    update('summary', nextSummary);
    setNotice('AIの基本情報案を本文へ採用しました。編集してから保存できます。');
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
    if (step === 'ai') return values.aiFreedom;
    if (step === 'hero') return values.heroMode === 'fixed' ? '固定' : values.heroMode === 'select' ? '選択式' : '自由生成';
    if (step === 'opening') return values.opening ? '固定' : 'AI生成';
    if (step === 'illustration') return values.illustrationStyle ? '入力済み' : '未入力';
    if (step === 'world') return `${values.ruleData.objectTypes.length}種類 / ${values.ruleData.locations.length}場所 / ${values.ruleData.objects.length}個`;
    const issues = validateScenarioRuleData(values.ruleData);
    return issues.length === 0 ? '公開準備OK' : `${issues.length}要確認`;
  };

  const move = (direction: 1 | -1) => {
    const next = wizardSteps[currentIndex + direction];
    if (next) setActiveStep(next.id);
  };

  return (
    <AppChrome section="library" breadcrumbs={scenarioCrumbs} account={account} onLogout={onLogout}>
      <div className={scenarioWizardShellClass}>
        <WizardNavigation
          title={isEditing ? '契約の改稿' : '契約の背表紙'}
          ariaLabel={isEditing ? '編集ウィザードのステップ' : '登録ウィザードのステップ'}
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

        <main className={wizardPaperClass} aria-label={isEditing ? 'シナリオ編集ウィザード' : 'シナリオ登録ウィザード'}>
          <Label as="p" textRole="eyebrow" className={wizardKickerClass}>{isEditing ? 'Scenario Forge / API editing' : 'Scenario Forge / API registration'}</Label>
          <Notice className={wizardNoticeClass} tone={fieldErrors || ruleNoticeDanger ? 'danger' : 'info'} data-testid="scenario-notice">{notice}</Notice>

          <div className={wizardProgressClass} aria-label="ウィザード進捗">
            <span>{String(currentIndex + 1).padStart(2, '0')}</span>
            <strong>{currentStep.label}</strong>
          </div>

          {activeStep === 'cover' && (
            <section className={wizardPanelClass} aria-label="表紙">
              <p><strong>{currentStep.help}。</strong>{isEditing ? '保存済みの内容を作成時と同じ項目・操作で改稿できます。' : 'タイトルだけでDraftを作れます。'} 世界観や雰囲気は基本情報へまとめて記述します。</p>
              <label>シナリオタイトル *<Input aria-label="シナリオタイトル" aria-invalid={firstScenarioFormFieldError(fieldErrors, 'title') ? true : undefined} value={values.title} onChange={(event) => update('title', event.target.value)} placeholder="星喰いの地下図書館" /></label>
              <div className="my-3 grid gap-2" aria-labelledby="genre-tags-label">
                <span id="genre-tags-label" className="text-xs font-black tracking-[0.02em] text-[#4f5767]">ジャンルタグ</span>
                {genreTags.length > 0 && (
                  <div className="flex flex-wrap gap-2" role="group" aria-label="登録済みジャンルタグ">
                    {genreTags.map((tag) => (
                      <Badge key={tag} tone="info" className="!gap-1.5 !px-3 !py-1.5">
                        <span># {tag}</span>
                        <button
                          type="button"
                          aria-label={`${tag}タグを削除`}
                          className="grid size-4 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-current hover:bg-myr-iris/15 focus-visible:outline-2 focus-visible:outline-myr-iris"
                          onClick={() => removeGenreTag(tag)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    aria-label="ジャンルタグを追加"
                    value={genreTagDraft}
                    onChange={(event) => setGenreTagDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ',' && event.key !== '、') return;
                      event.preventDefault();
                      addGenreTags();
                    }}
                    placeholder="幻想ミステリ"
                    className="!min-w-48 !flex-1"
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={addGenreTags}>タグを追加</Button>
                </div>
                <span className="text-myr-caption font-medium text-[#687182]">Enter、読点、または追加ボタンで複数登録できます。</span>
              </div>
              <MarkdownEditor
                label="基本情報"
                value={values.summary}
                onChange={(value) => update('summary', value)}
                error={firstScenarioFormFieldError(fieldErrors, 'summary')}
                help="シナリオの前提、目的、遊び方をMarkdownで記述します。空でも下書き保存できます。"
                placeholder={'## シナリオの目的\n\nこの物語で体験することを書きます。\n\n- 主な目的\n- 重要な前提'}
              />
              <div className={wizardButtonRowClass}><Button variant="secondary" size="sm" onClick={() => void consultAi('基本情報')} disabled={aiWorking}>AIに基本情報案を出してもらう</Button><Button variant="secondary" size="sm" onClick={adoptSummary}>採用して編集</Button></div>
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
              <MyrialeSelect label="主人公の扱い" value={values.heroMode} onValueChange={(value) => update('heroMode', value as ScenarioFormValues['heroMode'])} options={[
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

          {activeStep === 'world' && (
            <div className={`${wizardPanelClass} [&_textarea]:min-h-20`}>
              <section className="mb-7 border-b border-[#17151f]/12 pb-5" aria-labelledby="world-data-heading">
                <p className={wizardKickerClass}>World data ledger</p>
                <h2 id="world-data-heading">場所・オブジェクト・種類</h2>
                <p>3つのデータを同じページで見渡し、各行の左端にある「編集」から詳細ペインを開きます。</p>
              </section>
              <div className="grid gap-9">
                <LocationsObjectsEditorPresentation
                  value={values.ruleData}
                  onChange={(ruleData) => update('ruleData', ruleData)}
                  onNotice={presentRuleNotice}
                />
                <ObjectTypesEditorPresentation
                  mode={mode}
                  value={values.ruleData}
                  onChange={(ruleData) => update('ruleData', ruleData)}
                  onNotice={presentRuleNotice}
                />
              </div>
            </div>
          )}

          {activeStep === 'results' && (
            <div className={`${wizardPanelClass} [&_textarea]:min-h-20`}>
              <ActionResultsEditorPresentation
                value={values.ruleData}
                onChange={(ruleData) => update('ruleData', ruleData)}
              />
              <section className="mt-4 grid gap-2 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4" aria-label="公開準備チェック">
                <h3>公開準備チェック</h3>
                {validateScenarioRuleData(values.ruleData).length === 0 ? <p data-testid="rule-readiness">すべての参照とアクション結果が決定的です。</p> : validateScenarioRuleData(values.ruleData).map((issue) => <p key={`${issue.path}-${issue.message}`} className={issue.severity === 'error' ? '!text-[#9b3030]' : '!text-[#7a5a16]'}><strong>{issue.severity === 'error' ? '修正必須' : '下書き警告'}:</strong> {issue.message} <code>{issue.path}</code></p>)}
              </section>
            </div>
          )}

          <nav className={wizardActionsClass} aria-label="ウィザード操作">
            <Button variant="secondary" size="sm" onClick={() => move(-1)} disabled={currentIndex === 0}>戻る</Button>
            <Button variant="primary" size="sm" onClick={() => void saveDraft()} disabled={saving}>{saving ? '保存中…' : isEditing ? '変更を保存' : '下書き保存'}</Button>
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
          <SummaryCard as="article"><h3>表紙</h3><p>{values.title || 'タイトル未入力'}</p><p>{genreTags.length > 0 ? genreTags.map((tag) => `# ${tag}`).join(' ') : 'ジャンルタグ未入力'}</p><p>{values.summary ? `基本情報: Markdown ${values.summary.length}文字` : '基本情報は空でも保存できます'}</p></SummaryCard>
          <SummaryCard as="article"><h3>AIが読む契約</h3><p>基本情報に世界観・雰囲気を記述</p><p>AI裁量: {values.aiFreedom}</p></SummaryCard>
          <SummaryCard as="article"><h3>主人公と第一場面</h3><p>{values.hero}</p><p>{values.opening}</p></SummaryCard>
          <SummaryCard as="article"><h3>挿絵</h3><p>{values.illustrationStyle}</p><p>NG: {values.illustrationNegative}</p></SummaryCard>
          <SummaryCard as="article"><h3>ルールデータ</h3><p>{values.ruleData.objectTypes.length}種類 / {values.ruleData.locations.length}場所 / {values.ruleData.objects.length}オブジェクト</p><p>{validateScenarioRuleData(values.ruleData).length === 0 ? '公開準備OK' : `${validateScenarioRuleData(values.ruleData).length}件を確認`}</p></SummaryCard>
          <SummaryCard as="article" data-testid="ai-suggestion"><h3>提案候補</h3><p>{suggestion}</p></SummaryCard>
          <SummaryCard as="article" data-testid="illustration-preview"><h3>挿絵プレビュー</h3><p>{preview}</p></SummaryCard>
        </SummaryInset>
      </div>
    </AppChrome>
  );
}
