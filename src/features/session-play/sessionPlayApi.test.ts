import { afterEach, describe, expect, it, vi } from 'vitest';
import { acceptSessionInput, createNarrativeTurn, createSession, getSession, mutateSessionExecution, recommendNextAction, reviewSessionNoteProposal } from './sessionPlayApi';

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
      interpretationEnabled: false,
      turns: [{
        id: 'TRN-1',
        position: 1,
        kind: 'narrative',
        narrative: {
          body: '扉の前で立ち止まる。',
          schemaVersion: 'narrative-dialogue.v8',
          turnType: 'action-result',
          heading: '閉じた扉を確かめる',
        },
        createdAt: '2026-07-20T00:00:00Z',
      }],
      pendingInputs: [{
        playerInputId: 'INP-1',
        requestId: 'narrative-1',
        input: '扉を調べる',
        interactionType: 'clarification',
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

    expect(session.turns[0].narrative).toMatchObject({
      schemaVersion: 'narrative-dialogue.v8',
      turnType: 'action-result',
      heading: '閉じた扉を確かめる',
    });
    expect(session.pendingInputs[0]).toMatchObject({
      requestId: 'narrative-1',
      interactionType: 'clarification',
      isRetryable: true,
    });
  });

  it('accepts durable input and mutates the same execution resource', async () => {
    const accepted = { input: { id: 'INP-1' }, execution: { id: 'EXE-1', status: 'queued' } };
    const fetch = vi.fn()
      .mockResolvedValueOnce(response(accepted, 202))
      .mockResolvedValueOnce(response({ ...accepted.execution, status: 'running' }));
    vi.stubGlobal('fetch', fetch);

    await acceptSessionInput('SES-1', '扉を調べる', 'request-1', '/api/sessions');
    await mutateSessionExecution('EXE-1', 'retry', '/api/sessions');

    expect(fetch).toHaveBeenNthCalledWith(1, '/api/sessions/SES-1/inputs', expect.objectContaining({ method: 'POST', credentials: 'include' }));
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/session-executions/EXE-1/retry', expect.objectContaining({ method: 'POST', credentials: 'include' }));
  });

  it('submits edited note content with the expected revision', async () => {
    const fetch = vi.fn().mockResolvedValue(response({ artifactId: 'ART-1', status: 'applied' }));
    vi.stubGlobal('fetch', fetch);

    await reviewSessionNoteProposal('ART-1', 'edit-apply', { expectedNoteRevision: 2, title: '更新', body: '本文' }, '/api/sessions');

    expect(fetch).toHaveBeenCalledWith('/api/session-artifacts/note-proposals/ART-1/edit-apply', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ expectedNoteRevision: 2, title: '更新', body: '本文' }),
    }));
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

  it('exposes the server error code and Development diagnostics so the same narrative request can be retried', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
      code: 'schema_failure',
      message: 'Narrativeの生成に失敗しました。',
      details: 'AiProviderException: invalid structured output -> JsonException: missing heading',
    }, 503)));

    await expect(createNarrativeTurn('SES-1', '扉を調べる', 'narrative-1', '/api/sessions'))
      .rejects.toMatchObject({
        status: 503,
        code: 'schema_failure',
        details: 'AiProviderException: invalid structured output -> JsonException: missing heading',
        message: expect.stringContaining('JsonException: missing heading'),
      });
  });

  it('sends an explicit clarification interaction type', async () => {
    const fetch = vi.fn().mockResolvedValue(response({ id: 'TRN-2', position: 2, kind: 'narrative' }));
    vi.stubGlobal('fetch', fetch);

    await createNarrativeTurn(
      'SES-1',
      '今の状況を簡単にまとめて',
      'clarification-1',
      '/api/sessions',
      'clarification',
    );

    expect(fetch).toHaveBeenCalledWith('/api/sessions/SES-1/narrative-turns', expect.objectContaining({
      body: JSON.stringify({
        requestId: 'clarification-1',
        input: '今の状況を簡単にまとめて',
        interactionType: 'clarification',
      }),
    }));
  });
});
