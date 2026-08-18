import { useRef } from 'react';
import { AiPlaygroundPresentation } from '../../features/ai-playground/AiPlaygroundPresentation';
import type { AiPlaygroundActions } from '../../features/ai-playground/aiPlaygroundModel';
import {
  aiPlaygroundProfiles,
  aiPlaygroundResponses,
  metadataFor,
} from './aiPlaygroundFixtures';

export type AiPlaygroundStoryScenario =
  'success' | 'provider-error-once' | 'revision-conflict';

export function MockAiPlaygroundContainer({
  scenario = 'success',
}: {
  scenario?: AiPlaygroundStoryScenario;
}) {
  const attempts = useRef(0);
  const generate: AiPlaygroundActions['generate'] = async (profileId) => {
    attempts.current += 1;
    if (scenario === 'provider-error-once' && attempts.current === 2)
      return {
        ok: false,
        message:
          'Providerが一時的に利用できません。すべての会話と生成済み応答を保持したまま再試行できます。',
      };
    if (scenario === 'revision-conflict')
      return {
        ok: false,
        message:
          'AI ProfileまたはCredentialが更新されました。最新情報を再読み込みしたため、内容を確認して再実行してください。',
        action: 'reload',
      };
    const responseProfileId = profileId as keyof typeof aiPlaygroundResponses;
    return {
      ok: true,
      message: '次のassistant応答を生成しました。',
      value: {
        message: {
          role: 'assistant',
          content: aiPlaygroundResponses[responseProfileId],
        },
        metadata: metadataFor(responseProfileId),
      },
    };
  };
  const generateSessionChat: AiPlaygroundActions['generateSessionChat'] = async (
    profileId,
    _sessionId,
    currentUserMessage,
  ) => {
    const profile = aiPlaygroundProfiles.find((item) => item.id === profileId)!;
    const systemMarkdown =
      '# Scenario\n\n星喰いの図書館\n\n## Current location\n\n古い天文台\n\n## Rule tools\n\n状態変更を描写する前に `preview_rule_action` を呼び出す。';
    return {
      ok: true,
      message: '本番Session由来のchatで応答を生成しました。Rule tool preview: 1件。',
      value: {
        message: {
          role: 'assistant',
          content: `西の扉のルールを確認しました。${currentUserMessage}`,
        },
        metadata: metadataFor(profileId as keyof typeof aiPlaygroundResponses),
        sentMessages: [
          { role: 'system', content: systemMarkdown },
          { role: 'user', content: '西の扉を調べる' },
          { role: 'assistant', content: '扉には星形の鍵穴があります。' },
          { role: 'user', content: currentUserMessage },
        ],
        systemMarkdown,
        toolPreviews: [
          {
            toolCallId: 'tool-story-1',
            selectionCode: 'object:west-door/open',
            arguments: {},
            status: 'valid',
            appliedEffects: [
              { type: 'set', targetId: 'west-door', path: 'open', value: true },
            ],
            postState: { currentLocation: 'observatory', objects: [] },
            facts: ['西の扉が開いた'],
            events: [],
            narrativeHints: ['星時計の光を描写する'],
            forbiddenNarrativeFacts: [],
            extensionRequested: false,
          },
        ],
      },
    };
  };
  return (
    <AiPlaygroundPresentation
      account={{
        name: '運用管理者',
        email: 'admin@myriale.example',
        initials: '運管',
        role: 'AI管理者',
      }}
      state={{
        status: 'ready',
        profiles: aiPlaygroundProfiles,
        defaultProfileId: aiPlaygroundProfiles[0].id,
        document: null,
        documentRevision: null,
        sessions: [
          {
            id: 'SES-STORY-1',
            label: '星喰いの図書館 · 旅人 · 12 turns',
            status: 'active',
          },
        ],
      }}
      actions={{
        generate,
        generateSessionChat,
        save: async () => ({
          ok: true,
          message: 'PlaygroundをDBへ保存しました。',
        }),
        retry: () => undefined,
        logout: () => undefined,
      }}
    />
  );
}
