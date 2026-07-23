class TurnBattle extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this.state=null;this.addEventListener('myriale:state',e=>{this.state=e.detail;this.render();});}
  connectedCallback(){this.render();}
  render(){const s=this.state,v=s?.viewState??{},actions=s?.availableActions??[];this.shadowRoot.innerHTML=`<section aria-label="ターン制戦闘"><p class="eyebrow">FORCED MODE · TURN BATTLE</p><header><div><small>${esc(v.playerName??'PLAYER')}</small><strong>${v.playerHp??'—'} / ${v.playerMaxHp??'—'} HP</strong></div><b>ROUND ${v.round??1}</b><div><small>${esc(v.enemyName??'ENEMY')}</small><strong>${v.enemyHp??'—'} / ${v.enemyMaxHp??'—'} HP</strong></div></header>${v.lastAction?`<p class="log">${label(v.lastAction)}：与ダメージ ${v.lastPlayerDamage} / 被ダメージ ${v.lastEnemyDamage}</p>`:''}<div class="actions">${actions.map(a=>`<button data-id="${a.id}" ${a.enabled?'':'disabled'}>${a.id==='skill'?`${esc(v.skillName)} (${v.skillUsesRemaining})`:esc(a.label)}</button>`).join('')}</div>${v.status&&v.status!=='active'?`<p class="result" role="status">${esc(v.status)}</p>`:''}</section>`;this.shadowRoot.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>this.dispatchEvent(new CustomEvent('myriale:dispatch',{bubbles:true,composed:true,detail:{expectedRevision:s.revision,action:{id:b.dataset.id}}}))));}
}
const label=v=>({attack:'攻撃',defend:'防御',skill:'スキル',flee:'逃走'}[v]??v);
const esc=v=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
customElements.define('myriale-turn-battle',TurnBattle);
