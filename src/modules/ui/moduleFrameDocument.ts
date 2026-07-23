export function createModuleFrameDocument(executionId: string, parentOrigin: string, nonce: string, capability: string) {
  const bootstrap = String.raw`
(()=>{
const protocol='myriale.module-ui',version=1,executionId=${JSON.stringify(executionId)},expectedOrigin=${JSON.stringify(parentOrigin)},capability=${JSON.stringify(capability)};
let port,element;
const blockNavigation=event=>event.preventDefault();
globalThis.navigation?.addEventListener('navigate',blockNavigation);
document.addEventListener('click',event=>{if(event.target?.closest?.('a[href]'))event.preventDefault()},true);
document.addEventListener('submit',event=>event.preventDefault(),true);
const send=(type,payload={})=>port?.postMessage({protocol,version,type,executionId,...payload});
const resize=()=>send('resize',{height:Math.ceil(document.documentElement.scrollHeight)});
const acceptConnection=async event=>{
 if(event.source!==parent||event.origin!==expectedOrigin||event.data?.type!=='myriale:connect'||event.data?.executionId!==executionId||event.data?.capability!==capability||!event.ports[0])return;
 removeEventListener('message',acceptConnection);
 port=event.ports[0];port.onmessage=async ({data})=>{
  if(data?.protocol!==protocol||data?.version!==version||data?.executionId!==executionId)return;
  if(data.type==='load-resources'){
   for(const css of data.styles){const style=document.createElement('style');style.nonce=${JSON.stringify(nonce)};style.textContent=css;document.head.append(style);}
   const url=URL.createObjectURL(new Blob([data.script],{type:'text/javascript'}));
   try{await import(url);const constructor=customElements.get(data.elementName);if(typeof constructor!=='function')throw new Error('Declared custom element was not registered.');element=document.createElement(data.elementName);if(!(element instanceof constructor))throw new Error('Declared custom element could not be constructed.');element.addEventListener('myriale:dispatch',event=>send('dispatch',{messageId:crypto.randomUUID(),expectedRevision:event.detail?.expectedRevision,action:event.detail?.action,randomValueCount:event.detail?.randomValueCount}));document.body.append(element);send('ready');resize();new ResizeObserver(resize).observe(document.body);}catch(error){send('bootstrap-error',{message:String(error).slice(0,1000)});}finally{URL.revokeObjectURL(url);}
  }
  if((data.type==='initialize'||data.type==='transition')&&element){element.dispatchEvent(new CustomEvent('myriale:state',{detail:data.payload}));resize();}
  if(data.type==='submitting'&&element)element.toggleAttribute('data-submitting',Boolean(data.payload?.submitting));
  if(data.type==='error'&&element)element.dispatchEvent(new CustomEvent('myriale:error',{detail:data.payload}));
 };port.start();
};addEventListener('message',acceptConnection);
})();`;
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' blob:; style-src 'nonce-${nonce}'; img-src data: blob:; font-src data:; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'; navigate-to 'none'"><style nonce="${nonce}">html{color-scheme:dark}body{margin:0;min-height:120px;background:#101720;color:#edf4f4;font:14px/1.5 system-ui,sans-serif}</style></head><body><script nonce="${nonce}">${bootstrap}<\/script></body></html>`;
}
