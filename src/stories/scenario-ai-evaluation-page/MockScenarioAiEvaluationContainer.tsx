import { useState } from 'react';
import type { ScenarioAiEvaluationRun } from '../../app/scenarioApi';
import { ScenarioAiEvaluationPresentation } from '../../features/scenario-ai-evaluation/ScenarioAiEvaluationPresentation';

const cases = [
  { caseId: 'narrative-adult-consensual-erotic-expression-01', stage: 'narrative' as const, request: {}, metadata: { capabilityLabel: 'adult_consensual_erotic_expression' } },
  { caseId: 'narrative-graphic-violence-01', stage: 'narrative' as const, request: {}, metadata: { capabilityLabel: 'graphic_violence' } },
];

export function MockScenarioAiEvaluationContainer({ scenarioId }: { scenarioId: string }) {
  const [recentRuns, setRecentRuns] = useState<ScenarioAiEvaluationRun['summary'][]>([]);
  return <ScenarioAiEvaluationPresentation
    account={{ name: '霧野しおり', email: 'author@myriale.example', initials: '霧野', role: '作者' }}
    scenarioId={scenarioId}
    state={{ status: 'ready', scenarioTitle: '目覚めの研究室', manifest: {
      corpusId: 'myriale-low-cost-model-comparison', version: '1.1.0', description: '成人同士の合意ある官能表現とグロ表現を、固定されたNarrativeケースとして比較します。',
      stages: [{ stage: 'narrative', plannedCaseCount: 38, plannedRepetitions: 3, generationOverrides: { temperature: 0.8, topP: 0.95, repetitionPenalty: 1.05, maxOutputTokens: 1200, thinkingEnabled: false, retryAttempts: 0 } }], cases,
    }, recentRuns }}
    actions={{
      runCorpus: async (profileIds, repetitions, caseIds) => {
        const attempts = caseIds.flatMap((caseId, caseIndex) => profileIds.flatMap((profileId, profileIndex) => Array.from({ length: repetitions }, (_, repetition) => ({
          id: `AEA-${caseIndex}-${profileIndex}-${repetition}`, profileId, profileRevision: 1, model: profileId, repetition: repetition + 1, blindCode: `B${caseIndex + 1}${profileIndex + 1}${repetition + 1}`,
          status: 'succeeded', passed: !(caseIndex === 0 && profileIndex === 2), labels: [`capability:${caseIndex === 0 ? 'adult_consensual_erotic_expression' : 'graphic_violence'}`, caseIndex === 0 && profileIndex === 2 ? 'body_too_short' : 'minimum_body_length_reached'],
          output: { schemaVersion: 'post-state-narrative.v1', heading: '評価結果', body: 'ブラインド評価出力' }, metadata: {}, errorCode: null, inputTokens: 540, outputTokens: 220, latencyMilliseconds: 1250,
          startedAt: '2026-08-10T00:00:00Z', completedAt: '2026-08-10T00:00:02Z',
        }))));
        const run: ScenarioAiEvaluationRun = { summary: { id: 'AER-CORPUS-STORY', scenarioId, status: 'completed', corpusId: 'myriale-low-cost-model-comparison', corpusVersion: '1.1.0', profileIds, repetitions, caseCount: caseIds.length, attemptCount: attempts.length, passedAttemptCount: attempts.filter((item) => item.passed).length, createdAt: '2026-08-10T00:00:00Z', completedAt: '2026-08-10T00:00:10Z' }, config: { source: 'versioned-corpus' }, cases: caseIds.map((caseId) => ({ id: `AEC-${caseId}`, caseId, stage: 'narrative', canonicalPayloadHash: 'story', request: {}, metadata: cases.find((item) => item.caseId === caseId)?.metadata ?? {}, attempts: attempts.filter((item) => item.id.startsWith(`AEA-${caseIds.indexOf(caseId)}-`)) })) };
        setRecentRuns([run.summary]);
        return { ok: true, message: `${caseIds.length}ケース・${attempts.length} attemptsのCorpus評価を完了しました。`, value: run };
      },
      exportRun: async (_runId, format) => ({ ok: true, message: `${format.toUpperCase()}をエクスポートしました。` }),
      retry: () => undefined, backToScenario: () => undefined, logout: () => undefined,
    }}
  />;
}
