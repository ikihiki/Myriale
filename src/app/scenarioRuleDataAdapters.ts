import type {
  CanonicalScenarioActionDto,
  CanonicalScenarioActionRuleDto,
  CanonicalScenarioObjectRuleOperationDto,
  CanonicalScenarioObjectTypeDto,
  CanonicalScenarioRuleDataRequest,
  CanonicalScenarioRuleDataResponse,
  ScenarioActionRulePayload,
  ScenarioJsonObject,
  ScenarioJsonValue,
  ScenarioObjectRuleOperationPayload,
  ScenarioObjectTypePayload,
  ScenarioRuleDataPayload,
  ScenarioRuleEffectPayload,
  ScenarioStateValueType,
} from './scenarioApi';
import { conditionFromCanonical, conditionToCanonical } from './scenarioConditionAdapters';

const asObject = (value: ScenarioJsonValue | undefined): ScenarioJsonObject =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const asArray = (value: ScenarioJsonValue | undefined): ScenarioJsonValue[] => Array.isArray(value) ? value : [];
const scalarToString = (value: ScenarioJsonValue | undefined) => value == null ? '' : String(value);

function parseValue(value: string, type: ScenarioStateValueType): ScenarioJsonValue {
  if (type === 'boolean') return value.trim().toLowerCase() === 'true';
  if (type === 'number') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return value;
}

function schemaType(value: ScenarioJsonValue | undefined): ScenarioStateValueType {
  const type = asObject(value).type;
  return type === 'boolean' || type === 'number' ? type : 'string';
}

function actionFromCanonical(action: CanonicalScenarioActionDto) {
  const argumentProperties = asObject(action.argumentSchema.properties);
  const required = new Set(asArray(action.argumentSchema.required).filter((item): item is string => typeof item === 'string'));
  return {
    code: action.code,
    label: action.label,
    description: action.description ?? '',
    visibility: action.visibility,
    availabilityCondition: conditionFromCanonical(action.availabilityCondition),
    argumentFields: Object.entries(argumentProperties).map(([code, schema]) => ({
      code,
      label: typeof asObject(schema).title === 'string' ? String(asObject(schema).title) : code,
      valueType: schemaType(schema),
      required: required.has(code),
    })),
  };
}

function effectFromCanonical(effectValue: ScenarioJsonValue): ScenarioRuleEffectPayload {
  const effect = asObject(effectValue);
  if (effect.type === 'set-state' && typeof effect.path === 'string') return {
    kind: 'set-state',
    targetObjectCode: typeof effect.objectCode === 'string' ? effect.objectCode : '',
    stateCode: effect.path.replace(/^state\./, ''),
    value: scalarToString(effect.value),
  };
  if (effect.type === 'move-object') return {
    kind: 'move-object',
    targetObjectCode: typeof effect.objectCode === 'string' ? effect.objectCode : '',
    locationCode: typeof effect.locationCode === 'string' ? effect.locationCode : '',
  };
  if (effect.type === 'move-session') return {
    kind: 'move-session',
    locationCode: typeof effect.locationCode === 'string' ? effect.locationCode : '',
  };
  if (effect.type === 'emit-fact') return { kind: 'emit-fact', text: typeof effect.text === 'string' ? effect.text : '' };
  if (effect.type === 'emit-event') return {
    kind: 'emit-event',
    event: typeof effect.event === 'string' ? effect.event : '',
    locationCode: typeof effect.locationCode === 'string' ? effect.locationCode : '',
  };
  if (effect.type === 'add-narrative-hint') return { kind: 'add-narrative-hint', text: typeof effect.text === 'string' ? effect.text : '' };
  if (effect.type === 'forbid-narrative-fact') return { kind: 'forbid-narrative-fact', text: typeof effect.text === 'string' ? effect.text : '' };
  return { kind: 'unsupported', type: typeof effect.type === 'string' ? effect.type : 'unknown', _canonical: structuredClone(effect) };
}

function ruleFromCanonical(rule: CanonicalScenarioActionRuleDto): ScenarioActionRulePayload {
  return {
    code: rule.code,
    actionCode: rule.actionCode,
    condition: conditionFromCanonical(rule.condition),
    priority: rule.priority,
    note: rule.authoringNote ?? '',
    effects: rule.effects.map(effectFromCanonical),
    moduleBinding: rule.moduleBinding ? structuredClone(rule.moduleBinding) : null,
  };
}

function objectOperationFromCanonical(operation: CanonicalScenarioObjectRuleOperationDto): ScenarioObjectRuleOperationPayload {
  if (operation.operation === 'add') return { operation: 'add', rule: ruleFromCanonical(operation) };
  if (operation.operation === 'override') return {
    operation: 'override',
    targetTypeCode: operation.targetTypeCode,
    targetRuleCode: operation.targetRuleCode,
    rule: ruleFromCanonical({ ...operation, code: operation.targetRuleCode }),
  };
  if (operation.operation === 'delete') return {
    operation: 'delete',
    targetTypeCode: operation.targetTypeCode,
    targetRuleCode: operation.targetRuleCode,
  };
  return {
    operation: 'adjust',
    targetTypeCode: operation.targetTypeCode,
    targetRuleCode: operation.targetRuleCode,
    adjustments: {
      ...('condition' in operation && operation.condition ? { condition: conditionFromCanonical(operation.condition) } : {}),
      ...('priority' in operation ? { priority: operation.priority } : {}),
      ...('authoringNote' in operation ? { note: operation.authoringNote } : {}),
      ...('effects' in operation ? { effects: (operation.effects ?? []).map(effectFromCanonical) } : {}),
      ...('moduleBinding' in operation ? { moduleBinding: operation.moduleBinding ? structuredClone(operation.moduleBinding) : null } : {}),
    },
  };
}

function typeFromCanonical(type: CanonicalScenarioObjectTypeDto): ScenarioObjectTypePayload {
  const properties = asObject(type.stateSchema.properties);
  const publicFields = new Set(asArray(type.publicProjection.include).filter((item): item is string => typeof item === 'string'));
  return {
    code: type.code,
    name: type.name,
    description: type.description ?? '',
    schemaVersion: 1,
    stateFields: Object.entries(properties).map(([code, schema]) => ({
      code,
      label: typeof asObject(schema).title === 'string' ? String(asObject(schema).title) : code,
      valueType: schemaType(schema),
      defaultValue: scalarToString(type.defaultState[code]),
      visibility: publicFields.has(code) ? 'public' as const : 'private' as const,
    })),
    actions: type.actions.map(actionFromCanonical),
    actionRules: type.actionRules.map(ruleFromCanonical),
  };
}

export function canonicalRuleDataToForm(response: CanonicalScenarioRuleDataResponse): ScenarioRuleDataPayload {
  if (response.schemaVersion !== 2) throw new Error(`Unsupported scenario rule schema version: ${response.schemaVersion}`);
  return {
    schemaVersion: 2,
    startLocationCode: response.startLocationCode,
    locations: response.locations.map((location) => ({
      code: location.code,
      name: location.name,
      description: location.description ?? '',
      atmosphere: typeof location.authoringData.atmosphere === 'string' ? location.authoringData.atmosphere : '',
      danger: typeof location.authoringData.danger === 'string' ? location.authoringData.danger : '',
    })),
    objectTypes: response.objectTypes.map(typeFromCanonical),
    objects: response.objects.map((object) => ({
      code: object.code,
      name: object.name,
      mixinTypeCodes: [...object.mixinTypeCodes],
      initialLocationCode: object.locationCode,
      global: object.isGlobal,
      stateFields: typeFromCanonical({ code: object.code, name: object.name, description: null, schemaVersion: 1, stateSchema: object.stateSchema, defaultState: object.defaultState, publicProjection: object.publicProjection, actions: object.actions, actionRules: [] }).stateFields,
      actions: object.actions.map(actionFromCanonical),
      initialStateOverrides: Object.entries(object.initialStateOverride).map(([stateCode, value]) => ({ stateCode, value: scalarToString(value) })),
      actionRules: object.actionRules.map(objectOperationFromCanonical),
    })),
  };
}

function typeByCode(ruleData: ScenarioRuleDataPayload, code: string) {
  return ruleData.objectTypes.find((type) => type.code === code);
}

function stateValue(ruleData: ScenarioRuleDataPayload, sourceCode: string, stateCode: string, value: string) {
  const object = ruleData.objects.find((candidate) => candidate.code === sourceCode);
  const state = object?.stateFields.find((field) => field.code === stateCode)
    ?? (object?.mixinTypeCodes ?? []).map((code) => typeByCode(ruleData, code)?.stateFields.find((field) => field.code === stateCode)).find(Boolean)
    ?? typeByCode(ruleData, sourceCode)?.stateFields.find((field) => field.code === stateCode);
  return parseValue(value, state?.valueType ?? 'string');
}

function actionToCanonical(action: ScenarioObjectTypePayload['actions'][number], type: Pick<ScenarioObjectTypePayload, 'stateFields'>): CanonicalScenarioActionDto {
  const argumentProperties = Object.fromEntries(action.argumentFields.map((field) => [field.code, { type: field.valueType, title: field.label }]));
  return {
    code: action.code,
    label: action.label,
    description: action.description,
    argumentSchema: {
      type: 'object',
      additionalProperties: false,
      properties: argumentProperties,
      required: action.argumentFields.filter((field) => field.required).map((field) => field.code),
    },
    availabilityCondition: conditionToCanonical(action.availabilityCondition),
    visibility: action.visibility,
    executionMode: 'rule',
  };
}

function effectToCanonical(effect: ScenarioRuleEffectPayload, ruleData: ScenarioRuleDataPayload, sourceCode: string): ScenarioJsonObject {
  if (effect.kind === 'set-state') return {
    type: 'set-state',
    path: `state.${effect.stateCode}`,
    value: stateValue(ruleData, sourceCode, effect.stateCode, effect.value),
    ...(effect.targetObjectCode ? { objectCode: effect.targetObjectCode } : {}),
  };
  if (effect.kind === 'move-object') return {
    type: 'move-object',
    locationCode: effect.locationCode,
    ...(effect.targetObjectCode ? { objectCode: effect.targetObjectCode } : {}),
  };
  if (effect.kind === 'move-session') return { type: 'move-session', locationCode: effect.locationCode };
  if (effect.kind === 'emit-event') return {
    type: 'emit-event',
    event: effect.event,
    ...(effect.locationCode ? { locationCode: effect.locationCode } : {}),
  };
  if (effect.kind === 'unsupported') return structuredClone(effect._canonical);
  return { type: effect.kind, text: effect.text };
}

function ruleToCanonical(rule: ScenarioActionRulePayload, ruleData: ScenarioRuleDataPayload, sourceCode: string): CanonicalScenarioActionRuleDto {
  return {
    code: rule.code,
    actionCode: rule.actionCode,
    condition: conditionToCanonical(rule.condition),
    priority: rule.priority,
    authoringNote: rule.note || null,
    effects: rule.effects.map((effect) => effectToCanonical(effect, ruleData, sourceCode)),
    moduleBinding: rule.moduleBinding ? structuredClone(rule.moduleBinding) : null,
  };
}

function objectOperationToCanonical(operation: ScenarioObjectRuleOperationPayload, ruleData: ScenarioRuleDataPayload, sourceCode: string): CanonicalScenarioObjectRuleOperationDto {
  if (operation.operation === 'add') return { operation: 'add', ...ruleToCanonical(operation.rule, ruleData, sourceCode) };
  if (operation.operation === 'override') {
    const { code: _code, ...rule } = ruleToCanonical(operation.rule, ruleData, sourceCode);
    return {
      operation: 'override',
      targetTypeCode: operation.targetTypeCode,
      targetRuleCode: operation.targetRuleCode,
      ...rule,
    };
  }
  if (operation.operation === 'delete') return {
    operation: 'delete',
    targetTypeCode: operation.targetTypeCode,
    targetRuleCode: operation.targetRuleCode,
  };
  return {
    operation: 'adjust',
    targetTypeCode: operation.targetTypeCode,
    targetRuleCode: operation.targetRuleCode,
    ...('condition' in operation.adjustments ? { condition: conditionToCanonical(operation.adjustments.condition!) } : {}),
    ...('priority' in operation.adjustments ? { priority: operation.adjustments.priority } : {}),
    ...('note' in operation.adjustments ? { authoringNote: operation.adjustments.note } : {}),
    ...('effects' in operation.adjustments ? { effects: operation.adjustments.effects?.map((effect) => effectToCanonical(effect, ruleData, sourceCode)) ?? [] } : {}),
    ...('moduleBinding' in operation.adjustments ? { moduleBinding: operation.adjustments.moduleBinding ? structuredClone(operation.adjustments.moduleBinding) : null } : {}),
  };
}

export function formRuleDataToCanonical(ruleData: ScenarioRuleDataPayload): CanonicalScenarioRuleDataRequest {
  return {
    schemaVersion: 2,
    startLocationCode: ruleData.startLocationCode,
    locations: ruleData.locations.map((location) => ({
      code: location.code,
      name: location.name,
      description: location.description || null,
      authoringData: { atmosphere: location.atmosphere, danger: location.danger },
    })),
    objectTypes: ruleData.objectTypes.map((type) => ({
      code: type.code,
      name: type.name,
      description: type.description || null,
      schemaVersion: 1,
      stateSchema: {
        type: 'object',
        additionalProperties: false,
        properties: Object.fromEntries(type.stateFields.map((field) => [field.code, { type: field.valueType, title: field.label }])),
        required: type.stateFields.map((field) => field.code),
      },
      defaultState: Object.fromEntries(type.stateFields.map((field) => [field.code, parseValue(field.defaultValue, field.valueType)])),
      publicProjection: { include: type.stateFields.filter((field) => field.visibility === 'public').map((field) => field.code) },
      actions: type.actions.map((action) => actionToCanonical(action, type)),
      actionRules: type.actionRules.map((rule) => ruleToCanonical(rule, ruleData, type.code)),
    })),
    objects: ruleData.objects.map((object) => ({
      code: object.code,
      name: object.name,
      mixinTypeCodes: [...object.mixinTypeCodes],
      locationCode: object.initialLocationCode,
      stateSchema: { type: 'object', additionalProperties: false, properties: Object.fromEntries(object.stateFields.map((field) => [field.code, { type: field.valueType, title: field.label }])), required: object.stateFields.map((field) => field.code) },
      defaultState: Object.fromEntries(object.stateFields.map((field) => [field.code, parseValue(field.defaultValue, field.valueType)])),
      publicProjection: { include: object.stateFields.filter((field) => field.visibility === 'public').map((field) => field.code) },
      actions: object.actions.map((action) => actionToCanonical(action, object)),
      initialStateOverride: Object.fromEntries(object.initialStateOverrides.map((item) => [item.stateCode, stateValue(ruleData, object.code, item.stateCode, item.value)])),
      isGlobal: object.global,
      actionRules: object.actionRules.map((operation) => objectOperationToCanonical(operation, ruleData, object.code)),
    })),
  };
}
