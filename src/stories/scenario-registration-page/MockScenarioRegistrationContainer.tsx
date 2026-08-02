import { useState } from 'react';
import { useOptionalAppStore } from '../../app/store';
import { ScenarioRegistrationPresentation } from '../../features/scenario-registration/ScenarioRegistrationPresentation';
import type { ScenarioRegistrationActions } from '../../features/scenario-registration/scenarioRegistrationModel';

import { emptyScenarioFormValues } from '../../features/scenario/@components/scenarioFormModel';
import { completeDoorRuleDataFixture, westDoorAuthoringFixture } from './scenarioRegistrationFixtures';

const demoAccount = {
  name: '霧野しおり',
  email: 'author@myriale.example',
  initials: '霧野',
  role: '作者',
};

function MockScenarioRegistrationContainerBase({ ruleData }: { ruleData?: typeof completeDoorRuleDataFixture }) {
  const store = useOptionalAppStore();
  const [scenarioId, setScenarioId] = useState(ruleData ? 'SCN-DRAFT-0427' : '未発行');

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
        tone: '',
        lore: '',
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
        suggestions: [{ id: 'summary-1', body: '## 物語の目的\n\n地下に沈んだ王都で、禁書を読むたびに書き換わる星座の謎を追います。\n\n- 水没した書庫を探索する\n- 失われる記憶の代償を選ぶ', rationale: 'タイトル、ジャンル、基本情報からMarkdown案を生成しました。' }],
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

  const debug: ScenarioRegistrationActions['debug'] = async (_values, request) => {
    const selectedObject = ruleData?.objects.find((object) => object.code === request.objectCode) ?? ruleData?.objects[0];
    const selectedLocation = ruleData?.locations.find((location) => location.code === request.currentLocationCode) ?? ruleData?.locations[0];
    const selectedAction = selectedObject
      ? [...selectedObject.actions, ...selectedObject.mixinTypeCodes.flatMap((code) => ruleData?.objectTypes.find((type) => type.code === code)?.actions ?? [])]
        .find((action) => action.code === request.actionCode)
      : undefined;
    const beforeState = request.objects.find((state) => state.objectCode === selectedObject?.code)?.state ?? {};
    const postState = request.trigger === 'enumerate' ? null : { ...beforeState, open: true };
    return {
      ok: true,
      message: '隔離されたルールエンジンで実行しました。本番データは変更されていません。',
      value: {
        snapshot: {
          schemaVersion: 'rule-action-snapshot.v1', snapshotId: 'DEBUG-STORY',
          currentLocation: { id: selectedLocation?.code ?? '', code: selectedLocation?.code ?? '', name: selectedLocation?.name ?? '', description: selectedLocation?.description ?? '' },
          objects: selectedObject ? [{ id: selectedObject.code, code: selectedObject.code, name: selectedObject.name, locationId: request.objects.find((state) => state.objectCode === selectedObject.code)?.locationCode ?? selectedObject.initialLocationCode, isGlobal: selectedObject.global, revision: 0, state: beforeState }] : [],
          actions: selectedObject && selectedAction ? [{ objectId: selectedObject.code, actionId: selectedAction.code, code: selectedAction.code, label: selectedAction.label, description: selectedAction.description, argumentSchema: {}, enabled: true }] : [],
        },
        decision: request.trigger === 'enumerate' || !selectedObject || !selectedAction ? null : { schemaVersion: 'rule-action-decision.v1', objectId: selectedObject.code, actionId: selectedAction.code, arguments: request.arguments },
        selectedRuleCode: request.trigger === 'enumerate' ? null : 'open-door-when-closed',
        appliedEffects: request.trigger === 'enumerate' ? [] : [{ type: 'set-state', targetId: selectedObject?.code, path: 'state.open', value: true }],
        postState: postState && selectedObject && selectedLocation ? { schemaVersion: 'rule-post-state.v1', currentLocation: { id: selectedLocation.code, code: selectedLocation.code, name: selectedLocation.name, description: selectedLocation.description }, objects: [{ id: selectedObject.code, code: selectedObject.code, name: selectedObject.name, locationId: selectedObject.initialLocationCode, isGlobal: selectedObject.global, revision: 1, state: postState }], sessionFlags: request.flags, sessionStateRevision: 1 } : null,
        facts: request.trigger === 'enumerate' ? [] : ['西扉が開いた。'], events: [], hints: request.playerInput ? ['入力から「扉を開ける」が選択されました。'] : [], forbiddenFacts: [],
      },
    };
  };

  return <ScenarioRegistrationPresentation
    account={demoAccount}
    scenarioId={scenarioId}
    initialValues={ruleData ? { ...emptyScenarioFormValues, title: '星喰いの地下図書館', ruleData: structuredClone(ruleData) } : undefined}
    saving={false}
    aiWorking={false}
    actions={{ saveDraft, assist, debug }}
    onLogout={() => undefined}
  />;
}

export function MockScenarioRegistrationContainer() {
  return <MockScenarioRegistrationContainerBase />;
}

export function MockScenarioRegistrationWithRuleDataContainer() {
  return <MockScenarioRegistrationContainerBase ruleData={completeDoorRuleDataFixture} />;
}

export function MockWestDoorAuthoringContainer() {
  return <MockScenarioRegistrationContainerBase ruleData={westDoorAuthoringFixture} />;
}
