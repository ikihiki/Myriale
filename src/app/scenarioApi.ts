import { canonicalRuleDataToForm, formRuleDataToCanonical } from './scenarioRuleDataAdapters';

export type ScenarioStateValueType = 'boolean' | 'string' | 'number';
export type ScenarioStateVisibility = 'public' | 'private';
export type ScenarioActionVisibility = 'ai-choice' | 'manual-ui' | 'system-only';
export type ScenarioJsonValue = string | number | boolean | null | ScenarioJsonValue[] | { [key: string]: ScenarioJsonValue };
export type ScenarioJsonObject = { [key: string]: ScenarioJsonValue };

export type CanonicalScenarioLocationDto = {
  code: string;
  name: string;
  description: string | null;
  authoringData: ScenarioJsonObject;
};

export type CanonicalScenarioActionDto = {
  code: string;
  label: string;
  description: string | null;
  argumentSchema: ScenarioJsonObject;
  availabilityCondition: ScenarioJsonObject;
  visibility: ScenarioActionVisibility;
  executionMode: 'rule' | 'extension-module';
};

export type CanonicalScenarioModuleBindingDto = {
  moduleId: string;
  version: string;
  digest: string;
  configuration: ScenarioJsonObject;
};

export type CanonicalScenarioActionRuleDto = {
  code: string;
  actionCode: string;
  condition: ScenarioJsonObject;
  priority: number;
  authoringNote: string | null;
  effects: ScenarioJsonValue[];
  moduleBinding: CanonicalScenarioModuleBindingDto | null;
};

export type CanonicalScenarioObjectRuleOperationDto =
  | ({ operation: 'add' } & CanonicalScenarioActionRuleDto)
  | ({ operation: 'override'; targetTypeCode: string; targetRuleCode: string } & Omit<CanonicalScenarioActionRuleDto, 'code'>)
  | { operation: 'delete'; targetTypeCode: string; targetRuleCode: string }
  | {
      operation: 'adjust';
      targetTypeCode: string;
      targetRuleCode: string;
      condition?: ScenarioJsonObject;
      priority?: number;
      authoringNote?: string | null;
      effects?: ScenarioJsonValue[];
      moduleBinding?: CanonicalScenarioModuleBindingDto | null;
    };

export type CanonicalScenarioObjectTypeDto = {
  code: string;
  name: string;
  description: string | null;
  schemaVersion: number;
  stateSchema: ScenarioJsonObject;
  defaultState: ScenarioJsonObject;
  publicProjection: ScenarioJsonObject;
  actions: CanonicalScenarioActionDto[];
  actionRules: CanonicalScenarioActionRuleDto[];
};

export type CanonicalScenarioObjectDto = {
  code: string;
  name: string;
  mixinTypeCodes: string[];
  locationCode: string;
  stateSchema: ScenarioJsonObject;
  defaultState: ScenarioJsonObject;
  publicProjection: ScenarioJsonObject;
  actions: CanonicalScenarioActionDto[];
  initialStateOverride: ScenarioJsonObject;
  isGlobal: boolean;
  actionRules: CanonicalScenarioObjectRuleOperationDto[];
};

export type CanonicalScenarioRuleDataRequest = {
  schemaVersion: number;
  locations: CanonicalScenarioLocationDto[];
  objectTypes: CanonicalScenarioObjectTypeDto[];
  objects: CanonicalScenarioObjectDto[];
};

export type CanonicalScenarioRuleDataResponse = CanonicalScenarioRuleDataRequest & {
  scenarioId: string;
  definitionVersionId: string;
  version: number;
  status: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type ScenarioStateFieldPayload = {
  code: string;
  label: string;
  valueType: ScenarioStateValueType;
  defaultValue: string;
  visibility: ScenarioStateVisibility;
};

export type ScenarioActionArgumentFieldPayload = {
  code: string;
  label: string;
  valueType: ScenarioStateValueType;
  required: boolean;
};

export type ScenarioConditionSource = 'state' | 'arguments' | 'session.flags';
export type ScenarioConditionScalar = string | number | boolean;
export type ScenarioConditionValueType = 'string' | 'number' | 'boolean';
export type ScenarioCondition =
  | { kind: 'always' }
  | { kind: 'comparison'; operator: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte'; source: ScenarioConditionSource; path: string; valueType: ScenarioConditionValueType; value: ScenarioConditionScalar }
  | { kind: 'in'; source: ScenarioConditionSource; path: string; valueType: ScenarioConditionValueType; values: ScenarioConditionScalar[] }
  | { kind: 'exists'; source: ScenarioConditionSource; path: string }
  | { kind: 'group'; operator: 'and' | 'or'; children: ScenarioCondition[] }
  | { kind: 'not'; child: ScenarioCondition }
  | { kind: 'unsupported'; canonical: ScenarioJsonObject };

export type ScenarioObjectTypeActionPayload = {
  code: string;
  label: string;
  description: string;
  visibility: ScenarioActionVisibility;
  availabilityCondition: ScenarioCondition;
  argumentFields: ScenarioActionArgumentFieldPayload[];
};

export type ScenarioObjectTypePayload = {
  code: string;
  name: string;
  description: string;
  schemaVersion: 1;
  stateFields: ScenarioStateFieldPayload[];
  actions: ScenarioObjectTypeActionPayload[];
  actionRules: ScenarioActionRulePayload[];
};

export type ScenarioLocationPayload = {
  code: string;
  name: string;
  description: string;
  atmosphere: string;
  danger: string;
};

export type ScenarioRuleEffectPayload =
  | { kind: 'set-state'; targetObjectCode: string; stateCode: string; value: string }
  | { kind: 'move-object'; targetObjectCode: string; locationCode: string }
  | { kind: 'move-session'; locationCode: string }
  | { kind: 'emit-fact'; text: string }
  | { kind: 'emit-event'; event: string; locationCode: string }
  | { kind: 'add-narrative-hint'; text: string }
  | { kind: 'forbid-narrative-fact'; text: string }
  | { kind: 'unsupported'; type: string; _canonical: ScenarioJsonObject };

export type ScenarioModuleBindingPayload = CanonicalScenarioModuleBindingDto;

export type ScenarioActionRulePayload = {
  code: string;
  actionCode: string;
  condition: ScenarioCondition;
  priority: number;
  note: string;
  effects: ScenarioRuleEffectPayload[];
  moduleBinding: ScenarioModuleBindingPayload | null;
};

export type ScenarioObjectRuleOperationPayload =
  | { operation: 'add'; rule: ScenarioActionRulePayload }
  | { operation: 'override'; targetTypeCode: string; targetRuleCode: string; rule: ScenarioActionRulePayload }
  | { operation: 'delete'; targetTypeCode: string; targetRuleCode: string }
  | {
      operation: 'adjust';
      targetTypeCode: string;
      targetRuleCode: string;
      adjustments: {
        condition?: ScenarioCondition;
        priority?: number;
        note?: string | null;
        effects?: ScenarioRuleEffectPayload[];
        moduleBinding?: ScenarioModuleBindingPayload | null;
      };
    };

export type ScenarioObjectPayload = {
  code: string;
  name: string;
  mixinTypeCodes: string[];
  initialLocationCode: string;
  global: boolean;
  stateFields: ScenarioStateFieldPayload[];
  actions: ScenarioObjectTypeActionPayload[];
  initialStateOverrides: Array<{ stateCode: string; value: string }>;
  actionRules: ScenarioObjectRuleOperationPayload[];
};

export type ScenarioRuleDataPayload = {
  schemaVersion: 2;
  locations: ScenarioLocationPayload[];
  objectTypes: ScenarioObjectTypePayload[];
  objects: ScenarioObjectPayload[];
};

export type CreateScenarioPayload = {
  title: string;
  summary?: string;
  genre?: string;
  tone?: string;
  lore?: string;
  aiFreedom?: string;
  heroMode?: 'fixed' | 'select' | 'free';
  heroFreeGenerationAllowed?: boolean;
  hero?: string;
  opening?: string;
  illustrationStyle?: string;
  illustrationMood?: string;
  illustrationNegative?: string;
  sampleScene?: string;
  ruleData?: ScenarioRuleDataPayload;
};

export type ScenarioDraftDto = Required<Omit<CreateScenarioPayload, 'ruleData'>> & {
  id: string;
  status: 'draft' | string;
  updatedAt: string;
  /** Standalone demo compatibility only; the production detail endpoint does not wrap rule data. */
  ruleData?: ScenarioRuleDataPayload;
};

export type ScenarioRuleDataReadinessDto = {
  definitionVersionId: string;
  ready: boolean;
  errors: Record<string, string[]>;
};

export type ScenarioRuleDebugObjectState = {
  objectCode: string;
  locationCode: string;
  state: ScenarioJsonObject;
};

export type ScenarioRuleDebugRequest = {
  trigger: 'enumerate' | 'direct-action' | 'player-input';
  currentLocationCode: string;
  flags: Record<string, boolean>;
  objects: ScenarioRuleDebugObjectState[];
  objectCode?: string | null;
  actionCode?: string | null;
  arguments: ScenarioJsonObject;
  playerInput?: string | null;
};

export type ScenarioRuleDebugResponse = {
  snapshot: {
    schemaVersion: string;
    snapshotId: string;
    currentLocation: { id: string; code: string; name: string; description: string };
    objects: Array<{ id: string; code: string; name: string; locationId: string; isGlobal: boolean; revision: number; state: ScenarioJsonObject }>;
    actions: Array<{ objectId: string; actionId: string; code: string; label: string; description: string; argumentSchema: ScenarioJsonObject; enabled: boolean }>;
  };
  decision?: { schemaVersion: string; objectId: string; actionId: string; arguments: ScenarioJsonObject } | null;
  selectedRuleCode?: string | null;
  appliedEffects: Array<{ type: string; targetId?: string | null; path?: string | null; value?: ScenarioJsonValue }>;
  postState?: {
    schemaVersion: string;
    currentLocation: { id: string; code: string; name: string; description: string };
    objects: Array<{ id: string; code: string; name: string; locationId: string; isGlobal: boolean; revision: number; state: ScenarioJsonObject }>;
    sessionFlags: Record<string, boolean>;
    sessionStateRevision: number;
  } | null;
  facts: string[];
  events: ScenarioJsonValue[];
  hints: string[];
  forbiddenFacts: string[];
};

export type ScenarioApiError = Error & {
  status?: number;
  errors?: Record<string, string[]>;
};

export type ScenarioAiKind = 'summary' | 'illustration-style' | 'illustration-prompt' | 'illustration-preview';

export type ScenarioAiAssistPayload = CreateScenarioPayload & {
  kind: ScenarioAiKind;
  target: string;
};

export type ScenarioAiSuggestion = { id: string; body: string; rationale: string };

export type ScenarioAiAssistResponse = {
  message: string;
  suggestions: ScenarioAiSuggestion[];
  prompt?: string | null;
  negativePrompt?: string | null;
  previewText?: string | null;
};

export type RecommendScenarioHeroPayload = {
  currentName?: string;
  currentProfile?: string;
};

export type ScenarioHeroRecommendation = {
  name: string;
  profile: string;
  message: string;
};

export type ScenarioApi = {
  getScenarios: (signal?: AbortSignal) => Promise<ScenarioDraftDto[]>;
  getScenario: (scenarioId: string, signal?: AbortSignal) => Promise<ScenarioDraftDto>;
  getScenarioRuleData: (scenarioId: string, signal?: AbortSignal) => Promise<ScenarioRuleDataPayload>;
  createScenarioRuleDataDraft: (scenarioId: string, signal?: AbortSignal) => Promise<ScenarioRuleDataPayload>;
  putScenarioRuleData: (scenarioId: string, payload: ScenarioRuleDataPayload) => Promise<ScenarioRuleDataPayload>;
  getScenarioRuleDataReadiness: (scenarioId: string, signal?: AbortSignal) => Promise<ScenarioRuleDataReadinessDto>;
  debugScenarioRuleData: (scenarioId: string, payload: ScenarioRuleDebugRequest) => Promise<ScenarioRuleDebugResponse>;
  recommendHero: (scenarioId: string, payload: RecommendScenarioHeroPayload) => Promise<ScenarioHeroRecommendation>;
  createScenario: (payload: CreateScenarioPayload) => Promise<ScenarioDraftDto>;
  updateScenario: (scenarioId: string, payload: CreateScenarioPayload) => Promise<ScenarioDraftDto>;
  assistScenario: (payload: ScenarioAiAssistPayload) => Promise<ScenarioAiAssistResponse>;
};

const SCENARIO_API_PATH = '/api/scenarios';

export function getScenarioApiBaseUrl() {
  const configured = import.meta.env.VITE_MYRIAL_API_BASE_URL?.trim();
  if (configured && configured.length > 0) return `${configured.replace(/\/$/, '')}${SCENARIO_API_PATH}`;
  return import.meta.env.VITE_MYRIAL_API_MODE === 'proxy' ? SCENARIO_API_PATH : null;
}

export function createFetchScenarioApi(baseUrl = getScenarioApiBaseUrl()): ScenarioApi {
  if (!baseUrl) return createDemoScenarioApi();

  return {
    async getScenarios(signal) {
      const response = await fetch(`${baseUrl}/`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal,
      });
      if (!response.ok) throw await toApiError(response);
      return response.json() as Promise<ScenarioDraftDto[]>;
    },
    async getScenario(scenarioId, signal) {
      const response = await fetch(`${baseUrl}/${encodeURIComponent(scenarioId)}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal,
      });
      if (!response.ok) throw await toApiError(response);
      return response.json() as Promise<ScenarioDraftDto>;
    },
    async getScenarioRuleData(scenarioId, signal) {
      const response = await fetch(`${baseUrl}/${encodeURIComponent(scenarioId)}/rule-data`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal,
      });
      if (!response.ok) throw await toApiError(response);
      return canonicalRuleDataToForm(await response.json() as CanonicalScenarioRuleDataResponse);
    },
    async createScenarioRuleDataDraft(scenarioId, signal) {
      const response = await fetch(`${baseUrl}/${encodeURIComponent(scenarioId)}/rule-data/drafts`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal,
      });
      if (!response.ok) throw await toApiError(response);
      return canonicalRuleDataToForm(await response.json() as CanonicalScenarioRuleDataResponse);
    },
    async putScenarioRuleData(scenarioId, payload) {
      const response = await fetch(`${baseUrl}/${encodeURIComponent(scenarioId)}/rule-data`, {
        method: 'PUT',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(formRuleDataToCanonical(payload)),
      });
      if (!response.ok) throw await toApiError(response);
      return canonicalRuleDataToForm(await response.json() as CanonicalScenarioRuleDataResponse);
    },
    async getScenarioRuleDataReadiness(scenarioId, signal) {
      const response = await fetch(`${baseUrl}/${encodeURIComponent(scenarioId)}/rule-data/readiness`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal,
      });
      if (!response.ok) throw await toApiError(response);
      return response.json() as Promise<ScenarioRuleDataReadinessDto>;
    },
    async debugScenarioRuleData(scenarioId, payload) {
      const response = await fetch(`${baseUrl}/${encodeURIComponent(scenarioId)}/rule-data/debug`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw await toApiError(response);
      return response.json() as Promise<ScenarioRuleDebugResponse>;
    },
    async recommendHero(scenarioId, payload) {
      const response = await fetch(`${baseUrl}/${encodeURIComponent(scenarioId)}/hero-recommendation`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw await toApiError(response);
      return response.json() as Promise<ScenarioHeroRecommendation>;
    },
    async createScenario(payload) {
      const response = await fetch(`${baseUrl}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(toScenarioTransport(payload)),
      });
      if (!response.ok) throw await toApiError(response);
      return response.json() as Promise<ScenarioDraftDto>;
    },
    async updateScenario(scenarioId, payload) {
      const response = await fetch(`${baseUrl}/${encodeURIComponent(scenarioId)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(toScenarioTransport(payload)),
      });
      if (!response.ok) throw await toApiError(response);
      return response.json() as Promise<ScenarioDraftDto>;
    },
    async assistScenario(payload) {
      const response = await fetch(`${baseUrl}/ai/assist`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(toAssistTransport(payload)),
      });
      if (!response.ok) throw await toApiError(response);
      return response.json() as Promise<ScenarioAiAssistResponse>;
    },
  };
}

const emptyScenarioRuleData = (): ScenarioRuleDataPayload => ({ schemaVersion: 2, locations: [], objectTypes: [], objects: [] });

const awakeningLaboratoryRuleData: ScenarioRuleDataPayload = {
  schemaVersion: 2,
  locations: [
    { code: 'laboratory', name: '地下研究室', description: '非常灯だけが残る閉鎖研究室。', atmosphere: '静かな緊張感', danger: '隔壁が閉鎖されている' },
    { code: 'service-corridor', name: '保守通路', description: '脱出経路へ続く狭い通路。', atmosphere: '機械音と冷気', danger: '電源復旧前は暗い' },
  ],
  objectTypes: [{
    code: 'sealed-door',
    name: '隔壁扉',
    description: '開閉状態を持つ研究施設の扉。',
    schemaVersion: 1,
    stateFields: [{ code: 'open', label: '開いている', valueType: 'boolean', defaultValue: 'false', visibility: 'public' }],
    actions: [{ code: 'open', label: '扉を開ける', description: '閉じた隔壁を開く。', visibility: 'ai-choice', availabilityCondition: { kind: 'comparison', operator: 'eq', source: 'state', path: 'open', valueType: 'boolean', value: false }, argumentFields: [] }],
    actionRules: [],
  }],
  objects: [{
    code: 'north-door',
    name: '北側の隔壁',
    mixinTypeCodes: ['sealed-door'],
    stateFields: [],
    actions: [],
    initialLocationCode: 'laboratory',
    global: false,
    initialStateOverrides: [],
    actionRules: [{
      operation: 'add',
      rule: {
        code: 'open-north-door',
        actionCode: 'open',
        condition: { kind: 'comparison', operator: 'eq', source: 'state', path: 'open', valueType: 'boolean', value: false },
        priority: 100,
        note: '通常の開扉結果。',
        effects: [
          { kind: 'set-state', targetObjectCode: 'north-door', stateCode: 'open', value: 'true' },
          { kind: 'emit-fact', text: '北側の隔壁が開いた。' },
          { kind: 'add-narrative-hint', text: '冷たい空気が保守通路から流れ込む。' },
        ],
        moduleBinding: null,
      },
    }],
  }],
};

const awakeningLaboratoryScenario: ScenarioDraftDto = {
  id: 'SCN-AWAKENING-LAB',
  title: '目覚めの研究室',
  summary: '# あなたの役割\nあなたはTRPGのゲームマスターです。\n# シナリオ\nプレイヤーは閉鎖された地下研究施設で目を覚まします。記憶を失っており、自身の正体も施設の目的も知りません。探索や会話を通して真実を知り、最終的に施設から脱出することが目的です。\n# 描写\n- 緊張感のある静かな雰囲気を維持する',
  genre: 'SFミステリー脱出劇',
  tone: '',
  lore: '',
  aiFreedom: '低: 厳密に守る',
  heroMode: 'free',
  heroFreeGenerationAllowed: false,
  hero: '',
  opening: 'あなたは閉鎖された地下研究施設で目を覚ます。記憶は失われ、自身の正体も施設の目的も分からない。',
  illustrationStyle: '',
  illustrationMood: '',
  illustrationNegative: '',
  sampleScene: '',
  ruleData: awakeningLaboratoryRuleData,
  status: 'published',
  updatedAt: '2026-07-23',
};

const demoScenarios: Record<string, ScenarioDraftDto> = {
  [awakeningLaboratoryScenario.id]: awakeningLaboratoryScenario,
  'SCN-STAR-LIBRARY': {
    id: 'SCN-STAR-LIBRARY',
    title: '星喰いの地下図書館',
    summary: '地下に沈んだ王都で、禁書を読むたびに星座が書き換わる探索譚。',
    genre: 'ダークファンタジー探索譚',
    tone: '静かで不穏、淡い希望',
    lore: '星座は魔法体系の鍵。死者の名前を読むと記憶を失う。',
    aiFreedom: '中: 設定を守りつつ提案する',
    heroMode: 'select',
    heroFreeGenerationAllowed: false,
    hero: 'ミラ / 星図を読む巡礼者\nセオ / 星図を燃やす護衛\nエル / 記憶を失った写字生',
    opening: 'あなたは水没した閲覧室で目を覚ます。',
    illustrationStyle: '銅版画風 / 低彩度 / 細密',
    illustrationMood: '孤独、湿った静けさ、薄い金色の灯り',
    illustrationNegative: '現代車両、銃器、過度な流血',
    sampleScene: '水没した閲覧室で、星図を抱えた司書が振り向く。',
    ruleData: emptyScenarioRuleData(),
    status: 'published',
    updatedAt: '2026-07-19',
  },
  'SCN-ASH-STATION': {
    id: 'SCN-ASH-STATION',
    title: '灰の駅と宛名のない切符',
    summary: '朝が来ない荒野を、宛名のない切符だけを頼りに渡るロードムービー。',
    genre: '終末ロードムービー',
    tone: '乾いた祈り、遠い汽笛',
    lore: '朝が来ない荒野では、切符だけが次の町を覚えている。',
    aiFreedom: '高: 展開を広げる',
    heroMode: 'free',
    heroFreeGenerationAllowed: false,
    hero: '灰の駅で目覚めた旅人。名前と過去はプレイヤーが自由に決められる。',
    opening: 'あなたは灰の降る駅で、宛名のない切符を握っている。',
    illustrationStyle: '水彩 / くすんだ暖色 / 粒状感',
    illustrationMood: '郷愁、灰、遠い光',
    illustrationNegative: '鮮やかな原色、近未来都市',
    sampleScene: '灰の降る無人駅で、宛名のない切符が淡く光る。',
    ruleData: emptyScenarioRuleData(),
    status: 'published',
    updatedAt: '2026-07-19',
  },
  'SCN-MOONLIT-GARDEN': {
    id: 'SCN-MOONLIT-GARDEN',
    title: '月虹の庭と眠らない時計',
    summary: '月虹が咲く庭園で、止まらない時計塔と消えた庭師の秘密を追う幻想譚。',
    genre: '幻想庭園ミステリ',
    tone: '華やかで切ない、夜明け前の期待',
    lore: '庭園の花は訪問者の記憶から色を得る。時計塔が十三回鳴ると、選ばなかった未来が姿を現す。',
    aiFreedom: '中: 庭園の法則を守りつつ提案する',
    heroMode: 'select',
    heroFreeGenerationAllowed: true,
    hero: 'イリス / 月虹を集める若い庭師\nカイ / 時計塔を修理する旅の技師\nマレ / 忘れられた未来を記録する画家',
    opening: '十三回目の鐘が鳴り、あなたの足元に見覚えのない月虹の花が咲く。',
    illustrationStyle: '幻想植物画 / 月光色 / 装飾的',
    illustrationMood: '月虹、夜露、静かな祝祭',
    illustrationNegative: '現代的な電子機器、昼の青空、過度な恐怖表現',
    sampleScene: '月虹の花が揺れる庭園で、止まらない時計塔を三人の旅人が見上げる。',
    ruleData: emptyScenarioRuleData(),
    status: 'published',
    updatedAt: '2026-07-19',
  },
  'SCN-GLASS-FOREST': {
    id: 'SCN-GLASS-FOREST',
    title: '硝子の森と夜明けの司書',
    summary: '嘘を映す硝子の森で、夜明けを失った書架の秘密を追う幻想ミステリ。',
    genre: '幻想ミステリ',
    tone: '透明で緊張感のある静けさ',
    lore: '森の硝子片は、嘘をついた者の声だけを反射する。',
    aiFreedom: '低: 厳密に守る',
    heroMode: 'fixed',
    heroFreeGenerationAllowed: false,
    hero: 'リュシエン / 夜明け前の森を巡る司書',
    opening: '夜明け前の森で、割れた書架が小さく鳴る。',
    illustrationStyle: '硝子版画 / 青白い光 / 緻密',
    illustrationMood: '透明、静寂、夜明け前',
    illustrationNegative: '現代建築、原色、コミカルな表現',
    sampleScene: '硝子の木々の間で、司書が割れた本を拾い上げる。',
    ruleData: emptyScenarioRuleData(),
    status: 'published',
    updatedAt: '2026-07-19',
  },
};

export function createDemoScenarioApi(): ScenarioApi {
  return {
    async getScenarios() {
      return [{ ...awakeningLaboratoryScenario }];
    },
    async getScenario(scenarioId) {
      const scenario = demoScenarios[scenarioId];
      if (!scenario) throw demoError('シナリオが見つかりません。', 404);
      return { ...scenario };
    },
    async getScenarioRuleData(scenarioId) {
      const scenario = demoScenarios[scenarioId];
      if (!scenario) throw demoError('シナリオが見つかりません。', 404);
      return structuredClone(scenario.ruleData ?? emptyScenarioRuleData());
    },
    async createScenarioRuleDataDraft(scenarioId) {
      const scenario = demoScenarios[scenarioId];
      if (!scenario) throw demoError('シナリオが見つかりません。', 404);
      return structuredClone(scenario.ruleData ?? emptyScenarioRuleData());
    },
    async putScenarioRuleData(scenarioId, payload) {
      const scenario = demoScenarios[scenarioId];
      if (!scenario) throw demoError('シナリオが見つかりません。', 404);
      scenario.ruleData = structuredClone(payload);
      return structuredClone(payload);
    },
    async getScenarioRuleDataReadiness(scenarioId) {
      if (!demoScenarios[scenarioId]) throw demoError('シナリオが見つかりません。', 404);
      return { definitionVersionId: `demo-${scenarioId}`, ready: true, errors: {} };
    },
    async debugScenarioRuleData(scenarioId, payload) {
      const scenario = demoScenarios[scenarioId];
      if (!scenario) throw demoError('シナリオが見つかりません。', 404);
      const object = scenario.ruleData?.objects.find((candidate) => candidate.code === payload.objectCode) ?? scenario.ruleData?.objects[0];
      const location = scenario.ruleData?.locations.find((candidate) => candidate.code === payload.currentLocationCode) ?? scenario.ruleData?.locations[0];
      const action = object ? [...object.actions, ...object.mixinTypeCodes.flatMap((code) => scenario.ruleData?.objectTypes.find((type) => type.code === code)?.actions ?? [])].find((candidate) => candidate.code === payload.actionCode) : undefined;
      const publicObject = object ? { id: object.code, code: object.code, name: object.name, locationId: payload.objects.find((state) => state.objectCode === object.code)?.locationCode ?? object.initialLocationCode, isGlobal: object.global, revision: 0, state: payload.objects.find((state) => state.objectCode === object.code)?.state ?? {} } : null;
      const snapshot = { schemaVersion: 'rule-action-snapshot.v1', snapshotId: 'DEMO-DEBUG', currentLocation: { id: location?.code ?? '', code: location?.code ?? '', name: location?.name ?? '', description: location?.description ?? '' }, objects: publicObject ? [publicObject] : [], actions: action && object ? [{ objectId: object.code, actionId: action.code, code: action.code, label: action.label, description: action.description, argumentSchema: {}, enabled: true }] : [] };
      return { snapshot, decision: action && object && payload.trigger !== 'enumerate' ? { schemaVersion: 'rule-action-decision.v1', objectId: object.code, actionId: action.code, arguments: payload.arguments } : null, selectedRuleCode: action ? `${action.code}-preview` : null, appliedEffects: [], postState: payload.trigger === 'enumerate' ? null : { schemaVersion: 'rule-post-state.v1', currentLocation: snapshot.currentLocation, objects: snapshot.objects, sessionFlags: payload.flags, sessionStateRevision: 1 }, facts: payload.trigger === 'enumerate' ? [] : ['デバッグ実行は本番Sessionへ保存されません。'], events: [], hints: payload.playerInput ? [`入力「${payload.playerInput}」からアクション候補を選択しました。`] : [], forbiddenFacts: [] };
    },
    async recommendHero(scenarioId) {
      const scenario = demoScenarios[scenarioId];
      if (!scenario) throw demoError('シナリオが見つかりません。', 404);
      return scenarioId === 'SCN-MOONLIT-GARDEN'
        ? {
            name: 'ルネ',
            profile: '失われた庭園の色を探し、十三回目の鐘の意味を読み解く記憶の採集者。',
            message: 'AIがシナリオ設定から主人公案を推薦しました。内容を確認・修正してから確定してください。',
          }
        : {
            name: 'ノクト',
            profile: `${scenario.title}の導入と世界観を手掛かりに、物語の謎を追う旅人。`,
            message: 'AIがシナリオ設定から主人公案を推薦しました。内容を確認・修正してから確定してください。',
          };
    },
    async createScenario(payload) {
      if (!payload.title.trim()) throw demoError('タイトルを入力すると下書き保存できます。', 400, { title: ['シナリオタイトルを入力してください。'] });
      return {
        id: 'SCN-DRAFT-0427',
        title: payload.title.trim(),
        summary: payload.summary?.trim() ?? '',
        genre: payload.genre?.trim() || '未分類',
        tone: payload.tone?.trim() ?? '',
        lore: payload.lore?.trim() ?? '',
        aiFreedom: payload.aiFreedom?.trim() ?? '',
        heroMode: payload.heroMode ?? 'free',
        heroFreeGenerationAllowed: payload.heroMode === 'select' && (payload.heroFreeGenerationAllowed ?? false),
        hero: payload.hero?.trim() ?? '',
        opening: payload.opening?.trim() ?? '',
        illustrationStyle: payload.illustrationStyle?.trim() ?? '',
        illustrationMood: payload.illustrationMood?.trim() ?? '',
        illustrationNegative: payload.illustrationNegative?.trim() ?? '',
        sampleScene: payload.sampleScene?.trim() ?? '',
        ruleData: payload.ruleData ?? emptyScenarioRuleData(),
        status: 'draft',
        updatedAt: '2026-06-29',
      };
    },
    async updateScenario(scenarioId, payload) {
      const current = demoScenarios[scenarioId];
      if (!current) throw demoError('シナリオが見つかりません。', 404);
      const updated: ScenarioDraftDto = {
        ...current,
        ...payload,
        title: payload.title.trim(),
        summary: payload.summary?.trim() ?? '',
        genre: payload.genre?.trim() || '未分類',
        tone: payload.tone?.trim() ?? '',
        lore: payload.lore?.trim() ?? '',
        updatedAt: '2026-07-24',
      } as ScenarioDraftDto;
      demoScenarios[scenarioId] = updated;
      return { ...updated };
    },
    async assistScenario(payload) {
      return demoAssist(payload);
    },
  };
}

export function firstScenarioFieldError(error: unknown, field: string) {
  return (error as ScenarioApiError | undefined)?.errors?.[field]?.[0];
}

async function toApiError(response: Response): Promise<ScenarioApiError> {
  let body: { message?: string; errors?: Record<string, string[]> } | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  const fallbackMessage = response.status === 404
    ? 'シナリオが見つかりません。'
    : `シナリオAPIへの接続に失敗しました（${response.status}）。`;
  const error = new Error(body?.message ?? fallbackMessage) as ScenarioApiError;
  error.status = response.status;
  error.errors = body?.errors;
  return error;
}

function toScenarioTransport(payload: CreateScenarioPayload) {
  const { ruleData: _ruleData, ...basicFields } = payload;
  return basicFields;
}

function toAssistTransport(payload: ScenarioAiAssistPayload) {
  return {
    kind: payload.kind,
    target: payload.target,
    title: payload.title ?? '',
    summary: payload.summary ?? '',
    genre: payload.genre ?? '',
    tone: payload.tone ?? '',
    lore: payload.lore ?? '',
    aiFreedom: payload.aiFreedom ?? '',
    heroMode: payload.heroMode ?? 'free',
    heroFreeGenerationAllowed: payload.heroMode === 'select' && (payload.heroFreeGenerationAllowed ?? false),
    hero: payload.hero ?? '',
    opening: payload.opening ?? '',
    illustrationStyle: payload.illustrationStyle ?? '',
    illustrationMood: payload.illustrationMood ?? '',
    illustrationNegative: payload.illustrationNegative ?? '',
    sampleScene: payload.sampleScene ?? '',
  };
}

function demoAssist(payload: ScenarioAiAssistPayload): ScenarioAiAssistResponse {
  if (payload.kind === 'summary') return { message: '基本情報案を3つ提示しました。採用、編集、破棄を選べます。', suggestions: [{ id: 'summary-1', body: '## 物語の目的\n\n地下に沈んだ王都で、禁書を読むたびに書き換わる星座の謎を追います。\n\n- 水没した書庫を探索する\n- 失われる記憶の代償を選ぶ', rationale: 'タイトル、ジャンル、基本情報からMarkdown案を生成しました。' }] };
  if (payload.kind === 'illustration-style') return { message: 'モックAIがシナリオに合う画風候補を提示しました。', suggestions: [{ id: 'style-1', body: '銅版画風、影絵、水彩写本。低彩度で星図の金線だけを強調。', rationale: '既存のムードとNG要素に合わせました。' }] };
  if (payload.kind === 'illustration-prompt') return { message: 'モックAIが画像生成用プロンプトとネガティブプロンプトを分離して生成しました。', suggestions: [{ id: 'prompt-1', body: 'submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette', rationale: 'プロンプトとNG要素を分離しました。' }], prompt: 'submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette', negativePrompt: payload.illustrationNegative };
  if (payload.kind === 'illustration-preview') return { message: 'モックAIがサンプルシーンのテキストプレビューを生成しました。', suggestions: [], previewText: `[Mock preview / 保存対象外] ${payload.sampleScene} / ${payload.illustrationStyle} / ${payload.illustrationMood}` };
  return { message: 'モックAIが提案を生成しました。', suggestions: [] };
}

function demoError(message: string, status: number, errors?: Record<string, string[]>): ScenarioApiError {
  const error = new Error(message) as ScenarioApiError;
  error.status = status;
  error.errors = errors;
  return error;
}
