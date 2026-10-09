/*!
 * <jf-badge> — the JFKG sticky-note sign for Jan Faris projects.
 * Drop into any page:
 *   <script src="https://www.janfaris.com/badge.js" defer></script>
 *   <jf-badge></jf-badge>
 * Attributes (all optional):
 *   label   text beside the note        (default "janfaris.com"; label="" hides it)
 *   size    note height in px           (default 72)
 *   corner  pin to "bottom-right" | "bottom-left" | "top-right" | "top-left"
 *   ink     glyph color                 (default #1d47c4)
 *   paper   note color                  (default #b6cff1)
 * The label inherits the host page's text color, so it works on light and dark pages.
 */
(() => {
  if (customElements.get('jf-badge')) return
  const SITE = 'https://www.janfaris.com/'
  const GLYPHS = 'M0 53.9L0 53.9Q0 51.2 0.6 50.1Q1.1 49 2.5 49Q4.0 49 6.4 51.8Q8.8 54.6 11.8 57.4Q14.9 60.2 17.9 60.2L17.9 60.2Q20.2 60.2 22.5 53.8Q24.8 47.4 27.4 37.4Q30 27.3 30.7 23.9L30.7 23.9Q32.3 16 33.0 14.3L33.0 14.3Q30.3 14.9 24.1 15.8Q17.8 16.6 15.7 16.6Q13.6 16.6 12.3 15.3Q11 14 11 12.2L11 12.2Q11 8.6 18.7 5.7Q26.3 2.8 34.0 1.6Q41.6 0.5 44.5 0.5L44.5 0.5Q50.1 0.5 50.1 4.1L50.1 4.1Q50.1 5.6 46.5 16.6Q42.9 27.6 42.1 31L42.1 31Q36.7 53.9 34.0 60.6L34.0 60.6Q29.8 71.1 23.2 72.8L23.2 72.8Q21.6 73.2 20 73.2L20 73.2Q12.9 73.2 6.5 66.3Q0 59.5 0 53.9ZM61.9 6.2Q63.0 2.9 68.3 2Q73.6 1.1 84.4 1.1Q95.1 1.1 100.8 2.8Q106.5 4.6 106.5 7.8L106.5 7.8Q106.5 9.3 105.4 10.0Q104.2 10.6 103.4 10.9Q102.5 11.3 101.1 11.6Q99.6 11.9 98.4 12.1Q97.2 12.4 95.3 12.6Q93.3 12.8 91.9 12.9Q90.5 13.1 88.2 13.3Q85.9 13.6 84 13.8Q82.1 14 74 15.3L74 15.3L74 15.4Q74 19 70.9 34.5L70.9 34.5Q72.2 34.6 75.7 34.6Q79.1 34.6 84.7 34.0Q90.3 33.5 92.1 33.5Q93.8 33.5 95 34.4Q96.2 35.3 96.2 36.4L96.2 36.4Q96.2 39.1 93 41.2Q89.8 43.3 85 44.5L85 44.5Q75.4 46.9 68.1 47.1L68.1 47.1Q65.1 59.8 64.5 62.6Q63.8 65.5 63.1 68.1L63.1 68.1Q61.8 73.2 60.7 73.2L60.7 73.2Q58.6 73.2 55.0 68.5Q51.4 63.8 51.4 61.5L51.4 61.5Q51.4 57.5 56.4 36.1Q61.3 14.7 61.6 9.2L61.6 9.2L61.6 8.4Q61.6 7.1 61.9 6.2L61.9 6.2ZM113.4 73.2L113.4 73.2L113.2 73.2Q111 73.2 107.7 69.2Q104.4 65.1 104.4 62.0Q104.4 59 110.3 34.7Q116.1 10.4 116.1 4L116.1 4Q116.1 0 119 0L119 0Q121.4 0 124.8 4.8Q128.2 9.5 128.2 13.8L128.2 13.8Q128.2 16.4 125.6 27.1L125.6 27.1Q133.8 16.2 141 8.8Q148.2 1.5 150.8 1.5Q153.5 1.5 156.2 3.8Q158.9 6 158.9 7.6Q158.9 9.3 153.8 14.1Q148.7 18.9 141.2 26.3Q133.7 33.7 129.6 40.1L129.6 40.1Q129.6 47.8 138.5 55.6L138.5 55.6Q141.2 57.9 145.7 60.4Q150.2 62.8 152.8 64.5Q155.3 66.3 155.3 68.1L155.3 68.1Q155.3 73.2 148.1 73.2Q140.9 73.2 132.6 67.3Q124.3 61.5 120.2 51.8L120.2 51.8Q117.6 59.2 117 62.5Q116.4 65.9 116.2 67Q115.9 68.1 115.7 68.8Q115.5 69.4 115.3 70.2Q115.1 71 114.9 71.5Q114.7 71.9 114.5 72.3L114.5 72.3Q113.9 73.2 113.4 73.2ZM189.4 40.5Q189.4 38.4 194.2 37.1Q199 35.8 204.6 35.8Q210.2 35.8 213.1 40.3Q216.1 44.8 216.1 50.3Q216.1 55.8 211.4 69.3Q206.8 82.7 203.4 82.7L203.4 82.7Q202 82.7 201.0 81.8Q200.1 81 200.1 79.7L200.1 79.7Q200.1 72.5 204.1 59.1L204.1 59.1Q199.4 65.1 193.8 68.8Q188.3 72.5 182.4 72.5Q176.6 72.5 170.2 67.4Q163.8 62.3 163.8 56.2L163.8 56.2Q163.8 45.4 170.2 32.3Q176.6 19.1 186.4 9.8Q196.2 0.5 204.9 0.5L204.9 0.5Q207.9 0.5 211.1 5.2Q214.4 9.9 214.4 13.8L214.4 13.8Q214.4 15.6 213.1 15.6L213.1 15.6Q212.9 15.6 211.2 15.2Q209.5 14.8 207 14.8L207 14.8Q200.3 14.8 193.3 21.6Q186.3 28.5 181.9 38.5Q177.5 48.5 177.5 57.3L177.5 57.3Q177.5 59.9 180.9 59.9L180.9 59.9Q185.6 59.9 192.4 55.7Q199.3 51.5 203 46.3L203 46.3Q200.8 46.4 197.6 46.4Q194.5 46.4 191.9 44.5Q189.4 42.6 189.4 40.5Z'

  class JFBadge extends HTMLElement {
    static observedAttributes = ['label', 'size', 'corner', 'ink', 'paper']
    constructor() {
      super()
      this.attachShadow({ mode: 'open' })
    }
    connectedCallback() { this.render() }
    attributeChangedCallback() { if (this.isConnected) this.render() }
    render() {
      const label = this.getAttribute('label') ?? 'janfaris.com'
      const size = Math.max(24, Number(this.getAttribute('size')) || 72)
      const corner = this.getAttribute('corner') || ''
      const ink = this.getAttribute('ink') || '#1d47c4'
      const paper = this.getAttribute('paper') || '#b6cff1'
      const ref = encodeURIComponent(location.hostname || 'local')
      const [v, h] = corner.split('-')
      const pinned = (v === 'top' || v === 'bottom') && (h === 'left' || h === 'right')

      this.shadowRoot.innerHTML = `
<style>
  :host { display: inline-block; line-height: 1; --ink: ${ink}; --paper: ${paper}; --s: ${size}px; }
  :host([hidden]) { display: none; }
  ${pinned ? `:host { position: fixed; ${v}: 20px; ${h}: 20px; z-index: 2147483000; }
  .label { color: #1f1f1f; background: rgb(255 255 255 / .9); padding: .35em .55em; border-radius: 6px; box-shadow: 0 4px 12px -6px rgb(0 0 0 / .3); }` : ''}
  a { display: inline-flex; align-items: center; gap: calc(var(--s) * .3); color: inherit; text-decoration: none; -webkit-tap-highlight-color: transparent; }
  .note {
    display: grid; place-items: center;
    height: var(--s); padding-inline: calc(var(--s) * .14);
    background: var(--paper);
    transform: rotate(-4deg);
    box-shadow: 0 1px 1px rgb(0 0 0 / .08), 0 6px 14px -6px rgb(0 0 0 / .28);
    transition: transform .35s cubic-bezier(.34, 1.56, .64, 1), box-shadow .35s ease;
  }
  svg { height: 62%; width: auto; display: block; fill: var(--ink); overflow: visible; }
  .label {
    font: 600 calc(var(--s) * .3)/1 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    letter-spacing: .01em;
    text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: .28em;
    opacity: .82; transition: opacity .2s ease;
  }
  a:hover .note, a:focus-visible .note { transform: rotate(-7deg) translateY(-3px); box-shadow: 0 1px 1px rgb(0 0 0 / .08), 0 12px 20px -8px rgb(0 0 0 / .32); }
  a:hover .label, a:focus-visible .label { opacity: 1; }
  a:focus-visible { outline: 2px solid var(--ink); outline-offset: 6px; border-radius: 4px; }
  @media (prefers-reduced-motion: reduce) { .note { transition: none; } }
</style>
<a href="${SITE}?ref=${ref}" target="_blank" rel="noopener" aria-label="Built by Jan Faris — janfaris.com">
  <span class="note"><svg viewBox="-2 -2 220.1 86.7" aria-hidden="true"><path d="${GLYPHS}"/></svg></span>
  ${label ? `<span class="label">${label.replace(/[&<>"]/g, c => '&#' + c.charCodeAt(0) + ';')}</span>` : ''}
</a>`
    }
  }
  customElements.define('jf-badge', JFBadge)
})()
