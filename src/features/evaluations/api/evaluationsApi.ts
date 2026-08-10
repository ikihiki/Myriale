export type EvaluationStatus =
  | "draft"
  | "queued"
  | "running"
  | "review"
  | "completed"
  | "completedWithErrors"
  | "cancelled"
  | "archived";
export type EvaluationStage = "action" | "narrative" | "entityState";
export type EvaluationReviewPolicy = "none" | "single" | "double-blind";
export type EvaluationCommandResult<T = undefined> = {
  ok: boolean;
  message: string;
  value?: T;
};

export type EvaluationSessionSummary = {
  id: string;
  name: string;
  description?: string;
  status: EvaluationStatus;
  situationCount: number;
  candidateCount: number;
  completedResponseCount: number;
  plannedResponseCount: number;
  reviewProgress?: { completed: number; total: number };
  createdAt: string;
  updatedAt: string;
};
export type EvaluationSituation = {
  id: string;
  label: string;
  stage: EvaluationStage;
  source: "fixed" | "quoted";
  sourceLabel: string;
  snapshotHash: string;
  preview: string;
  createdAt: string;
};
export type EvaluationCandidate = {
  id: string;
  label: string;
  profileId: string;
  profileRevision: number;
  repetitions: number;
  generation: {
    temperature?: number;
    maxOutputTokens?: number;
    seed?: number;
    thinkingEnabled?: boolean;
  };
};
export type EvaluationRubricCriterion = {
  id: string;
  label: string;
  description: string;
  scaleMin: number;
  scaleMax: number;
  weight: number;
  required: boolean;
};
export type EvaluationSession = EvaluationSessionSummary & {
  situations: EvaluationSituation[];
  candidates: EvaluationCandidate[];
  rubric: EvaluationRubricCriterion[];
  reviewPolicy: EvaluationReviewPolicy;
  identitiesRevealed: boolean;
  revision: number;
};
export type EvaluationCorpus = {
  id: string;
  version: string;
  name: string;
  description: string;
  cases: Array<{
    id: string;
    label: string;
    stage: EvaluationStage;
    preview: string;
  }>;
};
export type QuoteBrowser = {
  scenarios: Array<{
    id: string;
    title: string;
    sessions: Array<{
      id: string;
      title: string;
      turns: Array<{
        id: string;
        index: number;
        stages: Array<{
          stage: EvaluationStage;
          label: string;
          preview: string;
          interactionId: string;
        }>;
      }>;
    }>;
  }>;
};
export type EvaluationExecution = {
  status: EvaluationStatus;
  planned: number;
  queued: number;
  running: number;
  succeeded: number;
  failed: number;
  cancelled: number;
  startedAt?: string;
  updatedAt: string;
  failures: Array<{
    attemptId: string;
    situationLabel: string;
    candidateLabel: string;
    error: string;
    retryable: boolean;
  }>;
};
export type EvaluationReviewBatch = {
  id: string;
  reviewerLabel: string;
  assignmentCount: number;
  completedCount: number;
  status: "open" | "completed" | "locked";
  assignments: Array<{
    opaqueCode: string;
    reviewerId: string;
    status: string;
    itemCount: number;
    judgedItemCount: number;
  }>;
};

// Deliberately opaque reviewer-only contract. Do not add provider/model/profile,
// machine judgment/score, cost, latency, token, request, or telemetry fields here.
export type BlindReviewItem = {
  itemId: string;
  situationLabel: string;
  situationContext: string;
  candidateCode: string;
  responseText: string;
  rubric: Array<{
    criterionId: string;
    label: string;
    description: string;
    scaleMin: number;
    scaleMax: number;
    required: boolean;
  }>;
  draft?: { scores: Record<string, number>; note: string };
};
export type BlindReviewAssignment = {
  assignmentId: string;
  evaluationLabel: string;
  status: "open" | "submitted" | "locked";
  currentIndex: number;
  total: number;
  item: BlindReviewItem | null;
};
export type BlindJudgmentInput = {
  scores: Record<string, number>;
  note: string;
};

export type EvaluationResponseSummary = {
  id: string;
  situationLabel: string;
  candidateLabel: string;
  candidateCode: string;
  status: "succeeded" | "failed";
  machineScore?: number;
  humanScore?: number;
};
export type EvaluationResponseDetail = EvaluationResponseSummary & {
  output: string;
  labels: string[];
  latencyMilliseconds?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  judgments: Array<{
    source: "machine" | "human";
    criterion: string;
    score: number;
    note?: string;
  }>;
};
export type EvaluationResults = {
  identitiesRevealed: boolean;
  candidateMatrix: Array<{
    candidateId: string;
    candidateLabel: string;
    candidateCode: string;
    rubricScores: Record<string, number>;
    overall: number;
    responseCount: number;
  }>;
  situationMatrix: Array<{
    situationId: string;
    situationLabel: string;
    scores: Record<string, number>;
  }>;
  distributions: Array<{
    label: string;
    machineAverage: number;
    humanAverage?: number;
    agreement?: number;
  }>;
  failureClusters: Array<{ label: string; count: number }>;
  operations: Array<{
    candidateLabel: string;
    averageLatencyMilliseconds: number;
    totalCostUsd: number;
  }>;
  responses: EvaluationResponseSummary[];
};
export type EvaluationExport = {
  id: string;
  format: "json" | "csv";
  status: "ready";
  downloadUrl: string;
};

export type CreateEvaluationSessionInput = {
  name: string;
  description?: string;
  sourceScenarioId?: string;
};
export type PatchEvaluationSessionInput = Partial<
  Pick<EvaluationSession, "name" | "description" | "reviewPolicy" | "rubric">
> & { revision: number };
export type AddFixedSituationInput = {
  corpusId: string;
  corpusVersion: string;
  caseIds: string[];
};
export type AddQuotedSituationInput = {
  scenarioId: string;
  sessionId: string;
  turnId: string;
  interactionId: string;
  stage: EvaluationStage;
  label: string;
};
export type AddCandidateInput = Omit<EvaluationCandidate, "id">;

export type EvaluationsApi = {
  listSessions(signal?: AbortSignal): Promise<EvaluationSessionSummary[]>;
  createSession(
    input: CreateEvaluationSessionInput,
  ): Promise<EvaluationSession>;
  getSession(id: string, signal?: AbortSignal): Promise<EvaluationSession>;
  patchSession(
    id: string,
    input: PatchEvaluationSessionInput,
  ): Promise<EvaluationSession>;
  listCorpora(signal?: AbortSignal): Promise<EvaluationCorpus[]>;
  getQuoteBrowser(signal?: AbortSignal): Promise<QuoteBrowser>;
  addFixedSituations(
    id: string,
    input: AddFixedSituationInput,
  ): Promise<EvaluationSession>;
  addQuotedSituation(
    id: string,
    input: AddQuotedSituationInput,
  ): Promise<EvaluationSession>;
  removeSituation(id: string, situationId: string): Promise<void>;
  addCandidate(
    id: string,
    input: AddCandidateInput,
  ): Promise<EvaluationSession>;
  start(id: string): Promise<EvaluationSession>;
  cancel(id: string): Promise<EvaluationExecution>;
  retryFailed(id: string): Promise<EvaluationExecution>;
  getExecution(id: string, signal?: AbortSignal): Promise<EvaluationExecution>;
  listReviewBatches(
    id: string,
    signal?: AbortSignal,
  ): Promise<EvaluationReviewBatch[]>;
  createReviewBatch(
    id: string,
    reviewerIds: string[],
  ): Promise<EvaluationReviewBatch>;
  closeReview(id: string): Promise<EvaluationSession>;
  revealIdentities(id: string): Promise<EvaluationSession>;
  getBlindAssignment(
    assignmentId: string,
    signal?: AbortSignal,
  ): Promise<BlindReviewAssignment>;
  saveBlindJudgment(
    assignmentId: string,
    itemId: string,
    input: BlindJudgmentInput,
  ): Promise<BlindReviewAssignment>;
  submitBlindJudgment(
    assignmentId: string,
    itemId: string,
    input: BlindJudgmentInput,
  ): Promise<BlindReviewAssignment>;
  getResults(id: string, signal?: AbortSignal): Promise<EvaluationResults>;
  getResponse(
    responseId: string,
    signal?: AbortSignal,
  ): Promise<EvaluationResponseDetail>;
  createExport(
    id: string,
    format: EvaluationExport["format"],
  ): Promise<EvaluationExport>;
};

export class EvaluationsApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

type BackendSummary = {
  id: string;
  title: string;
  purpose: string;
  status: string;
  revision: number;
  situationCount: number;
  candidateCount: number;
  plannedAttemptCount: number;
  terminalAttemptCount: number;
  succeededAttemptCount: number;
  failedAttemptCount: number;
  reviewedItemCount: number;
  identitiesRevealed: boolean;
  createdAt: string;
  completedAt?: string;
};
type BackendSituation = {
  id: string;
  stableKey: string;
  stage: EvaluationStage;
  sourceKind: string;
  request: unknown;
  requestHash: string;
  citation: Record<string, unknown>;
};
type BackendCandidate = {
  id: string;
  candidateKey: string;
  blindCode: string;
  profileId: string;
  profileRevision: number;
  repetitions: number;
};
type BackendSession = {
  summary: BackendSummary;
  rubric: unknown;
  reviewPolicy: unknown;
  situations: BackendSituation[];
  candidates: BackendCandidate[];
};
type BackendAttempt = {
  id: string;
  situationId: string;
  candidateId: string;
  status: string;
  errorCode?: string;
  startedAt?: string;
  completedAt?: string;
  invocations: Array<{
    id: string;
    number: number;
    status: string;
    errorCode?: string;
    startedAt: string;
    completedAt?: string;
  }>;
};
type BackendExecution = { session: BackendSummary; attempts: BackendAttempt[] };
type BackendJudgment = {
  attemptId: string;
  invocationId: string;
  criterionKey: string;
  passed: boolean;
  score?: number;
  labels: string[];
  rationale: string;
};
type BackendResults = {
  status: string;
  candidates: Array<{
    candidateId: string;
    candidateKey: string;
    displayIdentity: string;
    attemptCount: number;
    succeededCount: number;
    passedCount: number;
    passRate: number;
    latencyMilliseconds?: number;
  }>;
  machineJudgments: BackendJudgment[];
  humanJudgmentCount: number;
};
type BackendBlindJudgment = {
  criterionKey: string;
  score?: number;
  comment: string;
  revision: number;
};
type BackendBlindItem = {
  id: string;
  candidateCode: string;
  stage: EvaluationStage;
  situation: unknown;
  response: unknown;
  displayOrder: number;
  judgments: BackendBlindJudgment[];
};
type BackendBlindAssignment = {
  opaqueCode: string;
  status: string;
  revision: number;
  rubric: unknown;
  items: BackendBlindItem[];
};
type BackendRawInvocation = {
  id: string;
  situationLabel: string;
  candidateLabel: string;
  candidateCode: string;
  status: string;
  parsedOutput?: unknown;
  rawResponse?: string;
  rawError?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMilliseconds?: number;
};
type BackendReviewBatch = {
  id: string;
  status: string;
  assignments: Array<{
    opaqueCode: string;
    reviewerId: string;
    status: string;
    itemCount: number;
    judgedItemCount: number;
  }>;
};

async function parse<T>(response: Response): Promise<T> {
  if (response.ok)
    return response.status === 204
      ? (undefined as T)
      : (response.json() as Promise<T>);
  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
    title?: string;
    error?: string;
    code?: string;
    errors?: Record<string, string[]>;
  };
  throw new EvaluationsApiError(
    body.message ??
      body.error ??
      body.title ??
      `Evaluation API error (${response.status})`,
    response.status,
    body.errors,
  );
}
function key() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `eval-${Date.now()}-${Math.random()}`
  );
}
function request(
  method: string,
  body?: unknown,
  signal?: AbortSignal,
): RequestInit {
  return {
    method,
    credentials: "include",
    signal,
    headers: {
      Accept: "application/json",
      ...(body === undefined
        ? {}
        : { "Content-Type": "application/json", "Idempotency-Key": key() }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}
function preview(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}
function status(value: string): EvaluationStatus {
  switch (value) {
    case "awaitingHumanReview":
    case "aggregating":
      return "review";
    case "cancelRequested":
      return "running";
    case "failed":
      return "completedWithErrors";
    case "draft":
    case "queued":
    case "running":
    case "completed":
    case "completedWithErrors":
    case "cancelled":
    case "archived":
      return value;
    default:
      return "draft";
  }
}
function rubric(value: unknown): EvaluationRubricCriterion[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === "object" &&
        value &&
        Array.isArray((value as { criteria?: unknown[] }).criteria)
      ? (value as { criteria: unknown[] }).criteria
      : [];
  return source.map((item, index) => {
    if (typeof item === "string")
      return {
        id: item,
        label: item,
        description: "",
        scaleMin: 1,
        scaleMax: 5,
        weight: 1,
        required: true,
      };
    const row = item as Partial<EvaluationRubricCriterion> & {
      criterionKey?: string;
    };
    const id = row.id ?? row.criterionKey ?? `criterion-${index + 1}`;
    return {
      id,
      label: row.label ?? id,
      description: row.description ?? "",
      scaleMin: row.scaleMin ?? 1,
      scaleMax: row.scaleMax ?? 5,
      weight: row.weight ?? 1,
      required: row.required ?? true,
    };
  });
}
function reviewPolicy(value: unknown): EvaluationReviewPolicy {
  if (
    typeof value === "string" &&
    (value === "none" || value === "single" || value === "double-blind")
  )
    return value;
  if (typeof value === "object" && value) {
    const mode =
      (value as { mode?: string; type?: string }).mode ??
      (value as { type?: string }).type;
    if (mode === "none" || mode === "single" || mode === "double-blind")
      return mode;
  }
  return "double-blind";
}
function mapSummary(value: BackendSummary): EvaluationSessionSummary {
  return {
    id: value.id,
    name: value.title,
    description: value.purpose || undefined,
    status: status(value.status),
    situationCount: value.situationCount,
    candidateCount: value.candidateCount,
    completedResponseCount: value.terminalAttemptCount,
    plannedResponseCount: value.plannedAttemptCount,
    reviewProgress:
      value.reviewedItemCount || value.status === "awaitingHumanReview"
        ? {
            completed: value.reviewedItemCount,
            total: value.succeededAttemptCount,
          }
        : undefined,
    createdAt: value.createdAt,
    updatedAt: value.completedAt ?? value.createdAt,
  };
}
function mapSession(value: BackendSession): EvaluationSession {
  const summary = mapSummary(value.summary);
  return {
    ...summary,
    situations: value.situations.map((item) => ({
      id: item.id,
      label: item.stableKey,
      stage: item.stage,
      source: item.sourceKind === "sessionQuote" ? "quoted" : "fixed",
      sourceLabel:
        item.sourceKind === "corpus"
          ? String(item.citation?.corpusKey ?? "Corpus")
          : item.sourceKind === "sessionQuote"
            ? "Session quote"
            : "Fixture",
      snapshotHash: item.requestHash,
      preview: preview(item.request),
      createdAt: value.summary.createdAt,
    })),
    candidates: value.candidates.map((item) => ({
      id: item.id,
      label: item.candidateKey,
      profileId: item.profileId,
      profileRevision: item.profileRevision,
      repetitions: item.repetitions,
      generation: {},
    })),
    rubric: rubric(value.rubric),
    reviewPolicy: reviewPolicy(value.reviewPolicy),
    identitiesRevealed: value.summary.identitiesRevealed,
    revision: value.summary.revision,
  };
}
function mapExecution(
  value: BackendExecution,
  session: EvaluationSession,
): EvaluationExecution {
  const situation = new Map(session.situations.map((x) => [x.id, x.label]));
  const candidate = new Map(session.candidates.map((x) => [x.id, x.label]));
  const count = (states: string[]) =>
    value.attempts.filter((x) => states.includes(x.status)).length;
  return {
    status: status(value.session.status),
    planned: value.session.plannedAttemptCount,
    queued: count(["queued", "retryWait"]),
    running: count(["running"]),
    succeeded: count(["succeeded"]),
    failed: count(["failed"]),
    cancelled: count(["cancelled", "skipped"]),
    startedAt: value.attempts
      .map((x) => x.startedAt)
      .filter(Boolean)
      .sort()[0],
    updatedAt:
      value.attempts
        .map((x) => x.completedAt ?? x.startedAt)
        .filter(Boolean)
        .sort()
        .at(-1) ?? value.session.createdAt,
    failures: value.attempts
      .filter((x) => x.status === "failed")
      .map((x) => ({
        attemptId: x.id,
        situationLabel: situation.get(x.situationId) ?? x.situationId,
        candidateLabel: candidate.get(x.candidateId) ?? x.candidateId,
        error: x.errorCode ?? "evaluation_failed",
        retryable: false,
      })),
  };
}
function blindAssignment(value: BackendBlindAssignment): BlindReviewAssignment {
  const criteria = rubric(value.rubric);
  const ordered = [...value.items].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  const complete = (item: BackendBlindItem) =>
    criteria.every(
      (criterion) =>
        !criterion.required ||
        item.judgments.some((x) => x.criterionKey === criterion.id),
    );
  const index = ordered.findIndex((item) => !complete(item));
  const currentIndex = index < 0 ? ordered.length : index;
  const current = index < 0 ? null : ordered[index];
  const latest = new Map<string, BackendBlindJudgment>();
  current?.judgments.forEach((x) => latest.set(x.criterionKey, x));
  const item = current
    ? {
        itemId: current.id,
        situationLabel: `${current.stage} situation`,
        situationContext: preview(current.situation),
        candidateCode: current.candidateCode,
        responseText: preview(current.response),
        rubric: criteria.map((x) => ({
          criterionId: x.id,
          label: x.label,
          description: x.description,
          scaleMin: x.scaleMin,
          scaleMax: x.scaleMax,
          required: x.required,
        })),
        draft: {
          scores: Object.fromEntries(
            [...latest]
              .filter(([, x]) => x.score !== undefined)
              .map(([criterion, x]) => [criterion, x.score!]),
          ),
          note: [...latest.values()].at(-1)?.comment ?? "",
        },
      }
    : null;
  return {
    assignmentId: value.opaqueCode,
    evaluationLabel: "Blind evaluation review",
    status:
      value.status === "locked"
        ? "locked"
        : value.status === "submitted"
          ? "submitted"
          : "open",
    currentIndex,
    total: ordered.length,
    item,
  };
}

export function createFetchEvaluationsApi(
  baseUrl = "/api/evaluation-sessions",
): EvaluationsApi {
  const encoded = (value: string) => encodeURIComponent(value);
  const rawSession = (id: string, signal?: AbortSignal) =>
    fetch(`${baseUrl}/${encoded(id)}`, request("GET", undefined, signal)).then(
      parse<BackendSession>,
    );
  const rawExecution = (id: string, signal?: AbortSignal) =>
    fetch(
      `${baseUrl}/${encoded(id)}/execution`,
      request("GET", undefined, signal),
    ).then(parse<BackendExecution>);
  const rawBlind = (id: string, signal?: AbortSignal) =>
    fetch(
      `/api/evaluation-review-assignments/${encoded(id)}`,
      request("GET", undefined, signal),
    ).then(parse<BackendBlindAssignment>);
  const saveBlind = async (
    assignmentId: string,
    itemId: string,
    input: BlindJudgmentInput,
  ) => {
    let assignment = await rawBlind(assignmentId);
    let revision = assignment.revision;
    for (const [criterionKey, score] of Object.entries(input.scores)) {
      await fetch(
        `/api/evaluation-review-assignments/${encoded(assignmentId)}/judgments/${encoded(itemId)}`,
        request("PUT", {
          assignmentRevision: revision,
          criterionKey,
          score,
          verdict: null,
          tags: [],
          comment: input.note,
          confidence: null,
        }),
      ).then(parse<unknown>);
      revision += 1;
    }
    assignment = await rawBlind(assignmentId);
    return assignment;
  };
  const api: EvaluationsApi = {
    listSessions: (signal) =>
      fetch(baseUrl, request("GET", undefined, signal))
        .then(parse<BackendSummary[]>)
        .then((x) => x.map(mapSummary)),
    createSession: (input) =>
      fetch(
        baseUrl,
        request("POST", {
          title: input.name,
          purpose: input.description ?? "",
          tags: input.sourceScenarioId
            ? [`scenario:${input.sourceScenarioId}`]
            : [],
          sensitivity: "internal",
          retentionPolicy: "standard",
          config: {},
          rubric: [],
          reviewPolicy: { mode: "double-blind" },
          idempotencyKey: key(),
        }),
      )
        .then(parse<BackendSession>)
        .then(mapSession),
    getSession: (id, signal) => rawSession(id, signal).then(mapSession),
    patchSession: (id, input) =>
      fetch(
        `${baseUrl}/${encoded(id)}`,
        request("PATCH", {
          revision: input.revision,
          ...(input.name === undefined ? {} : { title: input.name }),
          ...(input.description === undefined
            ? {}
            : { purpose: input.description }),
          ...(input.rubric === undefined ? {} : { rubric: input.rubric }),
          ...(input.reviewPolicy === undefined
            ? {}
            : { reviewPolicy: { mode: input.reviewPolicy } }),
        }),
      )
        .then(parse<BackendSession>)
        .then(mapSession),
    listCorpora: (signal) =>
      fetch("/api/evaluation-corpora", request("GET", undefined, signal))
        .then(
          parse<
            Array<{
              corpusId: string;
              version: string;
              description: string;
              cases: Array<{
                caseId: string;
                stage: EvaluationStage;
                request: unknown;
              }>;
            }>
          >,
        )
        .then((items) =>
          items.map((item) => ({
            id: item.corpusId,
            version: item.version,
            name: item.corpusId,
            description: item.description,
            cases: item.cases.map((c) => ({
              id: c.caseId,
              label: c.caseId,
              stage: c.stage,
              preview: preview(c.request),
            })),
          })),
        ),
    getQuoteBrowser: (signal) =>
      fetch(`${baseUrl}/quote-sources`, request("GET", undefined, signal)).then(
        parse<QuoteBrowser>,
      ),
    addFixedSituations: async (id, input) => {
      const corpora = await fetch(
        "/api/evaluation-corpora",
        request("GET"),
      ).then(
        parse<
          Array<{
            corpusId: string;
            version: string;
            cases: Array<{
              caseId: string;
              stage: EvaluationStage;
              request: unknown;
              expectations: unknown;
            }>;
          }>
        >,
      );
      const corpus = corpora.find(
        (x) =>
          x.corpusId === input.corpusId && x.version === input.corpusVersion,
      );
      if (!corpus)
        throw new EvaluationsApiError(
          "Evaluation corpus version was not found.",
          404,
        );
      for (const caseId of input.caseIds) {
        const item = corpus.cases.find((x) => x.caseId === caseId);
        if (!item)
          throw new EvaluationsApiError(
            `Evaluation corpus case ${caseId} was not found.`,
            404,
          );
        await fetch(
          `${baseUrl}/${encoded(id)}/situations/fixed`,
          request("POST", {
            stableKey: item.caseId,
            stage: item.stage,
            request: item.request,
            expectations: item.expectations,
            corpusKey: corpus.corpusId,
            corpusVersion: corpus.version,
            corpusCaseKey: item.caseId,
            sensitivity: "internal",
          }),
        ).then(parse<unknown>);
      }
      return api.getSession(id);
    },
    addQuotedSituation: async (id, input) => {
      await fetch(
        `${baseUrl}/${encoded(id)}/situations/quoted`,
        request("POST", {
          stableKey: input.label,
          stage: input.stage,
          sessionId: input.sessionId,
          turnId: input.turnId,
          interactionId: input.interactionId,
          expectations: {},
          sensitivity: "internal",
        }),
      ).then(parse<unknown>);
      return api.getSession(id);
    },
    removeSituation: (id, situationId) =>
      fetch(
        `${baseUrl}/${encoded(id)}/situations/${encoded(situationId)}`,
        request("DELETE"),
      ).then(parse<void>),
    addCandidate: async (id, input) => {
      await fetch(
        `${baseUrl}/${encoded(id)}/candidates`,
        request("POST", {
          candidateKey: input.label,
          profileId: input.profileId,
          repetitions: input.repetitions,
          generationOverrides: input.generation,
          maxInvocations: 2,
        }),
      ).then(parse<unknown>);
      return api.getSession(id);
    },
    start: async (id) => {
      await fetch(`${baseUrl}/${encoded(id)}:start`, request("POST")).then(
        parse<unknown>,
      );
      return api.getSession(id);
    },
    cancel: async (id) => {
      await fetch(`${baseUrl}/${encoded(id)}:cancel`, request("POST")).then(
        parse<void>,
      );
      return api.getExecution(id);
    },
    retryFailed: async (id) => {
      await fetch(
        `${baseUrl}/${encoded(id)}:retry-failed`,
        request("POST"),
      ).then(parse<unknown>);
      return api.getExecution(id);
    },
    getExecution: async (id, signal) => {
      const [execution, session] = await Promise.all([
        rawExecution(id, signal),
        rawSession(id, signal),
      ]);
      return mapExecution(execution, mapSession(session));
    },
    listReviewBatches: (id, signal) =>
      fetch(
        `${baseUrl}/${encoded(id)}/review-batches`,
        request("GET", undefined, signal),
      )
        .then(parse<BackendReviewBatch[]>)
        .then((items) =>
          items.map((item) => ({
            id: item.id,
            reviewerLabel: item.assignments.map((x) => x.reviewerId).join(", "),
            assignmentCount: item.assignments.reduce(
              (sum, x) => sum + x.itemCount,
              0,
            ),
            completedCount: item.assignments.reduce(
              (sum, x) => sum + x.judgedItemCount,
              0,
            ),
            status:
              item.status === "closed"
                ? "locked"
                : item.assignments.every((x) => x.status !== "draft")
                  ? "completed"
                  : "open",
            assignments: item.assignments,
          })),
        ),
    createReviewBatch: async (id, reviewerIds) => {
      const created = await fetch(
        `${baseUrl}/${encoded(id)}/review-batches`,
        request("POST", {
          reviewerIds,
          requiredReviewsPerOutput: 1,
          rubricVersion: "1",
          deadline: null,
        }),
      ).then(parse<{ id: string }>);
      const batches = await api.listReviewBatches(id);
      return batches.find((x) => x.id === created.id) ?? batches[0];
    },
    closeReview: async (id) => {
      await fetch(
        `${baseUrl}/${encoded(id)}:close-review`,
        request("POST"),
      ).then(parse<void>);
      return api.getSession(id);
    },
    revealIdentities: async (id) => {
      await fetch(
        `${baseUrl}/${encoded(id)}:reveal-identities`,
        request("POST"),
      ).then(parse<void>);
      return api.getSession(id);
    },
    getBlindAssignment: (assignmentId, signal) =>
      rawBlind(assignmentId, signal).then(blindAssignment),
    saveBlindJudgment: async (assignmentId, itemId, input) =>
      blindAssignment(await saveBlind(assignmentId, itemId, input)),
    submitBlindJudgment: async (assignmentId, itemId, input) => {
      let assignment = await saveBlind(assignmentId, itemId, input);
      const mapped = blindAssignment(assignment);
      if (!mapped.item) {
        await fetch(
          `/api/evaluation-review-assignments/${encoded(assignmentId)}:submit?revision=${assignment.revision}`,
          request("POST"),
        ).then(parse<void>);
        assignment = await rawBlind(assignmentId);
      }
      return blindAssignment(assignment);
    },
    getResults: async (id, signal) => {
      const [result, execution, sessionRaw] = await Promise.all([
        fetch(
          `${baseUrl}/${encoded(id)}/results`,
          request("GET", undefined, signal),
        ).then(parse<BackendResults>),
        rawExecution(id, signal),
        rawSession(id, signal),
      ]);
      const session = mapSession(sessionRaw);
      const attempts = new Map(execution.attempts.map((x) => [x.id, x]));
      const situations = new Map(session.situations.map((x) => [x.id, x]));
      const candidates = new Map(session.candidates.map((x) => [x.id, x]));
      const judgmentsByAttempt = new Map<string, BackendJudgment[]>();
      result.machineJudgments.forEach((x) =>
        judgmentsByAttempt.set(x.attemptId, [
          ...(judgmentsByAttempt.get(x.attemptId) ?? []),
          x,
        ]),
      );
      const candidateMatrix = result.candidates.map((row) => {
        const candidateAttempts = execution.attempts.filter(
          (x) => x.candidateId === row.candidateId,
        );
        const js = candidateAttempts.flatMap(
          (x) => judgmentsByAttempt.get(x.id) ?? [],
        );
        const byCriterion: Record<string, number> = {};
        [...new Set(js.map((x) => x.criterionKey))].forEach((criterion) => {
          const values = js
            .filter((x) => x.criterionKey === criterion)
            .map((x) => x.score ?? (x.passed ? 1 : 0));
          byCriterion[criterion] =
            values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
        });
        const candidate = candidates.get(row.candidateId);
        return {
          candidateId: row.candidateId,
          candidateLabel: candidate?.label ?? row.candidateKey,
          candidateCode:
            candidateRawCode(sessionRaw, row.candidateId) ??
            row.displayIdentity,
          rubricScores: byCriterion,
          overall: row.passRate,
          responseCount: row.attemptCount,
        };
      });
      const responses: EvaluationResponseSummary[] = execution.attempts.flatMap(
        (attempt) => {
          const candidate = candidates.get(attempt.candidateId);
          const invocation = [...attempt.invocations].sort(
            (a, b) => b.number - a.number,
          )[0];
          if (!invocation) return [];
          const js = judgmentsByAttempt.get(attempt.id) ?? [];
          return [
            {
              id: invocation.id,
              situationLabel:
                situations.get(attempt.situationId)?.label ??
                attempt.situationId,
              candidateLabel: candidate?.label ?? attempt.candidateId,
              candidateCode:
                candidateRawCode(sessionRaw, attempt.candidateId) ??
                attempt.candidateId,
              status: attempt.status === "succeeded" ? "succeeded" : "failed",
              ...(js.length
                ? {
                    machineScore:
                      js.reduce(
                        (sum, x) => sum + (x.score ?? (x.passed ? 1 : 0)),
                        0,
                      ) / js.length,
                  }
                : {}),
            },
          ];
        },
      );
      const situationMatrix = session.situations.map((situation) => ({
        situationId: situation.id,
        situationLabel: situation.label,
        scores: Object.fromEntries(
          session.candidates.map((candidate) => {
            const js = execution.attempts
              .filter(
                (x) =>
                  x.situationId === situation.id &&
                  x.candidateId === candidate.id,
              )
              .flatMap((x) => judgmentsByAttempt.get(x.id) ?? []);
            return [
              candidate.label,
              js.length ? js.filter((x) => x.passed).length / js.length : 0,
            ];
          }),
        ),
      }));
      const failureCounts = new Map<string, number>();
      execution.attempts
        .filter((x) => x.status === "failed")
        .forEach((x) =>
          failureCounts.set(
            x.errorCode ?? "evaluation_failed",
            (failureCounts.get(x.errorCode ?? "evaluation_failed") ?? 0) + 1,
          ),
        );
      return {
        identitiesRevealed: session.identitiesRevealed,
        candidateMatrix,
        situationMatrix,
        distributions: candidateMatrix.map((x) => ({
          label: x.candidateLabel,
          machineAverage: x.overall,
        })),
        failureClusters: [...failureCounts].map(([label, count]) => ({
          label,
          count,
        })),
        operations: result.candidates.map((x) => ({
          candidateLabel:
            candidates.get(x.candidateId)?.label ?? x.candidateKey,
          averageLatencyMilliseconds: Math.round(
            (x.latencyMilliseconds ?? 0) / Math.max(1, x.attemptCount),
          ),
          totalCostUsd: 0,
        })),
        responses,
      };
    },
    getResponse: (responseId, signal) =>
      fetch(
        `/api/evaluation-responses/${encoded(responseId)}`,
        request("GET", undefined, signal),
      )
        .then(parse<BackendRawInvocation>)
        .then((x) => ({
          id: x.id,
          situationLabel: x.situationLabel,
          candidateLabel: x.candidateLabel,
          candidateCode: x.candidateCode,
          status: x.status === "succeeded" ? "succeeded" : "failed",
          output:
            x.parsedOutput !== undefined
              ? JSON.stringify(x.parsedOutput, null, 2)
              : (x.rawResponse ?? x.rawError ?? ""),
          labels: [],
          latencyMilliseconds: x.latencyMilliseconds,
          inputTokens: x.inputTokens,
          outputTokens: x.outputTokens,
          judgments: [],
        })),
    createExport: async (id, format) => {
      const response = await fetch(
        `${baseUrl}/${encoded(id)}/exports?format=${format}&redacted=true`,
        {
          credentials: "include",
          headers: {
            Accept: format === "json" ? "application/json" : "text/csv",
          },
        },
      );
      if (!response.ok) await parse<never>(response);
      const blob = await response.blob();
      return {
        id: `${id}-${format}-${Date.now()}`,
        format,
        status: "ready",
        downloadUrl: URL.createObjectURL(blob),
      };
    },
  };
  return api;
}
function candidateRawCode(
  session: BackendSession,
  candidateId: string,
): string | undefined {
  return session.candidates.find((x) => x.id === candidateId)?.blindCode;
}
