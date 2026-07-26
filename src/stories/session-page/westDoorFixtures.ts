import type { ScenarioTurnStage, SessionApiResponse, SessionExecutionApiResponse } from '../../features/session-play/sessionPlayApi';

const at = '2026-07-25T12:00:00Z';
const inside = { id: 'SLOC-DEMO-INSIDE', code: 'inside', name: '地下研究室', description: '西と東に扉がある閉鎖された研究室。' };
const outside = { id: 'SLOC-DEMO-OUTSIDE', code: 'outside', name: '研究施設の外', description: '冷たい夜風と星空が広がる屋外。' };
const westDoor = { id: 'SOBJ-DEMO-WEST', code: 'west-door', name: '西の扉', locationId: inside.id, isGlobal: false, revision: 0, state: { open: false } };
const eastDoor = { id: 'SOBJ-DEMO-EAST', code: 'east-door', name: '東の扉', locationId: inside.id, isGlobal: false, revision: 0, state: { open: false } };
const outsideAntenna = { id: 'SOBJ-DEMO-ANTENNA', code: 'outside-antenna', name: '風に鳴る観測アンテナ', locationId: outside.id, isGlobal: false, revision: 0, state: { examined: false } };

const westAction = { objectId: westDoor.id, actionId: 'SOTA-DEMO-OPEN-AND-EXIT', code: 'open-and-exit', label: '扉を開けて外へ出る', description: '扉を開き、施設の外へ移動する。', argumentSchema: { type: 'object', additionalProperties: false }, enabled: true };
const eastAction = { objectId: eastDoor.id, actionId: 'SOTA-DEMO-OPEN', code: 'open', label: '扉を開ける', description: '扉を開く。', argumentSchema: { type: 'object', additionalProperties: false }, enabled: true };

export const westDoorStageOrder: ScenarioTurnStage[] = [
  'loading-world',
  'enumerating-actions',
  'selecting-action',
  'applying-rules',
  'generating-narrative',
  'completed',
];

export function westDoorSessionFixture(stage?: ScenarioTurnStage): SessionApiResponse {
  const started = Boolean(stage);
  const committed = stage === 'generating-narrative' || stage === 'completed';
  const completed = stage === 'completed';
  const execution: SessionExecutionApiResponse | null = started ? {
    id: 'EXE-WEST-DOOR', sessionId: 'SES-WEST-DOOR', kind: 'scenario-turn', triggerType: 'player-input', triggerId: 'INP-WEST-DOOR',
    status: completed ? 'succeeded' : 'running', stage: stage!, revision: committed ? 2 : 1, isRetryable: false, attemptCount: 1, maxAttempts: 3,
    createdAt: at, startedAt: at, completedAt: completed ? '2026-07-25T12:00:02Z' : null,
    capabilities: { canRetry: false, canCancel: !completed, canDismiss: completed }, developmentDiagnostics: null,
    scenarioTurn: {
      schemaVersion: 'scenario-turn.v1', stage: stage!, currentLocation: inside,
      objects: [eastDoor, westDoor], availableActions: stage === 'loading-world' ? [] : [eastAction, westAction],
      selectedAction: ['selecting-action', 'applying-rules', 'generating-narrative', 'completed'].includes(stage!)
        ? { objectId: westDoor.id, actionId: westAction.actionId, objectCode: westDoor.code, objectLabel: westDoor.name, actionCode: westAction.code, actionLabel: westAction.label, arguments: {} }
        : null,
      postState: committed ? {
        revision: 2, currentLocation: outside, objects: [{ ...outsideAntenna }],
        facts: ['西の扉が開いた。', 'プレイヤーは研究施設の外へ出た。'], events: [{ type: 'session-moved', locationCode: 'outside' }], hints: ['冷たい夜風と星空を描写する。'],
        appliedEffects: [
          { type: 'set-state', targetId: westDoor.id, path: 'state.open', value: true },
          { type: 'move-session', targetId: outside.id, path: 'currentLocationId', value: 'outside' },
        ],
      } : null,
    },
  } : null;
  return {
    id: 'SES-WEST-DOOR', scenarioId: 'SCN-AWAKENING-LAB', status: 'active', revision: committed ? 2 : 1, interpretationEnabled: false,
    currentLocationId: committed ? outside.id : inside.id, pendingInputs: [], createdAt: at, updatedAt: at,
    inputs: started ? [{ id: 'INP-WEST-DOOR', requestId: 'west-door-demo', text: '西の扉を開けて外に出る', interactionType: 'dialogue', acceptedSessionRevision: 1, createdAt: at }] : [],
    executions: execution ? [execution] : [],
    turns: [
      { id: 'TRN-OPENING', position: 1, kind: 'narrative', narrative: { heading: '地下研究室', body: '閉ざされた地下研究室には、西の扉と東の扉がある。', turnType: 'opening' }, createdAt: at },
      ...(completed ? [{ id: 'TRN-WEST-RESULT', position: 2, previousTurnId: 'TRN-OPENING', kind: 'narrative', narrative: { heading: '扉を開けて外へ出る', body: '西の扉が開き、冷たい夜風が流れ込む。あなたは研究施設の外へ踏み出した。', playerInputId: 'INP-WEST-DOOR', playerInput: '西の扉を開けて外に出る', turnType: 'action-result' }, createdAt: '2026-07-25T12:00:02Z' } as const] : []),
    ],
    activity: [
      { type: 'turn', id: 'TRN-OPENING', order: 1 },
      ...(started ? [{ type: 'input', id: 'INP-WEST-DOOR', order: 2 } as const, { type: 'execution', id: 'EXE-WEST-DOOR', order: 3, causalId: 'INP-WEST-DOOR' } as const] : []),
      ...(completed ? [{ type: 'turn', id: 'TRN-WEST-RESULT', order: 4, causalId: 'INP-WEST-DOOR' } as const] : []),
    ],
    objectStates: committed ? [
      { objectId: westDoor.id, code: westDoor.code, name: westDoor.name, locationId: westDoor.locationId, isGlobal: false, revision: 1, state: { open: true } },
      { objectId: outsideAntenna.id, code: outsideAntenna.code, name: outsideAntenna.name, locationId: outsideAntenna.locationId, isGlobal: outsideAntenna.isGlobal, revision: outsideAntenna.revision, state: outsideAntenna.state },
    ] : [eastDoor, westDoor, outsideAntenna].map((item) => ({ objectId: item.id, code: item.code, name: item.name, locationId: item.locationId, isGlobal: item.isGlobal, revision: item.revision, state: item.state })),
  };
}
