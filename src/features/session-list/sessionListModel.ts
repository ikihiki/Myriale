export type SessionListItemDto = {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  selectedHero: string;
  status: string;
  headTurnId?: string | null;
  headTurnPosition?: number | null;
  turnCount: number;
  latestSummary?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionListStatus = 'active' | 'completed';

export type SessionListItem = {
  id: string;
  status: SessionListStatus;
  scenarioTitle: string;
  heroName: string;
  turnLabel: string;
  summary: string;
  updatedLabel: string;
};

export type SessionListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; sessions: SessionListItem[] };

export function toSessionListItem(session: SessionListItemDto): SessionListItem {
  const status = session.status.toLowerCase();
  if (status !== 'active' && status !== 'completed') {
    throw new Error(`未対応のセッション状態です: ${session.status}`);
  }
  return {
    id: session.id,
    status,
    scenarioTitle: session.scenarioTitle,
    heroName: session.selectedHero,
    turnLabel: (session.headTurnPosition ?? session.turnCount) > 0 ? `第${session.headTurnPosition ?? session.turnCount}ターン` : '開始前',
    summary: session.latestSummary || 'まだ要約はありません。物語の続きをセッションで確認できます。',
    updatedLabel: new Intl.DateTimeFormat('ja-JP', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(session.updatedAt)),
  };
}
