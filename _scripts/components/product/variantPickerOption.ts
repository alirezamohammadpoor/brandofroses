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

    // Size toggle — swap EU/US/UK labels
    const toggles = this.qsa('[data-toggle-system]') as HTMLElement[]
    if (toggles.length) {
      toggles.forEach(btn => {
        btn.addEventListener('click', () => {
          const system = btn.dataset.toggleSystem
          toggles.forEach(b => {
            const isActive = b.dataset.toggleSystem === system
            b.classList.toggle('font-medium', isActive)
            b.classList.toggle('text-fg', isActive)
            b.classList.toggle('font-normal', !isActive)
            b.classList.toggle('text-muted', !isActive)
          })
          this.qsa('[data-size-eu]').forEach(el => el.classList.toggle('hidden', system !== 'eu'))
          this.qsa('[data-size-us]').forEach(el => el.classList.toggle('hidden', system !== 'us'))
          this.qsa('[data-size-uk]').forEach(el => el.classList.toggle('hidden', system !== 'uk'))
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