import ResultsSection from '@/sections/results'
import CollectionFilterDrawer from '@/components/drawer/collectionFilterDrawer'

export default class CollectionSection extends ResultsSection {
  static TYPE = 'collection'

  filterDrawer: CollectionFilterDrawer | null

  constructor(container: HTMLElement) {
    super(container)

    const drawerEl = this.qs(CollectionFilterDrawer.SELECTOR)
    this.filterDrawer = drawerEl ? new CollectionFilterDrawer(drawerEl) : null
  }

  destroy() {
    this.filterDrawer?.destroy()
    this.filterDrawer = null
    super.destroy()
  }
}
