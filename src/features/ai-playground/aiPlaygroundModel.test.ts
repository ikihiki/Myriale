import { describe, expect, it } from 'vitest';
import type {
  AiPlaygroundConversationWorkspace,
  AiPlaygroundResponseEntry,
} from './aiPlaygroundModel';
import {
  deletePlaygroundConversation,
  deletePlaygroundResponse,
  duplicatePlaygroundConversation,
  exportConversation,
  parseConversationImport,
  responsePreview,
  toRequestMessages,
} from './aiPlaygroundModel';

describe('aiPlaygroundModel', () => {
  it('imports ordered system/user/assistant messages', () => {
    const result = parseConversationImport(
      '[{"role":"system","content":"rules"},{"role":"user","content":"hello"},{"role":"assistant","content":"hi"}]',
    );
    expect(result.ok).toBe(true);
    expect(result.value).toEqual([
      { role: 'system', content: 'rules' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ]);
  });

  it('rejects malformed imports without returning a replacement history', () => {
    expect(parseConversationImport('{broken')).toMatchObject({ ok: false });
    expect(
      parseConversationImport('[{"role":"tool","content":"secret"}]'),
    ).toMatchObject({ ok: false });
    expect(parseConversationImport('[]')).toMatchObject({ ok: false });
  });

  it('exports only role/content and preserves request order', () => {
    const editable = [
      { id: 'b', role: 'user' as const, content: ' second ' },
      { id: 'a', role: 'system' as const, content: ' first ' },
    ];
    expect(toRequestMessages(editable)).toEqual([
      { role: 'user', content: 'second' },
      { role: 'system', content: 'first' },
    ]);
    expect(JSON.parse(exportConversation(editable))).toEqual([
      { role: 'user', content: ' second ' },
      { role: 'system', content: ' first ' },
    ]);
  });

  it('normalizes and truncates response previews', () => {
    expect(responsePreview('  first\n\nsecond  ')).toBe('first second');
    expect(responsePreview('abcdefghij', 6)).toBe('abcde…');
  });

  it('falls back to the next nearby conversation when deleting the active workspace', () => {
    const conversation = (id: string): AiPlaygroundConversationWorkspace => ({
      id,
      title: id,
      messages: [],
      profileId: null,
      generation: {
        temperature: '',
        topP: '',
        maximumOutputTokens: '',
        seed: '',
        retryAttempts: '',
      },
      responses: [],
      selectedResponseId: null,
    });
    const conversations = [
      conversation('first'),
      conversation('middle'),
      conversation('last'),
    ];

    expect(
      deletePlaygroundConversation(conversations, 'middle', 'middle'),
    ).toEqual({
      conversations: [conversations[0], conversations[2]],
      selectedConversationId: 'last',
    });
    expect(deletePlaygroundConversation(conversations, 'last', 'last')).toEqual(
      {
        conversations: [conversations[0], conversations[1]],
        selectedConversationId: 'middle',
      },
    );
    expect(
      deletePlaygroundConversation([conversations[0]], 'first', 'first'),
    ).toEqual({
      conversations: [conversations[0]],
      selectedConversationId: 'first',
    });
  });

  it('duplicates messages, generation settings, and responses without shared references', () => {
    const source: AiPlaygroundConversationWorkspace = {
      id: 'source',
      title: 'Source',
      messages: [{ id: 'message-source', role: 'user', content: 'hello' }],
      profileId: 'profile',
      generation: {
        temperature: '0.7',
        topP: '',
        maximumOutputTokens: '800',
        seed: '',
        retryAttempts: '0',
      },
      responses: [
        {
          id: 'response-source',
          number: 1,
          profile: { id: 'profile', displayName: 'Profile', model: 'model' },
          message: { role: 'assistant', content: 'answer' },
          metadata: {
            provider: 'provider',
            model: 'model',
            responseId: null,
            inputTokens: null,
            outputTokens: null,
            latencyMilliseconds: 10,
            attemptCount: 1,
            finishReason: null,
            requestId: 'request',
          },
        },
      ],
      selectedResponseId: 'response-source',
    };
    const duplicate = duplicatePlaygroundConversation(source, {
      id: 'copy',
      title: 'Source copy',
      createMessageId: () => 'message-copy',
      createResponseId: () => 'response-copy',
    });

    expect(duplicate).toMatchObject({
      id: 'copy',
      title: 'Source copy',
      selectedResponseId: 'response-copy',
    });
    expect(duplicate.messages[0].id).toBe('message-copy');
    expect(duplicate.responses[0].id).toBe('response-copy');
    expect(duplicate.messages[0]).not.toBe(source.messages[0]);
    expect(duplicate.generation).not.toBe(source.generation);
    expect(duplicate.responses[0]).not.toBe(source.responses[0]);
    expect(duplicate.responses[0].message).not.toBe(
      source.responses[0].message,
    );
    duplicate.messages[0].content = 'changed';
    duplicate.responses[0].message.content = 'changed answer';
    expect(source.messages[0].content).toBe('hello');
    expect(source.responses[0].message.content).toBe('answer');
  });

  it('selects a nearby response when the selected response is deleted', () => {
    const response = (
      id: string,
      number: number,
    ): AiPlaygroundResponseEntry => ({
      id,
      number,
      profile: { id: 'profile', displayName: 'Profile', model: 'model' },
      message: { role: 'assistant', content: id },
      metadata: {
        provider: 'provider',
        model: 'model',
        responseId: null,
        inputTokens: null,
        outputTokens: null,
        latencyMilliseconds: 10,
        attemptCount: 1,
        finishReason: null,
        requestId: 'request',
      },
    });
    const responses = [
      response('newest', 3),
      response('middle', 2),
      response('oldest', 1),
    ];

    expect(deletePlaygroundResponse(responses, 'middle', 'middle')).toEqual({
      responses: [responses[0], responses[2]],
      selectedResponseId: 'oldest',
    });
    expect(deletePlaygroundResponse(responses, 'oldest', 'oldest')).toEqual({
      responses: [responses[0], responses[1]],
      selectedResponseId: 'middle',
    });
    expect(deletePlaygroundResponse(responses, 'newest', 'oldest')).toEqual({
      responses: [responses[0], responses[1]],
      selectedResponseId: 'newest',
    });
  });
});
