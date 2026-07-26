import { describe, expect, it } from 'vitest';
import type { ScenarioJsonObject } from './scenarioApi';
import { conditionFromCanonical, conditionSummary, conditionToCanonical } from './scenarioConditionAdapters';

const cases: ScenarioJsonObject[] = [
  {},
  { op: 'eq', path: 'state.open', value: false },
  { op: 'ne', path: 'arguments.key', value: 'red' },
  { op: 'lt', path: 'state.count', value: 1 },
  { op: 'lte', path: 'state.count', value: 2 },
  { op: 'gt', path: 'state.count', value: 3 },
  { op: 'gte', path: 'state.count', value: 4 },
  { op: 'in', path: 'session.flags.mode', value: ['safe', 'fast'] },
  { op: 'exists', path: 'session.flags.seen' },
  { and: [{ op: 'eq', path: 'state.open', value: false }, { or: [{ op: 'exists', path: 'arguments.key' }, { not: { op: 'eq', path: 'session.flags.locked', value: true } }] }] },
];

describe('scenario condition adapters', () => {
  it.each(cases)('round-trips a supported canonical AST %#', (canonical) => {
    expect(conditionToCanonical(conditionFromCanonical(canonical))).toEqual(canonical);
  });

  it.each(([
    { op: 'future', path: 'state.open', value: true },
    { and: [{ op: 'eq', path: 'state.open', value: false }, 42] },
    { op: 'eq', path: 'world.open', value: false },
  ] as ScenarioJsonObject[]))('preserves unsupported AST losslessly %#', (canonical) => {
    const parsed = conditionFromCanonical(canonical);
    expect(parsed.kind).toBe('unsupported');
    expect(conditionToCanonical(parsed)).toEqual(canonical);
  });

  it('summarizes nested supported and unsupported conditions for human-readable views', () => {
    expect(conditionSummary(conditionFromCanonical(cases[9]))).toBe('state.open eq false かつ arguments.key が存在する または NOT (session.flags.locked eq true)');
    expect(conditionSummary(conditionFromCanonical({ op: 'future', path: 'state.open' }))).toBe('未対応の条件（内容を保持）');
  });
});
