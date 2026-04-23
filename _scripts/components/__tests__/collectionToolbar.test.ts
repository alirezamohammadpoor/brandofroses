import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import CollectionToolbar, {
  TOOLBAR_CHANGE_EVENT,
  type ToolbarChangeDetail,
} from '@/components/collectionToolbar'

/**
 * Build a minimal <form data-component="collection-toolbar"> with checkbox
 * filter inputs. Mirrors the shape `collection-toolbar.liquid` renders:
 * the desktop pill panel inputs + the mobile drawer inputs share the same
 * name+value pairs, which is exactly where the dedup/mirror bugs lived.
 */
function makeForm(html: string): HTMLFormElement {
  const form = document.createElement('form')
  form.setAttribute('data-component', 'collection-toolbar')
  form.id = 'test-toolbar'
  form.method = 'get'
  form.innerHTML = html
  document.body.appendChild(form)
  return form
}

function getParams(url: string): URLSearchParams {
  const qIndex = url.indexOf('?')
  return new URLSearchParams(qIndex >= 0 ? url.slice(qIndex + 1) : '')
}

describe('CollectionToolbar', () => {
  let toolbar: CollectionToolbar | null = null

  afterEach(() => {
    toolbar?.destroy()
    toolbar = null
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  describe('buildUrl()', () => {
    it('returns bare pathname when nothing is checked', () => {
      const form = makeForm(`
        <input type="checkbox" data-filter-input name="filter.v.option.size" value="M">
      `)
      toolbar = new CollectionToolbar(form)

      const url = toolbar.buildUrl()

      expect(url).toBe(window.location.pathname)
      expect(url).not.toContain('?')
    })

    it('serializes a single checked filter into the query string', () => {
      const form = makeForm(`
        <input type="checkbox" data-filter-input name="filter.v.option.size" value="M" checked>
      `)
      toolbar = new CollectionToolbar(form)

      const params = getParams(toolbar.buildUrl())

      expect(params.getAll('filter.v.option.size')).toEqual(['M'])
    })

    it('dedupes twin inputs (desktop pill + mobile drawer) with identical name+value', () => {
      // This is the regression fence for the
      // `?filter.v.option.size=M&filter.v.option.size=M` bug.
      const form = makeForm(`
        <input type="checkbox" data-filter-input name="filter.v.option.size" value="M" checked>
        <div class="collection-filter-drawer">
          <input type="checkbox" data-filter-input name="filter.v.option.size" value="M" checked>
        </div>
      `)
      toolbar = new CollectionToolbar(form)

      const params = getParams(toolbar.buildUrl())

      expect(params.getAll('filter.v.option.size')).toEqual(['M'])
    })

    it('keeps distinct values of the same filter as separate params (multi-select)', () => {
      const form = makeForm(`
        <input type="checkbox" data-filter-input name="filter.v.option.size" value="M" checked>
        <input type="checkbox" data-filter-input name="filter.v.option.size" value="L" checked>
        <div class="collection-filter-drawer">
          <input type="checkbox" data-filter-input name="filter.v.option.size" value="M" checked>
          <input type="checkbox" data-filter-input name="filter.v.option.size" value="L" checked>
        </div>
      `)
      toolbar = new CollectionToolbar(form)

      const params = getParams(toolbar.buildUrl())

      expect(params.getAll('filter.v.option.size').sort()).toEqual(['L', 'M'])
    })
  })

  describe('mirrorToTwin()', () => {
    it('flips a twin checkbox with matching name+value', () => {
      const form = makeForm(`
        <input id="a" type="checkbox" data-filter-input name="filter.v.option.color" value="Beige" checked>
        <div class="collection-filter-drawer">
          <input id="b" type="checkbox" data-filter-input name="filter.v.option.color" value="Beige" checked>
        </div>
      `)
      toolbar = new CollectionToolbar(form)
      const a = form.querySelector<HTMLInputElement>('#a')!
      const b = form.querySelector<HTMLInputElement>('#b')!

      a.checked = false
      toolbar.mirrorToTwin(a)

      // Regression fence for the "uncheck Beige but it stays selected" bug
      // caused by a twin staying server-rendered `checked`.
      expect(b.checked).toBe(false)
    })

    it('leaves same-name siblings with different values unchanged', () => {
      const form = makeForm(`
        <input id="beige" type="checkbox" data-filter-input name="filter.v.option.color" value="Beige" checked>
        <input id="ash" type="checkbox" data-filter-input name="filter.v.option.color" value="Ash" checked>
        <div class="collection-filter-drawer">
          <input id="beige-twin" type="checkbox" data-filter-input name="filter.v.option.color" value="Beige" checked>
        </div>
      `)
      toolbar = new CollectionToolbar(form)
      const beige = form.querySelector<HTMLInputElement>('#beige')!
      const ash = form.querySelector<HTMLInputElement>('#ash')!
      const beigeTwin = form.querySelector<HTMLInputElement>('#beige-twin')!

      beige.checked = false
      toolbar.mirrorToTwin(beige)

      expect(beigeTwin.checked).toBe(false) // same name+value → mirrored
      expect(ash.checked).toBe(true)        // same name, different value → untouched
    })

    it('mirrors value for non-checkbox/radio inputs (price range)', () => {
      const form = makeForm(`
        <input id="p1" type="number" data-filter-input name="filter.v.price.gte" value="10">
        <div class="collection-filter-drawer">
          <input id="p2" type="number" data-filter-input name="filter.v.price.gte" value="10">
        </div>
      `)
      toolbar = new CollectionToolbar(form)
      const p1 = form.querySelector<HTMLInputElement>('#p1')!
      const p2 = form.querySelector<HTMLInputElement>('#p2')!

      p1.value = '25'
      toolbar.mirrorToTwin(p1)

      expect(p2.value).toBe('25')
    })
  })

  describe('onChange (debounce + drawer gating)', () => {
    it('coalesces rapid changes into a single dispatch after 350ms', () => {
      vi.useFakeTimers()

      const form = makeForm(`
        <input type="checkbox" data-filter-input name="filter.v.option.size" value="XS">
        <input type="checkbox" data-filter-input name="filter.v.option.size" value="S">
        <input type="checkbox" data-filter-input name="filter.v.option.size" value="M">
      `)
      toolbar = new CollectionToolbar(form)

      const spy = vi.fn()
      form.addEventListener(TOOLBAR_CHANGE_EVENT, spy)

      for (const input of form.querySelectorAll<HTMLInputElement>('input')) {
        input.checked = true
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }

      // Before the debounce window ends, nothing has fired yet.
      vi.advanceTimersByTime(349)
      expect(spy).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('does not dispatch on changes inside the mobile drawer (wait for Apply)', () => {
      vi.useFakeTimers()

      const form = makeForm(`
        <div class="collection-filter-drawer">
          <input type="checkbox" data-filter-input name="filter.v.option.size" value="M">
        </div>
      `)
      toolbar = new CollectionToolbar(form)

      const spy = vi.fn()
      form.addEventListener(TOOLBAR_CHANGE_EVENT, spy)

      const input = form.querySelector<HTMLInputElement>('input')!
      input.checked = true
      input.dispatchEvent(new Event('change', { bubbles: true }))

      vi.advanceTimersByTime(1000)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('onSubmit', () => {
    it('prevents default and dispatches change on a normal submit', () => {
      const form = makeForm(`
        <input type="checkbox" data-filter-input name="filter.v.option.size" value="M" checked>
        <button id="go" type="submit">Go</button>
      `)
      toolbar = new CollectionToolbar(form)

      const changeSpy = vi.fn<(e: CustomEvent<ToolbarChangeDetail>) => void>()
      form.addEventListener(TOOLBAR_CHANGE_EVENT, changeSpy as EventListener)

      const submit = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submit)

      expect(submit.defaultPrevented).toBe(true)
      expect(changeSpy).toHaveBeenCalledTimes(1)
      expect(changeSpy.mock.calls[0][0].detail.url).toContain('filter.v.option.size=M')
    })

    it('drawer Apply navigates to a deduped URL (no AJAX dispatch, no native submit)', () => {
      // Native form submission would serialize every input — and filter
      // inputs are rendered twice (desktop pill + drawer) with identical
      // name+value pairs, producing `?size=M&size=M` in the URL. We
      // intercept and route through `buildUrl()` instead.
      const form = makeForm(`
        <input type="checkbox" data-filter-input name="filter.v.option.size" value="M" checked>
        <div class="collection-filter-drawer">
          <input type="checkbox" data-filter-input name="filter.v.option.size" value="M" checked>
          <button id="apply" type="submit">Apply</button>
        </div>
      `)
      toolbar = new CollectionToolbar(form)

      const changeSpy = vi.fn()
      form.addEventListener(TOOLBAR_CHANGE_EVENT, changeSpy)

      const originalHref = window.location.href
      const apply = form.querySelector<HTMLButtonElement>('#apply')!
      const submit = new SubmitEvent('submit', {
        bubbles: true,
        cancelable: true,
        submitter: apply,
      })
      form.dispatchEvent(submit)

      expect(submit.defaultPrevented).toBe(true)
      expect(changeSpy).not.toHaveBeenCalled()
      expect(window.location.href).not.toBe(originalHref)
      // URL carries the filter param exactly once, not twice.
      expect(window.location.search).toContain('filter.v.option.size=M')
      expect(
        (window.location.search.match(/filter\.v\.option\.size=M/g) || []).length,
      ).toBe(1)
    })
  })
})
