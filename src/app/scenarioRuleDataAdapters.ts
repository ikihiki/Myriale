import type {
  CanonicalScenarioActionDto,
  CanonicalScenarioActionRuleDto,
  CanonicalScenarioObjectTypeDto,
  CanonicalScenarioRuleDataRequest,
  CanonicalScenarioRuleDataResponse,
  ScenarioJsonObject,
  ScenarioJsonValue,
  ScenarioObjectActionResultPayload,
  ScenarioObjectTypePayload,
  ScenarioRuleDataPayload,
  ScenarioRuleEffectPayload,
  ScenarioStateValueType,
} from './scenarioApi';

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

function conditionStateCode(condition: ScenarioJsonObject) {
  return condition.op === 'eq' && typeof condition.path === 'string' && condition.path.startsWith('state.')
    ? condition.path.slice('state.'.length)
    : '';
}

function actionFromCanonical(action: CanonicalScenarioActionDto) {
  const argumentProperties = asObject(action.argumentSchema.properties);
  const required = new Set(asArray(action.argumentSchema.required).filter((item): item is string => typeof item === 'string'));
  const availabilityStateCode = conditionStateCode(action.availabilityCondition);
  return {
    code: action.code,
    label: action.label,
    description: action.description ?? '',
    visibility: action.visibility,
    availability: availabilityStateCode ? 'state-equals' as const : 'always' as const,
    availabilityStateCode,
    argumentFields: Object.entries(argumentProperties).map(([code, schema]) => ({
      code,
      label: typeof asObject(schema).title === 'string' ? String(asObject(schema).title) : code,
      valueType: schemaType(schema),
      required: required.has(code),
      _canonical: asObject(schema),
    })),
    _canonical: action,
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
      _canonical: asObject(schema),
    })),
    actions: type.actions.map(actionFromCanonical),
    _canonical: type,
  };
}

function effectFromCanonical(effectValue: ScenarioJsonValue): ScenarioRuleEffectPayload | null {
  const effect = asObject(effectValue);
  if (effect.type === 'set-state' && typeof effect.path === 'string') return {
    kind: 'set-state',
    targetObjectCode: typeof effect.objectCode === 'string' ? effect.objectCode : '',
    stateCode: effect.path.replace(/^state\./, ''),
    value: scalarToString(effect.value),
    _canonical: effect,
  };
  if (effect.type === 'move-object') return {
    kind: 'move-object',
    targetObjectCode: typeof effect.objectCode === 'string' ? effect.objectCode : '',
    locationCode: typeof effect.locationCode === 'string' ? effect.locationCode : '',
    _canonical: effect,
  };
  if (effect.type === 'emit-fact' && typeof effect.text === 'string') return { kind: 'emit-fact', text: effect.text, _canonical: effect };
  if (effect.type === 'add-narrative-hint' && typeof effect.text === 'string') return { kind: 'add-narrative-hint', text: effect.text, _canonical: effect };
  return null;
}

export function canonicalRuleDataToForm(response: CanonicalScenarioRuleDataResponse): ScenarioRuleDataPayload {
  return {
    schemaVersion: 1,
    locations: response.locations.map((location) => ({
      code: location.code,
      name: location.name,
      description: location.description ?? '',
      atmosphere: typeof location.authoringData.atmosphere === 'string' ? location.authoringData.atmosphere : '',
      danger: typeof location.authoringData.danger === 'string' ? location.authoringData.danger : '',
      _canonical: location,
    })),
    objectTypes: response.objectTypes.map(typeFromCanonical),
    objects: response.objects.map((object) => ({
      code: object.code,
      name: object.name,
      objectTypeCode: object.objectTypeCode,
      initialLocationCode: object.locationCode,
      global: object.isGlobal,
      initialStateOverrides: Object.entries(object.initialStateOverride).map(([stateCode, value]) => ({ stateCode, value: scalarToString(value) })),
      actionResults: object.actionRules.map((rule, index) => ({
        code: `rule-${object.code}-${index + 1}`,
        actionCode: rule.actionCode,
        fromStateCode: conditionStateCode(rule.condition),
        fromStateValue: scalarToString(rule.condition.value),
        priority: rule.priority,
        note: rule.authoringNote ?? '',
        effects: rule.effects.map(effectFromCanonical).filter((effect): effect is ScenarioRuleEffectPayload => effect !== null),
        _canonical: rule,
      })),
      _canonical: object,
    })),
  };
}

function typeByCode(ruleData: ScenarioRuleDataPayload, code: string) {
  return ruleData.objectTypes.find((type) => type.code === code);
}

function stateValue(ruleData: ScenarioRuleDataPayload, objectTypeCode: string, stateCode: string, value: string) {
  const state = typeByCode(ruleData, objectTypeCode)?.stateFields.find((field) => field.code === stateCode);
  return parseValue(value, state?.valueType ?? 'string');
}

function actionToCanonical(action: ScenarioObjectTypePayload['actions'][number], type: ScenarioObjectTypePayload): CanonicalScenarioActionDto {
  const argumentProperties = Object.fromEntries(action.argumentFields.map((field) => [field.code, { ...field._canonical, type: field.valueType, title: field.label }]));
  const previousCondition = action._canonical?.availabilityCondition ?? {};
  const previousCode = conditionStateCode(previousCondition);
  const availabilityCondition = action.availability === 'always' ? {} : previousCode === action.availabilityStateCode
    ? previousCondition
    : {
        op: 'eq',
        path: `state.${action.availabilityStateCode}`,
        value: parseValue(type.stateFields.find((field) => field.code === action.availabilityStateCode)?.defaultValue ?? '', type.stateFields.find((field) => field.code === action.availabilityStateCode)?.valueType ?? 'string'),
      };
  return {
    code: action.code,
    label: action.label,
    description: action.description,
    argumentSchema: {
      ...(action._canonical?.argumentSchema ?? {}),
      type: 'object',
      additionalProperties: false,
      properties: argumentProperties,
      required: action.argumentFields.filter((field) => field.required).map((field) => field.code),
    },
    availabilityCondition,
    visibility: action.visibility,
    executionMode: action._canonical?.executionMode ?? 'rule',
  };
}

function effectToCanonical(effect: ScenarioRuleEffectPayload, ruleData: ScenarioRuleDataPayload, objectTypeCode: string): ScenarioJsonObject {
  if (effect.kind === 'set-state') return {
    ...effect._canonical,
    type: 'set-state',
    path: `state.${effect.stateCode}`,
    value: stateValue(ruleData, objectTypeCode, effect.stateCode, effect.value),
    ...(effect.targetObjectCode ? { objectCode: effect.targetObjectCode } : {}),
  };
  if (effect.kind === 'move-object') return {
    ...effect._canonical,
    type: 'move-object',
    locationCode: effect.locationCode,
    ...(effect.targetObjectCode ? { objectCode: effect.targetObjectCode } : {}),
  };
  return { ...effect._canonical, type: effect.kind, text: effect.text };
}

function ruleToCanonical(rule: ScenarioObjectActionResultPayload, ruleData: ScenarioRuleDataPayload, objectTypeCode: string): CanonicalScenarioActionRuleDto {
  const representedSources = new Set(rule.effects.map((effect) => effect._canonical).filter(Boolean));
  const unrepresentedEffects = (rule._canonical?.effects ?? []).filter((effect) => {
    const object = asObject(effect);
    return !representedSources.has(object) && !['set-state', 'move-object', 'emit-fact', 'add-narrative-hint'].includes(String(object.type));
  });
  return {
    actionCode: rule.actionCode,
    condition: rule.fromStateCode ? {
      ...(rule._canonical?.condition ?? {}),
      op: 'eq',
      path: `state.${rule.fromStateCode}`,
      value: stateValue(ruleData, objectTypeCode, rule.fromStateCode, rule.fromStateValue),
    } : rule._canonical?.condition ?? {},
    priority: rule.priority,
    authoringNote: rule.note,
    effects: [...rule.effects.map((effect) => effectToCanonical(effect, ruleData, objectTypeCode)), ...unrepresentedEffects],
    moduleBinding: rule._canonical?.moduleBinding ?? null,
  };
}

export function formRuleDataToCanonical(ruleData: ScenarioRuleDataPayload): CanonicalScenarioRuleDataRequest {
  return {
    schemaVersion: ruleData.schemaVersion,
    locations: ruleData.locations.map((location) => ({
      code: location.code,
      name: location.name,
      description: location.description,
      authoringData: { ...(location._canonical?.authoringData ?? {}), atmosphere: location.atmosphere, danger: location.danger },
    })),
    objectTypes: ruleData.objectTypes.map((type) => ({
      code: type.code,
      name: type.name,
      description: type.description,
      schemaVersion: type.schemaVersion,
      stateSchema: {
        ...(type._canonical?.stateSchema ?? {}),
        type: 'object',
        additionalProperties: false,
        properties: Object.fromEntries(type.stateFields.map((field) => [field.code, { ...field._canonical, type: field.valueType, title: field.label }])),
        required: type.stateFields.map((field) => field.code),
      },
      defaultState: Object.fromEntries(type.stateFields.map((field) => [field.code, parseValue(field.defaultValue, field.valueType)])),
      publicProjection: { ...(type._canonical?.publicProjection ?? {}), include: type.stateFields.filter((field) => field.visibility === 'public').map((field) => field.code) },
      actions: type.actions.map((action) => actionToCanonical(action, type)),
    })),
    objects: ruleData.objects.map((object) => ({
      code: object.code,
      name: object.name,
      objectTypeCode: object.objectTypeCode,
      locationCode: object.initialLocationCode,
      initialStateOverride: Object.fromEntries(object.initialStateOverrides.map((item) => [item.stateCode, stateValue(ruleData, object.objectTypeCode, item.stateCode, item.value)])),
      isGlobal: object.global,
      actionRules: object.actionResults.map((rule) => ruleToCanonical(rule, ruleData, object.objectTypeCode)),
    })),
  };
}
