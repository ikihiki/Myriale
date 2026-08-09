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
