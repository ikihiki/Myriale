import { useMemo, useState } from 'react';
import { AppChrome, type Crumb } from './shared/AppChrome';
import { STORY_IDS, navigateToStory, useAppNavigation } from './shared/nav';

type ResumeView = 'list' | 'confirm' | 'readonly';

type ChangeNote = {
  kind: 'Scenario' | 'AI設定';
  detail: string;
};

type DialogueTurn = {
  id: number;
  turnTitle: string;
  /** プレイヤーが入力した行動・会話（Turn 1の導入など、無い場合もある）。 */
  playerInput?: string;
  /** そのTurnで生成されたNarrative。 */
  narrative: string;
};

type SuspendedSession = {
  id: string;
  scenarioTitle: string;
  genre: string;
  /** 最後にプレイした主人公の表示名。 */
  hero: string;
  playtime: string;
  lastPlayed: string;
  /** US-R02: AIが要約した「これまでのあらすじ」。 */
  recap: string;
  /** US-R04: 復元されるAIコンテキストの内訳。 */
  context: string[];
  /** US-R05: 中断中に起きたScenario/AI設定の変更点。空なら変更なし。 */
  changes: ChangeNote[];
  /**
   * US-R01/R07: 中断時点までの全Turnログ。再開後はこのすべてが復元され、
   * 直前のNarrativeだけでなく過去のやり取りまで遡れる。
   */
  turns: DialogueTurn[];
};

/** US-R03: 進行度（ターン数）は復元される全Turnログから導出する。 */
const turnCountOf = (session: SuspendedSession) => session.turns.length;

const suspendedSessions: SuspendedSession[] = [
  {
    id: 'SES-2087',
    scenarioTitle: '星喰いの地下図書館',
    genre: 'ダークファンタジー探索譚',
    hero: 'エル / 記憶を失った写字生',
    playtime: '3時間12分',
    lastPlayed: '2日前',
    recap:
      'あなたは水没した閲覧室で目覚め、銀の鍵と「名前を答えるな」という警告を手にした。書架の奥の人物と接触し、螺旋階段の先で星図灯の在処を探している。',
    context: [
      'Scenario Lore（星座=魔法体系、死者の名前は禁忌）',
      'Lorebook Canon（銀の鍵 / 書架の奥の人物 / 螺旋階段）',
      'Session State（現在地: 螺旋階段の踊り場、所持品: 銀の鍵）',
      '全Turnログ（Turn 1-6）と要約',
    ],
    changes: [
      { kind: 'Scenario', detail: '作者がイントロのトーンを「静かで不穏」へ微調整（既存セッションには未適用）。' },
      { kind: 'AI設定', detail: 'Narrative生成方針が「描写多め」に更新。再開後の新しいTurnから反映される。' },
    ],
    turns: [
      {
        id: 1,
        turnTitle: '水没した閲覧室で目覚める',
        narrative:
          'あなたは水没した閲覧室で目を覚ます。膝まで届く黒い水の上を星図灯の光が揺れ、崩れた書架の奥から誰かの咳払いが聞こえる。懐には濡れていない銀の鍵が残されていた。',
      },
      {
        id: 2,
        turnTitle: '銀の鍵を確かめる',
        playerInput: '懐の銀の鍵を取り出して刻印を見る',
        narrative:
          '鍵の柄には、星座ではなく空白の円が刻まれていた。指でなぞると、水面にまだ開いていない扉の輪郭が一瞬だけ浮かび、すぐに黒い波紋へ戻る。',
      },
      {
        id: 3,
        turnTitle: '周囲を警戒する',
        playerInput: '音を立てないように周囲を調べる',
        narrative:
          '倒れた書架の陰に、濡れていない足跡が続いている。足跡は奥の閲覧机で途切れ、その上には新しいインクで「名前を答えるな」とだけ書かれていた。',
      },
      {
        id: 4,
        turnTitle: '書架の奥の人物に声をかける',
        playerInput: '咳払いのした方へ声をかける',
        narrative:
          '濡れた外套の人物が、半壊した索引棚の影から姿を見せる。「鍵を持つ者がまた来たか」と言い、あなたの名前ではなく、あなたが失ったはずの記憶を尋ねてくる。',
      },
      {
        id: 5,
        turnTitle: '名前を伏せて道を尋ねる',
        playerInput: '名前は答えず、星図灯の在処を尋ねる',
        narrative:
          '人物は短く笑い、「賢明だ」と呟いた。螺旋階段を指し示し、最も高い踊り場でだけ星図灯が本当の名を映すと教える。ただし、灯は嘘をついた者の声を覚えているという。',
      },
      {
        id: 6,
        turnTitle: '螺旋階段の踊り場に立つ',
        playerInput: '螺旋階段をのぼって踊り場へ向かう',
        narrative:
          '螺旋階段の踊り場で星図灯がひとつ灯り、まだ名を知らない扉の輪郭が水面に浮かぶ。あなたの次の一手を待つように、地下図書館は静かに息を潜めている。',
      },
    ],
  },
  {
    id: 'SES-2042',
    scenarioTitle: '灰の駅と宛名のない切符',
    genre: '終末ロードムービー',
    hero: 'アオイ / 灰の駅で目覚めた旅人',
    playtime: '54分',
    lastPlayed: '先週',
    recap:
      'あなたは灰の降る駅で宛名のない切符を握りしめ、朝が来ない荒野を渡る列車を待っている。改札の老人から、次の町の名前は切符だけが覚えていると聞かされた。',
    context: [
      'Scenario Lore（朝の来ない荒野、切符が記憶を持つ）',
      'Lorebook Canon（宛名のない切符 / 改札の老人）',
      'Session State（現在地: 灰の駅ホーム、所持品: 切符）',
      '全Turnログ（Turn 1-3）と要約',
    ],
    changes: [],
    turns: [
      {
        id: 1,
        turnTitle: '灰の降る駅で目覚める',
        narrative:
          'あなたは灰の降る駅のベンチで目を覚ます。手のなかには宛名のない切符が一枚。時刻表の文字はすべて滲み、朝が来ないまま空だけが薄白く濁っている。',
      },
      {
        id: 2,
        turnTitle: '改札の老人に尋ねる',
        playerInput: '改札にいる老人に、この切符の行き先を尋ねる',
        narrative:
          '老人は切符を一瞥し、「宛名は乗る者が決めるんじゃない、切符が覚えてるのさ」と言う。次の町の名前は、列車が走り出すまで誰にも読めないらしい。',
      },
      {
        id: 3,
        turnTitle: 'ホームで列車を待つ',
        playerInput: 'ホームの端で列車が来るのを待つ',
        narrative:
          '遠くで汽笛が一度だけ鳴り、灰がいっそう濃くなる。切符の宛名欄に、まだ読めない文字がゆっくりと滲み始めていた。',
      },
    ],
  },
];

const playerAccount = { name: '霧野しおり', email: 'reader@myriale.example', initials: '霧野', role: 'プレイヤー' };

export function SessionResumeWireframe() {
  const appNavigate = useAppNavigation();
  const [view, setView] = useState<ResumeView>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState(
    '中断中のSession一覧です。再開したいSessionを選ぶと、最終状態から再開できます。',
  );

  const selected = useMemo(
    () => suspendedSessions.find((session) => session.id === selectedId) ?? null,
    [selectedId],
  );

  const selectSession = (session: SuspendedSession) => {
    setSelectedId(session.id);
    setView('confirm');
    setNotice(
      `「${session.scenarioTitle}」を再開します。最終状態（Turn ${turnCountOf(session)}）から続きを遊べます。再開前にあらすじと変更点を確認してください。`,
    );
  };

  const backToList = () => {
    setView('list');
    setNotice('中断中のSession一覧へ戻りました。別のSessionを選んで再開できます。');
  };

  const resumeSession = () => {
    setNotice(
      'SessionをActiveに復帰し、AIコンテキストとすべてのTurnログを復元しました。プレイ画面（Session play dialogue）へ移動します。',
    );
    // US-R06: 再開を確定したら、Activeなプレイ画面（Session play dialogue）へ遷移する。
    // 復元された全Turnログと続きの入力は、そのプレイ画面が担う。
    if (appNavigate) {
      appNavigate('playSession');
      return;
    }
    navigateToStory(STORY_IDS.playSession);
  };

  const viewReadOnly = () => {
    setView('readonly');
    setNotice(
      'ReadOnlyモードで開きました。再開せずにこれまでのストーリーを読み返せます。Session状態はSuspendedのままです。',
    );
  };

  const resumeCrumbs: Crumb[] = [
    { label: 'Myriale', to: 'scenarioRegister' },
    { label: 'セッション', to: 'startSession' },
    { label: selected ? `${selected.scenarioTitle} を再開` : '中断中のセッション' },
  ];

  const sessionState = view === 'readonly' ? 'Suspended (ReadOnly)' : 'Suspended';

  return (
    <AppChrome section="sessions" breadcrumbs={resumeCrumbs} account={playerAccount}>
      <div className="scenario-forge scenario-forge-wizard session-resume-wireframe">
        <aside className="contract-spine" aria-label="中断中のセッション一覧">
          <strong>Suspended Sessions</strong>
          <p className="toc-help">途中で中断したSessionの一覧です。選ぶと再開前の確認画面に進みます。</p>
          <div className="wizard-step-list" role="list" aria-label="中断中セッション">
            {suspendedSessions.map((session) => (
              <button
                key={session.id}
                className={`spine-row spine-step ${selectedId === session.id ? 'active' : ''}`}
                onClick={() => selectSession(session)}
                aria-label={`${session.scenarioTitle} を選択`}
                aria-current={selectedId === session.id ? 'step' : undefined}
                data-testid={`suspended-${session.id}`}
              >
                <span>{session.scenarioTitle}</span>
                <small>
                  Turn {turnCountOf(session)} / {session.lastPlayed}
                </small>
              </button>
            ))}
          </div>
          <div className="scenario-id">
            <span>Session state</span>
            <b data-testid="session-state">{sessionState}</b>
          </div>
        </aside>

        <main className="forge-paper wizard-paper" aria-label="セッション再開ワイヤーフレーム">
          <p className="kicker">Session resume / Continue your story</p>
          <div className="notice" role="status" data-testid="resume-notice">
            {notice}
          </div>

          {view === 'list' && (
            <section className="wizard-panel" aria-label="中断中のセッション">
              <p>
                <strong>中断したSessionを最終状態から再開できます。</strong>
                再開したいSessionを選ぶと、あらすじ・進行度・注意点を確認してから続きを始められます。
              </p>
              <div className="resume-card-list" data-testid="session-list">
                {suspendedSessions.map((session) => (
                  <article
                    className="resume-card"
                    key={session.id}
                    data-testid={`session-card-${session.id}`}
                  >
                    <span>
                      Suspended / {session.id}
                    </span>
                    <h2>{session.scenarioTitle}</h2>
                    <p>
                      {session.genre} / 主人公: {session.hero}
                    </p>
                    <p className="resume-progress">
                      進行度: Turn {turnCountOf(session)} ・ プレイ時間 {session.playtime} ・ 最終プレイ {session.lastPlayed}
                    </p>
                    <button className="primary" onClick={() => selectSession(session)}>
                      {session.scenarioTitle}を再開
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {selected && view === 'confirm' && (
            <section className="wizard-panel" aria-label="再開前の確認">
              <p>
                <strong>再開前にこれまでの状況と注意点を確認します。</strong>
                AI要約のあらすじ、進行度、復元されるAIコンテキスト、中断中の変更点を見てから再開できます。
              </p>

              <article className="resume-card" data-testid="recap">
                <h2>これまでのあらすじ（AI要約）</h2>
                <p>{selected.recap}</p>
              </article>

              <dl className="resume-progress-grid" data-testid="progress">
                <div>
                  <dt>進行度（ターン数）</dt>
                  <dd>Turn {turnCountOf(selected)}</dd>
                </div>
                <div>
                  <dt>プレイ時間</dt>
                  <dd>{selected.playtime}</dd>
                </div>
                <div>
                  <dt>最終プレイ</dt>
                  <dd>{selected.lastPlayed}</dd>
                </div>
              </dl>

              <article className="resume-card" data-testid="context">
                <h2>復元されるAIコンテキスト</h2>
                <p>食い違いを防ぐため、再開時に以下の文脈を復元します。</p>
                <ul>
                  {selected.context.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article
                className={`resume-card resume-changes ${selected.changes.length === 0 ? 'no-change' : ''}`}
                data-testid="changes"
              >
                <h2>再開前の注意点</h2>
                {selected.changes.length === 0 ? (
                  <p>中断中にScenarioやAI設定の変更はありません。前回と同じ条件で再開できます。</p>
                ) : (
                  <ul>
                    {selected.changes.map((change) => (
                      <li key={`${change.kind}-${change.detail}`}>
                        <strong>{change.kind}変更:</strong> {change.detail}
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <div className="button-row">
                <button onClick={backToList}>一覧へ戻る</button>
                <button onClick={viewReadOnly} data-testid="readonly-button">
                  再開せずに読み返す（ReadOnly）
                </button>
                <button className="primary" onClick={resumeSession} data-testid="resume-button">
                  確認したので再開する（プレイ画面へ）
                </button>
              </div>
            </section>
          )}

          {selected && view === 'readonly' && (
            <section className="wizard-panel" aria-label="ReadOnly閲覧">
              <p>
                <strong>ReadOnlyモードで表示しています。</strong>
                再開せずに、これまでの全Turn（Turn 1〜{turnCountOf(selected)}）を読み返せます。入力欄は無く、Session状態はSuspendedのまま変化しません。
              </p>
              <article className="resume-card" data-testid="recap">
                <h2>これまでのあらすじ（AI要約）</h2>
                <p>{selected.recap}</p>
              </article>
              <div
                className="resume-restored-log readonly"
                aria-label={`全Turnログ（Turn 1〜${turnCountOf(selected)}）`}
                data-testid="restored-log"
              >
                {selected.turns.map((turn) => (
                  <article
                    className={`resume-turn ${turn.id === turnCountOf(selected) ? 'latest' : ''}`}
                    key={turn.id}
                    aria-label={`Turn ${String(turn.id).padStart(2, '0')}`}
                    data-testid={`restored-turn-${turn.id}`}
                  >
                    <div className="resume-turn-heading">
                      <span>Turn {String(turn.id).padStart(2, '0')}</span>
                      <h3>{turn.turnTitle}</h3>
                    </div>
                    {turn.playerInput && (
                      <p className="resume-turn-input">
                        <span className="sr-only">プレイヤーの入力: </span>⟶ {turn.playerInput}
                      </p>
                    )}
                    <p className="resume-turn-narrative">{turn.narrative}</p>
                  </article>
                ))}
              </div>
              <p className="readonly-note" data-testid="readonly-note">
                ReadOnly: 選択肢や入力は無効です。再開すると続きから操作できます。
              </p>
              <div className="button-row">
                <button onClick={() => selectSession(selected)}>再開の確認へ戻る</button>
                <button className="primary" onClick={resumeSession} data-testid="resume-button">
                  読み返したので再開する（プレイ画面へ）
                </button>
              </div>
            </section>
          )}
        </main>

        <aside className="ai-bookmark wizard-summary" aria-label="セッション状態サマリー">
          <h2>Session</h2>
          <article>
            <h3>状態</h3>
            <p data-testid="summary-state">{sessionState}</p>
            <p>{selected ? selected.id : '未選択'}</p>
          </article>
          <article>
            <h3>Scenario</h3>
            <p data-testid="summary-scenario">{selected ? selected.scenarioTitle : '一覧から選択してください'}</p>
            <p>{selected ? selected.genre : ''}</p>
          </article>
          <article>
            <h3>進行度</h3>
            <p data-testid="summary-progress">
              {selected ? `Turn ${turnCountOf(selected)} / ${selected.playtime}` : '—'}
            </p>
          </article>
          <article>
            <h3>主人公</h3>
            <p>{selected ? selected.hero : '—'}</p>
          </article>
        </aside>
      </div>
    </AppChrome>
  );
}
