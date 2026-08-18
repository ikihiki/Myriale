import { describe, expect, it } from 'vitest';
import type { AiPlaygroundResponseEntry } from './aiPlaygroundModel';
import { deletePlaygroundResponse, exportConversation, parseConversationImport, responsePreview, toRequestMessages } from './aiPlaygroundModel';

describe('aiPlaygroundModel', () => {
  it('imports ordered system/user/assistant messages', () => {
    const result = parseConversationImport('[{"role":"system","content":"rules"},{"role":"user","content":"hello"},{"role":"assistant","content":"hi"}]');
    expect(result.ok).toBe(true);
    expect(result.value).toEqual([{ role: 'system', content: 'rules' }, { role: 'user', content: 'hello' }, { role: 'assistant', content: 'hi' }]);
  });

  it('rejects malformed imports without returning a replacement history', () => {
    expect(parseConversationImport('{broken')).toMatchObject({ ok: false });
    expect(parseConversationImport('[{"role":"tool","content":"secret"}]')).toMatchObject({ ok: false });
    expect(parseConversationImport('[]')).toMatchObject({ ok: false });
  });

  it('exports only role/content and preserves request order', () => {
    const editable = [{ id: 'b', role: 'user' as const, content: ' second ' }, { id: 'a', role: 'system' as const, content: ' first ' }];
    expect(toRequestMessages(editable)).toEqual([{ role: 'user', content: 'second' }, { role: 'system', content: 'first' }]);
    expect(JSON.parse(exportConversation(editable))).toEqual([{ role: 'user', content: ' second ' }, { role: 'system', content: ' first ' }]);
  });

  it('normalizes and truncates response previews', () => {
    expect(responsePreview('  first\n\nsecond  ')).toBe('first second');
    expect(responsePreview('abcdefghij', 6)).toBe('abcde…');
  });

  it('selects a nearby response when the selected response is deleted', () => {
    const response = (id: string, number: number): AiPlaygroundResponseEntry => ({
      id,
      number,
      profile: { id: 'profile', displayName: 'Profile', model: 'model' },
      message: { role: 'assistant', content: id },
      metadata: { provider: 'provider', model: 'model', responseId: null, inputTokens: null, outputTokens: null, latencyMilliseconds: 10, attemptCount: 1, finishReason: null, requestId: 'request' },
    });
    const responses = [response('newest', 3), response('middle', 2), response('oldest', 1)];

    expect(deletePlaygroundResponse(responses, 'middle', 'middle')).toEqual({ responses: [responses[0], responses[2]], selectedResponseId: 'oldest' });
    expect(deletePlaygroundResponse(responses, 'oldest', 'oldest')).toEqual({ responses: [responses[0], responses[1]], selectedResponseId: 'middle' });
    expect(deletePlaygroundResponse(responses, 'newest', 'oldest')).toEqual({ responses: [responses[0], responses[1]], selectedResponseId: 'newest' });
  });
});
