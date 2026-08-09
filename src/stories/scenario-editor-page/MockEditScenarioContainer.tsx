import { useState } from 'react';
import { EditScenarioPresentation } from '../../features/scenario-editor/EditScenarioPresentation';
import type { ScenarioFormActions } from '../../features/scenario/@components/scenarioFormModel';

import { editScenarioFixture } from './editScenarioFixtures';
const account = { name: '霧野しおり', email: 'author@myriale.example', initials: '霧野', role: '作者' };

export function MockEditScenarioContainer({ scenarioId }: { scenarioId: string }) {
  const [saving, setSaving] = useState(false);
  const save: ScenarioFormActions['save'] = async (values) => {
    setSaving(true);
    await Promise.resolve();
    setSaving(false);
    return { ok: true, message: `「${values.title}」の変更を保存しました。`, value: { scenarioId } };
  };
  const assist: ScenarioFormActions['assist'] = async (_values, kind) => ({
    ok: true,
    message: kind === 'summary' ? '基本情報案を提示しました。' : '挿絵設定の候補を提示しました。',
    value: {
      message: kind === 'summary' ? '基本情報案を提示しました。' : '挿絵設定の候補を提示しました。',
      suggestions: [{ id: 'edit-suggestion', body: '## 改稿案\n\n研究施設の非常灯が、一定の間隔で明滅しています。', rationale: '現在の設定を維持した案です。' }],
    },
  });

  const debug: ScenarioFormActions['debug'] = async (_values, request) => ({
    ok: true,
    message: '隔離されたルールエンジンで実行しました。',
    value: {
      snapshot: { schemaVersion: 'rule-action-snapshot.v1', snapshotId: 'EDIT-DEBUG', currentLocation: { id: request.currentLocationCode, code: request.currentLocationCode, name: request.currentLocationCode, description: '' }, objects: [], actions: [] },
      decision: null, selectedRuleCode: null, appliedEffects: [], postState: null, facts: [], events: [], hints: [], forbiddenFacts: [],
    },
  });

  const importNarrativeTest: NonNullable<ScenarioFormActions['importNarrativeTest']> = async (sessionId, turnId) => ({
    ok: true,
    message: `${sessionId} / ${turnId} の状態と過去Turnを取り込みました。`,
    value: {
      sessionId, turnId,
      testCase: {
        recentTurns: [{ playerInput: '館について教えて', narrative: 'メイドは紅茶を注ぎ、庭のバラについて語った。' }],
        playerInput: 'この館について、まだ知らないことを教えて',
        selectedObject: { id: 'maid', code: 'maid', name: 'メイド', locationId: 'salon', isGlobal: false, revision: 2, state: { trust: 2 } },
        selectedAction: { objectId: 'maid', actionId: 'talk', code: 'talk', label: '会話する', description: '', argumentSchema: {}, enabled: true },
        postState: { schemaVersion: 'rule-post-state.v1', currentLocation: { id: 'salon', code: 'salon', name: '応接間', description: '雨音の響く応接間。' }, objects: [], sessionFlags: {}, sessionStateRevision: 4 },
        facts: [], events: [], narrativeHints: ['新しい情報を一つ明かす。'], forbiddenNarrativeFacts: [],
        entities: [{ code: 'maid', name: 'メイド', profileMarkdown: '館に長く仕えるメイド。' }],
      },
    },
  });
  const compareNarrativeDraft: NonNullable<ScenarioFormActions['compareNarrativeDraft']> = async (values) => ({
    ok: true,
    message: '同じ状態・過去Turn・AIで、公開版と未保存ドラフトを生成しました。',
    value: {
      publishedDefinitionVersionId: 'DEF-PUBLISHED', aiProfileId: 'runpod-recommended',
      published: { heading: '雨の応接間', body: 'メイドは再び紅茶を注ぎ、庭のバラについて語った。', model: 'demo', latencyMilliseconds: 620 },
      draft: { heading: '閉ざされた東棟', body: `「東棟の帳簿には、前の主人が最後に会った人物の名が残っています」\n\n${values.tone}を保ちながら、彼女は鍵の所在を初めて明かした。`, model: 'demo', latencyMilliseconds: 640 },
    },
  });

  const runAiEvaluation: NonNullable<ScenarioFormActions['runAiEvaluation']> = async (profileIds, repetitions) => {
    const attempts = profileIds.flatMap((profileId, profileIndex) => Array.from({ length: repetitions }, (_, repetition) => ({
      id: `AEA-${profileIndex}-${repetition}`, profileId, profileRevision: 1, model: profileId, repetition: repetition + 1, blindCode: `B${profileIndex + 1}${repetition + 1}`,
      status: 'succeeded', passed: profileIndex === 0 || repetition !== 1, labels: profileIndex === 0 || repetition !== 1 ? ['schema_valid', 'grounded'] : ['schema_valid', 'forbidden_term'],
      output: { heading: '比較結果', body: 'ブラインド出力' }, metadata: {}, errorCode: null, inputTokens: 510, outputTokens: 160,
      latencyMilliseconds: 780 + profileIndex * 240, startedAt: '2026-08-09T00:00:00Z', completedAt: '2026-08-09T00:00:01Z',
    })));
    return { ok: true, message: `${profileIds.length}モデル × ${repetitions}回のブラインド比較を完了しました。`, value: {
      summary: { id: 'AER-STORY', scenarioId, status: 'completed', corpusId: 'myriale-low-cost-model-comparison', corpusVersion: '1.0.0', profileIds, repetitions, caseCount: 1, attemptCount: attempts.length, passedAttemptCount: attempts.filter((item) => item.passed).length, createdAt: '2026-08-09T00:00:00Z', completedAt: '2026-08-09T00:00:03Z' }, config: {},
      cases: [{ id: 'AEC-STORY', caseId: 'maid-direct-answer', stage: 'narrative', canonicalPayloadHash: 'story', request: {}, metadata: {}, attempts }],
    } };
  };
  const exportAiEvaluation: NonNullable<ScenarioFormActions['exportAiEvaluation']> = async (_runId, format) => ({ ok: true, message: `${format.toUpperCase()}をエクスポートしました。` });

  const checkReadiness: NonNullable<ScenarioFormActions['checkReadiness']> = async () => ({
    ok: true,
    message: '公開準備が完了しています。シナリオを公開できます。',
    value: { definitionVersionId: `demo-${scenarioId}`, ready: true, errors: {} },
  });
  const publish: NonNullable<ScenarioFormActions['publish']> = async () => ({
    ok: true,
    message: 'シナリオを公開しました。公開版として利用できます。',
  });

  return <EditScenarioPresentation
    account={account}
    scenarioId={scenarioId}
    initialValues={editScenarioFixture}
    status="ready"
    saving={saving}
    aiWorking={false}
    actions={{ save, assist, debug, importNarrativeTest, compareNarrativeDraft, runAiEvaluation, exportAiEvaluation, checkReadiness, publish }}
    onRetry={() => undefined}
    onLogout={() => undefined}
  />;
}
