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
    queryKey: ['scenarios', 'editor', scenarioId],
    queryFn: async ({ signal }) => {
      const [scenario, ruleData] = await Promise.all([
        scenarioApi.getScenario(scenarioId, signal),
        scenarioApi.createScenarioRuleDataDraft(scenarioId, signal),
      ]);
      return { scenario, ruleData };
    },
    staleTime: 30_000,
  });

  const save: ScenarioFormActions['save'] = async (values) => {
    if (!values.title.trim()) {
      return { ok: false, message: 'タイトルを入力してください。', fieldErrors: { title: ['シナリオタイトルを入力してください。'] } };
    }
    setSaving(true);
    try {
      const [scenarioResult, ruleDataResult] = await Promise.allSettled([
        scenarioApi.updateScenario(scenarioId, values),
        scenarioApi.putScenarioRuleData(scenarioId, values.ruleData),
      ]);

      if (scenarioResult.status === 'fulfilled') {
        queryClient.setQueryData(['scenarios', 'detail', scenarioId], scenarioResult.value);
        store?.dispatch({
          type: 'SCENARIO_SAVED',
          scenario: {
            ...scenarioResult.value,
            status: scenarioResult.value.status === 'published' || scenarioResult.value.status === 'private' ? scenarioResult.value.status : 'draft',
          },
        });
        await queryClient.invalidateQueries({ queryKey: ['scenarios', 'list'] });
      }

      if (scenarioResult.status === 'fulfilled' && ruleDataResult.status === 'fulfilled') {
        queryClient.setQueryData(['scenarios', 'editor', scenarioId], {
          scenario: scenarioResult.value,
          ruleData: ruleDataResult.value,
        });
        return { ok: true, message: `「${scenarioResult.value.title}」の基本情報とObject Typeを保存しました。`, value: { scenarioId: scenarioResult.value.id } };
      }

      const scenarioError = scenarioResult.status === 'rejected' ? scenarioResult.reason as ScenarioApiError : null;
      const ruleDataError = ruleDataResult.status === 'rejected' ? ruleDataResult.reason as ScenarioApiError : null;
      if (scenarioResult.status === 'fulfilled') {
        return { ok: false, message: `基本情報は保存されましたが、Object Typeを保存できませんでした。再読み込み前に内容を控え、もう一度保存してください。${ruleDataError?.message ? ` (${ruleDataError.message})` : ''}` };
      }
      if (ruleDataResult.status === 'fulfilled') {
        return { ok: false, message: `Object Typeは保存されましたが、基本情報を保存できませんでした。もう一度保存してください。${scenarioError?.message ? ` (${scenarioError.message})` : ''}`, fieldErrors: scenarioError?.errors };
      }
      return {
        ok: false,
        message: scenarioError?.errors?.title?.[0] ?? scenarioError?.message ?? ruleDataError?.message ?? '基本情報とObject Typeを保存できませんでした。',
        fieldErrors: scenarioError?.errors ?? ruleDataError?.errors,
      };
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

  const debug: ScenarioFormActions['debug'] = async (_values, request) => {
    try {
      const response = await scenarioApi.debugScenarioRuleData(scenarioId, request);
      return { ok: true, message: '隔離されたルールエンジンで実行しました。本番データは変更されていません。', value: response };
    } catch (caught) {
      const error = caught as ScenarioApiError;
      return { ok: false, message: error.errors?.debug?.[0] ?? error.message ?? 'デバッグ実行に失敗しました。' };
    }
  };

  const checkReadiness: NonNullable<ScenarioFormActions['checkReadiness']> = async () => {
    try {
      const readiness = await scenarioApi.getScenarioRuleDataReadiness(scenarioId);
      const issueCount = Object.values(readiness.errors).reduce((count, messages) => count + messages.length, 0);
      return readiness.ready
        ? { ok: true, message: '公開準備が完了しています。シナリオを公開できます。', value: readiness }
        : { ok: true, message: `公開前に${issueCount}件の問題を修正してください。`, value: readiness };
    } catch (caught) {
      const error = caught as ScenarioApiError;
      return { ok: false, message: error.message ?? '公開準備を確認できませんでした。', fieldErrors: error.errors };
    }
  };

  const publish: NonNullable<ScenarioFormActions['publish']> = async () => {
    try {
      const publishedRuleData = await scenarioApi.publishScenarioRuleData(scenarioId);
      queryClient.setQueryData<{ scenario: Awaited<ReturnType<ScenarioApi['getScenario']>>; ruleData: typeof publishedRuleData }>(
        ['scenarios', 'editor', scenarioId],
        (current) => current ? { ...current, ruleData: publishedRuleData } : current,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['scenarios', 'detail', scenarioId] }),
        queryClient.invalidateQueries({ queryKey: ['scenarios', 'list'] }),
      ]);
      return { ok: true, message: 'シナリオを公開しました。公開版として利用できます。' };
    } catch (caught) {
      const error = caught as ScenarioApiError;
      return {
        ok: false,
        message: error.errors?.publish?.[0] ?? error.message ?? 'シナリオを公開できませんでした。',
        fieldErrors: error.errors,
      };
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
    initialValues={scenarioQuery.data ? scenarioDraftToFormValues(scenarioQuery.data.scenario, scenarioQuery.data.ruleData) : null}
    status={scenarioQuery.isPending ? 'loading' : scenarioQuery.isError ? 'error' : 'ready'}
    loadError={scenarioQuery.error instanceof Error ? scenarioQuery.error.message : undefined}
    saving={saving}
    aiWorking={aiWorking}
    actions={{ save, assist, debug, checkReadiness, publish }}
    onRetry={() => void scenarioQuery.refetch()}
    onLogout={logout}
  />;
}
