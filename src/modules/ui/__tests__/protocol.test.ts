import { describe, expect, it } from 'vitest';
import { canDispatch, isModuleUiInbound } from '../protocol';
import type { ModuleExecution } from '../../api/moduleExecutionApi';

const execution: ModuleExecution = { id:'MEX-1',package:{moduleId:'x',version:'1',digest:'d',contractVersion:'1'},status:'active',revision:2,viewState:{},availableActions:[{id:'advance',label:'Advance',enabled:true},{id:'locked',label:'Locked',enabled:false}],uiEvents:[] };
const envelope=(overrides:Record<string,unknown>={})=>({protocol:'myriale.module-ui',version:1,type:'dispatch',executionId:'MEX-1',messageId:'m1',expectedRevision:2,action:{id:'advance'},...overrides});
describe('module UI protocol',()=>{
 it('accepts a current enabled action intent',()=>{const value=envelope();expect(isModuleUiInbound(value,'MEX-1')).toBe(true);expect(canDispatch(value as never,execution,false)).toBe(true)});
 it('rejects wrong protocol, execution, stale revisions, disabled actions, and busy hosts',()=>{
  expect(isModuleUiInbound(envelope({version:2}),'MEX-1')).toBe(false);
  expect(isModuleUiInbound(envelope(),'MEX-2')).toBe(false);
  expect(canDispatch(envelope({expectedRevision:1}) as never,execution,false)).toBe(false);
  expect(canDispatch(envelope({action:{id:'locked'}}) as never,execution,false)).toBe(false);
  expect(canDispatch(envelope() as never,execution,true)).toBe(false);
 });
});
