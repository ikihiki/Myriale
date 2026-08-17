import type { AiPlaygroundProfile, AiPlaygroundRunMetadata } from '../../features/ai-playground/aiPlaygroundModel';

export const aiPlaygroundProfiles: AiPlaygroundProfile[] = [
  { id: 'story-openai', displayName: 'Story OpenAI', model: 'gpt-story-mini', revision: 4, credentialRevision: 2 },
  { id: 'story-local', displayName: 'Story Local', model: 'qwen-story-8b', revision: 7, credentialRevision: 5 },
];

export const aiPlaygroundResponses = {
  'story-openai': '扉の向こうには、止まった星時計と青い観測記録が静かに並んでいます。',
  'story-local': '古いドームの隙間から月光が差し、中央の望遠鏡だけがゆっくり北を向きます。',
} as const;

export function metadataFor(profileId: keyof typeof aiPlaygroundResponses): AiPlaygroundRunMetadata {
  const profile = aiPlaygroundProfiles.find((item) => item.id === profileId)!;
  return { provider: profileId, model: profile.model, responseId: `response-${profileId}`, requestId: `request-${profileId}`, inputTokens: 48, outputTokens: 24, latencyMilliseconds: profileId === 'story-openai' ? 180 : 320, attemptCount: 1, finishReason: 'stop' };
}
