export type AiProviderKey = {
  provider: string;
  displayName: string;
  configured: boolean;
  maskedKey: string;
  status: string;
  updatedAt: string;
  lastValidatedAt?: string | null;
};

export type AdminAiApiError = Error & { status?: number; errors?: Record<string, string[]> };

export type AdminAiApi = {
  listKeys: () => Promise<AiProviderKey[]>;
  saveKey: (provider: string, payload: { displayName: string; secret: string }) => Promise<AiProviderKey>;
  deleteKey: (provider: string) => Promise<void>;
  testKey: (provider: string) => Promise<AiProviderKey>;
};

const ADMIN_AI_PATH = '/api/admin/ai-keys';

export function getAdminAiApiBaseUrl() {
  const configured = import.meta.env.VITE_MYRIAL_API_BASE_URL?.trim();
  if (configured && configured.length > 0) return `${configured.replace(/\/$/, '')}${ADMIN_AI_PATH}`;
  return import.meta.env.VITE_MYRIAL_API_MODE === 'proxy' ? ADMIN_AI_PATH : null;
}

export function createFetchAdminAiApi(baseUrl = getAdminAiApiBaseUrl()): AdminAiApi {
  if (!baseUrl) return createDemoAdminAiApi();

  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
      ...init,
    });
    if (!response.ok) throw await toError(response);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  };

  return {
    listKeys: () => request<AiProviderKey[]>('/'),
    saveKey: (provider, payload) => request<AiProviderKey>(`/${encodeURIComponent(provider)}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteKey: (provider) => request<void>(`/${encodeURIComponent(provider)}`, { method: 'DELETE' }),
    testKey: (provider) => request<AiProviderKey>(`/${encodeURIComponent(provider)}/test`, { method: 'POST' }),
  };
}

export function createDemoAdminAiApi(): AdminAiApi {
  let keys: AiProviderKey[] = [
    { provider: 'mock-text', displayName: 'Aspire Mock Text AI', configured: true, maskedKey: '••••••••demo', status: 'mock-validated', updatedAt: new Date().toISOString(), lastValidatedAt: new Date().toISOString() },
  ];
  return {
    async listKeys() { return keys; },
    async saveKey(provider, payload) {
      const key: AiProviderKey = { provider, displayName: payload.displayName, configured: true, maskedKey: `••••••••${payload.secret.slice(-4) || 'mock'}`, status: 'saved', updatedAt: new Date().toISOString(), lastValidatedAt: null };
      keys = [key, ...keys.filter((item) => item.provider !== provider)];
      return key;
    },
    async deleteKey(provider) { keys = keys.filter((item) => item.provider !== provider); },
    async testKey(provider) {
      keys = keys.map((item) => item.provider === provider ? { ...item, status: 'mock-validated', lastValidatedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : item);
      const key = keys.find((item) => item.provider === provider);
      if (!key) throw demoError('AIキーが見つかりません。', 404);
      return key;
    },
  };
}

export function firstAdminAiFieldError(error: unknown, field: string) {
  return (error as AdminAiApiError | undefined)?.errors?.[field]?.[0];
}

async function toError(response: Response): Promise<AdminAiApiError> {
  let body: { message?: string; errors?: Record<string, string[]> } | null = null;
  try { body = await response.json(); } catch { body = null; }
  const error = new Error(body?.message ?? `Admin AI API returned ${response.status}.`) as AdminAiApiError;
  error.status = response.status;
  error.errors = body?.errors;
  return error;
}

function demoError(message: string, status: number): AdminAiApiError {
  const error = new Error(message) as AdminAiApiError;
  error.status = status;
  return error;
}
