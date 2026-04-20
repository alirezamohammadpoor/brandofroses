import BaseComponent from '@/components/base'

export default class AnnouncementRotator extends BaseComponent {
  static TYPE = 'announcement-rotator'

  private messages: HTMLElement[]
  private currentIndex: number
  private interval: ReturnType<typeof setInterval> | null

  constructor(el: HTMLElement) {
    super(el)

    this.messages = Array.from(el.querySelectorAll('[data-announcement-message]'))
    this.currentIndex = 0
    this.interval = null

    if (this.messages.length > 1) {
      const speed = parseInt(this.el.dataset.speed || '4', 10) * 1000
      this.interval = setInterval(() => this.next(), speed)
    }
  }

  private next() {
    const prev = this.messages[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.messages.length
    const next = this.messages[this.currentIndex]

    // Previous slides up and out
    prev.classList.remove('translate-y-0')
    prev.classList.add('-translate-y-full')

    // Next slides in from below
    next.classList.remove('translate-y-full')
    next.classList.add('translate-y-0')

    // Reset previous to below for next cycle (instant, no animation)
    setTimeout(() => {
      prev.classList.remove('transition-transform', 'duration-500')
      prev.classList.remove('-translate-y-full')
      prev.classList.add('translate-y-full')
      // Re-enable transition after layout
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          prev.classList.add('transition-transform', 'duration-500')
        })
      })
    }, 500)
  }

  destroy() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    super.destroy()
  }
}
