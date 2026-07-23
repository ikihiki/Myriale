export type ModuleAvailableAction = { id: string; label: string; enabled: boolean; disabledReason?: string | null };
export type ModuleEvent = { type: string; payload: unknown };
export type ModuleError = { code: string; message: string; details?: unknown };
export type ModuleOutcome = { category: string; code: string; title: string; summary: string };
export type ModuleExecution = {
  id: string;
  package: { moduleId: string; version: string; digest: string; contractVersion: string };
  status: string;
  revision: number;
  viewState: unknown;
  availableActions: ModuleAvailableAction[];
  outcome?: ModuleOutcome | null;
  error?: ModuleError | null;
  uiEvents: ModuleEvent[];
};
export type ModuleUiResource = { id: string; url: string; contentType: string; sha256: string; byteLength: number };
export type ModuleRuntimeUiDescriptor = {
  protocol: 'myriale.module-ui';
  protocolVersion: 1;
  executionId: string;
  package: { moduleId: string; version: string; digest: string };
  elementName: string;
  script: ModuleUiResource;
  styles: ModuleUiResource[];
};
export type ModuleExecutionApiError = Error & { status?: number; code?: string; execution?: ModuleExecution };
export type ModuleExecutionApi = {
  getExecution(id: string, signal?: AbortSignal): Promise<ModuleExecution>;
  getRuntimeUi(id: string, signal?: AbortSignal): Promise<ModuleRuntimeUiDescriptor>;
  getResource(resource: ModuleUiResource, signal?: AbortSignal): Promise<string>;
  dispatch(id: string, body: { requestId: string; expectedRevision: number; action: unknown; randomValueCount?: number }, signal?: AbortSignal): Promise<ModuleExecution>;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json', ...init?.headers }, ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message ?? `Request failed (${response.status})`) as ModuleExecutionApiError;
    error.status = response.status;
    error.code = body.code;
    error.execution = body.execution;
    throw error;
  }
  return response.json() as Promise<T>;
}

export const moduleExecutionApi: ModuleExecutionApi = {
  getExecution: (id, signal) => request(`/api/module-executions/${encodeURIComponent(id)}`, { signal }),
  getRuntimeUi: (id, signal) => request(`/api/module-executions/${encodeURIComponent(id)}/ui/runtime/`, { signal }),
  async getResource(resource, signal) {
    const response = await fetch(resource.url, { credentials: 'include', cache: 'no-store', signal });
    if (!response.ok) throw new Error(`Resource request failed (${response.status})`);
    const contentType = response.headers.get('content-type')?.split(';', 1)[0];
    if (contentType !== resource.contentType) throw new Error('Resource content type did not match its descriptor.');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength !== resource.byteLength) throw new Error('Resource length did not match its descriptor.');
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (value) => value.toString(16).padStart(2, '0')).join('');
    if (digest !== resource.sha256) throw new Error('Resource digest did not match its descriptor.');
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  },
  dispatch: (id, body, signal) => request(`/api/module-executions/${encodeURIComponent(id)}/dispatch`, {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }),
};
