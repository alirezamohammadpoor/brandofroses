import BaseComponent from '@/components/base'
import type { SelectedOption } from '@/types/shopify'

interface VariantPickerOptionSettings {
  onChange?: () => void
}

export default class VariantPickerOption extends BaseComponent {
  static TYPE = 'variant-picker-option'

  settings: VariantPickerOptionSettings
  name: string | undefined
  select: HTMLSelectElement | null
  inputs: HTMLInputElement[]

  constructor(el: HTMLElement, options: VariantPickerOptionSettings = {}) {
    super(el)

    this.settings = {
      ...options
    }

    this.name = this.dataset.name

    if (!this.name) {
      console.warn('No name attribute found')
    }
    
    // Picker options are either <select> tags or a series of <input> tags
    this.select = this.qs('select') as HTMLSelectElement || null
    this.inputs = this.qsa('input') as HTMLInputElement[]

    this.el.addEventListener('change', this.onChange.bind(this))

    // Color label sync — update "Color: X" when a swatch is selected
    const colorLabel = this.qs('[data-selected-color]') as HTMLElement | null
    if (colorLabel) {
      this.inputs.forEach(input => {
        input.addEventListener('change', () => {
          colorLabel.textContent = input.value
        })
      })
    }

    // Size system toggle — on click, set `data-size-system="eu|us|uk"` on
    // the picker root and flip `aria-pressed` across the three toggle
    // buttons. Everything visual falls out of those two attributes via
    // CSS: the button's own `aria-pressed:font-medium aria-pressed:text-fg`
    // utilities handle the pressed styling, and the
    // `[data-size-system="..."]` rules in `_product.css` handle the
    // visibility of the three per-system size-value spans on each tile.
    // Earlier iteration ran three `querySelectorAll` passes per click to
    // toggle `.hidden` on every span; replaced with one attribute write.
    const toggles = this.qsa('[data-toggle-system]') as HTMLElement[]
    if (toggles.length) {
      toggles.forEach(btn => {
        btn.addEventListener('click', () => {
          const system = btn.dataset.toggleSystem
          if (!system) return
          this.el.setAttribute('data-size-system', system)
          toggles.forEach(b => {
            b.setAttribute('aria-pressed', String(b.dataset.toggleSystem === system))
          })
        })
      })
    }
  }

  get selectedOption(): SelectedOption | undefined {
    let name: string | undefined
    let value: string | undefined

    if (this.select) {
      name = this.select.name
      value = this.select.value
    }
    else {
      const selectedInput = this.inputs.find(input => input.checked)

      if (selectedInput) {
        name = selectedInput.name
        value = selectedInput.value
      }
    }

    return name && value ? { name, value } : undefined
  }

  updateValueAvailability(value: string, available: boolean) {
    if (this.select) {
      [...this.select.children].forEach((option: HTMLOptionElement) => {
        if (option.value === value) {
          option.disabled = !available
        }
      })
    }
    else {
      const input = this.inputs.find(input => input.value === value)

      if (!input) return
  
      input.disabled = !available
    }
  }

  onChange() {
    this.settings.onChange?.()
  }
}