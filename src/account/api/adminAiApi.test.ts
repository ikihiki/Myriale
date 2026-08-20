import { describe, expect, it } from 'vitest';
import { createDemoAdminAiApi } from './adminAiApi';

describe('AdminAiApi split profile and credential contracts', () => {
  it('carries revisions and rejects stale profile updates', async () => {
    const api = createDemoAdminAiApi();
    await api.createProfile({ id: 'local', displayName: 'Local', baseUrl: 'https://local.test/v1', model: 'model', systemPrompt: '情景を丁寧に描く。', credentialId: 'local-secret', enabled: true });
    const profile = (await api.listProfiles()).find((item) => item.id === 'local')!;
    expect(profile.systemPrompt).toBe('情景を丁寧に描く。');
    await api.updateProfile(profile.id, { displayName: 'Updated', baseUrl: profile.baseUrl, model: profile.model, systemPrompt: '会話の間を描く。', credentialId: profile.credentialId, expectedRevision: profile.revision });
    expect((await api.listProfiles()).find((item) => item.id === 'local')?.systemPrompt).toBe('会話の間を描く。');
    await expect(api.updateProfile(profile.id, { displayName: 'Stale', baseUrl: profile.baseUrl, model: profile.model, systemPrompt: '古い変更', credentialId: profile.credentialId, expectedRevision: profile.revision })).rejects.toMatchObject({ status: 409 });
  });

  it('creates a database override for a deployment profile with the same id', async () => {
    const api = createDemoAdminAiApi();
    const deployment = (await api.listProfiles()).find((item) => item.id === 'openai')!;

    await api.createProfile({ id: deployment.id, displayName: deployment.displayName, baseUrl: deployment.baseUrl, model: deployment.model, systemPrompt: '簡潔な文体にする。', credentialId: deployment.credentialId, enabled: deployment.enabled });

    const overridden = (await api.listProfiles()).find((item) => item.id === 'openai')!;
    expect(overridden.source).toBe('database');
    expect(overridden.revision).toBe(1);
    expect(overridden.active).toBe(true);
    expect(overridden.systemPrompt).toBe('簡潔な文体にする。');
  });

  it('rejects active profile disable/delete and referenced credential delete', async () => {
    const api = createDemoAdminAiApi();
    const openai = (await api.listProfiles()).find((item) => item.id === 'openai')!;
    await expect(api.setProfileEnabled(openai.id, false, openai.revision)).rejects.toMatchObject({ status: 409 });
    await expect(api.deleteProfile(openai.id, openai.revision)).rejects.toMatchObject({ status: 409 });
    const runpodCredential = (await api.listCredentials()).find((item) => item.id === 'runpod')!;
    await expect(api.deleteCredential(runpodCredential.id, runpodCredential.revision)).rejects.toMatchObject({ status: 409 });
  });

  it('invalidates profile validation when a credential revision changes', async () => {
    const api = createDemoAdminAiApi();
    let runpod = (await api.listProfiles()).find((item) => item.id === 'runpod')!;
    await api.testConnection(runpod);
    expect((await api.listProfiles()).find((item) => item.id === 'runpod')?.validationStatus).toBe('valid');
    await api.replaceCredential('runpod', { displayName: 'Runpod', secret: 'replacement', expectedRevision: 1 });
    runpod = (await api.listProfiles()).find((item) => item.id === 'runpod')!;
    expect(runpod.credentialRevision).toBe(2);
    expect(runpod.validationStatus).toBe('untested');
  });
});

import { afterEach, vi } from 'vitest';
import { createFetchAdminAiApi } from './adminAiApi';

afterEach(() => vi.restoreAllMocks());

describe('AdminAiApi conversation test contract', () => {
  it('posts ordered messages, generation overrides, and revision fences without profile secrets', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: { role: 'assistant', content: 'answer' }, provider: 'provider', model: 'model', latencyMilliseconds: 12, attemptCount: 1 }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const api = createFetchAdminAiApi('/api/admin');
    const profile = (await createDemoAdminAiApi().listProfiles())[0];
    await api.testConversation(profile, [{ role: 'system', content: 'rules' }, { role: 'user', content: 'question' }], { temperature: 0.4, maximumOutputTokens: 300 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api/admin/ai-profiles/${profile.id}/conversation-tests`);
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({ messages: [{ role: 'system', content: 'rules' }, { role: 'user', content: 'question' }], generationOverrides: { temperature: 0.4, maximumOutputTokens: 300 }, expectedProfileRevision: profile.revision, expectedCredentialRevision: profile.credentialRevision });
    expect(JSON.stringify(body)).not.toContain(profile.baseUrl);
    expect(JSON.stringify(body)).not.toContain(profile.credentialId);
  });

  it('posts a session chat tool experiment with revision fences', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          message: { role: 'assistant', content: 'answer' },
          metadata: {
            provider: 'provider',
            model: 'model',
            latencyMilliseconds: 12,
            attemptCount: 1,
            providerRounds: 1,
            toolCallCount: 0,
          },
          systemMarkdown: '# Context',
          sentMessages: [],
          toolPreviews: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const api = createFetchAdminAiApi('/api/admin');
    const profile = (await createDemoAdminAiApi().listProfiles())[0];
    await api.testSessionChat(profile, {
      sessionId: 'SES-1',
      messages: [{ role: 'user', content: '西の扉を開ける' }],
      generationOverrides: { temperature: 0.3 },
      maxToolRounds: 2,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api/admin/ai-profiles/${profile.id}/session-chat-tests`);
    expect(JSON.parse(String(init?.body))).toEqual({
      sessionId: 'SES-1',
      messages: [{ role: 'user', content: '西の扉を開ける' }],
      generationOverrides: { temperature: 0.3 },
      maxToolRounds: 2,
      expectedProfileRevision: profile.revision,
      expectedCredentialRevision: profile.credentialRevision,
    });
  });
});

describe('AdminAiApi Playground persistence contract', () => {
  it('persists and reloads the complete document with revision fencing', async () => {
    const api = createDemoAdminAiApi();
    expect(await api.getPlaygroundDocument()).toBeNull();
    const document = {
      selectedConversationId: 'conversation-1',
      conversations: [
        {
          id: 'conversation-1',
          title: '天文台',
          sourceSessionId: null,
          sourceTurnId: null,
          sourceTurnPosition: null,
          maxToolRounds: '2',
          profileId: 'openai',
          messages: [
            { id: 'message-1', role: 'user' as const, content: '扉を開ける' },
          ],
          generation: {
            temperature: '0.7',
            topP: '',
            maximumOutputTokens: '800',
            seed: '',
            retryAttempts: '0',
          },
          responses: [],
          selectedResponseId: null,
        },
      ],
    };
    const created = await api.savePlaygroundDocument(document, null);
    expect(created.revision).toBe(1);
    expect((await api.getPlaygroundDocument())?.document).toEqual(document);
    await expect(api.savePlaygroundDocument(document, null)).rejects.toMatchObject({
      status: 409,
    });
  });
});
