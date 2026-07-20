import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNarrativeTurn, createSession, getSession, recommendNextAction } from './sessionPlayApi';

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sessionPlayApi', () => {
  it('creates an idempotent Session with the supplied request ID', async () => {
    const fetch = vi.fn().mockResolvedValue(response({ id: 'SES-1', turns: [], pendingInputs: [] }, 201));
    vi.stubGlobal('fetch', fetch);

    await createSession('SCN-STAR-LIBRARY', 'session-request-1', '/api/sessions');

    expect(fetch).toHaveBeenCalledWith('/api/sessions/', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        scenarioId: 'SCN-STAR-LIBRARY',
        requestId: 'session-request-1',
        interpretationEnabled: false,
      }),
    }));
  });

  it('requests interpretation output only when explicitly enabled', async () => {
    const fetch = vi.fn().mockResolvedValue(response({ id: 'SES-1', turns: [], pendingInputs: [] }, 201));
    vi.stubGlobal('fetch', fetch);

    await createSession('SCN-STAR-LIBRARY', 'session-request-2', '/api/sessions', true);

    expect(fetch).toHaveBeenCalledWith('/api/sessions/', expect.objectContaining({
      body: JSON.stringify({
        scenarioId: 'SCN-STAR-LIBRARY',
        requestId: 'session-request-2',
        interpretationEnabled: true,
      }),
    }));
  });

  it('hydrates a Session and preserves pending input retry metadata', async () => {
    const payload = {
      id: 'SES-1',
      scenarioId: 'SCN-STAR-LIBRARY',
      status: 'active',
      revision: 1,
      turns: [],
      pendingInputs: [{
        playerInputId: 'INP-1',
        requestId: 'narrative-1',
        input: '扉を調べる',
        status: 'failed',
        isRetryable: true,
        attemptCount: 1,
        updatedAt: '2026-07-20T00:00:00Z',
      }],
      createdAt: '2026-07-20T00:00:00Z',
      updatedAt: '2026-07-20T00:00:00Z',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(payload)));

    const session = await getSession('SES-1', '/api/sessions');

    expect(session.pendingInputs[0]).toMatchObject({ requestId: 'narrative-1', isRetryable: true });
  });

  it('requests an AI recommendation without advancing the Session', async () => {
    const fetch = vi.fn().mockResolvedValue(response({ suggestion: '銀の鍵を扉にかざす' }));
    vi.stubGlobal('fetch', fetch);

    await expect(recommendNextAction('SES-1', '/api/sessions')).resolves.toBe('銀の鍵を扉にかざす');
    expect(fetch).toHaveBeenCalledWith('/api/sessions/SES-1/action-recommendation', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }));
  });

  it('exposes the server error code so the same narrative request can be retried', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
      code: 'narrative_generation_failed',
      message: 'Narrativeの生成に失敗しました。',
    }, 503)));

    await expect(createNarrativeTurn('SES-1', '扉を調べる', 'narrative-1', '/api/sessions'))
      .rejects.toMatchObject({ status: 503, code: 'narrative_generation_failed' });
  });
});
