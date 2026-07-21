import type { SessionApiResponse, SessionExecutionApiResponse } from './sessionPlayApi';

const at = '2026-07-21T12:00:00Z';
export const executionFixture = (status: SessionExecutionApiResponse['status'], kind: SessionExecutionApiResponse['kind'] = 'narrative'): SessionExecutionApiResponse => ({
  id: `EXE-${kind}-${status}`, sessionId: 'SES-FIXTURE', kind, triggerType: kind === 'narrative' ? 'player-input' : 'session-turn', triggerId: 'INP-1',
  status, revision: 2, isRetryable: status === 'failed' || status === 'cancelled', attemptCount: status === 'retry-wait' ? 1 : 2, maxAttempts: 3,
  errorCode: status === 'failed' ? 'provider_timeout' : null, userErrorMessage: status === 'failed' ? 'AIサービスから時間内に応答がありませんでした。' : null,
  createdAt: at, startedAt: at, completedAt: ['failed', 'cancelled', 'succeeded', 'superseded'].includes(status) ? at : null,
  capabilities: { canRetry: status === 'failed' || status === 'cancelled', canCancel: ['queued', 'running', 'retry-wait', 'cancel-requested'].includes(status), canDismiss: ['failed', 'cancelled', 'succeeded', 'superseded'].includes(status) },
  developmentDiagnostics: { sessionId: 'SES-FIXTURE', triggerType: 'player-input', triggerId: 'INP-1', revision: 2, leaseOwner: status === 'running' ? 'worker-fixture' : null, leaseTokenHint: status === 'running' ? '…ABCD1234' : null, leaseExpiresAt: status === 'running' ? at : null, attempts: [{ id: 'ATT-1', attemptNumber: 1, status: status === 'retry-wait' ? 'failed' : status, workerId: 'worker-fixture', provider: 'mock', model: 'fixture-model', providerRequestId: 'resp-fixture', startedAt: at, completedAt: at, latencyMilliseconds: 123, inputTokens: 20, outputTokens: 42, finishReason: 'stop', errorCode: status === 'failed' ? 'provider_timeout' : null, errorCategory: status === 'failed' ? 'TimeoutException' : null, retryable: status === 'failed', correlationId: 'corr-1', traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', exceptionChain: status === 'failed' ? 'AiProviderException -> TimeoutException' : null, redactedResponseExcerpt: status === 'failed' ? 'Authorization=[REDACTED]' : null, promptVersion: 'dialogue.v8', contextHash: 'abc123', contextSizeBytes: 2048 }] },
});

export const sessionActivityFixture = (status: SessionExecutionApiResponse['status'] = 'failed'): SessionApiResponse => {
  const narrativeExecution = executionFixture(status);
  const imageExecution = executionFixture('failed', 'image');
  const noteExecution = executionFixture('succeeded', 'note-proposal');
  return {
    id: 'SES-FIXTURE', scenarioId: 'SCN-1', status: 'active', revision: 4, interpretationEnabled: false, pendingInputs: [], createdAt: at, updatedAt: at,
    inputs: [{ id: 'INP-1', requestId: 'req-1', text: '銀の鍵を扉にかざす', interactionType: 'dialogue', acceptedAfterTurnId: 'TRN-OPEN', acceptedSessionRevision: 1, createdAt: at }],
    executions: [narrativeExecution, imageExecution, noteExecution],
    turns: [{ id: 'TRN-OPEN', position: 1, kind: 'narrative', narrative: { body: '水没した書庫で、銀の鍵が淡く光っている。', turnType: 'opening' }, createdAt: at }, { id: 'TRN-2', position: 2, previousTurnId: 'TRN-OPEN', kind: 'narrative', narrative: { body: '鍵の光が石扉の輪郭をなぞり、静かに道が開いた。', playerInputId: 'INP-1', turnType: 'action-result' }, createdAt: at }],
    artifacts: [{ id: 'ART-IMG', executionId: imageExecution.id, kind: 'image', status: 'committed', contentType: 'image/png', createdAt: at }, { id: 'ART-NOTE', executionId: noteExecution.id, kind: 'note-patch', status: 'committed', contentType: 'application/json', createdAt: at }],
    noteProposals: [{ artifactId: 'ART-NOTE', sourceTurnId: 'TRN-2', expectedNoteRevision: 0, proposedTitle: '銀の鍵', beforeBody: '', proposedBody: '石扉を開くと淡く光る鍵。', rationale: 'Turn 2で扉を開いた事実に基づく。', status: 'pending', createdAt: at }],
    activity: [{ type: 'turn', id: 'TRN-OPEN', order: 1 }, { type: 'input', id: 'INP-1', order: 2 }, { type: 'execution', id: narrativeExecution.id, order: 3, causalId: 'INP-1' }, { type: 'turn', id: 'TRN-2', order: 4, causalId: 'INP-1' }, { type: 'execution', id: imageExecution.id, order: 5, causalId: 'TRN-2' }, { type: 'artifact', id: 'ART-IMG', order: 6, causalId: imageExecution.id }, { type: 'execution', id: noteExecution.id, order: 7, causalId: 'TRN-2' }, { type: 'artifact', id: 'ART-NOTE', order: 8, causalId: noteExecution.id }],
  };
};
