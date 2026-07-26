import type {
  ScenarioActionRulePayload,
  ScenarioObjectRuleOperationPayload,
  ScenarioRuleDataPayload,
} from '../../../../app/scenarioApi';

export type ScenarioRuleData = ScenarioRuleDataPayload;
export type ScenarioObjectType = ScenarioRuleData['objectTypes'][number];
export type ScenarioStateField = ScenarioObjectType['stateFields'][number];
export type ScenarioTypeAction = ScenarioObjectType['actions'][number];
export type ScenarioLocation = ScenarioRuleData['locations'][number];
export type ScenarioObject = ScenarioRuleData['objects'][number];
export type ScenarioActionRule = ScenarioActionRulePayload;
export type ScenarioObjectRuleOperation = ScenarioObjectRuleOperationPayload;
export type ScenarioRuleEffect = ScenarioActionRule['effects'][number];

export const emptyScenarioRuleData: ScenarioRuleData = {
  schemaVersion: 2,
  locations: [],
  objectTypes: [],
  objects: [],
};

let authoringSequence = 0;
export function nextAuthoringCode(prefix: string) {
  authoringSequence += 1;
  return `${prefix}-${authoringSequence}`;
}

export function createObjectType(): ScenarioObjectType {
  const code = nextAuthoringCode('type');
  return { code, name: '新しい種類', description: '', schemaVersion: 1, stateFields: [], actions: [], actionRules: [] };
}

export function createStateField(): ScenarioStateField {
  return { code: nextAuthoringCode('state'), label: '新しい状態', valueType: 'boolean', defaultValue: 'false', visibility: 'public' };
}

export function createTypeAction(): ScenarioTypeAction {
  return {
    code: nextAuthoringCode('action'),
    label: '新しいアクション',
    description: '',
    visibility: 'ai-choice',
    availability: 'always',
    availabilityStateCode: '',
    argumentFields: [],
  };
}

export function createLocation(): ScenarioLocation {
  const code = nextAuthoringCode('location');
  return { code, name: '新しい場所', description: '', atmosphere: '', danger: '' };
}

export function createObject(ruleData: ScenarioRuleData): ScenarioObject {
  return {
    code: nextAuthoringCode('object'),
    name: '新しいオブジェクト',
    mixinTypeCodes: ruleData.objectTypes[0] ? [ruleData.objectTypes[0].code] : [],
    initialLocationCode: ruleData.locations[0]?.code ?? '',
    global: false,
    stateFields: [],
    actions: [],
    initialStateOverrides: [],
    actionRules: [],
  };
}

export function filterObjectTypesForMixin(types: ScenarioObjectType[], query: string): ScenarioObjectType[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return types;
  return types.filter((type) => [type.name, type.code, type.description]
    .some((field) => field.toLocaleLowerCase().includes(normalizedQuery)));
}

export function createActionRule(actionCode: string): ScenarioActionRule {
  return {
    code: nextAuthoringCode('rule'),
    actionCode,
    condition: {},
    priority: 100,
    note: '',
    effects: [],
    moduleBinding: null,
  };
}

export function createObjectAddRule(actionCode: string): Extract<ScenarioObjectRuleOperation, { operation: 'add' }> {
  return { operation: 'add', rule: createActionRule(actionCode) };
}

export type EffectiveObjectRule = {
  key: string;
  sourceTypeCode: string | null;
  source: string;
  state: 'inherited' | 'added' | 'overridden' | 'adjusted' | 'deleted';
  rule: ScenarioActionRule;
  operationIndex: number | null;
};

function targetKey(typeCode: string, ruleCode: string) {
  return `${typeCode}:${ruleCode}`;
}

export function effectiveObjectRules(ruleData: ScenarioRuleData, object: ScenarioObject): EffectiveObjectRule[] {
  const rules = new Map<string, EffectiveObjectRule>();
  object.mixinTypeCodes.forEach((typeCode) => {
    const type = ruleData.objectTypes.find((candidate) => candidate.code === typeCode);
    type?.actionRules.forEach((rule) => {
      const key = targetKey(typeCode, rule.code);
      rules.set(key, { key, sourceTypeCode: typeCode, source: type.name, state: 'inherited', rule: structuredClone(rule), operationIndex: null });
    });
  });
  object.actionRules.forEach((operation, operationIndex) => {
    if (operation.operation === 'add') {
      const key = `local:${operation.rule.code}`;
      rules.set(key, { key, sourceTypeCode: null, source: 'Object local', state: 'added', rule: structuredClone(operation.rule), operationIndex });
      return;
    }
    const key = targetKey(operation.targetTypeCode, operation.targetRuleCode);
    const inherited = rules.get(key);
    if (!inherited) return;
    if (operation.operation === 'delete') {
      rules.set(key, { ...inherited, state: 'deleted', operationIndex });
      return;
    }
    if (operation.operation === 'override') {
      rules.set(key, { ...inherited, state: 'overridden', rule: structuredClone(operation.rule), operationIndex });
      return;
    }
    rules.set(key, {
      ...inherited,
      state: 'adjusted',
      operationIndex,
      rule: {
        ...inherited.rule,
        ...('condition' in operation.adjustments ? { condition: structuredClone(operation.adjustments.condition ?? {}) } : {}),
        ...('priority' in operation.adjustments ? { priority: operation.adjustments.priority ?? inherited.rule.priority } : {}),
        ...('note' in operation.adjustments ? { note: operation.adjustments.note ?? '' } : {}),
        ...('effects' in operation.adjustments ? { effects: structuredClone(operation.adjustments.effects ?? []) } : {}),
        ...('moduleBinding' in operation.adjustments ? { moduleBinding: operation.adjustments.moduleBinding ? structuredClone(operation.adjustments.moduleBinding) : null } : {}),
      },
    });
  });
  return [...rules.values()];
}

export type RuleDataIssue = { path: string; message: string; severity: 'warning' | 'error' };

function actionRulesForOperation(operation: ScenarioObjectRuleOperation): ScenarioActionRule[] {
  return operation.operation === 'add' || operation.operation === 'override' ? [operation.rule] : [];
}

export function validateScenarioRuleData(ruleData: ScenarioRuleData): RuleDataIssue[] {
  const issues: RuleDataIssue[] = [];
  const duplicateCodes = (items: Array<{ code: string }>, path: string) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      const code = item.code.trim();
      if (!code) issues.push({ path: `${path}[${index}].code`, message: 'stable code を入力してください。', severity: 'error' });
      else if (seen.has(code)) issues.push({ path: `${path}[${index}].code`, message: `stable code「${code}」が重複しています。`, severity: 'error' });
      seen.add(code);
    });
  };
  const validateEffects = (effects: ScenarioRuleEffect[], path: string) => effects.forEach((effect, effectIndex) => {
    const effectPath = `${path}.effects[${effectIndex}]`;
    if (effect.kind === 'move-object' || effect.kind === 'move-session') {
      if (!effect.locationCode.trim() || !ruleData.locations.some((location) => location.code === effect.locationCode)) issues.push({ path: `${effectPath}.locationCode`, message: '移動先の場所を選択してください。', severity: 'error' });
    }
    if (effect.kind === 'move-object' && effect.targetObjectCode && !ruleData.objects.some((candidate) => candidate.code === effect.targetObjectCode)) issues.push({ path: `${effectPath}.targetObjectCode`, message: '移動するオブジェクトを選択してください。', severity: 'error' });
    if (effect.kind === 'emit-event') {
      if (!effect.event.trim()) issues.push({ path: `${effectPath}.event`, message: '記録する出来事の名前を入力してください。', severity: 'error' });
      if (effect.locationCode && !ruleData.locations.some((location) => location.code === effect.locationCode)) issues.push({ path: `${effectPath}.locationCode`, message: '出来事に関連する場所を選択してください。', severity: 'error' });
    }
    if ((effect.kind === 'emit-fact' || effect.kind === 'add-narrative-hint' || effect.kind === 'forbid-narrative-fact') && !effect.text.trim()) issues.push({ path: `${effectPath}.text`, message: '文章を入力してください。', severity: 'error' });
  });
  const validateRule = (rule: ScenarioActionRule, path: string, actions: ScenarioTypeAction[]) => {
    if (!rule.code.trim()) issues.push({ path: `${path}.code`, message: 'rule stable code を入力してください。', severity: 'error' });
    if (!actions.some((action) => action.code === rule.actionCode)) issues.push({ path: `${path}.actionCode`, message: `参照先のアクション「${rule.actionCode || '(未設定)'}」が見つかりません。`, severity: 'error' });
    validateEffects(rule.effects, path);
  };

  duplicateCodes(ruleData.locations, 'ruleData.locations');
  duplicateCodes(ruleData.objectTypes, 'ruleData.objectTypes');
  duplicateCodes(ruleData.objects, 'ruleData.objects');

  ruleData.objectTypes.forEach((type, typeIndex) => {
    duplicateCodes(type.stateFields, `ruleData.objectTypes[${typeIndex}].stateFields`);
    duplicateCodes(type.actions, `ruleData.objectTypes[${typeIndex}].actions`);
    duplicateCodes(type.actionRules, `ruleData.objectTypes[${typeIndex}].actionRules`);
    type.actionRules.forEach((rule, ruleIndex) => validateRule(rule, `ruleData.objectTypes[${typeIndex}].actionRules[${ruleIndex}]`, type.actions));
  });

  ruleData.objects.forEach((object, objectIndex) => {
    if (new Set(object.mixinTypeCodes).size !== object.mixinTypeCodes.length) issues.push({ path: `ruleData.objects[${objectIndex}].mixinTypeCodes`, message: '同じ種類を複数回mixinできません。', severity: 'error' });
    object.mixinTypeCodes.forEach((code) => { if (!ruleData.objectTypes.some((type) => type.code === code)) issues.push({ path: `ruleData.objects[${objectIndex}].mixinTypeCodes`, message: `参照する種類「${code}」が見つかりません。`, severity: 'error' }); });
    const resolved = resolvedObjectConfiguration(ruleData, object);
    resolved.conflicts.forEach((conflict) => issues.push({ path: `ruleData.objects[${objectIndex}].${conflict.kind === 'state' ? 'stateFields' : 'actions'}`, message: `定義が競合しています: ${conflict.message}`, severity: 'error' }));
    if (!object.global && !ruleData.locations.some((location) => location.code === object.initialLocationCode)) issues.push({ path: `ruleData.objects[${objectIndex}].initialLocationCode`, message: '初期配置する場所を選択してください。', severity: 'error' });
    resolved.actions.forEach((action) => {
      if (action.availability === 'state-equals' && !resolved.stateFields.some((state) => state.code === action.availabilityStateCode)) issues.push({ path: `ruleData.objects[${objectIndex}].actions`, message: 'アクション提示条件で参照する状態が見つかりません。', severity: 'error' });
      if (!effectiveObjectRules(ruleData, object).some((entry) => entry.state !== 'deleted' && entry.rule.actionCode === action.code)) issues.push({ path: `ruleData.objects[${objectIndex}].actionRules`, message: `「${action.label}」の実行ルールが未設定です。`, severity: 'warning' });
    });
    const localRuleCodes = new Set<string>();
    const mutatedTargets = new Set<string>();
    object.actionRules.forEach((operation, operationIndex) => {
      const path = `ruleData.objects[${objectIndex}].actionRules[${operationIndex}]`;
      actionRulesForOperation(operation).forEach((rule) => validateRule(rule, `${path}.rule`, resolved.actions));
      if (operation.operation === 'add') {
        if (localRuleCodes.has(operation.rule.code)) issues.push({ path: `${path}.rule.code`, message: 'Object local add ruleのstable codeが重複しています。', severity: 'error' });
        localRuleCodes.add(operation.rule.code);
      } else {
        const targetKeyValue = targetKey(operation.targetTypeCode, operation.targetRuleCode);
        if (mutatedTargets.has(targetKeyValue)) issues.push({ path, message: '同じ継承ruleへ複数のoperationは指定できません。', severity: 'error' });
        mutatedTargets.add(targetKeyValue);
        const targetType = ruleData.objectTypes.find((type) => type.code === operation.targetTypeCode);
        const targetRule = targetType?.actionRules.find((rule) => rule.code === operation.targetRuleCode);
        if (!object.mixinTypeCodes.includes(operation.targetTypeCode) || !targetRule) issues.push({ path, message: '対象のType generic ruleが見つかりません。', severity: 'error' });
        if (operation.operation === 'override' && targetRule && operation.rule.actionCode !== targetRule.actionCode) issues.push({ path: `${path}.rule.actionCode`, message: 'overrideのActionは継承元と一致させてください。', severity: 'error' });
      }
      if (operation.operation === 'adjust') {
        if (Object.keys(operation.adjustments).length === 0) issues.push({ path, message: 'adjustするfieldを1つ以上選択してください。', severity: 'error' });
        if (operation.adjustments.effects) validateEffects(operation.adjustments.effects, `${path}.adjustments`);
      }
    });
  });
  return issues;
}

export function dependencyMessageForType(ruleData: ScenarioRuleData, code: string) {
  const dependent = ruleData.objects.find((object) => object.mixinTypeCodes.includes(code));
  return dependent ? `「${dependent.name}」が参照しています。先に種類を変更するかオブジェクトを削除してください。` : null;
}

export function dependencyMessageForLocation(ruleData: ScenarioRuleData, code: string) {
  const dependent = ruleData.objects.find((object) => !object.global && object.initialLocationCode === code);
  return dependent ? `「${dependent.name}」が配置されています。先に配置先を変更するかオブジェクトを削除してください。` : null;
}

export function dependencyMessageForTypeRule(ruleData: ScenarioRuleData, typeCode: string, ruleCode: string) {
  const dependent = ruleData.objects.find((object) => object.actionRules.some((operation) => operation.operation !== 'add' && operation.targetTypeCode === typeCode && operation.targetRuleCode === ruleCode));
  return dependent ? `「${dependent.name}」のObject rule operationが参照しています。先にObject側のoverride / delete / adjustを削除してください。` : null;
}

export function renameTypeRuleCode(ruleData: ScenarioRuleData, typeCode: string, previousCode: string, nextCode: string): ScenarioRuleData {
  return {
    ...ruleData,
    objectTypes: ruleData.objectTypes.map((type) => type.code === typeCode ? { ...type, actionRules: type.actionRules.map((rule) => rule.code === previousCode ? { ...rule, code: nextCode } : rule) } : type),
    objects: ruleData.objects.map((object) => ({
      ...object,
      actionRules: object.actionRules.map((operation) => operation.operation !== 'add' && operation.targetTypeCode === typeCode && operation.targetRuleCode === previousCode
        ? operation.operation === 'override'
          ? { ...operation, targetRuleCode: nextCode, rule: { ...operation.rule, code: nextCode } }
          : { ...operation, targetRuleCode: nextCode }
        : operation),
    })),
  };
}

export function renameTypeActionCode(ruleData: ScenarioRuleData, typeCode: string, previousCode: string, nextCode: string): ScenarioRuleData {
  return {
    ...ruleData,
    objectTypes: ruleData.objectTypes.map((type) => type.code === typeCode ? {
      ...type,
      actions: type.actions.map((action) => action.code === previousCode ? { ...action, code: nextCode } : action),
      actionRules: type.actionRules.map((rule) => rule.actionCode === previousCode ? { ...rule, actionCode: nextCode } : rule),
    } : type),
    objects: ruleData.objects.map((object) => !object.mixinTypeCodes.includes(typeCode) ? object : {
      ...object,
      actionRules: object.actionRules.map((operation) => operation.operation === 'add' || operation.operation === 'override'
        ? { ...operation, rule: operation.rule.actionCode === previousCode ? { ...operation.rule, actionCode: nextCode } : operation.rule }
        : operation),
    }),
  };
}

export type ResolvedConfigurationSource = {
  kind: 'mixin' | 'local';
  code: string;
  name: string;
  rank: number;
};

export type ResolvedConfigurationConflict = {
  kind: 'state' | 'action';
  code: string;
  sources: ResolvedConfigurationSource[];
  message: string;
};

export type ResolvedStateField = ScenarioStateField & {
  source: string;
  sourceRank: number;
  sources: ResolvedConfigurationSource[];
  inherited: boolean;
  localIndex: number | null;
  baseInitialValue: string;
  effectiveInitialValue: string;
  hasInitialOverride: boolean;
  conflict: ResolvedConfigurationConflict | null;
};

export type ResolvedAction = ScenarioTypeAction & {
  source: string;
  sourceRank: number;
  sources: ResolvedConfigurationSource[];
  inherited: boolean;
  localIndex: number | null;
  conflict: ResolvedConfigurationConflict | null;
};

function sameStateContract(left: ScenarioStateField, right: ScenarioStateField) {
  return left.code === right.code && left.label === right.label && left.valueType === right.valueType;
}

function sameActionContract(left: ScenarioTypeAction, right: ScenarioTypeAction) {
  return left.code === right.code
    && left.label === right.label
    && left.description === right.description
    && left.visibility === right.visibility
    && left.availability === right.availability
    && left.availabilityStateCode === right.availabilityStateCode
    && JSON.stringify(left.argumentFields) === JSON.stringify(right.argumentFields);
}

export function resolvedObjectConfiguration(ruleData: ScenarioRuleData, object: ScenarioObject) {
  type StateAccumulator = { value: ScenarioStateField; sources: ResolvedConfigurationSource[]; localIndex: number | null; conflict: ResolvedConfigurationConflict | null };
  type ActionAccumulator = { value: ScenarioTypeAction; sources: ResolvedConfigurationSource[]; localIndex: number | null; conflict: ResolvedConfigurationConflict | null };
  const stateFields = new Map<string, StateAccumulator>();
  const actions = new Map<string, ActionAccumulator>();
  const conflicts: ResolvedConfigurationConflict[] = [];
  const sources = [
    ...object.mixinTypeCodes.map((code) => ruleData.objectTypes.find((type) => type.code === code)).filter((value): value is ScenarioObjectType => Boolean(value)).map((type, rank) => ({ value: type, source: { kind: 'mixin' as const, code: type.code, name: type.name, rank } })),
    { value: object, source: { kind: 'local' as const, code: object.code, name: object.name, rank: object.mixinTypeCodes.length } },
  ];

  sources.forEach(({ value: sourceValue, source }) => {
    sourceValue.stateFields.forEach((field, localIndex) => {
      const previous = stateFields.get(field.code);
      if (!previous) {
        stateFields.set(field.code, { value: structuredClone(field), sources: [source], localIndex: source.kind === 'local' ? localIndex : null, conflict: null });
        return;
      }
      const contributors = [...previous.sources, source];
      if (!sameStateContract(previous.value, field)) {
        const conflict = { kind: 'state' as const, code: field.code, sources: contributors, message: `state ${field.code}: ${contributors.map((item) => item.name).join(' / ')}` };
        conflicts.push(conflict);
        stateFields.set(field.code, { ...previous, sources: contributors, localIndex: source.kind === 'local' ? localIndex : previous.localIndex, conflict });
        return;
      }
      // The backend resolver applies compatible mixins in order: later default/visibility wins.
      stateFields.set(field.code, { value: structuredClone(field), sources: contributors, localIndex: source.kind === 'local' ? localIndex : previous.localIndex, conflict: previous.conflict });
    });
    sourceValue.actions.forEach((action, localIndex) => {
      const previous = actions.get(action.code);
      if (!previous) {
        actions.set(action.code, { value: structuredClone(action), sources: [source], localIndex: source.kind === 'local' ? localIndex : null, conflict: null });
        return;
      }
      const contributors = [...previous.sources, source];
      if (!sameActionContract(previous.value, action)) {
        const conflict = { kind: 'action' as const, code: action.code, sources: contributors, message: `action ${action.code}: ${contributors.map((item) => item.name).join(' / ')}` };
        conflicts.push(conflict);
        actions.set(action.code, { ...previous, sources: contributors, localIndex: source.kind === 'local' ? localIndex : previous.localIndex, conflict });
        return;
      }
      actions.set(action.code, { value: structuredClone(action), sources: contributors, localIndex: source.kind === 'local' ? localIndex : previous.localIndex, conflict: previous.conflict });
    });
  });

  const resolvedStates: ResolvedStateField[] = [...stateFields.values()].map(({ value: field, sources: contributors, localIndex, conflict }) => {
    const winner = contributors[contributors.length - 1];
    const override = object.initialStateOverrides.find((item) => item.stateCode === field.code);
    return {
      ...field,
      source: winner.name,
      sourceRank: winner.rank,
      sources: contributors,
      inherited: contributors.some((item) => item.kind === 'mixin'),
      localIndex,
      baseInitialValue: field.defaultValue,
      effectiveInitialValue: override?.value ?? field.defaultValue,
      hasInitialOverride: Boolean(override),
      conflict,
    };
  });
  const resolvedActions: ResolvedAction[] = [...actions.values()].map(({ value: action, sources: contributors, localIndex, conflict }) => {
    const winner = contributors[contributors.length - 1];
    return {
      ...action,
      source: winner.name,
      sourceRank: winner.rank,
      sources: contributors,
      inherited: contributors.some((item) => item.kind === 'mixin'),
      localIndex,
      conflict,
    };
  });
  return { stateFields: resolvedStates, actions: resolvedActions, conflicts };
}
