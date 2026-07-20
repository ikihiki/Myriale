import { useEffect, useState } from 'react';
import { moduleExecutionApi, type ModuleExecution, type ModuleRuntimeUiDescriptor } from '../../modules/api/moduleExecutionApi';
import { ModuleUiHost } from '../../modules/ui/ModuleUiHost';
import './moduleExecutionPage.css';

export function ModuleExecutionPage({ executionId }: { executionId: string }) {
  const [execution, setExecution] = useState<ModuleExecution>();
  const [descriptor, setDescriptor] = useState<ModuleRuntimeUiDescriptor>();
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setExecution(undefined);
    setDescriptor(undefined);
    setError('');
    Promise.all([moduleExecutionApi.getExecution(executionId, controller.signal), moduleExecutionApi.getRuntimeUi(executionId, controller.signal)])
      .then(([nextExecution, nextDescriptor]) => {
        if (!current || controller.signal.aborted || nextExecution.id !== executionId || nextDescriptor.executionId !== executionId) return;
        setExecution(nextExecution); setDescriptor(nextDescriptor);
      })
      .catch((cause) => {
        if (!current || controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : 'モジュール実行を開けません。');
      });
    return () => { current = false; controller.abort(); };
  }, [executionId]);

  return <main className="module-execution-page">
    <div className="module-execution-heading">
      <div><span>MODULE TURN / DETACHED PREVIEW</span><h1>確定処理の操作面</h1><p>この画面の選択はモジュールへ意図として送られ、結果はサーバー側で確定します。</p></div>
      {execution && <dl><div><dt>Status</dt><dd>{execution.status}</dd></div><div><dt>Revision</dt><dd>{execution.revision}</dd></div></dl>}
    </div>
    {error && <section className="module-execution-error"><strong>モジュール実行を表示できません</strong><p>{error}</p></section>}
    {!error && (!execution || !descriptor) && <section className="module-execution-loading">保存された実行状態を照合しています…</section>}
    {execution && descriptor && <ModuleUiHost key={execution.id} execution={execution} descriptor={descriptor} api={moduleExecutionApi} onExecution={setExecution} />}
  </main>;
}
