import BaseComponent from '@/components/base'
import ScrollSection from '@/components/scrollSection'

/**
 * ProductRecommendations
 *
 * Hydrates the "You may also like" section on the PDP via Shopify's
 * Section Rendering API. Initial page render is an empty placeholder
 * element:
 *
 *   <div
 *     data-component="product-recommendations"
 *     data-url="/recommendations/products?section_id=...&product_id=...&limit=12&intent=related"
 *   ></div>
 *
 * On mount we fetch that URL; the response is Shopify's full
 * `sections/product-recommendations.liquid` HTML with `recommendations`
 * populated. We pull out the inner content node
 * (`[data-product-recommendations-content]`) and swap it into this
 * element, then wire a ScrollSection instance to the new scroll row for
 * prev/next buttons. The nested ScrollSection isn't discoverable by the
 * standalone-mount loop (that only runs once at page mount / Taxi
 * navigate-end, before this async swap completes), so we own its
 * lifecycle manually.
 *
 * If the fetch fails or returns no products, the element stays empty.
 */
export default class ProductRecommendations extends BaseComponent {
  static TYPE = 'product-recommendations'

  #scrollSection: ScrollSection | null = null
  #aborter: AbortController

  constructor(el: HTMLElement) {
    super(el)

    this.#aborter = new AbortController()
    void this.load()
  }

  async load() {
    const url = this.el.dataset.url
    if (!url) return

    // Flag the placeholder as loading so assistive tech knows the rail is
    // being populated. Mirrors the `aria-busy` dance on `[data-collection-
    // results]` in the collection section, so the two async-rail patterns
    // on the site signal their in-flight state consistently.
    this.el.setAttribute('aria-busy', 'true')

    try {
      const res = await fetch(url, { signal: this.#aborter.signal })
      if (!res.ok) return

      const html = await res.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const fresh = doc.querySelector<HTMLElement>('[data-product-recommendations-content]')
      if (!fresh) return

      this.el.replaceChildren(fresh)

      const scrollEl = this.el.querySelector<HTMLElement>(
        `[data-component="${ScrollSection.TYPE}"]`,
      )
      if (scrollEl) {
        this.#scrollSection = new ScrollSection(scrollEl)
      }
    }
    catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return
      console.warn('[product-recommendations] fetch failed', err)
    }
    finally {
      this.el.setAttribute('aria-busy', 'false')
    }
  }

  destroy() {
    this.#aborter.abort()
    this.#scrollSection?.destroy()
    this.#scrollSection = null
    super.destroy()
  }
}
