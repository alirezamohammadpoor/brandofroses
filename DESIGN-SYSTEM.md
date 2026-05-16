# Brand of Roses — Design System

The Figma file is the **source of truth** for tokens and styles. Code (`_styles/app.css` `@theme` block and `@utility` declarations) mirrors Figma. When something needs to change, **update Figma first**, then reconcile the code.

Figma file: `Brand of Roses` (`fileKey: GitXLnkHnxx5nSsFpjFppc`)
- Variable collection: **`Colour`** (8 colors, "Default" mode)
- Text Styles: **8 styles** (Display/L, Display, Heading/H1, Heading/H2, Body/Regular, Button, Label, Tiny)

## Colors (8 tokens)

| Figma variable | CSS token | Hex | Purpose |
|---|---|---|---|
| `bg` | `--color-bg` | `#FAFAF8` | Page background |
| `bg-surface` | `--color-bg-surface` | `#F5F0E8` | Drawers, footers, raised surfaces |
| `bg-placeholder` | `--color-bg-placeholder` | `#E8E5E0` | Image skeletons (use `bg-bg-placeholder` utility) |
| `bg-editorial` | `--color-bg-editorial` | `#D9D4CC` | Editorial content blocks (use `bg-bg-editorial` utility) |
| `fg` | `--color-fg` | `#1A1A18` | Primary text |
| `fg-warm` | `--color-fg-warm` | `#2C2826` | On-surface text — warmer, sits on `bg-surface` (use `bg-fg-warm`, `text-fg-warm`) |
| `muted` | `--color-muted` | `#8A8580` | Secondary text, dividers |
| `accent` | `--color-accent` | `#722F37` | Error states only |

**No state-color tokens** — hover/active states use opacity or swap to existing tokens (e.g. `:hover { color: var(--color-muted) }`).

**Off-system colors** (not tokens, intentionally raw):
- `#59544D` — 404 hero (campaign-specific, set per-section via theme editor)
- Product color swatches (`#141414`, `#734021`, `#94918F`, etc.) — content, not chrome
- `#FFFFFF` / `#000000` — interactive hotspots / mock-up labels only

## Type ramp (8 styles)

**Stance: editorial / Patta-style — Medium 500 minimum across the system.** Hierarchy is carried by **size + tracking**, not weight. All 8 styles use Inter Medium (in Figma) / Helvetica Medium (in production). `font-bold` is for deliberate emphasis (sale prices, 404 numerals). `font-light` is for editorial accents (collection title).

| Figma style | CSS utility | Spec | Use |
|---|---|---|---|
| `Display/L` | `text-display-l` | 96 / 100 / Medium / sentence | Campaign heroes, large decoration |
| `Display` | `text-display` | 64 / 70 / Medium / sentence | Page heroes |
| `Heading/H1` | `text-h1` | 40 / 44 / Medium / sentence | Page titles |
| `Heading/H2` | `text-h2` | 24 / 28 / Medium / sentence | Section headings |
| `Body` | `text-body` | 16 / 24 / Medium / sentence | Default body |
| `Button` | `text-button` | 12 / 16 / Medium / UPPER / 0.5px | Buttons, prices, form labels |
| `Label` | `text-label` | 12 / 16 / Medium / UPPER / 0.08em | Eyebrows, captions, nav, filter pills |
| `Tiny` | `text-tiny` | 10 / 14 / Medium / UPPER / 0.5px | Badges, micro-labels, color counts |

Ratio: 10 → 12 → 16 → 24 → 40 → 64 → 96 (~1.6×). Deliberate, not jagged.

**Per-call overrides** (avoid making a new utility):
- PDP info-column labels need tighter tracking → `text-label tracking-[0.3px]`
- Sale price needs emphasis vs. Medium body → `text-accent font-bold`
- Editorial light accent (collection title) → `text-h1 font-light`
- Long-form article body (RTE content) → can override with `font-normal` if Medium feels heavy in paragraph reading

**Off-system text** (intentionally raw):
- 404 numerals (200px / 120px) — campaign-specific
- "BRAND OF ROSES" small wordmark (10/12 px Bold UPPER) — brand mark, distinct from system
- Decorative arrow chars (28 px Semi Bold)
- UI control glyphs (14 px) — `−` / `+` counters

## Explicit weight policy

Chrome elements (buttons, breadcrumbs, form labels, nav items, cart line items, badges, pills) **must set their weight explicitly** — either via a `text-*` utility (which bakes in Medium 500) or via an inline `font-medium` class. **Never rely on body inheritance** for chrome weight.

Why: body inheritance is fragile. If body weight ever changes (e.g. reverting `text-body` to Regular for long-form readability), every chrome element that was silently inheriting Medium would also revert to Regular. Explicit weights mean each element survives stance shifts in either direction.

What "chrome" means in practice:
- Buttons (submit, navigation, action)
- Form labels + inputs (search input inside header pill, newsletter input, variant picker labels)
- Cart drawer line items + meta + qty controls + remove buttons + subtotal + free shipping message
- Breadcrumbs
- Mobile menu primary + category links
- Pill dropdown items + dividers
- Badges + tiny micro-labels
- Footer columns + newsletter

What's NOT chrome (use body / can rely on inheritance):
- Article body content (`.rte` long-form)
- Product descriptions
- Hero descriptions
- Anywhere we want the Regular reading weight intentionally

State patterns (intentional Regular default, Medium on active) are an explicit chrome exception — keep them explicit too:
- Variant size button: default unweighted, `peer-checked:font-medium`
- EU/US/UK system toggle: `font-normal` default, `aria-pressed:font-medium` active

## Font

```
font-family: Helvetica, 'Helvetica Neue', Arial, sans-serif;
```
- Production renders Helvetica on macOS/iOS, Helvetica Neue if available, Arial elsewhere.
- Figma uses **Inter** for design (free, similar genre). Renders Inter in Figma, Helvetica/Arial in production — acceptable preview drift.
- No web-font loading (no licensing cost).

## Rules for AI tools / agents reading designs

1. **Always check Figma Variables first** — call `get_design_context` and use the variable references it returns. **Never copy raw hex** if a token exists for that color.
2. **Always check Figma Text Styles first** — if a text node references a style (`Display/L`, `Heading/H2`, etc.), use the corresponding CSS utility (`text-display-l`, `text-h2`). Don't write `text-[24px] font-medium` if `text-h2` exists.
3. **If a value doesn't fit any token/style** — first ask: should the design be updated to match the system? If yes, fix Figma first then code. Only use arbitrary values for justified one-offs (campaign-specific colors, 404 numerals, etc.).
4. **Update Figma first when changing tokens** — the workflow is Figma → code, not code → Figma. If a token needs to change, update the Figma Variable + every bound frame, then reconcile `_styles/app.css`.

## Aspect ratios

Two ratios in active use:
- **`aspect-[2/3]` (portrait)** — editorial frames, article cards
- **`aspect-square` (1:1)** — anywhere a product photo is rendered

Applies to:
- `aspect-[2/3]` — article cards + journal featured, hero-split, image-text-split, card-grid, as-seen-on entries
- `aspect-square` — product cards (PLP main + compact predictive-search variant) **and PDP gallery on mobile**. The source product photography is shot square (studio convention); portrait containers (2:3, 4:5) either crop sleeves with `object-cover` or letterbox awkwardly with `object-contain`. Square matches source.
- **PDP gallery desktop** uses `lg:aspect-auto lg:h-[calc(100dvh - var(--chrome-height))]` so the image fills the viewport height beside the info column — bespoke, not in the ratio system.

Exceptions:
- `aspect-[3/4]` — cart line-item thumbnails (denser context)
- Hero / lookbook sections — explicit fixed heights (`h-[800px]` etc.) per Figma spec
- Lookbook image-pair: 400×520 + 720×720 — bespoke, not in the ratio system

If product photography changes to portrait crops in the future, revisit the product-card ratio. For now, square is the only honest fit.

## Animation standards

| Pattern | Transition | Duration | Easing |
|---|---|---|---|
| Slide-in panels (drawers, cart, mobile menu) | `translate-x-full` → `translate-x-0` | 300ms | default |
| Backdrop fade | `opacity-0` → `opacity-100` | 300ms | default |
| Collapsible sections (accordions, pill dropdowns) | `max-height` + `opacity` | 500–700ms | `ease-in-out` |
| Dropdown arrows / carets | `transition-transform` | 200ms | default |
| Image crossfade on hover | `transition-opacity` | 300ms | default |
| Toast | `translate-x` + `opacity` | 500ms | `ease-in-out` |

Core rule: **panel modals = `translate-x` at 300ms, content expansions = `max-height` at 500–700ms, micro-interactions = 200–300ms.**

## Component primitives (reuse, don't re-invent)

- `.collapsible` / `.collapsible-toggle` (`_styles/components/_collapsible.css` + `_scripts/components/collapsibleToggle.ts`) — expand/collapse panel pattern
- `product-meta-card.liquid` — 48×48-image + details-stack card on `bg-bg-surface`
- `ProductRecommendations` component — async-fetches a Section Rendering API URL and swaps content
- `pill-dropdown` primitive — generic rounded-pill nav with dropdown panels (header, filters)
- `button` snippet — single source of truth for CTAs (`primary`, `secondary`, `ghost`; `sm`, `md`, `lg`)

## Future work (out of scope for this pass)

- Component library in Figma — turn loose product card, button, pill, badge, swatch frames into proper Components with variants
- A separate `text-button` Figma equivalent inventory pass — `Button` style is in Figma but not bound to every button in the file yet
- Reconsider hero schema to add a `headline` field separate from `eyebrow` (so the homepage hero can render a big sentence-case headline distinct from the eyebrow label)
