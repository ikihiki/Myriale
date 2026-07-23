import { describe, expect, it } from 'vitest';
import { toSessionListItem, type SessionListItemDto } from './sessionListModel';

const base: SessionListItemDto = {
  id: 'SES-1',
  scenarioId: 'SCN-1',
  scenarioTitle: '星の物語',
  selectedHero: 'ミラ',
  status: 'active',
  headTurnId: 'TRN-4',
  headTurnPosition: 4,
  turnCount: 4,
  latestSummary: '扉の前にいる。',
  createdAt: '2026-07-22T00:00:00Z',
  updatedAt: '2026-07-23T00:00:00Z',
};

describe('toSessionListItem', () => {
  it('preserves active and completed status', () => {
    expect(toSessionListItem(base).status).toBe('active');
    expect(toSessionListItem({ ...base, status: 'completed' }).status).toBe('completed');
  });

  it('uses safe display fallbacks', () => {
    const item = toSessionListItem({ ...base, headTurnPosition: null, turnCount: 0, latestSummary: null });
    expect(item.turnLabel).toBe('開始前');
    expect(item.summary).toContain('まだ要約はありません');
  });

  it('rejects unknown session states instead of treating them as active', () => {
    expect(() => toSessionListItem({ ...base, status: 'archived' })).toThrow('未対応のセッション状態');
  });
});
