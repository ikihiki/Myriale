import { describe, expect, it } from 'vitest';
import type { CanonicalScenarioRuleDataResponse } from './scenarioApi';
import { canonicalRuleDataToForm, formRuleDataToCanonical } from './scenarioRuleDataAdapters';

const canonicalFixture: CanonicalScenarioRuleDataResponse = {
  scenarioId: 'SCN-1', definitionVersionId: 'SDV-1', version: 2, status: 'draft', schemaVersion: 2,
  updatedAt: '2026-07-24T00:00:00Z', publishedAt: null,
  locations: [{ code: 'hall', name: '広間', description: '', authoringData: { atmosphere: '静寂', danger: '崩落' } }, { code: 'outside', name: '屋外', description: '', authoringData: {} }],
  objectTypes: [{
    code: 'door', name: '扉', description: '重い扉', schemaVersion: 1,
    stateSchema: { type: 'object', additionalProperties: false, required: ['open'], properties: { open: { type: 'boolean', title: '開いている' } } },
    defaultState: { open: false }, publicProjection: { include: ['open'] },
    actions: [{ code: 'open', label: '開ける', description: '扉を開ける', visibility: 'ai-choice', executionMode: 'rule', argumentSchema: { type: 'object', additionalProperties: false, properties: {}, required: [] }, availabilityCondition: { op: 'eq', path: 'state.open', value: false } }],
    actionRules: [{ code: 'generic-open', actionCode: 'open', condition: { op: 'eq', path: 'state.open', value: false }, priority: 50, authoringNote: 'generic', effects: [{ type: 'set-state', path: 'state.open', value: true }], moduleBinding: null }],
  }],
  objects: [{
    code: 'north-door', name: '北の扉', mixinTypeCodes: ['door'], stateSchema: { type: 'object', additionalProperties: false, properties: {}, required: [] }, defaultState: {}, publicProjection: { include: [] }, actions: [], locationCode: 'hall', initialStateOverride: { open: false }, isGlobal: false,
    actionRules: [{
      operation: 'override', targetTypeCode: 'door', targetRuleCode: 'generic-open',
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

  it('maps strict generic rules and object operations into the editor model', () => {
    const form = canonicalRuleDataToForm(canonicalFixture);
    expect(form.objectTypes[0].actionRules[0]).toMatchObject({ code: 'generic-open', actionCode: 'open', priority: 50 });
    expect(form.objects[0].actionRules[0]).toMatchObject({ operation: 'override', targetTypeCode: 'door', targetRuleCode: 'generic-open' });
    const operation = form.objects[0].actionRules[0];
    expect(operation.operation === 'override' && operation.rule.effects[3]).toMatchObject({ kind: 'unsupported', type: 'set-session-flag' });
  });

  it('round-trips strict known operation shapes and preserves unknown effects losslessly', () => {
    const request = formRuleDataToCanonical(canonicalRuleDataToForm(structuredClone(canonicalFixture)));
    expect(request.objectTypes[0].actionRules[0]).toEqual(canonicalFixture.objectTypes[0].actionRules[0]);
    expect(request.objects[0].actionRules[0]).toEqual(canonicalFixture.objects[0].actionRules[0]);
    expect(request.objects[0].actionRules[0]).not.toHaveProperty('code');
    expect(request.objects[0].actionRules[0]).not.toHaveProperty('rule');
  });

  it('round-trips add, delete, and sparse adjust without adding inherited fields', () => {
    const fixture = structuredClone(canonicalFixture);
    fixture.objects[0].actionRules = [
      { operation: 'add', code: 'local-inspect', actionCode: 'open', condition: {}, priority: 1, authoringNote: null, effects: [{ type: 'emit-fact', text: '見た' }], moduleBinding: null },
      { operation: 'delete', targetTypeCode: 'door', targetRuleCode: 'generic-open' },
      { operation: 'adjust', targetTypeCode: 'door', targetRuleCode: 'generic-open', priority: 200, effects: [{ type: 'set-session-flag', flag: 'opaque', value: true }] },
    ];
    const request = formRuleDataToCanonical(canonicalRuleDataToForm(fixture));
    expect(request.objects[0].actionRules).toEqual(fixture.objects[0].actionRules);
    expect(request.objects[0].actionRules[2]).not.toHaveProperty('condition');
    expect(request.objects[0].actionRules[2]).not.toHaveProperty('moduleBinding');
  });

  it('emits strict known effect fields instead of compatibility extras', () => {
    const fixture = structuredClone(canonicalFixture);
    const operation = fixture.objects[0].actionRules[0];
    if (operation.operation !== 'override') throw new Error('fixture');
    operation.effects[0] = { type: 'set-state', path: 'state.open', value: true, legacyId: 'discard' };
    const form = canonicalRuleDataToForm(fixture);
    const request = formRuleDataToCanonical(form);
    const saved = request.objects[0].actionRules[0];
    expect(saved.operation === 'override' && saved.effects[0]).toEqual({ type: 'set-state', path: 'state.open', value: true });
  });
});
