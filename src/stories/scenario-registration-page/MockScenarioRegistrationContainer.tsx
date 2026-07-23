import { useState } from 'react';
import { useOptionalAppStore } from '../../app/store';
import { ScenarioRegistrationPresentation } from '../../features/scenario-registration/ScenarioRegistrationPresentation';
import type { ScenarioRegistrationActions } from '../../features/scenario-registration/scenarioRegistrationModel';

const demoAccount = {
  name: '霧野しおり',
  email: 'author@myriale.example',
  initials: '霧野',
  role: '作者',
};

export function MockScenarioRegistrationContainer() {
  const store = useOptionalAppStore();
  const [scenarioId, setScenarioId] = useState('未発行');

  const saveDraft: ScenarioRegistrationActions['saveDraft'] = async (values) => {
    if (!values.title.trim()) {
      return {
        ok: false,
        message: 'タイトルを入力すると下書き保存できます。',
        fieldErrors: { title: ['シナリオタイトルを入力してください。'] },
      };
    }

    const id = 'SCN-DRAFT-0427';
    setScenarioId(id);
    store?.dispatch({
      type: 'SCENARIO_SAVED',
      scenario: {
        id,
        title: values.title.trim(),
        status: 'draft',
        genre: values.genre,
        updatedAt: '2026-07-23',
        summary: values.summary,
        tone: values.tone,
        lore: values.lore,
        aiFreedom: values.aiFreedom,
        heroMode: values.heroMode,
        heroFreeGenerationAllowed: values.heroFreeGenerationAllowed,
        hero: values.hero,
        opening: values.opening,
        illustrationStyle: values.illustrationStyle,
        illustrationMood: values.illustrationMood,
        illustrationNegative: values.illustrationNegative,
        sampleScene: values.sampleScene,
      },
    });
    return {
      ok: true,
      message: `「${values.title.trim()}」をDraftとして保存しました。ScenarioIdを発行しました。`,
      value: { scenarioId: id },
    };
  };

  const assist: ScenarioRegistrationActions['assist'] = async (values, kind) => {
    if (kind === 'summary') return {
      ok: true,
      message: '基本情報案を3つ提示しました。採用、編集、破棄を選べます。',
      value: {
        message: '基本情報案を3つ提示しました。採用、編集、破棄を選べます。',
        suggestions: [{ id: 'summary-1', body: '## 物語の目的\n\n地下に沈んだ王都で、禁書を読むたびに書き換わる星座の謎を追います。\n\n- 水没した書庫を探索する\n- 失われる記憶の代償を選ぶ', rationale: 'title/genre/loreからMarkdownの基本情報を生成しました。' }],
      },
    };
    if (kind === 'lore-check') return {
      ok: true,
      message: '世界観の矛盾候補を2件見つけました。',
      value: {
        message: '世界観の矛盾候補を2件見つけました。',
        suggestions: [{ id: 'lore-1', body: '死者の名前を読む条件と記憶喪失の範囲を明確化すると、セッション中の判定が安定します。', rationale: 'Loreの発火条件を明文化します。' }],
      },
    };
    if (kind === 'illustration-style') return {
      ok: true,
      message: 'シナリオに合う画風候補を提示しました。',
      value: {
        message: 'シナリオに合う画風候補を提示しました。',
        suggestions: [{ id: 'style-1', body: '銅版画風、影絵、水彩写本。低彩度で星図の金線だけを強調。', rationale: '既存のムードとNG要素に合わせました。' }],
      },
    };
    if (kind === 'illustration-prompt') return {
      ok: true,
      message: '画像生成用プロンプトとネガティブプロンプトを分離して生成しました。',
      value: {
        message: '画像生成用プロンプトとネガティブプロンプトを分離して生成しました。',
        suggestions: [{ id: 'prompt-1', body: 'submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette', rationale: 'プロンプトとNG要素を分離しました。' }],
        prompt: 'submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette',
        negativePrompt: values.illustrationNegative,
      },
    };
    return {
      ok: true,
      message: 'サンプルシーンのプレビューを生成しました。',
      value: {
        message: 'サンプルシーンのプレビューを生成しました。',
        suggestions: [],
        previewText: `[Preview / 保存対象外] ${values.sampleScene} / ${values.illustrationStyle} / ${values.illustrationMood}`,
      },
    };
  };

  return <ScenarioRegistrationPresentation
    account={demoAccount}
    scenarioId={scenarioId}
    saving={false}
    aiWorking={false}
    actions={{ saveDraft, assist }}
    onLogout={() => undefined}
  />;
}
