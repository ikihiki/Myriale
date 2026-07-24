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

  it('updates a scenario through the item endpoint', async () => {
    const updated = { id: 'SCN-1', title: '更新後' };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createFetchScenarioApi('/api/scenarios').updateScenario('SCN-1', { title: '更新後' })).resolves.toEqual(updated);
    expect(fetchMock).toHaveBeenCalledWith('/api/scenarios/SCN-1', expect.objectContaining({
      method: 'PUT',
      credentials: 'include',
    }));
  });

  it('uses only the current seed scenario in standalone demo mode', async () => {
    const scenarios = await createDemoScenarioApi().getScenarios();

    expect(scenarios.map((scenario) => scenario.id)).toEqual(['SCN-AWAKENING-LAB']);
    expect(scenarios[0].title).toBe('目覚めの研究室');
  });
});

describe('scenario rule-data API', () => {
  it('sends typed rule-data with scenario create requests', async () => {
    const responseBody = {
      id: 'SCN-1', title: '扉のテスト', summary: '', genre: '', tone: '', lore: '', aiFreedom: '', heroMode: 'free',
      heroFreeGenerationAllowed: false, hero: '', opening: '', illustrationStyle: '', illustrationMood: '',
      illustrationNegative: '', sampleScene: '', status: 'draft', updatedAt: '2026-07-24',
      ruleData: { schemaVersion: 1, locations: [], objectTypes: [], objects: [] },
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await createFetchScenarioApi('/api/scenarios').createScenario({
      title: '扉のテスト',
      ruleData: responseBody.ruleData as never,
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/scenarios/', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"schemaVersion":1'),
    }));
  });

  it('uses the aggregate rule-data endpoint for authoring updates', async () => {
    const payload = { schemaVersion: 1 as const, locations: [], objectTypes: [], objects: [] };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createFetchScenarioApi('/api/scenarios').putScenarioRuleData('SCN-1', payload)).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith('/api/scenarios/SCN-1/rule-data', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify(payload),
    }));
  });

  it('round-trips rule-data in standalone draft creation', async () => {
    const ruleData = { schemaVersion: 1 as const, locations: [], objectTypes: [], objects: [] };
    const draft = await createDemoScenarioApi().createScenario({ title: 'title only plus empty rules', ruleData });

    expect(draft.ruleData).toEqual(ruleData);
  });
});
