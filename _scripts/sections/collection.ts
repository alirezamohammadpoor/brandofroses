import { fetchDom } from '@/core/utils/dom'

import ResultsSection from '@/sections/results'
import CollectionFilterDrawer from '@/components/drawer/collectionFilterDrawer'
import {
  TOOLBAR_CHANGE_EVENT,
  type ToolbarChangeDetail,
} from '@/components/collectionToolbar'
import type { ThemeEditorSectionUnloadEvent } from '@/types/shopify'
import type { TaxiNavigateOutEvent, TaxiNavigateEndEvent } from '@/types/taxi'

const SELECTORS = {
  results: '[data-collection-results]',
}

const CLASSES = {
  isFetching: 'is-fetching',
}

export default class CollectionSection extends ResultsSection {
  static TYPE = 'collection'

  filterDrawer: CollectionFilterDrawer | null

  #onToolbarChange: (e: Event) => void
  #onPopState: (e: PopStateEvent) => void
  #inFlight: AbortController | null

  constructor(container: HTMLElement) {
    super(container)

    const drawerEl = this.qs(CollectionFilterDrawer.SELECTOR)
    this.filterDrawer = drawerEl ? new CollectionFilterDrawer(drawerEl) : null

    this.#inFlight = null
    this.#onToolbarChange = this.onToolbarChange.bind(this)
    this.#onPopState = this.onPopState.bind(this)
    this.container.addEventListener(TOOLBAR_CHANGE_EVENT, this.#onToolbarChange)
    window.addEventListener('popstate', this.#onPopState)
  }

  onUnload(e: ThemeEditorSectionUnloadEvent) {
    this.#teardown()
    window.removeEventListener('popstate', this.#onPopState)
    super.onUnload(e)
  }

  /**
   * SectionManager doesn't re-mount sections on Taxi SPA navigation — it
   * only handles Shopify Theme Editor load/unload events. So we own the
   * section's lifecycle across Taxi nav ourselves: tear down the drawer
   * (which cleans up its backdrop and document listeners) when navigating
   * away, and re-mount on the new DOM when navigation completes.
   */
  onNavigateOut(e: TaxiNavigateOutEvent) {
    super.onNavigateOut(e)
    this.#teardown()
  }

  onNavigateEnd(e: TaxiNavigateEndEvent) {
    super.onNavigateEnd(e)

    // The container element was swapped out entirely by Taxi. Re-find the
    // current collection section's container (if still on a collection page)
    // and refresh `container` + the ids derived from it — otherwise `this.id`
    // and `this.parentId` still point at the old (detached) section, and the
    // AJAX `fetchResultsDom` below would 404 because `?section_id=` is stale.
    const freshContainer = document.querySelector<HTMLElement>('[data-section-type="collection"]')
    if (!freshContainer) return
    this.container = freshContainer
    this.id = this.dataset.sectionId
    this.parent = this.container.parentElement as HTMLElement
    this.parentId = this.parent.id

    this.container.addEventListener(TOOLBAR_CHANGE_EVENT, this.#onToolbarChange)

    const drawerEl = this.qs(CollectionFilterDrawer.SELECTOR)
    this.filterDrawer = drawerEl ? new CollectionFilterDrawer(drawerEl) : null
  }

  /**
   * Common teardown for both the Theme Editor onUnload path and the Taxi
   * onNavigateOut path: cancel any in-flight fetch, drop the toolbar listener,
   * and destroy the drawer (releases its backdrop + focus trap + document
   * listeners).
   */
  #teardown() {
    this.container.removeEventListener(TOOLBAR_CHANGE_EVENT, this.#onToolbarChange)
    this.#inFlight?.abort()
    this.#inFlight = null
    this.filterDrawer?.destroy()
    this.filterDrawer = null
  }

  /**
   * Back / forward navigation within the current collection page. Our AJAX
   * filter/sort changes push history entries, so popping one means the user
   * wants the DOM restored to match the URL they're returning to. Taxi
   * handles cross-page popstates via its own nav flow, so by the time we get
   * here we're guaranteed to still be on the same collection page.
   */
  async onPopState() {
    const resultsEl = this.qs(SELECTORS.results)
    if (!resultsEl) return

    const url = window.location.pathname + window.location.search
    await this.#runFetch(resultsEl, url, 'popstate')
  }

  async onToolbarChange(e: Event) {
    const detail = (e as CustomEvent<ToolbarChangeDetail>).detail
    if (!detail?.url) return

    const resultsEl = this.qs(SELECTORS.results)
    if (!resultsEl) return

    // Push the URL first so the back button works even if fetch fails.
    window.history.pushState({}, '', detail.url)

    await this.#runFetch(resultsEl, detail.url, 'filter')
  }

  /**
   * Shared fetch/swap pipeline for popstate + toolbar changes. Handles the
   * cancellation dance: a fresher call aborts ours via the shared
   * `#inFlight` slot, our awaited fetch rejects with AbortError, and we
   * bail out without touching UI state the newer call now owns. The
   * `localAborter === this.#inFlight` guard on the cleanup path prevents
   * a superseded call's `finally` from clobbering the newer controller's
   * slot or clearing its `is-fetching` class mid-flight.
   */
  async #runFetch(resultsEl: HTMLElement, url: string, label: string) {
    this.#inFlight?.abort()
    const localAborter = new AbortController()
    this.#inFlight = localAborter

    resultsEl.classList.add(CLASSES.isFetching)
    resultsEl.setAttribute('aria-busy', 'true')

    try {
      const newInner = await this.fetchResultsDom(url, localAborter.signal)
      // Between the `await` above and here, a newer filter change may have
      // aborted us; bail out before swapping stale DOM over newer state.
      if (localAborter.signal.aborted) return
      if (newInner) this.swapResults(resultsEl, newInner)
    }
    catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return
      console.warn(`[collection] ${label} fetch failed`, err)
    }
    finally {
      // Only clear shared state if we're still the active fetch — a
      // superseding call may have already taken over `#inFlight` and we
      // don't want to yank its `is-fetching` class or null its aborter.
      if (this.#inFlight === localAborter) {
        resultsEl.classList.remove(CLASSES.isFetching)
        resultsEl.setAttribute('aria-busy', 'false')
        this.#inFlight = null
      }
    }
  }

  /**
   * Fetch the section at the given URL and extract the matching
   * `[data-collection-results]` element from it. Threads the caller's
   * abort signal through to the underlying `fetchDom` so superseded
   * requests actually cancel at the network layer.
   */
  async fetchResultsDom(url: string, signal?: AbortSignal): Promise<HTMLElement | null> {
    const fetchUrl = new URL(url, window.location.origin)
    fetchUrl.searchParams.set('section_id', this.id)
    fetchUrl.searchParams.set('t', Date.now().toString())

    const dom = await fetchDom(fetchUrl, signal)
    if (!dom) return null
    const section = dom.getElementById(this.parentId)
    return (section?.querySelector(SELECTORS.results) as HTMLElement | null) ?? null
  }

  /**
   * Swap the inner HTML of the current results container with the new one,
   * then tear down + re-mount the view-level standalone components
   * (pill-dropdowns, collection toolbar, mobile drawer, product cards etc.)
   * so they bind to the fresh DOM. Restores the open filter dropdown after
   * the swap so the user doesn't lose their place.
   */
  swapResults(current: HTMLElement, fresh: HTMLElement) {
    // Capture which pill-dropdowns were open BEFORE the swap so we can
    // restore them after. `.pill-dropdown` gets `data-active-key="<key>"`
    // from PillDropdown.open(); we record the pill's data-component tag +
    // panel key so we can match the equivalent pill in the new DOM.
    const openPills: Array<{ panelKey: string; isSort: boolean }> = []
    for (const pill of current.querySelectorAll<HTMLElement>('.pill-dropdown[data-active-key]')) {
      const key = pill.dataset.activeKey
      if (!key) continue
      openPills.push({
        panelKey: key,
        isSort: pill.classList.contains('pill-dropdown--sort'),
      })
    }

    const remount = window.app?.remountViewStandalones
    if (typeof remount === 'function') remount('destroy')

    current.innerHTML = fresh.innerHTML

    if (typeof remount === 'function') remount('mount')

    // Re-wire the drawer component on the newly rendered drawer element if
    // present. The drawer lives inside the swapped container, so the old
    // instance was torn down with the rest of the standalones.
    this.filterDrawer?.destroy()
    const drawerEl = this.qs(CollectionFilterDrawer.SELECTOR)
    this.filterDrawer = drawerEl ? new CollectionFilterDrawer(drawerEl) : null

    // Restore the open filter/sort dropdown(s). Clicking the matching toggle
    // runs through the new PillDropdown instance's handler, which handles
    // `is-active`, aria-expanded, and is-open state consistently.
    for (const { panelKey, isSort } of openPills) {
      const scope = isSort
        ? current.querySelector<HTMLElement>('.pill-dropdown--sort')
        : current.querySelector<HTMLElement>('.pill-dropdown:not(.pill-dropdown--sort)')
      const toggle = scope?.querySelector<HTMLButtonElement>(
        `[data-pill-toggle][data-panel-key="${CSS.escape(panelKey)}"]`,
      )
      toggle?.click()
    }
  }
}
