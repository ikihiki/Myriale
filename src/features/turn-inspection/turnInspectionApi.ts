import { getSessionApiBaseUrl } from '../session-play/sessionPlayApi';
import type { TurnInspectionDto } from './turnInspectionModel';

export async function fetchTurnInspection(
  sessionId: string,
  turnId: string,
  signal?: AbortSignal,
  baseUrl = getSessionApiBaseUrl(),
): Promise<TurnInspectionDto> {
  if (!baseUrl) throw new Error('Session APIが設定されていません。');

  const response = await fetch(`${baseUrl}/${encodeURIComponent(sessionId)}/turns/${encodeURIComponent(turnId)}/inspection`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Turnの実行詳細を確認するにはログインしてください。');
    if (response.status === 403) throw new Error('このTurnの実行詳細を確認する権限がありません。');
    if (response.status === 404) throw new Error('Session、Turn、または実行詳細が見つかりませんでした。');
    throw new Error('Turnの実行詳細を読み込めませんでした。');
  }

  return response.json() as Promise<TurnInspectionDto>;
}
