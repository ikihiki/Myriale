export type AiProfileDefinitionSource = 'deployment' | 'database';
export type AiCredentialSource = 'none' | 'deployment' | 'database';
export type AiValidationStatus = 'untested' | 'valid' | 'invalidCredential' | 'modelNotFound' | 'rateLimited' | 'providerUnavailable' | 'schemaFailure';

export type AdminAiProfile = {
  id: string; displayName: string; adapter: 'openai-compatible'; baseUrl: string; model: string; systemPrompt: string; credentialId: string;
  enabled: boolean; source: AiProfileDefinitionSource; revision: number; active: boolean; credentialSource: AiCredentialSource;
  credentialConfigured: boolean; credentialRevision: number; validationStatus: AiValidationStatus; lastValidatedAt?: string | null;
};
export type AdminAiCredential = { id: string; displayName: string; maskedSecret: string; source: AiCredentialSource; revision: number; updatedAt: string; referencedProfileCount: number };
export type AiPromptTestResult = { provider: string; model: string; response: string; inputTokens?: number | null; outputTokens?: number | null; latencyMilliseconds: number; finishReason?: string | null };
export type AiPlaygroundRole = 'system' | 'user' | 'assistant';
export type AiPlaygroundMessage = { role: AiPlaygroundRole; content: string };
export type AiPlaygroundGenerationOverrides = { temperature?: number | null; topP?: number | null; maximumOutputTokens?: number | null; seed?: number | null; retryAttempts?: number | null };
export type AiConversationTestResult = { message: AiPlaygroundMessage & { role: 'assistant' }; provider: string; model: string; responseId?: string | null; inputTokens?: number | null; outputTokens?: number | null; latencyMilliseconds: number; attemptCount: number; finishReason?: string | null; requestId?: string | null };
export type AiSessionChatWireMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  toolCallId?: string | null;
  toolCalls?: Array<{ id: string; name: string; argumentsJson: string }> | null;
};
export type AiRuleToolPreview = {
  toolCallId: string;
  selectionCode: string;
  arguments: unknown;
  status: string;
  errorCode?: string | null;
  objectCode?: string | null;
  actionCode?: string | null;
  appliedEffects?: unknown[] | null;
  postState?: unknown | null;
  facts?: string[] | null;
  events?: unknown[] | null;
  narrativeHints?: string[] | null;
  forbiddenNarrativeFacts?: string[] | null;
  completionIntent?: boolean | null;
  extensionRequested?: boolean | null;
};
export type AiSessionChatImportResult = {
  sessionId: string;
  turnId: string;
  turnPosition: number;
  systemMarkdown: string;
  messages: AiPlaygroundMessage[];
};
export type AiSessionChatTestResult = {
  message: AiSessionChatWireMessage & { role: 'assistant' };
  metadata: Omit<AiConversationTestResult, 'message' | 'requestId'> & {
    providerRounds: number;
    toolCallCount: number;
  };
  systemMarkdown: string;
  sentMessages: AiSessionChatWireMessage[];
  toolPreviews: AiRuleToolPreview[];
};
export type AiPlaygroundStoredMessage = AiPlaygroundMessage & { id: string };
export type AiPlaygroundStoredGeneration = { temperature: string; topP: string; maximumOutputTokens: string; seed: string; retryAttempts: string };
export type AiPlaygroundStoredResponse = {
  id: string;
  number: number;
  profile: { id: string; displayName: string; model: string };
  message: AiPlaygroundMessage & { role: 'assistant' };
  metadata: Omit<AiConversationTestResult, 'message'>;
  sentMessages?: AiSessionChatWireMessage[];
  systemMarkdown?: string;
  toolPreviews?: AiRuleToolPreview[];
};
export type AiPlaygroundStoredConversation = {
  id: string;
  title: string;
  sourceSessionId: string | null;
  sourceTurnId: string | null;
  sourceTurnPosition: number | null;
  maxToolRounds: string;
  messages: AiPlaygroundStoredMessage[];
  profileId: string | null;
  generation: AiPlaygroundStoredGeneration;
  responses: AiPlaygroundStoredResponse[];
  selectedResponseId: string | null;
};
export type AiPlaygroundDocument = { conversations: AiPlaygroundStoredConversation[]; selectedConversationId: string };
export type AiPlaygroundDocumentSnapshot = { document: AiPlaygroundDocument; revision: number; updatedAt: string };
export type AdminAiApiError = Error & { status?: number; errors?: Record<string, string[]> };
export type ProfileInput = { id: string; displayName: string; baseUrl: string; model: string; systemPrompt: string; credentialId: string; enabled: boolean };

export type AdminAiApi = {
  listProfiles: () => Promise<AdminAiProfile[]>;
  createProfile: (input: ProfileInput) => Promise<void>;
  updateProfile: (id: string, input: Omit<ProfileInput, 'id' | 'enabled'> & { expectedRevision: number }) => Promise<void>;
  setProfileEnabled: (id: string, enabled: boolean, expectedRevision: number) => Promise<void>;
  deleteProfile: (id: string, expectedRevision: number) => Promise<void>;
  activateProfile: (id: string) => Promise<void>;
  listCredentials: () => Promise<AdminAiCredential[]>;
  setCredential: (input: { id: string; displayName: string; secret: string }) => Promise<void>;
  replaceCredential: (id: string, input: { displayName: string; secret: string; expectedRevision: number }) => Promise<void>;
  deleteCredential: (id: string, expectedRevision: number) => Promise<void>;
  testConnection: (profile: AdminAiProfile) => Promise<void>;
  testPrompt: (profile: AdminAiProfile, prompt: string) => Promise<AiPromptTestResult>;
  testConversation: (profile: AdminAiProfile, messages: AiPlaygroundMessage[], generationOverrides: AiPlaygroundGenerationOverrides) => Promise<AiConversationTestResult>;
  importSessionTurn: (profile: AdminAiProfile, input: { sessionId: string; turnId: string }) => Promise<AiSessionChatImportResult>;
  testSessionChat: (profile: AdminAiProfile, input: { sessionId: string; messages: AiPlaygroundMessage[]; generationOverrides: AiPlaygroundGenerationOverrides; maxToolRounds: number }) => Promise<AiSessionChatTestResult>;
  getPlaygroundDocument: () => Promise<AiPlaygroundDocumentSnapshot | null>;
  savePlaygroundDocument: (document: AiPlaygroundDocument, expectedRevision: number | null) => Promise<AiPlaygroundDocumentSnapshot>;
};

export function getAdminAiApiBaseUrl() {
  const configured = import.meta.env.VITE_MYRIAL_API_BASE_URL?.trim();
  if (configured && configured.length > 0) return `${configured.replace(/\/$/, '')}/api/admin`;
  return import.meta.env.VITE_MYRIAL_API_MODE === 'proxy' ? '/api/admin' : null;
}

export function createFetchAdminAiApi(baseUrl = getAdminAiApiBaseUrl()): AdminAiApi {
  if (!baseUrl) return createDemoAdminAiApi();
  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${baseUrl}${path}`, { credentials: 'include', headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers }, ...init });
    if (!response.ok) throw await toError(response);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  };
  return {
    listProfiles: () => request('/ai-profiles/'),
    createProfile: (input) => request('/ai-profiles/', { method: 'POST', body: JSON.stringify(input) }),
    updateProfile: (id, input) => request(`/ai-profiles/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }),
    setProfileEnabled: (id, enabled, expectedRevision) => request(`/ai-profiles/${encodeURIComponent(id)}/${enabled ? 'enable' : 'disable'}`, { method: 'POST', body: JSON.stringify({ expectedRevision }) }),
    deleteProfile: (id, expectedRevision) => request(`/ai-profiles/${encodeURIComponent(id)}?expectedRevision=${expectedRevision}`, { method: 'DELETE' }),
    activateProfile: (provider) => request('/ai-profiles/active', { method: 'PUT', body: JSON.stringify({ provider }) }),
    listCredentials: () => request('/ai-credentials/'),
    setCredential: (input) => request('/ai-credentials/', { method: 'POST', body: JSON.stringify(input) }),
    replaceCredential: (id, input) => request(`/ai-credentials/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }),
    deleteCredential: (id, expectedRevision) => request(`/ai-credentials/${encodeURIComponent(id)}?expectedRevision=${expectedRevision}`, { method: 'DELETE' }),
    testConnection: (profile) => request(`/ai-profiles/${encodeURIComponent(profile.id)}/connection-tests`, { method: 'POST', body: JSON.stringify({ expectedProfileRevision: profile.revision, expectedCredentialRevision: profile.credentialRevision }) }),
    testPrompt: (profile, prompt) => request(`/ai-profiles/${encodeURIComponent(profile.id)}/prompt-tests`, { method: 'POST', body: JSON.stringify({ prompt, expectedProfileRevision: profile.revision, expectedCredentialRevision: profile.credentialRevision }) }),
    testConversation: (profile, messages, generationOverrides) => request(`/ai-profiles/${encodeURIComponent(profile.id)}/conversation-tests`, { method: 'POST', body: JSON.stringify({ messages, generationOverrides, expectedProfileRevision: profile.revision, expectedCredentialRevision: profile.credentialRevision }) }),
    importSessionTurn: (profile, input) => request(`/ai-profiles/${encodeURIComponent(profile.id)}/session-chat-imports`, { method: 'POST', body: JSON.stringify({ sessionId: input.sessionId, turnId: input.turnId, expectedProfileRevision: profile.revision, expectedCredentialRevision: profile.credentialRevision }) }),
    testSessionChat: (profile, input) => request(`/ai-profiles/${encodeURIComponent(profile.id)}/session-chat-tests`, { method: 'POST', body: JSON.stringify({ sessionId: input.sessionId, messages: input.messages, generationOverrides: input.generationOverrides, maxToolRounds: input.maxToolRounds, expectedProfileRevision: profile.revision, expectedCredentialRevision: profile.credentialRevision }) }),
    async getPlaygroundDocument() {
      try {
        return await request<AiPlaygroundDocumentSnapshot>('/ai-playground');
      } catch (caught) {
        if ((caught as AdminAiApiError).status === 404) return null;
        throw caught;
      }
    },
    savePlaygroundDocument: (document, expectedRevision) => request('/ai-playground', { method: 'PUT', body: JSON.stringify({ document, expectedRevision }) }),
  };
}

export function createDemoAdminAiApi(): AdminAiApi {
  let profiles: AdminAiProfile[] = [
    { id: 'openai', displayName: 'OpenAI', adapter: 'openai-compatible', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', systemPrompt: '', credentialId: 'openai', enabled: true, source: 'deployment', revision: 0, active: true, credentialSource: 'deployment', credentialConfigured: true, credentialRevision: 0, validationStatus: 'valid', lastValidatedAt: new Date().toISOString() },
    { id: 'runpod', displayName: 'Runpod Serverless', adapter: 'openai-compatible', baseUrl: 'https://api.runpod.ai/v2/demo/openai/v1', model: 'Qwen/Qwen3-8B', systemPrompt: '日本語の情景描写を重視する。', credentialId: 'runpod', enabled: true, source: 'database', revision: 1, active: false, credentialSource: 'database', credentialConfigured: true, credentialRevision: 1, validationStatus: 'untested', lastValidatedAt: null },
  ];
  let credentials: AdminAiCredential[] = [{ id: 'runpod', displayName: 'Runpod', maskedSecret: '••••••••demo', source: 'database', revision: 1, updatedAt: new Date().toISOString(), referencedProfileCount: 1 }];
  let playgroundDocument: AiPlaygroundDocumentSnapshot | null = null;
  const find = (id: string) => { const profile = profiles.find((item) => item.id === id); if (!profile) throw demoError('Profileが見つかりません。', 404); return profile; };
  return {
    async listProfiles() { return structuredClone(profiles); },
    async createProfile(input) { const existingIndex = profiles.findIndex((p) => p.id === input.id); const existing = existingIndex >= 0 ? profiles[existingIndex] : null; if (existing?.source === 'database') throw demoError('同じIDが存在します。', 409); const created: AdminAiProfile = { ...input, adapter: 'openai-compatible', source: 'database', revision: 1, active: existing?.active ?? false, credentialSource: existing?.credentialSource ?? 'none', credentialConfigured: existing?.credentialConfigured ?? false, credentialRevision: existing?.credentialRevision ?? 0, validationStatus: 'untested', lastValidatedAt: null }; if (existingIndex >= 0) profiles[existingIndex] = created; else profiles.push(created); },
    async updateProfile(id, input) { const p = find(id); if (p.revision !== input.expectedRevision) throw demoError('Profileが更新されています。', 409); Object.assign(p, input, { revision: p.revision + 1, validationStatus: 'untested' }); },
    async setProfileEnabled(id, enabled, expectedRevision) { const p = find(id); if (p.revision !== expectedRevision || (!enabled && p.active)) throw demoError('使用中のProfileは無効化できません。', 409); p.enabled = enabled; p.revision++; },
    async deleteProfile(id, expectedRevision) { const p = find(id); if (p.revision !== expectedRevision || p.active) throw demoError('使用中または更新済みのProfileは削除できません。', 409); profiles = profiles.filter((item) => item.id !== id); },
    async activateProfile(id) { const p = find(id); if (!p.credentialConfigured) throw demoError('Credentialが必要です。', 409); profiles.forEach((item) => { item.active = item.id === id; }); },
    async listCredentials() { return structuredClone(credentials); },
    async setCredential(input) { if (credentials.some((c) => c.id === input.id)) throw demoError('同じCredentialがあります。', 409); credentials.push({ id: input.id, displayName: input.displayName, maskedSecret: `••••••••${input.secret.slice(-4)}`, source: 'database', revision: 1, updatedAt: new Date().toISOString(), referencedProfileCount: profiles.filter((p) => p.credentialId === input.id).length }); profiles.filter((p) => p.credentialId === input.id).forEach((p) => { p.credentialConfigured = true; p.credentialSource = 'database'; p.credentialRevision = 1; }); },
    async replaceCredential(id, input) { const c = credentials.find((item) => item.id === id); if (!c || c.revision !== input.expectedRevision) throw demoError('Credentialが更新されています。', 409); c.displayName = input.displayName; c.maskedSecret = `••••••••${input.secret.slice(-4)}`; c.revision++; profiles.filter((p) => p.credentialId === id).forEach((p) => { p.credentialRevision = c.revision; p.validationStatus = 'untested'; }); },
    async deleteCredential(id, expectedRevision) { const c = credentials.find((item) => item.id === id); if (!c || c.revision !== expectedRevision || c.referencedProfileCount > 0) throw demoError('参照中のCredentialは削除できません。', 409); credentials = credentials.filter((item) => item.id !== id); },
    async testConnection(profile) { const p = find(profile.id); if (p.revision !== profile.revision || p.credentialRevision !== profile.credentialRevision) throw demoError('再読み込みしてください。', 409); p.validationStatus = 'valid'; p.lastValidatedAt = new Date().toISOString(); },
    async testPrompt(profile, prompt) { find(profile.id); return { provider: profile.id, model: profile.model, response: `テスト応答: ${prompt.trim()}`, inputTokens: Math.max(1, Math.ceil(prompt.length / 4)), outputTokens: 12, latencyMilliseconds: 184, finishReason: 'stop' }; },
    async testConversation(profile, messages) { find(profile.id); const last = messages.at(-1)?.content ?? ''; return { message: { role: 'assistant', content: `テスト応答: ${last.trim()}` }, provider: profile.id, model: profile.model, responseId: 'demo-response', inputTokens: Math.max(1, Math.ceil(messages.reduce((total, message) => total + message.content.length, 0) / 4)), outputTokens: 12, latencyMilliseconds: 184, attemptCount: 1, finishReason: 'stop', requestId: 'demo-request' }; },
    async importSessionTurn(profile, input) {
      find(profile.id);
      const systemMarkdown = '# Scenario context\n\nDemo session context.\n\n## Rule tools\n\nCall `preview_rule_action` before describing state changes.';
      return {
        sessionId: input.sessionId,
        turnId: input.turnId,
        turnPosition: 12,
        systemMarkdown,
        messages: [
          { role: 'system', content: systemMarkdown },
          { role: 'assistant', content: '扉には星形の鍵穴があります。' },
          { role: 'user', content: '西の扉を開ける' },
        ],
      };
    },
    async testSessionChat(profile, input) {
      find(profile.id);
      const systemMarkdown = input.messages.find((message) => message.role === 'system')?.content ?? '';
      const lastUserMessage = [...input.messages].reverse().find((message) => message.role === 'user')?.content ?? '';
      return {
        message: { role: 'assistant', content: `ルール確認後のテスト応答: ${lastUserMessage.trim()}` },
        metadata: {
          provider: profile.id,
          model: profile.model,
          responseId: 'demo-session-chat-response',
          inputTokens: 48,
          outputTokens: 24,
          latencyMilliseconds: 240,
          attemptCount: 1,
          finishReason: 'stop',
          providerRounds: 1,
          toolCallCount: 0,
        },
        systemMarkdown,
        sentMessages: input.messages,
        toolPreviews: [],
      };
    },
    async getPlaygroundDocument() { return structuredClone(playgroundDocument); },
    async savePlaygroundDocument(document, expectedRevision) {
      if (expectedRevision !== (playgroundDocument?.revision ?? null)) throw demoError('Playgroundが更新されています。', 409);
      playgroundDocument = { document: structuredClone(document), revision: (playgroundDocument?.revision ?? 0) + 1, updatedAt: new Date().toISOString() };
      return structuredClone(playgroundDocument);
    },
  };
}

async function toError(response: Response): Promise<AdminAiApiError> { let body: { message?: string; title?: string; detail?: string; errors?: Record<string, string[]> } | null = null; try { body = await response.json(); } catch { body = null; } const error = new Error(body?.message ?? body?.detail ?? body?.title ?? `Admin AI API returned ${response.status}.`) as AdminAiApiError; error.status = response.status; error.errors = body?.errors; return error; }
function demoError(message: string, status: number) { const error = new Error(message) as AdminAiApiError; error.status = status; return error; }
