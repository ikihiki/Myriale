import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toAppChromeAccount } from '../../account/accountPresentation';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { createFetchScenarioApi, type ScenarioApi, type ScenarioApiError } from '../../app/scenarioApi';
import { useOptionalAppStore } from '../../app/store';
import { useAppNavigation } from '../../shared/nav';
import { scenarioDraftToFormValues, type ScenarioFormActions } from '../scenario/@components/scenarioFormModel';
import { EditScenarioPresentation } from './EditScenarioPresentation';

export function EditScenarioContainer({ scenarioId, api }: { scenarioId: string; api?: ScenarioApi }) {
  const store = useOptionalAppStore();
  const navigate = useAppNavigation();
  const accountSession = useAccountSession();
  const queryClient = useQueryClient();
  const scenarioApi = useMemo(() => api ?? createFetchScenarioApi(), [api]);
  const [saving, setSaving] = useState(false);
  const [aiWorking, setAiWorking] = useState(false);
  const scenarioQuery = useQuery({
    queryKey: ['scenarios', 'detail', scenarioId],
    queryFn: ({ signal }) => scenarioApi.getScenario(scenarioId, signal),
    staleTime: 30_000,
  });

  const save: ScenarioFormActions['save'] = async (values) => {
    if (!values.title.trim()) {
      return { ok: false, message: 'タイトルを入力してください。', fieldErrors: { title: ['シナリオタイトルを入力してください。'] } };
    }
    setSaving(true);
    try {
      const updated = await scenarioApi.updateScenario(scenarioId, values);
      queryClient.setQueryData(['scenarios', 'detail', scenarioId], updated);
      await queryClient.invalidateQueries({ queryKey: ['scenarios', 'list'] });
      store?.dispatch({
        type: 'SCENARIO_SAVED',
        scenario: {
          ...updated,
          status: updated.status === 'published' || updated.status === 'private' ? updated.status : 'draft',
        },
      });
      return { ok: true, message: `「${updated.title}」の変更を保存しました。`, value: { scenarioId: updated.id } };
    } catch (caught) {
      const error = caught as ScenarioApiError;
      return { ok: false, message: error.errors?.title?.[0] ?? error.message ?? 'シナリオを更新できませんでした。', fieldErrors: error.errors };
    } finally {
      setSaving(false);
    }
  };

  const assist: ScenarioFormActions['assist'] = async (values, kind, target) => {
    setAiWorking(true);
    try {
      const response = await scenarioApi.assistScenario({ ...values, kind, target });
      return { ok: true, message: response.message, value: response };
    } catch (caught) {
      return { ok: false, message: caught instanceof Error ? caught.message : 'AI補助を実行できませんでした。' };
    } finally {
      setAiWorking(false);
    }
  };

  const logout = async () => {
    await accountSession.api.logout();
    accountSession.clearUser();
    navigate?.('login');
  };

  return <EditScenarioPresentation
    account={toAppChromeAccount(accountSession.user)}
    scenarioId={scenarioId}
    initialValues={scenarioQuery.data ? scenarioDraftToFormValues(scenarioQuery.data) : null}
    status={scenarioQuery.isPending ? 'loading' : scenarioQuery.isError ? 'error' : 'ready'}
    loadError={scenarioQuery.error instanceof Error ? scenarioQuery.error.message : undefined}
    saving={saving}
    aiWorking={aiWorking}
    actions={{ save, assist }}
    onRetry={() => void scenarioQuery.refetch()}
    onLogout={logout}
  />;
}
