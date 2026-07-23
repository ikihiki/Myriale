import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';

export type DemoDbKind =
  | 'empty'
  | 'registrationDraft'
  | 'editableScenario'
  | 'activeSession'
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
  summary?: string;
  tone?: string;
  lore?: string;
  aiFreedom?: string;
  heroMode?: 'fixed' | 'select' | 'free';
  heroFreeGenerationAllowed?: boolean;
  hero?: string;
  opening?: string;
  illustrationStyle?: string;
  illustrationMood?: string;
  illustrationNegative?: string;
  sampleScene?: string;
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
  state: 'NotStarted' | 'Preparing' | 'Active' | 'Completed';
  hero: string;
  turn: number;
  summary: string;
  turnDisplay?: Record<number, TurnDisplayFlags>;
};

export type AppDb = {
  auth: {
    currentUserId: string | null;
    currentUser: { id: string; name: string; email: string; role?: string; state: 'active' | 'suspended' | 'deleted' } | null;
    status: 'unknown' | 'anonymous' | 'authenticated';
    lastLoadedAt: string | null;
    error: string | null;
    users: Array<{ id: string; name: string; email: string; role: string; state: 'active' | 'suspended' }>;
  };
  scenarios: Record<string, ScenarioRecord>;
  playSessions: Record<string, PlaySessionRecord>;
  notes: {
    proposals: Array<{ id: string; sessionId: string; title: string; status: 'pending' | 'applied' }>;
    lorebook: Array<{ id: string; kind: 'person' | 'place' | 'canon'; title: string; body: string }>;
  };
  ui: {
    notices: string[];
    selectedScenarioId?: string;
    selectedSessionId?: string;
    notesPanelMode?: 'side' | 'full';
    sessionView?: 'dialogue' | 'program' | 'modeTransition';
    openNoteId?: string | null;
  };
};

export type AppAction =
  | { type: 'SCENARIO_DRAFT_UPDATED'; scenarioId: string; patch: Partial<ScenarioRecord> }
  | { type: 'SCENARIO_SAVED'; scenario: ScenarioRecord }
  | { type: 'SESSION_STARTED'; session: PlaySessionRecord }
  | { type: 'TURN_APPENDED'; sessionId: string; summary: string }
  | { type: 'TURN_REWOUND'; sessionId: string; turn: number }
  | { type: 'NOTE_PROPOSAL_APPLIED'; proposalId: string }
  | { type: 'LOREBOOK_NOTE_UPDATED'; noteId: string; body: string }
  | { type: 'NOTES_PANEL_MODE_CHANGED'; mode: 'side' | 'full' }
  | { type: 'NOTE_DIALOG_OPENED'; noteId: string }
  | { type: 'NOTE_DIALOG_CLOSED' }
  | { type: 'USER_AUTHENTICATED'; userId: string }
  | { type: 'ACCOUNT_SESSION_LOADED'; user: AppDb['auth']['currentUser'] }
  | { type: 'ACCOUNT_LOGGED_OUT' }
  | { type: 'ACCOUNT_PROFILE_UPDATED'; user: NonNullable<AppDb['auth']['currentUser']> }
  | { type: 'ACCOUNT_AUTH_FAILED'; message: string }
  | { type: 'USER_ADMIN_CHANGED'; userId: string; state: 'active' | 'suspended' };

export function appReducer(db: AppDb, action: AppAction): AppDb {
  switch (action.type) {
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
    case 'ACCOUNT_SESSION_LOADED':
      return {
        ...db,
        auth: {
          ...db.auth,
          currentUser: action.user,
          currentUserId: action.user?.id ?? null,
          status: action.user ? 'authenticated' : 'anonymous',
          lastLoadedAt: new Date().toISOString(),
          error: null,
        },
      };
    case 'ACCOUNT_LOGGED_OUT':
      return {
        ...db,
        auth: { ...db.auth, currentUser: null, currentUserId: null, status: 'anonymous', error: null },
      };
    case 'ACCOUNT_PROFILE_UPDATED':
      return {
        ...db,
        auth: {
          ...db.auth,
          currentUser: action.user,
          currentUserId: action.user.id,
          status: 'authenticated',
          error: null,
        },
      };
    case 'ACCOUNT_AUTH_FAILED':
      return { ...db, auth: { ...db.auth, status: 'anonymous', error: action.message } };
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

export function AppStoreProvider({ initialDb, children }: { initialDb?: AppDb; children: ReactNode }) {
  const startDb = useMemo(() => initialDb ?? createDemoDb('empty'), [initialDb]);
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
      tone: '静かで不穏、淡い希望',
      lore: '星座は魔法体系の鍵。死者の名前を読むと記憶を失う。',
      heroMode: 'select',
      heroFreeGenerationAllowed: false,
      hero: 'ミラ / 星図を読む巡礼者\nセオ / 星図を燃やす護衛\nエル / 記憶を失った写字生',
      opening: 'あなたは水没した閲覧室で目を覚ます。',
    },
    'SCN-ASH-STATION': {
      id: 'SCN-ASH-STATION',
      title: '灰の駅と宛名のない切符',
      status: kind === 'registrationDraft' ? 'draft' : 'private',
      genre: '終末ロードムービー',
      updatedAt: '2026-06-18 22:15',
      tone: '乾いた祈り、遠い汽笛',
      lore: '朝が来ない荒野では、切符だけが次の町を覚えている。',
      heroMode: 'free',
      heroFreeGenerationAllowed: false,
      hero: '灰の駅で目覚めた旅人。名前と過去はプレイヤーが自由に決められる。',
      opening: 'あなたは灰の降る駅で、宛名のない切符を握っている。',
    },
    'SCN-MOONLIT-GARDEN': {
      id: 'SCN-MOONLIT-GARDEN',
      title: '月虹の庭と眠らない時計',
      status: 'published',
      genre: '幻想庭園ミステリ',
      updatedAt: '2026-07-19 00:00',
      summary: '月虹が咲く庭園で、止まらない時計塔と消えた庭師の秘密を追う幻想譚。',
      tone: '華やかで切ない、夜明け前の期待',
      lore: '庭園の花は訪問者の記憶から色を得る。時計塔が十三回鳴ると、選ばなかった未来が姿を現す。',
      heroMode: 'select',
      heroFreeGenerationAllowed: true,
      hero: 'イリス / 月虹を集める若い庭師\nカイ / 時計塔を修理する旅の技師\nマレ / 忘れられた未来を記録する画家',
      opening: '十三回目の鐘が鳴り、あなたの足元に見覚えのない月虹の花が咲く。',
    },
    'SCN-GLASS-FOREST': {
      id: 'SCN-GLASS-FOREST',
      title: '硝子の森と夜明けの司書',
      status: 'published',
      genre: '幻想ミステリ',
      updatedAt: '2026-06-16 08:40',
      tone: '透明で緊張感のある静けさ',
      lore: '森の硝子片は、嘘をついた者の声だけを反射する。',
      heroMode: 'fixed',
      heroFreeGenerationAllowed: false,
      hero: 'リュシエン / 夜明け前の森を巡る司書',
      opening: '夜明け前の森で、割れた書架が小さく鳴る。',
    },
  };
  const playSessions: AppDb['playSessions'] = kind === 'empty' ? {} : {
    'SES-PREP-1098': {
      id: 'SES-PREP-1098',
      scenarioId: 'SCN-STAR-LIBRARY',
      state: 'Active',
      hero: 'ミラ / 星図を読む巡礼者',
      turn: 1,
      summary: '水没した閲覧室で星図灯が点き、禁書庫への扉が半分だけ開いている。',
      turnDisplay: Object.fromEntries(
        Array.from({ length: 12 }, (_, index) => [index + 1, { allowRewind: true, showInterpretation: true, leadTone: 'player', leadTag: '⟶' }]),
      ),
    },
    'SES-ACT-2042': {
      id: 'SES-ACT-2042',
      scenarioId: 'SCN-MOONLIT-GARDEN',
      state: 'Active',
      hero: 'イリス / 月虹を集める若い庭師',
      turn: 12,
      summary: '十三回目の鐘が鳴り、見覚えのない月虹の花が時計塔の足元に咲いている。',
      turnDisplay: Object.fromEntries(
        Array.from({ length: 12 }, (_, index) => [index + 1, { allowRewind: true, showInterpretation: true, leadTone: 'program', leadTag: '✦' }]),
      ),
    },
  };
  const base: AppDb = {
    auth: {
      currentUserId: 'USR-1031',
      currentUser: { id: 'USR-1031', name: '霧野しおり', email: 'reader@myriale.example', role: 'プレイヤー', state: 'active' },
      status: 'authenticated',
      lastLoadedAt: null,
      error: null,
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
