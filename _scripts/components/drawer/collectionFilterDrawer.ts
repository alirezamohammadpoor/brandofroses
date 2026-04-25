import Drawer from '@/components/drawer'
import { BREAKPOINTS } from '@/core/breakpointsController'

/**
 * CollectionFilterDrawer
 *
 * Mobile-only filter drawer on the collection page. A thin subclass of the
 * shared `Drawer` primitive: closes automatically at lg+ (filters move back
 * into the desktop pill row) and inherits the Drawer's open/close semantics,
 * focus trap, backdrop, and ESC-to-close.
 *
 * Target element: `#collection-filter-drawer[data-component="collection-filter-drawer"]`.
 *
 * Defense-in-depth (against bugs seen in live testing)
 * ----------------------------------------------------
 * This drawer has historically been sensitive to being constructed twice for
 * the same element id (Shopify theme dev hot-reload + some section-manager
 * edge cases). Two instances both bind `onBodyClick` on `document.body` and a
 * single FILTER click fires BOTH toggles — A opens, B immediately closes —
 * leaving the element closed but one of two backdrops still scrim-visible.
 *
 * Layer 1 — prevent the double mount:
 *   `instances` map keyed by element id; re-constructing for the same id
 *   destroys the previous instance first (releasing its body listener +
 *   backdrop).
 *
 * Layer 2 — tolerate a double mount if layer 1 is ever bypassed:
 *   `open()` and `close()` sync the `is-open` state to ALL body backdrops
 *   matching `aria-controls=<this id>`, not just `this.backdrop.el`. That
 *   way a stray backdrop can't stay scrim-visible after the user clicks the
 *   × close button.
 */

// Module-scoped so it survives hot module reloads cleanly (class static
// private fields re-initialize on re-import; a module var keeps the live
// instance registered across HMR).
const instances: Map<string, CollectionFilterDrawer> = new Map()

export default class CollectionFilterDrawer extends Drawer {
  static TYPE = 'collection-filter-drawer'

  constructor(el: HTMLElement) {
    const existing = instances.get(el.id)
    if (existing) {
      existing.destroy()
    }

    // Sweep any orphan backdrops for this id (e.g. left over from a theme
    // dev reload or a previous mount that didn't destroy cleanly).
    for (const stale of document.body.querySelectorAll(
      `button.backdrop[aria-controls="${el.id}"]`,
    )) {
      stale.remove()
    }

    super(el, {
      maxBreakpoint: BREAKPOINTS.md,
      backdrop: true,
    })

    instances.set(el.id, this)
  }

  destroy() {
    instances.delete(this.el.id)
    super.destroy()
  }

  open() {
    super.open()
    this.#syncBackdrops(true)
  }

  close() {
    super.close()
    this.#syncBackdrops(false)
  }

  /**
   * Sync `is-open` across every body backdrop that points at this drawer,
   * not just `this.backdrop.el`. Guards against the case where some earlier
   * mount left a stray backdrop in the DOM — `this.backdrop.hide()` would
   * only hide its own, leaving the stray one scrim-visible after close.
   */
  #syncBackdrops(isOpen: boolean) {
    for (const b of document.body.querySelectorAll<HTMLElement>(
      `button.backdrop[aria-controls="${this.el.id}"]`,
    )) {
      b.classList.toggle('is-open', isOpen)
      b.setAttribute('aria-hidden', isOpen ? 'false' : 'true')
    }
  }
}
