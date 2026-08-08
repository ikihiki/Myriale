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
  schemaVersion: 3,
  startLocationCode: '',
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
  return { code, name: '新しい種類', description: '', schemaVersion: 1, profileFields: [], profileDefaults: [], stateFields: [], actions: [], actionRules: [] };
}

export type ScenarioProfileField = ScenarioObjectType['profileFields'][number];
export type ScenarioProfileValue = ScenarioObjectType['profileDefaults'][number];

export function createProfileField(): ScenarioProfileField {
  return { code: nextAuthoringCode('profile'), label: '新しいプロフィール項目', description: '', valueType: 'string', required: false };
}

export function createStateField(): ScenarioStateField {
  return { code: nextAuthoringCode('state'), label: '新しい状態', valueType: 'boolean', defaultValue: 'false', visibility: 'public', updateAuthority: 'rules', aiGuidance: '' };
}

export function createTypeAction(): ScenarioTypeAction {
  return {
    code: nextAuthoringCode('action'),
    label: '新しいアクション',
    description: '',
    visibility: 'ai-choice',
    availabilityCondition: { kind: 'always' },
    argumentFields: [],
  };
}

export function createLocation(): ScenarioLocation {
  const code = nextAuthoringCode('location');
  return { code, name: '新しい場所', description: '', atmosphere: '', danger: '' };
}

export function createObject(ruleData: ScenarioRuleData): ScenarioObject {
  return {
    code: nextAuthoringCode('entity'),
    name: '新しいエンティティ',
    profileMarkdown: '## 外観・概要\n\nこのエンティティの外観、人物像、材質、振る舞いなどを記述します。\n\n## 描写指針\n\n現在状態と公開済みfactsに沿って描写します。',
    mixinTypeCodes: ruleData.objectTypes[0] ? [ruleData.objectTypes[0].code] : [],
    localProfileFields: [],
    localProfileDefaults: [],
    profileValues: [],
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
    condition: { kind: 'always' },
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
        ...('condition' in operation.adjustments && operation.adjustments.condition ? { condition: structuredClone(operation.adjustments.condition) } : {}),
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
    if (effect.kind === 'move-object' && effect.targetObjectCode && !ruleData.objects.some((candidate) => candidate.code === effect.targetObjectCode)) issues.push({ path: `${effectPath}.targetObjectCode`, message: '移動するエンティティを選択してください。', severity: 'error' });
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
  if (ruleData.locations.length > 0 && (!ruleData.startLocationCode || !ruleData.locations.some((location) => location.code === ruleData.startLocationCode))) issues.push({ path: 'ruleData.startLocationCode', message: 'セッション開始場所を選択してください。', severity: 'error' });
  duplicateCodes(ruleData.objectTypes, 'ruleData.objectTypes');
  duplicateCodes(ruleData.objects, 'ruleData.objects');

  ruleData.objectTypes.forEach((type, typeIndex) => {
    duplicateCodes(type.profileFields, `ruleData.objectTypes[${typeIndex}].profileFields`);
    const typeProfileDefaultCodes = new Set<string>();
    type.profileDefaults.forEach((item, defaultIndex) => {
      if (typeProfileDefaultCodes.has(item.profileCode)) issues.push({ path: `ruleData.objectTypes[${typeIndex}].profileDefaults[${defaultIndex}]`, message: `プロフィールdefault「${item.profileCode}」が重複しています。`, severity: 'error' });
      typeProfileDefaultCodes.add(item.profileCode);
      const field = type.profileFields.find((candidate) => candidate.code === item.profileCode);
      if (!field) issues.push({ path: `ruleData.objectTypes[${typeIndex}].profileDefaults[${defaultIndex}]`, message: 'プロフィールdefaultの項目が見つかりません。', severity: 'error' });
      else if (parseProfileScalar(item.value, field.valueType) === null) issues.push({ path: `ruleData.objectTypes[${typeIndex}].profileDefaults[${defaultIndex}].value`, message: `${field.valueType}型の値を入力してください。`, severity: 'error' });
    });
    duplicateCodes(type.stateFields, `ruleData.objectTypes[${typeIndex}].stateFields`);
    type.stateFields.forEach((field, fieldIndex) => {
      if (field.updateAuthority === 'ai' && field.defaultValue.trim()) issues.push({ path: `ruleData.objectTypes[${typeIndex}].stateFields[${fieldIndex}].defaultValue`, message: 'AI更新の状態には事前defaultを設定できません。', severity: 'error' });
    });
    duplicateCodes(type.actions, `ruleData.objectTypes[${typeIndex}].actions`);
    duplicateCodes(type.actionRules, `ruleData.objectTypes[${typeIndex}].actionRules`);
    type.actionRules.forEach((rule, ruleIndex) => validateRule(rule, `ruleData.objectTypes[${typeIndex}].actionRules[${ruleIndex}]`, type.actions));
  });

  ruleData.objects.forEach((object, objectIndex) => {
    if (new Set(object.mixinTypeCodes).size !== object.mixinTypeCodes.length) issues.push({ path: `ruleData.objects[${objectIndex}].mixinTypeCodes`, message: '同じ種類を複数回mixinできません。', severity: 'error' });
    object.mixinTypeCodes.forEach((code) => { if (!ruleData.objectTypes.some((type) => type.code === code)) issues.push({ path: `ruleData.objects[${objectIndex}].mixinTypeCodes`, message: `参照する種類「${code}」が見つかりません。`, severity: 'error' }); });
    const resolved = resolvedObjectConfiguration(ruleData, object);
    resolved.conflicts.forEach((conflict) => issues.push({ path: `ruleData.objects[${objectIndex}].${conflict.kind === 'state' ? 'stateFields' : 'actions'}`, message: `定義が競合しています: ${conflict.message}`, severity: 'error' }));
    duplicateCodes(object.localProfileFields, `ruleData.objects[${objectIndex}].localProfileFields`);
    const localProfileCodes = new Set<string>();
    object.localProfileDefaults.forEach((item, defaultIndex) => {
      if (localProfileCodes.has(item.profileCode)) issues.push({ path: `ruleData.objects[${objectIndex}].localProfileDefaults[${defaultIndex}]`, message: `プロフィールdefault「${item.profileCode}」が重複しています。`, severity: 'error' });
      localProfileCodes.add(item.profileCode);
      const field = object.localProfileFields.find((candidate) => candidate.code === item.profileCode);
      if (!field) issues.push({ path: `ruleData.objects[${objectIndex}].localProfileDefaults[${defaultIndex}]`, message: 'Entity固有プロフィールdefaultの項目が見つかりません。', severity: 'error' });
      else if (parseProfileScalar(item.value, field.valueType) === null) issues.push({ path: `ruleData.objects[${objectIndex}].localProfileDefaults[${defaultIndex}].value`, message: `${field.valueType}型の値を入力してください。`, severity: 'error' });
    });
    const resolvedProfile = resolvedObjectProfile(ruleData, object);
    resolvedProfile.conflicts.forEach((conflict) => issues.push({ path: `ruleData.objects[${objectIndex}].localProfileFields`, message: `定義が競合しています: ${conflict.message}`, severity: 'error' }));
    const profileValueCodes = new Set<string>();
    object.profileValues.forEach((item, valueIndex) => {
      if (profileValueCodes.has(item.profileCode)) issues.push({ path: `ruleData.objects[${objectIndex}].profileValues[${valueIndex}]`, message: `プロフィール値「${item.profileCode}」が重複しています。`, severity: 'error' });
      profileValueCodes.add(item.profileCode);
      const field = resolvedProfile.fields.find((candidate) => candidate.code === item.profileCode);
      if (!field) issues.push({ path: `ruleData.objects[${objectIndex}].profileValues[${valueIndex}]`, message: 'プロフィール値の項目が見つかりません。', severity: 'error' });
      else if (parseProfileScalar(item.value, field.valueType) === null) issues.push({ path: `ruleData.objects[${objectIndex}].profileValues[${valueIndex}].value`, message: `${field.valueType}型の値を入力してください。`, severity: 'error' });
    });
    resolvedProfile.fields.forEach((field) => {
      if (field.required && (field.effectiveValue === null || field.effectiveValue === '')) issues.push({ path: `ruleData.objects[${objectIndex}].profileValues`, message: `必須プロフィール「${field.label}」を入力してください。`, severity: 'error' });
    });
    object.stateFields.forEach((field, fieldIndex) => {
      if (field.updateAuthority === 'ai' && field.defaultValue.trim()) issues.push({ path: `ruleData.objects[${objectIndex}].stateFields[${fieldIndex}].defaultValue`, message: 'AI更新の状態には事前defaultを設定できません。', severity: 'error' });
    });
    object.initialStateOverrides.forEach((override, overrideIndex) => {
      const field = resolved.stateFields.find((candidate) => candidate.code === override.stateCode);
      if (field?.updateAuthority === 'ai') issues.push({ path: `ruleData.objects[${objectIndex}].initialStateOverrides[${overrideIndex}]`, message: 'AI更新の状態には初期値を設定できません。', severity: 'error' });
    });
    if (!object.global && !ruleData.locations.some((location) => location.code === object.initialLocationCode)) issues.push({ path: `ruleData.objects[${objectIndex}].initialLocationCode`, message: '初期配置する場所を選択してください。', severity: 'error' });
    resolved.actions.forEach((action) => {
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
  return dependent ? `「${dependent.name}」が参照しています。先に種類を変更するかエンティティを削除してください。` : null;
}

export function dependencyMessageForLocation(ruleData: ScenarioRuleData, code: string) {
  const dependent = ruleData.objects.find((object) => !object.global && object.initialLocationCode === code);
  return dependent ? `「${dependent.name}」が配置されています。先に配置先を変更するかエンティティを削除してください。` : null;
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
  kind: 'profile' | 'state' | 'action';
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
  return left.code === right.code
    && left.label === right.label
    && left.valueType === right.valueType
    && (left.updateAuthority ?? 'rules') === (right.updateAuthority ?? 'rules');
}

function sameActionContract(left: ScenarioTypeAction, right: ScenarioTypeAction) {
  return left.code === right.code
    && left.label === right.label
    && left.description === right.description
    && left.visibility === right.visibility
    && JSON.stringify(left.availabilityCondition) === JSON.stringify(right.availabilityCondition)
    && JSON.stringify(left.argumentFields) === JSON.stringify(right.argumentFields);
}

export type ResolvedProfileField = ScenarioProfileField & {
  source: string;
  sources: ResolvedConfigurationSource[];
  defaultValue: string | null;
  value: string | null;
  effectiveValue: string | null;
  inherited: boolean;
  localIndex: number | null;
  conflict: ResolvedConfigurationConflict | null;
};

function parseProfileScalar(value: string, valueType: ScenarioProfileField['valueType']): string | number | boolean | null {
  if (valueType === 'string') return value;
  if (valueType === 'number') {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value.trim().toLowerCase() === 'true') return true;
  if (value.trim().toLowerCase() === 'false') return false;
  return null;
}

export function resolvedObjectProfile(ruleData: ScenarioRuleData, object: ScenarioObject) {
  type Accumulator = { value: ScenarioProfileField; sources: ResolvedConfigurationSource[]; localIndex: number | null; conflict: ResolvedConfigurationConflict | null; defaultValue: string | null };
  const fields = new Map<string, Accumulator>();
  const conflicts: ResolvedConfigurationConflict[] = [];
  const sources = [
    ...object.mixinTypeCodes.map((code) => ruleData.objectTypes.find((type) => type.code === code)).filter((value): value is ScenarioObjectType => Boolean(value)).map((type, rank) => ({
      fields: type.profileFields,
      defaults: type.profileDefaults,
      source: { kind: 'mixin' as const, code: type.code, name: type.name, rank },
    })),
    { fields: object.localProfileFields, defaults: object.localProfileDefaults, source: { kind: 'local' as const, code: object.code, name: object.name, rank: object.mixinTypeCodes.length } },
  ];
  sources.forEach(({ fields: sourceFields, defaults, source }) => sourceFields.forEach((field, localIndex) => {
    const previous = fields.get(field.code);
    const sourceDefault = defaults.find((item) => item.profileCode === field.code)?.value ?? null;
    if (!previous) {
      fields.set(field.code, { value: structuredClone(field), sources: [source], localIndex: source.kind === 'local' ? localIndex : null, conflict: null, defaultValue: sourceDefault });
      return;
    }
    const contributors = [...previous.sources, source];
    if (previous.value.valueType !== field.valueType) {
      const conflict = { kind: 'profile' as const, code: field.code, sources: contributors, message: `profile ${field.code}: ${contributors.map((item) => item.name).join(' / ')}` };
      conflicts.push(conflict);
      fields.set(field.code, { ...previous, sources: contributors, localIndex: source.kind === 'local' ? localIndex : previous.localIndex, conflict });
      return;
    }
    fields.set(field.code, {
      value: { ...structuredClone(field), required: previous.value.required || field.required },
      sources: contributors,
      localIndex: source.kind === 'local' ? localIndex : previous.localIndex,
      conflict: previous.conflict,
      defaultValue: sourceDefault ?? previous.defaultValue,
    });
  }));
  const resolvedFields: ResolvedProfileField[] = [...fields.values()].map(({ value: field, sources: contributors, localIndex, conflict, defaultValue }) => {
    const value = object.profileValues.find((item) => item.profileCode === field.code)?.value ?? null;
    return {
      ...field,
      source: contributors[contributors.length - 1].name,
      sources: contributors,
      defaultValue,
      value,
      effectiveValue: value ?? defaultValue,
      inherited: contributors.some((item) => item.kind === 'mixin'),
      localIndex,
      conflict,
    };
  });
  return { fields: resolvedFields, conflicts };
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
