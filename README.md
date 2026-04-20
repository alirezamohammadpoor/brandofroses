# Shopify Theme Template

Production-ready Shopify Online Store 2.0 theme, derived from [Cadaver 2.0](https://github.com/stefbowerman/cadaver-2.0) and extended with:

- **WCAG 2.2 a11y patterns** on product card (`<article aria-labelledby>`, single tab stop, labeled swatches), product detail gallery (`role="region"` + `aria-roledescription="carousel"` + `aria-live` + keyboard-reachable prev/next), info modal (full tablist with roving tabindex + arrow keys + focus return), cart drawer, newsletter, prices, quantity adjuster.
- **TypeScript architecture** safe for Taxi.js SPA navigation — no inline `<script>` in Liquid. All behavior lives in `_scripts/components/` extending `BaseComponent`.
- **Auto-deploy CI** — push to `staging` → unpublished staging theme; push to `main` → live theme.
- **Three-tier branch strategy** with enforced branch protection rules.

## Bootstrapping a new brand from this template

Work on a fresh clone, scrub brand-specifics, point at new store.

### 1. Clone without history

```bash
git clone --depth=1 --branch=template https://github.com/alirezamohammadpoor/saniadmina.git new-brand
cd new-brand
rm -rf .git assets/app.bundle.* stats.html
git init
```

### 2. Install + first build

```bash
bun install
bun run build
```

### 3. Point at the new Shopify store

Edit `shopify.theme.toml` and fill in the placeholders with the new store handle and theme IDs (after creating a Live theme + unpublished Staging theme in the Shopify admin).

```toml
[environments.production]
store = "<your-store>.myshopify.com"
theme = "<live-theme-id>"

[environments.staging]
store = "<your-store>.myshopify.com"
theme = "<unpublished-staging-theme-id>"
```

### 4. Customize brand surfaces

| File | What to change |
|---|---|
| `_styles/app.css` `@theme` block | `--color-bg`, `--color-fg`, `--color-muted`; type scale utilities (`text-display`, `text-h1`…) if the type system differs |
| `sections/header.liquid` | Wordmark at line ~35 uses `{{ shop.name \| upcase }}` by default — swap for an SVG logo if the brand has one |
| `sections/footer.liquid` | Same wordmark pattern at the bottom; blocks configurable per brand in theme editor |
| `sections/announcement-bar.liquid` | Default message text in schema |
| `snippets/product-detail-form.liquid` | Info modal tab **content** (Materials & Care, Size Guide, Shipping & Returns, Payments) — replace bodies as needed |
| `locales/en.default.json` | `app.add_to_cart` ("Add to bag" vs "Add to cart"), `layout.cart.title` ("Bag" vs "Cart"), `products.info.*` tab labels |
| `templates/*.json` | Merchant-populated content — configure via Shopify admin theme editor |
| Assets (logo SVGs, favicon) | Replace via theme editor or commit to `assets/` |

### 5. Metafield definitions (Shopify admin)

Create these in **Settings → Custom data → Products** to unlock breadcrumb consistency:

| Name | Key | Type |
|---|---|---|
| Primary collection | `custom.primary_collection` | Collection reference (single) |

Additional product-specific metafields the template assumes (opt in as needed):

- `custom.as_seen_on` — list of press mentions (referenced in `product-as-seen-on.liquid` section)

### 6. Wire CI

1. Install the [Theme Access app](https://apps.shopify.com/theme-access) and generate a password named `github-actions-deploy`.
2. Add the password as a GitHub secret: `SHOPIFY_CLI_THEME_TOKEN`.
3. Confirm the `SHOPIFY_FLAG_STORE` env var in `.github/workflows/deploy-*.yml` matches the new store.
4. Push `main` — the production workflow runs; push `staging` — staging workflow runs.

### 7. Add branch protection (one command)

Rulesets are kept in this repo as JSON at `.github/rulesets/`. Apply them to the new GitHub repo with:

```bash
scripts/bootstrap-rulesets.sh <owner>/<repo>
```

This creates two rulesets (idempotent — re-running updates existing ones with the same name):

| Name | Target | Allowed merge | Linear history | Block force push | Restrict deletions |
|---|---|---|---|---|---|
| `main-require-pr-from-staging` | `main` | merge commit only | off | ✓ | ✓ |
| `staging-require-pr-from-feature` | `staging` | squash only | off | ✓ | ✓ |

Requirements: `gh` CLI authenticated as a repo admin, `jq` on PATH.

To customize rules for the new brand, edit the JSON files directly and re-run the script. To re-export live rulesets from GitHub back to JSON (after changes made in the UI):

```bash
gh api repos/<owner>/<repo>/rulesets \
  | jq -r '.[] | .id' \
  | while read id; do
      gh api "repos/<owner>/<repo>/rulesets/$id" \
        | jq 'del(.id, .source, .source_type, .node_id, ._links, .links, .created_at, .updated_at, .current_user_can_bypass)' \
        > ".github/rulesets/$(gh api repos/<owner>/<repo>/rulesets/$id --jq '.name').json"
    done
```

## Development

```bash
bun run dev          # Vite watcher (rebuilds bundles on change)
shopify theme dev    # Theme preview at http://127.0.0.1:9292
```

## Quality gates

```bash
bun run build        # TypeScript + bundle; target: 0 errors
shopify theme check  # Liquid lint; target: 0 offenses
```

## Branch strategy

```
feature/*  ─┐  squash merge
            ↓  ──────────────────→ staging ─┐  merge commit
                                            ↓  ────────────→ main
```

- `git feature <name>` — branches off `staging`
- PR `feature/<name> → staging` (squash); auto-deploys to staging theme on merge
- PR `staging → main` (merge commit); auto-deploys to live theme on merge

Detailed workflow + rebase strategy: see project `CLAUDE.md`.

## What is NOT in this template

- **Brand content** — copy, images, menu structures, product data, merchant edits. Populate per brand via the Shopify admin.
- **Secrets** — Theme Access tokens, API keys. Per-repo GitHub secrets.
- **Branch protection rulesets** — per-repo GitHub settings.
- **Shopify store data** — products, collections, metafield values.
