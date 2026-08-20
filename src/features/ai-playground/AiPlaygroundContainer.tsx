import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { toAppChromeAccount } from '../../account/accountPresentation';
import {
  createFetchAdminAiApi,
  type AdminAiApi,
  type AdminAiApiError,
} from '../../account/api/adminAiApi';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { fetchSessionList } from '../session-list/sessionListApi';
import { getSession } from '../session-play/sessionPlayApi';
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
  const revisionRef = useRef<number | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const query = useQuery({
    queryKey: ['admin-ai-playground', reloadKey],
    queryFn: async () => {
      const [profiles, playground, sessions] = await Promise.all([
        adminAiApi.listProfiles(),
        adminAiApi.getPlaygroundDocument(),
        fetchSessionList(true),
      ]);
      return { profiles, playground, sessions };
    },
  });
  useEffect(() => {
    revisionRef.current = query.data?.playground?.revision ?? null;
  }, [query.data?.playground?.revision]);
  const availableProfiles = (query.data?.profiles ?? []).filter(
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

  const loadSessionTurns: AiPlaygroundActions['loadSessionTurns'] = async (sessionId) => {
    try {
      const session = await getSession(sessionId);
      const turns = session.turns
        .filter((turn) => turn.kind === 'narrative' && Boolean(turn.narrative?.playerInputId))
        .sort((left, right) => right.position - left.position)
        .map((turn) => ({
          id: turn.id,
          position: turn.position,
          label: `Turn ${turn.position} · ${turn.narrative?.playerInput?.trim() || turn.narrative?.heading || 'player input'}`,
        }));
      return {
        ok: true,
        message: `${turns.length}件のインポート可能なTurnを読み込みました。`,
        value: turns,
      };
    } catch (caught) {
      return {
        ok: false,
        message: caught instanceof Error ? caught.message : 'Session Turnを読み込めませんでした。',
      };
    }
  };

  const importSessionTurn: AiPlaygroundActions['importSessionTurn'] = async (
    profileId,
    sessionId,
    turnId,
  ) => {
    const profile = availableProfiles.find((item) => item.id === profileId);
    if (!profile)
      return {
        ok: false,
        message: '有効なCredential設定済みAI Profileを選択してください。',
      };
    try {
      const response = await adminAiApi.importSessionTurn(profile, { sessionId, turnId });
      return {
        ok: true,
        message: `Turn ${response.turnPosition} のリクエストを会話へインポートしました。`,
        value: {
          sessionId: response.sessionId,
          turnId: response.turnId,
          turnPosition: response.turnPosition,
          messages: response.messages,
        },
      };
    } catch (caught) {
      const error = caught as AdminAiApiError;
      if (error.status === 401 || error.status === 403) {
        if (error.status === 401) accountSession.clearUser();
        return {
          ok: false,
          message: error.status === 401
            ? 'ログインの有効期限が切れました。再ログインしてください。'
            : 'このSession Turnをインポートする権限がありません。',
          action: error.status === 401 ? 'login' : undefined,
        };
      }
      if (error.status === 409) setReloadKey((value) => value + 1);
      return {
        ok: false,
        message: error.message ?? 'Session Turnのリクエストをインポートできませんでした。',
        action: error.status === 409 ? 'reload' : undefined,
      };
    }
  };

  const generateSessionChat: AiPlaygroundActions['generateSessionChat'] = async (
    profileId,
    sessionId,
    messages,
    generationOverrides,
    maxToolRounds,
  ) => {
    const profile = availableProfiles.find((item) => item.id === profileId);
    if (!profile)
      return {
        ok: false,
        message: '有効なCredential設定済みAI Profileを選択してください。',
      };
    try {
      const response = await adminAiApi.testSessionChat(profile, {
        sessionId,
        messages,
        generationOverrides,
        maxToolRounds,
      });
      return {
        ok: true,
        message: `本番Session由来のchatで応答を生成しました。Rule tool preview: ${response.toolPreviews.length}件。`,
        value: {
          message: {
            role: 'assistant',
            content: response.message.content ?? '',
          },
          metadata: {
            provider: response.metadata.provider,
            model: response.metadata.model,
            responseId: response.metadata.responseId,
            inputTokens: response.metadata.inputTokens,
            outputTokens: response.metadata.outputTokens,
            latencyMilliseconds: response.metadata.latencyMilliseconds,
            attemptCount: response.metadata.attemptCount,
            finishReason: response.metadata.finishReason,
            requestId: undefined,
          },
          sentMessages: response.sentMessages,
          systemMarkdown: response.systemMarkdown,
          toolPreviews: response.toolPreviews,
        },
      };
    } catch (caught) {
      const error = caught as AdminAiApiError;
      if (error.status === 401 || error.status === 403) {
        if (error.status === 401) accountSession.clearUser();
        return {
          ok: false,
          message:
            error.status === 401
              ? 'ログインの有効期限が切れました。再ログインしてください。'
              : 'このSessionを使ったPlayground実行権限がありません。',
          action: error.status === 401 ? 'login' : undefined,
        };
      }
      if (error.status === 409) {
        setReloadKey((value) => value + 1);
        return {
          ok: false,
          message:
            'AI Profile、Credential、またはSessionが更新されました。再読み込み後に確認してください。',
          action: 'reload',
        };
      }
      return {
        ok: false,
        message: error.message ?? 'Session chat tool実験を実行できませんでした。',
      };
    }
  };

  const save: AiPlaygroundActions['save'] = async (document) => {
    const previous = saveQueueRef.current;
    let release: () => void = () => undefined;
    saveQueueRef.current = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      const snapshot = await adminAiApi.savePlaygroundDocument(
        document,
        revisionRef.current,
      );
      revisionRef.current = snapshot.revision;
      return { ok: true, message: 'PlaygroundをDBへ保存しました。' };
    } catch (caught) {
      const error = caught as AdminAiApiError;
      if (error.status === 401 || error.status === 403) {
        if (error.status === 401) accountSession.clearUser();
        return {
          ok: false,
          message:
            error.status === 401
              ? 'ログインの有効期限が切れたため保存できませんでした。'
              : 'Playgroundを保存する権限がありません。',
          action: error.status === 401 ? 'login' : undefined,
        };
      }
      if (error.status === 409) {
        setReloadKey((value) => value + 1);
        return {
          ok: false,
          message:
            '別の画面でPlaygroundが更新されています。再読み込みして内容を確認してください。',
          action: 'reload',
        };
      }
      return {
        ok: false,
        message: error.message ?? 'PlaygroundをDBへ保存できませんでした。',
      };
    } finally {
      release();
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
        document: query.data.playground?.document ?? null,
        documentRevision: query.data.playground?.revision ?? null,
        sessions: query.data.sessions.map((session) => ({
          id: session.id,
          label: `${session.scenarioTitle} · ${session.selectedHero} · ${session.turnCount} turns`,
          status: session.status,
        })),
      };
  return (
    <AiPlaygroundPresentation
      account={toAppChromeAccount(accountSession.user, 'AI管理者')}
      state={state}
      actions={{
        generate,
        loadSessionTurns,
        importSessionTurn,
        generateSessionChat,
        save,
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
