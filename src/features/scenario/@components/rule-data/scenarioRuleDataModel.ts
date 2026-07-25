import type { ScenarioRuleDataPayload } from '../../../../app/scenarioApi';

export type ScenarioRuleData = ScenarioRuleDataPayload;
export type ScenarioObjectType = ScenarioRuleData['objectTypes'][number];
export type ScenarioStateField = ScenarioObjectType['stateFields'][number];
export type ScenarioTypeAction = ScenarioObjectType['actions'][number];
export type ScenarioLocation = ScenarioRuleData['locations'][number];
export type ScenarioObject = ScenarioRuleData['objects'][number];
export type ScenarioActionResult = ScenarioObject['actionResults'][number];
export type ScenarioRuleEffect = ScenarioActionResult['effects'][number];

export const emptyScenarioRuleData: ScenarioRuleData = {
  schemaVersion: 1,
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
  return {
    code,
    name: '新しい種類',
    description: '',
    schemaVersion: 1,
    stateFields: [],
    actions: [],
    actionResults: [],
  };
}

export function createStateField(): ScenarioStateField {
  return {
    code: nextAuthoringCode('state'),
    label: '新しい状態',
    valueType: 'boolean',
    defaultValue: 'false',
    visibility: 'public',
  };
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
    objectTypeCode: ruleData.objectTypes[0]?.code ?? '',
    mixinTypeCodes: ruleData.objectTypes[0] ? [ruleData.objectTypes[0].code] : [],
    initialLocationCode: ruleData.locations[0]?.code ?? '',
    global: false,
    stateFields: [],
    actions: [],
    initialStateOverrides: [],
    actionResults: [],
  };
}

export function createActionResult(object: ScenarioObject, ruleData: ScenarioRuleData, actionCode: string): ScenarioActionResult {
  const state = resolvedObjectConfiguration(ruleData, object).stateFields[0];
  return {
    code: nextAuthoringCode('result'),
    actionCode,
    fromStateCode: state?.code ?? '',
    fromStateValue: state?.defaultValue ?? '',
    priority: 100,
    note: '',
    effects: [],
  };
}

export type RuleDataIssue = {
  path: string;
  message: string;
  severity: 'warning' | 'error';
};

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

  duplicateCodes(ruleData.locations, 'ruleData.locations');
  duplicateCodes(ruleData.objectTypes, 'ruleData.objectTypes');
  duplicateCodes(ruleData.objects, 'ruleData.objects');

  ruleData.objectTypes.forEach((type, typeIndex) => {
    duplicateCodes(type.stateFields, `ruleData.objectTypes[${typeIndex}].stateFields`);
    duplicateCodes(type.actions, `ruleData.objectTypes[${typeIndex}].actions`);
  });

  ruleData.objects.forEach((object, objectIndex) => {
    const mixinCodes = object.mixinTypeCodes ?? (object.objectTypeCode ? [object.objectTypeCode] : []);
    if (new Set(mixinCodes).size !== mixinCodes.length) issues.push({ path: `ruleData.objects[${objectIndex}].mixinTypeCodes`, message: '同じ種類を複数回mixinできません。', severity: 'error' });
    mixinCodes.forEach((code) => { if (!ruleData.objectTypes.some((type) => type.code === code)) issues.push({ path: `ruleData.objects[${objectIndex}].mixinTypeCodes`, message: `参照する種類「${code}」が見つかりません。`, severity: 'error' }); });
    const resolved = resolvedObjectConfiguration(ruleData, object);
    const type = { code: object.code, name: object.name, description: '', schemaVersion: 1 as const, stateFields: resolved.stateFields, actions: resolved.actions, actionResults: [] };
    if (!object.global && !ruleData.locations.some((location) => location.code === object.initialLocationCode)) {
      issues.push({ path: `ruleData.objects[${objectIndex}].initialLocationCode`, message: '初期配置する場所を選択してください。', severity: 'error' });
    }
    type?.actions.forEach((action) => {
      if (action.availability === 'state-equals' && !type.stateFields.some((state) => state.code === action.availabilityStateCode)) {
        issues.push({ path: `ruleData.objectTypes[${ruleData.objectTypes.indexOf(type)}].actions[${type.actions.indexOf(action)}].availabilityStateCode`, message: '種類共通の提示条件で参照する状態が見つかりません。', severity: 'error' });
      }
      const genericRuleExists = (object.mixinTypeCodes ?? [object.objectTypeCode]).some((code) => ruleData.objectTypes.find((candidate) => candidate.code === code)?.actionResults?.some((result) => result.actionCode === action.code));
      if (!genericRuleExists && !object.actionResults.some((result) => result.actionCode === action.code)) {
        issues.push({ path: `ruleData.objects[${objectIndex}].actionResults`, message: `「${action.label}」の実行ルールが未設定です。`, severity: 'warning' });
      }
    });
    const keys = new Set<string>();
    object.actionResults.forEach((result, resultIndex) => {
      if (!type?.actions.some((action) => action.code === result.actionCode)) {
        issues.push({ path: `ruleData.objects[${objectIndex}].actionResults[${resultIndex}].actionCode`, message: `参照先のアクション「${result.actionCode || '(未設定)'}」が見つかりません。`, severity: 'error' });
      }
      if (result.fromStateCode && !type?.stateFields.some((state) => state.code === result.fromStateCode)) {
        issues.push({ path: `ruleData.objects[${objectIndex}].actionResults[${resultIndex}].fromStateCode`, message: `Object個別の実行条件で参照する状態「${result.fromStateCode}」が見つかりません。`, severity: 'error' });
      }
      const key = `${result.actionCode}:${result.fromStateCode}:${result.fromStateValue}:${result.priority}`;
      if (keys.has(key)) issues.push({ path: `ruleData.objects[${objectIndex}].actionResults[${resultIndex}].priority`, message: '同じ条件・優先度の結果があり、決定性がありません。', severity: 'error' });
      keys.add(key);
      result.effects.forEach((effect, effectIndex) => {
        const effectPath = `ruleData.objects[${objectIndex}].actionResults[${resultIndex}].effects[${effectIndex}]`;
        if (effect.kind === 'move-object' || effect.kind === 'move-session') {
          if (!effect.locationCode.trim() || !ruleData.locations.some((location) => location.code === effect.locationCode)) {
            issues.push({ path: `${effectPath}.locationCode`, message: '移動先の場所を選択してください。', severity: 'error' });
          }
        }
        if (effect.kind === 'move-object' && effect.targetObjectCode && !ruleData.objects.some((candidate) => candidate.code === effect.targetObjectCode)) {
          issues.push({ path: `${effectPath}.targetObjectCode`, message: '移動するオブジェクトを選択してください。', severity: 'error' });
        }
        if (effect.kind === 'emit-event') {
          if (!effect.event.trim()) issues.push({ path: `${effectPath}.event`, message: '記録する出来事の名前を入力してください。', severity: 'error' });
          if (effect.locationCode && !ruleData.locations.some((location) => location.code === effect.locationCode)) {
            issues.push({ path: `${effectPath}.locationCode`, message: '出来事に関連する場所を選択してください。', severity: 'error' });
          }
        }
        if ((effect.kind === 'emit-fact' || effect.kind === 'add-narrative-hint' || effect.kind === 'forbid-narrative-fact') && !effect.text.trim()) {
          issues.push({ path: `${effectPath}.text`, message: '文章を入力してください。', severity: 'error' });
        }
      });
    });
  });
  return issues;
}

export function dependencyMessageForType(ruleData: ScenarioRuleData, code: string) {
  const dependent = ruleData.objects.find((object) => (object.mixinTypeCodes ?? [object.objectTypeCode]).includes(code));
  return dependent ? `「${dependent.name}」が参照しています。先に種類を変更するかオブジェクトを削除してください。` : null;
}

export function dependencyMessageForLocation(ruleData: ScenarioRuleData, code: string) {
  const dependent = ruleData.objects.find((object) => !object.global && object.initialLocationCode === code);
  return dependent ? `「${dependent.name}」が配置されています。先に配置先を変更するかオブジェクトを削除してください。` : null;
}


export type ResolvedConfigurationEntry<T> = T & { source: string; sourceRank: number };
export function resolvedObjectConfiguration(ruleData: ScenarioRuleData, object: ScenarioObject) {
  const conflicts: string[] = [];
  const stateFields = new Map<string, ResolvedConfigurationEntry<ScenarioStateField>>();
  const actions = new Map<string, ResolvedConfigurationEntry<ScenarioTypeAction>>();
  const codes = object.mixinTypeCodes ?? (object.objectTypeCode ? [object.objectTypeCode] : []);
  [...codes.map((code) => ruleData.objectTypes.find((type) => type.code === code)).filter(Boolean), object].forEach((source, rank) => {
    if (!source) return;
    const sourceName = source === object ? 'Object local' : source.name;
    (source.stateFields ?? []).forEach((field) => {
      const previous = stateFields.get(field.code);
      if (previous && (previous.valueType !== field.valueType || previous.label !== field.label)) conflicts.push(`state ${field.code}: ${previous.source} / ${sourceName}`);
      else stateFields.set(field.code, { ...field, source: sourceName, sourceRank: rank });
    });
    (source.actions ?? []).forEach((action) => {
      const previous = actions.get(action.code);
      const contract = (value: ScenarioTypeAction) => { const { _canonical, ...contractValue } = value; return JSON.stringify(contractValue); };
      if (previous && contract(previous) !== contract(action)) conflicts.push(`action ${action.code}: ${previous.source} / ${sourceName}`);
      else actions.set(action.code, { ...action, source: sourceName, sourceRank: rank });
    });
  });
  return { stateFields: [...stateFields.values()], actions: [...actions.values()], conflicts };
}
