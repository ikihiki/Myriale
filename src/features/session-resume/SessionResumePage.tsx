import { useMemo, useState } from 'react';
import { Button, Notice, surfaceRecipe } from '../../components/ui';
import { WizardNavigation } from '../../shared/WizardNavigation';
import { scenarioWizardShellClass, wizardButtonRowClass, wizardKickerClass, wizardNoticeClass, wizardPanelClass, wizardPaperClass, wizardSummaryClass } from '../../shared/scenarioWizardStyles';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { useOptionalAppStore } from '../../app/store';
import { STORY_IDS, navigateToStory, useAppNavigation } from '../../shared/nav';

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
const resumeCardClassName = `${surfaceRecipe({ role: 'card' })} my-3 [&>span]:text-myr-caption [&>span]:font-black [&>span]:uppercase [&>span]:tracking-[0.08em] [&>span]:text-myr-ruby [&_h2]:my-2 [&_h2]:font-serif [&_h2]:text-[clamp(20px,1.8vw,30px)] [&_h2]:leading-[1.05] [&_h2]:tracking-myr-display [&_p]:max-w-none [&_p]:text-myr-ink-soft [&_ul]:mt-2 [&_ul]:grid [&_ul]:gap-1.5 [&_ul]:pl-4.5 [&_ul]:text-myr-ink-soft`;

export function SessionResumePage() {
  const appNavigate = useAppNavigation();
  const appStore = useOptionalAppStore();
  const [view, setView] = useState<ResumeView>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState(
    '保存済みSessionの一覧です。進行中のSessionはプレイ画面へ戻り、中断したSessionは再開前に状態を確認できます。',
  );

  const selected = useMemo(
    () => suspendedSessions.find((session) => session.id === selectedId) ?? null,
    [selectedId],
  );

  const activeSessions = useMemo(
    () =>
      Object.values(appStore?.db.playSessions ?? {})
        .filter((session) => session.state === 'Active')
        .map((session) => ({
          ...session,
          scenarioTitle: appStore?.db.scenarios[session.scenarioId]?.title ?? session.scenarioId,
          genre: appStore?.db.scenarios[session.scenarioId]?.genre ?? 'Session',
        })),
    [appStore?.db.playSessions, appStore?.db.scenarios],
  );

  const openActiveSession = () => {
    if (appNavigate) {
      appNavigate('playSession');
      return;
    }
    navigateToStory(STORY_IDS.playSession);
  };

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
      <div className={scenarioWizardShellClass}>
        <WizardNavigation
          title="Suspended Sessions"
          ariaLabel="中断中セッション"
          help="途中で中断したSessionの一覧です。選ぶと再開前の確認画面に進みます。"
          items={suspendedSessions.map((session) => ({
            id: session.id,
            label: session.scenarioTitle,
            meta: `Turn ${turnCountOf(session)} / ${session.lastPlayed}`,
            ariaLabel: `${session.scenarioTitle} を選択`,
            testId: `suspended-${session.id}`,
          }))}
          activeId={selectedId ?? undefined}
          onSelect={(id) => {
            const session = suspendedSessions.find((item) => item.id === id);
            if (session) selectSession(session);
          }}
          markerLabel="Session state"
          markerValue={<span data-testid="session-state">{sessionState}</span>}
        />

        <main className={wizardPaperClass} aria-label="セッション再開アプリ画面">
          <p className={wizardKickerClass}>Session resume / Continue your story</p>
          <Notice className={wizardNoticeClass} data-testid="resume-notice">
            {notice}
          </Notice>

          {view === 'list' && (
            <section className={wizardPanelClass} aria-label="中断中のセッション">
              <p>
                <strong>保存済みSessionの状態を確認できます。</strong>
                中断したSessionはあらすじを確認して再開でき、進行中のSessionはそのままプレイ画面へ戻れます。
              </p>
              <div className="mt-3.5 grid gap-3" data-testid="session-list">
                {activeSessions.map((session) => (
                  <article
                    className={resumeCardClassName}
                    key={session.id}
                    data-testid={`session-card-${session.id}`}
                  >
                    <span>Active / {session.id}</span>
                    <h2>{session.scenarioTitle}</h2>
                    <p>
                      {session.genre} / 主人公: {session.hero}
                    </p>
                    <p className="text-myr-ui-sm font-extrabold !text-myr-ink-subtle">
                      進行度: Turn {session.turn} ・ 現在プレイ中
                    </p>
                    <Button variant="primary" size="sm" onClick={openActiveSession}>
                      {session.scenarioTitle}のプレイ画面へ
                    </Button>
                  </article>
                ))}
                {suspendedSessions.map((session) => (
                  <article
                    className={resumeCardClassName}
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
                    <p className="text-myr-ui-sm font-extrabold !text-myr-ink-subtle">
                      進行度: Turn {turnCountOf(session)} ・ プレイ時間 {session.playtime} ・ 最終プレイ {session.lastPlayed}
                    </p>
                    <Button variant="primary" size="sm" onClick={() => selectSession(session)}>
                      {session.scenarioTitle}を再開
                    </Button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {selected && view === 'confirm' && (
            <section className={wizardPanelClass} aria-label="再開前の確認">
              <p>
                <strong>再開前にこれまでの状況と注意点を確認します。</strong>
                AI要約のあらすじ、進行度、復元されるAIコンテキスト、中断中の変更点を見てから再開できます。
              </p>

              <article className={resumeCardClassName} data-testid="recap">
                <h2>これまでのあらすじ（AI要約）</h2>
                <p>{selected.recap}</p>
              </article>

              <dl className="my-3 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 [&_div]:rounded-2xl [&_div]:border [&_div]:border-myr-line-soft [&_div]:bg-myr-paper-glass [&_div]:px-3.5 [&_div]:py-3 [&_dt]:m-0 [&_dt]:text-xs [&_dt]:font-extrabold [&_dt]:tracking-myr-label [&_dt]:text-myr-ink-subtle [&_dd]:mb-0 [&_dd]:mt-1.5 [&_dd]:font-serif [&_dd]:text-[22px] [&_dd]:tracking-[-0.02em]" data-testid="progress">
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

              <article className={resumeCardClassName} data-testid="context">
                <h2>復元されるAIコンテキスト</h2>
                <p>食い違いを防ぐため、再開時に以下の文脈を復元します。</p>
                <ul>
                  {selected.context.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article
                className={`my-3 rounded-myr-card border p-4 [&_h2]:my-2 [&_h2]:font-serif [&_h2]:text-[clamp(20px,1.8vw,30px)] [&_h2]:leading-[1.05] [&_h2]:tracking-myr-display [&_p]:max-w-none [&_p]:text-myr-ink-soft [&_ul]:mt-2 [&_ul]:grid [&_ul]:gap-1.5 [&_ul]:pl-4.5 [&_ul]:text-myr-ink-soft ${selected.changes.length === 0 ? 'border-[rgba(74,132,92,0.32)] bg-[rgba(232,245,233,0.8)]' : 'border-[rgba(184,74,74,0.3)] bg-[rgba(255,240,224,0.8)]'}`}
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

              <div className={wizardButtonRowClass}>
                <Button variant="secondary" size="sm" onClick={backToList}>一覧へ戻る</Button>
                <Button variant="secondary" size="sm" onClick={viewReadOnly} data-testid="readonly-button">
                  再開せずに読み返す（ReadOnly）
                </Button>
                <Button variant="primary" size="sm" onClick={resumeSession} data-testid="resume-button">
                  確認したので再開する（プレイ画面へ）
                </Button>
              </div>
            </section>
          )}

          {selected && view === 'readonly' && (
            <section className={wizardPanelClass} aria-label="ReadOnly閲覧">
              <p>
                <strong>ReadOnlyモードで表示しています。</strong>
                再開せずに、これまでの全Turn（Turn 1〜{turnCountOf(selected)}）を読み返せます。入力欄は無く、Session状態はSuspendedのまま変化しません。
              </p>
              <article className={resumeCardClassName} data-testid="recap">
                <h2>これまでのあらすじ（AI要約）</h2>
                <p>{selected.recap}</p>
              </article>
              <div
                className="my-3.5 grid max-h-90 gap-2.5 overflow-y-auto p-1"
                aria-label={`全Turnログ（Turn 1〜${turnCountOf(selected)}）`}
                data-testid="restored-log"
              >
                {selected.turns.map((turn) => (
                  <article
                    className={`rounded-2xl border px-4 py-3.5 ${turn.id === turnCountOf(selected) ? 'border-myr-gold bg-[rgba(255,247,230,0.92)] shadow-[0_0_0_1px_rgba(217,164,65,0.4)]' : 'border-myr-line-soft bg-myr-paper-glass'}`}
                    key={turn.id}
                    aria-label={`Turn ${String(turn.id).padStart(2, '0')}`}
                    data-testid={`restored-turn-${turn.id}`}
                  >
                    <div className="flex flex-wrap items-baseline gap-2.5 [&_h3]:m-0 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:tracking-[-0.02em] [&>span]:text-myr-caption [&>span]:font-black [&>span]:uppercase [&>span]:tracking-[0.12em] [&>span]:text-[#7054dd]">
                      <span>Turn {String(turn.id).padStart(2, '0')}</span>
                      <h3>{turn.turnTitle}</h3>
                    </div>
                    {turn.playerInput && (
                      <p className="mb-1.5 mt-2 text-myr-ui-sm font-extrabold !text-myr-ink-subtle">
                        <span className="sr-only">プレイヤーの入力: </span>⟶ {turn.playerInput}
                      </p>
                    )}
                    <p className="m-0 leading-[1.7] !text-myr-ink-soft">{turn.narrative}</p>
                  </article>
                ))}
              </div>
              <p className="mt-2.5 rounded-xl bg-[rgba(43,41,64,0.08)] px-3 py-2 text-myr-ui-sm font-extrabold !text-myr-ink-soft" data-testid="readonly-note">
                ReadOnly: 選択肢や入力は無効です。再開すると続きから操作できます。
              </p>
              <div className={wizardButtonRowClass}>
                <Button variant="secondary" size="sm" onClick={() => selectSession(selected)}>再開の確認へ戻る</Button>
                <Button variant="primary" size="sm" onClick={resumeSession} data-testid="resume-button">
                  読み返したので再開する（プレイ画面へ）
                </Button>
              </div>
            </section>
          )}
        </main>

        <aside className={wizardSummaryClass} aria-label="セッション状態サマリー">
          <h2>Session</h2>
          <article className={surfaceRecipe({ role: 'card', variant: 'summary' })}>
            <h3>状態</h3>
            <p data-testid="summary-state">{sessionState}</p>
            <p>{selected ? selected.id : '未選択'}</p>
          </article>
          <article className={surfaceRecipe({ role: 'card', variant: 'summary' })}>
            <h3>Scenario</h3>
            <p data-testid="summary-scenario">{selected ? selected.scenarioTitle : '一覧から選択してください'}</p>
            <p>{selected ? selected.genre : ''}</p>
          </article>
          <article className={surfaceRecipe({ role: 'card', variant: 'summary' })}>
            <h3>進行度</h3>
            <p data-testid="summary-progress">
              {selected ? `Turn ${turnCountOf(selected)} / ${selected.playtime}` : '—'}
            </p>
          </article>
          <article className={surfaceRecipe({ role: 'card', variant: 'summary' })}>
            <h3>主人公</h3>
            <p>{selected ? selected.hero : '—'}</p>
          </article>
        </aside>
      </div>
    </AppChrome>
  );
}
