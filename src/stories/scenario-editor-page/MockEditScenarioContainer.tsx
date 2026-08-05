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
    actions={{ save, assist, debug, checkReadiness, publish }}
    onRetry={() => undefined}
    onLogout={() => undefined}
  />;
}
