import { describe, expect, it } from 'vitest';
import { toDialogueTurn, toSessionNotice } from './sessionModel';
import type { SessionApiError, SessionApiErrorKind } from './sessionPlayApi';

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

const apiError = (kind: SessionApiErrorKind) => {
  const error = new Error(kind) as SessionApiError;
  error.kind = kind;
  return error;
};

describe('toSessionNotice', () => {
  it.each([
    ['unauthorized', 'authentication-required', false, 'login'],
    ['not-found', 'not-found', false, 'session-list'],
    ['conflict', 'conflict', false, 'reload'],
    ['rate-limited', 'rate-limited', true, undefined],
    ['service-unavailable', 'service-unavailable', true, undefined],
    ['timeout', 'timeout', true, undefined],
  ] as const)('maps %s to a presentation-safe submit notice', (kind, expectedKind, retryable, action) => {
    const notice = toSessionNotice(apiError(kind), 'submit');
    expect(notice).toMatchObject({ kind: expectedKind, retryable });
    expect(notice.action).toBe(action);
  });

  it('keeps request_in_progress distinct from a generic conflict', () => {
    const error = apiError('conflict');
    error.code = 'request_in_progress';
    expect(toSessionNotice(error, 'submit')).toMatchObject({ kind: 'info', retryable: false, action: 'reload' });
  });

  it('uses reload actions for load-time service and timeout failures', () => {
    expect(toSessionNotice(apiError('service-unavailable'), 'load')).toMatchObject({ action: 'reload', retryable: false });
    expect(toSessionNotice(apiError('timeout'), 'load')).toMatchObject({ action: 'reload', retryable: false });
  });
});
