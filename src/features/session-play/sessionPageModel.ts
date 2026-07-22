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

export type SessionCommandResult<T = undefined> = {
  ok: boolean;
  notice: string;
  value?: T;
  authenticationRequired?: boolean;
};

export type SessionPagePresentationProps = {
  sessionId: string;
  account: AppChromeAccount | null;
  turns: DialogueTurn[];
  headingLinks: HeadingLink[];
  sessionStateLabel: string;
  activitySession?: SessionApiResponse;
  initialInput?: string;
  initialInteractionType?: NarrativeInteractionType;
  initialNotice?: string;
  isSubmitting?: boolean;
  isRecommending?: boolean;
  authenticationRequired?: boolean;
  turnDisplay?: Record<number, TurnDisplayFlags>;
  program?: SessionProgramController;
  onLogout?: () => void | Promise<void>;
  onLogin?: () => void;
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
