import { useState } from 'react';
import { ScenarioProgressControls } from './ScenarioProgressControls';
import { AppChrome, type Crumb } from './shared/AppChrome';
import { STORY_IDS, navigateToStory, useAppNavigation } from './shared/nav';

type EditView = 'list' | 'edit';
type EditSection =
  | 'basics'
  | 'world'
  | 'ai'
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
    <section className="wizard-panel" aria-label={`${help}の編集`}>
      <ScenarioProgressControls initialPanel={panel} />
    </section>
  );
}

export function EditScenarioWireframe() {
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
    setNotice('テストプレイ用のセッション開始ワイヤーフレームへ移動します（本番には影響しません）。');
    if (appNavigate) {
      appNavigate('startSession');
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
      <div className="scenario-forge scenario-forge-wizard edit-scenario-wireframe">
        <aside className="contract-spine" aria-label={view === 'list' ? '編集対象の選択' : '編集セクション'}>
          <strong>Scenario Editor</strong>
          {view === 'list' ? (
            <>
              <p className="toc-help">自分のシナリオ一覧です。選ぶと編集画面に現在の内容を読み込みます。</p>
              <div className="wizard-step-list" role="list" aria-label="編集できるシナリオ">
                {scenarioLibrary.map((scenario) => (
                  <button
                    key={scenario.id}
                    className={`spine-row spine-step ${editingId === scenario.id ? 'active' : ''}`}
                    onClick={() => startEditing(scenario)}
                    aria-label={`${scenario.title} を編集対象に選ぶ`}
                    data-testid={`spine-${scenario.id}`}
                  >
                    <span>{scenario.title}</span>
                    <small>{scenario.visibility} / {scenario.id}</small>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="toc-help">編集する項目を選びます。どの項目も下書き保存でき、公開まで公開版は変わりません。</p>
              <div className="wizard-step-list" role="list" aria-label="編集セクション">
                {editSections.map((section, index) => (
                  <button
                    key={section.id}
                    className={`spine-row spine-step ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => setActiveSection(section.id)}
                    aria-label={`${section.label}へ`}
                    aria-current={activeSection === section.id ? 'step' : undefined}
                  >
                    <span>{String(index + 1).padStart(2, '0')} / {section.label}</span>
                    <small>{section.help}</small>
                  </button>
                ))}
              </div>
              <button className="text-button" onClick={backToList}>シナリオ一覧へ戻る</button>
            </>
          )}
          <div className="scenario-id"><span>ScenarioId</span><b>{draft ? draft.id : '未選択'}</b></div>
        </aside>

        <main className="forge-paper wizard-paper" aria-label="シナリオ編集ワイヤーフレーム">
          <p className="kicker">Scenario edit / Improve and publish</p>
          <div className="notice" role="status" data-testid="edit-notice">{notice}</div>

          {view === 'list' && (
            <section className="wizard-panel" aria-label="自分のシナリオ一覧">
              <p>
                <strong>既存のシナリオを編集して改善できます。</strong>
                所有または編集権限のあるシナリオを、公開・非公開に関わらず編集できます。編集は下書きとして保存されます。
              </p>
              <div className="edit-scenario-list" data-testid="scenario-list">
                {scenarioLibrary.map((scenario) => (
                  <article className="edit-scenario-card" key={scenario.id} data-testid={`card-${scenario.id}`}>
                    <span>{scenario.visibility} / {scenario.id}</span>
                    <h2>{scenario.title}</h2>
                    <p>{scenario.genre} / {scenario.tone}</p>
                    <p>{scenario.summary}</p>
                    <p className="edit-scenario-meta">
                      進行中セッション: {scenario.activeSessions}件 ・ 最終編集: {scenario.history[0]?.at ?? '—'}
                    </p>
                    <button className="primary" onClick={() => startEditing(scenario)}>編集</button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {view === 'edit' && draft && (
            <>
              {activeSection === 'basics' && (
                <section className="wizard-panel" aria-label="基本情報の編集">
                  <p><strong>タイトルや概要（あらすじ）を編集します。</strong>内容に合った説明へ更新できます。</p>
                  <label>タイトル
                    <input aria-label="シナリオタイトル" value={draft.title} onChange={(event) => update('title', event.target.value)} />
                  </label>
                  <label>概要（あらすじ）
                    <textarea aria-label="概要" value={draft.summary} onChange={(event) => update('summary', event.target.value)} />
                  </label>
                </section>
              )}

              {activeSection === 'world' && (
                <section className="wizard-panel" aria-label="世界観の編集">
                  <p>
                    <strong>ジャンル・雰囲気・Loreを調整します。</strong>
                    更新は以降の新しいセッションに使われ、<em>進行中の既存セッションには影響しません。</em>
                  </p>
                  <label>ジャンル
                    <input aria-label="ジャンル" value={draft.genre} onChange={(event) => update('genre', event.target.value)} />
                  </label>
                  <label>雰囲気
                    <input aria-label="雰囲気" value={draft.tone} onChange={(event) => update('tone', event.target.value)} />
                  </label>
                  <label>Lore
                    <textarea aria-label="世界観やルール" value={draft.lore} onChange={(event) => update('lore', event.target.value)} />
                  </label>
                </section>
              )}

              {activeSection === 'ai' && (
                <section className="wizard-panel" aria-label="AI設定の編集">
                  <p><strong>AIの振る舞いを調整します。</strong>AI裁量レベルとNarrative生成方針は、セッション開始前の設定として保存されます。</p>
                  <label>AI裁量
                    <select aria-label="AI裁量" value={draft.aiFreedom} onChange={(event) => update('aiFreedom', event.target.value)}>
                      <option>低: 厳密に守る</option>
                      <option>中: 設定を守りつつ提案する</option>
                      <option>高: 展開を広げる</option>
                    </select>
                  </label>
                  <label>Narrative生成方針
                    <textarea aria-label="Narrative生成方針" value={draft.narrativePolicy} onChange={(event) => update('narrativePolicy', event.target.value)} />
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
                <section className="wizard-panel" aria-label="挿絵設定の編集">
                  <p><strong>挿絵のテイストや雰囲気を変更します。</strong>画風・ムード・NG要素を編集し、保存されないプレビューで確認できます。</p>
                  <label>画風
                    <input aria-label="挿絵の画風" value={draft.illustrationStyle} onChange={(event) => update('illustrationStyle', event.target.value)} />
                  </label>
                  <label>ムード
                    <input aria-label="挿絵のムード" value={draft.mood} onChange={(event) => update('mood', event.target.value)} />
                  </label>
                  <label>NG要素
                    <textarea aria-label="挿絵の禁止要素" value={draft.negative} onChange={(event) => update('negative', event.target.value)} />
                  </label>
                </section>
              )}

              <section className="wizard-panel edit-review-panel" aria-label="確認と反映">
                <h2>確認 → 反映</h2>
                <p>AIチェックとテストプレイで品質を確認してから、下書き保存・公開できます。AIは補助に限定され、確定は常に作者が行います。</p>
                <div className="button-row">
                  <button onClick={runAiCheck} data-testid="ai-check-button">AIにチェック</button>
                  <button onClick={runPreview} data-testid="preview-button">プレビュー（テストプレイ）</button>
                  <button onClick={openTestPlay}>本番相当のテストプレイへ</button>
                </div>
                <div className="button-row">
                  <button onClick={saveDraft} data-testid="save-button">下書き保存</button>
                  <button className="primary" onClick={publish} data-testid="publish-button">公開して反映</button>
                </div>
                <label className="edit-visibility">公開状態
                  <select aria-label="公開状態" value={draft.visibility} onChange={(event) => update('visibility', event.target.value as Visibility)}>
                    <option>公開中</option>
                    <option>非公開</option>
                  </select>
                </label>
              </section>
            </>
          )}
        </main>

        <aside className="ai-bookmark wizard-summary" aria-label="編集サマリー">
          <h2>編集状態</h2>
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
              <ol className="edit-history-list">
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
