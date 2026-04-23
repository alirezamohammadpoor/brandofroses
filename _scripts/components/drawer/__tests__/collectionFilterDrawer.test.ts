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

  it('double-mount for the same id destroys the previous instance and reuses one backdrop', () => {
    // Regression fence: under shopify theme dev hot-reload (and some edge
    // cases in section-manager double-registration), the drawer has been
    // observed to mount twice. Two instances both bind onBodyClick to
    // <body>, and a single FILTER click then fires BOTH toggles — A opens,
    // B immediately closes — leaving the element closed but a backdrop
    // still scrim-visible. Defense: constructing a new instance for the
    // same id destroys the existing one first.
    const el = document.createElement('div')
    el.id = 'collection-filter-drawer'
    el.setAttribute('data-component', CollectionFilterDrawer.TYPE)
    el.setAttribute('aria-hidden', 'true')
    document.body.appendChild(el)

    const first = new CollectionFilterDrawer(el)
    const second = new CollectionFilterDrawer(el)

    const backdrops = document.body.querySelectorAll(
      `button.backdrop[aria-controls="${el.id}"]`,
    )
    expect(backdrops.length).toBe(1)

    // The first instance's backdrop was detached + its listeners cleared.
    // The second is the live one.
    expect(first.backdrop).toBeNull()
    expect(second.backdrop).not.toBeNull()

    second.destroy()
  })
})
