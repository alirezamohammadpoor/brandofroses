import { setAriaCurrent } from '@/core/utils/a11y'
import type { TaxiNavigateInEvent } from '@/types/taxi'
import type { LiteCart } from '@/types/shopify'

import BaseSection from '@/sections/base'
import HeaderCartControl from '@/components/header/headerCartControl'
import CartBody from '@/components/ajaxCart/cartBody'
import CartFooter from '@/components/ajaxCart/cartFooter'

const selectors = {
  cartPanel: '[data-header-cart-panel]',
  cartJson: '[data-cart-json]'
}

export default class HeaderSection extends BaseSection {
  static TYPE = 'header'

  headerCartControl: HeaderCartControl
  cartPanelBody: CartBody | null
  cartPanelFooter: CartFooter | null

  constructor(container: HTMLElement) {
    super(container)

    this.headerCartControl = new HeaderCartControl(this.qs(HeaderCartControl.SELECTOR))

    // Initialize the desktop Bag pill panel's cart components (separate instances
    // from the mobile ajax-cart drawer — both listen to cartAPI.UPDATE and sync
    // independently).
    this.cartPanelBody = null
    this.cartPanelFooter = null

    const cartPanel = this.qs(selectors.cartPanel)
    if (cartPanel) {
      const cartJsonEl = cartPanel.querySelector(selectors.cartJson)

      if (cartJsonEl?.textContent) {
        try {
          const cartData: LiteCart = JSON.parse(cartJsonEl.textContent)
          const bodyEl = cartPanel.querySelector<HTMLElement>(CartBody.SELECTOR)
          const footerEl = cartPanel.querySelector<HTMLElement>(CartFooter.SELECTOR)

          if (bodyEl) this.cartPanelBody = new CartBody(bodyEl, cartData)
          if (footerEl) this.cartPanelFooter = new CartFooter(footerEl)
        }
        catch (err) {
          console.error('HeaderSection: failed to initialize cart panel', err)
        }
      }
    }
  }

  onNavigateIn(e: TaxiNavigateInEvent) {
    const currentPath = new URL(e.detail.to.finalUrl).pathname
    const links = this.container.querySelectorAll<HTMLAnchorElement>('nav a')

    links.forEach(link => setAriaCurrent(link, currentPath))
  }
}
