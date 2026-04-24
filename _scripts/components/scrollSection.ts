import BaseComponent from '@/components/base'

export default class ScrollSection extends BaseComponent {
  static TYPE = 'scroll-section'

  #container: HTMLElement | null
  #prevBtn: HTMLElement | null
  #nextBtn: HTMLElement | null
  // setTimeout scheduled in handleClick to re-check edge colors after the
  // smooth-scroll animation settles. Tracked so `destroy()` can clear it —
  // without that, a click → destroy (common on Taxi navigation mid-scroll,
  // or on `ProductRecommendations` tearing down this instance in its own
  // destroy()) would leave the callback to fire against a detached
  // container, classlist-toggling on null or throwing.
  #updateColorsTimeoutId: ReturnType<typeof setTimeout> | null = null

  constructor(el: HTMLElement) {
    super(el)

    this.#container = el.querySelector('[data-scroll-container]')
    this.#prevBtn = el.querySelector('[data-scroll-prev]')
    this.#nextBtn = el.querySelector('[data-scroll-next]')

    if (!this.#container) return

    this.handleClick = this.handleClick.bind(this)
    this.handleScroll = this.handleScroll.bind(this)

    this.#prevBtn?.addEventListener('click', this.handleClick)
    this.#nextBtn?.addEventListener('click', this.handleClick)
    this.#container.addEventListener('scroll', this.handleScroll, { passive: true })

    this.updateColors()
  }

  private handleClick(e: Event) {
    if (!this.#container) return
    const btn = e.currentTarget as HTMLElement
    const isPrev = btn.hasAttribute('data-scroll-prev')
    const firstCard = this.#container.querySelector<HTMLElement>(':scope > *')
    const amount = firstCard ? firstCard.offsetWidth + 8 : this.#container.offsetWidth * 0.25
    this.#container.scrollBy({ left: isPrev ? -amount : amount, behavior: 'smooth' })
    // Clear any previous pending color-update before queuing a new one so
    // rapid clicks don't stack timers.
    if (this.#updateColorsTimeoutId !== null) clearTimeout(this.#updateColorsTimeoutId)
    this.#updateColorsTimeoutId = setTimeout(() => {
      this.#updateColorsTimeoutId = null
      this.updateColors()
    }, 350)
  }

  private handleScroll() {
    this.updateColors()
  }

  private updateColors() {
    if (!this.#container || !this.#prevBtn || !this.#nextBtn) return
    const atStart = this.#container.scrollLeft <= 8
    const atEnd = this.#container.scrollLeft + this.#container.offsetWidth >= this.#container.scrollWidth - 8
    this.#prevBtn.classList.toggle('text-muted', atStart)
    this.#prevBtn.classList.toggle('text-fg', !atStart)
    this.#nextBtn.classList.toggle('text-muted', atEnd)
    this.#nextBtn.classList.toggle('text-fg', !atEnd)
  }

  destroy() {
    if (this.#updateColorsTimeoutId !== null) {
      clearTimeout(this.#updateColorsTimeoutId)
      this.#updateColorsTimeoutId = null
    }
    this.#prevBtn?.removeEventListener('click', this.handleClick)
    this.#nextBtn?.removeEventListener('click', this.handleClick)
    this.#container?.removeEventListener('scroll', this.handleScroll)
    super.destroy()
  }
}
