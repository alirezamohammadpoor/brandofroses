import BaseComponent from '@/components/base'

export default class ProductInfoModal extends BaseComponent {
  static TYPE = 'product-info-modal'

  backdrop: HTMLElement | null
  panel: HTMLElement | null
  tabs: HTMLElement[]
  panels: HTMLElement[]

  #onClickBound: (e: Event) => void
  #onKeydownBound: (e: KeyboardEvent) => void
  #previouslyFocused: HTMLElement | null = null

  constructor(el: HTMLElement) {
    super(el)

    this.backdrop = this.qs('[data-modal-backdrop]')
    this.panel = this.qs('[data-modal-panel]')
    this.tabs = this.qsa('[data-info-tab]') as HTMLElement[]
    this.panels = this.qsa('[data-info-panel]') as HTMLElement[]

    this.#onClickBound = this.onClick.bind(this)
    this.#onKeydownBound = this.onKeydown.bind(this)

    this.el.addEventListener('click', this.#onClickBound)
    document.addEventListener('keydown', this.#onKeydownBound)
  }

  destroy() {
    this.el.removeEventListener('click', this.#onClickBound)
    document.removeEventListener('keydown', this.#onKeydownBound)
    super.destroy()
  }

  get isOpen(): boolean {
    return !this.el.classList.contains('pointer-events-none')
  }

  open(tabId?: string) {
    this.#previouslyFocused = document.activeElement as HTMLElement
    if (tabId) this.switchTab(tabId)

    this.el.classList.remove('pointer-events-none')
    this.el.setAttribute('aria-hidden', 'false')
    this.backdrop?.classList.add('opacity-100')
    this.backdrop?.classList.remove('opacity-0')
    this.panel?.classList.remove('translate-x-full')
    this.panel?.classList.add('translate-x-0')

    // Move focus to the active tab so keyboard users can start interacting
    const activeTab = this.tabs.find(t => t.getAttribute('aria-selected') === 'true') ?? this.tabs[0]
    activeTab?.focus()
  }

  close() {
    this.backdrop?.classList.remove('opacity-100')
    this.backdrop?.classList.add('opacity-0')
    this.panel?.classList.add('translate-x-full')
    this.panel?.classList.remove('translate-x-0')

    setTimeout(() => {
      this.el.classList.add('pointer-events-none')
      this.el.setAttribute('aria-hidden', 'true')
      // Return focus to the element that opened the modal
      this.#previouslyFocused?.focus?.()
      this.#previouslyFocused = null
    }, 300)
  }

  switchTab(id: string) {
    for (const t of this.tabs) {
      const isActive = t.dataset.infoTab === id
      t.setAttribute('aria-selected', isActive ? 'true' : 'false')
      t.setAttribute('tabindex', isActive ? '0' : '-1')
      t.classList.toggle('font-medium', isActive)
      t.classList.toggle('text-fg', isActive)
      t.classList.toggle('font-normal', !isActive)
      t.classList.toggle('text-muted', !isActive)
    }

    for (const p of this.panels) {
      p.classList.toggle('hidden', p.dataset.infoPanel !== id)
    }
  }

  #focusTabByOffset(offset: number) {
    const currentIndex = this.tabs.findIndex(t => t.getAttribute('aria-selected') === 'true')
    const nextIndex = (currentIndex + offset + this.tabs.length) % this.tabs.length
    const nextTab = this.tabs[nextIndex]
    if (!nextTab) return
    this.switchTab(nextTab.dataset.infoTab!)
    nextTab.focus()
  }

  onClick(e: Event) {
    const target = e.target as HTMLElement

    const tab = target.closest('[data-info-tab]') as HTMLElement
    if (tab) {
      this.switchTab(tab.dataset.infoTab!)
      return
    }

    if (target.closest('[data-modal-close]')) {
      this.close()
      return
    }

    if (target.hasAttribute('data-modal-backdrop')) {
      this.close()
    }
  }

  onKeydown(e: KeyboardEvent) {
    if (!this.isOpen) return

    if (e.key === 'Escape') {
      this.close()
      return
    }

    // Arrow-key navigation within the vertical tablist
    const focusedTab = document.activeElement as HTMLElement
    if (focusedTab?.getAttribute('role') === 'tab' && this.tabs.includes(focusedTab)) {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault()
          this.#focusTabByOffset(1)
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          this.#focusTabByOffset(-1)
          break
        case 'Home':
          e.preventDefault()
          this.switchTab(this.tabs[0].dataset.infoTab!)
          this.tabs[0].focus()
          break
        case 'End':
          e.preventDefault()
          this.switchTab(this.tabs[this.tabs.length - 1].dataset.infoTab!)
          this.tabs[this.tabs.length - 1].focus()
          break
      }
    }
  }
}
