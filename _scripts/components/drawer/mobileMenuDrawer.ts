import Drawer from '@/components/drawer'
import SearchInline from '@/components/search/searchInline'
import { BREAKPOINTS } from '@/core/breakpointsController'

/**
 * MobileMenuDrawer — slide-in drawer for mobile (≤md). Subnav expansion
 * is delegated to the shared `.collapsible-toggle` component.
 */
export default class MobileMenuDrawer extends Drawer {
  static TYPE = 'mobile-menu-drawer'

  searchInline: SearchInline

  constructor(el: HTMLElement) {
    super(el, {
      maxBreakpoint: BREAKPOINTS.md
    })

    this.searchInline = new SearchInline(this.qs(SearchInline.SELECTOR) as HTMLFormElement)
  }
}
