export type CreateScenarioPayload = {
  title: string;
  summary?: string;
  genre?: string;
  tone?: string;
  lore?: string;
  aiFreedom?: string;
  hero?: string;
  opening?: string;
  illustrationStyle?: string;
  illustrationMood?: string;
  illustrationNegative?: string;
  sampleScene?: string;
};

export type ScenarioDraftDto = Required<CreateScenarioPayload> & {
  id: string;
  status: 'draft' | string;
  updatedAt: string;
};

export type ScenarioApiError = Error & {
  status?: number;
  errors?: Record<string, string[]>;
};

export type ScenarioAiKind = 'summary' | 'lore-check' | 'illustration-style' | 'illustration-prompt' | 'illustration-preview';

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

export type ScenarioApi = {
  createScenario: (payload: CreateScenarioPayload) => Promise<ScenarioDraftDto>;
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
    async createScenario(payload) {
      const response = await fetch(`${baseUrl}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

export function createDemoScenarioApi(): ScenarioApi {
  return {
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
        hero: payload.hero?.trim() ?? '',
        opening: payload.opening?.trim() ?? '',
        illustrationStyle: payload.illustrationStyle?.trim() ?? '',
        illustrationMood: payload.illustrationMood?.trim() ?? '',
        illustrationNegative: payload.illustrationNegative?.trim() ?? '',
        sampleScene: payload.sampleScene?.trim() ?? '',
        status: 'draft',
        updatedAt: '2026-06-29',
      };
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
  const error = new Error(body?.message ?? `Scenario API returned ${response.status}.`) as ScenarioApiError;
  error.status = response.status;
  error.errors = body?.errors;
  return error;
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
    hero: payload.hero ?? '',
    opening: payload.opening ?? '',
    illustrationStyle: payload.illustrationStyle ?? '',
    illustrationMood: payload.illustrationMood ?? '',
    illustrationNegative: payload.illustrationNegative ?? '',
    sampleScene: payload.sampleScene ?? '',
  };
}

function demoAssist(payload: ScenarioAiAssistPayload): ScenarioAiAssistResponse {
  if (payload.kind === 'summary') return { message: '概要案を3つ提示しました。採用、編集、破棄を選べます。', suggestions: [{ id: 'summary-1', body: '地下に沈んだ王都で、禁書を読むたびに星座が書き換わる探索譚。', rationale: 'title/genre/loreから安全なDraft概要を生成しました。' }] };
  if (payload.kind === 'lore-check') return { message: 'モックAIが世界観の矛盾候補を2件見つけました。', suggestions: [{ id: 'lore-1', body: '死者の名前を読む条件と記憶喪失の範囲を明確化すると、セッション中の判定が安定します。', rationale: 'Loreの発火条件を明文化します。' }] };
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
