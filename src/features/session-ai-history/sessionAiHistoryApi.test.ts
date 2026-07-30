import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSessionAiHistory } from './sessionAiHistoryApi';

const response = {
  sessionId: 'session/with spaces',
  scenarioId: 'SCN-1',
  scenarioTitle: '星の物語',
  interactions: [],
};

afterEach(() => vi.unstubAllGlobals());

describe('fetchSessionAiHistory', () => {
  it('loads the authenticated session history from the dedicated endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchSessionAiHistory('session/with spaces', undefined, '/api/sessions')).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/sessions/session%2Fwith%20spaces/ai-history',
      expect.objectContaining({ credentials: 'include', headers: { Accept: 'application/json' } }),
    );
  });

  it.each([
    [401, 'ログインしてください'],
    [403, '権限がありません'],
    [404, '見つかりませんでした'],
  ])('maps status %s to a safe page message', async (status, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
    await expect(fetchSessionAiHistory('SES-1', undefined, '/api/sessions')).rejects.toThrow(message);
  });
});
