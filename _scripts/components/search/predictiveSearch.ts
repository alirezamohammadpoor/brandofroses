import BaseComponent from '@/components/base'

/**
 * PredictiveSearch
 *
 *   <div class="pill-dropdown" data-component="pill-dropdown">
 *     <nav>
 *       …toggles…
 *       <div class="pill-dropdown__nav-search-slot">
 *         {% render 'search-inline' %}      <!-- contains input[name="q"] -->
 *       </div>
 *       …more toggles…
 *     </nav>
 *     <div class="pill-dropdown__panel--search">
 *       <div class="pill-dropdown__panel-inner"
 *            data-component="predictive-search" data-debounce="200">
 *         <div data-predictive-results></div>
 *       </div>
 *     </div>
 *   </div>
 *
 * The component mounts on the panel-inner and reaches across the pill to
 * find the search input in the nav row. After a debounced `input` event,
 * fetches the `predictive-search` section via Shopify's Section Rendering
 * API (`/search/suggest?q=…&section_id=predictive-search`) and swaps the
 * response into `[data-predictive-results]`.
 *
 * Empty input clears the results. In-flight requests are aborted when a
 * newer keystroke fires so a slow response can't overwrite a fresher one.
 */
const SECTION_ID = 'predictive-search'
// Shopify's predictive search caps `resources[limit]` at 10 per resource type.
// Request the max so the snippet can render up to 6 products + 3 queries
// (the snippet trims down via its own limits).
const RESOURCE_PARAMS = 'resources[type]=product,query&resources[limit]=10&resources[limit_scope]=each'

export default class PredictiveSearch extends BaseComponent {
  static TYPE = 'predictive-search'

  #input: HTMLInputElement | null
  #target: HTMLElement | null
  #debounceMs: number
  #aborter: AbortController | null = null
  #debounceTimer: ReturnType<typeof setTimeout> | null = null

  #onInputBound: () => void

  constructor(el: HTMLElement) {
    super(el)

    const pill = this.el.closest<HTMLElement>('.pill-dropdown')
    this.#input = pill?.querySelector<HTMLInputElement>('input[name="q"]') ?? null
    this.#target = this.el.querySelector<HTMLElement>('[data-predictive-results]')
    this.#debounceMs = Number(this.el.dataset.debounce ?? 200)

    if (!this.#input || !this.#target) {
      console.warn('[predictive-search] missing input or [data-predictive-results] target')
      return
    }

    this.#onInputBound = this.onInput.bind(this)
    this.#input.addEventListener('input', this.#onInputBound)
  }

  destroy() {
    if (this.#input) {
      this.#input.removeEventListener('input', this.#onInputBound)
    }
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer)
      this.#debounceTimer = null
    }
    this.#aborter?.abort()
    this.#aborter = null
    super.destroy()
  }

  onInput() {
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer)
    this.#debounceTimer = setTimeout(() => {
      this.#debounceTimer = null
      void this.fetchResults()
    }, this.#debounceMs)
  }

  async fetchResults() {
    const target = this.#target
    const input = this.#input
    if (!target || !input) return

    const q = input.value.trim()
    if (q === '') {
      this.#aborter?.abort()
      this.#aborter = null
      target.replaceChildren()
      target.removeAttribute('data-has-results')
      return
    }

    this.#aborter?.abort()
    this.#aborter = new AbortController()

    const url = `/search/suggest?q=${encodeURIComponent(q)}&section_id=${SECTION_ID}&${RESOURCE_PARAMS}`
    target.setAttribute('aria-busy', 'true')

    try {
      const res = await fetch(url, { signal: this.#aborter.signal })
      if (!res.ok) return

      const html = await res.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const fresh = doc.querySelector<HTMLElement>('.predictive-search-results')
      if (!fresh) {
        target.replaceChildren()
        target.removeAttribute('data-has-results')
        return
      }

      target.replaceChildren(fresh)
      target.setAttribute('data-has-results', '')
    }
    catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return
      console.warn('[predictive-search] fetch failed', err)
    }
    finally {
      target.setAttribute('aria-busy', 'false')
    }
  }
}
