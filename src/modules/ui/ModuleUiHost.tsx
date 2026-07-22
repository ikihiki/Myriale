import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui';
import type { ModuleExecution, ModuleExecutionApi, ModuleRuntimeUiDescriptor } from '../api/moduleExecutionApi';
import { canDispatch, isModuleUiInbound, MODULE_UI_PROTOCOL, MODULE_UI_VERSION } from './protocol';
import { createModuleFrameDocument } from './moduleFrameDocument';

type Props = { execution: ModuleExecution; descriptor: ModuleRuntimeUiDescriptor; api: ModuleExecutionApi; onExecution: (execution: ModuleExecution) => void; className?: string };
export function ModuleUiHost({ execution, descriptor, api, onExecution, className = '' }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const portRef = useRef<MessagePort>();
  const resourceAbortRef = useRef<AbortController>();
  const dispatchAbortRef = useRef<AbortController>();
  const generationRef = useRef(0);
  const loadedRef = useRef(false);
  const executionRef = useRef(execution);
  const busyRef = useRef(false);
  const [frameKey, setFrameKey] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [height, setHeight] = useState(320);
  const [error, setError] = useState('');
  executionRef.current = execution;
  const nonce = useMemo(() => crypto.randomUUID().replaceAll('-', ''), [frameKey, execution.id]);
  const capability = useMemo(() => crypto.randomUUID(), [frameKey, execution.id]);

  const closeConnection = useCallback(() => {
    generationRef.current += 1;
    resourceAbortRef.current?.abort();
    dispatchAbortRef.current?.abort();
    portRef.current?.close();
    portRef.current = undefined;
    busyRef.current = false;
  }, []);
  useEffect(() => () => closeConnection(), [closeConnection]);

  const sendState = useCallback((port: MessagePort, type: 'initialize' | 'transition', snapshot: ModuleExecution) => {
    port.postMessage({ protocol: MODULE_UI_PROTOCOL, version: MODULE_UI_VERSION, type, executionId: snapshot.id, payload: {
      locale: 'ja-JP', theme: { accent: '#d8a857', surface: '#101720' }, status: snapshot.status, revision: snapshot.revision,
      viewState: snapshot.viewState,
      availableActions: snapshot.availableActions,
      outcome: snapshot.outcome ? {
        category: snapshot.outcome.category,
        code: snapshot.outcome.code,
        title: snapshot.outcome.title,
        summary: snapshot.outcome.summary,
      } : null,
      error: snapshot.error ? { code: snapshot.error.code, message: snapshot.error.message } : null,
      uiEvents: type === 'transition' ? snapshot.uiEvents : [],
    } });
  }, []);

  const connect = useCallback(async () => {
    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;
    if (loadedRef.current) {
      closeConnection();
      setPhase('error');
      setError('モジュール画面が許可されていないページへ移動しました。');
      return;
    }
    loadedRef.current = true;
    closeConnection();
    const generation = generationRef.current;
    const controller = new AbortController();
    resourceAbortRef.current = controller;
    setPhase('loading'); setError('');
    try {
      const [script, ...styles] = await Promise.all([
        api.getResource(descriptor.script, controller.signal),
        ...descriptor.styles.map((resource) => api.getResource(resource, controller.signal)),
      ]);
      if (generation !== generationRef.current || controller.signal.aborted || !frame.contentWindow) return;
      const channel = new MessageChannel();
      portRef.current = channel.port1;
      channel.port1.onmessage = async ({ data }) => {
        if (generation !== generationRef.current || !isModuleUiInbound(data, execution.id)) return;
        if (data.type === 'resize') { setHeight(Math.max(180, Math.min(900, data.height))); return; }
        if (data.type === 'bootstrap-error') { setPhase('error'); setError('モジュールのJavaScriptを開始できませんでした。'); channel.port1.close(); return; }
        if (data.type === 'ready') { setPhase('ready'); sendState(channel.port1, 'initialize', executionRef.current); return; }
        if (!canDispatch(data, executionRef.current, busyRef.current)) return;
        busyRef.current = true;
        const dispatchController = new AbortController();
        dispatchAbortRef.current = dispatchController;
        channel.port1.postMessage({ protocol: MODULE_UI_PROTOCOL, version: MODULE_UI_VERSION, type: 'submitting', executionId: execution.id, payload: { submitting: true } });
        try {
          const next = await api.dispatch(execution.id, { requestId: crypto.randomUUID(), expectedRevision: data.expectedRevision, action: data.action }, dispatchController.signal);
          if (generation !== generationRef.current) return;
          executionRef.current = { ...next, uiEvents: [] };
          onExecution(executionRef.current);
          sendState(channel.port1, 'transition', next);
        } catch (cause) {
          if (generation !== generationRef.current || dispatchController.signal.aborted) return;
          const apiError = cause as Error & { execution?: ModuleExecution; code?: string };
          if (apiError.execution) {
            executionRef.current = { ...apiError.execution, uiEvents: [] };
            onExecution(executionRef.current);
            sendState(channel.port1, 'transition', apiError.execution);
          }
          channel.port1.postMessage({ protocol: MODULE_UI_PROTOCOL, version: MODULE_UI_VERSION, type: 'error', executionId: execution.id, payload: { code: apiError.code ?? 'dispatch_failed', message: apiError.message } });
        } finally {
          if (generation === generationRef.current) {
            busyRef.current = false;
            channel.port1.postMessage({ protocol: MODULE_UI_PROTOCOL, version: MODULE_UI_VERSION, type: 'submitting', executionId: execution.id, payload: { submitting: false } });
          }
        }
      };
      channel.port1.start();
      frame.contentWindow.postMessage({ type: 'myriale:connect', executionId: execution.id, capability }, '*', [channel.port2]);
      channel.port1.postMessage({ protocol: MODULE_UI_PROTOCOL, version: MODULE_UI_VERSION, type: 'load-resources', executionId: execution.id, script, styles, elementName: descriptor.elementName });
    } catch (cause) {
      if (generation !== generationRef.current || controller.signal.aborted) return;
      setPhase('error'); setError(cause instanceof Error ? cause.message : 'Module UI could not be loaded.');
    }
  }, [api, capability, closeConnection, descriptor, execution.id, onExecution, sendState]);

  const reload = () => {
    closeConnection();
    loadedRef.current = false;
    setFrameKey((value) => value + 1);
  };
  const overlayClassName = 'absolute inset-x-0 bottom-0 top-22 grid place-content-center gap-2.5 bg-[rgba(16,23,32,0.91)] text-center text-[#c4d0d6]';
  return <section className={`relative overflow-hidden rounded-myr-card border border-[#53687a] bg-[#101720] text-[#edf4f4] shadow-[0_24px_70px_rgba(24,35,50,0.2)] ${className}`} data-phase={phase}>
    <header className="flex items-center justify-between border-b border-[#415263] bg-[linear-gradient(100deg,#162331,#101720)] px-5 py-4"><div className="grid gap-0.5"><span className="font-mono text-myr-micro font-semibold uppercase leading-[1.2] tracking-[0.16em] text-[#9fb1bd]">Isolated module surface</span><strong className="text-myr-control">{descriptor.package.moduleId}</strong></div><span className="rounded-full border border-[#7c6947] px-2.25 py-1.25 font-mono text-myr-caption font-bold text-[#e3bd75]">REV {execution.revision.toString().padStart(2, '0')}</span></header>
    <div className="flex items-center gap-2 bg-[#d6b26c] px-5 py-2 font-mono text-myr-micro font-bold uppercase tracking-[0.06em] text-[#17202a]"><span aria-hidden="true">◇</span> sandbox · verified package · direct fetch blocked</div>
    <iframe className="block min-h-myr-module-preview-min w-full border-0 bg-[#101720] transition-[height] duration-200 ease-[ease] motion-reduce:transition-none" key={frameKey} ref={iframeRef} title="Module runtime" sandbox="allow-scripts" srcDoc={createModuleFrameDocument(execution.id, window.location.origin, nonce, capability)} onLoad={() => void connect()} style={{ height }} />
    {phase === 'loading' && <div className={overlayClassName}>モジュール画面を封入しています…</div>}
    {phase === 'error' && <div className={`${overlayClassName} text-[#f4d6ca]`}><strong>モジュール画面を開けません</strong><span>{error}</span><Button variant="ghost" surface="dark" size="sm" className="justify-self-center" type="button" onClick={reload}>再読込</Button></div>}
  </section>;
}
