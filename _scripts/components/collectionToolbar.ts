import BaseComponent from '@/components/base'

/**
 * CollectionToolbar
 *
 * Wraps the collection filter + sort `<form>`. Auto-submits on any filter or
 * sort input change so URL params update and the page reloads with the new
 * collection state.
 *
 * Submission strategy: traditional GET form navigation (Shopify renders the
 * filtered/sorted collection on reload). An AJAX swap is a planned follow-up
 * that would intercept submission, call `fetchResults`, and replace the
 * results grid + toolbar in place.
 *
 * Target element: the `<form>` carrying `data-component="collection-toolbar"`.
 */
export default class CollectionToolbar extends BaseComponent {
  static TYPE = 'collection-toolbar'

  form: HTMLFormElement

  #onChange: (e: Event) => void

  constructor(el: HTMLElement) {
    super(el)
    this.form = el as HTMLFormElement

    this.#onChange = this.onChange.bind(this)
    this.form.addEventListener('change', this.#onChange)
  }

  destroy() {
    this.form.removeEventListener('change', this.#onChange)
    super.destroy()
  }

  onChange(e: Event) {
    const target = e.target as HTMLElement
    if (!target.matches('[data-filter-input], [data-sort-input]')) return

    // Mobile drawer uses an explicit "Apply" submit button — don't auto-submit
    // from inside it so the user can check multiple values before applying.
    if (target.closest('.collection-filter-drawer')) return

    this.form.submit()
  }
}
