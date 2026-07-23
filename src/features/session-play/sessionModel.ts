import type { ReactNode } from 'react';
import type { AppChromeAccount } from '../../account/accountPresentation';
import type { TurnDisplayFlags } from '../../app/store';
import type { NoteReviewRequest } from './SessionActivityFeed';
import type {
  NarrativeInteractionType,
  NarrativeTurnApiResponse,
  SessionApiResponse,
} from './sessionPlayApi';

export type TurnKind = 'action' | 'clarification' | 'rewound';

export type DialogueTurn = {
  id: number;
  turnTitle: string;
  narrative: string;
  playerInput?: string;
  interpretation?: string;
  kind: TurnKind;
  display?: TurnDisplayFlags;
};

export type HeadingLink = {
  title: string;
  startTurnId: number;
  summary: string;
};

export type SessionMode = 'dialogue' | 'battle' | 'roll' | 'event' | 'recovering';
export type SessionModeFlavor = 'dialogue' | 'program' | 'modeTransition';
export type BattleAction = '攻撃' | '防御' | 'スキル' | '逃走';
export type RecoveryPoint = 'lastConfirmed' | 'safePoint';

export type SessionProgramController = {
  mode: SessionMode;
  flavor: SessionModeFlavor;
  battle: { enemy: string; playerHp: number; enemyHp: number; turn: number };
  rollResult: { value: number; success: boolean } | null;
  fixedRoll: string;
  eventAdvanced: boolean;
  pendingAction: string;
  lastConfirmed: string;
  recoveryPoint: RecoveryPoint | null;
  transitions: Array<{ id: number; from: string; to: string; reason: string; at: string }>;
  notice: string;
  onFixedRollChange(value: string): void;
  onStartBattle(label: 'バトルを開始' | 'バトル開始'): void;
  onStartRoll(label: '判定を開始' | '判定開始'): void;
  onStartEvent(label: '強制イベントを発生' | '強制イベント開始'): void;
  onBattleAction(action: BattleAction): void;
  onRoll(): void;
  onAdvanceEvent(): void;
  onComplete(): void;
  onProcessingError(): void;
  onRecover(point: RecoveryPoint): void;
  onReconnect(): void;
};

export type SessionNoticeKind =
  | 'info'
  | 'success'
  | 'authentication-required'
  | 'not-found'
  | 'conflict'
  | 'rate-limited'
  | 'service-unavailable'
  | 'timeout'
  | 'unknown';

export type SessionNoticeAction = 'login' | 'reload' | 'session-list';

export type SessionNotice = {
  kind: SessionNoticeKind;
  title?: string;
  message: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
  retryable: boolean;
  action?: SessionNoticeAction;
};

export type SessionNoticeInput = SessionNotice | string;

export const sessionInfoNotice = (message: string): SessionNotice => ({
  kind: 'info', message, tone: 'info', retryable: false,
});

export function toSessionNotice(
  error: import('./sessionPlayApi').SessionApiError,
  context: 'load' | 'poll' | 'submit' | 'recommend' | 'execution' | 'note-review',
): SessionNotice {
  if (error.code === 'request_in_progress') {
    return { kind: 'info', title: 'Narrativeを生成中です', message: '同じ入力はすでに受理されています。重複送信せず、完了まで待つかSessionを再読み込みしてください。', tone: 'info', retryable: false, action: 'reload' };
  }
  const submit = context === 'submit';
  switch (error.kind) {
    case 'unauthorized':
      return { kind: 'authentication-required', title: 'ログインが必要です', message: 'ログインの有効期限が切れたか、このSessionを表示する権限がありません。', tone: 'danger', retryable: false, action: 'login' };
    case 'not-found':
      return { kind: 'not-found', title: 'Sessionが見つかりません', message: 'Sessionが削除されたか、URLが正しくない可能性があります。', tone: 'danger', retryable: false, action: 'session-list' };
    case 'conflict':
      return { kind: 'conflict', title: 'Sessionの状態が更新されました', message: '最新のSession状態を読み込んでから、入力内容を確認してもう一度送信してください。', tone: 'warning', retryable: false, action: 'reload' };
    case 'rate-limited':
      return { kind: 'rate-limited', title: 'しばらく待ってから再試行してください', message: submit ? '短時間に送信が集中しています。入力は保持されています。' : '短時間にリクエストが集中しています。', tone: 'warning', retryable: submit };
    case 'service-unavailable':
      return { kind: 'service-unavailable', title: 'Sessionサービスを利用できません', message: submit ? '一時的に接続できません。入力は保持されています。' : '一時的に接続できません。しばらく待ってから再読み込みしてください。', tone: 'danger', retryable: submit, action: submit ? undefined : 'reload' };
    case 'timeout':
      return { kind: 'timeout', title: '応答が時間内に返りませんでした', message: submit ? '入力は保持されています。同じ内容で再試行できます。' : '通信が混み合っている可能性があります。もう一度お試しください。', tone: 'warning', retryable: submit, action: submit ? undefined : 'reload' };
    default:
      return { kind: 'unknown', title: '操作を完了できませんでした', message: error.message || '予期しないエラーが発生しました。', tone: 'danger', retryable: submit };
  }
}

export type SessionCommandResult<T = undefined> = {
  ok: boolean;
  notice: SessionNoticeInput;
  value?: T;
};

export type SessionPresentationProps = {
  sessionId: string;
  account: AppChromeAccount | null;
  turns: DialogueTurn[];
  headingLinks: HeadingLink[];
  sessionStateLabel: string;
  activitySession?: SessionApiResponse;
  activeModulePanel?: ReactNode;
  moduleHandoffPending?: boolean;
  initialInput?: string;
  initialInteractionType?: NarrativeInteractionType;
  initialNotice?: SessionNoticeInput;
  liveNotice?: SessionNotice | null;
  isSubmitting?: boolean;
  isRecommending?: boolean;
  turnDisplay?: Record<number, TurnDisplayFlags>;
  program?: SessionProgramController;
  onLogout?: () => void | Promise<void>;
  onLogin?: () => void;
  onReload?: () => void;
  onSessionList?: () => void;
  onSubmit(input: string, interactionType: NarrativeInteractionType): Promise<SessionCommandResult>;
  onRecommend(): Promise<SessionCommandResult<string>>;
  onClarification?: () => Promise<SessionCommandResult> | SessionCommandResult;
  onExecutionAction?: (executionId: string, action: 'retry' | 'cancel' | 'dismiss') => Promise<SessionCommandResult>;
  onNoteReview?: (artifactId: string, action: 'apply' | 'edit-apply' | 'reject' | 'snooze', request: NoteReviewRequest) => Promise<SessionCommandResult>;
  onRewind?: (turnId: number) => Promise<SessionCommandResult> | SessionCommandResult;
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
