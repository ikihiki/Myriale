import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppChromeAccount } from '../../account/accountPresentation';
import type {
  AiPlaygroundDocument,
  AiPlaygroundGenerationOverrides,
  AiPlaygroundRole,
} from '../../account/api/adminAiApi';
import {
  Badge,
  Button,
  Input,
  Label,
  Notice,
  PageCanvas,
  PageShell,
  Panel,
  Textarea,
} from '../../components/ui';
import { AppChrome } from '../../shared/AppChrome';
import type {
  AiPlaygroundActions,
  AiPlaygroundConversationWorkspace,
  AiPlaygroundResponseEntry,
  AiPlaygroundState,
  EditableAiPlaygroundMessage,
} from './aiPlaygroundModel';
import {
  createPlaygroundConversation,
  deletePlaygroundConversation,
  deletePlaygroundResponse,
  duplicatePlaygroundConversation,
  exportConversation,
  parseConversationImport,
  responsePreview,
  toRequestMessages,
} from './aiPlaygroundModel';

type Props = {
  account: AppChromeAccount | null;
  state: AiPlaygroundState;
  actions: AiPlaygroundActions;
};
const roleTone = {
  system: 'info',
  user: 'warning',
  assistant: 'success',
} as const;
const starter = [
  {
    role: 'system' as const,
    content:
      'あなたは架空世界の案内役です。簡潔に、情景が伝わるように答えてください。',
  },
  {
    role: 'user' as const,
    content: '古い天文台の扉を開けます。中の様子を教えてください。',
  },
];
const defaultGeneration = {
  temperature: '0.7',
  topP: '',
  maximumOutputTokens: '800',
  seed: '',
  retryAttempts: '0',
};

function toOptionalNumber(value: string) {
  return value.trim() === '' ? null : Number(value);
}

export function AiPlaygroundPresentation({ account, state, actions }: Props) {
  const nextLocalId = useRef(1);
  const nextConversationNumber = useRef(2);
  const createId = (prefix: string) =>
    `${prefix}-${globalThis.crypto?.randomUUID?.() ?? nextLocalId.current++}`;
  const createMessageId = () => createId('message');
  const createResponseId = () => createId('response');
  const createMessages = (
    items: { role: AiPlaygroundRole; content: string }[],
  ) => items.map((item) => ({ ...item, id: createMessageId() }));
  const [conversations, setConversations] = useState<
    AiPlaygroundConversationWorkspace[]
  >(() => [
    createPlaygroundConversation({
      id: 'conversation-1',
      title: 'Conversation 1',
      profileId: null,
      messages: createMessages(starter),
      generation: defaultGeneration,
    }),
  ]);
  const [selectedConversationId, setSelectedConversationId] =
    useState('conversation-1');
  const hydratedDocumentRevision = useRef<number | null>();
  const lastSavedDocument = useRef('');
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    'loading' | 'saving' | 'saved' | 'error'
  >('loading');
  const [workingConversationIds, setWorkingConversationIds] = useState<
    Set<string>
  >(() => new Set());
  const [notice, setNotice] = useState(
    '会話ワークスペースごとに履歴・Profile・設定・応答を独立して管理します。',
  );
  const [noticeTone, setNoticeTone] = useState<'info' | 'danger' | 'success'>(
    'info',
  );
  const [importText, setImportText] = useState('');
  const [exportText, setExportText] = useState('');

  const ready = state.status === 'ready' ? state : null;
  const activeConversation =
    conversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) ?? conversations[0];
  const updateConversation = (
    conversationId: string,
    update:
      | Partial<AiPlaygroundConversationWorkspace>
      | ((
        current: AiPlaygroundConversationWorkspace,
      ) => AiPlaygroundConversationWorkspace),
  ) =>
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? typeof update === 'function'
            ? update(conversation)
            : { ...conversation, ...update }
          : conversation,
      ),
    );
  const updateActiveConversation = (
    update:
      | Partial<AiPlaygroundConversationWorkspace>
      | ((
        current: AiPlaygroundConversationWorkspace,
      ) => AiPlaygroundConversationWorkspace),
  ) => updateConversation(activeConversation.id, update);
  const messages = activeConversation.messages;
  const generation = activeConversation.generation;
  const responses = activeConversation.responses;
  const selectedResponseId = activeConversation.selectedResponseId;
  const setMessages = (
    update:
      | EditableAiPlaygroundMessage[]
      | ((
        current: EditableAiPlaygroundMessage[],
      ) => EditableAiPlaygroundMessage[]),
  ) =>
    updateActiveConversation((current) => ({
      ...current,
      messages:
        typeof update === 'function' ? update(current.messages) : update,
    }));
  const setGeneration = (
    update:
      | AiPlaygroundConversationWorkspace['generation']
      | ((
        current: AiPlaygroundConversationWorkspace['generation'],
      ) => AiPlaygroundConversationWorkspace['generation']),
  ) =>
    updateActiveConversation((current) => ({
      ...current,
      generation:
        typeof update === 'function' ? update(current.generation) : update,
    }));
  const setResponses = (
    update:
      | AiPlaygroundResponseEntry[]
      | ((current: AiPlaygroundResponseEntry[]) => AiPlaygroundResponseEntry[]),
  ) =>
    updateActiveConversation((current) => ({
      ...current,
      responses:
        typeof update === 'function' ? update(current.responses) : update,
    }));
  const setSelectedResponseId = (responseId: string | null) =>
    updateActiveConversation({ selectedResponseId: responseId });

  useEffect(() => {
    if (
      !ready ||
      (hydrated &&
        hydratedDocumentRevision.current === ready.documentRevision)
    )
      return;
    hydratedDocumentRevision.current = ready.documentRevision;
    if (ready.document) {
      const document = structuredClone(ready.document);
      setConversations(
        document.conversations as AiPlaygroundConversationWorkspace[],
      );
      setSelectedConversationId(document.selectedConversationId);
      lastSavedDocument.current = JSON.stringify(document);
      setSaveStatus('saved');
    }
    setHydrated(true);
  }, [hydrated, ready]);

  useEffect(() => {
    if (!ready || !hydrated) return;
    const document: AiPlaygroundDocument = {
      conversations,
      selectedConversationId,
    };
    const serialized = JSON.stringify(document);
    if (serialized === lastSavedDocument.current) return;
    setSaveStatus('saving');
    const timeout = window.setTimeout(() => {
      void actions.save(document).then((result) => {
        if (result.ok) {
          lastSavedDocument.current = serialized;
          setSaveStatus('saved');
          return;
        }
        setSaveStatus('error');
        setNotice(result.message);
        setNoticeTone('danger');
      });
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [actions, conversations, hydrated, ready, selectedConversationId]);

  useEffect(() => {
    if (!ready?.profiles.length) return;
    const fallbackProfileId = ready.defaultProfileId ?? ready.profiles[0].id;
    setConversations((current) =>
      current.map((conversation) =>
        ready.profiles.some((profile) => profile.id === conversation.profileId)
          ? conversation
          : { ...conversation, profileId: fallbackProfileId },
      ),
    );
  }, [ready?.profiles]);

  const selectedProfile =
    ready?.profiles.find(
      (profile) => profile.id === activeConversation.profileId,
    ) ?? null;
  const selectedResponse =
    responses.find((response) => response.id === selectedResponseId) ?? null;
  const hasBlankMessage = messages.some((message) => !message.content.trim());
  const working = workingConversationIds.has(activeConversation.id);
  const generationOverrides = useMemo<AiPlaygroundGenerationOverrides>(
    () => ({
      temperature: toOptionalNumber(generation.temperature),
      topP: toOptionalNumber(generation.topP),
      maximumOutputTokens: toOptionalNumber(generation.maximumOutputTokens),
      seed: toOptionalNumber(generation.seed),
      retryAttempts: toOptionalNumber(generation.retryAttempts),
    }),
    [generation],
  );

  const addMessage = (role: AiPlaygroundRole) =>
    setMessages((current) => [
      ...current,
      ...createMessages([{ role, content: '' }]),
    ]);
  const updateMessage = (
    id: string,
    update: Partial<Pick<EditableAiPlaygroundMessage, 'role' | 'content'>>,
  ) =>
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, ...update } : message,
      ),
    );
  const moveMessage = (index: number, direction: -1 | 1) =>
    setMessages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  const importMessages = () => {
    const result = parseConversationImport(importText);
    setNotice(result.message);
    setNoticeTone(result.ok ? 'success' : 'danger');
    if (result.ok && result.value) setMessages(createMessages(result.value));
  };
  const exportMessages = async () => {
    const value = exportConversation(messages);
    setExportText(value);
    setNotice('role/contentだけをJSONへ書き出しました。');
    setNoticeTone('success');
    try {
      await navigator.clipboard?.writeText(value);
    } catch {
      /* Textarea remains available for manual copy. */
    }
  };
  const generate = async () => {
    if (messages.length === 0 || hasBlankMessage) {
      setNotice('空でないmessageを1件以上用意してください。');
      setNoticeTone('danger');
      return;
    }
    if (!selectedProfile) {
      setNotice('実行可能なAI Profileがありません。');
      setNoticeTone('danger');
      return;
    }
    const targetConversationId = activeConversation.id;
    const targetProfile = selectedProfile;
    setWorkingConversationIds((current) =>
      new Set(current).add(targetConversationId),
    );
    try {
      const result = await actions.generate(
        targetProfile.id,
        toRequestMessages(messages),
        generationOverrides,
      );
      setNotice(result.message);
      setNoticeTone(result.ok ? 'success' : 'danger');
      if (result.ok && result.value) {
        updateConversation(targetConversationId, (current) => {
          const number =
            Math.max(
              0,
              ...current.responses.map((response) => response.number),
            ) + 1;
          const response: AiPlaygroundResponseEntry = {
            id: createResponseId(),
            number,
            profile: {
              id: targetProfile.id,
              displayName: targetProfile.displayName,
              model: targetProfile.model,
            },
            message: result.value!.message,
            metadata: result.value!.metadata,
          };
          return {
            ...current,
            responses: [response, ...current.responses],
            selectedResponseId: response.id,
          };
        });
      }
    } finally {
      setWorkingConversationIds((current) => {
        const next = new Set(current);
        next.delete(targetConversationId);
        return next;
      });
    }
  };
  const addSelectedResponse = () => {
    if (!selectedResponse) return;
    setMessages((current) => [
      ...current,
      ...createMessages([selectedResponse.message]),
    ]);
    setNotice(`応答 ${selectedResponse.number} を会話履歴へ追加しました。`);
    setNoticeTone('success');
  };
  const deleteResponse = (responseId: string) => {
    const selection = deletePlaygroundResponse(
      responses,
      selectedResponseId,
      responseId,
    );
    setResponses(selection.responses);
    setSelectedResponseId(selection.selectedResponseId);
    setNotice('応答を削除しました。');
    setNoticeTone('success');
  };

  const createConversation = () => {
    const number = nextConversationNumber.current++;
    const conversation = createPlaygroundConversation({
      id: createId('conversation'),
      title: `Conversation ${number}`,
      profileId: ready?.defaultProfileId ?? ready?.profiles[0]?.id ?? null,
      messages: createMessages(starter),
      generation: defaultGeneration,
    });
    setConversations((current) => [...current, conversation]);
    setSelectedConversationId(conversation.id);
    setImportText('');
    setExportText('');
    setNotice(`${conversation.title} を作成しました。`);
    setNoticeTone('success');
  };
  const duplicateConversation = () => {
    const conversation = duplicatePlaygroundConversation(activeConversation, {
      id: createId('conversation'),
      title: `${activeConversation.title} copy`,
      createMessageId,
      createResponseId,
    });
    setConversations((current) => [...current, conversation]);
    setSelectedConversationId(conversation.id);
    setImportText('');
    setExportText('');
    setNotice(`${activeConversation.title} を複製しました。`);
    setNoticeTone('success');
  };
  const removeConversation = (conversationId: string) => {
    const selection = deletePlaygroundConversation(
      conversations,
      selectedConversationId,
      conversationId,
    );
    if (selection.conversations === conversations) return;
    setConversations(selection.conversations);
    setSelectedConversationId(selection.selectedConversationId);
    setImportText('');
    setExportText('');
    setNotice('会話ワークスペースを削除しました。');
    setNoticeTone('success');
  };

  return (
    <AppChrome
      section="operations"
      breadcrumbs={[
        { label: 'Myriale', to: 'home' },
        { label: '運用', to: 'adminAiProviders' },
        { label: 'AI Playground' },
      ]}
      account={account}
      onLogout={actions.logout}
    >
      <PageCanvas data-myriale-theme="archive">
        <PageShell
          width="chrome"
          className="gap-6"
          aria-label="AI Conversation Playground"
        >
          <header className="grid gap-3 border-b border-[#17151f]/15 pb-5">
            <p className="kicker m-0 text-[#5c4f8f]">
              Persistent admin workspace
            </p>
            <Label as="h1" textRole="sectionEditorial" className="m-0">
              AI Conversation Playground
            </Label>
            <p className="m-0 max-w-4xl leading-7 text-myr-ink-subtle">
              system / user / assistant
              の履歴を組み立て、会話・設定・生成応答をDBへ自動保存します。生成した応答は、明示的に追加するまで会話履歴を変更しません。
            </p>
            <Notice
              tone={noticeTone}
              role={noticeTone === 'danger' ? 'alert' : 'status'}
              data-testid="ai-playground-notice"
            >
              {notice}
            </Notice>
          </header>

          {state.status === 'loading' && (
            <Notice tone="info">AI Profileを読み込んでいます。</Notice>
          )}
          {state.status === 'error' && (
            <Panel className="grid gap-3">
              <Notice tone="danger" role="alert">
                {state.message}
              </Notice>
              <Button
                className="w-fit"
                variant="secondary"
                onClick={actions.retry}
              >
                もう一度読み込む
              </Button>
            </Panel>
          )}
          {ready && (
            <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)]">
              <aside
                className="min-w-0 lg:row-span-2 lg:sticky lg:top-28"
                aria-label="Conversations sidebar"
              >
                <Panel
                  as="section"
                  className="grid min-w-0 gap-4 lg:max-h-[calc(100vh-8rem)] lg:grid-rows-[auto_auto_minmax(0,1fr)]"
                  aria-label="Conversations"
                >
                  <div className="grid gap-3 border-b border-[#17151f]/15 pb-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Label
                          as="h2"
                          textRole="sectionEditorial"
                          className="m-0 !text-2xl"
                        >
                          Conversations
                        </Label>
                        <Badge tone="neutral">{conversations.length}</Badge>
                      </div>
                      <p
                        className={`m-0 mt-2 text-xs font-bold ${
                          saveStatus === 'error'
                            ? 'text-red-700'
                            : 'text-[#5c4f8f]'
                        }`}
                        data-testid="ai-playground-save-status"
                        aria-live="polite"
                      >
                        {saveStatus === 'loading'
                          ? 'DBから読み込み中…'
                          : saveStatus === 'saving'
                            ? 'DBへ保存中…'
                            : saveStatus === 'saved'
                              ? 'DBへ保存済み'
                              : 'DBへ保存できませんでした'}
                      </p>
                      <p className="m-0 mt-1 text-xs leading-5 text-myr-ink-subtle">
                        独立したリクエストとして会話・実行設定・生成応答を切り替えます。
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                      <Button variant="secondary" onClick={createConversation}>
                        新しい会話
                      </Button>
                      <Button variant="secondary" onClick={duplicateConversation}>
                        現在の会話を複製
                      </Button>
                    </div>
                  </div>
                  <ol
                    className="m-0 grid max-h-80 list-none content-start gap-2 overflow-y-auto p-0 pr-1 lg:max-h-none"
                    aria-label="会話ワークスペース一覧"
                  >
                    {conversations.map((conversation) => {
                      const selected = conversation.id === activeConversation.id;
                      return (
                        <li
                          key={conversation.id}
                          className={`relative grid min-w-0 gap-3 overflow-hidden rounded-xl border p-3 transition-colors before:absolute before:inset-y-0 before:left-0 before:w-1 ${
                            selected
                              ? 'border-[#5c4f8f] bg-[#5c4f8f]/10 before:bg-[#5c4f8f]'
                              : 'border-[#17151f]/15 bg-white/70 before:bg-transparent'
                          }`}
                        >
                          <button
                            type="button"
                            aria-label={`${conversation.title}を選択`}
                            aria-pressed={selected}
                            onClick={() => {
                              setSelectedConversationId(conversation.id);
                              setImportText('');
                              setExportText('');
                            }}
                            className="grid min-w-0 gap-2 rounded-lg p-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c4f8f]"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Badge tone={selected ? 'info' : 'neutral'}>
                                {conversation.messages.length} messages
                              </Badge>
                              <span className="truncate text-xs text-myr-ink-subtle">
                                {conversation.responses.length} responses
                              </span>
                            </span>
                            <strong className="truncate">
                              {conversation.title}
                            </strong>
                            <span className="truncate text-xs text-myr-ink-subtle">
                              {ready.profiles.find(
                                (profile) =>
                                  profile.id === conversation.profileId,
                              )?.displayName ?? 'Profile未選択'}
                            </span>
                          </button>
                          {selected && (
                            <label className="grid min-w-0 gap-1 text-xs font-bold">
                              会話名
                              <Input
                                aria-label="選択中の会話名"
                                value={conversation.title}
                                onChange={(event) =>
                                  updateActiveConversation({
                                    title: event.target.value,
                                  })
                                }
                              />
                            </label>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={conversations.length === 1}
                            aria-label={`${conversation.title}を削除`}
                            onClick={() => removeConversation(conversation.id)}
                          >
                            会話を削除
                          </Button>
                        </li>
                      );
                    })}
                  </ol>
                </Panel>
              </aside>

              <div className="grid min-w-0 items-start gap-6 lg:col-start-2 xl:grid-cols-[minmax(0,1fr)_21rem]">
                <Panel
                  as="section"
                  className="grid min-w-0 gap-5"
                  aria-label="会話コンテキスト"
                >
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <Label
                        as="h2"
                        textRole="sectionEditorial"
                        className="m-0 !text-3xl"
                      >
                        Conversation context
                      </Label>
                      <p className="m-0 text-sm text-myr-ink-subtle">
                        番号とrailがAPIへ送信される順序を表します。
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setMessages(createMessages(starter))}
                      >
                        サンプル初期化
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setMessages([])}
                      >
                        会話を全消去
                      </Button>
                    </div>
                  </div>
                  <ol className="relative m-0 grid list-none gap-4 p-0 before:absolute before:top-6 before:bottom-6 before:left-[1.05rem] before:w-px before:bg-[#5c4f8f]/35">
                    {messages.map((message, index) => (
                      <li
                        key={message.id}
                        className="relative grid grid-cols-[2.2rem_minmax(0,1fr)] gap-3"
                        data-testid={`playground-message-${index}`}
                      >
                        <div
                          className="relative z-10 grid size-8 place-items-center rounded-full border-2 border-[#5c4f8f] bg-myr-paper text-xs font-black"
                          aria-hidden="true"
                        >
                          {index + 1}
                        </div>
                        <article
                          className="grid min-w-0 gap-3 rounded-xl border border-[#17151f]/15 bg-white/75 p-4 shadow-sm"
                          aria-label={`${index + 1}番目の${message.role} message`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={roleTone[message.role]}>
                              {message.role.toUpperCase()}
                            </Badge>
                            <label className="text-xs font-bold">
                              Role
                              <select
                                aria-label={`${index + 1}番目のmessage role`}
                                className="ml-2 rounded-lg border border-[#17151f]/20 bg-white px-2 py-1"
                                value={message.role}
                                onChange={(event) =>
                                  updateMessage(message.id, {
                                    role: event.target
                                      .value as AiPlaygroundRole,
                                  })
                                }
                              >
                                <option value="system">system</option>
                                <option value="user">user</option>
                                <option value="assistant">assistant</option>
                              </select>
                            </label>
                            <div className="ml-auto flex gap-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                aria-label={`${index + 1}番目を上へ`}
                                disabled={index === 0}
                                onClick={() => moveMessage(index, -1)}
                              >
                                ↑
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                aria-label={`${index + 1}番目を下へ`}
                                disabled={index === messages.length - 1}
                                onClick={() => moveMessage(index, 1)}
                              >
                                ↓
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                aria-label={`${index + 1}番目を削除`}
                                onClick={() =>
                                  setMessages((current) =>
                                    current.filter(
                                      (item) => item.id !== message.id,
                                    ),
                                  )
                                }
                              >
                                削除
                              </Button>
                            </div>
                          </div>
                          <Textarea
                            aria-label={`${index + 1}番目のmessage content`}
                            value={message.content}
                            onChange={(event) =>
                              updateMessage(message.id, {
                                content: event.target.value,
                              })
                            }
                            className="!min-h-28"
                            placeholder={`${message.role} messageを入力`}
                          />
                        </article>
                      </li>
                    ))}
                  </ol>
                  {messages.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[#17151f]/25 p-8 text-center text-myr-ink-subtle">
                      会話履歴は空です。messageを追加するかJSONをimportしてください。
                    </div>
                  )}
                  <div
                    className="flex flex-wrap gap-2"
                    aria-label="message追加"
                  >
                    <Button
                      variant="secondary"
                      onClick={() => addMessage('system')}
                    >
                      + system
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => addMessage('user')}
                    >
                      + user
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => addMessage('assistant')}
                    >
                      + assistant
                    </Button>
                  </div>
                  <details className="rounded-xl border border-[#17151f]/15 bg-white/60 p-4">
                    <summary className="cursor-pointer font-bold">
                      JSON import / export
                    </summary>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 font-bold">
                        Import JSON
                        <Textarea
                          aria-label="会話履歴import JSON"
                          className="font-mono text-xs"
                          value={importText}
                          onChange={(event) =>
                            setImportText(event.target.value)
                          }
                        />
                        <Button variant="secondary" onClick={importMessages}>
                          JSONを読み込む
                        </Button>
                      </label>
                      <label className="grid gap-2 font-bold">
                        Export JSON
                        <Textarea
                          aria-label="会話履歴export JSON"
                          className="font-mono text-xs"
                          readOnly
                          value={exportText}
                          placeholder="書き出すとrole/contentだけが表示されます。"
                        />
                        <Button
                          variant="secondary"
                          onClick={() => void exportMessages()}
                        >
                          JSONを書き出す
                        </Button>
                      </label>
                    </div>
                  </details>
                </Panel>

                <aside
                  className="grid min-w-0 gap-5 lg:sticky lg:top-28"
                  aria-label="実行設定"
                >
                  <Panel
                    as="section"
                    className="grid min-w-0 gap-4"
                    aria-label="実行設定"
                  >
                    <Label
                      as="h2"
                      textRole="sectionEditorial"
                      className="m-0 !text-2xl"
                    >
                      Run settings
                    </Label>
                    <label className="grid min-w-0 gap-2 font-bold">
                      AI Profile
                      <select
                        aria-label="AI Profile"
                        className="min-w-0 max-w-full rounded-xl border border-[#17151f]/20 bg-white px-3 py-2"
                        value={activeConversation.profileId ?? ''}
                        onChange={(event) =>
                          updateActiveConversation({
                            profileId: event.target.value,
                          })
                        }
                      >
                        <option value="" disabled>
                          Profileを選択
                        </option>
                        {ready.profiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.displayName}
                          </option>
                        ))}
                      </select>
                      {selectedProfile && (
                        <span className="min-w-0 break-all font-mono text-xs font-normal leading-5 text-myr-ink-subtle">
                          {selectedProfile.model}
                        </span>
                      )}
                    </label>
                    <details>
                      <summary className="cursor-pointer font-bold">
                        Generation overrides
                      </summary>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <label className="text-sm">
                          Temperature
                          <Input
                            aria-label="Temperature"
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={generation.temperature}
                            onChange={(event) =>
                              setGeneration((current) => ({
                                ...current,
                                temperature: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className="text-sm">
                          Top P
                          <Input
                            aria-label="Top P"
                            type="number"
                            min="0"
                            max="1"
                            step="0.05"
                            value={generation.topP}
                            onChange={(event) =>
                              setGeneration((current) => ({
                                ...current,
                                topP: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className="text-sm">
                          Max output tokens
                          <Input
                            aria-label="Maximum output tokens"
                            type="number"
                            min="1"
                            value={generation.maximumOutputTokens}
                            onChange={(event) =>
                              setGeneration((current) => ({
                                ...current,
                                maximumOutputTokens: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className="text-sm">
                          Seed
                          <Input
                            aria-label="Seed"
                            type="number"
                            value={generation.seed}
                            onChange={(event) =>
                              setGeneration((current) => ({
                                ...current,
                                seed: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className="text-sm">
                          Retry attempts
                          <Input
                            aria-label="Retry attempts"
                            type="number"
                            min="0"
                            value={generation.retryAttempts}
                            onChange={(event) =>
                              setGeneration((current) => ({
                                ...current,
                                retryAttempts: event.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>
                    </details>
                    <Button
                      variant="primary"
                      size="lg"
                      disabled={
                        working ||
                        !selectedProfile ||
                        messages.length === 0 ||
                        hasBlankMessage
                      }
                      onClick={() => void generate()}
                    >
                      {working ? '生成中…' : '次のassistant応答を生成'}
                    </Button>
                  </Panel>
                </aside>
              </div>

              <Panel
                as="section"
                className="grid min-w-0 gap-5 lg:col-start-2"
                aria-label="生成した応答"
              >
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <Label
                      as="h2"
                      textRole="sectionEditorial"
                      className="m-0 !text-3xl"
                    >
                      Responses
                    </Label>
                    <p className="m-0 text-sm text-myr-ink-subtle">
                      <span
                        data-testid="ai-playground-response-count"
                        aria-live="polite"
                      >
                        {responses.length}件の応答
                      </span>{' '}
                      · 会話ワークスペースと一緒にDBへ保存されます。
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={responses.length === 0}
                    onClick={() => {
                      setResponses([]);
                      setSelectedResponseId(null);
                      setNotice('すべての応答を消去しました。');
                      setNoticeTone('success');
                    }}
                  >
                    応答をすべて消去
                  </Button>
                </div>
                {responses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#17151f]/25 p-8 text-center text-myr-ink-subtle">
                    まだ応答はありません。同じ会話からProfileや設定を変えて複数の候補を生成できます。
                  </div>
                ) : (
                  <div className="grid min-w-0 gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
                    <ol
                      className="m-0 grid max-h-[34rem] list-none content-start gap-2 overflow-y-auto p-0 pr-1"
                      aria-label="生成応答一覧"
                    >
                      {responses.map((response) => {
                        const selected = response.id === selectedResponseId;
                        return (
                          <li
                            key={response.id}
                            className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-xl border p-2 ${selected ? 'border-[#5c4f8f] bg-[#5c4f8f]/10' : 'border-[#17151f]/15 bg-white/70'}`}
                          >
                            <button
                              type="button"
                              aria-label={`応答 ${response.number}を選択`}
                              aria-pressed={selected}
                              onClick={() => setSelectedResponseId(response.id)}
                              className="grid min-w-0 gap-1 rounded-lg p-2 text-left hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c4f8f]"
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <Badge tone={selected ? 'info' : 'neutral'}>
                                  #{response.number}
                                </Badge>
                                <strong className="min-w-0 truncate">
                                  {response.profile.displayName}
                                </strong>
                              </span>
                              <span
                                className="truncate font-mono text-xs text-myr-ink-subtle"
                                title={response.profile.model}
                              >
                                {response.profile.model}
                              </span>
                              <span className="line-clamp-2 text-sm leading-5">
                                {responsePreview(response.message.content)}
                              </span>
                              <span className="text-xs text-myr-ink-subtle">
                                {response.metadata.latencyMilliseconds} ms ·{' '}
                                {response.metadata.inputTokens ?? '—'} in /{' '}
                                {response.metadata.outputTokens ?? '—'} out
                              </span>
                            </button>
                            <Button
                              size="sm"
                              variant="danger"
                              className="self-start"
                              aria-label={`応答 ${response.number}を削除`}
                              onClick={() => deleteResponse(response.id)}
                            >
                              削除
                            </Button>
                          </li>
                        );
                      })}
                    </ol>
                    {selectedResponse && (
                      <article
                        className="grid min-w-0 content-start gap-5 rounded-xl border border-[#17151f]/15 bg-white/75 p-5"
                        aria-label={`選択中の応答 ${selectedResponse.number}`}
                        data-testid="ai-playground-response-detail"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge tone="success">ASSISTANT</Badge>
                              <strong>
                                Response #{selectedResponse.number}
                              </strong>
                            </div>
                            <p className="m-0 mt-2 break-words font-bold">
                              {selectedResponse.profile.displayName}
                            </p>
                            <p className="m-0 break-all font-mono text-xs leading-5 text-myr-ink-subtle">
                              {selectedResponse.profile.model}
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            onClick={addSelectedResponse}
                          >
                            選択した応答を会話へ追加
                          </Button>
                        </div>
                        <div className="whitespace-pre-wrap break-words rounded-xl bg-[#17151f]/5 p-4 leading-7">
                          {selectedResponse.message.content}
                        </div>
                        <dl className="m-0 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                          <dt className="text-myr-ink-subtle">
                            Provider / model
                          </dt>
                          <dd className="m-0 min-w-0 break-all text-right font-bold">
                            {selectedResponse.metadata.provider} /{' '}
                            {selectedResponse.metadata.model}
                          </dd>
                          <dt className="text-myr-ink-subtle">Tokens</dt>
                          <dd className="m-0 text-right">
                            {selectedResponse.metadata.inputTokens ?? '—'} in /{' '}
                            {selectedResponse.metadata.outputTokens ?? '—'} out
                          </dd>
                          <dt className="text-myr-ink-subtle">Latency</dt>
                          <dd className="m-0 text-right">
                            {selectedResponse.metadata.latencyMilliseconds} ms
                          </dd>
                          <dt className="text-myr-ink-subtle">
                            Attempt / finish
                          </dt>
                          <dd className="m-0 text-right">
                            {selectedResponse.metadata.attemptCount} /{' '}
                            {selectedResponse.metadata.finishReason ?? '—'}
                          </dd>
                          <dt className="text-myr-ink-subtle">Response ID</dt>
                          <dd className="m-0 min-w-0 break-all text-right font-mono text-xs">
                            {selectedResponse.metadata.responseId ?? '—'}
                          </dd>
                          <dt className="text-myr-ink-subtle">Request ID</dt>
                          <dd className="m-0 min-w-0 break-all text-right font-mono text-xs">
                            {selectedResponse.metadata.requestId ?? '—'}
                          </dd>
                        </dl>
                      </article>
                    )}
                  </div>
                )}
              </Panel>
            </div>
          )}
        </PageShell>
      </PageCanvas>
    </AppChrome>
  );
}
