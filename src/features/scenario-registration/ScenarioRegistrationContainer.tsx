import { useMemo, useState } from 'react';
import { toAppChromeAccount } from '../../account/accountPresentation';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { createFetchScenarioApi, type ScenarioApi, type ScenarioApiError } from '../../app/scenarioApi';
import { useOptionalAppStore } from '../../app/store';
import { useAppNavigation } from '../../shared/nav';
import { ScenarioRegistrationPresentation } from './ScenarioRegistrationPresentation';
import type { ScenarioRegistrationActions } from './scenarioRegistrationModel';

export function ScenarioRegistrationContainer({ api }: { api?: ScenarioApi } = {}) {
  const store = useOptionalAppStore();
  const navigate = useAppNavigation();
  const accountSession = useAccountSession();
  const scenarioApi = useMemo(() => api ?? createFetchScenarioApi(), [api]);
  const [scenarioId, setScenarioId] = useState('未発行');
  const [saving, setSaving] = useState(false);
  const [aiWorking, setAiWorking] = useState(false);

  const saveDraft: ScenarioRegistrationActions['saveDraft'] = async (values) => {
    if (!values.title.trim()) {
      return {
        ok: false,
        message: 'タイトルを入力すると下書き保存できます。',
        fieldErrors: { title: ['シナリオタイトルを入力してください。'] },
      };
    }

    setSaving(true);
    try {
      const draft = await scenarioApi.createScenario(values);
      setScenarioId(draft.id);
      store?.dispatch({
        type: 'SCENARIO_SAVED',
        scenario: {
          id: draft.id,
          title: draft.title,
          status: 'draft',
          genre: draft.genre,
          updatedAt: draft.updatedAt,
          summary: draft.summary,
          tone: draft.tone,
          lore: draft.lore,
          aiFreedom: draft.aiFreedom,
          heroMode: draft.heroMode,
          heroFreeGenerationAllowed: draft.heroFreeGenerationAllowed,
          hero: draft.hero,
          opening: draft.opening,
          illustrationStyle: draft.illustrationStyle,
          illustrationMood: draft.illustrationMood,
          illustrationNegative: draft.illustrationNegative,
          sampleScene: draft.sampleScene,
        },
      });
      return {
        ok: true,
        message: `「${draft.title}」をDraftとして保存しました。ScenarioIdを発行しました。`,
        value: { scenarioId: draft.id },
      };
    } catch (caught) {
      const error = caught as ScenarioApiError;
      return {
        ok: false,
        message: error.errors?.title?.[0] ?? error.message ?? 'シナリオを保存できませんでした。',
        fieldErrors: error.errors,
      };
    } finally {
      setSaving(false);
    }
  };

  const assist: ScenarioRegistrationActions['assist'] = async (values, kind, target) => {
    setAiWorking(true);
    try {
      const response = await scenarioApi.assistScenario({ ...values, kind, target });
      return { ok: true, message: response.message, value: response };
    } catch (caught) {
      const error = caught as ScenarioApiError;
      return { ok: false, message: error.message ?? 'AI補助を実行できませんでした。' };
    } finally {
      setAiWorking(false);
    }
  };

  const logout = async () => {
    await accountSession.api.logout();
    accountSession.clearUser();
    navigate?.('login');
  };

  return <ScenarioRegistrationPresentation
    account={toAppChromeAccount(accountSession.user)}
    scenarioId={scenarioId}
    saving={saving}
    aiWorking={aiWorking}
    actions={{ saveDraft, assist }}
    onLogout={logout}
  />;
}
