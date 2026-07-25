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
    actionResults: (type.actionRules ?? []).map((rule, index) => ruleFromCanonical(rule, `type-${type.code}-${index + 1}`)),
    _canonical: type,
  };
}

function effectFromCanonical(effectValue: ScenarioJsonValue): ScenarioRuleEffectPayload {
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
  if (effect.type === 'move-session') return {
    kind: 'move-session',
    locationCode: typeof effect.locationCode === 'string' ? effect.locationCode : '',
    _canonical: effect,
  };
  if (effect.type === 'emit-fact') return { kind: 'emit-fact', text: typeof effect.text === 'string' ? effect.text : '', _canonical: effect };
  if (effect.type === 'emit-event') return {
    kind: 'emit-event',
    event: typeof effect.event === 'string' ? effect.event : '',
    locationCode: typeof effect.locationCode === 'string' ? effect.locationCode : '',
    _canonical: effect,
  };
  if (effect.type === 'add-narrative-hint') return { kind: 'add-narrative-hint', text: typeof effect.text === 'string' ? effect.text : '', _canonical: effect };
  if (effect.type === 'forbid-narrative-fact') return { kind: 'forbid-narrative-fact', text: typeof effect.text === 'string' ? effect.text : '', _canonical: effect };
  return { kind: 'unsupported', type: typeof effect.type === 'string' ? effect.type : 'unknown', _canonical: effect };
}

function ruleFromCanonical(rule: CanonicalScenarioActionRuleDto, code: string): ScenarioObjectActionResultPayload {
  return {
    code,
    actionCode: rule.actionCode,
    fromStateCode: conditionStateCode(rule.condition),
    fromStateValue: scalarToString(rule.condition.value),
    priority: rule.priority,
    note: rule.authoringNote ?? '',
    effects: rule.effects.map(effectFromCanonical),
    _canonical: rule,
  };
}

export function canonicalRuleDataToForm(response: CanonicalScenarioRuleDataResponse): ScenarioRuleDataPayload {
  if (response.schemaVersion !== 2) throw new Error(`Unsupported scenario rule schema version: ${response.schemaVersion}`);
  return {
    schemaVersion: 2,
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
      mixinTypeCodes: object.mixinTypeCodes,
      initialLocationCode: object.locationCode,
      global: object.isGlobal,
      stateFields: typeFromCanonical({ code: object.code, name: object.name, description: null, schemaVersion: 1, stateSchema: object.stateSchema, defaultState: object.defaultState, publicProjection: object.publicProjection, actions: object.actions }).stateFields,
      actions: object.actions.map(actionFromCanonical),
      initialStateOverrides: Object.entries(object.initialStateOverride).map(([stateCode, value]) => ({ stateCode, value: scalarToString(value) })),
      actionResults: object.actionRules.map((rule, index) => ruleFromCanonical(rule, `rule-${object.code}-${index + 1}`)),
      _canonical: object,
    })),
  };
}

function typeByCode(ruleData: ScenarioRuleDataPayload, code: string) {
  return ruleData.objectTypes.find((type) => type.code === code);
}

function stateValue(ruleData: ScenarioRuleDataPayload, sourceCode: string, stateCode: string, value: string) {
  const object = ruleData.objects.find((candidate) => candidate.code === sourceCode);
  const state = (object?.stateFields ?? []).find((field) => field.code === stateCode)
    ?? (object?.mixinTypeCodes ?? []).map((code) => typeByCode(ruleData, code)?.stateFields.find((field) => field.code === stateCode)).find(Boolean)
    ?? typeByCode(ruleData, sourceCode)?.stateFields.find((field) => field.code === stateCode);
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

function effectToCanonical(effect: ScenarioRuleEffectPayload, ruleData: ScenarioRuleDataPayload, sourceCode: string): ScenarioJsonObject {
  if (effect.kind === 'set-state') return {
    ...effect._canonical,
    type: 'set-state',
    path: `state.${effect.stateCode}`,
    value: stateValue(ruleData, sourceCode, effect.stateCode, effect.value),
    ...(effect.targetObjectCode ? { objectCode: effect.targetObjectCode } : {}),
  };
  if (effect.kind === 'move-object') return {
    ...effect._canonical,
    type: 'move-object',
    locationCode: effect.locationCode,
    ...(effect.targetObjectCode ? { objectCode: effect.targetObjectCode } : {}),
  };
  if (effect.kind === 'move-session') return {
    ...effect._canonical,
    type: 'move-session',
    locationCode: effect.locationCode,
  };
  if (effect.kind === 'emit-event') return {
    ...effect._canonical,
    type: 'emit-event',
    event: effect.event,
    ...(effect.locationCode ? { locationCode: effect.locationCode } : {}),
  };
  if (effect.kind === 'unsupported') return effect._canonical;
  return { ...effect._canonical, type: effect.kind, text: effect.text };
}

function ruleToCanonical(rule: ScenarioObjectActionResultPayload, ruleData: ScenarioRuleDataPayload, sourceCode: string): CanonicalScenarioActionRuleDto {
  return {
    actionCode: rule.actionCode,
    condition: rule.fromStateCode ? {
      ...(rule._canonical?.condition ?? {}),
      op: 'eq',
      path: `state.${rule.fromStateCode}`,
      value: stateValue(ruleData, sourceCode, rule.fromStateCode, rule.fromStateValue),
    } : rule._canonical?.condition ?? {},
    priority: rule.priority,
    authoringNote: rule.note,
    effects: rule.effects.map((effect) => effectToCanonical(effect, ruleData, sourceCode)),
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
      actionRules: (type.actionResults ?? []).map((rule) => ruleToCanonical(rule, ruleData, type.code)),
    })),
    objects: ruleData.objects.map((object) => ({
      code: object.code,
      name: object.name,
      mixinTypeCodes: object.mixinTypeCodes,
      locationCode: object.initialLocationCode,
      stateSchema: { type: 'object', additionalProperties: false, properties: Object.fromEntries((object.stateFields ?? []).map((field) => [field.code, { ...field._canonical, type: field.valueType, title: field.label }])), required: (object.stateFields ?? []).map((field) => field.code) },
      defaultState: Object.fromEntries((object.stateFields ?? []).map((field) => [field.code, parseValue(field.defaultValue, field.valueType)])),
      publicProjection: { include: (object.stateFields ?? []).filter((field) => field.visibility === 'public').map((field) => field.code) },
      actions: (object.actions ?? []).map((action) => actionToCanonical(action, { code: object.code, name: object.name, description: '', schemaVersion: 1, stateFields: object.stateFields ?? [], actions: object.actions ?? [], actionResults: [] })),
      initialStateOverride: Object.fromEntries(object.initialStateOverrides.map((item) => [item.stateCode, stateValue(ruleData, object.code, item.stateCode, item.value)])),
      isGlobal: object.global,
      actionRules: object.actionResults.map((rule) => ruleToCanonical(rule, ruleData, object.code)),
    })),
  };
}
