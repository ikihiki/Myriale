import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { toAppChromeAccount, type AppChromeAccount } from '../../account/accountPresentation';
import { actionRowClassName, Button, Notice, textRecipe, Textarea } from '../../components/ui';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { useOptionalAppStore, type TurnDisplayFlags } from '../../app/store';
import { SessionTurn } from '../../shared/SessionTurn';
import { SessionNotesWorkspace } from '../../SessionNotesWorkspace';
import { WizardNavigation } from '../../shared/WizardNavigation';
import { scenarioWizardShellClass, wizardPaperClass, wizardSummaryClass } from '../../shared/scenarioWizardStyles';
import {
  acceptSessionInput,
  getSession,
  getSessionApiBaseUrl,
  hasActiveSessionExecutions,
  mutateSessionExecution,
  recommendNextAction,
  reviewSessionNoteProposal,
  type NarrativeInteractionType,
  type NarrativeTurnApiResponse,
  type SessionApiError,
  type SessionApiResponse,
} from './sessionPlayApi';
import { SessionActivityFeed, type NoteReviewRequest } from './SessionActivityFeed';
import { MyrialeDialogContent, MyrialeDialogRoot, MyrialeToggle, MyrialeSelect } from '../../ui/MyrialeRadix';
import { useAppNavigation } from '../../shared/nav';

function ArrowUpIcon() {
  return (
    <svg className="size-[18px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M10 15V5m0 0L6 9m4-4 4 4" />
    </svg>
  );
}

function RotateBackIcon() {
  return (
    <svg className="size-[18px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M6.5 6.5H3.75V3.75M4.2 6.2a7 7 0 1 1-.75 6.85" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="size-[18px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M10 2.75c.45 2.65 1.85 4.05 4.5 4.5-2.65.45-4.05 1.85-4.5 4.5-.45-2.65-1.85-4.05-4.5-4.5 2.65-.45 4.05-1.85 4.5-4.5ZM15.25 12.5c.22 1.35.9 2.03 2.25 2.25-1.35.22-2.03.9-2.25 2.25-.22-1.35-.9-2.03-2.25-2.25 1.35-.22 2.03-.9 2.25-2.25Z" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg className="size-[18px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M6.5 12.25c-1.1-.95-1.75-2.25-1.75-3.75a5.25 5.25 0 0 1 10.5 0c0 1.5-.65 2.8-1.75 3.75-.75.65-1 1.2-1 2H7.5c0-.8-.25-1.35-1-2ZM7.5 17h5M8 14.25h4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="size-[18px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="m6 6 8 8m0-8-8 8" />
    </svg>
  );
}

type TurnKind = 'action' | 'clarification' | 'rewound';

type DialogueTurn = {
  id: number;
  turnTitle: string;
  narrative: string;
  playerInput?: string;
  interpretation?: string;
  kind: TurnKind;
  display?: TurnDisplayFlags;
};

type HeadingLink = {
  title: string;
  startTurnId: number;
  summary: string;
};

const initialTurns: DialogueTurn[] = [
  {
    id: 1,
    turnTitle: '水没した閲覧室で目覚める',
    narrative:
      'あなたは水没した閲覧室で目を覚ます。膝まで届く黒い水の上を星図灯の光が揺れ、崩れた書架の奥から誰かの咳払いが聞こえる。直近では、あなたの懐に濡れていない銀の鍵が残されていた。',
    kind: 'action',
  },
  {
    id: 2,
    turnTitle: '銀の鍵を確かめる',
    playerInput: '懐の銀の鍵を取り出して刻印を見る',
    interpretation: '所持品確認として解釈しました。目的は銀の鍵の由来と使い道を知ることです。',
    narrative:
      '鍵の柄には、星座ではなく空白の円が刻まれていた。指でなぞると、水面にまだ開いていない扉の輪郭が一瞬だけ浮かび、すぐに黒い波紋へ戻る。',
    kind: 'action',
  },
  {
    id: 3,
    turnTitle: '周囲を警戒する',
    playerInput: '音を立てないように周囲を調べる',
    interpretation: '探索行動として解釈しました。危険確認と移動先の発見が目的です。',
    narrative:
      '倒れた書架の陰に、濡れていない足跡が続いている。足跡は奥の閲覧机で途切れ、その上には新しいインクで「名前を答えるな」とだけ書かれていた。',
    kind: 'action',
  },
  {
    id: 4,
    turnTitle: '書架の奥の人物に気づく',
    playerInput: '咳払いのした方へ声をかける',
    interpretation: 'NPCへの会話として解釈しました。対象は書架の奥にいる人物です。',
    narrative:
      '濡れた外套の人物が、半壊した索引棚の影から姿を見せる。「鍵を持つ者がまた来たか」と言い、あなたの名前ではなく、あなたが失ったはずの記憶を尋ねてくる。会話内容はセッション文脈に記録される。',
    kind: 'action',
  },
  {
    id: 5,
    turnTitle: '名前を聞かれて沈黙する',
    playerInput: '名前は答えず、ここがどこかを尋ねる',
    interpretation: '警戒しながら情報収集する会話として解釈しました。',
    narrative:
      '人物は満足げにうなずく。「賢い。ここは星を食べ終えた図書館だ。名を渡せば、棚の一部になる」。その声には脅しよりも忠告の響きがある。',
    kind: 'action',
  },
  {
    id: 6,
    turnTitle: '状況を要約してもらう',
    playerInput: '今の状況を簡単にまとめて',
    narrative:
      '補足説明: あなたは水没した地下図書館で目覚め、銀の鍵を持っています。書架の奥の人物は敵とは限らず、名前を答える危険を警告しています。この返答は理解補助であり、物語進行は変化しません。',
    kind: 'clarification',
  },
  {
    id: 7,
    turnTitle: '閉じた星座の話を聞く',
    playerInput: '銀の鍵で何を開けられるのか聞く',
    interpretation: 'NPCから鍵の用途を聞き出す会話として解釈しました。',
    narrative:
      '「閉じた星座だ」と人物は答える。「開けば出口も過去も見える。だが、どちらを選ぶかで失うものが違う」。水面の下で、星図のような光がゆっくり回り始める。',
    kind: 'action',
  },
  {
    id: 8,
    turnTitle: '螺旋階段へ向かう',
    playerInput: '人物に礼を言い、足跡の先の螺旋階段へ進む',
    interpretation: '移動と探索の継続として解釈しました。NPCとの会話文脈を保持します。',
    narrative:
      '螺旋階段は水面の下へ伸びているはずなのに、足を踏み入れると靴底は乾いた石を捉えた。背後で人物が「灯りが消えたら、鍵ではなく声を使え」と告げる。',
    kind: 'action',
  },
  {
    id: 9,
    turnTitle: '星図灯が弱まる',
    playerInput: '星図灯を掲げて階段を下りる',
    interpretation: '慎重な移動として解釈しました。光源の状態変化を確認します。',
    narrative:
      '数段下りるたびに星図灯の光は細くなり、代わりに壁の文字が明るく浮かぶ。「ここから先は、選ばなかった行動も記録される」。階段の下で扉がひとつだけ待っている。',
    kind: 'action',
  },
  {
    id: 10,
    turnTitle: '直前の判断を迷う',
    playerInput: '扉を開ける前に、戻れる道があるか確認する',
    interpretation: 'リスク確認として解釈しました。分岐前の安全確認です。',
    narrative:
      '振り返ると、階段はまだ存在している。ただし水面に映るあなたは、扉へ手を伸ばしている。戻ることはできるが、戻った事実もまた図書館に読まれるだろう。',
    kind: 'action',
  },
  {
    id: 11,
    turnTitle: '閉じた星座の扉に触れる',
    playerInput: '銀の鍵を使わず、まず扉の模様に触れる',
    interpretation: '直接開錠ではなく調査として解釈しました。罠や反応を確認します。',
    narrative:
      '扉の模様は、あなたが見たことのない星座へ組み替わる。鍵穴は現れない。かわりに扉は、あなたの声で「何を忘れたままでいたい？」と問いかけた。',
    kind: 'action',
  },
  {
    id: 12,
    turnTitle: '入力待ちの静止点',
    narrative:
      'AIはここで物語を勝手に進めない。扉は問いを残したまま沈黙し、次の重要な進行はPlayer Inputを待っている。',
    kind: 'action',
  },
];

const headingLinks: HeadingLink[] = [
  { title: '目覚めと銀の鍵', startTurnId: 1, summary: 'AIがTurn 01〜03を要約して付けた見出し' },
  { title: '濡れた書架の声', startTurnId: 4, summary: 'AIがNPCとの会話開始点として抽出' },
  { title: '螺旋階段と星図灯', startTurnId: 8, summary: 'AIが探索場面の切り替わりとして抽出' },
  { title: '閉じた星座の扉', startTurnId: 11, summary: 'AIが分岐直前の重要場面として抽出' },
];

const resultForInput = (input: string, nextId: number): DialogueTurn => {
  const normalized = input.trim();
  const isNpcTalk = /話|聞|尋|人物|誰|こんにちは|名/.test(normalized);
  const turnTitle = isNpcTalk ? '銀の鍵を知る人物に問いかける' : '警戒しながら次の場面へ踏み出す';
  const interpretation = isNpcTalk
    ? 'NPCへの会話として解釈しました。対象は書架の奥にいる人物、目的は銀の鍵と現在地の確認です。'
    : '探索行動として解釈しました。目的は周囲の安全確認と、閲覧室から出る経路の発見です。';
  const narrative = isNpcTalk
    ? '書架の奥の人物は濡れた外套を絞りながら、あなたの銀の鍵を一瞥する。「それは閉じた星座を開くものだ。だが、名前を告げる前に、君が何を忘れたのか確かめたい」と、警戒と興味の混じった声で答える。会話内容はセッション文脈に記録される。'
    : 'あなたが足音を殺して進むと、水面の下でページが一斉にめくれた。出口と思われる螺旋階段は見つかるが、手すりには乾いた血ではなく、古いインクが付着している。成功した確認と、想定外の痕跡が次の判断材料になる。';

  return {
    id: nextId,
    turnTitle,
    playerInput: normalized,
    interpretation,
    narrative,
    kind: 'action',
  };
};

export const toDialogueTurn = (turn: NarrativeTurnApiResponse): DialogueTurn => ({
  id: turn.position,
  turnTitle: turn.narrative?.heading
    ?? (turn.narrative?.playerInput
      ? 'Player Inputを受けたNarrative'
      : turn.kind === 'module'
        ? 'プログラムによる進行'
        : '物語の始まり'),
  playerInput: turn.narrative?.playerInput ?? undefined,
  interpretation: turn.narrative?.interpretation ?? undefined,
  narrative: turn.narrative?.body
    ?? (turn.kind === 'module' ? 'プログラムによる進行を実行しています。' : 'Narrativeを表示できません。'),
  kind: turn.narrative?.turnType === 'clarification' ? 'clarification' : 'action',
  display: turn.kind === 'module'
    ? { allowRewind: false, showInterpretation: false, leadTone: 'program', leadTag: 'PROGRAM' }
    : undefined,
});

const clampInitialTurnCount = (count: number | undefined) => {
  if (!Number.isFinite(count)) return initialTurns.length;
  return Math.min(Math.max(Math.trunc(count ?? initialTurns.length), 1), initialTurns.length);
};

export function SessionPage({ sessionId = 'SES-PREP-1098' }: { sessionId?: string } = {}) {
  return getSessionApiBaseUrl()
    ? <ServerSessionPage sessionId={sessionId} />
    : <SessionDialogueSection sessionId={sessionId} />;
}

function ServerSessionPage({ sessionId }: { sessionId: string }) {
  const appNavigate = useAppNavigation();
  const accountSession = useAccountSession();
  const chromeAccount = toAppChromeAccount(accountSession.user);
  const pollGeneration = useRef(0);
  const [session, setSession] = useState<SessionApiResponse | null>(null);
  const [error, setError] = useState('');
  const [requiresLogin, setRequiresLogin] = useState(false);

  const goToLogin = () => appNavigate?.('login');
  const logout = async () => {
    await accountSession.api.logout();
    accountSession.clearUser();
    goToLogin();
  };

  useEffect(() => {
    const abort = new AbortController();
    setSession(null);
    setError('');
    setRequiresLogin(false);
    void getSession(sessionId, undefined, abort.signal)
      .then(setSession)
      .catch((reason: SessionApiError) => {
        if (reason.name === 'AbortError') return;
        if (reason.status === 401) {
          accountSession.clearUser();
          setRequiresLogin(true);
          setError('Sessionを表示するにはログインが必要です。');
          return;
        }
        setError(reason.message);
      });
    return () => abort.abort();
  }, [accountSession.clearUser, sessionId]);

  useEffect(() => {
    if (!session || !hasActiveSessionExecutions(session)) return;
    const abort = new AbortController();
    const interval = window.setInterval(() => {
      const generation = ++pollGeneration.current;
      void getSession(sessionId, undefined, abort.signal).then((next) => {
        if (generation !== pollGeneration.current) return;
        setSession((current) => !current || next.revision >= current.revision ? next : current);
      }).catch((reason: SessionApiError) => {
        if (reason.name !== 'AbortError') setError(reason.message);
      });
    }, 750);
    return () => { window.clearInterval(interval); abort.abort(); };
  }, [session, sessionId]);

  if (!session) {
    return (
      <AppChrome section="sessions" breadcrumbs={[{ label: 'Myriale', to: 'home' }, { label: 'セッション' }]} account={chromeAccount} onLogout={logout}>
        <main className="grid min-h-[calc(100vh-118px)] place-items-center bg-[image:var(--myr-screen-background)] p-6 text-myr-ink">
          <section className="max-w-xl rounded-myr-panel bg-myr-paper p-8 text-center shadow-myr-panel" aria-label={error ? 'Session読み込みエラー' : 'Session読み込み中'}>
            <h1 className="font-myr-display text-4xl">{error ? 'Sessionを読み込めませんでした' : 'Sessionを読み込んでいます'}</h1>
            <p role={error ? 'alert' : 'status'}>{error || '確定済みのTurnを取得しています。'}</p>
            {error && (
              <Button
                variant="secondary" size="lg"
                onClick={requiresLogin ? goToLogin : () => window.location.reload()}
              >
                {requiresLogin ? 'ログインへ' : '再読み込み'}
              </Button>
            )}
          </section>
        </main>
      </AppChrome>
    );
  }

  return (
    <SessionDialogueSection
      sessionId={sessionId}
      serverSession={session}
      account={chromeAccount}
      onLogout={logout}
      onLogin={goToLogin}
      onAuthenticationRequired={accountSession.clearUser}
      onSessionChange={setSession}
    />
  );
}

const demoPlayerAccount: AppChromeAccount = {
  name: '霧野しおり',
  email: 'reader@myriale.example',
  initials: '霧野',
  role: 'プレイヤー',
};

function SessionDialogueSection({
  sessionId,
  serverSession,
  account = demoPlayerAccount,
  onLogout,
  onLogin,
  onAuthenticationRequired,
  onSessionChange,
}: {
  sessionId: string;
  serverSession?: SessionApiResponse;
  account?: AppChromeAccount | null;
  onLogout?: () => void | Promise<void>;
  onLogin?: () => void;
  onAuthenticationRequired?: () => void;
  onSessionChange?: (session: SessionApiResponse) => void;
}) {
  const appStore = useOptionalAppStore();
  const dbSession = appStore?.db.playSessions[sessionId];
  const initialTurnCount = clampInitialTurnCount(dbSession?.turn);
  const initialVisibleTurns = serverSession
    ? serverSession.turns.map(toDialogueTurn)
    : initialTurns.slice(0, initialTurnCount);
  const resumableInput = serverSession?.pendingInputs.at(-1);
  const [turns, setTurns] = useState<DialogueTurn[]>(initialVisibleTurns);
  const [input, setInput] = useState(resumableInput?.input ?? '');
  const [interactionType, setInteractionType] = useState<NarrativeInteractionType>(
    resumableInput?.interactionType ?? 'dialogue',
  );
  const [selectedTurnId, setSelectedTurnId] = useState(initialVisibleTurns.at(-1)?.id ?? 1);
  const [draftRequest, setDraftRequest] = useState<{
    input: string;
    requestId: string;
    interactionType: NarrativeInteractionType;
  } | null>(
    resumableInput
      ? {
          input: resumableInput.input,
          requestId: resumableInput.requestId,
          interactionType: resumableInput.interactionType ?? 'dialogue',
        }
      : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [authenticationRequired, setAuthenticationRequired] = useState(false);
  const [notice, setNotice] = useState(
    resumableInput
      ? resumableInput.errorMessage ?? '未完了のPlayer Inputを復元しました。同じRequest IDで再試行できます。'
      : serverSession
        ? 'Serverに保存された確定済みTurnを表示しています。'
        : initialTurnCount === 1
          ? ''
          : `Session状態はActiveです。DB設定により、複数ターン経過後（Turn ${String(initialTurnCount).padStart(2, '0')}まで）のログを表示しています。AIが現在地、周囲、直近の出来事をNarrativeとして提示しました。`,
  );
  const notesMode = appStore?.db.ui.notesPanelMode ?? 'side';
  const setNotesMode = (mode: 'side' | 'full') => {
    appStore?.dispatch({ type: 'NOTES_PANEL_MODE_CHANGED', mode });
  };
  const [notesView, setNotesView] = useState<'hidden' | 'split' | 'full'>(notesMode === 'full' ? 'full' : 'split');
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const setNotesViewMode = (view: 'hidden' | 'split' | 'full') => {
    const nextView = isNarrowViewport && view === 'split' ? 'full' : view;
    setNotesView(nextView);
    if (nextView !== 'hidden') {
      setNotesMode(nextView === 'full' ? 'full' : 'side');
    }
  };

  const [showInterpretationFor, setShowInterpretationFor] = useState<number[]>([]);
  const [pendingRewindId, setPendingRewindId] = useState<number | null>(null);

  const selectedTurn = useMemo(
    () => turns.find((turn) => turn.id === selectedTurnId) ?? turns[turns.length - 1],
    [selectedTurnId, turns],
  );
  const latestTurn = turns[turns.length - 1];
  const availableHeadingLinks = serverSession
    ? turns.map((turn) => ({ title: turn.turnTitle, startTurnId: turn.id, summary: 'Serverに保存された確定済みTurn' }))
    : headingLinks.filter((heading) => heading.startTurnId <= latestTurn.id);
  // TOCの末尾は常に最後のTurnを指す: 最後のAI見出しがログ末尾より手前で終わる場合、最新Turnへのリンクを補う。
  const tocHeadingLinks: HeadingLink[] =
    availableHeadingLinks[availableHeadingLinks.length - 1]?.startTurnId === latestTurn.id
      ? availableHeadingLinks
      : [
          ...availableHeadingLinks,
          {
            title: '最新の対話',
            startTurnId: latestTurn.id,
            summary: 'AIが付けた最新の見出し。TOC末尾は常に最後のTurnを指す',
          },
        ];
  const activeHeading = tocHeadingLinks.find((heading, index) => {
    const nextHeading = tocHeadingLinks[index + 1];
    return selectedTurnId >= heading.startTurnId && (!nextHeading || selectedTurnId < nextHeading.startTurnId);
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(max-width: 1120px)');
    const syncViewport = () => {
      setIsNarrowViewport(media.matches);
      if (media.matches) {
        setNotesView((current) => (current === 'split' ? 'hidden' : current));
      }
    };
    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

  const turnRefs = useRef<Record<number, HTMLElement | null>>({});
  useEffect(() => {
    const node = turnRefs.current[selectedTurnId];
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedTurnId, turns]);

  const sendInput = async () => {
    const submittedInput = input.trim();
    if (!submittedInput) {
      setNotice('自然言語で行動や会話を入力してください。文法が不完全でも受理します。');
      return;
    }
    if (isSubmitting) return;

    const reusableDraft = draftRequest?.input === submittedInput && draftRequest.interactionType === interactionType ? draftRequest : null;
    const requestId = reusableDraft
      ? reusableDraft.requestId
      : `narrative-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`;
    setDraftRequest({ input: submittedInput, requestId, interactionType });
    setIsSubmitting(true);
    setAuthenticationRequired(false);
    setNotice('Player Inputを受理し、Narrativeを生成しています。');
    try {
      if (serverSession) {
        const accepted = await acceptSessionInput(sessionId, submittedInput, requestId, undefined, interactionType);
        const nextOrder = Math.max(0, ...(serverSession.activity ?? []).map((item) => item.order)) + 1;
        onSessionChange?.({
          ...serverSession,
          inputs: [...(serverSession.inputs ?? []), accepted.input],
          executions: [...(serverSession.executions ?? []), accepted.execution],
          activity: [...(serverSession.activity ?? []),
            { type: 'input', id: accepted.input.id, order: nextOrder },
            { type: 'execution', id: accepted.execution.id, order: nextOrder + 1, causalId: accepted.input.id }],
        });
        setNotice('Player Inputを保存し、Narrative生成を開始しました。ブラウザを閉じても処理は継続します。');
      } else {
        const nextTurn = resultForInput(submittedInput, turns.length + 1);
        setTurns((current) => current.some((turn) => turn.id === nextTurn.id) ? current : [...current, nextTurn]);
        setSelectedTurnId(nextTurn.id);
        setNotice('Player Inputを行動として解釈し、結果をNarrativeとして生成しました。次の重要な進行は入力待ちです。');
      }
      setInput('');
      setInteractionType('dialogue');
      setDraftRequest(null);
    } catch (error) {
      const apiError = error as SessionApiError;
      if (apiError.status === 401) {
        setAuthenticationRequired(true);
        onAuthenticationRequired?.();
      }
      const prefix = apiError.code === 'request_in_progress'
        ? '同じ入力のNarrative生成が進行中です。'
        : apiError.status === 401
          ? 'ログインが必要です。'
          : apiError.status === 409
            ? 'Sessionの状態が変わったため、この入力を確定できませんでした。'
            : '';
      setNotice(`${prefix}${error instanceof Error ? error.message : 'Narrativeの生成に失敗しました。'} 入力を保持して同じRequest IDで再試行できます。`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecutionAction = async (executionId: string, action: 'retry' | 'cancel' | 'dismiss') => {
    if (!serverSession) return;
    try {
      const target = serverSession.executions?.find((item) => item.id === executionId);
      const updated = await mutateSessionExecution(executionId, action);
      if (action === 'dismiss' && target?.triggerType === 'player-input') {
        onSessionChange?.({
          ...serverSession,
          inputs: serverSession.inputs?.filter((item) => item.id !== target.triggerId),
          executions: serverSession.executions?.filter((item) => item.id !== executionId),
          activity: serverSession.activity?.filter((item) => item.id !== executionId && item.id !== target.triggerId),
        });
      } else {
        onSessionChange?.({ ...serverSession, executions: (serverSession.executions ?? []).map((item) => item.id === executionId ? updated : item) });
      }
      setNotice(action === 'retry' ? '同じ入力で再試行を開始しました。' : action === 'cancel' ? 'キャンセルを要求しました。' : '入力を取り消しました。');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Executionを更新できませんでした。');
    }
  };

  const handleNoteReview = async (artifactId: string, action: 'apply' | 'edit-apply' | 'reject' | 'snooze', request: NoteReviewRequest) => {
    if (!serverSession) return;
    try {
      const updated = await reviewSessionNoteProposal(artifactId, action, request);
      onSessionChange?.({
        ...serverSession,
        noteProposals: (serverSession.noteProposals ?? []).map((item) => item.artifactId === artifactId ? updated : item),
      });
      setNotice(action === 'apply' || action === 'edit-apply' ? 'ノート変更案を適用し、Revisionを作成しました。' : action === 'reject' ? 'ノート変更案を却下しました。' : 'ノート変更案を後で確認できるよう保留しました。');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'ノート変更案を更新できませんでした。');
    }
  };

  const askClarification = () => {
    if (serverSession) {
      const clarificationInput = '今の状況を簡単にまとめて';
      setInput(clarificationInput);
      setInteractionType('clarification');
      setDraftRequest(null);
      setNotice('補足要求を入力欄へ設定しました。理解補助として送信し、物語進行は許可しません。');
      return;
    }
    const clarification: DialogueTurn = {
      id: turns.length + 1,
      turnTitle: '状況の再説明',
      playerInput: '今の状況を簡単にまとめて',
      narrative:
        '補足説明: あなたは水没した閲覧室にいて、銀の鍵を持っています。書架の奥には会話できそうな人物がいます。この返答は理解補助であり、物語進行や世界状態は変化しません。',
      kind: 'clarification',
    };
    setTurns((current) => [...current, clarification]);
    setSelectedTurnId(clarification.id);
    setNotice('補足要求として扱いました。行動ではないため、セッション状態と物語進行は変化しません。');
  };

  const recommendAction = async () => {
    if (isRecommending || isSubmitting) return;
    setIsRecommending(true);
    setAuthenticationRequired(false);
    setNotice('AIが現在の状況から次の行動案を考えています。');
    try {
      const suggestion = serverSession
        ? await recommendNextAction(sessionId)
        : latestTurn.narrative.includes('扉')
          ? '銀の鍵を扉にかざし、刻まれた星座との対応を確かめる'
          : '周囲の安全を確かめながら、目につく手掛かりを詳しく調べる';
      setInput(suggestion);
      setInteractionType('dialogue');
      setDraftRequest(null);
      setNotice('AIの提案を入力欄へ設定しました。内容を編集してから送信できます。');
    } catch (error) {
      const apiError = error as SessionApiError;
      if (apiError.status === 401) {
        setAuthenticationRequired(true);
        onAuthenticationRequired?.();
      }
      setNotice(error instanceof Error ? error.message : '次の行動案を生成できませんでした。');
    } finally {
      setIsRecommending(false);
    }
  };

  const toggleInterpretation = (turn: DialogueTurn) => {
    const willShow = !showInterpretationFor.includes(turn.id);
    setShowInterpretationFor((current) =>
      willShow ? [...current, turn.id] : current.filter((id) => id !== turn.id),
    );
  };

  const deleteDraft = () => {
    setInput('');
    setInteractionType('dialogue');
    setDraftRequest(null);
    setNotice('削除: 入力欄の未送信テキストを無効化しました。再入力できます。');
  };

  const jumpToHeading = (heading: HeadingLink) => {
    setSelectedTurnId(heading.startTurnId);
    setNotice(`AI見出し「${heading.title}」から、場面の切り替わりTurn ${String(heading.startTurnId).padStart(2, '0')}へジャンプしました。ReadOnly表示のためSession状態は変化しません。`);
  };

  const requestRewind = (id: number) => {
    if (serverSession) {
      setNotice('Serverに確定したTurnの巻き戻しはまだ利用できません。履歴は変更されていません。');
      return;
    }
    setPendingRewindId(id);
    setNotice(`Turn ${String(id).padStart(2, '0')}まで戻る前に確認します。指定ターン以降のログと非同期処理を無効化します。`);
  };

  const confirmRewind = () => {
    if (pendingRewindId == null) return;
    const nextTurns = turns
      .filter((turn) => turn.id <= pendingRewindId)
      .map((turn) => (turn.id === pendingRewindId ? { ...turn, turnTitle: `${turn.turnTitle}（巻き戻し地点）` } : turn));
    setTurns(nextTurns);
    setSelectedTurnId(pendingRewindId);
    setPendingRewindId(null);
    setNotice('ここまで戻る: 指定ターン以降のログを無効化し、AIコンテキストを再構築しました。巻き戻し地点から再入力できます。');
  };

  const initialSessionView = appStore?.db.ui.sessionView ?? 'dialogue';
  const [sessionMode, setSessionMode] = useState<'dialogue' | 'battle' | 'roll' | 'event' | 'recovering'>('dialogue');
  const [sessionModeFlavor] = useState<'dialogue' | 'program' | 'modeTransition'>(initialSessionView);
  const [battle, setBattle] = useState({ enemy: '錆びついた書架番', playerHp: 30, enemyHp: 24, turn: 1 });
  const [rollResult, setRollResult] = useState<{ value: number; success: boolean } | null>(null);
  const [fixedRoll, setFixedRoll] = useState('ランダム');
  const [eventAdvanced, setEventAdvanced] = useState(false);
  const [pendingAction, setPendingAction] = useState('未完了処理なし');
  const [lastConfirmed, setLastConfirmed] = useState('Turn 18: AI対話モードで自由入力待ち');
  const [recoveryPoint, setRecoveryPoint] = useState<'lastConfirmed' | 'safePoint' | null>(null);
  const [transitionRows, setTransitionRows] = useState<Array<{ id: number; from: string; to: string; reason: string; at: string }>>([
    { id: 1, from: '—', to: 'AI対話モード', reason: 'セッション開始', at: '21:04:12' },
  ]);

  const [notesRailWidth, setNotesRailWidth] = useState(340);
  const sessionPageClassName = `${scenarioWizardShellClass} min-h-[calc(100vh-118px)] min-w-0 max-w-full grid-cols-[190px_minmax(0,1fr)_minmax(300px,var(--notes-rail-width,340px))] max-myr-workspace:grid-cols-1`;
  const sessionPageStyle = {
    '--notes-rail-width': `${notesRailWidth}px`,
  } as CSSProperties;

  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [keepSucceededExecutionStatusVisible, setKeepSucceededExecutionStatusVisible] = useState(false);

  const modeLabels = {
    dialogue: { badge: '対話中', label: 'AI対話モード', summary: 'Dialogue Mode', reason: '自由入力で行動や会話を送れます。' },
    battle: { badge: 'バトル中', label: 'バトル', summary: 'Forced Mode / バトル', reason: '自由入力は無効。バトル行動ボタンで進行します。' },
    roll: { badge: '判定中', label: '判定', summary: 'Forced Mode / 判定', reason: '自由入力と巻き戻しが無効。判定結果を確定します。' },
    event: { badge: 'イベント進行中', label: '強制イベント', summary: 'Forced Mode / イベント', reason: '自由入力は無効。イベントを順番に再生します。' },
    recovering: { badge: '復旧中', label: '復旧確認', summary: 'Recovery', reason: '未確定の処理を破棄し、確定地点から復旧します。' },
  } satisfies Record<typeof sessionMode, { badge: string; label: string; summary: string; reason: string }>;
  const modeMeta = modeLabels[sessionMode];
  const forcedMode = sessionMode !== 'dialogue';
  const programPanelClass = 'mt-3 grid gap-2.5 rounded-2xl border border-myr-ink/14 bg-[rgba(250,249,255,.7)] p-3.5';
  const modeBadgeClass = {
    dialogue: 'bg-[#4a845c]', battle: 'bg-myr-ruby', roll: 'bg-[#7054dd]', event: 'bg-[#c77d16]', recovering: 'bg-myr-plum',
  }[sessionMode];
  const defaultTurnDisplay: TurnDisplayFlags = { allowRewind: true, showInterpretation: true, leadTone: 'player', leadTag: '⟶' };
  const programTurnDisplay: TurnDisplayFlags = { allowRewind: false, showInterpretation: false, leadTone: 'program', leadTag: 'PROGRAM' };
  const displayForTurn = (turn: DialogueTurn): TurnDisplayFlags => ({
    ...defaultTurnDisplay,
    ...(dbSession?.turnDisplay?.[turn.id] ?? {}),
    ...(turn.display ?? {}),
    ...(serverSession ? { allowRewind: false } : {}),
  });
  const generatedLog = turns.map((turn) => `${turn.turnTitle} ${turn.playerInput ?? ''} ${turn.narrative}`).join('\n');

  const addTransitionRow = (from: typeof sessionMode, to: typeof sessionMode, reason: string) => {
    const at = `21:${String(5 + transitionRows.length).padStart(2, '0')}:${String(10 + transitionRows.length).padStart(2, '0')}`;
    setTransitionRows((current) => [...current, { id: current.length + 1, from: modeLabels[from].label, to: modeLabels[to].label, reason, at }]);
  };

  const appendGeneratedTurn = (title: string, narrative: string, playerInput?: string, interpretation?: string, display?: TurnDisplayFlags) => {
    const nextTurn: DialogueTurn = {
      id: turns.length + 1,
      turnTitle: title,
      playerInput,
      interpretation,
      narrative,
      kind: 'action',
      display,
    };
    setTurns((current) => [...current, nextTurn]);
    setSelectedTurnId(nextTurn.id);
    return nextTurn;
  };

  const switchSessionMode = (next: typeof sessionMode, reason: string) => {
    addTransitionRow(sessionMode, next, reason);
    setSessionMode(next);
    setPendingAction(next === 'dialogue' ? '未完了処理なし' : `${modeLabels[next].label}の処理が未完了`);
    setNotice(`${reason}: modeTransitionを経て${modeLabels[next].label}へ接続しました。変化するのは入力部分だけで、Turn表示は共通の対話ログに追加されます。`);
    appendGeneratedTurn(
      `${modeLabels[next].label}へ遷移`,
      next === 'dialogue'
        ? 'プログラム処理が終わり、同じ対話ログの続きとして自由入力へ戻る。'
        : `${reason}。条件を満たしたため、Sessionは${modeLabels[next].label}の入力UIへ切り替わる。`,
      undefined,
      `MODE: ${modeLabels[sessionMode].label} → ${modeLabels[next].label}`,
      programTurnDisplay,
    );
  };

  const startBattleFromCondition = (label: 'バトルを開始' | 'バトル開始' = 'バトルを開始') => {
    setBattle({ enemy: '錆びついた書架番', playerHp: 30, enemyHp: 24, turn: 1 });
    switchSessionMode('battle', label);
  };

  const startRollFromCondition = (label: '判定を開始' | '判定開始' = '判定を開始') => {
    setRollResult(null);
    switchSessionMode('roll', label);
  };

  const startEventFromCondition = (label: '強制イベントを発生' | '強制イベント開始' = '強制イベントを発生') => {
    setEventAdvanced(false);
    switchSessionMode('event', label);
  };

  const resolveBattleAction = (action: '攻撃' | '防御' | 'スキル' | '逃走') => {
    const damageTable = { 攻撃: 8, 防御: 2, スキル: 12, 逃走: 0 } satisfies Record<typeof action, number>;
    const counterTable = { 攻撃: 4, 防御: 1, スキル: 5, 逃走: 0 } satisfies Record<typeof action, number>;
    const dealt = damageTable[action];
    const counter = counterTable[action];
    const enemyHp = Math.max(0, battle.enemyHp - dealt);
    const playerHp = Math.max(0, battle.playerHp - counter);
    appendGeneratedTurn(
      `BATTLE TURN ${battle.turn}`,
      `BATTLE TURN ${battle.turn}: 行動「${action}」確定 / 与ダメージ${dealt} / 被ダメージ${counter} / 敵HP ${enemyHp} / 自HP ${playerHp}。この結果も通常ターンと同じ対話ログに表示される。`,
      action,
      'プログラムモードのボタン入力として解釈しました。',
      programTurnDisplay,
    );
    setBattle({ ...battle, enemyHp, playerHp, turn: battle.turn + 1 });
    setLastConfirmed(`Turn ${turns.length + 1}: バトル行動「${action}」を確定`);
    setPendingAction(enemyHp === 0 ? 'バトル結果確定。AI対話へ復帰可能' : `Battle Turn ${battle.turn + 1} の行動選択待ち`);
    setNotice('行動ログは通常ターンと同じ形式で追加されます。');
  };

  const rollDie = () => {
    const value = fixedRoll === 'ランダム' ? 5 : Number(fixedRoll);
    const success = value >= 4;
    setRollResult({ value, success });
    appendGeneratedTurn(
      '判定結果',
      success
        ? `ROLL: d6=${value}（成功）。成功ルートのNarrativeを同じ対話ログへ追加しました。`
        : `ROLL: d6=${value}（失敗）。失敗ルートへ自動で進めました。プレイヤー操作なしで結果を確定します。`,
      '判定を実行',
      'プログラムが乱数結果を確定しました。',
      programTurnDisplay,
    );
    setNotice(success ? '判定に成功しました。' : '失敗ルートへ自動で進めました。');
  };

  const advanceEvent = () => {
    setEventAdvanced(true);
    appendGeneratedTurn(
      '強制イベント確定',
      'イベント確定: 落下ダメージ5。AIが描写・心情・演出を生成し、結果は共通の対話ログに残る。',
      '強制イベントを進める',
      'イベント中の分岐不可処理として解釈しました。',
      programTurnDisplay,
    );
    setNotice('AIが描写・心情・演出を生成しました。');
  };

  const completeProgramMode = () => {
    setLastConfirmed(`Turn ${turns.length}: ${modeMeta.label}の結果を確定`);
    switchSessionMode('dialogue', 'プログラム主導シーン正常終了');
    setPendingAction('未完了処理なし');
    setNotice('正常終了しました。AI対話モードに戻り、自由入力と巻き戻しが再度有効になりました。');
  };

  const simulateProcessingError = () => {
    addTransitionRow(sessionMode, 'recovering', 'プログラム処理エラー');
    setSessionMode('recovering');
    setPendingAction('未確定: ダメージ計算の後半は反映しない');
    appendGeneratedTurn('復旧確認', 'ERROR: ダメージ計算の途中で失敗。確定済み=行動選択まで / 未確定=ダメージ反映。', undefined, '未確定の処理結果はSession Stateへ反映しません。', programTurnDisplay);
    setNotice('エラーが発生しました。確定済み地点を表示し、未確定の処理結果はSession Stateへ反映しません。');
  };

  const recoverFromPoint = (point: 'lastConfirmed' | 'safePoint') => {
    setRecoveryPoint(point);
    addTransitionRow('recovering', 'dialogue', point === 'lastConfirmed' ? '最後に確定した地点から復帰' : '安全なセーフポイントへ復帰');
    setSessionMode('dialogue');
    setPendingAction('未完了処理なし');
    setNotice(point === 'lastConfirmed' ? '最後に確定した地点から復帰しました。' : '安全なセーフポイントへ戻りました。');
  };

  const simulateReconnect = () => {
    setPendingAction(`${modeMeta.label}の未完了UIを再提示`);
    setNotice('通信断から再接続しました。最後に確定した進行地点からモード状態を復元し、未完了UIを再提示します。');
  };

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
        markerValue={<span data-testid="session-state">{dbSession?.state ?? 'Active'}</span>}
      />

      <main className={`${wizardPaperClass} min-w-0 ${notesView === 'full' ? 'hidden' : ''} ${notesView === 'hidden' ? 'col-[2/-1] max-myr-workspace:col-start-1' : ''}`} aria-label="AI対話モード">
        <p className={`mb-2 ${textRecipe('eyebrow')}`}>Session play / AI dialogue mode</p>
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
          <Notice className="my-[18px]" data-testid="dialogue-notice">
            <span>{notice}</span>
            {authenticationRequired && onLogin && (
              <Button variant="primary" size="sm" onClick={onLogin}>ログインへ</Button>
            )}
          </Notice>
        )}

        {serverSession ? (
          <SessionActivityFeed session={serverSession} onExecutionAction={(id, action) => void handleExecutionAction(id, action)} onNoteReview={(id, action, request) => void handleNoteReview(id, action, request)} keepSucceededStatusVisible={keepSucceededExecutionStatusVisible} />
        ) : (
        <section className="grid max-h-[48vh] gap-2.5 overflow-auto pr-1.5" aria-label="対話ログ" data-testid="dialogue-log">
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
                            className="!justify-self-start !rounded-full !border !border-myr-iris/30 !bg-white/55 !px-2.5 !py-1 !text-myr-caption !font-extrabold !text-[#6044d4] data-[state=on]:!bg-myr-iris/16 data-[state=on]:!text-[#4a32b0]"
                            pressed={showInterpretationFor.includes(turn.id)}
                            aria-label={`Turn ${String(turn.id).padStart(2, '0')}の入力解釈を${showInterpretationFor.includes(turn.id) ? '隠す' : '見る'}`}
                            onPressedChange={() => toggleInterpretation(turn)}
                          >
                            {showInterpretationFor.includes(turn.id) ? '⌄ 解釈を隠す' : '⌃ どう解釈された？'}
                          </MyrialeToggle>
                        ) : undefined,
                        detail:
                          canShowInterpretation && showInterpretationFor.includes(turn.id) ? (
                            <p className="m-0 flex max-w-none items-baseline gap-2 rounded-xl bg-myr-gold/18 px-3 py-2.5 text-myr-ui-sm font-semibold text-[#4b3a20]" data-testid={`turn-${turn.id}-interpretation`}>
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
              bodyClassName="grid gap-2 [&_p]:m-0 [&_p]:max-w-none"
              footer={(
                <>
                  <Button variant="danger" size="sm" onClick={confirmRewind}>巻き戻しを確定</Button>
                  <Button variant="ghost" size="sm" onClick={() => setPendingRewindId(null)}>キャンセル</Button>
                </>
              )}
            >
              <strong>Turn {String(pendingRewindId).padStart(2, '0')}まで戻りますか？</strong>
              <p>指定ターン以降のログ、挿絵生成などの非同期処理を無効化またはキャンセルします。</p>
            </MyrialeDialogContent>
          </MyrialeDialogRoot>
        )}

        <section className="mx-auto mt-4 w-full max-w-[720px] justify-self-stretch px-2.5 pb-1 max-sm:px-0" aria-label="自然言語入力">
          {forcedMode && (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-3 rounded-2xl border border-myr-ink/16 bg-myr-paper/80 px-4 py-3 text-myr-ui-sm" aria-label="現在の入力モード">
                <span className={`shrink-0 rounded-full px-3.5 py-1 text-myr-ui-sm font-black tracking-myr-label text-myr-paper ${modeBadgeClass}`} data-testid="mode-badge">{modeMeta.badge}</span>
                <span data-testid="session-mode-state">{modeMeta.label}</span>
                <span>{modeMeta.summary}</span>
              </div>
              <p className="font-bold text-myr-ruby" data-testid="input-disabled-reason">{modeMeta.reason} 終了後に可能。</p>
              <p className="text-myr-ui-sm text-myr-ink-soft" data-testid="mode-reason">{modeMeta.reason}</p>
            </>
          )}
          <div className="overflow-hidden rounded-[26px] border border-myr-ink/15 bg-[rgba(255,254,249,0.96)] shadow-[0_10px_30px_rgba(34,29,48,0.11),0_1px_2px_rgba(34,29,48,0.08)] transition-[border-color,box-shadow] duration-150 focus-within:border-myr-iris/45 focus-within:shadow-[0_12px_34px_rgba(34,29,48,0.14),0_0_0_3px_rgba(124,92,255,0.09)] max-sm:rounded-myr-panel motion-reduce:transition-none">
            <Textarea
              variant="composer"
              aria-label="自由に行動や会話を入力"
              value={input}
              onChange={(event) => {
                const nextInput = event.target.value;
                setInput(nextInput);
                if (draftRequest && draftRequest.input !== nextInput.trim()) setDraftRequest(null);
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
              <div className="flex items-center justify-between gap-3 px-2 pt-[5px] pb-2 pl-2.5">
                <div className="flex items-center gap-0.5" aria-label="入力補助">
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
                  aria-label={isSubmitting ? 'Narrativeを生成中' : draftRequest ? '同じ入力を再試行' : '行動を送る'}
                  title={draftRequest ? '同じ入力を再試行' : '行動を送る'}
                >
                  {isSubmitting
                    ? <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-[spin_1.4s_linear_infinite]" aria-hidden="true" />
                    : <ArrowUpIcon />}
                </Button>
              </div>
            )}
          </div>


          {sessionMode === 'battle' && (
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

          {sessionMode === 'roll' && (
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

          {sessionMode === 'event' && (
            <div className={programPanelClass}>
              <p data-testid="event-lock">中断・分岐はできません</p>
              <p data-testid="current-objective">崩落イベント</p>
              <p data-testid="processing-detail">順番に再生</p>
              <Button variant="primary" size="sm" data-testid="event-advance" onClick={advanceEvent}>イベントを進める</Button>
              <Button variant="secondary" size="sm" onClick={completeProgramMode}>正常終了してAI対話へ戻る</Button>
              {eventAdvanced && <p>イベントは確定済みです。</p>}
            </div>
          )}

          {sessionMode === 'recovering' && (
            <div className={programPanelClass}>
              <Button variant="secondary" size="sm" onClick={() => recoverFromPoint('lastConfirmed')}>最後に確定した地点から再開</Button>
              <Button variant="secondary" size="sm" onClick={() => recoverFromPoint('safePoint')}>安全なセーフポイントから再開</Button>
            </div>
          )}
        </section>
        <div className="visually-hidden" data-testid="program-log">{generatedLog}</div>
        <div className="visually-hidden" data-testid="narrative-log">{generatedLog}</div>
        <div className="visually-hidden" data-testid="program-notice">{notice}</div>
        <div className="visually-hidden" data-testid="mode-notice">{notice}</div>

        <section className="mt-[18px] border-t border-myr-ink/18 pt-3" aria-label="デバッグパネル">
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
            <section className="rounded-[14px] border border-[#4a427a]/20 bg-[#f4f1ff]/72 px-3.5 py-3" aria-label="AI生成表示設定">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  className="mt-[3px] size-4 shrink-0 accent-[#6052a8]"
                  type="checkbox"
                  checked={keepSucceededExecutionStatusVisible}
                  onChange={(event) => setKeepSucceededExecutionStatusVisible(event.target.checked)}
                />
                <span className="grid gap-[3px]">
                  <strong>成功後もAI生成ステータスを表示する</strong>
                  <small className="leading-normal text-[#666176]">通常は完了後に消えるステータスメッセージを、デバッグ確認のため対話ログに残します。</small>
                </span>
              </label>
            </section>
            {(sessionModeFlavor === 'program' || sessionModeFlavor === 'modeTransition') && (
              <section className="my-3.5 grid gap-2.5 rounded-2xl border border-myr-gold/35 bg-myr-paper/70 px-3.5 py-3" aria-label="条件によるモード遷移">
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

            <section className="grid gap-3 rounded-2xl border border-myr-ink/14 bg-[rgba(255,254,249,.68)] px-3.5 py-3 [&>h2]:m-0 [&>h2]:font-myr-display [&>h2]:text-xl [&>article]:rounded-xl [&>article]:border [&>article]:border-myr-ink/10 [&>article]:bg-white/56 [&>article]:px-3 [&>article]:py-2.5 [&_table]:w-full [&_table]:border-collapse [&_td]:border-t [&_td]:border-myr-ink/10 [&_td]:px-1.5 [&_td]:py-1" aria-label="Play contract">
              <h2>Play contract</h2>
              <article data-testid="mode-contract-summary">
                <h3>入力モード</h3>
                <p data-testid="summary-mode">{modeMeta.summary}</p>
                <p className="visually-hidden" data-testid="summary-battle">敵HP {battle.enemyHp} / 自HP {battle.playerHp}</p>
                <p className="visually-hidden" data-testid="summary-roll">{rollResult ? `d6=${rollResult.value}（${rollResult.success ? '成功' : '失敗'}）` : '判定未実行'}</p>
                <p data-testid="summary-rewind">{forcedMode ? '終了後に可能' : 'いつでも可能'}</p>
                <p data-testid="pending-action">{pendingAction}</p>
                <p data-testid="last-confirmed">{lastConfirmed}</p>
                <p className="visually-hidden" data-testid="recovery-point">{recoveryPoint ?? '未選択'}</p>
                <table aria-label="モード遷移ログ">
                  <tbody>
                    {transitionRows.map((row) => (
                      <tr key={row.id}><td>{row.at}</td><td>{row.from}</td><td>{row.to}</td><td>{row.reason}</td></tr>
                    ))}
                  </tbody>
                </table>
              </article>
              <article data-testid="active-turn-summary">
                <h3>選択中のTurn</h3>
                <p>{String(selectedTurn.id).padStart(2, '0')} / {selectedTurn.turnTitle}</p>
                <p>{selectedTurn.kind === 'clarification' ? '補足説明: 物語状態は変化しない' : '行動結果: Narrativeとして表示'}</p>
              </article>
              <article data-testid="active-heading-summary">
                <h3>現在のAI見出し</h3>
                <p>{activeHeading ? `${activeHeading.title}（Turn ${String(activeHeading.startTurnId).padStart(2, '0')}から）` : '見出し未生成'}</p>
                <p>見出しリンクはTurn一覧ではなく、AIが場面の切り替わりに付けた索引です。</p>
              </article>
              <article>
                <h3>制約</h3>
                <p>ReadOnlyの見出しリンク、直前削除、任意ターン巻き戻し、入力待ちを見える化します。</p>
              </article>
            </section>
          </div>
        </section>
      </main>

      {notesView === 'full' && (
        <section className="col-[2/-1] z-[2] grid min-h-[calc(100vh-150px)] grid-rows-[auto_minmax(0,1fr)] rounded-myr-panel border border-myr-ink/16 bg-myr-paper-bright p-myr-card-inset shadow-[0_24px_70px_rgba(18,16,25,.16)] max-myr-workspace:col-start-1" aria-label="ノート集中表示" data-testid="session-notes-focus">
          <div className="mb-2.5 flex items-center justify-end gap-2.5" aria-label="ノート表示設定">
            <Button variant="secondary" size="sm" onClick={() => setNotesViewMode('hidden')}>ノートを非表示</Button>
            <Button variant="primary" size="sm" onClick={() => setNotesViewMode(isNarrowViewport ? 'hidden' : 'split')}>
              {isNarrowViewport ? '閉じる' : 'ターン画面に戻る'}
            </Button>
          </div>
          <SessionNotesWorkspace mode="full" />
        </section>
      )}

      {notesView === 'split' && (
        <aside className={`${wizardSummaryClass} grid h-[calc(100vh-150px)] min-h-0 min-w-[300px] w-[var(--notes-rail-width,340px)] grid-rows-[auto_minmax(0,1fr)] self-stretch overflow-hidden`} aria-label="セッションノート">
          <div className="mb-2.5 flex items-center justify-end gap-2.5" aria-label="ノート表示設定">
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
          <SessionNotesWorkspace mode="side" />
        </aside>
      )}
    </div>
    </AppChrome>
  );
}
