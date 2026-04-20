# Shopify Theme Template

Shopify Online Store 2.0 theme built on [Cadaver 2.0](https://github.com/stefbowerman/cadaver-2.0), extended with:
- Full a11y pass (WCAG 2.2 patterns on product card, carousel, modal, cart drawer, forms, prices)
- TypeScript component architecture safe for Taxi.js SPA navigation (no inline `<script>` in Liquid)
- Three-tier branch strategy with auto-deploy (see `README.md`)

> This is a **template branch**. See `README.md` for how to bootstrap a new project from it, including what to scrub per brand.

## Stack

- **Platform:** Shopify Online Store 2.0
- **Boilerplate base:** cadaver-2.0
- **CSS:** Tailwind V4 (via `_styles/app.css`)
- **JS:** TypeScript, Vite, Taxi.js (SPA navigation)
- **Architecture:** Section/component pattern — sections registered in `_scripts/app.ts`, components auto-init via `data-component` attributes

## Design system (override per brand in `_styles/app.css` `@theme` block)

### Design tokens (code-owned, not theme editor settings)

| Token | Default | Purpose |
|---|---|---|
| `--color-bg` | neutral | Page background |
| `--color-fg` | neutral | Text, borders, icons |
| `--color-muted` | neutral | Secondary text, labels |

Type scale and spacing are exposed as Tailwind utilities (`text-display`, `text-h1`…`text-label`, `container`). Change values in `_styles/app.css`; classnames stay.

### Rules (do not violate without an inline-comment reason)

- **Always use Tailwind classes for styling. Never write raw CSS.** Exceptions must be commented inline with a reason.
- **Always use `const`/`let` and arrow functions in JavaScript. Never use `var`.**
- **Never use inline `<script>` in any Liquid file for interactive behavior.** Taxi.js SPA navigation does not re-execute inline scripts after page transitions. All event listeners and DOM behavior live in TypeScript components (`_scripts/components/`), extended from `BaseComponent`, wired in `constructor()` and cleaned up in `destroy()`. Register standalone components in `app.ts`.
- **Translations:** every user-facing string uses the `t` filter. Locale strings in `locales/en.default.json`, exported to JS via `snippets/head-scripts.liquid` → `window.app.strings`.
- **Never co-author commits.** Do not add `Co-Authored-By: Claude...` trailers to git commit messages. Commits are authored solely by the user.

## Data contracts (customize per brand)

These conventions are assumed by the shipped product/cart/gallery snippets. Any brand adopting this template inherits them unless overridden.

| Contract | Where | What for |
|---|---|---|
| Swatches | Shopify native `option.values[].swatch`, color option named "Color" | Color swatch rendering on product card + variant picker |
| Gallery mapping | `image.alt` = color name | Per-color gallery rotation on PDP |
| Product tags | `badge:best-seller`, `badge:new` prefix convention | Badge rendering on product card |
| PDP breadcrumb parent | `product.metafields.custom.primary_collection` (Collection ref, single) | Merchant-pinned parent collection — fallback chain: metafield → arrived-from → `product.collections.first` |
| Copy | "Add to bag" (not "Add to cart"), "Bag" (not "Cart"), "Checkout" | Change in `locales/en.default.json` if you prefer "Cart" |

## Key architecture notes (do not remove)

- Global sections (header, footer, mobile-menu, ajax-cart) are registered in `_scripts/app.ts`. Keep `data-section-type` and `data-component` attributes intact when restyling.
- `config/settings_data.json` must have section defaults for all global sections or pages break.
- Design tokens are code-owned in `_styles/app.css` `@theme` block — not exposed as theme editor settings.
- Locale strings → JS bridge: `snippets/head-scripts.liquid` → `window.app.strings`.

## Build

```
bun run dev          # Vite watcher
bun run build        # Production build
shopify theme dev    # Theme preview (requires shopify.theme.toml configured)
```

## Quality gates

```
shopify theme check  # lint Liquid, expected: 0 offenses
bun run build        # TypeScript compile + bundle, expected: 0 errors
```
