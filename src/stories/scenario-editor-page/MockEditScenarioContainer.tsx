import { useState } from 'react';
import { EditScenarioPresentation } from '../../features/scenario-editor/EditScenarioPresentation';
import type { ScenarioFormActions, ScenarioFormValues } from '../../features/scenario/@components/scenarioFormModel';

const fixture: ScenarioFormValues = {
  title: '目覚めの研究室',
  summary: '# シナリオ\n閉鎖された地下研究施設から脱出します。\n# 描写\n- 緊張感のある静かな雰囲気を維持する',
  genre: 'SF,ミステリー,脱出劇',
  aiFreedom: '低: 厳密に守る',
  heroMode: 'free',
  heroFreeGenerationAllowed: false,
  hero: '記憶を失った人物として自由に作成する。',
  opening: 'あなたは閉鎖された地下研究施設で目を覚ます。',
  illustrationStyle: '冷たい研究施設のコンセプトアート',
  illustrationMood: '静かな緊張感',
  illustrationNegative: '明るい屋外、コミカルな表現',
  sampleScene: '非常灯だけが点滅する無人の実験室。',
};

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

  return <EditScenarioPresentation
    account={account}
    scenarioId={scenarioId}
    initialValues={fixture}
    status="ready"
    saving={saving}
    aiWorking={false}
    actions={{ save, assist }}
    onRetry={() => undefined}
    onLogout={() => undefined}
  />;
}
