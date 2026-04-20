import BaseComponent from '@/components/base'

const STORAGE_KEY = 'sania-currency'

export default class CurrencySelector extends BaseComponent {
  static TYPE = 'currency-selector'

  private toggle: HTMLElement
  private dropdown: HTMLElement
  private label: HTMLElement
  private options: HTMLElement[]
  private onClickOutside: (e: MouseEvent) => void

  constructor(el: HTMLElement) {
    super(el)

    this.toggle = el.querySelector('[data-currency-toggle]') as HTMLElement
    this.dropdown = el.querySelector('[data-currency-dropdown]') as HTMLElement
    this.label = el.querySelector('[data-currency-label]') as HTMLElement
    this.options = Array.from(el.querySelectorAll('[data-currency-option]')) as HTMLElement[]

    // Restore saved selection
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      this.label.textContent = saved
    }

    this.toggle.addEventListener('click', () => this.toggleDropdown())

    this.options.forEach(option => {
      option.addEventListener('click', () => {
        const value = (option as HTMLElement).dataset.currencyOption
        this.select(value)
      })
    })

    this.onClickOutside = (e: MouseEvent) => {
      if (!this.el.contains(e.target as Node)) {
        this.close()
      }
    }
  }

  private toggleDropdown() {
    const isOpen = this.toggle.getAttribute('aria-expanded') === 'true'
    if (isOpen) {
      this.close()
    }
    else {
      this.open()
    }
  }

  private open() {
    this.toggle.setAttribute('aria-expanded', 'true')
    this.dropdown.classList.remove('opacity-0', 'pointer-events-none')
    this.dropdown.classList.add('opacity-100', 'pointer-events-auto')
    document.addEventListener('click', this.onClickOutside)
  }

  private close() {
    this.toggle.setAttribute('aria-expanded', 'false')
    this.dropdown.classList.add('opacity-0', 'pointer-events-none')
    this.dropdown.classList.remove('opacity-100', 'pointer-events-auto')
    document.removeEventListener('click', this.onClickOutside)
  }

  private select(value: string) {
    this.label.textContent = value
    localStorage.setItem(STORAGE_KEY, value)
    this.close()

    // Update all other currency selectors on the page
    document.querySelectorAll('[data-currency-label]').forEach(el => {
      el.textContent = value
    })
  }

  destroy() {
    document.removeEventListener('click', this.onClickOutside)
    super.destroy()
  }
}
