import BaseComponent from '@/components/base'

/**
 * CollapsibleToggle
 *
 * Generic expand/collapse primitive paired with the `.collapsible` CSS in
 * `_styles/components/_collapsible.css`. Wire it by mounting the component
 * on a `<button>` whose `aria-controls` points at the target panel:
 *
 *   <button
 *     data-component="collapsible-toggle"
 *     class="collapsible-toggle"
 *     aria-expanded="false"
 *     aria-controls="info-product-details">…</button>
 *   <div id="info-product-details" class="collapsible">
 *     <div class="collapsible__inner">…</div>
 *   </div>
 *
 * On click we flip the button's `aria-expanded` and toggle `is-open` on the
 * paired panel. That's it — the animation, chevron rotation, and
 * screen-reader state all fall out of those two attributes via CSS in
 * `_collapsible.css`. Multiple collapsibles on the same page are
 * independent (no mutual exclusion); if a future feature wants "only one
 * open at a time", that lives in a parent component, not here.
 */
export default class CollapsibleToggle extends BaseComponent {
  static TYPE = 'collapsible-toggle'

  panel: HTMLElement | null
  #onClickBound: (e: Event) => void

  constructor(el: HTMLElement) {
    super(el)

    const panelId = this.el.getAttribute('aria-controls')
    this.panel = panelId ? document.getElementById(panelId) : null

    if (!this.panel) {
      console.warn('[collapsible-toggle] aria-controls target not found:', panelId)
    }

    this.#onClickBound = this.onClick.bind(this)
    this.el.addEventListener('click', this.#onClickBound)
  }

  destroy() {
    this.el.removeEventListener('click', this.#onClickBound)
    super.destroy()
  }

  onClick() {
    const isOpen = this.el.getAttribute('aria-expanded') === 'true'
    const next = !isOpen
    this.el.setAttribute('aria-expanded', String(next))
    this.panel?.classList.toggle('is-open', next)
  }
}
