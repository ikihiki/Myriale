import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { parseAppUrl, type AppRoute } from './routes';

export type DemoDbKind =
  | 'empty'
  | 'registrationDraft'
  | 'editableScenario'
  | 'activeSession'
  | 'resumableSession'
  | 'programDrivenSession'
  | 'modeTransitionSession'
  | 'notesReview'
  | 'lorebook'
  | 'adminUsers';

export type ScenarioRecord = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'private';
  genre: string;
  updatedAt: string;
};

export type TurnDisplayFlags = {
  allowRewind: boolean;
  showInterpretation: boolean;
  leadTone?: 'player' | 'program';
  leadTag?: string;
};

export type PlaySessionRecord = {
  id: string;
  scenarioId: string;
  state: 'NotStarted' | 'Preparing' | 'Active' | 'Paused' | 'Completed';
  hero: string;
  turn: number;
  summary: string;
  turnDisplay?: Record<number, TurnDisplayFlags>;
};

export type AppDb = {
  auth: {
    currentUserId: string | null;
    users: Array<{ id: string; name: string; email: string; role: string; state: 'active' | 'suspended' }>;
  };
  scenarios: Record<string, ScenarioRecord>;
  playSessions: Record<string, PlaySessionRecord>;
  notes: {
    proposals: Array<{ id: string; sessionId: string; title: string; status: 'pending' | 'applied' }>;
    lorebook: Array<{ id: string; kind: 'person' | 'place' | 'canon'; title: string; body: string }>;
  };
  ui: {
    route: AppRoute;
    notices: string[];
    selectedScenarioId?: string;
    selectedSessionId?: string;
    notesPanelMode?: 'side' | 'full';
    sessionView?: 'dialogue' | 'program' | 'modeTransition';
    openNoteId?: string | null;
  };
};

export type AppAction =
  | { type: 'NAVIGATE'; route: AppRoute }
  | { type: 'SCENARIO_DRAFT_UPDATED'; scenarioId: string; patch: Partial<ScenarioRecord> }
  | { type: 'SCENARIO_SAVED'; scenario: ScenarioRecord }
  | { type: 'SESSION_STARTED'; session: PlaySessionRecord }
  | { type: 'SESSION_RESUMED'; sessionId: string }
  | { type: 'TURN_APPENDED'; sessionId: string; summary: string }
  | { type: 'TURN_REWOUND'; sessionId: string; turn: number }
  | { type: 'NOTE_PROPOSAL_APPLIED'; proposalId: string }
  | { type: 'LOREBOOK_NOTE_UPDATED'; noteId: string; body: string }
  | { type: 'NOTES_PANEL_MODE_CHANGED'; mode: 'side' | 'full' }
  | { type: 'NOTE_DIALOG_OPENED'; noteId: string }
  | { type: 'NOTE_DIALOG_CLOSED' }
  | { type: 'USER_AUTHENTICATED'; userId: string }
  | { type: 'USER_ADMIN_CHANGED'; userId: string; state: 'active' | 'suspended' };

export function appReducer(db: AppDb, action: AppAction): AppDb {
  switch (action.type) {
    case 'NAVIGATE':
      return {
        ...db,
        ui: {
          ...db.ui,
          route: action.route,
          selectedScenarioId: action.route.params.scenarioId ?? db.ui.selectedScenarioId,
          selectedSessionId: action.route.params.sessionId ?? db.ui.selectedSessionId,
        },
      };
    case 'SCENARIO_DRAFT_UPDATED': {
      const current = db.scenarios[action.scenarioId];
      if (!current) return db;
      return { ...db, scenarios: { ...db.scenarios, [action.scenarioId]: { ...current, ...action.patch } } };
    }
    case 'SCENARIO_SAVED':
      return { ...db, scenarios: { ...db.scenarios, [action.scenario.id]: action.scenario } };
    case 'SESSION_STARTED':
      return {
        ...db,
        playSessions: { ...db.playSessions, [action.session.id]: action.session },
        ui: { ...db.ui, selectedSessionId: action.session.id },
      };
    case 'SESSION_RESUMED': {
      const session = db.playSessions[action.sessionId];
      if (!session) return db;
      return {
        ...db,
        playSessions: { ...db.playSessions, [action.sessionId]: { ...session, state: 'Active' } },
        ui: { ...db.ui, selectedSessionId: action.sessionId },
      };
    }
    case 'TURN_APPENDED': {
      const session = db.playSessions[action.sessionId];
      if (!session) return db;
      return {
        ...db,
        playSessions: {
          ...db.playSessions,
          [action.sessionId]: { ...session, turn: session.turn + 1, summary: action.summary },
        },
      };
    }
    case 'TURN_REWOUND': {
      const session = db.playSessions[action.sessionId];
      if (!session) return db;
      return { ...db, playSessions: { ...db.playSessions, [action.sessionId]: { ...session, turn: action.turn } } };
    }
    case 'NOTE_PROPOSAL_APPLIED':
      return {
        ...db,
        notes: {
          ...db.notes,
          proposals: db.notes.proposals.map((proposal) =>
            proposal.id === action.proposalId ? { ...proposal, status: 'applied' } : proposal,
          ),
        },
      };
    case 'LOREBOOK_NOTE_UPDATED':
      return {
        ...db,
        notes: {
          ...db.notes,
          lorebook: db.notes.lorebook.map((note) =>
            note.id === action.noteId ? { ...note, body: action.body } : note,
          ),
        },
      };
    case 'NOTES_PANEL_MODE_CHANGED':
      return { ...db, ui: { ...db.ui, notesPanelMode: action.mode } };
    case 'NOTE_DIALOG_OPENED':
      return { ...db, ui: { ...db.ui, openNoteId: action.noteId } };
    case 'NOTE_DIALOG_CLOSED':
      return { ...db, ui: { ...db.ui, openNoteId: null } };
    case 'USER_AUTHENTICATED':
      return { ...db, auth: { ...db.auth, currentUserId: action.userId } };
    case 'USER_ADMIN_CHANGED':
      return {
        ...db,
        auth: {
          ...db.auth,
          users: db.auth.users.map((user) => (user.id === action.userId ? { ...user, state: action.state } : user)),
        },
      };
    default:
      return db;
  }
}

const AppStoreContext = createContext<{ db: AppDb; dispatch: Dispatch<AppAction> } | null>(null);

export function AppStoreProvider({ initialDb, initialUrl, children }: { initialDb?: AppDb; initialUrl?: string; children: ReactNode }) {
  const startDb = useMemo(() => {
    const db = initialDb ?? createDemoDb('activeSession');
    return { ...db, ui: { ...db.ui, route: parseAppUrl(initialUrl ?? db.ui.route.path) } };
  }, [initialDb, initialUrl]);
  const [db, dispatch] = useReducer(appReducer, startDb);
  const value = useMemo(() => ({ db, dispatch }), [db]);
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useOptionalAppStore() {
  return useContext(AppStoreContext);
}

export function useAppStore() {
  const value = useContext(AppStoreContext);
  if (!value) throw new Error('useAppStore must be used inside AppStoreProvider');
  return value;
}

export function createDemoDb(kind: DemoDbKind = 'activeSession', overrides: Partial<AppDb> = {}): AppDb {
  const scenarios: AppDb['scenarios'] = {
    'SCN-STAR-LIBRARY': {
      id: 'SCN-STAR-LIBRARY',
      title: '星喰いの地下図書館',
      status: 'published',
      genre: 'ダークファンタジー探索譚',
      updatedAt: '2026-06-20 19:30',
    },
    'SCN-ASH-STATION': {
      id: 'SCN-ASH-STATION',
      title: '灰の駅と宛名のない切符',
      status: kind === 'registrationDraft' ? 'draft' : 'private',
      genre: '終末ロードムービー',
      updatedAt: '2026-06-18 22:15',
    },
  };
  const playSessions: AppDb['playSessions'] = {
    'SES-PREP-1098': {
      id: 'SES-PREP-1098',
      scenarioId: 'SCN-STAR-LIBRARY',
      state: kind === 'resumableSession' ? 'Paused' : 'Active',
      hero: 'ミラ / 星図を読む巡礼者',
      turn: kind === 'resumableSession' ? 7 : 1,
      summary: '水没した閲覧室で星図灯が点き、禁書庫への扉が半分だけ開いている。',
      turnDisplay: Object.fromEntries(
        Array.from({ length: 12 }, (_, index) => [index + 1, { allowRewind: true, showInterpretation: true, leadTone: 'player', leadTag: '⟶' }]),
      ),
    },
  };
  const base: AppDb = {
    auth: {
      currentUserId: 'USR-1031',
      users: [
        { id: 'USR-1031', name: '霧野しおり', email: 'reader@myriale.example', role: 'プレイヤー', state: 'active' },
        { id: 'USR-1088', name: '天城レン', email: 'ren@example.com', role: '管理者', state: 'active' },
      ],
    },
    scenarios,
    playSessions,
    notes: {
      proposals: [
        { id: 'NOTE-PROP-01', sessionId: 'SES-PREP-1098', title: '地下図書館の閲覧室', status: kind === 'notesReview' ? 'pending' : 'applied' },
      ],
      lorebook: [
        { id: 'LORE-01', kind: 'place', title: '水没した閲覧室', body: '星図灯が水面に反射し、死者の名前だけが読めない。' },
      ],
    },
    ui: {
      route: parseAppUrl('/sessions/SES-PREP-1098'),
      notices: ['Redux風ストアでStorybookデモ用DBを初期化しました。'],
      notesPanelMode: kind === 'lorebook' || kind === 'notesReview' ? 'full' : 'side',
      sessionView: kind === 'programDrivenSession' ? 'program' : kind === 'modeTransitionSession' ? 'modeTransition' : 'dialogue',
      openNoteId: null,
      selectedScenarioId: 'SCN-STAR-LIBRARY',
      selectedSessionId: 'SES-PREP-1098',
    },
  };
  return mergeDb(base, overrides);
}

function mergeDb(base: AppDb, overrides: Partial<AppDb>): AppDb {
  return {
    ...base,
    ...overrides,
    auth: { ...base.auth, ...overrides.auth },
    scenarios: { ...base.scenarios, ...overrides.scenarios },
    playSessions: { ...base.playSessions, ...overrides.playSessions },
    notes: { ...base.notes, ...overrides.notes },
    ui: { ...base.ui, ...overrides.ui },
  };
}
