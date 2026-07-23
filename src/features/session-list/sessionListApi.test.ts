import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSessionList } from './sessionListApi';

const response = [{
  id: 'SES-1', scenarioId: 'SCN-1', scenarioTitle: '星の物語', selectedHero: 'ミラ', status: 'active',
  headTurnId: 'TRN-4', headTurnPosition: 4, turnCount: 4, latestSummary: '扉の前にいる。',
  createdAt: '2026-07-22T00:00:00Z', updatedAt: '2026-07-23T00:00:00Z',
}];

afterEach(() => vi.unstubAllGlobals());

describe('fetchSessionList', () => {
  it('loads owner sessions with credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchSessionList(false, undefined, '/api/sessions')).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith('/api/sessions', expect.objectContaining({ credentials: 'include' }));
  });

  it('requests completed sessions only when selected', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchSessionList(true, undefined, '/api/sessions');

    expect(fetchMock).toHaveBeenCalledWith('/api/sessions?includeCompleted=true', expect.any(Object));
  });

  it('shows a login-specific message for unauthorized access', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    await expect(fetchSessionList(false, undefined, '/api/sessions')).rejects.toThrow('ログインしてください');
  });
});
