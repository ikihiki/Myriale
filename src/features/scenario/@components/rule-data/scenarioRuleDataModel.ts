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
    initialLocationCode: ruleData.locations[0]?.code ?? '',
    global: false,
    initialStateOverrides: [],
    actionResults: [],
  };
}

export function createActionResult(object: ScenarioObject, ruleData: ScenarioRuleData): ScenarioActionResult {
  const type = ruleData.objectTypes.find((candidate) => candidate.code === object.objectTypeCode);
  const state = type?.stateFields[0];
  return {
    code: nextAuthoringCode('result'),
    actionCode: type?.actions[0]?.code ?? '',
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
    const type = ruleData.objectTypes.find((candidate) => candidate.code === object.objectTypeCode);
    if (!type) issues.push({ path: `ruleData.objects[${objectIndex}].objectTypeCode`, message: '参照するオブジェクト種類を選択してください。', severity: 'error' });
    if (!object.global && !ruleData.locations.some((location) => location.code === object.initialLocationCode)) {
      issues.push({ path: `ruleData.objects[${objectIndex}].initialLocationCode`, message: '初期配置する場所を選択してください。', severity: 'error' });
    }
    type?.actions.forEach((action) => {
      if (!object.actionResults.some((result) => result.actionCode === action.code)) {
        issues.push({ path: `ruleData.objects[${objectIndex}].actionResults`, message: `「${action.label}」の結果が未設定です。`, severity: 'warning' });
      }
    });
    const keys = new Set<string>();
    object.actionResults.forEach((result, resultIndex) => {
      const key = `${result.actionCode}:${result.fromStateCode}:${result.fromStateValue}:${result.priority}`;
      if (keys.has(key)) issues.push({ path: `ruleData.objects[${objectIndex}].actionResults[${resultIndex}].priority`, message: '同じ条件・優先度の結果があり、決定性がありません。', severity: 'error' });
      keys.add(key);
    });
  });
  return issues;
}

export function dependencyMessageForType(ruleData: ScenarioRuleData, code: string) {
  const dependent = ruleData.objects.find((object) => object.objectTypeCode === code);
  return dependent ? `「${dependent.name}」が参照しています。先に種類を変更するかオブジェクトを削除してください。` : null;
}

export function dependencyMessageForLocation(ruleData: ScenarioRuleData, code: string) {
  const dependent = ruleData.objects.find((object) => !object.global && object.initialLocationCode === code);
  return dependent ? `「${dependent.name}」が配置されています。先に配置先を変更するかオブジェクトを削除してください。` : null;
}
