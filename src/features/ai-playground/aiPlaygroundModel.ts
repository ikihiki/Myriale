import type { AiConversationTestResult, AiPlaygroundGenerationOverrides, AiPlaygroundMessage, AiPlaygroundRole } from '../../account/api/adminAiApi';

export type AiPlaygroundProfile = { id: string; displayName: string; model: string; revision: number; credentialRevision: number };
export type AiPlaygroundRunMetadata = Omit<AiConversationTestResult, 'message'>;
export type AiPlaygroundState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profiles: AiPlaygroundProfile[]; selectedProfileId: string | null };
export type AiPlaygroundCommandResult<T = undefined> = { ok: boolean; message: string; value?: T; action?: 'login' | 'reload' };
export type AiPlaygroundGenerationResult = { message: AiPlaygroundMessage & { role: 'assistant' }; metadata: AiPlaygroundRunMetadata };
export type AiPlaygroundRunRecord = AiPlaygroundGenerationResult & { id: string; sequence: number };
export type AiPlaygroundActions = {
  selectProfile: (profileId: string) => void;
  generate: (messages: AiPlaygroundMessage[], generationOverrides: AiPlaygroundGenerationOverrides) => Promise<AiPlaygroundCommandResult<AiPlaygroundGenerationResult>>;
  retry: () => void;
  logout: () => void | Promise<void>;
};
export type EditableAiPlaygroundMessage = AiPlaygroundMessage & { id: string };

const roles: AiPlaygroundRole[] = ['system', 'user', 'assistant'];

export function parseConversationImport(input: string): AiPlaygroundCommandResult<AiPlaygroundMessage[]> {
  let value: unknown;
  try { value = JSON.parse(input); } catch { return { ok: false, message: 'JSONを解析できません。現在の会話履歴は変更されていません。' }; }
  if (!Array.isArray(value) || value.length === 0) return { ok: false, message: 'role/contentを持つ1件以上のmessage配列を指定してください。現在の会話履歴は変更されていません。' };
  const messages: AiPlaygroundMessage[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return { ok: false, message: '各messageはrole/contentを持つobjectにしてください。現在の会話履歴は変更されていません。' };
    const { role, content } = item as Record<string, unknown>;
    if (typeof role !== 'string' || !roles.includes(role as AiPlaygroundRole) || typeof content !== 'string' || !content.trim()) return { ok: false, message: 'roleはsystem/user/assistant、contentは空でない文字列にしてください。現在の会話履歴は変更されていません。' };
    messages.push({ role: role as AiPlaygroundRole, content });
  }
  return { ok: true, message: `${messages.length}件のmessageを読み込みました。`, value: messages };
}

export function exportConversation(messages: Pick<AiPlaygroundMessage, 'role' | 'content'>[]) {
  return JSON.stringify(messages.map(({ role, content }) => ({ role, content })), null, 2);
}

export function toRequestMessages(messages: EditableAiPlaygroundMessage[]): AiPlaygroundMessage[] {
  return messages.map(({ role, content }) => ({ role, content: content.trim() }));
}
