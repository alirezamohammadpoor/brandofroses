import { afterEach, describe, expect, it } from 'vitest'

import Drawer from '@/components/drawer'

/**
 * Regression fence for the orphaned-backdrop bug:
 *
 * `Drawer.destroy()` used to leave `this.backdrop.el` attached to <body>.
 * A re-mounted drawer then created a second backdrop with the same
 * aria-controls, both listened for clicks, and closing one re-opened the
 * other in a loop. Fix: Drawer.destroy() now calls `this.backdrop.destroy()`.
 */
function makeDrawerEl(id: string): HTMLElement {
  const el = document.createElement('div')
  el.id = id
  el.setAttribute('data-component', Drawer.TYPE)
  el.setAttribute('aria-hidden', 'true')
  document.body.appendChild(el)
  return el
}

function countBackdropsFor(id: string): number {
  return document.body.querySelectorAll(
    `button.backdrop[aria-controls="${id}"]`,
  ).length
}

describe('Drawer backdrop lifecycle', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('removes its backdrop from <body> on destroy()', () => {
    const el = makeDrawerEl('t1')
    const drawer = new Drawer(el, { backdrop: true })

    expect(countBackdropsFor('t1')).toBe(1)

    drawer.destroy()

    expect(countBackdropsFor('t1')).toBe(0)
  })

  it('creates exactly one backdrop when the same drawer id is re-mounted', () => {
    // Mirrors what happens across a Taxi SPA navigation / AJAX swap: the
    // old instance is destroyed, a new one is constructed on the fresh
    // DOM. Before the fix, each cycle leaked a backdrop.
    const el1 = makeDrawerEl('t2')
    const d1 = new Drawer(el1, { backdrop: true })
    d1.destroy()
    el1.remove()

    const el2 = makeDrawerEl('t2')
    const d2 = new Drawer(el2, { backdrop: true })

    expect(countBackdropsFor('t2')).toBe(1)

    d2.destroy()
  })
})
