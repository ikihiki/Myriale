import { afterEach, describe, expect, it, vi } from 'vitest';
import { acceptSessionInput, createSession, getSession, mutateSessionExecution, normalizeSessionApiError, recommendNextAction, reviewSessionNoteProposal } from './sessionPlayApi';

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
          schemaVersion: 'post-state-narrative.v1',
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
      schemaVersion: 'post-state-narrative.v1',
      turnType: 'action-result',
      heading: '閉じた扉を確かめる',
    });
    expect(session.pendingInputs[0]).toMatchObject({
      requestId: 'narrative-1',
      interactionType: 'clarification',
      isRetryable: true,
    });
  });

  it('hydrates the server scenario-turn projection with selected action and location transition', async () => {
    const payload = {
      id: 'SES-WEST', scenarioId: 'SCN-AWAKENING-LAB', status: 'active', revision: 2, interpretationEnabled: false,
      turns: [], pendingInputs: [], createdAt: '2026-07-25T00:00:00Z', updatedAt: '2026-07-25T00:00:00Z',
      currentLocationId: 'LOC-OUTSIDE', objectStates: [{ objectId: 'OBJ-WEST', code: 'west-door', name: '西の扉', locationId: 'LOC-INSIDE', isGlobal: false, revision: 1, state: { open: true } }],
      executions: [{
        id: 'EXE-WEST', sessionId: 'SES-WEST', kind: 'scenario-turn', triggerType: 'player-input', triggerId: 'INP-WEST', status: 'succeeded', stage: 'completed', revision: 2, isRetryable: false, attemptCount: 1, maxAttempts: 3,
        createdAt: '2026-07-25T00:00:00Z', capabilities: { canRetry: false, canCancel: false, canDismiss: true },
        scenarioTurn: {
          schemaVersion: 'scenario-turn.v1', stage: 'completed', currentLocation: { id: 'LOC-INSIDE', code: 'inside', name: '地下研究室', description: '' }, objects: [], availableActions: [],
          selectedAction: { objectId: 'OBJ-WEST', actionId: 'ACT-OPEN-EXIT', objectCode: 'west-door', objectLabel: '西の扉', actionCode: 'open-and-exit', actionLabel: '扉を開けて外へ出る', arguments: {} },
          postState: { revision: 2, currentLocation: { id: 'LOC-OUTSIDE', code: 'outside', name: '研究施設の外', description: '' }, objects: [], facts: ['プレイヤーは研究施設の外へ出た。'], events: [], hints: [], appliedEffects: [{ type: 'move-session', targetId: 'LOC-OUTSIDE', path: 'currentLocationId', value: 'outside' }] },
        },
      }],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(payload)));

    const session = await getSession('SES-WEST', '/api/sessions');

    expect(session.currentLocationId).toBe('LOC-OUTSIDE');
    expect(session.objectStates?.[0]).toMatchObject({ code: 'west-door', revision: 1, state: { open: true } });
    expect(session.executions?.[0].scenarioTurn).toMatchObject({
      selectedAction: { objectCode: 'west-door', actionCode: 'open-and-exit' },
      postState: { currentLocation: { code: 'outside' }, facts: ['プレイヤーは研究施設の外へ出た。'] },
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

    expect(fetch).toHaveBeenNthCalledWith(1, '/api/sessions/SES-1/inputs', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ requestId: 'request-1', text: '扉を調べる', interactionType: 'dialogue', requestedOutputs: ['scenario-turn'] }),
    }));
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

  it.each([
    [401, 'unauthorized'],
    [404, 'not-found'],
    [409, 'conflict'],
    [429, 'rate-limited'],
    [503, 'service-unavailable'],
  ] as const)('normalizes HTTP %s as %s', async (status, kind) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ code: `http_${status}`, message: 'request failed' }, status)));

    await expect(getSession('SES-1', '/api/sessions')).rejects.toMatchObject({ status, kind, code: `http_${status}` });
  });

  it('normalizes request timeouts without confusing them with caller cancellation', () => {
    const timeout = new DOMException('timed out', 'TimeoutError');
    expect(normalizeSessionApiError(timeout, 'fallback')).toMatchObject({ kind: 'timeout', code: 'request_timeout' });

    const aborted = normalizeSessionApiError(new DOMException('aborted', 'AbortError'), 'fallback');
    expect(aborted.name).toBe('AbortError');
    expect(aborted.kind).toBe('unknown');
  });


});
