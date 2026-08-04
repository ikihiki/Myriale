import type { SessionApiResponse, SessionExecutionApiResponse } from './sessionPlayApi';

const at = '2026-07-21T12:00:00Z';
export const executionFixture = (status: SessionExecutionApiResponse['status'], kind: SessionExecutionApiResponse['kind'] = 'scenario-turn'): SessionExecutionApiResponse => ({
  id: `EXE-${kind}-${status}`, sessionId: 'SES-FIXTURE', kind, triggerType: kind === 'scenario-turn' ? 'player-input' : 'session-turn', triggerId: 'INP-1',
  status,
  stage: kind === 'scenario-turn' ? (status === 'succeeded' ? 'completed' : status === 'failed' ? 'generating-narrative' : 'selecting-action') : null,
  scenarioTurn: kind === 'scenario-turn' ? {
    schemaVersion: 'scenario-turn.v1',
    stage: status === 'succeeded' ? 'completed' : status === 'failed' ? 'generating-narrative' : 'selecting-action',
    currentLocation: { id: 'LOC-LIBRARY', code: 'library', name: '水没した書庫', description: '' },
    objects: [{ id: 'OBJ-DOOR', code: 'constellation-door', name: '星座の扉', locationId: 'LOC-LIBRARY', isGlobal: false, revision: 0, state: { open: false } }],
    availableActions: [{ objectId: 'OBJ-DOOR', actionId: 'unlock', code: 'unlock', label: '銀の鍵をかざす', description: '', argumentSchema: {}, enabled: true }],
    selectedAction: { objectId: 'OBJ-DOOR', actionId: 'unlock', objectCode: 'constellation-door', objectLabel: '星座の扉', actionCode: 'unlock', actionLabel: '銀の鍵をかざす', arguments: {} },
    postState: status === 'failed' || status === 'succeeded' ? {
      revision: 4,
      currentLocation: { id: 'LOC-LIBRARY', code: 'library', name: '水没した書庫', description: '' },
      objects: [{ id: 'OBJ-DOOR', code: 'constellation-door', name: '星座の扉', locationId: 'LOC-LIBRARY', isGlobal: false, revision: 1, state: { open: true } }],
      facts: ['星座の扉は開いている'], events: [], hints: [],
      appliedEffects: [{ type: 'set-state', targetId: 'OBJ-DOOR', path: 'state.open', value: true }],
    } : null,
  } : null,
  revision: 2, isRetryable: status === 'failed' || status === 'cancelled', attemptCount: status === 'retry-wait' ? 1 : 2, maxAttempts: 3,
  errorCode: status === 'failed' ? 'provider_timeout' : null, userErrorMessage: status === 'failed' ? 'AIサービスから時間内に応答がありませんでした。' : null,
  createdAt: at, startedAt: at, completedAt: ['failed', 'cancelled', 'succeeded', 'superseded'].includes(status) ? at : null,
  capabilities: { canRetry: status === 'failed' || status === 'cancelled', canCancel: ['queued', 'running', 'retry-wait', 'cancel-requested'].includes(status), canDismiss: ['failed', 'cancelled', 'succeeded', 'superseded'].includes(status) },
  developmentDiagnostics: { sessionId: 'SES-FIXTURE', triggerType: 'player-input', triggerId: 'INP-1', revision: 2, leaseOwner: status === 'running' ? 'worker-fixture' : null, leaseTokenHint: status === 'running' ? '…ABCD1234' : null, leaseExpiresAt: status === 'running' ? at : null, attempts: [{ id: 'ATT-1', attemptNumber: 1, status: status === 'retry-wait' ? 'failed' : status, workerId: 'worker-fixture', provider: 'mock', model: 'fixture-model', providerRequestId: 'resp-fixture', startedAt: at, completedAt: at, latencyMilliseconds: 123, inputTokens: 20, outputTokens: 42, finishReason: 'stop', errorCode: status === 'failed' ? 'provider_timeout' : null, errorCategory: status === 'failed' ? 'TimeoutException' : null, retryable: status === 'failed', correlationId: 'corr-1', traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', exceptionChain: status === 'failed' ? 'AiProviderException -> TimeoutException' : null, redactedResponseExcerpt: status === 'failed' ? 'Authorization=[REDACTED]' : null, sentPrompt: '{"messages":[{"role":"system","content":"Narrative rules"},{"role":"user","content":"銀の鍵を扉にかざす"}]}', receivedResult: '{"schemaVersion":"post-state-narrative.v1","turnType":"action-result","heading":"銀の鍵を掲げる","body":"鍵の光が石扉をなぞる。","signals":[],"interpretation":null}', validationResult: status === 'failed' ? '{"status":"failed","errorCode":"provider_timeout","reason":"AI Provider request timed out."}' : '{"status":"passed","checks":["dialogue-contract","progression-signals"]}', promptVersion: 'dialogue.v8', contextHash: 'abc123', contextSizeBytes: 2048 }] },
});

export const sessionActivityFixture = (status: SessionExecutionApiResponse['status'] = 'failed'): SessionApiResponse => {
  const scenarioTurnExecution = executionFixture(status);
  const imageExecution = executionFixture('failed', 'image');
  const noteExecution = executionFixture('succeeded', 'note-proposal');
  return {
    id: 'SES-FIXTURE', scenarioId: 'SCN-1', status: 'active', revision: 4, interpretationEnabled: false, pendingInputs: [], createdAt: at, updatedAt: at,
    inputs: [{ id: 'INP-1', requestId: 'req-1', text: '銀の鍵を扉にかざす', interactionType: 'dialogue', acceptedAfterTurnId: 'TRN-OPEN', acceptedSessionRevision: 1, createdAt: at }],
    executions: [scenarioTurnExecution, imageExecution, noteExecution],
    turns: [{ id: 'TRN-OPEN', position: 1, kind: 'narrative', narrative: { body: '水没した書庫で、銀の鍵が淡く光っている。', turnType: 'opening' }, createdAt: at }, { id: 'TRN-2', position: 2, previousTurnId: 'TRN-OPEN', kind: 'narrative', narrative: { body: '鍵の光が石扉の輪郭をなぞり、静かに道が開いた。', playerInputId: 'INP-1', turnType: 'action-result' }, createdAt: at }],
    artifacts: [{ id: 'ART-IMG', executionId: imageExecution.id, kind: 'image', status: 'committed', schema: 'image.v1', contentType: 'image/png', createdAt: at }, { id: 'ART-NOTE', executionId: noteExecution.id, kind: 'note-patch', status: 'committed', schema: 'note-patch.v1', contentType: 'application/json', createdAt: at }],
    noteProposals: [{ artifactId: 'ART-NOTE', sourceTurnId: 'TRN-2', expectedNoteRevision: 0, proposedTitle: '銀の鍵', beforeBody: '', proposedBody: '石扉を開くと淡く光る鍵。', rationale: 'Turn 2で扉を開いた事実に基づく。', status: 'pending', createdAt: at }],
    activity: [{ type: 'turn', id: 'TRN-OPEN', order: 1 }, { type: 'input', id: 'INP-1', order: 2 }, { type: 'execution', id: scenarioTurnExecution.id, order: 3, causalId: 'INP-1' }, { type: 'turn', id: 'TRN-2', order: 4, causalId: 'INP-1' }, { type: 'execution', id: imageExecution.id, order: 5, causalId: 'TRN-2' }, { type: 'artifact', id: 'ART-IMG', order: 6, causalId: imageExecution.id }, { type: 'execution', id: noteExecution.id, order: 7, causalId: 'TRN-2' }, { type: 'artifact', id: 'ART-NOTE', order: 8, causalId: noteExecution.id }],
  };
};
