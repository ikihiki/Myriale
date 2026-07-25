import { describe, expect, it } from 'vitest';
import { completeDoorRuleDataFixture, westDoorAuthoringFixture } from '../../../../stories/scenario-registration-page/scenarioRegistrationFixtures';
import {
  createActionRule,
  dependencyMessageForLocation,
  dependencyMessageForType,
  dependencyMessageForTypeRule,
  effectiveObjectRules,
  emptyScenarioRuleData,
  filterObjectTypesForMixin,
  renameTypeActionCode,
  renameTypeRuleCode,
  validateScenarioRuleData,
} from './scenarioRuleDataModel';

describe('scenario rule-data authoring model', () => {
  it('accepts strict generic rules and object adjust operations', () => {
    expect(validateScenarioRuleData(completeDoorRuleDataFixture)).toEqual([]);
  });

  it('requires stable codes for every Type generic rule', () => {
    const fixture = structuredClone(completeDoorRuleDataFixture);
    fixture.objectTypes[0].actionRules[0].code = '';
    expect(validateScenarioRuleData(fixture)).toContainEqual(expect.objectContaining({ path: 'ruleData.objectTypes[0].actionRules[0].code', severity: 'error' }));
  });

  it('resolves inherited, overridden, adjusted, deleted, and local add states', () => {
    const fixture = structuredClone(westDoorAuthoringFixture);
    const object = fixture.objects[0];
    let effective = effectiveObjectRules(fixture, object);
    expect(effective.map((entry) => [entry.rule.code, entry.state])).toEqual(expect.arrayContaining([
      ['generic-open', 'inherited'], ['generic-open-and-exit', 'overridden'], ['west-inspect-exit', 'added'],
    ]));
    object.actionRules.push({ operation: 'adjust', targetTypeCode: 'openable', targetRuleCode: 'generic-open', adjustments: { priority: 250 } });
    effective = effectiveObjectRules(fixture, object);
    expect(effective.find((entry) => entry.key === 'openable:generic-open')).toMatchObject({ state: 'adjusted', rule: { priority: 250 } });
    object.actionRules[2] = { operation: 'delete', targetTypeCode: 'openable', targetRuleCode: 'generic-open' };
    expect(effectiveObjectRules(fixture, object).find((entry) => entry.key === 'openable:generic-open')?.state).toBe('deleted');
  });

  it('keeps sparse adjust fields inherited', () => {
    const fixture = structuredClone(completeDoorRuleDataFixture);
    const effective = effectiveObjectRules(fixture, fixture.objects[0])[0];
    expect(effective.rule.priority).toBe(100);
    expect(effective.rule.condition).toEqual({ op: 'eq', path: 'state.open', value: false });
    expect(effective.rule.effects).toHaveLength(2);
  });

  it('cascades Type action and rule code renames into dependent operations', () => {
    const actionRenamed = renameTypeActionCode(westDoorAuthoringFixture, 'exit-door', 'open-and-exit', 'leave-through-door');
    expect(actionRenamed.objectTypes[1].actionRules[0].actionCode).toBe('leave-through-door');
    const override = actionRenamed.objects[0].actionRules[0];
    expect(override.operation === 'override' && override.rule.actionCode).toBe('leave-through-door');

    const ruleRenamed = renameTypeRuleCode(actionRenamed, 'exit-door', 'generic-open-and-exit', 'generic-leave');
    const target = ruleRenamed.objects[0].actionRules[0];
    expect(target.operation !== 'add' && target.targetRuleCode).toBe('generic-leave');
  });

  it('blocks deleting a Type generic rule while Object operations target it', () => {
    expect(dependencyMessageForTypeRule(westDoorAuthoringFixture, 'exit-door', 'generic-open-and-exit')).toContain('西の扉');
    expect(dependencyMessageForTypeRule(westDoorAuthoringFixture, 'openable', 'generic-open')).toBeNull();
  });

  it('validates operation targets and known effect fields', () => {
    const fixture = structuredClone(completeDoorRuleDataFixture);
    fixture.objects[0].actionRules.push({ operation: 'delete', targetTypeCode: 'missing', targetRuleCode: 'missing' });
    fixture.objectTypes[0].actionRules[0].effects.push({ kind: 'emit-event', event: '', locationCode: 'missing' });
    const paths = validateScenarioRuleData(fixture).map((issue) => issue.path);
    expect(paths).toContain('ruleData.objects[0].actionRules[1]');
    expect(paths).toContain('ruleData.objectTypes[0].actionRules[0].effects[1].event');
  });

  it('filters Type mixin candidates by name, stable code, and description without case sensitivity', () => {
    expect(filterObjectTypesForMixin(westDoorAuthoringFixture.objectTypes, '開閉可能')).toEqual([westDoorAuthoringFixture.objectTypes[0]]);
    expect(filterObjectTypesForMixin(westDoorAuthoringFixture.objectTypes, 'EXIT-DOOR')).toEqual([westDoorAuthoringFixture.objectTypes[1]]);
    expect(filterObjectTypesForMixin(westDoorAuthoringFixture.objectTypes, '外へ出る')).toEqual([westDoorAuthoringFixture.objectTypes[1]]);
    expect(filterObjectTypesForMixin(westDoorAuthoringFixture.objectTypes, 'missing')).toEqual([]);
    expect(filterObjectTypesForMixin(westDoorAuthoringFixture.objectTypes, '  ')).toEqual(westDoorAuthoringFixture.objectTypes);
  });

  it('creates a required stable code for new rules', () => {
    expect(createActionRule('open')).toMatchObject({ actionCode: 'open', code: expect.stringMatching(/^rule-/), condition: {}, moduleBinding: null });
  });

  it('blocks deletion while objects reference a type or location', () => {
    expect(dependencyMessageForType(completeDoorRuleDataFixture, 'archive-door')).toContain('北書庫の扉');
    expect(dependencyMessageForLocation(completeDoorRuleDataFixture, 'sunken-library')).toContain('北書庫の扉');
    expect(dependencyMessageForType(emptyScenarioRuleData, 'missing')).toBeNull();
  });
});
