import type { LiteVariant } from '@/types/shopify'
import BaseComponent from '@/components/base'
import { getAppString } from '@/core/utils/string'

const selectors = {
  label: '[data-label]'
}

export default class ATCButton extends BaseComponent {
  static TYPE = 'atc-button'

  declare el: HTMLButtonElement;

  tempText: string | null
  label: HTMLElement
  successTimeoutId: ReturnType<typeof setTimeout> | null

  constructor(el: HTMLButtonElement) {
    super(el)

    this.tempText = null
    this.successTimeoutId = null

    this.label = this.qs(selectors.label) as HTMLElement

    if (!this.label) {
      console.warn('No label found')
    }
  }

  destroy() {
    window.clearTimeout(this.successTimeoutId)

    super.destroy()
  }

  /**
   * Updates the DOM state of the add to cart button based on the given variant.
   *
   * @param variant - LiteVariant object
   */
  update(variant: LiteVariant) {
    let isDisabled = true
    let labelText = getAppString('unavailable', 'Unavailable')

    if (variant) {
      if (variant.available) {
        isDisabled = false
        labelText = getAppString('addToCart', 'Add To Cart')
      }
      else {
        isDisabled = true
        labelText = getAppString('soldOut', 'Sold Out')
      }
    }

    // Three conceptually distinct states on this button:
    //   - `disabled` — functional gate (blocks clicks). True whenever the
    //     variant is unavailable OR no valid variant is selected, and is
    //     ALSO toggled transiently during submit ("Adding…"). Cheap lock.
    //   - `data-sold-out` — VISUAL red state (oxblood bg, centered label,
    //     price hidden). Should fire ONLY when the variant is a real
    //     product but sold out (Figma 173:446). NOT when the combo is
    //     "Unavailable" (variant is undefined — user picked an invalid
    //     color+size combo), because that's a user-correctable state that
    //     should look muted, not alarming. And NOT during the submit-
    //     disable window, or the "Adding…" label would flash red.
    //     Deriving from `variant && !variant.available` keeps these three
    //     cases cleanly separated.
    const isSoldOut = Boolean(variant && !variant.available)

    this.el.disabled = isDisabled
    this.el.toggleAttribute('data-sold-out', isSoldOut)
    this.label.textContent = labelText
  }

  onAddStart() {
    this.tempText = this.label.innerText // Save a copy of the original text
    this.label.innerText = getAppString('adding', 'Adding...') // Run the "adding" animation
  }

  onAddSuccess() {
    this.label.innerText = getAppString('added', 'Added!')

    this.successTimeoutId = setTimeout(() => {
      // Reset the button text
      this.label.innerText = this.tempText
      this.tempText = null
    }, 1000)
  }

  onAddFail(e: Error) {
    this.label.innerText = this.tempText
  }
}