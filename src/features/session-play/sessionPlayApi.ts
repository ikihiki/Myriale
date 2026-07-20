export type NarrativeTurnApiResponse = {
  id: string;
  position: number;
  kind: string;
  narrative?: {
    body: string;
    playerInputId?: string | null;
    playerInput?: string | null;
  } | null;
};

export function getSessionApiBaseUrl() {
  const configured = import.meta.env.VITE_MYRIAL_API_BASE_URL?.trim();
  if (configured && configured.length > 0) return `${configured.replace(/\/$/, '')}/api/sessions`;
  return import.meta.env.VITE_MYRIAL_API_MODE === 'proxy' ? '/api/sessions' : null;
}

export async function createNarrativeTurn(
  sessionId: string,
  input: string,
  requestId: string,
  baseUrl = getSessionApiBaseUrl(),
): Promise<NarrativeTurnApiResponse | null> {
  if (!baseUrl) return null;
  const response = await fetch(`${baseUrl}/${encodeURIComponent(sessionId)}/narrative-turns`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, input }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? 'Narrativeの生成に失敗しました。');
  }
  return response.json() as Promise<NarrativeTurnApiResponse>;
}
