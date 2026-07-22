import { useEffect, useState } from 'react';
import { moduleExecutionApi, type ModuleExecution, type ModuleRuntimeUiDescriptor } from '../../modules/api/moduleExecutionApi';
import { ModuleUiHost } from '../../modules/ui/ModuleUiHost';

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

  const feedbackClassName = 'mx-auto max-w-myr-focused rounded-myr-card border border-[#b9aa91] bg-[#f4efe5] p-8';
  return <main className="min-h-screen bg-[radial-gradient(circle_at_85%_10%,rgba(212,168,95,0.14),transparent_26%),#e8e1d4] p-[clamp(24px,5vw,68px)] text-[#17202a]">
    <div className="mx-auto mb-6 flex max-w-myr-focused items-end justify-between gap-8 max-myr-dialogue:flex-col max-myr-dialogue:items-start">
      <div><span className="font-mono text-myr-caption font-bold tracking-[0.18em] text-[#826631]">MODULE TURN / DETACHED PREVIEW</span><h1 className="mb-2.5 mt-2 font-myr-display text-[clamp(30px,5vw,58px)] font-bold leading-[0.98] tracking-[-0.045em]">確定処理の操作面</h1><p className="m-0 max-w-155 text-[#53606a]">この画面の選択はモジュールへ意図として送られ、結果はサーバー側で確定します。</p></div>
      {execution && <dl className="m-0 flex gap-4.5 border-l border-[#ad9d82] pl-5 max-myr-dialogue:w-full max-myr-dialogue:border-l-0 max-myr-dialogue:border-t max-myr-dialogue:pt-3.5 max-myr-dialogue:pl-0"><div className="grid gap-0.75"><dt className="font-mono text-myr-micro font-bold uppercase text-[#796c57]">Status</dt><dd className="m-0 font-mono text-base font-bold">{execution.status}</dd></div><div className="grid gap-0.75"><dt className="font-mono text-myr-micro font-bold uppercase text-[#796c57]">Revision</dt><dd className="m-0 font-mono text-base font-bold">{execution.revision}</dd></div></dl>}
    </div>
    {error && <section className={`${feedbackClassName} text-[#7b3329]`}><strong>モジュール実行を表示できません</strong><p>{error}</p></section>}
    {!error && (!execution || !descriptor) && <section className={feedbackClassName}>保存された実行状態を照合しています…</section>}
    {execution && descriptor && <ModuleUiHost className="mx-auto max-w-myr-focused" key={execution.id} execution={execution} descriptor={descriptor} api={moduleExecutionApi} onExecution={setExecution} />}
  </main>;
}
