import { afterEach, describe, expect, it } from 'vitest'

import CollectionFilterDrawer from '@/components/drawer/collectionFilterDrawer'

/**
 * Smoke test: the subclass stays a thin extension of `Drawer`. open/close
 * correctly propagate to the shared backdrop without the belt-and-suspenders
 * override that used to live on this class.
 */
describe('CollectionFilterDrawer', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('open() shows the backdrop, close() hides it', () => {
    const el = document.createElement('div')
    el.id = 'collection-filter-drawer'
    el.setAttribute('data-component', CollectionFilterDrawer.TYPE)
    el.setAttribute('aria-hidden', 'true')
    document.body.appendChild(el)

    const drawer = new CollectionFilterDrawer(el)
    const backdrop = document.body.querySelector<HTMLElement>(
      `button.backdrop[aria-controls="${el.id}"]`,
    )!
    expect(backdrop).toBeTruthy()

    drawer.open()
    expect(backdrop.classList.contains('is-open')).toBe(true)

    drawer.close()
    expect(backdrop.classList.contains('is-open')).toBe(false)

    drawer.destroy()
  })
})
