import type {
  AiConversationTestResult,
  AiPlaygroundDocument,
  AiPlaygroundGenerationOverrides,
  AiPlaygroundMessage,
  AiPlaygroundRole,
} from '../../account/api/adminAiApi';

export type AiPlaygroundProfile = {
  id: string;
  displayName: string;
  model: string;
  revision: number;
  credentialRevision: number;
};
export type AiPlaygroundRunMetadata = Omit<AiConversationTestResult, 'message'>;
export type AiPlaygroundState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
    status: 'ready';
    profiles: AiPlaygroundProfile[];
    defaultProfileId: string | null;
    document: AiPlaygroundDocument | null;
    documentRevision: number | null;
  };
export type AiPlaygroundCommandResult<T = undefined> = {
  ok: boolean;
  message: string;
  value?: T;
  action?: 'login' | 'reload';
};
export type AiPlaygroundGenerationResult = {
  message: AiPlaygroundMessage & { role: 'assistant' };
  metadata: AiPlaygroundRunMetadata;
};
export type AiPlaygroundResponseEntry = {
  id: string;
  number: number;
  profile: Pick<AiPlaygroundProfile, 'id' | 'displayName' | 'model'>;
  message: AiPlaygroundGenerationResult['message'];
  metadata: AiPlaygroundRunMetadata;
};
export type AiPlaygroundResponseSelection = {
  responses: AiPlaygroundResponseEntry[];
  selectedResponseId: string | null;
};
export type AiPlaygroundActions = {
  generate: (
    profileId: string,
    messages: AiPlaygroundMessage[],
    generationOverrides: AiPlaygroundGenerationOverrides,
  ) => Promise<AiPlaygroundCommandResult<AiPlaygroundGenerationResult>>;
  save: (document: AiPlaygroundDocument) => Promise<AiPlaygroundCommandResult>;
  retry: () => void;
  logout: () => void | Promise<void>;
};
export type EditableAiPlaygroundMessage = AiPlaygroundMessage & { id: string };
export type AiPlaygroundGenerationDraft = {
  temperature: string;
  topP: string;
  maximumOutputTokens: string;
  seed: string;
  retryAttempts: string;
};
export type AiPlaygroundConversationWorkspace = {
  id: string;
  title: string;
  messages: EditableAiPlaygroundMessage[];
  profileId: string | null;
  generation: AiPlaygroundGenerationDraft;
  responses: AiPlaygroundResponseEntry[];
  selectedResponseId: string | null;
};
export type AiPlaygroundConversationSelection = {
  conversations: AiPlaygroundConversationWorkspace[];
  selectedConversationId: string;
};

const roles: AiPlaygroundRole[] = ['system', 'user', 'assistant'];

export function createPlaygroundConversation(input: {
  id: string;
  title: string;
  profileId: string | null;
  messages: EditableAiPlaygroundMessage[];
  generation: AiPlaygroundGenerationDraft;
}): AiPlaygroundConversationWorkspace {
  return {
    ...input,
    messages: input.messages.map((message) => ({ ...message })),
    generation: { ...input.generation },
    responses: [],
    selectedResponseId: null,
  };
}

export function duplicatePlaygroundConversation(
  source: AiPlaygroundConversationWorkspace,
  input: {
    id: string;
    title: string;
    createMessageId: () => string;
    createResponseId: () => string;
  },
): AiPlaygroundConversationWorkspace {
  const responseIdMap = new Map<string, string>();
  const responses = source.responses.map((response) => {
    const id = input.createResponseId();
    responseIdMap.set(response.id, id);
    return {
      ...response,
      id,
      profile: { ...response.profile },
      message: { ...response.message },
      metadata: { ...response.metadata },
    };
  });
  return {
    ...source,
    id: input.id,
    title: input.title,
    messages: source.messages.map((message) => ({
      ...message,
      id: input.createMessageId(),
    })),
    generation: { ...source.generation },
    responses,
    selectedResponseId: source.selectedResponseId
      ? (responseIdMap.get(source.selectedResponseId) ?? null)
      : null,
  };
}

export function deletePlaygroundConversation(
  conversations: AiPlaygroundConversationWorkspace[],
  selectedConversationId: string,
  conversationId: string,
): AiPlaygroundConversationSelection {
  if (conversations.length <= 1)
    return { conversations, selectedConversationId };
  const removedIndex = conversations.findIndex(
    (conversation) => conversation.id === conversationId,
  );
  if (removedIndex < 0) return { conversations, selectedConversationId };
  const nextConversations = conversations.filter(
    (conversation) => conversation.id !== conversationId,
  );
  if (selectedConversationId !== conversationId)
    return { conversations: nextConversations, selectedConversationId };
  return {
    conversations: nextConversations,
    selectedConversationId:
      nextConversations[Math.min(removedIndex, nextConversations.length - 1)]
        .id,
  };
}

export function responsePreview(content: string, maximumLength = 72) {
  const normalized = content.replace(/\s+/g, ' ').trim();
  return normalized.length > maximumLength
    ? `${normalized.slice(0, maximumLength - 1)}…`
    : normalized;
}

export function deletePlaygroundResponse(
  responses: AiPlaygroundResponseEntry[],
  selectedResponseId: string | null,
  responseId: string,
): AiPlaygroundResponseSelection {
  const removedIndex = responses.findIndex(
    (response) => response.id === responseId,
  );
  if (removedIndex < 0) return { responses, selectedResponseId };
  const nextResponses = responses.filter(
    (response) => response.id !== responseId,
  );
  if (selectedResponseId !== responseId)
    return { responses: nextResponses, selectedResponseId };
  return {
    responses: nextResponses,
    selectedResponseId:
      nextResponses[Math.min(removedIndex, nextResponses.length - 1)]?.id ??
      null,
  };
}

export function parseConversationImport(
  input: string,
): AiPlaygroundCommandResult<AiPlaygroundMessage[]> {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    return {
      ok: false,
      message: 'JSONを解析できません。現在の会話履歴は変更されていません。',
    };
  }
  if (!Array.isArray(value) || value.length === 0)
    return {
      ok: false,
      message:
        'role/contentを持つ1件以上のmessage配列を指定してください。現在の会話履歴は変更されていません。',
    };
  const messages: AiPlaygroundMessage[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object')
      return {
        ok: false,
        message:
          '各messageはrole/contentを持つobjectにしてください。現在の会話履歴は変更されていません。',
      };
    const { role, content } = item as Record<string, unknown>;
    if (
      typeof role !== 'string' ||
      !roles.includes(role as AiPlaygroundRole) ||
      typeof content !== 'string' ||
      !content.trim()
    )
      return {
        ok: false,
        message:
          'roleはsystem/user/assistant、contentは空でない文字列にしてください。現在の会話履歴は変更されていません。',
      };
    messages.push({ role: role as AiPlaygroundRole, content });
  }
  return {
    ok: true,
    message: `${messages.length}件のmessageを読み込みました。`,
    value: messages,
  };
}

export function exportConversation(
  messages: Pick<AiPlaygroundMessage, 'role' | 'content'>[],
) {
  return JSON.stringify(
    messages.map(({ role, content }) => ({ role, content })),
    null,
    2,
  );
}

export function toRequestMessages(
  messages: EditableAiPlaygroundMessage[],
): AiPlaygroundMessage[] {
  return messages.map(({ role, content }) => ({
    role,
    content: content.trim(),
  }));
}
