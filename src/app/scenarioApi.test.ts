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
  it('keeps rule-data off the basic scenario create endpoint', async () => {
    const responseBody = {
      id: 'SCN-1', title: '扉のテスト', summary: '', genre: '', tone: '', lore: '', aiFreedom: '', heroMode: 'free',
      heroFreeGenerationAllowed: false, hero: '', opening: '', illustrationStyle: '', illustrationMood: '',
      illustrationNegative: '', sampleScene: '', status: 'draft', updatedAt: '2026-07-24',
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await createFetchScenarioApi('/api/scenarios').createScenario({
      title: '扉のテスト',
      ruleData: { schemaVersion: 1, locations: [], objectTypes: [], objects: [] },
    });

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody).toEqual({ title: '扉のテスト' });
  });

  it('converts editor rule-data to the canonical aggregate endpoint contract', async () => {
    const payload = { schemaVersion: 1 as const, locations: [], objectTypes: [], objects: [] };
    const canonicalResponse = {
      scenarioId: 'SCN-1', definitionVersionId: 'SDV-1', version: 1, status: 'draft', schemaVersion: 1,
      updatedAt: '2026-07-24T00:00:00Z', publishedAt: null, locations: [], objectTypes: [], objects: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(canonicalResponse), {
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

  it('loads canonical rule-data and uses the GET readiness endpoint', async () => {
    const canonicalResponse = {
      scenarioId: 'SCN-1', definitionVersionId: 'SDV-1', version: 1, status: 'draft', schemaVersion: 1,
      updatedAt: '2026-07-24T00:00:00Z', publishedAt: null, locations: [], objectTypes: [], objects: [],
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(canonicalResponse), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ definitionVersionId: 'SDV-1', ready: true, errors: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const api = createFetchScenarioApi('/api/scenarios');
    await expect(api.getScenarioRuleData('SCN-1')).resolves.toEqual({ schemaVersion: 1, locations: [], objectTypes: [], objects: [] });
    await expect(api.getScenarioRuleDataReadiness('SCN-1')).resolves.toMatchObject({ ready: true });
    expect(fetchMock.mock.calls[1][0]).toBe('/api/scenarios/SCN-1/rule-data/readiness');
    expect(fetchMock.mock.calls[1][1]).not.toHaveProperty('method');
  });

  it('round-trips rule-data in standalone draft creation', async () => {
    const ruleData = { schemaVersion: 1 as const, locations: [], objectTypes: [], objects: [] };
    const draft = await createDemoScenarioApi().createScenario({ title: 'title only plus empty rules', ruleData });

    expect(draft.ruleData).toEqual(ruleData);
  });
});
