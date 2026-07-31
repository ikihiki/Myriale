import { toTurnInspection, type TurnInspectionDto } from '../../features/turn-inspection/turnInspectionModel';

export const turnInspectionDto: TurnInspectionDto = {
  sessionId: 'SES-AUTHOR-042',
  scenarioId: 'SCN-STAR-LIBRARY',
  scenarioTitle: '星喰いの地下図書館',
  turn: { id: 'TURN-018', position: 18, kind: 'narrative', createdAt: '2026-07-29T10:21:18.120Z' },
  playerInput: { id: 'INPUT-018', text: '扉に刻まれた星座を調べる', interactionType: 'dialogue', createdAt: '2026-07-29T10:21:13.900Z' },
  execution: {
    id: 'EXEC-018', status: 'succeeded', stage: 'completed', startedAt: '2026-07-29T10:21:14.000Z', completedAt: '2026-07-29T10:21:18.036Z', elapsedMilliseconds: 4036,
    timeline: [
      { stage: 'selecting-action', label: 'AIによるアクション選択', startedAt: '2026-07-29T10:21:14.000Z', completedAt: '2026-07-29T10:21:15.284Z', durationMilliseconds: 1284 },
      { stage: 'applying-rules', label: 'ルール適用', startedAt: '2026-07-29T10:21:15.300Z', completedAt: '2026-07-29T10:21:15.480Z', durationMilliseconds: 180 },
      { stage: 'generating-narrative', label: 'Narrative生成', startedAt: '2026-07-29T10:21:15.511Z', completedAt: '2026-07-29T10:21:18.036Z', durationMilliseconds: 2525 },
    ],
  },
  aiInteractions: [
    { id: 'AI-INT-001', executionId: 'EXEC-018', executionAttemptId: 'ATTEMPT-018-1', attemptNumber: 1, sequence: 1, stage: 'selecting-action', aiProfileId: 'action-decision-primary', status: 'succeeded', provider: 'OpenAI', model: 'gpt-5-mini', providerRequestId: 'req_action_018', startedAt: '2026-07-29T10:21:14.000Z', completedAt: '2026-07-29T10:21:15.284Z', latencyMilliseconds: 1284, inputTokens: 842, outputTokens: 116, finishReason: 'stop', sentPrompt: '[PLAYER]\n扉に刻まれた星座を調べる\n\n[STATE]\n場所: 禁書庫前', receivedResult: '{\n  "actionId": "inspect-constellation-seal",\n  "arguments": { "useItem": "star-map-key" }\n}', validationResult: 'schema: valid' },
    { id: 'AI-INT-002', executionId: 'EXEC-018', executionAttemptId: 'ATTEMPT-018-1', attemptNumber: 1, sequence: 2, stage: 'generating-narrative', aiProfileId: 'narrative-main', status: 'succeeded', provider: 'OpenAI', model: 'gpt-5', startedAt: '2026-07-29T10:21:15.511Z', completedAt: '2026-07-29T10:21:18.036Z', latencyMilliseconds: 2525, inputTokens: 1874, outputTokens: 428, sentPrompt: '確定したルール処理を変更せず描写してください。', receivedResult: '石の扉を走る銀の線が夜空のように瞬いた。' },
  ],
  ruleEngine: {
    startedAt: '2026-07-29T10:21:15.300Z', completedAt: '2026-07-29T10:21:15.480Z', durationMilliseconds: 180,
    timeline: [{ stage: 'apply-action', label: 'inspect-constellation-seal を適用', startedAt: '2026-07-29T10:21:15.300Z', completedAt: '2026-07-29T10:21:15.480Z', durationMilliseconds: 180 }],
    input: { playerInput: '扉に刻まれた星座を調べる', location: 'sealed-library-door' },
    selectedAction: { objectId: 'door-01', actionId: 'inspect-constellation-seal', label: '星座封印を調べる' },
    arguments: { useItem: 'star-map-key' },
    preState: { revision: 17, door: { open: false }, location: 'archive-hall' },
    postState: { revision: 18, door: { open: true }, location: 'forbidden-library' },
    appliedEffects: [{ type: 'set-state', targetId: 'door-01', path: 'state.open', value: true }],
    derivedChanges: [{ path: 'currentLocation', before: 'archive-hall', after: 'forbidden-library' }],
    facts: ['禁書庫の封印が解除された'], events: [{ type: 'door-opened', objectId: 'door-01' }], hints: ['奥に古い星図が見える'],
  },
};

export const turnInspection = toTurnInspection(turnInspectionDto);
export const emptyTurnInspection = toTurnInspection({ ...turnInspectionDto, aiInteractions: [], ruleEngine: null });
