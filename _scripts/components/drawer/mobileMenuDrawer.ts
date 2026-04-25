import Drawer from '@/components/drawer'
import SearchInline from '@/components/search/searchInline'
import { BREAKPOINTS } from '@/core/breakpointsController'

export default class MobileMenuDrawer extends Drawer {
  static TYPE = 'mobile-menu-drawer'

  searchInline: SearchInline
  toggles: HTMLButtonElement[]

  #onToggleClick: (e: MouseEvent) => void

  constructor(el: HTMLElement) {
    super(el, {
      maxBreakpoint: BREAKPOINTS.md
    })

    this.searchInline = new SearchInline(this.qs(SearchInline.SELECTOR) as HTMLFormElement)

    this.toggles = Array.from(this.el.querySelectorAll<HTMLButtonElement>('[data-mobile-menu-toggle]'))

    this.#onToggleClick = this.onToggleClick.bind(this)
    for (const t of this.toggles) {
      t.addEventListener('click', this.#onToggleClick)
    }
  }

  destroy() {
    for (const t of this.toggles) {
      t.removeEventListener('click', this.#onToggleClick)
    }
    super.destroy()
  }

  onToggleClick(e: MouseEvent) {
    e.preventDefault()
    const btn = e.currentTarget as HTMLButtonElement
    const key = btn.dataset.panelKey ?? ''
    const isOpen = btn.getAttribute('aria-expanded') === 'true'

    btn.setAttribute('aria-expanded', String(!isOpen))

    const panel = this.el.querySelector<HTMLElement>(`[data-panel-key="${key}"].mobile-menu__categories`)
    if (panel) {
      panel.classList.toggle('is-active', !isOpen)
    }
  }
}
