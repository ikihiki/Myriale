import { describe, expect, it } from 'vitest';
import { toTurnInspection, type TurnInspectionDto } from './turnInspectionModel';

const dto: TurnInspectionDto = {
  session: { id: 'SES-1', status: 'active', revision: 2, createdAt: '2026-07-29T09:00:00Z', updatedAt: '2026-07-29T10:00:04Z' },
  scenario: { id: 'SCN-1', title: '星の物語' },
  turn: { id: 'TURN-1', position: 7, kind: 'narrative', createdAt: '2026-07-29T10:00:04Z' },
  playerInput: { id: 'INPUT-1', text: '扉を開く', interactionType: 'dialogue', acceptedAt: '2026-07-29T10:00:00Z' },
  execution: { id: 'EXEC-1', kind: 'scenario-turn', status: 'succeeded', attemptCount: 1, createdAt: '2026-07-29T10:00:00Z', queuedAt: '2026-07-29T10:00:00Z', startedAt: '2026-07-29T10:00:00Z', completedAt: '2026-07-29T10:00:04Z', elapsedMilliseconds: 4036 },
  aiInteractions: [
    { id: 'later', attemptNumber: 1, sequence: 2, stage: 'narrative', aiProfileId: 'p2', status: 'succeeded', startedAt: '2026-07-29T10:00:02Z', completedAt: '2026-07-29T10:00:04Z', elapsedMilliseconds: 2000 },
    { id: 'first', attemptNumber: 1, sequence: 1, stage: 'decision', aiProfileId: 'p1', status: 'succeeded', provider: 'Provider', model: 'Model', startedAt: '2026-07-29T10:00:00Z', completedAt: '2026-07-29T10:00:00.540Z', elapsedMilliseconds: 540, latencyMilliseconds: 540, inputTokens: 100, outputTokens: 20, sentPrompt: 'prompt', receivedResult: 'result' },
  ],
  ruleEngine: { stepId: 'STEP-1', stage: 'completed', schemaVersion: 'v1', preSessionRevision: 1, postSessionRevision: 2, selectedAction: { actionId: 'open', arguments: {} }, appliedEffects: [], facts: [], events: [], hints: [], changes: [], timing: { createdAt: '2026-07-29T10:00:00Z', appliedAt: '2026-07-29T10:00:00.180Z', totalElapsedMilliseconds: 180 } },
};

describe('toTurnInspection', () => {
  it('adapts the backend contract, sorts AI exchanges, and formats elapsed timing', () => {
    const value = toTurnInspection(dto);
    expect(value).toMatchObject({ sessionId: 'SES-1', scenarioId: 'SCN-1', scenarioTitle: '星の物語' });
    expect(value.turn).toMatchObject({ id: 'TURN-1', position: 7 });
    expect(value.execution.elapsedLabel).toBe('4.04 秒');
    expect(value.interactions.map((item) => item.id)).toEqual(['first', 'later']);
    expect(value.ruleEngine?.durationLabel).toBe('180 ms');
  });
  it('provides readable placeholders without losing raw JSON', () => {
    const value = toTurnInspection(dto);
    expect(value.interactions[1]).toMatchObject({ providerLabel: '不明', modelLabel: '不明', sentPromptLabel: '送信プロンプトは記録されていません。' });
    expect(value.rawJson).toContain('"TURN-1"');
  });
});
