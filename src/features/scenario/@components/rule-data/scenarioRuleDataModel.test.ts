import { describe, expect, it } from 'vitest';
import { completeDoorRuleDataFixture } from '../../../../stories/scenario-registration-page/scenarioRegistrationFixtures';
import {
  createActionResult,
  dependencyMessageForLocation,
  dependencyMessageForType,
  emptyScenarioRuleData,
  validateScenarioRuleData,
} from './scenarioRuleDataModel';

describe('scenario rule-data authoring model', () => {
  it('accepts a complete deterministic object rule definition', () => {
    expect(validateScenarioRuleData(completeDoorRuleDataFixture)).toEqual([]);
  });

  it('keeps incomplete action results as draft warnings', () => {
    const fixture = structuredClone(completeDoorRuleDataFixture);
    fixture.objects[0].actionResults = [];

    expect(validateScenarioRuleData(fixture)).toContainEqual(expect.objectContaining({
      path: 'ruleData.objects[0].actionResults',
      severity: 'warning',
    }));
  });

  it('reports duplicate stable codes and ambiguous equal-priority results', () => {
    const fixture = structuredClone(completeDoorRuleDataFixture);
    fixture.locations.push({ ...fixture.locations[0], name: 'duplicate' });
    fixture.objects[0].actionResults.push({ ...fixture.objects[0].actionResults[0], code: 'duplicate-result' });

    const issues = validateScenarioRuleData(fixture);
    expect(issues.some((issue) => issue.message.includes('stable code') && issue.severity === 'error')).toBe(true);
    expect(issues.some((issue) => issue.message.includes('決定性') && issue.severity === 'error')).toBe(true);
  });

  it('validates event, referenced location, and narrative text fields', () => {
    const fixture = structuredClone(completeDoorRuleDataFixture);
    fixture.objects[0].actionResults[0].effects.push(
      { kind: 'emit-event', event: '', locationCode: 'missing' },
      { kind: 'emit-fact', text: '   ' },
      { kind: 'add-narrative-hint', text: '' },
      { kind: 'forbid-narrative-fact', text: '' },
    );

    const issues = validateScenarioRuleData(fixture);
    expect(issues.map((issue) => issue.path)).toEqual(expect.arrayContaining([
      'ruleData.objects[0].actionResults[0].effects[2].event',
      'ruleData.objects[0].actionResults[0].effects[2].locationCode',
      'ruleData.objects[0].actionResults[0].effects[3].text',
      'ruleData.objects[0].actionResults[0].effects[4].text',
      'ruleData.objects[0].actionResults[0].effects[5].text',
    ]));
  });

  it('requires an explicit action code when creating a rule', () => {
    const fixture = structuredClone(completeDoorRuleDataFixture);
    const result = createActionResult(fixture.objects[0], fixture, 'explicit-action');

    expect(result.actionCode).toBe('explicit-action');
  });

  it('reports orphan action and state references instead of hiding the rule', () => {
    const fixture = structuredClone(completeDoorRuleDataFixture);
    fixture.objects[0].actionResults[0].actionCode = 'missing-action';
    fixture.objects[0].actionResults[0].fromStateCode = 'missing-state';

    const issues = validateScenarioRuleData(fixture);
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'ruleData.objects[0].actionResults[0].actionCode', severity: 'error' }),
      expect.objectContaining({ path: 'ruleData.objects[0].actionResults[0].fromStateCode', severity: 'error' }),
    ]));
  });

  it('blocks deletion while objects reference a type or location', () => {
    expect(dependencyMessageForType(completeDoorRuleDataFixture, 'archive-door')).toContain('北書庫の扉');
    expect(dependencyMessageForLocation(completeDoorRuleDataFixture, 'sunken-library')).toContain('北書庫の扉');
    expect(dependencyMessageForType(emptyScenarioRuleData, 'missing')).toBeNull();
  });
});
