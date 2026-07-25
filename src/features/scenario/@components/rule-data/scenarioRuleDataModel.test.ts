import { describe, expect, it } from 'vitest';
import { completeDoorRuleDataFixture } from '../../../../stories/scenario-registration-page/scenarioRegistrationFixtures';
import {
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

  it('blocks deletion while objects reference a type or location', () => {
    expect(dependencyMessageForType(completeDoorRuleDataFixture, 'archive-door')).toContain('北書庫の扉');
    expect(dependencyMessageForLocation(completeDoorRuleDataFixture, 'sunken-library')).toContain('北書庫の扉');
    expect(dependencyMessageForType(emptyScenarioRuleData, 'missing')).toBeNull();
  });
});
