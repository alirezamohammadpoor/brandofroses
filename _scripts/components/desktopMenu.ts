import BaseComponent from '@/components/base'
import CartAPI, { type CartAPIEvent } from '@/core/cartAPI'

const selectors = {
  toggle: '[data-desktop-menu-toggle]',
  panelKey: '[data-panel-key]',
}

/**
 * DesktopMenu
 *
 * Manages the pill-style dropdown: any pill item with children becomes a
 * toggle that morphs the whole pill from rounded-full (closed) to
 * rounded-[18px] (open). Multiple toggles share the same pill container —
 * each one has its own category list, and only one list shows at a time.
 *
 * Target element: the pill group (carries data-component="desktop-menu" and
 * data-desktop-menu-panel).
 *
 * Closes on: outside click, Escape, clicking any anchor in the group,
 * clicking the active toggle again.
 */
export default class DesktopMenu extends BaseComponent {
  static TYPE = 'desktop-menu'

  panel: HTMLElement
  toggles: HTMLButtonElement[]
  activeKey: string | null
  cartAddKey: string | null

  #onToggleClick: (e: MouseEvent) => void
  #onDocumentKeydown: (e: KeyboardEvent) => void
  #onDocumentClick: (e: MouseEvent) => void
  #onPanelAnchorClick: (e: MouseEvent) => void
  #onCartAdd: (e: CartAPIEvent) => void

  constructor(el: HTMLElement) {
    super(el)

    this.panel = el
    this.toggles = Array.from(this.panel.querySelectorAll<HTMLButtonElement>(selectors.toggle))
    this.activeKey = null
    this.cartAddKey = this.panel.dataset.cartAddKey ?? null

    this.#onToggleClick = this.onToggleClick.bind(this)
    this.#onDocumentKeydown = this.onDocumentKeydown.bind(this)
    this.#onDocumentClick = this.onDocumentClick.bind(this)
    this.#onPanelAnchorClick = this.onPanelAnchorClick.bind(this)
    this.#onCartAdd = this.onCartAdd.bind(this)

    for (const t of this.toggles) {
      t.addEventListener('click', this.#onToggleClick)
    }
    document.addEventListener('keydown', this.#onDocumentKeydown)
    document.addEventListener('click', this.#onDocumentClick)

    for (const a of Array.from(this.panel.querySelectorAll<HTMLAnchorElement>('a'))) {
      a.addEventListener('click', this.#onPanelAnchorClick)
    }

    // If this pill group opts in via data-cart-add-key, open that panel on cart.ADD
    if (this.cartAddKey) {
      window.addEventListener(CartAPI.EVENTS.ADD, this.#onCartAdd)
    }
  }

  destroy() {
    for (const t of this.toggles) {
      t.removeEventListener('click', this.#onToggleClick)
    }
    document.removeEventListener('keydown', this.#onDocumentKeydown)
    document.removeEventListener('click', this.#onDocumentClick)

    for (const a of Array.from(this.panel.querySelectorAll<HTMLAnchorElement>('a'))) {
      a.removeEventListener('click', this.#onPanelAnchorClick)
    }

    if (this.cartAddKey) {
      window.removeEventListener(CartAPI.EVENTS.ADD, this.#onCartAdd)
    }

    super.destroy()
  }

  onCartAdd() {
    if (!this.cartAddKey) return
    this.open(this.cartAddKey)
  }

  open(key: string) {
    this.activeKey = key
    this.panel.classList.add('is-open')
    this.panel.dataset.activeKey = key

    for (const t of this.toggles) {
      t.setAttribute('aria-expanded', t.dataset.panelKey === key ? 'true' : 'false')
    }

    for (const el of Array.from(this.panel.querySelectorAll<HTMLElement>('[data-panel-key]'))) {
      el.classList.toggle('is-active', el.dataset.panelKey === key)
    }
  }

  close() {
    this.activeKey = null
    this.panel.classList.remove('is-open')
    delete this.panel.dataset.activeKey

    for (const t of this.toggles) {
      t.setAttribute('aria-expanded', 'false')
    }

    for (const el of Array.from(this.panel.querySelectorAll<HTMLElement>('[data-panel-key]'))) {
      el.classList.remove('is-active')
    }
  }

  onToggleClick(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const btn = e.currentTarget as HTMLButtonElement
    const key = btn.dataset.panelKey ?? ''
    if (this.activeKey === key) {
      this.close()
    } else {
      this.open(key)
    }
  }

  onDocumentKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.activeKey !== null) this.close()
  }

  onDocumentClick(e: MouseEvent) {
    if (this.activeKey === null) return
    const target = e.target as Node
    if (this.panel.contains(target)) return
    this.close()
  }

  onPanelAnchorClick() {
    this.close()
  }
}
