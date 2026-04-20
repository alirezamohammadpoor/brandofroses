import BaseComponent from '@/components/base'

const selectors = {
  toggle: '[data-desktop-menu-toggle]',
  panel: '[data-desktop-menu-panel]',
  link: '[data-menu-link]',
  previewImage: '[data-menu-preview-image]',
  previewTitle: '[data-menu-preview-title]',
  previewDesc: '[data-menu-preview-desc]',
  hiddenImages: '[data-menu-collection-images]',
  defaultImage: '[data-default-image]',
}

/**
 * DesktopMenu
 *
 * Manages the desktop mega-menu: toggle open/close, outside click, Escape,
 * and the hover image-swap preview of the currently-hovered collection.
 *
 * Lives as a standalone component (registered in app.ts) so it stays wired
 * up across Taxi.js SPA navigations — previously implemented via an inline
 * <script> in sections/header.liquid which did not re-execute after SPA
 * transitions.
 *
 * Target element: the panel div (carries data-component="desktop-menu").
 * The toggle is located by matching [aria-controls={panel.id}].
 */
export default class DesktopMenu extends BaseComponent {
  static TYPE = 'desktop-menu'

  toggle: HTMLElement | null
  panel: HTMLElement
  links: HTMLElement[]
  previewImage: HTMLElement | null
  previewTitle: HTMLElement | null
  previewDesc: HTMLElement | null
  hiddenImages: HTMLElement | null
  defaultSrc: string
  defaultAlt: string
  defaultTitle: string
  defaultDesc: string
  isOpen: boolean

  #onToggleClick: (e: MouseEvent) => void
  #onDocumentKeydown: (e: KeyboardEvent) => void
  #onDocumentClick: (e: MouseEvent) => void
  #onLinkMouseEnter: (e: MouseEvent) => void
  #onLinkClick: (e: MouseEvent) => void
  #onPanelAnchorClick: (e: MouseEvent) => void

  constructor(el: HTMLElement) {
    super(el)

    this.panel = el
    this.toggle = this.panel.id ? document.querySelector(`[aria-controls="${this.panel.id}"]`) : null
    this.links = Array.from(this.panel.querySelectorAll<HTMLElement>(selectors.link))
    this.previewImage = this.panel.querySelector(selectors.previewImage)
    this.previewTitle = this.panel.querySelector(selectors.previewTitle)
    this.previewDesc = this.panel.querySelector(selectors.previewDesc)
    this.hiddenImages = document.querySelector(selectors.hiddenImages)

    const defaultImgEl = this.previewImage?.querySelector<HTMLImageElement>(selectors.defaultImage)
    this.defaultSrc = defaultImgEl?.src ?? ''
    this.defaultAlt = defaultImgEl?.alt ?? ''
    this.defaultTitle = this.previewTitle?.textContent?.trim() ?? ''
    this.defaultDesc = this.previewDesc?.textContent?.trim() ?? ''

    this.isOpen = false

    this.#onToggleClick = this.onToggleClick.bind(this)
    this.#onDocumentKeydown = this.onDocumentKeydown.bind(this)
    this.#onDocumentClick = this.onDocumentClick.bind(this)
    this.#onLinkMouseEnter = this.onLinkMouseEnter.bind(this)
    this.#onLinkClick = this.onLinkClick.bind(this)
    this.#onPanelAnchorClick = this.onPanelAnchorClick.bind(this)

    this.toggle?.addEventListener('click', this.#onToggleClick)
    document.addEventListener('keydown', this.#onDocumentKeydown)
    document.addEventListener('click', this.#onDocumentClick)

    for (const link of this.links) {
      link.addEventListener('mouseenter', this.#onLinkMouseEnter)
      link.addEventListener('click', this.#onLinkClick)
    }

    // Also close on any <a> click inside the panel (category headings etc)
    for (const a of Array.from(this.panel.querySelectorAll<HTMLAnchorElement>('a'))) {
      a.addEventListener('click', this.#onPanelAnchorClick)
    }
  }

  destroy() {
    this.toggle?.removeEventListener('click', this.#onToggleClick)
    document.removeEventListener('keydown', this.#onDocumentKeydown)
    document.removeEventListener('click', this.#onDocumentClick)

    for (const link of this.links) {
      link.removeEventListener('mouseenter', this.#onLinkMouseEnter)
      link.removeEventListener('click', this.#onLinkClick)
    }
    for (const a of Array.from(this.panel.querySelectorAll<HTMLAnchorElement>('a'))) {
      a.removeEventListener('click', this.#onPanelAnchorClick)
    }

    super.destroy()
  }

  open() {
    this.panel.classList.remove('opacity-0', 'pointer-events-none')
    this.panel.classList.add('opacity-100')
    this.toggle?.setAttribute('aria-expanded', 'true')
    this.isOpen = true
  }

  close() {
    this.panel.classList.add('opacity-0', 'pointer-events-none')
    this.panel.classList.remove('opacity-100')
    this.toggle?.setAttribute('aria-expanded', 'false')
    this.isOpen = false
  }

  onToggleClick(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    this.isOpen ? this.close() : this.open()
  }

  onDocumentKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.isOpen) this.close()
  }

  onDocumentClick(e: MouseEvent) {
    if (!this.isOpen) return
    const target = e.target as Node
    if (this.toggle?.contains(target) || this.panel.contains(target)) return
    this.close()
  }

  onLinkMouseEnter(e: MouseEvent) {
    if (!this.previewImage || !this.hiddenImages) return

    const link = e.currentTarget as HTMLElement
    const handle = link.dataset.collectionHandle
    if (!handle) return

    const cached = this.hiddenImages.querySelector<HTMLImageElement>(`[data-collection="${handle}"]`)
    if (!cached) return

    const img = this.previewImage.querySelector<HTMLImageElement>('img')
    if (img) {
      img.style.opacity = '0'
      if (this.previewTitle) this.previewTitle.style.opacity = '0'
      if (this.previewDesc) this.previewDesc.style.opacity = '0'
      setTimeout(() => {
        img.src = cached.src
        img.alt = cached.alt
        if (this.previewTitle) this.previewTitle.textContent = cached.dataset.title ?? ''
        if (this.previewDesc) this.previewDesc.textContent = cached.dataset.desc ?? ''
        img.style.opacity = '1'
        if (this.previewTitle) this.previewTitle.style.opacity = '1'
        if (this.previewDesc) this.previewDesc.style.opacity = '1'
      }, 250)
    } else {
      if (this.previewTitle) this.previewTitle.textContent = cached.dataset.title ?? ''
      if (this.previewDesc) this.previewDesc.textContent = cached.dataset.desc ?? ''
    }
  }

  onLinkClick() {
    // Close dropdown on link click (Taxi.js SPA navigation keeps it open otherwise)
    this.close()
  }

  onPanelAnchorClick() {
    this.close()
  }
}
