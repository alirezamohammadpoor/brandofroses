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
 */
export default class CollectionFilterDrawer extends Drawer {
  static TYPE = 'collection-filter-drawer'

  constructor(el: HTMLElement) {
    super(el, {
      maxBreakpoint: BREAKPOINTS.md,
      backdrop: true
    })
  }
}
