import { describe, expect, it } from 'vitest';
import { exportConversation, parseConversationImport, toRequestMessages } from './aiPlaygroundModel';

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
});
