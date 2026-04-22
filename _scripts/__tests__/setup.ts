/**
 * Vitest global setup
 *
 * Stubs `window.app` before any test file imports application code.
 *
 * Why: `_scripts/core/cartAPI.ts` reads `window.app.routes` at module-init
 * time, and `_scripts/components/base.ts` imports cartAPI. That means every
 * component import transitively triggers the read. In a real page the
 * shape is populated by `snippets/head-scripts.liquid`; in tests we have
 * to provide it.
 *
 * Shape must match `_scripts/types/window.d.ts`.
 */

window.app = {
  strings: {
    addToCart: 'Add to cart',
    soldOut: 'Sold out',
    unavailable: 'Unavailable',
    adding: 'Adding…',
    added: 'Added',
  },
  routes: {
    root_url: '/',
    predictive_search_url: '/search/suggest',
    cart_add_url: '/cart/add',
    cart_change_url: '/cart/change',
    cart_update_url: '/cart/update',
    cart_clear_url: '/cart/clear',
    cart_url: '/cart',
    account_addresses_url: '/account/addresses',
    account_url: '/account',
  },
}
