import { useRef, useState } from 'react';
import { AiPlaygroundPresentation } from '../../features/ai-playground/AiPlaygroundPresentation';
import type { AiPlaygroundActions } from '../../features/ai-playground/aiPlaygroundModel';
import { aiPlaygroundProfiles, aiPlaygroundResponses, metadataFor } from './aiPlaygroundFixtures';

export type AiPlaygroundStoryScenario = 'success' | 'provider-error-once' | 'revision-conflict';

export function MockAiPlaygroundContainer({ scenario = 'success' }: { scenario?: AiPlaygroundStoryScenario }) {
  const [selectedProfileId, setSelectedProfileId] = useState(aiPlaygroundProfiles[0].id);
  const attempts = useRef(0);
  const generate: AiPlaygroundActions['generate'] = async () => {
    attempts.current += 1;
    if (scenario === 'provider-error-once' && attempts.current === 1) return { ok: false, message: 'Providerが一時的に利用できません。会話履歴を保持したまま再試行できます。' };
    if (scenario === 'revision-conflict') return { ok: false, message: 'AI ProfileまたはCredentialが更新されました。最新情報を再読み込みしたため、内容を確認して再実行してください。', action: 'reload' };
    const profileId = selectedProfileId as keyof typeof aiPlaygroundResponses;
    return { ok: true, message: '次のassistant応答を生成しました。', value: { message: { role: 'assistant', content: aiPlaygroundResponses[profileId] }, metadata: metadataFor(profileId) } };
  };
  return <AiPlaygroundPresentation account={{ name: '運用管理者', email: 'admin@myriale.example', initials: '運管', role: 'AI管理者' }} state={{ status: 'ready', profiles: aiPlaygroundProfiles, selectedProfileId }} actions={{ selectProfile: setSelectedProfileId, generate, retry: () => undefined, logout: () => undefined }} />;
}
