import { getSessionApiBaseUrl } from '../session-play/sessionPlayApi';
import type { SessionListItemDto } from './sessionListModel';

export async function fetchSessionList(
  includeCompleted = false,
  signal?: AbortSignal,
  configuredBaseUrl = getSessionApiBaseUrl(),
): Promise<SessionListItemDto[]> {
  const baseUrl = configuredBaseUrl;
  if (!baseUrl) throw new Error('Session APIが設定されていません。');
  const url = includeCompleted ? `${baseUrl}?includeCompleted=true` : baseUrl;

  const response = await fetch(url, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('セッション一覧を見るにはログインしてください。');
    throw new Error('セッション一覧を読み込めませんでした。');
  }
  return response.json() as Promise<SessionListItemDto[]>;
}
