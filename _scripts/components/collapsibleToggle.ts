import BaseComponent from '@/components/base'

/**
 * CollapsibleToggle
 *
 *   <button data-component="collapsible-toggle" class="collapsible-toggle"
 *           aria-expanded="false" aria-controls="panel-id">…</button>
 *   <div id="panel-id" class="collapsible">
 *     <div class="collapsible__inner">…</div>
 *   </div>
 *
 * Multiple collapsibles on the same page are independent — if a future
 * feature wants "only one open at a time", that lives in a parent.
 *
 * Fit-content mode (opt-in via `data-fit-content` on the panel): the
 * default grid-rows expand assumes the closed state is 0 height. The PDP
 * description keeps a 2-line preview when closed, so it animates
 * `max-height` instead. Without measurement, `max-height` would animate
 * from 40px preview to an arbitrary upper bound (60em) over 500ms — but
 * visible growth completes in the first ~70ms when content height is
 * reached, leaving long dead time. Fit-content mode measures
 * `scrollHeight` and pins inline `max-height` to that exact value.
 */
export default class CollapsibleToggle extends BaseComponent {
  static TYPE = 'collapsible-toggle'

  panel: HTMLElement | null
  fitContent: boolean
  #onClickBound: (e: Event) => void
  #onTransitionEndBound: (e: TransitionEvent) => void

  constructor(el: HTMLElement) {
    super(el)

    const panelId = this.el.getAttribute('aria-controls')
    this.panel = panelId ? document.getElementById(panelId) : null
    this.fitContent = this.panel?.hasAttribute('data-fit-content') ?? false

    if (!this.panel) {
      console.warn('[collapsible-toggle] aria-controls target not found:', panelId)
    }

    this.#onClickBound = this.onClick.bind(this)
    this.#onTransitionEndBound = this.onTransitionEnd.bind(this)
    this.el.addEventListener('click', this.#onClickBound)
  }

  destroy() {
    this.el.removeEventListener('click', this.#onClickBound)
    this.panel?.removeEventListener('transitionend', this.#onTransitionEndBound)
    super.destroy()
  }

  onClick() {
    const isOpen = this.el.getAttribute('aria-expanded') === 'true'
    const next = !isOpen
    this.el.setAttribute('aria-expanded', String(next))

    if (this.fitContent && this.panel) {
      this.toggleFitContent(next)
    } else {
      this.panel?.classList.toggle('is-open', next)
    }
  }

  toggleFitContent(open: boolean) {
    const panel = this.panel
    if (!panel) return

    // Always clear the previous transitionend listener so a rapid re-toggle
    // doesn't leave a stale handler that fires on the next transition and
    // snaps the panel shut behind the user's back.
    panel.removeEventListener('transitionend', this.#onTransitionEndBound)

    if (open) {
      panel.classList.add('is-open')
      panel.style.maxHeight = `${panel.scrollHeight}px`
      return
    }

    panel.style.maxHeight = `${panel.scrollHeight}px`
    void panel.offsetHeight
    panel.style.maxHeight = '40px'
    panel.addEventListener('transitionend', this.#onTransitionEndBound)
  }

  onTransitionEnd(e: TransitionEvent) {
    if (e.propertyName !== 'max-height') return
    const panel = this.panel
    if (!panel) return
    panel.removeEventListener('transitionend', this.#onTransitionEndBound)
    // Re-entrancy guard: if a re-open click ran during the close transition,
    // the panel will already have an inline max-height and we'd otherwise
    // strip it incorrectly.
    if (this.el.getAttribute('aria-expanded') === 'true') return
    panel.classList.remove('is-open')
    panel.style.maxHeight = ''
  }
}
