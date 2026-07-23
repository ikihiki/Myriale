import type { ModuleAvailableAction, ModuleExecution } from '../api/moduleExecutionApi';

export const MODULE_UI_PROTOCOL = 'myriale.module-ui' as const;
export const MODULE_UI_VERSION = 1 as const;
export type ModuleUiDispatch = { type: 'dispatch'; messageId: string; executionId: string; expectedRevision: number; action: { id: string; payload?: unknown }; randomValueCount?: number };
export type ModuleUiResize = { type: 'resize'; executionId: string; height: number };
export type ModuleUiReady = { type: 'ready'; executionId: string };
export type ModuleUiBootstrapError = { type: 'bootstrap-error'; executionId: string; message: string };
export type ModuleUiInbound = ModuleUiDispatch | ModuleUiResize | ModuleUiReady | ModuleUiBootstrapError;

export function isModuleUiInbound(value: unknown, executionId: string): value is ModuleUiInbound {
  if (!value || typeof value !== 'object') return false;
  try { if (JSON.stringify(value).length > 16_384) return false; } catch { return false; }
  const message = value as Record<string, unknown>;
  if (message.protocol !== MODULE_UI_PROTOCOL || message.version !== MODULE_UI_VERSION || message.executionId !== executionId) return false;
  if (message.type === 'ready') return true;
  if (message.type === 'bootstrap-error') return typeof message.message === 'string' && message.message.length <= 1_000;
  if (message.type === 'resize') return typeof message.height === 'number' && Number.isFinite(message.height);
  if (message.type !== 'dispatch' || typeof message.messageId !== 'string' || typeof message.expectedRevision !== 'number') return false;
  if (message.randomValueCount !== undefined && (!Number.isInteger(message.randomValueCount) || (message.randomValueCount as number) < 0 || (message.randomValueCount as number) > 64)) return false;
  if (!message.action || typeof message.action !== 'object') return false;
  return typeof (message.action as Record<string, unknown>).id === 'string';
}

export function canDispatch(message: ModuleUiDispatch, execution: ModuleExecution, busy: boolean) {
  if (busy || execution.status !== 'active' || message.expectedRevision !== execution.revision) return false;
  return execution.availableActions.some((action: ModuleAvailableAction) => action.id === message.action.id && action.enabled);
}
