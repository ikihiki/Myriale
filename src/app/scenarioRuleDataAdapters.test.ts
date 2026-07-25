import { describe, expect, it } from 'vitest';
import type { CanonicalScenarioRuleDataResponse } from './scenarioApi';
import { canonicalRuleDataToForm, formRuleDataToCanonical } from './scenarioRuleDataAdapters';

const canonicalFixture: CanonicalScenarioRuleDataResponse = {
  scenarioId: 'SCN-1',
  definitionVersionId: 'SDV-1',
  version: 2,
  status: 'draft',
  schemaVersion: 2,
  updatedAt: '2026-07-24T00:00:00Z',
  publishedAt: null,
  locations: [{ code: 'hall', name: '広間', description: '', authoringData: { atmosphere: '静寂', danger: '崩落', custom: 'keep-me' } }, { code: 'outside', name: '屋外', description: '', authoringData: {} }],
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
    code: 'north-door', name: '北の扉', mixinTypeCodes: ['door'], stateSchema: { type: 'object', additionalProperties: false, properties: {}, required: [] }, defaultState: {}, publicProjection: { include: [] }, actions: [], locationCode: 'hall', initialStateOverride: { open: false }, isGlobal: false,
    actionRules: [{
      actionCode: 'open', condition: { op: 'eq', path: 'state.open', value: false }, priority: 100, authoringNote: '通常結果',
      effects: [
        { type: 'set-state', path: 'state.open', value: true },
        { type: 'emit-fact', text: '扉が開いた' },
        { type: 'move-session', locationCode: 'outside' },
        { type: 'set-session-flag', flag: 'opened', value: true },
      ],
      moduleBinding: { moduleId: 'module', version: '1.0.0', digest: 'sha256:test', configuration: { mode: 'safe' } },
    }],
  }],
};

describe('scenario rule-data adapters', () => {
  it('rejects top-level schema version 1', () => {
    expect(() => canonicalRuleDataToForm({ ...canonicalFixture, schemaVersion: 1 })).toThrow('Unsupported scenario rule schema version: 1');
  });

  it('maps canonical rule data into the editor model', () => {
    const form = canonicalRuleDataToForm(canonicalFixture);

    expect(form.objectTypes[0].stateFields[0]).toMatchObject({ code: 'open', label: '開いている', valueType: 'boolean', defaultValue: 'false', visibility: 'public' });
    expect(form.objectTypes[0].actions[0]).toMatchObject({ availability: 'state-equals', availabilityStateCode: 'open' });
    expect(form.objectTypes[0].actions[0].argumentFields[0]).toMatchObject({ code: 'key', label: '鍵', required: true });
    expect(form.objects[0].actionResults[0].effects).toHaveLength(4);
    expect(form.objects[0].actionResults[0].effects[2]).toMatchObject({ kind: 'move-session', locationCode: 'outside' });
    expect(form.objects[0].actionResults[0].effects[3]).toMatchObject({ kind: 'unsupported', type: 'set-session-flag' });
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
    expect(request.objects[0].actionRules[0].effects).toContainEqual({ type: 'move-session', locationCode: 'outside' });
    expect(request.objects[0].actionRules[0].effects).toContainEqual({ type: 'set-session-flag', flag: 'opened', value: true });
    expect(request.objects[0].actionRules[0].moduleBinding).toEqual(canonicalFixture.objects[0].actionRules[0].moduleBinding);
  });

  it('round-trips all west-door effects and unsupported effects in their exact order', () => {
    const fixture = structuredClone(canonicalFixture);
    fixture.objects[0].actionRules[0].effects = [
      { type: 'set-state', path: 'state.open', value: true },
      { type: 'move-session', locationCode: 'outside' },
      { type: 'emit-fact', text: '西の扉が開いた。' },
      { type: 'set-session-flag', flag: 'opaque-middle', value: true },
      { type: 'emit-fact', text: 'プレイヤーは外へ出た。' },
      { type: 'emit-event', event: 'session-moved', locationCode: 'outside' },
      { type: 'add-narrative-hint', text: '冷たい夜風を描写する。' },
      { type: 'forbid-narrative-fact', text: 'まだ室内にいる' },
      { type: 'forbid-narrative-fact', text: '扉は閉じたまま' },
    ];

    const form = canonicalRuleDataToForm(fixture);
    expect(form.objects[0].actionResults[0].effects.map((effect) => effect.kind)).toEqual([
      'set-state', 'move-session', 'emit-fact', 'unsupported', 'emit-fact', 'emit-event', 'add-narrative-hint', 'forbid-narrative-fact', 'forbid-narrative-fact',
    ]);
    expect(formRuleDataToCanonical(form).objects[0].actionRules[0].effects).toEqual(fixture.objects[0].actionRules[0].effects);
  });

  it('round-trips ordered mixins, Object local configuration, and Type generic rules', () => {
    const fixture = structuredClone(canonicalFixture);
    fixture.schemaVersion = 2;
    fixture.objectTypes.push({
      code: 'exit', name: '出口', description: '', schemaVersion: 1,
      stateSchema: { type: 'object', additionalProperties: false, properties: {} }, defaultState: {}, publicProjection: { include: [] },
      actions: [{ code: 'leave', label: '出る', description: '', argumentSchema: {}, availabilityCondition: {}, visibility: 'ai-choice', executionMode: 'rule' }],
      actionRules: [{ actionCode: 'leave', condition: {}, priority: 10, authoringNote: 'generic', effects: [{ type: 'emit-fact', text: '外へ出た' }], moduleBinding: null }],
    });
    fixture.objects[0] = {
      ...fixture.objects[0], mixinTypeCodes: ['door', 'exit'],
      stateSchema: { type: 'object', additionalProperties: false, properties: { direction: { type: 'string', title: '方向' } } },
      defaultState: { direction: 'north' }, publicProjection: { include: ['direction'] },
      actions: [{ code: 'inspect', label: '調べる', description: '', argumentSchema: {}, availabilityCondition: {}, visibility: 'ai-choice', executionMode: 'rule' }],
    };

    const request = formRuleDataToCanonical(canonicalRuleDataToForm(fixture));

    expect(request.schemaVersion).toBe(2);
    expect(request.objects[0].mixinTypeCodes).toEqual(['door', 'exit']);
    expect(request.objects[0].defaultState).toEqual({ direction: 'north' });
    expect(request.objects[0].actions?.[0].code).toBe('inspect');
    expect(request.objectTypes[1].actionRules?.[0].authoringNote).toBe('generic');
  });
});
