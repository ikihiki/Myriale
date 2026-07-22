import { useState } from 'react';
import { Button, Input, Notice, Textarea } from '../../components/ui';
import { ScenarioProgressControls } from '../../ScenarioProgressControls';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { STORY_IDS, navigateToStory, useAppNavigation } from '../../shared/nav';
import { WizardNavigation } from '../../shared/WizardNavigation';
import { scenarioWizardShellClass, wizardButtonRowClass, wizardKickerClass, wizardNoticeClass, wizardPanelClass, wizardPaperClass, wizardSummaryClass } from '../../shared/scenarioWizardStyles';
import { MyrialeSelect } from '../../ui/MyrialeRadix';

type EditView = 'list' | 'edit';
type EditSection =
  | 'basics'
  | 'world'
  | 'ai'
  | 'hero'
  | 'asCast'
  | 'asLocations'
  | 'asBeats'
  | 'asSecrets'
  | 'asEvents'
  | 'asDebug'
  | 'asTest'
  | 'illustration';
type Visibility = '公開中' | '非公開';

type CheckResult = {
  kind: '矛盾' | '改善案';
  detail: string;
};

type HistoryEntry = {
  at: string;
  summary: string;
};

type ScenarioDraft = {
  id: string;
  title: string;
  summary: string;
  genre: string;
  tone: string;
  lore: string;
  aiFreedom: string;
  heroMode: 'fixed' | 'select' | 'free';
  heroFreeGenerationAllowed: boolean;
  hero: string;
  narrativePolicy: string;
  illustrationStyle: string;
  mood: string;
  negative: string;
  visibility: Visibility;
  /** 現在進行中の既存セッション数（編集が影響しないことを示すため）。 */
  activeSessions: number;
  history: HistoryEntry[];
};

const scenarioLibrary: ScenarioDraft[] = [
  {
    id: 'SCN-STAR-LIBRARY',
    title: '星喰いの地下図書館',
    summary: '地下に沈んだ王都で、禁書を読むたびに星座が書き換わる探索譚。',
    genre: 'ダークファンタジー探索譚',
    tone: '静かで不穏、淡い希望',
    lore: '星座は魔法体系の鍵。\n死者の名前を読むと記憶を失う。',
    aiFreedom: '中: 設定を守りつつ提案する',
    heroMode: 'select',
    heroFreeGenerationAllowed: false,
    hero: 'ミラ / 星図を読む巡礼者\nセオ / 星図を燃やす護衛\nエル / 記憶を失った写字生',
    narrativePolicy: '二人称・現在形で描写多め。プレイヤーの選択を尊重する。',
    illustrationStyle: '銅版画風 / 低彩度 / 細密',
    mood: '孤独、湿った静けさ、薄い金色の灯り',
    negative: '現代車両、銃器、過度な流血',
    visibility: '公開中',
    activeSessions: 3,
    history: [
      { at: '2日前 14:20', summary: 'Loreに「死者の名前」の禁忌を追加' },
      { at: '5日前 09:05', summary: '概要を全面改稿、ジャンルを探索譚へ変更' },
      { at: '先週 22:40', summary: 'Draftとして新規作成' },
    ],
  },
  {
    id: 'SCN-ASH-STATION',
    title: '灰の駅と宛名のない切符',
    summary: '朝が来ない荒野を、宛名のない切符だけを頼りに渡るロードムービー。',
    genre: '終末ロードムービー',
    tone: '乾いた祈り、遠い汽笛',
    lore: '朝が来ない荒野では、切符だけが次の町を覚えている。',
    aiFreedom: '高: 展開を広げる',
    heroMode: 'free',
    heroFreeGenerationAllowed: false,
    hero: '灰の駅で目覚めた旅人。名前と過去はプレイヤーが自由に決められる。',
    narrativePolicy: '叙情的で簡潔。移動と別れを軸に進める。',
    illustrationStyle: '水彩 / くすんだ暖色 / 粒状感',
    mood: '郷愁、灰、遠い光',
    negative: '鮮やかな原色、近未来都市',
    visibility: '非公開',
    activeSessions: 0,
    history: [
      { at: '昨日 18:10', summary: '挿絵ムードを「郷愁」に調整' },
      { at: '先週 11:30', summary: 'Draftとして新規作成' },
    ],
  },
];

const playerAccount = { name: '霧野しおり', email: 'author@myriale.example', initials: '霧野', role: '作者' };

const editSections: Array<{ id: EditSection; label: string; help: string }> = [
  { id: 'basics', label: '基本情報', help: 'タイトルと概要（あらすじ）' },
  { id: 'world', label: '世界観', help: 'ジャンル・雰囲気・Lore' },
  { id: 'ai', label: 'AI設定', help: 'AI裁量とNarrative生成方針' },
  { id: 'hero', label: '主人公', help: '固定・選択式・自由生成' },
  { id: 'asCast', label: 'Cast候補', help: 'US-AS01: AIが使ってよい人物候補' },
  { id: 'asLocations', label: 'Location候補', help: 'US-AS02: 場所候補とアクセス条件' },
  { id: 'asBeats', label: 'Chapter / Beat', help: 'US-AS03/04: 章・ビート・条件・禁止事項' },
  { id: 'asSecrets', label: 'HiddenBrief', help: 'US-AS05/06: 非公開情報と公開条件' },
  { id: 'asEvents', label: '強制イベント', help: 'US-AS10: 条件付きイベント' },
  { id: 'asDebug', label: '進行デバッグ', help: 'US-AS07/08/09/12: 補正と参照情報' },
  { id: 'asTest', label: 'テスト実行', help: 'US-AS11: 任意ビートから検証' },
  { id: 'illustration', label: '挿絵', help: '画風・ムード・NG要素' },
];


type AdvancedPanelId = 'cast' | 'locations' | 'beats' | 'secrets' | 'events' | 'debug' | 'test';

function EditAdvancedSection({ panel, help }: { panel: AdvancedPanelId; title: string; help: string }) {
  return (
    <section className={wizardPanelClass} aria-label={`${help}の編集`}>
      <ScenarioProgressControls initialPanel={panel} />
    </section>
  );
}

export function EditScenarioPage() {
  const appNavigate = useAppNavigation();
  const [view, setView] = useState<EditView>('list');
  const [activeSection, setActiveSection] = useState<EditSection>('basics');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ScenarioDraft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState('自分のシナリオ一覧です。編集したいシナリオを選んでください。');
  const [check, setCheck] = useState<CheckResult[] | null>(null);
  const [preview, setPreview] = useState('テストプレイは未実行です。');

  const startEditing = (scenario: ScenarioDraft) => {
    setEditingId(scenario.id);
    // US-E01: 編集画面に現在のシナリオ内容を読み込む（編集用のコピーを作る）。
    setDraft({ ...scenario, history: [...scenario.history] });
    setView('edit');
    setActiveSection('basics');
    setDirty(false);
    setCheck(null);
    setPreview('テストプレイは未実行です。');
    setNotice(`「${scenario.title}」の編集画面を開きました。現在の内容を読み込んでいます。`);
  };

  const backToList = () => {
    setView('list');
    setNotice('シナリオ一覧へ戻りました。別のシナリオを編集できます。');
  };

  const update = <K extends keyof ScenarioDraft>(key: K, value: ScenarioDraft[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setDirty(true);
  };

  const runAiCheck = () => {
    // US-E06: AIは矛盾点や改善案を提示するが、自動確定はしない。
    setCheck([
      { kind: '矛盾', detail: 'Loreでは「死者の名前は禁忌」だが、概要では名前を読む描写が推奨されています。' },
      { kind: '改善案', detail: '挿絵NG要素に「現代車両」がありますが、世界観に合わせ「電灯」も追加候補です。' },
    ]);
    setNotice('AIが編集内容をチェックしました。矛盾点と改善案を提示します（自動確定はしません）。');
  };

  const runPreview = () => {
    // US-E07: 仮セッションでイントロ/序盤を生成。本番セッションには影響しない。
    setPreview('仮セッションでイントロと序盤Narrativeを生成しました（本番セッションには反映されません）。');
    setNotice('編集後の内容でテストプレイを実行しました。本番セッションには影響しません。');
  };

  const saveDraft = () => {
    // US-E08: 編集内容を下書きとして保存する。
    setDirty(false);
    setNotice('編集内容を下書きとして保存しました。確定保存するまで公開版は変わりません。');
  };

  const publish = () => {
    if (!draft) return;
    // US-E09: 公開すると、以降の新規セッションに最新版が使われる。既存セッションは影響を受けない。
    setDirty(false);
    setNotice(
      `「${draft.title}」の編集内容を公開・反映しました。新規セッションは最新版を使います。進行中の${draft.activeSessions}件のセッションは影響を受けません。`,
    );
  };

  const openTestPlay = () => {
    setNotice('テストプレイ用のセッション開始アプリ画面へ移動します（本番には影響しません）。');
    if (appNavigate) {
      appNavigate('startSession', { query: { scenarioId: draft?.id ?? 'SCN-STAR-LIBRARY' } });
      return;
    }
    navigateToStory(STORY_IDS.startSession);
  };

  const editCrumbs: Crumb[] = [
    { label: 'Myriale', to: 'scenarioRegister' },
    { label: 'ライブラリ', to: 'scenarioRegister' },
    { label: draft ? `${draft.title} を編集` : 'シナリオを編集' },
  ];

  const visibility = draft?.visibility ?? '—';

  return (
    <AppChrome section="library" breadcrumbs={editCrumbs} account={playerAccount}>
      <div className={scenarioWizardShellClass}>
        <WizardNavigation
          title="Scenario Editor"
          ariaLabel={view === 'list' ? '編集できるシナリオ' : '編集セクション'}
          help={view === 'list'
            ? '自分のシナリオ一覧です。選ぶと編集画面に現在の内容を読み込みます。'
            : '編集する項目を選びます。どの項目も下書き保存でき、公開まで公開版は変わりません。'}
          items={view === 'list'
            ? scenarioLibrary.map((scenario) => ({
                id: scenario.id,
                label: scenario.title,
                meta: `${scenario.visibility} / ${scenario.id}`,
                ariaLabel: `${scenario.title} を編集対象に選ぶ`,
                testId: `spine-${scenario.id}`,
              }))
            : editSections.map((section) => ({
                id: section.id,
                label: section.label,
                meta: section.help,
                ariaLabel: `${section.label}へ`,
              }))}
          activeId={(view === 'list' ? editingId : activeSection) ?? undefined}
          onSelect={(id) => {
            if (view === 'list') {
              const scenario = scenarioLibrary.find((item) => item.id === id);
              if (scenario) startEditing(scenario);
              return;
            }
            setActiveSection(id as EditSection);
          }}
          markerLabel="ScenarioId"
          markerValue={draft ? draft.id : '未選択'}
          action={view === 'edit' ? <Button variant="text" onClick={backToList}>シナリオ一覧へ戻る</Button> : undefined}
        />

        <main className={wizardPaperClass} aria-label="シナリオ編集アプリ画面">
          <p className={wizardKickerClass}>Scenario edit / Improve and publish</p>
          <Notice className={wizardNoticeClass} data-testid="edit-notice">{notice}</Notice>

          {view === 'list' && (
            <section className={wizardPanelClass} aria-label="自分のシナリオ一覧">
              <p>
                <strong>既存のシナリオを編集して改善できます。</strong>
                所有または編集権限のあるシナリオを、公開・非公開に関わらず編集できます。編集は下書きとして保存されます。
              </p>
              <div className="mt-3.5 grid gap-3" data-testid="scenario-list">
                {scenarioLibrary.map((scenario) => (
                  <article className="rounded-myr-card border border-myr-line-soft bg-myr-paper-glass p-4 [&>span]:text-myr-caption [&>span]:font-black [&>span]:uppercase [&>span]:tracking-[0.08em] [&>span]:text-[#7054dd] [&_h2]:my-2 [&_h2]:font-serif [&_h2]:text-[clamp(20px,1.8vw,30px)] [&_h2]:leading-[1.05] [&_h2]:tracking-myr-display [&_p]:max-w-none [&_p]:text-myr-ink-soft" key={scenario.id} data-testid={`card-${scenario.id}`}>
                    <span>{scenario.visibility} / {scenario.id}</span>
                    <h2>{scenario.title}</h2>
                    <p>{scenario.genre} / {scenario.tone}</p>
                    <p>{scenario.summary}</p>
                    <p className="text-myr-ui-sm font-extrabold !text-myr-ink-subtle">
                      進行中セッション: {scenario.activeSessions}件 ・ 最終編集: {scenario.history[0]?.at ?? '—'}
                    </p>
                    <Button variant="primary" size="sm" onClick={() => startEditing(scenario)}>編集</Button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {view === 'edit' && draft && (
            <>
              {activeSection === 'basics' && (
                <section className={wizardPanelClass} aria-label="基本情報の編集">
                  <p><strong>タイトルや概要（あらすじ）を編集します。</strong>内容に合った説明へ更新できます。</p>
                  <label>タイトル
                    <Input aria-label="シナリオタイトル" value={draft.title} onChange={(event) => update('title', event.target.value)} />
                  </label>
                  <label>概要（あらすじ）
                    <Textarea aria-label="概要" value={draft.summary} onChange={(event) => update('summary', event.target.value)} />
                  </label>
                </section>
              )}

              {activeSection === 'world' && (
                <section className={wizardPanelClass} aria-label="世界観の編集">
                  <p>
                    <strong>ジャンル・雰囲気・Loreを調整します。</strong>
                    更新は以降の新しいセッションに使われ、<em>進行中の既存セッションには影響しません。</em>
                  </p>
                  <label>ジャンル
                    <Input aria-label="ジャンル" value={draft.genre} onChange={(event) => update('genre', event.target.value)} />
                  </label>
                  <label>雰囲気
                    <Input aria-label="雰囲気" value={draft.tone} onChange={(event) => update('tone', event.target.value)} />
                  </label>
                  <label>Lore
                    <Textarea aria-label="世界観やルール" value={draft.lore} onChange={(event) => update('lore', event.target.value)} />
                  </label>
                </section>
              )}

              {activeSection === 'ai' && (
                <section className={wizardPanelClass} aria-label="AI設定の編集">
                  <p><strong>AIの振る舞いを調整します。</strong>AI裁量レベルとNarrative生成方針は、セッション開始前の設定として保存されます。</p>
                  <MyrialeSelect
                    label="AI裁量"
                    value={draft.aiFreedom}
                    onValueChange={(value) => update('aiFreedom', value)}
                    options={[
                      { value: '低: 厳密に守る', label: '低: 厳密に守る' },
                      { value: '中: 設定を守りつつ提案する', label: '中: 設定を守りつつ提案する' },
                      { value: '高: 展開を広げる', label: '高: 展開を広げる' },
                    ]}
                  />
                  <label>Narrative生成方針
                    <Textarea aria-label="Narrative生成方針" value={draft.narrativePolicy} onChange={(event) => update('narrativePolicy', event.target.value)} />
                  </label>
                </section>
              )}

              {activeSection === 'hero' && (
                <section className={wizardPanelClass} aria-label="主人公設定の編集">
                  <p><strong>セッション開始時の主人公の扱いを設定します。</strong>固定、候補選択、自由生成のいずれかをシナリオ設定として保存します。</p>
                  <MyrialeSelect
                    label="主人公の扱い"
                    value={draft.heroMode}
                    onValueChange={(value) => update('heroMode', value as ScenarioDraft['heroMode'])}
                    options={[
                      { value: 'fixed', label: '固定キャラクター' },
                      { value: 'select', label: '候補キャラクターから選択' },
                      { value: 'free', label: '自由生成のみ' },
                    ]}
                  />
                  {draft.heroMode === 'select' && (
                    <label className="my-3 grid grid-cols-[1fr_auto] items-center gap-2 text-xs font-black text-myr-slate-muted [&_input]:size-4">
                      <span>候補選択に加えて自由生成を許可</span>
                      <input
                        type="checkbox"
                        aria-label="自由生成を許可"
                        checked={draft.heroFreeGenerationAllowed}
                        onChange={(event) => update('heroFreeGenerationAllowed', event.target.checked)}
                      />
                    </label>
                  )}
                  <label>
                    {draft.heroMode === 'fixed' ? '固定する主人公' : draft.heroMode === 'select' ? '候補キャラクター（1行に1人）' : '自由生成時の前提・制約'}
                    <Textarea aria-label="主人公の設定" value={draft.hero} onChange={(event) => update('hero', event.target.value)} />
                  </label>
                </section>
              )}

              {activeSection === 'asCast' && <EditAdvancedSection panel="cast" title={draft.title} help="US-AS01: AIが使ってよい人物候補" />}
              {activeSection === 'asLocations' && <EditAdvancedSection panel="locations" title={draft.title} help="US-AS02: 場所候補とアクセス条件" />}
              {activeSection === 'asBeats' && <EditAdvancedSection panel="beats" title={draft.title} help="US-AS03/04: 章・ビート・条件・禁止事項" />}
              {activeSection === 'asSecrets' && <EditAdvancedSection panel="secrets" title={draft.title} help="US-AS05/06: 非公開情報と公開条件" />}
              {activeSection === 'asEvents' && <EditAdvancedSection panel="events" title={draft.title} help="US-AS10: 条件付きイベント" />}
              {activeSection === 'asDebug' && <EditAdvancedSection panel="debug" title={draft.title} help="US-AS07/08/09/12: 補正と参照情報" />}
              {activeSection === 'asTest' && <EditAdvancedSection panel="test" title={draft.title} help="US-AS11: 任意ビートから検証" />}

              {activeSection === 'illustration' && (
                <section className={wizardPanelClass} aria-label="挿絵設定の編集">
                  <p><strong>挿絵のテイストや雰囲気を変更します。</strong>画風・ムード・NG要素を編集し、保存されないプレビューで確認できます。</p>
                  <label>画風
                    <Input aria-label="挿絵の画風" value={draft.illustrationStyle} onChange={(event) => update('illustrationStyle', event.target.value)} />
                  </label>
                  <label>ムード
                    <Input aria-label="挿絵のムード" value={draft.mood} onChange={(event) => update('mood', event.target.value)} />
                  </label>
                  <label>NG要素
                    <Textarea aria-label="挿絵の禁止要素" value={draft.negative} onChange={(event) => update('negative', event.target.value)} />
                  </label>
                </section>
              )}

            </>
          )}
        </main>

        <aside className={wizardSummaryClass} aria-label="編集サマリー">
          <h2>編集状態</h2>
          {view === 'edit' && draft && (
            <article className="border border-dashed border-[rgba(112,84,221,0.4)] !bg-[rgba(245,243,255,0.6)]" aria-label="確認と反映">
              <h3>確認 → 反映</h3>
              <p>AIチェックとテストプレイで品質を確認してから、下書き保存・公開できます。AIは補助に限定され、確定は常に作者が行います。</p>
              <div className={wizardButtonRowClass}>
                <Button variant="secondary" size="sm" onClick={runAiCheck} data-testid="ai-check-button">AIにチェック</Button>
                <Button variant="secondary" size="sm" onClick={runPreview} data-testid="preview-button">プレビュー（テストプレイ）</Button>
                <Button variant="secondary" size="sm" onClick={openTestPlay}>本番相当のテストプレイへ</Button>
              </div>
              <div className={wizardButtonRowClass}>
                <Button variant="secondary" size="sm" onClick={saveDraft} data-testid="save-button">下書き保存</Button>
                <Button variant="primary" size="sm" onClick={publish} data-testid="publish-button">公開して反映</Button>
              </div>
              <div className="mt-1.5 grid max-w-60 gap-1.5 font-extrabold">
                <MyrialeSelect
                  label="公開状態"
                  value={draft.visibility}
                  onValueChange={(value) => update('visibility', value as Visibility)}
                  options={[
                    { value: '公開中', label: '公開中' },
                    { value: '非公開', label: '非公開' },
                  ]}
                />
              </div>
            </article>
          )}
          <article>
            <h3>対象シナリオ</h3>
            <p data-testid="summary-title">{draft ? draft.title : '一覧から選択してください'}</p>
            <p data-testid="summary-visibility">公開状態: {visibility}</p>
            <p data-testid="summary-dirty">{view === 'edit' ? (dirty ? '未保存の変更があります' : '保存済み（変更なし）') : '—'}</p>
          </article>
          {view === 'edit' && activeSection.startsWith('as') && (
            <article data-testid="advanced-summary"><h3>進行制御</h3><p>{editSections.find((section) => section.id === activeSection)?.label}</p><p>{editSections.find((section) => section.id === activeSection)?.help}</p></article>
          )}
          <article data-testid="ai-check">
            <h3>AIチェック結果</h3>
            {check ? (
              <ul>
                {check.map((item) => (
                  <li key={`${item.kind}-${item.detail}`}><strong>{item.kind}:</strong> {item.detail}</li>
                ))}
              </ul>
            ) : (
              <p>未実行です。AIは矛盾点と改善案を提示しますが、自動確定はしません。</p>
            )}
          </article>
          <article data-testid="preview-result">
            <h3>テストプレイ</h3>
            <p>{preview}</p>
          </article>
          <article data-testid="history">
            <h3>編集履歴</h3>
            {draft ? (
              <ol className="m-0 grid gap-2 pl-4.5 [&_li]:grid [&_li]:gap-0.5 [&_small]:text-myr-caption [&_small]:font-extrabold [&_small]:tracking-myr-label [&_small]:text-myr-ink-subtle">
                {draft.history.map((entry) => (
                  <li key={`${entry.at}-${entry.summary}`}>
                    <small>{entry.at}</small>
                    <span>{entry.summary}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p>シナリオを選ぶと編集履歴が表示されます。</p>
            )}
          </article>
        </aside>
      </div>
    </AppChrome>
  );
}
