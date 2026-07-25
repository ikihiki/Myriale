import { useEffect, useState } from 'react';
import { moduleExecutionApi, type ModuleExecution, type ModuleRuntimeUiDescriptor } from '../../modules/api/moduleExecutionApi';
import { ModuleUiHost } from '../../modules/ui/ModuleUiHost';
import type { ScenarioTurnProjection } from './sessionPlayApi';

type ManualUiAction = NonNullable<ScenarioTurnProjection['manualUi']>;

export function ActiveModuleTurnPanel({ action, onExecution }: { action: ManualUiAction; onExecution(next: ModuleExecution): void }) {
  const { execution } = action;
  const [descriptor, setDescriptor] = useState<ModuleRuntimeUiDescriptor>();
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setDescriptor(undefined); setError('');
    void moduleExecutionApi.getRuntimeUi(execution.id, controller.signal)
      .then(setDescriptor)
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '判定画面を読み込めません。'); });
    return () => controller.abort();
  }, [execution.id]);

  return <section className="mx-auto mb-4 w-full max-w-myr-reading px-3 max-sm:px-0" aria-label="現在のモジュール判定" data-testid="active-module-turn">
    <div className="mb-3 rounded-2xl border border-myr-ink/15 bg-myr-paper/85 px-4 py-3">
      <strong>{action.actionLabel}</strong>
      <p className="m-0 mt-1 text-myr-ui-sm text-myr-ink-soft">この操作画面は、列挙済みの手動アクションに対してのみ表示されます。Object、Action、実行先は変更できません。</p>
    </div>
    {error && <div role="alert" className="rounded-2xl border border-myr-ruby/30 bg-myr-paper p-4 text-myr-ruby">{error}</div>}
    {!error && !descriptor && <div role="status" className="rounded-2xl border border-myr-ink/15 bg-myr-paper p-4">保存された判定状態を復元しています…</div>}
    {descriptor && <ModuleUiHost execution={execution} descriptor={descriptor} api={moduleExecutionApi} onExecution={onExecution} />}
  </section>;
}
