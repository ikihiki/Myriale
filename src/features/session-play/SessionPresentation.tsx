import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { actionRowClassName, Button, Label, Notice, SummaryInset, Textarea } from '../../components/ui';
import { ArrowUpIcon, CloseIcon, LightbulbIcon, RotateBackIcon, SparkleIcon } from '../../components/icons';
import { AppChrome } from '../../shared/AppChrome';
import { useOptionalAppStore, type TurnDisplayFlags } from '../../app/store';
import { SessionTurn } from '../../shared/SessionTurn';
import { SessionNotesWorkspace } from '../../SessionNotesWorkspace';
import { WizardNavigation } from '../../shared/WizardNavigation';
import { scenarioWizardShellClass, wizardPaperClass, wizardSummaryClass } from '../../shared/scenarioWizardStyles';
import { SessionActivityFeed } from './SessionActivityFeed';
import { MyrialeDialogContent, MyrialeDialogRoot, MyrialeToggle, MyrialeSelect } from '../../ui/MyrialeRadix';
import type { NarrativeInteractionType } from './sessionPlayApi';
import { sessionInfoNotice, type DialogueTurn, type HeadingLink, type SessionNotice, type SessionNoticeInput, type SessionPresentationProps } from './sessionModel';

const modeLabels = {
  dialogue: { badge: '対話中', label: 'AI対話モード', summary: 'Dialogue Mode', reason: '自由入力で行動や会話を送れます。' },
  battle: { badge: 'バトル中', label: 'バトル', summary: 'Forced Mode / バトル', reason: '自由入力は無効。バトル行動ボタンで進行します。' },
  roll: { badge: '判定中', label: '判定', summary: 'Forced Mode / 判定', reason: '自由入力と巻き戻しが無効。判定結果を確定します。' },
  event: { badge: 'イベント進行中', label: '強制イベント', summary: 'Forced Mode / イベント', reason: '自由入力は無効。イベントを順番に再生します。' },
  recovering: { badge: '復旧中', label: '復旧確認', summary: 'Recovery', reason: '未確定の処理を破棄し、確定地点から復旧します。' },
} as const;

const defaultProgram = {
  mode: 'dialogue' as const,
  flavor: 'dialogue' as const,
  battle: { enemy: '', playerHp: 0, enemyHp: 0, turn: 1 },
  rollResult: null,
  fixedRoll: 'ランダム',
  eventAdvanced: false,
  pendingAction: '未完了処理なし',
  lastConfirmed: '確定済みTurnを表示中',
  recoveryPoint: null,
  transitions: [],
  notice: '',
  onFixedRollChange: () => undefined,
  onStartBattle: () => undefined,
  onStartRoll: () => undefined,
  onStartEvent: () => undefined,
  onBattleAction: () => undefined,
  onRoll: () => undefined,
  onAdvanceEvent: () => undefined,
  onComplete: () => undefined,
  onProcessingError: () => undefined,
  onRecover: () => undefined,
  onReconnect: () => undefined,
};

const normalizeNotice = (notice: SessionNoticeInput): SessionNotice =>
  typeof notice === 'string' ? sessionInfoNotice(notice) : notice;

const noticeActionLabel = (action: SessionNotice['action']) => ({
  login: 'ログインへ',
  reload: '再読み込み',
  'session-list': 'セッション一覧へ',
})[action ?? 'reload'];

export function SessionPresentationStatus({
  account,
  notice,
  onLogout,
  onLogin,
  onReload,
  onSessionList,
}: {
  account: SessionPresentationProps['account'];
  notice?: SessionNotice | null;
  onLogout?: SessionPresentationProps['onLogout'];
  onLogin?: () => void;
  onReload?: () => void;
  onSessionList?: () => void;
}) {
  const action = notice?.action === 'login' ? onLogin : notice?.action === 'session-list' ? onSessionList : onReload;
  return (
    <AppChrome section="sessions" breadcrumbs={[{ label: 'Myriale', to: 'home' }, { label: 'セッション' }]} account={account} onLogout={onLogout}>
      <main className="grid min-h-[calc(100vh-118px)] place-items-center bg-[image:var(--myr-screen-background)] p-6 text-myr-ink">
        <section className="max-w-xl rounded-myr-panel bg-myr-paper p-8 text-center shadow-myr-panel" aria-label={notice ? 'Session読み込みエラー' : 'Session読み込み中'} data-testid="session-load-status" data-notice-kind={notice?.kind}>
          <h1 className="font-myr-display text-4xl">{notice?.title ?? 'Sessionを読み込んでいます'}</h1>
          <p role={notice ? 'alert' : 'status'}>{notice?.message ?? '確定済みのTurnを取得しています。'}</p>
          {notice?.action && action && <Button variant={notice.tone === 'danger' ? 'danger' : 'secondary'} size="lg" onClick={action}>{noticeActionLabel(notice.action)}</Button>}
        </section>
      </main>
    </AppChrome>
  );
}

export function SessionPresentation({
  sessionId,
  account,
  turns,
  headingLinks,
  sessionStateLabel,
  activitySession,
  activeModulePanel,
  moduleHandoffPending = false,
  initialInput = '',
  initialInteractionType = 'dialogue',
  initialNotice = '',
  liveNotice = null,
  isSubmitting = false,
  isRecommending = false,
  turnDisplay,
  program: suppliedProgram,
  onLogout,
  onLogin,
  onReload,
  onSessionList,
  onSubmit,
  onRecommend,
  onClarification,
  onExecutionAction,
  onNoteReview,
  onRewind,
}: SessionPresentationProps) {
  const appStore = useOptionalAppStore();
  const program = suppliedProgram ?? defaultProgram;
  const hasProgramSimulator = suppliedProgram !== undefined;
  const [input, setInput] = useState(initialInput);
  const [interactionType, setInteractionType] = useState<NarrativeInteractionType>(initialInteractionType);
  const [selectedTurnId, setSelectedTurnId] = useState(turns.at(-1)?.id ?? 1);
  const [retryAvailable, setRetryAvailable] = useState(false);
  const [noticeInput, setNotice] = useState<SessionNoticeInput>(initialNotice);
  const notice = noticeInput ? normalizeNotice(noticeInput) : null;
  const notesMode = appStore?.db.ui.notesPanelMode ?? 'side';
  const setNotesMode = (mode: 'side' | 'full') => appStore?.dispatch({ type: 'NOTES_PANEL_MODE_CHANGED', mode });
  const [notesView, setNotesView] = useState<'hidden' | 'split' | 'full'>(notesMode === 'full' ? 'full' : 'split');
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const [showInterpretationFor, setShowInterpretationFor] = useState<number[]>([]);
  const [pendingRewindId, setPendingRewindId] = useState<number | null>(null);
  const [notesRailWidth, setNotesRailWidth] = useState(340);
  const [debugPanelOpen, setDebugPanelOpen] = useState(program.flavor === 'modeTransition');
  const [keepSucceededExecutionStatusVisible, setKeepSucceededExecutionStatusVisible] = useState(false);

  useEffect(() => {
    if (program.notice) setNotice(program.notice);
  }, [program.notice]);
  useEffect(() => { if (liveNotice) setNotice(liveNotice); }, [liveNotice]);
  useEffect(() => {
    const latestId = turns.at(-1)?.id;
    if (latestId != null && !turns.some((turn) => turn.id === selectedTurnId)) setSelectedTurnId(latestId);
  }, [selectedTurnId, turns]);

  const setNotesViewMode = (view: 'hidden' | 'split' | 'full') => {
    const nextView = isNarrowViewport && view === 'split' ? 'full' : view;
    setNotesView(nextView);
    if (nextView !== 'hidden') setNotesMode(nextView === 'full' ? 'full' : 'side');
  };
  const selectedTurn = useMemo(() => turns.find((turn) => turn.id === selectedTurnId) ?? turns[turns.length - 1], [selectedTurnId, turns]);
  const latestTurn = turns[turns.length - 1];
  const availableHeadingLinks = headingLinks.filter((heading) => heading.startTurnId <= latestTurn.id);
  const tocHeadingLinks: HeadingLink[] = availableHeadingLinks.at(-1)?.startTurnId === latestTurn.id
    ? availableHeadingLinks
    : [...availableHeadingLinks, { title: '最新の対話', startTurnId: latestTurn.id, summary: 'AIが付けた最新の見出し。TOC末尾は常に最後のTurnを指す' }];
  const activeHeading = tocHeadingLinks.find((heading, index) => {
    const nextHeading = tocHeadingLinks[index + 1];
    return selectedTurnId >= heading.startTurnId && (!nextHeading || selectedTurnId < nextHeading.startTurnId);
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(max-width: 1120px)');
    const syncViewport = () => {
      setIsNarrowViewport(media.matches);
      if (media.matches) setNotesView((current) => current === 'split' ? 'hidden' : current);
    };
    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

  const turnRefs = useRef<Record<number, HTMLElement | null>>({});
  useEffect(() => {
    const node = turnRefs.current[selectedTurnId];
    if (node && typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedTurnId, turns]);

  const sendInput = async () => {
    const submittedInput = input.trim();
    if (!submittedInput) { setNotice('自然言語で行動や会話を入力してください。文法が不完全でも受理します。'); return; }
    const result = await onSubmit(submittedInput, interactionType);
    setNotice(result.notice);
    setRetryAvailable(!result.ok && normalizeNotice(result.notice).retryable);
    if (result.ok) { setInput(''); setInteractionType('dialogue'); }
  };
  const askClarification = async () => {
    if (onClarification) {
      const result = await onClarification();
      setNotice(result.notice);
      return;
    }
    setInput('今の状況を簡単にまとめて');
    setInteractionType('clarification');
    setNotice('補足要求を入力欄へ設定しました。理解補助として送信し、物語進行は許可しません。');
  };
  const recommendAction = async () => {
    setNotice('AIが現在の状況から次の行動案を考えています。');
    const result = await onRecommend();
    setNotice(result.notice);
    if (result.ok && result.value) { setInput(result.value); setInteractionType('dialogue'); }
  };
  const handleExecutionAction = async (executionId: string, action: 'retry' | 'cancel' | 'dismiss') => {
    if (!onExecutionAction) return;
    const result = await onExecutionAction(executionId, action);
    setNotice(result.notice);
  };
  const handleNoteReview = async (...args: Parameters<NonNullable<SessionPresentationProps['onNoteReview']>>) => {
    if (!onNoteReview) return;
    const result = await onNoteReview(...args);
    setNotice(result.notice);
  };
  const toggleInterpretation = (turn: DialogueTurn) => setShowInterpretationFor((current) => current.includes(turn.id) ? current.filter((id) => id !== turn.id) : [...current, turn.id]);
  const deleteDraft = () => { setInput(''); setInteractionType('dialogue'); setNotice('削除: 入力欄の未送信テキストを無効化しました。再入力できます。'); };
  const jumpToHeading = (heading: HeadingLink) => { setSelectedTurnId(heading.startTurnId); setNotice(`AI見出し「${heading.title}」から、場面の切り替わりTurn ${String(heading.startTurnId).padStart(2, '0')}へジャンプしました。ReadOnly表示のためSession状態は変化しません。`); };
  const requestRewind = (id: number) => {
    if (!onRewind) { setNotice('Serverに確定したTurnの巻き戻しはまだ利用できません。履歴は変更されていません。'); return; }
    setPendingRewindId(id);
    setNotice(`Turn ${String(id).padStart(2, '0')}まで戻る前に確認します。指定ターン以降のログと非同期処理を無効化します。`);
  };
  const confirmRewind = async () => {
    if (pendingRewindId == null || !onRewind) return;
    const turnId = pendingRewindId;
    setPendingRewindId(null);
    const result = await onRewind(turnId);
    setNotice(result.notice);
    if (result.ok) setSelectedTurnId(turnId);
  };

  const sessionMode = activeModulePanel || moduleHandoffPending ? 'roll' : program.mode;
  const sessionModeFlavor = activeModulePanel || moduleHandoffPending ? 'program' : program.flavor;
  const battle = program.battle;
  const rollResult = program.rollResult;
  const fixedRoll = program.fixedRoll;
  const eventAdvanced = program.eventAdvanced;
  const pendingAction = program.pendingAction;
  const lastConfirmed = program.lastConfirmed;
  const recoveryPoint = program.recoveryPoint;
  const transitionRows = program.transitions;
  const modeMeta = modeLabels[sessionMode];
  const forcedMode = sessionMode !== 'dialogue';
  const programPanelClass = 'mt-3 grid gap-3 rounded-2xl border border-myr-ink/14 bg-myr-session-program-panel p-4';
  const modeBadgeClass = { dialogue: 'bg-myr-session-mode-dialogue', battle: 'bg-myr-ruby', roll: 'bg-myr-session-mode-roll', event: 'bg-myr-session-mode-event', recovering: 'bg-myr-plum' }[sessionMode];
  const defaultTurnDisplay: TurnDisplayFlags = { allowRewind: Boolean(onRewind), showInterpretation: true, leadTone: 'player', leadTag: '⟶' };
  const displayForTurn = (turn: DialogueTurn): TurnDisplayFlags => ({ ...defaultTurnDisplay, ...(turnDisplay?.[turn.id] ?? {}), ...(turn.display ?? {}), ...(activitySession ? { allowRewind: false } : {}) });
  const generatedLog = turns.map((turn) => `${turn.turnTitle} ${turn.playerInput ?? ''} ${turn.narrative}`).join('\n');
  const startBattleFromCondition = program.onStartBattle;
  const startRollFromCondition = program.onStartRoll;
  const startEventFromCondition = program.onStartEvent;
  const resolveBattleAction = program.onBattleAction;
  const rollDie = program.onRoll;
  const advanceEvent = program.onAdvanceEvent;
  const completeProgramMode = program.onComplete;
  const simulateProcessingError = program.onProcessingError;
  const recoverFromPoint = program.onRecover;
  const simulateReconnect = program.onReconnect;
  const setFixedRoll = program.onFixedRollChange;
  const sessionPageClassName = `${scenarioWizardShellClass} min-h-[calc(100vh-118px)] min-w-0 max-w-full grid-cols-[190px_minmax(0,1fr)_minmax(300px,var(--notes-rail-width,340px))] max-myr-workspace:grid-cols-1`;
  const sessionPageStyle = { '--notes-rail-width': `${notesRailWidth}px` } as CSSProperties;
  return (
    <AppChrome
      section="sessions"
      breadcrumbs={[
        { label: 'Myriale', to: 'scenarioRegister' },
        { label: 'セッション', to: 'startSession' },
        { label: 'プレイ中の対話' },
      ]}
      account={account}
      onLogout={onLogout}
    >
      <div className={sessionPageClassName} style={sessionPageStyle}>
      <WizardNavigation
        title="AI Headings"
        ariaLabel="AI生成見出しリンク"
        help="各Turnではなく、AIがログの区切りに付けた見出しです。選択すると、その場面が始まるTurnへジャンプします。"
        items={tocHeadingLinks.map((heading) => ({
          id: heading.title,
          label: heading.title,
          meta: `Turn ${String(heading.startTurnId).padStart(2, '0')}から / ${heading.summary}`,
          ariaLabel: `見出し「${heading.title}」へ（Turn ${String(heading.startTurnId).padStart(2, '0')}から）`,
          testId: `heading-link-${heading.startTurnId}`,
        }))}
        activeId={activeHeading?.title}
        onSelect={(id) => {
          const heading = tocHeadingLinks.find((item) => item.title === id);
          if (heading) jumpToHeading(heading);
        }}
        markerLabel="Session state"
        markerValue={<span data-testid="session-state">{sessionStateLabel}</span>}
      />

      <main className={`${wizardPaperClass} min-w-0 ${notesView === 'full' ? 'hidden' : ''} ${notesView === 'hidden' ? 'col-[2/-1] max-myr-workspace:col-start-1' : ''}`} aria-label="AI対話モード">
        <Label as="p" textRole="eyebrow" className="mb-2">Session play / AI dialogue mode</Label>
        <div className="mb-2.5 flex justify-end gap-2" aria-label="ノート表示切り替え">
          {notesView === 'hidden' ? (
            <Button variant="primary" size="sm" onClick={() => setNotesViewMode(isNarrowViewport ? 'full' : 'split')}>ノートを表示</Button>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => setNotesViewMode('hidden')}>ノートを非表示</Button>
              <Button variant="primary" size="sm" onClick={() => setNotesViewMode('full')}>ノートを全画面表示</Button>
            </>
          )}
        </div>
        {notice && (
          <Notice
            className="sticky top-[126px] z-[60] my-4.5 flex items-start gap-3 drop-shadow-[0_12px_18px_rgba(18,16,25,.28)] backdrop-blur-md"
            data-testid="dialogue-notice"
            data-notice-kind={notice.kind}
            tone={notice.tone}
            role={notice.tone === 'danger' ? 'alert' : 'status'}
          >
            <span className="min-w-0 flex-1">{notice.title && <strong className="block">{notice.title}</strong>}{notice.message}</span>
            <span className="flex shrink-0 items-center gap-2">
              {notice.action && (
                <Button
                  variant={notice.tone === 'danger' ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={notice.action === 'login' ? onLogin : notice.action === 'session-list' ? onSessionList : onReload}
                >
                  {noticeActionLabel(notice.action)}
                </Button>
              )}
              <Button
                type="button"
                variant="icon"
                size="iconSm"
                surface="dark"
                aria-label="メッセージを閉じる"
                onClick={() => setNotice('')}
              >
                <CloseIcon />
              </Button>
            </span>
          </Notice>
        )}

        {activitySession ? (
          <SessionActivityFeed session={activitySession} onExecutionAction={(id, action) => void handleExecutionAction(id, action)} onNoteReview={(id, action, request) => void handleNoteReview(id, action, request)} keepSucceededStatusVisible={keepSucceededExecutionStatusVisible} />
        ) : (
        <section className="grid max-h-[48vh] gap-3 overflow-auto pr-2" aria-label="対話ログ" data-testid="dialogue-log">
          {turns.map((turn) => {
            const display = displayForTurn(turn);
            const leadTone = display.leadTone ?? 'player';
            const interpretationUiEnabled = true;
            const canShowInterpretation = Boolean(
              interpretationUiEnabled && turn.interpretation && display.showInterpretation,
            );
            return (
              <SessionTurn
                key={turn.id}
                articleRef={(node) => {
                  turnRefs.current[turn.id] = node;
                }}
                ariaLabel={`Turn ${String(turn.id).padStart(2, '0')}`}
                selected={selectedTurnId === turn.id}
                headingActions={display.allowRewind ? (
                  <Button
                    variant="icon"
                    size="iconSm"
                    onClick={() => requestRewind(turn.id)}
                    aria-label="ここまで戻る"
                    title="ここまで戻る"
                  >
                    <RotateBackIcon />
                  </Button>
                ) : undefined}
                narrative={turn.narrative}
                narrativeTestId={`turn-${turn.id}-narrative`}
                lead={
                  turn.playerInput
                    ? {
                        tone: leadTone,
                        tag: display.leadTag ?? (leadTone === 'program' ? 'PROGRAM' : '⟶'),
                        srLabel: leadTone === 'program' ? 'プログラム入力: ' : 'プレイヤーの入力: ',
                        text: turn.playerInput,
                        actions: canShowInterpretation ? (
                          <MyrialeToggle
                            className="!justify-self-start !rounded-full !border !border-myr-iris/30 !bg-myr-session-control/55 !px-3 !py-1 !text-myr-caption !font-extrabold !text-[#6044d4] data-[state=on]:!bg-myr-iris/16 data-[state=on]:!text-[#4a32b0]"
                            pressed={showInterpretationFor.includes(turn.id)}
                            aria-label={`Turn ${String(turn.id).padStart(2, '0')}の入力解釈を${showInterpretationFor.includes(turn.id) ? '隠す' : '見る'}`}
                            onPressedChange={() => toggleInterpretation(turn)}
                          >
                            {showInterpretationFor.includes(turn.id) ? '⌄ 解釈を隠す' : '⌃ どう解釈された？'}
                          </MyrialeToggle>
                        ) : undefined,
                        detail:
                          canShowInterpretation && showInterpretationFor.includes(turn.id) ? (
                            <p className="m-0 flex max-w-none items-baseline gap-2 rounded-xl bg-myr-gold/18 px-3 py-3 text-myr-ui-sm font-semibold text-[#4b3a20]" data-testid={`turn-${turn.id}-interpretation`}>
                              <span className="shrink-0 text-[#b07a16]" aria-hidden="true">⚙</span>
                              {turn.interpretation}
                            </p>
                          ) : undefined,
                      }
                    : undefined
                }
              />
            );
          })}
        </section>        )}


        {pendingRewindId != null && (
          <MyrialeDialogRoot open onOpenChange={(open) => { if (!open) setPendingRewindId(null); }}>
            <MyrialeDialogContent
              title="巻き戻し確認"
              tone="warning"
              portal={false}
              data-testid="rewind-dialog"
              bodyClassName="grid gap-2"
              footer={(
                <>
                  <Button variant="danger" size="sm" onClick={confirmRewind}>巻き戻しを確定</Button>
                  <Button variant="ghost" size="sm" onClick={() => setPendingRewindId(null)}>キャンセル</Button>
                </>
              )}
            >
              <strong>Turn {String(pendingRewindId).padStart(2, '0')}まで戻りますか？</strong>
              <p className="m-0 max-w-none">指定ターン以降のログ、挿絵生成などの非同期処理を無効化またはキャンセルします。</p>
            </MyrialeDialogContent>
          </MyrialeDialogRoot>
        )}

        {activeModulePanel}
        {moduleHandoffPending && !activeModulePanel && (
          <section className="mx-auto mb-4 w-full max-w-myr-reading rounded-2xl border border-myr-gold/35 bg-myr-paper px-5 py-4" role="status" data-testid="module-handoff-pending">
            <strong>確定結果をNarrativeへ引き渡しています</strong>
            <p className="m-0 mt-1 text-myr-ui-sm text-myr-ink-soft">ダイス結果とSession Effectは保存済みです。描写が追加されるまで自由入力は無効です。</p>
          </section>
        )}

        <section className="mx-auto mt-4 mb-1 w-full max-w-myr-reading justify-self-stretch px-3 max-sm:px-0" aria-label="自然言語入力">
          {forcedMode && (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-3 rounded-2xl border border-myr-ink/16 bg-myr-paper/80 px-4 py-3 text-myr-ui-sm" aria-label="現在の入力モード">
                <span className={`shrink-0 rounded-full px-4 py-1 text-myr-ui-sm font-black tracking-myr-label text-myr-paper ${modeBadgeClass}`} data-testid="mode-badge">{modeMeta.badge}</span>
                <span data-testid="session-mode-state">{modeMeta.label}</span>
                <span>{modeMeta.summary}</span>
              </div>
              <p className="font-bold text-myr-ruby" data-testid="input-disabled-reason">{modeMeta.reason} 終了後に可能。</p>
              <p className="text-myr-ui-sm text-myr-ink-soft" data-testid="mode-reason">{modeMeta.reason}</p>
            </>
          )}
          <div className="overflow-hidden rounded-[26px] border border-myr-ink/15 bg-myr-session-composer shadow-[0_10px_30px_rgba(34,29,48,0.11),0_1px_2px_rgba(34,29,48,0.08)] transition-[border-color,box-shadow] duration-150 focus-within:border-myr-iris/45 focus-within:shadow-[0_12px_34px_rgba(34,29,48,0.14),0_0_0_3px_rgba(124,92,255,0.09)] max-sm:rounded-myr-panel motion-reduce:transition-none">
            <Textarea
              variant="composer"
              aria-label="自由に行動や会話を入力"
              value={input}
              onChange={(event) => {
                const nextInput = event.target.value;
                setInput(nextInput);
                if (retryAvailable) setRetryAvailable(false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  if (input.trim() && !isSubmitting) void sendInput();
                }
              }}
              placeholder="次の行動を入力"
              disabled={forcedMode || isSubmitting}
            />

            {sessionMode === 'dialogue' && (
              <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-2 pl-3">
                <div className="flex items-center gap-1" aria-label="入力補助">
                  <Button
                    variant="icon"
                    size="iconMd"
                    onClick={askClarification}
                    aria-label="状況を簡単にまとめて聞く"
                    title="状況を簡単にまとめて聞く"
                  >
                    <SparkleIcon />
                  </Button>
                  <Button
                    variant="icon"
                    size="iconMd"
                    onClick={() => void recommendAction()}
                    aria-label="AIに次の行動を提案してもらう"
                    title="AIに次の行動を提案してもらう"
                    disabled={isRecommending || isSubmitting}
                  >
                    {isRecommending
                      ? <span className="size-3.5 animate-spin rounded-full border-2 border-myr-slate/30 border-t-myr-iris motion-reduce:animate-[spin_1.4s_linear_infinite]" aria-hidden="true" />
                      : <LightbulbIcon />}
                  </Button>
                  <Button
                    variant="icon"
                    size="iconMd"
                    onClick={deleteDraft}
                    aria-label="入力を消去"
                    title="入力を消去"
                    disabled={!input}
                  >
                    <CloseIcon />
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  size="iconMd"
                  className="!size-9"
                  onClick={() => void sendInput()}
                  data-testid="send-free-input"
                  disabled={isSubmitting || !input.trim()}
                  aria-label={isSubmitting ? 'Narrativeを生成中' : retryAvailable ? '同じ入力を再試行' : '行動を送る'}
                  title={retryAvailable ? '同じ入力を再試行' : '行動を送る'}
                >
                  {isSubmitting
                    ? <span className="size-3.5 animate-spin rounded-full border-2 border-myr-session-control/40 border-t-myr-session-control motion-reduce:animate-[spin_1.4s_linear_infinite]" aria-hidden="true" />
                    : <ArrowUpIcon />}
                </Button>
              </div>
            )}
          </div>


          {hasProgramSimulator && sessionMode === 'battle' && (
            <div className={programPanelClass} data-testid="active-battle-turn">
              <p data-testid="battle-turn-lead">Battle Turn {battle.turn}</p>
              <div role="group" aria-label={sessionModeFlavor === 'modeTransition' ? 'バトルターン行動' : 'バトル行動'} className={actionRowClassName}>
                {(['攻撃', '防御', 'スキル', '逃走'] as const).map((action) => <Button key={action} variant="secondary" size="sm" onClick={() => resolveBattleAction(action)}>{action}</Button>)}
              </div>
              <Button variant="secondary" size="sm" onClick={completeProgramMode}>AI対話へ戻る</Button>
              <Button variant="secondary" size="sm" onClick={completeProgramMode}>正常終了してAI対話へ戻る</Button>
              <Button variant="danger" size="sm" onClick={simulateProcessingError}>処理エラーを発生</Button>
            </div>
          )}

          {hasProgramSimulator && sessionMode === 'roll' && (
            <div className={programPanelClass}>
              <MyrialeSelect
                label="ダイス固定値"
                value={fixedRoll}
                onValueChange={setFixedRoll}
                options={['ランダム', '1', '2', '3', '4', '5', '6'].map((value) => ({ value, label: value }))}
              />
              <Button variant="primary" size="sm" data-testid="roll-button" onClick={rollDie}>ダイスを振る</Button>
              {rollResult && <p data-testid="roll-result">d6 = {rollResult.value} → {rollResult.success ? '成功' : '失敗'}</p>}
              <Button variant="ghost" size="sm" onClick={simulateReconnect}>通信断から再接続</Button>
              <Button variant="secondary" size="sm" onClick={completeProgramMode}>正常終了してAI対話へ戻る</Button>
            </div>
          )}

          {hasProgramSimulator && sessionMode === 'event' && (
            <div className={programPanelClass}>
              <p data-testid="event-lock">中断・分岐はできません</p>
              <p data-testid="current-objective">崩落イベント</p>
              <p data-testid="processing-detail">順番に再生</p>
              <Button variant="primary" size="sm" data-testid="event-advance" onClick={advanceEvent}>イベントを進める</Button>
              <Button variant="secondary" size="sm" onClick={completeProgramMode}>正常終了してAI対話へ戻る</Button>
              {eventAdvanced && <p>イベントは確定済みです。</p>}
            </div>
          )}

          {hasProgramSimulator && sessionMode === 'recovering' && (
            <div className={programPanelClass}>
              <Button variant="secondary" size="sm" onClick={() => recoverFromPoint('lastConfirmed')}>最後に確定した地点から再開</Button>
              <Button variant="secondary" size="sm" onClick={() => recoverFromPoint('safePoint')}>安全なセーフポイントから再開</Button>
            </div>
          )}
        </section>
        <div className="visually-hidden" data-testid="program-log">{generatedLog}</div>
        <div className="visually-hidden" data-testid="narrative-log">{generatedLog}</div>
        <div className="visually-hidden" data-testid="program-notice">{notice?.message}</div>
        <div className="visually-hidden" data-testid="mode-notice">{notice?.message}</div>

        {hasProgramSimulator && <section className="mt-4.5 border-t border-myr-ink/18 pt-3" aria-label="デバッグパネル">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={debugPanelOpen}
            aria-controls="session-debug-panel"
            onClick={() => setDebugPanelOpen((open) => !open)}
          >
            {debugPanelOpen ? 'デバッグパネルを非表示' : 'デバッグパネルを表示'}
          </Button>
          <div id="session-debug-panel" className="mt-3 grid gap-3" hidden={!debugPanelOpen}>
            <section className="rounded-[14px] border border-[#4a427a]/20 bg-myr-session-debug/72 px-4 py-3" aria-label="AI生成表示設定">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  className="mt-0.75 size-4 shrink-0 accent-[#6052a8]"
                  type="checkbox"
                  checked={keepSucceededExecutionStatusVisible}
                  onChange={(event) => setKeepSucceededExecutionStatusVisible(event.target.checked)}
                />
                <span className="grid gap-1">
                  <strong>成功後もAI生成ステータスを表示する</strong>
                  <small className="leading-normal text-[#666176]">通常は完了後に消えるステータスメッセージを、デバッグ確認のため対話ログに残します。</small>
                </span>
              </label>
            </section>
            {(sessionModeFlavor === 'program' || sessionModeFlavor === 'modeTransition') && (
              <section className="my-3.5 grid gap-3 rounded-2xl border border-myr-gold/35 bg-myr-paper/70 px-4 py-3" aria-label="条件によるモード遷移">
                <div>
                  <strong>プログラム主導シーン確認</strong>
                  <p className="mt-1 text-myr-ui-sm text-myr-slate">条件成立時に入力UIだけを切り替え、結果は同じ対話ログに追加されます。</p>
                </div>
                {sessionMode !== 'roll' && (
                  <MyrialeSelect
                    label="ダイス固定値"
                    value={fixedRoll}
                    onValueChange={setFixedRoll}
                    options={['ランダム', '1', '2', '3', '4', '5', '6'].map((value) => ({ value, label: value }))}
                  />
                )}
                <div className={actionRowClassName}>
                  <Button variant="secondary" size="sm" onClick={() => startBattleFromCondition('バトルを開始')}>バトルを開始</Button>
                  <Button className="visually-hidden" onClick={() => startBattleFromCondition('バトル開始')}>バトル開始</Button>
                  <Button variant="primary" size="sm" onClick={() => startRollFromCondition('判定を開始')}>判定を開始</Button>
                  <Button className="visually-hidden" onClick={() => startRollFromCondition('判定開始')}>判定開始</Button>
                  <Button variant="secondary" size="sm" onClick={() => startEventFromCondition('強制イベントを発生')}>強制イベントを発生</Button>
                  <Button className="visually-hidden" onClick={() => startEventFromCondition('強制イベント開始')}>強制イベント開始</Button>
                </div>
              </section>
            )}

            <section className="grid gap-3 rounded-2xl border border-myr-ink/14 bg-myr-session-turn px-4 py-3" aria-label="Play contract">
              <h2 className="m-0 font-myr-display text-xl">Play contract</h2>
              <article className="rounded-xl border border-myr-ink/10 bg-myr-session-control/56 px-3 py-3" data-testid="mode-contract-summary">
                <h3>入力モード</h3>
                <p className="m-0 max-w-none" data-testid="summary-mode">{modeMeta.summary}</p>
                <p className="visually-hidden" data-testid="summary-battle">敵HP {battle.enemyHp} / 自HP {battle.playerHp}</p>
                <p className="visually-hidden" data-testid="summary-roll">{rollResult ? `d6=${rollResult.value}（${rollResult.success ? '成功' : '失敗'}）` : '判定未実行'}</p>
                <p className="m-0 max-w-none" data-testid="summary-rewind">{forcedMode ? '終了後に可能' : 'いつでも可能'}</p>
                <p className="m-0 max-w-none" data-testid="pending-action">{pendingAction}</p>
                <p className="m-0 max-w-none" data-testid="last-confirmed">{lastConfirmed}</p>
                <p className="visually-hidden" data-testid="recovery-point">{recoveryPoint ?? '未選択'}</p>
                <table className="w-full border-collapse" aria-label="モード遷移ログ">
                  <tbody>
                    {transitionRows.map((row) => (
                      <tr key={row.id}><td className="border-t border-myr-ink/10 px-2 py-1">{row.at}</td><td className="border-t border-myr-ink/10 px-2 py-1">{row.from}</td><td className="border-t border-myr-ink/10 px-2 py-1">{row.to}</td><td className="border-t border-myr-ink/10 px-2 py-1">{row.reason}</td></tr>
                    ))}
                  </tbody>
                </table>
              </article>
              <article className="rounded-xl border border-myr-ink/10 bg-myr-session-control/56 px-3 py-3" data-testid="active-turn-summary">
                <h3>選択中のTurn</h3>
                <p className="m-0 max-w-none">{String(selectedTurn.id).padStart(2, '0')} / {selectedTurn.turnTitle}</p>
                <p className="m-0 max-w-none">{selectedTurn.kind === 'clarification' ? '補足説明: 物語状態は変化しない' : '行動結果: Narrativeとして表示'}</p>
              </article>
              <article className="rounded-xl border border-myr-ink/10 bg-myr-session-control/56 px-3 py-3" data-testid="active-heading-summary">
                <h3>現在のAI見出し</h3>
                <p className="m-0 max-w-none">{activeHeading ? `${activeHeading.title}（Turn ${String(activeHeading.startTurnId).padStart(2, '0')}から）` : '見出し未生成'}</p>
                <p className="m-0 max-w-none">見出しリンクはTurn一覧ではなく、AIが場面の切り替わりに付けた索引です。</p>
              </article>
              <article className="rounded-xl border border-myr-ink/10 bg-myr-session-control/56 px-3 py-3">
                <h3>制約</h3>
                <p className="m-0 max-w-none">ReadOnlyの見出しリンク、直前削除、任意ターン巻き戻し、入力待ちを見える化します。</p>
              </article>
            </section>
          </div>
        </section>}
      </main>

      {notesView === 'full' && (
        <section className="col-[2/-1] z-2 grid min-h-[calc(100vh-150px)] grid-rows-[auto_minmax(0,1fr)] rounded-myr-panel border border-myr-ink/16 bg-myr-paper-bright p-myr-card-inset shadow-[0_24px_70px_rgba(18,16,25,.16)] max-myr-workspace:col-start-1" aria-label="ノート集中表示" data-testid="session-notes-focus">
          <div className="mb-2.5 flex items-center justify-end gap-3" aria-label="ノート表示設定">
            <Button variant="secondary" size="sm" onClick={() => setNotesViewMode('hidden')}>ノートを非表示</Button>
            <Button variant="primary" size="sm" onClick={() => setNotesViewMode(isNarrowViewport ? 'hidden' : 'split')}>
              {isNarrowViewport ? '閉じる' : 'ターン画面に戻る'}
            </Button>
          </div>
          <SessionNotesWorkspace mode="full" sessionId={sessionId} />
        </section>
      )}

      {notesView === 'split' && (
        <SummaryInset as="aside" className={`${wizardSummaryClass} grid h-[calc(100vh-150px)] min-h-0 min-w-75 w-[var(--notes-rail-width,340px)] grid-rows-[auto_minmax(0,1fr)] self-stretch overflow-hidden`} aria-label="セッションノート">
          <div className="mb-2.5 flex items-center justify-end gap-3" aria-label="ノート表示設定">
            <label className="flex items-center gap-2 text-myr-caption font-black text-myr-slate-muted">
              表示比率
              <input
                aria-label="ノート表示比率"
                className="h-4 w-[min(160px,32vw)] accent-myr-gold"
                type="range"
                min="300"
                max="640"
                step="20"
                value={notesRailWidth}
                onChange={(event) => setNotesRailWidth(Number(event.target.value))}
              />
            </label>
            <Button variant="secondary" size="sm" onClick={() => setNotesViewMode('hidden')}>ノートを非表示</Button>
            <Button variant="primary" size="sm" onClick={() => setNotesViewMode('full')}>全画面表示</Button>
          </div>
          <SessionNotesWorkspace mode="side" sessionId={sessionId} />
        </SummaryInset>
      )}
    </div>
    </AppChrome>
  );
}
