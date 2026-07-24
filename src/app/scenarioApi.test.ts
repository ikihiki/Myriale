import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDemoScenarioApi, createFetchScenarioApi } from './scenarioApi';

afterEach(() => vi.unstubAllGlobals());

describe('scenario list API', () => {
  it('loads scenarios from the collection endpoint with credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createFetchScenarioApi('/api/scenarios').getScenarios()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith('/api/scenarios/', expect.objectContaining({
      credentials: 'include',
      headers: { Accept: 'application/json' },
    }));
  });

  it('uses only the current seed scenario in standalone demo mode', async () => {
    const scenarios = await createDemoScenarioApi().getScenarios();

    expect(scenarios.map((scenario) => scenario.id)).toEqual(['SCN-AWAKENING-LAB']);
    expect(scenarios[0].title).toBe('目覚めの研究室');
  });
});
