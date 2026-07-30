import { describe, expect, it } from 'vitest';
import { toSessionAiHistory, type SessionAiHistoryDto } from './sessionAiHistoryModel';

const dto: SessionAiHistoryDto = {
  sessionId: 'SES-1',
  scenarioId: 'SCN-1',
  scenarioTitle: '星の物語',
  interactions: [
    {
      id: 'later', executionId: 'EXEC-1', executionAttemptId: 'ATT-2', attemptNumber: 2, sequence: 2,
      stage: 'narrative', aiProfileId: 'profile-2', status: 'failed', startedAt: '2026-07-29T10:00:00Z',
      errorCode: 'provider_timeout',
    },
    {
      id: 'first', executionId: 'EXEC-1', executionAttemptId: 'ATT-1', attemptNumber: 1, sequence: 1,
      stage: 'decision', aiProfileId: 'profile-1', status: 'succeeded', provider: 'Provider', model: 'Model',
      startedAt: '2026-07-29T09:59:00Z', completedAt: '2026-07-29T09:59:00.540Z', latencyMilliseconds: 540,
      inputTokens: 100, outputTokens: 20, sentPrompt: 'prompt', receivedResult: 'result',
    },
  ],
};

describe('toSessionAiHistory', () => {
  it('sorts interactions chronologically and formats inspection metadata', () => {
    const history = toSessionAiHistory(dto);

    expect(history.interactions.map((interaction) => interaction.id)).toEqual(['first', 'later']);
    expect(history.interactions[0]).toMatchObject({
      latencyLabel: '540 ms',
      tokenLabel: '入力 100 / 出力 20',
      sentPrompt: 'prompt',
      receivedResult: 'result',
    });
  });

  it('provides explicit placeholders for optional provider payloads', () => {
    const interaction = toSessionAiHistory(dto).interactions[1];
    expect(interaction).toMatchObject({
      provider: '不明',
      model: '不明',
      latencyLabel: '計測なし',
      tokenLabel: '記録なし',
      sentPrompt: '送信プロンプトは記録されていません。',
      receivedResult: '受信結果は記録されていません。',
    });
  });
});
