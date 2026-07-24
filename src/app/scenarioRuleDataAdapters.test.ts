import { describe, expect, it } from 'vitest';
import type { CanonicalScenarioRuleDataResponse } from './scenarioApi';
import { canonicalRuleDataToForm, formRuleDataToCanonical } from './scenarioRuleDataAdapters';

const canonicalFixture: CanonicalScenarioRuleDataResponse = {
  scenarioId: 'SCN-1',
  definitionVersionId: 'SDV-1',
  version: 2,
  status: 'draft',
  schemaVersion: 1,
  updatedAt: '2026-07-24T00:00:00Z',
  publishedAt: null,
  locations: [{ code: 'hall', name: '広間', description: '', authoringData: { atmosphere: '静寂', danger: '崩落', custom: 'keep-me' } }],
  objectTypes: [{
    code: 'door',
    name: '扉',
    description: '重い扉',
    schemaVersion: 1,
    stateSchema: {
      type: 'object', additionalProperties: false, required: ['open'],
      properties: { open: { type: 'boolean', title: '開いている', customSchema: true } },
    },
    defaultState: { open: false },
    publicProjection: { include: ['open'], customProjection: 'keep-me' },
    actions: [{
      code: 'open', label: '開ける', description: '扉を開ける', visibility: 'ai-choice', executionMode: 'rule',
      argumentSchema: { type: 'object', additionalProperties: false, properties: { key: { type: 'string', title: '鍵' } }, required: ['key'] },
      availabilityCondition: { op: 'eq', path: 'state.open', value: false },
    }],
  }],
  objects: [{
    code: 'north-door', name: '北の扉', objectTypeCode: 'door', locationCode: 'hall', initialStateOverride: { open: false }, isGlobal: false,
    actionRules: [{
      actionCode: 'open', condition: { op: 'eq', path: 'state.open', value: false }, priority: 100, authoringNote: '通常結果',
      effects: [
        { type: 'set-state', path: 'state.open', value: true },
        { type: 'emit-fact', text: '扉が開いた' },
        { type: 'set-session-flag', flag: 'opened', value: true },
      ],
      moduleBinding: { moduleId: 'module', version: '1.0.0', digest: 'sha256:test', configuration: { mode: 'safe' } },
    }],
  }],
};

describe('scenario rule-data adapters', () => {
  it('maps canonical rule data into the editor model', () => {
    const form = canonicalRuleDataToForm(canonicalFixture);

    expect(form.objectTypes[0].stateFields[0]).toMatchObject({ code: 'open', label: '開いている', valueType: 'boolean', defaultValue: 'false', visibility: 'public' });
    expect(form.objectTypes[0].actions[0]).toMatchObject({ availability: 'state-equals', availabilityStateCode: 'open' });
    expect(form.objectTypes[0].actions[0].argumentFields[0]).toMatchObject({ code: 'key', label: '鍵', required: true });
    expect(form.objects[0].actionResults[0].effects).toHaveLength(2);
  });

  it('preserves locations, objects, action results, and unsupported canonical data while editing a type', () => {
    const form = canonicalRuleDataToForm(structuredClone(canonicalFixture));
    form.objectTypes[0].name = '封印された扉';

    const request = formRuleDataToCanonical(form);

    expect(request.objectTypes[0].name).toBe('封印された扉');
    expect(request.locations[0]).toMatchObject({ code: 'hall', authoringData: { atmosphere: '静寂', danger: '崩落', custom: 'keep-me' } });
    expect(request.objectTypes[0].stateSchema.properties).toMatchObject({ open: { type: 'boolean', title: '開いている', customSchema: true } });
    expect(request.objectTypes[0].publicProjection).toMatchObject({ include: ['open'], customProjection: 'keep-me' });
    expect(request.objects[0]).toMatchObject({ code: 'north-door', locationCode: 'hall', initialStateOverride: { open: false } });
    expect(request.objects[0].actionRules[0].condition).toEqual({ op: 'eq', path: 'state.open', value: false });
    expect(request.objects[0].actionRules[0].effects).toContainEqual({ type: 'set-session-flag', flag: 'opened', value: true });
    expect(request.objects[0].actionRules[0].moduleBinding).toEqual(canonicalFixture.objects[0].actionRules[0].moduleBinding);
  });
});
