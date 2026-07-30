import { getSessionApiBaseUrl } from '../session-play/sessionPlayApi';
import type { SessionAiHistoryDto } from './sessionAiHistoryModel';

export async function fetchSessionAiHistory(
  sessionId: string,
  signal?: AbortSignal,
  baseUrl = getSessionApiBaseUrl(),
): Promise<SessionAiHistoryDto> {
  if (!baseUrl) throw new Error('Session APIが設定されていません。');

  const response = await fetch(`${baseUrl}/${encodeURIComponent(sessionId)}/ai-history`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('AI履歴を確認するにはログインしてください。');
    if (response.status === 403) throw new Error('このセッションのAI履歴を確認する権限がありません。');
    if (response.status === 404) throw new Error('セッションまたはAI履歴が見つかりませんでした。');
    throw new Error('AI履歴を読み込めませんでした。');
  }

  return response.json() as Promise<SessionAiHistoryDto>;
}
