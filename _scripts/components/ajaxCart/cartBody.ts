import { getDomFromString, isVisible } from '@/core/utils/dom'
import type { LiteCart, LiteLineItem } from '@/types/shopify'
import CartAPI, { type CartAPIEvent } from '@/core/cartAPI'

import BaseComponent from '@/components/base'
import CartItem from '@/components/ajaxCart/cartItem'

const selectors = {
  list: '[data-list]'
}

export default class CartBody extends BaseComponent {
  static TYPE = 'cart-body'

  #muteUpdateSync: boolean
  cartData: LiteCart
  list: HTMLElement
  itemInstances: CartItem[]

  constructor(el: HTMLElement, cartData: LiteCart) {
    super(el, {
      watchCartUpdate: true,
    })

    this.#muteUpdateSync = false

    this.cartData = cartData

    this.list = this.qs(selectors.list)

    this.onItemRemoveClick = this.onItemRemoveClick.bind(this)
    this.onItemQuantityAdjusterChange = this.onItemQuantityAdjusterChange.bind(this)

    /*
     * Defensive: when cart-json data and the rendered cart-body DOM get out
     * of sync (e.g. Shopify's anti-bot challenge caching a stale cart-json
     * blob while serving fresh HTML, or a partial AJAX update), `cartData.items`
     * can be shorter than the DOM item count. Calling `new CartItem(el, undefined)`
     * crashes on `this.itemData.id` and gets swallowed by HeaderSection's
     * try/catch, leaving every subsequent item without click handlers — the
     * entire cart goes dead. Skip items without backing data and log a
     * warning so the desync is visible instead of silent.
     */
    const domItems = this.qsa(CartItem.SELECTOR)
    if (domItems.length !== this.cartData.items.length) {
      console.warn(
        `[CartBody] DOM/cart-json mismatch: ${domItems.length} item nodes, ${this.cartData.items.length} JSON items. Skipping unbacked DOM items.`,
      )
    }

    this.itemInstances = domItems
      .map((el, i) => {
        const itemData = this.cartData.items[i]
        if (!itemData) return null
        return this.createCartItemInstance(el, itemData)
      })
      .filter((instance): instance is CartItem => instance !== null)
  }

  createCartItemInstance(el: HTMLElement, itemData: LiteLineItem) {
    return new CartItem(el, itemData, {
      onRemoveClick: this.onItemRemoveClick,
      onQuantityAdjusterChange: this.onItemQuantityAdjusterChange
    })
  }

  cleanupItemInstance(item: CartItem) {
    item.destroy()
    item.el.remove()
  }

  performItemInstanceRemoval(removalInstance: CartItem) {
    if (!removalInstance) return

    // Remove from the itemInstances array
    this.itemInstances = this.itemInstances.filter(instance => instance !== removalInstance)

    const el = removalInstance.el
    const cleanup = () => this.cleanupItemInstance(removalInstance)

    // When the panel/drawer is closed, the row can't be animated visibly —
    // tear it down immediately so the DOM stays in sync with cart state.
    if (!isVisible(el)) {
      cleanup()
      return
    }

    // Plain CSS transition. The shared slideUp/gsap helper has been
    // unreliable here — the tween never applied opacity/height and the row
    // sat in the DOM forever.
    const h = el.offsetHeight
    el.style.overflow = 'hidden'
    el.style.height = `${h}px`
    void el.offsetHeight
    el.style.transition = 'opacity 0.25s ease, height 0.3s ease 0.05s'
    el.style.opacity = '0'
    el.style.height = '0px'

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'height') return
      el.removeEventListener('transitionend', onEnd)
      cleanup()
    }
    el.addEventListener('transitionend', onEnd)
  }

  performItemInstanceUpdate(updateInstance: CartItem, newItemData: LiteLineItem) {
    if (!updateInstance) return

    // Update the item instance with the new data
    updateInstance.update(newItemData)
  }

  performItemInstanceAddition(newItemData: LiteLineItem, newIndex: number) {
    const newItemEl = getDomFromString(newItemData.item_html).querySelector(CartItem.SELECTOR) as HTMLElement
    if (!newItemEl) return
    if (!this.list) return

    const newItemInstance = this.createCartItemInstance(newItemEl, newItemData)

    // Insert to list DOM
    this.list.insertBefore(newItemInstance.el, this.itemInstances[newIndex]?.el || null)
    
    // Insert to array of cart item instances
    this.itemInstances.splice(newIndex, 0, newItemInstance)
  }

  onItemChangeSuccess(updatedItem: CartItem, newCartData: LiteCart) {
    // Item change success doesn't affect the order of the items so we can get the updated item data from the itemInstances array by index
    const itemIndex = this.itemInstances.indexOf(updatedItem)
    const newItemData = newCartData.items[itemIndex]

    if (newItemData) {
      this.performItemInstanceUpdate(updatedItem, newItemData)
    }
    
    this.cartData = newCartData
  }

  onItemRemoveSuccess(removedItem: CartItem, newCartData: LiteCart) {
    this.performItemInstanceRemoval(removedItem)

    this.cartData = newCartData
  }

  /**
   * Synchronizes the cart UI with new cart data received from an update event
   * @param e - Cart update event containing new cart data
   * @param e.detail.cart - The new cart data
   * @param e.detail.cart.items - Array of cart items
   * @param e.detail.cart.items[].id - Unique identifier for cart item
   * @param e.detail.cart.items[].item_html - HTML string representation of cart item
   */
  syncCart(e: CartAPIEvent) {
    const newCartData = e.detail.cart

    // First handle additions and updates
    newCartData.items.forEach((newItemData, newIndex) => {
      let found = false

      this.itemInstances.forEach(itemInstance => {
        if (newItemData.id === itemInstance.id) {
          found = true
          
          this.performItemInstanceUpdate(itemInstance, newItemData)
        }
      })

      // If item wasn't found, it's new - add it
      if (!found) {
        this.performItemInstanceAddition(newItemData, newIndex)
      }
    })

    // Then handle removals - find items that exist in current cart but not in new cart
    this.itemInstances.forEach(itemInstance => {
      const stillExists = newCartData.items.some(newItemData => newItemData.id === itemInstance.id)
      
      if (!stillExists) {
        this.performItemInstanceRemoval(itemInstance)
      }
    })

    this.cartData = newCartData
  }  

  onCartUpdate(e: CartAPIEvent) {
    if (this.#muteUpdateSync) return

    this.syncCart(e)
  }

  async onItemRemoveClick(item: CartItem) {
    item.state = 'removing'

    try {
      this.#muteUpdateSync = true

      const cart = await CartAPI.changeLineItemQuantity(item.key, 0)

      this.onItemRemoveSuccess(item, cart)
    }
    catch (error) {
      console.error('Error removing item', error)      
    }
    finally {
      this.#muteUpdateSync = false
    }
  }

  async onItemQuantityAdjusterChange(item: CartItem, q: number) {
    item.state = q === 0 ? 'removing' : 'updating'

    try {
      this.#muteUpdateSync = true

      const cart = await CartAPI.changeLineItemQuantity(item.key, q)

      if (q === 0) {
        this.onItemRemoveSuccess(item, cart)
      }
      else {
        this.onItemChangeSuccess(item, cart)
      }
    }
    catch (error) {
      item.state = undefined
      item.quantityAdjuster.value = item.itemData.quantity // Reset the quantity adjuster to the original quantity

      console.error('Error updating item quantity', error)
    }
    finally {
      if (q > 0) {
        item.state = undefined
      }
    
      this.#muteUpdateSync = false
    }
  }
}