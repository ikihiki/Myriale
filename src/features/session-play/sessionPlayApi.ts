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

export type NarrativeInteractionType = 'dialogue' | 'clarification';

export type PendingPlayerInputApiResponse = {
  playerInputId: string;
  requestId: string;
  input: string;
  interactionType: NarrativeInteractionType;
  acceptedAfterTurnId?: string | null;
  status: string;
  isRetryable: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  attemptCount: number;
  updatedAt: string;
};

export type SessionExecutionStatus = 'queued' | 'running' | 'retry-wait' | 'cancel-requested' | 'succeeded' | 'failed' | 'cancelled' | 'superseded';

export type SessionPlayerInputApiResponse = {
  id: string; requestId: string; text: string; interactionType: NarrativeInteractionType;
  acceptedAfterTurnId?: string | null; acceptedSessionRevision: number; supersedesInputId?: string | null; createdAt: string;
};

export type SessionExecutionAttemptApiResponse = {
  id: string; attemptNumber: number; status: string; workerId?: string | null; provider?: string | null; model?: string | null;
  providerRequestId?: string | null; startedAt: string; completedAt?: string | null; latencyMilliseconds?: number | null;
  inputTokens?: number | null; outputTokens?: number | null; finishReason?: string | null; errorCode?: string | null;
  errorCategory?: string | null; retryable: boolean; correlationId?: string | null; traceId?: string | null; spanId?: string | null;
  exceptionChain?: string | null; redactedResponseExcerpt?: string | null; promptVersion?: string | null; contextHash?: string | null; contextSizeBytes?: number | null;
};

export type SessionExecutionApiResponse = {
  id: string; sessionId: string; kind: 'narrative' | 'module-handoff' | 'note-proposal' | 'image' | string;
  triggerType: string; triggerId: string; status: SessionExecutionStatus; revision: number; isRetryable: boolean;
  attemptCount: number; maxAttempts: number; nextAttemptAt?: string | null; errorCode?: string | null; userErrorMessage?: string | null;
  createdAt: string; startedAt?: string | null; completedAt?: string | null; cancelRequestedAt?: string | null; dismissedAt?: string | null;
  capabilities: { canRetry: boolean; canCancel: boolean; canDismiss: boolean };
  developmentDiagnostics?: {
    sessionId: string; triggerType: string; triggerId: string; revision: number; leaseOwner?: string | null;
    leaseTokenHint?: string | null; leaseExpiresAt?: string | null; attempts: SessionExecutionAttemptApiResponse[];
  } | null;
};

export type SessionArtifactApiResponse = {
  id: string; executionId: string; kind: 'narrative-text' | 'note-patch' | 'image' | 'summary' | string;
  status: string; contentType: string; mediaUrl?: string | null; metadataJson?: string | null; createdAt: string; committedAt?: string | null;
};
export type SessionActivityApiResponse = { type: 'input' | 'execution' | 'artifact' | 'turn'; id: string; order: number; causalId?: string | null };
export type SessionNoteProposalApiResponse = {
  artifactId: string; sourceTurnId: string; noteId?: string | null; expectedNoteRevision: number; proposedTitle: string;
  beforeBody: string; proposedBody: string; rationale: string; status: string; createdAt: string;
};
export type SessionInputAcceptedApiResponse = { input: SessionPlayerInputApiResponse; execution: SessionExecutionApiResponse };

export type SessionApiResponse = {
  id: string;
  scenarioId: string;
  status: string;
  headTurnId?: string | null;
  revision: number;
  interpretationEnabled: boolean;
  turns: NarrativeTurnApiResponse[];
  pendingInputs: PendingPlayerInputApiResponse[];
  inputs?: SessionPlayerInputApiResponse[];
  executions?: SessionExecutionApiResponse[];
  artifacts?: SessionArtifactApiResponse[];
  activity?: SessionActivityApiResponse[];
  noteProposals?: SessionNoteProposalApiResponse[];
  createdAt: string;
  updatedAt: string;
};

export type SessionApiError = Error & {
  status?: number;
  code?: string;
  details?: string;
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
  selectedHero?: string,
): Promise<SessionApiResponse> {
  if (!baseUrl) throw sessionApiError('Session APIが設定されていません。', 503, 'session_api_unavailable');
  const response = await fetch(`${baseUrl}/`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId, requestId, interpretationEnabled, selectedHero }),
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

export async function acceptSessionInput(
  sessionId: string,
  text: string,
  requestId: string,
  baseUrl = getSessionApiBaseUrl(),
  interactionType: NarrativeInteractionType = 'dialogue',
  supersedesInputId?: string,
): Promise<SessionInputAcceptedApiResponse> {
  if (!baseUrl) throw sessionApiError('Session APIが設定されていません。', 503, 'session_api_unavailable');
  const response = await fetch(`${baseUrl}/${encodeURIComponent(sessionId)}/inputs`, {
    method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, text, interactionType, requestedOutputs: ['narrative'], supersedesInputId }),
  });
  if (!response.ok) throw await toSessionApiError(response, 'Player Inputを受け付けられませんでした。');
  return response.json() as Promise<SessionInputAcceptedApiResponse>;
}

export async function mutateSessionExecution(
  executionId: string,
  action: 'retry' | 'cancel' | 'dismiss',
  baseUrl = getSessionApiBaseUrl(),
): Promise<SessionExecutionApiResponse> {
  if (!baseUrl) throw sessionApiError('Session APIが設定されていません。', 503, 'session_api_unavailable');
  const apiRoot = baseUrl.replace(/\/sessions$/, '');
  const response = await fetch(`${apiRoot}/session-executions/${encodeURIComponent(executionId)}/${action}`, {
    method: 'POST', credentials: 'include', headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw await toSessionApiError(response, 'Executionを更新できませんでした。');
  return response.json() as Promise<SessionExecutionApiResponse>;
}

export async function reviewSessionNoteProposal(
  artifactId: string,
  action: 'apply' | 'edit-apply' | 'reject' | 'snooze',
  request: { expectedNoteRevision: number; title?: string; body?: string },
  baseUrl = getSessionApiBaseUrl(),
): Promise<SessionNoteProposalApiResponse> {
  if (!baseUrl) throw sessionApiError('Session APIが設定されていません。', 503, 'session_api_unavailable');
  const apiRoot = baseUrl.replace(/\/sessions$/, '');
  const response = await fetch(`${apiRoot}/session-artifacts/note-proposals/${encodeURIComponent(artifactId)}/${action}`, {
    method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw await toSessionApiError(response, 'ノート変更案を更新できませんでした。');
  return response.json() as Promise<SessionNoteProposalApiResponse>;
}

export const hasActiveSessionExecutions = (session: SessionApiResponse) =>
  Boolean(session.executions?.some((execution) => ['queued', 'running', 'retry-wait', 'cancel-requested'].includes(execution.status)));

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

async function toSessionApiError(response: Response, fallback: string): Promise<SessionApiError> {
  const payload = await response.json().catch(() => null) as { code?: string; message?: string; details?: string } | null;
  const message = payload?.details ? `${payload.message ?? fallback}\n${payload.details}` : payload?.message ?? fallback;
  return sessionApiError(message, response.status, payload?.code, payload?.details);
}

function sessionApiError(message: string, status?: number, code?: string, details?: string): SessionApiError {
  const error = new Error(message) as SessionApiError;
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}
