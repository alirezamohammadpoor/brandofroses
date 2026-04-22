import BaseComponent from '@/components/base'

const SUBMIT_DEBOUNCE_MS = 350

export const TOOLBAR_CHANGE_EVENT = 'collection-toolbar:change'

export type ToolbarChangeDetail = { url: string }

/**
 * CollectionToolbar
 *
 * Wraps the collection filter + sort `<form>`. Serializes the form state into
 * a URL on every filter/sort change and dispatches `collection-toolbar:change`
 * bubbling from the form element. `CollectionSection` listens for this event
 * and handles the AJAX grid + toolbar swap.
 *
 * The form itself is not submitted — this component intentionally prevents
 * default navigation. Falls back cleanly if JS is disabled: the form is a
 * plain `method="get"` so users can click any link inside (e.g. the RESET
 * link, or a filter chip's remove ×) and get a regular page navigation.
 *
 * Target element: the `<form>` carrying `data-component="collection-toolbar"`.
 */
export default class CollectionToolbar extends BaseComponent {
  static TYPE = 'collection-toolbar'

  form: HTMLFormElement

  #onChange: (e: Event) => void
  #onSubmit: (e: Event) => void
  #submitTimer: ReturnType<typeof setTimeout> | null

  constructor(el: HTMLElement) {
    super(el)
    this.form = el as HTMLFormElement
    this.#submitTimer = null

    this.#onChange = this.onChange.bind(this)
    this.#onSubmit = this.onSubmit.bind(this)
    this.form.addEventListener('change', this.#onChange)
    this.form.addEventListener('submit', this.#onSubmit)
  }

  destroy() {
    this.form.removeEventListener('change', this.#onChange)
    this.form.removeEventListener('submit', this.#onSubmit)
    if (this.#submitTimer !== null) {
      clearTimeout(this.#submitTimer)
      this.#submitTimer = null
    }
    super.destroy()
  }

  /**
   * Prevent the form's native GET submission (e.g. from Enter-in-a-price-
   * input or future submit buttons on desktop). We route everything through
   * the AJAX path via `onChange`. The mobile drawer Apply button still
   * submits the form traditionally — that path is a full navigation by
   * design since the drawer can't stay open across a DOM swap.
   */
  onSubmit(e: Event) {
    // The drawer Apply button has no special class of its own, but it lives
    // inside .collection-filter-drawer. Its click fires submit from inside
    // the drawer; let it through.
    const submitter = (e as SubmitEvent).submitter as HTMLElement | null
    if (submitter?.closest('.collection-filter-drawer')) return

    e.preventDefault()
    this.dispatchChange()
  }

  onChange(e: Event) {
    const target = e.target as HTMLElement
    if (!target.matches('[data-filter-input], [data-sort-input]')) return

    // The form contains two copies of every filter input — one in the
    // desktop pill panels, one in the mobile drawer accordion — with
    // identical `name`+`value` pairs. If we don't sync their state, toggling
    // the visible copy leaves the hidden copy at its server-rendered value,
    // and FormData serializes both → filter state never changes.
    this.mirrorToTwin(target as HTMLInputElement)

    // Mobile drawer uses an explicit "Apply" submit button — don't fire the
    // change event from inside it so the user can pick multiple values before
    // committing.
    if (target.closest('.collection-filter-drawer')) return

    // Coalesce rapid selections (XS → S → M) into one URL build + dispatch.
    if (this.#submitTimer !== null) clearTimeout(this.#submitTimer)
    this.#submitTimer = setTimeout(() => {
      this.#submitTimer = null
      this.dispatchChange()
    }, SUBMIT_DEBOUNCE_MS)
  }

  /**
   * Copy the state of `input` to any other input in the form with the same
   * `name`+`value` (for checkbox / radio) or same `name` (for range inputs).
   * This keeps the desktop pill inputs and the mobile drawer inputs in sync
   * so form serialization reflects a single consistent state.
   */
  mirrorToTwin(input: HTMLInputElement) {
    if (!input.name) return

    const byName = this.form.querySelectorAll<HTMLInputElement>(
      `input[name="${CSS.escape(input.name)}"]`,
    )

    for (const twin of byName) {
      if (twin === input) continue

      if (input.type === 'checkbox' || input.type === 'radio') {
        // Multi-select filters share the same name across all values — only
        // mirror when the twin's value matches too.
        if (twin.value !== input.value) continue
        if (twin.checked !== input.checked) twin.checked = input.checked
      }
      else {
        if (twin.value !== input.value) twin.value = input.value
      }
    }
  }

  dispatchChange() {
    const url = this.buildUrl()
    this.form.dispatchEvent(
      new CustomEvent<ToolbarChangeDetail>(TOOLBAR_CHANGE_EVENT, {
        detail: { url },
        bubbles: true,
      }),
    )
  }

  buildUrl(): string {
    // The form holds duplicate inputs (desktop pill + mobile drawer) with
    // identical name+value pairs. FormData includes every checked input, so
    // `filter.v.option.size=M` would appear twice in the URL without this
    // dedup. Key by `name\x00value` to collapse exact matches while still
    // allowing the same name with different values (the normal multi-select
    // case) through.
    const data = new FormData(this.form)
    const seen = new Set<string>()
    const params = new URLSearchParams()
    for (const [k, v] of data) {
      if (v === '' || v === null || v === undefined) continue
      const value = v.toString()
      const key = `${k}\x00${value}`
      if (seen.has(key)) continue
      seen.add(key)
      params.append(k, value)
    }
    const qs = params.toString()
    return qs ? `${window.location.pathname}?${qs}` : window.location.pathname
  }
}
