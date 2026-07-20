import { describe, expect, it } from 'vitest';
import { toDialogueTurn } from './SessionPage';

const baseTurn = {
  id: 'TRN-1',
  position: 2,
  kind: 'narrative',
  createdAt: '2026-07-20T00:00:00Z',
};

describe('toDialogueTurn', () => {
  it('uses the server heading and structured clarification type', () => {
    const turn = toDialogueTurn({
      ...baseTurn,
      narrative: {
        schemaVersion: 'narrative-dialogue.v8',
        turnType: 'clarification',
        heading: '現在の状況を整理する',
        body: '現在地と手掛かりを整理した。',
        playerInput: '今の状況を簡単にまとめて',
      },
    });

    expect(turn).toMatchObject({
      turnTitle: '現在の状況を整理する',
      kind: 'clarification',
      narrative: '現在地と手掛かりを整理した。',
    });
  });

  it('keeps a fallback title for legacy responses without structured metadata', () => {
    const turn = toDialogueTurn({
      ...baseTurn,
      narrative: {
        body: '物語が続く。',
        playerInput: '扉を調べる',
      },
    });

    expect(turn.turnTitle).toBe('Player Inputを受けたNarrative');
    expect(turn.kind).toBe('action');
  });
});
