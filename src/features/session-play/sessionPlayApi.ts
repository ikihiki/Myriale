export type NarrativeTurnApiResponse = {
  id: string;
  position: number;
  previousTurnId?: string | null;
  kind: string;
  execution?: unknown | null;
  narrative?: {
    schemaVersion?: string | null;
    turnType?: string | null;
    heading?: string | null;
    body: string;
    playerInputId?: string | null;
    playerInput?: string | null;
    acceptedAfterTurnId?: string | null;
    signals?: string[] | null;
    interpretation?: string | null;
  } | null;
  narrativeHandoff?: {
    status: string;
    errorCode?: string | null;
    errorMessage?: string | null;
  } | null;
  createdAt: string;
};

export type PendingPlayerInputApiResponse = {
  playerInputId: string;
  requestId: string;
  input: string;
  acceptedAfterTurnId?: string | null;
  status: string;
  isRetryable: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  attemptCount: number;
  updatedAt: string;
};

export type SessionApiResponse = {
  id: string;
  scenarioId: string;
  status: string;
  headTurnId?: string | null;
  revision: number;
  interpretationEnabled: boolean;
  turns: NarrativeTurnApiResponse[];
  pendingInputs: PendingPlayerInputApiResponse[];
  createdAt: string;
  updatedAt: string;
};

export type SessionApiError = Error & {
  status?: number;
  code?: string;
};

export function getSessionApiBaseUrl() {
  const configured = import.meta.env.VITE_MYRIAL_API_BASE_URL?.trim();
  if (configured && configured.length > 0) return `${configured.replace(/\/$/, '')}/api/sessions`;
  return import.meta.env.VITE_MYRIAL_API_MODE === 'proxy' ? '/api/sessions' : null;
}

export async function createSession(
  scenarioId: string,
  requestId: string,
  baseUrl = getSessionApiBaseUrl(),
  interpretationEnabled = false,
): Promise<SessionApiResponse> {
  if (!baseUrl) throw sessionApiError('Session APIが設定されていません。', 503, 'session_api_unavailable');
  const response = await fetch(`${baseUrl}/`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId, requestId, interpretationEnabled }),
  });
  if (!response.ok) throw await toSessionApiError(response, 'Sessionを開始できませんでした。');
  return response.json() as Promise<SessionApiResponse>;
}

export async function getSession(
  sessionId: string,
  baseUrl = getSessionApiBaseUrl(),
  signal?: AbortSignal,
): Promise<SessionApiResponse> {
  if (!baseUrl) throw sessionApiError('Session APIが設定されていません。', 503, 'session_api_unavailable');
  const response = await fetch(`${baseUrl}/${encodeURIComponent(sessionId)}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) throw await toSessionApiError(response, 'Sessionを読み込めませんでした。');
  return response.json() as Promise<SessionApiResponse>;
}

export async function recommendNextAction(
  sessionId: string,
  baseUrl = getSessionApiBaseUrl(),
): Promise<string> {
  if (!baseUrl) throw sessionApiError('Session APIが設定されていません。', 503, 'session_api_unavailable');
  const response = await fetch(`${baseUrl}/${encodeURIComponent(sessionId)}/action-recommendation`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw await toSessionApiError(response, '次の行動案を生成できませんでした。');
  const payload = await response.json() as { suggestion: string };
  return payload.suggestion;
}

export async function createNarrativeTurn(
  sessionId: string,
  input: string,
  requestId: string,
  baseUrl = getSessionApiBaseUrl(),
): Promise<NarrativeTurnApiResponse> {
  if (!baseUrl) throw sessionApiError('Session APIが設定されていません。', 503, 'session_api_unavailable');
  const response = await fetch(`${baseUrl}/${encodeURIComponent(sessionId)}/narrative-turns`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, input }),
  });
  if (!response.ok) throw await toSessionApiError(response, 'Narrativeの生成に失敗しました。');
  return response.json() as Promise<NarrativeTurnApiResponse>;
}

async function toSessionApiError(response: Response, fallback: string): Promise<SessionApiError> {
  const payload = await response.json().catch(() => null) as { code?: string; message?: string } | null;
  return sessionApiError(payload?.message ?? fallback, response.status, payload?.code);
}

function sessionApiError(message: string, status?: number, code?: string): SessionApiError {
  const error = new Error(message) as SessionApiError;
  error.status = status;
  error.code = code;
  return error;
}
