import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { toAppChromeAccount } from '../../account/accountPresentation';
import {
  createFetchAdminAiApi,
  type AdminAiApi,
  type AdminAiApiError,
} from '../../account/api/adminAiApi';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { AiPlaygroundPresentation } from './AiPlaygroundPresentation';
import type {
  AiPlaygroundActions,
  AiPlaygroundGenerationResult,
  AiPlaygroundProfile,
} from './aiPlaygroundModel';

export function AiPlaygroundContainer({ api }: { api?: AdminAiApi }) {
  const navigate = useNavigate();
  const accountSession = useAccountSession();
  const adminAiApi = useMemo(() => api ?? createFetchAdminAiApi(), [api]);
  const [reloadKey, setReloadKey] = useState(0);
  const query = useQuery({
    queryKey: ['admin-ai-playground-profiles', reloadKey],
    queryFn: () => adminAiApi.listProfiles(),
  });
  const availableProfiles = (query.data ?? []).filter(
    (profile) => profile.enabled && profile.credentialConfigured,
  );
  const profiles: AiPlaygroundProfile[] = availableProfiles.map(
    ({ id, displayName, model, revision, credentialRevision }) => ({
      id,
      displayName,
      model,
      revision,
      credentialRevision,
    }),
  );

  const generate: AiPlaygroundActions['generate'] = async (
    profileId,
    messages,
    generationOverrides,
  ) => {
    const profile = availableProfiles.find((item) => item.id === profileId);
    if (!profile)
      return {
        ok: false,
        message: '有効なCredential設定済みAI Profileを選択してください。',
      };
    try {
      const response = await adminAiApi.testConversation(
        profile,
        messages,
        generationOverrides,
      );
      const value: AiPlaygroundGenerationResult = {
        message: response.message,
        metadata: {
          provider: response.provider,
          model: response.model,
          responseId: response.responseId,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          latencyMilliseconds: response.latencyMilliseconds,
          attemptCount: response.attemptCount,
          finishReason: response.finishReason,
          requestId: response.requestId,
        },
      };
      return { ok: true, message: '次のassistant応答を生成しました。', value };
    } catch (caught) {
      const error = caught as AdminAiApiError;
      if (error.status === 401 || error.status === 403) {
        if (error.status === 401) accountSession.clearUser();
        return {
          ok: false,
          message:
            error.status === 401
              ? 'ログインの有効期限が切れました。再ログインしてください。'
              : 'AI Playgroundを実行する権限がありません。',
          action: error.status === 401 ? 'login' : undefined,
        };
      }
      if (error.status === 409) {
        setReloadKey((value) => value + 1);
        return {
          ok: false,
          message:
            'AI ProfileまたはCredentialが更新されました。最新情報を再読み込みしたため、内容を確認して再実行してください。',
          action: 'reload',
        };
      }
      return {
        ok: false,
        message:
          error.errors?.messages?.[0] ??
          error.errors?.generationOverrides?.[0] ??
          error.message ??
          'assistant応答を生成できませんでした。',
      };
    }
  };

  const state = query.isPending
    ? { status: 'loading' as const }
    : query.isError
      ? {
        status: 'error' as const,
        message:
            query.error instanceof Error
              ? query.error.message
              : 'AI Profileを読み込めませんでした。',
      }
      : {
        status: 'ready' as const,
        profiles,
        defaultProfileId:
            availableProfiles.find((profile) => profile.active)?.id ??
            availableProfiles[0]?.id ??
            null,
      };
  return (
    <AiPlaygroundPresentation
      account={toAppChromeAccount(accountSession.user, 'AI管理者')}
      state={state}
      actions={{
        generate,
        retry: () => setReloadKey((value) => value + 1),
        logout: async () => {
          await accountSession.api.logout();
          accountSession.clearUser();
          await navigate({ to: '/account/login' });
        },
      }}
    />
  );
}
