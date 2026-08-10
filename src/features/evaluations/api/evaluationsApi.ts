export type EvaluationStatus = 'draft' | 'queued' | 'running' | 'review' | 'completed' | 'completedWithErrors' | 'cancelled' | 'archived';
export type EvaluationStage = 'action' | 'narrative' | 'entityState';
export type EvaluationReviewPolicy = 'none' | 'single' | 'double-blind';
export type EvaluationCommandResult<T = undefined> = { ok: boolean; message: string; value?: T };

export type EvaluationSessionSummary = {
  id: string; name: string; description?: string; status: EvaluationStatus; situationCount: number; candidateCount: number;
  completedResponseCount: number; plannedResponseCount: number; reviewProgress?: { completed: number; total: number };
  createdAt: string; updatedAt: string;
};
export type EvaluationSituation = {
  id: string; label: string; stage: EvaluationStage; source: 'fixed' | 'quoted'; sourceLabel: string;
  snapshotHash: string; preview: string; createdAt: string;
};
export type EvaluationCandidate = {
  id: string; label: string; profileId: string; profileRevision: number; repetitions: number;
  generation: { temperature?: number; maxOutputTokens?: number; seed?: number; thinkingEnabled?: boolean };
};
export type EvaluationRubricCriterion = { id: string; label: string; description: string; scaleMin: number; scaleMax: number; weight: number; required: boolean };
export type EvaluationSession = EvaluationSessionSummary & {
  situations: EvaluationSituation[]; candidates: EvaluationCandidate[]; rubric: EvaluationRubricCriterion[];
  reviewPolicy: EvaluationReviewPolicy; identitiesRevealed: boolean; revision: number;
};
export type EvaluationCorpus = { id: string; version: string; name: string; description: string; cases: Array<{ id: string; label: string; stage: EvaluationStage; preview: string }> };
export type QuoteBrowser = { scenarios: Array<{ id: string; title: string; sessions: Array<{ id: string; title: string; turns: Array<{ id: string; index: number; stages: Array<{ stage: EvaluationStage; label: string; preview: string }> }> }> }> };
export type EvaluationExecution = {
  status: EvaluationStatus; planned: number; queued: number; running: number; succeeded: number; failed: number; cancelled: number;
  startedAt?: string; updatedAt: string; failures: Array<{ attemptId: string; situationLabel: string; candidateLabel: string; error: string; retryable: boolean }>;
};
export type EvaluationReviewBatch = { id: string; reviewerLabel: string; assignmentCount: number; completedCount: number; status: 'open' | 'completed' | 'locked' };

// Deliberately opaque reviewer-only contract. Do not add provider/model/profile,
// machine judgment/score, cost, latency, token, request, or telemetry fields here.
export type BlindReviewItem = {
  itemId: string; situationLabel: string; situationContext: string; candidateCode: string; responseText: string;
  rubric: Array<{ criterionId: string; label: string; description: string; scaleMin: number; scaleMax: number; required: boolean }>;
  draft?: { scores: Record<string, number>; note: string };
};
export type BlindReviewAssignment = {
  assignmentId: string; evaluationLabel: string; status: 'open' | 'submitted' | 'locked'; currentIndex: number; total: number; item: BlindReviewItem | null;
};
export type BlindJudgmentInput = { scores: Record<string, number>; note: string };

export type EvaluationResponseSummary = { id: string; situationLabel: string; candidateLabel: string; candidateCode: string; status: 'succeeded' | 'failed'; machineScore?: number; humanScore?: number };
export type EvaluationResponseDetail = EvaluationResponseSummary & { output: string; labels: string[]; latencyMilliseconds?: number; inputTokens?: number; outputTokens?: number; costUsd?: number; judgments: Array<{ source: 'machine' | 'human'; criterion: string; score: number; note?: string }> };
export type EvaluationResults = {
  identitiesRevealed: boolean;
  candidateMatrix: Array<{ candidateId: string; candidateLabel: string; candidateCode: string; rubricScores: Record<string, number>; overall: number; responseCount: number }>;
  situationMatrix: Array<{ situationId: string; situationLabel: string; scores: Record<string, number> }>;
  distributions: Array<{ label: string; machineAverage: number; humanAverage?: number; agreement?: number }>;
  failureClusters: Array<{ label: string; count: number }>;
  operations: Array<{ candidateLabel: string; averageLatencyMilliseconds: number; totalCostUsd: number }>;
  responses: EvaluationResponseSummary[];
};
export type EvaluationExport = { id: string; format: 'json' | 'csv' | 'zip'; status: 'queued' | 'ready' | 'failed'; downloadUrl?: string };

export type CreateEvaluationSessionInput = { name: string; description?: string; sourceScenarioId?: string };
export type PatchEvaluationSessionInput = Partial<Pick<EvaluationSession, 'name' | 'description' | 'reviewPolicy' | 'rubric'>> & { revision: number };
export type AddFixedSituationInput = { corpusId: string; corpusVersion: string; caseIds: string[] };
export type AddQuotedSituationInput = { scenarioId: string; sessionId: string; turnId: string; stage: EvaluationStage; label: string };
export type AddCandidateInput = Omit<EvaluationCandidate, 'id'>;

export type EvaluationsApi = {
  listSessions(signal?: AbortSignal): Promise<EvaluationSessionSummary[]>;
  createSession(input: CreateEvaluationSessionInput): Promise<EvaluationSession>;
  getSession(id: string, signal?: AbortSignal): Promise<EvaluationSession>;
  patchSession(id: string, input: PatchEvaluationSessionInput): Promise<EvaluationSession>;
  listCorpora(signal?: AbortSignal): Promise<EvaluationCorpus[]>;
  getQuoteBrowser(signal?: AbortSignal): Promise<QuoteBrowser>;
  addFixedSituations(id: string, input: AddFixedSituationInput): Promise<EvaluationSession>;
  addQuotedSituation(id: string, input: AddQuotedSituationInput): Promise<EvaluationSession>;
  removeSituation(id: string, situationId: string): Promise<void>;
  addCandidate(id: string, input: AddCandidateInput): Promise<EvaluationSession>;
  start(id: string): Promise<EvaluationSession>;
  cancel(id: string): Promise<EvaluationExecution>;
  retryFailed(id: string): Promise<EvaluationExecution>;
  getExecution(id: string, signal?: AbortSignal): Promise<EvaluationExecution>;
  listReviewBatches(id: string, signal?: AbortSignal): Promise<EvaluationReviewBatch[]>;
  createReviewBatch(id: string, reviewerLabel: string): Promise<EvaluationReviewBatch>;
  closeReview(id: string): Promise<EvaluationSession>;
  revealIdentities(id: string): Promise<EvaluationSession>;
  getBlindAssignment(assignmentId: string, signal?: AbortSignal): Promise<BlindReviewAssignment>;
  saveBlindJudgment(assignmentId: string, itemId: string, input: BlindJudgmentInput): Promise<BlindReviewAssignment>;
  submitBlindJudgment(assignmentId: string, itemId: string, input: BlindJudgmentInput): Promise<BlindReviewAssignment>;
  getResults(id: string, signal?: AbortSignal): Promise<EvaluationResults>;
  getResponse(responseId: string, signal?: AbortSignal): Promise<EvaluationResponseDetail>;
  createExport(id: string, format: EvaluationExport['format']): Promise<EvaluationExport>;
  listExports(id: string, signal?: AbortSignal): Promise<EvaluationExport[]>;
};

export class EvaluationsApiError extends Error { constructor(message: string, public status: number, public errors?: Record<string, string[]>) { super(message); } }

async function parse<T>(response: Response): Promise<T> {
  if (response.ok) return response.status === 204 ? undefined as T : response.json() as Promise<T>;
  const body = await response.json().catch(() => ({})) as { message?: string; title?: string; errors?: Record<string, string[]> };
  throw new EvaluationsApiError(body.message ?? body.title ?? `Evaluation API error (${response.status})`, response.status, body.errors);
}
function key() { return globalThis.crypto?.randomUUID?.() ?? `eval-${Date.now()}-${Math.random()}`; }
function request(method: string, body?: unknown, signal?: AbortSignal): RequestInit {
  return { method, credentials: 'include', signal, headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'Idempotency-Key': key() }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) };
}

export function createFetchEvaluationsApi(baseUrl = '/api/evaluation-sessions'): EvaluationsApi {
  const encoded = (value: string) => encodeURIComponent(value);
  return {
    listSessions: (signal) => fetch(baseUrl, request('GET', undefined, signal)).then(parse<EvaluationSessionSummary[]>),
    createSession: (input) => fetch(baseUrl, request('POST', input)).then(parse<EvaluationSession>),
    getSession: (id, signal) => fetch(`${baseUrl}/${encoded(id)}`, request('GET', undefined, signal)).then(parse<EvaluationSession>),
    patchSession: (id, input) => fetch(`${baseUrl}/${encoded(id)}`, request('PATCH', input)).then(parse<EvaluationSession>),
    listCorpora: (signal) => fetch('/api/evaluation-corpora', request('GET', undefined, signal)).then(parse<EvaluationCorpus[]>),
    getQuoteBrowser: (signal) => fetch(`${baseUrl}/quote-sources`, request('GET', undefined, signal)).then(parse<QuoteBrowser>),
    addFixedSituations: (id, input) => fetch(`${baseUrl}/${encoded(id)}/situations/fixed`, request('POST', input)).then(parse<EvaluationSession>),
    addQuotedSituation: (id, input) => fetch(`${baseUrl}/${encoded(id)}/situations/quoted`, request('POST', input)).then(parse<EvaluationSession>),
    removeSituation: (id, situationId) => fetch(`${baseUrl}/${encoded(id)}/situations/${encoded(situationId)}`, request('DELETE')).then(parse<void>),
    addCandidate: (id, input) => fetch(`${baseUrl}/${encoded(id)}/candidates`, request('POST', input)).then(parse<EvaluationSession>),
    start: (id) => fetch(`${baseUrl}/${encoded(id)}:start`, request('POST', {})).then(parse<EvaluationSession>),
    cancel: (id) => fetch(`${baseUrl}/${encoded(id)}:cancel`, request('POST', {})).then(parse<EvaluationExecution>),
    retryFailed: (id) => fetch(`${baseUrl}/${encoded(id)}:retry-failed`, request('POST', {})).then(parse<EvaluationExecution>),
    getExecution: (id, signal) => fetch(`${baseUrl}/${encoded(id)}/execution`, request('GET', undefined, signal)).then(parse<EvaluationExecution>),
    listReviewBatches: (id, signal) => fetch(`${baseUrl}/${encoded(id)}/review-batches`, request('GET', undefined, signal)).then(parse<EvaluationReviewBatch[]>),
    createReviewBatch: (id, reviewerLabel) => fetch(`${baseUrl}/${encoded(id)}/review-batches`, request('POST', { reviewerLabel })).then(parse<EvaluationReviewBatch>),
    closeReview: (id) => fetch(`${baseUrl}/${encoded(id)}:close-review`, request('POST', {})).then(parse<EvaluationSession>),
    revealIdentities: (id) => fetch(`${baseUrl}/${encoded(id)}:reveal-identities`, request('POST', {})).then(parse<EvaluationSession>),
    getBlindAssignment: (assignmentId, signal) => fetch(`/api/evaluation-review-assignments/${encoded(assignmentId)}`, request('GET', undefined, signal)).then(parse<BlindReviewAssignment>),
    saveBlindJudgment: (assignmentId, itemId, input) => fetch(`/api/evaluation-review-assignments/${encoded(assignmentId)}/judgments/${encoded(itemId)}`, request('PUT', input)).then(parse<BlindReviewAssignment>),
    submitBlindJudgment: (assignmentId, itemId, input) => fetch(`/api/evaluation-review-assignments/${encoded(assignmentId)}/judgments/${encoded(itemId)}:submit`, request('POST', input)).then(parse<BlindReviewAssignment>),
    getResults: (id, signal) => fetch(`${baseUrl}/${encoded(id)}/results`, request('GET', undefined, signal)).then(parse<EvaluationResults>),
    getResponse: (responseId, signal) => fetch(`/api/evaluation-responses/${encoded(responseId)}`, request('GET', undefined, signal)).then(parse<EvaluationResponseDetail>),
    createExport: (id, format) => fetch(`${baseUrl}/${encoded(id)}/exports`, request('POST', { format })).then(parse<EvaluationExport>),
    listExports: (id, signal) => fetch(`${baseUrl}/${encoded(id)}/exports`, request('GET', undefined, signal)).then(parse<EvaluationExport[]>),
  };
}
