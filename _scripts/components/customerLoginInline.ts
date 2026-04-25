import BaseComponent from '@/components/base'

const SELECTORS = {
  view: '[data-view-target]',
  switch: '[data-view-switch]'
}

export default class CustomerLoginInline extends BaseComponent {
  static TYPE = 'customer-login-inline'

  #onClick: (e: MouseEvent) => void

  constructor(el: HTMLElement) {
    super(el)

    this.#onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(SELECTORS.switch)
      if (!target) return

      e.preventDefault()
      const next = target.dataset.viewSwitch
      if (next) this.setView(next)
    }

    this.el.addEventListener('click', this.#onClick)

    const erroredView = this.el.querySelector<HTMLElement>('[data-view-target] .form-group__error')
    if (erroredView) {
      const host = erroredView.closest<HTMLElement>('[data-view-target]')
      if (host?.dataset.viewTarget) this.setView(host.dataset.viewTarget)
    }
  }

  setView(name: string) {
    for (const view of this.el.querySelectorAll<HTMLElement>(SELECTORS.view)) {
      view.hidden = view.dataset.viewTarget !== name
    }
  }

  destroy() {
    this.el.removeEventListener('click', this.#onClick)
    super.destroy()
  }
}
