import Drawer from '@/components/drawer'
import SearchInline from '@/components/search/searchInline'
import { BREAKPOINTS } from '@/core/breakpointsController'

export default class MobileMenuDrawer extends Drawer {
  static TYPE = 'mobile-menu-drawer'

  searchInline: SearchInline

  constructor(el: HTMLElement) {
    super(el, {
      maxBreakpoint: BREAKPOINTS.md
    })

    this.searchInline = new SearchInline(this.qs(SearchInline.SELECTOR) as HTMLFormElement)

    // Expandable search bar toggle
    const searchToggle = this.qs('[data-search-toggle]')
    const searchForm = this.qs('[data-search-form]') as HTMLFormElement | null

    if (searchToggle && searchForm) {
      searchToggle.addEventListener('click', () => {
        searchForm.classList.toggle('hidden')
        if (!searchForm.classList.contains('hidden')) {
          const input = searchForm.querySelector('input') as HTMLInputElement
          input?.focus()
        }
      })
    }
  }
}