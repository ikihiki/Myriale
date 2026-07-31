import { toTurnInspection, type TurnInspectionDto } from '../../features/turn-inspection/turnInspectionModel';

export const turnInspectionDto: TurnInspectionDto = {
  session: { id: 'SES-AUTHOR-042', status: 'active', revision: 18, createdAt: '2026-07-29T10:00:00Z', updatedAt: '2026-07-29T10:21:18.120Z' },
  scenario: { id: 'SCN-STAR-LIBRARY', title: '星喰いの地下図書館', definitionVersionId: 'SDV-12' },
  turn: { id: 'TURN-018', position: 18, kind: 'narrative', heading: '封印の解除', narrativeBody: '石の扉を走る銀の線が夜空のように瞬いた。', createdAt: '2026-07-29T10:21:18.120Z' },
  playerInput: { id: 'INPUT-018', text: '扉に刻まれた星座を調べる', interactionType: 'dialogue', acceptedAt: '2026-07-29T10:21:13.900Z' },
  execution: { id: 'EXEC-018', kind: 'scenario-turn', status: 'succeeded', stage: 'completed', attemptCount: 1, createdAt: '2026-07-29T10:21:13.900Z', queuedAt: '2026-07-29T10:21:13.950Z', startedAt: '2026-07-29T10:21:14.000Z', completedAt: '2026-07-29T10:21:18.036Z', elapsedMilliseconds: 4036 },
  aiInteractions: [
    { id: 'AI-INT-001', attemptNumber: 1, sequence: 1, stage: 'action-decision', aiProfileId: 'action-decision-primary', status: 'succeeded', provider: 'OpenAI', model: 'gpt-5-mini', providerRequestId: 'req_action_018', startedAt: '2026-07-29T10:21:14.000Z', completedAt: '2026-07-29T10:21:15.284Z', elapsedMilliseconds: 1284, latencyMilliseconds: 1284, inputTokens: 842, outputTokens: 116, finishReason: 'stop', sentPrompt: '[PLAYER]\n扉に刻まれた星座を調べる\n\n[STATE]\n場所: 禁書庫前', receivedResult: '{\n  "actionId": "inspect-constellation-seal",\n  "arguments": { "useItem": "star-map-key" }\n}', validationResult: 'schema: valid' },
    { id: 'AI-INT-002', attemptNumber: 1, sequence: 2, stage: 'narrative', aiProfileId: 'narrative-main', status: 'succeeded', provider: 'OpenAI', model: 'gpt-5', startedAt: '2026-07-29T10:21:15.511Z', completedAt: '2026-07-29T10:21:18.036Z', elapsedMilliseconds: 2525, latencyMilliseconds: 2525, inputTokens: 1874, outputTokens: 428, sentPrompt: '確定したルール処理を変更せず描写してください。', receivedResult: '石の扉を走る銀の線が夜空のように瞬いた。' },
  ],
  ruleEngine: {
    stepId: 'STEP-018', stage: 'completed', schemaVersion: 'rule-action-step.v1', preSessionRevision: 17, postSessionRevision: 18,
    actionSnapshot: { currentLocation: { id: 'archive-hall', name: '書庫前広間' }, objects: [{ id: 'door-01', state: { open: false } }] },
    selectedAction: { objectId: 'door-01', actionId: 'inspect-constellation-seal', objectLabel: '星座の扉', actionLabel: '星座封印を調べる', arguments: { useItem: 'star-map-key' } },
    selectedRuleId: 'rule-open-constellation-door',
    appliedEffects: [{ type: 'set-state', targetId: 'door-01', path: 'state.open', value: true }],
    postState: { schemaVersion: 'post-state.v1', currentLocation: { id: 'forbidden-library', name: '禁書庫' }, objects: [{ id: 'door-01', state: { open: true } }], sessionFlags: {}, sessionStateRevision: 18 },
    changes: [{ kind: 'object-state', targetId: 'door-01', path: 'state.open', before: false, after: true }, { kind: 'location', targetId: null, path: 'currentLocation', before: 'archive-hall', after: 'forbidden-library' }],
    facts: ['禁書庫の封印が解除された'], events: [{ type: 'door-opened', objectId: 'door-01' }], hints: ['奥に古い星図が見える'],
    timing: { createdAt: '2026-07-29T10:21:14.010Z', enumeratedAt: '2026-07-29T10:21:14.080Z', selectedAt: '2026-07-29T10:21:15.284Z', appliedAt: '2026-07-29T10:21:15.480Z', narrativePublishedAt: '2026-07-29T10:21:18.036Z', enumerationElapsedMilliseconds: 70, selectionElapsedMilliseconds: 1204, applicationElapsedMilliseconds: 196, narrativeElapsedMilliseconds: 2556, totalElapsedMilliseconds: 4026 },
  },
};

export const turnInspection = toTurnInspection(turnInspectionDto);
export const emptyTurnInspection = toTurnInspection({ ...turnInspectionDto, aiInteractions: [], ruleEngine: null });
