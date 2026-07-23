export type HomeDashboardDto = {
  account: {
    displayName: string;
    email: string;
    initials: string;
    role: string;
    unreadNotifications: number;
    currentWorkspaceName: string;
  };
  activeSessions: Array<{
    id: string;
    scenarioId: string;
    scenarioTitle: string;
    selectedHero: string;
    status: 'active' | 'completed' | string;
    headTurnId?: string | null;
    headTurnPosition?: number | null;
    turnCount: number;
    latestSummary?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  recommendedScenarios: Array<{
    id: string;
    title: string;
    genre: string;
    status: 'draft' | 'published' | 'private' | string;
    updatedAt: string;
    summary: string;
    heroMode?: 'fixed' | 'select' | 'free';
    heroFreeGenerationAllowed?: boolean;
    hero?: string;
  }>;
};

export type HomeDashboardLoadState =
  | { status: 'idle'; source: 'store' }
  | { status: 'loading'; source: 'api' }
  | { status: 'loaded'; source: 'api' }
  | { status: 'error'; source: 'store'; message: string };

const HOME_DASHBOARD_PATH = '/api/home/dashboard';

export function getHomeDashboardApiUrl() {
  const configured = import.meta.env.VITE_MYRIAL_API_BASE_URL?.trim();
  if (configured && configured.length > 0) {
    return `${configured.replace(/\/$/, '')}${HOME_DASHBOARD_PATH}`;
  }

  return import.meta.env.VITE_MYRIAL_API_MODE === 'proxy' ? HOME_DASHBOARD_PATH : null;
}

export function isHomeDashboardApiEnabled() {
  return getHomeDashboardApiUrl() !== null;
}

export async function fetchHomeDashboard(signal?: AbortSignal): Promise<HomeDashboardDto> {
  const apiUrl = getHomeDashboardApiUrl();
  if (!apiUrl) {
    throw new Error('Home dashboard API is not configured.');
  }

  const response = await fetch(apiUrl, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Home dashboard API returned ${response.status}.`);
  }

  return response.json() as Promise<HomeDashboardDto>;
}
