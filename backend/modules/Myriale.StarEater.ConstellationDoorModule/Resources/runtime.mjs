class ConstellationDoor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.state = null;
    this.addEventListener('myriale:state', event => {
      this.state = event.detail;
      this.render();
    });
  }

  connectedCallback() { this.render(); }

  render() {
    const snapshot = this.state;
    const view = snapshot?.viewState ?? {};
    const result = view.result;
    const action = snapshot?.availableActions?.find(item => item.id === 'roll' && item.enabled);
    this.shadowRoot.innerHTML = `
      <section class="door-check" aria-label="閉じた星座の扉の判定">
        <p class="eyebrow">FORCED MODE · DICE CHECK</p>
        <h2>${escapeHtml(view.purpose ?? '閉じた星座の扉')}</h2>
        <dl><div><dt>判定</dt><dd>${escapeHtml(view.diceExpression ?? '—')}</dd></div><div><dt>目標値</dt><dd>${view.target ?? '—'}</dd></div><div><dt>補正</dt><dd>${formatModifier(view.modifier)}</dd></div></dl>
        ${result ? resultMarkup(result) : `<button type="button" ${action ? '' : 'disabled'}>星図灯を掲げて判定する</button>`}
      </section>`;
    this.shadowRoot.querySelector('button')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('myriale:dispatch', {
        bubbles: true,
        composed: true,
        detail: { expectedRevision: snapshot.revision, action: { id: 'roll' } }
      }));
    });
  }
}

const resultMarkup = result => `<div class="result ${result.succeeded ? 'success' : 'failure'}" role="status"><strong>${result.succeeded ? '成功' : '失敗'}</strong><span>出目 ${result.dice.join(' + ')} ${formatModifier(result.modifier)} = ${result.total}</span></div>`;
const formatModifier = value => Number(value) >= 0 ? `+${Number(value ?? 0)}` : String(value);
const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
customElements.define('myriale-constellation-door', ConstellationDoor);
