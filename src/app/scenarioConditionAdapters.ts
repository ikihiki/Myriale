import type { ScenarioCondition, ScenarioConditionScalar, ScenarioConditionSource, ScenarioConditionValueType, ScenarioJsonObject, ScenarioJsonValue } from './scenarioApi';

const comparisonOperators = new Set(['eq', 'ne', 'lt', 'lte', 'gt', 'gte']);
const objectOf = (value: ScenarioJsonValue | undefined): ScenarioJsonObject | null => value && typeof value === 'object' && !Array.isArray(value) ? value : null;

function splitPath(path: unknown): { source: ScenarioConditionSource; path: string } | null {
  if (typeof path !== 'string') return null;
  for (const source of ['session.flags', 'arguments', 'state'] as const) {
    const prefix = `${source}.`;
    if (path.startsWith(prefix) && path.length > prefix.length) return { source, path: path.slice(prefix.length) };
  }
  return null;
}

function scalar(value: ScenarioJsonValue | undefined): { valueType: ScenarioConditionValueType; value: ScenarioConditionScalar } | null {
  if (typeof value === 'string') return { valueType: 'string', value };
  if (typeof value === 'number' && Number.isFinite(value)) return { valueType: 'number', value };
  if (typeof value === 'boolean') return { valueType: 'boolean', value };
  return null;
}

export function conditionFromCanonical(canonical: ScenarioJsonObject): ScenarioCondition {
  const keys = Object.keys(canonical);
  if (keys.length === 0) return { kind: 'always' };
  const groupValue = keys.length === 1 && (keys[0] === 'and' || keys[0] === 'or') ? canonical[keys[0]] : undefined;
  if (keys.length === 1 && (keys[0] === 'and' || keys[0] === 'or') && Array.isArray(groupValue)) {
    const children = groupValue.map(objectOf);
    if (children.some((child) => !child)) return { kind: 'unsupported', canonical: structuredClone(canonical) };
    return { kind: 'group', operator: keys[0], children: children.map((child) => conditionFromCanonical(child!)) };
  }
  if (keys.length === 1 && keys[0] === 'not') {
    const child = objectOf(canonical.not);
    return child ? { kind: 'not', child: conditionFromCanonical(child) } : { kind: 'unsupported', canonical: structuredClone(canonical) };
  }
  const op = canonical.op;
  const path = splitPath(canonical.path);
  if (!path || typeof op !== 'string') return { kind: 'unsupported', canonical: structuredClone(canonical) };
  if (op === 'exists' && keys.every((key) => ['op', 'path'].includes(key))) return { kind: 'exists', ...path };
  if (op === 'in' && Array.isArray(canonical.value) && canonical.value.length > 0) {
    const parsed = canonical.value.map(scalar);
    if (parsed.every(Boolean) && parsed.every((item) => item!.valueType === parsed[0]!.valueType)) return { kind: 'in', ...path, valueType: parsed[0]!.valueType, values: parsed.map((item) => item!.value) };
  }
  const parsed = scalar(canonical.value);
  if (comparisonOperators.has(op) && parsed) return { kind: 'comparison', operator: op as Extract<ScenarioCondition, { kind: 'comparison' }>['operator'], ...path, ...parsed };
  return { kind: 'unsupported', canonical: structuredClone(canonical) };
}

export function conditionToCanonical(condition: ScenarioCondition): ScenarioJsonObject {
  if (condition.kind === 'always') return {};
  if (condition.kind === 'unsupported') return structuredClone(condition.canonical);
  if (condition.kind === 'group') return { [condition.operator]: condition.children.map(conditionToCanonical) };
  if (condition.kind === 'not') return { not: conditionToCanonical(condition.child) };
  const path = `${condition.source}.${condition.path}`;
  if (condition.kind === 'exists') return { op: 'exists', path };
  if (condition.kind === 'in') return { op: 'in', path, value: [...condition.values] };
  return { op: condition.operator, path, value: condition.value };
}

export function conditionSummary(condition: ScenarioCondition): string {
  if (condition.kind === 'always') return '常に成立';
  if (condition.kind === 'unsupported') return '未対応の条件（内容を保持）';
  if (condition.kind === 'not') return `NOT (${conditionSummary(condition.child)})`;
  if (condition.kind === 'group') return condition.children.map(conditionSummary).join(condition.operator === 'and' ? ' かつ ' : ' または ') || `${condition.operator.toUpperCase()}（子条件なし）`;
  const subject = `${condition.source}.${condition.path}`;
  if (condition.kind === 'exists') return `${subject} が存在する`;
  if (condition.kind === 'in') return `${subject} が [${condition.values.join(', ')}] のいずれか`;
  return `${subject} ${condition.operator} ${String(condition.value)}`;
}

export const createCondition = (): ScenarioCondition => ({ kind: 'comparison', operator: 'eq', source: 'state', path: '', valueType: 'string', value: '' });
