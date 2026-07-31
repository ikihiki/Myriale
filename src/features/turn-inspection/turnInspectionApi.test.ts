import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTurnInspection } from './turnInspectionApi';

const response = { sessionId: 'session/with spaces', scenarioId: 'SCN-1', scenarioTitle: '星の物語', turn: { id: 'turn/1', position: 1, kind: 'narrative', createdAt: '2026-07-29T09:00:00Z' }, aiInteractions: [] };
afterEach(() => vi.unstubAllGlobals());
describe('fetchTurnInspection', () => {
  it('loads the authenticated turn inspection from the dedicated endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 })); vi.stubGlobal('fetch', fetchMock);
    await expect(fetchTurnInspection('session/with spaces', 'turn/1', undefined, '/api/sessions')).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith('/api/sessions/session%2Fwith%20spaces/turns/turn%2F1/inspection', expect.objectContaining({ credentials: 'include', headers: { Accept: 'application/json' } }));
  });
  it.each([[401, 'ログインしてください'], [403, '権限がありません'], [404, '見つかりませんでした']])('maps status %s to a safe page message', async (status, message) => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status }))); await expect(fetchTurnInspection('SES-1', 'TURN-1', undefined, '/api/sessions')).rejects.toThrow(message); });
});
