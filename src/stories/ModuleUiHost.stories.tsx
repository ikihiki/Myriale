import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { ModuleUiHost } from '../modules/ui/ModuleUiHost';
import type { ModuleExecution, ModuleExecutionApi, ModuleRuntimeUiDescriptor } from '../modules/api/moduleExecutionApi';
import '../styles.css';

const script = `
customElements.define('myriale-test-counter', class extends HTMLElement {
 constructor(){super();this.attachShadow({mode:'open'});this.state={revision:0,viewState:{count:0},availableActions:[]};this.addEventListener('myriale:state',e=>{this.state=e.detail;this.render()})}
 connectedCallback(){this.render()}
 render(){const action=this.state.availableActions?.[0];this.shadowRoot.innerHTML='<style>:host{display:block;padding:34px}main{display:grid;justify-items:center;gap:16px}small{color:#c7a35e;letter-spacing:.2em}strong{font:700 72px Georgia;color:#f0efe9}button{border:1px solid #c7a35e;border-radius:999px;background:#c7a35e;color:#101720;padding:10px 24px;font-weight:800;cursor:pointer}</style><main><small>SEALED COUNTER</small><strong>'+this.state.viewState.count+'</strong><button '+(!action?.enabled?'disabled':'')+'>Advance</button></main>';this.shadowRoot.querySelector('button').onclick=()=>this.dispatchEvent(new CustomEvent('myriale:dispatch',{detail:{expectedRevision:this.state.revision,action:{id:'advance'}},bubbles:true}))}
});`;
const css = `:host{display:block;padding:34px}main{display:grid;justify-items:center;gap:16px}small{color:#c7a35e;letter-spacing:.2em}strong{font:700 72px Georgia;color:#f0efe9}button{border:1px solid #c7a35e;border-radius:999px;background:#c7a35e;color:#101720;padding:10px 24px;font-weight:800;cursor:pointer}`;
const initial: ModuleExecution = { id:'MEX-STORY',package:{moduleId:'com.myriale.counter',version:'1.0.0',digest:'a'.repeat(64),contractVersion:'1'},status:'active',revision:0,viewState:{count:0},availableActions:[{id:'advance',label:'Advance',enabled:true}],uiEvents:[] };
const descriptor: ModuleRuntimeUiDescriptor = { protocol:'myriale.module-ui',protocolVersion:1,executionId:initial.id,package:{moduleId:initial.package.moduleId,version:'1.0.0',digest:'a'.repeat(64)},elementName:'myriale-test-counter',script:{id:'script',url:'memory:script',contentType:'text/javascript',sha256:'',byteLength:script.length},styles:[{id:'style-0',url:'memory:style',contentType:'text/css',sha256:'',byteLength:css.length}] };
const api: ModuleExecutionApi = { getExecution:async()=>initial,getRuntimeUi:async()=>descriptor,getResource:async(resource)=>resource.id==='script'?script:css,async dispatch(_id,body){return {...initial,revision:body.expectedRevision+1,viewState:{count:body.expectedRevision+1}}} };
function Story(){const [execution,setExecution]=useState(initial);return <div style={{padding:28,maxWidth:900,margin:'auto'}}><ModuleUiHost execution={execution} descriptor={descriptor} api={api} onExecution={setExecution}/><output data-testid="revision">{execution.revision}</output></div>}
const meta={title:'モジュール/Runtime UI Host',component:Story,parameters:{layout:'fullscreen'}} satisfies Meta<typeof Story>;
export default meta;
export const Counter:StoryObj<typeof Story>={play:async({canvasElement})=>{const canvas=within(canvasElement);await expect(await canvas.findByTitle('Module runtime')).toHaveAttribute('sandbox','allow-scripts');}};
